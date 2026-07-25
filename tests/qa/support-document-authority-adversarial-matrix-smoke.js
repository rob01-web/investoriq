import assert from "assert";

import { adjudicateSupportDocumentAuthority } from "../../api/_lib/support-document-authority-adjudicator.js";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";
import { buildCanonicalDebtServiceInputContract } from "../../api/_lib/debt-service-input-contract.js";

const completeAcquisition = [
  "Purchase Assumptions / Proposed Acquisition Financing",
  "Purchase Price $13,500,000",
  "NOI Basis $945,000",
  "Going-In Cap Rate 7.00%",
  "Proposed Loan Amount $9,450,000",
  "LTV 70%",
  "Interest Rate 5.95%",
  "Rate Structure Fixed",
  "Amortization 30 years",
  "Loan Term 5 years",
  "Maturity Date 2031-07-15",
  "Lender Fee 0.85%",
  "Closing Costs 2.00%",
].join("\n");

const completeCurrentDebt = [
  "Existing Current Debt Statement",
  "Current Outstanding Balance $6,800,000",
  "Interest Rate 4.85%",
  "Rate Structure Fixed",
  "Amortization Remaining 24 years",
  "Monthly Payment $39,250",
  "Maturity Date 2029-11-01",
].join("\n");

function decision(name, sourceText, { filename = `${name}.pdf`, parserType = "document_text_extracted", parserRole = null } = {}) {
  const fileId = `file-${name}`;
  const artifacts = [{
    id: `artifact-${name}`,
    type: "document_text_extracted",
    payload: { file_id: fileId, original_filename: filename, text: sourceText },
  }];
  if (parserType !== "document_text_extracted" || parserRole) {
    artifacts.push({
      id: `parser-${name}`,
      type: parserType,
      payload: { file_id: fileId, original_filename: filename, semantic_doc_role: parserRole },
    });
  }
  return adjudicateSupportDocumentAuthority({ file: { file_id: fileId, original_filename: filename }, artifacts });
}

function decisionWithParsedPayload(name, sourceText, parserType, parserPayload) {
  const fileId = `file-${name}`;
  return adjudicateSupportDocumentAuthority({
    file: { file_id: fileId, original_filename: `${name}.pdf` },
    artifacts: [
      {
        id: `text-${name}`,
        type: "document_text_extracted",
        payload: { file_id: fileId, original_filename: `${name}.pdf`, text: sourceText },
      },
      {
        id: `parsed-${name}`,
        type: parserType,
        payload: { file_id: fileId, original_filename: `${name}.pdf`, ...parserPayload },
      },
    ],
  });
}

function decisionWithParsedPayloads(name, sourceText, parserType, parserPayloads) {
  const fileId = `file-${name}`;
  return adjudicateSupportDocumentAuthority({
    file: { file_id: fileId, original_filename: `${name}.pdf` },
    artifacts: [
      {
        id: `text-${name}`,
        type: "document_text_extracted",
        payload: { file_id: fileId, original_filename: `${name}.pdf`, text: sourceText },
      },
      ...parserPayloads.map((parserPayload, index) => ({
        id: `parsed-${name}-${index + 1}`,
        type: parserType,
        payload: { file_id: fileId, original_filename: `${name}.pdf`, ...parserPayload },
      })),
    ],
  });
}

