-- Test script to verify the handle_sword_sale function fix
-- Run this after executing the complete_fix_solution.sql

-- 1. First, let's create a test user if one doesn't exist
INSERT INTO users (id, email, nickname, money, fragments, created_at, updated_at)
VALUES (
    '12345678-1234-1234-1234-123456789012'::UUID,
    'test@example.com',
    'Test User',
    100000,
    0,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    money = 100000,
    updated_at = NOW();

-- 2. Create a sword record for the test user
INSERT INTO swords (user_id, level, is_active, created_at, updated_at)
VALUES (
    '12345678-1234-1234-1234-123456789012'::UUID,
    5,
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    level = 5,
    updated_at = NOW();

-- 3. Test the function call with the same parameters the API uses
SELECT 'Testing function call...' as test_step;

SELECT handle_sword_sale(
    '12345678-1234-1234-1234-123456789012'::UUID,  -- p_user_id
    10000,                                          -- p_sell_price
    5                                              -- p_current_level
) as function_result;

-- 4. Verify the results
SELECT 'Checking results...' as verification_step;

SELECT 
    u.money as user_money,
    s.level as sword_level,
    r.max_sword_level,
    r.total_gold
FROM users u
LEFT JOIN swords s ON u.id = s.user_id
LEFT JOIN rankings r ON u.id = r.user_id
WHERE u.id = '12345678-1234-1234-1234-123456789012'::UUID;

-- 5. Clean up test data (optional)
-- DELETE FROM rankings WHERE user_id = '12345678-1234-1234-1234-123456789012'::UUID;
-- DELETE FROM swords WHERE user_id = '12345678-1234-1234-1234-123456789012'::UUID;
-- DELETE FROM users WHERE id = '12345678-1234-1234-1234-123456789012'::UUID;

SELECT 'Test completed successfully!' as final_message;