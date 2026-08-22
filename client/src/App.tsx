import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout';
import { ServerStatusBadge } from './components/ServerStatusBadge';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { StockManagementPage } from './pages/StockManagementPage';
import ProductsPage from './pages/ProductsPage';
import BarcodeScanPage from './pages/BarcodeScanPage';
import AccountsPage from './pages/AccountsPage';
import AccountTransactionsPage from './pages/AccountTransactionsPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import CashflowPage from './pages/CashflowPage';
import DashboardPage from './pages/DashboardPage';

// App Shell with Auth & Responsive Layout
const AppShell: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer />
        <ServerStatusBadge />
        <Layout>
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
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default AppShell;