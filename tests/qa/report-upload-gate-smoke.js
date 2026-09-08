import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  formatReportUploadGateErrorMessage,
  resolveCoreUploadDocType,
  resolveReportUploadGate,
} from '../../src/lib/reportUploadGate.js';

const row = (docType, originalName = '') => ({ docType, original_name: originalName });

const screeningDual = resolveReportUploadGate({
  reportType: 'screening',
  uploadedFiles: [row('rent_roll'), row('t12')],
});
assert.equal(screeningDual.canGenerate, true);
assert.equal(screeningDual.coreMode, 'dual_source_core');
assert.equal(screeningDual.hasCoreDocs, true);
assert.equal(screeningDual.isMissingCoreDocs, false);
assert.equal(screeningDual.hasSupportDocs, false);
assert.equal(screeningDual.underwritingRequiresSupport, false);

for (const [docType, expectedMode] of [
  ['rent_roll', 'rent_roll_minimum_core'],
  ['t12', 't12_minimum_core'],
]) {
  const screeningSingleCore = resolveReportUploadGate({
    reportType: 'screening',
    uploadedFiles: [row(docType)],
  });
  assert.equal(screeningSingleCore.canGenerate, false);
  assert.equal(screeningSingleCore.coreMode, expectedMode);
  assert.equal(screeningSingleCore.hasCoreDocs, false);
  assert.equal(screeningSingleCore.blockedReasonCode, 'MISSING_REQUIRED_CORE_DOCUMENTS');
  assert.match(screeningSingleCore.blockedMessage, /both a Rent Roll and a T12/i);
}

const screeningWithSupport = resolveReportUploadGate({
  reportType: 'screening',
  uploadedFiles: [
    row('rent_roll'),
    row('t12'),
    row('supporting_documents', 'Appraisal.pdf'),
  ],
});
assert.equal(screeningWithSupport.canGenerate, false);
assert.equal(screeningWithSupport.hasCoreDocs, true);
assert.equal(screeningWithSupport.hasSupportDocs, true);
assert.equal(screeningWithSupport.screeningHasForbiddenSupport, true);
assert.equal(screeningWithSupport.blockedReasonCode, 'SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED');
assert.match(screeningWithSupport.blockedMessage, /Screening accepts only a Rent Roll and a T12/i);

const underwritingWithoutSupport = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [row('rent_roll'), row('t12')],
});
assert.equal(underwritingWithoutSupport.canGenerate, false);
assert.equal(underwritingWithoutSupport.coreMode, 'dual_source_core');
assert.equal(underwritingWithoutSupport.hasCoreDocs, true);
assert.equal(underwritingWithoutSupport.underwritingRequiresSupport, true);
assert.equal(underwritingWithoutSupport.isMissingSupportDocs, true);
assert.equal(underwritingWithoutSupport.blockedReasonCode, 'MISSING_REQUIRED_SUPPORTING_DOCUMENT');

const underwritingReady = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [
    row('rent_roll'),
    row('t12'),
    row('supporting_documents', 'Appraisal.pdf'),
  ],
});
assert.equal(underwritingReady.canGenerate, true);
assert.equal(underwritingReady.coreMode, 'dual_source_core');
assert.equal(underwritingReady.hasCoreDocs, true);
assert.equal(underwritingReady.hasSupportDocs, true);
assert.equal(underwritingReady.underwritingRequiresSupport, true);
assert.equal(underwritingReady.isMissingSupportDocs, false);

const underwritingSingleCoreWithSupport = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [
    row('t12'),
    row('supporting_documents_ui', 'Loan Terms.pdf'),
  ],
});
assert.equal(underwritingSingleCoreWithSupport.canGenerate, false);
assert.equal(underwritingSingleCoreWithSupport.coreMode, 't12_minimum_core');
assert.equal(underwritingSingleCoreWithSupport.hasSupportDocs, true);
assert.equal(underwritingSingleCoreWithSupport.blockedReasonCode, 'MISSING_REQUIRED_CORE_DOCUMENTS');

const swappedCoreUploads = resolveReportUploadGate({
  reportType: 'screening',
  uploadedFiles: [
    row('rent_roll', 'Acme_T12_Operating_Statement.pdf'),
    row('t12', 'Acme_Rent_Roll.xlsx'),
  ],
});
assert.equal(swappedCoreUploads.canGenerate, true);
assert.equal(swappedCoreUploads.coreMode, 'dual_source_core');
assert.equal(
  resolveCoreUploadDocType(row('rent_roll', 'Acme_T12_Operating_Statement.pdf')),
  't12',
);
assert.equal(
  resolveCoreUploadDocType(row('t12', 'Acme_Rent_Roll.xlsx')),
  'rent_roll',
);

const supportingOnly = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [
    row('supporting_documents', 'Appraisal.pdf'),
    row('supporting_documents', 'Loan Terms.pdf'),
  ],
});
assert.equal(supportingOnly.canGenerate, false);
assert.equal(supportingOnly.coreMode, 'insufficient_core');
assert.equal(supportingOnly.blockedReasonCode, 'MISSING_REQUIRED_CORE_DOCUMENTS');
assert.match(supportingOnly.blockedMessage, /both a Rent Roll and a T12/i);

assert.equal(
  formatReportUploadGateErrorMessage('MISSING_REQUIRED_CORE_DOCUMENTS'),
  'Upload both a Rent Roll and a T12 to generate.',
);
assert.equal(
  formatReportUploadGateErrorMessage('MISSING_REQUIRED_SUPPORTING_DOCUMENT'),
  'Upload at least one supporting due diligence document to generate Underwriting.',
);
assert.equal(
  formatReportUploadGateErrorMessage('SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED'),
  'Screening accepts only a Rent Roll and a T12. Remove supporting documents to continue.',
);

const strictAdmissionMigration = await fs.readFile(
  'supabase/migrations/20260908233000_strict_customer_admission_doctrine.sql',
  'utf8',
);
assert.match(strictAdmissionMigration, /not v_has_t12 or not v_has_rent_roll/i);
assert.match(strictAdmissionMigration, /p_report_type\s*=\s*'underwriting'\s+and\s+not\s+v_has_supporting_docs/i);
assert.match(strictAdmissionMigration, /p_report_type\s*=\s*'screening'\s+and\s+v_has_supporting_docs/i);
assert.match(strictAdmissionMigration, /MISSING_REQUIRED_SUPPORTING_DOCUMENT/i);
assert.match(strictAdmissionMigration, /SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED/i);
assert.match(strictAdmissionMigration, /downstream t12_minimum_core \/ rent_roll_minimum_core states remain valid only/i);
assert.match(strictAdmissionMigration, /52428800/);

console.log('report upload gate smoke PASS');
