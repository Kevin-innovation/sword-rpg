// 강화 확률 계산 (개선된 점진적 감소 시스템)
export function calculateEnhanceChance(level: number): number {
  // 구간별 점진적 확률 감소로 중간 구간 재미 증대
  
  // 0-4강: 초보자 구간 (높은 성공률)
  if (level === 0) return 100;
  if (level === 1) return 95;
  if (level === 2) return 90;
  if (level === 3) return 85;
  if (level === 4) return 80;
  
  // 5-9강: 중급자 구간 (안정적 진행)
  if (level === 5) return 75;
  if (level === 6) return 70;
  if (level === 7) return 65;
  if (level === 8) return 60;
  if (level === 9) return 55;
  
  // 10-14강: 고급자 구간 (전략적 판단 필요)
  if (level === 10) return 50;
  if (level === 11) return 45;
  if (level === 12) return 40;
  if (level === 13) return 35;
  if (level === 14) return 30;
  
  // 15-19강: 엘리트 구간 (높은 위험)
  if (level === 15) return 25;
  if (level === 16) return 20;
  if (level === 17) return 15;
  if (level === 18) return 12;
  if (level === 19) return 10;
  
  // 20강+: 전설 구간 (극한 도전)
  if (level === 20) return 8;
  if (level === 21) return 6;
  if (level === 22) return 5;
  if (level === 23) return 4;
  if (level === 24) return 3;
  
  // 25강 이상: 신화 구간 (최소 확률 보장)
  return Math.max(2, 3 - Math.floor((level - 24) / 5)); // 최소 2% 보장
}

// 강화 비용 계산 (구간별 차별화된 증가율)
export function calculateEnhanceCost(level: number): number {
  // 구간별 차별화된 비용 증가로 게임 밸런스 개선
  
  // 0-10강: 기본 구간 (1.5배 증가율)
  if (level <= 10) {
    return Math.floor(100 * Math.pow(1.5, level));
  }
  
  // 11-15강: 중급 구간 (1.8배 증가율)
  if (level <= 15) {
    const base10 = 100 * Math.pow(1.5, 10); // 10강까지의 기본값
    return Math.floor(base10 * Math.pow(1.8, level - 10));
  }
  
  // 16-20강: 고급 구간 (2.0배 증가율)
  if (level <= 20) {
    const base10 = 100 * Math.pow(1.5, 10);
    const base15 = base10 * Math.pow(1.8, 5);
    return Math.floor(base15 * Math.pow(2.0, level - 15));
  }
  
  // 21강+: 전설 구간 (2.5배 증가율)
  const base10 = 100 * Math.pow(1.5, 10);
  const base15 = base10 * Math.pow(1.8, 5);
  const base20 = base15 * Math.pow(2.0, 5);
  return Math.floor(base20 * Math.pow(2.5, level - 20));
}

// 실패 시 조각 획득량 (구간별 차별화된 보상)
export function calculateFragmentsOnFail(level: number): number {
  // 높은 레벨일수록 실패 시 더 많은 조각 획득으로 위험 보상 균형
  if (level < 5) return 1;          // 초보자 구간
  if (level < 10) return 3;         // 중급자 구간 (기존 2 → 3)
  if (level < 15) return 5;         // 고급자 구간 (기존 3 → 5)
  if (level < 20) return 8;         // 엘리트 구간 (기존 5 → 8)
  if (level < 25) return 12;        // 전설 구간
  return 20;                        // 신화 구간 (극한 보상)
}

// 실패 시 강화 조각 획득 (높은 레벨에서 실패할수록 더 많은 조각)
export const calculateFragmentsGained = (level: number): number => {
  if (level === 0) return 0; // 0강에서는 조각 없음
  
  // 기본 조각 + 레벨별 보너스
  let baseFragments = level * 30; // 기본 30개/레벨
  
  // 고레벨 보너스 시스템
  if (level >= 20) {
    baseFragments += level * 100; // 20강+ 추가 보너스
  } else if (level >= 15) {
    baseFragments += level * 70;  // 15강+ 추가 보너스
  } else if (level >= 10) {
    baseFragments += level * 50;  // 10강+ 추가 보너스
  } else if (level >= 5) {
    baseFragments += level * 20;  // 5강+ 소폭 보너스
  }
  
  return baseFragments;
};

