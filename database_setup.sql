-- Supabase 데이터베이스 테이블 생성 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  money INTEGER DEFAULT 30000,
  fragments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. swords 테이블 생성
CREATE TABLE IF NOT EXISTS swords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. items 테이블 생성
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. inventories 테이블 생성
CREATE TABLE IF NOT EXISTS inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 5. rankings 테이블 생성
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  max_sword_level INTEGER DEFAULT 0,
  total_gold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 6. 기본 아이템 데이터 삽입
INSERT INTO items (type, name, description) VALUES
  ('doubleChance', '확률 2배', '강화 성공 확률을 2배로 증가시킵니다'),
  ('protect', '보호', '강화 실패 시 레벨이 0으로 떨어지지 않습니다'),
  ('discount', '할인', '강화 비용을 50% 할인합니다')
ON CONFLICT (type) DO NOTHING;

-- 7. RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE swords ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 8. RLS 정책 생성
CREATE POLICY "Users can view and edit their own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view and edit their own swords" ON swords
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view and edit their own inventory" ON inventories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view and edit their own rankings" ON rankings
  FOR ALL USING (auth.uid() = user_id);

-- 9. 모든 사용자가 아이템 정보를 볼 수 있도록 설정
CREATE POLICY "Anyone can view items" ON items
  FOR SELECT USING (true);

-- 10. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. 업데이트 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swords_updated_at BEFORE UPDATE ON swords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventories_updated_at BEFORE UPDATE ON inventories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();