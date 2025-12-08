# 凯格尔运动训练器 API 服务

这是凯格尔运动训练器的后端 API 服务，提供数据库存储和云端同步功能。

## 功能特性

- ✅ 训练记录存储和查询
- ✅ 用户设置管理
- ✅ 统计数据计算
- ✅ 支持多用户
- ✅ RESTful API 设计
- ✅ 自动创建数据库表

## 技术栈

- Node.js + Express
- MySQL 数据库
- CORS 跨域支持

## 快速开始

### 1. 安装依赖

```bash
cd api
npm install
```

### 2. 配置数据库

复制 `.env.example` 为 `.env` 并填写你的数据库信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=mysql.sqlpub.com
DB_PORT=3306
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
DB_NAME=cloudlib
PORT=3000
```

### 3. 启动服务器

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### 4. 验证服务

访问 `http://localhost:3000/health` 检查服务状态。

## API 接口文档

### 训练记录

#### 获取训练记录
```
GET /api/sessions?user_id=xxx&limit=100&offset=0
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-12-08",
      "sets": 3,
      "reps": 10,
      "duration": 5.0,
      "contract_time": 5,
      "relax_time": 5,
      "created_at": "2025-12-08T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 保存训练记录
```
POST /api/sessions
Content-Type: application/json

{
  "user_id": "user_xxx",
  "date": "2025-12-08",
  "sets": 3,
  "reps": 10,
  "duration": 5.0,
  "contract_time": 5,
  "relax_time": 5
}
```

#### 删除训练记录
```
DELETE /api/sessions/:id?user_id=xxx
```

### 统计数据

#### 获取统计数据
```
GET /api/stats?user_id=xxx
```

响应示例：
```json
{
  "success": true,
  "data": {
    "totalDays": 10,
    "totalSessions": 25,
    "totalTime": 125,
    "streak": 5
  }
}
```

### 用户设置

#### 获取设置
```
GET /api/settings?user_id=xxx
```

#### 保存设置
```
POST /api/settings
Content-Type: application/json

{
  "user_id": "user_xxx",
  "repsPerSet": 10,
  "totalSets": 3,
  "contractTime": 5,
  "relaxTime": 5,
  "soundEnabled": true,
  "reminderEnabled": false,
  "reminderTime": "09:00:00"
}
```

## 数据库表结构

### kegel_sessions（训练记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| user_id | VARCHAR(255) | 用户ID |
| date | DATE | 训练日期 |
| sets | INT | 组数 |
| reps | INT | 每组次数 |
| duration | DECIMAL(5,1) | 时长（分钟） |
| contract_time | INT | 收缩时间（秒） |
| relax_time | INT | 放松时间（秒） |
| created_at | TIMESTAMP | 创建时间 |

### kegel_settings（用户设置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| user_id | VARCHAR(255) | 用户ID（唯一） |
| reps_per_set | INT | 每组次数 |
| total_sets | INT | 总组数 |
| contract_time | INT | 收缩时间 |
| relax_time | INT | 放松时间 |
| sound_enabled | BOOLEAN | 音效开关 |
| reminder_enabled | BOOLEAN | 提醒开关 |
| reminder_time | TIME | 提醒时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 部署建议

### 本地开发
直接使用 `npm run dev` 启动开发服务器。

### 生产部署

1. **使用 PM2 管理进程**
```bash
npm install -g pm2
pm2 start server.js --name kegel-api
pm2 save
pm2 startup
```

2. **使用 Nginx 反向代理**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **使用云服务**
   - Vercel / Netlify（需要配置 Serverless Functions）
   - Heroku
   - Railway
   - DigitalOcean App Platform

## 安全建议

1. ✅ 数据库凭证存储在 `.env` 文件中，不要提交到 Git
2. ✅ 使用环境变量管理敏感信息
3. ⚠️ 建议添加用户认证（JWT）
4. ⚠️ 建议添加请求频率限制
5. ⚠️ 生产环境使用 HTTPS

## 故障排查

### 数据库连接失败
- 检查 `.env` 文件配置是否正确
- 确认数据库服务器可访问
- 检查防火墙设置

### 端口被占用
修改 `.env` 中的 `PORT` 配置。

### CORS 错误
确保前端 `api-client.js` 中的 `baseURL` 指向正确的 API 地址。

## 许可证

MIT
