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

function normalizeFixQueueDisplay(raw = {}) {
  const candidateCode = String(
    raw?.top_action_code ||
    raw?.code ||
    raw?.reason_code ||
    raw?.source_code ||
    ''
  ).trim();
  const codeLower = candidateCode.toLowerCase();
  const rentRollMismatch = codeLower === 'rent_roll_vs_t12_gpr_discrepancy';
  if (rentRollMismatch) {
    return {
      display_title: 'Rent roll source totals require verification',
      display_reason: 'The unit-level rent roll totals do not reconcile cleanly against the rent roll summary totals and T12 gross potential rent. Admin review is required before delivery.',
      display_next_step: 'Review rent roll unit rows, rent roll summary totals, and T12 GPR. Confirm which source total should control before regenerating.',
      display_category: 'Source verification',
      display_priority: 'Admin review required',
    };
  }
  return {
    display_title: raw?.top_action_title || null,
    display_reason: raw?.display_reason || null,
    display_next_step: raw?.recommended_next_step || null,
    display_category: raw?.owner_area || null,
    display_priority: raw?.delivery_gate_status === 'admin_review_required' ? 'Admin review required' : raw?.highest_severity || null,
  };
}

function compactArtifactSummary(row = {}) {
  const payload = row?.payload || {};
  const type = String(row?.type || '').toLowerCase();
  if (type === 'worker_event') {
    return String(
      payload.message ||
      payload.reason ||
      payload.stage ||
      payload.event ||
      'Worker event'
    );
  }
  if (type === 'status_transition') {
    return `Transition ${payload.from_status || 'unknown'} -> ${payload.to_status || 'unknown'}`;
  }
  if (type === 'delivery_gate_decision') {
    return `Gate ${payload.delivery_gate_status || 'unknown'}${payload.reason_code ? ` · ${payload.reason_code}` : ''}`;
  }
  if (type === 'qa_action_plan') {
    return `QA action plan${payload.delivery_recommendation ? ` · ${payload.delivery_recommendation}` : ''}`;
  }
  if (type === 'report_contract_qa') {
    const count = Array.isArray(payload.violations) ? payload.violations.length : 0;
    return `Report contract QA${payload.contract_status ? ` · ${payload.contract_status}` : ''}${count ? ` · ${count} violation${count === 1 ? '' : 's'}` : ''}`;
  }
  if (type === 'qa_director_review') {
    return `QA director review${payload.overall_director_decision ? ` · ${payload.overall_director_decision}` : ''}`;
  }
  if (type === 'report_qa_flags') {
    return `QA flags${payload.qa_status ? ` · ${payload.qa_status}` : ''}${payload.severity ? ` · ${payload.severity}` : ''}`;
  }
  return type || 'artifact';
}

function compactAction(action = {}) {
  return {
    code: action?.code || null,
    title: action?.title || null,
    action_type: action?.action_type || null,
    owner_area: action?.owner_area || null,
    severity: action?.severity || null,
    blocks_customer_delivery: Boolean(action?.blocks_customer_delivery),
    blocks_public_sample: Boolean(action?.blocks_public_sample),
    blocks_high_value_outreach: Boolean(action?.blocks_high_value_outreach),
    requires_code_patch: Boolean(action?.requires_code_patch),
    requires_regeneration: Boolean(action?.requires_regeneration),
    recommended_next_step: action?.recommended_next_step || null,
  };
}

function compactFinding(finding = {}) {
  return {
    code: finding?.code || null,
    title: finding?.title || null,
    severity: finding?.severity || null,
    classification: finding?.classification || null,
    blocks_customer_delivery: Boolean(finding?.blocks_customer_delivery),
    blocks_public_sample: Boolean(finding?.blocks_public_sample),
    blocks_high_value_outreach: Boolean(finding?.blocks_high_value_outreach),
  };
}

