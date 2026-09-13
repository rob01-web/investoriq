import assert from "node:assert/strict";
import fs from "node:fs";

import {
  OPERATING_COST_COVERAGE_RATIO,
  calculateOperatingCostCoverageRatio,
  classifyOperatingCostCoverageRatio,
  buildOperatingCostCoverageRatioReceipt,
  operatingCostCoverageRatioToPercent,
  formatOperatingCostCoverageRatio,
} from "../../api/_lib/canonical-operating-metrics.js";
import {
  buildScreeningNoiStabilityHtml,
} from "../../api/_lib/screening-report-renderer.js";

const stonebridgeOccr = calculateOperatingCostCoverageRatio({
  operatingExpenses: 555000,
  grossPotentialRent: 1612800,
});

assert.ok(Number.isFinite(stonebridgeOccr));
assert.ok(Math.abs(stonebridgeOccr - (555000 / 1612800)) <= 1e-12);
assert.equal(OPERATING_COST_COVERAGE_RATIO.label, "Operating Cost Coverage Ratio");
assert.equal(
  OPERATING_COST_COVERAGE_RATIO.formula,
  "total_operating_expenses / gross_potential_rent"
);
assert.equal(classifyOperatingCostCoverageRatio(0.75), "Stable");
assert.equal(classifyOperatingCostCoverageRatio(0.750001), "Sensitized");
assert.equal(classifyOperatingCostCoverageRatio(0.85), "Sensitized");
assert.equal(classifyOperatingCostCoverageRatio(0.850001), "Fragile");
assert.equal(classifyOperatingCostCoverageRatio(-0.01), null);
assert.equal(
  calculateOperatingCostCoverageRatio({
    operatingExpenses: 100,
    grossPotentialRent: 0,
  }),
  null
);
assert.equal(
  calculateOperatingCostCoverageRatio({
    operatingExpenses: -1,
    grossPotentialRent: 100,
  }),
  null
);
assert.equal(
  calculateOperatingCostCoverageRatio({
    operatingExpenses: 200,
    grossPotentialRent: 100,
  }),
  2,
  "Canonical OCCR uses explicit ratio units and must preserve 200% as 2.0"
);
assert.equal(operatingCostCoverageRatioToPercent(2), 200);
assert.equal(formatOperatingCostCoverageRatio(2), "200.0%");
assert.equal(formatOperatingCostCoverageRatio(0.75), "75.0%");

const receipt = buildOperatingCostCoverageRatioReceipt({
  operatingExpenses: 555000,
  grossPotentialRent: 1612800,
  operatingExpensesAuthorityPath: "accepted_t12.total_operating_expenses",
  grossPotentialRentAuthorityPath: "accepted_t12.gross_potential_rent",
});
assert.equal(receipt.key, "operatingCostCoverageRatio");
assert.equal(receipt.label, OPERATING_COST_COVERAGE_RATIO.label);
assert.equal(receipt.units, "ratio");
assert.equal(receipt.formula, OPERATING_COST_COVERAGE_RATIO.formula);
assert.equal(receipt.displayReady, true);
assert.deepEqual(receipt.inputs, {
  operatingExpenses: 555000,
  grossPotentialRent: 1612800,
});

const screeningNoiHtml = buildScreeningNoiStabilityHtml({
  t12Payload: {
    gross_potential_rent: 1612800,
    effective_gross_income: 1500000,
    total_operating_expenses: 555000,
    net_operating_income: 945000,
  },
  computedRentRoll: {
    total_units: 64,
    occupied_units: 60,
    occupancy: 0.9375,
  },
  rentRollPayload: {
    total_units: 64,
    occupied_units: 60,
    occupancy: 0.9375,
  },
  formatCurrency: (value) => `$${Number(value).toLocaleString("en-US")}`,
  operatingCostCoverageRatioReceipt: receipt,
});
assert.match(screeningNoiHtml, /Operating Cost Coverage Ratio<\/td><td>34\.4%/i);
assert.equal(/break[- ]even occupancy/i.test(screeningNoiHtml), false);

