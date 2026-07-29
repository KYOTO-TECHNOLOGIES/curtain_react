import { api } from './client';
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '../types';

export const rolesApi = {
  list: () =>
    api.get<Role[]>('roles/'),

  get: (id: number) =>
    api.get<Role>(`roles/${id}/`),

  create: (data: CreateRoleRequest) =>
    api.post<Role>('roles/', data),

  update: (id: number, data: UpdateRoleRequest) =>
    api.patch<Role>(`roles/${id}/`, data),

  delete: (id: number) =>
    api.delete(`roles/${id}/`),
};
