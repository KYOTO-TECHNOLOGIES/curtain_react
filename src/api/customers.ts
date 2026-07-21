import { api } from './client';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../types';

export const customersApi = {
  list: () =>
    api.get<Customer[]>('customers/'),

  get: (id: number) =>
    api.get<Customer>(`customers/${id}/`),

  create: (data: CreateCustomerRequest) =>
    api.post<Customer>('customers/', data),

  update: (id: number, data: UpdateCustomerRequest) =>
    api.patch<Customer>(`customers/${id}/`, data),

  delete: (id: number) =>
    api.delete(`customers/${id}/`),
};
