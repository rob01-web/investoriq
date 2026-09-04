import assert from "node:assert/strict";
import fs from "node:fs";
import { buildFullUnderwritingChapter1EliteContract } from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

const rendererSource = fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-renderer.js", "utf8");
const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const designSystemSource = fs.readFileSync("api/_lib/investoriq-publication-design-system.js", "utf8");
const fixture = buildInstitutionalGate10ReportFixture("elite-10b2-committee-opening-system");
const html = fixture.html;
const chapter1 = html.match(
  /<section class="institutional-chapter" data-iq-chapter="committee-overview">([\s\S]*?)<section class="institutional-chapter" data-iq-chapter="operating-performance">/i,
)?.[1] || "";
let checks = 0;

assert.ok(chapter1, "rendered committee-overview chapter");
assert.match(chapter1, /data-iq-elite-chapter1="true"/);
assert.match(chapter1, /data-iq-elite10b2="investment-committee-opening-v1"/);
assert.match(chapter1, /Investment Decision Snapshot/);
assert.match(chapter1, /Key Metrics Snapshot/);
assert.match(chapter1, /Underwriting Observations/);
assert.doesNotMatch(chapter1, /Key Investor Questions/);
assert.doesNotMatch(chapter1, /Principal Risks &amp; Constraints/);
assert.match(chapter1, /Primary Source Reconciliation Alert/);
assert.doesNotMatch(chapter1, /Investment Case \/ Decision Frame/);
checks += 1;

assert.match(chapter1, /class="phase8a-investment-decision-band"/);
assert.match(chapter1, /Institutional Gate 10 Property/);
assert.match(chapter1, /<p>64-Unit<\/p>/);
assert.match(chapter1, /What Must Be True/);
assert.match(chapter1, /RECONCILIATION REQUIRED/);
assert.match(chapter1, /class="iq-callout iq-ic-reconciliation-callout" data-iq-tone="constraint"/);
checks += 1;

const signalCodes = [...chapter1.matchAll(/data-iq-elite-signal="([^"]+)"/g)].map((match) => match[1]);
for (const code of ["OPERATING_OCCUPANCY_ESTABLISHED", "OPERATING_NOI_ESTABLISHED", "DOCUMENTED_GROSS_RENT_GAP"]) {
  assert.equal(signalCodes.filter((item) => item === code).length, 1, `${code} should render once in the decision-frame surface`);
}
assert.equal((chapter1.match(/What explains the difference between T12 Gross Potential Rent and Rent Roll annual in-place rent\./g) || []).length, 1, "decision condition should not be repeated");
checks += 1;

const metricKeys = [...chapter1.matchAll(/data-iq-elite-metric="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(metricKeys).size, metricKeys.length, "display-ready committee metrics must not be duplicated");
for (const key of ["units", "occupancy", "noi", "purchasePrice", "goingInCapRate", "occupancyBreakEvenSpread"]) {
  assert.ok(metricKeys.includes(key), `missing governed committee metric: ${key}`);
}
assert.match(chapter1, /class="iq-ic-metric-grid"/);
assert.match(chapter1, /class="iq-ic-secondary-grid"/);
assert.match(chapter1, /class="iq-ic-secondary-metric"/);
checks += 1;

assert.match(rendererSource, /\.slice\(0, 6\)/);
assert.match(rendererSource, /bodyClass: "iq-ic-summary-card phase8a-executive-summary"/);
assert.match(rendererSource, /allowBreak: true,[\s\S]*bodyClass: "iq-ic-metrics-card"/);
assert.match(rendererSource, /allowBreak: true,[\s\S]*bodyClass: "iq-ic-observations-card"/);
assert.match(rendererSource, /allowBreak: true,[\s\S]*bodyClass: "iq-ic-questions-card"/);
checks += 1;

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
  assert.ok(designSystemSource.includes(selector), `missing extracted ELITE-10B2 style: ${selector}`);
}
assert.match(designSystemSource, /\.iq-ic-metric-grid\s*\{[^}]*break-inside:avoid-page;[^}]*page-break-inside:avoid;/s);
assert.match(designSystemSource, /\.iq-ic-signal-panel\s*\{[^}]*break-inside:avoid-page;[^}]*page-break-inside:avoid;/s);
assert.match(documentSource, /INVESTORIQ_UNDERWRITING_OPENING_CSS/);
checks += 1;

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
checks += 1;

for (const forbidden of [
  "t12Payload",
  "rentRollPayload",
  "mortgagePayload",
  "acquisitionTermsPayload",
  "loanTermSheetTermsPayload",
  "acquisitionMemoProjection",
]) {
  assert.equal(rendererSource.includes(forbidden), false, `raw/governance input leaked into renderer: ${forbidden}`);
}
for (const token of ["BUY", "SELL", "HOLD", "IRR", "MOIC", "FINAL RECOMMENDATION"]) {
  const regex = new RegExp(`(?:^|[^A-Z])${token}(?:[^A-Z]|$)`, "i");
  assert.equal(regex.test(rendererSource), false, `forbidden recommendation token leaked into renderer: ${token}`);
}
assert.doesNotMatch(chapter1, /[—–]/);
checks += 1;

const coverFunction = documentSource.match(
  /function renderBrandCoverSection\([\s\S]*?\n\}\n\nfunction renderExecutiveSummarySection/,
)?.[0] || "";
assert.match(coverFunction, /return renderPublicationCover\(\{/);
assert.match(coverFunction, /reportTitle: UNDERWRITING_REPORT_IDENTITY\.canonicalTitle/);
assert.match(designSystemSource, /data-iq-cover-system="elite-10b1-light-institutional-v1"/);
assert.match(designSystemSource, /class="cover-prop-sub"/);
assert.doesNotMatch(`${coverFunction}\n${designSystemSource}`, /cover-kicker|>Full Underwriting/i);
assert.equal(rendererSource.includes("cover-wrap"), false);
checks += 1;

assert.equal(checks, 9);
console.log("PASS full-underwriting-elite10b2-committee-opening-system-smoke (9/9)");
