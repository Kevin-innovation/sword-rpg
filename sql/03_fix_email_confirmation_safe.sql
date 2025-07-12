-- 3단계: 이메일 확인 문제 해결 (안전한 방법)
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 기존 사용자들의 이메일 확인 처리 (함수 사용)
CREATE OR REPLACE FUNCTION confirm_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE email_confirmed_at IS NULL;
END;
$$;

-- 함수 실행
SELECT confirm_all_users();

-- 함수 삭제
DROP FUNCTION confirm_all_users();

-- 2. 설정에서 이메일 확인 비활성화
-- Supabase 대시보드 > Authentication > Settings 에서:
-- "Enable email confirmations" 체크 해제

-- 확인용 쿼리
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_emails
FROM auth.users;