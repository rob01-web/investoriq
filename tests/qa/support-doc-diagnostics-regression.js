import assert from "node:assert/strict";

const { __test__ } = await import("../../lib/ai-support-doc-recovery.js");

const acquisitionSource = [
  "Purchase price is $1,200,000.",
  "Target LTV is 70%.",
  "Interest rate is 5.25%.",
  "Going-in cap rate is 6.10%.",
  "Closing costs are 2.0%.",
].join("\n");

const acquisitionCandidate = {
  is_acquisition_purchase_assumptions: true,
  confidence: 0.93,
  purchase_price: 1200000,
  ltv: 70,
  interest_rate: 5.25,
  amortization_years: null,
  going_in_cap_rate: 6.1,
  closing_costs_percent: 2,
  evidence: {
    purchase_price: ["Purchase price is $1,200,000."],
    ltv: ["Target LTV is 70%."],
    interest_rate: ["Interest rate is 5.25%."],
    amortization_years: [],
    going_in_cap_rate: ["Going-in cap rate is 6.10%."],
    closing_costs_percent: ["Closing costs are 2.0%."],
    warnings: [],
  },
};
const acquisition = __test__.validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics(
  acquisitionCandidate,
  acquisitionSource
);
assert.ok(acquisition.payload, "acquisition candidate should be accepted");
assert.equal(acquisition.payload.derived_acquisition_loan_amount, 840000);
assert.equal(acquisition.diagnostics.derived_fields.includes("derived_acquisition_loan_amount_allowed"), true);

const currentDebtSource = "Current mortgage statement is attached.";
const currentDebtCandidate = {
  is_current_mortgage: true,
  confidence: 0.94,
  outstanding_balance: 950000,
  monthly_payment: 6200,
  annual_debt_service: null,
  interest_rate: 4.9,
  amortization_years: 25,
  maturity_date: "2030-06-01",
  lender_name: "Major Lender",
  evidence: {
    outstanding_balance: ["Outstanding balance: $950,000"],
    monthly_payment: ["Monthly payment: $6,200"],
    annual_debt_service: [],
    interest_rate: ["Interest rate: 4.9%"],
    amortization_years: ["Amortization: 25 years"],
    maturity_date: ["Maturity: 2030-06-01"],
    lender_name: ["Lender: Major Lender"],
    warnings: [],
  },
};
const currentDebt = __test__.validateCurrentMortgageCandidateWithDiagnostics(currentDebtCandidate, currentDebtSource);
assert.equal(currentDebt.payload, null);
assert.equal(currentDebt.diagnostics.validation_reasons.includes("no_accepted_current_debt_fields"), true);

const propertyTaxSource = "Annual tax reference shown as 2024 in the municipality portal.";
const propertyTaxCandidate = {
  is_property_tax: true,
  confidence: 0.91,
  annual_tax: 2024,
  tax_year: "2024",
  assessed_value: null,
  roll_number: null,
  evidence: {
    annual_tax: ["Annual tax reference shown as 2024 in the municipality portal."],
    tax_year: ["2024"],
    assessed_value: [],
    roll_number: [],
    warnings: [],
  },
};
const propertyTax = __test__.validatePropertyTaxCandidateWithDiagnostics(propertyTaxCandidate, propertyTaxSource);
assert.equal(propertyTax.payload, null);
assert.equal(propertyTax.diagnostics.validation_reasons.includes("annual_tax_looks_like_year"), true);

const appraisalSource = "Broker opinion summary references neighborhood trends only.";
const appraisalCandidate = {
  is_appraisal_support: true,
  confidence: 0.92,
  appraised_value: 1800000,
  valuation_date: null,
  cap_rate: null,
  effective_gross_income: null,
  noi: null,
  value_basis: null,
  appraisal_type: null,
  evidence: {
    appraised_value: ["Broker opinion summary references neighborhood trends only."],
    valuation_date: [],
    cap_rate: [],
    effective_gross_income: [],
    noi: [],
    value_basis: [],
    appraisal_type: [],
    warnings: [],
  },
};
const appraisal = __test__.validateAppraisalCandidateWithDiagnostics(appraisalCandidate, appraisalSource);
assert.equal(appraisal.payload, null);
assert.equal(appraisal.diagnostics.validation_reasons.includes("no_accepted_appraisal_fields"), true);

const renovationSource = [
  "Scope line A: 5 units at $10000 per unit.",
  "Total forward-looking renovation budget: $50000.",
].join("\n");
const renovationBase = {
  is_renovation_capex: true,
  confidence: 0.93,
  total_budget: 50000,
  unit_count: null,
  per_unit_cost: null,
  timing_or_phasing: null,
  rent_lift: null,
  roi: null,
  payback_period: null,
  evidence: {
    total_budget: ["Total forward-looking renovation budget: $50000."],
    budget_rows: [],
    unit_count: [],
    per_unit_cost: [],
    timing_or_phasing: [],
    rent_lift: [],
    roi: [],
    payback_period: [],
    warnings: [],
  },
};
const renovationMissingRow = __test__.validateRenovationCandidateWithDiagnostics(
  { ...renovationBase, budget_rows: [null] },
  renovationSource
);
assert.equal(
  renovationMissingRow.diagnostics.row_diagnostics.some((d) => d.reason_codes.includes("missing_budget_row")),
  true
);
const renovationMissingCategory = __test__.validateRenovationCandidateWithDiagnostics(
  {
    ...renovationBase,
    budget_rows: [{ unit_count: 5, cost_per_unit: 10000, estimated_cost: null, evidence: ["Scope line A: 5 units at $10000 per unit."] }],
  },
  renovationSource
);
assert.equal(
  renovationMissingCategory.diagnostics.row_diagnostics.some((d) =>
    d.reason_codes.includes("missing_budget_row_category_or_scope")
  ),
  true
);
const renovationMissingDerivationInputs = __test__.validateRenovationCandidateWithDiagnostics(
  {
    ...renovationBase,
    budget_rows: [{ category: "Interior", scope_of_work: "Scope line A", estimated_cost: null, evidence: ["Scope line A: 5 units at $10000 per unit."] }],
  },
  renovationSource
);
assert.equal(
  renovationMissingDerivationInputs.diagnostics.row_diagnostics.some((d) =>
    d.reason_codes.includes("row_cost_derivation_inputs_missing")
  ),
  true
);

console.log("support-doc diagnostics regression PASS");
