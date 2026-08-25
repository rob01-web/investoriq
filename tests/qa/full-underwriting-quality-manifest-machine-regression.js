import assert from "node:assert/strict";
import {
  buildReportQualityManifestCandidate,
  finalizeReportQualityManifest,
  validateReportQualityManifest,
  REPORT_QUALITY_MANIFEST_CONTRACT,
} from "../../api/_lib/report-quality-manifest.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "elite-09b-job",
  core_publishable: true,
  true_blockers: [],
  core: {
    t12: {
      status: "accepted_complete",
      artifact_id: "t12-artifact",
      file_id: "t12-file",
      original_filename: "T12.xlsx",
      accepted_facts: {
        gross_potential_rent: 1612800,
        effective_gross_income: 1500000,
        total_operating_expenses: 555000,
        net_operating_income: 945000,
      },
      evidence: { sufficiency_state: { status: "validated" } },
    },
    rent_roll: {
      status: "accepted_complete",
      artifact_id: "rent-roll-artifact",
      file_id: "rent-roll-file",
      original_filename: "Rent Roll.xlsx",
      accepted_facts: {
        total_units: 64,
        occupancy: 0.9375,
        annual_in_place_rent: 1432800,
        unit_mix_or_derivable_unit_rows: true,
      },
      evidence: { sufficiency_state: { status: "validated" } },
    },
  },
  support: {
    accepted: [],
    advisory: [],
    rejected: [],
    adjudication_decisions: [],
    conflicts: [],
    fact_conflicts: [],
    duplicates: [],
  },
  section_policy: {},
  disclosures: [],
};

const customerSurfaceModel = {
  modelVersion: "acquisition_memo_v2_customer_surface_model_v1",
  reportMode: "v1_core",
  coreSources: {
    coreT12: { fileId: "t12-file" },
    coreRentRoll: { fileId: "rent-roll-file" },
  },
  sections: {
    debtCapacityAndCoverage: {
      status: "required",
      facts: { dscr: 1.4 },
      boundaries: { noUnsupportedScenarioInference: true },
      factAvailability: {
        required: ["dscr"],
        available: ["dscr"],
        missing: [],
        sourceBacked: true,
        sourcePresent: true,
        roleAccepted: true,
        factAccepted: true,
        sectionDisplayReady: true,
      },
    },
  },
  financialTruth: {
    breakEvenOccupancy: {
      label: "Break-Even Occupancy",
      formula: "total_operating_expenses / gross_potential_rent",
      numeratorFact: "total_operating_expenses",
      denominatorFact: "gross_potential_rent",
      numerator: 555000,
      denominator: 1612800,
      result: 555000 / 1612800,
      displayReady: true,
      units: "ratio",
    },
  },
  financialIntelligence: {
    source: "canonical_institutional_financial_intelligence",
    receiptVersion: 1,
    policy: { authorityCreating: false, downstreamConsumeOnly: true },
    calculationReceipts: [],
    reportPublicationBlocker: false,
  },
};

const reportIdentity = {
  source: "canonical_report_identity_authority",
  version: "canonical_report_identity_v2",
  identityKey: "full_underwriting",
  reportFamily: "full_underwriting",
  reportMode: "v1_core",
  reportType: "underwriting",
  reportTier: 2,
  canonicalTitle: "Underwriting Report",
  fullTitle: "InvestorIQ Underwriting Report",
  requiredPdfTextAnchors: ["Underwriting Report"],
};

const revisionIdentity = {
  revisionKind: "supplemental",
  revisionFamilyKey: "revision-family-1",
  revisionRootReportId: "root-report-1",
  revisionParentReportId: "parent-report-1",
  revisionNumber: 2,
  revisionRequestKey: "revision-request-2",
  revisionSourceJobId: "elite-09b-job",
  isCurrentRevision: false,
  revisionPublishedAt: null,
};

const corePublicationConstitution = {
  source: "core_publication_constitution",
  version: "core_publication_constitution_v2",
  core_publishable: true,
  minimum_truth_set: {
    source_mode: "dual_source_core",
  },
};

const finalPdfPublicationQualityBoss = {
  version: "gate10v_final_pdf_publication_quality_boss_v6",
  authority: "final_pdf_publication_quality_boss",
  ok: true,
  status: "certified",
  strict_institutional_certified: true,
  customer_delivery_allowed: true,
  publication_disposition: "publish",
  blocking_issue_codes: [],
  quality_incident_codes: [],
};

