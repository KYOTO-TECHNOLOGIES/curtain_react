import { api } from './client';
import type {
  AppointmentListItem,
  AppointmentDetail,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentFilters,
  AppointmentStats,
} from '../types';

const toSafeAssigneeId = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

type AssigneePayload = {
  assigned_to?: number;
  assignee?: number | null;
  assignee_id?: number | null;
};

const normalizeAssigneePayload = <T extends Record<string, unknown>>(payload: T): T & AssigneePayload => {
  const normalized: Record<string, unknown> = { ...payload };
  const assigneeId = toSafeAssigneeId(
    (normalized as Record<string, unknown>).assignee ??
    (normalized as Record<string, unknown>).assignee_id ??
    (normalized as Record<string, unknown>).assigned_to
  );

  if (assigneeId !== undefined) {
    normalized.assigned_to = assigneeId;
    normalized.assignee = assigneeId;
    normalized.assignee_id = assigneeId;
  }

  return normalized as T & AssigneePayload;
};

const normalizeAppointmentResponse = <T>(data: T): T => {
  if (!data || typeof data !== 'object') return data;

  const item = data as Record<string, any>;
  const assigneeValue = item.assignee ?? item.assignee_id ?? item.assigned_to;
  const assigneeId = typeof assigneeValue === 'object' && assigneeValue !== null
    ? toSafeAssigneeId(assigneeValue.id ?? assigneeValue.assignee_id ?? assigneeValue.assignee)
    : toSafeAssigneeId(assigneeValue);

  if (assigneeId !== undefined) {
    item.assigned_to = assigneeId;
    item.assignee = item.assignee ?? assigneeId;
    item.assignee_id = item.assignee_id ?? assigneeId;
  }

  if (item.assignee_name == null && item.assigned_to_name) {
    item.assignee_name = item.assigned_to_name;
  }

  if (item.assignee_username == null && item.assigned_to_username) {
    item.assignee_username = item.assigned_to_username;
  }

  return data;
};

const normalizeApiResponse = (response: any) => {
  if (!response || !response.data) return response;
  if (Array.isArray(response.data)) {
    return {
      ...response,
      data: response.data.map((item: any) => normalizeAppointmentResponse(item)),
    };
  }
  if (typeof response.data === 'object' && Array.isArray(response.data.results)) {
    return {
      ...response,
      data: {
        ...response.data,
        results: response.data.results.map((item: any) => normalizeAppointmentResponse(item)),
      },
    };
  }
  return {
    ...response,
    data: normalizeAppointmentResponse(response.data),
  };
};

export const appointmentsApi = {
  list: (filters?: AppointmentFilters & { limit?: number; offset?: number }) =>
    api.get<AppointmentListItem[]>('appointments/', { params: filters }).then(normalizeApiResponse),

  get: (id: number | string) =>
    api.get<AppointmentDetail>(`appointments/${id}/`).then(normalizeApiResponse),

  create: (data: CreateAppointmentRequest) =>
    api.post<AppointmentDetail>('appointments/', normalizeAssigneePayload({ ...data })).then(normalizeApiResponse),

  update: (id: number | string, data: UpdateAppointmentRequest) =>
    api.patch<AppointmentDetail>(`appointments/${id}/`, normalizeAssigneePayload({ ...data })).then(normalizeApiResponse),

  delete: (id: number | string) =>
    api.delete(`appointments/${id}/`),

  updateStatus: (id: number | string, data: { status: string; cancellation_reason?: string }) =>
    api.patch<AppointmentDetail>(`appointments/${id}/status/`, data).then(normalizeApiResponse),

  assign: (id: number | string, assignedTo: number) =>
    api.patch<AppointmentDetail>(`appointments/${id}/assign/`, {
      assigned_to: assignedTo,
      assignee: assignedTo,
      assignee_id: assignedTo,
    }).then(normalizeApiResponse),

  reschedule: (id: number | string, data: { appointment_date: string; appointment_time: string; end_time?: string }) =>
    api.post<AppointmentDetail>(`appointments/${id}/reschedule/`, data).then(normalizeApiResponse),

  myAppointments: (filters?: { status?: string }) =>
    api.get<AppointmentListItem[]>('appointments/my/', { params: filters }).then(normalizeApiResponse),

  stats: () =>
    api.get<AppointmentStats>('appointments/stats/'),
};
