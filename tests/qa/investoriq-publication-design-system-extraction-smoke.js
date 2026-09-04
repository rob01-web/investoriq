import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

import {
  INVESTORIQ_PUBLICATION_DESIGN_SYSTEM_VERSION,
  INVESTORIQ_UNDERWRITING_OPENING_CSS,
  INVESTORIQ_PHASE8A_PUBLICATION_CSS,
  publicationDesignSystemMetadata,
  renderPublicationCover,
  renderPublicationDecisionBand,
  renderPublicationEvidenceMap,
  renderPublicationMetricMatrix,
  renderPublicationObservationGrid,
  renderPublicationSection,
  renderPublicationThreePanelStrip,
} from "../../api/_lib/investoriq-publication-design-system.js";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

const rendererSource = fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-renderer.js", "utf8");
const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const phase8aSource = fs.readFileSync("api/_lib/phase8a-owner-acceptance-authority.js", "utf8");
const screeningSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");

assert.equal(INVESTORIQ_PUBLICATION_DESIGN_SYSTEM_VERSION, "investoriq-publication-system-v1");

const metadata = publicationDesignSystemMetadata();
assert.equal(metadata.canonicalVisualAuthority, "underwriting");
assert.equal(metadata.sourceTruthMutationAllowed, false);
assert.equal(metadata.analyticalAuthorityCreating, false);
assert.equal(metadata.screeningSemanticExpansionAllowed, false);
assert.deepEqual(metadata.extractedPrimitives, [
  "PublicationCover",
  "PublicationSection",
  "DecisionBand",
  "MetricMatrix",
  "ThreePanelDecisionStrip",
  "EvidenceMapTable",
  "ObservationGrid",
  "ReconciliationAlert",
  "InstitutionalOpeningStyles",
  "Phase8AOwnerAcceptanceStyles",
]);

const cover = renderPublicationCover({
  propertyName: "Stonebridge Lofts",
  reportTitle: "InvestorIQ Underwriting Report",
  classification: "Review: Source Reconciliation Disclosure",
  profileLabel: "Property Scale",
  profileValue: "64 Units",
  evidenceBasis: "8 uploaded files",
  preparedLabel: "Sep 4, 2026",
  footerRight: "Document-Backed Property Underwriting",
});
assert.match(cover, /data-iq-cover-system="elite-10b1-light-institutional-v1"/);
assert.match(cover, /Stonebridge Lofts/);
assert.match(cover, /InvestorIQ Underwriting Report/);

const section = renderPublicationSection({
  title: "Investment Decision Snapshot",
  sectionKey: "executiveInvestmentSummary",
  disposition: "include",
  bodyHtml: "<p>Body</p>",
  legacySectionLabel: "Executive Summary",
  bodyClass: "iq-ic-summary-card phase8a-executive-summary",
});
assert.match(section, /data-iq-elite-section="executiveInvestmentSummary"/);
assert.match(section, /data-iq-boss-section="Executive Summary"/);
assert.match(section, /class="card no-break iq-ic-summary-card phase8a-executive-summary"/);

const band = renderPublicationDecisionBand({
  columns: [
    { label: "Current Decision State", value: "RECONCILIATION REQUIRED", detail: "Source reconciliation required" },
    { label: "Strategy Fit", value: "LIGHT VALUE-ADD HOLD", detail: "Source-supported only" },
    { label: "Asset", value: "Stonebridge Lofts", detail: "64 Unit" },
  ],
});
assert.match(band, /class="phase8a-investment-decision-band"/);
assert.equal((band.match(/<div>/g) || []).length, 3);

const matrix = renderPublicationMetricMatrix({
  rows: [[
    { label: "Purchase Price", value: "$13,500,000", note: "Transaction basis" },
    { label: "T12 NOI", value: "$945,000", note: "Current operating basis" },
  ]],
});
assert.match(matrix, /class="phase8a-investment-snapshot-table"/);
assert.match(matrix, /<em>Transaction basis<\/em>/);

const strip = renderPublicationThreePanelStrip({
  panels: [
    { title: "Investment Thesis", items: ["Document-supported point."] },
    { title: "What Can Kill or Reprice It", items: ["Source reconciliation."] },
    { title: "What Must Be True", items: ["Evidence must reconcile."] },
  ],
});
assert.match(strip, /class="phase8a-exec-columns"/);
assert.equal((strip.match(/class="phase8a-exec-panel"/g) || []).length, 3);

const observations = renderPublicationObservationGrid({
  groups: [{ label: "Operating Signals", items: [{ code: "OPERATING_SIGNAL", statement: "Current occupancy is established." }] }],
});
assert.match(observations, /class="iq-ic-signal-grid"/);
assert.match(observations, /data-iq-elite-signal="OPERATING_SIGNAL"/);

const evidenceMap = renderPublicationEvidenceMap({
  intro: "Where the report supports each core committee question.",
  rows: [{ domain: "Operating Evidence", coverage: "Presented", sections: "Operating Performance Overview" }],
  note: "This map does not create assumptions.",
});
assert.match(evidenceMap, /Decision Evidence Map/);
assert.match(evidenceMap, /<th>Report Sections<\/th>/);

for (const selector of [
  ".iq-ic-metric-grid",
  ".iq-ic-signal-grid",
  ".iq-ic-reconciliation-grid",
]) {
  assert.ok(INVESTORIQ_UNDERWRITING_OPENING_CSS.includes(selector), `missing extracted opening selector: ${selector}`);
}
for (const selector of [
  ".iq-phase8a-underwriting .phase8a-investment-decision-band",
  ".iq-phase8a-underwriting .phase7-evidence-conviction-matrix",
  ".iq-phase8a-underwriting .cover-classification",
]) {
  assert.ok(INVESTORIQ_PHASE8A_PUBLICATION_CSS.includes(selector), `missing extracted Phase 8A selector: ${selector}`);
}

assert.match(rendererSource, /from "\.\/investoriq-publication-design-system\.js"/);
for (const helper of [
  "renderPublicationSection",
  "renderPublicationDecisionBand",
  "renderPublicationMetricMatrix",
  "renderPublicationThreePanelStrip",
  "renderPublicationObservationGrid",
  "renderPublicationReconciliationAlert",
]) {
  assert.ok(rendererSource.includes(helper), `Underwriting renderer must consume ${helper}`);
}
assert.match(documentSource, /INVESTORIQ_UNDERWRITING_OPENING_CSS/);
assert.match(documentSource, /renderPublicationCover/);
assert.match(phase8aSource, /INVESTORIQ_PHASE8A_PUBLICATION_CSS/);
assert.doesNotMatch(screeningSource, /investoriq-publication-design-system/);

const fixture = buildInstitutionalGate10ReportFixture("phase8b-a-characterization");
const fixtureHash = crypto.createHash("sha256").update(fixture.html).digest("hex");
assert.equal(fixtureHash, "7eea5e25a4d7643d81f9f06b3cc489d0bfb2ad0292ba5d81e98fd5c265eb71a9");

const designSource = fs.readFileSync("api/_lib/investoriq-publication-design-system.js", "utf8");
for (const forbidden of [
  "buildFullUnderwritingChapter1EliteContract",
  "sourceTruthPackage",
  "currentDebtDscr",
  "proposedFinancingDscr",
  "purchasePrice",
  "goingInCapRate",
  "IRR",
  "equityMultiple",
]) {
  assert.equal(designSource.includes(forbidden), false, `presentation authority must not create analytical authority: ${forbidden}`);
}

console.log("PASS investoriq-publication-design-system-extraction-smoke (8B-A)");
