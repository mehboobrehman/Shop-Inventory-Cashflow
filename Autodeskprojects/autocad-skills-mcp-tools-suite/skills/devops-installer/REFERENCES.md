# REFERENCES.md — DevOps Installer Troubleshooting & Manual Fallback
# Part of devops-installer skill for AutoDesk agent system

## Common Issues

### File Lock on Windows (VSCodeSetup.exe)
**Symptom:** "The process cannot access the file because it is being used by another process"
**Fix:** Kill any running VS Code installer processes:
```powershell
Get-Process -Name 'VSCodeSetup' -ErrorAction SilentlyContinue | Stop-Process -Force
```
Then remove the stale file:
```powershell
Remove-Item "$env:TEMP\VSCodeSetup.exe" -Force -ErrorAction SilentlyContinue
```

### JDK Not Found (Android SDK)
**Symptom:** `sdkmanager` fails with "JAVA_HOME is not set" or "Could not find java"
**Fix (Windows):**
```powershell
# Install JDK 17 via winget
winget install EclipseAdoptium.Temurin.17.JDK
# Or set JAVA_HOME manually:
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot-jre", "User")
```
**Fix (macOS):**
```bash
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```
**Fix (Linux/Debian):**
```bash
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Permission Denied on Linux/macOS
**Symptom:** "Permission denied" when extracting to `/opt` or running `sdkmanager`
**Fix:**
```bash
sudo chmod +x install_vscode.sh install_android_sdk.sh
sudo ./install_vscode.sh
```

### Windows Execution Policy
**Symptom:** "Running scripts is disabled on this system"
**Fix:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# Then re-run:
powershell -ExecutionPolicy Bypass -File install_all.ps1
```

### Slow Download / Timeout
**Symptom:** Installer times out during large downloads
**Fix:** Use `run_background` instead of `run_shell` for non-blocking execution, or increase timeout.

### Android SDKmanager Accepts No Input
**Symptom:** `sdkmanager` hangs waiting for license acceptance
**Fix:** Pre-accept licenses by creating the license files manually (see scripts) or run:
```bash
yes | sdkmanager --licenses
```

## Manual Installation Fallbacks

### VS Code — Manual
- **Windows:** Download from https://code.visualstudio.com/download and run the installer
- **macOS:** Download `.zip`, extract to `/Applications`
- **Linux (.deb):** `sudo dpkg -i code_*.deb`
- **Linux (.rpm):** `sudo rpm -i code-*.rpm`

### Android SDK — Manual
1. Download command-line tools from https://developer.android.com/studio#command-line-tools-only
2. Extract to desired location
3. Run `sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"`
4. Accept licenses: `sdkmanager --licenses`
5. Add to PATH:
   ```bash
   export ANDROID_SDK_ROOT=$HOME/android-sdk
   export PATH=$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH
   ```

### Verify Installations
```bash
# VS Code
code --version

# Android SDK
adb --version
sdkmanager --list

# Java (required for Android SDK)
java -version
```