// 数据库连接模块
const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql.sqlpub.com',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cloudlib',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message);
    return false;
  }
}

// 初始化数据库表
async function initTables() {
  try {
    const connection = await pool.getConnection();

    // 创建训练记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kegel_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        sets INT NOT NULL,
        reps INT NOT NULL,
        duration DECIMAL(5,1) NOT NULL,
        contract_time INT NOT NULL,
        relax_time INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_date (user_id, date),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建用户设置表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kegel_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        reps_per_set INT NOT NULL,
        total_sets INT NOT NULL,
        contract_time INT NOT NULL,
        relax_time INT NOT NULL,
        sound_enabled BOOLEAN NOT NULL,
        reminder_enabled BOOLEAN NOT NULL,
        reminder_time TIME NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ 数据库表初始化成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ 数据库表初始化失败:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initTables
};