const deliveryDecision = {
  source: "canonical_delivery_decision",
  delivery_gate_status: "deliverable",
  customer_delivery_allowed: true,
  hold_delivery: false,
};

const candidate = buildReportQualityManifestCandidate({
  jobId: "elite-09b-job",
  userId: "elite-09b-user",
  reportId: "elite-09b-report",
  reportFamily: "full_underwriting",
  reportType: "underwriting",
  reportMode: "v1_core",
  propertyName: "ELITE-09B Property",
  generatedAt: "2026-08-20T15:00:00.000Z",
  sourceTruthPackage,
  customerSurfaceModel,
  deterministicContractQaSeal: { ok: true, status: "sealed", issues: [] },
  bossCompliance: { ok: true, status: "pass", issues: [] },
  deliveryDecision,
  finalPdfPublicationQualityBoss,
  reportIdentity,
  revisionIdentity,
  corePublicationConstitution,
  certificationCompletedAt: "2026-08-20T14:59:59.000Z",
});

assert.equal(REPORT_QUALITY_MANIFEST_CONTRACT.schemaVersion, 2);
assert.equal(REPORT_QUALITY_MANIFEST_CONTRACT.contractVersion, "report_quality_manifest_v2");
assert.equal(candidate.contractVersion, "report_quality_manifest_v2");
assert.equal(candidate.report.identity.version, "canonical_report_identity_v2");
assert.equal(candidate.report.identity.identityKey, "full_underwriting");
assert.equal(candidate.revision.kind, "supplemental");
assert.equal(candidate.revision.number, 2);
assert.equal(candidate.revision.familyKey, "revision-family-1");
assert.equal(candidate.revision.rootReportId, "root-report-1");
assert.equal(candidate.sourceBasis.sourceMode, "dual_source_core");
assert.equal(candidate.sourceBasis.constitutionVersion, "core_publication_constitution_v2");
assert.equal(candidate.analysisBasis.scenario.applicable, true);
assert.equal(candidate.analysisBasis.scenario.noUnsupportedScenarioInference, true);
assert.deepEqual(candidate.analysisBasis.calculations.formulaVersions, ["customer_surface_financial_truth_v1"]);
assert.equal(candidate.analysisBasis.calculations.receiptVersion, 1);
assert.equal(candidate.certification.version, "gate10v_final_pdf_publication_quality_boss_v6");
assert.equal(candidate.certification.completedAt, "2026-08-20T14:59:59.000Z");
assert.equal(candidate.certification.strictInstitutionalCertified, true);
assert.equal(candidate.receiptIdentity.manifestReceiptId, null);
assert.equal(candidate.authority.authorityCreating, false);
assert.equal(candidate.authority.receiptOnly, true);
assert.equal(validateReportQualityManifest(candidate).ok, true);

const finalManifest = finalizeReportQualityManifest({
  candidate,
  reportId: "elite-09b-report",
  storagePath: "elite-09b-user/elite-09b-report.pdf",
  deliveryDecision,
  finalPdfPublicationQualityBoss,
  publicationState: "published",
  creditState: { state: "reconciled", consumed: true },
  remedyState: { state: "not_required" },
  finalizedAt: "2026-08-20T15:01:00.000Z",
});

assert.equal(validateReportQualityManifest(finalManifest, { requireFinal: true }).ok, true);
assert.equal(finalManifest.receiptIdentity.manifestReceiptId, "canonical_report_quality_manifest:elite-09b-report");
assert.equal(finalManifest.receiptIdentity.publicationReceiptId, "report_publication:elite-09b-report");
assert.equal(finalManifest.receiptIdentity.finalizedAt, "2026-08-20T15:01:00.000Z");
assert.equal(finalManifest.certification.version, "gate10v_final_pdf_publication_quality_boss_v6");
assert.equal(finalManifest.certification.completedAt, "2026-08-20T14:59:59.000Z");
assert.equal(finalManifest.revision.number, 2);
assert.equal(finalManifest.sourceBasis.sourceMode, "dual_source_core");
assert.equal(finalManifest.authority.authorityCreating, false);
assert.equal(finalManifest.authority.receiptOnly, true);

console.log("PASS full-underwriting-quality-manifest-machine-regression");
