-- 아이템 쿨타임 시스템 테이블 생성
CREATE TABLE IF NOT EXISTS item_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 사용자별 아이템 타입마다 하나의 쿨타임 레코드만 존재
  UNIQUE(user_id, item_type)
);

-- RLS 비활성화 (다른 테이블과 일관성 유지)
ALTER TABLE item_cooldowns DISABLE ROW LEVEL SECURITY;

-- 인덱스 생성 (쿨타임 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_item_cooldowns_user_item ON item_cooldowns(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_item_cooldowns_last_used ON item_cooldowns(last_used_at);

-- 쿨타임 체크 함수
CREATE OR REPLACE FUNCTION check_item_cooldown(
  p_user_id UUID,
  p_item_type TEXT
) RETURNS JSON AS $$
DECLARE
  last_used_time TIMESTAMP WITH TIME ZONE;
  cooldown_minutes INTEGER;
  remaining_minutes INTEGER;
  can_use BOOLEAN := true;
  result JSON;
BEGIN
  -- 아이템별 쿨타임 설정 (분 단위)
  CASE p_item_type
    WHEN 'protect' THEN cooldown_minutes := 30;
    WHEN 'doubleChance' THEN cooldown_minutes := 20;
    WHEN 'discount' THEN cooldown_minutes := 15;
    WHEN 'blessing_scroll' THEN cooldown_minutes := 25;
    WHEN 'advanced_protection' THEN cooldown_minutes := 45;
    ELSE cooldown_minutes := 0; -- 재료 아이템은 쿨타임 없음
  END CASE;
  
  -- 쿨타임이 없는 아이템은 바로 사용 가능
  IF cooldown_minutes = 0 THEN
    SELECT json_build_object(
      'can_use', true,
      'remaining_minutes', 0
    ) INTO result;
    RETURN result;
  END IF;
  
  -- 마지막 사용 시간 조회
  SELECT last_used_at INTO last_used_time
  FROM item_cooldowns
  WHERE user_id = p_user_id AND item_type = p_item_type;
  
  -- 처음 사용하는 경우 (레코드 없음)
  IF last_used_time IS NULL THEN
    SELECT json_build_object(
      'can_use', true,
      'remaining_minutes', 0
    ) INTO result;
    RETURN result;
  END IF;
  
  -- 쿨타임 계산
  remaining_minutes := cooldown_minutes - EXTRACT(EPOCH FROM (NOW() - last_used_time)) / 60;
  
  IF remaining_minutes <= 0 THEN
    can_use := true;
    remaining_minutes := 0;
  ELSE
    can_use := false;
    remaining_minutes := CEIL(remaining_minutes);
  END IF;
  
  SELECT json_build_object(
    'can_use', can_use,
    'remaining_minutes', remaining_minutes
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 아이템 사용 후 쿨타임 기록 함수
CREATE OR REPLACE FUNCTION record_item_usage(
  p_user_id UUID,
  p_item_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- UPSERT로 쿨타임 기록 (처음 사용 시 INSERT, 재사용 시 UPDATE)
  INSERT INTO item_cooldowns (user_id, item_type, last_used_at, created_at, updated_at)
  VALUES (p_user_id, p_item_type, NOW(), NOW(), NOW())
  ON CONFLICT (user_id, item_type)
  DO UPDATE SET 
    last_used_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 모든 사용자의 쿨타임 상태 조회 함수 (관리자용)
CREATE OR REPLACE FUNCTION get_user_cooldown_status(p_user_id UUID)
RETURNS TABLE(
  item_type TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  cooldown_minutes INTEGER,
  remaining_minutes INTEGER,
  can_use BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.item_type,
    c.last_used_at,
    CASE c.item_type
      WHEN 'protect' THEN 30
      WHEN 'doubleChance' THEN 20
      WHEN 'discount' THEN 15
      WHEN 'blessing_scroll' THEN 25
      WHEN 'advanced_protection' THEN 45
      ELSE 0
    END as cooldown_minutes,
    CASE 
      WHEN c.item_type IN ('protect', 'doubleChance', 'discount', 'blessing_scroll', 'advanced_protection') THEN
        GREATEST(0, CEIL(
          (CASE c.item_type
            WHEN 'protect' THEN 30
            WHEN 'doubleChance' THEN 20
            WHEN 'discount' THEN 15
            WHEN 'blessing_scroll' THEN 25
            WHEN 'advanced_protection' THEN 45
          END) - EXTRACT(EPOCH FROM (NOW() - c.last_used_at)) / 60
        ))
      ELSE 0
    END as remaining_minutes,
    CASE 
      WHEN c.item_type IN ('protect', 'doubleChance', 'discount', 'blessing_scroll', 'advanced_protection') THEN
        (EXTRACT(EPOCH FROM (NOW() - c.last_used_at)) / 60) >= 
        (CASE c.item_type
          WHEN 'protect' THEN 30
          WHEN 'doubleChance' THEN 20
          WHEN 'discount' THEN 15
          WHEN 'blessing_scroll' THEN 25
          WHEN 'advanced_protection' THEN 45
        END)
      ELSE true
    END as can_use
  FROM item_cooldowns c
  WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;