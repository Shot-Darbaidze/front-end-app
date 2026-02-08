/**
 * CSRF Protection Utilities
 * Implements Cross-Site Request Forgery protection (OWASP A01:2021)
 */

import { randomBytes, createHash } from 'crypto';
import { logger } from './secureLogger';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_TOKEN_COOKIE = 'csrf_token';

/**
 * Generate a random CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a CSRF token for storage
 */
export function hashCSRFToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verify CSRF token matches
 */
export function verifyCSRFToken(token: string, hashedToken: string): boolean {
  const hashedInput = hashCSRFToken(token);
  
  // Use timing-safe comparison to prevent timing attacks
  if (hashedInput.length !== hashedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < hashedInput.length; i++) {
    result |= hashedInput.charCodeAt(i) ^ hashedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromHeaders(headers: Headers): string | null {
  return headers.get(CSRF_TOKEN_HEADER);
}

/**
 * Set CSRF token in response headers
 */
export function setCSRFTokenHeader(headers: Headers, token: string): void {
  headers.set(CSRF_TOKEN_HEADER, token);
}

/**
 * Client-side hook to get and include CSRF token
 */
export class CSRFProtection {
  private token: string | null = null;

  /**
   * Initialize CSRF token
   */
  async initialize(): Promise<void> {
    // Get token from server
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.token;
      
      // Store in sessionStorage (not localStorage for security)
      if (typeof window !== 'undefined' && this.token) {
        sessionStorage.setItem(CSRF_TOKEN_COOKIE, this.token);
      }
    } catch (_error) {
      logger.warn('Failed to initialize CSRF token');
    }
  }

  /**
   * Get current CSRF token
   */
  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = sessionStorage.getItem(CSRF_TOKEN_COOKIE);
    }
    return this.token;
  }

  /**
   * Add CSRF token to request headers
   */
  addTokenToHeaders(headers: Record<string, string>): Record<string, string> {
    const token = this.getToken();
    if (token) {
      return {
        ...headers,
        [CSRF_TOKEN_HEADER]: token,
      };
    }
    return headers;
  }

  /**
   * Clear CSRF token
   */
  clear(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CSRF_TOKEN_COOKIE);
    }
  }
}

// Singleton instance
export const csrfProtection = new CSRFProtection();
