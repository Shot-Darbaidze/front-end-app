/**
 * Central Constants Configuration
 * Single source of truth for all app-wide constants, limits, and values
 * Organized by category for easy maintenance and updates
 */

// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  NAME: 'Driving Instructor App',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  DEBUG: process.env.NODE_ENV === 'development',
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // milliseconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  LANGUAGE: 'language',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  // User endpoints
  USER: '/api/user',
  
  // Instructor endpoints
  INSTRUCTORS: '/api/posts',
  INSTRUCTOR_DETAIL: (id: string) => `/api/posts/${id}`,
  INSTRUCTOR_SEARCH: '/api/posts/search',
  INSTRUCTOR_PROFILE: '/api/posts/profile',
  
  // Lesson endpoints
  LESSONS: '/api/lessons',
  LESSON_DETAIL: (id: string) => `/api/lessons/${id}`,
  LESSON_BOOK: '/api/lessons/book',
  LESSON_CANCEL: (id: string) => `/api/lessons/${id}/cancel`,
  
  // Payment endpoints
  PAYMENTS: '/api/payments',
  PAYMENT_DETAIL: (id: string) => `/api/payments/${id}`,
  PAYMENT_CREATE: '/api/payments/create',
  PAYMENT_VERIFY: '/api/payments/verify',
  
  // Dashboard endpoints
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_RECENT_LESSONS: '/api/dashboard/recent-lessons',
  DASHBOARD_UPCOMING_LESSONS: '/api/dashboard/upcoming-lessons',
  
  // Blog endpoints
  BLOG_POSTS: '/api/blog/posts',
  BLOG_POST_DETAIL: (slug: string) => `/api/blog/posts/${slug}`,
  
  // Forum endpoints
  FORUM_POSTS: '/api/forum/posts',
  FORUM_POST_DETAIL: (id: string) => `/api/forum/posts/${id}`,
  FORUM_COMMENT: '/api/forum/comments',
  
  // Help/Support endpoints
  SUPPORT_ARTICLES: '/api/support/articles',
  SUPPORT_ARTICLE_DETAIL: (id: string) => `/api/support/articles/${id}`,
  SUPPORT_CATEGORY: (category: string) => `/api/support/categories/${category}`,
  
  // Vehicle endpoints
  VEHICLE: '/api/vehicle',
  VEHICLE_UPLOAD: '/api/vehicle/upload',
} as const;

// ============================================================================
// PAGINATION & LIMITS
// ============================================================================

export const LIMITS = {
  // Pagination
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,

  // File uploads
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5 MB
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Form validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_BIO_LENGTH: 10,
  MAX_BIO_LENGTH: 500,
  MIN_AGE: 18,
  MAX_AGE: 120,

  // Search & filtering
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  MAX_FILTER_OPTIONS: 50,

  // Cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  CACHE_MAX_SIZE: 100, // max items in cache
} as const;

// ============================================================================
// UPLOAD LIMITS (configurable via .env)
// ============================================================================

const parseIntEnv = (val: string | undefined, fallback: number): number => {
  const parsed = val ? parseInt(val, 10) : NaN;
  return Number.isNaN(parsed) ? fallback : parsed;
};

const _maxFileSizeMB = parseIntEnv(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB, 5);

export const UPLOAD_LIMITS = {
  MAX_VEHICLE_PHOTOS: parseIntEnv(process.env.NEXT_PUBLIC_MAX_VEHICLE_PHOTOS, 5),
  MAX_LICENSE_FILES: parseIntEnv(process.env.NEXT_PUBLIC_MAX_LICENSE_FILES, 2),
  MAX_CERTIFICATE_FILES: parseIntEnv(process.env.NEXT_PUBLIC_MAX_CERTIFICATE_FILES, 1),
  MAX_FILE_SIZE_MB: _maxFileSizeMB,
  MAX_FILE_SIZE_BYTES: _maxFileSizeMB * 1024 * 1024,
};

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^(https?:\/\/)?[\da-z.-]+\.[a-z.]{2,6}([/\w .-]*)*\/?$/,
  POSTAL_CODE: /^[0-9]{5}(-[0-9]{4})?$/,
  PHONE_SIMPLE: /^[0-9\s+()-]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
} as const;

// ============================================================================
// TIME & DATE
// ============================================================================

