# 多阶段构建 Dockerfile
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY api/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 最终镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖
COPY --from=builder /app/node_modules ./node_modules

# 复制 API 代码
COPY api/ ./

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "server.js"]
