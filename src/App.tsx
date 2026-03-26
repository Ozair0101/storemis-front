import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryFormPage from './pages/CategoryFormPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierFormPage from './pages/SupplierFormPage';
import CustomersPage from './pages/CustomersPage';
import CustomerFormPage from './pages/CustomerFormPage';
import PurchasesPage from './pages/PurchasesPage';
import SalesPage from './pages/SalesPage';
import SaleDetailPage from './pages/SaleDetailPage';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import AccountsPage from './pages/AccountsPage';
import AccountFormPage from './pages/AccountFormPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import SarafisPage from './pages/SarafisPage';
import SarafiFormPage from './pages/SarafiFormPage';
import SarafiDetailPage from './pages/SarafiDetailPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import UserFormPage from './pages/UserFormPage';

function PL({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}
function AL({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute adminOnly><Layout>{children}</Layout></ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/"                          element={<PL><DashboardPage /></PL>} />

        <Route path="/products"                  element={<PL><ProductsPage /></PL>} />
        <Route path="/products/new"              element={<PL><ProductFormPage /></PL>} />
        <Route path="/products/:id/edit"         element={<PL><ProductFormPage /></PL>} />

        <Route path="/categories"                element={<PL><CategoriesPage /></PL>} />
        <Route path="/categories/new"            element={<PL><CategoryFormPage /></PL>} />
        <Route path="/categories/:id/edit"       element={<PL><CategoryFormPage /></PL>} />

        <Route path="/suppliers"                 element={<PL><SuppliersPage /></PL>} />
        <Route path="/suppliers/new"             element={<PL><SupplierFormPage /></PL>} />
        <Route path="/suppliers/:id/edit"        element={<PL><SupplierFormPage /></PL>} />

        <Route path="/customers"                 element={<PL><CustomersPage /></PL>} />
        <Route path="/customers/new"             element={<PL><CustomerFormPage /></PL>} />
        <Route path="/customers/:id/edit"        element={<PL><CustomerFormPage /></PL>} />

        <Route path="/purchases"                 element={<PL><PurchasesPage /></PL>} />
        <Route path="/sales"                     element={<PL><SalesPage /></PL>} />
        <Route path="/sales/:id"                 element={<PL><SaleDetailPage /></PL>} />

        <Route path="/expenses"                  element={<PL><ExpensesPage /></PL>} />
        <Route path="/expenses/new"              element={<PL><ExpenseFormPage /></PL>} />
        <Route path="/expenses/:id/edit"         element={<PL><ExpenseFormPage /></PL>} />

        <Route path="/sarafis"                    element={<PL><SarafisPage /></PL>} />
        <Route path="/sarafis/new"                element={<PL><SarafiFormPage /></PL>} />
        <Route path="/sarafis/:id/edit"           element={<PL><SarafiFormPage /></PL>} />
        <Route path="/sarafis/:id"                element={<PL><SarafiDetailPage /></PL>} />

        <Route path="/accounts"                  element={<PL><AccountsPage /></PL>} />
        <Route path="/accounts/new"              element={<PL><AccountFormPage /></PL>} />
        <Route path="/accounts/:id/edit"         element={<PL><AccountFormPage /></PL>} />

        <Route path="/employees"                 element={<PL><EmployeesPage /></PL>} />
        <Route path="/employees/new"             element={<PL><EmployeeFormPage /></PL>} />
        <Route path="/employees/:id/edit"        element={<PL><EmployeeFormPage /></PL>} />

        <Route path="/reports"                   element={<PL><ReportsPage /></PL>} />

        <Route path="/users"                     element={<AL><UsersPage /></AL>} />
        <Route path="/users/new"                 element={<AL><UserFormPage /></AL>} />
        <Route path="/users/:id/edit"            element={<AL><UserFormPage /></AL>} />
      </Routes>
    </AuthProvider>
  );
}