// 조각으로 강화 확률 증가
export const FRAGMENT_BOOST_OPTIONS = [
  { fragments: 100, boost: 5, name: "+5% 확률 증가" },
  { fragments: 200, boost: 10, name: "+10% 확률 증가" },
  { fragments: 500, boost: 20, name: "+20% 확률 증가" }
];

// 조각 사용 가능 여부 확인
export function canUseFragments(currentFragments: number, requiredFragments: number): boolean {
  return currentFragments >= requiredFragments;
}

// 조각 사용 후 확률 계산
export function calculateBoostedChance(baseChance: number, boostPercentage: number): number {
  return Math.min(baseChance + boostPercentage, 100); // 최대 100%
}

// 축복서 시스템: 연속 성공 보너스
export function calculateBlessingBonus(consecutiveSuccesses: number): number {
  // 연속 성공 횟수에 따른 보너스 확률
  if (consecutiveSuccesses >= 3) return 15; // 3연속 성공 시 +15%
  if (consecutiveSuccesses >= 2) return 10; // 2연속 성공 시 +10%
  if (consecutiveSuccesses >= 1) return 5;  // 1연속 성공 시 +5%
  return 0;
}

// 특수 재료 소모 함수
export function calculateMaterialConsumption(level: number): {
  consumedMaterials: string[];
  description: string;
} {
  const consumed: string[] = [];
  let description = '';

  if (level >= 10) {
    consumed.push('magic_stone');
    description += '마력석 1개 소모. ';
  }
  
  if (level >= 15) {
    consumed.push('purification_water', 'advanced_protection');
    description += '정화수 1개, 고급 보호권 1개 소모. ';
  }
  
  if (level >= 20) {
    consumed.push('legendary_essence');
    description += '전설의 정수 1개 소모. ';
  }

  return {
    consumedMaterials: consumed,
    description: description || '일반 재료만 소모됩니다.'
  };
}

// 누적 강화 비용 계산 함수 (로그 함수 기반)
export function calculateTotalEnhanceCost(level: number): number {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += calculateEnhanceCost(i);
  }
  // 로그 함수로 보정: 레벨이 높을수록 더 가파르게 상승
  // (log(level+1) * total) - level이 0일 때도 0 방지
  if (level <= 1) return total;
  return Math.floor(Math.log(level + 1) * total);
}

// 검 판매가 (상점 아이템 가격과 균형 맞춤)
export const calculateSwordSellPrice = (level: number): number => {
  const base = calculateTotalEnhanceCost(level);
  // 더 완만한 증가율로 수정
  if (level < 5) return Math.floor(base * 1.5);      // 초반: 1.5배
  if (level < 10) return Math.floor(base * 1.8);     // 중반: 1.8배
  if (level < 15) return Math.floor(base * 2.0);     // 고급: 2.0배
  if (level < 20) return Math.floor(base * 2.2);     // 전설: 2.2배
  return Math.floor(base * 2.5);                     // 신화: 2.5배
};

// 주문서 및 특수 재료 비용 상수 (게임 밸런스 개선을 위한 가격 조정)
export const ORDER_COST = {
  protect: 100000,          // 보호 주문서 - 실패 시 레벨 하락 방지 (15k → 100k)
  doubleChance: 150000,     // 확률 x2 - 강화 성공 확률 2배 (15k → 150k)
  discount: 80000,          // 비용 절약 - 강화 비용 50% 할인 (15k → 80k)
  magic_stone: 25000,       // 마력석 - 10강+ 필수 재료
  purification_water: 50000, // 정화수 - 15강+ 필수 재료  
  legendary_essence: 100000, // 전설의 정수 - 20강+ 희귀 재료
  advanced_protection: 200000, // 고급 보호권 - 15강+ 전용 (75k → 200k)
  blessing_scroll: 120000    // 축복서 - 연속 성공 보너스 (30k → 120k)
};

