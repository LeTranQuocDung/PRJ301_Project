@echo off
echo ==============================================
echo LUCY WEB - FULL STARTUP (Token Server + Web)
echo ==============================================
echo.

echo [1/3] Cai dat thu vien cho Web (neu chua co)...
call npm.cmd install
echo.

echo [2/3] Cai dat thu vien cho Token Server (neu chua co)...
cd agora-token-server
call npm.cmd install
cd ..
echo.

echo [3/3] Khoi dong Token Server (port 3001) va Web (port 5173)...
echo Token tu dong duoc cap phat moi lan ban tham gia - KHONG CAN COPY THU CONG!
echo.

:: Start Token Server in new window
start "LUCY Token Server" cmd /k "cd agora-token-server && node server.js"

:: Wait 2 seconds for token server to boot
timeout /t 2 /nobreak > NUL

:: Start React Web
echo Web dang khoi dong tai: http://localhost:5173
echo ==============================================
call npm.cmd run dev
pause
