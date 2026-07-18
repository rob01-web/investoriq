import assert from 'node:assert/strict';
import {
  buildReportQualityManifestCandidate,
  buildUnavailableReportQualityManifestCandidate,
  finalizeBlockedReportQualityManifest,
  finalizeReportQualityManifest,
} from '../../api/_lib/report-quality-manifest.js';
import {
  buildReportQualityIncidentProjection,
  buildReportQualityIncidentRollup,
  extractCanonicalDeliveryDecisionState,
  REPORT_QUALITY_INCIDENT_PROJECTION_CONTRACT,
} from '../../api/_lib/report-quality-incident-projection.js';

const deliverable = {
  source: 'canonical_delivery_decision',
  delivery_gate_status: 'deliverable',
  customer_delivery_allowed: true,
  hold_delivery: false,
  core_valid_required_coverage: true,
};

const blocked = {
  source: 'canonical_delivery_decision',
  delivery_gate_status: 'blocked',
  customer_delivery_allowed: false,
  hold_delivery: true,
  core_valid_required_coverage: true,
  customer_status_reason_code: 'REPORT_CONTRACT_FAILED',
};

const sourceTruth = {
  source: 'canonical_source_truth_package',
  schema_version: 1,
  core_publishable: true,
  true_blockers: [],
  core: {
    t12: {
      status: 'accepted_complete',
      artifact_id: 't12-artifact',
      file_id: 't12-file',
      original_filename: 'T12.xlsx',
      accepted_facts: { net_operating_income: 500000 },
      evidence: { sufficiency_state: { status: 'validated' } },
    },
    rent_roll: {
      status: 'accepted_complete',
      artifact_id: 'rr-artifact',
      file_id: 'rr-file',
      original_filename: 'Rent Roll.xlsx',
      accepted_facts: { total_units: 50 },
      evidence: { sufficiency_state: { status: 'validated' } },
    },
  },
  support: {
    accepted: [],
    advisory: [],
    rejected: [],
    adjudication_decisions: [],
    conflicts: [],
    duplicates: [],
  },
  section_policy: {
    operating_statement: 'render',
    operating_profile: 'render',
  },
  disclosures: [],
};

function publishedManifest(jobId = 'incident-clean') {
  const candidate = buildReportQualityManifestCandidate({
    jobId,
    userId: 'incident-user',
    reportFamily: 'screening',
    reportType: 'screening',
    reportMode: 'screening_v1',
    propertyName: 'Incident Test Property',
    generatedAt: '2026-07-15T21:00:00.000Z',
    sourceTruthPackage: sourceTruth,
    deterministicContractQaSeal: { ok: true, status: 'sealed', issues: [] },
    deliveryDecision: deliverable,
  });
  return finalizeReportQualityManifest({
    candidate,
    reportId: `${jobId}-report`,
    storagePath: `incident-user/${jobId}-report.pdf`,
    deliveryDecision: deliverable,
    finalPdfPublicationQualityBoss: { ok: true, status: 'certified' },
    finalizedAt: '2026-07-15T21:01:00.000Z',
  });
}

const cleanManifest = publishedManifest();
const clean = buildReportQualityIncidentProjection({ manifest: cleanManifest, canonicalDeliveryDecision: deliverable });
assert.equal(clean.queue, 'PUBLISHED_CLEAN');
assert.equal(clean.customerAttentionRisk, 'LOW');
assert.equal(clean.events.length, 0);
assert.equal(Object.isFrozen(clean), true);

const expectedCollapseManifest = structuredClone(publishedManifest('incident-expected-collapse'));
expectedCollapseManifest.sections[0].outcome = 'collapsed';
expectedCollapseManifest.sections[0].expected = true;
expectedCollapseManifest.sections[0].reviewRequired = false;
const expectedCollapse = buildReportQualityIncidentProjection({
  manifest: expectedCollapseManifest,
  canonicalDeliveryDecision: deliverable,
});
assert.equal(expectedCollapse.queue, 'PUBLISHED_WITH_LIMITATIONS');
assert.equal(expectedCollapse.customerAttentionRisk, 'LOW');
assert.ok(expectedCollapse.collapse.classifications.includes('collapse_expected'));

