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
  /under review/i,
];

function matchesAny(text, regexes) {
  const value = String(text || '');
  return regexes.some((pattern) => pattern.test(value));
}

function classifyMissingDocumentCategory(job = {}) {
  const code = String(job?.error_code || '').trim().toUpperCase();
  const reason = String(job?.failure_reason || job?.error_message || '').trim();
  const text = `${code} ${reason}`.trim();
  if (/SUPPORTING DOCUMENT/i.test(text)) return 'supporting_document';
  if (/T12|OPERATING STATEMENT/i.test(text)) return 't12';
  if (/RENT ROLL/i.test(text)) return 'rent_roll';
  if (/RECONCILIATION|SAME PROPERTY|SAME REPORTING PERIOD|SOURCE PACKAGE|MISMATCH|INCONSISTENT/i.test(text)) return 'source_package';
  return 'source_package';
}

function buildNeutralSystemFailureCopy({ creditRestored = false } = {}) {
  return {
    title: creditRestored ? 'Generation paused before publication - credit restored' : 'Generation paused before publication',
    body: creditRestored
      ? 'Generation paused before publication. No completed report was published. The issue was logged for review, and your report credit has been returned to your account.'
      : 'Generation paused before publication. No completed report was published. The issue was logged for review. If a report credit was consumed, credit restoration will be handled according to the report status.',
    nextStep: 'Do not repeatedly retry the same property if it fails again. Contact reports@investoriq.tech with the property name.',
    referenceCode: 'REPORT_GENERATION_FAILED',
    creditLine: creditRestored ? 'Your report credit has been returned to your account.' : null,
  };
}

export function classifyFailure(job = {}, options = {}) {
  const code = String(job?.error_code || '').trim().toUpperCase();
  const reason = String(job?.failure_reason || job?.error_message || '').trim();
  const coreValidRequiredCoverage = options.coreValidRequiredCoverage === true;

  if (code === 'ADMIN_REVIEW_REQUIRED' || matchesAny(reason, ADMIN_REVIEW_HINTS)) {
    return { kind: 'system_failure', referenceCode: 'REPORT_GENERATION_FAILED' };
  }

  if (
    code === 'DOCUMENT_FINANCIAL_SCALE_MISMATCH' ||
    matchesAny(reason, SCALE_MISMATCH_HINTS)
  ) {
    if (coreValidRequiredCoverage) {
      return { kind: 'system_failure', referenceCode: 'REPORT_GENERATION_FAILED' };
    }
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
    if (coreValidRequiredCoverage) {
      return { kind: 'system_failure', referenceCode: 'REPORT_GENERATION_FAILED' };
    }
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
  const coreValidRequiredCoverage = options.coreValidRequiredCoverage === true;
  const classification = classifyFailure(job, options);
  const creditRestored = options.creditRestored === true;
  const errorCode = String(job?.error_code || '').trim().toUpperCase();
  const referenceCode = classification.referenceCode;
  const creditLine = creditRestored
    ? 'Your report credit has been returned to your account.'
    : null;
  const restoredSystemFailureBody =
    'Generation failed before publication. No report was published, and 1 report credit has been returned to your account.';
  const pendingSystemFailureBody =
    'Generation failed before publication. No report was published. If this was a platform-side failure, your report credit will be restored automatically.';
  if (coreValidRequiredCoverage && classification.kind !== 'system_failure') {
    return buildNeutralSystemFailureCopy({ creditRestored });
  }

  if (classification.kind === 'missing_documents') {
    if (errorCode === 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS') {
      return {
        title: creditRestored ? 'Rent roll could not be verified - credit restored' : 'Rent roll could not be verified',
        body: creditRestored
          ? 'The uploaded rent roll could not be verified as a usable rent roll. No report was published and your report credit was restored.'
          : 'The uploaded rent roll could not be verified as a usable rent roll. No report was published. If this was a source-package issue, your report credit will be restored automatically.',
        nextStep: 'Please start a new report with a clearer rent roll for the same property and reporting period. If you believe the document is correct, contact reports@investoriq.tech.',
        referenceCode,
        creditLine,
      };
    }
    const missingCategory = classifyMissingDocumentCategory(job);
    const missingCategoryTitle = {
      t12: 'T12 / operating statement could not be verified',
      rent_roll: 'Rent roll could not be verified',
      supporting_document: 'Full Underwriting supporting document could not be verified',
      source_package: 'Source package could not be verified',
    }[missingCategory];
    const missingCategoryBody = {
      t12: 'Generation could not be completed because the uploaded T12 / operating statement could not be verified as usable for this report.',
      rent_roll: 'Generation could not be completed because the uploaded rent roll could not be verified as usable for this report.',
      supporting_document: 'Generation could not be completed because Full Underwriting requires at least one usable supporting document in addition to the T12 and rent roll.',
      source_package: 'Generation could not be completed because the uploaded source package could not be verified as complete and usable for this report.',
    }[missingCategory];
    const missingCategoryNextStep = {
      t12: 'Please start a new report and upload a readable T12 / operating statement that includes income, expenses, and NOI. If you believe your document is complete, contact reports@investoriq.tech.',
      rent_roll: 'Please start a new report and upload a readable rent roll that includes units, occupancy or status, and in-place rents. If you believe your document is complete, contact reports@investoriq.tech.',
      supporting_document: 'Please start a new Full Underwriting report with a usable supporting document such as debt, purchase assumptions, appraisal, renovation, property tax, insurance, or related deal support. If you believe your document is complete, contact reports@investoriq.tech.',
      source_package: 'Please start a new report with clearer or more complete documents for the same property and reporting period where possible. If you believe the documents are correct, contact reports@investoriq.tech.',
    }[missingCategory];
    return {
      title: creditRestored ? `${missingCategoryTitle} - credit restored` : missingCategoryTitle,
      body: creditRestored
        ? missingCategoryBody.replace(/^Generation could not be completed because /, 'Generation could not be completed because ')
        : missingCategoryBody,
      nextStep: missingCategoryNextStep,
      referenceCode,
      creditLine,
    };
  }

  if (classification.kind === 'document_mismatch') {
    return {
      title: creditRestored ? 'Source package could not be reconciled - credit restored' : 'Source package could not be reconciled',
      body: creditRestored
        ? 'The uploaded T12 and rent roll could not be reconciled as a consistent source package. No report was published and your report credit was restored.'
        : 'The uploaded T12 and rent roll could not be reconciled as a consistent source package. No report was published. If this was a source-package issue, your report credit will be restored automatically.',
      nextStep: 'Please start a new report with documents for the same property and reporting period. If you believe the documents are correct, contact reports@investoriq.tech.',
      referenceCode,
      creditLine,
    };
  }

  if (classification.kind === 'system_failure') {
    return buildNeutralSystemFailureCopy({ creditRestored });
  }

  return {
    title: 'Generation paused before publication',
    body: 'Generation paused before publication. No completed report was published. The issue was logged for review.',
    nextStep: 'Do not repeatedly retry the same property if it fails again. Contact reports@investoriq.tech with the property name.',
    referenceCode,
    creditLine,
  };
}
