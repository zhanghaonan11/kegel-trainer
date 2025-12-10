class KegelTrainer {
    constructor() {
        this.currentSet = 1;
        this.currentRep = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.currentPhase = 'ready';
        this.timer = null;
        this.timeLeft = 0;
        this.restTime = CONFIG.DEFAULT_SETTINGS.restTime;

        this.wakeLockManager = new WakeLockManager();
        this.audioManager = new AudioManager();
        this.initAudio();

        // 初始化 API 客户端和数据同步
        this.apiClient = new APIClient();
        this.dataSyncManager = new DataSyncManager(this.apiClient);

        this.initElements();
        this.bindEvents();
        this.loadSettings();
        this.loadReminderSettings();
        this.initBackgroundSupport();
        this.loadStats();
        this.checkReminders();
        this.reminderInterval = setInterval(() => this.checkReminders(), 30000);
    }

    initAudio() {
        this.audioManager.loadSound('contract', CONFIG.SOUNDS.contract);
        this.audioManager.loadSound('relax', CONFIG.SOUNDS.relax);
    }

    initElements() {
        const ids = ['startBtn', 'pauseBtn', 'resetBtn', 'exportBtn', 'importBtn', 'currentSet',
                     'currentRep', 'timer', 'actionText', 'progressFill', 'animationCircle',
                     'repsPerSet', 'totalSets', 'contractTime', 'relaxTime', 'totalDays',
                     'totalSessions', 'streak', 'totalTime', 'presetBtns', 'soundToggle',
                     'reminderToggle', 'reminderTime'];

        this.elements = {};
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) this.elements[id] = el;
        });
    }

    bindEvents() {
        this.elements.startBtn?.addEventListener('click', () => this.start());
        this.elements.pauseBtn?.addEventListener('click', () => this.pause());
        this.elements.resetBtn?.addEventListener('click', () => this.reset());
        this.elements.exportBtn?.addEventListener('click', () => this.exportData());
        this.elements.importBtn?.addEventListener('click', () => this.importData());
        this.elements.soundToggle?.addEventListener('change', (e) => {
            this.audioManager.enabled = e.target.checked;
            this.saveSettings();
        });
        this.elements.reminderToggle?.addEventListener('change', (e) => {
            this.toggleReminder(e.target.checked);
        });

        ['repsPerSet', 'totalSets', 'contractTime', 'relaxTime'].forEach(setting => {
            this.elements[setting]?.addEventListener('change', () => this.saveSettings());
        });

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.loadPreset(btn.dataset.preset));
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    loadSettings() {
        const settings = StorageManager.get(CONFIG.STORAGE_KEYS.settings, CONFIG.DEFAULT_SETTINGS);
        Object.keys(settings).forEach(key => {
            if (this.elements[key]) {
                this.elements[key].value = settings[key];
            }
        });
        this.restTime = parseInt(settings.restTime || CONFIG.DEFAULT_SETTINGS.restTime, 10);

        // 声音开关持久化
        const soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
        this.audioManager.enabled = soundEnabled;
        if (this.elements.soundToggle) {
            this.elements.soundToggle.checked = soundEnabled;
        }
    }

    saveSettings() {
        const settings = {
            repsPerSet: this.elements.repsPerSet?.value,
            totalSets: this.elements.totalSets?.value,
            contractTime: this.elements.contractTime?.value,
            relaxTime: this.elements.relaxTime?.value,
            restTime: this.restTime,
            soundEnabled: this.elements.soundToggle?.checked ?? true
        };
        StorageManager.set(CONFIG.STORAGE_KEYS.settings, settings);
        this.audioManager.enabled = settings.soundEnabled;
    }

    loadReminderSettings() {
        const reminders = StorageManager.get(CONFIG.STORAGE_KEYS.reminders, { enabled: false, time: '09:00' });
        if (this.elements.reminderToggle) {
            this.elements.reminderToggle.checked = !!reminders.enabled;
        }
        if (this.elements.reminderTime && reminders.time) {
            this.elements.reminderTime.value = reminders.time;
        }
    }

    getSettings() {
        return {
            repsPerSet: parseInt(this.elements.repsPerSet?.value || 10),
            totalSets: parseInt(this.elements.totalSets?.value || 3),
            contractTime: parseInt(this.elements.contractTime?.value || 5),
            relaxTime: parseInt(this.elements.relaxTime?.value || 5),
            restTime: this.restTime || CONFIG.DEFAULT_SETTINGS.restTime
        };
    }

    loadPreset(preset) {
        const settings = CONFIG.PRESETS[preset];
        if (!settings) return;

        Object.keys(settings).forEach(key => {
            if (this.elements[key]) {
                this.elements[key].value = settings[key];
            }
        });
        this.restTime = settings.restTime || CONFIG.DEFAULT_SETTINGS.restTime;
        this.saveSettings();
        Modal.show('预设已加载', `已应用${preset === 'beginner' ? '初级' : preset === 'intermediate' ? '中级' : '高级'}训练计划`);
    }

    async start() {
        if (this.isPaused) {
            this.resume();
            return;
        }

        await this.wakeLockManager.request();

        this.isRunning = true;
        this.currentPhase = 'contract';
        this.timeLeft = this.getSettings().contractTime;

        this.updateActionText('夹紧', 'contract');
        this.audioManager.play('contract');
        VibrationManager.vibrate(200);

        this.updateUI();
        this.startTimer();
        this.updateButtons();
    }

    pause() {
        this.isPaused = true;
        this.isRunning = false;
        clearInterval(this.timer);
        this.updateButtons();
        this.elements.timer.textContent = '已暂停';
    }

    resume() {
        this.isPaused = false;
        this.isRunning = true;
        this.startTimer();
        this.updateButtons();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentSet = 1;
        this.currentRep = 1;
        this.currentPhase = 'ready';
        this.timeLeft = 0;

        clearInterval(this.timer);
        this.wakeLockManager.release();

        this.updateUI();
        this.updateButtons();
        this.updateProgress();

        this.elements.timer.textContent = '准备开始';
        this.updateActionText('准备开始', '');
        this.elements.animationCircle.className = 'animation-circle';
    }

    nextPhase() {
        const settings = this.getSettings();

        if (this.currentPhase === 'contract') {
            this.currentPhase = 'relax';
            this.timeLeft = settings.relaxTime;
            this.updateActionText('放松', 'relax');
            this.audioManager.play('relax');
            VibrationManager.vibrate(100);
        } else if (this.currentPhase === 'relax') {
            this.currentRep++;

            if (this.currentRep > settings.repsPerSet) {
                this.currentSet++;
                this.currentRep = 1;

                if (this.currentSet > settings.totalSets) {
                    this.complete();
                    return;
                } else {
                    this.currentPhase = 'rest';
                    this.timeLeft = settings.restTime;
                    this.updateActionText('休息', '');
                    this.elements.timer.textContent = `组间休息 ${this.timeLeft}秒`;
                }
            } else {
                this.currentPhase = 'contract';
                this.timeLeft = settings.contractTime;
                this.updateActionText('夹紧', 'contract');
                this.audioManager.play('contract');
                VibrationManager.vibrate(200);
            }
        } else if (this.currentPhase === 'rest') {
            this.currentPhase = 'contract';
            this.timeLeft = settings.contractTime;
            this.updateActionText('夹紧', 'contract');
            this.audioManager.play('contract');
            VibrationManager.vibrate(200);
        }

        this.updateUI();
        this.updateProgress();
    }

    updateActionText(text, className) {
        this.elements.actionText.textContent = text;
        this.elements.actionText.className = `action-text ${className}`;
        this.elements.animationCircle.className = `animation-circle ${className}`;
    }

    async complete() {
        this.isRunning = false;
        clearInterval(this.timer);
        await this.wakeLockManager.release();

        this.elements.timer.textContent = '训练完成！';
        this.updateActionText('完成', '');
        this.updateButtons();
        this.updateProgress();

        this.recordSession();
        VibrationManager.vibrate([200, 100, 200]);

        setTimeout(async () => {
            await Modal.show('训练完成', '恭喜！今日训练完成！', [
                { text: '太棒了', primary: true }
            ]);
        }, 500);
    }

    updateUI() {
        this.elements.currentSet.textContent = this.currentSet;
        this.elements.currentRep.textContent = this.currentRep;
    }

    updateButtons() {
        if (this.isRunning) {
            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = false;
        } else if (this.isPaused) {
            this.elements.startBtn.disabled = false;
            this.elements.startBtn.textContent = '继续';
            this.elements.pauseBtn.disabled = true;
        } else {
            this.elements.startBtn.disabled = false;
            this.elements.startBtn.textContent = '开始训练';
            this.elements.pauseBtn.disabled = true;
        }
    }

    updateProgress() {
        const settings = this.getSettings();
        const totalReps = settings.totalSets * settings.repsPerSet;
        const completedReps = (this.currentSet - 1) * settings.repsPerSet + (this.currentRep - 1);
        const progress = Math.min((completedReps / totalReps) * 100, 100);
        this.elements.progressFill.style.width = `${progress}%`;
    }

    initBackgroundSupport() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.updateTitle();
            } else if (!document.hidden) {
                document.title = '凯格尔运动训练器';
            }
        });
    }

    updateTitle() {
        if (document.hidden && this.isRunning) {
            const phase = this.currentPhase === 'contract' ? '夹紧' :
                         this.currentPhase === 'relax' ? '放松' : '休息';
            document.title = `${phase} ${this.timeLeft}s - 第${this.currentSet}组${this.currentRep}次`;
        }
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.elements.timer.textContent = `${this.timeLeft}秒`;
            this.updateTitle();

            if (this.timeLeft <= 0) {
                this.nextPhase();
            }
        }, 1000);
    }

    async recordSession() {
        const settings = this.getSettings();
        const today = DateUtils.formatDate(new Date());
        const activeTime = settings.totalSets * settings.repsPerSet *
                        (settings.contractTime + settings.relaxTime);
        const restTime = Math.max(settings.totalSets - 1, 0) * settings.restTime;
        const duration = (activeTime + restTime) / 60;

        const sessionData = {
            date: today,
            sets: settings.totalSets,
            reps: settings.repsPerSet,
            duration: Math.round(duration * 10) / 10,
            contract_time: settings.contractTime,
            relax_time: settings.relaxTime
        };

        // 使用数据同步管理器保存（支持云端同步）
        await this.dataSyncManager.saveSession(sessionData);
        this.updateStats();
    }

    loadStats() {
        this.updateStats();
    }

    async updateStats() {
        // 尝试从云端加载统计数据
        const cloudStats = await this.dataSyncManager.loadStats();

        if (cloudStats) {
            // 使用云端数据
            this.elements.totalDays.textContent = cloudStats.totalDays;
            this.elements.totalSessions.textContent = cloudStats.totalSessions;
            this.elements.totalTime.textContent = cloudStats.totalTime;
            this.elements.streak.textContent = cloudStats.streak;
        } else {
            // 降级到本地计算
            const records = StorageManager.get(CONFIG.STORAGE_KEYS.records, []);
            const uniqueDays = [...new Set(records.map(r => r.date))];

            this.elements.totalDays.textContent = uniqueDays.length;
            this.elements.totalSessions.textContent = records.length;

            const totalTime = records.reduce((sum, r) => sum + r.duration, 0);
            this.elements.totalTime.textContent = Math.round(totalTime);

            this.elements.streak.textContent = this.calculateStreak(uniqueDays);
        }
    }

    calculateStreak(days) {
        if (days.length === 0) return 0;

        const sortedDays = days.map(d => new Date(d)).sort((a, b) => b - a);
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let day of sortedDays) {
            day.setHours(0, 0, 0, 0);
            const diffDays = DateUtils.getDaysDiff(day, currentDate);

            if (diffDays === streak) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    async exportData() {
        const result = await Modal.show('导出数据', '选择导出格式', [
            { text: 'JSON', primary: false },
            { text: 'CSV', primary: true },
            { text: '取消', primary: false }
        ]);

        if (result === 0) {
            const data = {
                records: StorageManager.get(CONFIG.STORAGE_KEYS.records, []),
                settings: StorageManager.get(CONFIG.STORAGE_KEYS.settings, {}),
                exportDate: new Date().toISOString()
            };
            const content = DataExporter.toJSON(data);
            DataExporter.download(content, `kegel-data-${DateUtils.formatDate(new Date())}.json`);
        } else if (result === 1) {
            const records = StorageManager.get(CONFIG.STORAGE_KEYS.records, []);
            const content = DataExporter.toCSV(records);
            DataExporter.download(content, `kegel-data-${DateUtils.formatDate(new Date())}.csv`, 'text/csv');
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                const result = await Modal.show('导入数据', '确定要导入数据吗？这将覆盖现有数据。', [
                    { text: '确定', primary: true },
                    { text: '取消', primary: false }
                ]);

                if (result === 0) {
                    if (data.records) StorageManager.set(CONFIG.STORAGE_KEYS.records, data.records);
                    if (data.settings) StorageManager.set(CONFIG.STORAGE_KEYS.settings, data.settings);
                    this.loadSettings();
                    this.updateStats();
                    Modal.show('成功', '数据导入成功！');
                }
            } catch (error) {
                Modal.show('错误', '导入失败：文件格式不正确');
            }
        };
        input.click();
    }

    toggleReminder(enabled) {
        if (enabled) {
            const time = this.elements.reminderTime?.value || '09:00';
            this.setReminder(time);
        } else {
            this.clearReminder();
        }
    }

    setReminder(time) {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    StorageManager.set(CONFIG.STORAGE_KEYS.reminders, { enabled: true, time, lastNotifiedDate: null });
                    Modal.show('提醒已设置', `每天 ${time} 将提醒您进行训练`);
                }
            });
        }
    }

    clearReminder() {
        StorageManager.set(CONFIG.STORAGE_KEYS.reminders, { enabled: false, lastNotifiedDate: null });
    }

    checkReminders() {
        const reminders = StorageManager.get(CONFIG.STORAGE_KEYS.reminders, {});
        if (!reminders.enabled || !reminders.time || !('Notification' in window)) return;

        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const [hours, minutes] = reminders.time.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return;

        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);

        const sameMinute = Math.abs(now - reminderTime) < 60000;
        const today = DateUtils.formatDate(now);
        const alreadyNotified = reminders.lastNotifiedDate === today;

        if (sameMinute && !alreadyNotified) {
            new Notification('凯格尔训练提醒', {
                body: '该进行今天的训练了！',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill=\"%234CAF50\"/></svg>'
            });
            StorageManager.set(CONFIG.STORAGE_KEYS.reminders, { ...reminders, lastNotifiedDate: today });
        }
    }

    cleanup() {
        clearInterval(this.timer);
        clearInterval(this.reminderInterval);
        this.wakeLockManager.release();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KegelTrainer();
});
