-- 기존 아이템 타입을 클라이언트 코드와 맞추기

-- 기존 아이템들의 type을 올바르게 수정
UPDATE items SET type = 'doubleChance' WHERE type = 'luck_potion';
UPDATE items SET type = 'protect' WHERE type = 'protection_scroll';

-- discount 아이템이 없다면 추가
INSERT INTO items (type, name, description) VALUES
  ('discount', '비용 절약 주문서', '강화 비용을 50% 할인해줍니다')
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 결과 확인
SELECT type, name, description FROM items ORDER BY type;