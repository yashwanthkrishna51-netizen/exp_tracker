export default function handler(req, res) {
  // Only expose to authenticated sessions
  res.setHeader('Cache-Control', 'no-store');
  res.json({ encryptionKey: process.env.ENC_KEY || null });
}
