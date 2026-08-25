import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildReportQualityManifestCandidate,
  buildUnavailableReportQualityManifestCandidate,
  finalizeBlockedReportQualityManifest,
  finalizeReportQualityManifest,
  REPORT_QUALITY_MANIFEST_CONTRACT,
  validateReportQualityManifest,
} from "../../api/_lib/report-quality-manifest.js";

const acceptedPurchaseDecision = {
  authorityVersion: "support_document_authority_v1",
  fileId: "support-purchase",
  originalFilename: "Purchase Assumptions.pdf",
  sourcePresent: true,
  extractionState: "text_available",
  adjudicationState: "accepted",
  canonicalRole: "purchase_assumptions",
  roleAccepted: true,
  acceptedFacts: {
    purchase_price: 13500000,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
  acceptedFactEvidence: {
    purchase_price: { excerpt: "Purchase Price $13,500,000" },
    proposed_loan_amount: { excerpt: "Proposed Loan $9,450,000" },
    ltv: { excerpt: "LTV 70%" },
    interest_rate: { excerpt: "Rate 5.95%" },
    amortization_years: { excerpt: "Amortization 30 years" },
    lender_fee_percent: { excerpt: "Lender Fee 0.85%" },
  },
  sourceBacked: true,
  sectionDisplayReady: true,
  ambiguity: { present: false, reasons: [] },
  candidateMetadata: {
    parserRoles: ["mortgage_statement"],
  },
};

const conflictingAppraisalDecision = {
  authorityVersion: "support_document_authority_v1",
  fileId: "support-appraisal-conflict",
  originalFilename: "Appraisal.pdf",
  sourcePresent: true,
  extractionState: "text_available",
  adjudicationState: "accepted",
  canonicalRole: "appraisal_context",
  roleAccepted: true,
  acceptedFacts: { appraisal_value: 14100000 },
  acceptedFactEvidence: {
    appraisal_value: { excerpt: "As-is value $14,100,000" },
  },
  sourceBacked: true,
  sectionDisplayReady: true,
  ambiguity: { present: false, reasons: [] },
  candidateMetadata: { parserRoles: ["appraisal"] },
};

const ambiguousDebtDecision = {
  authorityVersion: "support_document_authority_v1",
  fileId: "support-mixed-debt",
  originalFilename: "Debt Notes.pdf",
  sourcePresent: true,
  extractionState: "text_available",
  adjudicationState: "ambiguous",
  canonicalRole: null,
  roleAccepted: false,
  acceptedFacts: {},
  acceptedFactEvidence: {},
  sourceBacked: false,
  sectionDisplayReady: false,
  ambiguity: {
    present: true,
    reasons: ["mixed_current_and_proposed_financing"],
  },
  candidateMetadata: {
    parserRoles: ["mortgage_statement", "purchase_assumptions"],
  },
};

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "manifest-job",
  core_publishable: true,
  true_blockers: [],
  core: {
    t12: {
      status: "accepted_complete",
      artifact_id: "artifact-t12",
      file_id: "file-t12",
      original_filename: "T12.xlsx",
      accepted_facts: {
        gross_potential_rent: 1200000,
        effective_gross_income: 1140000,
        total_operating_expenses: 456000,
        net_operating_income: 684000,
      },
      evidence: { sufficiency_state: { status: "validated" } },
    },
    rent_roll: {
      status: "accepted_complete",
      artifact_id: "artifact-rent-roll",
      file_id: "file-rent-roll",
      original_filename: "Rent Roll.xlsx",
      accepted_facts: {
        total_units: 80,
        occupancy: 0.95,
        unit_mix: [{ unit_type: "1BR", units: 40 }],
      },
      evidence: { sufficiency_state: { status: "validated" } },
    },
  },
  support: {
    accepted: [
      {
        file_id: "support-purchase",
        original_filename: "Purchase Assumptions.pdf",
        canonical_role: "purchase_assumptions",
        accepted_facts: acceptedPurchaseDecision.acceptedFacts,
        accepted_fact_evidence: acceptedPurchaseDecision.acceptedFactEvidence,
        authority_decision: acceptedPurchaseDecision,
      },
    ],
    advisory: [
      {
        file_id: "support-appraisal-conflict",
        original_filename: "Appraisal.pdf",
        status: "conflicting",
        authority_decision: conflictingAppraisalDecision,
      },
      {
        file_id: "support-mixed-debt",
        original_filename: "Debt Notes.pdf",
        status: "ambiguous",
        authority_decision: ambiguousDebtDecision,
      },
    ],
    rejected: [],
    adjudication_decisions: [
      acceptedPurchaseDecision,
      conflictingAppraisalDecision,
      ambiguousDebtDecision,
    ],
    conflicts: ["support-appraisal-conflict"],
    duplicates: [],
  },
  section_policy: {
    operating_statement: "render",
    operating_profile: "render",
    debt_structure: "render",
    renovation_strategy: "collapse",
  },
  disclosures: [],
};

