-- 상점 아이템 구매 처리 함수
CREATE OR REPLACE FUNCTION handle_item_purchase(
  p_user_id UUID,
  p_item_type TEXT,
  p_price INTEGER
) RETURNS JSON AS $$
DECLARE
  user_money INTEGER;
  item_id UUID;
  current_quantity INTEGER := 0;
  new_quantity INTEGER;
  result JSON;
BEGIN
  -- 사용자 골드 확인
  SELECT money INTO user_money
  FROM users
  WHERE id = p_user_id;
  
  IF user_money IS NULL THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다';
  END IF;
  
  IF user_money < p_price THEN
    RAISE EXCEPTION '골드가 부족합니다';
  END IF;
  
  -- 아이템 ID 찾기
  SELECT id INTO item_id
  FROM items
  WHERE type = p_item_type;
  
  IF item_id IS NULL THEN
    RAISE EXCEPTION '아이템을 찾을 수 없습니다';
  END IF;
  
  -- 현재 아이템 수량 확인
  SELECT quantity INTO current_quantity
  FROM inventories
  WHERE user_id = p_user_id AND item_id = item_id;
  
  IF current_quantity IS NULL THEN
    current_quantity := 0;
  END IF;
  
  -- 최대 10개 제한
  IF current_quantity >= 10 THEN
    RAISE EXCEPTION '최대 10개까지만 보유할 수 있습니다';
  END IF;
  
  new_quantity := current_quantity + 1;
  
  -- 골드 차감
  UPDATE users 
  SET money = money - p_price,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 아이템 추가 (있으면 업데이트, 없으면 생성)
  INSERT INTO inventories (user_id, item_id, quantity, created_at, updated_at)
  VALUES (p_user_id, item_id, 1, NOW(), NOW())
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET 
    quantity = EXCLUDED.quantity + inventories.quantity,
    updated_at = NOW();
  
  -- 결과 반환
  SELECT json_build_object(
    'new_money', user_money - p_price,
    'new_item_count', new_quantity
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;