# Curtain Master CRM - Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [What Has Already Been Completed](#2-what-has-already-been-completed)
3. [How Each Completed Task Was Implemented](#3-how-each-completed-task-was-implemented)
4. [What Is Still Pending](#4-what-is-still-pending)
5. [Implementation Plan for Remaining Work](#5-implementation-plan-for-remaining-work)
6. [Developer Guide](#6-developer-guide)

---

## 1. Project Overview

**Curtain Master CRM** is an enterprise-grade web application designed to manage the end-to-end operations of a curtain production and installation business. 

### Architecture
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router DOM.
- **Backend**: Django, Django Rest Framework (DRF), JWT Authentication (documented extensively in `README.md`).
- **Integration**: The frontend communicates with the backend via an Axios client configured to route through a Vite development proxy, resolving CORS issues and seamlessly managing `HttpOnly` JWT cookies for secure authentication.

---

## 2. What Has Already Been Completed

The following frontend features and modules have been successfully integrated with the backend API specifications:

* **Authentication System**: Fully functional Login and Logout flows handling JWT tokens via Axios interceptors.
* **Premium UI/UX Design System**: Complete overhaul of the application's visual theme to a premium deep blue (`#2b5c8f`) aesthetic.
* **Application Layout**: 
  * Responsive Sidebar with structured navigation (Management, Operations, System).
  * Desktop Topbar containing global search, notifications, help, and user profile data.
* **Dashboard Module**: A high-level operational overview featuring metric cards, dummy-data Revenue Trend charts, and Quotation Status donut charts.
* **Appointments Module**: 
  * Fully implemented table-based UI matching modern design mockups.
  * Integration with `/api/appointments/` for listing, creating, and deleting appointments.
  * Real-time metrics display (Scheduled, In Progress, Completed, Cancelled).
* **System Modules (Partial)**: Initial scaffolding and API clients created for `Users`, `Roles`, `Permissions`, and `Customers`.

---

## 3. How Each Completed Task Was Implemented

### Project Structure & Workflow
* `src/api/`: Contains Axios client configurations and individual module API wrappers (e.g., `appointments.ts`, `auth.ts`, `customers.ts`).
* `src/components/`: Reusable UI components (Modals, Toasts, Error States) and layout wrappers (`Sidebar.tsx`, `DashboardLayout.tsx`).
* `src/pages/`: Page-level components organized by feature module.
* `src/store/`: Redux Toolkit setup, notably managing the `authSlice.ts` for global user state.

### Important Files & Implementations
1. **`vite.config.ts` & `src/api/client.ts`**: Implemented a proxy server routing `/api` requests to the staging backend (`187.127.171.93:8110`). Axios uses a relative base URL (`/api/`) and interceptors to attach tokens automatically.
2. **`DashboardLayout.tsx` & `Sidebar.tsx`**: Implemented the primary navigation skeleton. Tailwind CSS was utilized extensively to achieve the premium aesthetic, using explicit hex codes, Lucide React icons, and flexbox/grid layouts.
3. **`AppointmentsPage.tsx`**: Implemented using a combination of React state (`useState`, `useEffect`) to fetch data on mount. Replaced a legacy grid layout with a dense, highly-styled `<table>` layout. Modals were utilized for the "Create Appointment" form.

---

## 4. What Is Still Pending

Based on the API specifications in the `README.md`, the backend supports a massive array of features that still need frontend UI implementations.

**Pending Modules:**
* **Quotations**: Listing, generating, and updating status of sales quotes.
* **Invoices & Payments**: Financial tracking for accepted quotes.
* **Operations - Production**: Tracking manufacturing statuses of curtains.
* **Operations - Installation**: Tracking field team progress.
* **Operations - Inventory**: Managing raw materials (fabric, tracks, accessories).
* **Catalog & Pricing**: Displaying available products and standard pricing.

**Pending Improvements:**
* **Dashboard Data Binding**: Connect the static Revenue and Quotation charts on the Dashboard to actual backend endpoints (e.g., `/api/quotations/stats/`).
* **Advanced Error Handling**: Standardize form validation errors utilizing backend response structures.

---

## 5. Implementation Plan for Remaining Work

To complete the remaining modules (Quotations, Invoices, Production, etc.), developers should follow this standardized workflow:

### Step 1: API Client Integration
For every new module, create a dedicated file in `src/api/` (e.g., `src/api/quotations.ts`).
* Review `README.md` for the exact endpoint URLs, required payloads, and HTTP methods.
* Implement typed functions for `list`, `create`, `retrieve`, `update`, and `delete`.

### Step 2: Type Definitions
* Update `src/types/index.ts` to include the TypeScript interfaces for the new module's data models to ensure type safety across the UI.

### Step 3: UI Implementation (Table Pattern)
* Scaffold a new page in `src/pages/` (e.g., `src/pages/quotations/QuotationsPage.tsx`).
* **Best Practice**: Duplicate the structure of `AppointmentsPage.tsx`. It contains the standard, approved design pattern:
  1. Breadcrumb Header with Action Buttons.
  2. Filter Bar (Search, Dropdowns, Total Count).
  3. Status Indicator Pills.
  4. Data Table.
  5. Create/Edit Modals.

### Step 4: Routing
* Add the newly created page component to the main routing configuration (typically in `src/App.tsx` or `src/routes.tsx`), ensuring it is protected by authentication guards.

---

## 6. Developer Guide

### Setup Instructions
1. **Prerequisites**: Node.js (v18+) and npm.
2. **Installation**: Run `npm install` to download dependencies.
3. **Local Development**: Run `npm run dev`. The application will start on `http://localhost:5173`.
4. **Backend Connection**: The Vite proxy will automatically forward `/api` requests to the remote staging backend. *Note: If connection timeouts (`ETIMEDOUT`) occur, verify the backend server at `187.127.171.93:8110` is online.*

### Coding Standards & Conventions
* **Styling**: Strict adherence to Tailwind CSS. Avoid custom CSS files unless absolutely necessary for complex animations.
* **Color Palette**: 
  * Primary Brand Color: Blue (`#2b5c8f`) and its hover state (`#1f456e`).
  * Text colors: Primarily `slate-800` for headings, `slate-500` for subtitles/labels.
* **State Management**: 
  * Use local component state (`useState`) for UI toggles, modal states, and form inputs.
  * Use Redux (`useSelector`, `useDispatch`) strictly for global application state (like the authenticated User profile).
* **Icons**: Use `lucide-react`. Standard stroke width is `2` or `2.5` depending on the required visual weight.
* **Forms**: Always handle loading states (`disabled={isLoading}`) to prevent duplicate API submissions.
