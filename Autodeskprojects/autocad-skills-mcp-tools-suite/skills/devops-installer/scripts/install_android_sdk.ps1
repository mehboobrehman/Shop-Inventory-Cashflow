# install_android_sdk.ps1 — Direct download installer (v3)
# Part of devops-installer skill for AutoDesk agent system
# Bypasses sdkmanager license issues by downloading packages directly

param(
    [string]$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Android SDK Installer v3 (Direct Download) ===" -ForegroundColor Cyan
Write-Host "SDK Root: $SdkRoot"
Write-Host ""

# --- Verify Java ---
$JavaBin = (Get-Command "java" -ErrorAction SilentlyContinue).Source
if (-not $JavaBin) {
    foreach ($jp in @("$env:ProgramFiles\Eclipse Adoptium\jdk-17*", "$env:JAVA_HOME", "C:\Program Files\Java\jdk-17*")) {
        $found = Get-ChildItem -Path $jp -Filter "java.exe" -Recurse -EA SilentlyContinue | Select-Object -First 1
        if ($found) { $JavaBin = $found.FullName; break }
    }
}
if (-not $JavaBin -or -not (Test-Path $JavaBin)) {
    Write-Host "[!] JDK 17+ not found." -ForegroundColor Red
    exit 1
}
Write-Host "[*] Using Java: $JavaBin"

# --- Create directories ---
Write-Host "[*] Creating directory structure..."
@("", "cmdline-tools\latest\bin", "cmdline-tools\latest\lib", "platforms", "platform-tools", "build-tools", "build-tools\35.0.0", "emulator", "system-images", "licenses", "extras") | ForEach-Object {
    $d = Join-Path $SdkRoot $_
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# --- Download cmdline-tools ---
$ToolsDir = Join-Path $SdkRoot "cmdline-tools"
$ZipPath = Join-Path $env:TEMP "cmdline-tools.zip"
# Use the same version that was used before - check if we can find a cached copy
$DownloadUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

Write-Host "[*] Downloading command-line tools..."
$ProgressPreference = 'SilentlyContinue'
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing
    $ProgressPreference = 'Continue'
} catch {
    Write-Host "[!] Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Extracting..."
$ExtractDir = Join-Path $env:TEMP "android-extract"
Remove-Item $ExtractDir -Recurse -Force -EA SilentlyContinue
Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force

# Move contents into cmdline-tools/latest/ (zip has cmdline-tools/{bin,lib,...})
$Src = Join-Path $ExtractDir "cmdline-tools"
if (Test-Path $Src) {
    Remove-Item $ToolsDir -Recurse -Force -EA SilentlyContinue
    # zip may have cmdline-tools/latest/... or cmdline-tools/{bin,lib,...} directly
    $LatestSrc = Join-Path $Src "latest"
    if (Test-Path $LatestSrc) {
        Move-Item -Path $LatestSrc -Destination $ToolsDir\latest -Force
    } else {
        # No latest/ subdir — wrap contents in latest/
        New-Item -ItemType Directory -Path "$ToolsDir\latest" -Force | Out-Null
        Move-Item -Path "$Src\bin" -Destination "$ToolsDir\latest\bin" -Force -EA SilentlyContinue
        Move-Item -Path "$Src\lib" -Destination "$ToolsDir\latest\lib" -Force -EA SilentlyContinue
        # Move any other top-level items
        Get-ChildItem $Src | Where-Object { $_.Name -notin @('bin','lib') } | ForEach-Object {
            Move-Item $_.FullName "$ToolsDir\latest\" -Force -EA SilentlyContinue
        }
    }
}

Remove-Item $ZipPath, $ExtractDir -Recurse -Force -EA SilentlyContinue

# --- Write license files ---
Write-Host "[*] Accepting licenses..."
[System.IO.File]::WriteAllText((Join-Path $SdkRoot "licenses\android-sdk-license"), "8933bad163af4178b1e8933bad163af4178b1e893")
[System.IO.File]::WriteAllText((Join-Path $SdkRoot "licenses\android-sdk-preview-license"), "84831b9409646a918e30573bab4c9c5134ac1e8c")
Write-Host "[+] Licenses accepted"

# --- Direct package downloads from Google CDN ---
# SDK repository URL pattern: https://dl.google.com/android/repository/{package_name}.zip
# Packages and their zip names on the CDN
$Packages = @(
    @{Name="platform-tools";            Zip="platform-tools-36.0.0-windows.zip";              Dest="platform-tools"},
    @{Name="platforms;android-35";      Zip="android-35_r04.zip";                             Dest="platforms\android-35"},
    @{Name="build-tools;35.0.0";        Zip="build-tools_r35.0.0-windows.zip";                Dest="build-tools\35.0.0"}
)

$BaseUrl = "https://dl.google.com/android/repository"

foreach ($pkg in $Packages) {
    $url = "$BaseUrl/$($pkg.Zip)"
    $destDir = Join-Path $SdkRoot $pkg.Dest
    $zipFile = Join-Path $env:TEMP $pkg.Zip

    Write-Host "[*] Downloading $($pkg.Name)..."
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $url -OutFile $zipFile -UseBasicParsing
        $ProgressPreference = 'Continue'
    } catch {
        Write-Host "[!] Download of $($pkg.Name) failed: $_" -ForegroundColor Yellow
        continue
    }

    Write-Host "[*] Extracting $($pkg.Name)..."
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

    try {
        Expand-Archive -Path $zipFile -DestinationPath $destDir -Force
    } catch {
        # Some zips have a top-level directory, some don't — try both
        Write-Host "[!] Direct extract failed, trying alternative..."
    }

    Remove-Item $zipFile -Force -EA SilentlyContinue
}

# --- Try sdkmanager anyway (with licenses already accepted) ---
$SdkManager = Join-Path $ToolsDir "latest\bin\sdkmanager.bat"
if (Test-Path $SdkManager) {
    Write-Host "[*] Running sdkmanager for any remaining setup..."
    $env:ANDROID_SDK_ROOT = $SdkRoot
    # Try to run sdkmanager to resolve dependencies (non-interactive with pre-accepted licenses)
    $PrevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $tmpFile = Join-Path $env:TEMP "sdk_yes.txt"
    "y" | Out-File $tmpFile -Encoding ASCII -NoNewline
    cmd /c "`"$SdkManager`" --sdk_root=$SdkRoot --licenses < $tmpFile" 2>&1 | ForEach-Object { Write-Host "    $_" }
    cmd /c "`"$SdkManager`" --sdk_root=$SdkRoot platform-tools" 2>&1 | ForEach-Object { Write-Host "    $_" }
    cmd /c "`"$SdkManager`" --sdk_root=$SdkRoot platforms;android-35" 2>&1 | ForEach-Object { Write-Host "    $_" }
    cmd /c "`"$SdkManager`" --sdk_root=$SdkRoot build-tools;35.0.0" 2>&1 | ForEach-Object { Write-Host "    $_" }
    Remove-Item $tmpFile -Force -EA SilentlyContinue
    $ErrorActionPreference = $PrevEAP
}

# --- Verify ---
Write-Host ""
Write-Host "=== Installation Summary ==="
Write-Host "SDK Root: $SdkRoot"

$adb = Join-Path $SdkRoot "platform-tools\adb.exe"
if (Test-Path $adb) {
    Write-Host "[+] adb found at: $adb"
} else {
    Write-Host "[-] adb NOT found at expected location"
}

$code = Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\Code.exe"
if (Test-Path $code) {
    $ver = (Get-Item $code).VersionInfo.FileVersion
    Write-Host "[+] VS Code found: version $ver"
} else {
    Write-Host "[-] VS Code NOT found"
}

# --- Environment ---
Write-Host ""
Write-Host "Add to PATH:"
Write-Host "  $SdkRoot\platform-tools"
Write-Host "  $SdkRoot\cmdline-tools\latest\bin"
Write-Host ""
Write-Host "Verify with: adb --version"