# Curtain Master React Frontend - Comprehensive Documentation

## 1. Project Completion Status
### Fully Implemented
- **Authentication:** Login, Logout, Token Refresh, Protected Routes.
- **Settings Module:** Roles Management, Permissions Management, integrated with APIs.
- **Users Module:** CRUD for users, linked to roles.
- **Customers Module:** CRUD operations, lookup API.
- **Appointments Module:** List view, Creation flow (with map), Status Updates.
- **Quotations Module:** Basic list view and creation scaffold.
- **Invoices Module:** List view with status indicators and search.
- **Payments Module:** Log view with method indicators.
- **Profile Page:** Update full name and password.
- **UI/UX Framework:** Consistent blue theme (#2b5c8f), modern Tailwind layouts, Lucide icons, responsive sidebar.

### Partially Completed
- **Dashboard:** UI is built with mock charts and data. Real API integration for stats is needed.
- **Quotations:** Creation form exists but lacks complex `areas_data` JSON handling.
- **Invoices & Payments:** Actions (View Invoice, Log Payment) are mocked or display toasts.
- **Orders:** API exists, but no UI pages exist yet.

## 2. Pending Work
- **Dashboard Data Binding:** Connect to `api/stats` endpoints across modules.
- **Orders Module UI:** Needs `OrdersPage.tsx` and detail views.
- **Quotation Details:** Complex form handling for nested area data.
- **Invoice Generation/Sending:** Wire up "Generate Invoice" from orders and "Send Invoice" actions.
- **Payment Logging:** Build the "Log Payment" modal linked to `invoicesApi.addPayment`.
- **Production/Installation/Inventory/Catalog:** Routes are in Sidebar but missing pages and APIs.
- **Known Issues:** 
  - Token refresh logic in Axios interceptor can fail gracefully if the backend is down, but UX could be improved.
  - Form validation is currently basic HTML5 validation.

## 3. API Integration Status

### Authentication (`/api/auth/`)
- **login** (POST): Implemented in `LoginPage.tsx` / `authSlice.ts`.
- **refresh** (POST): Intercepted in `client.ts`.
- **logout** (POST): Implemented in `Sidebar.tsx`.
- **me** (GET): Implemented in `authSlice.ts`.
- **change-password** (POST): Implemented in `ProfilePage.tsx`.

### Users (`/api/users/`)
- **list, get, create, update, delete**: Fully integrated in `UsersPage.tsx` and `ProfilePage.tsx`.

### Roles & Permissions (`/api/roles/`, `/api/permissions/`)
- **CRUD Operations**: Fully integrated in `RolesPage.tsx` and `PermissionsPage.tsx`.

### Customers (`/api/customers/`)
- **CRUD & Lookup**: Integrated in `CustomersPage.tsx` and Appointment creation flow.

### Appointments (`/api/appointments/`)
- **list, create, updateStatus, get**: Integrated in `AppointmentsPage.tsx` and `CreateAppointmentPage.tsx`.

### Quotations (`/api/quotations/`)
- **list, create**: Partially integrated in `QuotationsPage.tsx` and `CreateQuotationPage.tsx`.

### Invoices (`/api/invoices/`)
- **list, stats**: Integrated in `InvoicesPage.tsx`.
- **create, updateStatus, addPayment**: APIs exist, waiting for UI implementation.

### Payments (`/api/payments/`)
- **list**: Integrated in `PaymentsPage.tsx`.

## 4. Missing API Integrations
- **Orders APIs (`/api/orders/`)**: Endpoints exist but are entirely unused. Requires UI.
- **Quotation Complex Creation**: Nested items in quotations need to be wired.
- **Dashboard Stats**: The Dashboard UI uses mock data. Needs calls to `/api/orders/stats/`, `/api/invoices/stats/`, etc.
- **Invoice Actions**: "Generate Invoice" and "Send Invoice" are currently just Toasts.
- **Payment Creation**: "Log Payment" is just a Toast.

## 5. Feature-by-Feature Analysis

### User Profile
- **Status:** Complete.
- **Components/Pages:** `ProfilePage.tsx`.
- **APIs:** `usersApi.update`, `authApi.changePassword`.
- **Remaining Work:** None.

### Settings (Roles/Permissions)
- **Status:** Complete.
- **Components/Pages:** `SettingsDashboard.tsx`, `RolesPage.tsx`, `PermissionsPage.tsx`.
- **APIs:** `rolesApi.*`, `permissionsApi.*`.
- **Remaining Work:** None.

### Appointments
- **Status:** Complete (core functionality).
- **Components/Pages:** `AppointmentsPage.tsx`, `CreateAppointmentPage.tsx`.
- **APIs:** `appointmentsApi.*`.
- **Remaining Work:** Advanced calendar view (optional).

### Quotations
- **Status:** Partial.
- **Components/Pages:** `QuotationsPage.tsx`, `CreateQuotationPage.tsx`.
- **Remaining Work:** Implement full nested JSON payload for quotation details.

### Invoices & Payments
- **Status:** Partial.
- **Components/Pages:** `InvoicesPage.tsx`, `PaymentsPage.tsx`.
- **Remaining Work:** Create/Edit flows.

## 6. Routing Documentation
- **Public Routes:**
  - `/login`
- **Protected Routes:**
  - `/dashboard`
  - `/profile`
  - `/users`
  - `/customers`
  - `/appointments`, `/appointments/create`
  - `/quotations`, `/quotations/create`
  - `/invoices`, `/payments`
  - `/settings`, `/settings/roles`, `/settings/permissions`
- **Planned/Unimplemented Routes:**
  - `/orders`, `/production`, `/installation`, `/inventory`, `/catalog`

## 7. Folder Structure
- `src/api/`: Centralized Axios client and feature-specific API service files.
- `src/assets/`: Static files (images, Lottie animations).
- `src/components/`: Reusable UI components (Modal, Toast, ErrorStates) and Layouts (Sidebar, DashboardLayout).
- `src/pages/`: Route-level components grouped by feature (e.g., `appointments/`, `settings/`).
- `src/store/`: Redux store configuration and slices (`authSlice.ts`).
- `src/types/`: TypeScript interfaces representing backend models.

## 8. State Management
- **Redux:** Used exclusively for Global Authentication State (`state.auth.user`, `isAuthenticated`).
- **Local State (`useState`):** Used for UI toggles, form inputs, and component-level data fetching.
- **API Strategy:** Standard React `useEffect` for data fetching. No TanStack Query is used currently. Data is not cached heavily on the client.

## 9. Authentication & Authorization
- **Login Flow:** User submits credentials -> Backend returns JWT (Access + Refresh) -> Redux stores tokens in LocalStorage and sets `isAuthenticated`.
- **Token Handling:** Axios interceptor attaches Bearer token.
- **Refresh Flow:** On 401 response, Axios interceptor pauses, hits `/auth/refresh/`, updates tokens, and retries the original request.
- **Authorization:** `ProtectedRoute.tsx` wrapper ensures only authenticated users can access the dashboard. Role-based UI visibility is not strictly enforced yet.

## 10. UI Components
- **Reusable:** `Modal.tsx`, `ConfirmModal`, `Toast.tsx`, `ErrorState.tsx`.
- **Layouts:** `DashboardLayout.tsx` (Top Nav + content area), `Sidebar.tsx` (Navigation links).
- **Design System:** Tailwind CSS with `#2b5c8f` primary color, rounded-2xl cards, soft shadows.

## 11. Environment Configuration
- **Variables:** `VITE_API_URL` defines the backend endpoint.
- **Base URL:** Defaults to `/api/` (proxy) or actual backend IP.
- **Build:** Standard Vite configuration (`npm run build`).

## 12. Project Architecture
- **Pattern:** Modular feature-based structure.
- **Data Flow:** UI Component -> API Service (`src/api/`) -> Backend. Response flows back to UI local state.
- **Best Practices:** Strong TypeScript typing (`src/types/`), centralized Axios interceptor for auth, consistent UI aesthetic.

## 13. Testing Status
- **Current Status:** No automated tests (Jest/Cypress) are currently implemented.
- **Needs Testing:** Auth token refresh edge cases, complex form validation (Quotations), Responsive layout across mobile/tablet.

## 14. Future Improvements
- **Performance:** Implement TanStack Query for automatic caching, deduping, and background updates instead of raw `useEffect`.
- **Forms:** Introduce `react-hook-form` and `zod` for robust validation, especially for complex payloads like Quotations.
- **UX:** Add skeleton loaders instead of full-page spinners.

## 15. Final Summary
- **Overall Completion:** ~65%
- **API Integration:** ~60% (Auth, Users, Appointments, Customers, Roles, Permissions are fully integrated. Others are partial).
- **Next Steps (Implementation Order):**
  1. Build the Orders Module UI and wire up `/api/orders/`.
  2. Implement the "Generate Invoice" action inside Orders.
  3. Wire up the "Log Payment" form inside Invoices.
  4. Complete the Quotation Creation form with nested areas.
  5. Bind real data to the Dashboard.