export const TIME_CONFIG = {
  LESSON_DURATION_OPTIONS: [30, 45, 60, 90, 120], // minutes
  DEFAULT_LESSON_DURATION: 60, // minutes
  WORKING_HOURS_START: 6, // 6 AM
  WORKING_HOURS_END: 22, // 10 PM
  BUFFER_TIME_BETWEEN_LESSONS: 15, // minutes
  CALENDAR_MONTHS_AHEAD: 3,
  CALENDAR_MONTHS_PAST: 1,
  // UI debounce/throttle
  DEBOUNCE_DELAY: 500, // milliseconds
  THROTTLE_DELAY: 1000, // milliseconds
} as const;

// ============================================================================
// PRICING & CURRENCY
// ============================================================================

export const PRICING = {
  CURRENCY: 'GEL',
  CURRENCY_SYMBOL: '₾',
  MIN_HOURLY_RATE: 15,
  MAX_HOURLY_RATE: 500,
  MIN_SESSION_PRICE: 25,
  MAX_SESSION_PRICE: 500,
  PLATFORM_COMMISSION_PERCENTAGE: 15, // 15% commission
  TAX_RATE: 0.08, // 8% tax
  // Filter defaults
  MIN_PRICE_FILTER: 40,
  MAX_PRICE_FILTER: 100,
} as const;

// ============================================================================
// INSTRUCTOR CATEGORIES
// ============================================================================

export const INSTRUCTOR_CATEGORIES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  PROFESSIONAL: 'professional',
} as const;

export const CITIES = [
  'Tbilisi',
  'Batumi',
  'Kutaisi',
  'Rustavi',
  'Gori',
  'Telavi',
  'Sachkhere',
  'Ozurgeti',
  'Zugdidi',
  'Poti',
  'Akhaltsikhe',
  'Kobuleti',
  'Khashuri',
  'Samtredia',
] as const;

export const CITY_LABELS: Record<string, { ka: string; en: string }> = {
  Tbilisi: { ka: "თბილისი", en: "Tbilisi" },
  Batumi: { ka: "ბათუმი", en: "Batumi" },
  Kutaisi: { ka: "ქუთაისი", en: "Kutaisi" },
  Rustavi: { ka: "რუსთავი", en: "Rustavi" },
  Gori: { ka: "გორი", en: "Gori" },
  Telavi: { ka: "თელავი", en: "Telavi" },
  Sachkhere: { ka: "საჩხერე", en: "Sachkhere" },
  Ozurgeti: { ka: "ოზურგეთი", en: "Ozurgeti" },
  Zugdidi: { ka: "ზუგდიდი", en: "Zugdidi" },
  Poti: { ka: "ფოთი", en: "Poti" },
  Akhaltsikhe: { ka: "ახალციხე", en: "Akhaltsikhe" },
  Kobuleti: { ka: "ქობულეთი", en: "Kobuleti" },
  Khashuri: { ka: "ხაშური", en: "Khashuri" },
  Samtredia: { ka: "სამტრედია", en: "Samtredia" },
};

// ============================================================================
// LANGUAGE OPTIONS
// ============================================================================

export const PRIMARY_LANGUAGE_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "ka", label: "ქართული" },
  { code: "ru", label: "Русский" },
];

export const OTHER_LANGUAGE_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
  { code: "hy", label: "Հայերեն" },
  { code: "az", label: "Azərbaycan dili" },
];

export const ALL_LANGUAGE_OPTIONS = [...PRIMARY_LANGUAGE_OPTIONS, ...OTHER_LANGUAGE_OPTIONS];

export const TRANSMISSION_TYPES = ['Manual', 'Automatic'] as const;

export const INSTRUCTOR_CATEGORY_LABELS: Record<string, string> = {
  [INSTRUCTOR_CATEGORIES.BEGINNER]: 'Beginner (0-1 years)',
  [INSTRUCTOR_CATEGORIES.INTERMEDIATE]: 'Intermediate (1-3 years)',
  [INSTRUCTOR_CATEGORIES.ADVANCED]: 'Advanced (3-5 years)',
  [INSTRUCTOR_CATEGORIES.PROFESSIONAL]: 'Professional (5+ years)',
} as const;

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  TRUCK: 'truck',
  HATCHBACK: 'hatchback',
  COUPE: 'coupe',
  MINIVAN: 'minivan',
  MOTORCYCLE: 'motorcycle',
} as const;

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  [VEHICLE_TYPES.SEDAN]: 'Sedan',
  [VEHICLE_TYPES.SUV]: 'SUV',
  [VEHICLE_TYPES.TRUCK]: 'Truck',
  [VEHICLE_TYPES.HATCHBACK]: 'Hatchback',
  [VEHICLE_TYPES.COUPE]: 'Coupe',
  [VEHICLE_TYPES.MINIVAN]: 'Minivan',
  [VEHICLE_TYPES.MOTORCYCLE]: 'Motorcycle',
} as const;

