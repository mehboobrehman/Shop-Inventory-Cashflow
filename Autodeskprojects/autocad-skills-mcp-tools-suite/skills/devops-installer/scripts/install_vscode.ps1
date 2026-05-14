# install_vscode.ps1 — Windows PowerShell VS Code installer
# Part of devops-installer skill for AutoDesk agent system
# Usage: powershell -ExecutionPolicy Bypass -File install_vscode.ps1 [-Version latest] [-InstallPath "C:\Program Files\Microsoft VS Code"]

param(
    [string]$Version = "latest",
    [string]$InstallPath = "C:\Program Files\Microsoft VS Code"
)

$ErrorActionPreference = "Stop"

Write-Host "=== VS Code Installer (PowerShell) ===" -ForegroundColor Cyan
Write-Host "Version: $Version"
Write-Host "Install Path: $InstallPath"
Write-Host ""

$TempDir = [System.IO.Path]::GetTempPath()
$Installer = Join-Path $TempDir "VSCodeSetup.exe"
$Url = "https://update.code.visualstudio.com/${Version}/win32-x64-user/stable"

# Download
Write-Host "[*] Downloading VS Code installer..."
try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $Url -OutFile $Installer -UseBasicParsing
    $ProgressPreference = 'Continue'
    Write-Host "[+] Download complete: $Installer"
} catch {
    Write-Host "[!] Download failed: $_" -ForegroundColor Red
    Write-Host "[!] Try manually: $Url"
    exit 1
}

# Verify download
if (-not (Test-Path $Installer)) {
    Write-Host "[!] Installer not found after download. Exiting." -ForegroundColor Red
    exit 1
}

$FileSize = (Get-Item $Installer).Length / 1MB
Write-Host "[*] Installer size: $([math]::Round($FileSize, 1)) MB"

# Silent install
Write-Host "[*] Running silent installation..."
$Args = "/verysilent /mergetasks=!runcode /dir=""$InstallPath"""
$Process = Start-Process -FilePath $Installer -ArgumentList $Args -Wait -PassThru -NoNewWindow

if ($Process.ExitCode -eq 0) {
    Write-Host "[+] VS Code installed successfully!" -ForegroundColor Green
    Write-Host "[+] Location: $InstallPath"
    
    # Verify installation
    $ExePath = Join-Path $InstallPath "Code.exe"
    if (Test-Path $ExePath) {
        $VersionInfo = (Get-Item $ExePath).VersionInfo.FileVersion
        Write-Host "[+] Installed version: $VersionInfo"
    }
} else {
    Write-Host "[!] Installation exited with code $($Process.ExitCode)" -ForegroundColor Yellow
    Write-Host "[!] Try running $Installer manually"
}

# Cleanup
Remove-Item $Installer -Force -ErrorAction SilentlyContinue
Write-Host "[*] Cleanup complete."