// 아이템 구매 제한 및 쿨타임 설정
export const ITEM_LIMITS = {
  // 기본 주문서 제한 (게임 밸런스를 위해 엄격하게 제한)
  maxQuantity: {
    protect: 3,           // 보호 주문서 최대 3개
    doubleChance: 3,      // 확률 2배 최대 3개
    discount: 3,          // 할인 주문서 최대 3개
    blessing_scroll: 3,   // 축복서 최대 3개
    advanced_protection: 3, // 고급 보호권 최대 3개
    // 재료는 기존 10개 유지
    magic_stone: 10,
    purification_water: 10,
    legendary_essence: 10
  },
  
  // 주문서 사용 쿨타임 (분 단위)
  cooldown: {
    protect: 30,          // 보호 주문서 30분 쿨타임
    doubleChance: 20,     // 확률 2배 20분 쿨타임
    discount: 15,         // 할인 주문서 15분 쿨타임
    blessing_scroll: 25,  // 축복서 25분 쿨타임
    advanced_protection: 45 // 고급 보호권 45분 쿨타임
  }
};

// 아이템 쿨타임 체크 함수
export function checkItemCooldown(itemType: string, lastUsedTime: number): {
  canUse: boolean;
  remainingTime: number;
} {
  const cooldownMinutes = ITEM_LIMITS.cooldown[itemType];
  if (!cooldownMinutes) return { canUse: true, remainingTime: 0 };
  
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const elapsed = now - lastUsedTime;
  const remaining = cooldownMs - elapsed;
  
  return {
    canUse: remaining <= 0,
    remainingTime: Math.max(0, Math.ceil(remaining / 60000)) // 분 단위로 반환
  };
}

// 구간별 필수 재료 시스템
export const REQUIRED_MATERIALS = {
  // 10강 이상: 마력석 필수
  level_10_plus: {
    threshold: 10,
    required_items: ['magic_stone'],
    message: '10강 이상 강화에는 마력석이 필요합니다.'
  },
  // 15강 이상: 정화수 + 고급보호권 필수
  level_15_plus: {
    threshold: 15,
    required_items: ['purification_water', 'advanced_protection'],
    message: '15강 이상 강화에는 정화수와 고급 보호권이 필요합니다.'
  },
  // 20강 이상: 전설의 정수 필수
  level_20_plus: {
    threshold: 20,
    required_items: ['legendary_essence'],
    message: '20강 이상 강화에는 전설의 정수가 필요합니다.'
  }
};

// 구간별 필수 재료 확인 함수
export function checkRequiredMaterials(level: number, userInventory: any[]): {
  canEnhance: boolean;
  missingItems: string[];
  message: string;
} {
  const result = {
    canEnhance: true,
    missingItems: [] as string[],
    message: ''
  };

  // 각 구간별 제한 확인
  for (const [key, requirement] of Object.entries(REQUIRED_MATERIALS)) {
    if (level >= requirement.threshold) {
      for (const requiredItem of requirement.required_items) {
        const hasItem = userInventory.some(item => 
          item.items?.type === requiredItem && item.quantity > 0
        );
        
        if (!hasItem) {
          result.canEnhance = false;
          result.missingItems.push(requiredItem);
          result.message = requirement.message;
        }
      }
    }
  }

  return result;
}

// 이펙트 시스템
export const enhancementEffects = {
  success: {
    particle: "golden-explosion",
    sound: "epic-success.mp3",
    duration: 200,
    className: "animate-success-burst"
  },
  failure: {
    particle: "dark-shatter",
    sound: "tragic-fail.mp3",
    duration: 250,
    className: "animate-failure-devastation"
  }
}; 