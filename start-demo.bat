@echo off
title Khoa CNTT TDTU - He Thong Quan Ly Thuc Tap & Dashboard TSNN (v3.0)
echo ==================================================================
echo   KHOA CONG NGHE THONG TIN - TRUONG DAI HOC TON DUC THANG (TDTU)
echo   HE THONG QUAN LY THUC TAP ^& DASHBOARD TSNN (MONOREPO v3.0)
echo ==================================================================
echo.
echo 1. Dang mo giao dien Web SPA tren Trinh duyet...
start "" "http://localhost:3000"
echo.
echo 2. Dang khoi chay API Gateway ^& Reporting Microservice (Port 3000)...
node "%~dp0apps\api\src\main.ts"
pause
