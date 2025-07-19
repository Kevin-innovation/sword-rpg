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
    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('money')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // 골드 확인
    if (user.money < 20000) {
      return res.status(400).json({ error: 'Not enough money' });
    }

    // 확률 계산
    const rand = Math.random() * 100;
    let newChance;
    
    if (rand < 80) {
      // 1~30% (80% 확률)
      newChance = Math.floor(Math.random() * 30) + 1;
    } else if (rand < 90) {
      // 40~50% (10% 확률)  
      newChance = Math.floor(Math.random() * 11) + 40;
    } else if (rand < 95) {
      // 60~80% (5% 확률)
      newChance = Math.floor(Math.random() * 21) + 60;
    } else if (rand < 98) {
      // 80~90% (3% 확률)
      newChance = Math.floor(Math.random() * 11) + 80;
    } else {
      // 100% (2% 확률)
      newChance = 100;
    }

    // 골드 차감
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        money: user.money - 20000,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('money')
      .single();

    if (updateError) {
      console.error('Money deduction error:', updateError);
      return res.status(500).json({ error: 'Failed to deduct money' });
    }

    return res.status(200).json({
      success: true,
      newMoney: updatedUser.money,
      customChance: newChance,
      message: `${newChance}% 확률을 획득했습니다!`
    });

  } catch (error) {
    console.error('Chance roll API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}