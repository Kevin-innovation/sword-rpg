-- 검 판매 처리 함수
CREATE OR REPLACE FUNCTION handle_sword_sale(
  p_user_id UUID,
  p_sell_price INTEGER,
  p_current_level INTEGER
) RETURNS VOID AS $$
BEGIN
  -- 검 레벨을 0으로 초기화
  UPDATE swords 
  SET level = 0,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- 사용자 골드 증가
  UPDATE users 
  SET money = money + p_sell_price,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 랭킹 테이블의 total_gold도 업데이트 (최고 레벨은 유지)
  UPDATE rankings 
  SET total_gold = (
    SELECT money FROM users WHERE id = p_user_id
  ),
  updated_at = NOW()
  WHERE user_id = p_user_id;
  
END;
$$ LANGUAGE plpgsql;