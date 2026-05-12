import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test";

const { parseMortgageStatementFromText } = await import("../../api/parse/parse-doc.js");
const { __test__: reportTestHelpers } = await import("../../api/generate-client-report.js");
const {
  validateAcquisitionPurchaseAssumptionsCandidate,
  validateCurrentMortgageCandidate,
} = await import("../../lib/ai-support-doc-recovery.js");

const acquisitionSourceText = [
  "Acquisition Term Sheet",
  "Purchase Price: $3,750,000",
  "LTV: 75%",
  "Interest Rate: 5.85%",
  "Amortization: 25 years",
  "Going-In Cap Rate: 6.25%",
  "Closing Costs: 2.5%",
].join("\n");

const acquisitionCandidate = {
  is_acquisition_purchase_assumptions: true,
  confidence: 0.96,
  purchase_price: 3750000,
  ltv: 75,
  interest_rate: 5.85,
  amortization_years: 25,
  going_in_cap_rate: 6.25,
  closing_costs_percent: 2.5,
  evidence: {
    purchase_price: ["Purchase Price: $3,750,000"],
    ltv: ["LTV: 75%"],
    interest_rate: ["Interest Rate: 5.85%"],
    amortization_years: ["Amortization: 25 years"],
    going_in_cap_rate: ["Going-In Cap Rate: 6.25%"],
    closing_costs_percent: ["Closing Costs: 2.5%"],
    warnings: [],
  },
};

const validatedAcquisition = validateAcquisitionPurchaseAssumptionsCandidate(
  acquisitionCandidate,
  acquisitionSourceText
);

assert.equal(validatedAcquisition.method, "ai_support_doc_recovery_validated");
assert.equal(validatedAcquisition.ai_assisted, true);
assert.equal(validatedAcquisition.validated, true);
assert.equal(validatedAcquisition.purchase_price, 3750000);
assert.equal(validatedAcquisition.ltv, 75);
assert.equal(validatedAcquisition.interest_rate, 5.85);
assert.equal(validatedAcquisition.amortization_years, 25);
assert.equal(validatedAcquisition.going_in_cap_rate, 6.25);
assert.equal(validatedAcquisition.closing_costs_percent, 2.5);
assert.equal(validatedAcquisition.derived_acquisition_loan_amount, 2812500);

const partialCandidate = {
  is_acquisition_purchase_assumptions: true,
  confidence: 0.95,
  purchase_price: 3750000,
  ltv: null,
  interest_rate: 5.85,
  amortization_years: null,
  going_in_cap_rate: 6.25,
  closing_costs_percent: 2.5,
  evidence: {
    purchase_price: ["Purchase Price: $3,750,000"],
    interest_rate: ["Interest Rate: 5.85%"],
    going_in_cap_rate: ["Going-In Cap Rate: 6.25%"],
    closing_costs_percent: ["Closing Costs: 2.5%"],
    warnings: [],
  },
};

const partialAcquisition = validateAcquisitionPurchaseAssumptionsCandidate(
  partialCandidate,
  [
    "Purchase Price: $3,750,000",
    "Interest Rate: 5.85%",
    "Going-In Cap Rate: 6.25%",
    "Closing Costs: 2.5%",
  ].join("\n")
);

assert.equal(partialAcquisition.purchase_price, 3750000);
assert.equal(partialAcquisition.ltv, null);
assert.equal(partialAcquisition.amortization_years, null);
assert.equal(partialAcquisition.derived_acquisition_loan_amount, null);
assert(partialAcquisition.parse_warnings.includes("missing_ltv"));
assert(partialAcquisition.parse_warnings.includes("missing_amortization_years"));

const partialAcquisitionHtml = reportTestHelpers.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: partialAcquisition,
  t12Payload: { net_operating_income: 420000 },
  reportType: "underwriting",
  reportTier: 2,
});

assert(partialAcquisitionHtml.includes("Proposed Acquisition Debt Sizing"));
assert(partialAcquisitionHtml.includes("Purchase price was not verified in the uploaded documents.") === false);
assert(partialAcquisitionHtml.includes("Acquisition debt sizing was not modeled because LTV was not verified in the uploaded documents."));
assert(partialAcquisitionHtml.includes("Estimated acquisition debt service was not modeled because amortization was not verified."));
assert.equal(/AI|parser|Textract|vendor/i.test(partialAcquisitionHtml), false);

