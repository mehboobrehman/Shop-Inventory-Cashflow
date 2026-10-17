import apiClient from './apiClient';
import { Product, CreateProductDTO, UpdateProductDTO, PaginatedData } from '@shop/shared';

export const getProducts = async (search?: string, lowStock?: boolean, page?: number, limit?: number): Promise<PaginatedData<Product>> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (lowStock) params.append('lowStock', 'true');
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/products?${params.toString()}`);
  return response.data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data.data;
};

export const getProductByBarcode = async (barcode: string): Promise<Product> => {
  const response = await apiClient.get(`/products/barcode/${encodeURIComponent(barcode)}`);
  return response.data.data;
};

export const createProduct = async (product: CreateProductDTO): Promise<Product> => {
  const response = await apiClient.post('/products', product);
  return response.data.data;
};

export const updateProduct = async (id: string, product: UpdateProductDTO): Promise<Product> => {
  const response = await apiClient.put(`/products/${id}`, product);
  return response.data.data;
};

export const deleteProduct = async (id: string): Promise<Product> => {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data.data;
};
