import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEnhancement } from '../../lib/antiCheat';
import { calculateEnhanceChance, calculateEnhanceCost, calculateFragmentsGained, FRAGMENT_BOOST_OPTIONS, calculateBoostedChance } from '../../src/lib/gameLogic';
import { supabase } from '../../lib/supabase';
import type { User, Sword } from '../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 처리
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId,
    currentLevel,
    useDoubleChance = false,
    useProtect = false,
    useDiscount = false,
    useFragmentBoost = null
  } = req.body;

  // 1. 기본 유효성 검증
  if (!userId || currentLevel === undefined) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  // 2. 유저 및 검 정보 병렬 조회 (성능 개선)
  const [userResult, swordResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('swords').select('*').eq('user_id', userId).single()
  ]);

  const { data: user, error: userError } = userResult;
  const { data: sword, error: swordError } = swordResult;

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (swordError || !sword) {
    return res.status(404).json({ error: 'Sword not found' });
  }

  // 4. 아이템 보유 확인 및 강화 확률 계산
  const usedItems = [];
  if (useDoubleChance) usedItems.push('doubleChance');
  if (useProtect) usedItems.push('protect');
  if (useDiscount) usedItems.push('discount');
  
  // 아이템 보유 수량 확인 (병렬 처리로 성능 개선)
  if (usedItems.length > 0) {
    // 모든 아이템 정보를 한 번에 조회
    const { data: items } = await supabase
      .from('items')
      .select('id, type')
      .in('type', usedItems);
    
    if (!items || items.length !== usedItems.length) {
      return res.status(400).json({ error: '일부 아이템을 찾을 수 없습니다' });
    }
    
    // 인벤토리 정보를 병렬로 조회
    const itemIds = items.map(item => item.id);
    const { data: inventories } = await supabase
      .from('inventories')
      .select('item_id, quantity')
      .eq('user_id', userId)
      .in('item_id', itemIds);
    
    // 아이템 보유 확인
    for (const item of items) {
      const inventory = inventories?.find(inv => inv.item_id === item.id);
      if (!inventory || inventory.quantity <= 0) {
        return res.status(400).json({ 
          error: `부족한 아이템: ${item.type}`, 
          details: `현재 보유량: ${inventory?.quantity || 0}개`
        });
      }
    }
  }
  
  // 조각 사용 검증 및 처리
  let fragmentsToUse = 0;
  let fragmentBoost = 0;
  if (useFragmentBoost !== null && typeof useFragmentBoost === 'number') {
    const boostOption = FRAGMENT_BOOST_OPTIONS[useFragmentBoost];
    if (boostOption) {
      if (user.fragments < boostOption.fragments) {
        return res.status(400).json({ 
          error: '조각이 부족합니다',
          details: `필요: ${boostOption.fragments}개, 보유: ${user.fragments}개`
        });
      }
      fragmentsToUse = boostOption.fragments;
      fragmentBoost = boostOption.boost;
    }
  }

  let successRate = calculateEnhanceChance(currentLevel);
  if (useDoubleChance) successRate = Math.min(successRate * 2, 100);
  if (fragmentBoost > 0) successRate = calculateBoostedChance(successRate, fragmentBoost);
  
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

  // 5. 아이템 소비 처리 (응답 전에 처리하여 확실히 반영)
  const updatedItems = { doubleChance: 0, protect: 0, discount: 0 };
  try {
    await Promise.all(usedItems.map(async (itemType) => {
      const { data: item } = await supabase
        .from('items')
        .select('id')
        .eq('type', itemType)
        .single();
      
      if (item) {
        // 현재 수량을 조회한 후 1 감소
        const { data: inventory } = await supabase
          .from('inventories')
          .select('quantity')
          .eq('user_id', userId)
          .eq('item_id', item.id)
          .single();
        
        if (inventory && inventory.quantity > 0) {
          const newQuantity = inventory.quantity - 1;
          await supabase
            .from('inventories')
            .update({ 
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('item_id', item.id);
          
          // 업데이트된 수량 저장
          updatedItems[itemType as keyof typeof updatedItems] = newQuantity;
        }
      }
    }));
  } catch (err) {
    console.error('Item consumption error:', err);
    return res.status(500).json({ error: '아이템 소비 중 오류가 발생했습니다' });
  }

  // 6. DB 업데이트
  // 검 레벨 갱신
  await supabase.from('swords').update({
    level: result.newLevel,
    updated_at: new Date().toISOString(),
  }).eq('id', sword.id);
  // 유저 돈/파편 갱신 (조각 사용 포함)
  const newFragments = Math.max(0, (user.fragments || 0) + (result.fragmentsGained || 0) - fragmentsToUse);
  await supabase.from('users').update({
    money: user.money - enhanceCost,
    fragments: newFragments,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id);

  // 7. rankings 테이블 업데이트 (최고 레벨, 총 골드)
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

  // 8. 클라이언트에 응답 (아이템 소비 후 업데이트된 정보 포함)
  res.status(200).json({
    success: result.success,
    newLevel: result.newLevel,
    fragmentsGained: result.fragmentsGained || 0,
    fragmentsUsed: fragmentsToUse,
    newMoney: user.money - enhanceCost,
    newFragments: newFragments,
    moneySpent: result.moneySpent,
    updatedItems: updatedItems // 업데이트된 아이템 수량 포함
  });

  // 9. 업적 업데이트 (백그라운드에서 비동기 처리)
  if (result.success) {
    (async () => {
      try {
        const { data: achievements, error: achievementError } = await supabase
          .from('user_achievements')
          .select('unlocked_swords')
          .eq('user_id', userId)
          .single();
        
        if (!achievementError && achievements) {
          const currentUnlocked = achievements.unlocked_swords || ['0'];
          const newLevelString = result.newLevel.toString();
          
          if (!currentUnlocked.includes(newLevelString)) {
            const updatedUnlocked = [...currentUnlocked, newLevelString];
            await supabase
              .from('user_achievements')
              .update({ 
                unlocked_swords: updatedUnlocked,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);
          }
        } else {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              unlocked_swords: ['0', result.newLevel.toString()],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
      } catch (err) {
        console.error('Achievement update error:', err);
      }
    })();
  }

  // 아이템 소비는 이미 위에서 처리됨
}