const highReceipt = buildOperatingCostCoverageRatioReceipt({
  operatingExpenses: 200,
  grossPotentialRent: 100,
});
const highOccrHtml = buildScreeningNoiStabilityHtml({
  t12Payload: {
    gross_potential_rent: 100,
    effective_gross_income: 100,
    total_operating_expenses: 200,
    net_operating_income: -100,
  },
  computedRentRoll: {},
  rentRollPayload: {},
  formatCurrency: (value) => `$${Number(value).toLocaleString("en-US")}`,
  operatingCostCoverageRatioReceipt: highReceipt,
});
assert.match(highOccrHtml, /Operating Cost Coverage Ratio<\/td><td>200\.0%/i);
assert.equal(/Operating Cost Coverage Ratio<\/td><td>2\.0%/i.test(highOccrHtml), false);

const implSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const rendererSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");
const templateSource = fs.readFileSync("api/report-template-runtime.html", "utf8");
const sealSource = fs.readFileSync("api/_lib/deterministic-report-contract-qa-seal.js", "utf8");
const reportContractQaSource = fs.readFileSync("api/_lib/report-contract-qa.js", "utf8");

assert.match(implSource, /buildOperatingCostCoverageRatioReceipt\(\{/);
assert.equal(
  /operatingCostCoverageRatioR\s*=\s*toRatioMetric\(/.test(implSource),
  false,
  "Canonical OCCR must never pass through magnitude-based ratio normalization"
);
assert.equal(
  /toPercentMetric\(operatingCostCoverageRatioR\)/.test(implSource),
  false,
  "Canonical OCCR must never pass through magnitude-based percentage inference"
);
assert.equal(
  /formatPercent1\(operatingCostCoverageRatioR\)/.test(implSource),
  false,
  "Canonical OCCR must use explicit-ratio formatting"
);
assert.equal(
  /formatPercent1\(canonicalOccrReceipt\.value\)/.test(rendererSource),
  false,
  "Screening OCCR receipt must use explicit-ratio formatting"
);
assert.equal(
  implSource.includes("Number(breakEvenOcc)"),
  false,
  "Screening runtime must not reference the removed local breakEvenOcc variable"
);
assert.equal(
  /const\s+breakEvenOccupancy\s*=/.test(implSource),
  false,
  "Dead local Break-Even compatibility aliases must not remain in the shared generator"
);
assert.equal(
  implSource.includes("operatingCushionPct"),
  false,
  "Retired physical-occupancy cushion state must not remain active"
);
assert.equal(
  /break(?:[-\u2010-\u2015 ]+)even\s+(?:occupancy|occ\.)/i.test(implSource),
  false,
  "Shared generator must not contain retired customer-facing Screening wording or abbreviation"
);
assert.equal(
  /operatingCostCoverageRatioR\s*>\s*0\.(?:75|85)/.test(implSource),
  false,
  "Screening classification must consume canonical OCCR threshold authority"
);
assert.match(
  implSource,
  /operatingCostCoverageRatioReceipt,\s*marketRentPremiumRatio,/s
);
assert.equal(
  /execOccupancy\s*-\s*operatingCostCoverageRatioR/.test(implSource),
  false,
  "Physical occupancy must not be subtracted from OCCR"
);
assert.equal(
  /break(?:[-\u2010-\u2015 ]+)even\s+occupancy/i.test(rendererSource),
  false,
  "Screening renderer must not emit the retired customer-facing concept"
);
assert.equal(
  /break(?:[-\u2010-\u2015 ]+)even\s+occupancy/i.test(templateSource),
  false,
  "Runtime template must not manufacture the retired customer-facing concept"
);
assert.match(templateSource, /Operating Cost Coverage Ratio/);
assert.match(
  sealSource,
  /OPERATING_COST_COVERAGE_FORMULA\s*=\s*OPERATING_COST_COVERAGE_RATIO\.formula/
);
assert.match(sealSource, /OPERATING_COST_COVERAGE_LABEL_MISMATCH/);
assert.match(reportContractQaSource, /buildOperatingCostCoverageRatioReceipt/);

console.log("canonical-operating-cost-coverage-ratio-smoke: ok");
