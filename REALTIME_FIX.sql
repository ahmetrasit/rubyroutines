-- ============================================
-- Supabase Realtime Fix for task_completions
-- ============================================

-- Step 1: Check current publication status
SELECT
    schemaname,
    tablename,
    'Currently in publication' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'task_completions';

-- Step 2: Remove table from publication (ignore error if not present)
-- Note: This may error if table is not in publication - that's OK
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE task_completions;
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Table not in publication, continuing...';
END $$;

-- Step 3: Set REPLICA IDENTITY to FULL
-- This is REQUIRED for Realtime filters to work
-- Without this, filters on columns other than the primary key won't work
ALTER TABLE task_completions REPLICA IDENTITY FULL;

-- Step 4: Add table to publication
ALTER PUBLICATION supabase_realtime ADD TABLE task_completions;

-- Step 5: Verify the setup
SELECT
    schemaname,
    tablename,
    'Successfully added to publication' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'task_completions';

-- Step 6: Check replica identity (should be 'f' for FULL)
SELECT
    relname as table_name,
    relreplident as replica_identity,
    CASE relreplident
        WHEN 'd' THEN 'default (primary key)'
        WHEN 'n' THEN 'nothing'
        WHEN 'f' THEN 'full (all columns)'
        WHEN 'i' THEN 'index'
    END as replica_identity_description
FROM pg_class
WHERE relname = 'task_completions';

-- ============================================
-- Expected output from Step 6:
-- replica_identity should be 'f' (full)
-- ============================================
