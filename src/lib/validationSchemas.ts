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
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  payment_date: z.string().min(1, 'Payment date is required'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;
