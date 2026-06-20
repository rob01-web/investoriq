import assert from "assert";
import fs from "fs";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import {
  buildAcquisitionMemoBossContract,
  validateAcquisitionMemoBossContract,
} from "../../api/_lib/acquisition-memo-boss-contract.js";

function buildRetest13SourcePackage() {
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

  const rentRollUnits = [
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
          units: rentRollUnits,
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
        document_text_extracted:
          "Purchase assumptions / proposed acquisition financing\n" +
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
    {
      fileId: "current-debt-file",
      original_filename: "Current_Debt_Stonebridge.pdf",
      semantic_doc_role: "current_debt",
      debt_basis: "current_debt",
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
      fileId: "reno-file",
      original_filename: "Stonebridge_Reno_Plan.pdf",
      semantic_doc_role: "renovation_plan",
      payload: { document_text_extracted: "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000" },
    },
    {
      fileId: "appraisal-file",
      original_filename: "Stonebridge_Appraisal_Summary.pdf",
      semantic_doc_role: "appraisal",
      payload: { document_text_extracted: "Appraisal Summary / Valuation Context" },
    },
    {
      fileId: "survey-file",
      original_filename: "Stonebridge_Market_Survey.pdf",
      semantic_doc_role: "market_survey",
      payload: { document_text_extracted: "Market Rent Survey Context" },
    },
    {
      fileId: "phase-file",
      original_filename: "Stonebridge_Phase_I_ESA.pdf",
      semantic_doc_role: "phase_i_esa",
      payload: { document_text_extracted: "Phase I ESA / Environmental Due Diligence Context" },
    },
  ];

  return buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const sourcePackage = buildRetest13SourcePackage();
const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
const coreMetrics = {
  units: 64,
  occupancy: 0.9375,
  annualInPlaceRent: 1432800,
  annualMarketRent: 1718400,
  annualRentUpside: 285600,
  egi: 1500000,
  opEx: 555000,
  noi: 945000,
  expenseRatio: 0.37,
  noiMargin: 0.63,
  breakEvenOccupancy: 0.37,
  purchasePrice: 13500000,
  goingInCapRate: 7,
};
const reportMeta = {
  propertyName: "Stonebridge Lofts",
  generatedAt: "2026-06-20T00:00:00.000Z",
};
const propertyProfile = {
  propertyName: "Stonebridge Lofts",
  propertyAddress: "123 Main St",
  assetClass: "Multifamily",
};

const contract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: sourcePackage,
  acquisitionMemoProjection,
  coreMetrics,
  propertyProfile,
  reportMeta,
  reportMode: "v1_core",
});

const contractAgain = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: clone(sourcePackage),
  acquisitionMemoProjection: clone(acquisitionMemoProjection),
  coreMetrics: clone(coreMetrics),
  propertyProfile: clone(propertyProfile),
  reportMeta: clone(reportMeta),
  reportMode: "v1_core",
});

assert.deepStrictEqual(contract, contractAgain);

const validation = validateAcquisitionMemoBossContract(contract);
assert.equal(validation.ok, true);
assert.equal(validation.issues.length, 0);

assert.equal(contract.contractVersion, "acq_memo_boss_contract_v1");
assert.equal(contract.coreGate.t12Valid, true);
assert.equal(contract.coreGate.rentRollValid, true);
assert.equal(contract.coreGate.publishAllowed, true);
assert.deepStrictEqual(contract.coreGate.fatalReasons, []);

assert.equal(contract.sourceTruth.coreT12.role, "core_t12");
assert.equal(contract.sourceTruth.coreRentRoll.role, "core_rent_roll");
assert.equal(contract.sourceTruth.supportDocs.length >= 6, true);

assert.equal(contract.sections.unitMix.status, "required");
assert.ok(contract.sections.unitMix.requiredFacts.includes("unit_mix"));
assert.ok(contract.sections.unitMix.requiredFacts.includes("units"));
assert.ok(contract.sections.unitMix.forbiddenFallbackText.includes("No parsed unit mix rows were available from the canonical rent roll evidence."));
assert.ok(contract.sections.unitMix.renderRequirements.includes("Prefer structured unit_mix or units before any text fallback."));
assert.equal(contract.sections.unitMix.factAvailability.sourceBacked, true);
assert.ok(contract.sections.unitMix.factAvailability.available.includes("unit_mix"));
assert.ok(contract.sections.unitMix.factAvailability.available.includes("units"));
assert.deepStrictEqual(contract.sections.unitMix.factAvailability.missing, []);
assert.ok(contract.sections.unitMix.postRenderAssertions.some((item) => item.code === "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS"));
assert.ok(contract.sections.unitMix.postRenderAssertions.some((item) => item.code === "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT"));

