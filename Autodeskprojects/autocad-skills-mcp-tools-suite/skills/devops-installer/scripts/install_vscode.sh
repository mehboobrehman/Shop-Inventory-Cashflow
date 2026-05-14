#!/usr/bin/env bash
# install_vscode.sh — Cross-platform Visual Studio Code installer
# Part of devops-installer skill for AutoDesk agent system
# Usage: bash install_vscode.sh [version] [install_dir]

set -euo pipefail

VERSION="${1:-latest}"
INSTALL_DIR="${2:-}"

detect_os() {
  case "$(uname -s)" in
    Darwin*)  OS="macos";;
    Linux*)   OS="linux";;
    CYGWIN*|MINGW*|MSYS*|NT*) OS="windows";;
    *)        OS="unknown";;
  esac
}

get_download_url() {
  case "$OS" in
    macos)
      echo "https://update.code.visualstudio.com/${VERSION}/darwin-universal/stable"
      ;;
    linux)
      echo "https://update.code.visualstudio.com/${VERSION}/linux-x64/stable"
      ;;
    windows)
      echo "https://update.code.visualstudio.com/${VERSION}/win32-x64-user/stable"
      ;;
  esac
}

install_macos() {
  local url="$1"
  local tmp="/tmp/vscode.zip"
  echo "[*] Downloading VS Code for macOS..."
  curl -fSL "$url" -o "$tmp"
  echo "[*] Extracting to /Applications..."
  unzip -o "$tmp" -d "/Applications" >/dev/null 2>&1
  rm -f "$tmp"
  echo "[+] VS Code installed at /Applications/Visual Studio Code.app"
}

install_linux() {
  local url="$1"
  local tmp="/tmp/vscode.tar.gz"
  local target="${INSTALL_DIR:-/opt/vscode}"
  echo "[*] Downloading VS Code for Linux..."
  curl -fSL "$url" -o "$tmp"
  echo "[*] Extracting to ${target}..."
  sudo mkdir -p "$target"
  sudo tar -xzf "$tmp" -C "$target" --strip-components=1
  rm -f "$tmp"
  # Create symlink if not exists
  if [ ! -f "/usr/local/bin/code" ]; then
    sudo ln -sf "${target}/bin/code" /usr/local/bin/code
  fi
  echo "[+] VS Code installed at ${target}"
}

install_windows() {
  local url="$1"
  local tmp="$TEMP\\VSCodeSetup.exe"
  local target="${INSTALL_DIR:-C:\\Program Files\\Microsoft VS Code}"
  echo "[*] Downloading VS Code for Windows..."
  # Try PowerShell download as fallback
  powershell -Command "Invoke-WebRequest -Uri '$url' -OutFile '$tmp' -UseBasicParsing" 2>/dev/null || \
  curl -fSL "$url" -o "$tmp" 2>/dev/null || \
  echo "[!] Could not download VS Code installer"
  
  if [ -f "$tmp" ] || powershell -Command "Test-Path '$tmp'" 2>/dev/null; then
    echo "[*] Running installer silently..."
    powershell -Command "Start-Process -FilePath '$tmp' -ArgumentList '/verysilent /mergetasks=!runcode' -Wait" 2>/dev/null || \
    echo "[!] Silent install failed — run $tmp manually"
    rm -f "$tmp" 2>/dev/null
    echo "[+] VS Code installation complete"
  else
    echo "[!] Download failed. Install manually from: $url"
  fi
}

# Main
detect_os
URL=$(get_download_url)
echo "=== VS Code Installer ==="
echo "OS: $OS | Version: $VERSION"
echo "Download: $URL"
echo ""

case "$OS" in
  macos)   install_macos "$URL" ;;
  linux)   install_linux "$URL" ;;
  windows) install_windows "$URL" ;;
  *)       echo "[!] Unsupported OS: $OS"; exit 1 ;;
esac