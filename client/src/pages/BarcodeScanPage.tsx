import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Product, Account, CreateSaleItemDTO, Sale } from '@shop/shared';
import { getProductByBarcode, getProducts } from '../services/product';
import { getAccounts } from '../services/account';
import { createSale } from '../services/sale';

const readerDivId = 'qr-reader';

export interface CartItem {
  product: Product;
  quantity: number;
}

const BarcodeScanPage: React.FC = () => {
  // Navigation & Scan modes
  const [scanMode, setScanMode] = useState<'camera' | 'manual' | 'search'>('manual');
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // Cart & POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  // Payment & Checkout State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ACCOUNT'>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // Completed Sale Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Camera Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const qrcodeRef = useRef<Html5Qrcode | null>(null);
  const isSearchingRef = useRef(false);
  const isScanGatedRef = useRef(false);
  const lastScannedBarcodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const shouldBeScanningRef = useRef(false);
  const isStartingRef = useRef(false);

  // Input Focus Refs
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 -> Focus search/barcode input
      if (e.key === 'F2') {
        e.preventDefault();
        if (scanMode === 'manual' && barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        } else if (scanMode === 'search' && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      // Esc -> Clear search/cart or close modals
      if (e.key === 'Escape') {
        if (isReceiptModalOpen) {
          setIsReceiptModalOpen(false);
        } else if (isCheckoutModalOpen) {
          setIsCheckoutModalOpen(false);
        } else {
          setBarcodeInput('');
          setSearchQuery('');
          setSearchResults([]);
        }
      }
      // F4 or Ctrl+Enter -> Open checkout modal if cart has items
      if (e.key === 'F4' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutModalOpen && !isReceiptModalOpen) {
          setIsCheckoutModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanMode, isReceiptModalOpen, isCheckoutModalOpen, cart.length]);

  // Cleanly stop media tracks on DOM video elements
  const cleanupMediaTracks = useCallback(() => {
    try {
      const container = document.getElementById(readerDivId);
      if (container) {
        const videoElements = container.getElementsByTagName('video');
        for (let i = 0; i < videoElements.length; i++) {
          const video = videoElements[i];
          if (video.srcObject instanceof MediaStream) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach((track) => {
              try {
                track.stop();
              } catch (e) {
                // Ignore track stop errors
              }
            });
            video.srcObject = null;
          }
        }
      }
    } catch (e) {
      console.warn('Error during media tracks cleanup:', e);
    }
  }, []);

  // Stop camera stream & html5-qrcode scanner cleanly
  const stopCamera = useCallback(async () => {
    shouldBeScanningRef.current = false;
    const scanner = qrcodeRef.current;
    qrcodeRef.current = null;

    if (scanner) {
      try {
        const state = scanner.getState();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          await scanner.stop();
        }
      } catch (e) {
        console.warn('Error stopping Html5Qrcode instance:', e);
      }

      try {
        await scanner.clear();
      } catch (e) {
        console.warn('Error clearing Html5Qrcode instance:', e);
      }
    }

    cleanupMediaTracks();

    if (isMountedRef.current) {
      setIsCameraActive(false);
    }
  }, [cleanupMediaTracks]);

  // Add Product to Cart helper
  const addProductToCart = useCallback((product: Product, qtyToAdd = 1) => {
    if (product.currentStock <= 0) {
      toast.error(`"${product.name}" is out of stock!`);
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const existingItem = prevCart[existingIndex];
        const newQty = existingItem.quantity + qtyToAdd;
        if (newQty > product.currentStock) {
          toast.warning(`Cannot add more. Stock limit for "${product.name}" is ${product.currentStock}`);
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = { ...existingItem, quantity: newQty };
        toast.success(`Updated "${product.name}" qty to ${newQty}`);
        return updated;
      } else {
        toast.success(`Added "${product.name}" to cart`);
        return [...prevCart, { product, quantity: Math.min(qtyToAdd, product.currentStock) }];
      }
    });
  }, []);

  // Lookup product by barcode and add to cart
  const handleBarcodeLookup = useCallback(async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    if (isSearchingRef.current) return;

    isSearchingRef.current = true;

    try {
      const product = await getProductByBarcode(trimmed);
      if (isMountedRef.current) {
        addProductToCart(product, 1);
        setBarcodeInput('');
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        if (error.response?.status === 404) {
          toast.error(`No product found for barcode: ${trimmed}`);
        } else {
          toast.error('Failed to lookup product details');
        }
      }
    } finally {
      isSearchingRef.current = false;
      isScanGatedRef.current = false;
    }
  }, [addProductToCart]);

  // Search products by name/barcode
  const handleProductSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearchingProducts(true);
    try {
      const res = await getProducts(query, undefined, 1, 8);
      setSearchResults(res.items || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  // Callback on successful camera scan
  const onScanSuccess = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      if (isScanGatedRef.current || isSearchingRef.current) return;

      if (
        decodedText === lastScannedBarcodeRef.current &&
        now - lastScanTimeRef.current < 2000
      ) {
        return;
      }
      if (now - lastScanTimeRef.current < 1000) return;

      isScanGatedRef.current = true;
      lastScannedBarcodeRef.current = decodedText;
      lastScanTimeRef.current = now;

      await handleBarcodeLookup(decodedText);
    },
    [handleBarcodeLookup]
  );

  const onScanFailure = useCallback((_error: any) => {}, []);

  // Start camera scanner
  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    shouldBeScanningRef.current = true;

    if (isMountedRef.current) {
      setCameraError(null);
      setIsCameraStarting(true);
    }

    await stopCamera();

    if (!shouldBeScanningRef.current || !isMountedRef.current) {
      if (isMountedRef.current) setIsCameraStarting(false);
      isStartingRef.current = false;
      return;
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

      if (!shouldBeScanningRef.current || !isMountedRef.current) {
        await stopCamera();
        return;
      }

      if (isMountedRef.current) {
        setIsCameraActive(true);
        isScanGatedRef.current = false;
        setCameraError(null);
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      qrcodeRef.current = null;
      cleanupMediaTracks();

      if (isMountedRef.current) {
        setIsCameraActive(false);
        const errMsg = err?.message || String(err);
        setCameraError(errMsg || 'Failed to start camera scanner.');
        toast.error('Failed to start camera. Please use manual/search entry.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsCameraStarting(false);
      }
      isStartingRef.current = false;
    }
  }, [stopCamera, cleanupMediaTracks, onScanSuccess, onScanFailure]);

  // Handle scan mode changes and component lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    const handleUnload = () => {
      cleanupMediaTracks();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      stopCamera();
    };
  }, [scanMode, startCamera, stopCamera, cleanupMediaTracks]);

  // Cart operations
  const updateCartQuantity = (productId: string, newQty: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const validQty = Math.max(1, Math.min(newQty, item.product.currentStock));
            if (newQty > item.product.currentStock) {
              toast.warning(`Max available stock for "${item.product.name}" is ${item.product.currentStock}`);
            }
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    toast.info('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setAmountTendered('');
    toast.info('Cart cleared');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + Number(item.product.salePrice) * item.quantity, 0);
  const calculatedDiscount = discountType === 'percentage'
    ? (subtotal * Math.min(100, Math.max(0, discountValue))) / 100
    : Math.min(subtotal, Math.max(0, discountValue));
  const grandTotal = Math.max(0, subtotal - calculatedDiscount);
  
  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  // Submit Completed Sale
  const handleCompleteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Please select an account for the transaction');
      return;
    }
    if (paymentMethod === 'CASH' && tenderedNum < grandTotal) {
      toast.error(`Amount tendered (PKR ${tenderedNum.toFixed(2)}) is less than total (PKR ${grandTotal.toFixed(2)})`);
      return;
    }

    setIsSubmittingSale(true);
    try {
      const items: CreateSaleItemDTO[] = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const newSale = await createSale({
        items,
        accountId: selectedAccountId,
      });

      toast.success('Sale completed successfully!');
      setCompletedSale(newSale);
      setIsCheckoutModalOpen(false);
      setIsReceiptModalOpen(true);
      
      // Reset cart
      setCart([]);
      setDiscountValue(0);
      setAmountTendered('');
      setCustomerNotes('');
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to complete sale';
      toast.error(msg);
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Point of Sale (POS) & Quick Scanning
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Scan barcodes, search products, manage cart, and process instant sales.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setScanMode('manual')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              scanMode === 'manual'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⌨️ Barcode (F2)
          </button>
          <button
            type="button"
            onClick={() => setScanMode('search')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              scanMode === 'search'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔍 Search Items
          </button>
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              scanMode === 'camera'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📷 Camera
          </button>
        </div>
      </div>

      {/* Main Grid: Left Scanner/Search & Products, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Finder & Input (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Mode 1: Manual Barcode Scanner Input */}
          {scanMode === 'manual' && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="pos-barcode-input" className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Scan / Type Barcode
                </label>
                <span className="text-xs text-gray-400 font-mono">Press F2 to focus</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBarcodeLookup(barcodeInput);
                }}
                className="flex gap-2"
              >
                <input
                  ref={barcodeInputRef}
                  id="pos-barcode-input"
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode with handheld scanner or hit Enter..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                >
                  <span>Add Item</span>
                  <span>↵</span>
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2.5">
                💡 Tip: Hardware USB/Bluetooth scanners automatically fire Enter keystrokes to add items instantly.
              </p>
            </div>
          )}

          {/* Mode 2: Instant Product Search */}
          {scanMode === 'search' && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="pos-search-input" className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  Instant Product Search
                </label>
                <span className="text-xs text-gray-400 font-mono">Type 2+ characters</span>
              </div>
              <input
                ref={searchInputRef}
                id="pos-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => handleProductSearch(e.target.value)}
                placeholder="Search by product name, SKU, or barcode..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base"
                autoFocus
              />

              {/* Search Results dropdown/grid */}
              {isSearchingProducts ? (
                <div className="py-6 text-center text-gray-400 text-sm">Searching inventory...</div>
              ) : searchResults.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => addProductToCart(prod, 1)}
                      className="p-3 border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl text-left transition-all flex flex-col justify-between group"
                    >
                      <div className="font-semibold text-gray-900 group-hover:text-blue-700 truncate">
                        {prod.name}
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span className="text-gray-500 font-mono">{prod.barcode || 'No Barcode'}</span>
                        <span className="font-bold text-green-700 text-sm">
                          PKR {Number(prod.salePrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Stock: <strong className={prod.currentStock <= prod.minStockLimit ? 'text-red-600 font-bold' : 'text-gray-700'}>{prod.currentStock}</strong></span>
                        <span className="text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">+ Add to Cart</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="py-6 text-center text-gray-400 text-sm">No products found matching "{searchQuery}"</div>
              ) : null}
            </div>
          )}

          {/* Mode 3: Camera Scanner */}
          {scanMode === 'camera' && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  Camera Scanner Feed
                </h3>
                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                    isCameraActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>
              </div>

              {cameraError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl mb-3 border border-red-200">
                  {cameraError}
                </div>
              )}

              <div className="flex justify-center">
                <div
                  id={readerDivId}
                  className="overflow-hidden rounded-xl border border-gray-300 bg-black relative"
                  style={{ width: '100%', maxWidth: '400px', minHeight: '260px' }}
                >
                  {isCameraStarting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 bg-opacity-80 z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                      <p className="text-xs">Initializing Camera...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shortcuts Legend Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <span className="bg-white/20 px-2 py-0.5 rounded">⌨️ POS Shortcuts</span>
            </div>
            <div className="flex flex-wrap gap-4 text-blue-100">
              <span><kbd className="bg-black/30 px-1.5 py-0.5 rounded font-mono">F2</kbd> Focus Search/Barcode</span>
              <span><kbd className="bg-black/30 px-1.5 py-0.5 rounded font-mono">F4</kbd> Checkout Cart</span>
              <span><kbd className="bg-black/30 px-1.5 py-0.5 rounded font-mono">Esc</kbd> Clear / Close</span>
            </div>
          </div>

        </div>

        {/* Right Column: POS Shopping Cart & Breakdown (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 flex flex-col justify-between h-full min-h-[500px]">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {cart.reduce((cnt, item) => cnt + item.quantity, 0)} Items
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition-colors"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Line Items */}
              <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                    <svg className="w-12 h-12 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="font-medium text-sm">Cart is empty</p>
                    <p className="text-xs text-gray-400 mt-1">Scan barcode or search products to build sale order</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const lineTotal = Number(item.product.salePrice) * item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <div className="text-xs text-gray-500 mt-0.5">
                            PKR {Number(item.product.salePrice).toFixed(2)} / unit
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded font-bold text-base"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.currentStock}
                            value={item.quantity}
                            onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center text-sm font-semibold border-0 focus:ring-0 p-0"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded font-bold text-base"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total & Remove */}
                        <div className="text-right min-w-[70px]">
                          <div className="font-bold text-sm text-gray-900">
                            PKR {lineTotal.toFixed(2)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.product.id)}
                            className="text-[11px] text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Calculations & Checkout Trigger */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
              
              {/* Discount Input */}
              {cart.length > 0 && (
                <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-700">Apply Discount:</span>
                  <div className="flex items-center space-x-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                      className="px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="fixed">PKR</option>
                      <option value="percentage">%</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white text-right font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toFixed(2)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Discount</span>
                    <span>- PKR {calculatedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Grand Total</span>
                  <span className="text-blue-600">PKR {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutModalOpen(true)}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-base"
              >
                <span>Proceed to Checkout (F4)</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Checkout & Payment Confirmation */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Payment & Checkout</h3>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSale} className="space-y-4">
              
              {/* Total Summary */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">Amount Due</span>
                <div className="text-3xl font-extrabold text-blue-900 mt-1">
                  PKR {grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ACCOUNT')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                      paymentMethod === 'ACCOUNT'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🏦 Account / Wallet
                  </button>
                </div>
              </div>

              {/* Account / Channel Selector */}
              <div>
                <label htmlFor="checkout-account" className="block text-sm font-semibold text-gray-700 mb-1">
                  Deposit Account / Channel
                </label>
                <select
                  id="checkout-account"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) — Balance: PKR {Number(acc.currentBalance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cash Payment Validation & Change Calculation */}
              {paymentMethod === 'CASH' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div>
                    <label htmlFor="amount-tendered" className="block text-xs font-semibold text-gray-700 mb-1">
                      Amount Tendered (PKR)
                    </label>
                    <input
                      id="amount-tendered"
                      type="number"
                      step="0.01"
                      min={grandTotal}
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder={`Min: ${grandTotal.toFixed(2)}`}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-base font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-600">Change Return Due:</span>
                    <span className="text-base font-extrabold text-green-700">
                      PKR {changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label htmlFor="customer-notes" className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer / Remarks (Optional)
                </label>
                <input
                  id="customer-notes"
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Walk-in customer note..."
                  className="w-full p-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  disabled={isSubmittingSale}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {isSubmittingSale ? (
                    <span>Processing Sale...</span>
                  ) : (
                    <span>Complete Sale (Enter)</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Printable Receipt Display */}
      {isReceiptModalOpen && completedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden print:shadow-none print:max-w-none print:w-full">
            
            {/* Receipt Content Printable Area */}
            <div className="text-center pb-4 border-b border-dashed border-gray-300 mb-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">SHOP RECEIPT</h2>
              <p className="text-xs text-gray-500 mt-1">Shop Inventory & Cashflow Management</p>
              <div className="text-[11px] text-gray-400 mt-2 font-mono">
                Invoice ID: {completedSale.id}
              </div>
              <div className="text-[11px] text-gray-400 font-mono">
                Date: {new Date(completedSale.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Receipt Items */}
            <div className="space-y-2 mb-4 text-xs font-mono">
              <div className="flex justify-between font-bold border-b pb-1 text-gray-700">
                <span>ITEM</span>
                <span>QTY x PRICE = TOTAL</span>
              </div>
              {completedSale.items.map((it) => (
                <div key={it.id} className="flex justify-between text-gray-800">
                  <span className="truncate max-w-[180px]">{it.productName}</span>
                  <span>
                    {it.quantity} x {Number(it.unitPrice).toFixed(2)} = PKR {Number(it.lineTotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Receipt Totals */}
            <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-xs font-mono">
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
                <span>GRAND TOTAL:</span>
                <span>PKR {Number(completedSale.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Mode:</span>
                <span>{paymentMethod}</span>
              </div>
            </div>

            <div className="text-center mt-6 text-[11px] text-gray-400 italic">
              Thank you for your business!
            </div>

            {/* Non-printable Action Buttons */}
            <div className="mt-6 flex gap-3 print:hidden">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors"
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setCompletedSale(null);
                }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-sm transition-colors"
              >
                New Sale
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanPage;