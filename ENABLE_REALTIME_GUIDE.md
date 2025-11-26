# Enable Supabase Realtime - Step-by-Step Guide

## Critical Issue Identified

Even though we configured the database correctly (publication, replica identity), **Supabase requires enabling Realtime per table in the Dashboard**. This is separate from the SQL configuration!

## Where to Find It (Supabase Dashboard)

### Option 1: Database → Publications (Newer Supabase UI)

1. Go to your Supabase project dashboard
2. Click **"Database"** in the left sidebar
3. Look for **"Publications"** in the submenu
4. You should see the `supabase_realtime` publication
5. **Toggle ON** the following tables:
   - ✅ `task_completions`
   - ✅ `kiosk_sessions`

### Option 2: Database → Replication (Alternative UI)

1. Go to **Database** → **Replication**
2. Look for a section showing tables
3. Find `task_completions` and `kiosk_sessions`
4. Click to enable/add them to replication

### Option 3: API Settings (If Above Not Found)

1. Go to **Settings** → **API** (or **Project Settings**)
2. Look for **"Realtime"** or **"Database Webhooks"** section
3. Enable Realtime for the tables

## What You're Looking For

You should see something like:

```
supabase_realtime Publication
├── Schema: public
│   ├── [ ] table1
│   ├── [ ] table2
│   ├── [✓] task_completions    ← ENABLE THIS
│   └── [✓] kiosk_sessions      ← ENABLE THIS
```

## If You Can't Find the UI

The Supabase UI has changed several times. If you can't find the Publications section:

### Use SQL to Verify What's Enabled

Run this in Supabase SQL Editor:

```sql
-- Check if Realtime is properly configured
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Expected Output:**
```
schemaname | tablename
-----------+-------------------
public     | task_completions
public     | kiosk_sessions
```

If these tables are shown, the SQL side is correct. The issue is likely:

1. **Dashboard toggle not enabled** (separate from SQL)
2. **RLS policies blocking access**
3. **Missing SELECT permissions**

### Grant SELECT Permissions

Run this in Supabase SQL Editor:

```sql
-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.task_completions TO authenticated;
GRANT SELECT ON public.kiosk_sessions TO authenticated;
GRANT SELECT ON public.task_completions TO anon;
GRANT SELECT ON public.kiosk_sessions TO anon;
```

## How to Test

After enabling in the dashboard:

1. Open your app and go to kiosk mode
2. Open browser console (F12)
3. You should see: `[Realtime] Subscribed to task completions (DEBUG MODE - all events)`
4. Complete a task
5. You should see: `[Realtime DEBUG] ANY task completion received: {...}`

## Current Status

Based on WebSocket messages, we can see:

✅ Subscription is being sent to Supabase correctly
✅ WebSocket is connected
❓ We don't know if Supabase is accepting the subscription
❓ We don't know if events are being broadcast

## Next Steps

1. **Run REALTIME_DIAGNOSTIC.sql** in Supabase SQL Editor
   - This will show everything that's configured correctly ✅
   - And everything that's missing ❌

2. **Find the Publications toggle in Dashboard**
   - Look under Database → Publications
   - Or Database → Replication
   - Or Settings → API

3. **Enable both tables:**
   - `task_completions`
   - `kiosk_sessions`

4. **Test again** by completing a task and checking console

## Common Issues

### Issue: "Subscribed" but no events

**Cause**: Table not enabled in Dashboard (even if in publication via SQL)
**Fix**: Find the Publications toggle and enable the tables

### Issue: Events only for some columns

**Cause**: Replica identity not FULL
**Fix**: Already done - we set it to FULL

### Issue: "Invalid column for filter"

**Cause**: Column name mismatch or RLS blocking access
**Fix**: Remove filter (already done for debugging) or fix RLS policies

## If Still Not Working

After enabling in dashboard, if events still don't fire:

1. Check if there are RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'task_completions';`
2. Check replication slot is active: `SELECT * FROM pg_replication_slots;`
3. Try creating a test table without RLS to verify Realtime works at all
4. Contact Supabase support - might be a project-level issue

## Documentation Reference

- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- Key quote: "In your Supabase project's Publications settings, toggle on the specific tables you want to monitor within the supabase_realtime publication."