const customerSurfaceModel = {
  modelVersion: "acquisition_memo_v2_customer_surface_model_v1",
  coreSources: {
    coreT12: { fileId: "file-t12" },
    coreRentRoll: { fileId: "file-rent-roll" },
  },
  sections: {
    operatingStatementTTMSummary: {
      status: "required",
      sourceRole: "core_t12",
      sourceDoc: { fileId: "file-t12" },
      facts: { net_operating_income: 684000 },
      factAvailability: {
        required: ["net_operating_income"],
        available: ["net_operating_income"],
        missing: [],
        sourceBacked: true,
        sourcePresent: true,
      },
    },
    proposedFinancingContext: {
      status: "required",
      sourceRole: "purchase_assumptions",
      sourceDoc: {
        fileId: "support-purchase",
        acceptedSourceIdentityKey: "support:file:support-purchase",
      },
      facts: acceptedPurchaseDecision.acceptedFacts,
      factAvailability: {
        required: [
          "proposed_loan_amount",
          "ltv",
          "interest_rate",
          "amortization_years",
          "lender_fee_percent",
        ],
        available: [
          "proposed_loan_amount",
          "ltv",
          "interest_rate",
          "amortization_years",
          "lender_fee_percent",
        ],
        missing: [],
        sourceBacked: true,
        sourcePresent: true,
      },
    },
    currentDebtContext: {
      status: "collapsed",
      sourceRole: "current_debt_context",
      facts: {
        current_outstanding_balance: null,
        monthly_payment: null,
      },
      factAvailability: {
        required: ["current_outstanding_balance", "monthly_payment"],
        available: [],
        missing: ["current_outstanding_balance", "monthly_payment"],
        sourceBacked: false,
        sourcePresent: true,
      },
    },
  },
  financialTruth: {
    breakEvenOccupancy: {
      label: "Break-Even Occupancy",
      formula: "total_operating_expenses / gross_potential_rent",
      numeratorFact: "total_operating_expenses",
      denominatorFact: "gross_potential_rent",
      numerator: 456000,
      denominator: 1200000,
      result: 0.38,
      displayReady: true,
    },
  },
};

const deliverableDecision = {
  source: "canonical_delivery_decision",
  delivery_gate_status: "deliverable",
  customer_delivery_allowed: true,
  hold_delivery: false,
  reason_code: "DELIVERY_ALLOWED",
};

const candidate = buildReportQualityManifestCandidate({
  jobId: "manifest-job",
  userId: "manifest-user",
  reportFamily: "full_underwriting",
  reportType: "underwriting",
  reportMode: "v1_core",
  propertyName: "Manifest Test Property",
  generatedAt: "2026-07-15T20:00:00.000Z",
  sourceTruthPackage,
  customerSurfaceModel,
  customerSurfaceModelValidation: { ok: true, issues: [] },
  customerSurfaceHtmlValidation: { ok: true, issues: [] },
  deterministicContractQaSeal: { ok: true, status: "sealed", issues: [] },
  bossCompliance: { ok: true, violations: [] },
  deliveryDecision: deliverableDecision,
});

assert.equal(REPORT_QUALITY_MANIFEST_CONTRACT.authorityCreating, false);
assert.equal(REPORT_QUALITY_MANIFEST_CONTRACT.receiptOnly, true);
assert.equal(REPORT_QUALITY_MANIFEST_CONTRACT.legacyUnderwritingReuseAllowed, false);
assert.equal(Object.isFrozen(candidate), true);
assert.equal(validateReportQualityManifest(candidate).ok, true);

const acceptedPurchase = candidate.documents.find((document) => document.fileId === "support-purchase");
assert.equal(acceptedPurchase.roleAccepted, true);
assert.equal(acceptedPurchase.factAccepted, true);
assert.equal(acceptedPurchase.sourceBacked, true);
assert.equal(acceptedPurchase.acceptedFacts.purchase_price, 13500000);
assert.equal(acceptedPurchase.acceptedFacts.lender_fee_percent, 0.0085);

