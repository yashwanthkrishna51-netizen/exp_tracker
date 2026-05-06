// /api/budget.js
// GET  → returns current BUDGET_MONTHLY env var value
// POST → updates BUDGET_MONTHLY via Vercel REST API
//
// Required Vercel env vars:
//   BUDGET_MONTHLY    — the budget value (e.g. "50000")
//   VERCEL_TOKEN      — Vercel API token (account settings → tokens)
//   VERCEL_PROJECT_ID — found in Project Settings → General

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const monthly = parseInt(process.env.BUDGET_MONTHLY) || 50000;
    return res.status(200).json({ monthly });
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { monthly } = req.body;
    if (!monthly || isNaN(monthly) || monthly <= 0) {
      return res.status(400).json({ error: 'Invalid budget value' });
    }

    const token     = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!token || !projectId) {
      // Env vars not configured — silently succeed (localStorage is fallback)
      return res.status(200).json({ ok: true, persisted: false });
    }

    try {
      // Step 1: find the env var record ID for BUDGET_MONTHLY
      const listRes = await fetch(
        `https://api.vercel.com/v9/projects/${projectId}/env`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!listRes.ok) throw new Error(`Vercel list env failed: ${listRes.status}`);
      const { envs } = await listRes.json();

      const existing = envs.find(e => e.key === 'BUDGET_MONTHLY');

      if (existing) {
        // Step 2a: PATCH existing env var
        const patchRes = await fetch(
          `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: String(monthly) }),
          }
        );
        if (!patchRes.ok) {
          const err = await patchRes.json();
          throw new Error(err.error?.message || `PATCH failed: ${patchRes.status}`);
        }
      } else {
        // Step 2b: POST new env var (first time)
        const createRes = await fetch(
          `https://api.vercel.com/v9/projects/${projectId}/env`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key:    'BUDGET_MONTHLY',
              value:  String(monthly),
              type:   'plain',
              target: ['production', 'preview', 'development'],
            }),
          }
        );
        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.error?.message || `CREATE failed: ${createRes.status}`);
        }
      }

      return res.status(200).json({ ok: true, persisted: true });

    } catch (err) {
      console.error('Budget persist error:', err.message);
      // Don't fail the request — localStorage already saved it on client
      return res.status(200).json({ ok: true, persisted: false, warning: err.message });
    }
  }

  res.status(405).end();
}
