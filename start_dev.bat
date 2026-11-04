@echo off
chcp 65001 >nul
title ENLAB Mobil Saha - Gelistirme Sunucusu
echo ============================================================
echo   ENLAB Mobil Saha - Yerel Gelistirme Sunucusu Baslatiliyor
echo ============================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    python tools\dev_server.py
    goto end
)

if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    "%LOCALAPPDATA%\Python\bin\python.exe" tools\dev_server.py
    goto end
)

if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" tools\dev_server.py
    goto end
)

echo [HATA] Python bulunamadi! Lutfen Python'in kurulu oldugundan emin olun.
pause

:end
