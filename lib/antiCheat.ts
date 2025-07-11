import { calculateEnhanceCost } from "./gameLogic";

// 서버사이드에서 반드시 검증
export const validateEnhancement = async (
  userId: string,
  currentLevel: number,
  cost: number,
  clientTimestamp: number
): Promise<boolean> => {
  // 시간차 검증 (5초 이내)
  const timeDiff = Math.abs(Date.now() - clientTimestamp);
  if (timeDiff > 5000) return false;

  // 비용 재계산 검증
  const expectedCost = calculateEnhanceCost(currentLevel);
  if (cost !== expectedCost) return false;

  return true;
}; 