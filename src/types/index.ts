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
