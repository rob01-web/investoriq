import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatReportUploadGateErrorMessage,
  resolveReportUploadGate,
} from '../../src/lib/reportUploadGate.js';
import { wrapSupabaseWithCustomerBoundaries } from '../../src/lib/customerBoundarySupabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const row = (docType, name) => ({ docType, original_name: name });

// Customer admission is strict. The minimum-core names remain downstream
// source-truth survivor modes only and do not authorize customer intake.
const screeningDual = resolveReportUploadGate({
  reportType: 'screening',
  uploadedFiles: [row('rent_roll', 'Rent Roll.xlsx'), row('t12', 'T12.xlsx')],
});
assert.equal(screeningDual.canGenerate, true);
assert.equal(screeningDual.coreMode, 'dual_source_core');
assert.equal(screeningDual.hasCoreDocs, true);
assert.equal(screeningDual.hasSupportDocs, false);
assert.equal(screeningDual.underwritingRequiresSupport, false);

for (const [docType, expectedMode] of [
  ['t12', 't12_minimum_core'],
  ['rent_roll', 'rent_roll_minimum_core'],
]) {
  const screeningSingleCore = resolveReportUploadGate({
    reportType: 'screening',
    uploadedFiles: [row(docType, `${docType}.xlsx`)],
  });
  assert.equal(screeningSingleCore.coreMode, expectedMode);
  assert.equal(screeningSingleCore.canGenerate, false);
  assert.equal(screeningSingleCore.blockedReasonCode, 'MISSING_REQUIRED_CORE_DOCUMENTS');
}

const screeningWithSupport = resolveReportUploadGate({
  reportType: 'screening',
  uploadedFiles: [
    row('rent_roll', 'Rent Roll.xlsx'),
    row('t12', 'T12.xlsx'),
    row('supporting_documents', 'Appraisal.pdf'),
  ],
});
assert.equal(screeningWithSupport.canGenerate, false);
assert.equal(screeningWithSupport.blockedReasonCode, 'SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED');
assert.equal(screeningWithSupport.screeningHasForbiddenSupport, true);

const underwritingWithoutSupport = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [row('rent_roll', 'Rent Roll.xlsx'), row('t12', 'T12.xlsx')],
});
assert.equal(underwritingWithoutSupport.canGenerate, false);
assert.equal(underwritingWithoutSupport.coreMode, 'dual_source_core');
assert.equal(underwritingWithoutSupport.underwritingRequiresSupport, true);
assert.equal(underwritingWithoutSupport.isMissingSupportDocs, true);
assert.equal(underwritingWithoutSupport.blockedReasonCode, 'MISSING_REQUIRED_SUPPORTING_DOCUMENT');

const underwritingReady = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [
    row('rent_roll', 'Rent Roll.xlsx'),
    row('t12', 'T12.xlsx'),
    row('supporting_documents', 'Appraisal.pdf'),
  ],
});
assert.equal(underwritingReady.canGenerate, true);
assert.equal(underwritingReady.coreMode, 'dual_source_core');
assert.equal(underwritingReady.hasSupportDocs, true);
assert.equal(underwritingReady.underwritingRequiresSupport, true);
assert.equal(underwritingReady.isMissingSupportDocs, false);

const underwritingSingleCoreWithSupport = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [row('t12', 'T12.xlsx'), row('supporting_documents', 'Appraisal.pdf')],
});
assert.equal(underwritingSingleCoreWithSupport.canGenerate, false);
assert.equal(underwritingSingleCoreWithSupport.coreMode, 't12_minimum_core');
assert.equal(underwritingSingleCoreWithSupport.blockedReasonCode, 'MISSING_REQUIRED_CORE_DOCUMENTS');

const insufficient = resolveReportUploadGate({
  reportType: 'underwriting',
  uploadedFiles: [row('supporting_documents', 'Appraisal.pdf')],
});
assert.equal(insufficient.canGenerate, false);
assert.equal(insufficient.coreMode, 'insufficient_core');
assert.equal(insufficient.blockedReasonCode, 'MISSING_REQUIRED_CORE_DOCUMENTS');
assert.match(insufficient.blockedMessage, /both a Rent Roll and a T12/i);

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
assert.equal(
  formatReportUploadGateErrorMessage('column r.created_at does not exist'),
  '',
);

const migrationPath = path.join(
  repoRoot,
  'supabase/migrations/20260908233000_strict_customer_admission_doctrine.sql',
);
const migration = fs.readFileSync(migrationPath, 'utf8');
assert.match(migration, /not v_has_t12 or not v_has_rent_roll/i);
assert.match(migration, /p_report_type\s*=\s*'underwriting'\s+and\s+not\s+v_has_supporting_docs/i);
assert.match(migration, /p_report_type\s*=\s*'screening'\s+and\s+v_has_supporting_docs/i);
assert.match(migration, /MISSING_REQUIRED_SUPPORTING_DOCUMENT/i);
assert.match(migration, /SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED/i);
assert.match(migration, /downstream t12_minimum_core \/ rent_roll_minimum_core states remain valid only/i);
assert.match(migration, /file_size_limit|52428800/i);

const removed = [];
const uploaded = [];
let uploadProviderCalls = 0;
let rpcMode = 'confirmed-rejection';

