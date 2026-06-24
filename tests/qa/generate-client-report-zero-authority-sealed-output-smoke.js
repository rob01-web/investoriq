import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const screeningRendererSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");
const v2PipelineSource = fs.readFileSync("api/_lib/acquisition-memo-v2-pipeline.js", "utf8");

assert.match(reportSource, /function assertSealedOutputImmutable\(/);
assert.match(reportSource, /screeningLaneOutput = assertSealedOutputImmutable\(/);
assert.match(reportSource, /acquisitionMemoV2Finalization = assertSealedOutputImmutable\(/);
assert.match(reportSource, /sealedCustomerOutput: true/);
assert.match(v2PipelineSource, /sealedCustomerOutput: true/);

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
  assert.equal(reportSource.includes(snippet), true, `Expected legacy-only quarantine for ${snippet}`);
}

assert.match(screeningRendererSource, /export function resolveScreeningClassificationConsumerLabel/);
assert.match(screeningRendererSource, /export function sanitizeScreeningRankedDriversHtml/);
assert.match(screeningRendererSource, /export function buildScreeningRefiSufficiencyTable/);
assert.match(screeningRendererSource, /export function buildScreeningDataCoverageSummary/);
assert.match(screeningRendererSource, /export function buildScreeningIncomeForensicsHtml/);
assert.match(screeningRendererSource, /export function buildScreeningExpenseStructureHtml/);
assert.match(screeningRendererSource, /export function buildScreeningNoiStabilityHtml/);
assert.match(screeningRendererSource, /export function buildScreeningRentRollDistributionHtml/);

console.log("generate-client-report-zero-authority-sealed-output-smoke: ok");
