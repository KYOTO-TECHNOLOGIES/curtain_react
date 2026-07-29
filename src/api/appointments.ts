import { api } from './client';
import type {
  AppointmentListItem,
  AppointmentDetail,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentFilters,
  AppointmentStats,
} from '../types';

export const appointmentsApi = {
  list: (filters?: AppointmentFilters) =>
    api.get<AppointmentListItem[]>('appointments/', { params: filters }),

  get: (id: number | string) =>
    api.get<AppointmentDetail>(`appointments/${id}/`),

  create: (data: CreateAppointmentRequest) =>
    api.post<AppointmentDetail>('appointments/', data),

  update: (id: number | string, data: UpdateAppointmentRequest) =>
    api.patch<AppointmentDetail>(`appointments/${id}/`, data),

  delete: (id: number | string) =>
    api.delete(`appointments/${id}/`),

  updateStatus: (id: number | string, data: { status: string; cancellation_reason?: string }) =>
    api.patch<AppointmentDetail>(`appointments/${id}/status/`, data),

  assign: (id: number | string, assignedTo: number) =>
    api.patch<AppointmentDetail>(`appointments/${id}/assign/`, { assigned_to: assignedTo }),

  reschedule: (id: number | string, data: { appointment_date: string; appointment_time: string; end_time?: string }) =>
    api.post<AppointmentDetail>(`appointments/${id}/reschedule/`, data),

  myAppointments: (filters?: { status?: string }) =>
    api.get<AppointmentListItem[]>('appointments/my/', { params: filters }),

  stats: () =>
    api.get<AppointmentStats>('appointments/stats/'),
};
