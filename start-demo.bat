@echo off
title Khoa CNTT TDTU - He Thong Quan Ly Thuc Tap & Dashboard TSNN (v3.1)
echo ==================================================================
echo   KHOA CONG NGHE THONG TIN - TRUONG DAI HOC TON DUC THANG (TDTU)
echo   HE THONG QUAN LY THUC TAP & DASHBOARD TSNN (DB_CNTT v3.1)
echo ==================================================================
echo.
echo 1. Dang mo giao dien Web Portal tren Trinh duyet...
start "" "http://localhost:3000"
echo.
echo 2. Dang khoi chay Server Node.js (Port 3000)...
node --experimental-strip-types "%~dp0TDTU_DB_CNTT_System\backend\src\server.ts"
pause
