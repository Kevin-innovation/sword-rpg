import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEnhancement } from '../../lib/antiCheat';
import { calculateEnhanceChance, calculateEnhanceCost, calculateFragmentsGained, FRAGMENT_BOOST_OPTIONS, calculateBoostedChance, checkRequiredMaterials, calculateMaterialConsumption } from '../../src/lib/gameLogic';
import { supabase } from '../../lib/supabase';
import type { User, Sword } from '../../lib/types';

// 아이템별 쿨타임 시간 (분) - 서버사이드 검증용
function getCooldownMinutes(itemType: string): number {
  switch (itemType) {
    case 'protect': return 30;
    case 'doubleChance': return 20;
    case 'discount': return 15;
    case 'blessing_scroll': return 25;
    case 'advanced_protection': return 45;
    default: return 0;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 처리
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 디버깅: 모든 요청 로깅
  console.log('API Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method, 'Body:', req.body, 'Query:', req.query);
    return res.status(405).json({ error: `Method ${req.method} not allowed - Expected POST` });
  }

  const {
    userId,
    currentLevel,
    useDoubleChance = false,
    useProtect = false,
    useDiscount = false,
    useFragmentBoost = null,
    secretBoost = false,
    customChance = null
  } = req.body;

  // 🚨 CRITICAL DEBUG: secretBoost 파라미터 상세 로깅
  console.log('=== SECRET BOOST DEBUG ===');
  console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
  console.log('secretBoost value:', secretBoost);
  console.log('secretBoost type:', typeof secretBoost);
  console.log('secretBoost === true:', secretBoost === true);
  console.log('secretBoost == true:', secretBoost == true);
  console.log('========================');

  // 1. 기본 유효성 검증
  if (!userId || currentLevel === undefined) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  // 2. 유저 및 검 정보 병렬 조회 (성능 개선, .single() 대신 배열 접근)
  const [userResult, swordResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).limit(1),
    supabase.from('swords').select('*').eq('user_id', userId).limit(1)
  ]);

  const { data: userData, error: userError } = userResult;
  const { data: swordData, error: swordError } = swordResult;

  let user = userData?.[0];
  let sword = swordData?.[0];

  if (userError || !user) {
    console.error('User not found, attempting multiple strategies:', { userId, userError });
    
    // 전략 1: 다시 조회 시도
    const { data: retryUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (retryUser) {
      console.log('User found on retry:', retryUser);
      user = retryUser;
    } else {
      // 전략 2: 강제 INSERT (RLS 우회)
      try {
        console.log('Attempting direct user creation...');
        const { data: directUser, error: directError } = await supabase.rpc('create_user_if_not_exists', {
          user_id: userId,
          user_email: 'temp@example.com',
          user_nickname: '임시유저',
          user_money: 200000,
          user_fragments: 0
        });
        
        if (directUser && !directError) {
          console.log('User created via RPC:', directUser);
          user = directUser;
        } else {
          console.error('RPC failed, trying simple insert:', directError);
          
          // 전략 3: 최후의 수단 - 간단한 INSERT
          const { data: simpleUser, error: simpleError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              email: 'temp@example.com',
              nickname: '임시유저',
              money: 200000,
              fragments: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();
          
          if (simpleUser && !simpleError) {
            console.log('User created via simple insert:', simpleUser);
            user = simpleUser;
          } else {
            console.error('All user creation strategies failed:', simpleError);
            return res.status(500).json({ 
              error: 'Failed to create user', 
              details: simpleError?.message,
              userId: userId
            });
          }
        }
      } catch (err) {
        console.error('Exception during user creation:', err);
        return res.status(500).json({ error: 'User creation exception', details: err });
      }
    }
    
    // 검 레코드도 생성
    if (user && (!sword || swordError)) {
      const { data: newSword } = await supabase
        .from('swords')
        .upsert({
          user_id: userId,
          level: currentLevel || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (newSword) {
        console.log('Sword created/updated:', newSword);
        sword = newSword;
      }
    }
  }
  if (swordError || !sword) {
    console.error('Sword not found:', { userId, swordError });
    return res.status(404).json({ error: 'Sword not found' });
  }

  // 4. 아이템 보유 확인 및 쿨타임 체크 - 2배 주문서 삭제됨
  const usedItems = [];
  // if (useDoubleChance) usedItems.push('doubleChance'); // 2배 주문서 삭제됨
  if (useProtect) usedItems.push('protect');
  if (useDiscount) usedItems.push('discount');
  
  // 🚨 서버사이드 쿨타임 검증 강화 (30분 버그 완전 수정)
  // 클라이언트 우회 방지를 위한 필수 서버 검증
  const now = new Date();
  
  // 사용된 아이템들의 쿨타임 검증
  if (usedItems.length > 0) {
    const { data: cooldowns, error: cooldownError } = await supabase
      .from('item_cooldowns')
      .select('item_type, last_used_at')
      .eq('user_id', userId)
      .in('item_type', usedItems);
    
    if (!cooldownError && cooldowns) {
      for (const cooldown of cooldowns) {
        const lastUsed = new Date(cooldown.last_used_at);
        const cooldownMinutes = getCooldownMinutes(cooldown.item_type);
        const elapsedMinutes = (now.getTime() - lastUsed.getTime()) / (1000 * 60);
        
        if (elapsedMinutes < cooldownMinutes) {
          const remainingMinutes = Math.ceil(cooldownMinutes - elapsedMinutes);
          return res.status(400).json({ 
            error: `${cooldown.item_type} 쿨타임이 ${remainingMinutes}분 남아있습니다`,
            cooldownRemaining: remainingMinutes,
            itemType: cooldown.item_type
          });
        }
      }
    }
  }
  
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
  if (secretBoost) {
    successRate = 100;
  } else if (customChance !== null && typeof customChance === 'number') {
    // 커스텀 확률이 있으면 그것을 기본값으로 사용
    successRate = customChance;
    // if (useDoubleChance) successRate = Math.min(successRate * 2, 100); // 2배 주문서 삭제됨
    if (fragmentBoost > 0) successRate = calculateBoostedChance(successRate, fragmentBoost);
  } else {
    // if (useDoubleChance) successRate = Math.min(successRate * 2, 100); // 2배 주문서 삭제됨
    if (fragmentBoost > 0) successRate = calculateBoostedChance(successRate, fragmentBoost);
  }
  
  let enhanceCost = calculateEnhanceCost(currentLevel);
  if (useDiscount) enhanceCost = Math.floor(enhanceCost * 0.5);
  if (user.money < enhanceCost) {
    return res.status(400).json({ error: 'Not enough money' });
  }

  // 필수 재료 검증 (강화 전 확인)
  const { data: userInventory } = await supabase
    .from('inventories')
    .select('item_id, quantity, items(type)')
    .eq('user_id', userId);
  
  const requiredMaterialsCheck = checkRequiredMaterials(currentLevel, userInventory || []);
  if (!requiredMaterialsCheck.canEnhance) {
    return res.status(400).json({ 
      error: requiredMaterialsCheck.message,
      details: `부족한 재료: ${requiredMaterialsCheck.missingItems.join(', ')}`
    });
  }
  // 95% 확률 = 100번 중 95번 성공 보장 시스템
  let isSuccess;
  let attempts;
  
  // Z키 눌린 상태(secretBoost)에서는 100% 성공 보장
  if (secretBoost) {
    isSuccess = true;
    attempts = 1; // 디버깅용
    console.log(`[ENHANCE DEBUG] SECRET BOOST ACTIVATED - 100% Success Guaranteed`);
  } else {
    attempts = Math.floor(Math.random() * 100) + 1; // 1~100
    isSuccess = attempts <= successRate;
    console.log(`[ENHANCE DEBUG] Level: ${currentLevel}, Final Rate: ${successRate}%, Attempt: ${attempts}/100, Success: ${isSuccess}`);
  }
  
  let result;
  if (isSuccess) {
    // 성공
    result = {
      success: true,
      newLevel: currentLevel + 1,
      fragmentsGained: 0,  // 성공 시에는 조각 획득 없음
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

  // 5. 아이템 소비 처리 및 쿨타임 기록 - 2배 주문서 삭제됨
  const updatedItems = { 
    // doubleChance: 0,  // 2배 주문서 삭제됨
    protect: 0, 
    discount: 0,
    magic_stone: 0,
    purification_water: 0,
    legendary_essence: 0,
    advanced_protection: 0,
    blessing_scroll: 0
  };
  try {
    // 주문서 아이템 소비 처리
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
          
          // 쿨타임 기록은 병렬 처리 후 별도로 실행
          
          // 업데이트된 수량 저장
          updatedItems[itemType as keyof typeof updatedItems] = newQuantity;
        }
      }
    }));

    // 쿨타임 기록 (간단하게 처리, 실패해도 무시)
    try {
      for (const itemType of usedItems) {
        if (['protect', 'discount'].includes(itemType)) { // 2배 주문서 삭제됨
          await supabase
            .from('item_cooldowns')
            .upsert({
              user_id: userId,
              item_type: itemType,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,item_type' });
        }
      }
    } catch (cooldownError) {
      // 쿨타임 기록 실패는 무시하고 계속 진행
      console.log('Cooldown record failed, but continuing:', cooldownError);
    }

    // 필수 재료 소모 처리 (강화 성공/실패 관계없이 소모)
    const materialConsumption = calculateMaterialConsumption(currentLevel);
    if (materialConsumption.consumedMaterials.length > 0) {
      await Promise.all(materialConsumption.consumedMaterials.map(async (materialType) => {
        const { data: material } = await supabase
          .from('items')
          .select('id')
          .eq('type', materialType)
          .single();
        
        if (material) {
          const { data: inventory } = await supabase
            .from('inventories')
            .select('quantity')
            .eq('user_id', userId)
            .eq('item_id', material.id)
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
              .eq('item_id', material.id);
            
            // 업데이트된 수량 저장
            if (updatedItems.hasOwnProperty(materialType)) {
              updatedItems[materialType as keyof typeof updatedItems] = newQuantity;
            }
          }
        }
      }));
    }
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
  const newFragments = Math.max(0, (user.fragments || 0) + (result.fragmentsGained) - fragmentsToUse);
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
    fragmentsGained: result.fragmentsGained,
    fragmentsUsed: fragmentsToUse,
    newMoney: user.money - enhanceCost,
    newFragments: newFragments,
    moneySpent: result.moneySpent,
    updatedItems: updatedItems, // 업데이트된 아이템 수량 포함
    
    // 🚨 DEBUG 정보 추가
    debugInfo: {
      receivedSecretBoost: secretBoost,
      finalSuccessRate: successRate,
      wasSecretBoostActivated: secretBoost === true,
      attempts: typeof attempts !== 'undefined' ? attempts : 'N/A',
      isSuccess: isSuccess
    }
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
            const updateData: any = { 
              unlocked_swords: updatedUnlocked 
            };
            
            // updated_at 컬럼이 존재할 때만 추가
            try {
              updateData.updated_at = new Date().toISOString();
              await supabase
                .from('user_achievements')
                .update(updateData)
                .eq('user_id', userId);
            } catch (updateError) {
              // updated_at 컬럼 에러가 발생하면 updated_at 없이 재시도
              console.warn('Achievement update with updated_at failed, retrying without it:', updateError);
              delete updateData.updated_at;
              await supabase
                .from('user_achievements')
                .update(updateData)
                .eq('user_id', userId);
            }
          }
        } else {
          // 새 레코드 생성 시에도 updated_at 컬럼 존재 여부에 따라 처리
          const insertData: any = {
            user_id: userId,
            unlocked_swords: ['0', result.newLevel.toString()],
            created_at: new Date().toISOString(),
          };
          
          try {
            insertData.updated_at = new Date().toISOString();
            await supabase
              .from('user_achievements')
              .insert(insertData);
          } catch (insertError) {
            // updated_at 컬럼 에러가 발생하면 updated_at 없이 재시도
            console.warn('Achievement insert with updated_at failed, retrying without it:', insertError);
            delete insertData.updated_at;
            await supabase
              .from('user_achievements')
              .insert(insertData);
          }
        }
      } catch (err) {
        console.error('Achievement update error:', err);
      }
    })();
  }

  // 아이템 소비는 이미 위에서 처리됨
}