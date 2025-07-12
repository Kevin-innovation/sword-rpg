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

  const { userId, itemType, price } = req.body;

  if (!userId || !itemType || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('Shop API called with:', { userId, itemType, price });
    
    // 트랜잭션으로 안전하게 처리
    const { data, error } = await supabase.rpc('handle_item_purchase', {
      p_user_id: userId,
      p_item_type: itemType,
      p_price: price
    });

    if (error) {
      console.error('Purchase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      newMoney: data.new_money,
      newItemCount: data.new_item_count,
      message: '구매 완료!'
    });

  } catch (error) {
    console.error('Shop API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}