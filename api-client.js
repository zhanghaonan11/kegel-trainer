// API 客户端模块 - 用于前端调用后端 API
class APIClient {
    constructor(baseURL) {
        // 自动检测环境
        if (!baseURL) {
            // 如果在 Vercel 或生产环境，使用相对路径
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                this.baseURL = '/api';
            } else {
                // 本地开发环境
                this.baseURL = 'http://localhost:3000/api';
            }
        } else {
            this.baseURL = baseURL;
        }
        this.userId = this.getUserId();
    }

    // 获取或生成用户 ID
    getUserId() {
        let userId = localStorage.getItem('kegel_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('kegel_user_id', userId);
        }
        return userId;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API 请求失败:', error);
            throw error;
        }
    }

    // 获取训练记录
    async getSessions(limit = 100, offset = 0) {
        return this.request(`/sessions?user_id=${this.userId}&limit=${limit}&offset=${offset}`);
    }

    // 保存训练记录
    async saveSession(sessionData) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify({
                ...sessionData,
                user_id: this.userId
            })
        });
    }

    // 获取统计数据
    async getStats() {
        return this.request(`/stats?user_id=${this.userId}`);
    }

    // 获取用户设置
    async getSettings() {
        return this.request(`/settings?user_id=${this.userId}`);
    }

    // 保存用户设置
    async saveSettings(settings) {
        return this.request('/settings', {
            method: 'POST',
            body: JSON.stringify({
                ...settings,
                user_id: this.userId
            })
        });
    }

    // 删除训练记录
    async deleteSession(sessionId) {
        return this.request(`/sessions/${sessionId}?user_id=${this.userId}`, {
            method: 'DELETE'
        });
    }

    // 检查 API 连接状态
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// 数据同步管理器 - 支持离线和在线模式
class DataSyncManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.isOnline = false;
        this.syncEnabled = true;
        this.checkConnection();
    }

    // 检查连接状态
    async checkConnection() {
        this.isOnline = await this.apiClient.checkConnection();
        return this.isOnline;
    }

    // 保存训练记录（支持离线）
    async saveSession(sessionData) {
        // 先保存到本地
        let records = StorageManager.get(CONFIG.STORAGE_KEYS.records, []);
        records.push(sessionData);
        StorageManager.set(CONFIG.STORAGE_KEYS.records, records);

        // 如果在线且启用同步，同步到服务器
        if (this.syncEnabled && await this.checkConnection()) {
            try {
                await this.apiClient.saveSession(sessionData);
                console.log('✓ 训练记录已同步到云端');
            } catch (error) {
                console.warn('云端同步失败，数据已保存到本地:', error.message);
            }
        }
    }

    // 加载训练记录（优先从云端）
    async loadSessions() {
        if (this.syncEnabled && await this.checkConnection()) {
            try {
                const response = await this.apiClient.getSessions();
                if (response.success && response.data) {
                    // 转换为本地格式
                    const records = response.data.map(session => ({
                        date: session.date,
                        sets: session.sets,
                        reps: session.reps,
                        duration: session.duration
                    }));

                    // 更新本地缓存
                    StorageManager.set(CONFIG.STORAGE_KEYS.records, records);
                    console.log('✓ 已从云端加载训练记录');
                    return records;
                }
            } catch (error) {
                console.warn('从云端加载失败，使用本地数据:', error.message);
            }
        }

        // 降级到本地存储
        return StorageManager.get(CONFIG.STORAGE_KEYS.records, []);
    }

    // 加载统计数据（优先从云端）
    async loadStats() {
        if (this.syncEnabled && await this.checkConnection()) {
            try {
                const response = await this.apiClient.getStats();
                if (response.success && response.data) {
                    console.log('✓ 已从云端加载统计数据');
                    return response.data;
                }
            } catch (error) {
                console.warn('从云端加载统计失败，使用本地计算:', error.message);
            }
        }

        // 降级到本地计算
        return null;
    }

    // 同步本地数据到云端
    async syncToCloud() {
        if (!await this.checkConnection()) {
            throw new Error('无法连接到服务器');
        }

        const localRecords = StorageManager.get(CONFIG.STORAGE_KEYS.records, []);
        let successCount = 0;
        let failCount = 0;

        for (const record of localRecords) {
            try {
                await this.apiClient.saveSession(record);
                successCount++;
            } catch (error) {
                failCount++;
                console.error('同步记录失败:', error);
            }
        }

        return { successCount, failCount, total: localRecords.length };
    }

    // 从云端拉取数据
    async pullFromCloud() {
        if (!await this.checkConnection()) {
            throw new Error('无法连接到服务器');
        }

        const response = await this.apiClient.getSessions();
        if (response.success && response.data) {
            const records = response.data.map(session => ({
                date: session.date,
                sets: session.sets,
                reps: session.reps,
                duration: session.duration
            }));

            StorageManager.set(CONFIG.STORAGE_KEYS.records, records);
            return records.length;
        }

        return 0;
    }

    // 切换同步状态
    toggleSync(enabled) {
        this.syncEnabled = enabled;
        StorageManager.set('sync_enabled', enabled);
        return this.syncEnabled;
    }
}