// ============================================================================
// LESSON STATUS & BOOKING STATUS
// ============================================================================

export const LESSON_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
} as const;

export const LESSON_STATUS_LABELS: Record<string, string> = {
  [LESSON_STATUS.PENDING]: 'Pending',
  [LESSON_STATUS.CONFIRMED]: 'Confirmed',
  [LESSON_STATUS.IN_PROGRESS]: 'In Progress',
  [LESSON_STATUS.COMPLETED]: 'Completed',
  [LESSON_STATUS.CANCELLED]: 'Cancelled',
  [LESSON_STATUS.RESCHEDULED]: 'Rescheduled',
} as const;

export const BOOKING_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  [BOOKING_STATUS.REQUESTED]: 'Requested',
  [BOOKING_STATUS.ACCEPTED]: 'Accepted',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.DECLINED]: 'Declined',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
} as const;

// ============================================================================
// USER ROLES & PERMISSIONS
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  MODERATOR: 'moderator',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.INSTRUCTOR]: 'Instructor',
  [USER_ROLES.STUDENT]: 'Student',
  [USER_ROLES.MODERATOR]: 'Moderator',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // General
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  TIMEOUT: 'Request timed out. Please try again.', // Alias for backward compatibility
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',

  // Authentication
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  UNAUTHENTICATED: 'Please log in to continue.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token.',

  // Validation
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_PASSWORD: 'Password must contain uppercase, lowercase, numbers, and special characters.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_URL: 'Please enter a valid URL.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'File type is not allowed.',

  // Business logic
  USER_EXISTS: 'User with this email already exists.',
  INSTRUCTOR_NOT_FOUND: 'Instructor not found.',
  BOOKING_NOT_FOUND: 'Booking not found.',
  LESSON_NOT_FOUND: 'Lesson not found.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  SLOT_NOT_AVAILABLE: 'This time slot is not available.',
  CANNOT_BOOK_PAST_DATE: 'Cannot book lessons in the past.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Account created successfully!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  BOOKING_CONFIRMED: 'Booking confirmed!',
  LESSON_COMPLETED: 'Lesson marked as completed!',
  PAYMENT_SUCCESS: 'Payment processed successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
} as const;

// ============================================================================
// RATING & REVIEW
// ============================================================================

export const RATING_CONFIG = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  RATING_LABELS: {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  },
  MIN_REVIEW_LENGTH: 10,
  MAX_REVIEW_LENGTH: 1000,
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/account-settings',
  FIND_INSTRUCTORS: '/find-instructors',
  INSTRUCTORS_SIGNUP: '/for-instructors/signup',
  BLOG: '/blog',
  CONTACT: '/contact',
  HOW_IT_WORKS: '/how-it-works',
} as const;

// ============================================================================
// FILTER DEFAULTS
// ============================================================================

export const FILTER_DEFAULTS = {
  SORT_BY: 'rating',
  SORT_ORDER: 'desc',
  MIN_RATING: 3,
  DISTANCE_RADIUS: 50, // km
  PAGE: 1,
  LIMIT: 10,
} as const;

// ============================================================================
// SOCIAL MEDIA & EXTERNAL LINKS
// ============================================================================

export const EXTERNAL_LINKS = {
  TWITTER: 'https://twitter.com',
  FACEBOOK: 'https://facebook.com',
  INSTAGRAM: 'https://instagram.com',
  LINKEDIN: 'https://linkedin.com',
  SUPPORT_EMAIL: 'support@instructors.com',
  PRIVACY_POLICY: '/privacy',
  TERMS_OF_SERVICE: '/terms',
} as const;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export const NOTIFICATION_DURATION = {
  SHORT: 3000, // 3 seconds
  MEDIUM: 5000, // 5 seconds
  LONG: 8000, // 8 seconds
  PERSISTENT: 0, // Until manually closed
} as const;

// ============================================================================
// EXPORT ALL AS SINGLE CONSTANT
// ============================================================================

export const CONSTANTS = {
  APP_CONFIG,
  API_CONFIG,
  LIMITS,
  REGEX_PATTERNS,
  TIME_CONFIG,
  PRICING,
  INSTRUCTOR_CATEGORIES,
  INSTRUCTOR_CATEGORY_LABELS,
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  LESSON_STATUS,
  LESSON_STATUS_LABELS,
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  USER_ROLES,
  USER_ROLE_LABELS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  RATING_CONFIG,
  ROUTES,
  FILTER_DEFAULTS,
  EXTERNAL_LINKS,
  NOTIFICATION_TYPES,
  NOTIFICATION_DURATION,
} as const;

export default CONSTANTS;
