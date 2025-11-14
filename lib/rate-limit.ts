/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based solution like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param limit - Max requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining requests
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      const resetTime = now + windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string) {
    this.store.delete(identifier);
  }

  /**
   * Cleanup interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  // Auth endpoints: 5 attempts per 2 minutes (reduced for better UX)
  AUTH: { limit: 5, windowMs: 2 * 60 * 1000 },

  // Verification code: 5 attempts per 5 minutes (increased attempts, reduced window)
  VERIFICATION: { limit: 5, windowMs: 5 * 60 * 1000 },

  // Kiosk code validation: 10 attempts per hour
  KIOSK: { limit: 10, windowMs: 60 * 60 * 1000 },

  // API endpoints: 100 requests per minute
  API: { limit: 100, windowMs: 60 * 1000 },

  // Global: 1000 requests per minute per IP
  GLOBAL: { limit: 1000, windowMs: 60 * 1000 },
};

/**
 * Rate limit helper for tRPC procedures
 */
export function rateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
) {
  return rateLimiter.check(identifier, config.limit, config.windowMs);
}

/**
 * Get IP address from request headers
 */
export function getIpAddress(
  headers: Headers | Record<string, string | string[] | undefined>
): string {
  const forwardedFor =
    headers instanceof Headers
      ? headers.get('x-forwarded-for')
      : headers['x-forwarded-for'];

  if (forwardedFor) {
    return Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0].trim();
  }

  const realIp =
    headers instanceof Headers
      ? headers.get('x-real-ip')
      : headers['x-real-ip'];

  return (Array.isArray(realIp) ? realIp[0] : realIp) || 'unknown';
}

export default rateLimiter;
