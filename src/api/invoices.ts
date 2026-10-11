import { api } from './client';
import type { AddPaymentRequest, InvoiceListItem, InvoiceStats } from '../types';

export const invoicesApi = {
  list: (params?: any) => api.get<InvoiceListItem[]>('invoices/', { params }),
  stats: () => api.get<InvoiceStats>('invoices/stats/'),
  get: (id: string) => api.get<InvoiceListItem>(`invoices/${id}/`),
  create: (data: any) => api.post<InvoiceListItem>('invoices/', data),
  updateStatus: (id: string, status: string, sent_via?: string) =>
    api.patch<InvoiceListItem>(`invoices/${id}/status/`, { status, sent_via }),
  send: (id: string, sent_via: string) => api.patch<InvoiceListItem>(`invoices/${id}/send/`, { sent_via }),
  addPayment: (id: string, data: AddPaymentRequest) =>
    api.post<InvoiceListItem>(`invoices/${id}/add-payment/`, data),
  delete: (id: string) => api.delete(`invoices/${id}/`),
};
