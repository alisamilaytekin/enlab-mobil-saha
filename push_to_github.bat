@echo off
chcp 65001 >nul
title GitHub Guncelleme Yukleyici
echo ============================================================
echo   ENLAB Mobil Saha - Degisiklikleri GitHub'a Yukle
echo   Hedef: https://github.com/alisamilaytekin/enlab-mobil-saha
echo ============================================================
echo.

set PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%

git status --short
echo.
set /p commit_msg="Yapilan degisiklik icin bir aciklama yazin (bos birakirsaniz otomatik 'Guncelleme' yazilir): "
if "%commit_msg%"=="" set commit_msg=Guncelleme

git add .
git commit -m "%commit_msg%"

echo.
echo GitHub'a yukleniyor...
echo (Ilk seferde tarayicida GitHub giris penceresi acilabilir, onaylamaniz yeterlidir.)
echo.
git push -u origin main

echo.
echo ============================================================
echo Islem tamamlandi!
echo ============================================================
pause
