/**
 * Production-ready rate limiter with Redis support
 * Falls back to in-memory for development
 *
 * For production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * Get free Redis from: https://console.upstash.com/
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * In-memory rate limiter (development only)
 * WARNING: Not suitable for production - resets on server restart and doesn't work across multiple instances
 */
class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private hasWarned = false;

  constructor() {
    // Warn in production
    if (process.env.NODE_ENV === 'production' && !this.hasWarned) {
      console.warn(
        '⚠️  WARNING: Using in-memory rate limiter in production. ' +
        'This is NOT recommended. Please configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN ' +
        'for production-ready rate limiting.'
      );
      this.hasWarned = true;
    }

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

  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Redis-based rate limiter using Upstash REST API
 * No additional dependencies required - uses fetch API
 */
class RedisRateLimiter {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url;
    this.token = token;
  }

  private async redis(command: string[]): Promise<number> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  }

  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);
    const key = `ratelimit:${identifier}`;

    try {
      // Use Redis INCR + EXPIRE for atomic rate limiting
      const count = await this.redis(['INCR', key]);

      if (count === 1) {
        // First request in window - set expiration
        await this.redis(['EXPIRE', key, windowSeconds.toString()]);
      }

      const ttl = await this.redis(['TTL', key]);
      const resetTime = now + (ttl * 1000);

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime,
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fail open - allow request on error
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }
  }

  async reset(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    try {
      await this.redis(['DEL', key]);
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }

  destroy(): void {
    // No cleanup needed for REST API
  }
}

/**
 * Create rate limiter instance based on environment
 */
function createRateLimiter() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    console.log('✓ Using Redis-based rate limiter (production-ready)');
    return new RedisRateLimiter(redisUrl, redisToken);
  }

  return new InMemoryRateLimiter();
}

// Singleton instance
const rateLimiter = createRateLimiter();

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
export async function rateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
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
