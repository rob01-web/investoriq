import assert from "node:assert/strict";
import {
  buildSourceReconciliationState,
  resolveCanonicalRentRollAnnualTotals,
} from "../../api/_lib/report-surface-contracts.js";

const computedRentRoll = {
  total_units: 48,
  total_annual_in_place: 1036800,
  total_annual_market: 1137600,
  units: [
    { unit: "101", status: "occupied", in_place_rent: 2100, market_rent: 2250 },
    { unit: "102", status: "occupied", in_place_rent: 2125, market_rent: 2275 },
    { unit: "201", status: "vacant", in_place_rent: 0, market_rent: 2300 },
  ],
};

const rentRollPayload = {
  total_units: 48,
  total_annual_in_place: 1036800,
  total_annual_market: 1137600,
};

const totals = resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
assert.equal(totals.in_place.value, 1036800);
assert.equal(totals.market.value, 1137600);
assert.notEqual(totals.in_place.value, 50700);
assert.match(
  totals.in_place.selected_reason,
  /payload_total_annual_selected|computed_total_annual_selected/
);

const state = buildSourceReconciliationState({
  computedRentRoll,
  rentRollPayload,
  t12Payload: { gross_potential_rent: 1850000 },
});
assert.equal(state.rr_annual_in_place, 1036800);
assert.equal(state.t12_gpr, 1850000);
assert.equal(state.status, "source_reconciliation_required");
assert.ok(
  Math.abs(state.variance_pct - ((1036800 - 1850000) / 1850000)) < 1e-12
);

console.log("phase8-source-reconciliation-authority-smoke: PASS");
