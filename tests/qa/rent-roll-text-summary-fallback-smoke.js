import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parseRentRollFromRowMatrices,
  parseRentRollFromTextSummary,
} from "../../api/parse/parse-doc.js";

const coherentText = [
  "Rent Roll Summary",
  "Total units: 48",
  "Occupied units: 46",
  "Vacant units: 2",
  "Occupancy: 95.83%",
  "In-place monthly rent total: 86400",
  "In-place annual rent total: 1036800",
  "Market monthly rent total: 94800",
  "Market annual rent total: 1137600",
  "Representative sample unit notes: 101, 102, 103 only.",
].join("\n");

const coherent = parseRentRollFromTextSummary(coherentText, { includeDiagnostics: true });
assert.ok(coherent.payload, "expected coherent text summary payload");
assert.equal(coherent.payload.method, "deterministic_text_summary");
assert.equal(coherent.payload.parse_branch, "rent_roll_text_summary_fallback");
assert.equal(coherent.payload.total_units, 48);
assert.equal(coherent.payload.occupied_units, 46);
assert.equal(coherent.payload.vacant_units, 2);
assert.equal(Math.round(coherent.payload.occupancy * 10000) / 10000, 0.9583);
assert.equal(coherent.payload.totals.in_place_rent_monthly, 86400);
assert.equal(coherent.payload.totals.in_place_rent_annual, 1036800);
assert.equal(coherent.payload.totals.market_rent_monthly, 94800);
assert.equal(coherent.payload.totals.market_rent_annual, 1137600);
assert.deepEqual(coherent.payload.units, []);

const representativeBeforeSummary = parseRentRollFromTextSummary(
  [
    "Unit 101 current monthly rent is 1650",
    "Unit 101 market monthly rent is 1800",
    "Representative unit observations only",
    "In-place monthly rent total from occupied units only: 86400",
    "In-place annual rent total: 1036800",
    "Market monthly rent total across all 48 units: 94800",
    "Market annual rent total across all 48 units: 1137600",
    "Occupied units: 46",
    "Vacant units: 2",
    "Total units: 48",
    "Occupancy: 95.83%",
    "These summary totals are the controlling property totals for this rent roll.",
  ].join("\n"),
  { includeDiagnostics: true }
);
assert.ok(representativeBeforeSummary.payload, "expected summary totals to win over representative unit observations");
assert.equal(representativeBeforeSummary.payload.totals.in_place_rent_monthly, 86400);
assert.equal(representativeBeforeSummary.payload.totals.market_rent_monthly, 94800);

const representativeOnlyRejected = parseRentRollFromTextSummary(
  [
    "Unit 101 current monthly rent is 1650",
    "Unit 102 market monthly rent is 1800",
    "Representative unit observations only",
    "sample unit notes",
    "occupied units: 46",
    "vacant units: 2",
    "total units: 48",
    "occupancy: 95.83%",
  ].join("\n"),
  { includeDiagnostics: true }
);
assert.equal(representativeOnlyRejected.payload, null);
assert.equal(
  representativeOnlyRejected.diagnostics.validation_reasons.includes("missing_required_rent_totals"),
  true
);

const summaryBeforeRepresentative = parseRentRollFromTextSummary(
  [
    "In-place monthly rent total from occupied units only: 86400",
    "In-place annual rent total: 1036800",
    "Market monthly rent total across all 48 units: 94800",
    "Market annual rent total across all 48 units: 1137600",
    "Occupied units: 46",
    "Vacant units: 2",
    "Total units: 48",
    "Occupancy: 95.83%",
    "Unit 101 current monthly rent is 1650",
    "Unit 102 market monthly rent is 1800",
  ].join("\n"),
  { includeDiagnostics: true }
);
assert.ok(summaryBeforeRepresentative.payload, "expected summary totals accepted even with representative observations later");
assert.equal(summaryBeforeRepresentative.payload.totals.in_place_rent_annual, 1036800);
assert.equal(summaryBeforeRepresentative.payload.totals.market_rent_annual, 1137600);

