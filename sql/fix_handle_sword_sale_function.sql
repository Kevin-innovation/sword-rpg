-- Fix handle_sword_sale function to match API parameter names
-- The API calls with: p_user_id, p_sell_price, p_current_level
-- But the function expects: p_user_id, p_sword_level, p_sell_price

-- Drop the existing function first
DROP FUNCTION IF EXISTS handle_sword_sale(UUID, INTEGER, INTEGER);

-- Create the function with correct parameter names to match API call
CREATE OR REPLACE FUNCTION handle_sword_sale(
    p_user_id UUID,
    p_sell_price INTEGER,
    p_current_level INTEGER
) RETURNS JSON AS $$
DECLARE
    current_money INTEGER;
    result JSON;
BEGIN
    -- 현재 골드 조회
    SELECT money INTO current_money FROM users WHERE id = p_user_id;
    
    IF current_money IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
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
    
    SELECT json_build_object(
        'new_money', current_money + p_sell_price,
        'new_level', 0
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test the function with a dummy call (this will fail if user doesn't exist, but that's expected)
-- SELECT handle_sword_sale('00000000-0000-0000-0000-000000000000'::UUID, 1000, 5);

SELECT 'handle_sword_sale function has been fixed to match API parameter names!' as message;