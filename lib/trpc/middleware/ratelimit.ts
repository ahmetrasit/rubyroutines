import { TRPCError } from '@trpc/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { publicProcedure } from '../init';

/**
 * Rate limiting middleware for tRPC procedures
 * Uses user ID for authenticated users, or 'anonymous' for public procedures
 */
export const rateLimitedProcedure = (
  config: { limit: number; windowMs: number },
  prefix: string = 'api'
) => {
  return publicProcedure.use(async (opts) => {
    const { ctx } = opts;

    // Use user ID for authenticated users, otherwise 'anonymous'
    const identifier = `${prefix}:${ctx.user?.id || 'anonymous'}`;

    const result = rateLimit(identifier, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      });
    }

    return opts.next({
      ctx,
    });
  });
};

/**
 * Auth-specific rate limiting
 * 5 attempts per 15 minutes
 */
export const authRateLimitedProcedure = rateLimitedProcedure(
  RATE_LIMITS.AUTH,
  'auth'
);

/**
 * Verification code rate limiting
 * 3 attempts per hour
 */
export const verificationRateLimitedProcedure = rateLimitedProcedure(
  RATE_LIMITS.VERIFICATION,
  'verify'
);

/**
 * Kiosk code rate limiting
 * 10 attempts per hour
 */
export const kioskRateLimitedProcedure = rateLimitedProcedure(
  RATE_LIMITS.KIOSK,
  'kiosk'
);

/**
 * General API rate limiting
 * 100 requests per minute
 */
export const apiRateLimitedProcedure = rateLimitedProcedure(
  RATE_LIMITS.API,
  'api'
);
