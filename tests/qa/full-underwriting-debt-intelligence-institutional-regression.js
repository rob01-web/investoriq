import assert from "node:assert/strict";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";
import { runAcquisitionMemoV2Pipeline } from "../../api/_lib/acquisition-memo-v2-pipeline.js";

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

function stripGovernedRecommendationDisclaimers(value) {
  return String(value || "")
    .replace(/\bno\s+investment recommendations?\b/gi, "")
    .replace(/\bwithout\s+(?:an?\s+)?investment recommendations?\b/gi, "")
    .replace(/\bdoes not add a probability,\s*forecast,\s*or\s+investment recommendations?\b/gi, "")
    .replace(/\bnot a probability,\s*forecast,\s*risk grade,\s*or\s+investment recommendations?\b/gi, "")
    .replace(/\bnot sourced facts,\s*forecasts,\s*probabilities,\s*or\s+investment recommendations?\b/gi, "");
}

function occurrences(haystack, needle) {
  return String(haystack || "").split(String(needle)).length - 1;
}

let checks = 0;
function ok(value, message) { assert.ok(value, message); checks += 1; }
function eq(actual, expected, message) { assert.equal(actual, expected, message); checks += 1; }
function match(value, regex, message) { assert.match(String(value), regex, message); checks += 1; }
function noMatch(value, regex, message) { assert.doesNotMatch(String(value), regex, message); checks += 1; }

const fixture = buildInstitutionalGate10ReportFixture("elite-07-institutional-regression");
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

const html = String(result.html || "");
const text = visibleText(html);
eq(result.sealedCustomerOutput, true, "pipeline output sealed");
eq(result.sourceTruthPackage, fixture.sourceTruthPackage, "canonical Source Truth identity preserved");
eq(result.compliance?.ok, true, JSON.stringify(result.compliance?.violations || [], null, 2));
eq(result.customerSurfaceHtmlValidation?.ok, true, JSON.stringify(result.customerSurfaceHtmlValidation?.issues || [], null, 2));
eq(result.deterministicContractQaSeal?.ok, true, JSON.stringify(result.deterministicContractQaSeal?.issues || [], null, 2));

match(html, /data-iq-elite="debt-intelligence-v1"/, "ELITE-07 surface survives actual pipeline");
match(text, /Debt Intelligence/i, "Debt Intelligence heading visible");
match(text, /Proposed Rate \/ DSCR Sensitivity/i, "rate sensitivity visible");
match(text, /Debt Term and Maturity Analysis/i, "maturity analysis visible");
match(text, /Debt Capacity and Coverage/i, "capacity analysis visible");
match(html, /data-iq-elite07-rate-stress="50"/, "+50 bps scenario survives");
match(html, /data-iq-elite07-rate-stress="100"/, "+100 bps scenario survives");
match(html, /data-iq-elite07-rate-stress="200"/, "+200 bps scenario survives");
match(html, /data-iq-evidence-class="scenario"/, "scenario evidence class survives");

const debtChapter = html.indexOf('data-iq-chapter="debt-capital-structure"');
const eliteIndex = html.indexOf('data-iq-elite="debt-intelligence-v1"', debtChapter);
const legacyDebtIndex = html.indexOf("Debt / Financing Context", debtChapter);
ok(debtChapter >= 0, "debt chapter remains");
ok(eliteIndex > debtChapter, "ELITE-07 is inside debt chapter");
ok(legacyDebtIndex === -1, "duplicate legacy debt detail is suppressed when ELITE-07 renders");

for (const marker of [
  'data-iq-elite-chapter1="true"',
  'data-iq-elite-operating=',
  'data-iq-chapter="scenario-underwriting-drivers"',
  'data-iq-elite-driver-section=',
  'data-iq-elite="transaction-diligence-v1"',
]) {
  match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `prior ELITE marker survives: ${marker}`);
}

const htmlWithoutSoftBreaks = String(html || "").replace(/<wbr\s*\/?\s*>/gi, "");

for (const filename of [
  "Institutional_T12_Operating_Statement_With_Long_Source_Name.xlsx",
  "Institutional_Rent_Roll_With_Long_Source_Name.xlsx",
  "Institutional_Acquisition_Assumptions_With_Long_Source_Name.pdf",
  "Institutional_Current_Debt_Statement_With_Long_Source_Name.pdf",
  "Institutional_Capital_Plan_With_Long_Source_Name.pdf",
]) {
  eq(occurrences(htmlWithoutSoftBreaks, filename), 1, `${filename} remains source-register-only`);
}

const eliteMatch = html.match(/<section class="section" data-iq-elite="debt-intelligence-v1">([\s\S]*?)<\/section>/i);
ok(Boolean(eliteMatch), "ELITE-07 section extractable");
const eliteHtml = eliteMatch?.[0] || "";
noMatch(eliteHtml, /\.(?:pdf|xlsx?|csv)\b/i, "ELITE-07 repeats no filenames");
noMatch(eliteHtml, /customerSurfaceModel|canonical_source_truth_package|sourceBacked|raw parser/i, "ELITE-07 leaks no internal authority language");
noMatch(eliteHtml, /[—–]/, "ELITE-07 customer punctuation normalized");
noMatch(eliteHtml, /high risk|moderate risk|low risk/i, "ELITE-07 creates no risk grade");
noMatch(eliteHtml, /\brefinance\b|\brefi\b/i, "ELITE-07 creates no forbidden refinance/refi surface");
noMatch(eliteHtml, /\bBreak[- ]Even Occupancy\b/i, "ELITE-07 does not collide with canonical Break-Even Occupancy label");
match(eliteHtml, /Debt-Inclusive Occupancy Coverage Point/i, "ELITE-07 uses distinct debt-inclusive occupancy coverage terminology");
match(eliteHtml, /Amortization Remaining/i, "unique current amortization detail survives legacy suppression");
match(eliteHtml, /Monthly Payment/i, "unique current monthly payment survives legacy suppression");
match(eliteHtml, /Maturity Date/i, "unique maturity date survives legacy suppression");
const authorityScan = stripGovernedRecommendationDisclaimers(text);
noMatch(authorityScan, /\bBUY\b|\bSELL\b|\bHOLD\b|FINAL RECOMMENDATION|INVESTMENT RECOMMENDATION/i, "ELITE stack creates no recommendation authority");

console.log(`PASS full-underwriting-debt-intelligence-institutional-regression (${checks}/${checks})`);
