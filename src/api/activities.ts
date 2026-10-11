import { api } from './client';
import type { ActivityLog } from '../types';

export type { ActivityLog };

export interface ActivityListParams {
  content_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

export const activitiesApi = {
  list: (params?: ActivityListParams) =>
    api.get<ActivityLog[]>('activities/activity-logs/', { params }),
};
