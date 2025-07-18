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
    // 사용자 금액을 200,000으로 초기화
    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        money: 200000,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('money')
      .single();

    if (error) {
      console.error('Money reset error:', error);
      return res.status(500).json({ error: 'Failed to reset money' });
    }

    return res.status(200).json({
      success: true,
      newMoney: user.money,
      message: '금액이 200,000골드로 초기화되었습니다!'
    });

  } catch (error) {
    console.error('Reset money API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}