@echo off
title DONG BO CODE LEN GITHUB VA VERCEL - AURELIA AUCTION
cls
echo ===============================================================================
echo      DONG BO CODE LEN GITHUB VA TU DONG CAP NHAT TREN VERCEL (1-CLICK)
echo ===============================================================================
echo.

set /p MSG="Nhap mo ta noi dung vua sua (vi du: sua giao dien, fix bug): "
if "%MSG%"=="" (
    set MSG=update: cai thien giao dien va tinh nang he thong
)

echo.
echo [1/3] Dang gom toan bo file da sua...
git add .

echo.
echo [2/3] Dang tao commit: "%MSG%"...
git commit -m "%MSG%"

echo.
echo [3/3] Dang day code len GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo [THANH CONG] Code da duoc day len GitHub!
    echo Vercel dang tu dong cap nhat len web. Sau khoang 15s ban F5 link la thay ngay!
    echo ===============================================================================
) else (
    echo.
    echo [THONG BAO] Chua the day code. Ban hay chac chan da day code lan dau thanh cong.
)

echo.
pause
