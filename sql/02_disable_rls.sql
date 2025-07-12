-- 2단계: RLS(Row Level Security) 비활성화
-- database_setup.sql 실행 후 바로 실행하세요
-- 이것이 401 오류를 해결합니다

-- RLS 완전 비활성화 (개발용)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- 확인용 쿼리
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';