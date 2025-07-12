import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEnhancement } from '../../lib/antiCheat';
import { calculateEnhanceChance, calculateEnhanceCost, calculateFragmentsGained } from '../../lib/gameLogic';
import { supabase } from '../../lib/supabase';
import type { User, Sword } from '../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId,
    currentLevel,
    useDoubleChance = false,
    useProtect = false,
    useDiscount = false
  } = req.body;

  // 1. 기본 유효성 검증
  if (!userId || currentLevel === undefined) {
    return res.status(400).json({ error: 'Invalid parameters' });
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
  let enhanceCost = calculateEnhanceCost(currentLevel);
  if (useDiscount) enhanceCost = Math.floor(enhanceCost * 0.5);
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

  // 6. rankings 테이블 업데이트 (최고 레벨, 총 골드)
  const { data: ranking, error: rankingError } = await supabase
    .from('rankings')
    .select('*')
    .eq('user_id', userId)
    .single();
  // 강화 시도 전 레벨과 비교하여 최고 기록 갱신
  const levelToCompare = result.success ? result.newLevel : currentLevel;
  const newMaxLevel = Math.max(levelToCompare, ranking?.max_sword_level || 0);
  const newTotalGold = user.money - enhanceCost;
  if (ranking) {
    await supabase.from('rankings').update({
      max_sword_level: newMaxLevel,
      total_gold: newTotalGold,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  } else {
    await supabase.from('rankings').insert({
      user_id: userId,
      max_sword_level: result.newLevel,
      total_gold: newTotalGold,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 7. 아이템 사용 처리 (inventories에서 차감)
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
  // 8. 최신 아이템 보유량 조회
  const { data: inventoryRows } = await supabase
    .from('inventories')
    .select('item_id, quantity')
    .eq('user_id', userId);

  // 9. 응답 반환
  return res.status(200).json({ 
    ...result, 
    newMoney: user.money - enhanceCost,
    newFragments: (user.fragments || 0) + (result.fragmentsGained || 0),
    inventory: inventoryRows 
  });
}