function buildFixQueueEntry({ job = null, artifactsByType = {} } = {}) {
  const contract = artifactsByType.report_contract_qa?.payload || {};
  const actionPlan = artifactsByType.qa_action_plan?.payload || {};
  const director = artifactsByType.qa_director_review?.payload || {};
  const flags = artifactsByType.report_qa_flags?.payload || {};
  const deliveryGate = artifactsByType.delivery_gate_decision?.payload || {};
  const normalizedPlan = normalizeActionPlan(actionPlan);
  const contractViolations = Array.isArray(contract?.violations) ? contract.violations : [];
  const contractSeverity = highestSeverityValue(contractViolations.map((violation) => violation?.severity));
  const directorSeverity = highestSeverityValue((director?.findings || []).map((finding) => finding?.severity));
  const flagsSeverity = normalizeSeverity((flags?.severity || (flags?.qa_status === "fail" ? "high" : "none")));
  const deliveryGateStatus = String(deliveryGate?.delivery_gate_status || "").toLowerCase();
  const highestSeverity = highestSeverityValue([
    normalizedPlan.highest_severity,
    contractSeverity,
    directorSeverity,
    flagsSeverity,
    deliveryGateStatus === 'admin_review_required' ? 'high' : deliveryGateStatus === 'user_needs_documents' ? 'medium' : 'none',
  ]);
  const shouldShow =
    (deliveryGateStatus && deliveryGateStatus !== 'deliverable') ||
    normalizedPlan.public_sample_ready === false ||
    normalizedPlan.high_value_outreach_ready === false ||
    normalizedPlan.requires_code_patch === true ||
    normalizedPlan.requires_regeneration === true ||
    String(director?.overall_director_decision || "") !== "no_missed_issue_detected" ||
    String(contract?.contract_status || "") !== "pass";

  if (!shouldShow) return null;

  const display = normalizeFixQueueDisplay({
    top_action_code: normalizedPlan.top_action_code,
    top_action_title: normalizedPlan.top_action_title,
    recommended_next_step: normalizedPlan.recommended_next_step,
    owner_area: normalizedPlan.owner_area,
    highest_severity: highestSeverity,
    delivery_gate_status: deliveryGate?.delivery_gate_status || null,
    reason_code: deliveryGate?.reason_code || null,
    source_code: normalizedPlan.top_action_code || null,
  });

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
    delivery_gate_status: deliveryGate?.delivery_gate_status || null,
    reason_code: deliveryGate?.reason_code || null,
    display_title: display.display_title,
    display_reason: display.display_reason,
    display_next_step: display.display_next_step,
    display_category: display.display_category,
    display_priority: display.display_priority,
  };
}

