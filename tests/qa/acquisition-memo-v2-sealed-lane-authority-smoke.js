import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const pipelineSource = fs.readFileSync("api/_lib/acquisition-memo-v2-pipeline.js", "utf8");
const orchestratorSource = fs.readFileSync("api/_lib/acquisition-memo-v2-orchestrator.js", "utf8");
const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const roleReconcilerSource = fs.readFileSync("api/_lib/acquisition-memo-v2-role-reconciler.js", "utf8");
const bossRepairSource = fs.readFileSync("api/_lib/acquisition-memo-v2-boss-repair.js", "utf8");

assert.match(reportSource, /import \{ runAcquisitionMemoV2Pipeline \} from "\.\/_lib\/acquisition-memo-v2-pipeline\.js";/);
assert.equal(
  reportSource.includes("buildAcquisitionMemoV2FinalDeliveryDecision("),
  false,
  "Route must not build the final V2 delivery decision"
);
for (const snippet of [
  "function buildCanonicalSupportDocAuthorityRows",
  "function buildDocumentTreatmentSummaryHtml",
  "function buildPreliminaryFinancingReadinessSummaryHtml",
  "function buildAcquisitionFinancingAssumptionsHtml",
  "function buildAcquisitionFinancingReadinessHtml",
  "function applyFinalSourceReconciliationRenderGuard",
  "function applyFinalSectionHealRenderGuards",
]) {
  assert.equal(reportSource.includes(snippet), false, `Route must not define active Acquisition Memo helper: ${snippet}`);
}
for (const snippet of [
  "function legacyOnlyBuildCanonicalSupportDocAuthorityRows",
  "function legacyOnlyBuildDocumentTreatmentSummaryHtml",
  "function legacyOnlyBuildPreliminaryFinancingReadinessSummaryHtml",
  "function legacyOnlyBuildAcquisitionFinancingAssumptionsHtml",
  "function legacyOnlyBuildAcquisitionFinancingReadinessHtml",
  "function legacyOnlyApplyFinalSourceReconciliationRenderGuard",
  "function legacyOnlyApplyFinalSectionHealRenderGuards",
]) {
  assert.equal(reportSource.includes(snippet), false, `Route must not retain detached legacy helper definition: ${snippet}`);
}
assert.match(pipelineSource, /finalizeAcquisitionMemoV2Html/);
assert.match(pipelineSource, /sealedLane: "acquisition_memo_v2_lane"/);
assert.match(pipelineSource, /acquisitionMemoV2OwnsFinalHtml: true/);

assert.match(orchestratorSource, /buildAcquisitionMemoV2CustomerSurfaceModel/);
assert.match(orchestratorSource, /renderCompleteAcquisitionMemoV2Html/);
assert.match(orchestratorSource, /enforceAcquisitionMemoBossContractOnHtml/);
assert.match(orchestratorSource, /validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel/);
assert.match(orchestratorSource, /buildAcquisitionMemoV2BossRepairPlan/);
assert.match(orchestratorSource, /applyAcquisitionMemoV2BossRepairPlan/);

