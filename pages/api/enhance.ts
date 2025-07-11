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

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('money, fragments')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 검 정보 조회
    const { data: swordData, error: swordError } = await supabase
      .from('swords')
      .select('level')
      .eq('user_id', userId)
      .single();

    if (swordError || !swordData) {
      return res.status(404).json({ error: 'Sword not found' });
    }

    // 강화 확률 계산 (레벨이 높을수록 확률 감소)
    const baseChance = Math.max(0.7 - (currentLevel * 0.05), 0.1);
    const success = Math.random() < baseChance;
    
    if (success) {
      // 성공 시 레벨 업
      const newLevel = currentLevel + 1;
      
      // 검 레벨 업데이트
      await supabase
        .from('swords')
        .update({ 
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      return res.status(200).json({
        success: true,
        newLevel: newLevel,
        userData: userData,
        message: '강화 성공!'
      });
    } else {
      // 실패 시 레벨 0으로 초기화 + 조각 보상
      const fragmentsGained = Math.floor(currentLevel * 10);
      const newFragments = userData.fragments + fragmentsGained;
      
      // 검 레벨 초기화
      await supabase
        .from('swords')
        .update({ 
          level: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      // 조각 추가
      await supabase
        .from('users')
        .update({ 
          fragments: newFragments,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      return res.status(200).json({
        success: false,
        newLevel: 0,
        fragmentsGained: fragmentsGained,
        newFragments: newFragments,
        userData: { ...userData, fragments: newFragments },
        message: '강화 실패!'
      });
    }
  } catch (error) {
    console.error('Enhance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}