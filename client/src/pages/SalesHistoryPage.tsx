import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Sale, PaginatedData, AccountType } from '@shop/shared';
import { getSales } from '../services/sale';

const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch sales data
  const fetchSales = useCallback(async (pageNum: number = 1) => {
    setIsLoading(true);
    try {
      const data: PaginatedData<Sale> = await getSales({
        from: fromDate || undefined,
        to: toDate || undefined,
        search: search || undefined,
        page: pageNum,
        limit: pagination.limit || 20,
      });
      setSales(data.items);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch sales history');
    } finally {
      setIsLoading(false);
    }
  }, [search, fromDate, toDate, pagination.limit]);

  // Initial load and when filters change
  useEffect(() => {
    fetchSales(1);
  }, [fetchSales]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // When search changes, go to page 1
      if (search !== undefined) {
        fetchSales(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, fetchSales]);

  const toggleRowExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toFixed(2)}`;
  };

  const getAccountDisplay = (accountId: string | null, accountType: AccountType | null) => {
    if (!accountId) return 'Cash / N/A';
    return accountType || 'Unknown';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <Link to="/barcode-scan" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Record New Sale
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product name..."
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date From */}
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => {
                setSearch('');
                setFromDate('');
                setToDate('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading sales...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-10 bg-white rounded shadow">
          <p className="text-gray-500">No sales found matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left"></th>
                <th className="py-3 px-4 border-b text-left">Date</th>
                <th className="py-3 px-4 border-b text-right">Items</th>
                <th className="py-3 px-4 border-b text-right">Total</th>
                <th className="py-3 px-4 border-b text-left">Account</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const isExpanded = expandedRows.has(sale.id);
                return (
                  <React.Fragment key={sale.id}>
                    <tr
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRowExpansion(sale.id)}
                    >
                      <td className="py-3 px-4 border-b text-center">
                        <button className="text-gray-500 focus:outline-none">
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="py-3 px-4 border-b">{formatDate(sale.createdAt)}</td>
                      <td className="py-3 px-4 border-b text-right">{sale.itemCount}</td>
                      <td className="py-3 px-4 border-b text-right font-medium">{formatCurrency(sale.totalAmount)}</td>
                      <td className="py-3 px-4 border-b">{getAccountDisplay(sale.accountId, sale.accountType)}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-0 border-b bg-gray-50">
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 text-gray-700">Sale Items</h3>
                            <table className="min-w-full border">
                              <thead className="bg-gray-200">
                                <tr>
                                  <th className="py-2 px-3 text-left">Product</th>
                                  <th className="py-2 px-3 text-right">Quantity</th>
                                  <th className="py-2 px-3 text-right">Unit Price</th>
                                  <th className="py-2 px-3 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sale.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="py-2 px-3">{item.productName}</td>
                                    <td className="py-2 px-3 text-right">{item.quantity}</td>
                                    <td className="py-2 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-2 px-3 text-right font-semibold">{formatCurrency(item.lineTotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing page {pagination.page} of {pagination.totalPages} (Total: {pagination.total} sales)
          </div>
          <div className="space-x-2">
            <button
              onClick={() => fetchSales(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchSales(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
