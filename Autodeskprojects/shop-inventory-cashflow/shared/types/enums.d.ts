/**
 * Shared enumerations used across client and server.
 *
 * Convention: string-based enums so Prisma, JSON API responses, and
 * TypeScript all use identical values (no numeric mismatch).
 */
/** Financial account providers supported by the system. */
export declare enum AccountType {
    JAZZCASH = "JAZZCASH",
    EASYPISA = "EASYPISA",
    BANK = "BANK"
}
/** Direction of money flow for an account transaction. */
export declare enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL"
}
/** User authorization roles (RBAC). */
export declare enum UserRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    CASHIER = "CASHIER"
}
/** How an account transaction was created. */
export declare enum TransactionSource {
    MANUAL = "MANUAL",// User-entered deposit/withdrawal
    SALE = "SALE",// Automatically created from a sale
    AUTO_SYNC = "AUTO_SYNC"
}
/** Type of stock movement. */
export declare enum StockMovementType {
    IN = "IN",
    OUT = "OUT",
    ADJUSTMENT = "ADJUSTMENT"
}
//# sourceMappingURL=enums.d.ts.map