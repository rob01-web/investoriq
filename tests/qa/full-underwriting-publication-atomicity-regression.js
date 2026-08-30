import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync('api/admin-run-worker.js', 'utf8');
const phase2 = fs.readFileSync(
  'supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql',
  'utf8'
);

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
const includes = (source, token, label) => {
  assert.equal(source.includes(token), true, `${label} must exist`);
};
const excludes = (source, token, label) => {
  assert.equal(source.includes(token), false, `${label} must be absent`);
};

// Worker constructs the final Manifest, then delegates the publication commit to one DB RPC.
const manifestFinalize = index(
  worker,
  'reportQualityManifest = finalizeReportQualityManifest({',
  'final Manifest construction'
);
const atomicRpc = indexAfter(
  worker,
  "'finalize_worker_publication_v2'",
  manifestFinalize,
  'atomic publication RPC'
);
const commitReady = indexAfter(
  worker,
  'publicationCommitReady: true',
  atomicRpc,
  'post-commit publication checkpoint'
);
const publishedEvent = indexAfter(
  worker,
  "to_status: 'published'",
  commitReady,
  'published transition evidence'
);

assert.ok(manifestFinalize < atomicRpc, 'Manifest must be finalized before the atomic publication RPC');
assert.ok(atomicRpc < commitReady, 'publicationCommitReady may be sealed only after the atomic RPC succeeds');
assert.ok(commitReady < publishedEvent, 'published transition evidence must follow the atomic publication commit');

excludes(
  worker,
  "transitionWorkerJob(job, 'publishing', 'published'",
  'generic worker publication transition'
);
excludes(
  worker,
  'promoteReportRevisionToCurrent',
  'post-publication current-revision promotion'
);
includes(
  worker,
  ".from('customer_published_report_projection')",
  'governed publication proof for late-error preservation'
);
includes(
  worker,
  'checkpoint?.verifiedDownloadArtifact !== true',
  'verified artifact requirement for late-error preservation'
);
includes(
  worker,
  "loadLatestArtifactPayload(job.id, 'report_quality_manifest_candidate')",
  'Manifest candidate recovery'
);
includes(
  worker,
  "'report_quality_manifest_candidate_missing'",
  'missing Manifest candidate recovery route'
);
includes(
  worker,
  "'report_quality_manifest_finalize_failed'",
  'Manifest finalization recovery route'
);
excludes(
  worker,
  'update({ report_credits: currentCredits })',
  'secondary profile-credit mutation'
);
excludes(
  worker,
  ".eq('report_credits', currentCredits - 1)",
  'secondary profile-credit predicate'
);
includes(
  worker,
  "authority: 'report_purchases'",
  'Manifest authoritative admission entitlement state'
);

// Phase 2 SQL is the sole atomic publication authority.
const finalizeRpc = index(
  phase2,
  'create or replace function public.finalize_worker_publication_v2',
  'Phase 2 atomic publication finalizer'
);
const sqlManifestRequired = indexAfter(
  phase2,
  "raise exception 'PUBLICATION_FINAL_MANIFEST_REQUIRED'",
  finalizeRpc,
  'final Manifest prerequisite'
);
const sqlManifestInsert = indexAfter(
  phase2,
  'insert into public.analysis_artifacts',
  sqlManifestRequired,
  'final Manifest persistence'
);
const sqlReceiptInsert = indexAfter(
  phase2,
  'insert into public.report_publication_receipts',
  sqlManifestInsert,
  'publication receipt insert'
);
const sqlPublishedUpdate = indexAfter(
  phase2,
  "set status = 'published'",
  sqlReceiptInsert,
  'published job update'
);
const sqlCurrentPromotion = indexAfter(
  phase2,
  'set is_current_revision = true',
  sqlPublishedUpdate,
  'current revision promotion'
);

assert.ok(finalizeRpc < sqlManifestRequired, 'atomic finalizer must govern the final Manifest prerequisite');
assert.ok(sqlManifestRequired < sqlManifestInsert, 'Manifest must be validated before persistence');
assert.ok(sqlManifestInsert < sqlReceiptInsert, 'Manifest persistence must precede the publication receipt');
assert.ok(sqlReceiptInsert < sqlPublishedUpdate, 'publication receipt must precede published job state');
assert.ok(sqlPublishedUpdate < sqlCurrentPromotion, 'current revision must be promoted inside the same transaction after publication lineage is established');

includes(
  phase2,
  "p_manifest_payload #>> '{publication,state}'",
  'nested final Manifest publication-state validation'
);
includes(
  phase2,
  "p_manifest_payload #>> '{publication,storagePath}'",
  'nested final Manifest storage-path validation'
);
includes(
  phase2,
  'PUBLICATION_FINAL_MANIFEST_STORAGE_MISMATCH',
  'Manifest/report storage-lineage mismatch guard'
);
includes(
  phase2,
  'PUBLICATION_CURRENT_REVISION_INVARIANT_FAILED',
  'exactly-one-current-revision invariant'
);

const legacyFinalizer = index(
  phase2,
  'create or replace function public.finalize_worker_publication(',
  'disabled legacy publication finalizer'
);
const legacyFinalizerGuard = indexAfter(
  phase2,
  'PUBLICATION_ATOMIC_V2_REQUIRED',
  legacyFinalizer,
  'legacy publication finalizer rejection'
);
assert.ok(legacyFinalizer < legacyFinalizerGuard);

const transitionFunction = index(
  phase2,
  'create or replace function public.transition_worker_job(',
  'worker transition primitive'
);
const genericPublishGuard = indexAfter(
  phase2,
  "if p_next_status = 'published' then",
  transitionFunction,
  'generic published-transition guard'
);
const genericPublishRejection = indexAfter(
  phase2,
  'PUBLICATION_ATOMIC_V2_REQUIRED',
  genericPublishGuard,
  'generic published-transition rejection'
);
assert.ok(transitionFunction < genericPublishGuard && genericPublishGuard < genericPublishRejection);

includes(
  phase2,
  'drop trigger if exists analysis_jobs_promote_report_revision_trigger',
  'historical trigger-based revision promotion removal'
);
includes(
  phase2,
  'customer_published_report_projection',
  'customer publication lineage projection'
);

console.log('PASS full-underwriting-publication-atomicity-regression');
