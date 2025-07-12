import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { calculateSwordSellPrice } from '@/lib/gameLogic';

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

  const { userId, swordLevel } = req.body;

  if (!userId || swordLevel === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (swordLevel === 0) {
    return res.status(400).json({ error: '판매할 검이 없습니다' });
  }

  try {
    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('money')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 검 정보 조회
    const { data: sword, error: swordError } = await supabase
      .from('swords')
      .select('level')
      .eq('user_id', userId)
      .single();

    if (swordError || !sword) {
      return res.status(404).json({ error: '검 정보를 찾을 수 없습니다' });
    }

    // 서버에서 레벨 검증
    if (sword.level !== swordLevel) {
      return res.status(400).json({ error: '검 레벨이 일치하지 않습니다' });
    }

    if (sword.level === 0) {
      return res.status(400).json({ error: '판매할 검이 없습니다' });
    }

    // 판매 가격 계산
    const sellPrice = calculateSwordSellPrice(sword.level);
    const newMoney = user.money + sellPrice;

    // 트랜잭션으로 안전하게 처리
    const { error: sellError } = await supabase.rpc('handle_sword_sale', {
      p_user_id: userId,
      p_sell_price: sellPrice,
      p_current_level: sword.level
    });

    if (sellError) {
      console.error('Sell error:', sellError);
      return res.status(400).json({ error: sellError.message });
    }

    return res.status(200).json({
      success: true,
      newMoney: newMoney,
      newLevel: 0,
      sellPrice: sellPrice,
      message: `검을 ${sellPrice.toLocaleString()} G에 판매했습니다!`
    });

  } catch (error) {
    console.error('Sell API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}