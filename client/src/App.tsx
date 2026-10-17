import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout';
import { ServerStatusBadge } from './components/ServerStatusBadge';
import { useAppVersion } from './hooks/useAppVersion';
import { useStaleClientCheck } from './hooks/useStaleClientCheck';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const StockManagementPage = lazy(() => import('./pages/StockManagementPage').then(m => ({ default: m.StockManagementPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const BarcodeScanPage = lazy(() => import('./pages/BarcodeScanPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const AccountTransactionsPage = lazy(() => import('./pages/AccountTransactionsPage'));
const SalesHistoryPage = lazy(() => import('./pages/SalesHistoryPage'));
const CashflowPage = lazy(() => import('./pages/CashflowPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// Route change tracker component for hooks
const AppVersionAndStaleWatcher: React.FC = () => {
  useAppVersion();
  useStaleClientCheck();
  const location = useLocation();

  React.useEffect(() => {
    console.debug(`[Router] Route changed to ${location.pathname}`);
  }, [location]);

  return null;
};

// App Shell with Auth & Responsive Layout
const AppShell: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppVersionAndStaleWatcher />
        <ToastContainer />
        <ServerStatusBadge />
        <Layout>
          <Suspense fallback={<div className="p-6 text-center text-gray-600">Loading page...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Admin only route */}
              <Route
                path="/register"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <RegisterPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <ProductsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stock"
                element={
                  <ProtectedRoute>
                    <StockManagementPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/pos"
                element={
                  <ProtectedRoute>
                    <BarcodeScanPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/barcode-scan"
                element={
                  <ProtectedRoute>
                    <BarcodeScanPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cashflow"
                element={
                  <ProtectedRoute>
                    <CashflowPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/accounts"
                element={
                  <ProtectedRoute>
                    <AccountsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/accounts/transactions/:accountId"
                element={
                  <ProtectedRoute>
                    <AccountTransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts/transactions"
                element={
                  <ProtectedRoute>
                    <AccountTransactionsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <SalesHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Default route - redirect to dashboard if authenticated, login if not */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute redirectTo="/login">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default AppShell;
