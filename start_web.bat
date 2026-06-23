@echo off
setlocal EnableExtensions

rem ============================================================================
rem LUCY - start backend (Tomcat) and frontend (Vite), no NetBeans required.
rem Required once per computer: JDK 8, Apache Tomcat 9, SQL Server, and Node.js.
rem Tomcat 10+ is incompatible because this backend uses javax.servlet.
rem ============================================================================

set "PROJECT_DIR=%~dp0"
set "BACKEND_ZIP=%PROJECT_DIR%LucyBackendAPI.zip"
set "BACKEND_DIR=%PROJECT_DIR%LucyBackendAPI"
set "WAR_FILE=%BACKEND_DIR%\target\LucyBackendAPI-1.0-SNAPSHOT.war"
set "APP_WAR=LucyBackendAPI.war"
set "API_URL=http://localhost:8080/LucyBackendAPI/api/contents"
set "BUNDLED_TOMCAT=%PROJECT_DIR%tools\apache-tomcat-9.0.118"

rem Prefer the Tomcat 9 distribution included with this project.
if exist "%BUNDLED_TOMCAT%\bin\startup.bat" set "TOMCAT_HOME=%BUNDLED_TOMCAT%"
if not defined TOMCAT_HOME if defined CATALINA_HOME set "TOMCAT_HOME=%CATALINA_HOME%"
set "CATALINA_HOME=%TOMCAT_HOME%"

echo ==============================================
echo LUCY - START BACKEND AND FRONTEND
echo ==============================================

if not defined TOMCAT_HOME (
  echo [ERROR] Apache Tomcat 9 was not found.
  echo Expected bundled Tomcat at: %BUNDLED_TOMCAT%
  pause
  exit /b 1
)

if not exist "%TOMCAT_HOME%\bin\startup.bat" (
  echo [ERROR] Tomcat startup script was not found at:
  echo %TOMCAT_HOME%\bin\startup.bat
  echo Restore the bundled Tomcat 9 directory under tools.
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%" (
  if not exist "%BACKEND_ZIP%" (
    echo [ERROR] Missing backend archive: %BACKEND_ZIP%
    pause
    exit /b 1
  )
  echo [1/4] Extracting LucyBackendAPI.zip ...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%BACKEND_ZIP%' -DestinationPath '%PROJECT_DIR%' -Force"
  if errorlevel 1 (
    echo [ERROR] Could not extract the backend archive.
    pause
    exit /b 1
  )
)

if not exist "%WAR_FILE%" (
  where mvn >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] The prebuilt WAR is missing and Maven is not installed.
    echo Install Maven, then run this file again.
    pause
    exit /b 1
  )
  echo [2/4] Building the backend WAR ...
  pushd "%BACKEND_DIR%"
  call mvn -DskipTests package
  if errorlevel 1 (
    popd
    echo [ERROR] Backend build failed.
    pause
    exit /b 1
  )
  popd
) else (
  echo [2/4] Using the packaged backend WAR.
)

echo [3/4] Deploying backend to Tomcat ...
copy /Y "%WAR_FILE%" "%TOMCAT_HOME%\webapps\%APP_WAR%" >nul
if errorlevel 1 (
  echo [ERROR] Could not copy the WAR to Tomcat webapps.
  pause
  exit /b 1
)

call "%TOMCAT_HOME%\bin\startup.bat"
echo Waiting for the API at %API_URL% ...
set "API_READY="
for /L %%I in (1,1,15) do (
  curl.exe --silent --fail "%API_URL%" >nul 2>nul
  if not errorlevel 1 set "API_READY=1"
  if defined API_READY goto :api_ready
  timeout /t 1 /nobreak >nul
)

echo [ERROR] Tomcat started, but the LUCY API did not become available.
echo Check Tomcat logs and the SQL Server connection in DBConnection.java.
pause
exit /b 1

:api_ready
echo Backend is ready.
echo [4/4] Installing frontend dependencies and starting Vite ...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo Frontend: http://localhost:5173
call npm run dev

endlocal
