import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const adminRunKey = process.env.ADMIN_RUN_KEY || '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return res.status(500).json({
        error: 'Server misconfigured: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY',
      });
    }

    const headerKey = req.headers['x-admin-run-key'];
    const hasAdminKey = adminRunKey && headerKey === adminRunKey;

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

    // Pull a small batch of queued jobs
    const { data: queuedJobs, error: queuedErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, user_id, status, started_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10);

    if (queuedErr) {
      return res.status(500).json({ error: 'Failed to fetch queued jobs', details: queuedErr.message });
    }

    const { data: extractingJobs, error: extractingErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, user_id, status, started_at')
      .eq('status', 'extracting')
      .order('created_at', { ascending: true })
      .limit(10);

    const nowIso = new Date().toISOString();
    const transitions = [];
    const artifacts = [];

    if (extractingErr) {
      return res.status(500).json({ error: 'Failed to fetch extracting jobs', details: extractingErr.message });
    }

    if (queuedJobs && queuedJobs.length > 0) {
      const queuedIds = queuedJobs.map((j) => j.id);
      const { error: queuedUpdErr } = await supabaseAdmin
        .from('analysis_jobs')
        .update({
          status: 'extracting',
          started_at: nowIso,
        })
        .in('id', queuedIds);

      if (queuedUpdErr) {
        return res.status(500).json({ error: 'Failed to advance queued jobs', details: queuedUpdErr.message });
      }

      queuedJobs.forEach((job) => {
        transitions.push({
          job_id: job.id,
          from_status: 'queued',
          to_status: 'extracting',
        });
        artifacts.push({
          job_id: job.id,
          user_id: job.user_id,
          artifact_type: 'status_transition',
          payload: {
            from_status: 'queued',
            to_status: 'extracting',
            timestamp: nowIso,
          },
        });
      });
    }

    if (extractingJobs && extractingJobs.length > 0) {
      const extractingIds = extractingJobs.map((j) => j.id);
      const { error: extractingUpdErr } = await supabaseAdmin
        .from('analysis_jobs')
        .update({
          status: 'underwriting',
        })
        .in('id', extractingIds);

      if (extractingUpdErr) {
        return res.status(500).json({ error: 'Failed to advance extracting jobs', details: extractingUpdErr.message });
      }

      extractingJobs.forEach((job) => {
        transitions.push({
          job_id: job.id,
          from_status: 'extracting',
          to_status: 'underwriting',
        });
        artifacts.push({
          job_id: job.id,
          user_id: job.user_id,
          artifact_type: 'status_transition',
          payload: {
            from_status: 'extracting',
            to_status: 'underwriting',
            timestamp: nowIso,
          },
        });
      });
    }

    if (artifacts.length > 0) {
      const { error: artifactErr } = await supabaseAdmin
        .from('analysis_artifacts')
        .insert(artifacts);

      if (artifactErr) {
        return res.status(500).json({ error: 'Failed to write analysis artifacts', details: artifactErr.message });
      }
    }

    return res.status(200).json({
      ok: true,
      processed: transitions.length,
      transitions,
      message: transitions.length === 0 ? 'No queued or extracting jobs found' : undefined,
    });
  } catch (err) {
    console.error('admin-run-worker error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
