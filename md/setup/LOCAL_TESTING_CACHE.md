# Local Testing: Redis Cache

Instructions for testing the hybrid caching implementation locally.

---

## Prerequisites

1. Ruby Routines running locally (`npm run dev`)
2. Database set up and migrated
3. At least one user account created

---

## Option 1: Test Without Redis (In-Memory Fallback)

The cache service automatically falls back to in-memory caching when Redis is not configured. This is perfect for local development.

### Steps

1. **Ensure Redis env vars are NOT set** (or commented out in `.env.local`):
   ```bash
   # Comment these out or remove them
   # UPSTASH_REDIS_REST_URL=
   # UPSTASH_REDIS_REST_TOKEN=
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Check logs** - You should see:
   ```
   Redis not configured, using in-memory cache fallback
   ```

4. **Test caching behavior**:
   - Log in to the app
   - Navigate around (dashboard, routines, persons)
   - Check server logs for cache hits/misses

### Verify In-Memory Cache Works

Add this temporary endpoint to test (or use the browser console):

```typescript
// In any page, add to check cache stats:
const stats = await fetch('/api/cache-stats').then(r => r.json());
console.log('Cache stats:', stats);
```

---

## Option 2: Test With Upstash Redis (Free Tier)

For production-like testing with actual Redis.

### Step 1: Create Free Upstash Database

1. Go to https://upstash.com
2. Sign up (free, no credit card)
3. Click **"Create Database"**
4. Choose:
   - **Name**: `rubyroutines-local`
   - **Region**: Any
   - **Type**: Regional (free)
5. Click **"Create"**

### Step 2: Get Credentials

1. In your database dashboard, scroll to **REST API**
2. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Configure Local Environment

Add to `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Step 4: Restart and Test

```bash
npm run dev
```

Check logs for:
```
Redis cache connected successfully
```

---

## Testing Real-Time Sync (Critical!)

The most important test is ensuring task completions remain real-time.

### Test Scenario: Co-Parent Sync

1. **Setup**:
   - Create two browser windows (or use incognito)
   - Log in as Parent A in window 1
   - Log in as Parent B (co-parent) in window 2
   - Both should be linked and sharing a child

2. **Test**:
   - In window 1 (Parent A), open the child's routine
   - In window 2 (Parent B), open the same child's routine
   - In window 1, complete a task
   - In window 2, **refresh the page**
   - **Expected**: The completion should appear immediately

3. **What to check**:
   - Completion shows in both windows after refresh
   - No stale data (old completion counts)
   - Progress bars update correctly

### Test Scenario: Kiosk to Dashboard Sync

1. **Setup**:
   - Open kiosk mode in one browser: `/kiosk`
   - Open parent dashboard in another: `/dashboard`

2. **Test**:
   - Enter kiosk code and select a child
   - Complete a task in kiosk
   - Check parent dashboard
   - **Expected**: Task shows as completed immediately

3. **Verify real-time**:
   - No need to refresh dashboard
   - If using Supabase Realtime, updates are instant
   - If not, updates appear on next data fetch

---

## Testing Cache Behavior

### Test 1: Session Caching

```bash
# Check session is cached
1. Log in
2. Navigate to different pages
3. Check server logs - should see "Cache hit" for session after first load
```

### Test 2: Cache Invalidation

```bash
# Verify cache invalidates on changes
1. View your routines list
2. Create a new routine
3. The list should update immediately (cache invalidated)
```

### Test 3: Never-Cache Patterns

```bash
# Verify completions are never cached
1. Open routine with tasks
2. Complete a task
3. Refresh immediately
4. Task should show completed (not stale)
5. Check logs - should see "Cache skipped (real-time data)"
```

---

## Debugging Cache Issues

### Enable Debug Logging

Add to `.env.local`:
```bash
LOG_LEVEL=debug
```

### Cache Debug Endpoints

You can add a temporary debug endpoint:

```typescript
// pages/api/cache-debug.ts (temporary, remove in production)
import { getCacheStats } from '@/lib/services/cache.service';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  const stats = getCacheStats();
  res.json({
    ...stats,
    hitRatePercent: (stats.hitRate * 100).toFixed(2) + '%',
  });
}
```

Then visit: `http://localhost:3000/api/cache-debug`

### Expected Cache Stats After Normal Use

```json
{
  "hits": 150,
  "misses": 50,
  "errors": 0,
  "skipped": 30,
  "hitRate": 0.75,
  "hitRatePercent": "75.00%",
  "isRedis": false,
  "memorySize": 25
}
```

- **hits**: Cache served from memory/Redis
- **misses**: Had to fetch from database
- **skipped**: Real-time data (completions) intentionally not cached
- **hitRate**: Should be 60-80% after warm-up

---

## Database Migration

After adding the new indexes, run:

```bash
# Generate migration
npx prisma migrate dev --name add_cache_optimization_indexes

# Or just push to dev database
npx prisma db push
```

The new indexes are:
- `TaskCompletion(personId, completedAt, taskId)` - For goal queries
- `RoutineAssignment(personId, routineId)` - For person-routine lookups

---

## Common Issues

### "Redis connection failed"

**Cause**: Invalid credentials or network issue

**Fix**:
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct
2. Check Upstash dashboard - is the database active?
3. The app will fall back to in-memory cache automatically

### "Cache miss on every request"

**Cause**: TTL too short or cache not persisting

**Fix**:
1. Check if you're in development mode (cache clears on hot reload)
2. Verify Redis is connected (check logs)
3. Increase TTL values in `cache.service.ts` for testing

### "Stale data for completions"

**Cause**: Completions are being cached (BUG!)

**Fix**:
1. Check that completion endpoints don't use `getCached()`
2. Verify `shouldNeverCache()` returns true for completion keys
3. Check for custom cache keys that might include "completion" data

### "Memory growing unbounded"

**Cause**: In-memory cache not evicting

**Fix**:
1. Check `MAX_MEMORY_CACHE_SIZE` is set (default: 1000)
2. Verify `evictIfNeeded()` is called on cache writes
3. Run `cleanupMemoryCache()` manually if needed

---

## Performance Testing (Optional)

For load testing the cache:

```bash
# Install artillery
npm install -g artillery

# Create test file: load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Dashboard load"
    flow:
      - get:
          url: "/api/trpc/person.list"
      - get:
          url: "/api/trpc/routine.list"

# Run test
artillery run load-test.yml
```

Expected results with caching:
- Response time < 100ms (cached)
- Response time < 500ms (cache miss)
- No errors
- Cache hit rate > 70%

---

## Next Steps

After local testing passes:

1. **Deploy to staging** with Redis enabled
2. **Run the same tests** in staging
3. **Monitor Upstash dashboard** for cache usage
4. **Check Vercel logs** for cache behavior
5. **Deploy to production** when confident

---

*Last updated: 2025-12-02*
