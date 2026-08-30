import {
  isInvestorIQAdmin,
  resolveAuthenticatedResourceOwnership,
} from './authenticated-actor.js';

const FAILURE_EVENTS = new Set([
  'missing_structured_financials',
  'missing_required_documents',
  'textract_failed',
  'rent_roll_fallback_failed',
  't12_fallback_failed',
]);

const SAFE_WORKER_EVENTS = new Set([
  ...FAILURE_EVENTS,
  'delivery_gate_decision',
  'entitlement_restored',
]);

function parseCsv(value, max = 50) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, max);
}

function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(Math.floor(parsed), 100);
}

function safeDeliveryDecision(payload = {}) {
  const nested = payload?.deliveryDecisionState;
  const candidate = nested && typeof nested === 'object'
    ? nested
    : payload && typeof payload === 'object' ? payload : null;
  if (!candidate || candidate.source !== 'canonical_delivery_decision') return null;
  return {
    source: 'canonical_delivery_decision',
    action: candidate.action ?? null,
    delivery_gate_status: candidate.delivery_gate_status ?? null,
    customer_status_label: candidate.customer_status_label ?? null,
    customer_status_reason_code: candidate.customer_status_reason_code ?? null,
    customer_message: candidate.customer_message ?? null,
    customer_delivery_allowed: candidate.customer_delivery_allowed ?? null,
    hold_delivery: candidate.hold_delivery ?? null,
    credit_restore_required: candidate.credit_restore_required ?? null,
    core_valid_required_coverage: candidate.core_valid_required_coverage ?? null,
  };
}

function sanitizeWorkerEvent(row) {
  const event = String(row?.payload?.event || '').trim();
  if (!SAFE_WORKER_EVENTS.has(event)) return null;
  if (FAILURE_EVENTS.has(event) || event === 'entitlement_restored') {
    return { job_id: row.job_id, type: 'worker_event', payload: { event }, created_at: row.created_at };
  }
  if (event === 'delivery_gate_decision') {
    const deliveryDecisionState = safeDeliveryDecision(row.payload || {});
    if (!deliveryDecisionState) return null;
    return {
      job_id: row.job_id,
      type: 'worker_event',
      payload: { event: 'delivery_gate_decision', deliveryDecisionState },
      created_at: row.created_at,
    };
  }
  return null;
}

function sanitizeRentRoll(row) {
  const payload = row?.payload || {};
  let provided = null;
  if (Array.isArray(payload.units)) provided = payload.units.length;
  else if (typeof payload.unit_count === 'number') provided = payload.unit_count;
  else if (typeof payload.total_units_provided === 'number') provided = payload.total_units_provided;
  let total = null;
  if (typeof payload.total_units === 'number') total = payload.total_units;
  else if (typeof payload.totalUnits === 'number') total = payload.totalUnits;
  else if (typeof payload.property_total_units === 'number') total = payload.property_total_units;
  return {
    job_id: row.job_id,
    type: 'rent_roll_parsed',
    payload: { unit_count: provided, total_units: total },
    created_at: row.created_at,
  };
}

async function handleCustomerJobStatus({ req, res, auth, supabase }) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const requestedJobIds = parseCsv(req.query?.job_ids || req.query?.job_id);
  if (!requestedJobIds.length) return res.status(200).json({ rows: [] });
  const requestedType = String(req.query?.type || '').trim();
  if (!['worker_event', 'rent_roll_parsed'].includes(requestedType)) return res.status(200).json({ rows: [] });
  const requestedEvents = new Set(parseCsv(req.query?.events || req.query?.event, 20));
  const limit = clampLimit(req.query?.limit);

  const { data: ownedJobs, error: ownedJobsError } = await supabase
    .from('analysis_jobs').select('id').eq('user_id', auth.actor.id).in('id', requestedJobIds);
  if (ownedJobsError) return res.status(500).json({ error: 'STATUS_LOOKUP_FAILED' });
  const ownedJobIds = (ownedJobs || []).map((row) => row.id);
  if (!ownedJobIds.length) return res.status(200).json({ rows: [] });

  let query = supabase.from('analysis_artifacts')
    .select('job_id, type, payload, created_at')
    .in('job_id', ownedJobIds)
    .eq('type', requestedType)
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data: rows, error: rowsError } = await query;
  if (rowsError) return res.status(500).json({ error: 'STATUS_LOOKUP_FAILED' });

  const safeRows = [];
  for (const row of rows || []) {
    if (requestedType === 'worker_event') {
      const event = String(row?.payload?.event || '').trim();
      if (requestedEvents.size && !requestedEvents.has(event)) continue;
      const safe = sanitizeWorkerEvent(row);
      if (safe) safeRows.push(safe);
    } else {
      safeRows.push(sanitizeRentRoll(row));
    }
  }
  return res.status(200).json({ rows: safeRows });
}

