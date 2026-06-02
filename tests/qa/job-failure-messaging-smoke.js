import assert from 'node:assert/strict';
import { buildCustomerFailureMessage, buildEntitlementRestoredMap } from '../../src/lib/jobFailureMessaging.js';

const restoredMap = buildEntitlementRestoredMap([
  { type: 'worker_event', job_id: 'job-1', payload: { event: 'entitlement_restored' } },
  { type: 'worker_event', job_id: 'job-2', payload: { event: 'job_failed' } },
  { type: 'analysis_artifact', job_id: 'job-3', payload: { event: 'entitlement_restored' } },
]);

assert.equal(restoredMap['job-1'], true);
assert.equal(restoredMap['job-2'], undefined);
assert.equal(restoredMap['job-3'], undefined);

const systemFailureJob = {
  report_type: 'underwriting',
  error_code: 'REPORT_GENERATION_FAILED',
  failure_reason: 'Report generation failed (500)',
};
const systemFailureCopy = buildCustomerFailureMessage(systemFailureJob, { creditRestored: true });
assert.equal(systemFailureCopy.title, 'Generation failed - credit restored');
assert.match(systemFailureCopy.body, /Generation failed before publication/i);
assert.match(systemFailureCopy.body, /returned to your account/i);
assert.match(systemFailureCopy.nextStep, /try generating again/i);
assert.equal(systemFailureCopy.referenceCode, 'REPORT_GENERATION_FAILED');
assert.match(systemFailureCopy.creditLine, /returned to your account/i);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(systemFailureCopy)), false);

const systemFailureUnrestored = buildCustomerFailureMessage({ ...systemFailureJob, report_type: 'screening' });
assert.equal(systemFailureUnrestored.title, 'Generation failed');
assert.match(systemFailureUnrestored.body, /Generation failed before publication/i);
assert.match(systemFailureUnrestored.body, /will be restored automatically/i);
assert.equal(systemFailureUnrestored.creditLine, null);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(systemFailureUnrestored)), false);

const mismatchCopy = buildCustomerFailureMessage({
  error_code: 'DOCUMENT_FINANCIAL_SCALE_MISMATCH',
  failure_reason: 'InvestorIQ found a material inconsistency between the uploaded financial documents.',
});
assert.equal(mismatchCopy.title, 'Source package could not be reconciled');
assert.match(mismatchCopy.body, /uploaded T12 and rent roll could not be reconciled as a consistent source package/i);
assert.match(mismatchCopy.nextStep, /same property and reporting period/i);
assert.equal(mismatchCopy.referenceCode, 'DOCUMENT_FINANCIAL_SCALE_MISMATCH');
assert.equal(/credit status|checking credit/i.test(JSON.stringify(mismatchCopy)), false);

const missingStructuredArtifactsCopy = buildCustomerFailureMessage(
  {
    error_code: 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS',
    failure_reason: 'Missing required financial source artifacts',
  },
  { creditRestored: true }
);
assert.equal(missingStructuredArtifactsCopy.title, 'Rent roll could not be verified - credit restored');
assert.match(missingStructuredArtifactsCopy.body, /uploaded rent roll could not be verified as a usable rent roll/i);
assert.match(missingStructuredArtifactsCopy.body, /No report was published and your report credit was restored/i);
assert.match(missingStructuredArtifactsCopy.nextStep, /clearer rent roll for the same property and reporting period/i);
assert.equal(missingStructuredArtifactsCopy.referenceCode, 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS');
assert.equal(/credit status|checking credit/i.test(JSON.stringify(missingStructuredArtifactsCopy)), false);

const t12MissingCopy = buildCustomerFailureMessage({
  error_code: 'MISSING_REQUIRED_DOCUMENTS',
  failure_reason: 'The uploaded T12 / operating statement was not verified as usable for this report.',
});
assert.equal(t12MissingCopy.title, 'T12 / operating statement could not be verified');
assert.match(t12MissingCopy.body, /uploaded T12 \/ operating statement could not be verified as usable for this report/i);
assert.match(t12MissingCopy.nextStep, /start a new report and upload a readable T12 \/ operating statement/i);
assert.match(t12MissingCopy.nextStep, /reports@investoriq.tech/i);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(t12MissingCopy)), false);

const rentRollMissingCopy = buildCustomerFailureMessage({
  error_code: 'MISSING_REQUIRED_DOCUMENTS',
  failure_reason: 'The uploaded rent roll was not verified as usable for this report.',
});
assert.equal(rentRollMissingCopy.title, 'Rent roll could not be verified');
assert.match(rentRollMissingCopy.body, /uploaded rent roll could not be verified as usable for this report/i);
assert.match(rentRollMissingCopy.nextStep, /start a new report and upload a readable rent roll/i);
assert.match(rentRollMissingCopy.nextStep, /reports@investoriq.tech/i);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(rentRollMissingCopy)), false);

const supportingDocumentMissingCopy = buildCustomerFailureMessage({
  report_type: 'underwriting',
  error_code: 'MISSING_REQUIRED_DOCUMENTS',
  failure_reason: 'Full Underwriting requires at least one usable supporting document in addition to the T12 and rent roll.',
});
assert.equal(supportingDocumentMissingCopy.title, 'Full Underwriting supporting document could not be verified');
assert.match(supportingDocumentMissingCopy.body, /requires at least one usable supporting document/i);
assert.match(supportingDocumentMissingCopy.nextStep, /usable supporting document/i);
assert.match(supportingDocumentMissingCopy.nextStep, /reports@investoriq.tech/i);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(supportingDocumentMissingCopy)), false);

const sourcePackageMissingCopy = buildCustomerFailureMessage({
  error_code: 'MISSING_REQUIRED_SOURCE_DATA',
  failure_reason: 'The uploaded source package could not be verified as complete and usable for this report.',
});
assert.equal(sourcePackageMissingCopy.title, 'Source package could not be verified');
assert.match(sourcePackageMissingCopy.body, /source package could not be verified as complete and usable/i);
assert.match(sourcePackageMissingCopy.nextStep, /clearer or more complete documents/i);
assert.match(sourcePackageMissingCopy.nextStep, /reports@investoriq.tech/i);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(sourcePackageMissingCopy)), false);

const coreValidLegacyMissingCopy = buildCustomerFailureMessage(
  {
    error_code: 'MISSING_REQUIRED_SOURCE_DATA',
    failure_reason: 'The uploaded source package could not be verified as complete and usable for this report.',
  },
  { coreValidRequiredCoverage: true, creditRestored: true }
);
assert.equal(coreValidLegacyMissingCopy.title, 'Generation failed - credit restored');
assert.match(coreValidLegacyMissingCopy.body, /Generation failed before publication/i);
assert.match(coreValidLegacyMissingCopy.body, /returned to your account/i);
assert.equal(/source package|rent roll|additional required documents|clearer or more complete documents/i.test(JSON.stringify(coreValidLegacyMissingCopy)), false);

const reviewCopy = buildCustomerFailureMessage({
  error_code: 'ADMIN_REVIEW_REQUIRED',
  failure_reason: 'Admin review required.',
});
assert.equal(reviewCopy.title, 'Submission under review');
assert.equal(reviewCopy.creditLine, null);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(reviewCopy)), false);

console.log('job-failure-messaging-smoke: ok');
