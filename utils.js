// 工具函数模块
class StorageManager {
    static get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`读取存储失败 [${key}]:`, error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`保存存储失败 [${key}]:`, error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`删除存储失败 [${key}]:`, error);
            return false;
        }
    }
}

class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }

    loadSound(name, url) {
        try {
            this.sounds[name] = new Audio(url);
        } catch (error) {
            console.error(`加载音效失败 [${name}]:`, error);
        }
    }

    play(name) {
        if (!this.enabled || !this.sounds[name]) return;
        try {
            this.sounds[name].currentTime = 0;
            this.sounds[name].play().catch(e => console.error('播放音效失败:', e));
        } catch (error) {
            console.error(`播放音效失败 [${name}]:`, error);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

class VibrationManager {
    static vibrate(pattern = 200) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (error) {
                console.error('振动失败:', error);
            }
        }
    }

    static stop() {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(0);
            } catch (error) {
                console.error('停止振动失败:', error);
            }
        }
    }
}

class WakeLockManager {
    constructor() {
        this.wakeLock = null;
    }

    async request() {
        if (!('wakeLock' in navigator)) {
            console.warn('Wake Lock API 不支持');
            return false;
        }

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            this.wakeLock.addEventListener('release', () => {
                console.log('Wake Lock 已释放');
            });
            return true;
        } catch (error) {
            console.error('请求 Wake Lock 失败:', error);
            return false;
        }
    }

    async release() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                return true;
            } catch (error) {
                console.error('释放 Wake Lock 失败:', error);
                return false;
            }
        }
        return false;
    }
}

class Modal {
    static show(title, message, buttons = [{ text: '确定', primary: true }]) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                    <div class="modal-buttons">
                        ${buttons.map((btn, i) =>
                            `<button class="modal-btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}" data-index="${i}">${btn.text}</button>`
                        ).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 10);

            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.close(modal, resolve, -1);
                }
                if (e.target.classList.contains('modal-btn')) {
                    const index = parseInt(e.target.dataset.index);
                    this.close(modal, resolve, index);
                }
            });
        });
    }

    static close(modal, resolve, result) {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
            resolve(result);
        }, 300);
    }
}

class DateUtils {
    static formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    static getDaysDiff(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    }

    static isToday(dateString) {
        return dateString === this.formatDate(new Date());
    }
}

class DataExporter {
    static toJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    static toCSV(records) {
        if (!records || records.length === 0) return '';

        const headers = Object.keys(records[0]);
        const csvRows = [
            headers.join(','),
            ...records.map(record =>
                headers.map(header => {
                    const value = record[header];
                    return typeof value === 'string' && value.includes(',')
                        ? `"${value}"`
                        : value;
                }).join(',')
            )
        ];

        return csvRows.join('\n');
    }

    static download(content, filename, type = 'application/json') {
        try {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('下载文件失败:', error);
            return false;
        }
    }
}