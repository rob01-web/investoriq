import assert from "node:assert/strict";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "precision-provenance-test",
  property_name: "Precision House",
  core_publishable: true,
  core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  core: {
    t12: {
      file_id: "t12-file",
      artifact_id: "t12-artifact",
      accepted_facts: {
        gross_potential_rent: 1200000,
        effective_gross_income: 1100000,
        total_operating_expenses: 440000,
        net_operating_income: 660000,
        period_start: "2025-07-01",
        period_end: "2026-06-30",
        currency: "CAD",
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
      file_id: "rr-file",
      artifact_id: "rr-artifact",
      accepted_facts: {
        total_units: 8,
        occupancy: 1,
        annual_in_place_rent: 178350,
        annual_market_rent: 202800,
        as_of_date: "2026-06-30",
        unit_mix: [
          { label: "1BR", count: 4, current_rent: 1835, market_rent: 1800 },
          { label: "2BR", count: 4, current_rent: 1881, market_rent: 2425 },
        ],
        units: [
          { unit_type: "1BR", in_place_rent: 1835, market_rent: 1800 },
          { unit_type: "1BR", in_place_rent: 1835, market_rent: 1800 },
          { unit_type: "1BR", in_place_rent: 1835, market_rent: 1800 },
          { unit_type: "1BR", in_place_rent: 1835, market_rent: 1800 },
          { unit_type: "2BR", in_place_rent: 1881, market_rent: 2425 },
          { unit_type: "2BR", in_place_rent: 1881, market_rent: 2425 },
          { unit_type: "2BR", in_place_rent: 1881, market_rent: 2425 },
          { unit_type: "2BR", in_place_rent: 1882, market_rent: 2425 },
        ],
      },
    },
  },
  support: { accepted: [], advisory: [], rejected: [] },
};

const html = renderCompleteAcquisitionMemoV2Html({
  sourceTruthPackage,
  sourcePackage: {
    propertyName: "Precision House",
    coreT12: { originalFilename: "Precision_T12.xlsx" },
    coreRentRoll: { originalFilename: "Precision_Rent_Roll.xlsx", extractedFacts: sourceTruthPackage.core.rent_roll.accepted_facts },
    supportDocs: [],
  },
  coreMetrics: {
    units: 8,
    occupancy: 1,
    annualInPlaceRent: 178350,
    annualMarketRent: 202800,
    egi: 1100000,
    opEx: 440000,
    noi: 660000,
  },
  customerSurfaceModel: {
    identity: { propertyName: "Precision House", reportTitle: "Investment Committee Memorandum" },
    sourceBackedFacts: {
      unitMix: {
        ...sourceTruthPackage.core.rent_roll.accepted_facts,
        unit_mix: [
          { label: "1BR", count: 4, current_rent: 1835, market_rent: 1800 },
          { label: "2BR", count: 4, current_rent: 1881, market_rent: 2425 },
        ],
      },
    },
    sections: {},
    qualityManifest: { sectionDispositionEntries: [] },
  },
  reportMeta: { generatedAt: "2026-09-06T20:00:00.000Z", propertyName: "Precision House" },
  propertyProfile: { propertyName: "Precision House" },
});

assert.match(html, /2BR In-Place[\s\S]{0,500}\$1,881\.25/i, "unit-rent visual must use exact canonical category average");
assert.doesNotMatch(html, /2BR In-Place[\s\S]{0,500}>\$1,881<\/div>/i, "rounded category rent cannot replace exact canonical average");
assert.match(html, /Source Period &amp; Currency/);
assert.match(html, /2025-07-01 to 2026-06-30/);
assert.match(html, /CAD/);
assert.match(html, /2026-06-30/);
assert.match(html, /Not stated in accepted source facts/);
assert.match(html, /does not infer a reporting date or currency/i);
assert.doesNotMatch(html, /[—–]/, "precision/provenance surfaces use publication-safe punctuation");

console.log("PASS full-underwriting-precision-provenance-smoke");
