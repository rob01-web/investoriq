import assert from "assert";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import { renderAcquisitionMemo } from "../../api/_lib/acquisition-memo-renderer.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";

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

function buildRetest6SourcePackage() {
  const uploadedFiles = [
    { fileId: "t12-file", originalFilename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "rent-roll-file", originalFilename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  ];

  const parsedArtifacts = [
    {
      fileId: "assumptions-file",
      original_filename: "Stonebridge_Assumptions.pdf",
      semantic_doc_role: "purchase_assumptions",
      debt_basis: "proposed_acquisition",
      payload: {
        document_text_extracted: "Purchase assumptions / proposed acquisition financing\nPurchase Price $13,500,000\nNOI Basis $945,000\nProposed Acquisition Loan $9,450,000\nLTV 70.0%\nRate 5.95%\nAmortization 30 years\nFee 0.85%",
      },
    },
    {
      fileId: "current-debt-file",
      original_filename: "Current_Debt_Stonebridge.pdf",
      semantic_doc_role: "current_debt",
      debt_basis: "current_debt",
      payload: {
        document_text_extracted: "Existing Current Debt Statement\nCurrent Outstanding Balance $6,800,000\nInterest Rate 4.85%\nAmortization Remaining 24 years\nMonthly Payment $39,250\nMaturity Date 2029-11-01",
      },
    },
    {
      fileId: "reno-file",
      original_filename: "Stonebridge_Reno_Plan.pdf",
      semantic_doc_role: "renovation_plan",
      payload: {
        document_text_extracted: "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000\nRent lift and phasing details",
      },
    },
    {
      fileId: "appraisal-file",
      original_filename: "Stonebridge_Appraisal_Summary.pdf",
      semantic_doc_role: "appraisal",
      payload: {
        document_text_extracted: "Appraisal Summary / Valuation Context\nValuation only; does not represent purchase assumptions.",
      },
    },
    {
      fileId: "survey-file",
      original_filename: "Stonebridge_Market_Survey.pdf",
      semantic_doc_role: "market_survey",
      payload: {
        document_text_extracted: "Market Rent Survey Context\nCorroborates market rent; does not override rent roll.",
      },
    },
    {
      fileId: "phase-file",
      original_filename: "Stonebridge_Phase_I_ESA.pdf",
      semantic_doc_role: "phase_i_esa",
      payload: {
        document_text_extracted: "Phase I ESA / Environmental Due Diligence Context\nEnvironmental review only.",
      },
    },
  ];

  return buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);
}

const sourcePackage = buildStonebridgeSourcePackage();
const projection = buildAcquisitionMemoProjection(sourcePackage);
const renderedAcquisitionMemo = renderAcquisitionMemo(projection);
const finalHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: projection,
  renderedAcquisitionMemo,
  sourcePackage,
  coreMetrics: projection.coreMetrics || null,
  reportMeta: {
    reportType: "underwriting",
    effectiveReportMode: "v1_core",
    reportTier: 2,
    generatedAt: new Date().toISOString(),
    propertyName: "Stonebridge",
    propertyAddress: "Stonebridge",
    propertyTitle: "Stonebridge",
  },
  propertyProfile: {
    propertyName: "Stonebridge",
    propertyAddress: "Stonebridge",
    propertyTitle: "Stonebridge",
  },
});

assert.equal(typeof finalHtml, "string");
assert.match(finalHtml, /^<!doctype html>/i);
assert.match(finalHtml, /<html[\s>]/i);
assert.match(finalHtml, /<body[\s>]/i);
assert.match(finalHtml, /Preliminary Financing Readiness Summary/i);
assert.match(finalHtml, /Lender Diligence Checklist/i);
assert.match(finalHtml, /Current debt context uploaded<\/td><td[^>]*>Yes<\/td>/i);
assert.match(finalHtml, /Current_Debt_Stonebridge\.pdf[\s\S]{0,2000}Debt Support Received \/ Contextual/i);
const assumptionsRowMatch = finalHtml.match(/<tr[^>]*>[\s\S]{0,1200}?Stonebridge_Assumptions\.pdf[\s\S]*?<\/tr>/i);
assert.ok(assumptionsRowMatch, "Missing Stonebridge_Assumptions.pdf row");
assert.match(assumptionsRowMatch[0], /Purchase Assumptions \/ Proposed Acquisition Financing Context/i);
assert.match(assumptionsRowMatch[0], /Acquisition context received/i);
assert.equal(/Debt Support Received \/ Contextual/i.test(assumptionsRowMatch[0]), false);
assert.match(finalHtml, /Stonebridge_Reno_Plan\.pdf[\s\S]{0,2000}Structured Renovation \/ CapEx Plan/i);

const bodyStart = finalHtml.toLowerCase().indexOf("<body");
const bodyEnd = finalHtml.toLowerCase().indexOf("</body>");
const htmlEnd = finalHtml.toLowerCase().indexOf("</html>");
assert.ok(bodyStart >= 0);
assert.ok(bodyEnd > bodyStart);
assert.ok(htmlEnd > bodyEnd);
assert.match(finalHtml.slice(bodyStart, bodyEnd), /Document Treatment Summary/i);
assert.equal(finalHtml.slice(bodyEnd).includes("Document Treatment Summary"), false);
assert.equal(finalHtml.indexOf("Preliminary Financing Readiness Summary") < bodyEnd, true);
assert.equal(finalHtml.indexOf("Document Treatment Summary") < bodyEnd, true);
assert.equal(finalHtml.indexOf("</html>") > finalHtml.indexOf("Document Treatment Summary"), true);

