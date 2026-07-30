import assert from "node:assert/strict";

import { buildSupportDocTaxonomyState, resolveCanonicalSupportDocAuthority } from "../../api/_lib/support-doc-taxonomy.js";

function canonicalize(input) {
  return resolveCanonicalSupportDocAuthority(input);
}

const explicitCurrentDebtText = [
  "Existing Current Debt Statement",
  "Current Outstanding Balance $6,800,000",
  "Interest Rate 4.85%",
  "Amortization Remaining 24 years",
  "Monthly Payment $39,250",
  "Maturity Date 2029-11-01",
].join("\n");

const parsedCurrentDebtText = [
  "Monthly payment $13,625.",
  "Maturity date 2028-06-01.",
  "This is a support file.",
].join(" ");

const unclassifiedSupportText = "General support note retained for auditability only.";

const explicitCurrentDebtInput = {
  declaredDocType: "supporting_documents",
  originalFilename: "Current_Debt_Stonebridge.pdf",
  rawText: explicitCurrentDebtText,
  payload: {
    outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_years: 24,
    monthly_payment: 39250,
  },
};

const parsedCurrentDebtInput = {
  declaredDocType: "supporting_documents",
  originalFilename: "Generic_Mortgage_Payload.pdf",
  rawText: parsedCurrentDebtText,
  payload: {
    semantic_doc_role: "mortgage_statement",
  },
};

const explicitAiHint = {
  confidence: 0.95,
  semantic_doc_role: "appraisal_context",
  semantic_doc_display_label: "Appraisal Context",
  treatment: "Context only",
  use: "Listed for auditability only; not used quantitatively.",
};

const currentDebtWithAi = canonicalize({
  ...explicitCurrentDebtInput,
  aiRecoveryHints: explicitAiHint,
});
const currentDebtWithoutAi = canonicalize(explicitCurrentDebtInput);
assert.deepEqual(currentDebtWithAi, currentDebtWithoutAi);
assert.equal(currentDebtWithAi.role, "current_debt_context");
assert.equal(currentDebtWithAi.authoritySource, "explicit_keyword");

const parsedCurrentDebtWithAi = canonicalize({
  ...parsedCurrentDebtInput,
  aiRecoveryHints: explicitAiHint,
});
const parsedCurrentDebtWithoutAi = canonicalize(parsedCurrentDebtInput);
assert.deepEqual(parsedCurrentDebtWithAi, parsedCurrentDebtWithoutAi);
assert.equal(parsedCurrentDebtWithAi.role, "current_debt_context");
assert.equal(parsedCurrentDebtWithAi.authoritySource, "semantic_parse");

const unclassifiedWithAi = canonicalize({
  declaredDocType: "supporting_documents",
  originalFilename: "Generic_Support.pdf",
  rawText: unclassifiedSupportText,
  payload: {},
  aiRecoveryHints: explicitAiHint,
});
assert.equal(unclassifiedWithAi.role, "other_support");
assert.equal(unclassifiedWithAi.authoritySource, "fallback");

