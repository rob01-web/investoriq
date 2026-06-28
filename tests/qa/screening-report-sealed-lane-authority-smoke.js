import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const handlerSource = fs.readFileSync("api/_lib/generate-client-report-handler.js", "utf8");
const implSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const screeningPipelineSource = fs.readFileSync("api/_lib/screening-report-pipeline.js", "utf8");
const screeningRendererSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");

assert.match(reportSource, /import handler from "\.\/_lib\/generate-client-report-handler\.js";/);
assert.match(reportSource, /export default handler;/);
assert.equal(reportSource.includes("runScreeningReportPipeline"), false, "Public route must not own Screening pipeline authority");
assert.equal(reportSource.includes("screeningReportRenderer"), false, "Public route must not own Screening rendering authority");
assert.equal(reportSource.includes("__test__"), false, "Public route must not expose __test__");

assert.match(handlerSource, /import implHandler from "\.\/generate-client-report-impl\.js";/);
assert.match(handlerSource, /export default async function handler\(req, res\)/);
assert.equal(handlerSource.includes("runScreeningReportPipeline"), false, "Handler wrapper must not own Screening pipeline authority");
assert.equal(handlerSource.includes("screeningReportRenderer"), false, "Handler wrapper must not own Screening rendering authority");
assert.equal(handlerSource.includes("__test__"), false, "Internal handler wrapper must not expose __test__");

assert.match(implSource, /const isScreeningSealedLane = effectiveReportMode === "screening_v1";/);
assert.match(implSource, /const isSealedCustomerOutput = Boolean\(isAcqMemoV2FinalHtml \|\| isScreeningSealedLane\);/);
assert.match(implSource, /if \(!isSealedCustomerOutput\) \{\s*const qaHtmlBeforeFinalSourceReconciliationGuard = qaHtml;/s);
assert.match(implSource, /screeningReportRenderer\.resolveScreeningClassificationConsumerLabel\(/);
assert.match(implSource, /screeningReportRenderer\.sanitizeScreeningRankedDriversHtml\(/);
assert.match(implSource, /screeningReportRenderer\.buildScreeningIncomeForensicsHtml\(/);
assert.match(implSource, /screeningReportRenderer\.buildScreeningExpenseStructureHtml\(/);
assert.match(implSource, /screeningReportRenderer\.buildScreeningNoiStabilityHtml\(/);
assert.match(implSource, /screeningReportRenderer\.buildScreeningRentRollDistributionHtml\(/);
assert.match(implSource, /screeningReportRenderer\.buildScreeningDataCoverageSummary\(/);
assert.match(implSource, /screeningReportRenderer\.buildScreeningRefiSufficiencyTable\(/);
assert.match(implSource, /function assertSealedOutputImmutable\(/);
assert.match(implSource, /screeningLaneOutput = assertSealedOutputImmutable\(/);
assert.match(implSource, /sealedCustomerOutput: true/);

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
  assert.equal(implSource.includes(snippet), false, `Impl still defines active Screening helper: ${snippet}`);
}

const screeningLaneAnchor = implSource.search(/\b(?:const|let)\s+screeningLaneOutput\s*=/);
const screeningPipelineCallAnchor = implSource.indexOf("runScreeningReportPipeline({", screeningLaneAnchor);
const screeningSealedQaAssignmentAnchor = implSource.search(/qaHtml = screeningLaneOutput\.qaHtml \|\| screeningLaneOutput\.html;/);
const acquisitionTreatmentAnchor = implSource.indexOf("const richerDocumentTreatmentHtml = buildAcquisitionMemoV2DocumentTreatmentSummaryHtmlLane({", screeningLaneAnchor);
const v2FinalAssignmentAnchor = implSource.indexOf("finalHtml = acquisitionMemoV2Finalization?.html || finalHtml;", screeningLaneAnchor);

assert.ok(screeningLaneAnchor >= 0, "Missing Screening sealed lane output anchor");
assert.ok(screeningPipelineCallAnchor > screeningLaneAnchor, "Missing Screening sealed lane pipeline call");
assert.ok(screeningSealedQaAssignmentAnchor > screeningPipelineCallAnchor, "Screening qaHtml must come from Screening lane output");
assert.ok(acquisitionTreatmentAnchor > screeningSealedQaAssignmentAnchor, "Acquisition document treatment block must occur after Screening lane output");
assert.ok(v2FinalAssignmentAnchor > screeningSealedQaAssignmentAnchor, "V2 final assignment must occur after Screening lane output");
assert.match(implSource, /screeningReportRenderer\.buildScreeningCustomerOutput\(/);

const treatmentConditionStart = implSource.lastIndexOf("if (", acquisitionTreatmentAnchor);
const treatmentConditionSlice = implSource.slice(treatmentConditionStart, acquisitionTreatmentAnchor);
assert.match(treatmentConditionSlice, /effectiveReportMode !== "screening_v1"/);
assert.match(treatmentConditionSlice, /!\(\s*effectiveReportMode === "v1_core"[\s\S]*acqMemoV2SourceAuthorityEnabled[\s\S]*acquisitionMemoV2Bridge\?\.renderedAcquisitionMemo[\s\S]*\)/);

const finalQaGuardAnchor = implSource.indexOf("const qaHtmlBeforeFinalSourceReconciliationGuard = qaHtml;");
const finalQaGuardCondition = implSource.slice(implSource.lastIndexOf("if (", finalQaGuardAnchor), finalQaGuardAnchor);
assert.match(finalQaGuardCondition, /!isSealedCustomerOutput/);

const finalDocGuardAnchor = implSource.indexOf("const docFinalSourceReconciliationGuard = applyAcquisitionMemoV2SourceReconciliationRenderGuard(");
const finalDocGuardCondition = implSource.slice(
  implSource.lastIndexOf("if (!isSealedCustomerOutput)", finalDocGuardAnchor),
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
