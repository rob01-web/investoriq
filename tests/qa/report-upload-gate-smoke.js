import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  formatReportUploadGateErrorMessage,
  resolveCoreUploadDocType,
  resolveReportUploadGate,
} from '../../src/lib/reportUploadGate.js';

const row = (docType, originalName = '') => ({ docType, original_name: originalName });

for (const reportType of ['screening', 'underwriting']) {
  const dualSource = resolveReportUploadGate({
    reportType,
    uploadedFiles: [row('rent_roll'), row('t12')],
  });
  assert.equal(dualSource.canGenerate, true);
  assert.equal(dualSource.coreMode, 'dual_source_core');
  assert.equal(dualSource.isMissingCoreDocs, false);
  assert.equal(dualSource.isMissingSupportDocs, false);
  assert.equal(dualSource.underwritingRequiresSupport, false);

  const rentRollOnly = resolveReportUploadGate({
    reportType,
    uploadedFiles: [row('rent_roll')],
  });
  assert.equal(rentRollOnly.canGenerate, true);
  assert.equal(rentRollOnly.coreMode, 'rent_roll_minimum_core');
  assert.equal(rentRollOnly.isMissingSupportDocs, false);

  const t12Only = resolveReportUploadGate({
    reportType,
    uploadedFiles: [row('t12')],
  });
  assert.equal(t12Only.canGenerate, true);
  assert.equal(t12Only.coreMode, 't12_minimum_core');
  assert.equal(t12Only.isMissingSupportDocs, false);
}

const underwritingWithOptionalSupport = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [
    row('t12'),
    row('supporting_documents', 'Appraisal.pdf'),
  ],
});
assert.equal(underwritingWithOptionalSupport.canGenerate, true);
assert.equal(underwritingWithOptionalSupport.hasSupportDocs, true);
assert.equal(underwritingWithOptionalSupport.underwritingRequiresSupport, false);

const underwritingWithUiSupport = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [
    row('rent_roll'),
    row('supporting_documents_ui', 'Loan Terms.pdf'),
  ],
});
assert.equal(underwritingWithUiSupport.canGenerate, true);
assert.equal(underwritingWithUiSupport.hasSupportDocs, true);
assert.equal(underwritingWithUiSupport.hasCoreDocs, true);

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
assert.match(supportingOnly.blockedMessage, /Rent Roll or a T12/i);

assert.equal(
  formatReportUploadGateErrorMessage('MISSING_REQUIRED_CORE_DOCUMENTS', 'screening'),
  'Upload a Rent Roll or a T12 to generate.',
);
assert.equal(
  formatReportUploadGateErrorMessage('MISSING_REQUIRED_CORE_DOCUMENTS', 'underwriting'),
  'Upload a Rent Roll or a T12 to generate.',
);
assert.equal(
  formatReportUploadGateErrorMessage('MISSING_REQUIRED_SUPPORTING_DOCUMENT', 'underwriting'),
  '',
);

const currentAdmissionMigration = await fs.readFile(
  'supabase/migrations/20260828233000_phase1_admission_core_modes_and_upload_policy.sql',
  'utf8',
);
assert.match(currentAdmissionMigration, /not v_has_t12 and not v_has_rent_roll/i);
assert.doesNotMatch(currentAdmissionMigration, /MISSING_REQUIRED_SUPPORTING_DOCUMENT/i);
assert.doesNotMatch(currentAdmissionMigration, /p_report_type\s*=\s*'underwriting'\s+and\s+not\s+v_has_supporting_docs/i);
assert.match(currentAdmissionMigration, /file_size_limit\s*=\s*52428800/i);

console.log('report upload gate smoke PASS');
