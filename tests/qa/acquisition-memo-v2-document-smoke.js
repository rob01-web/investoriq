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

console.log("acquisition-memo-v2-document smoke PASS");
