import apiClient from './apiClient';
import { LoginResponse, User } from '@shop/shared';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data.data;
};

export const register = async (email: string, password: string, name: string, role?: string): Promise<User> => {
  const response = await apiClient.post('/auth/register', { email, password, name, role });
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data.data;
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
};
