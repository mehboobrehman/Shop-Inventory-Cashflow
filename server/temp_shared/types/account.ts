import { AccountType, TransactionType } from './enums';
import { ISODateString, Money, UUID } from './common';

/** Financial account (JazzCash, Easypaisa, or Bank). */
export interface Account {
  id: UUID;
  type: AccountType;
  name: string;
  currentBalance: Money;
  /** Whether automatic Merchant API sync is enabled. */
  autoSyncEnabled: boolean;
  lastSyncAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Payload for creating a new account. */
export interface CreateAccountDTO {
  type: AccountType;
  name: string;
  initialBalance?: Money;
}

/** Payload for updating account settings. */
export interface UpdateAccountDTO {
  name?: string;
  autoSyncEnabled?: boolean;
}

/** DTO for recording a manual deposit. */
export interface DepositDTO {
  amount: Money;
  description?: string;
}

/** DTO for recording a manual withdrawal. */
export interface WithdrawalDTO {
  amount: Money;
  description?: string;
}

/** A single deposit or withdrawal on an account. */
export interface AccountTransaction {
  id: UUID;
  accountId: UUID;
  type: TransactionType;
  amount: Money;
  /** Account balance immediately before this transaction. */
  balanceBefore: Money;
  /** Account balance immediately after this transaction. */
  balanceAfter: Money;
  description: string | null;
  /** Linked sale ID if this transaction originated from a sale. */
  saleId: UUID | null;
  createdAt: ISODateString;
}

/** Query parameters for account transaction history. */
export interface AccountTransactionQueryParams {
  type?: TransactionType;
  startDate?: ISODateString;
  endDate?: ISODateString;
  page?: number;
  limit?: number;
}
