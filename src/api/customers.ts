import { api } from './client';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerLookupResponse, CreateOrGetCustomerResponse } from '../types';

export const customersApi = {
  list: (search?: string) =>
    api.get<Customer[]>('customers/', { params: search ? { search } : undefined }),

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
