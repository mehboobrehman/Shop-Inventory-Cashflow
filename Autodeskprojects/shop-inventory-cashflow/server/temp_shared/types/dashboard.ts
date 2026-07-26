import { AccountType } from './enums';
import { Money, UUID } from './common';
import { LowStockAlert } from './low-stock';
import { Sale } from './sale';

/** Balance summary for a single account shown on the dashboard. */
export interface AccountBalanceSummary {
  accountId: UUID;
  type: AccountType;
  name: string;
  currentBalance: Money;
}

/** Aggregate statistics for the dashboard overview. */
export interface DashboardSummary {
  totalProducts: number;
  totalStockUnits: number;
  /** Estimated retail value of all stock on hand (sum of salePrice × stock). */
  stockValue: Money;
  lowStockCount: number;
  /** Total sales amount for the current day. */
  todaySalesTotal: Money;
  todaySalesCount: number;
  recentSales: Sale[];
  lowStockAlerts: LowStockAlert[];
  accountBalances: AccountBalanceSummary[];
}
