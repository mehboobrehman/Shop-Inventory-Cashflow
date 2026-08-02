import { UserRole } from './enums';
import { ISODateString, UUID } from './common';

/** Authenticated user entity (no sensitive fields). */
export interface User {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Login request payload. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Registration / user creation request payload. */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/** Login response returned after successful authentication. */
export interface LoginResponse {
  token?: string;
  user: User;
}

/** Decoded JWT payload structure (server-side verification). */
export interface JWTPayload {
  sub: UUID;       // user id
  email: string;
  role: UserRole;
  iat?: number;    // issued at (unix seconds)
  exp?: number;    // expiration (unix seconds)
}
