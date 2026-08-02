/**
 * Barrel export — re-exports all shared types, enums, and contracts.
 * Import from `@shop/shared` or relative path to this index.
 */
export { AccountType, TransactionType, TransactionSource, UserRole, StockMovementType } from './enums';
export type { ISODateString, UUID, Money, PaginationParams, PaginationMeta, PaginatedData, } from './common';
export type { ApiError, ApiResponse, ApiPaginatedResponse } from './api';
export type { User, LoginRequest, RegisterRequest, LoginResponse, JWTPayload, } from './auth';
export type { Product, CreateProductDTO, UpdateProductDTO, ProductQueryParams, } from './product';
export type { StockMovement, StockIn, StockAdjustment, StockInDTO, StockAdjustmentDTO, StockMovementQueryParams, } from './stock';
export type { BarcodeScanResult } from './barcode';
export type { Account, CreateAccountDTO, UpdateAccountDTO, DepositDTO, WithdrawalDTO, AccountTransaction, AccountTransactionQueryParams, } from './account';
export type { Sale, SaleItem, CreateSaleItemDTO, CreateSaleDTO, SaleQueryParams, } from './sale';
export type { LowStockAlert } from './low-stock';
export type { AccountBalanceSummary, DashboardSummary, DashboardStats, SalesTrendData, } from './dashboard';
//# sourceMappingURL=index.d.ts.map