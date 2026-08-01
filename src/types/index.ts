// ── Models ──────────────────────────────────────────────

export interface Permission {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  company_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Auth ────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface RefreshResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ChangePasswordRequest {
  old_password?: string;
  new_password?: string;
}

// ── Users ───────────────────────────────────────────────

export interface CreateUserRequest {
  email: string;
  full_name: string;
  password: string;
  role_id: number;
}

export interface UpdateUserRequest {
  full_name?: string;
  role_id?: number;
  is_active?: boolean;
}

// ── Roles ───────────────────────────────────────────────

export interface CreateRoleRequest {
  name: string;
  description: string;
  permission_ids?: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: number[];
  is_active?: boolean;
}

// ── Permissions ─────────────────────────────────────────

export interface CreatePermissionRequest {
  name: string;
  description: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// ── Customers ───────────────────────────────────────────

export interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  is_active?: boolean;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export interface CustomerLookupResponse {
  found: boolean;
  message?: string;
  customer?: Customer;
}

export interface CreateOrGetCustomerResponse {
  created: boolean;
  customer: Customer;
}

// ── Appointments ────────────────────────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type JobType =
  | 'measurement'
  | 'installation'
  | 'consultation'
  | 'repair';

export interface AppointmentLocation {
  id: number;
  building_name: string;
  unit_number: string;
  full_address: string;
  coordinates: { lat: number; lng: number } | null;
  additional_instructions: string;
  location_status: string;
}

export interface AppointmentAssignee {
  id: number | string;
  full_name?: string;
  email?: string;
  username?: string;
}

export interface AppointmentListItem {
  id: number | string;
  customer: number;
  customer_name: string;
  customer_phone: string;
  title: string;
  description: string;
  appointment_date: string;
  appointment_time: string;
  end_time: string;
  job_type: JobType;
  status: AppointmentStatus;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_to_username: string | null;
  assignee?: number | AppointmentAssignee | null;
  assignee_id?: number | null;
  assignee_name?: string | null;
  assignee_username?: string | null;
  location_full_address: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentDetail {
  id: number | string;
  customer?: Customer | null;
  title: string;
  description: string;
  appointment_date: string;
  appointment_time: string;
  end_time: string;
  job_type: JobType;
  status: AppointmentStatus;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_to_username: string | null;
  assignee?: number | AppointmentAssignee | null;
  assignee_id?: number | null;
  assignee_name?: string | null;
  assignee_username?: string | null;
  created_by: number | null;
  created_by_name: string | null;
  created_by_username: string | null;
  created_at: string;
  updated_at: string;
  cancellation_reason: string;
  cancelled_at: string | null;
  cancelled_by: number | null;
  cancelled_by_name: string | null;
  location: AppointmentLocation | null;
}

export interface CreateAppointmentRequest {
  // Customer fields (for new customer creation)
  customer?: number;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_city?: string;
  customer_source?: string;
  // Appointment fields
  title: string;
  description?: string;
  appointment_date: string;
  appointment_time: string;
  end_time?: string;
  job_type: JobType;
  status?: AppointmentStatus;
  assigned_to?: number;
  assignee?: number | null;
  assignee_id?: number | null;
  // Location fields
  location_building?: string;
  location_unit?: string;
  location_full_address?: string;
  location_coordinates?: { lat: number; lng: number };
  location_instructions?: string;
}

export type UpdateAppointmentRequest = Partial<CreateAppointmentRequest>;

export interface AppointmentFilters {
  status?: AppointmentStatus;
  assigned_to?: number;
  date_from?: string;
  date_to?: string;
  customer?: number;
}

export interface AppointmentStats {
  total: number;
  by_status: Record<string, number>;
  today: number;
  upcoming: number;
}

// 🛒 Quotations 🛒

export type QuotationStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'cancelled';

export interface QuotationListItem {
  id: string;
  customer: number;
  customer_name: string;
  customer_phone: string;
  appointment?: number;
  appointment_id?: string;
  status: QuotationStatus;
  quote_type: string;
  work_type: number;
  work_type_name: string;
  subtotal: string;
  vat: string;
  total: string;
  discount_percentage: string;
  discount_amount: string;
  valid_until: string;
  issued_date: string;
  sent_date?: string;
  sent_via?: string;
  prepared_by?: number;
  prepared_by_name?: string;
  accepted_date?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationStats {
  total: number;
  by_status: Record<string, number>;
  total_value: string;
  accepted_value: string;
  pending_value: string;
  this_month: number;
}

// 📦 Orders 📦

export type OrderStatus = 'pending_production' | 'in_production' | 'shipped' | 'installed' | 'closed' | 'cancelled';

export interface OrderListItem {
  id: number;
  quotation: string;
  quotation_id: string;
  customer: number;
  customer_name: string;
  customer_phone: string;
  order_status: OrderStatus;
  estimated_production_days: number;
  invoice?: string;
  invoice_id?: string;
  invoice_status?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  total: number;
  by_status: Record<string, number>;
  pending_production: number;
  in_production: number;
  shipped: number;
  installed: number;
  closed: number;
}

// 💳 Payments 💳

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque';

export interface Payment {
  id: number;
  invoice: string;
  invoice_number?: string;
  amount: string;
  method: PaymentMethod;
  reference: string;
  payment_date: string;
  notes: string;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
}

// 🧾 Invoices 🧾

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid' | 'partially_paid' | 'cancelled';

export interface InvoiceListItem {
  id: string;
  order: number;
  order_id: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: InvoiceStatus;
  status_display: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  due_date: string;
  issued_date: string;
  payment_terms: string;
  payment_url: string;
  sent_date: string | null;
  sent_via: string;
  quotation_id: string;
  payments: Payment[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceStats {
  total: number;
  by_status: Record<string, number>;
  total_amount: string;
  total_paid: string;
  total_due: string;
  overdue: number;
}
