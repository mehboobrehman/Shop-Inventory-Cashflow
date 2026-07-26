// @ts-ignore - axios types issue with Bun
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Product } from '@shop/shared';

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

interface LowStockResponse {
  products: Product[];
  count: number;
}

export function useLowStock() {
  const [lowStock, setLowStock] = useState<LowStockResponse>({
    products: [],
    count: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStock = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/dashboard/low-stock');
      setLowStock(response.data.data);
    } catch (err) {
      console.error('Error fetching low-stock products:', err);
      setError('Failed to fetch low-stock products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  return {
    lowStock,
    isLoading,
    error,
    refetch: fetchLowStock,
  };
}