// 配置常量
const CONFIG = {
    // 默认训练设置
    DEFAULT_SETTINGS: {
        repsPerSet: 10,
        totalSets: 3,
        contractTime: 5,
        relaxTime: 5,
        restTime: 10
    },

    // 训练预设
    PRESETS: {
        beginner: { repsPerSet: 5, totalSets: 2, contractTime: 3, relaxTime: 3, restTime: 10 },
        intermediate: { repsPerSet: 10, totalSets: 3, contractTime: 5, relaxTime: 5, restTime: 10 },
        advanced: { repsPerSet: 15, totalSets: 4, contractTime: 8, relaxTime: 5, restTime: 15 }
    },

    // 输入验证范围
    VALIDATION: {
        repsPerSet: { min: 5, max: 20 },
        totalSets: { min: 1, max: 5 },
        contractTime: { min: 3, max: 10 },
        relaxTime: { min: 3, max: 10 },
        restTime: { min: 5, max: 30 }
    },

    // 存储键名
    STORAGE_KEYS: {
        settings: 'kegelSettings',
        records: 'kegelRecords',
        reminders: 'kegelReminders',
        progress: 'kegelProgress',
        syncEnabled: 'sync_enabled',
        userId: 'kegel_user_id'
    },

    // 时间常量（毫秒）
    TIMING: {
        REMINDER_CHECK_INTERVAL: 30000,    // 提醒检查间隔
        REMINDER_WINDOW: 60000,            // 提醒时间窗口
        TOAST_DURATION: 2500,              // Toast显示时长
        MODAL_ANIMATION: 300,              // 模态框动画时长
        CONNECTION_CACHE_TTL: 30000,       // 连接状态缓存时间
        COUNTDOWN_WARNING: 3               // 倒计时警告秒数
    },

    // 振动模式
    VIBRATION: {
        contract: 200,
        relax: 100,
        complete: [200, 100, 200]
    },

    // 音效URL
    SOUNDS: {
        contract: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKHf8sFuIwUugdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx',
        relax: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKHf8sFuIwUugdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx2Ik2CBdju+zooVARC0yl4fG5ZRwFN43V7859KQUnfszw2o87ChJcsejtq1gVC0ih3/LBbiMFL4HQ8diJNggXY7vs6KFQEQtMpeHxuWUcBTeN1e/OfSkFJ37M8NqPOwsSXLHo7atYFQtIod/ywW4jBS+B0PHYiTYIF2O77OihUBELTKXh8bllHAU3jdXvzn0pBSd+zPDajzsKElyx6O2rWBULSKHf8sFuIwUvgdDx'
    }
};
