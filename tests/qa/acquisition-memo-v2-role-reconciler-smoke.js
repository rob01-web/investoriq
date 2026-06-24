import assert from "assert";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import { buildAcquisitionMemoBossContract, validateAcquisitionMemoBossContract, validateAcquisitionMemoRenderAgainstBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
} from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";
import { reconcileAcquisitionMemoV2SupportDocRole } from "../../api/_lib/acquisition-memo-v2-role-reconciler.js";

function buildFixture() {
  const uploadedFiles = [
    { fileId: "t12-file", originalFilename: "Harbor_View_T12.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "rent-roll-file", originalFilename: "Harbor_View_Rent_Roll.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "current-debt-file", originalFilename: "Existing Current Debt Statement.pdf", mimeType: "application/pdf" },
    { fileId: "assumptions-file", originalFilename: "Proposed Acquisition Financing.pdf", mimeType: "application/pdf" },
  ];

  const parsedArtifacts = [
    {
      fileId: "t12-file",
      semantic_doc_role: "t12",
      payload: {
        t12_parsed: {
          income_lines: [{ label: "Effective Gross Income", amount: 1240000 }],
          expense_lines: [
            { label: "Property Taxes", amount: 168000 },
            { label: "Insurance", amount: 54000 },
          ],
          effective_gross_income: 1240000,
          total_operating_expenses: 612000,
          net_operating_income: 628000,
          gross_potential_rent: 1488000,
        },
      },
    },
    {
      fileId: "rent-roll-file",
      semantic_doc_role: "rent_roll",
      payload: {
        rent_roll_parsed: {
          total_units: 20,
          occupancy: 0.9,
          unit_mix: [
            { label: "Studio", count: 12, current_rent: 1425, market_rent: 1575 },
            { label: "3BR", count: 8, current_rent: 2195, market_rent: 2495 },
          ],
          units: [
            { label: "Studio", unit_number: "S-101", current_rent: 1425, market_rent: 1575 },
            { label: "3BR", unit_number: "3-101", current_rent: 2195, market_rent: 2495 },
          ],
          annual_in_place_rent: 240000,
          annual_market_rent: 264000,
        },
      },
    },
    {
      fileId: "current-debt-file",
      semantic_doc_role: "purchase_assumptions",
      debt_basis: "acquisition_financing_assumption",
      payload: {
        document_text_extracted:
          "Existing Current Debt Statement\n" +
          "Current Outstanding Balance $5,400,000\n" +
          "Interest Rate 5.25%\n" +
          "Amortization Remaining 21 years\n" +
          "Monthly Payment $28,750\n" +
          "Maturity Date 2030-08-01",
      },
    },
    {
      fileId: "assumptions-file",
      semantic_doc_role: "current_debt_context",
      debt_basis: "current_debt_context",
      payload: {
        document_text_extracted:
          "Purchase Assumptions / Proposed Acquisition Financing\n" +
          "Purchase Price $18,250,000\n" +
          "NOI Basis $1,195,000\n" +
          "Going-In Cap Reference 6.50%\n" +
          "Proposed Acquisition Loan $12,125,000\n" +
          "LTV 66.5%\n" +
          "Interest Rate 5.75%\n" +
          "Amortization 28 years",
      },
    },
  ];

  return { uploadedFiles, parsedArtifacts };
}

