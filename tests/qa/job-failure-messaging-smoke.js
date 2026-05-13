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
assert.match(systemFailureCopy.body, /system issue/i);
assert.match(systemFailureCopy.body, /returned to your account/i);
assert.match(systemFailureCopy.nextStep, /try generating again/i);
assert.equal(systemFailureCopy.referenceCode, 'REPORT_GENERATION_FAILED');
assert.match(systemFailureCopy.creditLine, /returned to your account/i);

const systemFailureUnrestored = buildCustomerFailureMessage({ ...systemFailureJob, report_type: 'screening' });
assert.equal(systemFailureUnrestored.title, 'Generation failed');
assert.match(systemFailureUnrestored.body, /checking the credit status/i);
assert.match(systemFailureUnrestored.creditLine, /credit status is being checked/i);

const mismatchCopy = buildCustomerFailureMessage({
  error_code: 'DOCUMENT_FINANCIAL_SCALE_MISMATCH',
  failure_reason: 'InvestorIQ found a material inconsistency between the uploaded financial documents.',
});
assert.equal(mismatchCopy.title, 'Document inconsistency detected');
assert.match(mismatchCopy.body, /material inconsistency/i);
assert.equal(mismatchCopy.referenceCode, 'DOCUMENT_FINANCIAL_SCALE_MISMATCH');

const missingCopy = buildCustomerFailureMessage({
  error_code: 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS',
  failure_reason: 'Required structured financial artifacts were missing.',
});
assert.equal(missingCopy.title, 'Documents could not be verified');
assert.match(missingCopy.nextStep, /upload a complete T12 operating statement and rent roll/i);

const reviewCopy = buildCustomerFailureMessage({
  error_code: 'ADMIN_REVIEW_REQUIRED',
  failure_reason: 'Admin review required.',
});
assert.equal(reviewCopy.title, 'Submission under review');
assert.equal(reviewCopy.creditLine, null);

console.log('job-failure-messaging-smoke: ok');
