import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Html5Qrcode } from 'html5-qrcode';
import { Product, Account, CreateSaleItemDTO } from '@shop/shared';
import { getProductByBarcode } from '../services/product';
import { getAccounts } from '../services/account';
import { createSale } from '../services/sale';

const BarcodeScanPage: React.FC = () => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const qrcodeRef = useRef<Html5Qrcode | null>(null);
  const isSearchingRef = useRef(false);
  const readerDivId = 'qr-reader';

  // Load accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accs = await getAccounts();
        setAccounts(accs);
        if (accs.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accs[0].id);
        }
      } catch (error) {
        toast.error('Failed to load accounts');
      }
    };
    fetchAccounts();
  }, []);

  // Camera scanning effect
  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraStarting(true);
    // Clean up any existing instance
    if (qrcodeRef.current) {
      try {
        await qrcodeRef.current.stop();
      } catch (e) {
        // ignore
      }
      qrcodeRef.current = null;
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      const html5QrCode = new Html5Qrcode(readerDivId);
      qrcodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanFailure
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      qrcodeRef.current = null;
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Switching to manual input.');
        toast.warn('Camera permission denied. Please use manual input.');
        setScanMode('manual');
      } else {
        setCameraError(err.message || 'Failed to start camera');
        toast.error(err.message || 'Failed to start camera');
      }
    } finally {
      setIsCameraStarting(false);
    }
  };

  const stopCamera = async () => {
    const scanner = qrcodeRef.current;
    if (scanner) {
      try {
        await scanner.stop();
      } catch (e) {
        // ignore errors when stopping
      }
      if (qrcodeRef.current === scanner) {
        qrcodeRef.current = null;
      }
    }
    setIsCameraActive(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    // Prevent multiple rapid calls
    if (isSearchingRef.current) return;
    
    // Stop camera to prevent rapid scans
    await stopCamera();
    
    // Lookup product
    await handleBarcodeLookup(decodedText);
  };

  const onScanFailure = (_error: any) => {
    // Ignore frequent failures when no QR code in view
  };

  const handleBarcodeLookup = async (barcode: string) => {
    if (isSearchingRef.current) return;
    isSearchingRef.current = true;
    setIsLoadingProduct(true);
    try {
      const product = await getProductByBarcode(barcode);
      setScannedProduct(product);
      setQuantity(1); // reset quantity
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Product not found for barcode');
        setScannedProduct(null);
      } else {
        toast.error('Failed to lookup product');
      }
    } finally {
      setIsLoadingProduct(false);
      isSearchingRef.current = false;
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) {
      toast.error('Please enter a barcode');
      return;
    }
    await handleBarcodeLookup(barcodeInput.trim());
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct) return;
    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    setIsSubmittingSale(true);
    try {
      const saleItem: CreateSaleItemDTO = {
        productId: scannedProduct.id,
        quantity,
      };
      const saleData = {
        items: [saleItem],
        accountId: selectedAccountId,
      };
      await createSale(saleData);
      toast.success('Sale recorded successfully');
      // Reset form and product
      setScannedProduct(null);
      setBarcodeInput('');
      setQuantity(1);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else {
        toast.error('Failed to record sale');
      }
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Barcode Scan</h1>

      {/* Mode Toggle */}
      <div className="mb-4 flex space-x-4">
        <button
          type="button"
          onClick={() => setScanMode('camera')}
          className={`px-4 py-2 rounded ${scanMode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Camera Scan
        </button>
        <button
          type="button"
          onClick={() => setScanMode('manual')}
          className={`px-4 py-2 rounded ${scanMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Manual Input
        </button>
      </div>

      {/* Camera Mode */}
      {scanMode === 'camera' && (
        <div className="mb-6">
          <div className="mb-2 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Camera Scanner</h2>
            <div className="flex space-x-2">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={isCameraStarting ? undefined : startCamera}
                  disabled={isCameraStarting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isCameraStarting ? 'Starting...' : 'Start Camera'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Stop Camera
                </button>
              )}
            </div>
          </div>
          {cameraError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-2">
              {cameraError}
            </div>
          )}
          <div
            id={readerDivId}
            className="overflow-hidden rounded"
            style={{ width: '400px', height: '300px' }}
          ></div>
        </div>
      )}

      {/* Manual Input Mode */}
      {scanMode === 'manual' && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Manual Barcode Entry</h2>
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or enter barcode (press Enter)"
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoadingProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoadingProduct ? 'Looking up...' : 'Lookup'}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-1">
            Use this for USB barcode scanners or if camera is unavailable.
          </p>
        </div>
      )}

      {/* Product Detail Card */}
      {scannedProduct && (
        <div className="mb-6 border rounded-lg p-4 bg-white shadow">
          <h2 className="text-xl font-bold mb-2">Product Details</h2>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Product Image Placeholder */}
            <div className="flex-shrink-0">
              <div
                className="bg-gray-200 border border-gray-300 rounded flex items-center justify-center"
                style={{ width: '120px', height: '120px' }}
                aria-label="Product image placeholder"
              >
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 48 48"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172 3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  />
                </svg>
              </div>
            </div>
            {/* Product Info */}
            <div className="flex-1">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <dt className="font-medium text-gray-500">Name</dt>
                  <dd className="text-gray-900">{scannedProduct.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Barcode</dt>
                  <dd className="text-gray-900">{scannedProduct.barcode || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Sale Price</dt>
                  <dd className="text-gray-900">PKR {Number(scannedProduct.salePrice).toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Available Stock</dt>
                  <dd className="text-gray-900">{scannedProduct.currentStock}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Quick Sale Form */}
      {scannedProduct && (
        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="text-xl font-bold mb-4">Quick Sale</h2>
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Account Selector */}
              <div>
                <label htmlFor="account" className="block font-medium text-gray-700 mb-1">
                  Account
                </label>
                <select
                  id="account"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingSale ? 'Recording...' : 'Record Sale'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanPage;
