-- 12_cleanup_rls_policies.sql
-- Complete RLS cleanup to fix security advisor warnings
-- This script will:
-- 1. Drop all existing RLS policies from all tables
-- 2. Ensure RLS is completely disabled on all tables
-- 3. Clean up any remaining security warnings

-- Drop all existing policies for users table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    END LOOP;
END $$;

-- Drop all existing policies for swords table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'swords'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON swords', policy_record.policyname);
    END LOOP;
END $$;

-- Drop all existing policies for items table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON items', policy_record.policyname);
    END LOOP;
END $$;

-- Drop all existing policies for inventories table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventories'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON inventories', policy_record.policyname);
    END LOOP;
END $$;

-- Drop all existing policies for rankings table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rankings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON rankings', policy_record.policyname);
    END LOOP;
END $$;

-- Drop all existing policies for user_achievements table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_achievements'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_achievements', policy_record.policyname);
    END LOOP;
END $$;

-- Drop all existing policies for item_cooldowns table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'item_cooldowns'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON item_cooldowns', policy_record.policyname);
    END LOOP;
END $$;

-- Ensure RLS is completely disabled on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_cooldowns DISABLE ROW LEVEL SECURITY;

-- Verification query to check remaining policies
SELECT 
    'Remaining RLS policies:' as status,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
ORDER BY tablename, policyname;

-- Verification query to check RLS status
SELECT 
    'RLS status check:' as status,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
ORDER BY tablename;