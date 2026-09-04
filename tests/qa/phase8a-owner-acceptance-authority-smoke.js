import assert from "node:assert/strict";
import {
  applyPhase8AOwnerAcceptanceAuthority,
  phase8AOwnerAcceptanceMetadata,
} from "../../api/_lib/phase8a-owner-acceptance-authority.js";

const harbourstoneSourceTruth = {
  source: "canonical_source_truth_package",
  core: {
    t12: {
      original_filename: "Full_Render_T12.xlsx",
      accepted_facts: {
        gross_potential_rent: 1850000,
        effective_gross_income: 1100000,
        total_operating_expenses: 450000,
        net_operating_income: 650000,
      },
    },
    rent_roll: {
      original_filename: "Full_Render_Rent_Roll.xlsx",
      accepted_facts: {
        total_units: 48,
        occupied_units: 46,
        occupancy: 0.9583333333,
        total_in_place_annual: 1036800,
        total_market_annual: 1137600,
      },
    },
  },
};

const screeningInput = `<!doctype html><html><head></head><body class="iq-phase8 iq-phase8-screening">
<div class="cover-wrap"><div class="cover-cell"><div class="cover-verdict-value verdict-stable">Review - Source Reconciliation Disclosure</div></div></div>
<div class="verdict-block"><div class="verdict-label">Screening Signal</div><div class="verdict-classification">Review - Source Reconciliation Disclosure</div><div class="verdict-pressure">Primary Pressure Point: none</div><div class="verdict-rationale">Source reconciliation disclosure applies.</div></div>
<!-- BEGIN SECTION_12 --><section class="section page-break"><div class="section-header"><span class="section-header-title">Methodology &amp; Data Transparency</span></div><p>old repetitive methodology</p></section><!-- END SECTION_12 -->
</body></html>`;

const screening = applyPhase8AOwnerAcceptanceAuthority(screeningInput, {
  lane: "screening",
  sourceTruthPackage: harbourstoneSourceTruth,
});

assert.match(screening, /data-iq-phase8a="owner-acceptance-recovery-v1"/);
assert.match(screening, /Screening Decision Snapshot/);
assert.match(screening, />HOLD</);
assert.match(screening, /44\.0%/);
assert.match(screening, /Reconcile the two core income bases before full Underwriting/);
assert.match(screening, /Operating Strength/);
assert.match(screening, /Rent Position/);
assert.match(screening, /Source Consistency/);
assert.match(screening, /Operating Cushion/);
assert.match(screening, /Diligence Burden/);
assert.match(screening, /Underwriting Readiness/);
assert.match(screening, /data-iq-phase8a-methodology="true"/);
assert.match(screening, /Full_Render_T12\.xlsx/);
assert.match(screening, /Full_Render_Rent_Roll\.xlsx/);
assert.doesNotMatch(screening, /old repetitive methodology/);
assert.match(screening, /\.iq-phase8a \.cover-cell \{ background:#fff !important/);
assert.match(screening, /\.iq-phase8a \.cover-wrap::after/);

const underwritingInput = `<!doctype html><html><head></head><body class="iq-phase8 iq-phase8-underwriting">
<div class="cover-wrap"><div class="cover-cell">Stonebridge</div></div>
<p>64-Unit Multifamily. Accepted evidence. This is a 11.16% variance. Proposed financing produces 0.61x less DSCR than current debt.</p>
</body></html>`;
const underwriting = applyPhase8AOwnerAcceptanceAuthority(underwritingInput, { lane: "underwriting" });
assert.match(underwriting, /64 Unit Multifamily/);
assert.match(underwriting, /Source document/);
assert.match(underwriting, /an 11\.16% variance/);
assert.match(underwriting, /DSCR that is 0\.61x lower than current debt/);
assert.match(underwriting, /\.iq-phase8a \.cover-wrap::after/);
assert.doesNotMatch(underwriting, /64-Unit/);

const metadata = phase8AOwnerAcceptanceMetadata();
assert.equal(metadata.sharedWhiteFirstCover, true);
assert.deepEqual(metadata.screeningDispositionValues, ["ADVANCE", "HOLD", "DO NOT ADVANCE", "INSUFFICIENT EVIDENCE"]);
assert.equal(metadata.opaqueCompositeScore, false);
assert.equal(metadata.sourceTruthMutationAllowed, false);
assert.equal(metadata.hardcodedPageCount, false);

console.log("phase8a-owner-acceptance-authority-smoke: PASS");
