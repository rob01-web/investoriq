import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyPhase7DecisionSupport,
  phase7DecisionSupportMetadata,
} from "../../api/_lib/phase7-decision-support.js";
import { runScreeningReportPipeline } from "../../api/_lib/screening-report-pipeline.js";
import { polishFullUnderwritingFinalHtml } from "../../api/_lib/full-underwriting-final-surgical-polish.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "api/_lib/phase7-decision-support.js"), "utf8");
const screeningPipelineSource = fs.readFileSync(path.join(root, "api/_lib/screening-report-pipeline.js"), "utf8");
const underwritingPolishSource = fs.readFileSync(path.join(root, "api/_lib/full-underwriting-final-surgical-polish.js"), "utf8");

function section(title) {
  return `<section class="section"><div class="section-header"><span class="section-header-title">${title}</span></div></section>`;
}

const renderedDecisionDrivers = `<div class="exec-bullet-block"><p class="exec-major-heading">Key Upside Drivers</p><ul><li>Existing source-backed upside</li></ul></div>
<div class="exec-bullet-block"><p class="exec-major-heading">Primary Constraints</p><ul><li>Existing source-backed constraint</li></ul></div>`;

const decisionDrivers = `
<!-- BEGIN EXEC_UPSIDE_BULLETS -->
<div class="exec-bullet-block"><p class="exec-major-heading">Key Upside Drivers</p><ul><li>Existing source-backed upside</li></ul></div>
<!-- END EXEC_UPSIDE_BULLETS -->
<!-- BEGIN EXEC_RISK_BULLETS -->
<div class="exec-bullet-block"><p class="exec-major-heading">Primary Constraints</p><ul><li>Existing source-backed constraint</li></ul></div>
<!-- END EXEC_RISK_BULLETS -->`;

const screeningHtml = `<!doctype html><html><head></head><body><div class="report-container">
<section class="section"><div class="section-header"><span class="section-header-title">Executive Summary</span></div>${decisionDrivers}</section>
<!-- END SECTION_0_5 -->
${section("Operating Evidence")}
${section("Rent Roll Analysis")}
${section("Source Reconciliation")}
</div></body></html>`;

const screening = applyPhase7DecisionSupport(screeningHtml, { reportMode: "screening_v1" });
assert.match(screening, /data-iq-phase7-decision-drivers="elite-decision-support-v1"/);
assert.match(screening, />What Changes the Decision</);
assert.match(screening, /data-iq-phase7-evidence-matrix="elite-decision-support-v1"/);
assert.match(screening, />Evidence Conviction Matrix</);
assert.match(screening, />Decision framing</);
assert.match(screening, />Operating evidence</);
assert.match(screening, />Rent roll evidence</);
assert.match(screening, />Source reconciliation</);
assert.match(screening, /Executive Summary/);
assert.match(screening, /Operating Evidence/);
assert.match(screening, /Rent Roll Analysis/);
assert.match(screening, /Source Reconciliation/);
assert.doesNotMatch(screening, /Not provided/i);
assert.equal(applyPhase7DecisionSupport(screening, { reportMode: "screening_v1" }), screening, "decision support must be idempotent");

const commentlessScreeningHtml = `<!doctype html><html><head></head><body><div class="report-container">
<section class="section"><div class="section-header"><span class="section-header-title">Executive Summary</span></div>${renderedDecisionDrivers}</section>
${section("Operating Evidence")}
${section("Rent Roll Analysis")}
</div></body></html>`;
const commentlessScreening = applyPhase7DecisionSupport(commentlessScreeningHtml, { reportMode: "screening_v1" });
assert.match(commentlessScreening, /data-iq-phase7-decision-drivers="elite-decision-support-v1"/);
assert.match(commentlessScreening, />What Changes the Decision</);
assert.match(commentlessScreening, /Existing source-backed upside/);
assert.match(commentlessScreening, /Existing source-backed constraint/);

const underwritingHtml = `<!doctype html><html><head></head><body><div class="report-container">
<section class="section"><div class="section-header"><span class="section-header-title">Executive Summary</span></div>${decisionDrivers}</section>
<!-- END SECTION_0_5 -->
${section("Operating Profile")}
${section("Rent Roll Analysis")}
${section("Transaction Context")}
${section("Debt Context")}
${section("Valuation Context")}
${section("Scenario Analysis")}
${section("Capital Plan")}
${section("Methodology &amp; Data Transparency")}
</div></body></html>`;

const underwriting = applyPhase7DecisionSupport(underwritingHtml, { reportMode: "full_underwriting" });
for (const expected of [
  "Decision framing",
  "Operating evidence",
  "Rent roll evidence",
  "Transaction context",
  "Debt context",
  "Valuation context",
  "Scenario evidence",
  "Capital context",
  "Diligence and source trust",
]) {
  assert.match(underwriting, new RegExp(`>${expected}<`));
}
assert.match(underwriting, /Methodology &amp; Data Transparency/);

assert.deepEqual(phase7DecisionSupportMetadata("screening_v1"), {
  marker: "elite-decision-support-v1",
  lane: "screening",
  sourcePresentOnly: true,
  addsFinancialMetrics: false,
  addsUnderwritingAssumptions: false,
  scoresSourceQuality: false,
  infersMissingEvidence: false,
});
assert.equal(phase7DecisionSupportMetadata("full_underwriting").lane, "underwriting");

const sealedScreening = runScreeningReportPipeline({
  finalHtml: screeningHtml,
  reportMode: "screening_v1",
  sourceTruthRequired: false,
  deterministicContractQaSeal: { ok: true, issues: [] },
});
assert.equal(sealedScreening.sealedCustomerOutput, true);
assert.match(sealedScreening.html, /Evidence Conviction Matrix/);
assert.match(sealedScreening.html, /What Changes the Decision/);

const polishedUnderwriting = polishFullUnderwritingFinalHtml(underwritingHtml, { reportMode: "full_underwriting" });
assert.match(polishedUnderwriting, /Evidence Conviction Matrix/);
assert.match(polishedUnderwriting, /What Changes the Decision/);

assert.match(screeningPipelineSource, /applyPhase7DecisionSupport\(presentationHtml, \{ reportMode \}\)/);
assert.match(underwritingPolishSource, /applyPhase7DecisionSupport\(elitePresented, \{ reportMode \}\)/);

for (const forbiddenMetric of [
  /\bIRR\b/,
  /\bMOIC\b/,
  /\bDCF\b/,
  /terminal value/i,
  /exit cap/i,
  /waterfall return/i,
  /renovation ROI/i,
  /\bBUY\b/,
  /\bSELL\b/,
  /\bHOLD\b/,
]) {
  assert.doesNotMatch(source, forbiddenMetric, "Phase 7 decision support must not introduce unauthorized analytics");
}

assert.doesNotMatch(source, /[\u2013\u2014]/, "Phase 7 customer-facing decision support must not contain en or em dashes");
assert.match(source, /does not independently score source quality, infer missing evidence, or create new underwriting assumptions/);

console.log("phase7-decision-support-smoke: PASS");
