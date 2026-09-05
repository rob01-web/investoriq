import assert from "node:assert/strict";

import {
  buildPhase8CertificationRequests,
  renderPhase8CertificationArtifacts,
} from "../../scripts/phase8-visual-certification-fixtures.js";
import { phase8BCrossProductPublicationMetadata } from "../../api/_lib/phase8b-cross-product-publication-authority.js";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docraptor-key";
process.env.QA_REVIEW_ENABLED ||= "false";

const { default: generateClientReport } = await import("../../api/generate-client-report.js");
const rendered = await renderPhase8CertificationArtifacts(generateClientReport, buildPhase8CertificationRequests());
const screening = rendered.screening.html;
const underwriting = rendered.underwriting.html;

for (const [lane, html] of Object.entries({ screening, underwriting })) {
  assert.match(html, new RegExp(`class="[^"]*iq-phase8b-${lane}`));
  assert.match(html, /data-iq-phase8b="cross-product-publication-system-v1"/);
  assert.match(html, /data-iq-publication-system="investoriq-publication-system-v1"/);
  assert.match(html, /data-iq-cover-system="elite-10b1-light-institutional-v1"/);
}

assert.match(screening, /InvestorIQ Screening Report/);
assert.match(screening, /<span>Review Classification<\/span>\s*<strong>HOLD<\/strong>/);
assert.match(screening, /<span>Property Scale<\/span>\s*<strong>48 Units<\/strong>/);
assert.match(screening, /<span>Evidence Basis<\/span>\s*<strong>2 core sources<\/strong>/);
assert.match(screening, /Document-Backed Property Screening/);
assert.match(screening, /data-iq-elite-section="screeningDecisionSnapshot"/);
assert.match(screening, /class="phase8b-screening-decision-band"/);
assert.match(screening, /class="phase8b-screening-metric-matrix"/);
assert.match(screening, /class="phase8b-screening-decision-panels"/);
assert.match(screening, /Screening Thesis/);
assert.match(screening, /What Can Stop Advancement/);
assert.match(screening, /What Must Be True to Advance/);
assert.match(screening, /Screening determines whether operating facts and source consistency support deeper review/);
assert.doesNotMatch(screening, /<span class="section-header-title">Executive Summary<\/span>/);
assert.match(screening, /data-iq-elite-section="screeningDecisionEvidence"/);
assert.match(screening, /Decision Evidence &amp; Key Metrics/);
assert.match(screening, /Decision Evidence Map/);
assert.match(screening, /Where this Screening supports each operating decision question/);
assert.match(screening, /data-iq-elite-section="screeningObservations"/);
assert.match(screening, /Screening Observations &amp; Diligence Priorities/);
assert.match(screening, /data-iq-elite-signal="OCCUPANCY_SIGNAL"/);
assert.match(screening, /Source Reconciliation Required/);
assert.match(screening, /class="phase8b-diligence-priorities"/);
assert.doesNotMatch(screening, /Operating Evidence &amp; Diligence Priorities/);
assert.match(screening, /data-iq-elite-section="screeningGovernance"/);
assert.match(screening, /Data Coverage &amp; Source Limitations/);
assert.match(screening, /Source Register &amp; Document Treatment/);
assert.match(screening, /Methodology &amp; Data Transparency/);
assert.match(screening, /Report Quality Manifest/);
assert.match(screening, /class="phase8b-quality-manifest"/);

assert.match(underwriting, /InvestorIQ Underwriting Report/);
assert.match(underwriting, /Stonebridge Lofts/);
assert.doesNotMatch(screening, /\$13,500,000|1\.34x|70\.0% LTV|Stonebridge Lofts/i);
assert.doesNotMatch(underwriting, /Harbourstone|\$1,850,000|\$1,036,800/i);
const screeningVisible = screening
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");
assert.doesNotMatch(screeningVisible, /\b(?:DSCR|LTV|debt yield|financing|purchase price|valuation|appraisal|IRR|cash-on-cash|equity multiple)\b/i);

const metadata = phase8BCrossProductPublicationMetadata();
assert.equal(metadata.canonicalVisualAuthority, "underwriting");
assert.equal(metadata.sourceTruthMutationAllowed, false);
assert.equal(metadata.screeningSemanticExpansionAllowed, false);
assert.deepEqual(metadata.completedSlices, ["8B-A", "8B-B", "8B-C", "8B-D", "8B-E"]);

console.log("PASS investoriq-cross-product-publication-system-smoke (8B-E)");
