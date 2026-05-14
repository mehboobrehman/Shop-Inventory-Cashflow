#!/usr/bin/env bash
# install_android_sdk.sh — Cross-platform Android SDK command-line tools installer
# Part of devops-installer skill for AutoDesk agent system
# Usage: bash install_android_sdk.sh [sdk_root] [platform_tools_only]
# Requires: JDK 17+ (JAVA_HOME must be set)

set -euo pipefail

SDK_ROOT="${1:-$HOME/android-sdk}"
PLATFORM_ONLY="${2:-}"

echo "=== Android SDK Installer ==="
echo "SDK Root: $SDK_ROOT"
echo ""

# Check JDK
if [ -z "${JAVA_HOME:-}" ]; then
    echo "[!] JAVA_HOME is not set. Attempting to find JDK 17+..."
    # Try common locations
    for path in /usr/lib/jvm/java-17-openjdk /usr/lib/jvm/java-17 /usr/lib/jvm/java-21-openjdk /usr/lib/jvm/java-21 /usr/local/lib/jdk-17 /usr/local/lib/jdk-21; do
        if [ -d "$path" ]; then
            export JAVA_HOME="$path"
            echo "[+] Found JDK at $JAVA_HOME"
            break
        fi
    done
    if [ -z "${JAVA_HOME:-}" ]; then
        echo "[!] JDK 17+ not found. Please install JDK 17+ and set JAVA_HOME."
        echo "    sudo apt install openjdk-17-jdk  # Debian/Ubuntu"
        echo "    brew install openjdk@17            # macOS"
        exit 1
    fi
fi

echo "[*] Using JAVA_HOME=$JAVA_HOME"
JAVA_VERSION=$("$JAVA_HOME/bin/java" -version 2>&1 | head -1)
echo "[*] Java version: $JAVA_VERSION"

# Detect OS
case "$(uname -s)" in
    Darwin*)  OS="macos"; SDK_URL="https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip";;
    Linux*)   OS="linux";  SDK_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip";;
    CYGWIN*|MINGW*|MSYS*|NT*) OS="windows"; SDK_URL="https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip";;
    *)        echo "[!] Unsupported OS"; exit 1;;
esac

echo "[*] Downloading Android command-line tools..."
mkdir -p "$SDK_ROOT"
cd "$SDK_ROOT"

TMP_ZIP="/tmp/android-cmdline-tools.zip"
curl -fSL "$SDK_URL" -o "$TMP_ZIP"

# SDKMANAGER path varies by platform
case "$OS" in
    macos|linux)
        TOOLS_DIR="cmdline-tools"
        ;;
    windows)
        TOOLS_DIR="cmdline-tools"
        ;;
esac

# Extract — cmdline-tools has a nested 'latest' folder structure
echo "[*] Extracting command-line tools..."
unzip -o "$TMP_ZIP" -d "$TOOLS_DIR-tmp" >/dev/null 2>&1

# The zip contains cmdline-tools/latest/... 
if [ -d "$TOOLS_DIR-tmp/cmdline-tools/latest" ]; then
    mv "$TOOLS_DIR-tmp/cmdline-tools/latest" "$TOOLS_DIR"
else
    mv "$TOOLS_DIR-tmp/cmdline-tools" "$TOOLS_DIR" 2>/dev/null || true
fi
rm -rf "$TOOLS_DIR-tmp"
rm -f "$TMP_ZIP"

# Set up directory structure for SDK packages
mkdir -p "platforms" "platform-tools" "build-tools" "emulator" "system-images"

# Install platform-tools (adb, fastboot)
echo "[*] Installing platform-tools..."
"$TOOLS_DIR/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" "platform-tools" 2>&1 || echo "[!] platform-tools install had issues"

# Install latest platform
echo "[*] Installing latest Android platform..."
"$TOOLS_DIR/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" "platforms;android-35" 2>&1 || \
"$TOOLS_DIR/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" "platforms;android-34" 2>&1 || \
echo "[!] Platform install had issues"

# Install build-tools
echo "[*] Installing build-tools..."
"$TOOLS_DIR/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" "build-tools;35.0.0" 2>&1 || \
"$TOOLS_DIR/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" "build-tools;34.0.0" 2>&1 || \
echo "[!] Build-tools install had issues"

# Accept licenses via sdkmanager (note: Windows Java Console ignores stdin piping;
# license hash files are written by the PowerShell installer as a workaround)
echo "[*] Accepting SDK licenses..."
yes | "$TOOLS_DIR/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" --licenses 2>&1 || true

# Set environment
echo ""
echo "=== Installation Complete ==="
echo ""
echo "Add these to your shell profile:"
echo ""
case "$OS" in
    macos|linux)
        echo "export ANDROID_SDK_ROOT=\"$SDK_ROOT\""
echo "export PATH=\"\$ANDROID_SDK_ROOT/platform-tools:\$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:\$PATH\""
         ;;
     windows)
         echo "Set ANDROID_SDK_ROOT=$SDK_ROOT"
         echo "Add to PATH: $SDK_ROOT\\platform-tools and $SDK_ROOT\\cmdline-tools\\latest\\bin"
        ;;
esac
echo ""
echo "Verify with: adb --version"