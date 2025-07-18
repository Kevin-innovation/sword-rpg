-- Complete solution to fix handle_sword_sale function parameter mismatch
-- This script addresses the error: "Could not find the function public.handle_sword_sale(p_current_level, p_sell_price, p_user_id)"

-- 1. First, check what exists currently
SELECT 'Step 1: Checking existing functions...' as step;

SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    pg_catalog.pg_get_function_result(p.oid) as return_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%handle_sword_sale%';

-- 2. Drop any existing versions of the function
SELECT 'Step 2: Cleaning up existing function versions...' as step;

DROP FUNCTION IF EXISTS handle_sword_sale(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS handle_sword_sale(p_user_id UUID, p_sword_level INTEGER, p_sell_price INTEGER);
DROP FUNCTION IF EXISTS handle_sword_sale(p_user_id UUID, p_sell_price INTEGER, p_current_level INTEGER);

-- 3. Create the correct function that matches the API call
SELECT 'Step 3: Creating the corrected function...' as step;

CREATE OR REPLACE FUNCTION handle_sword_sale(
    p_user_id UUID,
    p_sell_price INTEGER,
    p_current_level INTEGER
) RETURNS JSON AS $$
DECLARE
    current_money INTEGER;
    result JSON;
BEGIN
    -- Debug: Log the parameters (remove in production)
    RAISE NOTICE 'handle_sword_sale called with: user_id=%, sell_price=%, current_level=%', 
                 p_user_id, p_sell_price, p_current_level;
    
    -- 현재 골드 조회
    SELECT money INTO current_money FROM users WHERE id = p_user_id;
    
    IF current_money IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다 (user_id: %)', p_user_id;
    END IF;
    
    -- 검 레벨 초기화
    UPDATE swords 
    SET level = 0, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- 골드 추가
    UPDATE users 
    SET money = money + p_sell_price, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- 랭킹 업데이트 (골드만 업데이트, 최대 레벨은 유지)
    INSERT INTO rankings (user_id, max_sword_level, total_gold, created_at, updated_at)
    VALUES (p_user_id, p_current_level, current_money + p_sell_price, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        max_sword_level = GREATEST(rankings.max_sword_level, p_current_level),
        total_gold = current_money + p_sell_price,
        updated_at = NOW();
    
    -- 결과 반환
    SELECT json_build_object(
        'new_money', current_money + p_sell_price,
        'new_level', 0,
        'success', true
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Verify the function was created successfully
SELECT 'Step 4: Verifying the function was created...' as step;

SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    pg_catalog.pg_get_function_result(p.oid) as return_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_sword_sale';

-- 5. Test the function signature matches what the API expects
SELECT 'Step 5: Testing function signature...' as step;

-- This should return information about the function if it exists with the correct signature
SELECT 
    'Function exists and matches API call signature' as status,
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_sword_sale'
  AND pg_catalog.pg_get_function_arguments(p.oid) = 'p_user_id uuid, p_sell_price integer, p_current_level integer';

-- 6. Final success message
SELECT 'SUCCESS: handle_sword_sale function has been fixed!' as final_message,
       'API calls with parameters (p_user_id, p_sell_price, p_current_level) should now work' as details;