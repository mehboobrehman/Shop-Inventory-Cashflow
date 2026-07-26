/**
 * Shared enumerations used across client and server.
 *
 * Convention: string-based enums so Prisma, JSON API responses, and
 * TypeScript all use identical values (no numeric mismatch).
 */

/** Financial account providers supported by the system. */
export enum AccountType {
  JAZZCASH = 'JAZZCASH',
  EASYPISA = 'EASYPISA',
  BANK = 'BANK',
}

/** Direction of money flow for an account transaction. */
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

/** User authorization roles (RBAC). */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

/** How an account transaction was created. */
export enum TransactionSource {
  MANUAL = 'MANUAL',       // User-entered deposit/withdrawal
  SALE = 'SALE',           // Automatically created from a sale
  AUTO_SYNC = 'AUTO_SYNC', // Created via Merchant API sync
}
