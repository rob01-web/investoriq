export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '';
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missing.length > 0) {
      return res
        .status(500)
        .json({ error: 'SERVER_MISCONFIGURED', missing });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const crypto = require('crypto');
    const authHeader = req.headers.authorization || '';
    const headerToken = authHeader.replace('Bearer ', '').trim();
    const fallbackToken =
      typeof req.headers['x-admin-run-key'] === 'string'
        ? req.headers['x-admin-run-key'].trim()
        : '';
    const token = headerToken || fallbackToken;
    if (!token) {
      return res
        .status(403)
        .json({ ok: false, error: 'FORBIDDEN_NO_AUTH_HEADER' });
    }
    if (!token) {
      return res
        .status(403)
        .json({ ok: false, error: 'FORBIDDEN_EMPTY_BEARER' });
    }
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      const hashPrefix = (value) =>
        crypto.createHash('sha256').update(value || '').digest('hex').slice(0, 8);
      return res
        .status(403)
        .json({
          ok: false,
          error: 'FORBIDDEN_INVALID_TOKEN',
          received_len: token?.length ?? 0,
          expected_len: (process.env.ADMIN_RUN_KEY || '').length,
          expected_present: Boolean(process.env.ADMIN_RUN_KEY),
          auth_header_present: Boolean(
            req.headers.authorization || req.headers['x-admin-run-key']
          ),
          received_sha8: hashPrefix(token),
          expected_sha8: hashPrefix(process.env.ADMIN_RUN_KEY || ''),
        });
    }

    const emailAllowlistRaw = process.env.ADMIN_EMAIL_ALLOWLIST || '';
    const userIdAllowlistRaw = process.env.ADMIN_USER_ID_ALLOWLIST || '';
    const allowedEmails = emailAllowlistRaw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const allowedUserIds = userIdAllowlistRaw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!allowedEmails.length && !allowedUserIds.length) {
      return res
        .status(403)
        .json({ ok: false, error: 'FORBIDDEN_ALLOWLIST_EMPTY' });
    }

    const user = authData.user;
    const isAdmin =
      (user?.id && allowedUserIds.includes(user.id)) ||
      (user?.email && allowedEmails.includes(user.email.toLowerCase()));
    if (!isAdmin) {
      return res
        .status(403)
        .json({ ok: false, error: 'FORBIDDEN_NOT_ALLOWLISTED' });
    }

    const dryRun = req.body?.dry_run !== false;

    const { data: jobRows, error: jobsErr } = await supabase
      .from('analysis_jobs')
      .select('id, user_id, status, runs_limit, runs_used, runs_inflight, updated_at')
      .in('status', ['queued', 'failed'])
      .order('updated_at', { ascending: true })
      .limit(25);

    if (jobsErr) {
      return res.status(500).json({ ok: false, error: 'SERVER_QUERY_FAILED' });
    }

    const eligibleJobs = (jobRows || []).filter((job) => {
      const runsLimitOk = typeof job.runs_limit === 'number';
      const runsUsedOk = typeof job.runs_used === 'number';
      const runsInflightOk = typeof job.runs_inflight === 'number';
      if (!runsLimitOk || !runsUsedOk || !runsInflightOk) return false;
      if (job.runs_inflight !== 0) return false;
      return job.runs_used + job.runs_inflight < job.runs_limit;
    });

    if (dryRun) {
      return res.json({
        ok: true,
        fetched: (jobRows || []).length,
        eligible: eligibleJobs.length,
        jobs: eligibleJobs,
      });
    }

    const expectedAdminKey = process.env.ADMIN_RUN_KEY || '';
    const providedAdminKey = req.headers['x-admin-run-key'] || '';
    if (!expectedAdminKey || expectedAdminKey !== providedAdminKey) {
      return res
        .status(403)
        .json({ ok: false, error: 'FORBIDDEN_ADMIN_RUN_KEY' });
    }

    const claimedJobs = [];
    for (const job of eligibleJobs) {
      try {
        const { data: claimData, error: claimErr } = await supabase.rpc(
          'claim_generation_slot',
          { p_job_id: job.id, p_user_id: job.user_id }
        );
        const claimed = claimData === true || claimData?.allowed === true;
        if (!claimErr && claimed) {
          claimedJobs.push(job.id);
        }
      } catch (err) {
        // fail closed per job
      }
    }

    const transitionedJobIds = [];
    const failedJobIds = [];
    for (const jobId of claimedJobs) {
      const jobRow = eligibleJobs.find((job) => job.id === jobId);
      const fromStatus = jobRow?.status || null;
      const { error: logErr } = await supabase.from('analysis_job_events').insert([
        {
          job_id: jobId,
          actor: 'admin',
          event_type: 'admin_run_once',
          from_status: fromStatus,
          to_status: 'validating_inputs',
          created_at: new Date().toISOString(),
          meta: { route: '/api/admin/run-eligible-jobs-once' },
        },
      ]);

      if (logErr) {
        failedJobIds.push(jobId);
        continue;
      }

      const { data: updatedRows, error: updateErr } = await supabase
  .from('analysis_jobs')
  .update({ status: 'validating_inputs', last_error: null })
  .in('status', ['queued', 'failed'])
  .eq('id', jobId)
  .select('id');

if (updateErr || !updatedRows || updatedRows.length === 0) {
  console.error('ADMIN_RUN_ONCE_UPDATE_FAILED', {
    jobId,
    error: updateErr?.message ?? 'NO_ROWS_UPDATED',
  });
  failedJobIds.push(jobId);
  continue;
}

transitionedJobIds.push(jobId);
    }

    return res.json({
      ok: true,
      fetched: (jobRows || []).length,
      eligible: eligibleJobs.length,
      claimed: claimedJobs.length,
      claimed_job_ids: claimedJobs,
      transitioned: transitionedJobIds.length,
      transitioned_job_ids: transitionedJobIds,
      failed_job_ids: failedJobIds,
      jobs: eligibleJobs,
    });
  } catch (err) {
    console.error('Admin run endpoint error:', err);
    return res.status(500).json({ ok: false, error: 'SERVER_EXCEPTION' });
  }
}
