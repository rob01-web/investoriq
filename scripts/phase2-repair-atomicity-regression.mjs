import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const relativePath = 'tests/qa/full-underwriting-publication-atomicity-regression.js';
const expectedBlob = '936da6eeb54d9f1fb652e917619d958d348c6b1e';

function git(...args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function fail(message) {
  throw new Error(`STOP: ${message}`);
}

const currentBlob = git('hash-object', '--', relativePath);
if (currentBlob !== expectedBlob) {
  fail(`${relativePath} changed unexpectedly. Expected ${expectedBlob}, found ${currentBlob}.`);
}

const replacement = `import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync('api/admin-run-worker.js', 'utf8');
const phase2 = fs.readFileSync(
  'supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql',
  'utf8'
);

const index = (source, token, label) => {
  const value = source.indexOf(token);
  assert.notEqual(value, -1, \`\${label} must exist\`);
  return value;
};
const indexAfter = (source, token, after, label) => {
  const value = source.indexOf(token, after);
  assert.notEqual(value, -1, \`\${label} must exist\`);
  return value;
};

// Worker owns Manifest construction, but the database owns publication persistence.
const manifestFinalize = index(
  worker,
  'reportQualityManifest = finalizeReportQualityManifest({',
  'final Manifest construction'
);
const atomicRpc = indexAfter(
  worker,
  'finalize_worker_publication_v2',
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

assert.doesNotMatch(
  worker,
  /transitionWorkerJob\(job,\s*['\"]publishing['\"],\s*['\"]published['\"]/, 
  'worker must not use the generic transition primitive to publish'
);
assert.doesNotMatch(
  worker,
  /promoteReportRevisionToCurrent/,
  'worker must not perform post-publication current-revision promotion'
);
assert.match(
  worker,
  /from\(['\"]customer_published_report_projection['\"]\)/,
  'late-error preservation must prove committed publication through the governed projection'
);
assert.match(
  worker,
  /checkpoint\?\.verifiedDownloadArtifact !== true/,
  'late-error preservation must require a verified download artifact before querying publication proof'
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
  /update\(\{ report_credits: currentCredits \}\)[\s\S]*?eq\('report_credits', currentCredits - 1\)/,
  'credit receipt failure must retain compare-and-set compensation of the secondary counter'
);
assert.match(
  worker,
  /state: creditResult\.error \? 'secondary_reconciliation_required' : 'reconciled'/,
  'Manifest must record secondary credit reconciliation without giving it publication authority'
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

assert.match(
  phase2,
  /p_manifest_payload\s*#>>\s*'\{publication,state\}'/,
  'atomic finalizer must validate the nested final Manifest publication state'
);
assert.match(
  phase2,
  /p_manifest_payload\s*#>>\s*'\{publication,storagePath\}'[\s\S]*?PUBLICATION_FINAL_MANIFEST_STORAGE_MISMATCH/,
  'final Manifest storage path must match the report lineage'
);
assert.match(
  phase2,
  /PUBLICATION_CURRENT_REVISION_INVARIANT_FAILED/,
  'atomic finalizer must enforce exactly one current revision'
);
assert.match(
  phase2,
  /create or replace function public\.finalize_worker_publication\([\s\S]*?PUBLICATION_ATOMIC_V2_REQUIRED/,
  'legacy publication finalizer must be disabled in favor of v2'
);
assert.match(
  phase2,
  /if p_next_status = 'published' then[\s\S]*?PUBLICATION_ATOMIC_V2_REQUIRED/,
  'generic worker transition must refuse published state'
);
assert.match(
  phase2,
  /drop trigger if exists analysis_jobs_promote_report_revision_trigger/,
  'historical trigger-based revision promotion must be removed'
);
assert.match(
  phase2,
  /customer_published_report_projection/,
  'customer visibility must be derived from complete publication lineage'
);

console.log('PASS full-underwriting-publication-atomicity-regression');
`;

fs.writeFileSync(path.join(repoRoot, relativePath), replacement, 'utf8');
console.log('Phase 2 stale atomicity regression repaired.');
