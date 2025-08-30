-- ====================================================================
-- 시즌 초기화 SQL 스크립트 (v4.0 - 2025.08.30)
-- ====================================================================
-- ⚠️  주의사항:
-- - 이 스크립트는 모든 사용자 데이터를 삭제합니다
-- - 실행 전 반드시 백업을 수행하세요
-- - 되돌릴 수 없는 작업입니다
-- ====================================================================

BEGIN;

-- 1. 사용자 관련 모든 데이터 초기화
-- ====================================================================

-- 1-1. 인벤토리 데이터 삭제
DELETE FROM inventories;

-- 1-2. 검 데이터 삭제  
DELETE FROM swords;

-- 1-3. 랭킹 데이터 삭제
DELETE FROM rankings;

-- 1-4. 사용자 업적 삭제
DELETE FROM user_achievements;

-- 1-5. 아이템 쿨타임 기록 삭제
DELETE FROM item_cooldowns;

-- 1-6. 사용자 계정 삭제 (이메일/닉네임은 유지하되 게임 데이터만 초기화)
-- 옵션 A: 사용자 완전 삭제 (로그인도 다시 해야 함)
DELETE FROM users;

-- 옵션 B: 사용자는 유지하고 게임 데이터만 초기화 (아래 주석 해제 시 사용)
-- UPDATE users SET 
--   money = 200000,           -- 시작 골드
--   fragments = 0,            -- 강화조각 초기화
--   updated_at = NOW();

-- 2. 아이템 시스템 업데이트 (2배 주문서 제거)
-- ====================================================================

-- 2-1. 2배 주문서 아이템 제거
DELETE FROM items WHERE type = 'doubleChance';

-- 2-2. 기존 아이템 정리 및 새로운 아이템 추가
-- 기존 기본 아이템들 제거
DELETE FROM items WHERE type IN ('luck_potion', 'protection_scroll');

-- 새로운 아이템 목록 삽입 (2배 주문서 제외)
INSERT INTO items (type, name, description) VALUES
  ('protect', '보호 주문서', '강화 실패 시 레벨 하락/초기화 방지 (1회)'),
  ('discount', '비용 절약 주문서', '다음 강화 비용 50% 할인'),
  ('magic_stone', '🔮 마력석', '10강 이상 강화에 필수! 신비한 마법의 힘'),
  ('purification_water', '💧 정화수', '15강 이상 강화에 필수! 성스러운 정화의 물'),
  ('legendary_essence', '⭐ 전설의 정수', '20강 이상 강화에 필수! 극희귀 전설 재료'),
  ('advanced_protection', '🛡️ 고급 보호권', '15강 이상 전용! 강화된 보호 효과'),
  ('blessing_scroll', '✨ 축복서', '연속 성공 시 보너스 확률 증가! (최대 +15%)')
ON CONFLICT (type) DO NOTHING;

-- 3. 데이터베이스 함수 업데이트 (2배 주문서 관련 제거)
-- ====================================================================

-- 3-1. 쿨타임 체크 함수 업데이트 (doubleChance 제거)
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
  -- 아이템별 쿨타임 설정 (분 단위) - doubleChance 제거됨
  CASE p_item_type
    WHEN 'protect' THEN cooldown_minutes := 30;
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

-- 3-2. 사용자 쿨타임 상태 조회 함수 업데이트 (doubleChance 제거)
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
      WHEN 'discount' THEN 15
      WHEN 'blessing_scroll' THEN 25
      WHEN 'advanced_protection' THEN 45
      ELSE 0
    END as cooldown_minutes,
    CASE 
      WHEN c.item_type IN ('protect', 'discount', 'blessing_scroll', 'advanced_protection') THEN
        GREATEST(0, CEIL(
          (CASE c.item_type
            WHEN 'protect' THEN 30
            WHEN 'discount' THEN 15
            WHEN 'blessing_scroll' THEN 25
            WHEN 'advanced_protection' THEN 45
          END) - EXTRACT(EPOCH FROM (NOW() - c.last_used_at)) / 60
        ))
      ELSE 0
    END as remaining_minutes,
    CASE 
      WHEN c.item_type IN ('protect', 'discount', 'blessing_scroll', 'advanced_protection') THEN
        (EXTRACT(EPOCH FROM (NOW() - c.last_used_at)) / 60) >= 
        (CASE c.item_type
          WHEN 'protect' THEN 30
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

-- 4. 확인 쿼리 (선택사항)
-- ====================================================================

-- 초기화 결과 확인
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 'swords', COUNT(*) FROM swords
UNION ALL
SELECT 'inventories', COUNT(*) FROM inventories
UNION ALL
SELECT 'rankings', COUNT(*) FROM rankings
UNION ALL
SELECT 'user_achievements', COUNT(*) FROM user_achievements
UNION ALL
SELECT 'item_cooldowns', COUNT(*) FROM item_cooldowns
UNION ALL
SELECT 'items', COUNT(*) FROM items;

-- 5. 시즌 초기화 완료 로그
-- ====================================================================

-- 초기화 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '시즌 초기화 완료 - v4.0 (2025.08.30)';
  RAISE NOTICE '====================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 모든 사용자 데이터 초기화';
  RAISE NOTICE '- 2배 주문서 완전 제거';
  RAISE NOTICE '- 강화확률 뽑기: 현재 단계 ±10%%';
  RAISE NOTICE '- 뽑기 비용: 단계별 x2만원';
  RAISE NOTICE '- 판매가: 30강 최대 3천만원';
  RAISE NOTICE '- 쿨타임 시스템 강화';
  RAISE NOTICE '====================================';
END $$;

COMMIT;