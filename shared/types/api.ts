/**
 * Standard API response envelope used by every endpoint.
 * Ensures a consistent shape for success and error cases.
 */

/** Structured error returned inside ApiResponse.error. */
export interface ApiError {
  /** Machine-readable error code, e.g. "VALIDATION_ERROR", "NOT_FOUND". */
  code: string;
  /** Human-readable error message safe to display to users. */
  message: string;
  /** Optional field-level validation details. */
  details?: Record<string, string>;
}

/**
 * Universal response wrapper.
 * - On success: `{ success: true, data: T }`
 * - On failure:  `{ success: false, error: ApiError }`
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/** Convenience alias for paginated API responses. */
export type ApiPaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: import('./common').PaginationMeta;
}>;

export type { VersionInfo } from './common';

