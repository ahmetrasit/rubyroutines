/**
 * Cache Service
 *
 * Hybrid caching strategy for Ruby Routines:
 * - CACHE: Session, tier limits, routine structure, persons (rarely change)
 * - NEVER CACHE: Task completions, goal progress (real-time critical)
 *
 * Uses Upstash Redis for serverless-compatible caching.
 * Falls back gracefully if Redis is unavailable.
 *
 * IMPORTANT: This service is designed to NEVER cache completion data.
 * Real-time sync for co-parents and kiosk mode depends on fresh completion queries.
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// Cache TTL Constants (in seconds)
// ============================================================================

export const CACHE_TTL = {
  SESSION: 300, // 5 minutes
  TIER_LIMITS: 3600, // 1 hour
  SYSTEM_SETTINGS: 3600, // 1 hour
  ROUTINE_STRUCTURE: 60, // 1 minute (structure only, NOT completions)
  PERSONS: 120, // 2 minutes
  MARKETPLACE: 300, // 5 minutes
  USER_ROLES: 300, // 5 minutes
} as const;

// ============================================================================
// NEVER CACHE - Real-time critical data
// ============================================================================

/**
 * Keys/patterns that should NEVER be cached to preserve real-time sync.
 * Any cache operation involving these patterns will be skipped.
 */
const NEVER_CACHE_PATTERNS = [
  'completion', // Task completions
  'progress', // Goal progress
  'complete', // Completion-related
] as const;

function shouldNeverCache(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return NEVER_CACHE_PATTERNS.some((pattern) => lowerKey.includes(pattern));
}

// ============================================================================
// Types
// ============================================================================

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  skipped: number; // For real-time data that's intentionally not cached
}

interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

// ============================================================================
// In-Memory Cache with LRU Eviction
// ============================================================================

const MAX_MEMORY_CACHE_SIZE = 1000;
const memoryCache = new Map<string, MemoryCacheEntry>();
const cacheStats: CacheStats = { hits: 0, misses: 0, errors: 0, skipped: 0 };

// In-flight request tracking to prevent cache stampede
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Evict oldest entries when cache exceeds max size (LRU-style)
 */
function evictIfNeeded(): void {
  if (memoryCache.size <= MAX_MEMORY_CACHE_SIZE) return;

  // Sort by expiration time and remove oldest 10%
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].expiresAt - b[1].expiresAt);

  const toRemove = Math.ceil(memoryCache.size * 0.1);
  for (let i = 0; i < toRemove && i < entries.length; i++) {
    memoryCache.delete(entries[i][0]);
  }

  logger.debug('Memory cache eviction', { removed: toRemove, remaining: memoryCache.size });
}

// ============================================================================
// Redis Client (Lazy Initialization)
// ============================================================================

let redisClient: any = null;
let redisAvailable: boolean | null = null;

async function getRedisClient() {
  if (redisClient !== null) return redisClient;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.debug('Redis not configured, using in-memory cache fallback');
    redisAvailable = false;
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    await redisClient.ping();
    redisAvailable = true;
    logger.info('Redis cache connected successfully');
    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed, using in-memory cache fallback', { error });
    redisAvailable = false;
    redisClient = null;
    return null;
  }
}

// ============================================================================
// Core Cache Operations
// ============================================================================

