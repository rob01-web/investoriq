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

function buildBlockedState({ reportType, hasRequiredCoreDocs, hasSupportDocs }) {
  if (!hasRequiredCoreDocs) {
    return {
      blockedReasonCode: 'MISSING_REQUIRED_CORE_DOCUMENTS',
      blockedMessage: 'Upload both a Rent Roll and a T12 to generate.',
    };
  }

  if (reportType === 'screening' && hasSupportDocs) {
    return {
      blockedReasonCode: 'SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED',
      blockedMessage: 'Screening accepts only a Rent Roll and a T12. Remove supporting documents to continue.',
    };
  }

  if (reportType === 'underwriting' && !hasSupportDocs) {
    return {
      blockedReasonCode: 'MISSING_REQUIRED_SUPPORTING_DOCUMENT',
      blockedMessage: 'Upload at least one supporting due diligence document to generate Underwriting.',
    };
  }

  return { blockedReasonCode: null, blockedMessage: '' };
}

export function resolveReportUploadGate({ reportType = 'screening', uploadedFiles = [] } = {}) {
  const normalizedReportType = String(reportType || 'screening').trim().toLowerCase();
  const rows = Array.isArray(uploadedFiles) ? uploadedFiles : [];
  const normalizedRows = rows.map((row) => ({
    docType: normalizeUploadedDocType(row?.docType ?? row?.doc_type),
    coreDocType: resolveCoreUploadDocType(row),
  }));

  const hasRentRoll = normalizedRows.some((row) => row.coreDocType === 'rent_roll');
  const hasT12 = normalizedRows.some((row) => row.coreDocType === 't12');
  const hasSupportDocs = normalizedRows.some((row) => isSupportDocType(row.docType));
  const coreMode = resolveCoreMode({ hasRentRoll, hasT12 });

  // Admission is strict even though downstream source truth may later resolve to
  // t12_minimum_core or rent_roll_minimum_core after a valid job has been admitted.
  const hasRequiredCoreDocs = hasRentRoll && hasT12;
  const underwritingRequiresSupport = normalizedReportType === 'underwriting';
  const screeningHasForbiddenSupport = normalizedReportType === 'screening' && hasSupportDocs;
  const isMissingSupportDocs = underwritingRequiresSupport && !hasSupportDocs;
  const { blockedReasonCode, blockedMessage } = buildBlockedState({
    reportType: normalizedReportType,
    hasRequiredCoreDocs,
    hasSupportDocs,
  });

  return {
    hasRentRoll,
    hasT12,
    hasCoreDocs: hasRequiredCoreDocs,
    hasSupportDocs,
    coreMode,
    underwritingRequiresSupport,
    screeningHasForbiddenSupport,
    canGenerate: blockedReasonCode === null,
    isMissingCoreDocs: !hasRequiredCoreDocs,
    isMissingSupportDocs,
    blockedMessage,
    blockedReasonCode,
  };
}

export function formatReportUploadGateErrorMessage(errorMessage) {
  const raw = String(errorMessage || '').toUpperCase();
  if (
    raw.includes('MISSING_REQUIRED_CORE_DOCUMENTS') ||
    raw.includes('BOTH RENT ROLL AND T12 ARE REQUIRED') ||
    raw.includes('BOTH A RENT ROLL AND A T12 ARE REQUIRED')
  ) {
    return 'Upload both a Rent Roll and a T12 to generate.';
  }
  if (
    raw.includes('MISSING_REQUIRED_SUPPORTING_DOCUMENT') ||
    raw.includes('AT LEAST ONE SUPPORTING DOCUMENT IS REQUIRED FOR UNDERWRITING')
  ) {
    return 'Upload at least one supporting due diligence document to generate Underwriting.';
  }
  if (
    raw.includes('SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED') ||
    raw.includes('SUPPORTING DOCUMENTS ARE NOT ALLOWED FOR SCREENING')
  ) {
    return 'Screening accepts only a Rent Roll and a T12. Remove supporting documents to continue.';
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
