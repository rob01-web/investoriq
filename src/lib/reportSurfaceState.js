import { resolveDashboardCustomerStatus } from "./dashboardCustomerCopy.js";
import { buildCustomerFailureMessage } from "./jobFailureMessaging.js";
import {
  getReportRevisionDisplayState,
  selectCurrentPublishedReportRevision,
} from "./reportRevisionAuthority.js";

const PROCESSING_JOB_STATUSES = new Set([
  "queued",
  "extracting",
  "underwriting",
  "scoring",
  "rendering",
  "pdf_generating",
  "publishing",
]);

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function isExpiredLease(job = {}, now = new Date()) {
  const expiresAt = Date.parse(job?.worker_lease_expires_at || "");
  return Number.isFinite(expiresAt) && expiresAt > 0 && expiresAt < now.getTime();
}

function hasRestorationEvidence(value) {
  if (!value || typeof value !== "object") return false;
  return (
    value.credit_restored === true ||
    value.entitlement_restored === true ||
    value.restoration_state === "restored" ||
    value.restoration_status === "restored" ||
    value.state === "restored"
  );
}

function resolveSurfaceStateKey({
  report = null,
  job = null,
  revisionState = null,
  jobStatus = "",
  deliveryGateStatus = "",
  customerStatusReasonCode = "",
  hasRestoration = false,
  now = new Date(),
}) {
  const normalizedReportStatus = normalizeStatus(report?.status);
  const normalizedJobStatus = normalizeStatus(jobStatus);
  const normalizedRevisionKind = normalizeStatus(report?.revision_kind);
  const expiredLease = isExpiredLease(job || {}, now);
  const hasProcessingContext = PROCESSING_JOB_STATUSES.has(normalizedJobStatus) || PROCESSING_JOB_STATUSES.has(normalizedReportStatus);
  const isRevisionInProgress = ["corrected", "replacement"].includes(normalizedRevisionKind) && hasProcessingContext;

  if (revisionState?.isCurrent && normalizedReportStatus === "published") return "published_current_revision";
  if (revisionState?.isHistoricalPublished && normalizedReportStatus === "published") return "published_historical_revision";
  if (normalizedReportStatus === "published") return "superseded_revision";
  if (normalizedJobStatus === "dead_letter" || normalizedReportStatus === "dead_letter") return "dead_letter";
  if (["user_needs_documents", "needs_documents"].includes(deliveryGateStatus) || /MISSING_REQUIRED|MISSING_STRUCTURED|RECONCILIATION/i.test(customerStatusReasonCode)) {
    return "customer_needs_documents";
  }
  if (["admin_review_required", "under_review", "publication_held"].includes(deliveryGateStatus) || customerStatusReasonCode === "SYSTEM_CONTRACT_FAILURE") {
    return "admin_review";
  }
  if (["corrected", "replacement"].includes(normalizedRevisionKind)) {
    if (hasProcessingContext) return "corrected_replacement_revision_in_progress";
    if (normalizedJobStatus === "failed" || normalizedReportStatus === "failed") return "corrected_replacement_revision_failed";
  }
  if (expiredLease && hasProcessingContext) return "stale_or_abandoned_worker";
  if (normalizedJobStatus === "failed" || normalizedReportStatus === "failed") {
    return hasRestoration ? "failed_with_entitlement_restored" : "failed_with_restoration_pending";
  }
  if (isRevisionInProgress) return "corrected_replacement_revision_in_progress";
  if (normalizedJobStatus === "queued" || normalizedReportStatus === "queued") return "queued";
  if (hasProcessingContext) return "actively_processing";
  if (["corrected", "replacement"].includes(normalizedRevisionKind)) return "corrected_replacement_revision_in_progress";
  return "unknown";
}

function labelForStateKey(stateKey) {
  switch (stateKey) {
    case "published_current_revision":
      return "Current published revision";
    case "published_historical_revision":
    case "superseded_revision":
      return "Historical published revision";
    case "queued":
      return "Queued";
    case "actively_processing":
      return "Processing";
    case "admin_review":
      return "Admin review";
    case "customer_needs_documents":
      return "Needs documents";
    case "failed_with_entitlement_restored":
      return "Failed";
    case "failed_with_restoration_pending":
      return "Failed";
    case "dead_letter":
      return "Dead letter";
    case "corrected_replacement_revision_in_progress":
      return "Revision in progress";
    case "corrected_replacement_revision_failed":
      return "Revision failed";
    case "stale_or_abandoned_worker":
      return "Stale worker";
    default:
      return "Unknown";
  }
}

