import assert from "node:assert/strict";
import fs from "node:fs";

const documentPath = new URL("../../api/_lib/acquisition-memo-v2-document.js", import.meta.url);
const source = fs.readFileSync(documentPath, "utf8");
let assertions = 0;
function check(condition, message) {
  assertions += 1;
  assert.ok(condition, message);
}

check(source.includes('from "./full-underwriting-valuation-reconciliation-v1.js"'), "valuation engine import wired");
check(source.includes('from "./full-underwriting-valuation-reconciliation-renderer.js"'), "valuation renderer import wired");
check(source.includes("buildFullUnderwritingValuationReconciliationV1({"), "valuation engine invoked");
check(source.includes("renderFullUnderwritingValuationReconciliation(eliteValuationReconciliationModel)"), "valuation renderer invoked");
check(source.includes("const eliteValuationReconciliationModel"), "valuation model variable present");
check(source.includes("const eliteValuationReconciliationSection"), "valuation section variable present");
check(source.includes('data-iq-chapter="valuation-reconciliation"'), "valuation chapter preserved");
check(source.includes("eliteValuationReconciliationSection || (capRateValueSection ?"), "ELITE-08 replaces legacy cap-rate block only when supported");

const chapterIndex = source.indexOf('data-iq-chapter="valuation-reconciliation"');
const eliteSectionIndex = source.indexOf("eliteValuationReconciliationSection ||", chapterIndex);
const appraisalIndex = source.indexOf('eliteValuationReconciliationModel?.appraisalComparison?.supported ? "" : appraisalContextSection', chapterIndex);
const reconciliationIndex = source.indexOf("${coreReconciliationAnalysisSection}", chapterIndex);
check(chapterIndex >= 0, "valuation chapter located");
check(eliteSectionIndex > chapterIndex, "ELITE-08 is inside valuation chapter");
check(appraisalIndex > eliteSectionIndex, "legacy appraisal context remains a downstream fallback when ELITE-08 cannot reconcile appraisal value");
check(reconciliationIndex > appraisalIndex, "core source reconciliation remains preserved after the ELITE-08 appraisal fallback");
check(source.includes("appraisalComparison?.supported"), "duplicate appraisal presentation is suppressed only when ELITE-08 owns the comparison surface");

check(!source.includes("ELITE-08_SCENARIO_RATE_POINTS"), "no second scenario-rate authority introduced");
check(!source.includes("buildValuationExit"), "no unsupported forward-return model wiring");

console.log(`PASS full-underwriting-valuation-reconciliation-document-wiring-smoke (${assertions}/${assertions})`);