const conflictedAppraisal = candidate.documents.find((document) => document.fileId === "support-appraisal-conflict");
assert.equal(conflictedAppraisal.sourcePresent, true);
assert.equal(conflictedAppraisal.authority.candidateRoleAccepted, true);
assert.equal(conflictedAppraisal.roleAccepted, false);
assert.equal(conflictedAppraisal.factAccepted, false);
assert.equal(conflictedAppraisal.sourceBacked, false);
assert.deepEqual(conflictedAppraisal.acceptedFacts, {});
assert.equal(conflictedAppraisal.rejectedFacts.appraisal_value, 14100000);
assert.equal(conflictedAppraisal.conflict.state, "conflicting");

const ambiguousDebt = candidate.documents.find((document) => document.fileId === "support-mixed-debt");
assert.equal(ambiguousDebt.sourcePresent, true);
assert.equal(ambiguousDebt.roleAccepted, false);
assert.equal(ambiguousDebt.sourceBacked, false);
assert.equal(ambiguousDebt.sectionDisplayReady, false);
assert.equal(ambiguousDebt.conflict.state, "ambiguous");

const factConflictSourceTruth = structuredClone(sourceTruthPackage);
factConflictSourceTruth.support.accepted[0].fact_conflicts = ["rate_structure"];
factConflictSourceTruth.support.fact_conflicts = [{
  canonical_role: "purchase_assumptions",
  fact_name: "rate_structure",
  sources: [
    {
      file_id: "support-purchase",
      value: "fixed",
      evidence: {
        excerpt: "Rate Structure Fixed Rate",
        method: "deterministic_categorical_source_binding",
        sourceValue: "Fixed Rate",
        normalizedValue: "fixed",
      },
    },
    {
      file_id: "support-purchase-conflict",
      value: "floating",
      evidence: {
        excerpt: "Rate Structure Variable Rate",
        method: "deterministic_categorical_source_binding",
        sourceValue: "Variable Rate",
        normalizedValue: "floating",
      },
    },
  ],
  decision: "fact_rejected_role_preserved",
  customer_delivery_blocker: false,
}];
const factConflictCandidate = buildReportQualityManifestCandidate({
  jobId: "manifest-fact-conflict-job",
  reportFamily: "full_underwriting",
  reportType: "underwriting",
  reportMode: "v1_core",
  propertyName: "Manifest Fact Conflict Property",
  generatedAt: "2026-07-15T20:00:30.000Z",
  sourceTruthPackage: factConflictSourceTruth,
  customerSurfaceModel,
  deterministicContractQaSeal: { ok: true, status: "sealed", issues: [] },
  deliveryDecision: deliverableDecision,
});
const factConflictDocument = factConflictCandidate.documents
  .find((document) => document.fileId === "support-purchase");
assert.equal(factConflictDocument.roleAccepted, true);
assert.equal(factConflictDocument.acceptedFacts.proposed_loan_amount, 9450000);
assert.equal(factConflictDocument.acceptedFacts.rate_structure, undefined);
assert.equal(factConflictDocument.rejectedFacts.rate_structure, "fixed");
assert.equal(factConflictDocument.conflict.state, "fact_conflict");
assert.deepEqual(factConflictDocument.conflict.reasons, ["conflicting_accepted_fact:rate_structure"]);
assert.equal(factConflictCandidate.qualityState.optionalSupport.ambiguousOrConflictingCount, 3);
assert.equal(factConflictCandidate.factConflicts.length, 1);
assert.equal(validateReportQualityManifest(factConflictCandidate).ok, true);

const collapsedCurrentDebt = candidate.sections.find((section) => section.sectionKey === "currentDebtContext");
assert.equal(collapsedCurrentDebt.outcome, "collapsed");
assert.equal(collapsedCurrentDebt.sourcePresent, true);
assert.equal(collapsedCurrentDebt.sourceBacked, false);
assert.equal(collapsedCurrentDebt.acceptedFacts.current_outstanding_balance, null);
assert.notEqual(collapsedCurrentDebt.acceptedFacts.current_outstanding_balance, 0);

const breakEven = candidate.calculations.find((calculation) => calculation.calculationKey === "breakEvenOccupancy");
assert.equal(breakEven.eligible, true);
assert.equal(breakEven.result, 0.38);
assert.equal(breakEven.formula, "total_operating_expenses / gross_potential_rent");
assert.deepEqual([...breakEven.inputProvenance].sort(), ["core:file:file-rent-roll", "core:file:file-t12"]);

