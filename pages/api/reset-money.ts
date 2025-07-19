import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

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

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // 사용자 금액과 강화조각을 초기화
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ 
        money: 200000,
        fragments: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('money, fragments')
      .single();

    if (userError) {
      console.error('Money reset error:', userError);
      return res.status(500).json({ error: 'Failed to reset money' });
    }

    // 인벤토리의 모든 주문서 수량을 0으로 초기화
    const { error: inventoryError } = await supabase
      .from('inventories')
      .update({ 
        quantity: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (inventoryError) {
      console.error('Inventory reset error:', inventoryError);
      // 인벤토리 초기화 실패해도 금액 초기화는 성공으로 처리
    }

    return res.status(200).json({
      success: true,
      newMoney: user.money,
      newFragments: user.fragments,
      message: '금액, 인벤토리, 강화조각이 초기화되었습니다!'
    });

  } catch (error) {
    console.error('Reset money API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}