import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const screeningRendererSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");

assert.match(reportSource, /import \{ runAcquisitionMemoV2Pipeline \} from "\.\/_lib\/acquisition-memo-v2-pipeline\.js";/);
assert.match(reportSource, /import \{ runScreeningReportPipeline \} from "\.\/_lib\/screening-report-pipeline\.js";/);
assert.match(reportSource, /import \* as screeningReportRenderer from "\.\/_lib\/screening-report-renderer\.js";/);

assert.match(reportSource, /const isScreeningSealedLaneHarness = effectiveReportMode === "screening_v1";/);
assert.match(reportSource, /const isSealedCustomerOutputHarness = Boolean\(acquisitionMemoV2OwnsFinalHtml \|\| isScreeningSealedLaneHarness\);/);
assert.match(reportSource, /const harnessDocumentTreatmentHtml = isSealedCustomerOutputHarness\s*\?\s*""\s*:\s*buildDocumentTreatmentSummaryHtml/s);
assert.match(reportSource, /else if \(!isSealedCustomerOutputHarness && typeof htmlString === "string" && htmlString\.includes\("<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->"\)\)/);

assert.match(reportSource, /const isAcqMemoV2FinalHtml = effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled/);
assert.match(reportSource, /const isScreeningSealedLane = effectiveReportMode === "screening_v1";/);
assert.match(reportSource, /const isSealedCustomerOutput = Boolean\(isAcqMemoV2FinalHtml \|\| isScreeningSealedLane\);/);

const firstFinalGuard = reportSource.indexOf("const qaHtmlBeforeFinalSourceReconciliationGuard = qaHtml;");
const firstFinalGuardCondition = reportSource.slice(reportSource.lastIndexOf("if (", firstFinalGuard), firstFinalGuard);
assert.match(firstFinalGuardCondition, /!isSealedCustomerOutput/);

const docFinalGuard = reportSource.indexOf("const docFinalSourceReconciliationGuard = applyFinalSourceReconciliationRenderGuard");
const docFinalGuardCondition = reportSource.slice(reportSource.lastIndexOf("if (", docFinalGuard), docFinalGuard);
assert.match(docFinalGuardCondition, /!isSealedCustomerOutput/);

const screeningDispatchAnchor = reportSource.indexOf("runScreeningReportPipeline({");
const v2DispatchAnchor = reportSource.indexOf("runAcquisitionMemoV2Pipeline({");
assert.ok(screeningDispatchAnchor >= 0, "Missing Screening lane dispatch");
assert.ok(v2DispatchAnchor >= 0, "Missing Acquisition Memo V2 lane dispatch");
assert.match(reportSource, /screeningReportRenderer\.resolveScreeningClassificationConsumerLabel\(/);
assert.match(reportSource, /screeningReportRenderer\.sanitizeScreeningRankedDriversHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningIncomeForensicsHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningExpenseStructureHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningNoiStabilityHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningRentRollDistributionHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningDataCoverageSummary\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningRefiSufficiencyTable\(/);
assert.match(reportSource, /function assertSealedOutputImmutable\(/);
assert.match(reportSource, /screeningLaneOutput = assertSealedOutputImmutable\(/);
assert.match(reportSource, /acquisitionMemoV2Finalization = assertSealedOutputImmutable\(/);
assert.match(reportSource, /sealedCustomerOutput: true/);

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

const routeSuccessAnchors = [...reportSource.matchAll(/success:\s*true/g)].map((match) => match.index);
assert.ok(routeSuccessAnchors.length >= 1, "Expected at least one success response");

const finalHarnessPipelineAnchor = reportSource.indexOf("const finalHarnessBossCompliance = acquisitionMemoV2Finalization || await runAcquisitionMemoV2Pipeline({");
const fullHtmlSuccessAnchor = reportSource.indexOf("boss_compliance: acquisitionMemoV2Finalization?.bossCompliance || acquisitionMemoV2Finalization?.compliance || null", finalHarnessPipelineAnchor);
assert.ok(finalHarnessPipelineAnchor >= 0, "V2 full-html success must run through the V2 pipeline");
assert.ok(fullHtmlSuccessAnchor > finalHarnessPipelineAnchor, "V2 full-html success must expose post-pipeline compliance");

const sealedOutputTerms = [
  "sealedLane: \"screening_lane\"",
  "sealedLane: \"acquisition_memo_v2_lane\"",
];
for (const term of sealedOutputTerms) {
  const path = term.includes("screening")
    ? "api/_lib/screening-report-pipeline.js"
    : "api/_lib/acquisition-memo-v2-pipeline.js";
  assert.equal(fs.readFileSync(path, "utf8").includes(term), true, `Missing ${term} in ${path}`);
}

const forbiddenRouteAuthorityAfterSealedOutput = reportSource.slice(reportSource.search(/\b(?:const|let)\s+screeningLaneOutput\s*=/));
assert.equal(/if \(!isAcqMemoV2FinalHtml\)\s*\{[\s\S]*applyFinalSourceReconciliationRenderGuard/.test(forbiddenRouteAuthorityAfterSealedOutput), false);
assert.equal(/if \(!isAcqMemoV2FinalHtml\)\s*\{[\s\S]*applyFinalSectionHealRenderGuards/.test(forbiddenRouteAuthorityAfterSealedOutput), false);
assert.equal(/if \(!isAcqMemoV2FinalHtml\)\s*\{[\s\S]*buildDocumentTreatmentSummaryHtml/.test(forbiddenRouteAuthorityAfterSealedOutput), false);
assert.match(screeningRendererSource, /export function resolveScreeningClassificationConsumerLabel/);
assert.match(screeningRendererSource, /export function sanitizeScreeningRankedDriversHtml/);

console.log("generate-client-report-sealed-dispatcher-smoke: ok");
