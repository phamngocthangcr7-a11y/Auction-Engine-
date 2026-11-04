@echo off
chcp 65001 >nul
title AURELIA - KICH HOAT LINK INTERNET TOAN CAU (4G/5G/BAT KY MANG NAO)
color 0A

cd /d "%~dp0"

echo =========================================================================
echo   AURELIA • SÀN ĐẤU GIÁ TRỰC TUYẾN
echo   BẬT LIÊN KẾT INTERNET CÔNG KHAI - KHÔNG MẬT KHẨU - KHÔNG ĐĂNG KÝ
echo =========================================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python -u "%~dp0run_cloudflare_tunnel.py"
) else (
    echo [!] Khong tim thay Python trong PATH, dang khoi dong truc tiep Cloudflared...
    "%~dp0cloudflared.exe" tunnel --url http://localhost:5500
)

pause
