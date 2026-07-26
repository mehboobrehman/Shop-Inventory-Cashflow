import axios from 'axios';
import { DashboardStats, SalesTrendData, Sale } from '@shop/shared';

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

/**
 * Fetch dashboard aggregate stats.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data.data;
};

/**
 * Fetch recent sales (last 10).
 */
export const getRecentSales = async (): Promise<Sale[]> => {
  const response = await api.get('/dashboard/recent-sales');
  return response.data.data;
};

/**
 * Fetch sales trend data for chart.
 * @param days - 7 or 30 (default 7)
 */
export const getSalesTrend = async (days: number = 7): Promise<SalesTrendData[]> => {
  const response = await api.get(`/dashboard/sales-trend?days=${days}`);
  return response.data.data;
};

export default {
  getDashboardStats,
  getRecentSales,
  getSalesTrend,
};