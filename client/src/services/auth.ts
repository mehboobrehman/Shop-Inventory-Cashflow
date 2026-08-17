import axios from 'axios';
import { LoginResponse, User } from '@shop/shared';

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

export const register = async (email: string, password: string, name: string, role?: string): Promise<User> => {
  const response = await api.post('/auth/register', { email, password, name, role });
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
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