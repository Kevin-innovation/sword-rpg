import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

// 강화 확률 계산
function calculateEnhanceChance(level: number): number {
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

// 강화 비용 계산
function calculateEnhanceCost(level: number): number {
  return Math.floor(100 * Math.pow(1.7, level));
}

// 조각 획득량 계산
function calculateFragmentsGained(level: number): number {
  return level * 50;
}

// 치트 방지 검증
async function validateEnhancement(
  userId: string,
  currentLevel: number,
  cost: number,
  clientTimestamp: number
): Promise<boolean> {
  // 시간차 검증 (5초 이내)
  const timeDiff = Math.abs(Date.now() - clientTimestamp);
  if (timeDiff > 5000) return false;
  
  // 비용 재계산 검증
  const expectedCost = calculateEnhanceCost(currentLevel);
  if (cost !== expectedCost) return false;
  
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId,
    currentLevel,
    money,
    cost,
    clientTimestamp,
    useDoubleChance,
    useProtect,
    useDiscount
  } = req.body;

  // 1. 치트 방지 검증
  const valid = await validateEnhancement(userId, currentLevel, cost, clientTimestamp);
  if (!valid) {
    return res.status(400).json({ error: 'Cheating detected' });
  }

  // 2. 유저 정보 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (userError || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 3. 검 정보 조회
  const { data: sword, error: swordError } = await supabase
    .from('swords')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (swordError || !sword) {
    return res.status(404).json({ error: 'Sword not found' });
  }

  // 4. 강화 확률 계산 및 결과 결정
  let successRate = calculateEnhanceChance(currentLevel);
  if (useDoubleChance) successRate = Math.min(successRate * 2, 100);
  let enhanceCost = cost;
  if (useDiscount) enhanceCost = Math.floor(cost * 0.5);
  if (user.money < enhanceCost) {
    return res.status(400).json({ error: 'Not enough money' });
  }
  const rand = Math.random() * 100;
  let result;
  if (rand < successRate) {
    // 성공
    result = {
      success: true,
      newLevel: currentLevel + 1,
      moneySpent: enhanceCost
    };
  } else {
    // 실패
    result = {
      success: false,
      newLevel: useProtect ? currentLevel : 0,
      fragmentsGained: useProtect ? 0 : calculateFragmentsGained(currentLevel),
      moneySpent: enhanceCost
    };
  }

  // 5. DB 업데이트
  // 검 레벨 갱신
  await supabase.from('swords').update({
    level: result.newLevel,
    updated_at: new Date().toISOString(),
  }).eq('id', sword.id);
  // 유저 돈/파편 갱신
  await supabase.from('users').update({
    money: user.money - enhanceCost,
    fragments: (user.fragments || 0) + (result.fragmentsGained || 0),
    updated_at: new Date().toISOString(),
  }).eq('id', user.id);

  // 6. 아이템 사용 처리 (inventories에서 차감)
  const usedItems = [];
  if (useDoubleChance) usedItems.push('doubleChance');
  if (useProtect) usedItems.push('protect');
  if (useDiscount) usedItems.push('discount');
  for (const itemType of usedItems) {
    // itemType에 해당하는 item_id 조회
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id')
      .eq('type', itemType)
      .single();
    if (!itemError && item) {
      // 해당 유저의 인벤토리에서 수량 차감
      await supabase.from('inventories').update({
        quantity: supabase.rpc('decrement_quantity', { user_id: userId, item_id: item.id })
      }).match({ user_id: userId, item_id: item.id });
    }
  }
  // 7. 최신 아이템 보유량 조회
  const { data: inventoryRows } = await supabase
    .from('inventories')
    .select('item_id, quantity')
    .eq('user_id', userId);

  // 8. 응답 반환
  return res.status(200).json({ ...result, inventory: inventoryRows });
} 