function buildCoreMetrics() {
  return {
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    egi: 1240000,
    opEx: 612000,
    noi: 628000,
    expenseRatio: 612000 / 1240000,
    noiMargin: 628000 / 1240000,
    breakEvenOccupancy: 0.82,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
    totalUnits: 20,
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

const currentDebtEvidence = reconcileAcquisitionMemoV2SupportDocRole({
  file: parsedArtifacts.find((artifact) => artifact.fileId === "current-debt-file"),
  artifacts: parsedArtifacts.filter((artifact) => artifact.fileId === "current-debt-file"),
  acceptedTruth: {
    semanticDocRole: "purchase_assumptions",
    debtBasis: "acquisition_financing_assumption",
    semanticDocDisplayLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
  },
});
const purchaseAssumptionsEvidence = reconcileAcquisitionMemoV2SupportDocRole({
  file: parsedArtifacts.find((artifact) => artifact.fileId === "assumptions-file"),
  artifacts: parsedArtifacts.filter((artifact) => artifact.fileId === "assumptions-file"),
  acceptedTruth: {
    semanticDocRole: "current_debt_context",
    debtBasis: "current_debt_context",
    semanticDocDisplayLabel: "Existing Debt Context / Current Mortgage / Debt Statement",
  },
});

assert.equal(currentDebtEvidence.canonicalRole, "current_debt_context");
assert.equal(purchaseAssumptionsEvidence.canonicalRole, "purchase_assumptions");
assert.ok(currentDebtEvidence.evidence.currentDebtScore > currentDebtEvidence.evidence.purchaseScore);
assert.ok(purchaseAssumptionsEvidence.evidence.purchaseScore > purchaseAssumptionsEvidence.evidence.currentDebtScore);

const sourceCurrentDebt = canonicalSourcePackage.supportDocs.get("current-debt-file");
const sourcePurchaseAssumptions = canonicalSourcePackage.supportDocs.get("assumptions-file");
assert.equal(sourceCurrentDebt?.canonicalRole, "current_debt_context");
assert.equal(sourcePurchaseAssumptions?.canonicalRole, "purchase_assumptions");
assert.equal(sourceCurrentDebt?.acceptedSemanticDocRole, "current_debt_context");
assert.equal(sourcePurchaseAssumptions?.acceptedSemanticDocRole, "purchase_assumptions");

const projectionCurrentDebt = acquisitionMemoProjection.supportDocProjection.currentDebtContext;
const projectionPurchaseAssumptions = acquisitionMemoProjection.supportDocProjection.purchaseAssumptions;
assert.equal(projectionCurrentDebt?.canonicalRole, "current_debt_context");
assert.equal(projectionPurchaseAssumptions?.canonicalRole, "purchase_assumptions");
assert.equal(acquisitionMemoProjection.financingReadinessSignals.hasCurrentDebtContext, true);
assert.equal(acquisitionMemoProjection.financingReadinessSignals.hasPurchaseAssumptions, true);

const bossValidation = validateAcquisitionMemoBossContract(bossContract);
assert.equal(bossValidation.ok, true, JSON.stringify(bossValidation, null, 2));
const modelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel);
assert.equal(modelValidation.ok, true, JSON.stringify(modelValidation, null, 2));
assert.equal(customerSurfaceModel.sourceTruth.accepted.currentDebtPresent, true);
assert.equal(customerSurfaceModel.sourceTruth.accepted.purchaseAssumptionsPresent, true);
assert.equal(customerSurfaceModel.supportSourcesByRole.current_debt_context?.canonicalRole, "current_debt_context");
assert.equal(customerSurfaceModel.supportSourcesByRole.purchase_assumptions?.canonicalRole, "purchase_assumptions");

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
  acquisitionTermsPayload: parsedArtifacts.find((artifact) => artifact.fileId === "assumptions-file")?.payload?.document_text_extracted ? {
    purchase_price: 18250000,
    noi_basis: 1195000,
    going_in_cap_rate: 0.065,
    proposed_loan_amount: 12125000,
    ltv: 0.665,
    interest_rate: 0.0575,
    amortization_years: 28,
  } : null,
  loanTermSheetTermsPayload: parsedArtifacts.find((artifact) => artifact.fileId === "assumptions-file")?.payload?.document_text_extracted ? {
    purchase_price: 18250000,
    noi_basis: 1195000,
    going_in_cap_rate: 0.065,
    proposed_loan_amount: 12125000,
    ltv: 0.665,
    interest_rate: 0.0575,
    amortization_years: 28,
  } : null,
  mortgagePayload: parsedArtifacts.find((artifact) => artifact.fileId === "current-debt-file")?.payload?.document_text_extracted ? {
    current_outstanding_balance: 5400000,
    interest_rate: 0.0525,
    amortization_remaining_years: 21,
    monthly_payment: 28750,
    maturity_date: "2030-08-01",
  } : null,
});

assert.equal(/Current Debt Context|Existing Debt Context/i.test(renderedHtml), true);
assert.equal(/Purchase Assumptions \/ Proposed Acquisition Financing Context/i.test(renderedHtml), true);
assert.equal(/No purchase assumptions uploaded|Purchase assumptions provided No/i.test(renderedHtml), false);
assert.equal(/No current debt evidence/i.test(renderedHtml), false);

console.log("acquisition-memo-v2-role-reconciler smoke PASS");
