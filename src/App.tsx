import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import PurchasesPage from './pages/PurchasesPage';
import SalesPage from './pages/SalesPage';
import ExpensesPage from './pages/ExpensesPage';
import AccountsPage from './pages/AccountsPage';
import EmployeesPage from './pages/EmployeesPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute adminOnly>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/products" element={<ProtectedLayout><ProductsPage /></ProtectedLayout>} />
        <Route path="/categories" element={<ProtectedLayout><CategoriesPage /></ProtectedLayout>} />
        <Route path="/suppliers" element={<ProtectedLayout><SuppliersPage /></ProtectedLayout>} />
        <Route path="/customers" element={<ProtectedLayout><CustomersPage /></ProtectedLayout>} />
        <Route path="/purchases" element={<ProtectedLayout><PurchasesPage /></ProtectedLayout>} />
        <Route path="/sales" element={<ProtectedLayout><SalesPage /></ProtectedLayout>} />
        <Route path="/expenses" element={<ProtectedLayout><ExpensesPage /></ProtectedLayout>} />
        <Route path="/accounts" element={<ProtectedLayout><AccountsPage /></ProtectedLayout>} />
        <Route path="/employees" element={<ProtectedLayout><EmployeesPage /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
        <Route path="/users" element={<AdminLayout><UsersPage /></AdminLayout>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
