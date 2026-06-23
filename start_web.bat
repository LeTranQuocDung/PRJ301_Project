@echo off
echo ==============================================
echo LUCY WEB - AUTO INSTALL AND START SERVER
echo ==============================================
echo.
echo Dang tien hanh cai dat thu vien (Neu chua cai)...
echo Vui long doi trong giay lat...
call npm install
echo.
echo Cai dat hoan tat! Dang khoi dong server Web...
echo Web cua ban se mo tai: http://localhost:5173
echo ==============================================
echo.
call npm run dev
pause
