import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import EditCustomerPage from './pages/EditCustomerPage';
import AddContractPage from './pages/AddContractPage';
import ContractDetailPage from './pages/ContractDetailPage';
import CollectionPage from './pages/CollectionPage';
import PrintPreviewPage from './pages/PrintPreviewPage';
import ReceiptsPage from './pages/ReceiptsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProductsPage from './pages/ProductsPage';

function LoginGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-600 dark:text-gray-400">جاري التحميل...</div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
      <Route path="/customers/:id/edit" element={<ProtectedRoute><EditCustomerPage /></ProtectedRoute>} />
      <Route path="/customers/:id/contract/add" element={<ProtectedRoute><AddContractPage /></ProtectedRoute>} />
      <Route path="/customers/:id/contract/:contractId" element={<ProtectedRoute><ContractDetailPage /></ProtectedRoute>} />
      <Route path="/collection" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
      <Route path="/print" element={<ProtectedRoute><PrintPreviewPage /></ProtectedRoute>} />
      <Route path="/receipts" element={<ProtectedRoute><ReceiptsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
