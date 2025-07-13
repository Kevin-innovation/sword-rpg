-- 기존 사용자들을 위한 user_achievements 레코드 생성
-- 누락된 업적 레코드를 자동으로 생성합니다

INSERT INTO user_achievements (user_id, unlocked_swords, created_at, updated_at)
SELECT 
  u.id as user_id,
  ARRAY['0'] as unlocked_swords,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id
WHERE ua.user_id IS NULL;

-- 결과 확인
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM user_achievements) as users_with_achievements
FROM users;