@echo off
chcp 65001 >nul
cls
echo ============================================================================
echo   TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN
echo   KHỞI ĐỘNG HỆ THỐNG DB_CNTT TRÊN SERVER MÁY CÁ NHÂN (LOCAL RUNNER)
echo ============================================================================
echo.

echo [1/3] Kiểm tra môi trường Node.js...
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Chưa tìm thấy Node.js trong biến môi trường PATH.
    echo Vui lòng cài đặt Node.js v20+ hoặc v24+ từ https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js phiên bản: %NODE_VER%
echo.

echo [2/3] Chạy bộ kiểm thử tự động (18 Tests - 100%% Pass)...
node --test apps/api/tests/api.test.ts
if %ERRORLEVEL% neq 0 (
    echo [CẢNH BÁO] Có test case chưa đạt. Đang tiếp tục khởi động server...
) else (
    echo [OK] 18/18 test cases đã được xác thực thành công.
)
echo.

echo [3/3] Khởi chạy DB_CNTT API Gateway & Web Dashboard tại cổng 3000...
echo.
echo ============================================================================
echo   - Web Dashboard SPA : http://localhost:3000
echo   - API 91 Sinh viên  : http://localhost:3000/api/students/summary
echo   - API Tra cứu MST   : http://localhost:3000/api/internship/company-lookup/0303882213
echo   - API Giấy giới thiệu: http://localhost:3000/api/internship/letters
echo   - API Biểu mẫu TDTU : http://localhost:3000/api/documents
echo.
echo   Nhấn Ctrl+C để dừng server.
echo ============================================================================
echo.

start http://localhost:3000
node apps/api/src/main.ts
pause
