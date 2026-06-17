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
    { fileId: "assumptions-file", semantic_doc_role: "purchase_assumptions", debt_basis: "proposed_acquisition", payload: { text: "Purchase Assumptions / Proposed Acquisition Financing\nPurchase Price $13,500,000\nNOI Basis $945,000\nGoing-In Cap Reference 7.00%\nProposed Loan Amount $9,450,000\nLTV 70%\nInterest Rate 5.95%\nAmortization 30 years\nLender Fee 0.85%\nThis is not existing/current debt." } },
    { fileId: "current-debt-file", semantic_doc_role: "current_debt", debt_basis: "current_debt", payload: { text: "Existing Current Debt Statement\nThis is an existing/current debt context document.\nCurrent Outstanding Balance $6,800,000\nInterest Rate 4.85%\nAmortization Remaining 24 years\nMonthly Payment $39,250\nMaturity Date 2029-11-01\nKeep this document separate from Stonebridge_Assumptions.pdf proposed acquisition financing." } },
    { fileId: "reno-file", semantic_doc_role: "renovation_plan", payload: { text: "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000\n1BR interiors: 20 units x $18,500/unit; expected rent lift $225/month; Months 1-18\n2BR interiors: 18 units x $24,000/unit; expected rent lift $325/month; Months 1-24\nCommon Area Refresh $210,000\nExterior / Security $115,000\nContingency $153,000" } },
    { fileId: "appraisal-file", semantic_doc_role: "appraisal", payload: { text: "Appraisal Summary / Valuation Context\nValuation only; does not represent purchase assumptions." } },
    { fileId: "survey-file", semantic_doc_role: "market_survey", payload: { text: "Market Rent Survey Context\nCorroborates market rent; does not override rent roll." } },
    { fileId: "phase-file", semantic_doc_role: "phase_i_esa", payload: { text: "Phase I ESA / Environmental Due Diligence Context\nEnvironmental review only." } },
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
    assert.strictEqual(sourcePackage.supportDocs.get("assumptions-file")?.extractedFacts?.purchase_price, 13500000);
    assert.strictEqual(sourcePackage.supportDocs.get("assumptions-file")?.extractedFacts?.noi_basis, 945000);
    assert.strictEqual(sourcePackage.supportDocs.get("assumptions-file")?.extractedFacts?.proposed_loan_amount, 9450000);
    assert.strictEqual(sourcePackage.supportDocs.get("assumptions-file")?.extractedFacts?.ltv, 0.7);
    assert.ok(Math.abs((sourcePackage.supportDocs.get("assumptions-file")?.extractedFacts?.interest_rate || 0) - 0.0595) < 1e-12);
    assert.strictEqual(sourcePackage.supportDocs.get("assumptions-file")?.extractedFacts?.amortization_years, 30);
    assert.ok(Math.abs((sourcePackage.supportDocs.get("assumptions-file")?.extractedFacts?.lender_fee_percent || 0) - 0.0085) < 1e-12);
    assert.strictEqual(sourcePackage.supportDocs.get("current-debt-file")?.canonicalRole, "current_debt_context");
    assert.strictEqual(sourcePackage.supportDocs.get("current-debt-file")?.extractedFacts?.current_outstanding_balance, 6800000);
    assert.ok(Math.abs((sourcePackage.supportDocs.get("current-debt-file")?.extractedFacts?.interest_rate || 0) - 0.0485) < 1e-12);
    assert.strictEqual(sourcePackage.supportDocs.get("current-debt-file")?.extractedFacts?.amortization_remaining_years, 24);
    assert.strictEqual(sourcePackage.supportDocs.get("current-debt-file")?.extractedFacts?.monthly_payment, 39250);
    assert.strictEqual(sourcePackage.supportDocs.get("current-debt-file")?.extractedFacts?.maturity_date, "2029-11-01");
    assert.strictEqual(sourcePackage.supportDocs.get("reno-file")?.canonicalRole, "structured_renovation_capex_plan");
    assert.strictEqual(sourcePackage.supportDocs.get("reno-file")?.extractedFacts?.total_renovation_budget, 1280000);
    assert.strictEqual(sourcePackage.supportDocs.get("reno-file")?.extractedFacts?.has_rent_lift, true);
    assert.strictEqual(sourcePackage.supportDocs.get("reno-file")?.extractedFacts?.has_phasing, true);
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

  it("resolves polluted current debt text to current_debt_context", () => {
    const sourcePackage = buildCanonicalSourcePackage(
      [{ fileId: "current-debt-file", originalFilename: "Current_Debt_Stonebridge.pdf", mimeType: "application/pdf" }],
      [{ fileId: "current-debt-file", semantic_doc_role: "purchase_assumptions", debt_basis: "proposed_acquisition", payload: { text: "Existing Current Debt Statement\nCurrent Outstanding Balance $6,800,000\nInterest Rate 4.85%\nAmortization Remaining 24 years\nMonthly Payment $39,250\nMaturity Date 2029-11-01\nKeep this document separate from Stonebridge_Assumptions.pdf proposed acquisition financing." } }]
    );

    const currentDebt = sourcePackage.supportDocs.get("current-debt-file");
    assert.strictEqual(currentDebt?.canonicalRole, "current_debt_context");
    assert.strictEqual(currentDebt?.extractedFacts?.current_outstanding_balance, 6800000);
    assert.ok(Math.abs((currentDebt?.extractedFacts?.interest_rate || 0) - 0.0485) < 1e-12);
    assert.strictEqual(currentDebt?.extractedFacts?.amortization_remaining_years, 24);
    assert.strictEqual(currentDebt?.extractedFacts?.monthly_payment, 39250);
    assert.strictEqual(currentDebt?.extractedFacts?.maturity_date, "2029-11-01");
  });

  it("resolves polluted assumptions text to purchase_assumptions and not current debt", () => {
    const sourcePackage = buildCanonicalSourcePackage(
      [{ fileId: "assumptions-file", originalFilename: "Stonebridge_Assumptions.pdf", mimeType: "application/pdf" }],
      [{ fileId: "assumptions-file", semantic_doc_role: "current_debt", debt_basis: "current_debt", payload: { text: "Purchase Assumptions / Proposed Acquisition Financing\nPurchase Price $13,500,000\nNOI Basis $945,000\nGoing-In Cap Reference 7.00%\nProposed Loan Amount $9,450,000\nLTV 70%\nInterest Rate 5.95%\nAmortization 30 years\nLender Fee 0.85%\nThis is not existing/current debt." } }]
    );

    const assumptions = sourcePackage.supportDocs.get("assumptions-file");
    assert.strictEqual(assumptions?.canonicalRole, "purchase_assumptions");
    assert.notStrictEqual(assumptions?.canonicalRole, "current_debt_context");
    assert.strictEqual(assumptions?.extractedFacts?.purchase_price, 13500000);
    assert.ok(Math.abs((assumptions?.extractedFacts?.interest_rate || 0) - 0.0595) < 1e-12);
  });

  it("resolves polluted phase i text to environmental_context", () => {
    const sourcePackage = buildCanonicalSourcePackage(
      [{ fileId: "phase-file", originalFilename: "Stonebridge_Phase_I_ESA.pdf", mimeType: "application/pdf" }],
      [{ fileId: "phase-file", semantic_doc_role: "property_tax", payload: { text: "Phase I ESA / Environmental Due Diligence Context" } }]
    );

    assert.strictEqual(sourcePackage.supportDocs.get("phase-file")?.canonicalRole, "environmental_context");
    assert.notStrictEqual(sourcePackage.supportDocs.get("phase-file")?.canonicalRole, "property_tax_support");
  });

  it("resolves polluted appraisal text to appraisal_context", () => {
    const sourcePackage = buildCanonicalSourcePackage(
      [{ fileId: "appraisal-file", originalFilename: "Stonebridge_Appraisal_Summary.pdf", mimeType: "application/pdf" }],
      [{ fileId: "appraisal-file", semantic_doc_role: "purchase_assumptions", payload: { text: "Appraisal Summary / Valuation Context" } }]
    );

    assert.strictEqual(sourcePackage.supportDocs.get("appraisal-file")?.canonicalRole, "appraisal_context");
    assert.notStrictEqual(sourcePackage.supportDocs.get("appraisal-file")?.canonicalRole, "purchase_assumptions");
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
