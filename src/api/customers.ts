import { api } from './client';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerLookupResponse, CreateOrGetCustomerResponse } from '../types';

export interface CustomerListParams {
  search?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

export const customersApi = {
  list: (params?: CustomerListParams | string) => {
    const queryParams = typeof params === 'string' ? { search: params } : params;
    return api.get<Customer[]>('customers/', { params: queryParams });
  },

  get: (id: number) =>
    api.get<Customer>(`customers/${id}/`),

  create: (data: CreateCustomerRequest) =>
    api.post<Customer>('customers/', data),

  update: (id: number, data: UpdateCustomerRequest) =>
    api.patch<Customer>(`customers/${id}/`, data),

  delete: (id: number) =>
    api.delete(`customers/${id}/`),

  lookup: (params: { phone?: string; email?: string }) =>
    api.get<CustomerLookupResponse>('customers/lookup/', { params }),

  createOrGet: (data: Partial<CreateCustomerRequest>) =>
    api.post<CreateOrGetCustomerResponse>('customers/create-or-get/', data),
};
