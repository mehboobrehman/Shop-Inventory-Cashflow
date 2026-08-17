# Project Decisions

Architectural and design decisions made during development.
All agents should read this before starting work and log new decisions here.

## Tech Stack: React+Vite+TS frontend, Express+Prisma+TS backend, PostgreSQL, Docker
**When**: 2026-07-24 10:15:48

User confirmed this tech stack. React+Vite for fast dev and SPA, Express+Prisma for type-safe API and ORM, PostgreSQL for relational data integrity (products, sales, accounts with foreign keys), Docker Compose for reproducible local/LAN/cloud deployment. All in TypeScript for end-to-end type safety.

**Impact**: Entire project structure. Monorepo with client/ and server/ directories. All agents must use TypeScript, Prisma for DB access, and Docker for deployment.
g a chain. No two module tasks can run in parallel because they share router files (App.tsx, server.ts).
nterface.

## Shared types package: @shop/shared with barrel exports
**When**: 2026-07-24 10:21:02

Created `shared/types/` directory with per-module TypeScript files (enums, common, api, auth, product, stock, barcode, account, sale, dashboard, low-stock) and a barrel `index.ts`. Both client and server reference it via `file:../shared` in package.json. This ensures end-to-end type safety without publishing to a registry.

**Impact**: All client and server code must import shared types from `@shop/shared`. Future agents must extend existing type files rather than duplicating definitions.
nt.

## Prisma client output path: server/src/generated/prisma
**When**: 2026-07-24 10:34:52

Using a custom output path (`output = "../src/generated/prisma"`) instead of the default `node_modules/@prisma/client` location. This ensures the Prisma client (including platform-specific query engine binary) is generated into a predictable source-tree location, avoiding node_modules resolution issues with different package managers (Bun, npm) and making it Docker-friendly. The server dev script runs `prisma generate` before starting to ensure the correct platform binary exists in the container.

**Impact**: All server code imports PrismaClient from '../generated/prisma' (not '@prisma/client'). The generated directory is gitignored (server/src/generated/). Future agents working with Prisma must use this import path. Task 2 (full schema) will add models to the same schema.prisma and regenerate.

## Accounts: AES-256 credentials encryption and SELECT FOR UPDATE transaction locking
**When**: 2026-07-25 09:59:15

Implemented AES-256-CBC encryption for API credentials with developer fallbacks to maintain security while ensuring ease of local development. Used SELECT ... FOR UPDATE row locks in PostgreSQL transactions to guarantee atomicity and avoid balance concurrency race conditions. Applied consistent success API wrapping and ProtectedRoute restrictions to preserve security and API standard.

**Impact**: Account Management backend routing, service layer transaction handling, crypto helper utility, frontend accounts interface and routing

## Deployment: PM2 over Docker
**When**: 2026-07-26 02:39:29

User does not have administrative rights to configure Docker on their machine. PM2 provides a reliable, user-space process management alternative for running Node.js server and client applications locally, on a LAN, and in cloud environments without requiring root/docker access.

**Impact**: Deployment scripts, infrastructure setup, CI/CD pipeline, README documentation.
