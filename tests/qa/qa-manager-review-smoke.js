import assert from "node:assert/strict";
import { __test__ } from "../../api/_lib/qa-manager-review.js";

const renderedText = [
  "Supplemental documents that are not converted into structured report inputs are not used quantitatively.",
  "Unsupported or unstructured uploads remain excluded from modeled outputs.",
  "Capital Risk Profile: Sensitized.",
  "Primary Pressure Point: DSCR of 1.09x constrains refinance capacity below lender thresholds.",
  "Expense Ratio 62.6%. NOI Margin 37.4%. Break-even Occupancy 62.6%.",
  "Standardized underwriting threshold language is shown.",
].join(" ");

const sourceCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  current_debt_state: {
    has_proposed_acquisition_financing: true,
    has_true_current_debt_balance: false,
  },
  acquisition_assumption_state: {
    acquisition_assumptions_supported: true,
    has_validated_acquisition_assumptions: true,
    current_debt_separated: true,
  },
};

const decisions = __test__.normalizeManagerDecisions(
  [
    {
      source_code: "unsupported_doc_reference",
      source_artifact: "source_package_qa_advisory",
      classification: "real_source_report_contradiction",
      severity: "medium",
      rationale: "Unsupported documents are referenced without exclusion.",
      evidence_excerpt: "Unsupported documents listed.",
      recommended_action_type: "render_gating_fix_required",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    },
    {
      source_code: "sensitized_term_usage",
      source_artifact: "rendered_report_qa_advisory",
      classification: "real_public_language_risk",
      severity: "medium",
      rationale: "Sensitized lacks clear context.",
      evidence_excerpt: "Capital Risk Profile: Sensitized.",
      recommended_action_type: "code_patch_required",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    },
  ],
  {
    renderedText,
    sourceReportCoverageQa: sourceCoverage,
    sourcePackageQa: {
      acquisition_assumption_state: sourceCoverage.acquisition_assumption_state,
      source_report_coverage_qa: sourceCoverage,
    },
  }
);

assert.equal(decisions[0].classification, "false_positive");
assert.equal(decisions[0].requires_code_patch, false);
assert.equal(decisions[0].blocks_public_sample, false);
assert.equal(decisions[1].classification, "false_positive");
assert.equal(decisions[1].requires_code_patch, false);
assert.equal(decisions[1].blocks_high_value_outreach, false);

const trueUnsupportedReliance = __test__.normalizeManagerDecisions(
  [
    {
      source_code: "unsupported_doc_reliance",
      source_artifact: "source_package_qa_advisory",
      classification: "real_source_report_contradiction",
      severity: "high",
      rationale: "Report relied on quantitatively modeled unsupported document.",
      evidence_excerpt: "Modeled value from unsupported document.",
      recommended_action_type: "render_gating_fix_required",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    },
  ],
  {
    renderedText,
    sourceReportCoverageQa: sourceCoverage,
    sourcePackageQa: {
      acquisition_assumption_state: sourceCoverage.acquisition_assumption_state,
      source_report_coverage_qa: sourceCoverage,
    },
  }
);

assert.equal(trueUnsupportedReliance[0].classification, "real_source_report_contradiction");
assert.equal(trueUnsupportedReliance[0].requires_code_patch, true);

const unsupportedAcquisitionAssumptions = __test__.normalizeManagerDecisions(
  [
    {
      source_code: "unsupported_acquisition_assumptions",
      source_artifact: "source_package_qa_advisory",
      classification: "real_source_report_contradiction",
      severity: "high",
      rationale: "Acquisition assumptions are unsupported.",
      evidence_excerpt: "unsupported acquisition assumptions",
      recommended_action_type: "render_gating_fix_required",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    },
  ],
  {
    renderedText: [
      renderedText,
      "Proposed Acquisition Debt Sizing",
      "Derived Acquisition Loan Amount",
      "Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.",
    ].join(" "),
    sourceReportCoverageQa: sourceCoverage,
    sourcePackageQa: {
      acquisition_assumption_state: sourceCoverage.acquisition_assumption_state,
      source_report_coverage_qa: sourceCoverage,
    },
  }
);

assert.equal(unsupportedAcquisitionAssumptions[0].classification, "false_positive");
assert.equal(unsupportedAcquisitionAssumptions[0].requires_code_patch, false);
assert.equal(unsupportedAcquisitionAssumptions[0].blocks_public_sample, false);

const partialAcquisitionSourceCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  current_debt_state: {
    has_proposed_acquisition_financing: true,
    has_true_current_debt_balance: false,
  },
  acquisition_assumption_state: {
    acquisition_assumptions_supported: false,
    has_validated_acquisition_assumptions: false,
    current_debt_separated: true,
  },
};
const partialAcquisitionDecision = __test__.normalizeManagerDecisions(
  [
    {
      source_code: "unsupported_acquisition_assumptions",
      source_artifact: "source_package_qa_advisory",
      classification: "real_source_report_contradiction",
      severity: "high",
      rationale: "Acquisition assumptions are partially unsupported.",
      evidence_excerpt: "unsupported acquisition assumptions",
      recommended_action_type: "render_gating_fix_required",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    },
  ],
  {
    renderedText: [
      renderedText,
      "Proposed Acquisition Debt Sizing",
      "Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.",
    ].join(" "),
    sourceReportCoverageQa: partialAcquisitionSourceCoverage,
    sourcePackageQa: {
      acquisition_assumption_state: partialAcquisitionSourceCoverage.acquisition_assumption_state,
      source_report_coverage_qa: partialAcquisitionSourceCoverage,
    },
  }
);

assert.equal(partialAcquisitionDecision[0].classification, "real_source_report_contradiction");
assert.equal(partialAcquisitionDecision[0].requires_code_patch, true);

const safeCurrentDebtLimitation = __test__.normalizeManagerDecisions(
  [
    {
      source_code: "current debt limitation",
      source_artifact: "rendered_report_qa_advisory",
      classification: "real_source_report_contradiction",
      severity: "medium",
      rationale: "Current debt is not assessed.",
      evidence_excerpt: "No current debt document provided. Current debt terms were not fully provided.",
      recommended_action_type: "render_gating_fix_required",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    },
  ],
  {
    renderedText: [
      renderedText,
      "Current Debt DSCR / Not assessed / No current debt document provided / 0/10",
      "Current debt terms were not fully provided.",
      "Proposed Acquisition Debt Sizing",
      "Derived Acquisition Loan Amount",
      "not current outstanding debt",
    ].join(" "),
    sourceReportCoverageQa: sourceCoverage,
  }
);

assert.equal(safeCurrentDebtLimitation[0].classification, "false_positive");
assert.equal(safeCurrentDebtLimitation[0].requires_code_patch, false);
assert.equal(safeCurrentDebtLimitation[0].blocks_public_sample, false);

console.log("qa-manager-review smoke PASS");
