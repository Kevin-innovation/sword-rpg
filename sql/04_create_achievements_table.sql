-- 4단계: 검 업적 컬렉션 시스템 구현
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 사용자 업적 테이블 생성 (간단한 구조로)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unlocked_swords TEXT[] DEFAULT ARRAY['0'], -- 잠금 해제된 검 레벨 배열 (문자열로 저장)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 기존 사용자들을 위한 초기 데이터 생성
INSERT INTO user_achievements (user_id, unlocked_swords)
SELECT id, ARRAY['0']
FROM users
WHERE id NOT IN (SELECT user_id FROM user_achievements);

-- 확인용 쿼리
SELECT 
  ua.user_id,
  u.email,
  ua.unlocked_swords,
  array_length(ua.unlocked_swords, 1) as total_unlocked
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
ORDER BY ua.created_at DESC;