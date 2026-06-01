import assert from "node:assert/strict";
import fs from "node:fs";
import { analyzeCoreParserRejectionTextSignals } from "../../api/admin-run-worker.js";

const usableSummaryText = [
  "Total units: 48",
  "Occupied units: 46",
  "Vacant units: 2",
  "Occupancy: 95.83%",
  "In-place monthly rent total from occupied units only: 86400",
  "Market monthly rent total across all 48 units: 94800",
  "These summary totals are the controlling property totals for this rent roll.",
].join("\n");

const usableSummaryAudit = analyzeCoreParserRejectionTextSignals({
  docType: "rent_roll",
  text: usableSummaryText,
  parseError: "insufficient_rent_roll_text_coverage",
  providerUnavailable: true,
});
assert.equal(usableSummaryAudit.findings.includes("parser_rejection_confirmed"), true);
assert.equal(usableSummaryAudit.findings.includes("source_text_contains_core_summary_totals"), true);
assert.equal(usableSummaryAudit.findings.includes("parser_missed_usable_core_evidence"), true);
assert.equal(usableSummaryAudit.findings.includes("deterministic_recovery_needed"), true);
assert.equal(usableSummaryAudit.findings.includes("provider_unavailable"), true);

const representativeOnlyText = [
  "Unit 101 current monthly rent is 1650",
  "Unit 102 market monthly rent is 1800",
  "Representative unit observations only",
].join("\n");
const representativeOnlyAudit = analyzeCoreParserRejectionTextSignals({
  docType: "rent_roll",
  text: representativeOnlyText,
  parseError: "insufficient_rent_roll_text_coverage",
});
assert.equal(representativeOnlyAudit.findings.includes("parser_rejection_confirmed"), true);
assert.equal(representativeOnlyAudit.findings.includes("source_text_contains_core_summary_totals"), false);

const t12CoreText = [
  "Gross Potential Rent: 1000000",
  "Effective Gross Income: 920000",
  "Total Operating Expenses: 400000",
  "Net Operating Income: 520000",
  "TTM period",
].join("\n");
const t12Audit = analyzeCoreParserRejectionTextSignals({
  docType: "t12",
  text: t12CoreText,
  parseError: "insufficient_t12_text_coverage",
});
assert.equal(t12Audit.findings.includes("source_text_contains_core_summary_totals"), true);
assert.equal(t12Audit.findings.includes("parser_missed_usable_core_evidence"), true);

const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
assert.match(workerSource, /type:\s*'core_parser_rejection_audit'/);
assert.match(workerSource, /analyzeCoreParserRejectionTextSignals/);
assert.match(workerSource, /errorCode:\s*'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS'/);
assert.match(workerSource, /reason:\s*'missing_structured_financials'/);
assert.equal(/Final Motherload|Harbourstone/i.test(workerSource), false);

console.log("core-parser-rejection-audit smoke PASS");
