import { api } from './client';
import type { Payment } from '../types';

export const paymentsApi = {
  list: (params?: any) => api.get<Payment[]>('payments/', { params }),
  create: (data: any) => api.post('payments/', data),
  delete: (id: string | number) => api.delete(`payments/${id}/`),
};
