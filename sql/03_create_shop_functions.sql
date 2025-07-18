-- 상점 아이템 구매 처리 함수 (UPSERT 방식으로 레이스 컨디션 해결)
CREATE OR REPLACE FUNCTION handle_item_purchase(
  p_user_id UUID,
  p_item_type TEXT,
  p_price INTEGER
) RETURNS JSON AS $$
DECLARE
  user_money INTEGER;
  target_item_id UUID;
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
  SELECT id INTO target_item_id
  FROM items
  WHERE type = p_item_type;
  
  IF target_item_id IS NULL THEN
    RAISE EXCEPTION '아이템을 찾을 수 없습니다';
  END IF;
  
  -- 현재 아이템 수량 확인
  SELECT COALESCE(quantity, 0) INTO current_quantity
  FROM inventories
  WHERE user_id = p_user_id AND item_id = target_item_id;
  
  -- 아이템별 최대 보유량 제한 (게임 밸런스 개선)
  DECLARE
    max_quantity INTEGER := 10; -- 기본값
  BEGIN
    -- 주문서류는 3개로 제한
    IF p_item_type IN ('protect', 'doubleChance', 'discount', 'blessing_scroll', 'advanced_protection') THEN
      max_quantity := 3;
    END IF;
    
    IF current_quantity >= max_quantity THEN
      RAISE EXCEPTION '최대 %개까지만 보유할 수 있습니다', max_quantity;
    END IF;
  END;
  
  new_quantity := current_quantity + 1;
  
  -- 골드 차감
  UPDATE users 
  SET money = money - p_price,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- UPSERT로 아이템 추가/업데이트 (레이스 컨디션 해결)
  INSERT INTO inventories (user_id, item_id, quantity, created_at, updated_at)
  VALUES (p_user_id, target_item_id, 1, NOW(), NOW())
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET 
    quantity = inventories.quantity + 1,
    updated_at = NOW();
  
  -- 결과 반환 (실제 업데이트된 수량 조회)
  SELECT quantity INTO new_quantity
  FROM inventories
  WHERE user_id = p_user_id AND item_id = target_item_id;
  
  SELECT json_build_object(
    'new_money', user_money - p_price,
    'new_item_count', new_quantity
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;