#!/usr/bin/env bash
set -e

echo "============================================================================"
echo "  TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN"
echo "  TRIỂN KHAI DỰ ÁN DB_CNTT BẰNG DOCKER & DOCKER COMPOSE"
echo "============================================================================"

if ! command -v docker &> /dev/null; then
    echo "[LỖI] Docker chưa được cài đặt hoặc chưa khởi động."
    exit 1
fi

echo "[1/3] Building image and starting containers..."
docker compose down || true
docker compose up --build -d

echo "[2/3] Waiting for service healthcheck..."
sleep 5
for i in {1..10}; do
    if curl -s http://localhost:3000/api/students/summary > /dev/null; then
        echo "[OK] Server đã sẵn sàng!"
        break
    fi
    echo "Đang đợi server... ($i/10)"
    sleep 2
done

echo "[3/3] Deployment complete!"
echo "Web Dashboard: http://localhost:3000"
echo "API Summary  : http://localhost:3000/api/students/summary"
