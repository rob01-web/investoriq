export const CANONICAL_OPERATING_METRICS_VERSION = "canonical_operating_metrics_v2";

export const OPERATING_COST_COVERAGE_RATIO = Object.freeze({
  key: "operatingCostCoverageRatio",
  label: "Operating Cost Coverage Ratio",
  units: "ratio",
  formula: "total_operating_expenses / gross_potential_rent",
  thresholds: Object.freeze({
    sensitized: 0.75,
    fragile: 0.85,
  }),
});

export const CANONICAL_OPERATING_METRIC_KEYS = Object.freeze([
  "grossPotentialRent",
  "effectiveGrossIncome",
  "operatingExpenses",
  "netOperatingIncome",
  "expenseRatio",
  "noiMargin",
  "operatingCostCoverageRatio",
  "physicalOccupancy",
  "rentRollOccupancy",
  "units",
  "annualInPlaceRent",
  "annualMarketRent",
  "annualGrossRentDifference",
  "rentToMarketGapRatio",
]);

function finite(value) {
  if (value === null || value === undefined || typeof value === "boolean" ||
      !["number", "string"].includes(typeof value) ||
      (typeof value === "string" && value.trim() === "")) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function valueAtPath(object, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => (value && typeof value === "object" ? value[key] : undefined), object);
}

function firstFact(facts, candidates = []) {
  for (const field of candidates) {
    const value = finite(valueAtPath(facts, field));
    if (value !== null) return { value, field };
  }
  return { value: null, field: null };
}

function explicitRatio(value) {
  const number = finite(value);
  return number !== null && number >= 0 && number <= 1 ? number : null;
}

function sourceReceipt({ key, label, value, units, authorityPath = null } = {}) {
  const number = finite(value);
  const displayReady = number !== null;
  return deepFreeze({
    version: CANONICAL_OPERATING_METRICS_VERSION,
    key,
    label,
    value: displayReady ? number : null,
    units,
    formula: null,
    inputs: null,
    authorityPath: displayReady ? authorityPath : null,
    authorityPaths: displayReady && authorityPath ? [authorityPath] : [],
    provenance: displayReady && authorityPath ? [authorityPath] : [],
    evidenceClass: displayReady ? "source_backed" : "missing_unsupported",
    displayReady,
  });
}

function derivedReceipt({ key, label, value, units, formula, inputs, authorityPaths = [] } = {}) {
  const number = finite(value);
  const displayReady = number !== null;
  const paths = [...new Set((Array.isArray(authorityPaths) ? authorityPaths : []).filter(Boolean))];
  return deepFreeze({
    version: CANONICAL_OPERATING_METRICS_VERSION,
    key,
    label,
    value: displayReady ? number : null,
    units,
    formula: displayReady ? formula : null,
    inputs: displayReady && inputs ? { ...inputs } : null,
    authorityPath: displayReady ? "sourceTruthPackage.shared_operating_metrics.metrics." + key : null,
    authorityPaths: displayReady ? paths : [],
    provenance: displayReady ? paths : [],
    evidenceClass: displayReady ? "deterministic_calculated" : "missing_unsupported",
    displayReady,
  });
}

export function calculateOperatingCostCoverageRatio({
  operatingExpenses = null,
  grossPotentialRent = null,
} = {}) {
  const operatingExpensesValue = finite(operatingExpenses);
  const grossPotentialRentValue = finite(grossPotentialRent);
  if (
    operatingExpensesValue === null ||
    operatingExpensesValue < 0 ||
    grossPotentialRentValue === null ||
    grossPotentialRentValue <= 0
  ) return null;
  return operatingExpensesValue / grossPotentialRentValue;
}

export function classifyOperatingCostCoverageRatio(value) {
  const ratio = finite(value);
  if (ratio === null || ratio < 0) return null;
  if (ratio > OPERATING_COST_COVERAGE_RATIO.thresholds.fragile) return "Fragile";
  if (ratio > OPERATING_COST_COVERAGE_RATIO.thresholds.sensitized) return "Sensitized";
  return "Stable";
}

export function operatingCostCoverageRatioToPercent(value) {
  const ratio = finite(value);
  if (ratio === null || ratio < 0) return null;
  return ratio * 100;
}

export function formatOperatingCostCoverageRatio(value, decimals = 1) {
  const percentage = operatingCostCoverageRatioToPercent(value);
  if (!Number.isFinite(percentage)) return "";
  const digits = Number.isInteger(Number(decimals)) ? Math.min(4, Math.max(0, Number(decimals))) : 1;
  const zeroThreshold = 0.5 * (10 ** -digits);
  const normalized = Math.abs(percentage) < zeroThreshold ? 0 : percentage;
  return normalized.toFixed(digits) + "%";
}

