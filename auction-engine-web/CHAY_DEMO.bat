@echo off
chcp 65001 >nul
title AURELIA - SAN DAU GIA TRUC TUYEN
color 0A

echo =========================================================================
echo   AURELIA - SÀN ĐẤU GIÁ TRỰC TUYẾN (ĐỒ ÁN THIẾT KẾ WEB)
echo   Sinh viên: Phạm Ngọc Thắng - MSSV: 6651071071
echo =========================================================================
echo.
echo [1] Dang kiem tra dia chi mang Wi-Fi cua may tinh...
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0 ^| findstr /v "Default"') do (
    set LOCAL_IP=%%a
)
if "%LOCAL_IP%"=="" set LOCAL_IP=192.168.1.241

echo     - Dia chi IP mang Wi-Fi: %LOCAL_IP%
echo     - Cong may chu (Port)  : 5500 / 8080
echo.
echo [2] HUONG DAN KET NOI DA THIET BI (DIEN THOAI & LAPTOP KHAC):
echo     - Tren may tinh nay : Mo http://localhost:5500 hoac qua file:///
echo     - Tren DIEN THOAI   : Ket noi CHUNG WI-FI, mo trinh duyet vao:
echo                           http://%LOCAL_IP%:5500/auction-engine-web/index.html
echo     (Hoac mo Phong dau gia tren PC roi lay dien thoai quet Ma QR de vao ngay!)
echo.
echo =========================================================================
echo   Dang khoi dong may chu Web Server...
echo =========================================================================

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start http://localhost:5500/auction-engine-web/index.html 2>nul || start http://localhost:8080/index.html
    python -m http.server 5500 --bind 0.0.0.0 2>nul || python -m http.server 8080
) else (
    start index.html
    pause
)
