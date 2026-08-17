# Deployment & Operations Guide

This guide provides step-by-step instructions for setting up, deploying, and maintaining the Shop Inventory & Cashflow Management System in local, LAN (multi-device), and production environments.

---

## 1. System Architecture & Prerequisites

### Technology Stack
- **Frontend**: React + Vite + TypeScript (Single Page Application)
- **Backend**: Express + Prisma ORM + TypeScript API server
- **Database**: SQLite with **Write-Ahead Logging (WAL)** enabled for robust concurrency and atomic transactions (sales, stock updates, account balance adjustments).
- **Process Manager**: PM2 (chosen over Docker to accommodate user permission constraints while providing robust background process management, auto-restart, and log rotation).

### Prerequisites
Ensure your server/host machine has the following installed:
- **Node.js** (v18 or higher) or **Bun** (v1.0+)
- **Git**
- **PM2**:
  ```bash
  npm install -g pm2
  # OR with bun
  bun install -g pm2
  ```

---

## 2. Environment Configuration

The application requires environment variables configured for both the backend server and frontend client.

1. Create a `.env` file in the project root:
   ```env
   # Database Configuration (SQLite)
   DATABASE_URL="file:./prisma/dev.db"

   # Security & Authentication
   JWT_SECRET="<generate-a-strong-random-secret-string>"
   ENCRYPTION_KEY="<32-byte-hex-or-secure-key-for-aes-256-credentials>"

   # Server Settings
   PORT=4000
   NODE_ENV="production"

   # Client API Endpoint (Use local IP for LAN, or domain for cloud)
   VITE_API_URL="http://localhost:4000"
   ```

---

## 3. Local & Single-Machine Setup

1. **Install Dependencies**:
   ```bash
   npm install  # or bun install
   ```

2. **Initialize Database & Prisma**:
   ```bash
   cd server
   npx prisma db push  # or bun prisma db push
   npx prisma generate # or bun prisma generate
   npm run db:seed     # or bun run db:seed (Optional: creates initial admin user & demo data)
   cd ..
   ```

3. **Startup & Execution Instructions (Local Development)**:
   To run the application locally with active API connectivity and avoid connection issues:
   - **Concurrent Development (Recommended):** Run `npm run dev` (or `bun run dev`) directly from the project root directory. 
     
     **Why this matters (`ECONNREFUSED` prevention):** 
     Running `npm run dev` from the root uses `concurrently` to spin up both services simultaneously:
     1. **Express Backend API** running on **port `4000`**
     2. **Vite Frontend SPA** running on **port `5173`**
     
     Starting both concurrently ensures that Vite's internal development proxy can successfully proxy `/api` requests to the backend server. Starting the frontend alone without the backend running on port `4000` will result in an `ECONNREFUSED` proxy connection error.

   - **Production / PM2 Mode:** Run `npm run start:prod` (after building via `npm run build` or `bun run build`) to start all processes via PM2.

---

## 4. LAN Deployment (Multi-Device Access)

To make the system accessible from other devices (e.g., tablet at checkout counter, phone in stock room) over the same local WiFi network:

1. **Find your Host Machine's LAN IP**:
   - Windows: Run `ipconfig` in cmd and locate your IPv4 Address (e.g., `192.168.1.50`).
   - Linux/Mac: Run `ip a` or `ifconfig`.

2. **Update Environment Variable**:
   Set `VITE_API_URL` to point to your host IP:
   ```env
   VITE_API_URL="http://192.168.1.50:4000"
   ```

3. **Rebuild Client & Restart PM2**:
   ```bash
   bun run build
   pm2 restart all
   ```

4. **Firewall Configuration**:
   Ensure your OS firewall permits inbound connections on the application ports (default: frontend `3000` / backend `4000`).

5. **Access**:
   Open a browser on any device on the same network and navigate to `http://192.168.1.50:3000`.

---

## 5. Security & Compliance Posture

- **Authentication**: Authentication tokens are stored securely in **httpOnly, secure cookies**, preventing client-side script access and mitigating XSS token theft. Passwords are hashed using **bcrypt**.
- **Database Transactions & Integrity**: SQLite runs with WAL mode enabled. All financial transactions (sales, stock deductions, deposits, withdrawals, refunds) execute inside ACID-compliant database transactions with row-level locking (`SELECT ... FOR UPDATE`) to prevent race conditions and balance discrepancies.
- **Audit Logging**: An immutable **AuditLog middleware** tracks all sensitive financial and inventory actions, recording timestamps, user IDs, and transaction types for full reconciliation and accountability.
- **Credential Encryption**: Third-party merchant API credentials (JazzCash, Easypaisa, Bank) are encrypted at rest using **AES-256-CBC**.

---

## 6. Maintenance & Troubleshooting

- **Check PM2 Status**:
  ```bash
  pm2 status
  ```
- **View Live Logs**:
  ```bash
  pm2 logs
  ```
- **Restart Services**:
  ```bash
  pm2 restart all
  ```
- **Database Locks / WAL Check**:
  If SQLite reports locking issues, ensure no orphaned Node/Bun processes are running. PM2 automatically manages process lifecycles.
