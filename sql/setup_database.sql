-- 검 RPG 게임 데이터베이스 통합 설정 스크립트
-- 이 파일을 실행하면 게임에 필요한 모든 데이터베이스 구조가 생성됩니다.

-- ===== 1. 테이블 초기화 (선택사항) =====
-- 기존 테이블들을 모두 삭제하고 새로 시작하려면 아래 주석을 해제하세요
-- DROP TABLE IF EXISTS item_cooldowns CASCADE;
-- DROP TABLE IF EXISTS user_achievements CASCADE;
-- DROP TABLE IF EXISTS rankings CASCADE;
-- DROP TABLE IF EXISTS inventories CASCADE;
-- DROP TABLE IF EXISTS swords CASCADE;
-- DROP TABLE IF EXISTS items CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ===== 2. 기본 테이블 생성 =====
-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    money INTEGER DEFAULT 200000,
    fragments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 검 테이블
CREATE TABLE IF NOT EXISTS swords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 아이템 테이블
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인벤토리 테이블
CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 랭킹 테이블
CREATE TABLE IF NOT EXISTS rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_sword_level INTEGER DEFAULT 0,
    total_gold INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 업적 테이블
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unlocked_swords TEXT[] DEFAULT ARRAY['0'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 아이템 쿨타임 테이블
CREATE TABLE IF NOT EXISTS item_cooldowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_type)
);

