import axios from 'axios';
import { LoginResponse, User } from '@shop/shared';

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh (placeholder for future implementation)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not a retry, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await refreshToken();
        if (refreshResponse) {
          // Update token in localStorage
          localStorage.setItem('authToken', refreshResponse.token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

export const register = async (email: string, password: string, name: string): Promise<User> => {
  const response = await api.post('/auth/register', { email, password, name });
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

// Placeholder for token refresh - would need backend implementation
const refreshToken = async (): Promise<LoginResponse | null> => {
  // This would call a /auth/refresh endpoint
  // For now, return null to indicate no refresh capability
  return null;
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
};