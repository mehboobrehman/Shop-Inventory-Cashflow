#!/usr/bin/env bash
# install_all.sh — Combined VS Code + Android SDK installer
# Part of devops-installer skill for AutoDesk agent system
# Usage: bash install_all.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  DevOps Installer — Full Setup"
echo "========================================"
echo ""

# Step 1: VS Code
echo "[Step 1/2] Installing Visual Studio Code..."
echo "----------------------------------------"
bash "${SCRIPT_DIR}/install_vscode.sh" "$@"
echo ""

# Step 2: Android SDK
echo "[Step 2/2] Installing Android SDK..."
echo "----------------------------------------"
bash "${SCRIPT_DIR}/install_android_sdk.sh" "$@"
echo ""

echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "Verify:"
echo "  code --version      # VS Code"
echo "  adb --version        # Android SDK"