import assert from "node:assert/strict";
import { buildSupportDocTaxonomyState } from "../../api/_lib/report-surface-contracts.js";
import { inferSupportingDocTypeFromText, parseMortgageStatementFromText } from "../../api/parse/parse-doc.js";
import {
  __test__ as supportDocRecoveryTestHelpers,
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery,
  shouldAttemptAppraisalRecovery,
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
  shouldAttemptAppraisalRecovery(
    [
      "Appraisal Report",
      "As-Is Value: $12,500,000",
      "Valuation Date: 2025-03-31",
      "Cap Rate: 4.99%",
    ].join("\n")
  ),
  true
);

assert.equal(
  shouldAttemptAppraisalRecovery(
    [
      "Purchase Assumptions",
      "Purchase Price: $34,500,000",
      "LTV: 85%",
      "Interest Rate: 3.80%",
      "Amortization: 40 years",
      "Going-in Cap Rate: 4.99%",
    ].join("\n")
  ),
  false
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

const purchaseAssumptionsTaxonomy = buildSupportDocTaxonomyState({
  declaredDocType: "purchase_assumptions",
  detectedDocType: "appraisal",
  originalFilename: "PurchaseAssumptions.pdf",
  rawText: [
    "Purchase Assumptions",
    "Purchase Price: $34,500,000",
    "LTV: 85%",
    "Interest Rate: 3.80%",
    "Amortization: 40 years",
    "Going-in Cap Rate: 4.99%",
  ].join("\n"),
  payload: {
    purchase_price: 34500000,
    ltv: 85,
    interest_rate: 3.8,
    amortization_years: 40,
    going_in_cap_rate: 4.99,
  },
});
assert.equal(purchaseAssumptionsTaxonomy.semantic_doc_role, "purchase_assumptions");
assert.notEqual(purchaseAssumptionsTaxonomy.semantic_doc_role, "appraisal");
assert.equal(purchaseAssumptionsTaxonomy.semantic_doc_display_label, "purchase_assumptions");

const brokerEmailTaxonomy = buildSupportDocTaxonomyState({
  declaredDocType: "broker_email",
  detectedDocType: "loan_term_sheet",
  originalFilename: "BrokerEmail.pdf",
  rawText: [
    "From: broker@example.com",
    "Subject: Acquisition note",
    "Please review the opportunity and call if you want to discuss next steps.",
    "This is a broker email and not a loan term sheet.",
  ].join("\n"),
  payload: {},
});
assert.equal(brokerEmailTaxonomy.semantic_doc_role, "broker_email");
assert.notEqual(brokerEmailTaxonomy.semantic_doc_role, "loan_term_sheet");
assert.equal(brokerEmailTaxonomy.semantic_doc_display_label, "broker_email");

const renovationTaxonomy = buildSupportDocTaxonomyState({
  declaredDocType: "renovation_budget",
  detectedDocType: "renovation",
  originalFilename: "RenovationBudget.docx",
  rawText: [
    "Renovation Budget",
    "Exterior / Curb Appeal: $45,000",
    "Common Areas: $30,000",
    "Unit Turns: $120,000",
    "Contingency: $20,000",
    "Total Budget: $215,000",
  ].join("\n"),
  payload: {
    total_budget: 215000,
    budget_rows: [
      { category: "Exterior / Curb Appeal", estimated_cost: 45000 },
      { category: "Common Areas", estimated_cost: 30000 },
      { category: "Unit Turns", estimated_cost: 120000 },
      { category: "Contingency", estimated_cost: 20000 },
    ],
  },
});
assert.equal(renovationTaxonomy.semantic_doc_role, "renovation_budget");
assert.equal(renovationTaxonomy.semantic_doc_display_label, "renovation_budget");

const currentMortgageTaxonomy = buildSupportDocTaxonomyState({
  declaredDocType: "mortgage_statement",
  detectedDocType: "mortgage_statement",
  originalFilename: "CurrentMortgage.pdf",
  rawText: [
    "Current Mortgage Statement",
    "Current outstanding principal balance: $2,100,000",
    "Monthly payment: $13,625",
    "Interest rate: 4.25%",
    "Amortization remaining: 23 years",
  ].join("\n"),
  payload: {
    outstanding_balance: 2100000,
    monthly_payment: 13625,
    interest_rate: 4.25,
    amort_years: 23,
  },
});
assert.equal(currentMortgageTaxonomy.semantic_doc_role, "current_mortgage_statement");
assert.equal(currentMortgageTaxonomy.semantic_doc_display_label, "current_mortgage_statement");

const acquisitionFinancingTaxonomy = buildSupportDocTaxonomyState({
  declaredDocType: "loan_term_sheet",
  detectedDocType: "loan_term_sheet",
  originalFilename: "AcquisitionFinancing.pdf",
  rawText: [
    "Indicative acquisition financing term sheet",
    "Borrower to be determined by Purchaser",
    "Loan amount at purchase price $3,500,000",
    "Proposed LTV 65%",
    "Not a financing commitment",
  ].join("\n"),
  payload: {
    purchase_price: 3500000,
    ltv: 65,
    interest_rate: 5.5,
    amortization_years: 25,
    derived_acquisition_loan_amount: 2275000,
  },
});
assert.equal(acquisitionFinancingTaxonomy.semantic_doc_role, "purchase_assumptions");
assert.notEqual(acquisitionFinancingTaxonomy.semantic_doc_role, "current_mortgage_statement");
assert.equal(acquisitionFinancingTaxonomy.semantic_doc_display_label, "purchase_assumptions");
const phaseIOverrideTaxonomy = buildSupportDocTaxonomyState({
  declaredDocType: "property_tax",
  detectedDocType: "property_tax",
  originalFilename: "124_Richmond_Phase_I_ESA.pdf",
  rawText: [
    "Phase I ESA",
    "Recognized Environmental Condition discussion",
    "Environmental site assessment summary.",
  ].join("\n"),
  payload: {},
});
assert.equal(phaseIOverrideTaxonomy.semantic_doc_role, "environmental_due_diligence");
assert.notEqual(phaseIOverrideTaxonomy.semantic_doc_role, "property_tax");

const zoningOverrideTaxonomy = buildSupportDocTaxonomyState({
  declaredDocType: "property_tax",
  detectedDocType: "property_tax",
  originalFilename: "Municipal_Zoning_Compliance_Letter.pdf",
  rawText: [
    "Municipal zoning compliance letter",
    "Permitted use confirmation",
  ].join("\n"),
  payload: {},
});
assert.equal(zoningOverrideTaxonomy.semantic_doc_role, "zoning_compliance_context");
assert.notEqual(zoningOverrideTaxonomy.semantic_doc_role, "property_tax");

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

assert.deepEqual(supportDocRecoveryTestHelpers.buildAppraisalResponseSchema().required, [
  "is_appraisal_support",
  "confidence",
  "appraised_value",
  "valuation_date",
  "cap_rate",
  "effective_gross_income",
  "noi",
  "value_basis",
  "appraisal_type",
  "evidence",
]);

console.log("supporting-doc-classification smoke PASS");
