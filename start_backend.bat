@echo off
set LUCY_DB_USER=sa
set LUCY_DB_PASSWORD=123456
echo Khoi dong Backend API (LUCY_DBS) - Original Team Code...
cd LucyBackendAPI
mvn clean package cargo:run
pause
