import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, StockMovementType } from '@shop/shared';
import * as productService from '../services/product';
import * as stockService from '../services/stock';
import { toast } from 'react-toastify';

interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  createdAt: Date | string;
  product?: {
    id: string;
    name: string;
    currentStock: number;
  };
}

export const StockManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Stock In / Adjustment Form States
  const [stockInQuantity, setStockInQuantity] = useState<number>(1);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stock-in' | 'adjust'>('stock-in');
  
  // History & Filters
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterType, setFilterType] = useState<StockMovementType | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reasonSearch, setReasonSearch] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch initial products and movements
  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.getProducts(undefined, undefined, 1, 100);
      setProducts(data.items || []);
      if (data.items && data.items.length > 0 && !selectedProductId) {
        setSelectedProductId(data.items[0].id);
      }
    } catch (err) {
      toast.error('Failed to fetch products');
    }
  }, [selectedProductId]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stockService.getStockMovements({
        productId: filterProductId || undefined,
        type: filterType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });

      let filtered = data || [];
      if (reasonSearch.trim()) {
        const query = reasonSearch.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            (m.reason && m.reason.toLowerCase().includes(query)) ||
            (m.reference && m.reference.toLowerCase().includes(query)) ||
            (m.product?.name && m.product.name.toLowerCase().includes(query))
        );
      }
      setMovements(filtered);
    } catch (err) {
      toast.error('Failed to fetch stock movements');
    } finally {
      setLoading(false);
    }
  }, [filterProductId, filterType, startDate, endDate, reasonSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Form Submissions
  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || stockInQuantity <= 0) {
      toast.error('Please select a product and enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await stockService.addStockIn(selectedProductId, stockInQuantity, reason || 'Restock Stock-In', user?.id);
      toast.success('Stock added successfully!');
      setReason('');
      setStockInQuantity(1);
      fetchMovements();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    setIsSubmitting(true);
    try {
      await stockService.adjustStock(selectedProductId, adjustQuantity, reason || 'Inventory Audit', user?.id);
      toast.success('Stock adjusted successfully!');
      setReason('');
      setAdjustQuantity(0);
      fetchMovements();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delta Indicator Badge Renderer
  const renderDeltaIndicator = (type: StockMovementType, qty: number) => {
    switch (type) {
      case StockMovementType.IN:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-green-100 text-green-800">
            +{qty} (In)
          </span>
        );
      case StockMovementType.OUT:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800">
            -{qty} (Out)
          </span>
        );
      case StockMovementType.ADJUSTMENT:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
            Δ {qty} (Adj)
          </span>
        );
      default:
        return <span className="font-bold text-gray-700">{qty}</span>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Stock Management & Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Perform stock adjustments, log stock-in operations, and monitor delta movements.
          </p>
        </div>
      </div>

      {/* Top Action Tabs Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex border-b border-gray-200 mb-6 space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('stock-in')}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
              activeTab === 'stock-in'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 Add Stock In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
              activeTab === 'adjust'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚡ Adjust Stock Level
          </button>
        </div>

        {/* Tab 1: Stock In */}
        {activeTab === 'stock-in' && (
          <form onSubmit={handleStockInSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="stockin-product" className="block text-xs font-semibold text-gray-700 mb-1">
                  Product
                </label>
                <select
                  id="stockin-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stockin-qty" className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity to Add (+)
                </label>
                <input
                  id="stockin-qty"
                  type="number"
                  min="1"
                  value={stockInQuantity}
                  onChange={(e) => setStockInQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="stockin-reason" className="block text-xs font-semibold text-gray-700 mb-1">
                  Movement Reason / Notes
                </label>
                <input
                  id="stockin-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. New Shipment received from vendor"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Adding Stock...' : 'Confirm Stock In'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Adjust */}
        {activeTab === 'adjust' && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="adjust-product" className="block text-xs font-semibold text-gray-700 mb-1">
                  Product
                </label>
                <select
                  id="adjust-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="adjust-qty" className="block text-xs font-semibold text-gray-700 mb-1">
                  New Stock Count
                </label>
                <input
                  id="adjust-qty"
                  type="number"
                  min="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="adjust-reason" className="block text-xs font-semibold text-gray-700 mb-1">
                  Adjustment Reason
                </label>
                <input
                  id="adjust-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Audit correction, Damaged stock"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Adjusting...' : 'Save Stock Adjustment'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Movement Filtering Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Filter Movement Audit Logs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Product Filter */}
          <div>
            <label htmlFor="filter-product" className="block text-xs text-gray-500 mb-1">Product</label>
            <select
              id="filter-product"
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-xl text-xs"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="filter-type" className="block text-xs text-gray-500 mb-1">Movement Type</label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as StockMovementType | '')}
              className="w-full p-2 border border-gray-300 rounded-xl text-xs"
            >
              <option value="">All Types (IN, OUT, ADJUST)</option>
              <option value={StockMovementType.IN}>IN (+)</option>
              <option value={StockMovementType.OUT}>OUT (-)</option>
              <option value={StockMovementType.ADJUSTMENT}>ADJUSTMENT (Δ)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="filter-start" className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              id="filter-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="filter-end" className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              id="filter-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>

          {/* Reason Search */}
          <div>
            <label htmlFor="filter-search" className="block text-xs text-gray-500 mb-1">Search Reason</label>
            <input
              id="filter-search"
              type="text"
              placeholder="Reason / Ref..."
              value={reasonSearch}
              onChange={(e) => setReasonSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Stock Movements Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Stock Movement History</h2>
          <span className="text-xs text-gray-500 font-medium">Showing {movements.length} log records</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading audit history...</div>
        ) : movements.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No stock movements found matching filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Delta Indicator</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      {m.product?.name || m.productId}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {renderDeltaIndicator(m.type, m.quantity)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-700 text-xs">
                      {m.reason ? (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md font-medium">
                          {m.reason}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs font-mono">
                      {m.reference || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagementPage;