import assert from "node:assert/strict";
import {
  applyPhase8CustomerFacingVisualAuthority,
  phase8CustomerFacingAuthorityMetadata,
} from "../../api/_lib/phase8-customer-facing-visual-authority.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  core: {
    t12: {
      original_filename: "T12.xlsx",
      accepted_facts: {
        gross_potential_rent: 1850000,
        effective_gross_income: 1100000,
        total_operating_expenses: 450000,
        net_operating_income: 650000,
      },
    },
    rent_roll: {
      original_filename: "Rent_Roll.xlsx",
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

const screeningInput = `<!DOCTYPE html><html><head></head><body class="iq-phase7 iq-phase7-screening"><section>Executive</section><!-- END SECTION_0_5 --><section class="section page-break"><div class="section-header"><span class="section-header-title">Methodology &amp; Data Transparency</span></div><p>governed deterministic framework &mdash; parser</p></section></body></html>`;
const screening = applyPhase8CustomerFacingVisualAuthority(screeningInput, {
  reportMode: "screening_v1",
  sourceTruthPackage,
});
assert.match(screening, /data-iq-phase8="elite-customer-facing-authority-v1"/);
assert.match(screening, /Operating Evidence &amp; Diligence Priorities/);
assert.match(screening, /Annual In-Place Rent[\s\S]{0,120}\$1,036,800/);
assert.match(screening, /Source Reconciliation/);
assert.match(screening, /Rent Roll less T12/);
assert.match(screening, /phase8-methodology-compact/);
assert.match(screening, /iq-phase8-screening \.cover-wrap/);
const screeningVisible = screening
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ");
assert.equal(/[\u2013\u2014]/.test(screeningVisible), false);
assert.equal(/&(?:ndash|mdash);/i.test(screeningVisible), false);
assert.equal(/\bparser\b/i.test(screeningVisible), false);
assert.equal(phase8CustomerFacingAuthorityMetadata("screening_v1").hardcodedPageCount, false);

const underwritingInput = `<!DOCTYPE html><html><head></head><body class="iq-phase7 iq-phase7-underwriting"><section>InvestorIQ Underwriting Report</section><table><tr><td>Rent Roll Annual In-Place Rent</td><td><strong>$1,036,800</strong></td></tr></table></body></html>`;
const underwriting = applyPhase8CustomerFacingVisualAuthority(underwritingInput, {
  reportMode: "v1_core",
  sourceTruthPackage,
});
assert.match(underwriting, /iq-phase8-underwriting/);
assert.equal(/Operating Evidence &amp; Diligence Priorities/.test(underwriting), false);
assert.doesNotThrow(() => applyPhase8CustomerFacingVisualAuthority(underwritingInput, {
  reportMode: "v1_core",
  sourceTruthPackage,
}));
const badUnderwriting = underwritingInput.replace("$1,036,800", "$50,700");
assert.throws(
  () => applyPhase8CustomerFacingVisualAuthority(badUnderwriting, {
    reportMode: "v1_core",
    sourceTruthPackage,
  }),
  /reconciliation_surface_not_canonical/
);

console.log("phase8-customer-facing-visual-authority-smoke: PASS");