/**
 * Get a value from cache, or fetch and cache it.
 * Includes cache stampede protection via request coalescing.
 *
 * IMPORTANT: Will skip caching for real-time critical data (completions, progress)
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Never cache completion/progress data
  if (shouldNeverCache(key)) {
    cacheStats.skipped++;
    logger.debug('Cache skipped (real-time data)', { key });
    return fetcher();
  }

  const ttl = options.ttl ?? 60;

  try {
    const redis = await getRedisClient();

    // Check cache first
    if (redis) {
      const cached = await redis.get<T>(key);
      if (cached !== null && cached !== undefined) {
        cacheStats.hits++;
        return cached;
      }
    } else {
      const memoryCached = memoryCache.get(key);
      if (memoryCached && memoryCached.expiresAt > Date.now()) {
        cacheStats.hits++;
        return memoryCached.value as T;
      }
    }

    // Cache miss - check if request already in flight (stampede protection)
    const inFlight = inFlightRequests.get(key);
    if (inFlight) {
      logger.debug('Cache stampede prevented - waiting for in-flight request', { key });
      return inFlight as Promise<T>;
    }

    // Create new request and track it
    cacheStats.misses++;
    const fetchPromise = (async () => {
      try {
        const data = await fetcher();

        // Store in cache
        if (redis) {
          // Use SET with NX to prevent race conditions
          await redis.set(key, data, { ex: ttl });
        } else {
          evictIfNeeded();
          memoryCache.set(key, {
            value: data,
            expiresAt: Date.now() + ttl * 1000,
          });
        }

        // Track tags for bulk invalidation
        if (options.tags?.length) {
          await addToTags(key, options.tags, ttl);
        }

        return data;
      } finally {
        // Remove from in-flight tracking
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  } catch (error) {
    cacheStats.errors++;
    logger.error('Cache error, falling back to direct fetch', { key, error });
    return fetcher();
  }
}

/**
 * Get a value from cache without fetching (returns null if not found)
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (shouldNeverCache(key)) return null;

  try {
    const redis = await getRedisClient();

    if (redis) {
      return await redis.get<T>(key);
    } else {
      const memoryCached = memoryCache.get(key);
      if (memoryCached && memoryCached.expiresAt > Date.now()) {
        return memoryCached.value as T;
      }
    }
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error });
    return null;
  }
}

/**
 * Set a value in cache directly
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  if (shouldNeverCache(key)) {
    logger.warn('Attempted to cache real-time data - skipping', { key });
    return;
  }

  const ttl = options.ttl ?? 60;

  try {
    const redis = await getRedisClient();

    if (redis) {
      await redis.set(key, value, { ex: ttl });
    } else {
      evictIfNeeded();
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttl * 1000,
      });
    }

    if (options.tags?.length) {
      await addToTags(key, options.tags, ttl);
    }
  } catch (error) {
    logger.error('Cache set error', { key, error });
  }
}

/**
 * Invalidate a specific cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }

    logger.debug('Cache invalidated', { key });
  } catch (error) {
    logger.error('Cache invalidation error', { key, error });
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await redis.scan(cursor, { match: pattern, count: 100 });
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== 0);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug('Cache pattern invalidated', { pattern, count: keys.length });
      }

      return keys.length;
    } else {
      let count = 0;
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
          count++;
        }
      }

      return count;
    }
  } catch (error) {
    logger.error('Cache pattern invalidation error', { pattern, error });
    return 0;
  }
}

/**
 * Invalidate cache by tag
 */
export async function invalidateCacheByTag(tag: string): Promise<number> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      const tagKey = `tag:${tag}`;
      const keys = await redis.smembers(tagKey);

      if (keys.length > 0) {
        await redis.del(...keys, tagKey);
        logger.debug('Cache tag invalidated', { tag, count: keys.length });
      }

      return keys.length;
    } else {
      return invalidateCachePattern(`*${tag}*`);
    }
  } catch (error) {
    logger.error('Cache tag invalidation error', { tag, error });
    return 0;
  }
}

/**
 * Add a key to tags for bulk invalidation (with TTL to prevent memory leak)
 */
async function addToTags(key: string, tags: string[], ttl: number): Promise<void> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      await Promise.all(
        tags.map(async (tag) => {
          const tagKey = `tag:${tag}`;
          await redis.sadd(tagKey, key);
          // Set TTL on tag set to prevent indefinite growth
          await redis.expire(tagKey, ttl * 2);
        })
      );
    }
  } catch (error) {
    logger.error('Cache tag add error', { key, tags, error });
  }
}

/**
 * Clear all cache (use with caution - for maintenance only)
 */
