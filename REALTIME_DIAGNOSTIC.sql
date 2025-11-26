-- ============================================
-- Supabase Realtime Comprehensive Diagnostics
-- Run this in Supabase SQL Editor to verify configuration
-- ============================================

-- 1. Check if logical replication is enabled
SELECT
    name,
    setting,
    CASE
        WHEN setting = 'logical' THEN '✅ Logical replication enabled'
        ELSE '❌ Logical replication NOT enabled - this is required!'
    END as status
FROM pg_settings
WHERE name = 'wal_level';

-- 2. Check replication slots (Supabase should have created one)
SELECT
    slot_name,
    plugin,
    slot_type,
    database,
    active,
    CASE
        WHEN active THEN '✅ Replication slot active'
        ELSE '⚠️ Replication slot exists but not active'
    END as status
FROM pg_replication_slots
WHERE slot_name LIKE '%supabase%' OR plugin = 'wal2json';

-- 3. Check publication exists and configuration
SELECT
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete,
    pubtruncate,
    CASE
        WHEN pubname = 'supabase_realtime' THEN '✅ Realtime publication exists'
        ELSE 'ℹ️ Other publication'
    END as status
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- 4. Check which tables are in the publication
SELECT
    schemaname,
    tablename,
    '✅ In publication' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 5. Check replica identity for our tables
SELECT
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'DEFAULT (primary key only)'
        WHEN 'n' THEN 'NOTHING'
        WHEN 'f' THEN 'FULL (all columns)'
        WHEN 'i' THEN 'INDEX'
    END as replica_identity,
    CASE
        WHEN c.relreplident = 'f' THEN '✅ FULL replica identity set'
        WHEN c.relreplident = 'd' THEN '⚠️ DEFAULT - filters may not work'
        ELSE '❌ Not configured properly'
    END as status
FROM pg_class c
WHERE c.relname IN ('task_completions', 'kiosk_sessions')
ORDER BY c.relname;

-- 6. Check RLS (Row Level Security) policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('task_completions', 'kiosk_sessions')
ORDER BY tablename, policyname;

-- 7. Check table permissions for authenticated role
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type,
    CASE
        WHEN privilege_type = 'SELECT' THEN '✅ SELECT permission granted'
        ELSE 'ℹ️ ' || privilege_type || ' permission'
    END as status
FROM information_schema.role_table_grants
WHERE table_name IN ('task_completions', 'kiosk_sessions')
    AND grantee IN ('authenticated', 'anon', 'public')
ORDER BY table_name, grantee, privilege_type;

-- 8. Test data exists in task_completions
SELECT
    COUNT(*) as total_completions,
    COUNT(DISTINCT "personId") as unique_persons,
    MAX("completedAt") as latest_completion,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ Data exists - events should be generated on new inserts'
        ELSE 'ℹ️ No data yet - complete a task to test'
    END as status
FROM task_completions;

-- ============================================
-- SUMMARY CHECKS
-- ============================================

-- Final checklist - all should show ✅
SELECT
    'Configuration Summary' as check_type,
    '' as item,
    '' as status
UNION ALL
SELECT
    'Database',
    'Logical replication (wal_level)',
    CASE WHEN (SELECT setting FROM pg_settings WHERE name = 'wal_level') = 'logical'
        THEN '✅ Enabled' ELSE '❌ Not enabled' END
UNION ALL
SELECT
    'Publication',
    'supabase_realtime exists',
    CASE WHEN EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
        THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT
    'Publication',
    'task_completions in publication',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'task_completions'
    ) THEN '✅ Added' ELSE '❌ Not added' END
UNION ALL
SELECT
    'Publication',
    'kiosk_sessions in publication',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'kiosk_sessions'
    ) THEN '✅ Added' ELSE '❌ Not added' END
UNION ALL
SELECT
    'Replica Identity',
    'task_completions = FULL',
    CASE WHEN (
        SELECT relreplident FROM pg_class WHERE relname = 'task_completions'
    ) = 'f' THEN '✅ Set' ELSE '❌ Not set' END
UNION ALL
SELECT
    'Replica Identity',
    'kiosk_sessions = FULL',
    CASE WHEN (
        SELECT relreplident FROM pg_class WHERE relname = 'kiosk_sessions'
    ) = 'f' THEN '✅ Set' ELSE '❌ Not set' END
UNION ALL
SELECT
    'Permissions',
    'authenticated has SELECT on task_completions',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.role_table_grants
        WHERE table_name = 'task_completions'
            AND grantee IN ('authenticated', 'public')
            AND privilege_type = 'SELECT'
    ) THEN '✅ Granted' ELSE '⚠️ May need explicit grant' END;

-- ============================================
-- NEXT STEPS (if anything shows ❌ or ⚠️ above)
-- ============================================

-- If task_completions not in publication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE task_completions;

-- If kiosk_sessions not in publication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE kiosk_sessions;

-- If replica identity not FULL:
-- ALTER TABLE task_completions REPLICA IDENTITY FULL;
-- ALTER TABLE kiosk_sessions REPLICA IDENTITY FULL;

-- If missing SELECT permissions:
-- GRANT SELECT ON task_completions TO authenticated;
-- GRANT SELECT ON kiosk_sessions TO authenticated;
