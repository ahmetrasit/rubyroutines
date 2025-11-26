import { TRPCError } from '@trpc/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { KIOSK_RATE_LIMITS } from '@/lib/utils/constants';
import { getKioskRateLimits } from '@/lib/services/admin/system-settings.service';
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

    const result = await rateLimit(identifier, config);

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
 * Session-based rate limiting for kiosk endpoints
 * Uses fallback hierarchy: sessionId > kioskCodeId > IP address
 *
 * This prevents the shared counter bug where all anonymous users share the same rate limit.
 * Each identifier type has different limits based on trust level (configurable in admin settings):
 * - SESSION: Most permissive, session already validated (default: 100/hour)
 * - CODE: Moderate, for code validation and session creation (default: 50/hour)
 * - IP: Most restrictive, fallback for unknown sources (default: 20/hour)
 */
export const kioskSessionRateLimitedProcedure = publicProcedure.use(async (opts) => {
  const { ctx, input } = opts;

  // Determine identifier and config based on available data
  let identifier: string;
  let config: { limit: number; windowMs: number };
  let identifierType: 'SESSION' | 'CODE' | 'IP';

  // Type assertion for input with optional fields
  const kioskInput = input as { sessionId?: string; kioskCodeId?: string; codeId?: string } | undefined;

  // Get rate limits from system settings (with fallback to constants)
  let rateLimits;
  try {
    rateLimits = await getKioskRateLimits();
  } catch (error) {
    // Fallback to hardcoded constants if database is unavailable
    rateLimits = KIOSK_RATE_LIMITS;
  }

  // Priority 1: Use session ID if available (most permissive)
  if (kioskInput?.sessionId) {
    identifier = `kiosk:session:${kioskInput.sessionId}`;
    config = rateLimits.SESSION;
    identifierType = 'SESSION';
  }
  // Priority 2: Use kiosk code ID (moderate limits)
  else if (kioskInput?.kioskCodeId || kioskInput?.codeId) {
    const codeId = kioskInput.kioskCodeId || kioskInput.codeId;
    identifier = `kiosk:code:${codeId}`;
    config = rateLimits.CODE;
    identifierType = 'CODE';
  }
  // Priority 3: Fallback to IP address (most restrictive)
  else {
    identifier = `kiosk:ip:${ctx.ipAddress || 'unknown'}`;
    config = rateLimits.IP;
    identifierType = 'IP';
  }

  const result = await rateLimit(identifier, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    const minutes = Math.ceil(retryAfter / 60);

    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Too many requests. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
    });
  }

  return opts.next({
    ctx,
  });
});

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
