export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STOCK_KEEPER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: User;
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}
