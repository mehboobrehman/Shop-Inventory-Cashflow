import { StockMovementType } from './enums';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  createdAt: Date;
  product?: {
    id: string;
    name: string;
    currentStock: number;
  };
}

export interface StockAdjustment {
  productId: string;
  newQuantity: number;
  reason?: string;
  userId: string;
}

export interface StockIn {
  productId: string;
  quantity: number;
  reason?: string;
  userId: string;
}

export interface StockInDTO {
  productId: string;
  quantity: number;
  reason?: string;
  userId: string;
}

export interface StockAdjustmentDTO {
  productId: string;
  newQuantity: number;
  reason?: string;
  userId: string;
}

export interface StockMovementQueryParams {
  productId?: string;
  type?: StockMovementType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}
