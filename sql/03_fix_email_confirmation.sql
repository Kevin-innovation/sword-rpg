-- 3단계: 이메일 확인 문제 해결
-- 02_disable_rls.sql 실행 후 실행하세요
-- 이것이 "email not confirmed" 오류를 해결합니다

-- 모든 미확인 사용자의 이메일을 확인 처리
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 새로 가입하는 사용자도 자동 확인되도록 설정
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at SET DEFAULT NOW();

-- 확인용 쿼리
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_emails
FROM auth.users;

-- 최근 사용자 상태 확인
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;