export function buildOperatingCostCoverageRatioReceipt({
  operatingExpenses = null,
  grossPotentialRent = null,
  operatingExpensesAuthorityPath = null,
  grossPotentialRentAuthorityPath = null,
} = {}) {
  const value = calculateOperatingCostCoverageRatio({ operatingExpenses, grossPotentialRent });
  return derivedReceipt({
    key: OPERATING_COST_COVERAGE_RATIO.key,
    label: OPERATING_COST_COVERAGE_RATIO.label,
    value,
    units: OPERATING_COST_COVERAGE_RATIO.units,
    formula: OPERATING_COST_COVERAGE_RATIO.formula,
    inputs: {
      operatingExpenses: finite(operatingExpenses),
      grossPotentialRent: finite(grossPotentialRent),
    },
    authorityPaths: [operatingExpensesAuthorityPath, grossPotentialRentAuthorityPath],
  });
}

export function buildCanonicalOperatingMetricSet({
  t12Facts = {},
  rentRollFacts = {},
  sourceReconciliationState = null,
  t12AuthorityBase = "sourceTruthPackage.core.t12.accepted_facts",
  rentRollAuthorityBase = "sourceTruthPackage.core.rent_roll.accepted_facts",
  reconciliationAuthorityBase = "sourceTruthPackage.source_reconciliation_state",
} = {}) {
  const gprFact = firstFact(t12Facts, ["gross_potential_rent", "gross_scheduled_rent", "gross_potential_income", "gpr"]);
  const egiFact = firstFact(t12Facts, ["effective_gross_income", "gross_income"]);
  const opexFact = firstFact(t12Facts, ["total_operating_expenses", "operating_expenses"]);
  const noiFact = firstFact(t12Facts, ["net_operating_income", "noi"]);
  const physicalOccupancyFact = firstFact(t12Facts, ["physical_occupancy"]);
  const rrOccupancyFact = firstFact(rentRollFacts, ["occupancy", "totals.occupancy"]);
  const unitsFact = firstFact(rentRollFacts, ["total_units", "totals.total_units", "units"]);
  const inPlaceFact = firstFact(rentRollFacts, [
    "annual_in_place_rent",
    "total_in_place_annual",
    "total_annual_in_place",
    "in_place_rent_annual",
    "current_rent_annual",
    "totals.in_place_rent_annual",
    "totals.current_rent_annual",
  ]);
  let marketFact = firstFact(rentRollFacts, [
    "annual_market_rent",
    "total_market_annual",
    "total_annual_market",
    "market_rent_annual",
    "totals.market_rent_annual",
  ]);
  const monthlyMarketFact = firstFact(rentRollFacts, ["market_rent_monthly", "totals.market_rent_monthly"]);

  const gpr = gprFact.value;
  const egi = egiFact.value;
  const operatingExpenses = opexFact.value;
  const noi = noiFact.value;
  const physicalOccupancy = explicitRatio(physicalOccupancyFact.value);
  const occupiedFact = firstFact(rentRollFacts, ["occupied_units", "totals.occupied_units"]);
  const derivedOccupancy = rrOccupancyFact.value === null && unitsFact.value > 0 &&
    occupiedFact.value !== null && occupiedFact.value >= 0 && occupiedFact.value <= unitsFact.value &&
    rentRollFacts.is_partial_sample !== true
      ? occupiedFact.value / unitsFact.value : null;
  const rentRollOccupancy = explicitRatio(rrOccupancyFact.value) ?? derivedOccupancy;
  const units = unitsFact.value;
  const annualInPlaceRent = inPlaceFact.value;
  const annualMarketRent = marketFact.value !== null
    ? marketFact.value
    : monthlyMarketFact.value !== null
      ? monthlyMarketFact.value * 12
      : null;

  const gprReceipt = sourceReceipt({
    key: "grossPotentialRent",
    label: "Gross Potential Rent",
    value: gpr,
    units: "currency_per_year",
    authorityPath: gprFact.field ? t12AuthorityBase + "." + gprFact.field : null,
  });
  const egiReceipt = sourceReceipt({
    key: "effectiveGrossIncome",
    label: "Effective Gross Income",
    value: egi,
    units: "currency_per_year",
    authorityPath: egiFact.field ? t12AuthorityBase + "." + egiFact.field : null,
  });
  const opexReceipt = sourceReceipt({
    key: "operatingExpenses",
    label: "Operating Expenses",
    value: operatingExpenses,
    units: "currency_per_year",
    authorityPath: opexFact.field ? t12AuthorityBase + "." + opexFact.field : null,
  });
  const noiReceipt = sourceReceipt({
    key: "netOperatingIncome",
    label: "Net Operating Income",
    value: noi,
    units: "currency_per_year",
    authorityPath: noiFact.field ? t12AuthorityBase + "." + noiFact.field : null,
  });
  const rrOccupancyReceipt = derivedOccupancy !== null ? derivedReceipt({
    key: "rentRollOccupancy", label: "Rent Roll Occupancy", value: derivedOccupancy, units: "ratio",
    formula: "occupied_units / total_units",
    inputs: { occupiedUnits: occupiedFact.value, totalUnits: unitsFact.value },
    authorityPaths: [rentRollAuthorityBase + "." + occupiedFact.field, rentRollAuthorityBase + "." + unitsFact.field],
  }) : sourceReceipt({
    key: "rentRollOccupancy",
    label: "Rent Roll Occupancy",
    value: rentRollOccupancy,
    units: "ratio",
    authorityPath: rrOccupancyFact.field && rentRollOccupancy !== null
      ? rentRollAuthorityBase + "." + rrOccupancyFact.field
      : null,
  });
  const physicalOccupancyReceipt = sourceReceipt({
    key: "physicalOccupancy",
    label: "Physical Occupancy",
    value: physicalOccupancy,
    units: "ratio",
    authorityPath: physicalOccupancyFact.field && physicalOccupancy !== null
      ? t12AuthorityBase + "." + physicalOccupancyFact.field
      : null,
  });
  const unitsReceipt = sourceReceipt({
    key: "units",
    label: "Units",
    value: units,
    units: "count",
    authorityPath: unitsFact.field ? rentRollAuthorityBase + "." + unitsFact.field : null,
  });
  const inPlaceReceipt = sourceReceipt({
    key: "annualInPlaceRent",
    label: "Annual In-Place Rent",
    value: annualInPlaceRent,
    units: "currency_per_year",
    authorityPath: inPlaceFact.field ? rentRollAuthorityBase + "." + inPlaceFact.field : null,
  });
  const marketReceipt = marketFact.value !== null
    ? sourceReceipt({
        key: "annualMarketRent",
        label: "Annual Market Rent",
        value: annualMarketRent,
        units: "currency_per_year",
        authorityPath: marketFact.field ? rentRollAuthorityBase + "." + marketFact.field : null,
      })
    : derivedReceipt({
        key: "annualMarketRent",
        label: "Annual Market Rent",
        value: annualMarketRent,
        units: "currency_per_year",
        formula: "accepted_monthly_market_rent * 12",
        inputs: { monthlyMarketRent: monthlyMarketFact.value },
        authorityPaths: monthlyMarketFact.field ? [rentRollAuthorityBase + "." + monthlyMarketFact.field] : [],
      });

  const expenseRatio = egi !== null && egi > 0 && operatingExpenses !== null ? operatingExpenses / egi : null;
  const noiMargin = egi !== null && egi > 0 && noi !== null ? noi / egi : null;
  const annualGrossRentDifference = annualInPlaceRent !== null && annualMarketRent !== null
    ? annualMarketRent - annualInPlaceRent
    : null;
  const rentToMarketGapRatio = annualInPlaceRent !== null && annualInPlaceRent > 0 && annualGrossRentDifference !== null
    ? annualGrossRentDifference / annualInPlaceRent
    : null;

  const metrics = {
    grossPotentialRent: gprReceipt,
    effectiveGrossIncome: egiReceipt,
    operatingExpenses: opexReceipt,
    netOperatingIncome: noiReceipt,
    expenseRatio: derivedReceipt({
      key: "expenseRatio",
      label: "Expense Ratio",
      value: expenseRatio,
      units: "ratio",
      formula: "total_operating_expenses / effective_gross_income",
      inputs: { operatingExpenses, effectiveGrossIncome: egi },
      authorityPaths: [opexReceipt.authorityPath, egiReceipt.authorityPath],
    }),
    noiMargin: derivedReceipt({
      key: "noiMargin",
      label: "NOI Margin",
      value: noiMargin,
      units: "ratio",
      formula: "net_operating_income / effective_gross_income",
      inputs: { netOperatingIncome: noi, effectiveGrossIncome: egi },
      authorityPaths: [noiReceipt.authorityPath, egiReceipt.authorityPath],
    }),
    operatingCostCoverageRatio: buildOperatingCostCoverageRatioReceipt({
      operatingExpenses,
      grossPotentialRent: gpr,
      operatingExpensesAuthorityPath: opexReceipt.authorityPath,
      grossPotentialRentAuthorityPath: gprReceipt.authorityPath,
    }),
    physicalOccupancy: physicalOccupancyReceipt,
    rentRollOccupancy: rrOccupancyReceipt,
    units: unitsReceipt,
    annualInPlaceRent: inPlaceReceipt,
    annualMarketRent: marketReceipt,
    annualGrossRentDifference: derivedReceipt({
      key: "annualGrossRentDifference",
      label: "Annual Gross Rent Difference",
      value: annualGrossRentDifference,
      units: "currency_per_year",
      formula: "annual_market_rent - annual_in_place_rent",
      inputs: { annualMarketRent, annualInPlaceRent },
      authorityPaths: [marketReceipt.authorityPath, inPlaceReceipt.authorityPath],
    }),
    rentToMarketGapRatio: derivedReceipt({
      key: "rentToMarketGapRatio",
      label: "Rent-to-Market Gap",
      value: rentToMarketGapRatio,
      units: "ratio",
      formula: "(annual_market_rent - annual_in_place_rent) / annual_in_place_rent",
      inputs: { annualMarketRent, annualInPlaceRent },
      authorityPaths: [marketReceipt.authorityPath, inPlaceReceipt.authorityPath],
    }),
  };

  const reconciliation = sourceReconciliationState && typeof sourceReconciliationState === "object"
    ? deepFreeze({
        status: String(sourceReconciliationState.status || "").trim() || null,
        t12GrossPotentialRent: finite(sourceReconciliationState.t12_gpr),
        rentRollAnnualInPlaceRent: finite(sourceReconciliationState.rr_annual_in_place),
        differenceAmount: finite(sourceReconciliationState.difference_amount),
        varianceRatio: finite(sourceReconciliationState.variance_pct),
        disclosure: String(sourceReconciliationState.source_reconciliation_disclosure || "").trim() || null,
        authorityPath: reconciliationAuthorityBase,
      })
    : null;

  return deepFreeze({
    version: CANONICAL_OPERATING_METRICS_VERSION,
    authority: "canonical_operating_metrics",
    unitsPolicy: "explicit_ratio_units_no_magnitude_inference",
    metrics,
    reconciliation,
  });
}

