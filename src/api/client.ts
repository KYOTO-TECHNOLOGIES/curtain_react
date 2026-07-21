import axios from 'axios';
import { store } from '../store';
import { logoutSuccess, loginSuccess } from '../store/slices/authSlice';

// The base URL points directly to the backend IP you provided
export const api = axios.create({
  baseURL: 'http://187.127.171.93:8110/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop on login/refresh endpoints
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // If 401 Unauthorized, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
           store.dispatch(logoutSuccess());
           return Promise.reject(error);
        }
        
        // Use standard axios to avoid circular interceptor logic
        const res = await axios.post(`${api.defaults.baseURL}auth/refresh/`, { refresh: refreshToken }, { withCredentials: true });
        
        const newAccess = res.data.access;
        const newRefresh = res.data.refresh;
        const user = res.data.user;
        
        // Update Redux state and localStorage
        store.dispatch(loginSuccess({ user, accessToken: newAccess, refreshToken: newRefresh }));
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (err) {
        // Refresh failed, log user out
        store.dispatch(logoutSuccess());
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
