'use client';

import { HTTP_STATUS, ERROR_MESSAGES, API_CONFIG, STORAGE_KEYS } from './constants';
import { CacheManager } from '@/lib/cache';
import { LIMITS } from '@/config/constants';
import { csrfProtection } from '@/utils/csrf';
import { logger } from '@/utils/secureLogger';

// Error response interface
interface ErrorResponse {
  message: string;
  code?: string;
  status: number;
  data?: any;
}

// Request interceptor type
interface RequestInterceptor {
  (config: RequestConfig): RequestConfig;
}

// Response interceptor type
interface ResponseInterceptor {
  (response: Response): Response;
}

// Error interceptor type
interface ErrorInterceptor {
  (error: ErrorResponse): Promise<never>;
}

// Request config interface
interface RequestConfig {
  headers?: Record<string, string>;
  body?: any;
  [key: string]: any;
}

/**
 * APIService - Centralized API communication layer
 * Handles:
 * - Request/response interceptors
 * - Authentication token injection
 * - Error handling and retry logic
 * - Request caching
 * - Loading states
 */
class APIService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private authToken: string | null = null;
  private cache: CacheManager;
  
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
    this.cache = new CacheManager(LIMITS.CACHE_MAX_SIZE);
    
    // Load auth token from storage
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // Initialize CSRF protection
      csrfProtection.initialize().catch((err) => {
        logger.error('Failed to initialize CSRF protection', err);
      });
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    }
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Build headers with authentication and CSRF protection
   */
  private buildHeaders(headers?: Record<string, string>): Record<string, string> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Add CSRF token for state-changing operations
    const csrfHeaders = csrfProtection.addTokenToHeaders(defaultHeaders);

    return { ...csrfHeaders, ...headers };
  }

  /**
   * Apply request interceptors
   */
  private applyRequestInterceptors(config: RequestConfig): RequestConfig {
    let modifiedConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   */
  private applyResponseInterceptors(response: Response): Response {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: ErrorResponse): Promise<never> {
    for (const interceptor of this.errorInterceptors) {
      try {
        await interceptor(error);
      } catch (_err) {
        // Continue to next interceptor
      }
    }
    throw error;
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    message: string,
    status: number = 500,
    code?: string,
    data?: any
  ): ErrorResponse {
    return { message, status, code, data };
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest(
    fn: () => Promise<Response>,
    attempt: number = 0
  ): Promise<Response> {
    try {
      return await fn();
    } catch (error) {
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(fn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response): Promise<ErrorResponse> {
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { error: response.statusText };
    }

    const status = response.status;
    let message = ERROR_MESSAGES.UNKNOWN_ERROR;
    let code: string | undefined;

    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        message = ERROR_MESSAGES.VALIDATION_ERROR;
        code = 'VALIDATION_ERROR';
        break;
      case HTTP_STATUS.UNAUTHORIZED:
        message = ERROR_MESSAGES.UNAUTHORIZED;
        code = 'UNAUTHORIZED';
        // Clear auth token on 401
        this.setAuthToken(null);
        break;
      case HTTP_STATUS.FORBIDDEN:
        message = ERROR_MESSAGES.FORBIDDEN;
        code = 'FORBIDDEN';
        break;
      case HTTP_STATUS.NOT_FOUND:
        message = ERROR_MESSAGES.NOT_FOUND;
        code = 'NOT_FOUND';
        break;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        message = ERROR_MESSAGES.SERVER_ERROR;
        code = 'SERVER_ERROR';
        break;
    }

    // Use custom error message if provided
    if (data?.message) {
      message = data.message;
    }

    return this.createErrorResponse(message, status, code, data);
  }

  /**
   * Perform HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options.headers as Record<string, string>);

    let config: RequestConfig = {
      ...options,
      headers,
    };

    // Apply request interceptors
    config = this.applyRequestInterceptors(config);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Retry wrapper
      const response = await this.retryRequest(async () => {
        return fetch(url, {
          ...config,
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        const errorResponse = await this.handleErrorResponse(response);
        await this.applyErrorInterceptors(errorResponse);
      }

      // Apply response interceptors
      const finalResponse = this.applyResponseInterceptors(response);
      const data = await finalResponse.json();

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle network errors
      if (error.name === 'AbortError') {
        const errorResponse = this.createErrorResponse(
          ERROR_MESSAGES.TIMEOUT,
          408,
          'TIMEOUT'
        );
        await this.applyErrorInterceptors(errorResponse);
      }

      // Handle fetch errors
      if (error instanceof TypeError) {
        const errorResponse = this.createErrorResponse(
          ERROR_MESSAGES.NETWORK_ERROR,
          0,
          'NETWORK_ERROR'
        );
        await this.applyErrorInterceptors(errorResponse);
      }

      throw error;
    }
  }

  /**
   * GET request with optional caching
   */
  async get<T = any>(endpoint: string, options?: RequestInit & { cache?: boolean; cacheTTL?: number }): Promise<T> {
    // Check cache first if enabled
    if (options?.cache !== false) {
      const cached = this.cache.get<T>(endpoint);
      if (cached) {
        logger.debug('Cache hit', { endpoint });
        return cached;
      }
    }

    const result = await this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });

    // Store in cache if cache is enabled
    if (options?.cache !== false) {
      const ttl = options?.cacheTTL || LIMITS.CACHE_TTL;
      this.cache.set(endpoint, result, ttl);
    }

    return result;
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * File upload (multipart/form-data)
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }

    const headers = { ...this.buildHeaders() };
    // Remove Content-Type header - browser will set it with boundary
    delete headers['Content-Type'];

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  /**
   * Invalidate cache for specific endpoint
   */
  invalidateCache(endpoint?: string): void {
    if (endpoint) {
      this.cache.delete(endpoint);
      logger.debug('Cache invalidated', { endpoint });
    } else {
      this.cache.clear();
      logger.debug('Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    this.cache.clearExpired();
  }
}

// Create singleton instance
export const api = new APIService();

// Setup default interceptors
// Error interceptor for logging
api.addErrorInterceptor(async (error) => {
  const statusLabel = error?.status ? ` (${error.status})` : '';
  logger.error(`API Error${statusLabel}`, error, error?.data);
  throw error;
});

// Request interceptor for logging (optional)
api.addRequestInterceptor((config) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('API Request', { config });
  }
  return config;
});
