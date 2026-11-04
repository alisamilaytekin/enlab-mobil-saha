@echo off
chcp 65001 >nul
title ENLAB Mobil Saha - APK Olusturucu
echo ============================================================
echo   ENLAB Mobil Saha - APK Paketleme ve Imzalama
echo ============================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    python tools\build_apk.py
    goto end
)

if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    "%LOCALAPPDATA%\Python\bin\python.exe" tools\build_apk.py
    goto end
)

if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" tools\build_apk.py
    goto end
)

echo [HATA] Python bulunamadi!
pause

:end
echo.
pause
