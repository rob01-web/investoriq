import assert from "node:assert/strict";
import {
  INVESTORIQ_QA_DOCTRINE,
  containsProhibitedPublicLanguage,
  isAllowedMethodologyOnlyText,
  isFilenameHintOnlyText,
} from "../../api/_lib/investoriq-qa-doctrine.js";
import { __test__ as renderedQaTest } from "../../api/_lib/qa-review.js";
import { __test__ as sourcePackageQaTest } from "../../api/_lib/source-package-qa.js";
import { __test__ as qaManagerTest } from "../../api/_lib/qa-manager-review.js";

assert.equal(
  isAllowedMethodologyOnlyText({
    category: "compliance",
    excerpt: "InvestorIQ estimates are document-backed and framework-constrained.",
    suggested_review: "Review whether this implies guaranteed accuracy.",
  }),
  true
);

assert.equal(containsProhibitedPublicLanguage("BUY this property."), true);
assert.equal(containsProhibitedPublicLanguage("This report is document-backed and deterministic."), false);

assert.equal(
  isFilenameHintOnlyText({
    message: "Filename token UNSUPPORTED may imply unsupported file.",
    evidence: { file: "UNSUPPORTED_capex.xlsx" },
  }),
  true
);

assert.match(INVESTORIQ_QA_DOCTRINE, /unsupported\/unstructured uploads may be listed and explicitly excluded from modeled outputs/i);
assert.match(sourcePackageQaTest.SOURCE_PACKAGE_QA_PROMPT, /Filename and upload-slot tokens are never source truth/i);
assert.match(sourcePackageQaTest.SOURCE_PACKAGE_QA_PROMPT, /source_report_coverage_qa\.artifact_inventory/i);
assert.match(qaManagerTest.QA_MANAGER_PROMPT, /Deterministic evidence and actual rendered excerpts outrank speculative AI suggestions/i);
assert.match(renderedQaTest.SYSTEM_PROMPT, /INVESTORIQ QA DOCTRINE - LAUNCH VERSION/i);

const sourcePackageArtifactSummary = sourcePackageQaTest.summarizeArtifact({
  type: "loan_term_sheet_parsed",
  payload: {
    file_id: "pa-1",
    original_filename: "PurchaseAssumptions.pdf",
    semantic_doc_role: "purchase_assumptions",
    semantic_doc_role_confidence: 0.96,
    semantic_doc_display_label: "purchase_assumptions",
    purchase_price: 1000000,
    ltv: 80,
    interest_rate: 4.25,
    amortization_years: 25,
    derived_acquisition_loan_amount: 800000,
    going_in_cap_rate: 5.75,
  },
});
assert.equal(sourcePackageArtifactSummary.semantic_doc_display_label, "purchase_assumptions");
assert.equal(sourcePackageArtifactSummary.semantic_doc_role, "purchase_assumptions");
assert.equal(sourcePackageArtifactSummary.validated_acquisition_assumptions, true);

const acquisitionFalsePositiveReview = {
  source_report_consistency_findings: [
    {
      code: "unsupported_acquisition_assumptions",
      severity: "medium",
      message: "Unsupported acquisition assumptions.",
      evidence: {
        summary: "Acquisition assumptions flagged.",
        source: "source_package_qa_advisory",
        file: "PurchaseAssumptions.pdf",
        artifact_type: "loan_term_sheet_parsed",
        excerpt: "unsupported acquisition assumptions",
      },
      suggested_review: "Review acquisition assumptions.",
    },
  ],
  doc_treatment_findings: [],
  possible_parser_misses: [],
  possible_false_unsupported_docs: [],
  possible_support_contamination: [],
  false_positive_likely_findings: [],
};
const acquisitionFalsePositiveFiltered = sourcePackageQaTest.filterSourcePackageFalsePositives(
  acquisitionFalsePositiveReview,
  {
    rendered_report_text: [
      "Proposed Acquisition Debt Sizing",
      "Derived Acquisition Loan Amount",
      "Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.",
    ].join(" "),
    source_report_coverage_qa: {
      qa_status: "pass",
      deterministic_flags: [],
      acquisition_assumption_state: {
        acquisition_assumptions_supported: true,
        has_validated_acquisition_assumptions: true,
        current_debt_separated: true,
      },
    },
  }
);
assert.equal(acquisitionFalsePositiveFiltered.source_report_consistency_findings.length, 0);

const managerDecisionProperties =
  qaManagerTest.RESPONSE_SCHEMA.schema.properties.decisions.items.properties;
assert.equal(Object.hasOwn(managerDecisionProperties, "replacement_financial_value"), false);
assert.equal(Object.hasOwn(managerDecisionProperties, "mutated_report_copy"), false);
assert.equal(qaManagerTest.RESPONSE_SCHEMA.schema.properties.decisions.items.additionalProperties, false);

console.log("qa-doctrine smoke PASS");
