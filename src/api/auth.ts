import { api } from './client';
import type { LoginRequest, LoginResponse, RefreshResponse, User } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('auth/login/', data),

  refresh: (refresh?: string) =>
    api.post<RefreshResponse>('auth/refresh/', refresh ? { refresh } : {}),

  logout: (refresh?: string) =>
    api.post('auth/logout/', refresh ? { refresh } : {}),

  me: () =>
    api.get<User>('auth/me/'),
};
