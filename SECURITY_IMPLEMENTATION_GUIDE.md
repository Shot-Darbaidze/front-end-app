# Security Implementation Guide
## How to Use the Security Features

This guide explains how to use the newly implemented security features in the Driving Instructor App.

---

## 📚 Table of Contents

1. [Secure Logging](#secure-logging)
2. [Input Sanitization](#input-sanitization)
3. [CSRF Protection](#csrf-protection)
4. [PII Redaction](#pii-redaction)
5. [Security Headers](#security-headers)
6. [Best Practices](#best-practices)

---

## 🔒 Secure Logging

### Replace Console Statements

**❌ Don't use:**
```typescript
console.log('User data:', userData);
console.error('Login failed', error);
```

**✅ Use instead:**
```typescript
import { logger } from '@/utils/secureLogger';

logger.info('User login attempt', { userId: user.id });
logger.error('Login failed', error, { username: user.name });
logger.debug('Debugging info', debugData); // Development only
logger.security('Suspicious activity detected', { ip, action });
```

### Logger Methods

- `logger.info()` - General information logging
- `logger.warn()` - Warning messages
- `logger.error()` - Error logging with automatic PII redaction
- `logger.debug()` - Debug logging (development only)
- `logger.security()` - Security event logging (always logged)

### Automatic PII Protection

The logger automatically redacts:
- Email addresses → `[EMAIL_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`
- Passwords → `[REDACTED]`
- API keys → `[REDACTED]`
- IP addresses → `192.xxx.xxx.xxx`

---

## 🛡️ Input Sanitization

### Sanitize User Input

```typescript
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '@/utils/sanitize';

// Basic input sanitization
const safeName = sanitizeInput(userInput, {
  allowHTML: false,
  maxLength: 100,
  trim: true,
});

// Email sanitization
const safeEmail = sanitizeEmail(email); // Returns null if invalid

// Phone sanitization
const safePhone = sanitizePhone(phone); // Removes non-numeric chars

// Object sanitization
import { sanitizeObject } from '@/utils/sanitize';
const safeData = sanitizeObject(formData);
```

### Check for Malicious Input

```typescript
import { containsXSS, containsSQLInjection } from '@/utils/sanitize';

if (containsXSS(userInput)) {
  logger.security('XSS attempt detected', { input: userInput });
  return { error: 'Invalid input detected' };
}

if (containsSQLInjection(searchQuery)) {
  logger.security('SQL injection attempt', { query: searchQuery });
  return { error: 'Invalid search query' };
}
```

### File Upload Sanitization

```typescript
import { sanitizeFilename, sanitizeFilePath } from '@/utils/sanitize';

// For filenames
const safeFilename = sanitizeFilename(file.name);

// For file paths (removes directory traversal)
const safePath = sanitizeFilePath(userProvidedPath);
```

---

## 🔐 CSRF Protection

### Automatic Protection in API Service

The API service automatically includes CSRF tokens:

```typescript
import { api } from '@/services/api';

// CSRF token is automatically added to POST/PUT/PATCH/DELETE requests
const response = await api.post('/api/users', userData);
```

### Manual CSRF Token Handling

```typescript
import { csrfProtection } from '@/utils/csrf';

// Initialize CSRF protection (done automatically in APIService)
await csrfProtection.initialize();

// Get current token
const token = csrfProtection.getToken();

// Add token to custom headers
const headers = csrfProtection.addTokenToHeaders({
  'Content-Type': 'application/json',
});

// Clear token on logout
csrfProtection.clear();
```

### Server-Side CSRF Validation (API Routes)

```typescript
import { verifyCSRFToken, getCSRFTokenFromHeaders } from '@/utils/csrf';

export async function POST(req: Request) {
  const token = getCSRFTokenFromHeaders(req.headers);
  const storedToken = getStoredHashedToken(); // Implement storage
  
  if (!token || !verifyCSRFToken(token, storedToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // Process request...
}
```

---

## 🔍 PII Redaction

### Redact PII from Text

```typescript
import { redactPII } from '@/utils/secureLogger';

const message = 'Contact user@example.com at 555-123-4567';
const safe = redactPII(message);
// Result: "Contact [EMAIL_REDACTED] at [PHONE_REDACTED]"
```

### Redact PII from Objects

```typescript
import { redactObject } from '@/utils/secureLogger';

const userData = {
  name: 'John',
  email: 'john@example.com',
  password: 'secret123',
  phone: '555-1234',
};

const safeData = redactObject(userData);
// Result: {
//   name: 'John',
//   email: '[EMAIL_REDACTED]',
//   password: '[REDACTED]',
//   phone: '[PHONE_REDACTED]'
// }
```

---

## 🛡️ Security Headers

Security headers are automatically applied via `middleware.ts`:

- **Content-Security-Policy**: Prevents XSS attacks
- **Strict-Transport-Security**: Forces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Customizing CSP

Edit `middleware.ts` to adjust Content Security Policy:

```typescript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://trusted-cdn.com",
  // Add your trusted sources...
];
```

---

## ✅ Best Practices

### 1. Form Validation

```typescript
import { useForm } from '@/hooks/useForm';
import { sanitizeObject } from '@/utils/sanitize';
import { logger } from '@/utils/secureLogger';

const MyForm = () => {
  const { values, errors, handleSubmit } = useForm(
    initialValues,
    async (data) => {
      // Sanitize before sending
      const safeData = sanitizeObject(data);
      
      try {
        await api.post('/api/submit', safeData);
        logger.info('Form submitted successfully');
      } catch (error) {
        logger.error('Form submission failed', error);
      }
    },
    validators
  );
  
  return (/* form JSX */);
};
```

### 2. API Endpoint Security

```typescript
// src/app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';
import { sanitizeObject } from '@/utils/sanitize';
import { logger } from '@/utils/secureLogger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Sanitize input
    const safeData = sanitizeObject(body);
    
    // 2. Validate required fields
    if (!safeData.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }
    
    // 3. Process request
    const result = await processData(safeData);
    
    // 4. Log success (PII-safe)
    logger.info('Request processed', { id: result.id });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 5. Log error (PII-safe)
    logger.error('API request failed', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Authentication Flow

```typescript
import { api } from '@/services/api';
import { logger } from '@/utils/secureLogger';
import { sanitizeEmail } from '@/utils/sanitize';

const login = async (email: string, password: string) => {
  // 1. Sanitize email
  const safeEmail = sanitizeEmail(email);
  
  if (!safeEmail) {
    logger.warn('Invalid email format');
    return { error: 'Invalid email' };
  }
  
  try {
    // 2. API call (CSRF token added automatically)
    const response = await api.post('/api/auth/login', {
      email: safeEmail,
      password, // Never log passwords!
    });
    
    // 3. Log success (no PII)
    logger.info('User logged in', { userId: response.user.id });
    
    return response;
  } catch (error) {
    // 4. Log failure (PII-safe)
    logger.error('Login failed', error);
    logger.security('Failed login attempt', { email: safeEmail });
    
    return { error: 'Login failed' };
  }
};
```

### 4. File Upload Security

```typescript
import { sanitizeFilename, validateFileType, validateFileSize } from '@/utils/sanitize';
import { logger } from '@/utils/secureLogger';

const handleFileUpload = async (file: File) => {
  // 1. Validate file size
  const sizeError = validateFileSize(file, 5); // 5MB max
  if (sizeError) {
    logger.warn('File size exceeded', { filename: file.name });
    return { error: sizeError };
  }
  
  // 2. Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const typeError = validateFileType(file, allowedTypes);
  if (typeError) {
    logger.warn('Invalid file type', { type: file.type });
    return { error: typeError };
  }
  
  // 3. Sanitize filename
  const safeFilename = sanitizeFilename(file.name);
  
  // 4. Upload
  try {
    const response = await api.uploadFile('/api/upload', file, 'file', {
      filename: safeFilename,
    });
    
    logger.info('File uploaded', { filename: safeFilename });
    return response;
  } catch (error) {
    logger.error('File upload failed', error);
    return { error: 'Upload failed' };
  }
};
```

### 5. Production Console Interception

Enable console interception in production:

```typescript
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { interceptConsole } from '@/utils/secureLogger';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Intercept console in production to prevent PII leaks
    if (process.env.NODE_ENV === 'production') {
      interceptConsole();
    }
  }, []);
  
  return (/* layout */);
}
```

---

## 🧪 Testing Security Features

### Test Input Sanitization

```typescript
import { sanitizeInput, containsXSS } from '@/utils/sanitize';

describe('Input Security', () => {
  it('should prevent XSS', () => {
    const malicious = '<script>alert("XSS")</script>';
    const safe = sanitizeInput(malicious);
    expect(containsXSS(safe)).toBe(false);
  });
});
```

### Test PII Redaction

```typescript
import { redactPII } from '@/utils/secureLogger';

describe('PII Protection', () => {
  it('should redact email addresses', () => {
    const text = 'Email: user@example.com';
    const redacted = redactPII(text);
    expect(redacted).not.toContain('user@example.com');
    expect(redacted).toContain('[EMAIL_REDACTED]');
  });
});
```

---

## 📊 Security Monitoring

### Track Security Events

```typescript
import { logger } from '@/utils/secureLogger';

// Track suspicious activities
logger.security('Multiple failed login attempts', {
  userId: user.id,
  attempts: 5,
  timestamp: new Date().toISOString(),
});

// Track access to sensitive resources
logger.security('Admin panel accessed', {
  userId: user.id,
  role: user.role,
});
```

### Review Security Logs

In production, integrate with monitoring services:

```typescript
// Example: Sentry integration
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/utils/secureLogger';

// In secureLogger.ts sendToLoggingService()
Sentry.captureMessage(message, {
  level: level as Sentry.SeverityLevel,
  extra: redactObject(data),
});
```

---

## 🚨 Common Pitfalls to Avoid

### ❌ Don't Log Sensitive Data

```typescript
// BAD
console.log('User password:', password);
console.log('Credit card:', creditCard);

// GOOD
logger.info('Password updated for user', { userId: user.id });
```

### ❌ Don't Trust User Input

```typescript
// BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD
const query = 'SELECT * FROM users WHERE id = ?';
const result = await db.query(query, [sanitizeInput(userId)]);
```

### ❌ Don't Skip Sanitization

```typescript
// BAD
const html = `<div>${userInput}</div>`;

// GOOD
import { escapeHTML } from '@/utils/sanitize';
const html = `<div>${escapeHTML(userInput)}</div>`;
```

---

## 📖 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Security Validation Report](./SECURITY_VALIDATION_REPORT.md)
- [Project Documentation](./PROJECT_DOCUMENTATION.md)

---

## 🆘 Support

If you encounter security issues:

1. **Never log sensitive details publicly**
2. Use the secure logger for internal tracking
3. Report security vulnerabilities privately to security@yourcompany.com
4. Review the Security Validation Report for guidance

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0
