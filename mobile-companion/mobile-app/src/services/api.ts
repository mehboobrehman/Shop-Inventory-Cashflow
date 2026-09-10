import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import storage from './storage';
import { ApiResponse, LoginRequest, LoginResponseData, User } from '../types/auth';

const DEFAULT_PORT = 4000;

export const resolveBaseUrl = (customInput?: string | null): string => {
  if (!customInput || !customInput.trim()) {
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:${DEFAULT_PORT}/api/v1`;
  }

  let input = customInput.trim();

  // Ensure protocol prefix
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    input = `http://${input}`;
  }

  // Remove trailing slashes
  input = input.replace(/\/+$/, '');

  // If already contains /api/v* path, return as is
  if (/\/api\/v\d+/i.test(input)) {
    return input;
  }

  // If missing port and is simple hostname/IP, attach default port
  const urlParts = input.split('://');
  const protocol = urlParts[0];
  let hostAndPath = urlParts[1];

  if (!hostAndPath.includes(':') && !hostAndPath.includes('/')) {
    hostAndPath = `${hostAndPath}:${DEFAULT_PORT}`;
  }

  return `${protocol}://${hostAndPath}/api/v1`;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

export const setApiBaseUrl = (url: string): string => {
  const formattedUrl = resolveBaseUrl(url);
  apiClient.defaults.baseURL = formattedUrl;
  return formattedUrl;
};

// Request Interceptor: Automatically attach Bearer JWT
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAuth();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const loginApi = async (credentials: LoginRequest): Promise<LoginResponseData> => {
  const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || response.data.message || 'Login failed');
  }
  return response.data.data;
};

export const getCurrentUserApi = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || response.data.message || 'Failed to retrieve current user');
  }
  return response.data.data;
};

export const logoutApi = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.warn('Logout API call failed or network unavailable:', error);
  } finally {
    await storage.clearAuth();
  }
};

export const scanBarcodeApi = async (barcode: string): Promise<any> => {
  const response = await apiClient.post<ApiResponse<any>>('/stock/scan', { barcode });
  return response.data;
};

export default {
  apiClient,
  resolveBaseUrl,
  setApiBaseUrl,
  setOnUnauthorized,
  loginApi,
  getCurrentUserApi,
  logoutApi,
  scanBarcodeApi,
};
