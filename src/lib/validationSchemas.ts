import { z } from 'zod';

// ── Login ────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// ── Users ────────────────────────────────────────────────
export const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role_id: z.number().min(1, 'Please select a role'),
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role_id: z.number().min(1, 'Please select a role'),
});
export type EditUserFormValues = z.infer<typeof editUserSchema>;

// ── Customers ────────────────────────────────────────────
export const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  phone_number: z.string().optional(),
  company_name: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});
export type CustomerFormValues = z.infer<typeof customerSchema>;

// ── Appointment ──────────────────────────────────────────
export const appointmentSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(8, 'Phone number is required'),
  customerEmail: z.string().email('Invalid email address').or(z.literal('')),
  source: z.string().min(1, 'Source is required'),
  building: z.string().min(2, 'Building name is required'),
  room: z.string().min(1, 'Room number is required'),
  address: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
});
export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

// ── Log Payment ──────────────────────────────────────────
export const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Must be a positive number'),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'cheque'], {
    message: 'Please select a payment method',
  }),
  payment_date: z.string().min(1, 'Payment date is required'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;

// ── Catalog ─────────────────────────────────────────────
export const catalogWorkTypeSchema = z.object({
  name: z.string().min(1, 'Work type name is required'),
  pricing_unit: z.string().optional(),
});
export type CatalogWorkTypeFormValues = z.infer<typeof catalogWorkTypeSchema>;

export const catalogFabricTypeSchema = z.object({
  name: z.string().min(1, 'Fabric type name is required'),
  work_type: z.coerce.number().min(1, 'Please select a work type'),
});
export type CatalogFabricTypeFormValues = z.infer<typeof catalogFabricTypeSchema>;

export const catalogModelSchema = z.object({
  name: z.string().min(1, 'Model name is required'),
  fabric_type: z.coerce.number().min(1, 'Please select a fabric type'),
});
export type CatalogModelFormValues = z.infer<typeof catalogModelSchema>;

export const catalogItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  model: z.coerce.number().min(1, 'Please select a model'),
  price_per_unit: z.string().min(1, 'Price is required'),
});
export type CatalogItemFormValues = z.infer<typeof catalogItemSchema>;

export const catalogMotorSchema = z.object({
  name: z.string().min(1, 'Motor name is required'),
  price_per_m2: z.string().min(1, 'Price is required'),
});
export type CatalogMotorFormValues = z.infer<typeof catalogMotorSchema>;

export const catalogChargeSchema = z.object({
  name: z.string().min(1, 'Charge name is required'),
  price: z.string().min(1, 'Price is required'),
  unit: z.string().min(1, 'Unit is required'),
});
export type CatalogChargeFormValues = z.infer<typeof catalogChargeSchema>;
