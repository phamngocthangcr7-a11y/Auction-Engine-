@echo off
chcp 65001 >nul
title CAP NHAT CODE LEN GITHUB VA VERCEL - AURELIA AUCTION
cls
echo ===============================================================================
echo      ĐỒNG BỘ CODE LÊN GITHUB VA TỰ ĐỘNG CẬP NHẬT TRÊN VERCEL (1-CLICK)
echo ===============================================================================
echo.

set /p MSG="Nhập mô tả nội dung bạn vừa sửa (ví dụ: sua giao dien, fix bug): "
if "%MSG%"=="" (
    set MSG=update: cai thien giao dien va tinh nang he thong
)

echo.
echo [1/3] Đang gom toàn bộ file đã chỉnh sửa...
git add .

echo.
echo [2/3] Đang tạo bản ghi commit: "%MSG%"...
git commit -m "%MSG%"

echo.
echo [3/3] Đang đẩy code lên GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo [THÀNH CÔNG RỰC RỠ] Code đã được đẩy lên GitHub!
    echo Vercel đang tự động cập nhật lên web. Sau khoảng 15 giây bạn F5 link là thấy ngay!
    echo ===============================================================================
) else (
    echo.
    echo [THÔNG BÁO] Chưa thể đẩy code. Bạn hãy chắc chắn đã chạy file DAY_CODE_LEN_GITHUB.bat lần đầu tiên.
)

echo.
pause
