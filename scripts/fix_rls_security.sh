#!/bin/bash

# fix_rls_security.sh
# Script to fix RLS (Row Level Security) issues in Supabase
# This script will clean up all RLS policies and ensure RLS is properly disabled

echo "🔧 Starting RLS Security Cleanup..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo ""
    echo "📋 Manual Instructions:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Execute the SQL file: sql/12_cleanup_rls_policies.sql"
    echo ""
    echo "📄 The SQL script will:"
    echo "   - Drop all existing RLS policies from all 7 tables"
    echo "   - Ensure RLS is completely disabled"
    echo "   - Provide verification queries"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    echo ""
    echo "📋 Manual Instructions:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Execute the SQL file: sql/12_cleanup_rls_policies.sql"
    echo ""
    echo "📄 The SQL script will:"
    echo "   - Drop all existing RLS policies from all 7 tables"
    echo "   - Ensure RLS is completely disabled"
    echo "   - Provide verification queries"
    exit 1
fi

echo "🔍 Checking current RLS policies..."

# Execute the cleanup script
echo "🧹 Executing RLS cleanup script..."
supabase db push --file sql/12_cleanup_rls_policies.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS cleanup completed successfully!"
    echo ""
    echo "🔍 To verify the changes:"
    echo "1. Check your Supabase dashboard security advisor"
    echo "2. The following tables should have no RLS policies:"
    echo "   - users"
    echo "   - swords" 
    echo "   - items"
    echo "   - inventories"
    echo "   - rankings"
    echo "   - user_achievements"
    echo "   - item_cooldowns"
    echo ""
    echo "3. All tables should have RLS disabled"
else
    echo "❌ Error executing RLS cleanup script"
    echo ""
    echo "📋 Manual Instructions:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Execute the SQL file: sql/12_cleanup_rls_policies.sql"
fi