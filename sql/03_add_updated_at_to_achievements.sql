-- 03_add_updated_at_to_achievements.sql
-- user_achievements 테이블에 updated_at 컬럼 추가 (400 Bad Request 오류 수정)

-- updated_at 컬럼이 존재하지 않으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_achievements' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_achievements 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- 기존 데이터의 updated_at을 created_at과 동일하게 설정
        UPDATE user_achievements 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'updated_at column added to user_achievements table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in user_achievements table';
    END IF;
END $$;