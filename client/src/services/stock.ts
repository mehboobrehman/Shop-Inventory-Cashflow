import apiClient from './apiClient';
import { StockMovement, StockMovementType } from '@shop/shared';

interface StockInPayload {
  productId: string;
  quantity: number;
  reason?: string;
  userId: string;
}

interface StockAdjustmentPayload {
  productId: string;
  newQuantity: number;
  reason?: string;
  userId: string;
}

interface StockMovementFilters {
  productId?: string;
  type?: StockMovementType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export const addStockIn = async (
  productId: string,
  quantity: number,
  reason?: string,
  userId?: string
): Promise<{ movement: StockMovement; product: any }> => {
  const payload: StockInPayload = {
    productId,
    quantity,
    reason,
    userId: userId || '',
  };
  
  const response = await apiClient.post('/stock/in', payload);
  return response.data.data;
};

export const adjustStock = async (
  productId: string,
  newQuantity: number,
  reason?: string,
  userId?: string
): Promise<{ movement: StockMovement; product: any }> => {
  const payload: StockAdjustmentPayload = {
    productId,
    newQuantity,
    reason,
    userId: userId || '',
  };
  
  const response = await apiClient.post('/stock/adjust', payload);
  return response.data.data;
};

export const getStockMovements = async (
  filters?: StockMovementFilters
): Promise<StockMovement[]> => {
  const params: any = {};
  if (filters?.productId) params.productId = filters.productId;
  if (filters?.type) params.type = filters.type;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.limit) params.limit = filters.limit;
  if (filters?.skip) params.skip = filters.skip;
  
  const response = await apiClient.get('/stock/movements', { params });
  return response.data.data;
};

export default {
  addStockIn,
  adjustStock,
  getStockMovements,
};
