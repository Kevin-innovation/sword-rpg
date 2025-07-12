-- Supabase RLS 정책 수정 스크립트
-- 기존 정책들을 제거하고 새로 생성합니다

-- 1. 기존 RLS 정책 제거
DROP POLICY IF EXISTS "Users can view and edit their own data" ON users;
DROP POLICY IF EXISTS "Users can view and edit their own swords" ON swords;
DROP POLICY IF EXISTS "Users can view and edit their own inventory" ON inventories;
DROP POLICY IF EXISTS "Users can view and edit their own rankings" ON rankings;

-- 2. 새로운 RLS 정책 생성 (더 유연하게)
CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for users based on user_id" ON users
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Enable update for users based on user_id" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on user_id" ON users
  FOR DELETE USING (auth.uid() = id);

-- 3. swords 테이블 정책
CREATE POLICY "Enable insert for authenticated users" ON swords
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for swords based on user_id" ON swords
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Enable update for swords based on user_id" ON swords
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for swords based on user_id" ON swords
  FOR DELETE USING (auth.uid() = user_id);

-- 4. inventories 테이블 정책
CREATE POLICY "Enable insert for authenticated users" ON inventories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for inventories based on user_id" ON inventories
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Enable update for inventories based on user_id" ON inventories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for inventories based on user_id" ON inventories
  FOR DELETE USING (auth.uid() = user_id);

-- 5. rankings 테이블 정책
CREATE POLICY "Enable insert for authenticated users" ON rankings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for all users" ON rankings
  FOR SELECT USING (true);

CREATE POLICY "Enable update for rankings based on user_id" ON rankings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for rankings based on user_id" ON rankings
  FOR DELETE USING (auth.uid() = user_id);

-- 6. 임시로 RLS 비활성화 (테스트용)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;