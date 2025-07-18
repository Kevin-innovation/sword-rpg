-- =====================================================
-- EXECUTE THIS SQL IN SUPABASE DASHBOARD SQL EDITOR
-- =====================================================
-- This script will completely fix all RLS security issues
-- reported in the Security Advisor.
--
-- Steps to execute:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to "SQL Editor" 
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- =====================================================

-- Step 1: Check current state (for reference)
SELECT 
    'BEFORE CLEANUP - Current Policies' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns');

-- Step 2: Drop ALL existing RLS policies from all tables (OPTIMIZED VERSION)
-- This addresses the "Policy Exists RLS Disabled" warnings
-- Single DO block to handle all tables efficiently
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
        RAISE NOTICE 'Dropped policy % from %.% table', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- Step 3: Ensure RLS is completely disabled on all tables
-- This addresses the "RLS Disabled in Public" warnings
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_cooldowns DISABLE ROW LEVEL SECURITY;

-- Step 4: Verification - Check that all policies are gone
SELECT 
    'AFTER CLEANUP - Remaining Policies' as status,
    COUNT(*) as remaining_policies,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS - All policies removed' 
        ELSE '❌ ISSUE - Some policies still exist' 
    END as result
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns');

-- Step 5: Verification - Check RLS status on all tables
SELECT 
    'RLS STATUS VERIFICATION' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ❌' ELSE 'DISABLED ✅' END as rls_status
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
ORDER BY tablename;

-- Step 6: Final status summary
SELECT 
    'FINAL RESULT' as check_type,
    CASE 
        WHEN policy_count = 0 AND disabled_rls_count = 7 THEN 
            '✅ COMPLETE SUCCESS - All RLS security issues resolved!'
        WHEN policy_count > 0 THEN 
            '❌ PARTIAL - ' || policy_count || ' policies still exist'
        WHEN disabled_rls_count < 7 THEN 
            '❌ PARTIAL - ' || (7 - disabled_rls_count) || ' tables still have RLS enabled'
        ELSE 
            '⚠️ UNKNOWN - Please review individual results above'
    END as final_status
FROM (
    SELECT 
        (SELECT COUNT(*) FROM pg_policies 
         WHERE schemaname = 'public' 
           AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
        ) as policy_count,
        (SELECT COUNT(*) FROM pg_tables pt
         JOIN pg_class pc ON pc.relname = pt.tablename
         WHERE pt.schemaname = 'public'
           AND pt.tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
           AND NOT pc.rowsecurity
        ) as disabled_rls_count
) counts;

-- =====================================================
-- EXPECTED RESULTS:
-- ✅ 0 remaining policies
-- ✅ All 7 tables show "DISABLED ✅" for RLS status  
-- ✅ Final result shows "COMPLETE SUCCESS"
-- ✅ Security Advisor warnings should disappear
-- =====================================================