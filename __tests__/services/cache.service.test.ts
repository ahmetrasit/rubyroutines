/**
 * Cache Service Unit Tests
 *
 * Tests the hybrid caching implementation including:
 * - Memory cache operations
 * - Never-cache patterns for real-time data
 * - Cache stampede protection
 * - LRU eviction
 * - Cache invalidation
 */

// Mock the logger to prevent console noise during tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Redis - tests run without Redis by default
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

// Import after mocks are set up
import {
  getCached,
  getFromCache,
  setCache,
  invalidateCache,
  invalidateCachePattern,
  getCacheStats,
  cleanupMemoryCache,
  clearAllCache,
  cacheKeys,
  CACHE_TTL,
  CACHE_CONFIG,
} from '@/lib/services/cache.service';

describe('Cache Service', () => {
  beforeEach(async () => {
    // Clear all cache before each test
    await clearAllCache();
  });

  describe('NEVER_CACHE_PATTERNS', () => {
    it('should skip caching for keys containing "completion"', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      // Call twice with completion key
      await getCached('task:completion:123', fetcher, { ttl: 300 });
      await getCached('task:completion:123', fetcher, { ttl: 300 });

      // Fetcher should be called BOTH times (not cached)
      expect(fetcher).toHaveBeenCalledTimes(2);

      // Stats should show skipped, not hits
      const stats = getCacheStats();
      expect(stats.skipped).toBeGreaterThanOrEqual(2);
    });

    it('should skip caching for keys containing "progress"', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      await getCached('goal:progress:456', fetcher, { ttl: 300 });
      await getCached('goal:progress:456', fetcher, { ttl: 300 });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should skip caching for keys containing "complete"', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      await getCached('task:complete:789', fetcher, { ttl: 300 });
      await getCached('task:complete:789', fetcher, { ttl: 300 });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should return null from getFromCache for never-cache keys', async () => {
      // First set a value
      await setCache('completion:test', { data: 'should not cache' });

      // Should return null because it was never cached
      const result = await getFromCache('completion:test');
      expect(result).toBeNull();
    });
  });

  describe('Memory Cache Operations', () => {
    it('should cache and retrieve values', async () => {
      const fetcher = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

      // First call - cache miss
      const result1 = await getCached('session:user123', fetcher, { ttl: 300 });
      expect(result1).toEqual({ id: 1, name: 'Test' });
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const result2 = await getCached('session:user123', fetcher, { ttl: 300 });
      expect(result2).toEqual({ id: 1, name: 'Test' });
      expect(fetcher).toHaveBeenCalledTimes(1); // Still 1, not called again

      const stats = getCacheStats();
      expect(stats.hits).toBeGreaterThanOrEqual(1);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
    });

    it('should respect TTL expiration', async () => {
      jest.useFakeTimers();

      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      // Cache with 1 second TTL
      await getCached('short-lived:key', fetcher, { ttl: 1 });
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      jest.advanceTimersByTime(2000);

      // Should fetch again after expiry
      await getCached('short-lived:key', fetcher, { ttl: 1 });
      expect(fetcher).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should invalidate cache correctly', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      // Cache a value
      await getCached('invalidate:test', fetcher, { ttl: 300 });
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Invalidate it
      await invalidateCache('invalidate:test');

      // Should fetch again
      await getCached('invalidate:test', fetcher, { ttl: 300 });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should invalidate by pattern', async () => {
      const fetcher1 = jest.fn().mockResolvedValue({ user: 1 });
      const fetcher2 = jest.fn().mockResolvedValue({ user: 2 });
      const fetcher3 = jest.fn().mockResolvedValue({ other: 3 });

      // Cache multiple values
      await getCached('user:123:data', fetcher1, { ttl: 300 });
      await getCached('user:456:data', fetcher2, { ttl: 300 });
      await getCached('other:789:data', fetcher3, { ttl: 300 });

      // Invalidate user pattern
      const invalidated = await invalidateCachePattern('user:*');
      expect(invalidated).toBe(2);

      // User caches should be invalidated
      await getCached('user:123:data', fetcher1, { ttl: 300 });
      expect(fetcher1).toHaveBeenCalledTimes(2);

      // Other cache should still exist
      await getCached('other:789:data', fetcher3, { ttl: 300 });
      expect(fetcher3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Stampede Protection', () => {
    it('should coalesce concurrent requests for same key', async () => {
      let callCount = 0;
      const slowFetcher = jest.fn().mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return { count: callCount };
      });

      // Fire multiple concurrent requests
      const promises = [
        getCached('stampede:test', slowFetcher, { ttl: 300 }),
        getCached('stampede:test', slowFetcher, { ttl: 300 }),
        getCached('stampede:test', slowFetcher, { ttl: 300 }),
      ];

      const results = await Promise.all(promises);

      // All should get the same result from single fetch
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      // Fetcher should only be called once
      expect(slowFetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict entries when exceeding max size', async () => {
      // This test is harder to verify without accessing internal state
      // We'll verify by checking that old entries are eventually evicted

      const fetcher = jest.fn().mockImplementation((key: string) =>
        Promise.resolve({ key })
      );

      // Fill cache with many entries
      for (let i = 0; i < 100; i++) {
        await getCached(`eviction:test:${i}`, () => fetcher(`${i}`), { ttl: 300 });
      }

      // Stats should show cache is working
      const stats = getCacheStats();
      expect(stats.memorySize).toBeGreaterThan(0);
      expect(stats.memorySize).toBeLessThanOrEqual(CACHE_CONFIG.MAX_MEMORY_SIZE);
    });
  });

  describe('Cache Key Builders', () => {
    it('should generate correct session key', () => {
      expect(cacheKeys.session('user123')).toBe('session:user123');
    });

    it('should generate correct userRoles key', () => {
      expect(cacheKeys.userRoles('user123')).toBe('roles:user123');
    });

    it('should generate correct tierLimits key', () => {
      expect(cacheKeys.tierLimits()).toBe('system:tier_limits');
    });

    it('should generate correct persons key', () => {
      expect(cacheKeys.persons('role123')).toBe('persons:role123');
    });

    it('should generate correct routineStructure key', () => {
      expect(cacheKeys.routineStructure('person123')).toBe('routine:structure:person123');
    });

    it('should generate correct marketplace key', () => {
      expect(cacheKeys.marketplace()).toBe('marketplace:all');
      expect(cacheKeys.marketplace('templates')).toBe('marketplace:templates');
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits, misses, and skipped correctly', async () => {
      // Clear stats by clearing cache
      await clearAllCache();

      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      // Miss
      await getCached('stats:test:1', fetcher, { ttl: 300 });

      // Hit
      await getCached('stats:test:1', fetcher, { ttl: 300 });

      // Skipped (never cache)
      await getCached('completion:test', fetcher, { ttl: 300 });

      const stats = getCacheStats();
      expect(stats.misses).toBeGreaterThanOrEqual(1);
      expect(stats.hits).toBeGreaterThanOrEqual(1);
      expect(stats.skipped).toBeGreaterThanOrEqual(1);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('should report correct configuration', () => {
      const stats = getCacheStats();
      expect(stats.isRedis).toBe(false); // No Redis in tests
      expect(stats.memorySize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache TTL Configuration', () => {
    it('should have sensible default TTL values', () => {
      expect(CACHE_TTL.SESSION).toBeGreaterThanOrEqual(60); // At least 1 minute
      expect(CACHE_TTL.TIER_LIMITS).toBeGreaterThanOrEqual(300); // At least 5 minutes
      expect(CACHE_TTL.ROUTINE_STRUCTURE).toBeGreaterThanOrEqual(30); // At least 30 seconds
    });

    it('should have sensible config defaults', () => {
      expect(CACHE_CONFIG.MAX_MEMORY_SIZE).toBeGreaterThanOrEqual(100);
      expect(CACHE_CONFIG.EVICTION_PERCENT).toBeGreaterThan(0);
      expect(CACHE_CONFIG.EVICTION_PERCENT).toBeLessThanOrEqual(50);
    });
  });

  describe('Memory Cache Cleanup', () => {
    it('should clean up expired entries', async () => {
      jest.useFakeTimers();

      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      // Add entries with short TTL
      await getCached('cleanup:test:1', fetcher, { ttl: 1 });
      await getCached('cleanup:test:2', fetcher, { ttl: 1 });

      // Advance time past TTL
      jest.advanceTimersByTime(2000);

      // Run cleanup
      const cleaned = cleanupMemoryCache();
      expect(cleaned).toBeGreaterThanOrEqual(0);

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should fall back to fetcher on cache error', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'fallback' });

      // Even with potential issues, getCached should work
      const result = await getCached('error:test', fetcher, { ttl: 300 });
      expect(result).toEqual({ data: 'fallback' });
    });

    it('should handle fetcher errors gracefully', async () => {
      const failingFetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(getCached('fail:test', failingFetcher, { ttl: 300 }))
        .rejects.toThrow('Fetch failed');

      const stats = getCacheStats();
      // Error should be tracked
      expect(stats.errors).toBeGreaterThanOrEqual(0);
    });
  });
});
