import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { calculateEnhanceChance } from '../../src/lib/gameLogic';

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

  const { userId, currentLevel } = req.body;

  if (!userId || currentLevel === undefined) {
    return res.status(400).json({ error: 'User ID and current level are required' });
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

    // 단계별 뽑기 비용 계산 (단계 * 2만원)
    const rollCost = Math.max(20000, currentLevel * 20000);
    
    // 골드 확인
    if (user.money < rollCost) {
      return res.status(400).json({ 
        error: 'Not enough money',
        required: rollCost,
        current: user.money
      });
    }

    // 현재 단계의 기본 성공 확률 가져오기
    const baseChance = calculateEnhanceChance(currentLevel);
    
    // ±10% 범위 내에서 확률 결정
    const minChance = Math.max(1, baseChance - 10);
    const maxChance = Math.min(100, baseChance + 10);
    
    // 균등 분포로 확률 결정
    const newChance = Math.floor(Math.random() * (maxChance - minChance + 1)) + minChance;

    // 골드 차감 (단계별 비용)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        money: user.money - rollCost,
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
      baseChance: baseChance,
      rollCost: rollCost,
      message: `${newChance}% 확률을 획득했습니다! (기본 ${baseChance}% 대비 ${newChance >= baseChance ? '+' : ''}${newChance - baseChance}%)`
    });

  } catch (error) {
    console.error('Chance roll API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}