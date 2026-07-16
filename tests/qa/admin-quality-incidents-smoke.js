import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const apiSource = read('api/admin/quality-incidents.js');
const projectionSource = read('api/_lib/report-quality-incident-projection.js');
const dashboardSource = read('src/components/Admin/QualityIncidentDashboard.jsx');
const adminPageSource = read('src/pages/AdminDashboard.jsx');
const workerSource = read('api/admin-run-worker.js');
const generatorSource = read('api/_lib/generate-client-report-impl.js');

assert.match(apiSource, /'report_quality_manifest'/);
assert.match(apiSource, /'delivery_gate_decision'/);
assert.match(apiSource, /'quality_incident_action'/);
assert.match(apiSource, /\.in\('type', ALLOWED_ARTIFACT_TYPES\)/);
assert.doesNotMatch(apiSource, /\.from\(['"]analysis_job_files['"]\)/);
assert.doesNotMatch(apiSource, /\.from\(['"]reports['"]\)/);
assert.doesNotMatch(apiSource, /worker_event|final_html|parser_label|original_filename/);
assert.match(apiSource, /canonical_report_quality_manifest/);
assert.match(apiSource, /canonical_delivery_decision/);
assert.match(apiSource, /legacyAliasFallbackAllowed:\s*false/);
assert.match(apiSource, /reconstructionFromRawArtifactsAllowed:\s*false/);
assert.match(apiSource, /creditMutationPerformed:\s*false/);
assert.match(apiSource, /financialMutationPerformed:\s*false/);

assert.match(projectionSource, /REPORT_QUALITY_INCIDENT_FINAL_MANIFEST_REQUIRED/);
assert.match(projectionSource, /collapse_expected/);
assert.match(projectionSource, /collapse_unexpected/);
assert.match(projectionSource, /collapse_requires_review/);
assert.match(projectionSource, /PUBLISHED_WITH_LIMITATIONS/);
assert.match(projectionSource, /CANONICAL_DELIVERY_DECISION_MISSING/);
assert.doesNotMatch(projectionSource, /legacy_compatibility|customer_publish_eligible|report_publishable/);

assert.match(dashboardSource, /\/api\/admin\/quality-incidents/);
assert.doesNotMatch(dashboardSource, /queue-metrics|analysis_job_files|worker_event|final_html/);
assert.match(dashboardSource, /They do not override Source Truth, Delivery Gate, publication, credits, or billing\./);
assert.doesNotMatch(dashboardSource, /upload replacement|request replacement documents|user_needs_documents/i);
assert.doesNotMatch(apiSource, /upload replacement|request replacement documents|user_needs_documents/i);
assert.doesNotMatch(projectionSource, /upload replacement|request replacement documents|user_needs_documents/i);
assert.match(adminPageSource, /<QualityIncidentDashboard adminRunKey=\{adminRunKey\} \/>/);

assert.match(workerSource, /finalizeBlockedReportQualityManifest/);
assert.match(workerSource, /deliveryDecision:\s*resolvedDeliveryDecision\.deliveryDecisionState/);
assert.match(workerSource, /type:\s*'report_quality_manifest'/);
assert.match(generatorSource, /Failed to build blocked Acquisition Memo Report Quality Manifest candidate/);
assert.match(generatorSource, /report_quality_manifest_candidate:\s*reportQualityManifestCandidate/);

console.log('admin-quality-incidents-smoke: PASS');
