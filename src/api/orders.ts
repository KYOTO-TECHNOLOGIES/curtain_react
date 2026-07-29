import { api } from './client';
import type { OrderListItem, OrderStats } from '../types';

export const ordersApi = {
  list: (params?: any) => api.get<OrderListItem[]>('orders/', { params }),
  stats: () => api.get<OrderStats>('orders/stats/'),
  get: (id: string | number) => api.get(`orders/${id}/`),
  create: (data: any) => api.post('orders/', data),
  updateStatus: (id: string | number, status: string) => api.patch(`orders/${id}/status/`, { order_status: status }),
  generateInvoice: (id: string | number) => api.post(`orders/${id}/generate-invoice/`),
  delete: (id: string | number) => api.delete(`orders/${id}/`),
};
