import crypto from 'crypto';
import {
  resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
} from '../_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js';

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
        .select('id, user_id, status, worker_attempt_id, worker_lease_expires_at, dead_lettered_at')
        .eq('id', forceJobId)
        .maybeSingle();

      if (forcedErr || !forcedJob?.id) {
        return res.status(404).json({ ok: false });
      }

      const activeStatuses = ['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing'];
      const leaseExpired = forcedJob?.worker_lease_expires_at
        ? new Date(forcedJob.worker_lease_expires_at) <= new Date()
        : false;
      const { data: requeued, error: rqErr } = await supabase.rpc('requeue_worker_job', {
        p_job_id: forceJobId,
        p_claimed_by: 'admin-run-eligible-jobs-once',
        p_allow_expired_lease_recovery: activeStatuses.includes(String(forcedJob.status || '')) && leaseExpired,
      });

      const requeuedJob = Array.isArray(requeued) ? requeued[0] : requeued;
      if (rqErr || !requeuedJob?.id) {
        return res.status(500).json({ ok: false, error: 'ADMIN_REQUEUE_FAILED' });
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

    // supabase.rpc('claim_next_job')
    const { data: claimedJobRows, error: claimErr } = await supabase.rpc('claim_next_worker_job', {
      p_claimed_by: 'admin-run-eligible-jobs-once',
    });

    if (claimErr) {
      return res.status(500).json({ ok: false, error: 'CLAIM_NEXT_WORKER_JOB_FAILED' });
    }

    const claimedJob = Array.isArray(claimedJobRows) ? claimedJobRows[0] : claimedJobRows;
    if (!claimedJob?.id) {
      return res.status(200).json({ ok: true, claimed: false });
    }

    const { data: claimedSurfaceJob, error: claimedSurfaceJobError } =
      await supabase
        .from('analysis_jobs')
        .select('id, user_id, created_at, report_type, worker_attempt_id, worker_lease_expires_at, worker_claimed_by')
        .eq('id', claimedJob.id)
        .maybeSingle();
    if (claimedSurfaceJobError || !claimedSurfaceJob?.id) {
      return res.status(500).json({
        ok: false,
        error: 'CLAIMED_JOB_SURFACE_CONTEXT_UNAVAILABLE',
      });
    }
    try {
      await resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
        supabaseAdmin: supabase,
        job: claimedSurfaceJob,
        capabilityEnabled:
          process.env.PREMIUM_ACQUISITION_UNDERWRITING_V1 || false,
        activationStartedAt:
          process.env.PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT ||
          null,
        resolvedAt: new Date().toISOString(),
      });
    } catch (surfaceReceiptError) {
      console.error(
        'Claimed job surface receipt failed:',
        surfaceReceiptError?.message || surfaceReceiptError,
      );
      return res.status(500).json({
        ok: false,
        error: 'CLAIMED_JOB_SURFACE_RECEIPT_FAILED',
      });
    }
    console.log('Claimed job:', {
      id: claimedJob?.id,
      worker_attempt_id: claimedJob?.worker_attempt_id,
      worker_lease_expires_at: claimedJob?.worker_lease_expires_at,
    });

    return res.json({
      ok: true,
      claimed: true,
      claimed_job_id: claimedJob.id,
      worker_attempt_id: claimedJob.worker_attempt_id || null,
      worker_lease_expires_at: claimedJob.worker_lease_expires_at || null,
      job: claimedJob,
    });
  } catch (err) {
    console.error('Admin run endpoint error:', err);
    return res.status(500).json({ ok: false, error: 'SERVER_EXCEPTION' });
  }
}
