import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminRunKey = (process.env.ADMIN_RUN_KEY || '').trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    if (!adminRunKey) {
      return res.status(500).json({ error: 'Unauthorized' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';

    if (!token || token !== adminRunKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const search = String(req.query?.search || '').trim().toLowerCase();

    const [profilesResult, purchasesResult] = await Promise.all([
      supabaseAdmin.rpc('get_all_profiles_for_admin'),
      supabaseAdmin.rpc('get_all_purchases_for_admin'),
    ]);

    const usersError = profilesResult.error ? 'profiles_rpc_failed' : '';
    const purchasesError = purchasesResult.error ? 'purchases_rpc_failed' : '';

    const creditMap = {};
    if (!purchasesResult.error) {
      for (const row of purchasesResult.data || []) {
        if (!row || row.consumed_at) continue;
        const userId = row.user_id;
        if (!userId) continue;
        if (!creditMap[userId]) creditMap[userId] = { screening: 0, underwriting: 0 };
        if (row.product_type === 'screening') creditMap[userId].screening += 1;
        else if (row.product_type === 'underwriting') creditMap[userId].underwriting += 1;
      }
    }

    const users = profilesResult.error
      ? []
      : (profilesResult.data || [])
          .filter((u) => !search || String(u.full_name || '').toLowerCase().includes(search))
          .map((u) => ({
            id: u.id || null,
            full_name: u.full_name || null,
            role: u.role || null,
            screening_credits: creditMap[u.id]?.screening ?? 0,
            underwriting_credits: creditMap[u.id]?.underwriting ?? 0,
          }));

    return res.status(200).json({
      users,
      users_error: usersError,
      purchases_error: purchasesError,
    });
  } catch (err) {
    console.error('users-credits error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
