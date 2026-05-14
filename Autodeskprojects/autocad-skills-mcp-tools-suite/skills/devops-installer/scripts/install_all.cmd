@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_vscode.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_android_sdk.ps1"
echo Done.
pause