import { ApiResponse } from '../../../shared/types/api';

/**
 * Standardized API response wrapper.
 * Ensures consistent structure across all API responses.
 */
export function success<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function error<T>(message: string, data?: T): ApiResponse<T> {
  return {
    success: false,
    data,
    error: {
      code: 'API_ERROR',
      message,
    },
  };
}

/**
 * Helper to create API response with validation errors.
 * @param errors - Array of validation error messages
 * @param data - Optional data to include (e.g., field-specific errors)
 */
export function validationError<T>(errors: string[], data?: T): ApiResponse<T> {
  const details: Record<string, string> = {};
  errors.forEach((err) => {
    details[err] = err;
  });

  return {
    success: false,
    data,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    },
  };
}