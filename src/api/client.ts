import axios from 'axios';

// The base URL points directly to the backend IP you provided or localhost
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  // Do not attach token for login or refresh endpoints
  if (token && !config.url?.includes('/auth/login') && !config.url?.includes('/auth/refresh')) {
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
        const { store } = await import('../store');
        const { logoutSuccess, loginSuccess } = await import('../store/slices/authSlice');
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
        const { store } = await import('../store');
        const { logoutSuccess } = await import('../store/slices/authSlice');
        store.dispatch(logoutSuccess());
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
