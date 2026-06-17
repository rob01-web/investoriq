import assert from "assert";
import { describe, it } from "node:test";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import { renderAcquisitionMemo } from "../../api/_lib/acquisition-memo-renderer.js";

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

describe("acquisition memo final render smoke", () => {
  it("renders documentTreatmentSummaryHtml with all 6 support doc rows", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));

    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Assumptions\.pdf/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Current_Debt_Stonebridge\.pdf/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Reno_Plan\.pdf/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Appraisal_Summary\.pdf/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Market_Survey\.pdf/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Phase_I_ESA\.pdf/);
    assert.ok(!/T12_Stonebridge_Lofts_Attack_Test_8\.xlsx/.test(rendered.documentTreatmentSummaryHtml));
    assert.ok(!/Rent_Roll_Stonebridge_Lofts_Attack_Test_8\.xlsx/.test(rendered.documentTreatmentSummaryHtml));
  });

  it("renders correct roleLabel for each support doc — RETEST 5 golden labels", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));

    assert.match(rendered.documentTreatmentSummaryHtml, /Purchase Assumptions \/ Proposed Acquisition Financing Context/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Existing Debt Context — Current Mortgage \/ Debt Statement/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Structured Renovation \/ CapEx Plan/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Appraisal \/ Valuation Context/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Market Rent Survey Context/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Environmental Due Diligence \/ Phase I ESA Context/);
    assert.ok(!/Property Tax Support/.test(rendered.documentTreatmentSummaryHtml));
    assert.ok(!/Other Support Document/.test(rendered.documentTreatmentSummaryHtml));
  });

  it("renders current debt facts from Current_Debt_Stonebridge.pdf and keeps proposed facts separate", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));
    const currentDebtRow = rendered.documentTreatmentSummaryHtml.match(/Current_Debt_Stonebridge\.pdf[\s\S]*?<\/tr>/);
    const assumptionsRow = rendered.documentTreatmentSummaryHtml.match(/Stonebridge_Assumptions\.pdf[\s\S]*?<\/tr>/);

    assert.ok(currentDebtRow);
    assert.ok(assumptionsRow);
    assert.match(currentDebtRow[0], /Current Outstanding Balance: \$6,800,000/);
    assert.match(currentDebtRow[0], /Interest Rate: 4\.85%/);
    assert.match(currentDebtRow[0], /Amortization Remaining: 24 years/);
    assert.match(currentDebtRow[0], /Monthly Payment: \$39,250/);
    assert.match(currentDebtRow[0], /Maturity Date: 2029-11-01/);
    assert.ok(!/Purchase Price: \$13,500,000/.test(currentDebtRow[0]));
    assert.ok(!/Proposed Loan Amount: \$9,450,000/.test(currentDebtRow[0]));
    assert.match(assumptionsRow[0], /Purchase Price: \$13,500,000/);
    assert.match(assumptionsRow[0], /NOI Basis: \$945,000/);
    assert.match(assumptionsRow[0], /Going-In Cap Rate: 7\.0%/);
    assert.match(assumptionsRow[0], /Proposed Loan Amount: \$9,450,000/);
    assert.match(assumptionsRow[0], /Interest Rate: 5\.95%/);
    assert.match(assumptionsRow[0], /Amortization: 30 years/);
    assert.match(assumptionsRow[0], /LTV: 70%/);
    assert.match(assumptionsRow[0], /Lender Fee: 0\.85%/);
  });

  it("renders coreSourceSummaryHtml confirming T12 and Rent Roll as core sources", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));

    assert.match(rendered.coreSourceSummaryHtml, /T12_Stonebridge_Lofts_Attack_Test_8\.xlsx/);
    assert.match(rendered.coreSourceSummaryHtml, /Rent_Roll_Stonebridge_Lofts_Attack_Test_8\.xlsx/);
  });

  it("renders financingReadinessSummaryHtml with all 6 signals true for full fixture", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));

    assert.match(rendered.financingReadinessSummaryHtml, /Purchase assumptions received\./);
    assert.match(rendered.financingReadinessSummaryHtml, /Existing debt context received\./);
    assert.match(rendered.financingReadinessSummaryHtml, /Structured renovation \/ CapEx plan received\./);
    assert.match(rendered.financingReadinessSummaryHtml, /Appraisal context received\./);
    assert.match(rendered.financingReadinessSummaryHtml, /Market survey context received\./);
    assert.match(rendered.financingReadinessSummaryHtml, /Environmental \/ Phase I ESA context received\./);
  });

  it("renders sourceAuthorityDiagnosticHtml with v2 authority marker", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));

    assert.match(rendered.sourceAuthorityDiagnosticHtml, /IQ_SOURCE_AUTHORITY/);
    assert.match(rendered.sourceAuthorityDiagnosticHtml, /v2/);
    assert.match(rendered.sourceAuthorityDiagnosticHtml, /competingDecisionMakersEliminated/);
  });

  it("renders appraisal market survey and environmental docs in the correct context-only buckets", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));

    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Appraisal_Summary\.pdf[\s\S]*?Appraisal \/ Valuation Context/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Market_Survey\.pdf[\s\S]*?Market Rent Survey Context/);
    assert.match(rendered.documentTreatmentSummaryHtml, /Stonebridge_Phase_I_ESA\.pdf[\s\S]*?Environmental Due Diligence \/ Phase I ESA Context/);
    assert.ok(!/Stonebridge_Phase_I_ESA\.pdf[\s\S]*?Property Tax Support/.test(rendered.documentTreatmentSummaryHtml));
    assert.ok(!/Stonebridge_Appraisal_Summary\.pdf[\s\S]*?Purchase Assumptions/.test(rendered.documentTreatmentSummaryHtml));
  });

  it("never renders proposed acquisition terms in current debt section", () => {
    const rendered = renderAcquisitionMemo(buildAcquisitionMemoProjection(buildStonebridgeSourcePackage()));

    const currentDebtRow = rendered.documentTreatmentSummaryHtml.match(/Current_Debt_Stonebridge\.pdf[\s\S]*?<\/tr>/);
    const assumptionsRow = rendered.documentTreatmentSummaryHtml.match(/Stonebridge_Assumptions\.pdf[\s\S]*?<\/tr>/);

    assert.ok(currentDebtRow);
    assert.ok(assumptionsRow);
    assert.match(currentDebtRow[0], /Existing Debt Context/);
    assert.ok(!/Purchase Assumptions/.test(currentDebtRow[0]));
    assert.match(assumptionsRow[0], /Purchase Assumptions/);
    assert.ok(!/Existing Debt Context/.test(assumptionsRow[0]));
  });
});
