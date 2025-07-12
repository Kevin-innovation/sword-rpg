-- 기본 제공 골드를 3만으로 일괄 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 모든 사용자의 골드를 3만으로 업데이트 (현재 골드가 3만 미만인 경우만)
UPDATE users 
SET 
  money = 30000,
  updated_at = NOW()
WHERE money < 30000;

-- 2. users 테이블의 money 컬럼 기본값을 3만으로 변경
ALTER TABLE users 
ALTER COLUMN money SET DEFAULT 30000;

-- 3. 확인: 업데이트된 사용자들 체크
SELECT 
  id, 
  email, 
  nickname,
  money,
  created_at,
  updated_at
FROM users 
ORDER BY updated_at DESC 
LIMIT 20;

-- 4. 골드가 3만 미만인 사용자 수 체크 (0이어야 함)
SELECT 
  COUNT(*) as users_with_low_gold
FROM users 
WHERE money < 30000;