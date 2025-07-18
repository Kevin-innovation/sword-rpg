-- 13_verify_rls_cleanup.sql
-- Verification script to confirm RLS cleanup was successful

-- Check for any remaining RLS policies
SELECT 
    'REMAINING RLS POLICIES' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - No policies found' 
        ELSE '❌ FAIL - Policies still exist' 
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns');

-- List any remaining policies (should be empty)
SELECT 
    'POLICY DETAILS' as check_type,
    schemaname,
    tablename,
    policyname,
    '❌ This policy should be removed' as action_needed
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
ORDER BY tablename, policyname;

-- Check RLS status on all tables
SELECT 
    'RLS STATUS CHECK' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ❌' ELSE 'DISABLED ✅' END as rls_status,
    CASE 
        WHEN rowsecurity THEN 'FAIL - RLS should be disabled' 
        ELSE 'PASS - RLS properly disabled' 
    END as verification
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
ORDER BY tablename;

-- Overall status summary
SELECT 
    'OVERALL STATUS' as check_type,
    CASE 
        WHEN policy_count = 0 AND disabled_rls_count = 7 THEN 
            '✅ SUCCESS - All RLS issues resolved'
        WHEN policy_count > 0 THEN 
            '❌ PARTIAL - ' || policy_count || ' policies still exist'
        WHEN disabled_rls_count < 7 THEN 
            '❌ PARTIAL - ' || (7 - disabled_rls_count) || ' tables still have RLS enabled'
        ELSE 
            '⚠️  UNKNOWN - Please check individual results above'
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

-- Test basic table access (should work without issues)
SELECT 
    'TABLE ACCESS TEST' as check_type,
    'users' as table_name,
    COUNT(*) as record_count,
    '✅ Access working' as status
FROM users

UNION ALL

SELECT 
    'TABLE ACCESS TEST' as check_type,
    'items' as table_name,
    COUNT(*) as record_count,
    '✅ Access working' as status
FROM items

UNION ALL

SELECT 
    'TABLE ACCESS TEST' as check_type,
    'item_cooldowns' as table_name,
    COUNT(*) as record_count,
    '✅ Access working' as status
FROM item_cooldowns;