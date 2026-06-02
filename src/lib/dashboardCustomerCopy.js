const CORE_VALID_NEUTRAL_FAILURE_MESSAGE =
  'Report could not be generated.\n\nInvestorIQ encountered a processing issue while preparing this report. Please try again or contact support if it repeats.';

const CORE_INVALID_DOCUMENT_FAILURE_MESSAGE =
  'Report could not be generated.\n\nInvestorIQ could not produce a defensible report from the required uploaded documents. Your report credit has been restored, and you may start a new report with corrected source documents.';

const FAIL_CLOSED_REASON_OR_ERROR_PATTERN =
  /(user_needs_documents|missing_required_source_data|missing_structured_financials|missing_structured_financial_artifacts|missing_required_t12|missing_required_rent_roll|t12_unusable|rent_roll_unusable|missing_required_documents)/i;

function isCoreValidRequiredCoverageState(value) {
  return value === true || String(value || '').toLowerCase() === 'true';
}

function isDocumentBlameMessage(message) {
  return /source package could not be verified|rent roll could not be verified|additional required documents|needs documents|upload more documents|clearer or more complete documents|could not be verified as usable|uploaded T12|uploaded rent roll|could not be reconciled as a consistent source package/i.test(
    String(message || '')
  );
}

export function normalizeDashboardDocType(value) {
  const dt = String(value || '').toLowerCase().trim();
  if (!dt) return '';
  if (dt === 'supporting' || dt === 'supporting_documents_ui') return 'supporting_documents';
  return dt;
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

export function resolveDoctrineCustomerMessage(job = {}, decision = null) {
  const message = String(decision?.customer_message || '').trim();
  const reason = String(decision?.customer_status_reason_code || '').trim();
  const errorCode = String(job?.error_code || '').trim();
  const statusLabel = normalizeDashboardCustomerStatusLabel(decision?.customer_status_label || null);
  const coreValidRequiredCoverage =
    isCoreValidRequiredCoverageState(decision?.core_valid_required_coverage) ||
    isCoreValidRequiredCoverageState(job?.core_valid_required_coverage);
  const isLegacyFailureState =
    statusLabel === 'failed' ||
    FAIL_CLOSED_REASON_OR_ERROR_PATTERN.test(reason) ||
    FAIL_CLOSED_REASON_OR_ERROR_PATTERN.test(errorCode) ||
    isDocumentBlameMessage(message);

  if (coreValidRequiredCoverage && isLegacyFailureState) {
    return CORE_VALID_NEUTRAL_FAILURE_MESSAGE;
  }
  if (!message) return '';
  if (/under review|internal review|admin review|needs documents|additional required documents/i.test(message)) {
    return CORE_VALID_NEUTRAL_FAILURE_MESSAGE;
  }
  if (FAIL_CLOSED_REASON_OR_ERROR_PATTERN.test(reason) || FAIL_CLOSED_REASON_OR_ERROR_PATTERN.test(errorCode)) {
    return CORE_INVALID_DOCUMENT_FAILURE_MESSAGE;
  }
  if (message && !(coreValidRequiredCoverage && isDocumentBlameMessage(message))) {
    return message;
  }
  if (coreValidRequiredCoverage && message && isDocumentBlameMessage(message)) {
    return CORE_VALID_NEUTRAL_FAILURE_MESSAGE;
  }
  return message;
}

export function resolveDashboardCustomerStatus(job = {}, deliveryGateDecisionPayload = null) {
  const payload = deliveryGateDecisionPayload && typeof deliveryGateDecisionPayload === 'object'
    ? deliveryGateDecisionPayload
    : null;
  const workerPayloadDecision = payload?.deliveryDecisionState || payload?.resolved_delivery_decision || null;
  const directPayloadCanonical =
    payload && typeof payload === 'object' && (
      payload.delivery_gate_status ||
      payload.customer_status_label ||
      payload.customer_message ||
      Object.prototype.hasOwnProperty.call(payload, 'hold_delivery') ||
      Object.prototype.hasOwnProperty.call(payload, 'customer_delivery_allowed')
    )
      ? payload
      : null;
  const latestWorkerPayload = job?.latest_worker_event?.payload && typeof job?.latest_worker_event?.payload === 'object'
    ? job.latest_worker_event.payload
    : null;
  const candidate =
    job?.deliveryDecisionState ||
    job?.delivery_gate_decision?.deliveryDecisionState ||
    job?.delivery_gate_decision?.resolved_delivery_decision ||
    job?.delivery_gate_decision ||
    job?.latest_delivery_gate_decision?.deliveryDecisionState ||
    job?.latest_delivery_gate_decision?.resolved_delivery_decision ||
    latestWorkerPayload?.deliveryDecisionState ||
    latestWorkerPayload?.resolved_delivery_decision ||
    job?.latest_worker_event?.deliveryDecisionState ||
    job?.latest_worker_event?.resolved_delivery_decision ||
    workerPayloadDecision ||
    directPayloadCanonical ||
    null;
  if (candidate && typeof candidate === 'object') {
    return {
      hasCanonicalDeliveryDecision: true,
      delivery_gate_status: candidate.delivery_gate_status || null,
      customer_status_label: normalizeDashboardCustomerStatusLabel(candidate.customer_status_label || null) || null,
      customer_status_reason_code: candidate.customer_status_reason_code || candidate.reason_code || null,
      customer_message: resolveDoctrineCustomerMessage(job, candidate) || null,
      customer_delivery_allowed: candidate.customer_delivery_allowed ?? null,
      hold_delivery: candidate.hold_delivery ?? null,
      credit_restore_required: candidate.credit_restore_required ?? null,
      core_valid_required_coverage: isCoreValidRequiredCoverageState(candidate.core_valid_required_coverage) || isCoreValidRequiredCoverageState(job?.core_valid_required_coverage),
      source: candidate.source === 'canonical_delivery_decision' ? 'canonical_delivery_decision' : 'worker_resolved_delivery_decision',
    };
  }
  return {
    hasCanonicalDeliveryDecision: false,
    delivery_gate_status: job?.delivery_gate_status || null,
    customer_status_label: null,
    customer_status_reason_code: null,
    customer_message: null,
    customer_delivery_allowed: null,
    hold_delivery: null,
    credit_restore_required: null,
    core_valid_required_coverage: isCoreValidRequiredCoverageState(job?.core_valid_required_coverage),
    source: 'legacy_dashboard_fallback',
  };
}

export function getCustomerFacingJobStatus(job, deliveryGateDecisionPayload = null) {
  const decision = resolveDashboardCustomerStatus(job, deliveryGateDecisionPayload);
  if (decision.hasCanonicalDeliveryDecision && decision.customer_status_label) {
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

export function getFailedFileGuidance(files, selectedReportType = null, coreValidRequiredCoverage = false) {
  if (coreValidRequiredCoverage) return '';
  const rows = Array.isArray(files) ? files : [];
  const normalized = rows.map((row) => ({
    original_filename: String(row?.original_filename || '').trim(),
    doc_type: normalizeDashboardDocType(row?.doc_type),
    parse_status: String(row?.parse_status || '').toLowerCase(),
    parse_error: String(row?.parse_error || '').toLowerCase(),
  }));
  const failedCoreFile = ['t12', 'rent_roll']
    .map((docType) => normalized.find((row) => row.doc_type === docType && row.parse_status === 'failed'))
    .find(Boolean);

  if (failedCoreFile?.doc_type === 't12') {
    return `Generation could not be completed because the uploaded T12 / operating statement${failedCoreFile.original_filename ? ` (${failedCoreFile.original_filename})` : ''} could not be verified as usable for this report.\n\nNo report was published, and your report credit has been restored.\n\nPlease start a new report and upload a readable T12 / operating statement that includes income, expenses, and NOI. If you believe your document is complete, contact reports@investoriq.tech.`;
  }
  if (failedCoreFile?.doc_type === 'rent_roll') {
    return `Generation could not be completed because the uploaded rent roll${failedCoreFile.original_filename ? ` (${failedCoreFile.original_filename})` : ''} could not be verified as usable for this report.\n\nNo report was published, and your report credit has been restored.\n\nPlease start a new report and upload a readable rent roll that includes units, occupancy or status, and in-place rents. If you believe your document is complete, contact reports@investoriq.tech.`;
  }

  const hasT12 = normalized.some((row) => row.doc_type === 't12');
  const hasRentRoll = normalized.some((row) => row.doc_type === 'rent_roll');
  const nonCoreFiles = normalized.filter((row) => row.doc_type !== 't12' && row.doc_type !== 'rent_roll');

  if (selectedReportType === 'underwriting' && hasT12 && hasRentRoll && nonCoreFiles.length === 0) {
    return `Generation could not be completed because Full Underwriting requires at least one usable supporting document in addition to the T12 and rent roll.\n\nNo report was published, and your report credit has been restored.\n\nPlease start a new Full Underwriting report with a usable supporting document, such as debt, purchase assumptions, appraisal, renovation, property tax, insurance, or related deal support. If you believe your document is complete, contact reports@investoriq.tech.`;
  }

  if (hasT12 && hasRentRoll) {
    return `Generation could not be completed because the uploaded T12 and rent roll could not be reconciled as a consistent source package.\n\nNo report was published, and your report credit has been restored.\n\nPlease start a new report with documents for the same property and reporting period where possible. If you believe the documents are correct, contact reports@investoriq.tech.`;
  }

  return `Generation could not be completed because the required T12 / operating statement and rent roll documents could not be verified as usable for this report.\n\nNo report was published, and your report credit has been restored.\n\nPlease start a new report with clearer or more complete documents. If you believe the document is complete, contact reports@investoriq.tech.`;
}
