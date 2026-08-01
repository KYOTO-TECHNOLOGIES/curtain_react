import { api } from './client';

export interface ActivityLog {
  id: number;
  action: string;
  details: Record<string, unknown>;
  content_type: number | string;
  object_id: number;
  target_type: string;
  target_id: number;
  user: number;
  user_email: string;
  created_at: string;
}

export const activitiesApi = {
  list: (params?: { content_type?: string }) => api.get<ActivityLog[]>('/activities/activity-logs/', { params }),
};
