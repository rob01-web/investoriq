import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  buildReportQualityIncidentProjection,
  buildReportQualityIncidentRollup,
  extractCanonicalDeliveryDecisionState,
} from './report-quality-incident-projection.js';

const ALLOWED_ARTIFACT_TYPES = Object.freeze([
  'report_quality_manifest',
  'delivery_gate_decision',
  'quality_incident_action',
]);

const ALLOWED_ACTIONS = new Set([
  'mark_for_review',
  'mark_customer_contacted',
  'request_free_corrected_rerun',
  'request_credit_restoration_review',
  'record_replacement_source_required',
  'record_account_credit_review',
  'record_refund_review',
  'attach_corrected_report_reference',
  'close_incident',
  'link_regression_case',
]);

function text(value) {
  return String(value ?? '').trim();
}

function clamp(value, minimum, maximum, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(numeric)));
}

function latestByJob(rows, predicate = () => true) {
  const byJob = new Map();
  for (const row of rows || []) {
    if (!row?.job_id || !predicate(row)) continue;
    if (!byJob.has(row.job_id)) byJob.set(row.job_id, row);
  }
  return byJob;
}

function actionReceiptsByJob(rows) {
  const byJob = new Map();
  for (const row of rows || []) {
    if (row?.type !== 'quality_incident_action') continue;
    if (row?.payload?.source !== 'quality_incident_action_receipt') continue;
    const existing = byJob.get(row.job_id) || [];
    existing.push({
      id: row.id || null,
      createdAt: row.created_at || null,
      action: row.payload.action || null,
      note: row.payload.note || null,
      reference: row.payload.reference || null,
      actor: row.payload.actor || null,
      authorityCreating: false,
    });
    byJob.set(row.job_id, existing);
  }
  return byJob;
}

async function authenticate(req) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const adminRunKey = text(process.env.ADMIN_RUN_KEY);
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: { status: 500, message: 'Server misconfigured.' } };
  }
  if (!adminRunKey) return { error: { status: 500, message: 'Unauthorized' } };
  const authorization = text(req.headers.authorization);
  const token = authorization.startsWith('Bearer ')
    ? text(authorization.slice('Bearer '.length))
    : '';
  if (!token || token !== adminRunKey) {
    return { error: { status: 401, message: 'Unauthorized' } };
  }
  return {
    supabaseAdmin: createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    }),
  };
}

async function handlePost(req, res, supabaseAdmin) {
  const jobId = text(req.body?.job_id);
  const action = text(req.body?.action).toLowerCase();
  const note = text(req.body?.note).slice(0, 1000) || null;
  const reference = text(req.body?.reference).slice(0, 300) || null;
  if (!jobId || !ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ ok: false, error: 'Invalid incident action.' });
  }
  if (['link_regression_case', 'attach_corrected_report_reference'].includes(action) && !reference) {
    return res.status(400).json({ ok: false, error: 'A reference is required for this action.' });
  }

  const { data: manifestRow, error: manifestError } = await supabaseAdmin
    .from('analysis_artifacts')
    .select('id, user_id, payload')
    .eq('job_id', jobId)
    .eq('type', 'report_quality_manifest')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (manifestError) return res.status(500).json({ ok: false, error: manifestError.message });
  if (manifestRow?.payload?.source !== 'canonical_report_quality_manifest') {
    return res.status(409).json({
      ok: false,
      error: 'A finalized Report Quality Manifest is required before an incident action can be recorded.',
    });
  }

  const now = new Date().toISOString();
  const receipt = {
    source: 'quality_incident_action_receipt',
    version: 1,
    jobId,
    manifestArtifactId: manifestRow.id,
    action,
    note,
    reference,
    actor: 'authorized_admin',
    recordedAt: now,
    authority: {
      authorityCreating: false,
      sourceTruthChanged: false,
      deliveryChanged: false,
      publicationChanged: false,
      creditMutationPerformed: false,
      financialMutationPerformed: false,
    },
  };
  const objectPath = `analysis_jobs/${jobId}/quality_incident_action/${action}/${now.replace(/:/g, '-')}-${randomUUID()}.json`;
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('analysis_artifacts')
    .insert([{
      job_id: jobId,
      user_id: manifestRow.user_id || null,
      type: 'quality_incident_action',
      bucket: 'internal',
      object_path: objectPath,
      payload: receipt,
    }])
    .select('id')
    .single();
  if (insertError) return res.status(500).json({ ok: false, error: insertError.message });
  return res.status(200).json({ ok: true, action_receipt_id: inserted?.id || null, receipt });
}

