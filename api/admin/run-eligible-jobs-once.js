import crypto from 'crypto';

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '';
    const expectedKey = process.env.ADMIN_RUN_KEY || '';
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!expectedKey) missing.push('ADMIN_RUN_KEY');
    if (missing.length) {
      return res.status(500).json({ ok: false, error: 'SERVER_MISCONFIGURED', missing });
    }

    const authorization = String(req.headers.authorization || '');
    const bearer = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';
    const adminHeader = String(req.headers['x-admin-run-key'] || '').trim();
    const token = bearer || adminHeader;
    if (!token || !constantTimeEqual(token, expectedKey)) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // P0: this endpoint is no longer a worker claimant. Supabase Cron invokes
    // /api/admin-run-worker, which owns the single exact-job claim authority.
    if (req.body?.dry_run === true) {
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('id, user_id, status, created_at, worker_attempt_count, product_identity, admission_receipt_id')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(25);
      if (error) return res.status(500).json({ ok: false, error: 'SERVER_QUERY_FAILED' });
      return res.status(200).json({
        ok: true,
        mode: 'read_only',
        claimant: false,
        queued: data || [],
      });
    }

    const jobId = String(req.body?.job_id || '').trim();
    const action = String(req.body?.action || '').trim();
    if (jobId) {
      const reason = String(req.body?.reason || action || 'governed_admin_recovery').trim();
      const resumeCheckpoint = String(req.body?.resume_checkpoint || '').trim() || null;
      const requestedBudget = Number(req.body?.retry_budget ?? 1);
      const retryBudget = Number.isInteger(requestedBudget)
        ? Math.max(1, Math.min(requestedBudget, 3))
        : 1;

      const { data, error } = await supabase.rpc('begin_worker_recovery_episode', {
        p_job_id: jobId,
        p_authorized_actor: 'admin-run-eligible-jobs-once',
        p_reason: reason,
        p_resume_checkpoint: resumeCheckpoint,
        p_retry_budget: retryBudget,
      });
      const episode = Array.isArray(data) ? data[0] : data;
      if (error || !episode?.episode_id) {
        return res.status(409).json({
          ok: false,
          error: 'GOVERNED_RECOVERY_REJECTED',
          details: error?.message || null,
        });
      }
      return res.status(200).json({
        ok: true,
        recovery_episode_id: episode.episode_id,
        job_id: episode.job_id,
        retry_budget: episode.retry_budget,
        status: episode.status,
      });
    }

    return res.status(409).json({
      ok: false,
      error: 'CLAIM_PATH_RETIRED_USE_ADMIN_RUN_WORKER',
      canonical_worker: '/api/admin-run-worker',
    });
  } catch (err) {
    console.error('Admin recovery endpoint error:', err);
    return res.status(500).json({ ok: false, error: 'SERVER_EXCEPTION' });
  }
}
