# install_all.ps1 — Combined VS Code + Android SDK installer (PowerShell)
# Part of devops-installer skill for AutoDesk agent system
# Usage: powershell -ExecutionPolicy Bypass -File install_all.ps1

param(
    [string]$VsCodeVersion = "latest",
    [string]$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$VsCodeInstallPath = "C:\Program Files\Microsoft VS Code"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  DevOps Installer — Full Setup" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host ""

# Step 1: VS Code
Write-Host "[Step 1/2] Installing Visual Studio Code..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
. "$PSScriptRoot\install_vscode.ps1" -Version $VsCodeVersion -InstallPath $VsCodeInstallPath
Write-Host ""

# Step 2: Android SDK
Write-Host "[Step 2/2] Installing Android SDK..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
. "$PSScriptRoot\install_android_sdk.ps1" -SdkRoot $SdkRoot
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verify:"
Write-Host "  code --version      # VS Code"
Write-Host "  adb --version        # Android SDK"
Write-Host ""