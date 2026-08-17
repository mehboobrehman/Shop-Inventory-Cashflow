# LAN Deployment Guide

This guide covers deploying the Shop Inventory & Account Management System on a local machine (shop laptop) to be accessible from other devices (laptop, mobile, tablet) on the same WiFi network.

## Prerequisites
- [Bun](https://bun.sh/)
- [Node.js](https://nodejs.org/)
- PostgreSQL database server running locally.

## Setup
**IMPORTANT**: The terminal used to run the setup script MUST be opened with elevated privileges (Administrator on Windows, `sudo` or root access on Linux).

Run the setup script from the project root:
- **Linux/Mac**: `sudo bash deploy/lan/setup.sh`
- **Windows**: Right-click "PowerShell" and select "Run as Administrator", then run `.\deploy\lan\setup.ps1`

This script handles:
1. Environment configuration (`.env`).
2. Dependency installation (`bun install`).
3. Database migrations (`prisma migrate deploy`).
4. Database seeding (`prisma db seed`).
5. Firewall configuration (ports 3000/4000).
6. Starting the application via PM2.

## Accessing the App
1. Find your machine's LAN IP address:
   - **Linux/Mac**: `ifconfig` or `ip addr`
   - **Windows**: `ipconfig`
2. Open a browser on another device on the same WiFi and navigate to `http://<your-machine-ip>:3000/`

## Troubleshooting
- **Cannot connect from other devices:**
  - Verify devices are on the same WiFi network.
  - Check the firewall rules on the machine hosting the app:
    - **Linux**: Check `ufw` or `firewalld` (ports 3000 and 4000).
    - **Windows**: Check "Windows Defender Firewall" and ensure the "Shop App LAN" rule allows ports 3000 and 4000.
  - Ensure the IP address used is correct.
- **PM2/Application issues:**
  - Check process status: `npx pm2 status`
  - View logs: `npx pm2 logs`
  - Restart processes: `npm run restart:prod`
- **mDNS/Bonjour:** If you prefer to access the app via a hostname (e.g., `http://shop.local:3000/`), ensure your machine is running an mDNS service (like Avahi on Linux or Bonjour on Windows) and publish the service, or manually edit the `hosts` file on the client devices.
