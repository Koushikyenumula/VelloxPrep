@echo off
title VelloxPrep Platform Launcher
echo ==================================================
echo  Starting VelloxPrep Platform...
echo ==================================================

echo.
echo 1. Starting Frontend Web Server in background...
start /min powershell -NoProfile -ExecutionPolicy Bypass -File frontend\serve.ps1

echo.
echo 2. Waiting 2 seconds for web server to initialize...
timeout /t 2 >nul

echo.
echo 3. Launching default browser to: http://localhost:5500/
start http://localhost:5500/

echo.
echo 4. Loading environment variables from .env if present...
if exist .env (
    for /f "tokens=1,* delims==" %%A in (.env) do (
        set %%A=%%B
    )
    echo    Loaded .env file.
) else (
    echo    No .env file found. Using default application properties.
)

echo.
echo 5. Starting Spring Boot Backend Server...
echo [INFO] logs will print directly below in real time.
echo --------------------------------------------------
mvn spring-boot:run
