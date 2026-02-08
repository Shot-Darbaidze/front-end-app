/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL Injection, and other injection attacks
 * Implements OWASP A03:2021 – Injection
 */

/**
 * HTML entity encoding map
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML to prevent XSS attacks
 */
export function escapeHTML(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip HTML tags from text
 */
export function stripHTML(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string, options: {
  allowHTML?: boolean;
  maxLength?: number;
  trim?: boolean;
} = {}): string {
  const {
    allowHTML = false,
    maxLength = 10000,
    trim = true,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Strip or escape HTML
  if (!allowHTML) {
    sanitized = escapeHTML(stripHTML(sanitized));
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize SQL input to prevent SQL injection
 * Note: Always use parameterized queries as primary defense
 */
export function sanitizeSQL(input: string): string {
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments start
    .replace(/\*\//g, '') // Remove multi-line comments end
    .replace(/\bOR\b/gi, '') // Remove OR keyword
    .replace(/\bAND\b/gi, '') // Remove AND keyword
    .replace(/\bUNION\b/gi, '') // Remove UNION keyword
    .replace(/\bSELECT\b/gi, '') // Remove SELECT keyword
    .replace(/\bINSERT\b/gi, '') // Remove INSERT keyword
    .replace(/\bUPDATE\b/gi, '') // Remove UPDATE keyword
    .replace(/\bDELETE\b/gi, '') // Remove DELETE keyword
    .replace(/\bDROP\b/gi, '') // Remove DROP keyword
    .trim();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(filePath: string): string {
  // Remove directory traversal patterns more aggressively
  let sanitized = filePath;
  
  // Remove all instances of .. (even multiple in a row)
  while (sanitized.includes('..')) {
    sanitized = sanitized.replace(/\.\./g, '');
  }
  
  return sanitized
    .replace(/[/\\]{2,}/g, '/') // Replace multiple slashes
    .replace(/^[/\\]/, '') // Remove leading slash
    .replace(/[<>:"|?*]/g, ''); // Remove invalid characters
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[/\\]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 255); // Max filename length
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    allowHTML?: boolean;
    maxLength?: number;
  } = {}
): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value, options);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item, options)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, options)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJSON(jsonString: string): unknown | null {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    
    // Sanitize the parsed object
    if (typeof parsed === 'object' && parsed !== null) {
      return sanitizeObject(parsed as Record<string, unknown>);
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Check if input contains potential XSS payloads
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe\b[^>]*>/i,
    /<object\b[^>]*>/i,
    /<embed\b[^>]*>/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if input contains potential SQL injection
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bOR\b.*=.*|\bAND\b.*=.*)/i,
    /\bUNION\b.*\bSELECT\b/i,
    /;.*\b(DROP|DELETE|INSERT|UPDATE)\b/i,
    /--/,
    /\/\*/,
    /\*\//,
    /'\s*OR\s*'1'\s*=\s*'1/i,
  ];
  
  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Rate limiting helper for input validation
 */
export class InputValidator {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts = 5;
  private windowMs = 60000; // 1 minute

  /**
   * Check if input validation should be allowed
   */
  canValidate(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  /**
   * Reset attempts for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Singleton instance
export const inputValidator = new InputValidator();
