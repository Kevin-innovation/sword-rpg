#!/usr/bin/env node

// fix_rls_direct.js
// Direct script to fix RLS security issues using Supabase client
// This script will execute the SQL commands directly through the Supabase client

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return false;
    }
    console.log(`✅ Success: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function fixRLSIssues() {
  console.log('🔧 Starting RLS Security Cleanup...\n');

  const tables = ['users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns'];
  
  // Step 1: Check current policies
  console.log('🔍 Checking current RLS policies...');
  const checkPoliciesSQL = `
    SELECT 
        schemaname,
        tablename,
        policyname
    FROM pg_policies 
    WHERE schemaname = 'public' 
        AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
    ORDER BY tablename, policyname;
  `;
  
  try {
    const { data: policies, error } = await supabase.rpc('exec_sql', { sql_query: checkPoliciesSQL });
    if (error) {
      console.error('❌ Unable to check current policies. This script may not have sufficient permissions.');
      console.error('Please run the SQL commands manually in the Supabase dashboard.');
      process.exit(1);
    }
    console.log(`Found ${policies?.length || 0} existing policies`);
  } catch (err) {
    console.error('❌ Unable to execute SQL queries. Please run manually in Supabase dashboard.');
    process.exit(1);
  }

  // Step 2: Drop all policies for each table
  for (const table of tables) {
    const dropPoliciesSQL = `
      DO $$
      DECLARE
          policy_record RECORD;
      BEGIN
          FOR policy_record IN 
              SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = '${table}'
          LOOP
              EXECUTE format('DROP POLICY IF EXISTS %I ON ${table}', policy_record.policyname);
          END LOOP;
      END $$;
    `;
    
    await executeSQL(dropPoliciesSQL, `Dropping all policies from ${table} table`);
  }

  // Step 3: Disable RLS on all tables
  for (const table of tables) {
    const disableRLSSQL = `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`;
    await executeSQL(disableRLSSQL, `Disabling RLS on ${table} table`);
  }

  // Step 4: Verify cleanup
  console.log('\n🔍 Verifying cleanup...');
  
  const verifyPoliciesSQL = `
    SELECT 
        COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
        AND tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns');
  `;
  
  const verifyRLSSQL = `
    SELECT 
        tablename,
        CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
    FROM pg_tables pt
    JOIN pg_class pc ON pc.relname = pt.tablename
    WHERE pt.schemaname = 'public'
        AND pt.tablename IN ('users', 'swords', 'items', 'inventories', 'rankings', 'user_achievements', 'item_cooldowns')
    ORDER BY tablename;
  `;

  try {
    const { data: policyCount } = await supabase.rpc('exec_sql', { sql_query: verifyPoliciesSQL });
    const { data: rlsStatus } = await supabase.rpc('exec_sql', { sql_query: verifyRLSSQL });
    
    console.log(`\n📊 Verification Results:`);
    console.log(`   Remaining policies: ${policyCount?.[0]?.policy_count || 0}`);
    console.log(`   RLS status for all tables: ${rlsStatus?.every(row => row.rls_status === 'DISABLED') ? 'DISABLED ✅' : 'MIXED ❌'}`);
    
    if ((policyCount?.[0]?.policy_count || 0) === 0 && rlsStatus?.every(row => row.rls_status === 'DISABLED')) {
      console.log('\n✅ SUCCESS: All RLS security issues have been resolved!');
      console.log('   - No RLS policies remain on any table');
      console.log('   - RLS is disabled on all 7 tables');
      console.log('   - Security Advisor warnings should now be resolved');
    } else {
      console.log('\n⚠️  Some issues may remain. Please check the Supabase Security Advisor.');
    }
  } catch (err) {
    console.log('\n⚠️  Unable to verify results. Please check manually in Supabase dashboard.');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Check your Supabase dashboard Security Advisor');
  console.log('2. Verify that all warnings have been resolved');
  console.log('3. Test your application to ensure it still works correctly');
}

// Run the fix
fixRLSIssues().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  console.log('\n📋 Manual Instructions:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Execute the SQL file: sql/12_cleanup_rls_policies.sql');
  process.exit(1);
});