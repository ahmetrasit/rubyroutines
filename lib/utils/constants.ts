/**
 * Constants
 *
 * Centralized constants and magic numbers/strings.
 */

// ============================================================================
// Time Conversion Constants
// ============================================================================

export const TIME = {
  MS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_MONTH: 30, // Approximate
  DAYS_PER_YEAR: 365, // Approximate
} as const;

// Calculated time constants in milliseconds
export const MS_PER_MINUTE = TIME.SECONDS_PER_MINUTE * TIME.MS_PER_SECOND;
export const MS_PER_HOUR = TIME.MINUTES_PER_HOUR * MS_PER_MINUTE;
export const MS_PER_DAY = TIME.HOURS_PER_DAY * MS_PER_HOUR;
export const SECONDS_PER_HOUR = TIME.SECONDS_PER_MINUTE * TIME.MINUTES_PER_HOUR;
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * TIME.HOURS_PER_DAY;

// ============================================================================
// Session & Timeout Constants
// ============================================================================

export const KIOSK_SESSION_TIMEOUT = 5 * MS_PER_MINUTE; // 5 minutes
export const KIOSK_SESSION_DURATION = 3 * MS_PER_HOUR; // 3 hours
export const KIOSK_INACTIVITY_TIMEOUT = 60 * TIME.MS_PER_SECOND; // 60 seconds
export const CODE_EXPIRATION_MINUTES = 30;
export const VERIFICATION_CODE_LENGTH = 6;
export const KIOSK_CODE_LENGTH = 6;
export const VERIFICATION_CODE_EXPIRATION = 15 * MS_PER_MINUTE; // 15 minutes
export const VERIFICATION_COOLDOWN = 60 * TIME.MS_PER_SECOND; // 60 seconds
export const LOCKOUT_DURATION = 15 * MS_PER_MINUTE; // 15 minutes
export const RATE_LIMIT_WINDOW = 60 * MS_PER_MINUTE; // 1 hour

// ============================================================================
// Pagination Constants
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// Tier Limits
// ============================================================================

export const TIER_LIMITS = {
  FREE: {
    persons: 3,
    routines: 5,
    goals: 2,
    smartRoutines: 0,
    analytics: false,
    coParents: 0,
    marketplace: false,
  },
  BRONZE: {
    persons: 10,
    routines: 20,
    goals: 10,
    smartRoutines: 5,
    analytics: true,
    coParents: 2,
    marketplace: true,
  },
  GOLD: {
    persons: -1, // unlimited
    routines: -1, // unlimited
    goals: -1, // unlimited
    smartRoutines: -1, // unlimited
    analytics: true,
    coParents: -1, // unlimited
    marketplace: true,
  },
  PRO: {
    persons: -1, // unlimited
    routines: -1, // unlimited
    goals: -1, // unlimited
    smartRoutines: -1, // unlimited
    analytics: true,
    coParents: -1, // unlimited
    marketplace: true,
  },
} as const;

// ============================================================================
// Code Generation Constants
// ============================================================================

export const CODE_GENERATION = {
  VERIFICATION_MIN: 100000,
  VERIFICATION_MAX: 999999,
  CONNECTION_MIN: 100000,
  CONNECTION_MAX: 999999,
} as const;

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  name: {
    minLength: 1,
    maxLength: 25,
  },
  description: {
    maxLength: 25,
    marketplaceMaxLength: 1000,
  },
  email: {
    maxLength: 255,
  },
  password: {
    minLength: 8,
    maxLength: 100,
  },
  code: {
    length: 6,
  },
  avatar: {
    maxSize: 1024 * 1024, // 1MB
  },
  task: {
    maxOrder: 9999,
  },
  auditLog: {
    maxRecords: 1000, // Max audit logs to fetch for GDPR export
  },
} as const;

// ============================================================================
// Polling & Refresh Constants
// ============================================================================