const scenarios = [
  {
    name: "affirmative_acquisition_financing_complete",
    result: decision("affirmative-acquisition", completeAcquisition),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "affirmative_current_debt_complete",
    result: decision("affirmative-current", completeCurrentDebt),
    role: "current_debt_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "negated_acquisition_reference",
    result: decision("negated-acquisition", "Document note: this is not proposed acquisition financing and does not contain purchase assumptions."),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "negated_current_debt_reference",
    result: decision("negated-current", "Document note: this is not current debt and does not contain a current mortgage statement."),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "appraisal_references_purchase_price",
    result: decision("appraisal-reference", "Appraisal Summary / Valuation Context\nAppraised Value $14,200,000\nPurchase Price $13,500,000 is shown only as a transaction reference."),
    role: "appraisal_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "current_debt_references_proposed_financing",
    result: decision("current-reference", `${completeCurrentDebt}\nKeep separate from proposed acquisition financing.`),
    role: "current_debt_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "discharged_historical_debt",
    result: decision("historical-debt", "Discharged Mortgage / Historical Debt\nFormer mortgage balance $4,200,000. Paid off in full."),
    role: "historical_debt_context", roleAccepted: true, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "illustrative_non_binding_financing",
    result: decision("illustrative-financing", `${completeAcquisition}\nIllustrative and non-binding; not a loan commitment.`),
    role: "purchase_assumptions", roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "incomplete_financing_bundle",
    result: decision("incomplete-financing", "Purchase Assumptions / Proposed Acquisition Financing\nPurchase Price $13,500,000"),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "mixed_current_and_proposed_debt",
    result: decision("mixed-financing", `${completeAcquisition}\n${completeCurrentDebt}`),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "filename_text_disagreement",
    result: decision("filename-disagreement", completeAcquisition, { filename: "Current_Debt.pdf" }),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "artifact_type_text_disagreement",
    result: decision("artifact-disagreement", completeAcquisition, { parserType: "appraisal_parsed", parserRole: "appraisal" }),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "ocr_split_labels_and_punctuation_loss",
    result: decision("ocr-split", completeAcquisition.replace("Purchase Price", "Purchase\nPrice").replace("Proposed Loan Amount", "Proposed\nLoan Amount").replace("LTV", "L . T . V")),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "missing_not_ocr_creates_mixed_evidence",
    result: decision("ocr-missing-not", `${completeAcquisition}\nExisting Current Debt Statement\nCurrent Outstanding Balance $6,800,000\nMonthly Payment $39,250\nMaturity Date 2029-11-01`),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "handwritten_or_stamped_superseded_overlay",
    result: decision("stamped-overlay", `${completeAcquisition}\nSTAMP: SUPERSEDED`),
    role: "purchase_assumptions", roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "environmental_reference_does_not_cross_promote",
    result: decision("environmental-reference", "Phase I ESA / Environmental Due Diligence\nNo recognized environmental condition. Purchase price is referenced only for file identification."),
    role: "environmental_context", roleAccepted: true, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "market_survey_references_appraisal_and_financing",
    result: decision("market-reference", "Market Rent Survey\nRent comparables support market context. Appraised value and purchase price appear only in the transaction notes."),
    role: "market_survey_context", roleAccepted: true, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "renovation_references_debt_and_market_rent",
    result: decision("renovation-reference", "Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000\nCurrent mortgage and market rent are referenced only as constraints."),
    role: "renovation_capex_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "property_condition_capital_bundle",
    result: decision("property-condition", "Property Condition Assessment / Capital Needs Assessment\nTotal Capital Plan $1,200,000\nCapital Reserve Balance $350,000\nDeferred Maintenance Identified $180,000"),
    role: "property_condition_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "property_condition_text_overrides_appraisal_candidate",
    result: decision("property-condition-parser", "Property Condition Assessment\nTotal Capital Plan $1,200,000", { parserType: "appraisal_parsed", parserRole: "appraisal" }),
    role: "property_condition_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "negated_property_condition_reference",
    result: decision("negated-property-condition", "This is not a property condition assessment and no capital needs assessment was performed."),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "historical_capital_does_not_become_forward_plan",
    result: decision("historical-capital", "Historical CapEx Summary\nCompleted capital improvements and completed repairs from 2022 to 2025.\nTotal Renovation Budget $800,000"),
    role: "historical_capital_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "property_tax_support_bundle",
    result: decision("property-tax", "Property Tax Bill\nAnnual Tax $185,000\nAssessment roll 2026."),
    role: "property_tax_support", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "rotated_reading_order_with_labels_preserved",
    result: decision("rotated-order", completeAcquisition.split("\n").reverse().join("\n")),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "appraisal_text_overrides_purchase_parser_candidate",
    result: decision("appraisal-parser-disagreement", "Appraisal Report\nAppraised Value $14,200,000", { parserType: "loan_term_sheet_parsed", parserRole: "purchase_assumptions" }),
    role: "appraisal_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "optional_support_unreadable",
    result: adjudicateSupportDocumentAuthority({ file: { file_id: "unreadable-file", original_filename: "Unreadable.pdf" }, artifacts: [] }),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
];

for (const scenario of scenarios) {
  assert.equal(scenario.result.canonicalRole, scenario.role, `${scenario.name}: canonical role`);
  assert.equal(scenario.result.roleAccepted, scenario.roleAccepted, `${scenario.name}: role accepted`);
  assert.equal(scenario.result.sourcePresent, scenario.sourcePresent, `${scenario.name}: source present`);
  assert.equal(scenario.result.sourceBacked, scenario.sourceBacked, `${scenario.name}: source backed`);
  assert.equal(scenario.result.ambiguity.present, scenario.ambiguity, `${scenario.name}: ambiguity`);
}
assert.equal(
  scenarios.find((scenario) => scenario.name === "affirmative_current_debt_complete")?.result?.acceptedFacts?.monthly_payment,
  39250,
  "magnitude suffix detection must not consume the M in the following Maturity label"
);
const acquisitionDecision = scenarios.find((scenario) => scenario.name === "affirmative_acquisition_financing_complete")?.result;
assert.equal(acquisitionDecision?.acceptedFacts?.rate_structure, "fixed");
assert.equal(acquisitionDecision?.acceptedFacts?.loan_term_years, 5);
assert.equal(acquisitionDecision?.acceptedFacts?.maturity_date, "2031-07-15");
assert.equal(acquisitionDecision?.acceptedReturnInputFacts?.closing_costs_percent, 0.02);
assert.equal(acquisitionDecision?.returnInputSourceBacked, true);
assert.equal(acquisitionDecision?.acceptedFactEvidence?.rate_structure?.normalizedValue, "fixed");
assert.equal(
  acquisitionDecision?.acceptedReturnInputFactEvidence?.closing_costs_percent?.normalizedValue,
  0.02
);
assert.match(acquisitionDecision?.acceptedFactEvidence?.rate_structure?.excerpt || "", /fixed/i);

const floatingDecision = decision(
  "floating-rate",
  completeAcquisition.replace("Rate Structure Fixed", "Interest Rate Type: Variable")
);
assert.equal(floatingDecision.acceptedFacts.rate_structure, "floating");
assert.equal(floatingDecision.acceptedFactEvidence.rate_structure.normalizedValue, "floating");

const commonFixedWordingDecision = decision(
  "fixed-interest-rate",
  completeAcquisition.replace("Rate Structure Fixed", "Fixed Interest Rate")
);
assert.equal(commonFixedWordingDecision.acceptedFacts.rate_structure, "fixed");

const commonFloatingWordingDecision = decision(
  "rate-is-floating",
  completeAcquisition.replace("Rate Structure Fixed", "Interest Rate is Floating")
);
assert.equal(commonFloatingWordingDecision.acceptedFacts.rate_structure, "floating");

const hybridDecision = decision(
  "hybrid-rate",
  completeAcquisition.replace("Rate Structure Fixed", "Fixed Rate for 24 months, then floating rate")
);
assert.equal(hybridDecision.acceptedFacts.rate_structure, "hybrid");

const conflictingRateDecision = decision(
  "conflicting-rate",
  completeAcquisition.replace("Rate Structure Fixed", "Fixed Rate\nVariable Rate")
);
assert.equal(conflictingRateDecision.roleAccepted, true);
assert.equal(conflictingRateDecision.acceptedFacts.rate_structure, undefined);
assert.equal(
  conflictingRateDecision.factAmbiguities.rate_structure.reason,
  "conflicting_fixed_and_floating_rate_language"
);

const amortizationOnlyDecision = decision(
  "amortization-not-term",
  completeAcquisition.replace("Loan Term 5 years\n", "")
);
assert.equal(amortizationOnlyDecision.acceptedFacts.amortization_years, 30);
assert.equal(amortizationOnlyDecision.acceptedFacts.loan_term_years, undefined);

const filenameOnlyRateDecision = decision(
  "filename-rate",
  completeAcquisition.replace("Rate Structure Fixed\n", ""),
  { filename: "Fixed_Rate_Terms.pdf" }
);
assert.equal(filenameOnlyRateDecision.acceptedFacts.rate_structure, undefined);

const negatedFixedDecision = decision(
  "negated-fixed-rate",
  completeAcquisition.replace("Rate Structure Fixed", "Rate Structure: not fixed\nVariable Rate")
);
assert.equal(negatedFixedDecision.acceptedFacts.rate_structure, "floating");

const exactMarketDecision = decision(
  "exact-market-ranges",
  "Market Rent Survey\n1BR $2,100-$2,250\n2BR $2,500 to $2,700"
);
assert.deepEqual(exactMarketDecision.acceptedFacts.market_rent_ranges, [
  { unit_type: "1BR", low_monthly_rent: 2100, high_monthly_rent: 2250 },
  { unit_type: "2BR", low_monthly_rent: 2500, high_monthly_rent: 2700 },
]);
assert.equal(exactMarketDecision.sectionEligibility.marketSurvey, true);

const flattenedTableMarketDecision = decision(
  "flattened-table-market-ranges",
  [
    "Market Rent Survey",
    "Field Source Value",
    "1BR Market Rent Range $2,100 $2,250",
    "2BR Market Rent Range $2,500 $2,700",
    "Context only; not a modeled rent-roll override.",
  ].join("\n"),
);
assert.deepEqual(flattenedTableMarketDecision.acceptedFacts.market_rent_ranges, [
  { unit_type: "1BR", low_monthly_rent: 2100, high_monthly_rent: 2250 },
  { unit_type: "2BR", low_monthly_rent: 2500, high_monthly_rent: 2700 },
]);
assert.equal(flattenedTableMarketDecision.sectionEligibility.marketSurvey, true);
assert.equal(
  flattenedTableMarketDecision.acceptedFactEvidence.market_rent_ranges.every(
    (evidence) => evidence.method === "deterministic_labeled_market_range_table_binding",
  ),
  true,
);

const unlabeledAdjacentMarketAmounts = decision(
  "unlabeled-adjacent-market-amounts",
  "Market Rent Survey\n1BR Asking Rents $2,100 $2,250",
);
assert.equal(unlabeledAdjacentMarketAmounts.acceptedFacts.market_rent_ranges, undefined);
assert.equal(unlabeledAdjacentMarketAmounts.sectionEligibility.marketSurvey, false);

const conflictingMarketDecision = decision(
  "conflicting-market-ranges",
  "Market Rent Survey\n1BR $2,100-$2,250\n1BR $2,300-$2,450"
);
assert.equal(conflictingMarketDecision.acceptedFacts.market_rent_ranges, undefined);
assert.equal(conflictingMarketDecision.sectionEligibility.marketSurvey, false);
assert.equal(conflictingMarketDecision.factAmbiguities.market_rent_ranges.reason, "conflicting_exact_market_rent_ranges");

const exactEnvironmentalDecision = decision(
  "exact-environmental-status",
  "Phase I ESA / Environmental Due Diligence\nRecognized Environmental Conditions: None identified in this summary."
);
assert.equal(exactEnvironmentalDecision.acceptedFacts.phase_i_status, "none_identified_in_summary");
assert.equal(exactEnvironmentalDecision.sectionEligibility.environmental, true);

const unsupportedEnvironmentalDecision = decision(
  "unsupported-environmental-status",
  "Phase I ESA / Environmental Due Diligence\nNo environmental review conclusion was supplied."
);
assert.equal(unsupportedEnvironmentalDecision.acceptedFacts.phase_i_status, undefined);
assert.equal(unsupportedEnvironmentalDecision.sectionEligibility.environmental, false);

const exactRenovationSource = [
  "Renovation / CapEx Plan",
  "Total Renovation Budget $1,280,000",
  "1BR Interiors 20 units X $18,500/unit; expected rent lift $225/month; Months 1-18",
  "Common Area Refresh $210,000",
].join("\n");
const exactRenovationDecision = decisionWithParsedPayload(
  "exact-renovation-rows",
  exactRenovationSource,
  "renovation_parsed",
  {
    semantic_doc_role: "renovation_capex_context",
    total_budget: 1280000,
    budget_rows: [
      {
        category: "1BR Interiors",
        evidence: ["1BR Interiors 20 units X $18,500/unit; expected rent lift $225/month; Months 1-18"],
        unit_type: "1BR",
        unit_count: 20,
        cost_per_unit: 18500,
        estimated_cost: 370000,
        expected_monthly_rent_lift: 225,
        phase_timing: "Months 1-18",
      },
      {
        category: "Common Area Refresh",
        evidence: ["Common Area Refresh $210,000"],
        estimated_cost: 210000,
      },
    ],
  }
);
assert.deepEqual(exactRenovationDecision.acceptedFacts.renovation_plan_rows, [
  {
    category: "1BR Interiors",
    unit_type: "1BR",
    unit_count: 20,
    cost_per_unit: 18500,
    expected_monthly_rent_lift: 225,
    start_month: 1,
    end_month: 18,
  },
  { category: "Common Area Refresh", stated_amount: 210000 },
]);
assert.equal(
  exactRenovationDecision.acceptedFacts.renovation_plan_rows.some((row) => row.stated_amount === 370000),
  false,
  "derived unit-count multiplied by per-unit cost must not become an accepted stated amount"
);

const compatibleDuplicateRenovationSource = [
  "Renovation / CapEx Plan",
  "Total Renovation Budget $1,280,000",
  "1BR Interiors20 units x $18,500/unit; expected rent lift $225/month; Months 1-18",
  "2BR Interiors18 units x $24,000/unit; expected rent lift $325/month; Months 1-24",
  "Common Area Refresh$210,000",
  "Exterior / Security$115,000",
  "Contingency$153,000",
].join("\n");
const compatibleDuplicateRenovationDecision = decisionWithParsedPayloads(
  "compatible-duplicate-renovation-rows",
  compatibleDuplicateRenovationSource,
  "renovation_parsed",
  [
    {
      budget_rows: [
        {
          category: "1BR Interiors",
          evidence: ["1BR Interiors20 units x $18,500/unit; expected rent lift $225/month; Months 1-18"],
          unit_type: "1BR",
          unit_count: 20,
          cost_per_unit: 18500,
          expected_monthly_rent_lift: 225,
          phase_timing: "Months 1-18",
        },
        {
          category: "2BR Interiors",
          evidence: ["2BR Interiors18 units x $24,000/unit; expected rent lift $325/month; Months 1-24"],
          unit_type: "2BR",
          unit_count: 18,
          cost_per_unit: 24000,
          expected_monthly_rent_lift: 325,
          phase_timing: "Months 1-24",
        },
        { category: "Common Area Refresh", evidence: ["Common Area Refresh$210,000"], estimated_cost: 210000 },
        { category: "Exterior / Security", evidence: ["Exterior / Security$115,000"], estimated_cost: 115000 },
        { category: "Contingency", evidence: ["Contingency$153,000"], estimated_cost: 153000 },
      ],
    },
    {
      candidate_facts: {
        budget_rows: [
          {
            category: "1BR Interiors",
            evidence: ["1BR Interiors20 units x $18,500/unit; expected rent lift $225/month; Months 1-18"],
            unit_type: "1BR unit",
            unit_count: 20,
            cost_per_unit: 18500,
            expected_monthly_rent_lift: 225,
            phase_timing: "Months 1-18",
          },
          {
            category: "2BR Interiors",
            evidence: ["2BR Interiors18 units x $24,000/unit; expected rent lift $325/month; Months 1-24"],
            unit_type: "2BR unit",
            unit_count: 18,
            cost_per_unit: 24000,
            expected_monthly_rent_lift: 325,
            phase_timing: "Months 1-24",
          },
          { category: "Common Area Refresh", evidence: ["Common Area Refresh$210,000"], estimated_cost: 210000 },
          { category: "Exterior / Security", evidence: ["Exterior / Security$115,000"], estimated_cost: 115000 },
          { category: "Contingency", evidence: ["Contingency$153,000"], estimated_cost: 153000 },
        ],
      },
    },
  ],
);
assert.equal(compatibleDuplicateRenovationDecision.factAmbiguities.renovation_plan_rows, undefined);
assert.deepEqual(compatibleDuplicateRenovationDecision.acceptedFacts.renovation_plan_rows, [
  {
    category: "1BR Interiors",
    unit_type: "1BR",
    unit_count: 20,
    cost_per_unit: 18500,
    expected_monthly_rent_lift: 225,
    start_month: 1,
    end_month: 18,
  },
  {
    category: "2BR Interiors",
    unit_type: "2BR",
    unit_count: 18,
    cost_per_unit: 24000,
    expected_monthly_rent_lift: 325,
    start_month: 1,
    end_month: 24,
  },
  { category: "Common Area Refresh", stated_amount: 210000 },
  { category: "Exterior / Security", stated_amount: 115000 },
  { category: "Contingency", stated_amount: 153000 },
]);

const conflictingDuplicateRenovationDecision = decisionWithParsedPayloads(
  "conflicting-duplicate-renovation-rows",
  [
    "Renovation / CapEx Plan",
    "1BR Interiors 20 units x $18,500/unit",
    "1BR Interiors 22 units x $18,500/unit",
  ].join("\n"),
  "renovation_parsed",
  [
    {
      budget_rows: [{
        category: "1BR Interiors",
        evidence: ["1BR Interiors 20 units x $18,500/unit"],
        unit_count: 20,
        cost_per_unit: 18500,
      }],
    },
    {
      budget_rows: [{
        category: "1BR Interiors",
        evidence: ["1BR Interiors 22 units x $18,500/unit"],
        unit_count: 22,
        cost_per_unit: 18500,
      }],
    },
  ],
);
assert.equal(conflictingDuplicateRenovationDecision.acceptedFacts.renovation_plan_rows, undefined);
assert.equal(
  conflictingDuplicateRenovationDecision.factAmbiguities.renovation_plan_rows.reason,
  "conflicting_exact_renovation_rows",
);

const retest36SupportPackage = buildCanonicalSourceTruthPackage({
  jobId: "retest36-support-source-regression",
  propertyName: "Stonebridge Lofts",
  uploadedFiles: [
    { id: "retest36-renovation", original_filename: "Stonebridge_Reno_Plan.pdf", parse_status: "parsed" },
    { id: "retest36-market", original_filename: "Stonebridge_Market_Survey.pdf", parse_status: "parsed" },
  ],
  artifacts: [
    {
      id: "retest36-renovation-text",
      type: "document_text_extracted",
      payload: {
        file_id: "retest36-renovation",
        original_filename: "Stonebridge_Reno_Plan.pdf",
        text: compatibleDuplicateRenovationSource,
      },
    },
    {
      id: "retest36-renovation-parser-one",
      type: "renovation_parsed",
      payload: {
        file_id: "retest36-renovation",
        original_filename: "Stonebridge_Reno_Plan.pdf",
        budget_rows: [
          {
            category: "1BR Interiors",
            evidence: ["1BR Interiors20 units x $18,500/unit; expected rent lift $225/month; Months 1-18"],
            unit_type: "1BR",
            unit_count: 20,
            cost_per_unit: 18500,
            expected_monthly_rent_lift: 225,
            phase_timing: "Months 1-18",
          },
          {
            category: "2BR Interiors",
            evidence: ["2BR Interiors18 units x $24,000/unit; expected rent lift $325/month; Months 1-24"],
            unit_type: "2BR",
            unit_count: 18,
            cost_per_unit: 24000,
            expected_monthly_rent_lift: 325,
            phase_timing: "Months 1-24",
          },
          { category: "Common Area Refresh", evidence: ["Common Area Refresh$210,000"], estimated_cost: 210000 },
          { category: "Exterior / Security", evidence: ["Exterior / Security$115,000"], estimated_cost: 115000 },
          { category: "Contingency", evidence: ["Contingency$153,000"], estimated_cost: 153000 },
        ],
      },
    },
    {
      id: "retest36-renovation-parser-two",
      type: "renovation_parsed",
      payload: {
        file_id: "retest36-renovation",
        original_filename: "Stonebridge_Reno_Plan.pdf",
        candidate_facts: {
          budget_rows: [
            {
              category: "1BR Interiors",
              evidence: ["1BR Interiors20 units x $18,500/unit; expected rent lift $225/month; Months 1-18"],
              unit_type: "1BR unit",
              unit_count: 20,
              cost_per_unit: 18500,
              expected_monthly_rent_lift: 225,
              phase_timing: "Months 1-18",
            },
            {
              category: "2BR Interiors",
              evidence: ["2BR Interiors18 units x $24,000/unit; expected rent lift $325/month; Months 1-24"],
              unit_type: "2BR unit",
              unit_count: 18,
              cost_per_unit: 24000,
              expected_monthly_rent_lift: 325,
              phase_timing: "Months 1-24",
            },
            { category: "Common Area Refresh", evidence: ["Common Area Refresh$210,000"], estimated_cost: 210000 },
            { category: "Exterior / Security", evidence: ["Exterior / Security$115,000"], estimated_cost: 115000 },
            { category: "Contingency", evidence: ["Contingency$153,000"], estimated_cost: 153000 },
          ],
        },
      },
    },
    {
      id: "retest36-market-text",
      type: "document_text_extracted",
      payload: {
        file_id: "retest36-market",
        original_filename: "Stonebridge_Market_Survey.pdf",
        text: [
          "Market Rent Survey",
          "Field Source Value",
          "1BR Market Rent Range $2,100 $2,250",
          "2BR Market Rent Range $2,500 $2,700",
          "Context only; not a modeled rent-roll override.",
        ].join("\n"),
      },
    },
  ],
});
const retest36RenovationAuthority = retest36SupportPackage.support.accepted.find(
  (entry) => entry.canonical_role === "renovation_capex_context",
);
const retest36MarketAuthority = retest36SupportPackage.support.accepted.find(
  (entry) => entry.canonical_role === "market_survey_context",
);
assert.equal(retest36RenovationAuthority.accepted_facts.renovation_plan_rows.length, 5);
assert.equal(
  retest36RenovationAuthority.authority_decision.factAmbiguities.renovation_plan_rows,
  undefined,
);
assert.deepEqual(retest36MarketAuthority.accepted_facts.market_rent_ranges, [
  { unit_type: "1BR", low_monthly_rent: 2100, high_monthly_rent: 2250 },
  { unit_type: "2BR", low_monthly_rent: 2500, high_monthly_rent: 2700 },
]);
assert.equal(retest36MarketAuthority.section_eligibility.marketSurvey, true);

const unsupportedRenovationDecision = decisionWithParsedPayload(
  "unsupported-renovation-row",
  "Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000\n1BR scope provided without row amounts.",
  "renovation_parsed",
  {
    semantic_doc_role: "renovation_capex_context",
    total_budget: 1280000,
    budget_rows: [{ category: "1BR Interiors", evidence: ["invented excerpt $18,500/unit"], cost_per_unit: 18500 }],
  }
);
assert.equal(unsupportedRenovationDecision.acceptedFacts.renovation_plan_rows, undefined);

function packageForTexts(entries) {
  const uploadedFiles = entries.map((entry) => ({ id: entry.id, original_filename: entry.filename, parse_status: "parsed" }));
  const artifacts = entries.map((entry) => ({
    id: `artifact-${entry.id}`,
    type: "document_text_extracted",
    payload: { file_id: entry.id, original_filename: entry.filename, text: entry.text },
  }));
  return buildCanonicalSourceTruthPackage({ jobId: "adversarial-support-matrix", propertyName: "Matrix Property", uploadedFiles, artifacts });
}

const duplicatePackage = packageForTexts([
  { id: "duplicate-a", filename: "Terms A.pdf", text: completeAcquisition },
  { id: "duplicate-b", filename: "Terms Copy.pdf", text: completeAcquisition },
]);
assert.equal(duplicatePackage.support.accepted.length, 1);
assert.equal(duplicatePackage.support.advisory.some((entry) => entry.status === "duplicate"), true);
assert.equal(duplicatePackage.true_blockers.some((entry) => /support/i.test(entry)), false);

const conflictingPackage = packageForTexts([
  { id: "conflict-a", filename: "Terms A.pdf", text: completeAcquisition },
  { id: "conflict-b", filename: "Terms B.pdf", text: completeAcquisition.replace("$13,500,000", "$14,000,000") },
]);
assert.equal(conflictingPackage.support.accepted.some((entry) => entry.canonical_role === "purchase_assumptions"), false);
assert.equal(conflictingPackage.support.advisory.filter((entry) => entry.status === "conflicting").length, 2);
assert.equal(conflictingPackage.true_blockers.some((entry) => /support/i.test(entry)), false);

const rateStructureConflictPackage = packageForTexts([
  { id: "rate-conflict-a", filename: "Terms Fixed.pdf", text: completeAcquisition },
  {
    id: "rate-conflict-b",
    filename: "Terms Floating.pdf",
    text: completeAcquisition.replace("Rate Structure Fixed", "Variable Rate"),
  },
]);
const acceptedRateConflictEntries = rateStructureConflictPackage.support.accepted
  .filter((entry) => entry.canonical_role === "purchase_assumptions");
assert.equal(acceptedRateConflictEntries.length, 2);
assert.equal(acceptedRateConflictEntries.filter((entry) => entry.primary_for_role).length, 1);
assert.equal(acceptedRateConflictEntries.every((entry) => entry.accepted_facts.rate_structure === undefined), true);
assert.equal(acceptedRateConflictEntries.every((entry) => entry.accepted_facts.proposed_loan_amount === 9450000), true);
assert.equal(acceptedRateConflictEntries.every((entry) => entry.section_eligibility.proposedFinancing === true), true);
assert.deepEqual(
  rateStructureConflictPackage.support.fact_conflicts.map((entry) => entry.fact_name),
  ["rate_structure"]
);
assert.equal(rateStructureConflictPackage.support.fact_conflicts[0].decision, "fact_rejected_role_preserved");
assert.equal(rateStructureConflictPackage.support.conflicts.length, 0);
assert.equal(rateStructureConflictPackage.true_blockers.some((entry) => /support/i.test(entry)), false);
const rateConflictDebtContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: rateStructureConflictPackage,
});
assert.equal(
  rateConflictDebtContract.proposedFinancing.debtServiceBundles[0].eligibleForDeterministicCalculation,
  true
);
assert.equal(rateConflictDebtContract.proposedFinancing.facts.rate_structure.value, null);

