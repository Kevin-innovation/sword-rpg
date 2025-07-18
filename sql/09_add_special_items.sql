-- 특수 재료 아이템 추가
INSERT INTO items (id, type, name, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'magic_stone', '🔮 마력석', '10강 이상 강화에 필수! 신비한 마법의 힘', NOW(), NOW()),
(gen_random_uuid(), 'purification_water', '💧 정화수', '15강 이상 강화에 필수! 성스러운 정화의 물', NOW(), NOW()),
(gen_random_uuid(), 'legendary_essence', '⭐ 전설의 정수', '20강 이상 강화에 필수! 극희귀 전설 재료', NOW(), NOW()),
(gen_random_uuid(), 'advanced_protection', '🛡️ 고급 보호권', '15강 이상 전용! 강화된 보호 효과', NOW(), NOW()),
(gen_random_uuid(), 'blessing_scroll', '✨ 축복서', '연속 성공 시 보너스 확률 증가! (최대 +15%)', NOW(), NOW())
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 기존 아이템 타입 수정 (필요한 경우)
UPDATE items SET type = 'doubleChance' WHERE type = 'luck_potion';
UPDATE items SET type = 'protect' WHERE type = 'protection_scroll';
UPDATE items SET type = 'discount' WHERE type = 'discount_scroll';