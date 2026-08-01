import { api } from './client';
import type { QuotationListItem, QuotationStats } from '../types';

export interface SurfaceSpec {
  id?: number;
  fabric_type: number;
  fabric_type_name?: string;
  model: number;
  model_name?: string;
  catalog_item: number;
  catalog_item_name?: string;
  fabric_code: string;
  unit_price_per_m2: string | number;
  fabric_total?: string;
  motor_control_type: 'manual' | 'motorized';
  motor_type?: number | null;
  motor_type_name?: string;
  motor_price_per_unit: string | number;
  motor_charge_total?: string;
  manual_control_total?: string;
  smart_integration: boolean;
  alexa_quantity: number;
  alexa_unit_price: string | number;
  alexa_total?: string;
  pelmet_enabled: boolean;
  pelmet_width_cm: string | number;
  pelmet_price_per_metre: string | number;
  pelmet_total?: string;
  addon_label?: string;
  addon_amount: string | number;
  line_item_total?: string;
}

export interface Surface {
  id?: number;
  surface_name: string;
  surface_type: string;
  width_cm: string | number;
  height_cm: string | number;
  calculated_area_m2?: string;
  opening_direction: string;
  special_requirements?: string;
  sort_order: number;
  spec: SurfaceSpec;
}

export interface QuotationArea {
  id?: number;
  quotation?: string;
  area_type: string;
  display_name: string;
  sort_order: number;
  surfaces: Surface[];
}

export interface QuotationDetail {
  id: string;
  customer: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  appointment?: number | null;
  appointment_id?: string;
  status: 'draft' | 'pending' | 'sent' | 'accepted' | 'cancelled';
  quote_type: 'b2c' | 'b2b';
  work_type: number;
  work_type_name?: string;
  subtotal?: string;
  vat?: string;
  total?: string;
  discount_percentage: string | number;
  discount_amount?: string;
  valid_until: string;
  issued_date?: string;
  sent_date?: string;
  sent_via?: string;
  prepared_by?: number;
  prepared_by_name?: string;
  prepared_by_email?: string;
  accepted_date?: string;
  created_at?: string;
  updated_at?: string;
  areas?: QuotationArea[];
}

export const quotationsApi = {
  list: (params?: any) => api.get<QuotationListItem[]>('quotations/', { params }),
  stats: () => api.get<QuotationStats>('quotations/stats/'),
  get: (id: string | number) => api.get<QuotationDetail>(`quotations/${id}/`),
  create: (data: any) => api.post<QuotationDetail>('quotations/', data),
  update: (id: string | number, data: any) => api.patch<QuotationDetail>(`quotations/${id}/`, data),
  updateStatus: (id: string | number, status: string, sent_via?: string) =>
    api.patch<QuotationDetail>(`quotations/${id}/status/`, { status, sent_via }),
  send: (id: string | number, sent_via: string) =>
    api.patch<QuotationDetail>(`quotations/${id}/send/`, { sent_via }),
  accept: (id: string | number) =>
    api.patch<QuotationDetail>(`quotations/${id}/accept/`, {}),
  cancel: (id: string | number, cancellation_reason?: string) =>
    api.patch<QuotationDetail>(`quotations/${id}/cancel/`, { cancellation_reason }),
  duplicate: (id: string | number, customer?: number, status?: string) =>
    api.post<QuotationDetail>(`quotations/${id}/duplicate/`, { customer, status }),
  delete: (id: string | number) => api.delete(`quotations/${id}/`),
};
