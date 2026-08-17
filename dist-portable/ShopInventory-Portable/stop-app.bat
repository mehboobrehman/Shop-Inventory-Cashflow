@echo off
SETLOCAL EnableDelayedExpansion
SET "APP_DIR=%~dp0"
IF "%APP_DIR:~-1%"=="\" SET "APP_DIR=%APP_DIR:~0,-1%"
CD /D "%APP_DIR%"
echo Stopping Shop Inventory System...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*server\dist\server\src\index.js*' -or $_.CommandLine -like '*ShopInventory*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" 2>nul
taskkill /F /FI "WINDOWTITLE eq ShopInventory_Backend*" 2>nul
echo Shop Inventory System stopped.
ENDLOCAL
EXIT /B 0
