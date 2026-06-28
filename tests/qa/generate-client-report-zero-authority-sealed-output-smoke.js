import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const handlerSource = fs.readFileSync("api/_lib/generate-client-report-handler.js", "utf8");
const screeningRendererSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");
const v2PipelineSource = fs.readFileSync("api/_lib/acquisition-memo-v2-pipeline.js", "utf8");

assert.equal(reportSource.trim(), 'import handler from "./_lib/generate-client-report-handler.js";\n\nexport default handler;');
assert.match(handlerSource, /import implHandler from "\.\/generate-client-report-impl\.js";/);
assert.match(handlerSource, /export default async function handler\(req, res\) \{\s*return implHandler\(req, res\);\s*\}/s);
assert.equal(reportSource.includes("__test__"), false);
assert.equal(reportSource.includes("assertSealedOutputImmutable"), false);
assert.equal(reportSource.includes("sealedCustomerOutput"), false);
assert.match(v2PipelineSource, /sealedCustomerOutput: true/);
assert.match(v2PipelineSource, /sealedLane: "acquisition_memo_v2_lane"/);

const activeRouteOwnedScreeningHelperSnippets = [
  "function resolveScreeningClassificationConsumerLabel",
  "function sanitizeScreeningRankedDriversHtml",
  "function buildScreeningRefiSufficiencyTable",
  "function buildScreeningDataCoverageSummary",
  "function buildScreeningIncomeForensicsHtml",
  "function buildScreeningExpenseStructureHtml",
  "function buildScreeningNoiStabilityHtml",
  "function buildScreeningRentRollDistributionHtml",
];
for (const snippet of activeRouteOwnedScreeningHelperSnippets) {
  assert.equal(reportSource.includes(snippet), false, `Route still defines active Screening helper: ${snippet}`);
}

const legacyOnlyRouteOwnedScreeningHelperSnippets = [
  "function legacyOnlyBuildScreeningDataCoverageSummary",
  "function legacyOnlyBuildScreeningIncomeForensicsHtml",
  "function legacyOnlyBuildScreeningExpenseStructureHtml",
  "function legacyOnlyBuildScreeningNoiStabilityHtml",
  "function legacyOnlyBuildScreeningRentRollDistributionHtml",
];
for (const snippet of legacyOnlyRouteOwnedScreeningHelperSnippets) {
  assert.equal(reportSource.includes(snippet), false, `Route wrapper should not define Screening helper: ${snippet}`);
}

assert.match(screeningRendererSource, /export function resolveScreeningClassificationConsumerLabel/);
assert.match(screeningRendererSource, /export function sanitizeScreeningRankedDriversHtml/);
assert.match(screeningRendererSource, /export function buildScreeningRefiSufficiencyTable/);
assert.match(screeningRendererSource, /export function buildScreeningDataCoverageSummary/);
assert.match(screeningRendererSource, /export function buildScreeningIncomeForensicsHtml/);
assert.match(screeningRendererSource, /export function buildScreeningExpenseStructureHtml/);
assert.match(screeningRendererSource, /export function buildScreeningNoiStabilityHtml/);
assert.match(screeningRendererSource, /export function buildScreeningRentRollDistributionHtml/);
assert.equal(reportSource.includes("runScreeningReportPipeline"), false);
assert.equal(reportSource.includes("runAcquisitionMemoV2Pipeline"), false);
assert.equal(reportSource.includes("buildDocumentTreatmentSummaryHtml"), false);

console.log("generate-client-report-zero-authority-sealed-output-smoke: ok");