const deterministicCases = [
  {
    name: "structured_renovation",
    input: {
      declaredDocType: "supporting_documents",
      originalFilename: "Stonebridge_Reno_Plan.pdf",
      rawText: [
        "Structured Renovation / CapEx Plan",
        "Total Renovation Budget $1,280,000",
        "1BR scope 18 units at $18,000/unit with expected monthly rent lift $225",
        "2BR scope 22 units at $22,000/unit with expected monthly rent lift $325",
        "Phasing Months 1-24",
      ].join("\n"),
      payload: {
        total_budget: 1280000,
        budget_rows: [
          { category: "1BR", total_cost: 324000, expected_monthly_rent_lift: 225 },
        ],
        execution_rows: [
          { phase_timing: "Months 1-18", expected_monthly_rent_lift: 225 },
        ],
      },
    },
  },
  {
    name: "historical_capex_only",
    input: {
      declaredDocType: "supporting_documents",
      originalFilename: "Historical_CapEx.pdf",
      rawText: "Historical CapEx Summary. Completed capital improvements and prior work from 2022 to 2025. Total renovation budget $800,000.",
      payload: {
        total_budget: 800000,
        notes: "historical work only",
      },
    },
  },
  {
    name: "appraisal_context",
    input: {
      declaredDocType: "supporting_documents",
      originalFilename: "Appraisal_Summary.pdf",
      rawText: "Appraisal Summary / Valuation Context. Appraised Value $14,200,000. NOI Basis $945,000.",
      payload: {
        appraised_value: 14200000,
        cap_rate: 0.065,
      },
    },
  },
  {
    name: "market_survey",
    input: {
      declaredDocType: "supporting_documents",
      originalFilename: "Market_Survey.pdf",
      rawText: "Market Rent Survey Context. Rent comparables support market context only.",
      payload: {},
    },
  },
  {
    name: "purchase_assumptions",
    input: {
      declaredDocType: "supporting_documents",
      originalFilename: "Stonebridge_Assumptions.pdf",
      rawText: [
        "Purchase Assumptions / Proposed Acquisition Financing",
        "Purchase Price $13,500,000",
        "NOI Basis $945,000",
        "Going-In Cap Rate 7.00%",
        "Proposed Loan Amount $9,450,000",
        "LTV 70%",
        "Interest Rate 5.95%",
        "Amortization 30 years",
        "Lender Fee 0.85%",
      ].join("\n"),
      payload: {
        purchase_price: 13500000,
        going_in_cap_rate: 0.07,
        noi_basis: 945000,
        proposed_loan_amount: 9450000,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
      },
    },
  },
  {
    name: "generic_support",
    input: {
      declaredDocType: "supporting_documents",
      originalFilename: "Generic_Support.pdf",
      rawText: unclassifiedSupportText,
      payload: {},
    },
  },
];

for (const testCase of deterministicCases) {
  const first = canonicalize(testCase.input);
  const second = canonicalize(testCase.input);
  const third = canonicalize(testCase.input);
  assert.deepEqual(second, first, testCase.name);
  assert.deepEqual(third, first, testCase.name);
}

const longTailCases = [
  { name: "insurance", input: { declaredDocType: "supporting_documents", originalFilename: "insurance.pdf", rawText: "General support note retained for source auditability only.", payload: {} } },
  { name: "bank_statement", input: { declaredDocType: "supporting_documents", originalFilename: "bank_statement.pdf", rawText: "General support note retained for source auditability only.", payload: {} } },
  { name: "lease", input: { declaredDocType: "supporting_documents", originalFilename: "lease.pdf", rawText: "General support note retained for source auditability only.", payload: {} } },
  { name: "title_legal", input: { declaredDocType: "supporting_documents", originalFilename: "title_legal.pdf", rawText: "General support note retained for source auditability only.", payload: {} } },
  { name: "generic_support", input: { declaredDocType: "supporting_documents", originalFilename: "supporting_documents.pdf", rawText: "General support note retained for source auditability only.", payload: {} } },
];

for (const testCase of longTailCases) {
  const result = canonicalize(testCase.input);
  assert.equal(result.role, "other_support", testCase.name);
  assert.equal(result.authoritySource, "fallback", testCase.name);
  assert.equal(result.category, "Listed but Not Quantitatively Modeled", testCase.name);
}

const supportDocTaxonomyState = buildSupportDocTaxonomyState({
  declaredDocType: "supporting_documents",
  originalFilename: "Generic_Mortgage_Payload.pdf",
  rawText: parsedCurrentDebtText,
  payload: {
    semantic_doc_role: "mortgage_statement",
  },
});
assert.equal(supportDocTaxonomyState.semantic_doc_role, "current_mortgage_statement");
assert.equal(supportDocTaxonomyState.semantic_doc_role_confidence, 0.88);

console.log("h7-support-taxonomy-contract smoke PASS");