const unexpectedCollapseManifest = structuredClone(publishedManifest('incident-unexpected-collapse'));
unexpectedCollapseManifest.sections[0].outcome = 'collapsed';
unexpectedCollapseManifest.sections[0].expected = false;
unexpectedCollapseManifest.sections[0].reviewRequired = false;
const unexpectedCollapse = buildReportQualityIncidentProjection({
  manifest: unexpectedCollapseManifest,
  canonicalDeliveryDecision: deliverable,
});
assert.equal(unexpectedCollapse.queue, 'PUBLISHED_WITH_LIMITATIONS');
assert.equal(unexpectedCollapse.customerAttentionRisk, 'HIGH');
assert.ok(unexpectedCollapse.collapse.classifications.includes('collapse_unexpected'));

const reviewCollapseManifest = structuredClone(publishedManifest('incident-review-collapse'));
reviewCollapseManifest.sections[0].outcome = 'collapsed';
reviewCollapseManifest.sections[0].expected = true;
reviewCollapseManifest.sections[0].reviewRequired = true;
const reviewCollapse = buildReportQualityIncidentProjection({
  manifest: reviewCollapseManifest,
  canonicalDeliveryDecision: deliverable,
});
assert.ok(reviewCollapse.collapse.classifications.includes('collapse_requires_review'));
assert.equal(reviewCollapse.remedy.level, 2);

const conflictManifest = structuredClone(publishedManifest('incident-conflict'));
conflictManifest.documents.push({
  documentClass: 'support',
  documentId: 'conflict-file',
  sourceIdentityKey: 'support:file:conflict-file',
  acceptedFacts: {},
  sourcePresent: true,
  roleAccepted: false,
  factAccepted: false,
  sourceBacked: false,
  sectionDisplayReady: false,
  conflict: { state: 'conflicting', reasons: ['contradictory_fact_bundle'] },
  duplicate: { state: 'none', duplicateOf: null },
  extraction: { state: 'text_available', warnings: [] },
  candidateRoles: ['purchase_assumptions'],
});
const conflict = buildReportQualityIncidentProjection({ manifest: conflictManifest, canonicalDeliveryDecision: deliverable });
assert.equal(conflict.queue, 'PUBLISHED_WITH_LIMITATIONS');
assert.equal(conflict.customerAttentionRisk, 'MEDIUM');
assert.equal(conflict.events.some((entry) => entry.code === 'SUPPORT_SOURCE_CONFLICT'), true);

const factConflictManifest = structuredClone(publishedManifest('incident-fact-conflict'));
factConflictManifest.documents.push({
  documentClass: 'support',
  documentId: 'fact-conflict-file',
  sourceIdentityKey: 'support:file:fact-conflict-file',
  adjudicatedRole: 'purchase_assumptions',
  acceptedFacts: { proposed_loan_amount: 9450000 },
  rejectedFacts: { rate_structure: 'fixed' },
  sourcePresent: true,
  roleAccepted: true,
  factAccepted: true,
  sourceBacked: true,
  sectionDisplayReady: true,
  conflict: { state: 'fact_conflict', reasons: ['conflicting_accepted_fact:rate_structure'] },
  duplicate: { state: 'none', duplicateOf: null },
  extraction: { state: 'text_available', warnings: [] },
  candidateRoles: ['purchase_assumptions'],
});
const factConflict = buildReportQualityIncidentProjection({
  manifest: factConflictManifest,
  canonicalDeliveryDecision: deliverable,
});
assert.equal(factConflict.queue, 'PUBLISHED_WITH_LIMITATIONS');
assert.equal(factConflict.customerAttentionRisk, 'MEDIUM');
assert.equal(factConflict.events.some((entry) => entry.code === 'SUPPORT_FACT_CONFLICT'), true);
assert.equal(factConflict.events.some((entry) => entry.customerVisible === true), false);

