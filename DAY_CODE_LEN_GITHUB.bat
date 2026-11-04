@echo off
title DAY CODE LEN GITHUB - AURELIA AUCTION
cls
echo ===============================================================================
echo        HE THONG DAY CODE LEN GITHUB - AURELIA AUCTION ENGINE
echo ===============================================================================
echo.
echo Buoc 1: Vao trinh duyet mo https://github.com/new
echo Buoc 2: Tao Repository moi (dat ten: aurelia-auction) va chon Public.
echo Buoc 3: Copy duong link Repository vua tao (dang: https://github.com/.../...git)
echo.
echo ===============================================================================
set /p REPO_URL="Dan duong link GitHub cua ban vao day roi an ENTER: "

if "%REPO_URL%"=="" (
    echo.
    echo [LOI] Ban chua nhap link GitHub. Vui long chay lai file va dan link vao.
    pause
    exit /b
)

echo.
echo Dang lien ket kho luu tru GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Dang day code len GitHub (Neu hien cua so dang nhap, vui long dang nhap GitHub)...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo [THANH CONG RUC RO] Code da duoc day len GitHub thanh cong!
    echo Bay gio ban vao https://vercel.com/new -> Bam "Import" -> Bam "Deploy" la xong!
    echo ===============================================================================
) else (
    echo.
    echo [LOI] Chua day duoc code. Vui long kiem tra lai quyen dang nhap hoac link.
)

echo.
pause
