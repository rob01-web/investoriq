import { normalizeDashboardDocType } from './dashboardCustomerCopy.js';

const CORE_DOC_TYPES = new Set(['rent_roll', 't12', 't12_or_operating_statement']);

function normalizeUploadedDocType(value) {
  return normalizeDashboardDocType(value);
}

function normalizeFilenameHint(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function inferCoreDocTypeFromFilename(value) {
  const normalized = normalizeFilenameHint(value);
  if (!normalized) return '';
  if (/\b(t12|trailing 12|operating statement|income statement)\b/.test(normalized)) return 't12';
  if (/\b(rent roll|rentroll)\b/.test(normalized)) return 'rent_roll';
  return '';
}

function isSupportDocType(docType) {
  const normalized = normalizeUploadedDocType(docType);
  return Boolean(normalized) && !CORE_DOC_TYPES.has(normalized);
}

export function resolveCoreUploadDocType(row = {}) {
  const filenameHint = inferCoreDocTypeFromFilename(
    row?.original_name ?? row?.original_filename ?? row?.file?.name ?? ''
  );
  const normalizedDocType = normalizeUploadedDocType(row?.docType ?? row?.doc_type);
  if (normalizedDocType === 't12_or_operating_statement') return 't12';
  if (CORE_DOC_TYPES.has(normalizedDocType)) return filenameHint || normalizedDocType;
  return '';
}

function resolveCoreMode({ hasRentRoll, hasT12 }) {
  if (hasRentRoll && hasT12) return 'dual_source_core';
  if (hasT12) return 't12_minimum_core';
  if (hasRentRoll) return 'rent_roll_minimum_core';
  return 'insufficient_core';
}

function buildCoreUploadMessage(coreMode) {
  if (coreMode !== 'insufficient_core') return '';
  return 'Upload a Rent Roll or a T12 to generate.';
}

export function resolveReportUploadGate({ reportType = 'screening', uploadedFiles = [] } = {}) {
  const rows = Array.isArray(uploadedFiles) ? uploadedFiles : [];
  const normalizedRows = rows.map((row) => ({
    docType: normalizeUploadedDocType(row?.docType ?? row?.doc_type),
    coreDocType: resolveCoreUploadDocType(row),
  }));
  const hasRentRoll = normalizedRows.some((row) => row.coreDocType === 'rent_roll');
  const hasT12 = normalizedRows.some((row) => row.coreDocType === 't12');
  const hasSupportDocs = normalizedRows.some((row) => isSupportDocType(row.docType));
  const coreMode = resolveCoreMode({ hasRentRoll, hasT12 });
  const hasCoreDocs = coreMode !== 'insufficient_core';
  const blockedMessage = buildCoreUploadMessage(coreMode);

  void reportType;

  return {
    hasRentRoll,
    hasT12,
    hasCoreDocs,
    hasSupportDocs,
    coreMode,
    underwritingRequiresSupport: false,
    canGenerate: hasCoreDocs,
    isMissingCoreDocs: !hasCoreDocs,
    isMissingSupportDocs: false,
    blockedMessage,
    blockedReasonCode: !hasCoreDocs ? 'MISSING_REQUIRED_CORE_DOCUMENTS' : null,
  };
}

export function formatReportUploadGateErrorMessage(errorMessage) {
  const raw = String(errorMessage || '').toUpperCase();
  if (
    raw.includes('MISSING_REQUIRED_CORE_DOCUMENTS') ||
    raw.includes('BOTH RENT ROLL AND T12 ARE REQUIRED') ||
    raw.includes('BOTH A RENT ROLL AND A T12 ARE REQUIRED')
  ) {
    return 'Upload a Rent Roll or a T12 to generate.';
  }
  if (
    raw.includes('MISSING_REQUIRED_SUPPORTING_DOCUMENT') ||
    raw.includes('AT LEAST ONE SUPPORTING DOCUMENT IS REQUIRED FOR UNDERWRITING')
  ) {
    return 'We could not start this report. Please try again.';
  }
  if (raw.includes('INVALID_STAGED_FILES') || raw.includes('ADMISSION_STAGED_OBJECT_METADATA_MISMATCH')) {
    return 'Uploaded files could not be validated. Please review the files and try again.';
  }
  if (raw.includes('PURCHASE_NOT_AVAILABLE')) {
    return 'No available report credit was found for this report.';
  }
  if (raw.includes('ADMISSION_CURRENT_DISCLOSURE_SESSION_REQUIRED')) {
    return 'Please review and accept the analysis disclosure before starting the report.';
  }
  return '';
}
