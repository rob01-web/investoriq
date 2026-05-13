const SYSTEM_FAILURE_HINTS = [
  /report generation failed/i,
  /\b500\b/,
  /docraptor/i,
  /unexpected server error/i,
  /internal server error/i,
  /timed out/i,
  /timeout/i,
  /failed to (?:generate|write|upload|insert|restore)/i,
  /storage/i,
];

const MISSING_DOC_HINTS = [
  /missing structured financial artifacts/i,
  /missing structured financials/i,
  /missing required source data/i,
  /missing required documents/i,
  /document(?:s)? could not be verified/i,
];

const SCALE_MISMATCH_HINTS = [
  /document financial scale mismatch/i,
  /materially inconsistent/i,
  /scale mismatch/i,
  /reconciliation/i,
];

const ADMIN_REVIEW_HINTS = [
  /admin review required/i,
];

function matchesAny(text, regexes) {
  const value = String(text || '');
  return regexes.some((pattern) => pattern.test(value));
}

export function classifyFailure(job = {}) {
  const code = String(job?.error_code || '').trim().toUpperCase();
  const reason = String(job?.failure_reason || job?.error_message || '').trim();

  if (code === 'ADMIN_REVIEW_REQUIRED' || matchesAny(reason, ADMIN_REVIEW_HINTS)) {
    return { kind: 'admin_review', referenceCode: 'ADMIN_REVIEW_REQUIRED' };
  }

  if (
    code === 'DOCUMENT_FINANCIAL_SCALE_MISMATCH' ||
    matchesAny(reason, SCALE_MISMATCH_HINTS)
  ) {
    return { kind: 'document_mismatch', referenceCode: 'DOCUMENT_FINANCIAL_SCALE_MISMATCH' };
  }

  if (
    [
      'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS',
      'MISSING_STRUCTURED_FINANCIALS',
      'MISSING_REQUIRED_SOURCE_DATA',
      'MISSING_REQUIRED_DOCUMENTS',
      'MISSING_REQUIRED_DOCUMENT',
    ].includes(code) ||
    matchesAny(reason, MISSING_DOC_HINTS)
  ) {
    return { kind: 'missing_documents', referenceCode: code || 'MISSING_REQUIRED_SOURCE_DATA' };
  }

  if (code === 'REPORT_GENERATION_FAILED' || matchesAny(reason, SYSTEM_FAILURE_HINTS)) {
    return { kind: 'system_failure', referenceCode: 'REPORT_GENERATION_FAILED' };
  }

  return { kind: 'unknown_failure', referenceCode: code || 'UNKNOWN_FAILURE' };
}

export function buildEntitlementRestoredMap(artifactRows = []) {
  const restored = {};
  for (const row of Array.isArray(artifactRows) ? artifactRows : []) {
    const payload = row?.payload || {};
    if (row?.type === 'worker_event' && String(payload.event || '') === 'entitlement_restored' && row?.job_id) {
      restored[String(row.job_id)] = true;
    }
  }
  return restored;
}

export function buildCustomerFailureMessage(job = {}, options = {}) {
  const classification = classifyFailure(job);
  const creditRestored = options.creditRestored === true;
  const referenceCode = classification.referenceCode;
  const creditLine = creditRestored
    ? 'Your report credit has been returned to your account.'
    : 'Credit status is being checked for this failed report.';

  if (classification.kind === 'admin_review') {
    return {
      title: 'Submission under review',
      body: 'InvestorIQ needs to review this submission before a report can be published. No additional action is required from you right now unless updated documents are requested.',
      nextStep: 'We will review the submission and follow up if more information is needed.',
      referenceCode,
      creditLine: null,
    };
  }

  if (classification.kind === 'missing_documents') {
    return {
      title: creditRestored ? 'Documents could not be verified - credit restored' : 'Documents could not be verified',
      body: creditRestored
        ? 'InvestorIQ could not verify the required structured financial inputs from the uploaded documents. No report was published, and your report credit has been returned to your account.'
        : 'InvestorIQ could not verify the required structured financial inputs from the uploaded documents. No report was published. We are checking the credit status for this submission.',
      nextStep: 'Please upload a complete T12 operating statement and rent roll, then generate again.',
      referenceCode,
      creditLine,
    };
  }

  if (classification.kind === 'document_mismatch') {
    return {
      title: creditRestored ? 'Document inconsistency detected - credit restored' : 'Document inconsistency detected',
      body: creditRestored
        ? 'InvestorIQ found a material inconsistency between the uploaded financial documents. No report was published, and your report credit has been returned to your account.'
        : 'InvestorIQ found a material inconsistency between the uploaded financial documents. No report was published. We are checking the credit status for this submission.',
      nextStep: 'Please verify that the T12 and rent roll belong to the same property and reporting period before trying again.',
      referenceCode,
      creditLine,
    };
  }

  if (classification.kind === 'system_failure') {
    return {
      title: creditRestored ? 'Generation failed - credit restored' : 'Generation failed',
      body: creditRestored
        ? 'InvestorIQ encountered a system issue while generating this report. No report was published, and your report credit has been returned to your account.'
        : 'InvestorIQ encountered a system issue while generating this report. No report was published. We are checking the credit status for this submission.',
      nextStep: 'You can try generating again. If this repeats, contact hello@investoriq.tech and include the property name.',
      referenceCode,
      creditLine,
    };
  }

  return {
    title: 'Report could not be generated',
    body: 'InvestorIQ could not generate this report. No report was published.',
    nextStep: 'Please try again or contact hello@investoriq.tech if this repeats.',
    referenceCode,
    creditLine,
  };
}
