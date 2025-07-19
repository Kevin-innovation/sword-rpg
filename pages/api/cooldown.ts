import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

// 아이템별 쿨타임 시간 (분)
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // RPC 함수 대신 직접 테이블 조회
    const { data: cooldownData, error } = await supabase
      .from('item_cooldowns')
      .select('item_type, last_used_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Cooldown fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch cooldowns' });
    }

    // 쿨타임 계산
    const cooldowns: {[key: string]: number} = {};
    const now = new Date();
    
    if (cooldownData && Array.isArray(cooldownData)) {
      cooldownData.forEach((item) => {
        const lastUsed = new Date(item.last_used_at);
        const cooldownMinutes = getCooldownMinutes(item.item_type);
        const elapsedMinutes = (now.getTime() - lastUsed.getTime()) / (1000 * 60);
        const remainingMinutes = Math.max(0, Math.ceil(cooldownMinutes - elapsedMinutes));
        
        cooldowns[item.item_type] = remainingMinutes;
      });
    }

    return res.status(200).json({
      success: true,
      cooldowns: cooldowns
    });

  } catch (error) {
    console.error('Cooldown API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}