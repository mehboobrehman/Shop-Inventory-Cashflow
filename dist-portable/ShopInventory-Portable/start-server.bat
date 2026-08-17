@echo off
SETLOCAL EnableDelayedExpansion
SET "APP_DIR=%~dp0"
IF "%APP_DIR:~-1%"=="\" SET "APP_DIR=%APP_DIR:~0,-1%"
CD /D "%APP_DIR%"
echo Starting Shop Inventory System...

rem Kill any existing process on port 4000
powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }" >nul 2>&1

rem Kill any other node instances running index.js
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*server\\dist\\server\\src\\index.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

IF NOT EXIST "%APP_DIR%\bin\node.exe" (
    MSG * "ERROR: Bundled Node.js runtime (bin\node.exe) missing."
    EXIT /B 1
)
SET "PATH=%APP_DIR%\bin;%PATH%"
SET "NODE_ENV=production"
START "ShopInventory_Backend" /B "%APP_DIR%\bin\node.exe" "%APP_DIR%\server\dist\server\src\index.js" > "%APP_DIR%\server.log" 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$maxRetries=30; $i=0; while ($i -lt $maxRetries) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4000/api/v1/health' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { break } } catch {}; Start-Sleep -Milliseconds 500; $i++ }"
START "" "http://127.0.0.1:4000"
ENDLOCAL
EXIT /B 0
