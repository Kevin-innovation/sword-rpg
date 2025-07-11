// 강화 확률 계산 (예시: 레벨이 오를수록 확률 감소)
export function calculateEnhanceChance(level: number): number {
  // +0~+5: 100, 90, 80, 75, 70, 65
  // +6~+10: 60, 55, 50, 45, 40
  // +11~+15: 30, 25, 20, 15, 10
  // 16 이상: 7, 5, 3, 2, 1, 1, 1 ...
  if (level === 0) return 100;
  if (level === 1) return 90;
  if (level === 2) return 80;
  if (level === 3) return 75;
  if (level === 4) return 70;
  if (level === 5) return 65;
  if (level === 6) return 60;
  if (level === 7) return 55;
  if (level === 8) return 50;
  if (level === 9) return 45;
  if (level === 10) return 40;
  if (level === 11) return 30;
  if (level === 12) return 25;
  if (level === 13) return 20;
  if (level === 14) return 15;
  if (level === 15) return 10;
  if (level === 16) return 7;
  if (level === 17) return 5;
  if (level === 18) return 3;
  if (level === 19) return 2;
  if (level === 20) return 1;
  return 1;
}

// 강화 비용 계산 (레벨이 오를수록 곱연산으로 부담 증가)
export function calculateEnhanceCost(level: number): number {
  // 100 * 1.7^level (소수점 절삭)
  return Math.floor(100 * Math.pow(1.7, level));
}

// 실패 시 조각 획득량 (예시: 레벨이 높을수록 더 많이)
export function calculateFragmentsOnFail(level: number): number {
  if (level < 5) return 1;
  if (level < 10) return 2;
  if (level < 15) return 3;
  return 5;
}

// 조각 획득량
export const calculateFragmentsGained = (level: number): number => {
  return level * 50;
};

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

// 검 판매가 (누적 강화 비용의 1.2배)
export const calculateSwordSellPrice = (level: number): number => {
  const base = calculateTotalEnhanceCost(level);
  if (level < 10) return Math.floor(base * 2.0);
  if (level < 15) return Math.floor(base * 2.5);
  return Math.floor(base * 3.0);
};

// 주문서 비용 상수
export const ORDER_COST = {
  protect: 3000,      // 보호 주문서
  doubleChance: 3000, // 확률 x2
  discount: 3000      // 비용 절약
};

// 이펙트 시스템
export const enhancementEffects = {
  success: {
    particle: "golden-explosion",
    sound: "epic-success.mp3",
    duration: 2000,
    className: "animate-success-burst"
  },
  failure: {
    particle: "dark-shatter",
    sound: "tragic-fail.mp3",
    duration: 3000,
    className: "animate-failure-devastation"
  }
}; 