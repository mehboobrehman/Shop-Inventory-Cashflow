# Shop Inventory & Cashflow System - Portable Edition

Welcome to the **Shop Inventory & Cashflow System**! This portable distribution allows shopkeepers & cashiers to run the application directly on any Windows PC—**no administrative privileges or Node.js installation required**.

---

## 🚀 Quick Start

1. **Extract the ZIP File**: Extract `ShopInventory-Portable.zip` to any folder on your computer (e.g. Desktop or `C:\ShopInventory`).
2. **Launch the Application**: Double-click **`Launch Shop Inventory.vbs`** inside the extracted folder.
   - The backend server will start automatically in the background.
   - Your default web browser will open automatically to `http://127.0.0.1:4000`.

---

## 🔑 Accessing the App

- **Default URL**: `http://127.0.0.1:4000`
- **Initial Login Credentials**:
  - **Email**: `admin@shop.com`
  - **Password**: `admin123`

---

## 📱 LAN Access (Local Wi-Fi)

You can access the application from other phones, tablets, or computers connected to the same Wi-Fi / local network.

1. **Find Host IP Address**: Open Command Prompt (`cmd`) on the main PC and type `ipconfig`. Find your **IPv4 Address** (e.g., `192.168.1.50`).
2. **Open on Phone/Tablet**: On any mobile device or PC on the same Wi-Fi network, open a web browser and enter:
   `http://<Host-IP>:4000` (e.g., `http://192.168.1.50:4000`)

---

## 🛑 Stopping the App

To stop the background server when you are done for the day:
- Double-click **`stop-app.bat`** in the portable folder.

---

## ℹ️ Key Details

- **No Admin Rights Required**: No administrative privileges or pre-installed software (such as Node.js) are needed. The package includes a bundled portable runtime (`bin/node.exe`).
- **Data Preservation**: All database records are stored in `server/prisma/dev.db` (and backed up in `prisma/dev.db`).