assert.ok(contract.sections.capRateValueIndication.requiredFacts.includes("total_units"));
assert.ok(contract.sections.capRateValueIndication.requiredFacts.includes("going_in_cap_rate"));
assert.ok(contract.sections.capRateValueIndication.renderRequirements.includes("Per-unit values are required when total units are available."));
assert.equal(contract.sections.capRateValueIndication.forbiddenFallbackText.includes("-"), true);
assert.equal(contract.sections.capRateValueIndication.factAvailability.sourceBacked, true);
assert.ok(contract.sections.capRateValueIndication.factAvailability.available.includes("total_units"));
assert.ok(contract.sections.capRateValueIndication.factAvailability.available.includes("units"));
assert.ok(contract.sections.capRateValueIndication.postRenderAssertions.some((item) => item.code === "CAP_RATE_PER_UNIT_REQUIRED_WHEN_UNITS_EXIST"));
assert.ok(contract.sections.capRateValueIndication.postRenderAssertions.some((item) => item.code === "NO_ZERO_CAP_RATE"));

assert.ok(contract.sections.currentDebtContext.requiredFacts.includes("current_outstanding_balance"));
assert.ok(contract.sections.currentDebtContext.requiredFacts.includes("maturity_date"));
assert.equal(contract.sections.currentDebtContext.sourceBindings[0].sourceRole, "current_debt_context");
assert.equal(contract.sections.currentDebtContext.factAvailability.sourceBacked, true);
assert.ok(contract.sections.currentDebtContext.factAvailability.available.includes("current_outstanding_balance"));
assert.ok(contract.sections.currentDebtContext.postRenderAssertions.some((item) => item.code === "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED"));

assert.ok(contract.sections.proposedFinancingContext.requiredFacts.includes("proposed_loan_amount"));
assert.ok(contract.sections.proposedFinancingContext.requiredFacts.includes("lender_fee_percent"));
assert.equal(contract.sections.proposedFinancingContext.sourceBindings[0].sourceRole, "purchase_assumptions");
assert.equal(contract.sections.proposedFinancingContext.requiredFacts.includes("current_outstanding_balance"), false);
assert.equal(contract.sections.proposedFinancingContext.factAvailability.sourceBacked, true);
assert.ok(contract.sections.proposedFinancingContext.factAvailability.available.includes("proposed_loan_amount"));
assert.ok(contract.sections.proposedFinancingContext.postRenderAssertions.some((item) => item.code === "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"));

assert.ok(contract.sections.operatingStatementTTMSummary.requiredFacts.includes("expense_lines"));
assert.ok(contract.sections.operatingStatementTTMSummary.requiredFacts.includes("net_operating_income"));
assert.equal(contract.sections.operatingStatementTTMSummary.factAvailability.sourceBacked, true);
assert.ok(contract.sections.operatingStatementTTMSummary.factAvailability.available.includes("expense_lines"));
assert.ok(contract.sections.operatingStatementTTMSummary.postRenderAssertions.some((item) => item.code === "T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT"));

assert.ok(contract.forbiddenSurfaces.includes("DSCR"));
assert.ok(contract.forbiddenSurfaces.includes("refinance"));
assert.ok(contract.forbiddenSurfaces.includes("DCF"));
assert.ok(contract.forbiddenSurfaces.includes("waterfall"));
assert.ok(contract.forbiddenSurfaces.includes("equity return"));
assert.ok(contract.forbiddenSurfaces.includes("deal score"));
assert.ok(contract.forbiddenSurfaces.includes("final recommendation"));
assert.ok(contract.forbiddenSurfaces.includes("BUY"));
assert.ok(contract.forbiddenSurfaces.includes("SELL"));
assert.ok(contract.forbiddenSurfaces.includes("HOLD"));
assert.ok(contract.forbiddenSurfaces.includes("loan approval"));
assert.ok(contract.forbiddenSurfaces.includes("lender commitment"));

assert.ok(contract.sections.acquisitionRequestContext.requiredFacts.includes("proposed_loan_amount"));
assert.equal(contract.sections.acquisitionRequestContext.collapseInstructions.length > 0, true);
assert.equal(contract.sections.acquisitionRequestContext.factAvailability.sourceBacked, true);
assert.ok(contract.sections.acquisitionRequestContext.factAvailability.available.includes("purchase_price"));
assert.equal(contract.sections.documentTreatment.status, "required");
assert.equal(contract.sections.documentTreatment.factAvailability.sourceBacked, true);
assert.ok(contract.sections.documentTreatment.factAvailability.available.includes("support_docs"));
assert.equal(contract.sections.dataCoverageSourceLimitations.status, "required");
assert.equal(contract.sections.methodologyDataTransparency.status, "required");

const bossContractSource = fs.readFileSync("api/_lib/acquisition-memo-boss-contract.js", "utf8");
assert.equal(/from\s+["'][^"']*(openai|anthropic|azure|gpt|fetch|axios)[^"']*["']/i.test(bossContractSource), false);
assert.equal(/\bimport\s+.*\b(openai|anthropic|axios)\b/i.test(bossContractSource), false);
assert.equal(/\bfetch\s*\(/i.test(bossContractSource), false);
assert.equal(/\bnew\s+OpenAI\b/i.test(bossContractSource), false);

console.log("acquisition-memo-boss-contract smoke PASS");
