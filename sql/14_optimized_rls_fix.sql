-- ============================================================
-- OPTIMIZED RLS SECURITY FIX - EXECUTE DIRECTLY IN SUPABASE
-- ============================================================
-- This script implements the exact commands requested for fixing RLS security issues
-- Execute this in Supabase SQL Editor for immediate resolution

-- 1. Drop all existing RLS policies from all tables (SINGLE OPTIMIZED BLOCK)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_cooldowns DISABLE ROW LEVEL SECURITY;

-- 3. Verify the fix by checking for remaining policies
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns');

-- Additional verification: Check RLS status
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
ORDER BY tablename;

-- Success indicator
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All RLS policies have been removed'
        ELSE '❌ WARNING: ' || COUNT(*) || ' policies still exist'
    END as result
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns');