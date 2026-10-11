import { api } from './client';
import type { InvoiceListItem, OrderDetail, OrderListItem, OrderStats } from '../types';

export const ordersApi = {
  list: (params?: any) => api.get<OrderListItem[]>('orders/', { params }),
  stats: () => api.get<OrderStats>('orders/stats/'),
  get: (id: string | number) => api.get<OrderDetail>(`orders/${id}/`),
  create: (data: any) => api.post<OrderDetail>('orders/', data),
  updateStatus: (id: string | number, status: string) =>
    api.patch<OrderDetail>(`orders/${id}/status/`, { order_status: status }),
  generateInvoice: (id: string | number) => api.post<InvoiceListItem>(`orders/${id}/generate-invoice/`),
  delete: (id: string | number) => api.delete(`orders/${id}/`),
};