function buildFixQueueDetails({
  job = null,
  report = null,
  files = [],
  artifacts = [],
  fixQueueRow = null,
} = {}) {
  const qaActionPlanArtifact = artifacts.find((row) => row?.type === 'qa_action_plan') || null;
  const reportContractArtifact = artifacts.find((row) => row?.type === 'report_contract_qa') || null;
  const directorArtifact = artifacts.find((row) => row?.type === 'qa_director_review') || null;
  const deliveryGateArtifact = artifacts.find((row) => row?.type === 'delivery_gate_decision') || null;
  const flagsArtifact = artifacts.find((row) => row?.type === 'report_qa_flags') || null;
  const workerEvents = artifacts
    .filter((row) => row?.type === 'worker_event' || row?.type === 'status_transition')
    .slice(0, 12)
    .map((row) => ({
      type: row?.type || null,
      bucket: row?.bucket || null,
      created_at: row?.created_at || null,
      summary: compactArtifactSummary(row),
    }));
  const internalArtifacts = artifacts
    .filter((row) => !['worker_event', 'status_transition'].includes(String(row?.type || '')))
    .slice(0, 12)
    .map((row) => ({
      type: row?.type || null,
      bucket: row?.bucket || null,
      created_at: row?.created_at || null,
      summary: compactArtifactSummary(row),
    }));

  const qaActionPlan = qaActionPlanArtifact?.payload || {};
  const reportContract = reportContractArtifact?.payload || {};
  const director = directorArtifact?.payload || {};
  const deliveryGate = deliveryGateArtifact?.payload || {};
  const flags = flagsArtifact?.payload || {};

  return {
    job: job
      ? {
          id: job.id || null,
          property_name: job.property_name || null,
          report_type: job.report_type || null,
          status: job.status || null,
          created_at: job.created_at || null,
          started_at: job.started_at || null,
          failed_at: job.failed_at || null,
          error_code: job.error_code || null,
          error_message: job.error_message || null,
        }
      : null,
    report: report
      ? {
          id: report.id || null,
          storage_path: report.storage_path || null,
          signed_url: report.signed_url || null,
          created_at: report.created_at || null,
        }
      : null,
    files: (files || []).map((file) => ({
      id: file?.id || null,
      doc_type: file?.doc_type || null,
      original_filename: file?.original_filename || null,
      parse_status: file?.parse_status || null,
      parse_error: file?.parse_error || null,
      created_at: file?.created_at || null,
    })),
    qa: {
      delivery_gate_status: deliveryGate?.delivery_gate_status || fixQueueRow?.delivery_gate_status || null,
      reason_code: deliveryGate?.reason_code || fixQueueRow?.reason_code || null,
      top_action_code: qaActionPlan?.top_action_code || fixQueueRow?.top_action_code || null,
      top_action_title: qaActionPlan?.top_action_title || fixQueueRow?.top_action_title || null,
      owner_area: qaActionPlan?.owner_area || fixQueueRow?.owner_area || null,
      recommended_next_step: qaActionPlan?.recommended_next_step || fixQueueRow?.recommended_next_step || null,
      customer_delivery_ready: Boolean(qaActionPlan?.customer_delivery_ready ?? fixQueueRow?.customer_delivery_ready),
      public_sample_ready: Boolean(qaActionPlan?.public_sample_ready ?? fixQueueRow?.public_sample_ready),
      high_value_outreach_ready: Boolean(qaActionPlan?.high_value_outreach_ready ?? fixQueueRow?.high_value_outreach_ready),
      highest_severity: qaActionPlan?.highest_severity || fixQueueRow?.highest_severity || null,
      contract_status: reportContract?.contract_status || null,
      director_decision: director?.overall_director_decision || null,
      report_qa_flags_severity: flags?.severity || null,
      delivery_recommendation: qaActionPlan?.delivery_recommendation || null,
      prioritized_actions: Array.isArray(qaActionPlan?.prioritized_actions)
        ? qaActionPlan.prioritized_actions.slice(0, 10).map(compactAction)
        : [],
      contract_violations: Array.isArray(reportContract?.violations)
        ? reportContract.violations.slice(0, 10).map((violation) => ({
            code: violation?.code || null,
            title: violation?.title || null,
            severity: violation?.severity || null,
            category: violation?.category || null,
            message: violation?.message || null,
          }))
        : [],
      director_findings: Array.isArray(director?.findings)
        ? director.findings.slice(0, 10).map(compactFinding)
        : [],
    },
    artifacts: internalArtifacts,
    worker_events: workerEvents,
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

    const includeFixQueue = String(req.query?.include_fix_queue || "").toLowerCase() === "true";
    const includeFixQueueDetails = String(req.query?.include_fix_queue_details || "").toLowerCase() === "true";
    const fixQueueJobId = String(req.query?.fix_queue_job_id || req.query?.job_id || "").trim();
    const includeUsers = String(req.query?.include_users || "").toLowerCase() === "true";
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

    let users = [];
    let usersError = false;
    let purchasesError = false;
    if (includeUsers) {
      const [profilesResult, purchasesResult] = await Promise.all([
        supabaseAdmin.rpc('get_all_profiles_for_admin'),
        supabaseAdmin.rpc('get_all_purchases_for_admin'),
      ]);

      usersError = Boolean(profilesResult.error);
      purchasesError = Boolean(purchasesResult.error);

      const creditMap = {};
      if (!purchasesResult.error) {
        for (const row of purchasesResult.data || []) {
          if (!row || row.consumed_at) continue;
          if (!row.user_id) continue;
          if (!creditMap[row.user_id]) creditMap[row.user_id] = { screening: 0, underwriting: 0 };
          if (row.product_type === 'screening') creditMap[row.user_id].screening += 1;
          else if (row.product_type === 'underwriting') creditMap[row.user_id].underwriting += 1;
        }
      }

      users = profilesResult.error
        ? []
        : (profilesResult.data || []).map((u) => ({
            id: u.id || null,
            full_name: u.full_name || null,
            role: u.role || null,
            screening_credits: creditMap[u.id]?.screening ?? 0,
            underwriting_credits: creditMap[u.id]?.underwriting ?? 0,
          }));
    }

    let fixQueue = [];
    let fixQueueArtifactsErr = false;
    if (includeFixQueue) {
      const { data: fixQueueArtifacts, error: artifactsErr } = await supabaseAdmin
        .from('analysis_artifacts')
        .select('job_id, type, payload, created_at')
        .in('type', ['qa_action_plan', 'report_contract_qa', 'qa_director_review', 'report_qa_flags', 'delivery_gate_decision'])
        .order('created_at', { ascending: false })
        .limit(25);

      fixQueueArtifactsErr = Boolean(artifactsErr);

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

      fixQueue = fixQueueJobIds
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
    }

    let fixQueueDetails = null;
    let fixQueueDetailsError = false;
    if (includeFixQueueDetails) {
      if (!fixQueueJobId) {
        fixQueueDetailsError = true;
      } else {
        const { data: detailJob, error: detailJobErr } = await supabaseAdmin
          .from('analysis_jobs')
          .select('id, user_id, property_name, report_type, status, created_at, started_at, failed_at, error_code, error_message')
          .eq('id', fixQueueJobId)
          .maybeSingle();

        if (detailJobErr || !detailJob?.id) {
          fixQueueDetailsError = true;
        } else {
          const { data: detailFiles } = await supabaseAdmin
            .from('analysis_job_files')
            .select('id, doc_type, original_filename, parse_status, parse_error, created_at')
            .eq('job_id', fixQueueJobId)
            .order('created_at', { ascending: false })
            .limit(20);

          const { data: detailArtifacts } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('type, bucket, created_at, payload')
            .eq('job_id', fixQueueJobId)
            .in('type', ['qa_action_plan', 'report_contract_qa', 'qa_director_review', 'report_qa_flags', 'delivery_gate_decision', 'worker_event', 'status_transition'])
            .order('created_at', { ascending: false })
            .limit(20);

          fixQueueDetails = buildFixQueueDetails({
            job: detailJob,
            files: detailFiles || [],
            artifacts: detailArtifacts || [],
            fixQueueRow: fixQueue.find((row) => row.job_id === detailJob.id) || null,
          });
        }
      }
    }

    return res.status(200).json({
      counts_by_status: countsByStatus,
      oldest_queued_at: oldestQueuedErr ? null : oldestQueued?.created_at || null,
      latest_failed_at: latestFailedErr ? null : latestFailed?.created_at || null,
      recent_jobs: recentJobsErr ? [] : recentJobs || [],
      issues: issuesErr ? [] : issuesWithUrls || [],
      users: includeUsers ? users : [],
      users_error: includeUsers ? usersError : false,
      purchases_error: includeUsers ? purchasesError : false,
      fix_queue: includeFixQueue && !fixQueueArtifactsErr ? fixQueue : [],
      fix_queue_deferred: !includeFixQueue,
      issues_error: Boolean(issuesErr),
      fix_queue_error: includeFixQueue ? Boolean(fixQueueArtifactsErr) : false,
      fix_queue_details: includeFixQueueDetails ? fixQueueDetails : null,
      fix_queue_details_error: includeFixQueueDetails ? fixQueueDetailsError : false,
    });
  } catch (err) {
    console.error('queue-metrics error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
