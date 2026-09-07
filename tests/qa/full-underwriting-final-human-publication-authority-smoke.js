import assert from "node:assert/strict";
import {
  applyInvestorIqFinalHumanPublicationAuthority,
  finalHumanPublicationAuthorityMetadata,
} from "../../api/_lib/investoriq-final-human-publication-authority.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  core: {
    t12: {
      accepted_facts: {
        gross_potential_rent: 1612800,
        total_operating_expenses: 391910.4,
      },
    },
  },
};

const screeningInput = `<!doctype html><html><head></head><body class="iq-phase8 iq-phase8-screening">
<div class="cover-brand-name">INVESTORIQ</div>
<div class="cover-prop-sub">InvestorIQ Screening Report</div>
<div>SOURCE RECONCILIATION REQUIRED</div>
<div>Next Review Gate: SOURCE RECONCILIATION</div>
<div>Reconciliation Required</div>
<div>Break-Even Occupancy</div>
<div>Operating Cushion</div>
<div>Occupancy is 71.5 pp above break-even.</div>
</body></html>`;

const screening = applyInvestorIqFinalHumanPublicationAuthority(screeningInput, {
  lane: "screening",
  sourceTruthPackage,
});
assert.match(screening, /<div class="cover-prop-sub">Screening Report<\/div>/);
assert.doesNotMatch(screening, /InvestorIQ Screening Report/);
assert.match(screening, /SOURCE DIFFERENCE REQUIRES REVIEW/);
assert.match(screening, /SOURCE DIFFERENCE REVIEW/);
assert.match(screening, /Source Difference Review/);
assert.match(screening, /Operating Cost Coverage Ratio/);
assert.match(screening, /Operating Cost Coverage/);
assert.match(screening, /Operating expenses equal 24\.3% of T12 Gross Potential Rent\./);
assert.doesNotMatch(screening, /Break-Even Occupancy|pp above break-even|Source Reconciliation Required/);

const underwritingInput = `<!doctype html><html><head></head><body class="iq-phase8 iq-phase8-underwriting">
<div class="cover-brand-name">INVESTORIQ</div>
<div class="cover-prop-sub">Investment Committee Memorandum</div>
<div>Investment Committee Overview</div>
<div>T12 EXPENSE-LINE RECONCILIATION REQUIRED</div>
<div>a source-supported going-in cap-rate reference is available.</div>
<div>What explains the source difference.</div>
<section id="quality-manifest-title"></section>
</body></html>`;

const underwriting = applyInvestorIqFinalHumanPublicationAuthority(underwritingInput, {
  lane: "underwriting",
  sourceTruthPackage,
});
assert.match(underwriting, /<div class="cover-prop-sub">Underwriting Report<\/div>/);
assert.doesNotMatch(underwriting, /Investment Committee Memorandum/);
assert.match(underwriting, /Underwriting Overview/);
assert.match(underwriting, /T12 EXPENSE-LINE DIFFERENCE REQUIRES REVIEW/);
assert.match(underwriting, /A source-supported going-in cap-rate reference is available\./);
assert.match(underwriting, /What explains the source difference\?/);

for (const output of [screening, underwriting]) {
  assert.match(output, /id="investoriq-final-human-publication-authority"/);
  assert.match(output, /\.cover-brand-name::after \{ content:none !important; display:none !important; \}/);
  assert.match(output, /\.header-strip::before \{ content:none !important; display:none !important; \}/);
  assert.match(output, /\.section-header::after \{ content:none !important; display:none !important; \}/);
}
assert.match(underwriting, /#quality-manifest-title \{ break-inside:avoid-page !important; page-break-inside:avoid !important; \}/);
assert.match(underwriting, /committee-overview/);

const metadata = finalHumanPublicationAuthorityMetadata();
assert.equal(metadata.changesSourceFacts, false);
assert.equal(metadata.changesCalculations, false);
assert.equal(metadata.hardcodedPageCount, false);
assert.equal(metadata.customerFacingPresentationOnly, true);

console.log("PASS full-underwriting-final-human-publication-authority-smoke");
