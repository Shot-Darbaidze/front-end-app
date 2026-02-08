/**
 * Secure Logging Utility
 * Prevents PII (Personally Identifiable Information) leaks in logs
 * Implements OWASP A04:2021 – Insecure Design
 */

// PII patterns to redact
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  password: /password["\s:=]+([^\s,"'}]+)/gi,
  token: /token["\s:=]+([^\s,"'}]+)/gi,
  apiKey: /api[_-]?key["\s:=]+([^\s,"'}]+)/gi,
};

// Sensitive field names to redact
const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirm',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'ssn',
  'creditCard',
  'cvv',
  'pin',
  'securityAnswer',
];

/**
 * Redact PII from text
 */
export function redactPII(text: string): string {
  let redacted = text;
  
  // Replace email addresses
  redacted = redacted.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
  
  // Replace phone numbers
  redacted = redacted.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
  
  // Replace SSN
  redacted = redacted.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
  
  // Replace credit cards
  redacted = redacted.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
  
  // Replace IP addresses (partial - keep first octet for debugging)
  redacted = redacted.replace(PII_PATTERNS.ipAddress, (match) => {
    const parts = match.split('.');
    return `${parts[0]}.xxx.xxx.xxx`;
  });
  
  // Replace passwords/tokens
  redacted = redacted.replace(PII_PATTERNS.password, 'password: [REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.token, 'token: [REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.apiKey, 'api_key: [REDACTED]');
  
  return redacted;
}

/**
 * Redact sensitive fields from objects
 */
export function redactObject(obj: unknown, depth: number = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return redactPII(obj);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }
  
  const redacted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if field name is sensitive
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some((field) =>
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactObject(value, depth + 1);
    } else if (typeof value === 'string') {
      redacted[key] = redactPII(value);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Secure logger class
 */
export class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log information
   */
  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data ? redactObject(data) : '');
    } else if (this.isProduction) {
      // In production, send to logging service (e.g., Sentry, DataDog)
      this.sendToLoggingService('info', message, data);
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data ? redactObject(data) : '');
    } else if (this.isProduction) {
      this.sendToLoggingService('warn', message, data);
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: unknown, data?: unknown): void {
    const redactedError = error instanceof Error 
      ? { name: error.name, message: redactPII(error.message), stack: error.stack }
      : redactObject(error);
    
    const redactedData = data ? redactObject(data) : undefined;
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, redactedError, redactedData);
    } else if (this.isProduction) {
      this.sendToLoggingService('error', message, { error: redactedError, data: redactedData });
    }
  }

  /**
   * Debug logging (only in development)
   */
  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data ? redactObject(data) : '');
    }
  }

  /**
   * Security event logging
   */
  security(event: string, data?: unknown): void {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      data: redactObject(data),
    };
    
    if (this.isDevelopment) {
      console.warn(`[SECURITY] ${event}`, securityLog);
    }
    
    // Always log security events to monitoring service
    this.sendToLoggingService('security', event, securityLog);
  }

  /**
   * Send logs to external logging service
   * In production, replace with actual service (Sentry, DataDog, etc.)
   */
  private sendToLoggingService(level: string, message: string, data?: unknown): void {
    // Placeholder for external logging service integration
    // Example: Sentry.captureMessage(message, { level, extra: redactObject(data) });
    
    // For now, just ensure we don't expose PII
    if (this.isProduction && typeof window === 'undefined') {
      // Server-side logging only
      const safeData = data ? redactObject(data) : undefined;
      // Could write to file, send to external service, etc.
      console.log(JSON.stringify({ level, message, data: safeData }));
    }
  }
}

// Singleton instance
export const logger = new SecureLogger();

/**
 * Replace console methods in production to prevent accidental PII leaks
 */
export function interceptConsole(): void {
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args: any[]) => {
      const redacted = args.map((arg) => 
        typeof arg === 'object' ? redactObject(arg) : redactPII(String(arg))
      );
      originalLog(...redacted);
    };

    console.error = (...args: any[]) => {
      const redacted = args.map((arg) => 
        typeof arg === 'object' ? redactObject(arg) : redactPII(String(arg))
      );
      originalError(...redacted);
    };

    console.warn = (...args: any[]) => {
      const redacted = args.map((arg) => 
        typeof arg === 'object' ? redactObject(arg) : redactPII(String(arg))
      );
      originalWarn(...redacted);
    };

    console.info = (...args: any[]) => {
      const redacted = args.map((arg) => 
        typeof arg === 'object' ? redactObject(arg) : redactPII(String(arg))
      );
      originalInfo(...redacted);
    };
  }
}
