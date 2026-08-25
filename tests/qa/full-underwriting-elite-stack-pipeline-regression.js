import assert from "node:assert/strict";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";
import { runAcquisitionMemoV2Pipeline } from "../../api/_lib/acquisition-memo-v2-pipeline.js";

function occurrences(haystack, needle) {
  return String(haystack || "").split(String(needle)).length - 1;
}

const fixture = buildInstitutionalGate10ReportFixture("elite-stack-pipeline-regression");

const result = await runAcquisitionMemoV2Pipeline({
  acquisitionMemoV2DocumentArgs: {
    sourceTruthPackage: fixture.sourceTruthPackage,
    sourceTruthRequired: true,
    acquisitionMemoProjection: fixture.acquisitionMemoProjection,
    renderedAcquisitionMemo: fixture.renderedAcquisitionMemo,
    sourcePackage: fixture.sourcePackage,
    t12Payload: fixture.sourceTruthPackage.core.t12.accepted_facts,
    coreMetrics: fixture.coreMetrics,
    reportMeta: fixture.reportMeta,
    propertyProfile: fixture.propertyProfile,
    bossContract: fixture.bossContract,
    customerSurfaceModel: fixture.customerSurfaceModel,
    financialIntelligence: fixture.financialIntelligence,
  },
  acquisitionMemoBossContract: fixture.bossContract,
});

assert.equal(result.sealedCustomerOutput, true, "Full Underwriting pipeline output must be sealed");
assert.equal(result.sourceTruthPackage, fixture.sourceTruthPackage, "Pipeline must preserve canonical Source Truth identity");
assert.equal(result.compliance?.ok, true, JSON.stringify(result.compliance?.violations || [], null, 2));
assert.equal(result.customerSurfaceHtmlValidation?.ok, true, JSON.stringify(result.customerSurfaceHtmlValidation?.issues || [], null, 2));
assert.equal(result.deterministicContractQaSeal?.ok, true, JSON.stringify(result.deterministicContractQaSeal?.issues || [], null, 2));

const html = String(result.html || "");
assert.match(html, /data-iq-elite-chapter1="true"/, "ELITE-02 Chapter 1 must survive the actual pipeline");
assert.match(html, /data-iq-elite-operating=/, "ELITE-03 Operating Intelligence must survive the actual pipeline");
assert.match(html, /data-iq-chapter="scenario-underwriting-drivers"/, "ELITE-04 scenario chapter must survive the actual pipeline when the institutional fixture has a governed base");
assert.match(html, /data-iq-elite-driver-section=/, "ELITE-05 Driver Analysis must survive the actual pipeline");
assert.match(html, /data-iq-elite="transaction-diligence-v1"/, "ELITE-06 Transaction / Diligence Intelligence must survive the actual pipeline");
assert.match(html, /data-iq-elite="debt-intelligence-v1"/, "ELITE-07 Debt Intelligence must survive the actual pipeline");

for (const chapterKey of [
  "committee-overview",
  "operating-performance",
  "scenario-underwriting-drivers",
  "transaction-context",
  "debt-capital-structure",
  "valuation-reconciliation",
  "source-appendix",
]) {
  assert.match(html, new RegExp(`data-iq-chapter=\\"${chapterKey}\\"`), `${chapterKey} must survive pipeline composition`);
}

const htmlWithoutSoftBreaks = String(html || "").replace(/<wbr\s*\/?\s*>/gi, "");

for (const filename of [
  "Institutional_T12_Operating_Statement_With_Long_Source_Name.xlsx",
  "Institutional_Rent_Roll_With_Long_Source_Name.xlsx",
  "Institutional_Acquisition_Assumptions_With_Long_Source_Name.pdf",
  "Institutional_Current_Debt_Statement_With_Long_Source_Name.pdf",
  "Institutional_Capital_Plan_With_Long_Source_Name.pdf",
]) {
  assert.equal(occurrences(htmlWithoutSoftBreaks, filename), 1, `${filename} must appear once in final customer HTML`);
}

function visibleText(value) {
  return String(value || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripGovernedRecommendationDisclaimers(value) {
  return String(value || "")
    .replace(/\bno\s+investment recommendations?\b/gi, "")
    .replace(/\bwithout\s+(?:an?\s+)?investment recommendations?\b/gi, "")
    .replace(/\bdoes not add a probability,\s*forecast,\s*or\s+investment recommendations?\b/gi, "")
    .replace(/\bnot a probability,\s*forecast,\s*risk grade,\s*or\s+investment recommendations?\b/gi, "")
    .replace(/\bnot sourced facts,\s*forecasts,\s*probabilities,\s*or\s+investment recommendations?\b/gi, "");
}

const recommendationAuthorityScan = stripGovernedRecommendationDisclaimers(visibleText(html));
assert.doesNotMatch(recommendationAuthorityScan, /\bBUY\b|\bSELL\b|\bHOLD\b|FINAL RECOMMENDATION|INVESTMENT RECOMMENDATION/i);
assert.match(stripGovernedRecommendationDisclaimers("Investment Recommendation: BUY"), /INVESTMENT RECOMMENDATION|\bBUY\b/i, "recommendation detector must still catch positive authority language");
assert.doesNotMatch(html, /\b(Boss Contract|V2 Canonical Package|Source Authority|canonical source package|V2 projection|assertion code names|stack trace)\b/i);

console.log("PASS full-underwriting-elite-stack-pipeline-regression");
