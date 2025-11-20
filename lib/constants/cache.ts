/**
 * Cache Configuration Constants
 *
 * Centralized cache configuration for TRPC queries to reduce unnecessary API calls
 * and improve application performance.
 */

/**
 * Default cache configuration for most queries
 */
export const DEFAULT_CACHE_CONFIG = {
  staleTime: 60 * 1000, // 1 minute
  cacheTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
} as const;

/**
 * Cache configuration for static data that rarely changes
 * (e.g., persons, routines, classrooms)
 */
export const STATIC_DATA_CACHE = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
} as const;

/**
 * Cache configuration for semi-dynamic data
 * (e.g., goals, which update moderately)
 */
export const SEMI_DYNAMIC_CACHE = {
  staleTime: 2 * 60 * 1000, // 2 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
} as const;

/**
 * Cache configuration for dynamic data that updates frequently
 * (e.g., task completions)
 */
export const DYNAMIC_DATA_CACHE = {
  staleTime: 1 * 60 * 1000, // 1 minute
  cacheTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
} as const;

/**
 * Cache configuration for real-time or near real-time data
 * (e.g., kiosk sessions)
 */
export const REAL_TIME_CACHE = {
  staleTime: 30 * 1000, // 30 seconds
  cacheTime: 2 * 60 * 1000, // 2 minutes
  refetchOnWindowFocus: false,
} as const;

/**
 * Cache configuration for authentication/session data
 */
export const AUTH_CACHE = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
} as const;

/**
 * Helper to get appropriate cache config based on data type
 */
export function getCacheConfig(dataType: 'static' | 'semi-dynamic' | 'dynamic' | 'real-time' | 'auth' | 'default') {
  switch (dataType) {
    case 'static':
      return STATIC_DATA_CACHE;
    case 'semi-dynamic':
      return SEMI_DYNAMIC_CACHE;
    case 'dynamic':
      return DYNAMIC_DATA_CACHE;
    case 'real-time':
      return REAL_TIME_CACHE;
    case 'auth':
      return AUTH_CACHE;
    default:
      return DEFAULT_CACHE_CONFIG;
  }
}