const monthlyAnnualMismatch = parseRentRollFromTextSummary(
  coherentText.replace("In-place annual rent total: 1036800", "In-place annual rent total: 1111111"),
  { includeDiagnostics: true }
);
assert.equal(monthlyAnnualMismatch.payload, null);
assert.equal(
  monthlyAnnualMismatch.diagnostics.validation_reasons.includes("in_place_monthly_annual_mismatch"),
  true
);

const occupiedVacantMismatch = parseRentRollFromTextSummary(
  coherentText.replace("Vacant units: 2", "Vacant units: 3"),
  { includeDiagnostics: true }
);
assert.equal(occupiedVacantMismatch.payload, null);
assert.equal(
  occupiedVacantMismatch.diagnostics.validation_reasons.includes("occupied_vacant_total_mismatch"),
  true
);

const occupancyMismatch = parseRentRollFromTextSummary(
  coherentText.replace("Occupancy: 95.83%", "Occupancy: 90%"),
  { includeDiagnostics: true }
);
assert.equal(occupancyMismatch.payload, null);
assert.equal(occupancyMismatch.diagnostics.validation_reasons.includes("occupancy_mismatch"), true);

const annualOnlyDerivation = parseRentRollFromTextSummary(
  [
    "Building units 20",
    "Occupied 18",
    "Vacant 2",
    "Occupancy percentage 90%",
    "Current annual rent total: 720000",
    "Annual market rent total: 780000",
  ].join("\n"),
  { includeDiagnostics: true }
);
assert.ok(annualOnlyDerivation.payload, "expected annual-only payload");
assert.equal(annualOnlyDerivation.payload.totals.in_place_rent_monthly, 60000);
assert.equal(annualOnlyDerivation.payload.totals.market_rent_monthly, 65000);
assert.equal(
  annualOnlyDerivation.diagnostics.derived_fields.includes("in_place_rent_monthly_derived_from_annual"),
  true
);
assert.equal(
  annualOnlyDerivation.diagnostics.derived_fields.includes("market_rent_monthly_derived_from_annual"),
  true
);

const inPlaceOnlyMissingMarket = parseRentRollFromTextSummary(
  [
    "Total units: 10",
    "Occupied units: 9",
    "Vacant units: 1",
    "Occupancy: 90%",
    "In-place monthly rent total: 20000",
  ].join("\n"),
  { includeDiagnostics: true }
);
assert.equal(inPlaceOnlyMissingMarket.payload, null);
assert.equal(
  inPlaceOnlyMissingMarket.diagnostics.validation_reasons.includes("missing_market_rent_totals"),
  true
);
assert.equal(
  inPlaceOnlyMissingMarket.diagnostics.validation_reasons.includes("missing_required_rent_totals"),
  true
);

const marketOnlyMissingInPlace = parseRentRollFromTextSummary(
  [
    "Total units: 10",
    "Occupied units: 9",
    "Vacant units: 1",
    "Occupancy: 90%",
    "Market monthly rent total: 22000",
  ].join("\n"),
  { includeDiagnostics: true }
);
assert.equal(marketOnlyMissingInPlace.payload, null);
assert.equal(
  marketOnlyMissingInPlace.diagnostics.validation_reasons.includes("missing_in_place_rent_totals"),
  true
);
assert.equal(
  marketOnlyMissingInPlace.diagnostics.validation_reasons.includes("missing_required_rent_totals"),
  true
);

const tabularRegressionGuard = parseRentRollFromRowMatrices(
  [
    {
      rows: [
        ["Unit", "Unit Type", "Current Rent", "Status"],
        ["101", "1BR", "1200", "Occupied"],
        ["102", "1BR", "1225", "Occupied"],
        ["201", "2BR", "1450", "Occupied"],
        ["202", "2BR", "1475", "Vacant"],
      ],
    },
  ],
  { includeDiagnostics: true }
);
assert.ok(tabularRegressionGuard.payload, "expected tabular rent roll behavior unchanged");

const parseDocSource = fs.readFileSync("api/parse/parse-doc.js", "utf8");
assert.match(parseDocSource, /parseRentRollFromTextSummary\(extractedText/);
assert.match(parseDocSource, /const acceptedFallbackPayload = deterministicTextSummary \|\| aiRecoveredRentRoll/);
assert.equal(/Final Motherload|Harbourstone/i.test(parseDocSource), false);

console.log("rent-roll-text-summary-fallback smoke PASS");
