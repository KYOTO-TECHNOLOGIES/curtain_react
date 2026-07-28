import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import CustomersPage from './pages/customers/CustomersPage';
import RolesPage from './pages/roles/RolesPage';
import PermissionsPage from './pages/permissions/PermissionsPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import CreateAppointmentPage from './pages/appointments/CreateAppointmentPage';
import QuotationsPage from './pages/quotations/QuotationsPage';
import CreateQuotationPage from './pages/quotations/CreateQuotationPage';
import OrdersPage from './pages/orders/OrdersPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import SettingsDashboard from './pages/settings/SettingsDashboard';
import ProfilePage from './pages/profile/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/appointments/create" element={<CreateAppointmentPage />} />
              <Route path="/quotations" element={<QuotationsPage />} />
              <Route path="/quotations/create" element={<CreateQuotationPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              
              <Route path="/settings" element={<SettingsDashboard />} />
              <Route path="/settings/roles" element={<RolesPage />} />
              <Route path="/settings/permissions" element={<PermissionsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
