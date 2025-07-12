-- 완전한 Supabase 설정 수정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책들 완전 제거
DROP POLICY IF EXISTS "Users can view and edit their own data" ON users;
DROP POLICY IF EXISTS "Users can view and edit their own swords" ON swords;
DROP POLICY IF EXISTS "Users can view and edit their own inventory" ON inventories;
DROP POLICY IF EXISTS "Users can view and edit their own rankings" ON rankings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON swords;
DROP POLICY IF EXISTS "Enable select for swords based on user_id" ON swords;
DROP POLICY IF EXISTS "Enable update for swords based on user_id" ON swords;
DROP POLICY IF EXISTS "Enable delete for swords based on user_id" ON swords;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventories;
DROP POLICY IF EXISTS "Enable select for inventories based on user_id" ON inventories;
DROP POLICY IF EXISTS "Enable update for inventories based on user_id" ON inventories;
DROP POLICY IF EXISTS "Enable delete for inventories based on user_id" ON inventories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rankings;
DROP POLICY IF EXISTS "Enable select for all users" ON rankings;
DROP POLICY IF EXISTS "Enable update for rankings based on user_id" ON rankings;
DROP POLICY IF EXISTS "Enable delete for rankings based on user_id" ON rankings;

-- 2. 임시로 RLS 완전 비활성화 (개발/테스트용)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- 3. 기존 데이터 정리 (선택사항)
-- TRUNCATE TABLE rankings;
-- TRUNCATE TABLE inventories;
-- TRUNCATE TABLE swords;
-- TRUNCATE TABLE users;

-- 4. 사용자 인증 관련 함수 생성 (필요시)
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$;

-- 5. 테스트용 더미 데이터 삽입 (선택사항)
-- INSERT INTO users (id, email, nickname, money, fragments) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'test@test.com', 'TestUser', 50000, 10)
-- ON CONFLICT (id) DO NOTHING;

-- 6. 나중에 프로덕션용 RLS 활성화할 때 사용할 정책들 (주석처리)
/*
-- RLS 다시 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE swords ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 프로덕션용 정책들
CREATE POLICY "Allow authenticated users full access" ON users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON swords
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON inventories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to rankings" ON rankings
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to modify rankings" ON rankings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update rankings" ON rankings
  FOR UPDATE USING (auth.role() = 'authenticated');
*/