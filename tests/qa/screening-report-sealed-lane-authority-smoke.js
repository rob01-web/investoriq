import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const screeningPipelineSource = fs.readFileSync("api/_lib/screening-report-pipeline.js", "utf8");
const screeningRendererSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");

assert.match(reportSource, /import \{ runScreeningReportPipeline \} from "\.\/_lib\/screening-report-pipeline\.js";/);
assert.match(reportSource, /import \* as screeningReportRenderer from "\.\/_lib\/screening-report-renderer\.js";/);
assert.match(reportSource, /const isScreeningSealedLane = effectiveReportMode === "screening_v1";/);
assert.match(reportSource, /const isSealedCustomerOutput = Boolean\(isAcqMemoV2FinalHtml \|\| isScreeningSealedLane\);/);
assert.match(reportSource, /if \(!isSealedCustomerOutput\) \{\s*const qaHtmlBeforeFinalSourceReconciliationGuard = qaHtml;/s);
assert.match(reportSource, /if \(!isSealedCustomerOutput\) \{\s*const docFinalSourceReconciliationGuard = legacyOnlyApplyFinalSourceReconciliationRenderGuard/s);
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

const screeningLaneAnchor = reportSource.search(/\b(?:const|let)\s+screeningLaneOutput\s*=/);
const screeningPipelineCallAnchor = reportSource.indexOf("runScreeningReportPipeline({", screeningLaneAnchor);
const screeningSealedQaAssignmentAnchor = reportSource.search(/qaHtml = screeningLaneOutput\.qaHtml \|\| screeningLaneOutput\.html;/);
const acquisitionTreatmentAnchor = reportSource.indexOf("const richerDocumentTreatmentHtml = buildAcquisitionMemoV2DocumentTreatmentSummaryHtmlLane({", screeningLaneAnchor);
const v2FinalAssignmentAnchor = reportSource.indexOf("finalHtml = acquisitionMemoV2Finalization?.html || finalHtml;", screeningLaneAnchor);

assert.ok(screeningLaneAnchor >= 0, "Missing Screening sealed lane output anchor");
assert.ok(screeningPipelineCallAnchor > screeningLaneAnchor, "Missing Screening sealed lane pipeline call");
assert.ok(screeningSealedQaAssignmentAnchor > screeningPipelineCallAnchor, "Screening qaHtml must come from Screening lane output");
assert.ok(acquisitionTreatmentAnchor > screeningSealedQaAssignmentAnchor, "Acquisition document treatment block must occur after Screening lane output");
assert.ok(v2FinalAssignmentAnchor > screeningSealedQaAssignmentAnchor, "V2 final assignment must occur after Screening lane output");
assert.match(reportSource, /screeningReportRenderer\.buildScreeningCustomerOutput\(/);

const treatmentConditionStart = reportSource.lastIndexOf("if (", acquisitionTreatmentAnchor);
const treatmentConditionSlice = reportSource.slice(treatmentConditionStart, acquisitionTreatmentAnchor);
assert.match(treatmentConditionSlice, /effectiveReportMode !== "screening_v1"/);
assert.match(treatmentConditionSlice, /!\(\s*effectiveReportMode === "v1_core"[\s\S]*acqMemoV2SourceAuthorityEnabled[\s\S]*acquisitionMemoV2Bridge\?\.renderedAcquisitionMemo[\s\S]*\)/);

const finalQaGuardAnchor = reportSource.indexOf("const qaHtmlBeforeFinalSourceReconciliationGuard = qaHtml;");
const finalQaGuardCondition = reportSource.slice(reportSource.lastIndexOf("if (", finalQaGuardAnchor), finalQaGuardAnchor);
assert.match(finalQaGuardCondition, /!isSealedCustomerOutput/);

const finalDocGuardAnchor = reportSource.indexOf("const docFinalSourceReconciliationGuard = legacyOnlyApplyFinalSourceReconciliationRenderGuard");
const finalDocGuardCondition = reportSource.slice(
  reportSource.lastIndexOf("if (!isSealedCustomerOutput)", finalDocGuardAnchor),
  finalDocGuardAnchor
);
assert.match(finalDocGuardCondition, /!isSealedCustomerOutput/);

assert.equal(/acquisition-memo-v2/i.test(screeningPipelineSource), false);
assert.equal(/Boss|CustomerSurfaceModel|AcquisitionMemo/i.test(screeningPipelineSource), false);
assert.match(screeningPipelineSource, /sealedLane: "screening_lane"/);
assert.match(screeningPipelineSource, /sealedCustomerOutput: true/);
assert.match(screeningRendererSource, /export function buildScreeningCustomerOutput/);
assert.match(screeningRendererSource, /export function resolveScreeningClassificationConsumerLabel/);
assert.match(screeningRendererSource, /export function sanitizeScreeningRankedDriversHtml/);
assert.match(screeningRendererSource, /export function buildScreeningDataCoverageSummary/);
assert.match(screeningRendererSource, /export function buildScreeningIncomeForensicsHtml/);
assert.match(screeningRendererSource, /export function buildScreeningExpenseStructureHtml/);
assert.match(screeningRendererSource, /export function buildScreeningNoiStabilityHtml/);
assert.match(screeningRendererSource, /export function buildScreeningRentRollDistributionHtml/);
assert.match(screeningRendererSource, /export function buildScreeningRefiSufficiencyTable/);

const forbiddenScreeningCrossTouchPatterns = [
  /runAcquisitionMemoV2Pipeline/,
  /finalizeAcquisitionMemoV2Html/,
  /buildAcquisitionMemoV2CustomerSurfaceModel/,
  /validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel/,
  /buildAcquisitionMemoBossContract/,
];
for (const pattern of forbiddenScreeningCrossTouchPatterns) {
  assert.equal(pattern.test(screeningPipelineSource), false, `Screening lane imports or calls ${pattern}`);
}

console.log("screening-report-sealed-lane-authority-smoke: ok");
