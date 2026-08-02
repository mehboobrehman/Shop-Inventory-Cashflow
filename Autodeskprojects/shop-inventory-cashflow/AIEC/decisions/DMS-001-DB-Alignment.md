# DMS-001: Database Alignment - Reversion to SQLite

**Date**: 2026-08-01
**Status**: Superceded (Reverted)

## Context
The project was previously moved to PostgreSQL, but due to machine constraints (lack of administrative rights to run PostgreSQL/Docker), it has been reverted to SQLite for local development and LAN deployment.

## Decision
Revert the Prisma datasource provider from `postgresql` back to `sqlite` and update the environment configuration to support a local file-based database.

## Implementation Details
1.  **Schema Reversion**: Modified `server/prisma/schema.prisma` to change the `datasource db` provider back to `sqlite` and used `file:./dev.db` for the connection string.
2.  **Environment Configuration**: Updated `server/src/config/env.ts` to allow an optional `DATABASE_URL` with a default pointing to the local SQLite file (`file:./dev.db`).
3.  **Client Regeneration**: Ran `npx prisma generate` to update the Prisma client for the SQLite provider.
4.  **Database Migration**: Ran `npx prisma migrate dev` to initialize the local SQLite database.

## Verification
- `npx prisma generate` succeeded and targets `sqlite`.
- Backend endpoints (/health, /auth/me) verified to work with SQLite.

## Impact
- Local development no longer requires a PostgreSQL instance or Docker.
- Database is stored locally in `server/prisma/dev.db`.
- PM2 deployment is now compatible with the current user's system permissions.

