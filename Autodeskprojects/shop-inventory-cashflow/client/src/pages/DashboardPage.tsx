import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getDashboardStats, getRecentSales, getSalesTrend } from '../services/dashboard';
import { getAccounts } from '../services/account';
import { useLowStock } from '../hooks/useLowStock';
import { DashboardStats, SalesTrendData, Sale, Account } from '@shop/shared';
import { SystemStatus } from '../components/SystemStatus';

// Format currency as PKR
const formatPKR = (amount: number): string => {
  return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date-time for recent sales
const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatter for items count/summary
const formatItemsSummary = (items: Sale['items']): string => {
  if (items.length === 0) return 'No items';
  const productCounts = items.map(item => `${item.productName} (${item.quantity})`);
  return productCounts.join(', ');
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [trendData, setTrendData] = useState<SalesTrendData[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [trendDays, setTrendDays] = useState<number>(7);

  const { lowStock, isLoading: lowStockLoading } = useLowStock();

  // Fetchers
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchRecentSales = useCallback(async () => {
    try {
      setLoadingSales(true);
      const data = await getRecentSales();
      setRecentSales(data);
    } catch (error) {
      toast.error('Failed to load recent sales');
    } finally {
      setLoadingSales(false);
    }
  }, []);

  const fetchTrend = useCallback(async (days: number = 7) => {
    try {
      setLoadingTrend(true);
      const data = await getSalesTrend(days);
      setTrendData(data);
    } catch (error) {
      toast.error('Failed to load sales trend');
    } finally {
      setLoadingTrend(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Change trend days
  const handleTrendDaysChange = (days: number) => {
    setTrendDays(days);
    fetchTrend(days);
  };

  // Initial data fetch
  useEffect(() => {
    fetchStats();
    fetchRecentSales();
    fetchTrend(7);
    fetchAccounts();
  }, [fetchStats, fetchRecentSales, fetchTrend, fetchAccounts]);

  // Loading state for entire page? We'll show each section with its own loading.

  return (
    <div className="min-h-screen bg-gray-100 ml-64 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your shop inventory and sales</p>
          </div>
          <SystemStatus />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                {loadingStats ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse mt-1 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts ?? 0}</p>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Stock Value */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
                {loadingStats ? (
                  <div className="h-8 w-32 bg-gray-200 animate-pulse mt-1 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{formatPKR(stats?.totalStockValue ?? 0)}</p>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Today's Sales */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Sales</p>
                {loadingStats ? (
                  <div className="space-y-1">
                    <div className="h-8 w-32 bg-gray-200 animate-pulse mt-1 rounded"></div>
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{formatPKR(stats?.todaySalesTotal ?? 0)}</p>
                    <p className="text-xs text-gray-500">{stats?.todaySalesCount ?? 0} transactions</p>
                  </>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Cash in Hand */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cash in Hand</p>
                {loadingStats ? (
                  <div className="h-8 w-32 bg-gray-200 animate-pulse mt-1 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{formatPKR(stats?.totalAccountBalance ?? 0)}</p>
                )}
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                {lowStockLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse mt-1 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{lowStock.count}</p>
                )}
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Account Balances */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Balances</h2>
          {loadingAccounts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 w-24 bg-gray-200 animate-pulse mb-3 rounded"></div>
                  <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <div key={account.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                      {account.type}
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">{formatPKR(account.currentBalance)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales Trend Chart and Recent Sales (side-by-side on large screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Sales Trend</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTrendDaysChange(7)}
                  className={`px-3 py-1 text-sm rounded-full ${trendDays === 7 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => handleTrendDaysChange(30)}
                  className={`px-3 py-1 text-sm rounded-full ${trendDays === 30 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  30 Days
                </button>
              </div>
            </div>
            {loadingTrend ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `PKR ${value}`} />
                  <Tooltip
                    formatter={(value) => [formatPKR(value as number), 'Total Sales']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Sales Total" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sales</h2>
            {loadingSales ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                ))}
              </div>
            ) : recentSales.length === 0 ? (
              <p className="text-gray-500">No sales recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatDateTime(sale.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatItemsSummary(sale.items)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatPKR(sale.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Low Stock Alerts</h2>
            <button
              onClick={() => navigate('/products')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Products
            </button>
          </div>
          {lowStockLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          ) : lowStock.products.length === 0 ? (
            <p className="text-gray-500">No low-stock products. Great job!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Limit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deficit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStock.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.currentStock}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.minStockLimit}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">
                        {Math.max(0, product.minStockLimit - product.currentStock)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            navigate('/products');
                            toast.info(`Find "${product.name}" to restock.`);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;