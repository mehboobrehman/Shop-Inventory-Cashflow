"use strict";
/**
 * Barrel export — re-exports all shared types, enums, and contracts.
 * Import from `@shop/shared` or relative path to this index.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementType = exports.UserRole = exports.TransactionSource = exports.TransactionType = exports.AccountType = void 0;
// Enums
var enums_1 = require("./enums");
Object.defineProperty(exports, "AccountType", { enumerable: true, get: function () { return enums_1.AccountType; } });
Object.defineProperty(exports, "TransactionType", { enumerable: true, get: function () { return enums_1.TransactionType; } });
Object.defineProperty(exports, "TransactionSource", { enumerable: true, get: function () { return enums_1.TransactionSource; } });
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return enums_1.UserRole; } });
Object.defineProperty(exports, "StockMovementType", { enumerable: true, get: function () { return enums_1.StockMovementType; } });
//# sourceMappingURL=index.js.map