import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    // TODO: Replace with existing admin check pattern if present in this repo.
    // For now, fail closed if we cannot verify admin status.
    const isAdmin = false;
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    return res.json({ ok: true, message: 'Admin run endpoint ready' });
  } catch (err) {
    console.error('Admin run endpoint error:', err);
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
}
