export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, username, password } = req.body;

  // Parse AUTH_USERS from environment
  const authUsers = process.env.AUTH_USERS;
  if (!authUsers) {
    return res.status(500).json({ error: 'AUTH_USERS not configured' });
  }

  let users;
  try {
    users = JSON.parse(authUsers);
  } catch (err) {
    return res.status(500).json({ error: 'Invalid AUTH_USERS format' });
  }

  if (action === 'login') {
    // Validate credentials
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    if (users[username] && users[username] === password) {
      // Successful login - set session cookie
      res.setHeader('Set-Cookie', `spent_session=${username}; Path=/; HttpOnly; Secure; SameSite=Strict`);
      return res.status(200).json({ success: true, username });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } else if (action === 'logout') {
    // Logout - clear cookie
    res.setHeader('Set-Cookie', `spent_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }
}