assert.throws(
  () => finalizeReportQualityManifest({
    candidate,
    reportId: "report-id",
    storagePath: "manifest-user/report-id.pdf",
    deliveryDecision: deliverableDecision,
    finalPdfPublicationQualityBoss: { ok: false, status: "rejected" },
  }),
  /REPORT_QUALITY_MANIFEST_FINAL_INVALID/
);

const finalManifest = finalizeReportQualityManifest({
  candidate,
  reportId: "report-id",
  storagePath: "manifest-user/report-id.pdf",
  deliveryDecision: deliverableDecision,
  finalPdfPublicationQualityBoss: {
    ok: true,
    status: "certified",
    pageCount: 16,
    byteLength: 92414,
  },
  publicationState: "published",
  creditState: { state: "reconciled", consumed: true },
  remedyState: { state: "not_required" },
  finalizedAt: "2026-07-15T20:01:00.000Z",
});

assert.equal(Object.isFrozen(finalManifest), true);
assert.equal(finalManifest.source, "canonical_report_quality_manifest");
assert.equal(finalManifest.publication.state, "published");
assert.equal(finalManifest.publication.pdfCertified, true);
assert.equal(finalManifest.qualityState.confidence, "verified_publication");
assert.equal(validateReportQualityManifest(finalManifest, { requireFinal: true }).ok, true);

const qualityIncidentManifest = finalizeReportQualityManifest({
  candidate,
  reportId: "quality-incident-report-id",
  storagePath: "manifest-user/quality-incident-report-id.pdf",
  deliveryDecision: deliverableDecision,
  finalPdfPublicationQualityBoss: {
    ok: false,
    status: "publishable_with_quality_incident",
    customer_delivery_allowed: true,
    publication_disposition: "publish_with_quality_incident",
    blocking_issue_codes: [],
    quality_incident_codes: ["PDF_APPROVED_NUMBER_NOT_CERTIFIED"],
  },
  publicationState: "published",
  creditState: { state: "reconciled" },
  remedyState: { state: "internal_quality_followup" },
  finalizedAt: "2026-07-18T15:01:00.000Z",
});
assert.equal(qualityIncidentManifest.publication.state, "published");
assert.equal(qualityIncidentManifest.publication.pdfCertified, false);
assert.equal(qualityIncidentManifest.publication.pdfQualityDisposition, "publish_with_quality_incident");
assert.equal(qualityIncidentManifest.qualityState.confidence, "verified_publication_with_quality_incident");
assert.equal(validateReportQualityManifest(qualityIncidentManifest, { requireFinal: true }).ok, true);

const unavailableCandidate = buildUnavailableReportQualityManifestCandidate({
  jobId: "blocked-manifest-job",
  userId: "manifest-user",
  reportFamily: "full_underwriting",
  reportType: "underwriting",
  reportMode: "v1_core",
  propertyName: "Blocked Manifest Property",
  blockerCode: "REPORT_RENDER_FAILED",
  generatedAt: "2026-07-15T20:01:30.000Z",
});
const blockedDecision = {
  source: "canonical_delivery_decision",
  delivery_gate_status: "blocked",
  customer_delivery_allowed: false,
  hold_delivery: true,
  core_valid_required_coverage: true,
  customer_status_reason_code: "REPORT_CONTRACT_FAILED",
};
const blockedManifest = finalizeBlockedReportQualityManifest({
  candidate: unavailableCandidate,
  deliveryDecision: blockedDecision,
  terminalOutcome: {
    code: "REPORT_RENDER_FAILED",
    failureClass: "internal_system_failure",
    customerDocumentReplacementRequired: false,
    retrySafe: true,
  },
  creditState: { state: "restored" },
  remedyState: { state: "internal_review_required" },
  finalizedAt: "2026-07-15T20:01:45.000Z",
});
assert.equal(blockedManifest.publication.state, "blocked");
assert.equal(blockedManifest.publication.pdfCertified, false);
assert.equal(blockedManifest.qualityState.confidence, "verified_terminal_block");
assert.equal(blockedManifest.terminalOutcome.code, "REPORT_RENDER_FAILED");
assert.equal(validateReportQualityManifest(blockedManifest, { requireFinal: true }).ok, true);

