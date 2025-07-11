import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // TODO: 실제 강화 로직 구현
    res.status(200).json({ success: true, message: '강화 성공 (임시 응답)' });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
} 