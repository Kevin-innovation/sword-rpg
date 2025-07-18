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
    // 사용자의 모든 쿨타임 상태 조회
    const { data: cooldownData, error } = await supabase.rpc('get_user_cooldown_status', {
      p_user_id: userId
    });

    if (error) {
      console.error('Cooldown check error:', error);
      return res.status(500).json({ error: 'Failed to check cooldowns' });
    }

    // 쿨타임 데이터를 객체 형태로 변환
    const cooldowns: {[key: string]: number} = {};
    if (cooldownData) {
      cooldownData.forEach((item: any) => {
        cooldowns[item.item_type] = item.remaining_minutes;
      });
    }

    return res.status(200).json({
      success: true,
      cooldowns
    });

  } catch (error) {
    console.error('Cooldown API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}