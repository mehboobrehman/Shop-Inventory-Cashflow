import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/product';
import { Product } from '@shop/shared';

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '' as string | null,
    salePrice: 0,
    currentStock: 0,
    minStockLimit: 0,
  });
  
  useEffect(() => {
    fetchProducts();
  }, [search, page, limit]);
  
  const fetchProducts = async () => {
    try {
      const data = await getProducts(search, undefined, page, limit);
      setProducts(data.items || data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await updateProduct(currentProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(formData);
        toast.success('Product created successfully');
      }
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };
  
  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      salePrice: product.salePrice,
      currentStock: product.currentStock,
      minStockLimit: product.minStockLimit,
    });
    setIsEditModalOpen(true);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search by name or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={() => {
            setCurrentProduct(null);
            setFormData({
              name: '',
              barcode: '',
              salePrice: 0,
              currentStock: 0,
              minStockLimit: 0,
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Product
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Barcode</th>
              <th className="py-2 px-4 border">Sale Price</th>
              <th className="py-2 px-4 border">Current Stock</th>
              <th className="py-2 px-4 border">Min Limit</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="py-2 px-4 border">{product.name}</td>
                <td className="py-2 px-4 border">{product.barcode}</td>
                <td className="py-2 px-4 border">{product.salePrice}</td>
                <td className="py-2 px-4 border">{product.currentStock}</td>
                <td className="py-2 px-4 border">{product.minStockLimit}</td>
                <td className="py-2 px-4 border">
                  {product.currentStock <= product.minStockLimit && product.minStockLimit > 0 && product.isActive && (
                    <span className="text-red-500 mr-2">⚠️</span>
                  )}
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this product?')) {
                        handleDelete(product.id);
                      }
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
        >
          Previous
        </button>
        <span className="mr-2">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isModalOpen || isEditModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white p-6 rounded-lg w-1/3">
          <h2 className="text-xl font-bold mb-4">{currentProduct ? 'Edit Product' : 'Add Product'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Barcode</label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value || null })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Sale Price</label>
              <input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Current Stock</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Min Stock Limit</label>
              <input
                type="number"
                value={formData.minStockLimit}
                onChange={(e) => setFormData({ ...formData, minStockLimit: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                {currentProduct ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;