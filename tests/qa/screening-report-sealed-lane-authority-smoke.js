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
assert.match(reportSource, /if \(!isSealedCustomerOutput\) \{\s*const docFinalSourceReconciliationGuard = applyFinalSourceReconciliationRenderGuard/s);
assert.match(reportSource, /screeningReportRenderer\.resolveScreeningClassificationConsumerLabel\(/);
assert.match(reportSource, /screeningReportRenderer\.sanitizeScreeningRankedDriversHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningIncomeForensicsHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningExpenseStructureHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningNoiStabilityHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningRentRollDistributionHtml\(/);
assert.match(reportSource, /screeningReportRenderer\.buildScreeningDataCoverageSummary\(/);

const screeningLaneAnchor = reportSource.indexOf("const screeningLaneOutput =");
const screeningPipelineCallAnchor = reportSource.indexOf("runScreeningReportPipeline({", screeningLaneAnchor);
const screeningQaAssignmentAnchor = reportSource.indexOf("qaHtml = screeningLaneOutput.html;", screeningPipelineCallAnchor);
const acquisitionTreatmentAnchor = reportSource.indexOf("const richerDocumentTreatmentHtml = buildDocumentTreatmentSummaryHtml({", screeningLaneAnchor);
const v2FinalAssignmentAnchor = reportSource.indexOf("finalHtml = acquisitionMemoV2Finalization?.html || finalHtml;", screeningLaneAnchor);

assert.ok(screeningLaneAnchor >= 0, "Missing Screening sealed lane output anchor");
assert.ok(screeningPipelineCallAnchor > screeningLaneAnchor, "Missing Screening sealed lane pipeline call");
assert.ok(screeningQaAssignmentAnchor > screeningPipelineCallAnchor, "Screening qaHtml must come from Screening lane output");
assert.ok(acquisitionTreatmentAnchor > screeningQaAssignmentAnchor, "Acquisition document treatment block must occur after Screening lane output");
assert.ok(v2FinalAssignmentAnchor > screeningQaAssignmentAnchor, "V2 final assignment must occur after Screening lane output");

const treatmentConditionStart = reportSource.lastIndexOf("if (", acquisitionTreatmentAnchor);
const treatmentConditionSlice = reportSource.slice(treatmentConditionStart, acquisitionTreatmentAnchor);
assert.match(treatmentConditionSlice, /effectiveReportMode !== "screening_v1"/);
assert.match(treatmentConditionSlice, /!\(\s*effectiveReportMode === "v1_core"[\s\S]*acqMemoV2SourceAuthorityEnabled[\s\S]*acquisitionMemoV2Bridge\?\.renderedAcquisitionMemo[\s\S]*\)/);

const finalQaGuardAnchor = reportSource.indexOf("const qaHtmlBeforeFinalSourceReconciliationGuard = qaHtml;");
const finalQaGuardCondition = reportSource.slice(reportSource.lastIndexOf("if (", finalQaGuardAnchor), finalQaGuardAnchor);
assert.match(finalQaGuardCondition, /!isSealedCustomerOutput/);

const finalDocGuardAnchor = reportSource.indexOf("const docFinalSourceReconciliationGuard = applyFinalSourceReconciliationRenderGuard");
const finalDocGuardCondition = reportSource.slice(reportSource.lastIndexOf("if (", finalDocGuardAnchor), finalDocGuardAnchor);
assert.match(finalDocGuardCondition, /!isSealedCustomerOutput/);

assert.equal(/acquisition-memo-v2/i.test(screeningPipelineSource), false);
assert.equal(/Boss|CustomerSurfaceModel|AcquisitionMemo/i.test(screeningPipelineSource), false);
assert.match(screeningPipelineSource, /sealedLane: "screening_lane"/);
assert.match(screeningPipelineSource, /sealedCustomerOutput: true/);
assert.match(screeningRendererSource, /export function resolveScreeningClassificationConsumerLabel/);
assert.match(screeningRendererSource, /export function sanitizeScreeningRankedDriversHtml/);
assert.match(screeningRendererSource, /export function buildScreeningDataCoverageSummary/);
assert.match(screeningRendererSource, /export function buildScreeningIncomeForensicsHtml/);
assert.match(screeningRendererSource, /export function buildScreeningExpenseStructureHtml/);
assert.match(screeningRendererSource, /export function buildScreeningNoiStabilityHtml/);
assert.match(screeningRendererSource, /export function buildScreeningRentRollDistributionHtml/);

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
