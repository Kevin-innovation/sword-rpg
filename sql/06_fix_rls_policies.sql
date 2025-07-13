-- RLS 정책 문제 해결 및 누락된 사용자 데이터 생성

-- 1. user_achievements 테이블 INSERT 정책 추가 (이미 있으면 무시)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_achievements' 
        AND policyname = 'Users can insert own achievements'
    ) THEN
        CREATE POLICY "Users can insert own achievements" ON user_achievements
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 2. 기존 정책 확인 (선택사항)
-- SELECT * FROM pg_policies WHERE tablename = 'user_achievements';

-- 3. 현재 문제 있는 사용자들 수동 생성
INSERT INTO users (id, email, nickname, money, fragments, created_at, updated_at)
VALUES 
  ('46602cf3-608a-40c9-bd9a-d0d3cb5efce9', 'user1@test.com', '테스트1', 200000, 0, NOW(), NOW()),
  ('a4055a8d-655c-4710-b142-8ef001d1c3bf', 'user2@test.com', '테스트2', 200000, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO swords (user_id, level, created_at, updated_at)
VALUES 
  ('46602cf3-608a-40c9-bd9a-d0d3cb5efce9', 0, NOW(), NOW()),
  ('a4055a8d-655c-4710-b142-8ef001d1c3bf', 0, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_achievements (user_id, unlocked_swords, created_at, updated_at)
VALUES 
  ('46602cf3-608a-40c9-bd9a-d0d3cb5efce9', ARRAY['0'], NOW(), NOW()),
  ('a4055a8d-655c-4710-b142-8ef001d1c3bf', ARRAY['0'], NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 4. 결과 확인
SELECT 
  u.id, u.email, u.nickname, u.money,
  s.level as sword_level,
  ua.unlocked_swords
FROM users u
LEFT JOIN swords s ON u.id = s.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
ORDER BY u.created_at DESC
LIMIT 10;