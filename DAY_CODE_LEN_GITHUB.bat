@echo off
chcp 65001 >nul
title DAY CODE LEN GITHUB - AURELIA AUCTION ENGINE
cls
echo ===============================================================================
echo        HỆ THỐNG ĐẨY CODE LÊN GITHUB DÀNH CHO DỰ ÁN AURELIA AUCTION
echo ===============================================================================
echo.
echo Bước 1: Hãy vào trình duyệt mở https://github.com/new
echo Bước 2: Tạo một Repository mới (đặt tên ví dụ: aurelia-auction) và chọn Public.
echo Bước 3: Copy đường link của Repository vừa tạo (dạng: https://github.com/.../....git)
echo.
echo ===============================================================================
set /p REPO_URL="Dán đường link GitHub của bạn vào đây rồi ấn ENTER: "

if "%REPO_URL%"=="" (
    echo.
    echo [LỖI] Bạn chưa nhập link GitHub. Vui lòng chạy lại file và dán link vào.
    pause
    exit /b
)

echo.
echo Đang liên kết kho lưu trữ GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Đang đẩy code lên GitHub (Vui lòng đăng nhập nếu GitHub yêu cầu)...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo [THÀNH CÔNG RỰC RỠ] Code đã được đẩy lên GitHub thành công!
    echo Bây giờ bạn chỉ cần vào https://vercel.com/new -> Bấm "Import" -> Bấm "Deploy" là xong!
    echo ===============================================================================
) else (
    echo.
    echo [LỖI] Chưa đẩy được code. Vui lòng kiểm tra lại quyền đăng nhập GitHub hoặc đường link.
)

echo.
pause
