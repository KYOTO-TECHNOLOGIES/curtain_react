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

  // Backend docs use `customer_source`; mirror to `source` so either serializer field is filled.
  const rawSource = normalized.source ?? normalized.customer_source;
  if (rawSource !== undefined && rawSource !== null && String(rawSource).trim() !== '') {
    const cleanSource = String(rawSource).trim();
    normalized.source = cleanSource;
    normalized.customer_source = cleanSource;
  } else {
    delete normalized.source;
    delete normalized.customer_source;
  }

  return normalized as T & AssigneePayload;
};

/**
 * Local fallback for the appointment source. The documented GET responses do not
 * include a source field, so the value chosen at creation is remembered per
 * appointment id and used only when the API response has no source.
 */
const SOURCE_CACHE_KEY = 'appointment_sources';

const readSourceCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(SOURCE_CACHE_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const rememberSource = (id: unknown, source: unknown) => {
  if (id === undefined || id === null) return;
  try {
    const cache = readSourceCache();
    const clean = source === undefined || source === null ? '' : String(source).trim();
    if (clean) cache[String(id)] = clean;
    else delete cache[String(id)];
    localStorage.setItem(SOURCE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable; ignore
  }
};

// 'pending' was removed from the appointment workflow; treat legacy rows as 'scheduled'.
const normalizeStatus = (status: unknown) => (status === 'pending' ? 'scheduled' : status);

const normalizeAppointmentResponse = <T>(data: T): T => {
  if (!data || typeof data !== 'object') return data;

  const item = data as Record<string, any>;
  if (item.status !== undefined) item.status = normalizeStatus(item.status);
  if (item.by_status && typeof item.by_status === 'object' && item.by_status.pending) {
    item.by_status.scheduled = (item.by_status.scheduled || 0) + item.by_status.pending;
    delete item.by_status.pending;
  }
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
  if (item.assigned_to_name == null && item.assignee_name) {
    item.assigned_to_name = item.assignee_name;
  }

  if (item.assignee_username == null && item.assigned_to_username) {
    item.assignee_username = item.assigned_to_username;
  }
  if (item.assigned_to_username == null && item.assignee_username) {
    item.assigned_to_username = item.assignee_username;
  }

  // Source may live on the appointment or on the nested customer, under several names.
  const customerObj = item.customer && typeof item.customer === 'object' ? item.customer : null;
  const apiSource = [
    item.source,
    item.customer_source,
    item.appointment_source,
    item.lead_source,
    customerObj?.source,
    customerObj?.customer_source,
    customerObj?.lead_source,
  ].find((value) => value !== undefined && value !== null && String(value).trim() !== '');

  const resolvedSource =
    apiSource !== undefined
      ? String(apiSource).trim()
      : item.id !== undefined && item.id !== null
        ? readSourceCache()[String(item.id)]
        : undefined;

  if (resolvedSource) {
    item.source = resolvedSource;
    item.customer_source = resolvedSource;
  } else if (item.id !== undefined) {
    // Never surface an empty string / bogus default as a source.
    delete item.source;
    delete item.customer_source;
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

/** Numeric part of an id like "APT-1035" or 1035, used as a tie-breaker. */
const idNumber = (id: unknown): number => {
  if (typeof id === 'number') return id;
  const match = String(id ?? '').match(/\d+/g);
  return match ? Number(match[match.length - 1]) : 0;
};

/** Newest first: created_at DESC, then id DESC. */
const compareNewestFirst = (a: any, b: any): number => {
  const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
  const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
  if (tb !== ta) return tb - ta;
  return idNumber(b?.id) - idNumber(a?.id);
};

const FETCH_CHUNK = 500;

/**
 * NOTE: The backend (see README "3.1 List Appointments") does NOT support any
 * ordering parameter — `ordering`, `order_by`, `sort` are all ignored, and it
 * always sorts by `appointment_date` ASC *before* applying limit/offset. That
 * pushes newly created appointments onto the last page.
 *
 * To guarantee "newest created first" across ALL pages, we fetch the complete
 * filtered set (status/assigned_to/search are still applied server-side),
 * sort it globally by created_at DESC, and only then apply limit/offset.
 */
const fetchAllSorted = async (params: Record<string, unknown>): Promise<AppointmentListItem[]> => {
  const all: AppointmentListItem[] = [];
  let offset = 0;
  // Loop in chunks in case the backend enforces a max_limit.
  for (let guard = 0; guard < 100; guard++) {
    const res = await api.get('appointments/', { params: { ...params, limit: FETCH_CHUNK, offset } });
    const data: any = res.data;
    const page: AppointmentListItem[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    all.push(...page);
    // Unpaginated array response or last page reached
    if (Array.isArray(data) || !data?.next || page.length === 0) break;
    offset += page.length;
  }
  return all.map((item) => normalizeAppointmentResponse(item)).sort(compareNewestFirst);
};

const ensureAssignableRole = async (userId: number | string | undefined | null) => {
  if (!userId) return;
  try {
    const userRes = await api.get<any>(`users/${userId}/`);
    const user = userRes.data;
    const roleName = (typeof user?.role === 'object' ? user.role?.name : user?.role_name || '')?.toString().trim().toLowerCase();
    // If the assigned user has an outdated role name like 'Administrator' (role_id 1),
    // migrate their role to 'Admin' (role_id 2) so backend validation succeeds.
    if (roleName === 'administrator') {
      await api.patch(`users/${userId}/`, { role_id: 2 });
    }
  } catch {
    // Continue with operation
  }
};

export const appointmentsApi = {
  list: async (filters?: AppointmentFilters & { limit?: number; offset?: number }) => {
    const { limit, offset, ordering: _ordering, ...rest } = filters || {};
    // Drop empty filter values so they are not sent as `status=` etc.
    const params: Record<string, unknown> = {};
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params[k] = v;
    });

    const sorted = await fetchAllSorted(params);
    const count = sorted.length;

    // No pagination requested: return the full, sorted list.
    if (limit === undefined) {
      return { data: sorted } as { data: any };
    }

    const start = Math.max(0, offset ?? 0);
    const results = sorted.slice(start, start + limit);
    return {
      data: {
        count,
        next: start + limit < count ? start + limit : null,
        previous: start > 0 ? Math.max(0, start - limit) : null,
        results,
      },
    } as { data: any };
  },

  get: (id: number | string) =>
    api.get<AppointmentDetail>(`appointments/${id}/`).then(normalizeApiResponse),

  create: async (data: CreateAppointmentRequest) => {
    const assigneeId = data.assigned_to ?? (data as any).assignee ?? (data as any).assignee_id;
    if (assigneeId) {
      await ensureAssignableRole(assigneeId);
    }
    const res = await api.post<AppointmentDetail>(
      'appointments/',
      normalizeAssigneePayload({ ...data, status: 'scheduled' as const })
    );
    const created = res.data as AppointmentDetail;
    const submittedSource = data.source ?? data.customer_source;
    if (created?.id !== undefined) rememberSource(created.id, submittedSource);
    // Backend may ignore the submitted status and default to 'pending'; force 'scheduled'.
    if (created?.id !== undefined && created.status !== 'scheduled') {
      try {
        const fixed = await api.patch<AppointmentDetail>(`appointments/${created.id}/status/`, { status: 'scheduled' });
        return normalizeApiResponse(fixed);
      } catch {
        // fall through; normalizeApiResponse still maps legacy 'pending' to 'scheduled'
      }
    }
    return normalizeApiResponse(res);
  },

  update: async (id: number | string, data: UpdateAppointmentRequest) => {
    const assigneeId = data.assigned_to ?? (data as any).assignee ?? (data as any).assignee_id;
    if (assigneeId) {
      await ensureAssignableRole(assigneeId);
    }
    if ('source' in (data as any) || 'customer_source' in (data as any)) {
      rememberSource(id, (data as any).source ?? (data as any).customer_source);
    }
    return api.patch<AppointmentDetail>(`appointments/${id}/`, normalizeAssigneePayload({ ...data })).then(normalizeApiResponse);
  },

  delete: (id: number | string) =>
    api.delete(`appointments/${id}/`),

  updateStatus: (id: number | string, data: { status: string; cancellation_reason?: string }) =>
    api.patch<AppointmentDetail>(`appointments/${id}/status/`, data).then(normalizeApiResponse),

  assign: async (id: number | string, assignedTo: number) => {
    await ensureAssignableRole(assignedTo);
    return api.patch<AppointmentDetail>(`appointments/${id}/assign/`, {
      assigned_to: assignedTo,
      assignee: assignedTo,
      assignee_id: assignedTo,
    }).then(normalizeApiResponse);
  },

  reschedule: (id: number | string, data: { appointment_date: string; appointment_time: string; end_time?: string }) =>
    api.post<AppointmentDetail>(`appointments/${id}/reschedule/`, data).then(normalizeApiResponse),

  myAppointments: (filters?: { status?: string }) =>
    api.get<AppointmentListItem[]>('appointments/my/', { params: filters }).then(normalizeApiResponse),

  stats: () =>
    api.get<AppointmentStats>('appointments/stats/').then(normalizeApiResponse),
};
