import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const adminKey = req.headers['x-admin-key'] || '';
    const expectedKey = process.env.ADMIN_RUN_KEY || '';

    if (!expectedKey) {
      return res.status(500).json({ error: 'Server misconfigured: ADMIN_RUN_KEY missing' });
    }

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server misconfigured: Supabase service role missing' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Pull a small batch of queued jobs
    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, user_id, status, started_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(25);

    if (jobsErr) {
      return res.status(500).json({ error: 'Failed to fetch queued jobs', details: jobsErr.message });
    }

    if (!jobs || jobs.length === 0) {
      return res.status(200).json({ ok: true, processed: 0, message: 'No queued jobs found' });
    }

    const nowIso = new Date().toISOString();
    const jobIds = jobs.map((j) => j.id);

    // V1 behavior: just advance status so you can see movement and confirm wiring.
    // Real parsing/rendering comes next.
    const { error: updErr } = await supabaseAdmin
      .from('analysis_jobs')
      .update({
        status: 'extracting',
        started_at: nowIso,
      })
      .in('id', jobIds);

    if (updErr) {
      return res.status(500).json({ error: 'Failed to advance job statuses', details: updErr.message });
    }

    return res.status(200).json({ ok: true, processed: jobIds.length, jobIds });
  } catch (err) {
    console.error('admin-run-worker error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