export function compareCanonicalOperatingMetricSets(left, right, {
  keys = CANONICAL_OPERATING_METRIC_KEYS,
  tolerance = 1e-9,
} = {}) {
  const mismatches = [];
  for (const key of keys) {
    const a = left?.metrics?.[key] || null;
    const b = right?.metrics?.[key] || null;
    const aReady = a?.displayReady === true;
    const bReady = b?.displayReady === true;
    if (aReady !== bReady) {
      mismatches.push({ key, reason: "display_ready_mismatch", left: aReady, right: bReady });
      continue;
    }
    if (!aReady && !bReady) continue;
    const av = finite(a?.value);
    const bv = finite(b?.value);
    if (av === null || bv === null || Math.abs(av - bv) > tolerance) {
      mismatches.push({ key, reason: "value_mismatch", left: av, right: bv });
      continue;
    }
    if (String(a?.units || "") !== String(b?.units || "")) {
      mismatches.push({ key, reason: "units_mismatch", left: a?.units || null, right: b?.units || null });
      continue;
    }
    if (String(a?.formula || "") !== String(b?.formula || "")) {
      mismatches.push({ key, reason: "formula_mismatch", left: a?.formula || null, right: b?.formula || null });
    }
  }
  return deepFreeze({ ok: mismatches.length === 0, mismatches });
}

export function resolveCanonicalOperatingMetricSet(sourceTruthPackage = null) {
  return sourceTruthPackage?.shared_operating_metrics || buildCanonicalOperatingMetricSet({
    t12Facts: sourceTruthPackage?.core?.t12?.accepted_facts || {},
    rentRollFacts: sourceTruthPackage?.core?.rent_roll?.accepted_facts || {},
    sourceReconciliationState: sourceTruthPackage?.source_reconciliation_state || null,
  });
}

export function operatingCostCoverageSealInput(receipt = null) {
  if (!receipt) return null;
  return {
    label: receipt.label,
    units: receipt.units,
    formula: receipt.formula,
    numerator: receipt.inputs?.operatingExpenses ?? null,
    denominator: receipt.inputs?.grossPotentialRent ?? null,
    result: receipt.value,
    displayReady: receipt.displayReady,
    provenance: receipt.provenance || [],
  };
}
