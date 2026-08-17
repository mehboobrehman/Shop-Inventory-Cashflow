import axios from 'axios';
import { Sale, CreateSaleDTO, PaginatedData } from '@shop/shared';

// Create axios instance with auth interceptor (shared pattern)
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

/**
 * Create a new sale.
 * Deducts stock automatically and optionally deposits to an account.
 */
export const createSale = async (saleData: CreateSaleDTO): Promise<Sale> => {
  const response = await api.post('/sales', saleData);
  return response.data.data;
};

/**
 * Get paginated sales history with optional filters.
 */
export const getSales = async (params?: {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedData<Sale>> => {
  const queryParams = new URLSearchParams();
  if (params) {
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
  }
  const response = await api.get(`/sales?${queryParams.toString()}`);
  return response.data.data;
};

/**
 * Get a single sale by ID with full item details.
 */
export const getSaleById = async (id: string): Promise<Sale> => {
  const response = await api.get(`/sales/${id}`);
  return response.data.data;
};

export default {
  createSale,
  getSales,
  getSaleById,
};
