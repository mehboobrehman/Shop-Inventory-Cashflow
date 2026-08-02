import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, StockMovementType } from '@shop/shared';
import * as productService from '../services/product';
import * as stockService from '../services/stock';

// Local type definitions to avoid dependency on compiled shared types
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
  const [stockInQuantity, setStockInQuantity] = useState<number>(1);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stock-in' | 'adjust'>('stock-in');

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts(undefined, undefined, 1, 100);
        setProducts(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelectedProductId(data.items[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    const fetchMovements = async () => {
      try {
        setLoading(true);
        const data = await stockService.getStockMovements({ limit: 50 });
        setMovements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stock movements');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchMovements();
  }, []);

  // Fetch movements when filters change
  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        const data = await stockService.getStockMovements({ 
          productId: selectedProductId || undefined,
          limit: 50 
        });
        setMovements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stock movements');
      } finally {
        setLoading(false);
      }
    };

    if (selectedProductId) {
      fetchMovements();
    }
  }, [selectedProductId]);

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedProductId || stockInQuantity <= 0) {
      setError('Please select a product and enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      await stockService.addStockIn(selectedProductId, stockInQuantity, reason || undefined, user?.id);
      setSuccess('Stock added successfully!');
      setReason('');
      setStockInQuantity(1);
      
      // Refresh movements
      const data = await stockService.getStockMovements({ 
        productId: selectedProductId || undefined,
        limit: 50 
      });
      setMovements(data);
      
      // Refresh products to get updated stock
      const productsData = await productService.getProducts(undefined, undefined, 1, 100);
      setProducts(productsData.items || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      await stockService.adjustStock(selectedProductId, adjustQuantity, reason || undefined, user?.id);
      setSuccess('Stock adjusted successfully!');
      setReason('');
      setAdjustQuantity(0);
      
      // Refresh movements
      const data = await stockService.getStockMovements({ 
        productId: selectedProductId || undefined,
        limit: 50 
      });
      setMovements(data);
      
      // Refresh products to get updated stock
      const productsData = await productService.getProducts(undefined, undefined, 1, 100);
      setProducts(productsData.items || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeColor = (type: StockMovementType) => {
    switch (type) {
      case StockMovementType.IN:
        return 'bg-green-100 text-green-800';
      case StockMovementType.OUT:
        return 'bg-red-100 text-red-800';
      case StockMovementType.ADJUSTMENT:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    }
    return date.toLocaleString();
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
          <div className="text-sm text-gray-600">
            User: {user?.name || 'Unknown'}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('stock-in')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'stock-in' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Stock In
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'adjust' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Adjust Stock
            </button>
          </div>

          {activeTab === 'stock-in' && (
            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Stock In</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    id="product"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Current: {product.currentStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to Add
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    value={stockInQuantity}
                    onChange={(e) => setStockInQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Stock In'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'adjust' && (
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adjust Stock</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="adjust-product" className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    id="adjust-product"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Current: {product.currentStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="new-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    New Quantity
                  </label>
                  <input
                    id="new-quantity"
                    type="number"
                    min="0"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="adjust-reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="adjust-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adjusting...' : 'Adjust Stock'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock Movement History</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No stock movements found
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(movement.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {movement.product?.name || movement.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                          {movement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {movement.reason || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {movement.reference || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagementPage;
