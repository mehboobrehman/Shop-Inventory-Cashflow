import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/product';
import { adjustStock } from '../services/stock';
import { Product } from '@shop/shared';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Product Form State & Errors
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    salePrice: '',
    currentStock: '',
    minStockLimit: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const isLowStockQuery = stockFilter === 'LOW_STOCK' ? true : undefined;
      const data = await getProducts(search || undefined, isLowStockQuery, page, limit);
      
      let items = data.items || [];
      // Client-side stock status filter refinement
      if (stockFilter === 'IN_STOCK') {
        items = items.filter((p) => p.currentStock > p.minStockLimit);
      } else if (stockFilter === 'OUT_OF_STOCK') {
        items = items.filter((p) => p.currentStock <= 0);
      } else if (stockFilter === 'LOW_STOCK') {
        items = items.filter((p) => p.currentStock <= p.minStockLimit && p.currentStock > 0);
      }

      setProducts(items);
      if (data.pagination) {
        setPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [search, stockFilter, page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    const salePriceNum = parseFloat(formData.salePrice);
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
      errors.salePrice = 'Selling price must be a number greater than 0';
    }
    const currentStockNum = parseInt(formData.currentStock, 10);
    if (isNaN(currentStockNum) || currentStockNum < 0) {
      errors.currentStock = 'Current stock must be a non-negative integer';
    }
    const minStockNum = parseInt(formData.minStockLimit, 10);
    if (isNaN(minStockNum) || minStockNum < 0) {
      errors.minStockLimit = 'Min stock limit must be a non-negative integer';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setCurrentProduct(null);
    setFormData({
      name: '',
      barcode: '',
      salePrice: '',
      currentStock: '0',
      minStockLimit: '5',
    });
    setFormErrors({});
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      salePrice: product.salePrice.toString(),
      currentStock: product.currentStock.toString(),
      minStockLimit: product.minStockLimit.toString(),
    });
    setFormErrors({});
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmittingProduct(true);
    try {
      const payload = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || null,
        salePrice: parseFloat(formData.salePrice),
        currentStock: parseInt(formData.currentStock, 10),
        minStockLimit: parseInt(formData.minStockLimit, 10),
      };

      if (currentProduct) {
        await updateProduct(currentProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload);
        toast.success('Product created successfully');
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  // Quick Stock Adjustment
  const handleOpenAdjustStock = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustNewStock(product.currentStock);
    setAdjustReason('Quick inventory audit adjustment');
    setIsSubmittingAdjust(false);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (adjustNewStock < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      await adjustStock(adjustingProduct.id, adjustNewStock, adjustReason, user?.id);
      toast.success(`Stock for "${adjustingProduct.name}" updated to ${adjustNewStock}`);
      setAdjustingProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to adjust stock');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Stock Badge Render helper
  const renderStockBadge = (product: Product) => {
    if (product.currentStock <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
          Out of Stock
        </span>
      );
    }
    if (product.currentStock <= product.minStockLimit) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1.5 animate-pulse"></span>
          Low Stock ({product.currentStock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
        In Stock
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Inventory & Product Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage product catalog, prices, minimum stock thresholds, and quick stock updates.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
        >
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search name or barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* Stock Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((filter) => {
            const labels = {
              ALL: 'All Items',
              IN_STOCK: 'In Stock',
              LOW_STOCK: 'Low Stock',
              OUT_OF_STOCK: 'Out of Stock',
            };
            return (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setStockFilter(filter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  stockFilter === filter
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <span>Loading product inventory...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-base font-semibold text-gray-700">No products found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting search or click "+ Add Product" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Barcode</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Sale Price</th>
                  <th className="py-3.5 px-4 text-center">Stock / Min</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {product.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                      {product.barcode || <span className="text-gray-400 font-sans italic">None</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStockBadge(product)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                      PKR {Number(product.salePrice).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-gray-900">{product.currentStock}</span>
                      <span className="text-xs text-gray-400 font-normal"> / {product.minStockLimit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAdjustStock(product)}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="Quick Stock Adjustment"
                      >
                        ⚡ Adjust
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(product)}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-600">
            <span>Page {page} of {pagination.totalPages}</span>
            <div className="space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Add / Edit Product Form */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {currentProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Milk 1L Pack"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Barcode / EAN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 890123456789"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Selling Price (PKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {formErrors.salePrice && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.salePrice}</p>
                )}
              </div>

              {/* Stock and Min Limit Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {formErrors.currentStock && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.currentStock}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Min Stock Threshold *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockLimit}
                    onChange={(e) => setFormData({ ...formData, minStockLimit: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {formErrors.minStockLimit && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.minStockLimit}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmittingProduct ? 'Saving...' : currentProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Stock Adjustment Dialog */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ⚡ Quick Stock Adjustment
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Update inventory level for <strong>{adjustingProduct.name}</strong>.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Absolute Stock Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-base font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Audit, Restock, Damage"
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;