import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, currentLevel } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // 간단한 강화 로직 - 50% 확률로 성공
    const success = Math.random() < 0.5;
    
    if (success) {
      // 성공 시 레벨 업
      const newLevel = currentLevel + 1;
      
      // 검 레벨 업데이트
      await supabase
        .from('swords')
        .update({ level: newLevel })
        .eq('user_id', userId);
      
      return res.status(200).json({
        success: true,
        newLevel: newLevel,
        message: '강화 성공!'
      });
    } else {
      // 실패 시 레벨 0으로 초기화
      await supabase
        .from('swords')
        .update({ level: 0 })
        .eq('user_id', userId);
      
      return res.status(200).json({
        success: false,
        newLevel: 0,
        message: '강화 실패!'
      });
    }
  } catch (error) {
    console.error('Enhance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}