@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PY_BIN="
if exist "%LOCALAPPDATA%\Python\bin\python.exe" set "PY_BIN=%LOCALAPPDATA%\Python\bin\python.exe"
if "%PY_BIN%"=="" (
    where python >nul 2>&1
    if %errorlevel%==0 set "PY_BIN=python"
)

if "%PY_BIN%"=="" (
    echo [HATA] Python 3 bulunamadi!
    pause
    exit /b 1
)

echo Baslatiliyor: Hizli Rapor Yerel Musteri Portali...
start "" http://localhost:8090/admin
"%PY_BIN%" "%~dp0portal\local_server.py" --port 8090
pause
