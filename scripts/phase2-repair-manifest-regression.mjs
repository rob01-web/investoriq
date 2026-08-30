import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const testPath = path.join(repoRoot, 'tests/qa/report-quality-manifest-smoke.js');

function fail(message) {
  throw new Error(`STOP: ${message}`);
}

let text = fs.readFileSync(testPath, 'utf8').replace(/\r\n/g, '\n');

const ownerBlock = `const manifestOwnerSource = fs.readFileSync(\n  path.join(repoRoot, "api/_lib/report-quality-manifest.js"),\n  "utf8"\n);\n`;
const ownerReplacement = `${ownerBlock}const phase2PublicationMigrationSource = fs.readFileSync(\n  path.join(repoRoot, "supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql"),\n  "utf8"\n);\n`;

if (!text.includes(ownerBlock)) {
  fail('Manifest smoke owner-source block changed unexpectedly.');
}
if (text.includes('phase2PublicationMigrationSource')) {
  fail('Manifest smoke already contains the Phase 2 publication migration authority.');
}
text = text.replace(ownerBlock, ownerReplacement);

const oldBlock = `assert.match(workerSource, /finalizeReportQualityManifest/);\nassert.match(workerSource, /finalizeBlockedReportQualityManifest/);\nassert.match(workerSource, /type:\\s*'report_quality_manifest'/);\nassert.match(workerSource, /customer_delivery_unchanged:\\s*true/);\nconst creditReconciliationIndex = workerSource.indexOf(\n  "const creditResult = await consumeCreditOnce(job)"\n);\nconst manifestCandidateIndex = workerSource.indexOf(\n  "let manifestCandidate = reportData?.report_quality_manifest_candidate"\n);\nconst manifestPersistenceIndex = workerSource.indexOf(\n  "type: 'report_quality_manifest'",\n  manifestCandidateIndex\n);\nconst publicationCommitReadyIndex = workerSource.indexOf(\n  "publicationCommitReady: true",\n  manifestPersistenceIndex\n);\nconst publishedTransitionIndex = workerSource.indexOf(\n  "const publishedUpdate = await transitionWorkerJob(job, 'publishing', 'published'",\n  publicationCommitReadyIndex\n);\n\nassert.notEqual(creditReconciliationIndex, -1, "Credit reconciliation must remain wired before publication finalization");\nassert.notEqual(manifestCandidateIndex, -1, "Publication path must resolve the Report Quality Manifest candidate");\nassert.notEqual(manifestPersistenceIndex, -1, "Publication path must persist the Report Quality Manifest");\nassert.notEqual(publicationCommitReadyIndex, -1, "Publication path must explicitly seal publicationCommitReady");\nassert.notEqual(publishedTransitionIndex, -1, "Publication path must use the governed publishing -> published transition");\nassert.ok(\n  creditReconciliationIndex < manifestCandidateIndex &&\n    manifestCandidateIndex < manifestPersistenceIndex &&\n    manifestPersistenceIndex < publicationCommitReadyIndex &&\n    publicationCommitReadyIndex < publishedTransitionIndex,\n  "Publication atomicity requires credit reconciliation, Manifest persistence, publication-commit readiness, then governed published transition"\n);\n`;

const newBlock = `assert.match(workerSource, /finalizeReportQualityManifest/);\nassert.match(workerSource, /finalizeBlockedReportQualityManifest/);\nassert.match(workerSource, /finalize_worker_publication_v2/);\nassert.match(workerSource, /customer_delivery_unchanged:\\s*true/);\nassert.doesNotMatch(\n  workerSource,\n  /transitionWorkerJob\\(job,\\s*['"]publishing['"],\\s*['"]published['"]/\n);\n\nconst creditReconciliationIndex = workerSource.indexOf(\n  "const creditResult = await consumeCreditOnce(job)"\n);\nconst manifestCandidateIndex = workerSource.indexOf(\n  "let manifestCandidate = reportData?.report_quality_manifest_candidate"\n);\nconst manifestFinalizeIndex = workerSource.indexOf(\n  "reportQualityManifest = finalizeReportQualityManifest(",\n  manifestCandidateIndex\n);\nconst atomicPublicationIndex = workerSource.indexOf(\n  "'finalize_worker_publication_v2'",\n  manifestFinalizeIndex\n);\nconst publicationCommitReadyIndex = workerSource.indexOf(\n  "publicationCommitReady: true",\n  atomicPublicationIndex\n);\n\nassert.notEqual(creditReconciliationIndex, -1, "Credit reconciliation must remain wired before publication finalization");\nassert.notEqual(manifestCandidateIndex, -1, "Publication path must resolve the Report Quality Manifest candidate");\nassert.notEqual(manifestFinalizeIndex, -1, "Worker must finalize the Report Quality Manifest payload before atomic publication");\nassert.notEqual(atomicPublicationIndex, -1, "Worker must delegate publication to finalize_worker_publication_v2");\nassert.notEqual(publicationCommitReadyIndex, -1, "Publication path must seal publicationCommitReady only after the atomic commit returns");\nassert.ok(\n  creditReconciliationIndex < manifestCandidateIndex &&\n    manifestCandidateIndex < manifestFinalizeIndex &&\n    manifestFinalizeIndex < atomicPublicationIndex &&\n    atomicPublicationIndex < publicationCommitReadyIndex,\n  "Phase 2 publication ordering requires credit reconciliation, Manifest finalization, atomic publication, then commit readiness"\n);\n\nconst manifestPersistenceIndex = phase2PublicationMigrationSource.indexOf(\n  "insert into public.analysis_artifacts"\n);\nconst manifestTypeIndex = phase2PublicationMigrationSource.indexOf(\n  "'report_quality_manifest'",\n  manifestPersistenceIndex\n);\nconst receiptPersistenceIndex = phase2PublicationMigrationSource.indexOf(\n  "insert into public.report_publication_receipts",\n  manifestTypeIndex\n);\nconst publishedCommitIndex = phase2PublicationMigrationSource.indexOf(\n  "set status = 'published'",\n  receiptPersistenceIndex\n);\nconst currentRevisionIndex = phase2PublicationMigrationSource.indexOf(\n  "set is_current_revision = true",\n  publishedCommitIndex\n);\n\nassert.notEqual(manifestPersistenceIndex, -1, "Atomic finalizer must persist the Report Quality Manifest artifact");\nassert.notEqual(manifestTypeIndex, -1, "Atomic finalizer must persist the report_quality_manifest artifact type");\nassert.notEqual(receiptPersistenceIndex, -1, "Atomic finalizer must persist the publication receipt");\nassert.notEqual(publishedCommitIndex, -1, "Atomic finalizer must commit the job as published");\nassert.notEqual(currentRevisionIndex, -1, "Atomic finalizer must establish the current revision");\nassert.ok(\n  manifestPersistenceIndex < receiptPersistenceIndex &&\n    receiptPersistenceIndex < publishedCommitIndex &&\n    publishedCommitIndex < currentRevisionIndex,\n  "Manifest artifact, publication receipt, published job, and current revision must be established by one atomic finalizer in governed order"\n);\n`;

if (!text.includes(oldBlock)) {
  fail('Stale manifest publication regression block changed unexpectedly.');
}
text = text.replace(oldBlock, newBlock);

fs.writeFileSync(testPath, text, 'utf8');
console.log('Phase 2 stale manifest regression repaired.');
