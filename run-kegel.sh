#!/bin/bash
cd "$(dirname "$0")"

# 启动Python服务器
python3 server.py &
SERVER_PID=$!

# 等待服务器启动
sleep 2

# 在Safari中打开应用
open -a Safari http://localhost:8080

echo "凯格尔训练器已启动"
echo "服务器PID: $SERVER_PID"
echo "按任意键停止服务器..."

read -n 1
kill $SERVER_PID
echo "服务器已停止"