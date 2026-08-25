import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync('api/admin-run-worker.js', 'utf8');
const p0c = fs.readFileSync('supabase/migrations/20260818120000_p0_c_publication_finalization.sql', 'utf8');

const index = (source, token, label) => {
  const value = source.indexOf(token);
  assert.notEqual(value, -1, `${label} must exist`);
  return value;
};
const indexAfter = (source, token, after, label) => {
  const value = source.indexOf(token, after);
  assert.notEqual(value, -1, `${label} must exist`);
  return value;
};

const manifestFinalize = index(
  worker,
  'const reportQualityManifest = finalizeReportQualityManifest({',
  'final Manifest construction'
);
const manifestPersist = indexAfter(
  worker,
  "type: 'report_quality_manifest'",
  manifestFinalize,
  'final Manifest persistence'
);
const commitReady = index(
  worker,
  'publicationCommitReady: true',
  'publication commit checkpoint'
);
const publishTransition = index(
  worker,
  "const publishedUpdate = await transitionWorkerJob(job, 'publishing', 'published'",
  'publishing to published transition'
);
const postPublicationPromotion = index(
  worker,
  'revisionPromotionResolution = await promoteReportRevisionToCurrent({',
  'post-publication revision promotion'
);

assert.ok(manifestFinalize < manifestPersist, 'Manifest must be finalized before persistence');
assert.ok(manifestPersist < commitReady, 'Manifest must persist before publication commit readiness');
assert.ok(commitReady < publishTransition, 'publication commit readiness must precede governed published transition');
assert.ok(publishTransition < postPublicationPromotion, 'revision promotion must occur only after receipt-backed publication');

assert.match(
  worker,
  /checkpoint\?\.publicationCommitReady !== true[\s\S]*?checkpoint\?\.verifiedDownloadArtifact !== true/,
  'late-error preservation must require publication commit readiness'
);
assert.match(
  worker,
  /checkpoint\?\.creditReconciliationAttempted !== true/,
  'late-error preservation must not repeat an already-attempted credit reconciliation'
);
assert.match(
  worker,
  /loadLatestArtifactPayload\(job\.id, 'report_quality_manifest_candidate'\)/,
  'publication must recover the latest Manifest candidate before declaring it missing'
);
assert.match(
  worker,
  /requeuePublicationCommitFailure\([\s\S]*?'report_quality_manifest_candidate_missing'/,
  'missing Manifest candidate must requeue publication rather than publish'
);
assert.match(
  worker,
  /requeuePublicationCommitFailure\([\s\S]*?'report_quality_manifest_finalize_failed'/,
  'Manifest finalization failure must requeue publication rather than publish'
);
assert.match(
  worker,
  /to_status: 'queued',[\s\S]*?deferredJobIds\.add\(job\.id\)/,
  'publication-commit requeues must defer the job for the remainder of the invocation'
);
assert.match(
  worker,
  /update\(\{ report_credits: currentCredits \}\)[\s\S]*?eq\('report_credits', currentCredits - 1\)/,
  'credit receipt failure must attempt compare-and-set compensation of the secondary counter'
);
assert.match(
  worker,
  /state: creditResult\.error \? 'secondary_reconciliation_required' : 'reconciled'/,
  'Manifest must record secondary credit reconciliation state without giving it publication authority'
);

const finalizeRpc = index(
  p0c,
  'create or replace function public.finalize_worker_publication',
  'P0-C governed publication finalization RPC'
);
const sqlManifestRequired = index(
  p0c,
  "raise exception 'PUBLICATION_QUALITY_MANIFEST_REQUIRED'",
  'P0-C Manifest requirement'
);
const sqlReceiptInsert = index(
  p0c,
  'insert into public.report_publication_receipts',
  'P0-C publication receipt insert'
);
const sqlPublishedUpdate = index(
  p0c,
  "set status = 'published'",
  'P0-C published status update'
);

assert.ok(finalizeRpc < sqlManifestRequired, 'P0-C finalizer must govern the Manifest prerequisite');
assert.ok(sqlManifestRequired < sqlReceiptInsert, 'P0-C must require Manifest before publication receipt');
assert.ok(sqlReceiptInsert < sqlPublishedUpdate, 'P0-C must create publication receipt before published status');
assert.match(
  p0c,
  /if p_next_status = 'published' then[\s\S]*?finalize_worker_publication/,
  'transition_worker_job must delegate published transitions to P0-C finalization authority'
);
assert.match(
  p0c,
  /where pr\.report_id = v_target\.id and pr\.publication_status = 'complete'[\s\S]*?v_job\.status <> 'published'/,
  'revision promotion must remain receipt-backed and published-job-backed'
);

console.log('PASS full-underwriting-publication-atomicity-regression');
