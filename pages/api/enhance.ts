import type { NextApiRequest, NextApiResponse } from "next";
import { validateEnhancement } from "../../lib/antiCheat";
import { calculateEnhanceChance, calculateEnhanceCost, calculateFragmentsGained } from "../../lib/gameLogic";
import { supabase } from "../../lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, currentLevel, money, cost, clientTimestamp, useDoubleChance, useProtect, useDiscount } = req.body;
  // 치팅 방지 검증
  const valid = await validateEnhancement(userId, currentLevel, cost, clientTimestamp);
  if (!valid) {
    return res.status(400).json({ error: "Cheating detected" });
  }

  // 강화 확률 계산
  const successRate = calculateEnhanceChance(currentLevel);
  const rand = Math.random() * 100;
  let result;
  if (rand < successRate) {
    // 성공
    result = {
      success: true,
      newLevel: currentLevel + 1,
      moneySpent: cost
    };
  } else {
    // 실패
    result = {
      success: false,
      newLevel: 0,
      fragmentsGained: calculateFragmentsGained(currentLevel),
      moneySpent: cost
    };
  }

  // TODO: DB에 로그 기록, 유저/검 정보 갱신

  // --- Supabase 연동 시작 ---
  // 1. 유저 정보 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (userError || !user) {
    return res.status(404).json({ error: "User not found" });
  }

  // 2. 검 정보 조회
  const { data: sword, error: swordError } = await supabase
    .from('swords')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (swordError || !sword) {
    return res.status(404).json({ error: "Sword not found" });
  }

  // 3. 강화 결과에 따라 DB 업데이트
  if (result.success) {
    // 성공: 검 레벨 +1, 돈 차감
    await supabase.from('swords').update({
      level: sword.level + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', sword.id);
    await supabase.from('users').update({
      money: user.money - cost,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
  } else {
    // 실패: 검 레벨 0, 파편 증가, 돈 차감
    await supabase.from('swords').update({
      level: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', sword.id);
    await supabase.from('users').update({
      money: user.money - cost,
      fragments: (user.fragments || 0) + (result.fragmentsGained || 0),
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
  }

  // 4. 아이템 사용 처리 (inventories에서 차감)
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
  // 5. 최신 아이템 보유량 조회
  const { data: inventoryRows } = await supabase
    .from('inventories')
    .select('item_id, quantity');
  // --- Supabase 연동 끝 ---

  return res.status(200).json({ ...result, inventory: inventoryRows });
} 