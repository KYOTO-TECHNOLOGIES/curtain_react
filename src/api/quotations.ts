import { api } from './client';
import type { QuotationListItem, QuotationStats } from '../types';

export const quotationsApi = {
  list: (params?: any) => api.get<QuotationListItem[]>('quotations/', { params }),
  stats: () => api.get<QuotationStats>('quotations/stats/'),
  get: (id: string | number) => api.get(`quotations/${id}/`),
  create: (data: any) => api.post('quotations/', data),
  update: (id: string | number, data: any) => api.patch(`quotations/${id}/`, data),
  delete: (id: string | number) => api.delete(`quotations/${id}/`),
};
