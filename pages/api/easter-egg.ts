import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // 현재 금액 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('money')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 77777 골드 추가
    const newMoney = user.money + 77777;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        money: newMoney,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Easter egg money update error:', updateError);
      return res.status(500).json({ error: 'Failed to add easter egg money' });
    }

    return res.status(200).json({
      success: true,
      newMoney: newMoney,
      bonusAmount: 77777
    });

  } catch (error) {
    console.error('Easter egg API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}