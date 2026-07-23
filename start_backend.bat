@echo off
set LUCY_DB_USER=lucy_admin
set LUCY_DB_PASSWORD=Lucy@123456
echo Khoi dong Backend API (LUCY_DBS) - Original Team Code...
cd LucyBackendAPI
mvn clean package cargo:run
pause