-- ===== 3. 인덱스 생성 =====
CREATE INDEX IF NOT EXISTS idx_swords_user_id ON swords(user_id);
CREATE INDEX IF NOT EXISTS idx_inventories_user_id ON inventories(user_id);
CREATE INDEX IF NOT EXISTS idx_inventories_item_id ON inventories(item_id);
CREATE INDEX IF NOT EXISTS idx_rankings_max_sword_level ON rankings(max_sword_level DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_total_gold ON rankings(total_gold DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_item_cooldowns_user_item ON item_cooldowns(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_item_cooldowns_last_used ON item_cooldowns(last_used_at);

-- ===== 4. 스키마 호환성 조정 =====
-- items 테이블에 updated_at 컬럼 추가 (존재하지 않는 경우)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- swords 테이블에 is_active 컬럼 추가 (존재하지 않는 경우)  
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'swords' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE swords ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ===== 5. RLS 비활성화 =====
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swords DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_cooldowns DISABLE ROW LEVEL SECURITY;

-- ===== 6. 기본 아이템 데이터 삽입 =====
INSERT INTO items (type, name, description) VALUES
('doubleChance', '행운의 물약', '강화 확률을 증가시킵니다'),
('protect', '보호 주문서', '강화 실패 시 레벨이 하락하지 않습니다'),
('discount', '비용 절약 주문서', '강화 비용을 50% 할인해줍니다'),
('magic_stone', '마력석', '10강 이상 강화에 필요한 신비한 돌 (필수 재료)'),
('purification_water', '정화수', '15강 이상 강화에 필요한 성스러운 물 (필수 재료)'),
('legendary_essence', '전설의 정수', '20강 이상 강화에 필요한 전설적 재료 (희귀)'),
('advanced_protection', '고급 보호권', '15강 이상에서만 사용 가능한 강화된 보호권'),
('blessing_scroll', '축복서', '연속 성공 시 보너스 효과를 주는 특별한 주문서')
ON CONFLICT (type) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ===== 7. 데이터베이스 함수 생성 =====

-- 기존 함수들 삭제 (타입 충돌 방지)
DROP FUNCTION IF EXISTS handle_item_purchase(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS handle_sword_sale(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS check_item_cooldown(UUID, TEXT);
DROP FUNCTION IF EXISTS record_item_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_cooldown_status(UUID);
DROP FUNCTION IF EXISTS create_user_if_not_exists(UUID, TEXT, TEXT, INTEGER, INTEGER);

-- 상점 아이템 구매 처리 함수
CREATE OR REPLACE FUNCTION handle_item_purchase(
    p_user_id UUID,
    p_item_type TEXT,
    p_price INTEGER
) RETURNS JSON AS $$
DECLARE
    user_money INTEGER;
    target_item_id UUID;
    current_quantity INTEGER := 0;
    new_quantity INTEGER;
    max_quantity INTEGER := 10;
    result JSON;
BEGIN
    -- 사용자 골드 확인
    SELECT money INTO user_money FROM users WHERE id = p_user_id;
    
    IF user_money IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    IF user_money < p_price THEN
        RAISE EXCEPTION '골드가 부족합니다';
    END IF;
    
    -- 아이템 ID 찾기
    SELECT id INTO target_item_id FROM items WHERE type = p_item_type;
    
    IF target_item_id IS NULL THEN
        RAISE EXCEPTION '아이템을 찾을 수 없습니다';
    END IF;
    
    -- 현재 아이템 수량 확인
    SELECT COALESCE(quantity, 0) INTO current_quantity
    FROM inventories
    WHERE user_id = p_user_id AND item_id = target_item_id;
    
    -- 아이템별 최대 보유량 제한
    IF p_item_type IN ('protect', 'doubleChance', 'discount', 'blessing_scroll', 'advanced_protection') THEN
        max_quantity := 3;
    END IF;
    
    IF current_quantity >= max_quantity THEN
        RAISE EXCEPTION '최대 %개까지만 보유할 수 있습니다', max_quantity;
    END IF;
    
    new_quantity := current_quantity + 1;
    
    -- 골드 차감
    UPDATE users SET money = money - p_price, updated_at = NOW() WHERE id = p_user_id;
    
    -- UPSERT로 아이템 추가/업데이트
    INSERT INTO inventories (user_id, item_id, quantity, created_at, updated_at)
    VALUES (p_user_id, target_item_id, 1, NOW(), NOW())
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = inventories.quantity + 1, updated_at = NOW();
    
    -- 실제 업데이트된 수량 조회
    SELECT quantity INTO new_quantity
    FROM inventories
    WHERE user_id = p_user_id AND item_id = target_item_id;
    
    SELECT json_build_object(
        'new_money', user_money - p_price,
        'new_item_count', new_quantity
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 검 판매 처리 함수
CREATE OR REPLACE FUNCTION handle_sword_sale(
    p_user_id UUID,
    p_sword_level INTEGER,
    p_sell_price INTEGER
) RETURNS JSON AS $$
DECLARE
    current_money INTEGER;
    result JSON;
BEGIN
    -- 현재 골드 조회
    SELECT money INTO current_money FROM users WHERE id = p_user_id;
    
    IF current_money IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 검 레벨 초기화
    UPDATE swords 
    SET level = 0, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- 골드 추가
    UPDATE users 
    SET money = money + p_sell_price, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- 랭킹 업데이트 (골드만 업데이트, 최대 레벨은 유지)
    INSERT INTO rankings (user_id, max_sword_level, total_gold, created_at, updated_at)
    VALUES (p_user_id, p_sword_level, current_money + p_sell_price, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        max_sword_level = GREATEST(rankings.max_sword_level, p_sword_level),
        total_gold = current_money + p_sell_price,
        updated_at = NOW();
    
    SELECT json_build_object(
        'new_money', current_money + p_sell_price,
        'new_level', 0
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 쿨타임 체크 함수
CREATE OR REPLACE FUNCTION check_item_cooldown(
    p_user_id UUID,
    p_item_type TEXT
) RETURNS JSON AS $$
DECLARE
    last_used_time TIMESTAMP WITH TIME ZONE;
    cooldown_minutes INTEGER;
    remaining_minutes INTEGER;
    can_use BOOLEAN := true;
    result JSON;
BEGIN
    -- 아이템별 쿨타임 설정
    CASE p_item_type
        WHEN 'protect' THEN cooldown_minutes := 30;
        WHEN 'doubleChance' THEN cooldown_minutes := 20;
        WHEN 'discount' THEN cooldown_minutes := 15;
        WHEN 'blessing_scroll' THEN cooldown_minutes := 25;
        WHEN 'advanced_protection' THEN cooldown_minutes := 45;
        ELSE cooldown_minutes := 0;
    END CASE;
    
    -- 쿨타임이 없는 아이템은 바로 사용 가능
    IF cooldown_minutes = 0 THEN
        SELECT json_build_object('can_use', true, 'remaining_minutes', 0) INTO result;
        RETURN result;
    END IF;
    
    -- 마지막 사용 시간 조회
    SELECT last_used_at INTO last_used_time
    FROM item_cooldowns
    WHERE user_id = p_user_id AND item_type = p_item_type;
    
    -- 처음 사용하는 경우
    IF last_used_time IS NULL THEN
        SELECT json_build_object('can_use', true, 'remaining_minutes', 0) INTO result;
        RETURN result;
    END IF;
    
    -- 쿨타임 계산
    remaining_minutes := cooldown_minutes - EXTRACT(EPOCH FROM (NOW() - last_used_time)) / 60;
    
    IF remaining_minutes <= 0 THEN
        can_use := true;
        remaining_minutes := 0;
    ELSE
        can_use := false;
        remaining_minutes := CEIL(remaining_minutes);
    END IF;
    
    SELECT json_build_object('can_use', can_use, 'remaining_minutes', remaining_minutes) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 아이템 사용 후 쿨타임 기록 함수
CREATE OR REPLACE FUNCTION record_item_usage(
    p_user_id UUID,
    p_item_type TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO item_cooldowns (user_id, item_type, last_used_at, created_at, updated_at)
    VALUES (p_user_id, p_item_type, NOW(), NOW(), NOW())
    ON CONFLICT (user_id, item_type)
    DO UPDATE SET last_used_at = NOW(), updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 사용자 쿨타임 상태 조회 함수
CREATE OR REPLACE FUNCTION get_user_cooldown_status(p_user_id UUID)
RETURNS TABLE(
    item_type TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    cooldown_minutes INTEGER,
    remaining_minutes INTEGER,
    can_use BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.item_type,
        c.last_used_at,
        CASE c.item_type
            WHEN 'protect' THEN 30
            WHEN 'doubleChance' THEN 20
            WHEN 'discount' THEN 15
            WHEN 'blessing_scroll' THEN 25
            WHEN 'advanced_protection' THEN 45
            ELSE 0
        END as cooldown_minutes,
        CASE 
            WHEN c.item_type IN ('protect', 'doubleChance', 'discount', 'blessing_scroll', 'advanced_protection') THEN
                GREATEST(0, CEIL(
                    (CASE c.item_type
                        WHEN 'protect' THEN 30
                        WHEN 'doubleChance' THEN 20
                        WHEN 'discount' THEN 15
                        WHEN 'blessing_scroll' THEN 25
                        WHEN 'advanced_protection' THEN 45
                    END) - EXTRACT(EPOCH FROM (NOW() - c.last_used_at)) / 60
                ))
            ELSE 0
        END as remaining_minutes,
        CASE 
            WHEN c.item_type IN ('protect', 'doubleChance', 'discount', 'blessing_scroll', 'advanced_protection') THEN
                (EXTRACT(EPOCH FROM (NOW() - c.last_used_at)) / 60) >= 
                (CASE c.item_type
                    WHEN 'protect' THEN 30
                    WHEN 'doubleChance' THEN 20
                    WHEN 'discount' THEN 15
                    WHEN 'blessing_scroll' THEN 25
                    WHEN 'advanced_protection' THEN 45
                END)
            ELSE true
        END as can_use
    FROM item_cooldowns c
    WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 사용자 생성 함수 (RLS 우회용)
CREATE OR REPLACE FUNCTION create_user_if_not_exists(
    user_id UUID,
    user_email TEXT,
    user_nickname TEXT,
    user_money INTEGER DEFAULT 200000,
    user_fragments INTEGER DEFAULT 0
) RETURNS users AS $$
DECLARE
    result users;
BEGIN
    INSERT INTO users (id, email, nickname, money, fragments, created_at, updated_at)
    VALUES (user_id, user_email, user_nickname, user_money, user_fragments, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nickname = EXCLUDED.nickname,
        updated_at = NOW()
    RETURNING * INTO result;
    
    -- 검 레코드도 생성
    INSERT INTO swords (user_id, level, created_at, updated_at)
    VALUES (user_id, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    
    -- 업적 레코드도 생성
    INSERT INTO user_achievements (user_id, unlocked_swords, created_at, updated_at)
    VALUES (user_id, ARRAY['0'], NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===== 완료 메시지 =====
SELECT '검 RPG 데이터베이스 설정이 완료되었습니다!' as message;