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
    { fileId: "t12-file", semantic_doc_role: "t12", payload: { text: "Trailing 12-Month Income Statement\nProperty Taxes $185,000\nInsurance $72,000\nRepairs & Maintenance $104,000\nUtilities $86,000\nProperty Management $60,000\nPayroll / Admin $28,000\nEffective Gross Income $1,500,000\nOperating Expenses $555,000\nNet Operating Income $945,000" } },
    { fileId: "rent-roll-file", semantic_doc_role: "rent_roll", payload: { text: "Rent Roll\n1BR 32 $1,850 $2,050 $200\n2BR 32 $1,881 $2,425 $544\nOccupancy 93.8%\nAnnual In-Place Rent $1,432,800\nAnnual Market Rent $1,718,400" } },
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
    { fileId: "assumptions-file", originalFilename: "Stonebridge_Assumptions.pdf", mimeType: "application/pdf" },
    { fileId: "current-debt-file", originalFilename: "Current_Debt_Stonebridge.pdf", mimeType: "application/pdf" },
    { fileId: "reno-file", originalFilename: "Stonebridge_Reno_Plan.pdf", mimeType: "application/pdf" },
    { fileId: "appraisal-file", originalFilename: "Stonebridge_Appraisal_Summary.pdf", mimeType: "application/pdf" },
    { fileId: "survey-file", originalFilename: "Stonebridge_Market_Survey.pdf", mimeType: "application/pdf" },
    { fileId: "phase-file", originalFilename: "Stonebridge_Phase_I_ESA.pdf", mimeType: "application/pdf" },
  ];

  const parsedArtifacts = [
    {
      fileId: "t12-file",
      original_filename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx",
      semantic_doc_role: "t12",
      payload: {
        document_text_extracted: "Trailing 12-Month Income Statement\nProperty Taxes $185,000\nInsurance $72,000\nRepairs & Maintenance $104,000\nUtilities $86,000\nProperty Management $60,000\nPayroll / Admin $28,000\nEffective Gross Income $1,500,000\nOperating Expenses $555,000\nNet Operating Income $945,000",
      },
    },
    {
      fileId: "rent-roll-file",
      original_filename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx",
      semantic_doc_role: "rent_roll",
      payload: {
        document_text_extracted: "Rent Roll\n1BR 32 $1,850 $2,050 $200\n2BR 32 $1,881 $2,425 $544\nOccupancy 93.8%\nAnnual In-Place Rent $1,432,800\nAnnual Market Rent $1,718,400",
      },
    },
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

function buildStructuredStonebridgeSourcePackage() {
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

  const structuredUnitRows = [
    ...Array.from({ length: 32 }, (_, index) => ({
      label: "1BR",
      unit_number: `1-${index + 1}`,
      current_rent: 1850,
      market_rent: 2050,
    })),
    ...Array.from({ length: 32 }, (_, index) => ({
      label: "2BR",
      unit_number: `2-${index + 1}`,
      current_rent: 1881,
      market_rent: 2425,
    })),
  ];

  const parsedArtifacts = [
    {
      fileId: "t12-file",
      semantic_doc_role: "t12",
      payload: {
        t12_parsed: {
          income_lines: [{ label: "Effective Gross Income", amount: 1500000 }],
          expense_lines: [
            { label: "Property Taxes", amount: 185000 },
            { label: "Insurance", amount: 72000 },
            { label: "Repairs & Maintenance", amount: 104000 },
            { label: "Utilities", amount: 86000 },
            { label: "Property Management", amount: 60000 },
            { label: "Payroll / Admin", amount: 28000 },
          ],
          effective_gross_income: 1500000,
          total_operating_expenses: 555000,
          net_operating_income: 945000,
          gross_potential_rent: 1718400,
        },
      },
    },
    {
      fileId: "rent-roll-file",
      semantic_doc_role: "rent_roll",
      payload: {
        rent_roll_parsed: {
          total_units: 64,
          occupancy: 0.9375,
          unit_mix: [
            { label: "1BR", count: 32, current_rent: 1850, market_rent: 2050 },
            { label: "2BR", count: 32, current_rent: 1881, market_rent: 2425 },
          ],
          units: structuredUnitRows,
          annual_in_place_rent: 1432800,
          annual_market_rent: 1718400,
        },
      },
    },
    {
      fileId: "assumptions-file",
      original_filename: "Stonebridge_Assumptions.pdf",
      semantic_doc_role: "purchase_assumptions",
      debt_basis: "proposed_acquisition",
      payload: {
        document_text_extracted: "Purchase assumptions / proposed acquisition financing\nPurchase Price $13,500,000\nNOI Basis $945,000\nGoing-In Cap Reference 7.00%\nProposed Acquisition Loan $9,450,000\nLTV 70.0%\nRate 5.95%\nAmortization 30 years\nFee 0.85%",
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
assert.match(finalHtml, /class="report-container"/i);
assert.match(finalHtml, /class="header-strip"/i);
assert.match(finalHtml, /class="report-footer-inner"/i);
assert.match(finalHtml, /class="cover-brand-name"/i);
assert.match(finalHtml, /class="cover-brand-sub"/i);
assert.match(finalHtml, /INVESTORIQ/i);
assert.match(finalHtml, /Institutional Real Estate Analysis/i);
assert.match(finalHtml, /CONFIDENTIAL - INVESTORIQ TECHNOLOGIES INC\./i);
assert.match(finalHtml, /Acquisition Memo/i);
assert.equal(/UNDERWRITING\s*\|\s*V1_CORE/i.test(finalHtml), false);
assert.equal(/V2 Canonical Package/i.test(finalHtml), false);
assert.equal(/Source Authority/i.test(finalHtml), false);
assert.equal(/Source-backed presentation only/i.test(finalHtml), false);
assert.equal(/report shell stays presentation-only/i.test(finalHtml), false);
assert.equal(/canonical source package determines document roles/i.test(finalHtml), false);
assert.equal(/V2 projection determines readiness/i.test(finalHtml), false);
assert.equal(/Document-driven Acquisition Memo V2/i.test(finalHtml), false);
assert.match(finalHtml, /Executive Summary/i);
assert.match(finalHtml, /Key Metrics Snapshot/i);
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
const coverEnd = finalHtml.indexOf('<div class="report-container">');
assert.ok(coverEnd > 0);
const coverHtml = finalHtml.slice(0, coverEnd);
assert.equal(coverHtml.includes("Core Quantitative Sources"), false);
assert.equal(coverHtml.includes("Trailing 12-Month Income Statement"), false);
assert.equal(coverHtml.includes("Rent Roll"), false);
assert.equal(coverHtml.includes('class="source-table"'), false);
assert.match(finalHtml.slice(bodyStart, bodyEnd), /Document Treatment Summary/i);
assert.equal(finalHtml.slice(bodyEnd).includes("Document Treatment Summary"), false);
assert.equal(finalHtml.indexOf("Preliminary Financing Readiness Summary") < bodyEnd, true);
assert.equal(finalHtml.indexOf("Document Treatment Summary") < bodyEnd, true);
assert.equal(finalHtml.indexOf("</html>") > finalHtml.indexOf("Document Treatment Summary"), true);
assert.equal(/>v2</i.test(finalHtml), false);
assert.equal(/authorityVersion/i.test(finalHtml), false);
assert.equal(/canonical source package/i.test(finalHtml), false);
assert.equal(/V2 projection/i.test(finalHtml), false);
assert.match(finalHtml, /Cap-Rate Value Indication/i);
assert.equal(/\$135,000\b/i.test(finalHtml), false);
assert.match(finalHtml, /8 uploaded files/i);

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
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 0.37,
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
assert.match(retest6FinalHtml, /class="report-container"/i);
assert.match(retest6FinalHtml, /class="header-strip"/i);
assert.match(retest6FinalHtml, /class="report-footer-inner"/i);
assert.match(retest6FinalHtml, /class="cover-brand-name"/i);
assert.match(retest6FinalHtml, /class="cover-brand-sub"/i);
assert.match(retest6FinalHtml, /INVESTORIQ/i);
assert.match(retest6FinalHtml, /Institutional Real Estate Analysis/i);
assert.match(retest6FinalHtml, /CONFIDENTIAL - INVESTORIQ TECHNOLOGIES INC\./i);
assert.match(retest6FinalHtml, /Acquisition Memo/i);
assert.equal(/UNDERWRITING\s*\|\s*V1_CORE/i.test(retest6FinalHtml), false);
assert.equal(/V2 Canonical Package/i.test(retest6FinalHtml), false);
assert.equal(/Source Authority/i.test(retest6FinalHtml), false);
assert.equal(/Source-backed presentation only/i.test(retest6FinalHtml), false);
assert.equal(/report shell stays presentation-only/i.test(retest6FinalHtml), false);
assert.equal(/canonical source package determines document roles/i.test(retest6FinalHtml), false);
assert.equal(/V2 projection determines readiness/i.test(retest6FinalHtml), false);
assert.equal(/Document-driven Acquisition Memo V2/i.test(retest6FinalHtml), false);
assert.match(retest6FinalHtml, /Acquisition Memo Summary/i);
assert.match(retest6FinalHtml, /64-Unit Multifamily/i);
assert.match(retest6FinalHtml, /ACQUISITION MEMO/i);
assert.match(retest6FinalHtml, /Key Metrics Snapshot/i);
assert.match(retest6FinalHtml, /Key Upside Drivers/i);
assert.match(retest6FinalHtml, /Primary Constraint \/ Review Disclosure/i);
assert.match(retest6FinalHtml, /Units<\/td><td style="font-weight:600;">64<\/td>/i);
assert.match(retest6FinalHtml, /Annual In-Place Rent<\/td><td style="font-weight:600;">\$1,432,800<\/td>/i);
assert.match(retest6FinalHtml, /Annual Market Rent<\/td><td style="font-weight:600;">\$1,718,400<\/td>/i);
assert.match(retest6FinalHtml, /Annual Rent Upside<\/td><td style="font-weight:600;">\$285,600<\/td>/i);
assert.match(retest6FinalHtml, /Rent Gap %<\/td><td style="font-weight:600;">19\.9%<\/td>/i);
assert.match(retest6FinalHtml, /EGI<\/td><td style="font-weight:600;">\$1,500,000<\/td>/i);
assert.match(retest6FinalHtml, /Operating Expenses<\/td><td style="font-weight:600;">\$555,000<\/td>/i);
assert.match(retest6FinalHtml, /NOI<\/td><td style="font-weight:600;">\$945,000<\/td>/i);
assert.match(retest6FinalHtml, /Expense Ratio<\/td><td style="font-weight:600;">37\.0%<\/td>/i);
assert.match(retest6FinalHtml, /NOI Margin<\/td><td style="font-weight:600;">63\.0%<\/td>/i);
assert.match(retest6FinalHtml, /Break-Even Occupancy<\/td><td style="font-weight:600;">37\.0%<\/td>/i);
assert.match(retest6FinalHtml, /Purchase Price<\/td><td style="font-weight:600;">\$13,500,000<\/td>/i);
assert.match(retest6FinalHtml, /Going-In Cap Rate<\/td><td style="font-weight:600;">7\.0%<\/td>/i);
assert.match(retest6FinalHtml, /Price per Unit<\/td><td style="font-weight:600;">\$210,938<\/td>/i);
assert.match(retest6FinalHtml, /NOI per Unit<\/td><td style="font-weight:600;">\$14,766<\/td>/i);
assert.equal(/Occupancy<\/td><td style="font-weight:600;">0\.9%<\/td>/i.test(retest6FinalHtml), false);
assert.equal(/\$-0\b/.test(retest6FinalHtml), false);
assert.match(retest6FinalHtml, /Operating Snapshot/i);
assert.match(retest6FinalHtml, /Unit Mix and Rent Positioning/i);
assert.match(retest6FinalHtml, /Rent Positioning Summary/i);
assert.match(retest6FinalHtml, /1BR[\s\S]{0,200}32[\s\S]{0,200}\$1,850[\s\S]{0,200}\$2,050[\s\S]{0,200}\$200/i);
assert.match(retest6FinalHtml, /2BR[\s\S]{0,200}32[\s\S]{0,200}\$1,881[\s\S]{0,200}\$2,425[\s\S]{0,200}\$544/i);
assert.match(retest6FinalHtml, /Rent Upside \/ Value Sensitivity/i);
assert.match(retest6FinalHtml, /Annual Gross Rent Upside/i);
assert.match(retest6FinalHtml, /Implied Value Sensitivity at Stabilization/i);
assert.match(retest6FinalHtml, /Cap-Rate Value Indication/i);
assert.match(retest6FinalHtml, /5\.0% cap rate[\s\S]{0,200}\$5,712,000/i);
assert.match(retest6FinalHtml, /6\.0% cap rate[\s\S]{0,200}\$4,760,000/i);
assert.match(retest6FinalHtml, /7\.0% cap rate[\s\S]{0,200}\$4,080,000/i);
assert.match(retest6FinalHtml, /Preliminary Financing Readiness Summary/i);
assert.match(retest6FinalHtml, /Acquisition Request Context/i);
assert.match(retest6FinalHtml, /Operating Support/i);
assert.match(retest6FinalHtml, /Rent \/ Value Support/i);
assert.match(retest6FinalHtml, /Debt \/ Financing Context/i);
assert.match(retest6FinalHtml, /Operating Statement \/ TTM Summary/i);
assert.match(retest6FinalHtml, /Property Taxes<\/td><td style="font-weight:600;">\$185,000<\/td>/i);
assert.match(retest6FinalHtml, /Insurance<\/td><td style="font-weight:600;">\$72,000<\/td>/i);
assert.match(retest6FinalHtml, /Repairs &amp; Maintenance<\/td><td style="font-weight:600;">\$104,000<\/td>/i);
assert.match(retest6FinalHtml, /Utilities<\/td><td style="font-weight:600;">\$86,000<\/td>/i);
assert.match(retest6FinalHtml, /Property Management<\/td><td style="font-weight:600;">\$60,000<\/td>/i);
assert.match(retest6FinalHtml, /Payroll \/ Admin<\/td><td style="font-weight:600;">\$28,000<\/td>/i);
assert.match(retest6FinalHtml, /EGI per Unit/i);
assert.match(retest6FinalHtml, /OpEx per Unit/i);
assert.match(retest6FinalHtml, /NOI per Unit/i);
assert.match(retest6FinalHtml, /Data Coverage &amp; Source Limitations/i);
assert.match(retest6FinalHtml, /Source Context \/ Support Document Treatment/i);
assert.match(retest6FinalHtml, /Methodology &amp; Data Transparency/i);
assert.match(retest6FinalHtml, /overflow-wrap:anywhere;/i);
assert.match(retest6FinalHtml, /word-break:break-word;/i);
assert.equal(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(retest6FinalHtml), false);
assert.match(retest6FinalHtml, /InvestorIQ does not assume or gap-fill missing data/i);
assert.match(retest6FinalHtml, /Document-Backed Acquisition Memo Outputs/i);
assert.match(retest6FinalHtml, /Methodology Notes/i);
assert.match(retest6FinalHtml, /Data Limitations &amp; Missing Inputs/i);
const dataCoverageSectionMatch = retest6FinalHtml.match(/Data Coverage &amp; Source Limitations[\s\S]{0,5000}?<\/section>/i);
assert.ok(dataCoverageSectionMatch, "Missing data coverage section");
assert.match(dataCoverageSectionMatch[0], /T12_Stonebridge_Lofts_Attack_Test_8\.xlsx/i);
assert.match(dataCoverageSectionMatch[0], /Rent_Roll_Stonebridge_Lofts_Attack_Test_8\.xlsx/i);
assert.match(dataCoverageSectionMatch[0], /Core Quantitative Source/i);
assert.match(dataCoverageSectionMatch[0], /data-coverage-table-3col/i);
assert.equal(/white-space\s*:\s*nowrap/i.test(dataCoverageSectionMatch[0]), false);
const requiredSectionOrder = [
  "Executive Summary",
  "Key Upside Drivers",
  "Primary Constraint / Review Disclosure",
  "Acquisition Memo Summary",
  "Operating Snapshot",
  "Unit Mix and Rent Positioning",
  "Rent Upside / Value Sensitivity",
  "Preliminary Financing Readiness Summary",
  "Data Coverage & Source Limitations",
  "Source Context / Support Document Treatment",
  "Methodology & Data Transparency",
];
let lastSectionIndex = -1;
for (const sectionTitle of requiredSectionOrder) {
  const escapedSectionTitle = sectionTitle.replace(/&/g, "&amp;");
  const headerPattern = new RegExp(`<span[^>]*class="section-header-title"[^>]*>${escapedSectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/span>`, "i");
  const headerMatch = retest6FinalHtml.match(headerPattern);
  assert.ok(headerMatch, `${sectionTitle} header is missing`);
  const sectionIndex = headerMatch.index ?? -1;
  assert.ok(sectionIndex > lastSectionIndex, `${sectionTitle} is out of order`);
  lastSectionIndex = sectionIndex;
}
assert.equal(/Acquisition Memo Summary[\s\S]{0,250}Acquisition Memo Summary/i.test(retest6FinalHtml), false);
assert.match(retest6FinalHtml, /Occupancy[\s\S]{0,80}93\.8%/i);
assert.match(retest6FinalHtml, /Current debt context uploaded<\/td><td[^>]*>Yes<\/td>/i);
const currentDebtSectionMatch = retest6FinalHtml.match(/Debt \/ Financing Context[\s\S]{0,2500}?<\/section>/i);
assert.ok(currentDebtSectionMatch, "Missing debt / financing context section");
assert.match(currentDebtSectionMatch[0], /Current Outstanding Balance/i);
assert.match(currentDebtSectionMatch[0], /Interest Rate/i);
assert.match(currentDebtSectionMatch[0], /Amortization Remaining/i);
assert.match(currentDebtSectionMatch[0], /Monthly Payment/i);
assert.match(currentDebtSectionMatch[0], /Maturity Date/i);
assert.match(currentDebtSectionMatch[0], /Current Outstanding Balance<\/td><td style="font-weight:600;">\$6,800,000<\/td>/i);
assert.match(currentDebtSectionMatch[0], /Interest Rate<\/td><td style="font-weight:600;">4\.85%<\/td>/i);
assert.match(currentDebtSectionMatch[0], /Amortization Remaining<\/td><td style="font-weight:600;">24 years<\/td>/i);
assert.match(currentDebtSectionMatch[0], /Monthly Payment<\/td><td style="font-weight:600;">\$39,250<\/td>/i);
assert.match(currentDebtSectionMatch[0], /Maturity Date<\/td><td style="font-weight:600;">2029-11-01<\/td>/i);
assert.equal(/Current Debt Maturity Not available/i.test(currentDebtSectionMatch[0]), false);
const assumptionsSectionMatch = retest6FinalHtml.match(/Acquisition Request Context[\s\S]{0,1800}?<\/section>/i);
assert.ok(assumptionsSectionMatch, "Missing acquisition request context section");
assert.match(assumptionsSectionMatch[0], /Purchase Price<\/td><td style="font-weight:600;">\$13,500,000<\/td>/i);
assert.match(assumptionsSectionMatch[0], /NOI Basis<\/td><td style="font-weight:600;">\$945,000<\/td>/i);
assert.match(assumptionsSectionMatch[0], /Proposed Acquisition Loan<\/td><td style="font-weight:600;">\$9,450,000<\/td>/i);
assert.match(assumptionsSectionMatch[0], /Proposed LTV<\/td><td style="font-weight:600;">70\.0%<\/td>/i);
assert.match(assumptionsSectionMatch[0], /Proposed Rate<\/td><td style="font-weight:600;">5\.95%<\/td>/i);
assert.match(assumptionsSectionMatch[0], /Proposed Amortization<\/td><td style="font-weight:600;">30 years<\/td>/i);
assert.match(assumptionsSectionMatch[0], /Lender \/ Origination Fee<\/td><td style="font-weight:600;">0\.85%<\/td>/i);
assert.match(retest6FinalHtml, /Stonebridge_Appraisal_Summary\.pdf[\s\S]{0,2000}Appraisal \/ Valuation Context/i);
assert.match(retest6FinalHtml, /Stonebridge_Market_Survey\.pdf[\s\S]{0,2000}Market Rent Survey Context/i);
assert.match(retest6FinalHtml, /Stonebridge_Phase_I_ESA\.pdf[\s\S]{0,2000}Environmental Due Diligence \/ Phase I ESA Context/i);
assert.match(retest6FinalHtml, /Document Treatment Summary/i);
assert.ok(retest6FinalHtml.indexOf("Document Treatment Summary") < retest6FinalHtml.toLowerCase().indexOf("</body>"));
assert.ok(retest6FinalHtml.toLowerCase().indexOf("</body>") < retest6FinalHtml.toLowerCase().indexOf("</html>"));
const retest6CoverEnd = retest6FinalHtml.indexOf('<div class="report-container">');
assert.ok(retest6CoverEnd > 0);
const retest6CoverHtml = retest6FinalHtml.slice(0, retest6CoverEnd);
assert.equal(retest6CoverHtml.includes("Core Quantitative Sources"), false);
assert.equal(retest6CoverHtml.includes("Trailing 12-Month Income Statement"), false);
assert.equal(retest6CoverHtml.includes("Rent Roll"), false);
assert.equal(retest6CoverHtml.includes('class="source-table"'), false);
assert.equal(/>v2</i.test(retest6FinalHtml), false);
assert.equal(/authorityVersion/i.test(retest6FinalHtml), false);
assert.equal(/canonical source package/i.test(retest6FinalHtml), false);
assert.equal(/V2 projection/i.test(retest6FinalHtml), false);
assert.match(retest6FinalHtml, /<tr><td>5\.0%<\/td><td style="font-weight:600;">\$18,900,000<\/td><td style="font-weight:600;">\$295,313<\/td><\/tr>/i);
assert.match(retest6FinalHtml, /<tr><td>6\.0%<\/td><td style="font-weight:600;">\$15,750,000<\/td><td style="font-weight:600;">\$246,094<\/td><\/tr>/i);
assert.match(retest6FinalHtml, /<tr><td>7\.0%<\/td><td style="font-weight:600;">\$13,500,000<\/td><td style="font-weight:600;">\$210,937<\/td><\/tr>/i);
assert.match(retest6FinalHtml, /Value delta vs purchase price<\/td><td style="font-weight:600;">\$0<\/td>/i);
assert.equal(/\$135,000\b/i.test(retest6FinalHtml), false);
assert.equal(/Cap-Rate Value Indication[\s\S]{0,700}>-<\/td>/i.test(retest6FinalHtml), false);

const structuredSourcePackage = buildStructuredStonebridgeSourcePackage();
const structuredProjection = buildAcquisitionMemoProjection(structuredSourcePackage);
const structuredRenderedAcquisitionMemo = renderAcquisitionMemo(structuredProjection);
const structuredFinalHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: structuredProjection,
  renderedAcquisitionMemo: structuredRenderedAcquisitionMemo,
  sourcePackage: structuredSourcePackage,
  coreMetrics: {
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 0.37,
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
assert.match(structuredFinalHtml, /1BR[\s\S]{0,200}32[\s\S]{0,200}\$1,850[\s\S]{0,200}\$2,050[\s\S]{0,200}\$200/i);
assert.match(structuredFinalHtml, /2BR[\s\S]{0,200}32[\s\S]{0,200}\$1,881[\s\S]{0,200}\$2,425[\s\S]{0,200}\$544/i);
assert.equal(structuredFinalHtml.includes("No parsed unit mix rows were available"), false);
assert.match(structuredFinalHtml, /Property Taxes<\/td><td style="font-weight:600;">\$185,000<\/td>/i);
assert.match(structuredFinalHtml, /Insurance<\/td><td style="font-weight:600;">\$72,000<\/td>/i);
assert.match(structuredFinalHtml, /Repairs &amp; Maintenance<\/td><td style="font-weight:600;">\$104,000<\/td>/i);
assert.match(structuredFinalHtml, /Utilities<\/td><td style="font-weight:600;">\$86,000<\/td>/i);
assert.match(structuredFinalHtml, /Property Management<\/td><td style="font-weight:600;">\$60,000<\/td>/i);
assert.match(structuredFinalHtml, /Payroll \/ Admin<\/td><td style="font-weight:600;">\$28,000<\/td>/i);
assert.match(structuredFinalHtml, /<tr><td>5\.0%<\/td><td style="font-weight:600;">\$18,900,000<\/td><td style="font-weight:600;">\$295,313<\/td><\/tr>/i);
assert.match(structuredFinalHtml, /<tr><td>6\.0%<\/td><td style="font-weight:600;">\$15,750,000<\/td><td style="font-weight:600;">\$246,094<\/td><\/tr>/i);
assert.match(structuredFinalHtml, /<tr><td>7\.0%<\/td><td style="font-weight:600;">\$13,500,000<\/td><td style="font-weight:600;">\$210,937<\/td><\/tr>/i);
assert.equal(/Cap-Rate Value Indication[\s\S]{0,700}>-<\/td>/i.test(structuredFinalHtml), false);
assert.equal(/Going-In Cap Rate<\/td><td style="font-weight:600;">0\.0%<\/td>/i.test(retest6FinalHtml), false);
assert.equal(/Going-In Cap Rate 0\.0%/i.test(retest6FinalHtml), false);
assert.equal(/Implied value at going-in cap rate<\/td><td style="font-weight:600;">Not available<\/td>/i.test(retest6FinalHtml), false);
assert.equal(/Implied value at going-in cap rate Not available/i.test(retest6FinalHtml), false);
assert.equal(/projection-safe cap-rate frame/i.test(retest6FinalHtml), false);
assert.equal(/Unit-level detail remains source-driven and is not re-authored here/i.test(retest6FinalHtml), false);

const capRateSevenFinalHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: retest6Projection,
  renderedAcquisitionMemo: retest6RenderedAcquisitionMemo,
  sourcePackage: retest6SourcePackage,
  coreMetrics: {
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 0.37,
    purchasePrice: 13500000,
    goingInCapRate: 7,
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
assert.match(capRateSevenFinalHtml, /Implied value at going-in cap rate<\/td><td style="font-weight:600;">\$13,500,000<\/td>/i);
assert.match(capRateSevenFinalHtml, /<tr><td>5\.0%<\/td><td style="font-weight:600;">\$18,900,000<\/td><td style="font-weight:600;">\$295,313<\/td><\/tr>/i);
assert.match(capRateSevenFinalHtml, /<tr><td>6\.0%<\/td><td style="font-weight:600;">\$15,750,000<\/td><td style="font-weight:600;">\$246,094<\/td><\/tr>/i);
assert.match(capRateSevenFinalHtml, /<tr><td>7\.0%<\/td><td style="font-weight:600;">\$13,500,000<\/td><td style="font-weight:600;">\$210,937<\/td><\/tr>/i);
assert.match(capRateSevenFinalHtml, /Value delta vs purchase price<\/td><td style="font-weight:600;">\$0<\/td>/i);
assert.equal(/Occupancy<\/td><td style="font-weight:600;">0\.9%<\/td>/i.test(capRateSevenFinalHtml), false);
assert.equal(/\$-0\b/.test(capRateSevenFinalHtml), false);
assert.equal(/\$135,000\b/i.test(capRateSevenFinalHtml), false);

console.log("acquisition-memo-v2-document smoke PASS");
