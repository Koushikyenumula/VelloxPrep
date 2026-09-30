# run.ps1
# VelloxPrep Platform Launcher

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Starting VelloxPrep Platform..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. Starting Frontend Web Server in background..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File frontend/serve.ps1" -WindowStyle Minimized

Write-Host ""
Write-Host "2. Waiting 2 seconds for web server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "3. Launching default browser to: http://localhost:5500/" -ForegroundColor Yellow
Start-Process "http://localhost:5500/"

Write-Host ""
Write-Host "4. Loading environment variables from .env if present..." -ForegroundColor Yellow
if (Test-Path ".env") {
    foreach($line in Get-Content .env) {
        if ($line -match "^([^#].*?)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
    Write-Host "   Loaded .env file." -ForegroundColor Green
} else {
    Write-Host "   No .env file found. Using default application properties." -ForegroundColor Gray
}

Write-Host ""
Write-Host "5. Starting Spring Boot Backend Server..." -ForegroundColor Yellow
Write-Host "[INFO] logs will print directly below in real time." -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Gray

mvn spring-boot:run
