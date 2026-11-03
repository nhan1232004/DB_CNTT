@echo off
chcp 65001 >nul
cls
echo ============================================================================
echo   TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN
echo   HỆ THỐNG QUẢN LÝ THỰC TẬP ^& DASHBOARD TSNN (DB_CNTT) - TYPESCRIPT RUNNER
echo ============================================================================
echo.

echo [1/3] Kiểm tra môi trường Node.js...
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Chưa tìm thấy Node.js trong biến môi trường PATH.
    echo Vui lòng cài đặt Node.js v22+ hoặc v24+ từ https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js phiên bản: %NODE_VER%
echo.

echo [2/3] Chạy bộ kiểm thử tự động TypeScript (Backend API ^& Prime RBAC - 9/9 Tests)...
node --test TDTU_DB_CNTT_System/backend/tests/api.test.ts TDTU_DB_CNTT_System/backend/tests/prime-rbac.test.ts
if %ERRORLEVEL% neq 0 (
    echo [CẢNH BÁO] Có test case chưa đạt. Đang tiếp tục khởi động server...
) else (
    echo [OK] Toàn bộ test cases TypeScript đã được xác thực thành công (100%% Pass).
)
echo.

echo [3/3] Khởi chạy DB_CNTT TypeScript API Gateway ^& Web Dashboard tại cổng 3000...
echo ============================================================================
echo   - Web Dashboard SPA (Local) : http://localhost:3000
echo   - Web Dashboard (Cloud)     : https://dashboard-39cf8.web.app
echo   - API Summary Thống kê      : http://localhost:3000/api/students/summary
echo   - API Tra cứu MST           : http://localhost:3000/api/internship/company-lookup/0303882213
echo   - API Bảng tin 2 tầng       : http://localhost:3000/api/bulletin
echo   - API Chart Widgets         : http://localhost:3000/api/dashboard/widgets
echo.
echo   Nhấn Ctrl+C để dừng server.
echo ============================================================================
echo.

start http://localhost:3000
node --experimental-strip-types TDTU_DB_CNTT_System/backend/src/server.ts
pause