const postGatePlatformBlock = finalizeBlockedReportQualityManifest({
  candidate: unavailableCandidate,
  deliveryDecision: deliverableDecision,
  terminalOutcome: {
    code: "STORAGE_PUBLICATION_FAILED",
    failureClass: "internal_system_failure",
    customerDocumentReplacementRequired: false,
    retrySafe: true,
  },
  creditState: { state: "restored" },
  remedyState: { state: "internal_review_required" },
});
assert.equal(postGatePlatformBlock.publication.state, "blocked");
assert.equal(postGatePlatformBlock.receipts.deliveryGate.delivery_gate_status, "deliverable");
assert.equal(postGatePlatformBlock.terminalOutcome.code, "STORAGE_PUBLICATION_FAILED");
assert.equal(validateReportQualityManifest(postGatePlatformBlock, { requireFinal: true }).ok, true);

const screeningCandidate = buildReportQualityManifestCandidate({
  jobId: "screening-manifest-job",
  userId: "manifest-user",
  reportFamily: "screening",
  reportType: "screening",
  reportMode: "screening_v1",
  propertyName: "Manifest Screening Property",
  generatedAt: "2026-07-15T20:02:00.000Z",
  sourceTruthPackage,
  deterministicContractQaSeal: { ok: true, status: "sealed", issues: [] },
  deliveryDecision: deliverableDecision,
});

assert.equal(validateReportQualityManifest(screeningCandidate).ok, true);
assert.equal(screeningCandidate.calculations.length, 0);
assert.equal(
  screeningCandidate.sections.find((section) => section.sectionKey === "renovation_strategy")?.outcome,
  "collapsed"
);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const generatorSource = fs.readFileSync(
  path.join(repoRoot, "api/_lib/generate-client-report-impl.js"),
  "utf8"
);
const workerSource = fs.readFileSync(
  path.join(repoRoot, "api/admin-run-worker.js"),
  "utf8"
);
const manifestOwnerSource = fs.readFileSync(
  path.join(repoRoot, "api/_lib/report-quality-manifest.js"),
  "utf8"
);

assert.match(generatorSource, /buildReportQualityManifestCandidate/);
assert.match(generatorSource, /type:\s*"report_quality_manifest_candidate"/);
assert.equal(
  (generatorSource.match(/report_quality_manifest_candidate:\s*reportQualityManifestCandidate/g) || []).length,
  3,
  "Screening, blocked Acquisition, and published Acquisition responses must carry the Manifest candidate"
);
assert.match(workerSource, /finalizeReportQualityManifest/);
assert.match(workerSource, /finalizeBlockedReportQualityManifest/);
assert.match(workerSource, /type:\s*'report_quality_manifest'/);
assert.match(workerSource, /customer_delivery_unchanged:\s*true/);
const creditReconciliationIndex = workerSource.indexOf(
  "const creditResult = await consumeCreditOnce(job)"
);
const manifestCandidateIndex = workerSource.indexOf(
  "let manifestCandidate = reportData?.report_quality_manifest_candidate"
);
const manifestPersistenceIndex = workerSource.indexOf(
  "type: 'report_quality_manifest'",
  manifestCandidateIndex
);
const publicationCommitReadyIndex = workerSource.indexOf(
  "publicationCommitReady: true",
  manifestPersistenceIndex
);
const publishedTransitionIndex = workerSource.indexOf(
  "const publishedUpdate = await transitionWorkerJob(job, 'publishing', 'published'",
  publicationCommitReadyIndex
);

assert.notEqual(creditReconciliationIndex, -1, "Credit reconciliation must remain wired before publication finalization");
assert.notEqual(manifestCandidateIndex, -1, "Publication path must resolve the Report Quality Manifest candidate");
assert.notEqual(manifestPersistenceIndex, -1, "Publication path must persist the Report Quality Manifest");
assert.notEqual(publicationCommitReadyIndex, -1, "Publication path must explicitly seal publicationCommitReady");
assert.notEqual(publishedTransitionIndex, -1, "Publication path must use the governed publishing -> published transition");
assert.ok(
  creditReconciliationIndex < manifestCandidateIndex &&
    manifestCandidateIndex < manifestPersistenceIndex &&
    manifestPersistenceIndex < publicationCommitReadyIndex &&
    publicationCommitReadyIndex < publishedTransitionIndex,
  "Publication atomicity requires credit reconciliation, Manifest persistence, publication-commit readiness, then governed published transition"
);
assert.doesNotMatch(manifestOwnerSource, /buildRefiStabilityModel|REFI_SENSITIVITY_MATRIX_BLOCK|DCF_TABLE_BLOCK/);
assert.doesNotMatch(manifestOwnerSource, /report-template-runtime|generate-client-report-impl/);

console.log("report-quality-manifest-smoke: PASS");
