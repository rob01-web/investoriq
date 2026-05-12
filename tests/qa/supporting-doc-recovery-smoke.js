import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test";

const { parseMortgageStatementFromText } = await import("../../api/parse/parse-doc.js");
const { __test__: reportTestHelpers } = await import("../../api/generate-client-report.js");
const {
  validateAcquisitionPurchaseAssumptionsCandidate,
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

console.log("supporting-doc-recovery smoke PASS");
