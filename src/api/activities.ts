import { api } from './client';
import type { ActivityLog } from '../types';

export type { ActivityLog };

export const activitiesApi = {
  list: (params?: { content_type?: string }) =>
    api.get<ActivityLog[]>('activities/activity-logs/', { params }),
};
