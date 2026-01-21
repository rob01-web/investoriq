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

    const supabase = supabaseAdmin;

    const now = new Date();
    const nowIso = now.toISOString();
    const timeoutCutoff = new Date(now.getTime() - 60 * 60 * 1000);
    const inProgressStatuses = [
      'queued',
      'validating_inputs',
      'extracting',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
    ];

    const safeTimestamp = (iso) => (iso || '').replace(/:/g, '-');

    const writeStatusTransitionArtifact = async (jobId, fromStatus, toStatus, meta) => {
      const { error } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: jobId,
          user_id: meta?.user_id ?? null,
          type: 'status_transition',
          bucket: 'system',
          object_path: `analysis_jobs/${jobId}/status_transition/${fromStatus}_to_${toStatus}/${safeTimestamp(
            nowIso
          )}.json`,
          payload: {
            job_id: jobId,
            from_status: fromStatus,
            to_status: toStatus,
            at: nowIso,
            meta: meta || {},
          },
        },
      ]);

      return error;
    };

    // Timeout guard: mark long-running jobs as failed
    const { data: inProgressJobs, error: inProgressError } = await supabase
      .from('analysis_jobs')
      .select('id, user_id, status, started_at, created_at')
      .in('status', inProgressStatuses);

    if (inProgressError) {
      return res.status(500).json({
        error: 'Failed to fetch in-progress jobs',
        details: inProgressError.message,
      });
    }

    const timedOutJobs = (inProgressJobs || []).filter((job) => {
      const startedAt = job.started_at ? new Date(job.started_at) : null;
      const createdAt = job.created_at ? new Date(job.created_at) : null;
      const anchor = startedAt || createdAt;
      return anchor ? anchor <= timeoutCutoff : false;
    });

    if (timedOutJobs.length > 0) {
        const timedOutIds = timedOutJobs.map((job) => job.id);
      const { error: failErr } = await supabaseAdmin
        .from('analysis_jobs')
        .update({ status: 'failed' })
        .in('id', timedOutIds);

      if (failErr) {
        return res.status(500).json({ error: 'Failed to mark timed-out jobs', details: failErr.message });
      }

      for (const job of timedOutJobs) {
        const transitionErr = await writeStatusTransitionArtifact(
          job.id,
          job.status,
          'failed',
          { event: 'timeout', threshold_minutes: 60, user_id: job.user_id }
        );

        if (transitionErr) {
          return res.status(500).json({
            error: 'Failed to write timeout status transition artifact',
            details: transitionErr.message,
          });
        }
      }

      const timeoutArtifacts = timedOutJobs.map((job) => ({
        job_id: job.id,
        user_id: job.user_id,
        type: 'worker_event',
        bucket: 'internal',
        object_path: `analysis_jobs/${job.id}/worker_event/timeout/${nowIso}.json`,
        payload: {
          event: 'timeout',
          status_was: job.status,
          threshold_minutes: 60,
          timestamp: nowIso,
        },
      }));

      const { error: timeoutArtifactErr } = await supabaseAdmin
        .from('analysis_artifacts')
        .insert(timeoutArtifacts);

      if (timeoutArtifactErr) {
        return res.status(500).json({ error: 'Failed to write timeout artifacts', details: timeoutArtifactErr.message });
      }
    }

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

    const transitions = [];

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

      for (const job of queuedJobs) {
        transitions.push({
          job_id: job.id,
          from_status: 'queued',
          to_status: 'extracting',
        });
        const transitionErr = await writeStatusTransitionArtifact(
          job.id,
          'queued',
          'extracting',
          { user_id: job.user_id }
        );

        if (transitionErr) {
          return res.status(500).json({
            error: 'Failed to write status transition artifact',
            details: transitionErr.message,
          });
        }
      }
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

      for (const job of extractingJobs) {
        transitions.push({
          job_id: job.id,
          from_status: 'extracting',
          to_status: 'underwriting',
        });
        const transitionErr = await writeStatusTransitionArtifact(
          job.id,
          'extracting',
          'underwriting',
          { user_id: job.user_id }
        );

        if (transitionErr) {
          return res.status(500).json({
            error: 'Failed to write status transition artifact',
            details: transitionErr.message,
          });
        }
      }
    }

    const { data: underwritingJobs, error: underwritingErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, user_id, status, started_at')
      .eq('status', 'underwriting')
      .order('created_at', { ascending: true })
      .limit(10);

    if (underwritingErr) {
      return res.status(500).json({ error: 'Failed to fetch underwriting jobs', details: underwritingErr.message });
    }

    if (underwritingJobs && underwritingJobs.length > 0) {
      const underwritingIds = underwritingJobs.map((j) => j.id);
      const { error: underwritingUpdErr } = await supabaseAdmin
        .from('analysis_jobs')
        .update({ status: 'scoring' })
        .in('id', underwritingIds);

      if (underwritingUpdErr) {
        return res.status(500).json({ error: 'Failed to advance underwriting jobs', details: underwritingUpdErr.message });
      }

      for (const job of underwritingJobs) {
        transitions.push({
          job_id: job.id,
          from_status: 'underwriting',
          to_status: 'scoring',
        });
        const transitionErr = await writeStatusTransitionArtifact(
          job.id,
          'underwriting',
          'scoring',
          { user_id: job.user_id }
        );

        if (transitionErr) {
          return res.status(500).json({
            error: 'Failed to write status transition artifact',
            details: transitionErr.message,
          });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      advanced_count: transitions.length,
      timeout_failed_count: timedOutJobs.length,
      transitions,
    });
  } catch (err) {
    console.error('admin-run-worker error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
