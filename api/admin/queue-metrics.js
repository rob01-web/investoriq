import { createClient } from '@supabase/supabase-js';

const severityRank = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };

function normalizeSeverity(value) {
  const severity = String(value || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(severityRank, severity) ? severity : "low";
}

function highestSeverityValue(values = []) {
  return (Array.isArray(values) ? values : []).reduce(
    (highest, value) =>
      severityRank[normalizeSeverity(value)] > severityRank[highest]
        ? normalizeSeverity(value)
        : highest,
    "none"
  );
}

function normalizeActionPlan(plan = {}) {
  const prioritizedActions = Array.isArray(plan?.prioritized_actions) ? plan.prioritized_actions : [];
  const topAction = prioritizedActions[0] || null;
  return {
    top_action_code: topAction?.code || null,
    top_action_title: topAction?.title || null,
    recommended_next_step: topAction?.recommended_next_step || null,
    owner_area: topAction?.owner_area || null,
    highest_severity: plan?.highest_severity || highestSeverityValue(prioritizedActions.map((action) => action?.severity)),
    customer_delivery_ready: Boolean(plan?.customer_delivery_ready),
    public_sample_ready: Boolean(plan?.public_sample_ready),
    high_value_outreach_ready: Boolean(plan?.high_value_outreach_ready),
    requires_code_patch: Boolean(plan?.action_counts?.requires_code_patch || prioritizedActions.some((action) => action?.requires_code_patch)),
    requires_regeneration: Boolean(plan?.regenerate_recommended || prioritizedActions.some((action) => action?.requires_regeneration)),
  };
}

function buildFixQueueEntry({ job = null, artifactsByType = {} } = {}) {
  const contract = artifactsByType.report_contract_qa?.payload || {};
  const actionPlan = artifactsByType.qa_action_plan?.payload || {};
  const director = artifactsByType.qa_director_review?.payload || {};
  const flags = artifactsByType.report_qa_flags?.payload || {};
  const normalizedPlan = normalizeActionPlan(actionPlan);
  const contractViolations = Array.isArray(contract?.violations) ? contract.violations : [];
  const contractSeverity = highestSeverityValue(contractViolations.map((violation) => violation?.severity));
  const directorSeverity = highestSeverityValue((director?.findings || []).map((finding) => finding?.severity));
  const flagsSeverity = normalizeSeverity((flags?.severity || (flags?.qa_status === "fail" ? "high" : "none")));
  const highestSeverity = highestSeverityValue([
    normalizedPlan.highest_severity,
    contractSeverity,
    directorSeverity,
    flagsSeverity,
  ]);
  const shouldShow =
    normalizedPlan.public_sample_ready === false ||
    normalizedPlan.high_value_outreach_ready === false ||
    normalizedPlan.requires_code_patch === true ||
    normalizedPlan.requires_regeneration === true ||
    String(director?.overall_director_decision || "") !== "no_missed_issue_detected" ||
    String(contract?.contract_status || "") !== "pass";

  if (!shouldShow) return null;

  return {
    job_id: job?.id || null,
    property_name: job?.property_name || contract?.property_name || null,
    report_type: job?.report_type || contract?.report_type || actionPlan?.report_type || null,
    created_at: job?.created_at || contract?.timestamp || actionPlan?.timestamp || director?.timestamp || null,
    highest_severity: highestSeverity,
    customer_delivery_ready: normalizedPlan.customer_delivery_ready,
    public_sample_ready: normalizedPlan.public_sample_ready,
    high_value_outreach_ready: normalizedPlan.high_value_outreach_ready,
    requires_code_patch: normalizedPlan.requires_code_patch,
    requires_regeneration: normalizedPlan.requires_regeneration,
    owner_area: normalizedPlan.owner_area || null,
    top_action_code: normalizedPlan.top_action_code || null,
    top_action_title: normalizedPlan.top_action_title || null,
    recommended_next_step: normalizedPlan.recommended_next_step || null,
    contract_status: contract?.contract_status || null,
    director_decision: director?.overall_director_decision || null,
    report_qa_flags_severity: flags?.severity || null,
  };
}

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
      .select('id, property_name, status, created_at, started_at, user_id, failure_reason, error_message')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: issuesRows, error: issuesErr } = await supabaseAdmin
      .from('report_issues')
      .select('id, user_id, job_id, artifact_id, message, attachment_path, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const issueJobIds = Array.from(
      new Set(
        (issuesRows || [])
          .map((issue) => issue?.job_id)
          .filter((jobId) => typeof jobId === 'string' && jobId.trim())
      )
    );

    let relatedJobsById = {};
    if (issueJobIds.length > 0) {
      const { data: relatedJobs } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, property_name, report_type, status')
        .in('id', issueJobIds);

      relatedJobsById = Object.fromEntries(
        (relatedJobs || []).map((job) => [job.id, job])
      );
    }

    const issuesWithUrls = await Promise.all(
      (issuesRows || []).map(async (issue) => {
        const relatedJob = issue?.job_id ? relatedJobsById[issue.job_id] || null : null;
        if (!issue?.attachment_path) {
          return {
            ...issue,
            attachment_url: null,
            property_name: relatedJob?.property_name || null,
            report_type: relatedJob?.report_type || null,
            job_status: relatedJob?.status || null,
          };
        }
        const { data: signed, error: signedErr } = await supabaseAdmin.storage
          .from('report-issues')
          .createSignedUrl(issue.attachment_path, 3600);
        return {
          ...issue,
          attachment_url: signedErr ? null : signed?.signedUrl || null,
          property_name: relatedJob?.property_name || null,
          report_type: relatedJob?.report_type || null,
          job_status: relatedJob?.status || null,
        };
      })
    );

    const { data: fixQueueArtifacts, error: fixQueueArtifactsErr } = await supabaseAdmin
      .from('analysis_artifacts')
      .select('job_id, type, payload, created_at')
      .in('type', ['qa_action_plan', 'report_contract_qa', 'qa_director_review', 'report_qa_flags'])
      .order('created_at', { ascending: false })
      .limit(200);

    const artifactsByJob = {};
    for (const row of fixQueueArtifacts || []) {
      if (!row?.job_id) continue;
      if (!artifactsByJob[row.job_id]) artifactsByJob[row.job_id] = {};
      if (!artifactsByJob[row.job_id][row.type]) {
        artifactsByJob[row.job_id][row.type] = row;
      }
    }

    const fixQueueJobIds = Object.keys(artifactsByJob);
    let jobsById = {};
    if (fixQueueJobIds.length > 0) {
      const { data: fixQueueJobs } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, property_name, report_type, status, created_at')
        .in('id', fixQueueJobIds);
      jobsById = Object.fromEntries((fixQueueJobs || []).map((job) => [job.id, job]));
    }

    const fixQueue = fixQueueJobIds
      .map((jobId) => buildFixQueueEntry({
        job: jobsById[jobId] || { id: jobId },
        artifactsByType: artifactsByJob[jobId] || {},
      }))
      .filter(Boolean)
      .sort((a, b) => (
        severityRank[normalizeSeverity(b.highest_severity)] - severityRank[normalizeSeverity(a.highest_severity)] ||
        Number(Boolean(b.requires_code_patch)) - Number(Boolean(a.requires_code_patch)) ||
        Number(Boolean(b.requires_regeneration)) - Number(Boolean(a.requires_regeneration)) ||
        String(b.created_at || "").localeCompare(String(a.created_at || ""))
      ));

    return res.status(200).json({
      counts_by_status: countsByStatus,
      oldest_queued_at: oldestQueuedErr ? null : oldestQueued?.created_at || null,
      latest_failed_at: latestFailedErr ? null : latestFailed?.created_at || null,
      recent_jobs: recentJobsErr ? [] : recentJobs || [],
      issues: issuesErr ? [] : issuesWithUrls || [],
      fix_queue: fixQueueArtifactsErr ? [] : fixQueue,
      issues_error: Boolean(issuesErr),
      fix_queue_error: Boolean(fixQueueArtifactsErr),
    });
  } catch (err) {
    console.error('queue-metrics error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
