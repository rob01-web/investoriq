import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const p0a2 = read('supabase/migrations/20260818090000_p0_a2_customer_safe_read_report_removal.sql');
const p0b = read('supabase/migrations/20260818110000_p0_b_job_provenance_lifecycle.sql');
const p0c = read('supabase/migrations/20260818120000_p0_c_publication_finalization.sql');
const p0d = read('supabase/migrations/20260818130000_p0_d_recovery_observability_legacy_quarantine.sql');
const identity = read('api/_lib/report-identity-authority.js');
const customerBoundary = read('api/_lib/customer-boundary-handler.js');
const canonicalDelivery = read('api/_lib/canonical-delivery-action.js');
const premiumReceipt = read('api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js');
const workerKick = read('.github/workflows/worker-kick.yml');
const vercel = read('vercel.json');

// 1. Customer trust boundary / governed admission.
assert.match(p0a2, /revoke select on table public\.analysis_artifacts from authenticated/i);
assert.match(p0a2, /revoke delete on table public\.reports from anon, authenticated/i);
assert.match(p0b, /create function public\.consume_purchase_and_create_job\s*\(/i);
assert.match(p0b, /grant execute on function public\.consume_purchase_and_create_job\(text, jsonb, jsonb\) to authenticated/i);
assert.match(p0b, /ADMISSION_CURRENT_DISCLOSURE_SESSION_REQUIRED/);
assert.match(p0b, /ADMISSION_STAGED_OBJECT_METADATA_MISMATCH/);
assert.match(p0b, /analysis_job_admission_receipts/);

// 2. Single exact claim / bounded lifecycle / recovery.
assert.match(p0b, /create or replace function public\.claim_worker_job\s*\(/i);
assert.match(p0b, /revoke all on function public\.claim_next_worker_job\(text\).*service_role/i);
assert.match(p0b, /create or replace function public\.requeue_worker_job\s*\(/i);
assert.match(p0b, /worker_effective_attempt_limit/);
assert.match(p0d, /restore_job_entitlement_on_exhaustion/);
assert.match(p0d, /begin_worker_recovery_episode/);
assert.match(p0d, /worker_operational_status/);
assert.match(p0d, /legacy_job_reconciliation_decisions/);

// 3. Explicit current product identity and Premium isolation.
assert.match(identity, /reportFamily:\s*["']full_underwriting["']/);
assert.doesNotMatch(identity, /reportFamily:\s*["']acquisition_memo["']/);
assert.match(p0b, /product_identity in \('screening', 'full_underwriting'\)/i);
assert.match(premiumReceipt, /Premium OFF means outside the active authority graph/i);
assert.match(premiumReceipt, /if \(!capability\)/);

// 4. Canonical delivery and publication authority.
assert.match(canonicalDelivery, /DELIVER_WITH_QUALITY_INCIDENT/);
assert.match(canonicalDelivery, /DELIVER/);
assert.match(p0c, /create or replace function public\.finalize_worker_publication\s*\(/i);
assert.match(p0c, /report_publication_receipts/);
assert.match(p0c, /PUBLICATION_QUALITY_MANIFEST_REQUIRED/);
assert.match(p0c, /PUBLICATION_CANONICAL_DELIVERY_DECISION_REQUIRED/);
assert.match(p0c, /create or replace function public\.promote_report_revision_to_current\s*\(/i);
assert.match(p0c, /report_revision_has_published_analysis_job/);

// 5. Customer visibility is server-governed and lineage-fenced.
assert.match(customerBoundary, /customer-report-removal/);
assert.match(customerBoundary, /customer-job-status/);
assert.doesNotMatch(customerBoundary, /source_truth_package/);
assert.doesNotMatch(customerBoundary, /premium_acquisition_underwriting/);
assert.doesNotMatch(customerBoundary, /worker_recovery_episodes/);

// 6. Automatic scheduler remains external to GitHub manual fallback; Vercel budget remains consolidated.
assert.match(workerKick, /workflow_dispatch/);
assert.doesNotMatch(workerKick, /schedule:/);
assert.match(vercel, /customer-job-status/);
assert.match(vercel, /customer-report-removal/);

console.log('PASS launch-critical architecture authority smoke');