function customerMessageForState({
  stateKey,
  report = null,
  job = null,
  deliveryDecision = null,
  hasRestoration = false,
}) {
  if (stateKey === "published_current_revision") return "Report complete. Available below.";
  if (stateKey === "published_historical_revision" || stateKey === "superseded_revision") {
    return "Historical published report available below.";
  }
  if (stateKey === "failed_with_entitlement_restored") {
    return buildCustomerFailureMessage(job || report || {}, {
      creditRestored: true,
      coreValidRequiredCoverage: deliveryDecision?.core_valid_required_coverage === true,
    }).body;
  }
  if (stateKey === "failed_with_restoration_pending") {
    return buildCustomerFailureMessage(job || report || {}, {
      creditRestored: false,
      coreValidRequiredCoverage: deliveryDecision?.core_valid_required_coverage === true,
    }).body;
  }
  if (stateKey === "customer_needs_documents") {
    return deliveryDecision?.customer_message || buildCustomerFailureMessage(job || report || {}, {
      creditRestored: false,
      coreValidRequiredCoverage: false,
    }).body;
  }
  if (stateKey === "admin_review") return "Generation paused for internal review.";
  if (stateKey === "dead_letter") return "Generation paused before publication. No completed report was published.";
  if (stateKey === "queued") return "Report generation has been queued.";
  if (stateKey === "actively_processing") return "Report generation is in progress.";
  if (stateKey === "corrected_replacement_revision_in_progress") return "A corrected report revision is in progress.";
  if (stateKey === "corrected_replacement_revision_failed") return "A corrected report revision did not complete.";
  if (stateKey === "stale_or_abandoned_worker") return "Generation paused before publication. No completed report was published.";
  return hasRestoration ? "Report delivery is being restored." : "Report state is not yet finalized.";
}

function adminDetailForState({
  stateKey,
  revisionState = null,
  job = null,
  deliveryDecision = null,
  hasRestoration = false,
}) {
  const reasonCode = deliveryDecision?.customer_status_reason_code || job?.error_code || job?.failure_reason || null;
  if (stateKey === "published_current_revision") return "Authoritative current downloadable revision.";
  if (stateKey === "published_historical_revision" || stateKey === "superseded_revision") return "Published historical revision retained for auditability.";
  if (stateKey === "failed_with_entitlement_restored") return "Failed revision with authoritative restoration evidence.";
  if (stateKey === "failed_with_restoration_pending") return "Failed revision awaiting restoration evidence.";
  if (stateKey === "customer_needs_documents") return reasonCode ? `Customer needs documents: ${reasonCode}` : "Customer needs documents.";
  if (stateKey === "admin_review") return reasonCode ? `Internal review required: ${reasonCode}` : "Internal review required.";
  if (stateKey === "dead_letter") return "Dead-letter terminal state.";
  if (stateKey === "corrected_replacement_revision_in_progress") {
    return revisionState?.revisionKind ? `${revisionState.revisionKind} revision in progress.` : "Revision in progress.";
  }
  if (stateKey === "corrected_replacement_revision_failed") {
    return revisionState?.revisionKind ? `${revisionState.revisionKind} revision failed.` : "Revision failed.";
  }
  if (stateKey === "stale_or_abandoned_worker") return "Stale or abandoned worker state.";
  if (stateKey === "queued") return "Queued for processing.";
  if (stateKey === "actively_processing") return "Actively processing.";
  return hasRestoration ? "Restoration evidence present." : "State unresolved.";
}

export function resolveReportSurfaceState({
  report = null,
  reports = [],
  currentPublishedReport = null,
  job = null,
  deliveryDecision = null,
  creditRestored = false,
  restorationEvidence = null,
  now = new Date(),
} = {}) {
  const revisionFamily = Array.isArray(reports) && reports.length > 0 ? reports : (report ? [report] : []);
  const currentRevision = currentPublishedReport || selectCurrentPublishedReportRevision(revisionFamily);
  const revisionState = getReportRevisionDisplayState(report || currentRevision || {}, currentRevision);
  const normalizedDeliveryDecision = resolveDashboardCustomerStatus(job || report || {}, deliveryDecision);
  const hasRestoration = creditRestored === true || hasRestorationEvidence(restorationEvidence) || hasRestorationEvidence(job?.credit_restoration_state) || hasRestorationEvidence(job?.entitlement_restoration_state);
  const stateKey = resolveSurfaceStateKey({
    report,
    job,
    revisionState,
    jobStatus: job?.status || report?.status || "",
    deliveryGateStatus: normalizedDeliveryDecision?.delivery_gate_status || "",
    customerStatusReasonCode: normalizedDeliveryDecision?.customer_status_reason_code || "",
    hasRestoration,
    now,
  });

  return {
    stateKey,
    stateLabel: labelForStateKey(stateKey),
    revisionState,
    currentPublishedReport: currentRevision,
    customerStatusLabel: normalizedDeliveryDecision?.customer_status_label || (stateKey === "published_current_revision" || stateKey === "published_historical_revision" || stateKey === "superseded_revision" ? "ready" : null),
    customerStatusReasonCode: normalizedDeliveryDecision?.customer_status_reason_code || null,
    customerMessage: customerMessageForState({
      stateKey,
      report,
      job,
      deliveryDecision: normalizedDeliveryDecision,
      hasRestoration,
    }),
    customerDownloadLabel: revisionState.downloadLabel,
    adminStatusLabel: labelForStateKey(stateKey),
    adminDetail: adminDetailForState({
      stateKey,
      revisionState,
      job,
      deliveryDecision: normalizedDeliveryDecision,
      hasRestoration,
    }),
    adminReasonCode: normalizedDeliveryDecision?.customer_status_reason_code || job?.error_code || job?.failure_reason || null,
    isCurrentRevision: revisionState.isCurrent,
    isHistoricalRevision: revisionState.isHistoricalPublished,
    isDownloadable: Boolean(report?.storage_path) && (revisionState.isCurrent || revisionState.isHistoricalPublished || stateKey === "published_historical_revision" || stateKey === "superseded_revision"),
  };
}
