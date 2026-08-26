# Mobile Companion App (Shop-Inventory-Cashflow)

This directory contains the React Native + Expo mobile companion application for wireless barcode scanning and inventory lookups, connected directly to the Shop-Inventory-Cashflow server over LAN.

## Features
- **Mobile Barcode Scanning**: Uses `expo-camera` to scan common product barcodes (QR, EAN-13, EAN-8, UPC-A, Code 128, etc.).
- **WebSocket LAN Client**: Connects via WebSockets to the Node.js companion or main backend server using your computer's local IP address.
- **Vibration & Audio Cues**: Instant tactile feedback upon successful barcode capture.

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+) installed.
- Expo Go app installed on your physical Android/iOS phone (for fast testing), OR Android Studio / Gradle installed for compiling standalone APKs.

### 2. Running in Development (Expo Go)
1. Navigate to the mobile app directory:
   ```bash
   cd mobile-companion/mobile-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Scan the resulting QR code using the **Expo Go** app on your phone (ensure your phone is on the same Wi-Fi network as your computer).

---

## Compiling the Standalone Android APK

You can build the APK either via **EAS Build** (cloud) or **Local Gradle Build**.

### Option A: Local Gradle Build (Recommended for offline/local standalone compilation)
1. Prebuild the native Android project files:
   ```bash
   npx expo run:android --variant release
   ```
   *Alternatively, generate the native android folder:*
   ```bash
   npx expo prebuild
   ```
2. Navigate into the generated android folder and execute Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. The resulting APK will be generated at:
   `android/app/build/outputs/apk/release/app-release.apk`

### Option B: EAS Build (Cloud)
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Configure the build profile (`eas.json`):
   ```json
   {
     "cli": {
       "version": ">= 12.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal"
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```
4. Trigger the Android APK build:
   ```bash
   eas build --platform android --profile production
   ```
5. Download the compiled `.apk` file from the link provided in the terminal.