const baseSupabase = {
  auth: {
    getSession: async () => ({ data: { session: { access_token: 'test-token' } }, error: null }),
  },
  storage: {
    from(bucketName) {
      return {
        async upload(storagePath) {
          uploadProviderCalls += 1;
          uploaded.push({ bucketName, storagePath });
          return { data: { path: storagePath }, error: null };
        },
        async remove(paths) {
          removed.push({ bucketName, paths: [...paths] });
          return { data: paths.map((name) => ({ name })), error: null };
        },
        async createSignedUrl() {
          return { data: { signedUrl: 'signed' }, error: null };
        },
      };
    },
  },
  from() {
    throw new Error('Unexpected table access in phase1 smoke');
  },
  async rpc(functionName) {
    if (functionName !== 'consume_purchase_and_create_job') return { data: null, error: null };
    if (rpcMode === 'ambiguous-network') {
      return { data: null, error: { message: 'Failed to fetch' } };
    }
    return {
      data: null,
      error: {
        message: 'column r.created_at does not exist',
        code: '42703',
        details: 'internal schema detail',
      },
    };
  },
};

const customerSupabase = wrapSupabaseWithCustomerBoundaries(baseSupabase);
const failedAdmission = await customerSupabase.rpc('consume_purchase_and_create_job', {
  p_report_type: 'underwriting',
  p_job_payload: { property_name: 'Phase 1 Test' },
  p_staged_files: [
    { storage_path: 'staged/user/test/rent-roll/a.xlsx', doc_type: 'rent_roll' },
    { storage_path: 'staged/user/test/t12/b.xlsx', doc_type: 't12' },
    { storage_path: 'staged/user/test/supporting/c.pdf', doc_type: 'supporting' },
  ],
});
assert.equal(failedAdmission.data, null);
assert.equal(failedAdmission.error.code, 'REPORT_ADMISSION_FAILED');
assert.doesNotMatch(failedAdmission.error.message, /column|created_at|postgres|schema/i);
assert.match(failedAdmission.error.message, /report credit was not consumed/i);
assert.deepEqual(removed, [
  {
    bucketName: 'staged_uploads',
    paths: [
      'staged/user/test/rent-roll/a.xlsx',
      'staged/user/test/t12/b.xlsx',
      'staged/user/test/supporting/c.pdf',
    ],
  },
]);

rpcMode = 'ambiguous-network';
const unconfirmedAdmission = await customerSupabase.rpc('consume_purchase_and_create_job', {
  p_report_type: 'screening',
  p_job_payload: { property_name: 'Ambiguous Network Test' },
  p_staged_files: [
    { storage_path: 'staged/user/test/rent-roll/ambiguous.xlsx', doc_type: 'rent_roll' },
    { storage_path: 'staged/user/test/t12/ambiguous.xlsx', doc_type: 't12' },
  ],
});
assert.equal(unconfirmedAdmission.data, null);
assert.equal(unconfirmedAdmission.error.code, 'REPORT_ADMISSION_UNCONFIRMED');
assert.match(unconfirmedAdmission.error.message, /refresh your dashboard/i);
assert.doesNotMatch(unconfirmedAdmission.error.message, /credit was not consumed/i);
assert.equal(removed.length, 1, 'Ambiguous network failures must not delete staged source objects.');

const invalidPdfBytes = new Blob(['NOT-A-PDF'], { type: 'application/pdf' });
const invalidPdf = {
  name: 'bad.pdf',
  size: invalidPdfBytes.size,
  type: 'application/pdf',
  slice: invalidPdfBytes.slice.bind(invalidPdfBytes),
};
const invalidPdfUpload = await customerSupabase.storage
  .from('staged_uploads')
  .upload('staged/user/test/supporting/bad.pdf', invalidPdf, { upsert: false });
assert.equal(invalidPdfUpload.data, null);
assert.equal(invalidPdfUpload.error.code, 'INVALID_PDF_SIGNATURE');
assert.equal(uploadProviderCalls, 0);

const validPdfBytes = new Blob(['%PDF-1.7\nfixture'], { type: 'application/pdf' });
const validPdf = {
  name: 'good.pdf',
  size: validPdfBytes.size,
  type: 'application/pdf',
  slice: validPdfBytes.slice.bind(validPdfBytes),
};
const validPdfUpload = await customerSupabase.storage
  .from('staged_uploads')
  .upload('staged/user/test/supporting/good.pdf', validPdf, { upsert: false });
assert.equal(validPdfUpload.error, null);
assert.equal(uploadProviderCalls, 1);
assert.equal(uploaded[0].storagePath, 'staged/user/test/supporting/good.pdf');

const oversized = {
  name: 'oversized.pdf',
  size: 50 * 1024 * 1024 + 1,
  type: 'application/pdf',
  slice: validPdfBytes.slice.bind(validPdfBytes),
};
const oversizedUpload = await customerSupabase.storage
  .from('staged_uploads')
  .upload('staged/user/test/supporting/oversized.pdf', oversized, { upsert: false });
assert.equal(oversizedUpload.error.code, 'UPLOAD_TOO_LARGE');
assert.equal(uploadProviderCalls, 1);

console.log('phase1-admission-core-mode-contract-smoke: PASS');
