export const DASHBOARD_NEUTRAL_SYSTEM_FAILURE_MESSAGE =
  'Generation failed before publication. No completed report was published. The issue was logged for review. If a report credit was consumed, it will be restored automatically.';

function isCoreValidRequiredCoverageState(value) {
  return value === true || String(value || '').toLowerCase() === 'true';
}

export function normalizeDashboardDocType(value) {
  const docType = String(value || '').toLowerCase().trim();
  if (!docType) return '';
  if (docType === 'supporting' || docType === 'supporting_documents_ui') return 'supporting_documents';
  return docType;
}

export function normalizeDashboardCustomerStatusLabel(label) {
  const normalized = String(label || '').toLowerCase();
  if (
    normalized === 'under_review' ||
    normalized === 'needs_documents' ||
    normalized === 'publication_held' ||
    normalized === 'admin_review_required'
  ) return 'failed';
  return normalized;
}

export function resolveDoctrineCustomerMessage(_job = {}, decision = null) {
  const message = String(decision?.customer_message || '').trim();
  return message || DASHBOARD_NEUTRAL_SYSTEM_FAILURE_MESSAGE;
}

function canonicalDecisionFrom(value) {
  return value && typeof value === 'object' && value.source === 'canonical_delivery_decision'
    ? value
    : null;
}

export function resolveDashboardCustomerStatus(job = {}, deliveryGateDecisionPayload = null) {
  const payload = deliveryGateDecisionPayload && typeof deliveryGateDecisionPayload === 'object'
    ? deliveryGateDecisionPayload
    : null;
  const latestWorkerPayload = job?.latest_worker_event?.payload && typeof job.latest_worker_event.payload === 'object'
    ? job.latest_worker_event.payload
    : null;
  const candidate = [
    job?.deliveryDecisionState,
    job?.delivery_gate_decision?.deliveryDecisionState,
    job?.latest_delivery_gate_decision?.deliveryDecisionState,
    latestWorkerPayload?.deliveryDecisionState,
    job?.latest_worker_event?.deliveryDecisionState,
    payload?.deliveryDecisionState,
    payload,
  ].map(canonicalDecisionFrom).find(Boolean) || null;

  if (candidate) {
    return {
      hasCanonicalDeliveryDecision: true,
      delivery_gate_status: candidate.delivery_gate_status || null,
      customer_status_label: normalizeDashboardCustomerStatusLabel(candidate.customer_status_label || null) || null,
      customer_status_reason_code: candidate.customer_status_reason_code || null,
      customer_message: resolveDoctrineCustomerMessage(job, candidate),
      customer_delivery_allowed: candidate.customer_delivery_allowed ?? null,
      hold_delivery: candidate.hold_delivery ?? null,
      credit_restore_required: candidate.credit_restore_required ?? null,
      core_valid_required_coverage: isCoreValidRequiredCoverageState(candidate.core_valid_required_coverage),
      source: 'canonical_delivery_decision',
    };
  }

  return {
    hasCanonicalDeliveryDecision: false,
    delivery_gate_status: null,
    customer_status_label: job?.status === 'failed' ? 'failed' : null,
    customer_status_reason_code: null,
    customer_message: job?.status === 'failed' ? DASHBOARD_NEUTRAL_SYSTEM_FAILURE_MESSAGE : null,
    customer_delivery_allowed: null,
    hold_delivery: true,
    credit_restore_required: null,
    core_valid_required_coverage: false,
    source: 'neutral_missing_canonical_decision',
  };
}

export function getCustomerFacingJobStatus(job, deliveryGateDecisionPayload = null) {
  const decision = resolveDashboardCustomerStatus(job, deliveryGateDecisionPayload);
  if (decision.customer_status_label) {
    const normalized = normalizeDashboardCustomerStatusLabel(decision.customer_status_label);
    if (normalized === 'ready') return 'ready';
    if (normalized === 'failed') return 'failed';
    return normalized.replace(/_/g, ' ');
  }
  return String(job?.status || '').toLowerCase();
}

export function formatDashboardCustomerStatusLabel(label, reportType = null) {
  const normalized = normalizeDashboardCustomerStatusLabel(label);
  void reportType;
  if (normalized === 'ready') return 'Ready';
  if (normalized === 'failed') return 'Failed';
  return null;
}
