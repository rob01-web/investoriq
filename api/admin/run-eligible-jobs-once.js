import crypto from 'crypto';

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
    const expectedKey = process.env.ADMIN_RUN_KEY || '';
    if (!expectedKey) {
      return res.status(500).json({
        ok: false,
        error: 'SERVER_MISCONFIGURED',
        missing: ['ADMIN_RUN_KEY'],
      });
    }
    const hashPrefix = (value) =>
      crypto.createHash('sha256').update(value || '').digest('hex').slice(0, 8);
    const sameLength = Buffer.byteLength(token) === Buffer.byteLength(expectedKey);
    const matches =
      sameLength &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedKey));
    if (!matches) {
      return res.status(403).json({
        ok: false,
        error: 'FORBIDDEN_INVALID_TOKEN',
        received_len: token?.length ?? 0,
        expected_len: expectedKey.length,
        expected_present: Boolean(expectedKey),
        auth_header_present: Boolean(
          req.headers.authorization || req.headers['x-admin-run-key']
        ),
      });
    }

    const action = req.body?.action;
    if (action === 'regenerate_pdf') {
      const jobId = req.body?.job_id;
      const reason = req.body?.reason || null;
      if (typeof jobId !== 'string' || !jobId.trim()) {
        return res.status(400).json({ ok: false });
      }

      const vercelUrl = process.env.VERCEL_URL || '';
      const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const host = req.headers.host || '';
      let baseUrl = '';
      if (vercelUrl) {
        baseUrl = `https://${vercelUrl}`;
      } else if (publicSiteUrl) {
        baseUrl = publicSiteUrl.startsWith('http://') || publicSiteUrl.startsWith('https://')
          ? publicSiteUrl
          : `https://${publicSiteUrl}`;
      } else if (host) {
        baseUrl = `https://${host}`;
      } else {
        return res.status(500).json({ ok: false, error: 'BASE_URL_UNAVAILABLE' });
      }
      const internalRegenKey = process.env.INTERNAL_REGEN_KEY || '';
      if (!internalRegenKey) {
        return res.status(500).json({ ok: false, error: 'INTERNAL_REGEN_KEY_MISSING' });
      }

      let regenResultStatus = 'error';
      let regenResponse = null;
      let regenErrorDetails = null;
      try {
        const regenRes = await fetch(`${baseUrl}/api/generate-client-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-admin-regen': internalRegenKey,
          },
          body: JSON.stringify({
            job_id: jobId,
            admin_regen: true,
            reason,
          }),
        });

        if (!regenRes.ok) {
          const rawText = await regenRes.text();
          regenErrorDetails = rawText;
          regenResultStatus = 'error';
          const docraptorMode = process.env.DOCRAPTOR_TEST_MODE ? 'test' : 'production';
          supabase
            .from('analysis_job_events')
            .insert([
              {
                job_id: jobId,
                actor: 'admin',
                event_type: 'admin_regenerate_pdf',
                from_status: null,
                to_status: null,
                created_at: new Date().toISOString(),
                meta: {
                  route: '/api/admin/run-eligible-jobs-once',
                  job_id: jobId,
                  reason,
                  result_status: 'error',
                  docraptor_mode: docraptorMode,
                },
              },
            ])
            .catch(() => {});
          return res.status(502).json({
            ok: false,
            job_id: jobId,
            error: 'PDF regeneration failed',
            details: regenErrorDetails,
          });
        }

        regenResultStatus = 'success';
        regenResponse = await regenRes.json().catch(() => ({}));
      } catch (err) {
        regenResultStatus = 'error';
        regenErrorDetails = err?.message || 'PDF regeneration failed';
        const docraptorMode = process.env.DOCRAPTOR_TEST_MODE ? 'test' : 'production';
        supabase
          .from('analysis_job_events')
          .insert([
            {
              job_id: jobId,
              actor: 'admin',
              event_type: 'admin_regenerate_pdf',
              from_status: null,
              to_status: null,
              created_at: new Date().toISOString(),
              meta: {
                route: '/api/admin/run-eligible-jobs-once',
                job_id: jobId,
                reason,
                result_status: 'error',
                docraptor_mode: docraptorMode,
              },
            },
          ])
          .catch(() => {});
        return res.status(502).json({
          ok: false,
          job_id: jobId,
          error: 'PDF regeneration failed',
          details: regenErrorDetails,
        });
      }

      const docraptorMode = process.env.DOCRAPTOR_TEST_MODE ? 'test' : 'production';
      let warning = null;
      try {
        const { error: regenEventErr } = await supabase
          .from('analysis_job_events')
          .insert([
            {
              job_id: jobId,
              actor: 'admin',
              event_type: 'admin_regenerate_pdf',
              from_status: null,
              to_status: null,
              created_at: new Date().toISOString(),
              meta: {
                route: '/api/admin/run-eligible-jobs-once',
                job_id: jobId,
                reason,
                result_status: regenResultStatus,
                docraptor_mode: docraptorMode,
              },
            },
          ]);
        if (regenEventErr) {
          warning = 'Failed to log admin_regenerate_pdf event';
        }
      } catch (err) {
        warning = 'Failed to log admin_regenerate_pdf event';
      }

      return res.json({
        ...(regenResponse || {}),
        ...(warning ? { warning } : {}),
      });
    }

    const dryRun = req.body?.dry_run === true;
    const forceJobId = req.body?.job_id;
    if (forceJobId !== undefined) {
      if (typeof forceJobId !== 'string' || !forceJobId.trim()) {
        return res.status(400).json({ ok: false });
      }

      const { data: forcedJob, error: forcedErr } = await supabase
        .from('analysis_jobs')
        .select('id, user_id, status')
        .eq('id', forceJobId)
        .maybeSingle();

      if (forcedErr || !forcedJob?.id) {
        return res.status(404).json({ ok: false });
      }

      const { error: logErr } = await supabase.from('analysis_job_events').insert([
        {
          job_id: forceJobId,
          actor: 'admin',
          event_type: 'admin_run_once',
          from_status: forcedJob.status || null,
          to_status: 'queued',
          created_at: new Date().toISOString(),
          meta: { route: '/api/admin/run-eligible-jobs-once' },
        },
      ]);

      if (logErr) {
        return res.status(500).json({ ok: false });
      }

      const { data: updatedRows, error: updateErr } = await supabase
        .from('analysis_jobs')
        .update({
          status: 'queued',
          error_code: null,
          error_message: null,
          started_at: null,
        })
        .eq('id', forceJobId)
        .select('id');

      if (updateErr || !updatedRows || updatedRows.length === 0) {
        return res.status(500).json({ ok: false });
      }

      return res.json({ ok: true, forced_job_id: forceJobId });
    }

    if (dryRun) {
      const { data: jobRows, error: jobsErr } = await supabase
        .from('analysis_jobs')
        .select('id, user_id, status, created_at')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(25);

      if (jobsErr) {
        return res.status(500).json({ ok: false, error: 'SERVER_QUERY_FAILED' });
      }

      const eligibleJobs = jobRows || [];
      return res.json({
        ok: true,
        fetched: (jobRows || []).length,
        eligible: eligibleJobs.length,
        jobs: eligibleJobs,
      });
    }

    const { data: claimedJob, error: claimErr } = await supabase
      .rpc('claim_next_job');

    if (claimErr) {
      return res.status(500).json({ ok: false, error: 'CLAIM_AND_CONSUME_FAILED' });
    }

    if (!claimedJob || (Array.isArray(claimedJob) && claimedJob.length === 0)) {
      return res.status(200).json({ ok: true, claimed: false });
    }

    const jobRow = Array.isArray(claimedJob) ? claimedJob[0] : claimedJob;
    console.log('Claimed job:', {
      id: jobRow?.id,
      attempts: jobRow?.attempts,
      claimed_at: jobRow?.claimed_at,
    });

    const claimedJobs = [jobRow.id];
    const eligibleJobs = [jobRow];
    const jobRows = [jobRow];

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
          to_status: 'extracting',
          created_at: new Date().toISOString(),
          meta: { route: '/api/admin/run-eligible-jobs-once' },
        },
      ]);

      if (logErr) {
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
