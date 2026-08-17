import { AccountType } from './enums';
import { ISODateString, Money, UUID } from './common';

/** Individual line item within a sale. */
export interface SaleItem {
  id: UUID;
  saleId: UUID;
  productId: UUID;
  productName: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

/** A complete sale record (header + items). */
export interface Sale {
  id: UUID;
  /** User who processed the sale. */
  userId: UUID;
  items: SaleItem[];
  totalAmount: Money;
  itemCount: number;
  /** Account the sale proceeds were deposited into (null for cash/unassigned). */
  accountId: UUID | null;
  accountType: AccountType | null;
  createdAt: ISODateString;
}

/** Item in a create-sale request (productId + quantity). */
export interface CreateSaleItemDTO {
  productId: UUID;
  quantity: number;
}

/** Payload for creating a new sale. */
export interface CreateSaleDTO {
  items: CreateSaleItemDTO[];
  /** Optional account to deposit sale proceeds. */
  accountId?: UUID | null;
}

/** Query parameters for sales history. */
export interface SaleQueryParams {
  startDate?: ISODateString;
  endDate?: ISODateString;
  search?: string;
  page?: number;
  limit?: number;
}
