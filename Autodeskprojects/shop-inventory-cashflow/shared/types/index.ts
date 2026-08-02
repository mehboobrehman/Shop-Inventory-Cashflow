/**
 * Barrel export — re-exports all shared types, enums, and contracts.
 * Import from `@shop/shared` or relative path to this index.
 */

// Enums
export { AccountType, TransactionType, TransactionSource, UserRole, StockMovementType } from './enums';

// Common primitives
export type {
  ISODateString,
  UUID,
  Money,
  PaginationParams,
  PaginationMeta,
  PaginatedData,
} from './common';

// API envelope
export type { ApiError, ApiResponse, ApiPaginatedResponse } from './api';

// Auth
export type {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  JWTPayload,
} from './auth';

// Products
export type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductQueryParams,
} from './product';

// Stock
export type {
  StockMovement,
  StockIn,
  StockAdjustment,
  StockInDTO,
  StockAdjustmentDTO,
  StockMovementQueryParams,
} from './stock';

// Barcode
export type { BarcodeScanResult } from './barcode';

// Accounts
export type {
  Account,
  CreateAccountDTO,
  UpdateAccountDTO,
  DepositDTO,
  WithdrawalDTO,
  AccountTransaction,
  AccountTransactionQueryParams,
} from './account';

// Sales
export type {
  Sale,
  SaleItem,
  CreateSaleItemDTO,
  CreateSaleDTO,
  SaleQueryParams,
} from './sale';

// Low Stock
export type { LowStockAlert } from './low-stock';

// Dashboard
export type {
  AccountBalanceSummary,
  DashboardSummary,
  DashboardStats,
  SalesTrendData,
} from './dashboard';
