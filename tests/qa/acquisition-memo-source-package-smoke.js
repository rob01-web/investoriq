import assert from "assert";
import { describe, it } from "node:test";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";

describe("acquisition memo source package smoke", () => {
  it("resolves the RETEST 5 golden mappings", () => {
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

    const sourcePackage = buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);

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
});
