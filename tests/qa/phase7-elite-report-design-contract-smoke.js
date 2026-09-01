import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyPhase7EliteReportPresentation,
  phase7EliteReportPresentationMetadata,
} from "../../api/_lib/phase7-elite-report-presentation.js";
import { runScreeningReportPipeline } from "../../api/_lib/screening-report-pipeline.js";
import { polishFullUnderwritingFinalHtml } from "../../api/_lib/full-underwriting-final-surgical-polish.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const presentationSource = fs.readFileSync(path.join(root, "api/_lib/phase7-elite-report-presentation.js"), "utf8");
const screeningPipelineSource = fs.readFileSync(path.join(root, "api/_lib/screening-report-pipeline.js"), "utf8");
const underwritingPolishSource = fs.readFileSync(path.join(root, "api/_lib/full-underwriting-final-surgical-polish.js"), "utf8");
const designAuthority = fs.readFileSync(path.join(root, "docs/PHASE7_ELITE_REPORT_DESIGN_AUTHORITY_2026-09-01.md"), "utf8");

function visibleText(html = "") {
  return String(html || "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const governedSectionMarkup = '<section class="section"><div class="section-header"><span class="section-header-title">Operating Evidence</span><span class="section-header-sub">Uploaded source evidence</span></div><div class="verdict-block"><div class="verdict-label">SCREENING SIGNAL</div><div class="metric-grid"><div class="card no-break"><p class="subsection-title">Operating Snapshot</p><table><tbody><tr><td>NOI</td><td>$945,000</td></tr></tbody></table></div></div></div></section>';
const baseHtml = `<!doctype html><html><head><style>.section{margin:0}</style></head><body>${governedSectionMarkup}</body></html>`;

for (const reportMode of ["screening_v1", "full_underwriting"]) {
  const result = applyPhase7EliteReportPresentation(baseHtml, { reportMode });
  assert.match(result, /investoriq-phase7-elite-report-design/);
  assert.match(result, /data-iq-phase7="elite-report-redesign-v1"/);
  assert.match(result, new RegExp(`iq-phase7-${reportMode === "screening_v1" ? "screening" : "underwriting"}`));
  assert.ok(result.includes(governedSectionMarkup), "Phase 7 styling must preserve governed section/card markup exactly");
  assert.match(result, /\.iq-phase7 \.verdict-block/);
  assert.match(result, /\.iq-phase7 \.section-header/);
  assert.equal(visibleText(result), visibleText(baseHtml), "Phase 7 presentation must preserve customer-visible source text");
  assert.equal(applyPhase7EliteReportPresentation(result, { reportMode }), result, "Phase 7 presentation must be idempotent");
}

const screeningMeta = phase7EliteReportPresentationMetadata("screening_v1");
assert.deepEqual(screeningMeta, {
  marker: "elite-report-redesign-v1",
  lane: "screening",
  evidencePreserving: true,
  hardcodedPageCount: false,
  addsFinancialMetrics: false,
  addsSourceFacts: false,
});

const underwritingMeta = phase7EliteReportPresentationMetadata("full_underwriting");
assert.equal(underwritingMeta.lane, "underwriting");
assert.equal(underwritingMeta.hardcodedPageCount, false);
assert.equal(underwritingMeta.addsFinancialMetrics, false);

const sealedScreening = runScreeningReportPipeline({
  finalHtml: baseHtml,
  reportMode: "screening_v1",
  sourceTruthRequired: false,
  deterministicContractQaSeal: { ok: true, issues: [] },
});
assert.equal(sealedScreening.sealedCustomerOutput, true);
assert.match(sealedScreening.html, /iq-phase7-screening/);
assert.ok(sealedScreening.html.includes(governedSectionMarkup));
assert.equal(visibleText(sealedScreening.html), visibleText(baseHtml));

const underwritingHtml = polishFullUnderwritingFinalHtml(baseHtml, { reportMode: "full_underwriting" });
assert.match(underwritingHtml, /iq-phase7-underwriting/);
assert.ok(underwritingHtml.includes(governedSectionMarkup));
assert.equal(visibleText(underwritingHtml), visibleText(baseHtml));

assert.match(screeningPipelineSource, /applyPhase7EliteReportPresentation\(html, \{ reportMode \}\)/);
assert.match(underwritingPolishSource, /applyPhase7EliteReportPresentation\(paginationReleased, \{ reportMode \}\)/);

for (const forbiddenImplementation of [
  /maxPages/i,
  /minPages/i,
  /targetPages/i,
  /pageCount\s*=/i,
  /truncate.*page/i,
  /pad.*page/i,
]) {
  assert.doesNotMatch(presentationSource, forbiddenImplementation, "Phase 7 must not hardcode report length");
}

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
  assert.doesNotMatch(presentationSource, forbiddenMetric, "Presentation layer must not introduce unauthorized analytics");
}

assert.match(designAuthority, /The uploaded evidence determines the report\. The page count does not determine the evidence\./);
assert.match(designAuthority, /4 to 6 page Screening range and 15 to 20 page Underwriting range are design reference ranges only/i);
assert.match(designAuthority, /Blackstone DHL Tsing Yi Investment Memorandum is a communication and design benchmark, not an analytical authority/i);
assert.match(designAuthority, /InvestorIQ Screening Report/);
assert.match(designAuthority, /InvestorIQ Underwriting Report/);
assert.match(designAuthority, /sufficient T12 or a sufficient Rent Roll can support publication/i);

console.log("phase7-elite-report-design-contract-smoke: PASS");
