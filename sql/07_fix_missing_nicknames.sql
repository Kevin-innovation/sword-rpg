-- 기존 사용자들의 닉네임 누락 문제 해결
-- Supabase SQL Editor에서 실행하세요

-- 1. 닉네임이 NULL이거나 빈 문자열인 사용자들에게 기본 닉네임 설정
UPDATE users 
SET 
  nickname = COALESCE(NULLIF(nickname, ''), email_prefix.prefix || '_user'),
  updated_at = NOW()
FROM (
  SELECT 
    id,
    SPLIT_PART(email, '@', 1) as prefix
  FROM users
  WHERE nickname IS NULL OR nickname = ''
) as email_prefix
WHERE users.id = email_prefix.id;

-- 2. auth.users의 user_metadata에서 닉네임이 있는 경우 우선 사용
UPDATE users 
SET 
  nickname = COALESCE(
    (auth_users.raw_user_meta_data->>'nickname')::text,
    nickname
  ),
  updated_at = NOW()
FROM auth.users as auth_users
WHERE users.id = auth_users.id
  AND (auth_users.raw_user_meta_data->>'nickname') IS NOT NULL
  AND (auth_users.raw_user_meta_data->>'nickname') != '';

-- 3. 확인: 업데이트된 사용자들 체크
SELECT 
  id, 
  email, 
  nickname,
  created_at,
  updated_at
FROM users 
ORDER BY updated_at DESC 
LIMIT 20;

-- 4. 닉네임이 없는 사용자 수 체크 (0이어야 함)
SELECT 
  COUNT(*) as users_without_nickname
FROM users 
WHERE nickname IS NULL OR nickname = '';