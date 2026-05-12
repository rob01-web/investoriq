import assert from "node:assert/strict";
import { inferSupportingDocTypeFromText, parseMortgageStatementFromText } from "../../api/parse/parse-doc.js";
import {
  __test__ as supportDocRecoveryTestHelpers,
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery,
  shouldAttemptCurrentMortgageRecovery,
  shouldAttemptPropertyTaxRecovery,
  shouldAttemptRenovationRecovery,
} from "../../lib/ai-support-doc-recovery.js";

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Existing mortgage statement",
      "Current outstanding principal balance $2,450,000",
      "Monthly payment $16,800",
      "Existing lender: ABC Bank",
      "Maturity date 2028-06-01",
    ].join("\n")
  ),
  "mortgage_statement"
);

const maplewellDebtText = [
  "Current Mortgage Statement - Maplewell Court Apartments",
  "Debt Type: Existing mortgage / true current debt",
  "Current outstanding principal balance: $2,100,000",
  "Current monthly debt service: $13,625",
  "Interest rate: 4.25% fixed",
  "Amortization remaining: 23 years",
  "This document represents true existing current debt, not proposed acquisition financing.",
].join("\n");

assert.equal(inferSupportingDocTypeFromText(maplewellDebtText), "mortgage_statement");
const maplewellDebt = parseMortgageStatementFromText(maplewellDebtText, {
  id: "maplewell-debt",
  original_filename: "Debt_Summary_Maplewell_Court.pdf",
});
assert.equal(maplewellDebt.outstanding_balance, 2100000);
assert.equal(maplewellDebt.monthly_payment, 13625);
assert.equal(maplewellDebt.monthly_debt_service, 13625);
assert.equal(maplewellDebt.interest_rate, 4.25);
assert.equal(maplewellDebt.amort_years, 23);
assert.deepEqual(maplewellDebt.parse_warnings, []);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Indicative acquisition financing term sheet",
      "Borrower to be determined by Purchaser",
      "Loan amount at purchase price $3,500,000",
      "Proposed LTV 65%",
      "Not a financing commitment",
      "Exit cap 6.25%",
    ].join("\n")
  ),
  "loan_term_sheet"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Property Tax Notice",
      "2025 Municipal Property Taxes $38,400",
      "Roll Number 1234-567-890",
      "Installments due June and September",
    ].join("\n")
  ),
  "property_tax"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Historical Capital Expenditure Summary",
      "Roof Replacement 2018-09-15 $45,000",
      "Boiler Replacement 2020-02-10 $32,000",
      "CapEx items only. No rent lift, ROI, payback, or forward-looking renovation plan provided.",
    ].join("\n")
  ),
  "renovation"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Property Tax Notice",
      "Annual Tax 2025 $42,300",
      "Assessment Roll 1234-567",
      "Installment schedule provided.",
    ].join("\n")
  ),
  "property_tax"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "UNSUPPORTED Market Survey",
      "UNSUPPORTED Appraisal Summary",
      "Phase I ESA environmental report excerpt",
      "This is background support only.",
    ].join("\n")
  ),
  "supporting_documents_unclassified"
);

assert.equal(
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery(
    [
      "Appraisal / Purchase Assumptions",
      "Purchase Price: $12,500,000",
      "LTV: 80%",
      "Estimated Interest Rate: 4.10%",
      "Amortization: 40 years",
      "Closing Costs: 1.5%",
    ].join("\n")
  ),
  true
);

assert.equal(
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery(
    [
      "Appraisal Report",
      "As-Is Value: $12,500,000",
      "Cap Rate: 4.99%",
      "No purchase assumptions or financing terms are provided here.",
    ].join("\n")
  ),
  false
);

assert.equal(
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery(
    [
      "Broker email summary",
      "Looks like a strong deal with good upside and a healthy sponsorship story.",
      "This note does not include purchase assumptions, LTV, rate, amortization, or closing costs.",
    ].join("\n")
  ),
  false
);

assert.equal(
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery(
    [
      "Purchase Assumptions",
      "Purchase Price: $34,500,000",
      "Going-in Cap Rate: 4.99%",
      "LTV: 85%",
      "Interest Rate: 3.80%",
      "Amortization: 40 years",
    ].join("\n")
  ),
  true
);

assert.equal(
  shouldAttemptCurrentMortgageRecovery(
    [
      "Current Mortgage Statement",
      "Current outstanding principal balance: $2,100,000",
      "Monthly payment: $13,625",
      "Interest rate: 4.25%",
      "Amortization remaining: 23 years",
      "Existing lender: ABC Bank",
    ].join("\n")
  ),
  true
);

assert.equal(
  shouldAttemptCurrentMortgageRecovery(
    [
      "Indicative acquisition financing term sheet",
      "Purchase Price: $3,500,000",
      "LTV 65%",
      "Amortization: 25 years",
      "Interest Rate: 5.50%",
    ].join("\n")
  ),
  false
);

assert.equal(
  shouldAttemptRenovationRecovery(
    [
      "Renovation Budget",
      "Exterior / Curb Appeal: $45,000",
      "Common Areas: $30,000",
      "Unit Turns: $120,000",
      "Contingency: $20,000",
      "Total Budget: $215,000",
    ].join("\n")
  ),
  true
);

assert.equal(
  shouldAttemptRenovationRecovery(
    [
      "Capital plan summary",
      "Historic CapEx only.",
      "No forward-looking budget or implementation assumptions.",
    ].join("\n")
  ),
  false
);

assert.equal(
  shouldAttemptPropertyTaxRecovery(
    [
      "Property Tax Notice",
      "Annual Taxes $38,400",
      "Roll Number 1234-567-890",
    ].join("\n")
  ),
  true
);

assert.equal(
  shouldAttemptPropertyTaxRecovery(
    [
      "Assessment excerpt",
      "Assessed value $12,500,000",
      "No tax amount is stated here.",
    ].join("\n")
  ),
  false
);

assert.deepEqual(supportDocRecoveryTestHelpers.buildResponseSchema().required, [
  "is_acquisition_purchase_assumptions",
  "confidence",
  "purchase_price",
  "ltv",
  "interest_rate",
  "amortization_years",
  "going_in_cap_rate",
  "closing_costs_percent",
  "evidence",
]);

assert.deepEqual(supportDocRecoveryTestHelpers.buildRenovationResponseSchema().required, [
  "is_renovation_capex",
  "confidence",
  "total_budget",
  "budget_rows",
  "unit_count",
  "per_unit_cost",
  "timing_or_phasing",
  "rent_lift",
  "roi",
  "payback_period",
  "evidence",
]);

assert.deepEqual(supportDocRecoveryTestHelpers.buildPropertyTaxResponseSchema().required, [
  "is_property_tax",
  "confidence",
  "annual_tax",
  "tax_year",
  "assessed_value",
  "roll_number",
  "evidence",
]);

console.log("supporting-doc-classification smoke PASS");
