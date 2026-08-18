import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedActor } from './_lib/authenticated-actor.js';

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
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
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
    : payload && typeof payload === 'object'
      ? payload
      : null;

  if (!candidate || candidate.source !== 'canonical_delivery_decision') return null;

  return {
    source: 'canonical_delivery_decision',
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
    return {
      job_id: row.job_id,
      type: 'worker_event',
      payload: { event },
      created_at: row.created_at,
    };
  }

  if (event === 'delivery_gate_decision') {
    const deliveryDecisionState = safeDeliveryDecision(row.payload || {});
    if (!deliveryDecisionState) return null;
    return {
      job_id: row.job_id,
      type: 'worker_event',
      payload: {
        event: 'delivery_gate_decision',
        deliveryDecisionState,
      },
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
    payload: {
      unit_count: provided,
      total_units: total,
    },
    created_at: row.created_at,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = await resolveAuthenticatedActor(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'SERVER_MISCONFIGURED' });
    }

    const requestedJobIds = parseCsv(req.query?.job_ids || req.query?.job_id);
    if (requestedJobIds.length === 0) {
      return res.status(200).json({ rows: [] });
    }

    const requestedType = String(req.query?.type || '').trim();
    if (!['worker_event', 'rent_roll_parsed'].includes(requestedType)) {
      return res.status(200).json({ rows: [] });
    }

    const requestedEvents = new Set(parseCsv(req.query?.events || req.query?.event, 20));
    const limit = clampLimit(req.query?.limit);
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: ownedJobs, error: ownedJobsError } = await supabase
      .from('analysis_jobs')
      .select('id')
      .eq('user_id', auth.actor.id)
      .in('id', requestedJobIds);

    if (ownedJobsError) {
      console.error('customer-job-status owned job lookup failed:', ownedJobsError);
      return res.status(500).json({ error: 'STATUS_LOOKUP_FAILED' });
    }

    const ownedJobIds = (ownedJobs || []).map((row) => row.id);
    if (ownedJobIds.length === 0) {
      return res.status(200).json({ rows: [] });
    }

    let query = supabase
      .from('analysis_artifacts')
      .select('job_id, type, payload, created_at')
      .in('job_id', ownedJobIds)
      .eq('type', requestedType)
      .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data: rows, error: rowsError } = await query;
    if (rowsError) {
      console.error('customer-job-status artifact lookup failed:', rowsError);
      return res.status(500).json({ error: 'STATUS_LOOKUP_FAILED' });
    }

    const safeRows = [];
    for (const row of rows || []) {
      if (requestedType === 'worker_event') {
        const event = String(row?.payload?.event || '').trim();
        if (requestedEvents.size > 0 && !requestedEvents.has(event)) continue;
        const safe = sanitizeWorkerEvent(row);
        if (safe) safeRows.push(safe);
        continue;
      }

      if (requestedType === 'rent_roll_parsed') {
        safeRows.push(sanitizeRentRoll(row));
      }
    }

    return res.status(200).json({ rows: safeRows });
  } catch (error) {
    console.error('customer-job-status error:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
