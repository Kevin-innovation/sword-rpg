# RLS Security Cleanup Instructions

## Problem Description
The Supabase Security Advisor is showing RLS (Row Level Security) errors:

1. **"Policy Exists RLS Disabled"** for tables: inventories, items, rankings, swords, users
2. **"RLS Disabled in Public"** for all tables: item_cooldowns, users, swords, items, inventories, rankings, user_achievements

This happens when RLS policies exist but RLS is disabled on tables, creating a security warning.

## Solution

### Option 1: Automated Script (Recommended)
Run the provided script:
```bash
./scripts/fix_rls_security.sh
```

### Option 2: Manual Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Execute the file: `sql/12_cleanup_rls_policies.sql`

### Option 3: Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push --file sql/12_cleanup_rls_policies.sql
```

## What the Cleanup Script Does

1. **Drops all existing RLS policies** from these 7 tables:
   - users
   - swords
   - items
   - inventories
   - rankings
   - user_achievements
   - item_cooldowns

2. **Ensures RLS is completely disabled** on all tables

3. **Provides verification queries** to confirm the cleanup

## Verification Steps

After running the cleanup:

1. **Check Security Advisor**: The warnings should be gone
2. **Verify no policies exist**: Run this query in SQL Editor:
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   ```

3. **Verify RLS status**: Run this query:
   ```sql
   SELECT 
       tablename,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
   FROM pg_tables pt
   JOIN pg_class pc ON pc.relname = pt.tablename
   WHERE pt.schemaname = 'public'
       AND pt.tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
   ORDER BY tablename;
   ```

## Expected Results

- ✅ No RLS policies on any table
- ✅ RLS disabled on all 7 tables
- ✅ Security Advisor warnings resolved
- ✅ Database remains fully functional for your game

## Notes

- This cleanup is safe for your sword RPG game
- Your game logic doesn't rely on RLS for security
- All existing data and functionality will remain intact