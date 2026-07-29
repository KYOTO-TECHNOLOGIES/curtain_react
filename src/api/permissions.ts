import { api } from './client';
import type { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '../types';

export const permissionsApi = {
  list: () =>
    api.get<Permission[]>('permissions/'),

  get: (id: number) =>
    api.get<Permission>(`permissions/${id}/`),

  create: (data: CreatePermissionRequest) =>
    api.post<Permission>('permissions/', data),

  update: (id: number, data: UpdatePermissionRequest) =>
    api.patch<Permission>(`permissions/${id}/`, data),

  delete: (id: number) =>
    api.delete(`permissions/${id}/`),
};
