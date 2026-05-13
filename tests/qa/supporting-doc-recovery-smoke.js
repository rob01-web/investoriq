import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test";

const { parseMortgageStatementFromText } = await import("../../api/parse/parse-doc.js");
const {
  buildAssumptionAttributionState,
  formatAssumptionAttributionLabel,
} = await import("../../api/_lib/report-surface-contracts.js");
const { __test__: reportTestHelpers } = await import("../../api/generate-client-report.js");
const {
  validateAcquisitionPurchaseAssumptionsCandidate,
  validateAppraisalCandidate,
  validateCurrentMortgageCandidate,
  validatePropertyTaxCandidate,
  validateRenovationCandidate,
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

const formatCurrency = (value) => `$${Number(value).toLocaleString("en-US")}`;

const renovationSourceText = [
  "Renovation Budget",
  "Exterior / Curb Appeal: $45,000",
  "Common Areas: $30,000",
  "Unit Turns: $120,000",
  "Contingency: $20,000",
  "Total Budget: $215,000",
  "Unit Count: 12",
  "Per Unit Cost: $17,500",
].join("\n");

const renovationCandidate = validateRenovationCandidate(
  {
    is_renovation_capex: true,
    confidence: 0.96,
    total_budget: 215000,
    budget_rows: [
      {
        category: "Exterior / Curb Appeal",
        estimated_cost: 45000,
        scope_of_work: "Exterior upgrades and curb appeal work",
        evidence: ["Exterior / Curb Appeal: $45,000"],
      },
      {
        category: "Common Areas",
        estimated_cost: 30000,
        scope_of_work: "Common area refresh",
        evidence: ["Common Areas: $30,000"],
      },
      {
        category: "Unit Turns",
        estimated_cost: 120000,
        scope_of_work: "Unit turns and make-ready",
        evidence: ["Unit Turns: $120,000"],
      },
      {
        category: "Contingency",
        estimated_cost: 20000,
        scope_of_work: "Project contingency",
        evidence: ["Contingency: $20,000"],
      },
    ],
    unit_count: 12,
    per_unit_cost: 17500,
    timing_or_phasing: null,
    rent_lift: null,
    roi: null,
    payback_period: null,
    evidence: {
      total_budget: ["Total Budget: $215,000"],
      budget_rows: ["Exterior / Curb Appeal: $45,000", "Common Areas: $30,000", "Unit Turns: $120,000", "Contingency: $20,000"],
      unit_count: ["Unit Count: 12"],
      per_unit_cost: ["Per Unit Cost: $17,500"],
      timing_or_phasing: [],
      rent_lift: [],
      roi: [],
      payback_period: [],
      warnings: [],
    },
  },
  renovationSourceText
);

assert.equal(renovationCandidate.method, "ai_support_doc_recovery_validated");
assert.equal(renovationCandidate.total_budget, 215000);
assert.equal(renovationCandidate.budget_rows.length, 4);
assert.equal(renovationCandidate.unit_count, 12);
assert.equal(renovationCandidate.per_unit_cost, 17500);
assert.equal(renovationCandidate.timing_or_phasing, null);
assert.equal(renovationCandidate.rent_lift, null);
assert.equal(renovationCandidate.roi, null);
assert.equal(renovationCandidate.payback_period, null);
assert.equal(renovationCandidate.execution_rows.length, 2);
assert.equal(reportTestHelpers.buildRenovationBudgetRows(renovationCandidate.budget_rows, formatCurrency).includes("Exterior / Curb Appeal"), true);
assert.equal(reportTestHelpers.buildRenovationExecutionRows(renovationCandidate.execution_rows, formatCurrency).includes("Unit Count"), true);

const renovationExecutionHtml = reportTestHelpers.buildRenovationExecutionRows(
  [
    { metric: "Unit Count", metric_kind: "unit_count", value: 40 },
    { metric: "Unit Count", metric_kind: "unit_count", value: 40 },
    { metric: "Per Unit Cost", metric_kind: "per_unit_cost", value: 17500 },
    { metric: "Total Budget", metric_kind: "total_budget", value: 215000 },
    { metric: "Budget Share", metric_kind: "percent_of_budget", value: 0.25 },
  ],
  formatCurrency
);
assert.equal((renovationExecutionHtml.match(/Unit Count/g) || []).length, 1);
assert.equal(renovationExecutionHtml.includes("$40"), false);
assert.equal(renovationExecutionHtml.includes("$17,500"), true);
assert.equal(renovationExecutionHtml.includes("$215,000"), true);
assert.equal(renovationExecutionHtml.includes("25.0%"), true);

assert.equal(buildAssumptionAttributionState({ sourceProvided: true }).attribution, "document_derived");
assert.equal(formatAssumptionAttributionLabel(buildAssumptionAttributionState({ sourceProvided: true }).attribution), "document-derived");
assert.equal(buildAssumptionAttributionState({ userProvided: true }).attribution, "user_provided");
assert.equal(buildAssumptionAttributionState({ frameworkProvided: true }).attribution, "standardized_framework");
assert.equal(formatAssumptionAttributionLabel(buildAssumptionAttributionState({ frameworkProvided: true }).attribution), "standardized framework assumption");
assert.equal(buildAssumptionAttributionState({}).attribution, "unavailable");

const renovationPartialCandidate = validateRenovationCandidate(
  {
    is_renovation_capex: true,
    confidence: 0.95,
    total_budget: 215000,
    budget_rows: renovationCandidate.budget_rows,
    unit_count: null,
    per_unit_cost: null,
    timing_or_phasing: null,
    rent_lift: null,
    roi: null,
    payback_period: null,
    evidence: {
      total_budget: ["Total Budget: $215,000"],
      budget_rows: ["Exterior / Curb Appeal: $45,000", "Common Areas: $30,000", "Unit Turns: $120,000", "Contingency: $20,000"],
      unit_count: [],
      per_unit_cost: [],
      timing_or_phasing: [],
      rent_lift: [],
      roi: [],
      payback_period: [],
      warnings: [],
    },
  },
  renovationSourceText
);

assert.equal(renovationPartialCandidate.total_budget, 215000);
assert.equal(renovationPartialCandidate.timing_or_phasing, null);
assert.equal(renovationPartialCandidate.rent_lift, null);
assert.equal(renovationPartialCandidate.roi, null);
assert.equal(renovationPartialCandidate.payback_period, null);
assert.equal(renovationPartialCandidate.execution_rows.length, 0);
assert.equal(reportTestHelpers.buildRenovationExecutionRows(renovationPartialCandidate.execution_rows, formatCurrency), "");

assert.equal(
  validateRenovationCandidate(
    {
      is_renovation_capex: true,
      confidence: 0.95,
      total_budget: null,
      budget_rows: [],
      unit_count: null,
      per_unit_cost: null,
      timing_or_phasing: null,
      rent_lift: null,
      roi: null,
      payback_period: null,
      evidence: {
        total_budget: [],
        budget_rows: [],
        unit_count: [],
        per_unit_cost: [],
        timing_or_phasing: [],
        rent_lift: [],
        roi: [],
        payback_period: [],
        warnings: [],
      },
    },
    "Renovation budget source without structured figures."
  ),
  null
);

const propertyTaxSourceText = [
  "Property Tax Notice",
  "Annual Tax 2025 $42,300",
  "Tax Year 2025",
  "Assessment Roll 1234-567",
  "Assessed Value $12,500,000",
].join("\n");

const propertyTaxCandidate = validatePropertyTaxCandidate(
  {
    is_property_tax: true,
    confidence: 0.95,
    annual_tax: 42300,
    tax_year: "2025",
    assessed_value: 12500000,
    roll_number: "1234-567",
    evidence: {
      annual_tax: ["Annual Tax 2025 $42,300"],
      tax_year: ["Tax Year 2025"],
      assessed_value: ["Assessed Value $12,500,000"],
      roll_number: ["Assessment Roll 1234-567"],
      warnings: [],
    },
  },
  propertyTaxSourceText
);

assert.equal(propertyTaxCandidate.method, "ai_support_doc_recovery_validated");
assert.equal(propertyTaxCandidate.annual_tax, 42300);
assert.equal(propertyTaxCandidate.tax_year, "2025");
assert.equal(propertyTaxCandidate.assessed_value, 12500000);
assert.equal(propertyTaxCandidate.roll_number, "1234-567");

const appraisalSourceText = [
  "Appraisal Report",
  "As-Is Value: $12,500,000",
  "Valuation Date: 2025-03-31",
  "Cap Rate: 4.99%",
  "Effective Gross Income: $1,250,000",
  "NOI: $625,000",
  "Value Basis: as-is",
  "Appraisal Type: full appraisal",
].join("\n");

const appraisalCandidate = validateAppraisalCandidate(
  {
    is_appraisal_support: true,
    confidence: 0.95,
    appraised_value: 12500000,
    valuation_date: "2025-03-31",
    cap_rate: 4.99,
    effective_gross_income: 1250000,
    noi: 625000,
    value_basis: "as-is",
    appraisal_type: "full appraisal",
    evidence: {
      appraised_value: ["As-Is Value: $12,500,000"],
      valuation_date: ["Valuation Date: 2025-03-31"],
      cap_rate: ["Cap Rate: 4.99%"],
      effective_gross_income: ["Effective Gross Income: $1,250,000"],
      noi: ["NOI: $625,000"],
      value_basis: ["Value Basis: as-is"],
      appraisal_type: ["Appraisal Type: full appraisal"],
      warnings: [],
    },
  },
  appraisalSourceText
);

assert.equal(appraisalCandidate.method, "ai_support_doc_recovery_validated");
assert.equal(appraisalCandidate.appraised_value, 12500000);
assert.equal(appraisalCandidate.valuation_date, "2025-03-31");
assert.equal(appraisalCandidate.cap_rate, 4.99);
assert.equal(appraisalCandidate.effective_gross_income, 1250000);
assert.equal(appraisalCandidate.noi, 625000);
assert.equal(appraisalCandidate.value_basis, "as_is");
assert.equal(appraisalCandidate.appraisal_type, "full appraisal");

assert.equal(
  validateAppraisalCandidate(
    {
      is_appraisal_support: true,
      confidence: 0.95,
      appraised_value: 34500000,
      valuation_date: null,
      cap_rate: 4.99,
      effective_gross_income: null,
      noi: null,
      value_basis: "as-is",
      appraisal_type: null,
      evidence: {
        appraised_value: ["Purchase Price: $34,500,000"],
        valuation_date: [],
        cap_rate: ["Going-in Cap Rate: 4.99%"],
        effective_gross_income: [],
        noi: [],
        value_basis: ["Value Basis: as-is"],
        appraisal_type: [],
        warnings: [],
      },
    },
    "Purchase assumptions with acquisition financing signals."
  ),
  null
);

assert.equal(
  validateAppraisalCandidate(
    {
      is_appraisal_support: true,
      confidence: 0.95,
      appraised_value: 12500000,
      valuation_date: null,
      cap_rate: 4.99,
      effective_gross_income: null,
      noi: null,
      value_basis: "broker_opinion",
      appraisal_type: null,
      evidence: {
        appraised_value: ["Broker opinion of value: $12,500,000"],
        valuation_date: [],
        cap_rate: ["Cap Rate: 4.99%"],
        effective_gross_income: [],
        noi: [],
        value_basis: ["Broker opinion of value: $12,500,000"],
        appraisal_type: [],
        warnings: [],
      },
    },
    "Broker opinion and market survey only."
  ),
  null
);

assert.equal(
  validatePropertyTaxCandidate(
    {
      is_property_tax: true,
      confidence: 0.95,
      annual_tax: 2025,
      tax_year: "2025",
      assessed_value: null,
      roll_number: null,
      evidence: {
        annual_tax: ["Annual Tax 2025"],
        tax_year: ["Tax Year 2025"],
        assessed_value: [],
        roll_number: [],
        warnings: [],
      },
    },
    "Property tax notice with year-like tax value."
  ),
  null
);

assert.equal(
  validatePropertyTaxCandidate(
    {
      is_property_tax: true,
      confidence: 0.95,
      annual_tax: null,
      tax_year: "2025",
      assessed_value: 12500000,
      roll_number: "1234-567",
      evidence: {
        annual_tax: [],
        tax_year: ["Tax Year 2025"],
        assessed_value: ["Assessed Value $12,500,000"],
        roll_number: ["Assessment Roll 1234-567"],
        warnings: [],
      },
    },
    "Property tax notice without annual tax."
  ),
  null
);

assert.equal(
  validatePropertyTaxCandidate(
    {
      is_property_tax: true,
      confidence: 0.95,
      annual_tax: null,
      tax_year: "2025",
      assessed_value: 12500000,
      roll_number: "1234-567",
      evidence: {
        annual_tax: [],
        tax_year: ["Tax Year 2025"],
        assessed_value: ["Assessed Value $12,500,000"],
        roll_number: ["Assessment Roll 1234-567"],
        warnings: [],
      },
    },
    "Assessment excerpt"
  ),
  null
);

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
