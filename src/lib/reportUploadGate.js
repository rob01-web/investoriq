import { normalizeDashboardDocType } from './dashboardCustomerCopy.js';

const CORE_DOC_TYPES = new Set(['rent_roll', 't12', 't12_or_operating_statement']);

function normalizeUploadedDocType(value) {
  return normalizeDashboardDocType(value);
}

function isCoreDocType(docType) {
  const normalized = normalizeUploadedDocType(docType);
  return CORE_DOC_TYPES.has(normalized);
}

function isSupportDocType(docType) {
  const normalized = normalizeUploadedDocType(docType);
  return Boolean(normalized) && !CORE_DOC_TYPES.has(normalized);
}

function buildCoreUploadMessage({ hasRentRoll, hasT12 }) {
  if (hasRentRoll && hasT12) return '';
  if (hasRentRoll && !hasT12) return 'Upload a T12 to generate.';
  if (!hasRentRoll && hasT12) return 'Upload a Rent Roll to generate.';
  return 'Upload a Rent Roll and T12 to generate.';
}

function buildUnderwritingSupportMessage() {
  return 'Underwriting also requires at least one supporting document.';
}

export function resolveReportUploadGate({ reportType = 'screening', uploadedFiles = [] } = {}) {
  const rows = Array.isArray(uploadedFiles) ? uploadedFiles : [];
  const normalizedRows = rows.map((row) => ({
    docType: normalizeUploadedDocType(row?.docType ?? row?.doc_type),
  }));
  const hasRentRoll = normalizedRows.some((row) => row.docType === 'rent_roll');
  const hasT12 = normalizedRows.some((row) => row.docType === 't12' || row.docType === 't12_or_operating_statement');
  const hasCoreDocs = hasRentRoll && hasT12;
  const hasSupportDocs = normalizedRows.some((row) => isSupportDocType(row.docType));
  const selectedReportType = String(reportType || '').toLowerCase().trim();
  const underwritingRequiresSupport = selectedReportType === 'underwriting';
  const missingCoreMessage = buildCoreUploadMessage({ hasRentRoll, hasT12 });
  const missingSupportMessage = underwritingRequiresSupport && !hasSupportDocs ? buildUnderwritingSupportMessage() : '';
  const blockedMessage = [missingCoreMessage, missingSupportMessage].filter(Boolean).join(' ');

  return {
    hasRentRoll,
    hasT12,
    hasCoreDocs,
    hasSupportDocs,
    underwritingRequiresSupport,
    canGenerate: hasCoreDocs && (!underwritingRequiresSupport || hasSupportDocs),
    isMissingCoreDocs: !hasCoreDocs,
    isMissingSupportDocs: underwritingRequiresSupport && !hasSupportDocs,
    blockedMessage,
    blockedReasonCode: !hasCoreDocs
      ? 'MISSING_REQUIRED_CORE_DOCUMENTS'
      : underwritingRequiresSupport && !hasSupportDocs
        ? 'MISSING_REQUIRED_SUPPORTING_DOCUMENT'
        : null,
  };
}

export function formatReportUploadGateErrorMessage(errorMessage, reportType = 'screening') {
  const raw = String(errorMessage || '').toUpperCase();
  const selectedReportType = String(reportType || '').toLowerCase().trim();
  if (raw.includes('MISSING_REQUIRED_SUPPORTING_DOCUMENT')) {
    return 'Underwriting also requires at least one supporting document.';
  }
  if (raw.includes('MISSING_REQUIRED_CORE_DOCUMENTS')) {
    return selectedReportType === 'underwriting'
      ? 'Upload a Rent Roll, T12, and at least one supporting document to generate.'
      : 'Upload a Rent Roll and T12 to generate.';
  }
  if (raw.includes('INVALID_STAGED_FILES')) {
    return 'Uploaded files could not be validated.';
  }
  return '';
}
