/**
 * Constants
 *
 * Centralized constants and magic numbers/strings.
 */

// ============================================================================
// Session & Timeout Constants
// ============================================================================

export const KIOSK_SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
export const CODE_EXPIRATION_MINUTES = 30;
export const VERIFICATION_CODE_LENGTH = 6;
export const KIOSK_CODE_LENGTH = 6;

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
  BASIC: {
    persons: 10,
    routines: 20,
    goals: 10,
    smartRoutines: 5,
    analytics: true,
    coParents: 2,
    marketplace: true,
  },
  PREMIUM: {
    persons: -1, // unlimited
    routines: -1, // unlimited
    goals: -1, // unlimited
    smartRoutines: -1, // unlimited
    analytics: true,
    coParents: -1, // unlimited
    marketplace: true,
  },
  SCHOOL: {
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
// Validation Constants
// ============================================================================

export const VALIDATION = {
  name: {
    minLength: 1,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
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
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const TOAST_DURATION = 3000; // 3 seconds
export const CONFETTI_DURATION = 3000; // 3 seconds
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
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
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