const forbiddenPatterns = [
  /\bDSCR\b/i,
  /refinance proceeds/i,
  /\bDCF\b/i,
  /\bwaterfall\b/i,
  /equity return/i,
  /deal score/i,
  /final recommendation/i,
  /\bBUY\b/i,
  /\bSELL\b/i,
  /\bHOLD\b/i,
  /loan approval/i,
  /lender commitment/i,
];
const forbiddenHit = forbiddenPatterns.find((pattern) => pattern.test(finalHtml));
assert.equal(Boolean(forbiddenHit), false);

const retest6SourcePackage = buildRetest6SourcePackage();
assert.equal(retest6SourcePackage.coreT12?.canonicalRole, "core_t12");
assert.equal(retest6SourcePackage.coreRentRoll?.canonicalRole, "core_rent_roll");
assert.equal(retest6SourcePackage.supportDocs.get("assumptions-file")?.canonicalRole, "purchase_assumptions");
assert.equal(retest6SourcePackage.supportDocs.get("current-debt-file")?.canonicalRole, "current_debt_context");
assert.equal(retest6SourcePackage.supportDocs.get("reno-file")?.canonicalRole, "structured_renovation_capex_plan");
assert.equal(retest6SourcePackage.supportDocs.get("appraisal-file")?.canonicalRole, "appraisal_context");
assert.equal(retest6SourcePackage.supportDocs.get("survey-file")?.canonicalRole, "market_survey_context");
assert.equal(retest6SourcePackage.supportDocs.get("phase-file")?.canonicalRole, "environmental_context");

const retest6Projection = buildAcquisitionMemoProjection(retest6SourcePackage);
assert.equal(Boolean(retest6Projection.financingReadinessSignals?.hasCurrentDebtContext), true);
assert.equal(Boolean(retest6Projection.financingReadinessSignals?.hasPurchaseAssumptions), true);
assert.equal(Boolean(retest6Projection.financingReadinessSignals?.hasStructuredRenovation), true);
assert.equal(Boolean(retest6Projection.financingReadinessSignals?.hasAppraisalContext), true);
assert.equal(Boolean(retest6Projection.financingReadinessSignals?.hasMarketSurveyContext), true);
assert.equal(Boolean(retest6Projection.financingReadinessSignals?.hasEnvironmentalContext), true);

const retest6RenderedAcquisitionMemo = renderAcquisitionMemo(retest6Projection);
const retest6FinalHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: retest6Projection,
  renderedAcquisitionMemo: retest6RenderedAcquisitionMemo,
  sourcePackage: retest6SourcePackage,
  coreMetrics: {
    occupancy: 0.9375,
    annualInPlaceRent: 1080000,
    annualMarketRent: 1188000,
    egi: 1074000,
    opEx: 414000,
    noi: 660000,
    expenseRatio: 0.385,
    noiMargin: 0.615,
    breakEvenOccupancy: 0.875,
    purchasePrice: 13500000,
    goingInCapRate: 0.07,
  },
  reportMeta: {
    reportType: "underwriting",
    effectiveReportMode: "v1_core",
    reportTier: 2,
    generatedAt: new Date().toISOString(),
    propertyName: "Stonebridge",
    propertyAddress: "Stonebridge",
    propertyTitle: "Stonebridge",
  },
  propertyProfile: {
    propertyName: "Stonebridge",
    propertyAddress: "Stonebridge",
    propertyTitle: "Stonebridge",
  },
});
assert.match(retest6FinalHtml, /Acquisition Memo Summary/i);
assert.match(retest6FinalHtml, /Key Metrics Snapshot/i);
assert.match(retest6FinalHtml, /Operating Snapshot/i);
assert.match(retest6FinalHtml, /Unit Mix \/ Rent Positioning/i);
assert.match(retest6FinalHtml, /Rent Upside \/ Value Sensitivity/i);
assert.match(retest6FinalHtml, /Preliminary Financing Readiness Summary/i);
assert.match(retest6FinalHtml, /Data Coverage \/ Source Reliability/i);
assert.match(retest6FinalHtml, /Source Context \/ Support Document Treatment/i);
assert.match(retest6FinalHtml, /Methodology \/ Limitations/i);
assert.match(retest6FinalHtml, /Occupancy[\s\S]{0,80}93\.8%/i);
assert.match(retest6FinalHtml, /Current debt context uploaded<\/td><td[^>]*>Yes<\/td>/i);
assert.match(retest6FinalHtml, /Current_Debt_Stonebridge\.pdf[\s\S]{0,2000}Debt Support Received \/ Contextual/i);
assert.match(retest6FinalHtml, /Stonebridge_Assumptions\.pdf[\s\S]{0,2000}Purchase Assumptions \/ Proposed Acquisition Financing Context/i);
assert.match(retest6FinalHtml, /Stonebridge_Reno_Plan\.pdf[\s\S]{0,2000}Structured Renovation \/ CapEx Plan/i);
assert.match(retest6FinalHtml, /Stonebridge_Appraisal_Summary\.pdf[\s\S]{0,2000}Appraisal \/ Valuation Context/i);
assert.match(retest6FinalHtml, /Stonebridge_Market_Survey\.pdf[\s\S]{0,2000}Market Rent Survey Context/i);
assert.match(retest6FinalHtml, /Stonebridge_Phase_I_ESA\.pdf[\s\S]{0,2000}Environmental Due Diligence \/ Phase I ESA Context/i);
assert.match(retest6FinalHtml, /Document Treatment Summary/i);
assert.ok(retest6FinalHtml.indexOf("Document Treatment Summary") < retest6FinalHtml.toLowerCase().indexOf("</body>"));
assert.ok(retest6FinalHtml.toLowerCase().indexOf("</body>") < retest6FinalHtml.toLowerCase().indexOf("</html>"));

console.log("acquisition-memo-v2-document smoke PASS");
