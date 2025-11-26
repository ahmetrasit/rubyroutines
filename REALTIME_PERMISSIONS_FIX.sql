-- ============================================
-- Supabase Realtime Permissions Fix
-- Grant necessary permissions for Realtime to work
-- ============================================

-- Grant SELECT permissions to authenticated users
-- This is REQUIRED for Realtime to broadcast events
GRANT SELECT ON public.task_completions TO authenticated;
GRANT SELECT ON public.task_completions TO anon;
GRANT SELECT ON public.kiosk_sessions TO authenticated;
GRANT SELECT ON public.kiosk_sessions TO anon;

-- Verify permissions were granted
SELECT
    grantee,
    table_name,
    privilege_type,
    '✅ Permission granted' as status
FROM information_schema.role_table_grants
WHERE table_name IN ('task_completions', 'kiosk_sessions')
    AND grantee IN ('authenticated', 'anon')
    AND privilege_type = 'SELECT'
ORDER BY table_name, grantee;

-- ============================================
-- Optional: Temporarily disable RLS for testing
-- ONLY use this if events still don't work after enabling in dashboard
-- ============================================

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE
        WHEN rowsecurity THEN '⚠️ RLS is enabled - may need policies'
        ELSE 'ℹ️ RLS is disabled'
    END as status
FROM pg_tables
WHERE tablename IN ('task_completions', 'kiosk_sessions');

-- Uncomment these lines ONLY if you want to temporarily disable RLS for testing:
-- ALTER TABLE task_completions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE kiosk_sessions DISABLE ROW LEVEL SECURITY;

-- If RLS is enabled and you want to keep it, create policies instead:
-- This allows all authenticated users to SELECT (read) all rows

-- DROP POLICY IF EXISTS "Allow authenticated users to read task_completions" ON task_completions;
-- CREATE POLICY "Allow authenticated users to read task_completions"
--     ON task_completions
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- DROP POLICY IF EXISTS "Allow anon users to read task_completions" ON task_completions;
-- CREATE POLICY "Allow anon users to read task_completions"
--     ON task_completions
--     FOR SELECT
--     TO anon
--     USING (true);

-- DROP POLICY IF EXISTS "Allow authenticated users to read kiosk_sessions" ON kiosk_sessions;
-- CREATE POLICY "Allow authenticated users to read kiosk_sessions"
--     ON kiosk_sessions
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- DROP POLICY IF EXISTS "Allow anon users to read kiosk_sessions" ON kiosk_sessions;
-- CREATE POLICY "Allow anon users to read kiosk_sessions"
--     ON kiosk_sessions
--     FOR SELECT
--     TO anon
--     USING (true);
