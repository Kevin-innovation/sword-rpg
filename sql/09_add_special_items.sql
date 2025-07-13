-- 구간별 차별화를 위한 특수 아이템 추가

-- 새로운 특수 재료 아이템들 추가
INSERT INTO items (type, name, description) VALUES
  ('magic_stone', '마력석', '10강 이상 강화에 필요한 신비한 돌 (필수 재료)'),
  ('purification_water', '정화수', '15강 이상 강화에 필요한 성스러운 물 (필수 재료)'),
  ('legendary_essence', '전설의 정수', '20강 이상 강화에 필요한 전설적 재료 (희귀)'),
  ('advanced_protection', '고급 보호권', '15강 이상에서만 사용 가능한 강화된 보호권'),
  ('blessing_scroll', '축복서', '연속 성공 시 보너스 효과를 주는 특별한 주문서')
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 결과 확인
SELECT type, name, description FROM items ORDER BY name;