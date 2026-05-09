import assert from "node:assert/strict";
import { parseRentRollFromRowMatrices } from "../../api/parse/parse-doc.js";

const parseRows = (rows) => parseRentRollFromRowMatrices([{ rows }]);

const suiteHeaders = parseRows([
  ["Suite", "Bedroom Type", "Occupancy Status", "Current Rent", "Asking Rent", "SF"],
  ["101", "1BR", "Occupied", "1500", "1600", "650"],
  ["102", "1BR", "Occupied", "1500", "1600", "650"],
  ["201", "2BR", "Vacant", "1900", "2050", "850"],
  ["202", "2BR", "Occupied", "1950", "2050", "850"],
]);

assert.equal(suiteHeaders.total_units, 4);
assert.equal(suiteHeaders.units.length, 4);
assert.equal(suiteHeaders.column_map.unit, "Suite");
assert.equal(suiteHeaders.column_map.in_place_rent, "Current Rent");
assert.equal(suiteHeaders.column_map.market_rent, "Asking Rent");
assert.equal(suiteHeaders.column_map.sqft, "SF");
assert.equal(suiteHeaders.occupancy, 0.75);

const unitNumberHeaders = parseRows([
  ["Unit #", "BR", "Status", "Monthly Rent", "Target Rent", "Area"],
  ["1", "1", "Leased", "1200", "1300", "600"],
  ["2", "1", "Leased", "1250", "1300", "610"],
  ["3", "2", "Vacant", "1550", "1700", "800"],
  ["4", "2", "Leased", "1600", "1700", "805"],
]);

assert.equal(unitNumberHeaders.units.length, 4);
assert.equal(unitNumberHeaders.column_map.unit, "Unit #");
assert.equal(unitNumberHeaders.column_map.in_place_rent, "Monthly Rent");
assert.equal(unitNumberHeaders.column_map.market_rent, "Target Rent");
assert.equal(unitNumberHeaders.occupancy, 0.75);

const aptHeaders = parseRows([
  ["Apt", "Layout", "Lease Status", "Contract Rent", "Pro Forma Rent", "SqFt"],
  ["A", "Studio", "Current", "1100", "1200", "500"],
  ["B", "Studio", "Current", "1125", "1200", "505"],
  ["C", "1BR", "Current", "1400", "1500", "650"],
  ["D", "1BR", "Vacant", "1450", "1500", "655"],
]);

assert.equal(aptHeaders.units.length, 4);
assert.equal(aptHeaders.column_map.unit, "Apt");
assert.equal(aptHeaders.column_map.in_place_rent, "Contract Rent");
assert.equal(aptHeaders.column_map.market_rent, "Pro Forma Rent");
assert.equal(aptHeaders.occupancy, 0.75);

const vagueTotals = parseRows([
  ["Metric", "Value"],
  ["Total Units", "12"],
  ["Occupancy", "95%"],
  ["Rent", "18000"],
]);

assert.equal(vagueTotals, null);

console.log("rent-roll-alias smoke PASS");
