import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const adminRunKey = (process.env.ADMIN_RUN_KEY || '').trim();

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return res.status(500).json({
        error: 'Server misconfigured: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY',
      });
    }

    const headerKeyRaw = req.headers['x-admin-run-key'];
    const headerKey = Array.isArray(headerKeyRaw) ? headerKeyRaw[0] : headerKeyRaw || '';
    const hasAdminKey = adminRunKey && String(headerKey).trim() === adminRunKey;

    if (!hasAdminKey) {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      });

      const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);

      if (userErr || !userRes?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const adminEmail = 'hello@investoriq.tech';
      if ((userRes.user.email || '').toLowerCase() !== adminEmail) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const statuses = [
      'queued',
      'extracting',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
      'published',
      'failed',
    ];

    const countResults = await Promise.all(
      statuses.map(async (status) => {
        const { count, error } = await supabaseAdmin
          .from('analysis_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);

        if (error) {
          return [status, 0];
        }

        return [status, count || 0];
      })
    );

    const countsByStatus = Object.fromEntries(countResults);

    const { data: oldestQueued, error: oldestQueuedErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: latestFailed, error: latestFailedErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('updated_at')
      .eq('status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: recentJobs, error: recentJobsErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, property_name, status, created_at, updated_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({
      counts_by_status: countsByStatus,
      oldest_queued_at: oldestQueuedErr ? null : oldestQueued?.created_at || null,
      latest_failed_at: latestFailedErr ? null : latestFailed?.updated_at || null,
      recent_jobs: recentJobsErr ? [] : recentJobs || [],
    });
  } catch (err) {
    console.error('queue-metrics error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
