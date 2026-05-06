import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Re-use your existing auth — replace with however you get currentUser
  const user = req.cookies?.session_user || 'default';

  if (req.method === 'GET') {
    const monthly = await kv.get(`budget:${user}`);
    return res.json({ monthly: monthly || 50000 });
  }

  if (req.method === 'POST') {
    const { monthly } = req.body;
    if (!monthly || isNaN(monthly)) return res.status(400).json({ error: 'invalid' });
    await kv.set(`budget:${user}`, parseInt(monthly));
    return res.json({ ok: true });
  }

  res.status(405).end();
}
