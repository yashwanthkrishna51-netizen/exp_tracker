export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read session cookie
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/spent_session=([^;]+)/);
  
  if (!sessionMatch) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const username = sessionMatch[1];
  return res.status(200).json({ username });
}
