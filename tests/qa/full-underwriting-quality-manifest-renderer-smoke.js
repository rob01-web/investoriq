import assert from "node:assert/strict";
import { buildFullUnderwritingQualityManifestV1 } from "../../api/_lib/full-underwriting-quality-manifest-v1.js";
import { renderFullUnderwritingQualityManifestV1Html } from "../../api/_lib/full-underwriting-quality-manifest-renderer.js";

const contract = buildFullUnderwritingQualityManifestV1({
  sourceTruthPackage: {
    source: "canonical_source_truth_package",
    core_publishable: true,
    core: {
      t12: { accepted_facts: { net_operating_income: 684000 } },
      rent_roll: { accepted_facts: { total_units: 80 } },
    },
    core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
    source_reconciliation_state: { status: "source_reconciliation_required", source_reconciliation_disclosure: "Variance disclosed." },
    support: {
      accepted: [{ file_id: "secret-filename-do-not-render.pdf", canonical_role: "appraisal_context", section_eligibility: { appraisal_context: true } }],
      advisory: [{ file_id: "excluded-secret-name.pdf", status: "ambiguous" }],
      rejected: [],
    },
    disclosures: [],
  },
  customerSurfaceModel: {
    identity: { propertyName: "Quality House", reportTitle: "Underwriting Report" },
    qualityManifest: {
      sectionDispositionEntries: [
        { sectionKey: "operatingStatementTTMSummary", finalDisposition: "include" },
        { sectionKey: "debtCapacityAndCoverage", finalDisposition: "compact" },
        { sectionKey: "marketSurveyContext", finalDisposition: "omit" },
      ],
    },
    financialTruth: { breakEvenOccupancy: { result: 0.38, displayReady: true } },
  },
  financialIntelligence: { receiptVersion: 1, calculationReceipts: [] },
  scenarioEngine: { source: "scenario_engine" },
  reportMeta: { generatedAt: "2026-08-20T12:00:00.000Z" },
  reportIdentity: { fullTitle: "InvestorIQ Underwriting Report" },
  replacementCoverage: {
    debtCapacityAndCoverage: true,
  },
});

const html = renderFullUnderwritingQualityManifestV1Html(contract);
assert.match(html, /Quality Manifest/);
assert.match(html, /Report Identity/);
assert.match(html, /Evidence Treatment/);
assert.match(html, /Coverage &amp; Reconciliation/);
assert.match(html, /Scenario &amp; Calculation Basis/);
assert.match(html, /Certification &amp; Traceability/);
assert.match(html, /T12 \+ Rent Roll/);
assert.match(html, /Reconciliation disclosure presented/);
assert.match(html, /Debt Capacity &amp; Coverage/);
assert.match(html, /Market Rent Survey Context/);
assert.match(html, /Integrated coverage/);
assert.match(html, /Coverage limitations/);
assert.doesNotMatch(html, /Reduced \/ omitted sections/);
assert.match(html, /publication record/i);
assert.doesNotMatch(html, /secret-filename-do-not-render\.pdf/i);
assert.doesNotMatch(html, /excluded-secret-name\.pdf/i);
assert.doesNotMatch(html, /[–—]/, "Quality Manifest must use publication-safe punctuation");
for (const internalPhrase of [
  /canonical source truth/i,
  /source-backed/i,
  /source_backed/i,
  /parser/i,
  /authority object/i,
  /dual_source_core/i,
  /stack trace/i,
  /REPORT_[A-Z0-9_]+/i,
]) {
  assert.doesNotMatch(html, internalPhrase);
}

console.log("full-underwriting-quality-manifest-renderer-smoke: PASS");
