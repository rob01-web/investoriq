import assert from "node:assert/strict";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

function visibleText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function occurrences(haystack, needle) {
  return String(haystack || "").split(String(needle)).length - 1;
}

let checks = 0;
function eq(actual, expected, message) {
  assert.equal(actual, expected, message);
  checks += 1;
}
function ok(value, message) {
  assert.ok(value, message);
  checks += 1;
}
function match(value, regex, message) {
  assert.match(String(value), regex, message);
  checks += 1;
}
function noMatch(value, regex, message) {
  assert.doesNotMatch(String(value), regex, message);
  checks += 1;
}

const { html } = buildInstitutionalGate10ReportFixture("elite-06-institutional-regression");
const htmlWithoutSoftBreaks = String(html || "").replace(/<wbr\s*\/?\s*>/gi, "");
const text = visibleText(html);

match(html, /data-iq-elite="transaction-diligence-v1"/, "ELITE-06 surface must render in the full institutional fixture");
match(text, /Transaction & Diligence Intelligence/i, "ELITE-06 customer heading must be visible");

const transactionChapterIndex = html.indexOf('data-iq-chapter="transaction-context"');
const eliteIndex = html.indexOf('data-iq-elite="transaction-diligence-v1"', transactionChapterIndex);
const acquisitionIndex = html.indexOf("Acquisition Request Context", transactionChapterIndex);
const readinessIndex = html.indexOf("Preliminary Financing Readiness Summary", transactionChapterIndex);
ok(transactionChapterIndex >= 0, "Transaction Context chapter must remain");
ok(eliteIndex > transactionChapterIndex, "ELITE-06 must render inside Transaction Context");
ok(acquisitionIndex === -1, "Duplicate Acquisition Request Context must be suppressed when ELITE-06 renders");
ok(readinessIndex > eliteIndex, "Detailed financing-readiness section must remain after ELITE-06 summary");

const eliteMatch = html.match(/<section class="section" data-iq-elite="transaction-diligence-v1">([\s\S]*?)<\/section>/i);
ok(Boolean(eliteMatch), "ELITE-06 section boundary must be extractable");
const eliteHtml = eliteMatch?.[0] || "";
noMatch(eliteHtml, /\.(?:pdf|xlsx?|csv)\b/i, "ELITE-06 summary must not repeat uploaded filenames; filenames belong to the source register");
noMatch(eliteHtml, /customerSurfaceModel|canonical_source_truth_package|sourceBacked|raw parser/i, "ELITE-06 customer surface must not leak internal authority language");

for (const filename of [
  "Institutional_T12_Operating_Statement_With_Long_Source_Name.xlsx",
  "Institutional_Rent_Roll_With_Long_Source_Name.xlsx",
  "Institutional_Acquisition_Assumptions_With_Long_Source_Name.pdf",
  "Institutional_Current_Debt_Statement_With_Long_Source_Name.pdf",
  "Institutional_Capital_Plan_With_Long_Source_Name.pdf",
]) {
  eq(occurrences(htmlWithoutSoftBreaks, filename), 1, `${filename} must appear exactly once in the complete institutional report`);
}

for (const chapterKey of [
  "committee-overview",
  "operating-performance",
  "scenario-underwriting-drivers",
  "transaction-context",
  "debt-capital-structure",
  "valuation-reconciliation",
  "source-appendix",
]) {
  match(html, new RegExp(`data-iq-chapter=\\"${chapterKey}\\"`), `${chapterKey} chapter must survive ELITE-06`);
}

function stripGovernedRecommendationDisclaimers(value) {
  return String(value || "")
    .replace(/\bno\s+investment recommendations?\b/gi, "")
    .replace(/\bwithout\s+(?:an?\s+)?investment recommendations?\b/gi, "")
    .replace(/\bdoes not add a probability,\s*forecast,\s*or\s+investment recommendations?\b/gi, "")
    .replace(/\bnot a probability,\s*forecast,\s*risk grade,\s*or\s+investment recommendations?\b/gi, "")
    .replace(/\bnot sourced facts,\s*forecasts,\s*probabilities,\s*or\s+investment recommendations?\b/gi, "");
}

const recommendationAuthorityScan = stripGovernedRecommendationDisclaimers(text);
noMatch(recommendationAuthorityScan, /\bBUY\b|\bSELL\b|\bHOLD\b|FINAL RECOMMENDATION|INVESTMENT RECOMMENDATION/i, "ELITE-06 must not create recommendation authority");
match(stripGovernedRecommendationDisclaimers("Investment Recommendation: BUY"), /INVESTMENT RECOMMENDATION|\bBUY\b/i, "recommendation detector must still catch positive authority language");
match(text, /Missing or incomplete optional diligence limits only the dependent diligence analysis/i, "optional-diligence non-blocking doctrine must remain visible");

console.log(`PASS full-underwriting-transaction-diligence-institutional-regression (${checks}/${checks})`);
