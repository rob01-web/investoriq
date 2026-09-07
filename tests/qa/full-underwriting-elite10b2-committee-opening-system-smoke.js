import assert from "node:assert/strict";
import fs from "node:fs";
import { buildFullUnderwritingChapter1EliteContract } from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

const publicRendererSource = fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-renderer.js", "utf8");
const baseRendererSource = fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-renderer-base.js", "utf8");
const publicDocumentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const baseDocumentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document-base.js", "utf8");
const designSystemSource = fs.readFileSync("api/_lib/investoriq-publication-design-system.js", "utf8");
const publicationCssSource = fs.readFileSync("api/_lib/investoriq-publication-base-css.js", "utf8");

const fixture = buildInstitutionalGate10ReportFixture("elite-10b2-committee-opening-system");
const html = fixture.html;
const chapter1 = html.match(/<section class="institutional-chapter" data-iq-chapter="committee-overview">([\s\S]*?)<section class="institutional-chapter" data-iq-chapter="operating-performance">/i)?.[1] || "";

assert.ok(chapter1, "rendered committee-overview chapter");
assert.match(chapter1, /data-iq-elite-chapter1="true"/);
assert.match(chapter1, /data-iq-elite10b2="investment-committee-opening-v1"/);
assert.match(chapter1, /Investment Decision Snapshot/);
assert.match(chapter1, /Key Metrics Snapshot/);
assert.match(chapter1, /Underwriting Observations/);
assert.match(chapter1, /SOURCE DIFFERENCE REQUIRES REVIEW/);
assert.doesNotMatch(chapter1, /data-iq-elite-section="sourceReconciliationAlert"/);
assert.doesNotMatch(chapter1, /RECONCILIATION REQUIRED|Primary Source Reconciliation Alert|Source Difference Review/);
assert.match(html, /Core Source Reconciliation/);
assert.match(html, /\(\$180,000\)|\$180,000/);

assert.match(chapter1, /Institutional Gate 10 Property/);
assert.match(chapter1, /What Must Be True/);

const signalCodes = [...chapter1.matchAll(/data-iq-elite-signal="([^"]+)"/g)].map((match) => match[1]);
for (const code of ["OPERATING_OCCUPANCY_ESTABLISHED", "OPERATING_NOI_ESTABLISHED", "DOCUMENTED_GROSS_RENT_GAP", "PRIMARY_SOURCE_RECONCILIATION_REQUIRED"]) {
  assert.equal(signalCodes.filter((item) => item === code).length, 1, `${code} should render once`);
}
assert.ok(signalCodes.includes("T12_EXPENSE_LINE_RECONCILIATION_REQUIRED"), "separate T12 expense reconciliation reaches decision layer");

const metricKeys = [...chapter1.matchAll(/data-iq-elite-metric="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(metricKeys).size, metricKeys.length, "display-ready committee metrics must not be duplicated");
for (const key of ["units", "occupancy", "noi", "purchasePrice", "goingInCapRate", "breakEvenOccupancy"]) {
  assert.ok(metricKeys.includes(key), `missing committee metric: ${key}`);
}
assert.equal(metricKeys.includes("occupancyBreakEvenSpread"), false, "cross-basis occupancy spread must not render");
assert.match(chapter1, /Operating Cost Coverage Ratio/);

for (const selector of [
  "[data-iq-elite10b2=\"investment-committee-opening-v1\"] .section",
  ".iq-ic-summary-lead",
  ".iq-ic-focus-grid",
  ".iq-ic-metric-grid",
  ".iq-ic-signal-grid",
  ".iq-ic-risk-item",
  ".iq-ic-secondary-grid",
  ".iq-ic-question-grid",
  ".iq-ic-reconciliation-callout",
  ".iq-ic-reconciliation-grid",
]) {
  assert.ok(designSystemSource.includes(selector), `missing institutional style: ${selector}`);
}
assert.match(publicationCssSource, /source-register-table \.source-filename[\s\S]*overflow-wrap:anywhere/i);
assert.match(publicationCssSource, /\.section-header::after \{ display:none !important; \}/i);
assert.match(publicationCssSource, /font-size:7\.25pt !important/i);

assert.match(publicRendererSource, /SOURCE DIFFERENCE REQUIRES REVIEW/);
assert.match(publicRendererSource, /removeDuplicateExecutiveSourceDifferenceReview/);
assert.match(baseRendererSource, /\.slice\(0, 6\)/);
assert.match(baseRendererSource, /bodyClass: "iq-ic-summary-card phase8a-executive-summary"/);
assert.match(baseDocumentSource, /INVESTORIQ_UNDERWRITING_OPENING_CSS/);
assert.match(baseDocumentSource, /reportTitle: UNDERWRITING_REPORT_IDENTITY\.canonicalTitle/);
assert.match(publicDocumentSource, /Source Period &amp; Currency/);
assert.match(publicDocumentSource, /does not infer a reporting date or currency/i);
assert.match(designSystemSource, /data-iq-cover-system="elite-10b1-light-institutional-v1"/);
assert.doesNotMatch(`${baseDocumentSource}\n${designSystemSource}`, /cover-kicker|>Full Underwriting/i);

const chapter1Contract = buildFullUnderwritingChapter1EliteContract({
  sourceTruthPackage: fixture.sourceTruthPackage,
  customerSurfaceModel: fixture.customerSurfaceModel,
  financialIntelligence: fixture.financialIntelligence,
  coreMetrics: fixture.coreMetrics,
  propertyProfile: fixture.propertyProfile,
  reportMeta: fixture.reportMeta,
});
assert.equal(chapter1Contract.authority.authorityCreating, false);
assert.equal(chapter1Contract.authority.sourceTruthMutationAllowed, false);
assert.equal(chapter1Contract.authority.scenarioAuthority, false);
assert.equal(chapter1Contract.authority.deliveryAuthority, false);
assert.equal(chapter1Contract.authority.publicationAuthority, false);
assert.equal(chapter1Contract.authority.revisionAuthority, false);
assert.equal(chapter1Contract.authority.investmentRecommendationAllowed, false);
assert.equal(chapter1Contract.authority.downstreamConsumeOnly, true);
assert.equal(chapter1Contract.metrics.occupancyBreakEvenSpread.displayReady, false);
assert.ok(chapter1Contract.principalRisksAndConstraints.items.some((item) => item.code === "T12_EXPENSE_LINE_RECONCILIATION_REQUIRED"));

const visible = chapter1.replace(/<[^>]+>/g, " ");
assert.doesNotMatch(visible, /[\u2014\u2013]/);
assert.doesNotMatch(visible, /\bgoverned\b|\bcanonical\b|display-ready|source_backed/i);
for (const token of ["BUY", "SELL", "HOLD", "IRR", "MOIC", "FINAL RECOMMENDATION"]) {
  const regex = new RegExp(`(?:^|[^A-Z])${token}(?:[^A-Z]|$)`, "i");
  assert.equal(regex.test(publicRendererSource), false, `forbidden recommendation token leaked into public renderer: ${token}`);
}

console.log("PASS full-underwriting-elite10b2-committee-opening-system-smoke");
