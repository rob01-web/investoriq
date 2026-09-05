import assert from 'node:assert/strict';
import XLSX from 'xlsx';
import { parseRentRollFromRowMatrices, parseT12FromRowMatrices } from '../../api/parse/parse-doc.js';
import { resolveCanonicalRentRollAnnualTotals } from '../../api/_lib/report-surface-contracts.js';
import { buildFullUnderwritingOperatingIntelligenceContract } from '../../api/_lib/full-underwriting-operating-intelligence-contract.js';
import { publicationMoney, publicationPercent, publicationCushion } from '../../api/_lib/publication-format.js';
const sourceRoot = new URL('../investoriq_validation_fixtures_UPLOADABLE/Final%20Attack%20Test%208/', import.meta.url);
function parse(filename, parser) {
  const book = XLSX.readFile(new URL(filename, sourceRoot));
  return parser(book.SheetNames.map((name) => ({ rows: XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1, defval: null }) })));
}
const t12 = parse('T12_Stonebridge_Lofts_Attack_Test_8.xlsx', parseT12FromRowMatrices);
const rr = parse('Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx', parseRentRollFromRowMatrices);
assert.equal(rr.units.length, 64);
assert.equal(rr.occupancy, 60 / 64);
assert.equal(t12.effective_gross_income - t12.total_operating_expenses, t12.net_operating_income);
assert.equal(t12.expense_lines.reduce((sum, row) => sum + row.amount, 0), 535000);
assert.equal(rr.unit_mix[1].current_rent, 1881.25, 'Never round analytical inputs to whole dollars');
const totals = resolveCanonicalRentRollAnnualTotals({ rentRollPayload: rr });
assert.equal(totals.in_place.value, 1432800);
assert.equal(totals.market.value, 1718400);
const sourceTruthPackage = { source: 'canonical_source_truth_package', schema_version: 1, core_publishable: true,
  core: { t12: { accepted_facts: t12 }, rent_roll: { accepted_facts: {
    ...rr, annual_in_place_rent: totals.in_place.value, annual_market_rent: totals.market.value,
    // Replay an existing rounded artifact: complete unit rows must still win.
    unit_mix: rr.unit_mix.map((row) => ({ ...row, current_rent: Math.round(row.current_rent) })),
  } } } };
const contract = buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage });
assert.equal(contract.metrics.annualGrossRentDifference.value, 285600);
assert.equal(contract.unitRentConcentration.rows.reduce((sum, row) => sum + row.annualRentGapContribution, 0), 285600);
assert.equal(contract.unitRentConcentration.rows[1].inPlaceMonthly, 1881.25);
assert.equal(contract.expenseStructure.sourceReconciliation.difference, 20000);
assert.equal(contract.expenseStructure.sourceReconciliation.requiresReconciliation, true);
assert.equal(contract.metrics.noiMargin.value, 0.63);
assert.equal(contract.metrics.expenseRatio.value, 0.37);
assert.equal(contract.metrics.breakEvenOccupancy.value, 555000 / 1612800);
const summaryOnly = resolveCanonicalRentRollAnnualTotals({ rentRollPayload: {
  total_units: 64, summary_row_detected: true, is_partial_sample: true,
  totals: { in_place_rent_monthly: 119400, market_rent_monthly: 143200 },
} });
assert.equal(summaryOnly.in_place.value, 1432800, 'Monthly source totals must be annualized');
assert.equal(summaryOnly.market.value, 1718400);
const noMarket = resolveCanonicalRentRollAnnualTotals({ rentRollPayload: {
  total_units: 4, units: Array.from({ length: 4 }, (_, i) => ({ unit: String(i), rent: 1000 })),
} });
assert.equal(noMarket.in_place.value, 48000);
assert.equal(noMarket.market.value, null, 'Actual rent cannot stand in for absent market rent');
const incomplete = resolveCanonicalRentRollAnnualTotals({ rentRollPayload: {
  total_units: 4, units: [{ rent: 1000 }, { rent: 1000 }, { rent: null }, { rent: 1000 }],
} });
assert.equal(incomplete.in_place.value, null, 'A partial rent sum is not a property annual total');
const vacant = resolveCanonicalRentRollAnnualTotals({ rentRollPayload: {
  total_units: 4, units: Array.from({ length: 4 }, () => ({ in_place_rent: 0, market_rent: 1000 })),
} });
assert.equal(vacant.in_place.value, 0, 'Explicit zero rent is valid evidence');
for (const missing of [null, undefined, '', ' ', false, NaN, Infinity]) {
  assert.equal(publicationMoney(missing), 'Not available');
  assert.equal(publicationPercent(missing), 'Not available');
}
assert.equal(publicationMoney(0), '$0');
assert.equal(publicationMoney(945000 / 0.07 / 64), '$210,938');
assert.equal(publicationMoney(13500000 / 64), '$210,938');
assert.equal(publicationMoney(-0.001), '$0');
assert.equal(publicationCushion(0.3, 0.4), '10.0 pp below break-even');
console.log('publication-math-continuity: PASS (actual XLSX parsing, source reconciliation, category totals, missing evidence, shared rounding)');
