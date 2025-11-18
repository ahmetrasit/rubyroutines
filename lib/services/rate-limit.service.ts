import { prisma } from '@/lib/prisma';
import { addHours, addMinutes } from 'date-fns';

export interface RateLimitConfig {
  action: string;
  maxAttempts: number;
  windowMinutes: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limiting configurations for different actions
 */
export const RATE_LIMIT_CONFIGS = {
  // Code generation limits
  CONNECTION_CODE_GENERATION: {
    action: 'connection_code_generation',
    maxAttempts: 5,
    windowMinutes: 60, // 5 codes per hour
  },
  PERSON_SHARING_CODE_GENERATION: {
    action: 'person_sharing_code_generation',
    maxAttempts: 20,
    windowMinutes: 60, // 20 codes per hour
  },
  MARKETPLACE_CODE_GENERATION: {
    action: 'marketplace_code_generation',
    maxAttempts: 10,
    windowMinutes: 60, // 10 codes per hour
  },

  // Code claiming limits (prevent brute force)
  CONNECTION_CODE_CLAIM: {
    action: 'connection_code_claim',
    maxAttempts: 5,
    windowMinutes: 60, // 5 failed attempts per hour
  },
  PERSON_SHARING_CODE_CLAIM: {
    action: 'person_sharing_code_claim',
    maxAttempts: 10,
    windowMinutes: 60, // 10 failed attempts per hour
  },

  // Invitation limits
  INVITATION_SEND: {
    action: 'invitation_send',
    maxAttempts: 10,
    windowMinutes: 1440, // 10 invitations per day (24 hours)
  },
} as const;

/**
 * Check if action is rate limited
 * @param identifier - User ID, Role ID, or IP address
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = addMinutes(now, -config.windowMinutes);

  // Clean up expired rate limit records
  await prisma.rateLimit.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });

  // Get or create rate limit record
  const rateLimit = await prisma.rateLimit.findUnique({
    where: {
      identifier_action: {
        identifier,
        action: config.action,
      },
    },
  });

  // If no record exists or window has expired, action is allowed
  if (!rateLimit || rateLimit.windowStart < windowStart) {
    const expiresAt = addMinutes(now, config.windowMinutes);

    await prisma.rateLimit.upsert({
      where: {
        identifier_action: {
          identifier,
          action: config.action,
        },
      },
      create: {
        identifier,
        action: config.action,
        count: 1,
        windowStart: now,
        expiresAt,
      },
      update: {
        count: 1,
        windowStart: now,
        expiresAt,
      },
    });

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: expiresAt,
    };
  }

  // Check if limit exceeded
  if (rateLimit.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimit.expiresAt,
    };
  }

  // Increment count
  await prisma.rateLimit.update({
    where: {
      identifier_action: {
        identifier,
        action: config.action,
      },
    },
    data: {
      count: { increment: 1 },
    },
  });

  return {
    allowed: true,
    remaining: config.maxAttempts - rateLimit.count - 1,
    resetAt: rateLimit.expiresAt,
  };
}

/**
 * Record a failed attempt (for claim endpoints)
 * Only increments if the attempt failed
 */
export async function recordFailedAttempt(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const now = new Date();
  const windowStart = addMinutes(now, -config.windowMinutes);
  const expiresAt = addMinutes(now, config.windowMinutes);

  const rateLimit = await prisma.rateLimit.findUnique({
    where: {
      identifier_action: {
        identifier,
        action: config.action,
      },
    },
  });

  if (!rateLimit || rateLimit.windowStart < windowStart) {
    // Create new record for failed attempt
    await prisma.rateLimit.upsert({
      where: {
        identifier_action: {
          identifier,
          action: config.action,
        },
      },
      create: {
        identifier,
        action: config.action,
        count: 1,
        windowStart: now,
        expiresAt,
      },
      update: {
        count: 1,
        windowStart: now,
        expiresAt,
      },
    });
  } else {
    // Increment existing record
    await prisma.rateLimit.update({
      where: {
        identifier_action: {
          identifier,
          action: config.action,
        },
      },
      data: {
        count: { increment: 1 },
      },
    });
  }
}

/**
 * Reset rate limit for a specific identifier and action
 * Useful for testing or admin overrides
 */
export async function resetRateLimit(
  identifier: string,
  action: string
): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: {
      identifier,
      action,
    },
  });
}
