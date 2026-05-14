---
name: "devops-installer"
version: "1.0.0"
agent: "devops-engineer"
description: "Install developer tools (VS Code, Android SDK, JDK, etc.) across platforms"
author: "opencode"
license: "MIT"
created: "2026-05-13"
updated: "2026-05-13"
tags:
  - devops
  - installation
  - vscode
  - android-sdk
  - cross-platform

skills:
  - name: "Install VS Code"
    description: "Download and install the latest Visual Studio Code"
    trigger: "install vscode"
    platforms: ["windows", "macos", "linux"]
    entrypoint: "scripts/install_vscode.sh"

  - name: "Install Android SDK"
    description: "Download and install Android SDK command-line tools"
    trigger: "install android sdk"
    platforms: ["windows", "macos", "linux"]
    entrypoint: "scripts/install_android_sdk.sh"
    notes: "Requires JDK 17+"

  - name: "Install All"
    description: "Install VS Code + Android SDK in one command"
    trigger: "install all"
    platforms: ["windows", "macos", "linux"]
    entrypoint: "scripts/install_all.sh"

parameters:
  - name: "vscode_version"
    type: "string"
    default: "latest"
    description: "VS Code version to install"
  - name: "android_sdk_version"
    type: "string"
    default: "latest"
    description: "Android SDK version to install"
  - name: "install_path"
    type: "string"
    default: ""
    description: "Custom installation path (leave empty for default)"

tools:
  - "run_shell"
  - "run_background"
  - "download_file"
  - "environment_info"
  - "get_env"
  - "sleep"
  - "read_file"
  - "write_file"