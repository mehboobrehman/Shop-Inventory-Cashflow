"use strict";
/**
 * Shared enumerations used across client and server.
 *
 * Convention: string-based enums so Prisma, JSON API responses, and
 * TypeScript all use identical values (no numeric mismatch).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSource = exports.UserRole = exports.TransactionType = exports.AccountType = void 0;
/** Financial account providers supported by the system. */
var AccountType;
(function (AccountType) {
    AccountType["JAZZCASH"] = "JAZZCASH";
    AccountType["EASYPISA"] = "EASYPISA";
    AccountType["BANK"] = "BANK";
})(AccountType || (exports.AccountType = AccountType = {}));
/** Direction of money flow for an account transaction. */
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
/** User authorization roles (RBAC). */
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["CASHIER"] = "CASHIER";
})(UserRole || (exports.UserRole = UserRole = {}));
/** How an account transaction was created. */
var TransactionSource;
(function (TransactionSource) {
    TransactionSource["MANUAL"] = "MANUAL";
    TransactionSource["SALE"] = "SALE";
    TransactionSource["AUTO_SYNC"] = "AUTO_SYNC";
})(TransactionSource || (exports.TransactionSource = TransactionSource = {}));
//# sourceMappingURL=enums.js.map