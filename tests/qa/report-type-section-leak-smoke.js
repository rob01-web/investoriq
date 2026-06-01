import assert from "node:assert/strict";
import { buildReportContractQa } from "../../api/_lib/report-contract-qa.js";

const baseArtifacts = [
  { type: "t12_parsed", payload: { effective_gross_income: 1000000, total_operating_expenses: 400000, net_operating_income: 600000 } },
  { type: "rent_roll_parsed", payload: { total_units: 10, occupancy: 1 } },
];

const baseCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true, unit_count: 10, occupancy: 1 },
  },
};

const underwritingNeutral = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h3>Document-Backed Underwriting Outputs</h3>",
    "<p>InvestorIQ underwriting outputs are document-backed and framework-constrained.</p>",
  ].join("\n"),
});
assert.equal(underwritingNeutral.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"), false);

const underwritingLeak = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h3>Document-Backed Screening Outputs</h3>",
    "<p>InvestorIQ screening outputs are document-backed and framework-constrained.</p>",
  ].join("\n"),
});
assert.equal(underwritingLeak.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"), true);
const leakViolation = underwritingLeak.violations.find((v) => v.code === "REPORT_TYPE_SECTION_LEAK");
assert.equal(typeof leakViolation?.evidence?.excerpt === "string" && leakViolation.evidence.excerpt.trim().length > 0, true);

const screeningAllowed = buildReportContractQa({
  reportType: "screening",
  reportTier: 1,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h3>Document-Backed Screening Outputs</h3>",
    "<p>InvestorIQ screening outputs are document-backed and framework-constrained.</p>",
  ].join("\n"),
});
assert.equal(screeningAllowed.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"), false);

console.log("report-type section leak smoke PASS");
