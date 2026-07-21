@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo LUCY - SEPAY NGROK WEBHOOK TUNNEL
echo ==============================================
echo.
echo Tomcat phai dang chay tai port 8080.
echo Ngrok inspector: http://127.0.0.1:4040
echo.

if not exist ".tools\ngrok\ngrok.exe" (
    echo [LOI] Khong tim thay .tools\ngrok\ngrok.exe
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-ngrok.ps1"
set "NGROK_EXIT_CODE=%ERRORLEVEL%"

if not "%NGROK_EXIT_CODE%"=="0" (
    echo.
    echo [LOI] Ngrok da dung voi ma loi %NGROK_EXIT_CODE%.
    pause
)

exit /b %NGROK_EXIT_CODE%