function uniqueIds(rows = []) {
  return [...new Set(rows.map((row) => String(row?.id || '').trim()).filter(Boolean))];
}

async function handleCustomerReportRemoval({ req, res, auth, supabase }) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const reportId = String(req.body?.report_id || req.body?.reportId || '').trim();
  if (!reportId) return res.status(400).json({ error: 'REPORT_ID_REQUIRED' });

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, user_id, revision_family_key, revision_root_report_id')
    .eq('id', reportId).maybeSingle();
  if (reportError) return res.status(500).json({ error: 'REPORT_LOOKUP_FAILED' });
  if (!report) return res.status(404).json({ error: 'REPORT_NOT_FOUND' });

  const ownership = resolveAuthenticatedResourceOwnership({
    auth, resourceOwnerId: report.user_id, allowAdminBypass: true, resourceType: 'report',
  });
  if (!ownership.ok) return res.status(ownership.status).json({ error: ownership.error });

  let familyQuery = supabase.from('reports')
    .select('id, user_id, revision_family_key, revision_root_report_id')
    .eq('user_id', report.user_id);
  if (report.revision_family_key) familyQuery = familyQuery.eq('revision_family_key', report.revision_family_key);
  else if (report.revision_root_report_id) {
    const rootId = report.revision_root_report_id;
    familyQuery = familyQuery.or(`id.eq.${rootId},revision_root_report_id.eq.${rootId}`);
  } else familyQuery = familyQuery.eq('id', report.id);

  const { data: familyRows, error: familyError } = await familyQuery;
  if (familyError) return res.status(500).json({ error: 'REPORT_FAMILY_LOOKUP_FAILED' });
  const reportIds = uniqueIds(familyRows?.length ? familyRows : [report]);
  const removedBy = isInvestorIQAdmin(auth.actor) ? 'admin' : 'customer';
  const removalRows = reportIds.map((id) => ({
    report_id: id,
    user_id: report.user_id,
    removed_by_actor_id: auth.actor.id,
    removed_by_role: removedBy,
    removed_at: new Date().toISOString(),
  }));
  const { error: removalError } = await supabase
    .from('customer_report_removals').upsert(removalRows, { onConflict: 'report_id' });
  if (removalError) return res.status(500).json({ error: 'REPORT_REMOVAL_FAILED' });
  return res.status(200).json({
    success: true,
    removal_mode: 'retained_hidden',
    reports: reportIds.map((id) => ({ id })),
  });
}

async function handleCustomerReportDownload({ req, res, auth, supabase }) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const storagePath = String(req.body?.storage_path || req.body?.storagePath || '').trim();
  if (!storagePath) return res.status(400).json({ error: 'STORAGE_PATH_REQUIRED' });

  const { data: report, error: reportError } = await supabase
    .from('customer_published_report_projection')
    .select('id, user_id, storage_path, publication_receipt_id, publication_job_id, publication_state')
    .eq('user_id', auth.actor.id)
    .eq('storage_path', storagePath)
    .eq('publication_state', 'published')
    .maybeSingle();
  if (reportError) return res.status(500).json({ error: 'DOWNLOAD_REPORT_LOOKUP_FAILED' });
  if (!report) return res.status(404).json({ error: 'CURRENT_REPORT_NOT_FOUND' });

  const { data, error } = await supabase.storage.from('generated_reports').createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) return res.status(409).json({ error: 'DOWNLOAD_ARTIFACT_UNAVAILABLE' });

  return res.status(200).json({
    success: true,
    signedUrl: data.signedUrl,
    expiresIn: 300,
    report_id: report.id,
    publication_receipt_id: report.publication_receipt_id,
    publication_job_id: report.publication_job_id,
  });
}

export async function handleCustomerBoundaryRoute({ req, res, auth, supabase }) {
  const route = String(req.query?.customer_route || '').trim();
  if (route === 'job_status') return handleCustomerJobStatus({ req, res, auth, supabase });
  if (route === 'report_removal') return handleCustomerReportRemoval({ req, res, auth, supabase });
  if (route === 'report_download') return handleCustomerReportDownload({ req, res, auth, supabase });
  return null;
}
