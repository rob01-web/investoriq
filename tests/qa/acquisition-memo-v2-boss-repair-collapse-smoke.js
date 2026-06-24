import assert from "assert";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import { buildAcquisitionMemoBossContract, enforceAcquisitionMemoBossContractOnHtml, validateAcquisitionMemoBossContract, validateAcquisitionMemoRenderAgainstBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";
import {
  applyAcquisitionMemoV2BossRepairPlan,
  buildAcquisitionMemoV2BossRepairPlan,
} from "../../api/_lib/acquisition-memo-v2-boss-repair.js";

function buildFixture() {
  const uploadedFiles = [
    { fileId: "t12-file", originalFilename: "Harbor_View_T12.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "rent-roll-file", originalFilename: "Harbor_View_Rent_Roll.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "debt-file", originalFilename: "Existing Current Debt Statement.pdf", mimeType: "application/pdf" },
    { fileId: "assumptions-file", originalFilename: "Proposed Acquisition Financing.pdf", mimeType: "application/pdf" },
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
          units: [
            { label: "1BR", unit_number: "1-101", current_rent: 1850, market_rent: 2050 },
            { label: "2BR", unit_number: "2-101", current_rent: 1881, market_rent: 2425 },
          ],
          annual_in_place_rent: 1432800,
          annual_market_rent: 1718400,
        },
      },
    },
    {
      fileId: "debt-file",
      semantic_doc_role: "current_debt_context",
      debt_basis: "current_debt_context",
      payload: {
        document_text_extracted:
          "Existing Current Debt Statement\n" +
          "Current Outstanding Balance $6,800,000\n" +
          "Interest Rate 4.85%\n" +
          "Amortization Remaining 24 years\n" +
          "Monthly Payment $39,250\n" +
          "Maturity Date 2029-11-01",
      },
    },
    {
      fileId: "assumptions-file",
      semantic_doc_role: "purchase_assumptions",
      debt_basis: "acquisition_financing_assumption",
      payload: {
        document_text_extracted:
          "Purchase Assumptions / Proposed Acquisition Financing\n" +
          "Purchase Price $13,500,000\n" +
          "NOI Basis $945,000\n" +
          "Going-In Cap Reference 7.00%\n" +
          "Proposed Acquisition Loan $9,450,000\n" +
          "LTV 70.0%\n" +
          "Interest Rate 5.95%\n" +
          "Amortization 30 years\n" +
          "Lender Fee 0.85%",
      },
    },
  ];

  return { uploadedFiles, parsedArtifacts };
}

function buildCoreMetrics() {
  return {
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 555000 / 1500000,
    noiMargin: 945000 / 1500000,
    breakEvenOccupancy: 0.62,
    purchasePrice: 13500000,
    goingInCapRate: 0.07,
    totalUnits: 64,
  };
}

const { uploadedFiles, parsedArtifacts } = buildFixture();
const canonicalSourcePackage = buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);
const acquisitionMemoProjection = buildAcquisitionMemoProjection(canonicalSourcePackage);
const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage,
  acquisitionMemoProjection,
  coreMetrics: buildCoreMetrics(),
  propertyProfile: {
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  reportMeta: {
    reportType: "acquisition_memo",
    reportMode: "v1_core",
    generatedAt: new Date().toISOString(),
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  reportMode: "v1_core",
});
const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage,
  acquisitionMemoProjection,
  bossContract,
  coreMetrics: buildCoreMetrics(),
  propertyProfile: {
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  reportMeta: {
    reportType: "acquisition_memo",
    reportMode: "v1_core",
    generatedAt: new Date().toISOString(),
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  reportMode: "v1_core",
});

const bossValidation = validateAcquisitionMemoBossContract(bossContract);
assert.equal(bossValidation.ok, true, JSON.stringify(bossValidation, null, 2));
const modelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel);
assert.equal(modelValidation.ok, true, JSON.stringify(modelValidation, null, 2));

const renderedHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection,
  sourcePackage: canonicalSourcePackage,
  coreMetrics: buildCoreMetrics(),
  reportMeta: {
    reportType: "acquisition_memo",
    reportMode: "v1_core",
    generatedAt: new Date().toISOString(),
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  propertyProfile: {
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  bossContract,
  customerSurfaceModel,
  t12Payload: parsedArtifacts.find((artifact) => artifact.fileId === "t12-file")?.payload?.t12_parsed || null,
  acquisitionTermsPayload: {
    purchase_price: 13500000,
    noi_basis: 945000,
    going_in_cap_rate: 0.07,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
  loanTermSheetTermsPayload: {
    purchase_price: 13500000,
    noi_basis: 945000,
    going_in_cap_rate: 0.07,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
  mortgagePayload: {
    current_outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_remaining_years: 24,
    monthly_payment: 39250,
    maturity_date: "2029-11-01",
  },
});

const hostileHtml = renderedHtml.replace(
  /<tr><td>Lender \/ Origination Fee<\/td><td style="font-weight:600;">[^<]*<\/td><\/tr>/i,
  ""
);
const hostileHtmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(hostileHtml, customerSurfaceModel);
assert.equal(hostileHtmlValidation.ok, false);

const repairPlan = buildAcquisitionMemoV2BossRepairPlan({
  bossCompliance: validateAcquisitionMemoRenderAgainstBossContract(bossContract, hostileHtml),
  customerSurfaceModelValidation: modelValidation,
  customerSurfaceHtmlValidation: hostileHtmlValidation,
});
assert.equal(repairPlan.coreFatal.length, 0, JSON.stringify(repairPlan, null, 2));
assert.equal(repairPlan.shouldRetry, true, JSON.stringify(repairPlan, null, 2));
assert.ok(repairPlan.repairableSectionKeys.includes("acquisitionRequestContext") || repairPlan.repairableSectionKeys.includes("proposedFinancingContext"));

const repairedModel = applyAcquisitionMemoV2BossRepairPlan(customerSurfaceModel, repairPlan);
const repairedBossContract = applyAcquisitionMemoV2BossRepairPlan(bossContract, repairPlan);
assert.equal(repairedModel.sections.acquisitionRequestContext.status, "collapsed");
assert.equal(repairedBossContract.sections.acquisitionRequestContext.status, "collapsed");
assert.equal(repairedBossContract.sections.proposedFinancingContext.status, "collapsed");

const repairedHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection,
  sourcePackage: canonicalSourcePackage,
  coreMetrics: buildCoreMetrics(),
  reportMeta: {
    reportType: "acquisition_memo",
    reportMode: "v1_core",
    generatedAt: new Date().toISOString(),
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  propertyProfile: {
    propertyName: "Harbor View",
    propertyAddress: "123 Harbor Road",
    propertyTitle: "Harbor View Multifamily",
  },
  bossContract: repairedBossContract,
  customerSurfaceModel: repairedModel,
  t12Payload: parsedArtifacts.find((artifact) => artifact.fileId === "t12-file")?.payload?.t12_parsed || null,
  acquisitionTermsPayload: {
    purchase_price: 13500000,
    noi_basis: 945000,
    going_in_cap_rate: 0.07,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
  loanTermSheetTermsPayload: {
    purchase_price: 13500000,
    noi_basis: 945000,
    going_in_cap_rate: 0.07,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
  mortgagePayload: {
    current_outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_remaining_years: 24,
    monthly_payment: 39250,
    maturity_date: "2029-11-01",
  },
});

const repairedHtmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(repairedHtml, repairedModel);
assert.equal(repairedHtmlValidation.ok, true, JSON.stringify(repairedHtmlValidation, null, 2));
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(repairedBossContract, repairedHtml).ok, true);
assert.equal(/No purchase assumptions uploaded/i.test(repairedHtml), false);
assert.equal(/No current debt evidence/i.test(repairedHtml), false);

const collapseableForbiddenHtml = `${repairedHtml}\n<div>DSCR refinance DCF waterfall equity return deal score loan approval</div>`;
const collapseableForbiddenValidation = validateAcquisitionMemoRenderAgainstBossContract(repairedBossContract, collapseableForbiddenHtml);
const collapseableForbiddenPlan = buildAcquisitionMemoV2BossRepairPlan({
  bossCompliance: validateAcquisitionMemoRenderAgainstBossContract(repairedBossContract, collapseableForbiddenHtml),
  customerSurfaceModelValidation: repairedHtmlValidation,
  customerSurfaceHtmlValidation: collapseableForbiddenValidation,
});
assert.equal(collapseableForbiddenPlan.coreFatal.length, 0, JSON.stringify(collapseableForbiddenPlan, null, 2));
assert.ok(collapseableForbiddenPlan.forbiddenSurface.length > 0, JSON.stringify(collapseableForbiddenPlan, null, 2));
const collapsedForbiddenHtml = enforceAcquisitionMemoBossContractOnHtml(repairedBossContract, collapseableForbiddenHtml);
assert.equal(collapsedForbiddenHtml.ok, true, JSON.stringify(collapsedForbiddenHtml, null, 2));
assert.equal(/DSCR|refinance|DCF|waterfall|equity return|deal score|loan approval/i.test(collapsedForbiddenHtml.repairedHtml || ""), false);
assert.equal(Boolean(collapsedForbiddenHtml.ok), true);

const hardForbiddenHtml = `${repairedHtml}\n<div>final recommendation BUY SELL HOLD lender commitment</div>`;
const hardForbiddenValidation = validateAcquisitionMemoRenderAgainstBossContract(repairedBossContract, hardForbiddenHtml);
const hardForbiddenPlan = buildAcquisitionMemoV2BossRepairPlan({
  bossCompliance: validateAcquisitionMemoRenderAgainstBossContract(repairedBossContract, hardForbiddenHtml),
  customerSurfaceModelValidation: repairedHtmlValidation,
  customerSurfaceHtmlValidation: hardForbiddenValidation,
});
assert.equal(hardForbiddenPlan.coreFatal.length, 0, JSON.stringify(hardForbiddenPlan, null, 2));
assert.ok(hardForbiddenPlan.forbiddenSurface.length > 0, JSON.stringify(hardForbiddenPlan, null, 2));
const hardForbiddenEnforcement = enforceAcquisitionMemoBossContractOnHtml(repairedBossContract, hardForbiddenHtml);
assert.equal(hardForbiddenEnforcement.ok, false, JSON.stringify(hardForbiddenEnforcement, null, 2));
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(repairedBossContract, hardForbiddenEnforcement.repairedHtml || "").ok, false);

const fatalPlan = buildAcquisitionMemoV2BossRepairPlan({
  customerSurfaceModelValidation: {
    ok: false,
    issues: [
      {
        code: "MODEL_CORE_T12_MISSING",
        severity: "critical",
        path: "model.coreSources.coreT12",
      },
    ],
  },
});
assert.ok(fatalPlan.coreFatal.length > 0);
assert.equal(fatalPlan.shouldRetry, false);

console.log("acquisition-memo-v2-boss-repair-collapse smoke PASS");