assert.match(documentSource, /customerSurfaceModel/);
assert.match(documentSource, /renderDocumentTreatmentSection\([\s\S]*customerSurfaceModel/);
assert.match(roleReconcilerSource, /semantic_doc_role/);
assert.match(roleReconcilerSource, /canonicalRole/);
assert.match(roleReconcilerSource, /acceptedSourceTruth/);
assert.match(bossRepairSource, /forbiddenSurface/);

const fullHarnessV2Anchor = reportSource.indexOf("if (acquisitionMemoV2OwnsFinalHtml) {");
const fullHarnessReturnAnchor = reportSource.indexOf("return res.status(200).json", fullHarnessV2Anchor);
assert.ok(fullHarnessV2Anchor >= 0, "Missing full-render V2 sealed output anchor");
assert.ok(fullHarnessReturnAnchor > fullHarnessV2Anchor, "Missing full-render final_html return after V2 anchor");
const fullHarnessV2Slice = reportSource.slice(fullHarnessV2Anchor, fullHarnessReturnAnchor);
assert.match(fullHarnessV2Slice, /runAcquisitionMemoV2Pipeline/);
assert.equal(/buildDocumentTreatmentSummaryHtml\(/.test(fullHarnessV2Slice), false);
assert.equal(/replaceMarkedSection\(/.test(fullHarnessV2Slice), false);
assert.equal(/stripMarkedSection\(/.test(fullHarnessV2Slice), false);
assert.equal(/applyFinalSourceReconciliationRenderGuard\(/.test(fullHarnessV2Slice), false);
assert.equal(/applyFinalSectionHealRenderGuards\(/.test(fullHarnessV2Slice), false);
assert.match(fullHarnessV2Slice, /finalHarnessBossCompliance\.finalDeliveryDecision[\s\S]*finalHarnessBossCompliance\.deliveryState[\s\S]*null/);

const finalHtmlAssignmentAnchor = reportSource.indexOf("finalHtml = acquisitionMemoV2Finalization?.html || finalHtml;");
const documentTreatmentAnchor = reportSource.indexOf("const richerDocumentTreatmentHtml = buildAcquisitionMemoV2DocumentTreatmentSummaryHtmlLane({", finalHtmlAssignmentAnchor);
assert.ok(finalHtmlAssignmentAnchor >= 0, "Missing V2 sealed finalHtml assignment");
assert.ok(documentTreatmentAnchor > finalHtmlAssignmentAnchor, "Missing route-level document treatment block after V2 assignment");
const treatmentConditionSlice = reportSource.slice(reportSource.lastIndexOf("if (", documentTreatmentAnchor), documentTreatmentAnchor);
assert.match(treatmentConditionSlice, /effectiveReportMode !== "screening_v1"/);
assert.match(treatmentConditionSlice, /!\(\s*effectiveReportMode === "v1_core"[\s\S]*acqMemoV2SourceAuthorityEnabled[\s\S]*acquisitionMemoV2Bridge\?\.renderedAcquisitionMemo[\s\S]*\)/);

const pdfDocHtmlAnchor = reportSource.indexOf("docHtml = sanitizeTypography(qaHtml);");
const pdfBossGuardAnchor = reportSource.indexOf("const finalBossCompliance = acquisitionMemoV2Finalization ||", pdfDocHtmlAnchor);
const pdfPostAnchor = reportSource.indexOf("pdfResponse = await axios.post(", pdfBossGuardAnchor);
assert.ok(pdfDocHtmlAnchor >= 0, "Missing PDF docHtml anchor");
assert.ok(pdfBossGuardAnchor > pdfDocHtmlAnchor, "V2 Boss/model gate must run after docHtml preparation");
assert.ok(pdfPostAnchor > pdfBossGuardAnchor, "PDF handoff must occur after V2 Boss/model gate");

const pdfSealedGuardSlice = reportSource.slice(pdfDocHtmlAnchor, pdfBossGuardAnchor);
assert.match(pdfSealedGuardSlice, /if \(!isSealedCustomerOutput\)/);
assert.match(pdfSealedGuardSlice, /else if \(isAcqMemoV2FinalHtml\)/);

const postBossToPdfSlice = reportSource.slice(pdfBossGuardAnchor, pdfPostAnchor);
assert.match(postBossToPdfSlice, /finalBossCompliance\.finalDeliveryDecision[\s\S]*finalBossCompliance\.deliveryState[\s\S]*null/);
for (const forbiddenMutation of [
  "buildDocumentTreatmentSummaryHtml(",
  "buildCanonicalSupportDocAuthorityRows(",
  "buildPreliminaryFinancingReadinessSummaryHtml(",
  "buildAcquisitionFinancingAssumptionsHtml(",
  "buildAcquisitionFinancingReadinessHtml(",
  "replaceMarkedSection(",
  "stripMarkedSection(",
  "applyFinalSourceReconciliationRenderGuard(",
  "applyFinalSectionHealRenderGuards(",
]) {
  assert.equal(
    postBossToPdfSlice.includes(forbiddenMutation),
    false,
    `Route-level legacy mutation ${forbiddenMutation} must not run after V2 Boss/model validation`
  );
}

console.log("acquisition-memo-v2-sealed-lane-authority-smoke: ok");
