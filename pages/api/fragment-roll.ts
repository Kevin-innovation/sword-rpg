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
      .select('money, fragments')
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

    // 강화조각 10개 지급 (고정)
    const fragmentsGained = 10;

    // 골드 차감 및 조각 추가
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        money: user.money - 20000,
        fragments: user.fragments + fragmentsGained,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('money, fragments')
      .single();

    if (updateError) {
      console.error('Fragment roll update error:', updateError);
      return res.status(500).json({ error: 'Failed to update user data' });
    }

    return res.status(200).json({
      success: true,
      newMoney: updatedUser.money,
      newFragments: updatedUser.fragments,
      fragmentsGained: fragmentsGained,
      message: `${fragmentsGained}개의 강화조각을 획득했습니다!`
    });

  } catch (error) {
    console.error('Fragment roll API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}