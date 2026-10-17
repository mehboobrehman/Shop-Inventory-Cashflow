import apiClient from './apiClient';
import { DashboardStats, LowStockAlert, SalesTrendData, Sale } from '@shop/shared';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data.data;
};

export const getLowStockItems = async (): Promise<LowStockAlert[]> => {
  const response = await apiClient.get('/dashboard/low-stock');
  return response.data.data;
};

export const getCashflowSummary = async (days = 30): Promise<SalesTrendData[]> => {
  const response = await apiClient.get('/dashboard/cashflow', { params: { days } });
  return response.data.data;
};

export const getRecentSales = async (limit = 10): Promise<Sale[]> => {
  const response = await apiClient.get('/dashboard/recent-sales', { params: { limit } });
  return response.data.data;
};

export const getSalesTrend = async (days = 7): Promise<SalesTrendData[]> => {
  const response = await apiClient.get('/dashboard/sales-trend', { params: { days } });
  return response.data.data;
};

export default {
  getDashboardStats,
  getLowStockItems,
  getCashflowSummary,
  getRecentSales,
  getSalesTrend,
};
