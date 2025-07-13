-- 모든 테이블 RLS 비활성화 (완전 해결)

-- 1. 모든 테이블 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;

-- 2. 현재 문제 사용자 직접 생성
INSERT INTO users (id, email, nickname, money, fragments, created_at, updated_at)
VALUES ('a170862a-bdcf-41ce-9d10-0a34831e4593', 'test@example.com', '테스트유저', 200000, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  money = 200000,
  updated_at = NOW();

INSERT INTO swords (user_id, level, created_at, updated_at)  
VALUES ('a170862a-bdcf-41ce-9d10-0a34831e4593', 0, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

INSERT INTO user_achievements (user_id, unlocked_swords, created_at, updated_at)
VALUES ('a170862a-bdcf-41ce-9d10-0a34831e4593', ARRAY['0'], NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

-- 3. 결과 확인
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'swords' as table_name, COUNT(*) as count FROM swords
UNION ALL  
SELECT 'user_achievements' as table_name, COUNT(*) as count FROM user_achievements;