export const POLLING = {
  VISIBILITY_OVERRIDE: 30 * TIME.MS_PER_SECOND, // 30 seconds
  KIOSK_UPDATES: 15 * TIME.MS_PER_SECOND, // 15 seconds
  COUNTDOWN_TIMER: 1 * TIME.MS_PER_SECOND, // 1 second
  ROLE_UPDATES_CHECK: 5 * MS_PER_MINUTE, // 5 minutes ago threshold
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const TOAST_DURATION = 3 * TIME.MS_PER_SECOND; // 3 seconds
export const CONFETTI_DURATION = 3 * TIME.MS_PER_SECOND; // 3 seconds
export const DEBOUNCE_DELAY = 300; // milliseconds

// ============================================================================
// Date Constants
// ============================================================================

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

// ============================================================================
// Permission Constants
// ============================================================================

export const PERMISSIONS = {
  READ_ONLY: 'READ_ONLY',
  TASK_COMPLETION: 'TASK_COMPLETION',
  FULL_ACCESS: 'FULL_ACCESS',
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  ADMIN: 'ADMIN',
} as const;

// ============================================================================
// Marketplace Constants
// ============================================================================

export const MARKETPLACE = {
  minRating: 1,
  maxRating: 5,
  minSearchLength: 2,
  maxTags: 10,
  categories: [
    'Morning Routine',
    'Bedtime Routine',
    'Homework',
    'Chores',
    'Health & Wellness',
    'Learning',
    'Social Skills',
    'Screen Time',
    'Other',
  ],
  ageGroups: [
    'Toddler (1-3)',
    'Preschool (3-5)',
    'Elementary (6-11)',
    'Middle School (12-14)',
    'High School (15-18)',
    'Adult',
  ],
} as const;

// ============================================================================
// API Constants
// ============================================================================

export const API = {
  timeout: 30 * TIME.MS_PER_SECOND, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1 * TIME.MS_PER_SECOND, // 1 second
} as const;

// ============================================================================
// Rate Limiting Constants
// ============================================================================

export const RATE_LIMITS = {
  AUTH: { limit: 5, windowMs: 2 * MS_PER_MINUTE },
  PASSWORD_RESET: { limit: 3, windowMs: 15 * MS_PER_MINUTE },
  VERIFICATION: { limit: 5, windowMs: 5 * MS_PER_MINUTE },
  KIOSK: { limit: 10, windowMs: 1 * MS_PER_HOUR },
  API: { limit: 100, windowMs: 1 * MS_PER_MINUTE },
  GLOBAL: { limit: 1000, windowMs: 1 * MS_PER_MINUTE },
  INVITATION_TOKEN_LOOKUP: { limit: 10, windowMs: 1 * MS_PER_MINUTE }, // 10 attempts per minute per IP - prevents brute force attacks
  CLEANUP_INTERVAL: 60 * TIME.MS_PER_SECOND, // 1 minute
} as const;

// ============================================================================
// Kiosk-Specific Rate Limits (Session-Based with Fallback)
// ============================================================================
// These limits apply based on the identifier type used:
// - SESSION: Rate limit per kiosk session (most permissive)
// - CODE: Rate limit per kiosk code (moderate)
// - IP: Rate limit per IP address (most restrictive, fallback)

export const KIOSK_RATE_LIMITS = {
  // Session-based: Applied when sessionId is available
  // Most permissive since sessions are already validated
  SESSION: {
    limit: 100,
    windowMs: 1 * MS_PER_HOUR,
  },

  // Code-based: Applied when kioskCodeId is available but no session
  // Moderate limit for code validation and session creation
  CODE: {
    limit: 50,
    windowMs: 1 * MS_PER_HOUR,
  },

  // IP-based: Applied when neither sessionId nor kioskCodeId available
  // Most restrictive to prevent abuse from unknown sources
  IP: {
    limit: 20,
    windowMs: 1 * MS_PER_HOUR,
  },
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURES = {
  enableSmartRoutines: true,
  enableGoals: true,
  enableMarketplace: true,
  enableAnalytics: true,
  enableKioskMode: true,
  enableCoParenting: true,
  enableSchoolMode: true,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication
  invalidCredentials: 'Invalid email or password',
  emailAlreadyExists: 'An account with this email already exists',
  emailNotVerified: 'Please verify your email address',
  sessionExpired: 'Your session has expired. Please log in again.',

  // Authorization
  unauthorized: 'You do not have permission to perform this action',
  notFound: 'The requested resource was not found',

  // Validation
  requiredField: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  passwordTooShort: 'Password must be at least 8 characters',
  nameTooLong: 'Name must be less than 100 characters',

  // Limits
  limitExceeded: 'You have reached the limit for your current plan',
  upgradeRequired: 'This feature requires a paid plan',

  // Generic
  somethingWentWrong: 'Something went wrong. Please try again.',
  networkError: 'Network error. Please check your connection.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  created: 'Created successfully',
  updated: 'Updated successfully',
  deleted: 'Deleted successfully',
  archived: 'Archived successfully',
  restored: 'Restored successfully',
  copied: 'Copied to clipboard',
  saved: 'Saved successfully',
} as const;
