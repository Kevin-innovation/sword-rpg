-- 기존 사용자들의 이메일 확인 문제 해결
-- Supabase SQL Editor에서 실행하세요

-- 1. 모든 미확인 사용자의 이메일을 확인 처리
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. 전화번호 확인도 함께 처리 (필요시)
UPDATE auth.users 
SET 
  phone_confirmed_at = COALESCE(phone_confirmed_at, NOW()),
  updated_at = NOW()
WHERE phone_confirmed_at IS NULL;

-- 3. 확인된 사용자 수 체크
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_emails,
  COUNT(phone_confirmed_at) as confirmed_phones
FROM auth.users;

-- 4. 개발용: 새로 가입하는 사용자도 자동 확인되도록 설정
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at SET DEFAULT NOW();

-- 5. 확인: 모든 사용자가 제대로 확인되었는지 체크
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;