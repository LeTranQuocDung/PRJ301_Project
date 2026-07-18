@echo off
echo ==============================================
echo LUCY WEB - AUTO INSTALL AND START SERVER
echo ==============================================
echo.
echo Dang tien hanh cai dat thu vien (Neu chua cai)...
echo Vui long doi trong giay lat...
call npm install

echo.
echo [1/2] Dang khoi dong Agora Token Server (Port 3000)...
start "Agora Token Server" cmd /k "cd AgoraTokenServer && npm install && node server.js"

echo.
echo [2/2] Dang khoi dong server Web React...
echo Web cua ban se mo tai: http://localhost:5173
echo ==============================================
echo.
call npm run dev
pause
