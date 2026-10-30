import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import RolesPage from './pages/roles/RolesPage';
import PermissionsPage from './pages/permissions/PermissionsPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import AppointmentDetailsPage from './pages/appointments/AppointmentDetailsPage';
import CreateAppointmentPage from './pages/appointments/CreateAppointmentPage';
import QuotationsPage from './pages/quotations/QuotationsPage';
import QuotationDetailPage from './pages/quotations/QuotationDetailPage';
import QuotationBuilderPage from './pages/quotations/QuotationBuilderPage';
import CatalogPage from './pages/catalog/CatalogPage';
import PricingBuilderPage from './pages/pricing/PricingBuilderPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import ProductionPage from './pages/production/ProductionPage';
import InstallationPage from './pages/installation/InstallationPage';
import InventoryPage from './pages/inventory/InventoryPage';
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
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/appointments/create" element={<CreateAppointmentPage />} />
              <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
              <Route path="/quotations" element={<QuotationsPage />} />
              <Route path="/quotations/create" element={<QuotationBuilderPage />} />
              <Route path="/quotations/:id/edit" element={<QuotationBuilderPage />} />
              <Route path="/quotations/:id" element={<QuotationDetailPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/pricing" element={<PricingBuilderPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/installation" element={<InstallationPage />} />
              <Route path="/inventory" element={<InventoryPage />} />

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