const closingCostsConflictPackage = packageForTexts([
  { id: "closing-costs-conflict-a", filename: "Costs 2 Percent.pdf", text: completeAcquisition },
  {
    id: "closing-costs-conflict-b",
    filename: "Costs 3 Percent.pdf",
    text: completeAcquisition.replace("Closing Costs 2.00%", "Closing Costs 3.00%"),
  },
]);
const acceptedClosingCostsConflictEntries = closingCostsConflictPackage.support.accepted
  .filter((entry) => entry.canonical_role === "purchase_assumptions");
assert.equal(acceptedClosingCostsConflictEntries.length, 2);
assert.equal(acceptedClosingCostsConflictEntries.filter((entry) => entry.primary_for_role).length, 1);
assert.equal(
  acceptedClosingCostsConflictEntries.every((entry) => entry.accepted_return_input_facts.closing_costs_percent === undefined),
  true
);
assert.equal(acceptedClosingCostsConflictEntries.every((entry) => entry.accepted_facts.purchase_price === 13500000), true);
assert.deepEqual(
  closingCostsConflictPackage.support.fact_conflicts.map((entry) => entry.fact_name),
  ["closing_costs_percent"]
);
assert.equal(closingCostsConflictPackage.support.conflicts.length, 0);
assert.equal(closingCostsConflictPackage.true_blockers.some((entry) => /support/i.test(entry)), false);

console.log(`support-document authority adversarial matrix PASS (${scenarios.length + 12} scenarios)`);
