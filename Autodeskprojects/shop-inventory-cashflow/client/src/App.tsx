import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { StockManagementPage } from './pages/StockManagementPage';
import ProductsPage from './pages/ProductsPage';
import BarcodeScanPage from './pages/BarcodeScanPage';
import AccountsPage from './pages/AccountsPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import AccountTransactionsPage from './pages/AccountTransactionsPage';
import DashboardPage from './pages/DashboardPage';
import { useLowStock } from './hooks/useLowStock';

// Sidebar navigation with low-stock badge
const SidebarNav: React.FC = () => {
  const { lowStock: lowStockData } = useLowStock();

  return (
    <div className="fixed top-0 left-0 h-full bg-gray-800 text-white w-64 p-4">
      <div className="flex flex-col h-full">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Navigation</h2>
        </div>
        <ul className="flex-1">
          <li className="mb-2">
            <Link to="/dashboard" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
              Dashboard
              {lowStockData.count > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {lowStockData.count}
                </span>
              )}
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/products" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
              Products
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/stock" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
              Stock
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/barcode-scan" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
              Barcode Scan
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/accounts" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
              Accounts
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/sales" className="flex items-center px-4 py-2 rounded hover:bg-gray-700">
              Sales
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

// App Shell with Auth
const AppShell: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer />
        <SidebarNav />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
            path="/barcode-scan"
            element={
              <ProtectedRoute>
                <BarcodeScanPage />
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
      </AuthProvider>
    </Router>
  );
};

export default AppShell;