# Shop Inventory & Cashflow Management System

![CI/CD Pipeline](https://github.com/mehboobrehman/Shop-Inventory-Cashflow/actions/workflows/pipeline.yml/badge.svg)

A robust, type-safe shop inventory and cashflow management web application designed for retail businesses in Pakistan (supporting JazzCash, Easypaisa, and Bank accounts). Built with a focus on auditability, ACID-compliant transactions, and local/LAN reliability.

---

## Key Architecture & Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite with Write-Ahead Logging (WAL) enabled for concurrent read/write safety and atomic transactions.
- **Authentication**: Secure, HttpOnly Cookies (JWT stored securely, preventing XSS token theft), bcrypt password hashing.
- **Security & Audit**: Immutable financial transaction tracking via dedicated audit log middleware for all deposits, withdrawals, sales, and refunds.
- **Credential Protection**: AES-256-CBC encryption for third-party merchant API credentials.
- **Deployment**: PM2 Process Manager (optimized for local shop laptops, LAN multi-device setup, or cloud VPS without requiring Docker).

---

## Core Features

1. **Point of Sale (POS) & Barcode Scanning**:
   - Fast item scanning and lookup.
   - Real-time stock deduction upon sale completion.
   - Cart management, discount calculation, and receipt generation.

2. **Product Management**:
   - Comprehensive CRUD for products (Name, Barcode, Sale/Purchase Price, Stock, Minimum Stock Limit).
   - Instant search and filtering.
   - Low-stock visual alerts and dashboard notifications.

3. **Multi-Account Financial Management**:
   - Record and track balances for JazzCash, Easypaisa, and Bank Accounts.
   - Secure management of merchant API credentials with AES-256 encryption.
   - Deposit and withdrawal tracking with full transaction history.

4. **Sales History & Order Management**:
   - Complete ledger of past sales with date, items, quantities, and totals.
   - Support for order lookup and detailed invoice views.
   - Refund processing with automatic stock reversal and balance adjustment.

5. **Immutable Audit Logging**:
   - Every financial adjustment, sale, refund, deposit, and withdrawal is logged in an immutable audit trail for compliance and reconciliation.

---

## Quick Start & Setup

### Prerequisites
- [Bun](https://bun.sh/) (Recommended) or **Node.js** (v18+)
- **PM2** (`npm install -g pm2` or `bun install -g pm2`)

### Installation Steps

1. **Clone and Install Dependencies**:
   ```bash
   git clone https://github.com/mehboobrehman/Shop-Inventory-Cashflow.git
   cd Shop-Inventory-Cashflow
   bun install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory (or use `.env.example` as a template):
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="your-secure-jwt-secret"
   PORT=4000
   NODE_ENV="development"
   VITE_API_URL="http://localhost:4000"
   ```

3. **Database Initialization**:
   ```bash
   cd server
   bun prisma db push
   bun prisma generate
   bun run db:seed
   cd ..
   ```

4. **Running the Application (Local Development)**:
   To start both the backend and frontend concurrently for local development, run:
   ```bash
   npm run dev
   # or
   bun run dev
   ```
   **Important Note on `ECONNREFUSED` Errors:**
   Always start the application from the root directory using `npm run dev`. This ensures that:
   - The **Express backend** runs concurrently on **port 4000**.
   - The **Vite frontend** runs concurrently on **port 5173**.
   - Vite's development proxy correctly connects to the backend API (`http://localhost:4000`), completely preventing `ECONNREFUSED` proxy connection errors.

   - **Production / PM2 Mode:** Run `npm run start:prod` to start all processes via PM2.
     *(Note: Ensure `npm run build` or `bun run build` has been executed prior to starting production mode).*

---

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Detailed instructions for local, LAN (multi-device WiFi), and cloud VPS deployments using PM2.
- **[DECISIONS.md](DECISIONS.md)**: Architectural decision records.

---

## CI/CD Setup

This project uses GitHub Actions for continuous integration and deployment. The pipeline includes:
- **Lint**: ESLint and Prettier checks.
- **Typecheck**: TypeScript validation across all modules (`shared`, `server`, `client`).
- **Test**: Automated E2E integration tests running against a live PostgreSQL service container.
- **Build**: Production build generation and artifact archival.
- **Deploy**: 
  - **Staging**: Automatic deployment to the staging server on every push to `main`.
  - **Production**: Automatic deployment to the production server on every git tag matching `v*`.

### Required GitHub Secrets
To enable deployment, the following secrets must be configured in GitHub:
- `SSH_PRIVATE_KEY`: Your server's private SSH key.
- `REMOTE_HOST`: Server IP address or hostname.
- `REMOTE_USER`: SSH username (e.g., `ubuntu`).
- `TARGET_DIR_STAGING`: Directory on the server where staging app will reside.
- `TARGET_DIR_PROD`: Directory on the server where production app will reside.

