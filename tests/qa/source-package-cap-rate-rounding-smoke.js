import assert from "node:assert/strict";
import { __test__ as sourcePackageQaTest } from "../../api/_lib/source-package-qa.js";

function filterFindings(findingText, compactPayload) {
  const review = {
    source_report_consistency_findings: [
      {
        code: "source_report_inconsistency",
        severity: "medium",
        message: findingText,
        evidence: { excerpt: findingText },
      },
    ],
    doc_treatment_findings: [],
    possible_parser_misses: [],
    possible_false_unsupported_docs: [],
    possible_support_contamination: [],
    false_positive_likely_findings: [],
  };
  return sourcePackageQaTest.filterSourcePackageFalsePositives(review, compactPayload);
}

const compactPayload = {
  rendered_report_text: "Going-in cap rate 5.8% and occupancy 92.0%.",
  source_report_coverage_qa: {
    artifact_inventory: {
      loan_term_sheet_parsed: {
        acquisition_support: {
          going_in_cap_rate: 0.0575,
        },
      },
    },
  },
};

const roundedCapRateFinding = filterFindings(
  "source_report_inconsistency: The report inconsistently mentions a going-in cap rate of 5.8% while the parsed artifact shows a cap rate of 5.75%.",
  compactPayload
);
assert.equal(roundedCapRateFinding.source_report_consistency_findings.length, 0);

const exactCapRateFinding = filterFindings(
  "source_report_inconsistency: The report inconsistently mentions a going-in cap rate of 5.75% while the parsed artifact shows a cap rate of 5.75%.",
  compactPayload
);
assert.equal(exactCapRateFinding.source_report_consistency_findings.length, 0);

const trueCapRateContradictionFinding = filterFindings(
  "source_report_inconsistency: The report contradicts the parsed artifact by mentioning a going-in cap rate of 6.5% while the parsed artifact shows a cap rate of 5.75%.",
  compactPayload
);
assert.equal(trueCapRateContradictionFinding.source_report_consistency_findings.length, 1);

const nonCapRateContradictionFinding = filterFindings(
  "source_report_inconsistency: The report contradicts the parsed artifact by mentioning occupancy of 88.0% while the parsed artifact shows occupancy of 92.0%.",
  {
    ...compactPayload,
    rendered_report_text: "Occupancy 88.0%.",
  }
);
assert.equal(nonCapRateContradictionFinding.source_report_consistency_findings.length, 1);

console.log("source-package cap-rate rounding smoke PASS");
