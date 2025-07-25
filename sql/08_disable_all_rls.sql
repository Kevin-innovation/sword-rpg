-- 모든 테이블 RLS 비활성화
-- 게임 서버에서 인증 없이 데이터베이스 접근을 허용하기 위함

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;

-- 쿨타임 테이블도 RLS 비활성화 (11번 파일에서 생성됨)
ALTER TABLE item_cooldowns DISABLE ROW LEVEL SECURITY;