const closingCostsExactCandidate = validateAcquisitionPurchaseAssumptionsCandidate(
  {
    ...acquisitionCandidate,
    closing_costs_percent: 1.5,
    evidence: {
      ...acquisitionCandidate.evidence,
      closing_costs_percent: ["Closing Costs: 1.5%"],
    },
  },
  [
    "Purchase Price: $3,750,000",
    "LTV: 75%",
    "Interest Rate: 5.85%",
    "Amortization: 25 years",
    "Going-In Cap Rate: 6.25%",
    "Closing Costs: 1.5%",
  ].join("\n")
);
const closingCostsExactHtml = reportTestHelpers.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: closingCostsExactCandidate,
  t12Payload: { net_operating_income: 420000 },
  reportType: "underwriting",
  reportTier: 2,
});
assert(closingCostsExactHtml.includes("<td>Closing Costs</td><td>1.5%</td>"));

const noLtvCandidate = validateAcquisitionPurchaseAssumptionsCandidate(
  {
    ...acquisitionCandidate,
    ltv: null,
    evidence: {
      ...acquisitionCandidate.evidence,
      ltv: [],
    },
  },
  [
    "Purchase Price: $3,750,000",
    "Interest Rate: 5.85%",
    "Amortization: 25 years",
    "Going-In Cap Rate: 6.25%",
    "Closing Costs: 2.5%",
  ].join("\n")
);
const noLtvHtml = reportTestHelpers.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: noLtvCandidate,
  t12Payload: { net_operating_income: 420000 },
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(noLtvHtml.includes("Derived Acquisition Loan Amount"), false);
assert(noLtvHtml.includes("Acquisition debt sizing was not modeled because LTV was not verified in the uploaded documents."));

const noAmortCandidate = validateAcquisitionPurchaseAssumptionsCandidate(
  {
    ...acquisitionCandidate,
    amortization_years: null,
    evidence: {
      ...acquisitionCandidate.evidence,
      amortization_years: [],
    },
  },
  [
    "Purchase Price: $3,750,000",
    "LTV: 75%",
    "Interest Rate: 5.85%",
    "Going-In Cap Rate: 6.25%",
    "Closing Costs: 2.5%",
  ].join("\n")
);
const noAmortHtml = reportTestHelpers.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: noAmortCandidate,
  t12Payload: { net_operating_income: 420000 },
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(noAmortHtml.includes("Estimated Annual Debt Service"), false);
assert.equal(noAmortHtml.includes("Proposed Acquisition DSCR"), false);
assert(noAmortHtml.includes("Estimated acquisition debt service was not modeled because amortization was not verified."));

const currentDebtText = [
  "Mortgage Statement",
  "Interest rate: 4.95%",
  "Monthly payment: $16,800",
  "Amortization remaining: 24 years",
  "This summary does not state current outstanding principal balance.",
].join("\n");
const currentDebtParse = parseMortgageStatementFromText(currentDebtText, {
  id: "generic-current-debt",
  original_filename: "Generic_Mortgage_Statement.pdf",
});
assert.equal(currentDebtParse.outstanding_balance, null);
assert.equal(currentDebtParse.parse_warnings.includes("missing_outstanding_balance"), true);
assert.equal(currentDebtParse.annual_debt_service, 201600);

const currentMortgageSourceText = [
  "Current Mortgage Statement",
  "Current outstanding principal balance: $2,100,000",
  "Monthly payment: $13,625",
  "Current debt service: $163,500",
  "Interest rate: 4.25% fixed",
  "Amortization remaining: 23 years",
  "Maturity date 2028-06-01",
  "Existing lender: ABC Bank",
  "This document represents true existing current debt, not proposed acquisition financing.",
].join("\n");

const currentMortgageCandidate = validateCurrentMortgageCandidate(
  {
    is_current_mortgage: true,
    confidence: 0.95,
    outstanding_balance: 2100000,
    monthly_payment: 13625,
    annual_debt_service: 163500,
    interest_rate: 4.25,
    amortization_years: 23,
    maturity_date: "2028-06-01",
    lender_name: "ABC Bank",
    evidence: {
      outstanding_balance: ["Current outstanding principal balance: $2,100,000"],
      monthly_payment: ["Monthly payment: $13,625"],
      annual_debt_service: ["Current debt service: $163,500"],
      interest_rate: ["Interest rate: 4.25% fixed"],
      amortization_years: ["Amortization remaining: 23 years"],
      maturity_date: ["Maturity date 2028-06-01"],
      lender_name: ["Existing lender: ABC Bank"],
      warnings: [],
    },
  },
  currentMortgageSourceText
);