const unavailable = buildUnavailableReportQualityManifestCandidate({
  jobId: 'incident-blocked',
  userId: 'incident-user',
  reportFamily: 'acquisition_memo',
  reportType: 'underwriting',
  reportMode: 'v1_core',
  propertyName: 'Blocked Incident Property',
  blockerCode: 'REPORT_RENDER_FAILED',
});
const blockedManifest = finalizeBlockedReportQualityManifest({
  candidate: unavailable,
  deliveryDecision: blocked,
  terminalOutcome: {
    code: 'REPORT_RENDER_FAILED',
    failureClass: 'internal_system_failure',
    retrySafe: true,
  },
  creditState: { state: 'restored' },
  remedyState: { state: 'internal_review_required' },
});
const blockedIncident = buildReportQualityIncidentProjection({ manifest: blockedManifest, canonicalDeliveryDecision: blocked });
assert.equal(blockedIncident.queue, 'BLOCKED');
assert.equal(blockedIncident.customerAttentionRisk, 'HIGH');
assert.equal(blockedIncident.responsibility, 'investoriq_defect');
assert.equal(blockedIncident.remedy.level, 3);

const blockedWithExpectedLimitationManifest = structuredClone(blockedManifest);
blockedWithExpectedLimitationManifest.sections.push({
  sectionKey: 'property_tax_context',
  outcome: 'omitted',
  expected: true,
  reviewRequired: false,
  reasonCodes: ['support_authority_unavailable'],
});
const blockedWithExpectedLimitation = buildReportQualityIncidentProjection({
  manifest: blockedWithExpectedLimitationManifest,
  canonicalDeliveryDecision: blocked,
});
assert.equal(blockedWithExpectedLimitation.events.some((entry) => entry.code === 'COLLAPSE_EXPECTED'), true);
assert.equal(blockedWithExpectedLimitation.responsibility, 'investoriq_defect');

const missingDeliveryManifest = finalizeBlockedReportQualityManifest({
  candidate: buildUnavailableReportQualityManifestCandidate({
    jobId: 'incident-missing-delivery',
    reportFamily: 'acquisition_memo',
    blockerCode: 'SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED',
  }),
  terminalOutcome: {
    code: 'SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED',
    failureClass: 'internal_system_failure',
  },
});
const missingDelivery = buildReportQualityIncidentProjection({
  manifest: missingDeliveryManifest,
  canonicalDeliveryDecision: {
    delivery_gate_status: 'deliverable',
    customer_delivery_allowed: true,
    hold_delivery: false,
  },
});
assert.equal(missingDelivery.queue, 'BLOCKED');
assert.equal(missingDelivery.events.some((entry) => entry.code === 'CANONICAL_DELIVERY_DECISION_MISSING'), true);
assert.equal(extractCanonicalDeliveryDecisionState({ customer_delivery_allowed: true }), null);
assert.equal(extractCanonicalDeliveryDecisionState({ deliveryDecisionState: deliverable })?.source, 'canonical_delivery_decision');

assert.throws(
  () => buildReportQualityIncidentProjection({
    manifest: buildReportQualityManifestCandidate({
      jobId: 'candidate-only',
      reportFamily: 'screening',
      sourceTruthPackage: sourceTruth,
    }),
  }),
  /REPORT_QUALITY_INCIDENT_FINAL_MANIFEST_REQUIRED/
);

const rollup = buildReportQualityIncidentRollup([
  clean,
  expectedCollapse,
  unexpectedCollapse,
  conflict,
  blockedIncident,
]);
assert.equal(rollup.total, 5);
assert.equal(rollup.queues.PUBLISHED_CLEAN, 1);
assert.equal(rollup.queues.PUBLISHED_WITH_LIMITATIONS, 3);
assert.equal(rollup.queues.BLOCKED, 1);
assert.equal(REPORT_QUALITY_INCIDENT_PROJECTION_CONTRACT.legacyAliasFallbackAllowed, false);

console.log('report-quality-incident-projection-smoke: PASS');
