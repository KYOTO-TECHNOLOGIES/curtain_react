import { api } from './client';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types';

export interface UserListParams {
  search?: string;
  limit?: number;
  offset?: number;
  role?: number;
  [key: string]: any;
}

export const usersApi = {
  list: (params?: UserListParams) =>
    api.get<User[]>('users/', { params }),

  get: (id: number) =>
    api.get<User>(`users/${id}/`),

  create: (data: CreateUserRequest) =>
    api.post<User>('users/', data),

  update: (id: number, data: UpdateUserRequest) =>
    api.patch<User>(`users/${id}/`, data),

  delete: (id: number) =>
    api.delete(`users/${id}/`),
};