assert.equal(currentMortgageCandidate.method, "ai_support_doc_recovery_validated");
assert.equal(currentMortgageCandidate.ai_assisted, true);
assert.equal(currentMortgageCandidate.validated, true);
assert.equal(currentMortgageCandidate.outstanding_balance, 2100000);
assert.equal(currentMortgageCandidate.monthly_payment, 13625);
assert.equal(currentMortgageCandidate.annual_debt_service, 163500);
assert.equal(currentMortgageCandidate.interest_rate, 4.25);
assert.equal(currentMortgageCandidate.amortization_years, 23);
assert.equal(currentMortgageCandidate.maturity_date, "2028-06-01");
assert.equal(currentMortgageCandidate.lender_name, "ABC Bank");

const currentMortgageNoBalanceCandidate = validateCurrentMortgageCandidate(
  {
    is_current_mortgage: true,
    confidence: 0.95,
    outstanding_balance: null,
    monthly_payment: 13625,
    annual_debt_service: null,
    interest_rate: 4.25,
    amortization_years: 23,
    maturity_date: "2028-06-01",
    lender_name: "ABC Bank",
    evidence: {
      monthly_payment: ["Monthly payment: $13,625"],
      interest_rate: ["Interest rate: 4.25% fixed"],
      amortization_years: ["Amortization remaining: 23 years"],
      maturity_date: ["Maturity date 2028-06-01"],
      lender_name: ["Existing lender: ABC Bank"],
      warnings: [],
    },
  },
  [
    "Current Mortgage Statement",
    "Monthly payment: $13,625",
    "Interest rate: 4.25% fixed",
    "Amortization remaining: 23 years",
    "Maturity date 2028-06-01",
    "Existing lender: ABC Bank",
  ].join("\n")
);
assert.equal(currentMortgageNoBalanceCandidate.outstanding_balance, null);
assert(currentMortgageNoBalanceCandidate.parse_warnings.includes("missing_outstanding_balance"));

const t12WithLineItemsHtml = reportTestHelpers.buildT12SummaryHtml(
  {
    effective_gross_income: 1000000,
    total_operating_expenses: 400000,
    net_operating_income: 600000,
    income_lines: [
      { label: "Parking Income", amount: 15000 },
      { label: "Laundry Income", amount: 8000 },
      { label: "Other Income", amount: 5000 },
    ],
    expense_lines: [
      { label: "Property Taxes", amount: 120000 },
      { label: "Insurance", amount: 45000 },
      { label: "Utilities", amount: 60000 },
    ],
  },
  (value) => `$${Number(value).toLocaleString("en-US")}`
);
assert.equal(t12WithLineItemsHtml.includes("Lump-Sum T12"), false);
assert.equal(t12WithLineItemsHtml.includes("No line-item detail available for this T12 format."), false);

const dataCoverageSummaryHtml = reportTestHelpers.buildScreeningDataCoverageSummary({
  t12Payload: {
    gross_potential_rent: 1000000,
    effective_gross_income: 950000,
    total_operating_expenses: 400000,
    net_operating_income: 550000,
  },
  computedRentRoll: {
    total_units: 10,
    occupancy: 0.9,
    total_in_place_annual: 900000,
    total_market_annual: 950000,
  },
  rentRollPayload: {
    total_units: 10,
    occupancy: 0.9,
    totals: {
      in_place_rent_annual: 900000,
      market_rent_annual: 950000,
    },
  },
  financials: {},
  effectiveReportMode: "underwriting",
  supportingUnderwritingDocsUsed: true,
  hasUploadedFiles: true,
});
assert(
  dataCoverageSummaryHtml.includes(
    "Proposed acquisition financing was modeled separately where validated. Current-debt DSCR and refinance capacity were not assessed because no current outstanding debt balance was verified."
  )
);
assert.equal(dataCoverageSummaryHtml.includes("Missing structured debt sizing prevents DSCR and current-debt assessment."), false);

console.log("supporting-doc-recovery smoke PASS");
