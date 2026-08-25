import assert from "node:assert/strict";
import { buildFullUnderwritingOperatingIntelligenceContract } from "../../api/_lib/full-underwriting-operating-intelligence-contract.js";
import { renderFullUnderwritingOperatingIntelligenceHtml } from "../../api/_lib/full-underwriting-operating-intelligence-renderer.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "elite-03-render",
  property_name: "Operating Intelligence Test",
  core_publishable: true,
  core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  core: {
    t12: {
      accepted_facts: {
        gross_potential_rent: 1200000,
        effective_gross_income: 1100000,
        total_operating_expenses: 440000,
        net_operating_income: 660000,
        expense_lines: [
          { label: "Taxes", amount: 150000 },
          { label: "Repairs", amount: 90000 },
          { label: "Insurance", amount: 70000 },
          { label: "Utilities", amount: 65000 },
          { label: "Management", amount: 50000 },
          { label: "Admin", amount: 15000 },
        ],
      },
    },
    rent_roll: {
      accepted_facts: {
        total_units: 50,
        occupancy: 0.94,
        annual_in_place_rent: 1050000,
        annual_market_rent: 1140000,
        unit_mix: [
          { label: "Studio", count: 10, current_rent: 1500, market_rent: 1600 },
          { label: "1BR", count: 25, current_rent: 1750, market_rent: 1900 },
          { label: "2BR", count: 15, current_rent: 2250, market_rent: 2450 },
        ],
      },
    },
  },
};
const contract = buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage });
const html = renderFullUnderwritingOperatingIntelligenceHtml(contract);
for (const heading of [
  "Operating Performance Overview",
  "Revenue Quality",
  "Expense Structure",
  "NOI &amp; Margin Analysis",
  "Unit / Rent Concentration",
  "Operating Interpretation",
]) assert.match(html, new RegExp(heading, "i"));
assert.match(html, /\$660,000/);
assert.match(html, /60\.0%/);
assert.match(html, /Taxes/);
assert.match(html, /1BR/);
assert.match(html, /Gross rent differences are displayed as accepted rent evidence only/i);
assert.match(html, /does not convert them to NOI or capitalize them into value/i);
assert.match(html, /occupancy concentration by unit type is not inferred/i);
for (const forbidden of [/\bBUY\b/i, /\bSELL\b/i, /\bHOLD\b/i, /\bIRR\b/i, /\bMOIC\b/i, /scenario/i]) {
  assert.doesNotMatch(html, forbidden);
}
assert.match(html, /data-iq-elite-operating="revenue-quality"/);
assert.match(html, /data-iq-elite-operating="expense-structure"/);
assert.match(html, /data-iq-elite-operating="noi-margin-analysis"/);
assert.match(html, /data-iq-elite-operating="unit-rent-concentration"/);
console.log("PASS full-underwriting-operating-intelligence-renderer-smoke (20/20)");