async function handleGet(req, res, supabaseAdmin) {
  const sinceDays = clamp(req.query?.since_days, 1, 365, 90);
  const page = clamp(req.query?.page, 1, 10000, 1);
  const limit = clamp(req.query?.limit, 1, 100, 25);
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await supabaseAdmin
    .from('analysis_artifacts')
    .select('id, job_id, user_id, type, payload, created_at')
    .in('type', ALLOWED_ARTIFACT_TYPES)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2500);
  if (error) return res.status(500).json({ ok: false, error: error.message });

  const manifestByJob = latestByJob(rows, (row) =>
    row.type === 'report_quality_manifest' &&
    row.payload?.source === 'canonical_report_quality_manifest'
  );
  const deliveryByJob = latestByJob(rows, (row) =>
    row.type === 'delivery_gate_decision' &&
    Boolean(extractCanonicalDeliveryDecisionState(row.payload))
  );
  const actionsByJob = actionReceiptsByJob(rows);
  let incidents = [];
  for (const [jobId, manifestRow] of manifestByJob.entries()) {
    try {
      const delivery = extractCanonicalDeliveryDecisionState(deliveryByJob.get(jobId)?.payload) || null;
      incidents.push(buildReportQualityIncidentProjection({
        manifest: manifestRow.payload,
        canonicalDeliveryDecision: delivery,
        actionReceipts: actionsByJob.get(jobId) || [],
      }));
    } catch (projectionError) {
      console.error(`quality-incidents projection failed for job ${jobId}:`, projectionError?.message || projectionError);
    }
  }

  const queueFilter = text(req.query?.queue).toUpperCase();
  const riskFilter = text(req.query?.risk).toUpperCase();
  const search = text(req.query?.search).toLowerCase();
  if (queueFilter) incidents = incidents.filter((incident) => incident.queue === queueFilter);
  if (riskFilter) incidents = incidents.filter((incident) => incident.customerAttentionRisk === riskFilter);
  if (search) {
    incidents = incidents.filter((incident) => [
      incident.jobId,
      incident.reportId,
      incident.propertyName,
      incident.reportFamily,
      ...incident.events.map((entry) => `${entry.code} ${entry.message}`),
    ].join(' ').toLowerCase().includes(search));
  }
  incidents.sort((a, b) => Date.parse(b.finalizedAt || b.generatedAt || 0) - Date.parse(a.finalizedAt || a.generatedAt || 0));

  const summary = buildReportQualityIncidentRollup(incidents);
  const total = incidents.length;
  const start = (page - 1) * limit;
  const pageRows = incidents.slice(start, start + limit);
  const incidentsWithLinks = await Promise.all(pageRows.map(async (incident) => {
    const storagePath = text(incident?.publication?.storagePath);
    if (!storagePath || incident.publication?.state !== 'published') {
      return { ...incident, reportUrl: null };
    }
    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from('generated_reports')
      .createSignedUrl(storagePath, 3600);
    return {
      ...incident,
      reportUrl: signedError ? null : signed?.signedUrl || null,
    };
  }));

  return res.status(200).json({
    ok: true,
    source: 'canonical_report_quality_incident_dashboard',
    authority: {
      inputs: ['canonical_report_quality_manifest', 'canonical_delivery_decision'],
      legacyAliasFallbackAllowed: false,
      reconstructionFromRawArtifactsAllowed: false,
    },
    summary,
    incidents: incidentsWithLinks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await authenticate(req);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  try {
    return req.method === 'POST'
      ? await handlePost(req, res, auth.supabaseAdmin)
      : await handleGet(req, res, auth.supabaseAdmin);
  } catch (err) {
    console.error('quality-incidents error:', err);
    return res.status(500).json({ ok: false, error: 'Quality incident dashboard failed.' });
  }
}
