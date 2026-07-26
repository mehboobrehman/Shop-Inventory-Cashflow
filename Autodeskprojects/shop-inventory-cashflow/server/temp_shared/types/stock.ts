import { ISODateString, UUID } from './common';

/** Type of stock movement recorded in the audit trail. */
export enum StockMovementType {
  IN = 'IN',           // Stock added (restock)
  OUT = 'OUT',         // Stock removed (sale or manual removal)
  ADJUSTMENT = 'ADJUSTMENT', // Correction entry
}

/** Record of a single stock change for audit trail. */
export interface StockMovement {
  id: UUID;
  productId: UUID;
  /** Always positive. Direction conveyed by `type` (IN/OUT/ADJUSTMENT). */
  quantity: number;
  type: StockMovementType;
  /** Human-readable reason for the movement. */
  reason: string | null;
  /** Machine reference, e.g. "SALE:<saleId>" or "MANUAL_IN". */
  reference: string | null;
  createdAt: ISODateString;
}

/** DTO for adding stock (stock-in). */
export interface StockInDTO {
  productId: UUID;
  quantity: number;
  reason?: string;
}

/** DTO for adjusting stock (correction). */
export interface StockAdjustmentDTO {
  productId: UUID;
  /** Net change (positive or negative). */
  quantityChange: number;
  reason?: string;
}

/** Query parameters for stock movement history. */
export interface StockMovementQueryParams {
  productId?: UUID;
  type?: StockMovementType;
  startDate?: ISODateString;
  endDate?: ISODateString;
  page?: number;
  limit?: number;
}
