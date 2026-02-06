import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminRunKey = (process.env.ADMIN_RUN_KEY || '').trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: 'Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    if (!adminRunKey) {
      return res.status(500).json({ error: 'Unauthorized' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';

    if (!token || token.trim() !== adminRunKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    if (req.method === 'POST') {
      const { issue_id, status } = req.body || {};
      const allowedStatuses = ['open', 'reviewing', 'resolved'];
      if (!issue_id || !allowedStatuses.includes(status)) {
        return res.status(400).json({ ok: false });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('report_issues')
        .update({ status })
        .eq('id', issue_id);

      if (updateErr) {
        return res.status(500).json({ ok: false });
      }

      return res.status(200).json({ ok: true });
    }

    const statuses = [
      'queued',
      'extracting',
      'needs_documents',
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
      .select('created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: recentJobs, error: recentJobsErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, property_name, status, created_at, started_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: issuesRows, error: issuesErr } = await supabaseAdmin
      .from('report_issues')
      .select('id, user_id, job_id, artifact_id, message, attachment_path, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const issuesWithUrls = await Promise.all(
      (issuesRows || []).map(async (issue) => {
        if (!issue?.attachment_path) {
          return { ...issue, attachment_url: null };
        }
        const { data: signed, error: signedErr } = await supabaseAdmin.storage
          .from('report-issues')
          .createSignedUrl(issue.attachment_path, 3600);
        return {
          ...issue,
          attachment_url: signedErr ? null : signed?.signedUrl || null,
        };
      })
    );

    return res.status(200).json({
      counts_by_status: countsByStatus,
      oldest_queued_at: oldestQueuedErr ? null : oldestQueued?.created_at || null,
      latest_failed_at: latestFailedErr ? null : latestFailed?.created_at || null,
      recent_jobs: recentJobsErr ? [] : recentJobs || [],
      issues: issuesErr ? [] : issuesWithUrls || [],
      issues_error: Boolean(issuesErr),
    });
  } catch (err) {
    console.error('queue-metrics error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
