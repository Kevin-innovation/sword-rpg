-- Check current database functions and their signatures
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    pg_catalog.pg_get_function_result(p.oid) as return_type,
    p.prokind as function_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%handle_sword_sale%'
ORDER BY p.proname;

-- Check all public functions
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname NOT LIKE 'uuid_%'
  AND p.proname NOT LIKE 'gen_%'
ORDER BY p.proname;

-- Check table structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'swords', 'rankings', 'items', 'inventories', 'user_achievements', 'item_cooldowns')
ORDER BY table_name, ordinal_position;