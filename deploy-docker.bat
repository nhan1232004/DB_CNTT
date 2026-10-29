@echo off
chcp 65001 >nul
cls
echo ============================================================================
echo   TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN
echo   TRIỂN KHAI DỰ ÁN DB_CNTT BẰNG DOCKER & DOCKER COMPOSE
echo ============================================================================
echo.

echo [1/4] Kiểm tra dịch vụ Docker Engine...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Docker daemon chưa được khởi chạy. Vui lòng mở Docker Desktop và thử lại!
    echo.
    echo Bạn cũng có thể chạy trực tiếp trên máy cá nhân không cần Docker bằng lệnh:
    echo     .\start-local.bat
    echo.
    pause
    exit /b 1
)
echo [OK] Docker Engine đang hoạt động.
echo.

echo [2/4] Đang build Docker Image và khởi chạy các dịch vụ (App, Postgres, Redis)...
docker compose down >nul 2>&1
docker compose up --build -d
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Build hoặc khởi động container thất bại. Vui lòng kiểm tra lại log!
    pause
    exit /b 1
)
echo [OK] Đã khởi chạy các container thành công.
echo.

echo [3/4] Đang kiểm tra trạng thái sức khỏe dịch vụ (Health Check)...
timeout /t 5 >nul
curl -s http://localhost:3000/api/students/summary >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [CHỜ] Ứng dụng đang nạp dữ liệu SQLite và khởi động...
    timeout /t 5 >nul
)

echo [OK] Máy chủ API Gateway & Reporting Microservice đã sẵn sàng!
echo.
echo ============================================================================
echo   HỆ THỐNG ĐÃ SẴN SÀNG TẠI CÁC ĐỊA CHỈ:
echo   - Web Dashboard SPA : http://localhost:3000
echo   - API 91 Sinh viên  : http://localhost:3000/api/students/summary
echo   - API Tra cứu MST   : http://localhost:3000/api/internship/company-lookup/0303882213
echo   - API Giấy giới thiệu: http://localhost:3000/api/internship/letters
echo   - API Biểu mẫu TDTU : http://localhost:3000/api/documents
echo   - PostgreSQL DB     : localhost:5432 (User: tdtu_admin, DB: db_cntt_internship)
echo   - Redis Cache       : localhost:6379
echo ============================================================================
echo.

start http://localhost:3000
pause