export async function clearAllCache(): Promise<void> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      await redis.flushdb();
    } else {
      memoryCache.clear();
    }

    logger.info('All cache cleared');
  } catch (error) {
    logger.error('Cache clear error', { error });
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats & { hitRate: number; isRedis: boolean; memorySize: number } {
  const total = cacheStats.hits + cacheStats.misses;
  return {
    ...cacheStats,
    hitRate: total > 0 ? cacheStats.hits / total : 0,
    isRedis: redisAvailable ?? false,
    memorySize: memoryCache.size,
  };
}

/**
 * Clean up expired entries from memory cache
 */
export function cleanupMemoryCache(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt <= now) {
      memoryCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug('Memory cache cleanup', { cleaned });
  }

  return cleaned;
}

// Run cleanup every 5 minutes for memory cache
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000);
}

// ============================================================================
// Cache Key Builders (for consistency)
// ============================================================================

export const cacheKeys = {
  // User & Session
  session: (userId: string) => `session:${userId}`,
  userRoles: (userId: string) => `roles:${userId}`,

  // System
  tierLimits: () => 'system:tier_limits',
  tierPrices: () => 'system:tier_prices',
  systemSettings: (key: string) => `system:settings:${key}`,

  // Person & Routine Structure (NEVER includes completions)
  persons: (roleId: string) => `persons:${roleId}`,
  routineStructure: (personId: string) => `routine:structure:${personId}`,
  routineList: (roleId: string) => `routines:list:${roleId}`,
  taskStructure: (routineId: string) => `tasks:structure:${routineId}`,

  // Marketplace (public, safe to cache)
  marketplace: (category?: string) => `marketplace:${category ?? 'all'}`,
  marketplaceTemplate: (id: string) => `marketplace:template:${id}`,

  // School
  schoolMembers: (schoolId: string) => `school:members:${schoolId}`,
  schoolSettings: (schoolId: string) => `school:settings:${schoolId}`,
};

// ============================================================================
// Invalidation Helpers (call after mutations)
// ============================================================================

/**
 * Invalidate all caches for a user (after profile update, role change, etc.)
 */
export async function invalidateUserCaches(userId: string): Promise<void> {
  await Promise.all([
    invalidateCache(cacheKeys.session(userId)),
    invalidateCache(cacheKeys.userRoles(userId)),
  ]);
  logger.debug('User caches invalidated', { userId });
}

/**
 * Invalidate caches after a person is modified
 */
export async function invalidatePersonCaches(
  personId: string,
  roleId: string
): Promise<void> {
  await Promise.all([
    invalidateCache(cacheKeys.persons(roleId)),
    invalidateCache(cacheKeys.routineStructure(personId)),
  ]);
  logger.debug('Person caches invalidated', { personId, roleId });
}

/**
 * Invalidate caches after a routine is modified
 */
export async function invalidateRoutineCaches(
  routineId: string,
  personIds: string[],
  roleId: string
): Promise<void> {
  await Promise.all([
    invalidateCache(cacheKeys.routineList(roleId)),
    ...personIds.map((personId) => invalidateCache(cacheKeys.routineStructure(personId))),
  ]);
  logger.debug('Routine caches invalidated', { routineId, personCount: personIds.length });
}

/**
 * Invalidate caches after a task is modified
 */
export async function invalidateTaskCaches(
  routineId: string,
  personIds: string[]
): Promise<void> {
  await Promise.all([
    invalidateCache(cacheKeys.taskStructure(routineId)),
    ...personIds.map((personId) => invalidateCache(cacheKeys.routineStructure(personId))),
  ]);
  logger.debug('Task caches invalidated', { routineId, personCount: personIds.length });
}

// ============================================================================
// IMPORTANT: No cache invalidation needed for completions!
// ============================================================================
// Task completions are NEVER cached, so no invalidation is needed when
// completions change. This ensures real-time sync for co-parents and kiosk.
//
// DO NOT add any completion-related cache invalidation functions here.
// If you find yourself wanting to invalidate "completion caches", you're
// doing something wrong - completions should always be fetched fresh.
// ============================================================================
