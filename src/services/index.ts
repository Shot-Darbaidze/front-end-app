// Export API service and utilities
export { api } from './api';
export { API_ENDPOINTS, API_CONFIG, HTTP_STATUS, ERROR_MESSAGES, STORAGE_KEYS } from './constants';

// Type definitions
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  data?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
