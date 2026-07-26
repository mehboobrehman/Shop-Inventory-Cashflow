import axios from 'axios';
import { Product, CreateProductDTO, UpdateProductDTO, PaginatedData } from '@shop/shared';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getProducts = async (search?: string, lowStock?: boolean, page?: number, limit?: number): Promise<PaginatedData<Product>> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (lowStock) params.append('lowStock', 'true');
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  
  const response = await api.get(`/products?${params.toString()}`);
  return response.data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data.data;
};

export const getProductByBarcode = async (barcode: string): Promise<Product> => {
  const response = await api.get(`/products/barcode/${encodeURIComponent(barcode)}`);
  return response.data.data;
};

export const createProduct = async (product: CreateProductDTO): Promise<Product> => {
  const response = await api.post('/products', product);
  return response.data.data;
};

export const updateProduct = async (id: string, product: UpdateProductDTO): Promise<Product> => {
  const response = await api.put(`/products/${id}`, product);
  return response.data.data;
};

export const deleteProduct = async (id: string): Promise<Product> => {
  const response = await api.delete(`/products/${id}`);
  return response.data.data;
};