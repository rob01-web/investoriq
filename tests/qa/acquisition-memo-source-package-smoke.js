import assert from "assert";
import { describe, it } from "node:test";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";

function buildStonebridgeSourcePackage() {
  const uploadedFiles = [
    { fileId: "t12-file", originalFilename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "rent-roll-file", originalFilename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "assumptions-file", originalFilename: "Stonebridge_Assumptions.pdf", mimeType: "application/pdf" },
    { fileId: "current-debt-file", originalFilename: "Current_Debt_Stonebridge.pdf", mimeType: "application/pdf" },
    { fileId: "reno-file", originalFilename: "Stonebridge_Reno_Plan.pdf", mimeType: "application/pdf" },
    { fileId: "appraisal-file", originalFilename: "Stonebridge_Appraisal_Summary.pdf", mimeType: "application/pdf" },
    { fileId: "survey-file", originalFilename: "Stonebridge_Market_Survey.pdf", mimeType: "application/pdf" },
    { fileId: "phase-file", originalFilename: "Stonebridge_Phase_I_ESA.pdf", mimeType: "application/pdf" },
  ];

  const parsedArtifacts = [
    { fileId: "t12-file", semantic_doc_role: "t12" },
    { fileId: "rent-roll-file", semantic_doc_role: "rent_roll" },
    { fileId: "assumptions-file", semantic_doc_role: "purchase_assumptions", debt_basis: "proposed_acquisition" },
    { fileId: "current-debt-file", semantic_doc_role: "current_debt", debt_basis: "current_debt" },
    { fileId: "reno-file", semantic_doc_role: "renovation_plan" },
    { fileId: "appraisal-file", semantic_doc_role: "appraisal" },
    { fileId: "survey-file", semantic_doc_role: "market_survey" },
    { fileId: "phase-file", semantic_doc_role: "phase_i_esa" },
  ];

  return buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);
}

describe("acquisition memo source package smoke", () => {
  it("resolves the RETEST 5 golden mappings", () => {
    const sourcePackage = buildStonebridgeSourcePackage();

    assert.strictEqual(sourcePackage.authorityVersion, "v2");
    assert.ok(sourcePackage.coreT12);
    assert.strictEqual(sourcePackage.coreT12.role, "core_t12");
    assert.ok(sourcePackage.coreRentRoll);
    assert.strictEqual(sourcePackage.coreRentRoll.role, "core_rent_roll");

    assert.strictEqual(sourcePackage.supportDocs.get("assumptions-file")?.canonicalRole, "purchase_assumptions");
    assert.strictEqual(sourcePackage.supportDocs.get("current-debt-file")?.canonicalRole, "current_debt_context");
    assert.strictEqual(sourcePackage.supportDocs.get("reno-file")?.canonicalRole, "structured_renovation_capex_plan");
    assert.strictEqual(sourcePackage.supportDocs.get("appraisal-file")?.canonicalRole, "appraisal_context");
    assert.strictEqual(sourcePackage.supportDocs.get("survey-file")?.canonicalRole, "market_survey_context");
    assert.strictEqual(sourcePackage.supportDocs.get("phase-file")?.canonicalRole, "environmental_context");
  });

  it("never resolves a proposed acquisition assumptions file to current debt context", () => {
    const sourcePackage = buildCanonicalSourcePackage(
      [{ fileId: "assumptions-file", originalFilename: "Stonebridge_Assumptions.pdf", mimeType: "application/pdf" }],
      [{ fileId: "assumptions-file", semantic_doc_role: "purchase_assumptions", debt_basis: "proposed_acquisition" }]
    );

    assert.notStrictEqual(sourcePackage.supportDocs.get("assumptions-file")?.canonicalRole, "current_debt_context");
  });

  describe("acquisition memo projection smoke", () => {
    it("projection preserves coreT12 and coreRentRoll from source package", () => {
      const projection = buildAcquisitionMemoProjection(buildStonebridgeSourcePackage());

      assert.strictEqual(projection.coreSourceSummary.hasCoreT12, true);
      assert.strictEqual(projection.coreSourceSummary.hasCoreRentRoll, true);
      assert.strictEqual(projection.coreSourceSummary.bothCoreSourcesPresent, true);
    });

    it("projection slots each support doc into the correct named slot", () => {
      const projection = buildAcquisitionMemoProjection(buildStonebridgeSourcePackage());

      assert.strictEqual(projection.supportDocProjection.purchaseAssumptions?.canonicalRole, "purchase_assumptions");
      assert.strictEqual(projection.supportDocProjection.currentDebtContext?.canonicalRole, "current_debt_context");
      assert.strictEqual(projection.supportDocProjection.structuredRenovation?.canonicalRole, "structured_renovation_capex_plan");
      assert.strictEqual(projection.supportDocProjection.appraisalContext?.canonicalRole, "appraisal_context");
      assert.strictEqual(projection.supportDocProjection.marketSurveyContext?.canonicalRole, "market_survey_context");
      assert.strictEqual(projection.supportDocProjection.environmentalContext?.canonicalRole, "environmental_context");
    });

    it("projection financingReadinessSignals are all true for full Stonebridge fixture", () => {
      const projection = buildAcquisitionMemoProjection(buildStonebridgeSourcePackage());

      assert.strictEqual(projection.financingReadinessSignals.hasPurchaseAssumptions, true);
      assert.strictEqual(projection.financingReadinessSignals.hasCurrentDebtContext, true);
      assert.strictEqual(projection.financingReadinessSignals.hasStructuredRenovation, true);
      assert.strictEqual(projection.financingReadinessSignals.hasAppraisalContext, true);
      assert.strictEqual(projection.financingReadinessSignals.hasMarketSurveyContext, true);
      assert.strictEqual(projection.financingReadinessSignals.hasEnvironmentalContext, true);
    });

    it("projection documentTreatmentRows contains all 6 support docs", () => {
      const projection = buildAcquisitionMemoProjection(buildStonebridgeSourcePackage());

      assert.strictEqual(projection.documentTreatmentRows.length, 6);
    });

    it("projection sourceAuthorityDiagnostic confirms v2 authority", () => {
      const projection = buildAcquisitionMemoProjection(buildStonebridgeSourcePackage());

      assert.strictEqual(projection.sourceAuthorityDiagnostic.authorityVersion, "v2");
      assert.strictEqual(projection.sourceAuthorityDiagnostic.competingDecisionMakersEliminated, true);
    });

    it("projection never re-classifies or mutates canonicalRole", () => {
      const projection = buildAcquisitionMemoProjection(buildStonebridgeSourcePackage());

      assert.strictEqual(projection.supportDocProjection.currentDebtContext?.canonicalRole, "current_debt_context");
      assert.strictEqual(projection.supportDocProjection.purchaseAssumptions?.canonicalRole, "purchase_assumptions");
    });
  });
});
