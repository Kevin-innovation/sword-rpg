-- 02_create_policies.sql
-- RLS 정책 생성

-- Users 테이블 정책
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Swords 테이블 정책
CREATE POLICY "Users can view own swords" ON swords
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own swords" ON swords
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swords" ON swords
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Items 테이블 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Items are viewable by everyone" ON items
  FOR SELECT USING (true);

-- Inventories 테이블 정책
CREATE POLICY "Users can view own inventory" ON inventories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON inventories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" ON inventories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rankings 테이블 정책
CREATE POLICY "Rankings are viewable by everyone" ON rankings
  FOR SELECT USING (true);

CREATE POLICY "Users can update own ranking" ON rankings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ranking" ON rankings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User achievements 테이블 정책
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);