import assert from "node:assert/strict";
import { buildCanonicalVisibleClassificationState } from "../../api/_lib/report-surface-contracts.js";
import { buildReportContractQa } from "../../api/_lib/report-contract-qa.js";

const artifacts = [
  { type: "t12_parsed", payload: { net_operating_income: 600000 } },
  { type: "rent_roll_parsed", payload: { total_units: 10, occupancy: 0.95 } },
];

const screeningCanonical = buildCanonicalVisibleClassificationState({
  reportType: "screening",
  reportTier: 1,
  baseLabel: "Stable",
});
assert.equal(screeningCanonical.label, "Stable");
assert.equal(screeningCanonical.source_family, "screening_visible_classification_state");

const underwritingConstraintCanonical = buildCanonicalVisibleClassificationState({
  reportType: "underwriting",
  reportTier: 2,
  score: 78,
  hasDscrScore: true,
  currentDebtDscr: 1.06,
});
assert.equal(underwritingConstraintCanonical.label, "Review - Debt Coverage Constraint");
assert.equal(underwritingConstraintCanonical.cap_reason_code, "debt_coverage_constraint");

const underwritingCoreSupportCanonical = buildCanonicalVisibleClassificationState({
  reportType: "underwriting",
  reportTier: 2,
  baseLabel: "Stable",
  sourceReconciliationCapActive: false,
  coreSupportInsufficient: true,
  debtCoverageConstraintActive: false,
});
assert.equal(underwritingCoreSupportCanonical.label, "Review - Insufficient Core Support");

const underwritingSourceReconciliationCanonical = buildCanonicalVisibleClassificationState({
  reportType: "underwriting",
  reportTier: 2,
  baseLabel: "Stable",
  sourceReconciliationCapActive: true,
  coreSupportInsufficient: false,
  debtCoverageConstraintActive: false,
});
assert.equal(underwritingSourceReconciliationCanonical.label, "Review - Source Reconciliation Disclosure");

const underwritingPriorityCanonical = buildCanonicalVisibleClassificationState({
  reportType: "underwriting",
  reportTier: 2,
  score: 85,
  hasDscrScore: true,
  currentDebtDscr: 1.06,
  sourceReconciliationCapActive: true,
  coreSupportInsufficient: true,
  debtCoverageConstraintActive: true,
});
assert.equal(underwritingPriorityCanonical.label, "Review - Source Reconciliation Disclosure");
assert.equal(underwritingPriorityCanonical.cap_reason_code, "source_reconciliation_disclosure");

const canonicalConformancePass = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts,
  sourceReportCoverageQa: {
    display_verdict_state: underwritingConstraintCanonical,
    visible_classification_state: underwritingConstraintCanonical,
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.06,
    },
  },
  html: [
    "<p>Capital Risk Profile: Review - Debt Coverage Constraint</p>",
    "<p>Executive Summary: Review - Debt Coverage Constraint</p>",
    "<p>Deal Scorecard: Review - Debt Coverage Constraint</p>",
  ].join("\n"),
});
assert.equal(canonicalConformancePass.violations.some((v) => v.code === "VISIBLE_CLASSIFICATION_CANONICAL_MISMATCH"), false);

const canonicalConformanceFail = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts,
  sourceReportCoverageQa: {
    display_verdict_state: underwritingConstraintCanonical,
    visible_classification_state: underwritingConstraintCanonical,
  },
  html: "<p>Capital Risk Profile: Stable</p>",
});
assert.equal(canonicalConformanceFail.violations.some((v) => v.code === "VISIBLE_CLASSIFICATION_CANONICAL_MISMATCH"), true);

console.log("classification visible authority smoke PASS");
