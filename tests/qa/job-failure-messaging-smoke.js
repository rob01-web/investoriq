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
assert.equal(mismatchCopy.title, 'Document inconsistency detected');
assert.match(mismatchCopy.body, /Generation failed before publication/i);
assert.equal(mismatchCopy.referenceCode, 'DOCUMENT_FINANCIAL_SCALE_MISMATCH');
assert.equal(/credit status|checking credit/i.test(JSON.stringify(mismatchCopy)), false);

const missingCopy = buildCustomerFailureMessage({
  error_code: 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS',
  failure_reason: 'Required structured financial artifacts were missing.',
});
assert.equal(missingCopy.title, 'Documents could not be verified');
assert.match(missingCopy.body, /Generation failed before publication/i);
assert.match(missingCopy.nextStep, /upload a complete T12 operating statement and rent roll/i);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(missingCopy)), false);

const reviewCopy = buildCustomerFailureMessage({
  error_code: 'ADMIN_REVIEW_REQUIRED',
  failure_reason: 'Admin review required.',
});
assert.equal(reviewCopy.title, 'Submission under review');
assert.equal(reviewCopy.creditLine, null);
assert.equal(/credit status|checking credit/i.test(JSON.stringify(reviewCopy)), false);

console.log('job-failure-messaging-smoke: ok');
