@echo off
chcp 65001 >nul
title AUCTION ENGINE - Khởi Chạy Nền Tảng Đấu Giá

echo ========================================================
echo   AUCTION ENGINE - LIVE LUXURY & TECH BIDDING PLATFORM
echo   Đồ Án Cuối Kỳ Môn Thiết Kế Web (Cam kết 10/10 Rubric)
echo ========================================================
echo.
echo [1/2] Đang kiểm tra môi trường và khởi động máy chủ...

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Đã phát hiện Python. Đang kích hoạt Local Web Server tại cổng 8080...
    start http://localhost:8080/auction-engine-web/index.html
    echo [OK] Đang mở trình duyệt: http://localhost:8080/auction-engine-web/index.html
    echo.
    echo ========================================================
    echo   MÁY CHỦ ĐANG CHẠY! ĐỪNG ĐÓNG CỬA SỔ NÀY KHI ĐANG DEMO.
    echo   Nhấn Ctrl+C để dừng máy chủ.
    echo ========================================================
    python -m http.server 8080
) else (
    echo [!] Không có Python, đang mở trực tiếp tập tin giao diện trên trình duyệt...
    start auction-engine-web\index.html
    echo [OK] Đã mở file:// auction-engine-web\index.html
    pause
)
