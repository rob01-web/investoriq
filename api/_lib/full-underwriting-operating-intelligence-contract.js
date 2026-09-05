import { reconcileExpenseSource } from "./expense-source-reconciliation.js";
import {
  applySectionDisposition,
  SECTION_CLASSIFICATIONS,
  SECTION_DISPOSITIONS,
} from "./section-disposition-contract.js";

export const FULL_UNDERWRITING_OPERATING_INTELLIGENCE_VERSION =
  "full_underwriting_operating_intelligence_v1";

const SOURCE_TRUTH_MARKER = "canonical_source_truth_package";
const EVIDENCE_CLASSES = Object.freeze({
  SOURCE_BACKED: "source_backed",
  DETERMINISTIC_CALCULATED: "deterministic_calculated",
  THIRD_PARTY_CONTEXT: "third_party_context",
  MISSING_UNSUPPORTED: "missing_unsupported",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ratio(value) {
  const number = finite(value);
  if (number === null) return null;
  return Math.abs(number) > 1.5 ? number / 100 : number;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function firstFinite(...values) {
  for (const value of values) {
    const number = finite(value);
    if (number !== null) return number;
  }
  return null;
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

function isCanonicalSourceTruthPackage(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.source === SOURCE_TRUTH_MARKER &&
      Number(value.schema_version) === 1
  );
}

function metric({
  key,
  label,
  value = null,
  units = null,
  evidenceClass = EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
  authorityPath = null,
  formula = null,
  inputs = null,
  qualification = null,
  provenance = [],
} = {}) {
  const number = finite(value);
  const displayReady = number !== null;
  return {
    key,
    label,
    value: displayReady ? number : null,
    units,
    evidenceClass: displayReady ? evidenceClass : EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
    displayReady,
    authorityPath: displayReady ? authorityPath : null,
    formula: displayReady ? formula : null,
    inputs: displayReady && inputs && typeof inputs === "object" ? { ...inputs } : null,
    qualification: displayReady ? qualification || null : qualification || "Not established by governed inputs.",
    provenance: displayReady ? [...(Array.isArray(provenance) ? provenance : [])] : [],
  };
}

function sourceMetric({ key, label, value, units, authorityPath, provenance = [] }) {
  return metric({
    key,
    label,
    value,
    units,
    evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
    authorityPath,
    provenance,
  });
}

function calculatedMetric({ key, label, value, units, formula, inputs, provenance = [], qualification = null }) {
  return metric({
    key,
    label,
    value,
    units,
    evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
    authorityPath: "full_underwriting_operating_intelligence_contract",
    formula,
    inputs,
    provenance,
    qualification: qualification || "Deterministic calculation from governed accepted operating inputs.",
  });
}

function coreFactMetric({ sourceTruthPackage, coreKey, candidates, fallback, fallbackPath, key, label, units }) {
  const coreEntry = sourceTruthPackage?.core?.[coreKey] || null;
  const facts = coreEntry?.accepted_facts || {};
  for (const field of candidates) {
    const pathParts = String(field).split(".");
    let value = facts;
    for (const part of pathParts) value = value && typeof value === "object" ? value[part] : undefined;
    const number = finite(value);
    if (number !== null) {
      return sourceMetric({
        key,
        label,
        value: number,
        units,
        authorityPath: `sourceTruthPackage.core.${coreKey}.accepted_facts.${field}`,
        provenance: [{
          source: SOURCE_TRUTH_MARKER,
          coreRole: coreKey,
          fileId: coreEntry?.file_id || null,
          artifactId: coreEntry?.artifact_id || null,
          fact: field,
        }],
      });
    }
  }
  return metric({
    key,
    label,
    value: fallback,
    units,
    evidenceClass: finite(fallback) !== null ? EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED : EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
    authorityPath: finite(fallback) !== null ? fallbackPath : null,
    qualification: finite(fallback) !== null
      ? "Existing governed Full Underwriting normalized metric; not promoted to a source-backed fact."
      : null,
    provenance: finite(fallback) !== null && fallbackPath ? [fallbackPath] : [],
  });
}

function normalizeStatementLines(lines, authorityBasePath) {
  return (Array.isArray(lines) ? lines : [])
    .map((row, index) => {
      if (!row || typeof row !== "object") return null;
      const label = text(row.label ?? row.line_label ?? row.lineLabel ?? row.name ?? row.description ?? row.category);
      const amount = finite(row.amount ?? row.value ?? row.total ?? row.annual_amount ?? row.annualAmount);
      if (!label || amount === null) return null;
      return {
        index,
        label,
        amount,
        evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
        authorityPath: `${authorityBasePath}.${index}`,
      };
    })
    .filter(Boolean);
}

function normalizeExpenseLines(sourceTruthPackage, operatingExpenses, units) {
  const raw = sourceTruthPackage?.core?.t12?.accepted_facts?.expense_lines;
  const rows = normalizeStatementLines(raw, "sourceTruthPackage.core.t12.accepted_facts.expense_lines")
    .filter((row) => !/^total\s+(operating\s+)?expenses?$/i.test(row.label))
    .map((row) => ({ ...row }));
  const total = operatingExpenses?.displayReady ? operatingExpenses.value : null;
  const unitCount = units?.displayReady && units.value > 0 ? units.value : null;
  const sourceReconciliation = reconcileExpenseSource(sourceTruthPackage?.core?.t12?.accepted_facts);
  const positiveSum = rows.reduce((sum, row) => sum + (row.amount > 0 ? row.amount : 0), 0);
  const compositionEligible = Boolean(
    total !== null &&
      total > 0 &&
      positiveSum > 0 &&
      positiveSum <= total * 1.05
  );

  const normalized = rows.map((row) => ({
    ...row,
    shareOfOperatingExpenses:
      compositionEligible && row.amount >= 0 ? row.amount / total : null,
    amountPerUnit:
      unitCount !== null ? row.amount / unitCount : null,
  }));
  const ranked = normalized
    .filter((row) => row.amount >= 0)
    .sort((left, right) => right.amount - left.amount);

  return {
    rows: normalized,
    positiveLineItemSum: positiveSum,
    sourceReconciliation,
    compositionEligible,
    largest: compositionEligible && ranked.length > 0 ? ranked[0] : null,
    topThreeShare:
      compositionEligible && ranked.length > 0
        ? ranked.slice(0, 3).reduce((sum, row) => sum + row.amount, 0) / total
        : null,
    lineItemCoverageRatio:
      total !== null && total > 0 && positiveSum > 0 ? positiveSum / total : null,
    qualification:
      normalized.length === 0
        ? "Detailed expense lines were not established by the accepted T12."
        : sourceReconciliation.requiresReconciliation
          ? "The listed expense lines do not reconcile to stated total operating expenses. The stated total and NOI remain unchanged pending source clarification."
          : compositionEligible
          ? null
          : "Expense line-item concentration is not calculated because accepted line items do not reconcile closely enough to stated total operating expenses.",
  };
}

function normalizeIncomeLines(sourceTruthPackage) {
  return normalizeStatementLines(
    sourceTruthPackage?.core?.t12?.accepted_facts?.income_lines,
    "sourceTruthPackage.core.t12.accepted_facts.income_lines"
  );
}

function normalizeUnitMixRows(sourceTruthPackage) {
  const facts = sourceTruthPackage?.core?.rent_roll?.accepted_facts || {};
  const raw = facts.unit_mix;
  const units = Array.isArray(facts.units) ? facts.units : [];
  const category = (row) => text(row.unit_type ?? row.unitType ?? row.label ?? row.type).toLowerCase();
  return (Array.isArray(raw) ? raw : [])
    .map((row, index) => {
      if (!row || typeof row !== "object") return null;
      const label = text(
        row.label ?? row.unit_label ?? row.unitLabel ?? row.unit_type ?? row.unitType ?? row.type ??
        row.bedroom_type ?? row.bedroomType ?? row.bedrooms ?? row.beds
      ) || `Unit Mix ${index + 1}`;
      const count = finite(row.count ?? row.unit_count ?? row.units ?? row.quantity);
      let inPlaceMonthly = finite(
        row.current_rent ?? row.currentRent ?? row.in_place_rent ?? row.inPlaceRent ?? row.rent
      );
      let marketMonthly = finite(
        row.market_rent ?? row.marketRent ?? row.market_rent_monthly ?? row.marketRentMonthly ?? row.market
      );
      if (count === null && inPlaceMonthly === null && marketMonthly === null) return null;
      // Complete accepted unit rows outrank rounded category averages. Never
      // extrapolate an observed subset across an entire unit category.
      const categoryUnits = units.filter((unit) => category(unit) === label.toLowerCase());
      const completeRows = count > 0 && categoryUnits.length === count;
      const currentValues = categoryUnits.map((unit) => finite(unit.in_place_rent ?? unit.current_rent));
      const marketValues = categoryUnits.map((unit) => finite(unit.market_rent));
      const currentComplete = completeRows && currentValues.every((value) => value !== null);
      const marketComplete = completeRows && marketValues.every((value) => value !== null);
      if (currentComplete) inPlaceMonthly = currentValues.reduce((sum, value) => sum + value, 0) / count;
      if (marketComplete) marketMonthly = marketValues.reduce((sum, value) => sum + value, 0) / count;
      const currentCoverage = currentComplete || (categoryUnits.length === 0 &&
        (row.current_rent_count == null || finite(row.current_rent_count) === count));
      const marketCoverage = marketComplete || (categoryUnits.length === 0 &&
        (row.market_rent_count == null || finite(row.market_rent_count) === count));
      const annualInPlaceContribution =
        currentCoverage && count !== null && count > 0 && inPlaceMonthly !== null ? count * inPlaceMonthly * 12 : null;
      const annualMarketContribution =
        marketCoverage && count !== null && count > 0 && marketMonthly !== null ? count * marketMonthly * 12 : null;
      const annualRentGapContribution =
        annualInPlaceContribution !== null && annualMarketContribution !== null
          ? annualMarketContribution - annualInPlaceContribution
          : null;
      return {
        index,
        label,
        count,
        inPlaceMonthly,
        marketMonthly,
        monthlySpread:
          inPlaceMonthly !== null && marketMonthly !== null ? marketMonthly - inPlaceMonthly : null,
        annualInPlaceContribution,
        annualMarketContribution,
        annualRentGapContribution,
        evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
        authorityPath: `sourceTruthPackage.core.rent_roll.accepted_facts.unit_mix.${index}`,
      };
    })
    .filter(Boolean);
}

function normalizeHistoricalPeriods(sourceTruthPackage) {
  const facts = sourceTruthPackage?.core?.t12?.accepted_facts || {};
  const candidates = [
    ["historical_periods", facts.historical_periods],
    ["operating_periods", facts.operating_periods],
    ["periods", facts.periods],
  ];
  const selected = candidates.find(([, value]) => Array.isArray(value)) || ["historical_periods", []];
  const [sourceField, raw] = selected;
  return raw
    .map((row, index) => {
      if (!row || typeof row !== "object") return null;
      const period = text(row.period ?? row.label ?? row.year ?? row.date ?? row.period_label);
      const egi = firstFinite(row.effective_gross_income, row.egi, row.gross_income);
      const operatingExpenses = firstFinite(row.total_operating_expenses, row.operating_expenses, row.op_ex, row.opex);
      const noi = firstFinite(row.net_operating_income, row.noi);
      if (!period || [egi, operatingExpenses, noi].every((value) => value === null)) return null;
      return {
        index,
        period,
        egi,
        operatingExpenses,
        noi,
        evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
        authorityPath: `sourceTruthPackage.core.t12.accepted_facts.${sourceField}.${index}`,
      };
    })
    .filter(Boolean);
}

function disposition({ sectionKey, classification, requestedDisposition, reason = null, compactRendererEligible = true, surviving = [] }) {
  return applySectionDisposition({
    sectionKey,
    classification,
    requestedDisposition,
    minimumSurvivingFactKeys: surviving,
    missingFactOrLimitationReason: reason,
    compactRendererEligible,
    collapseReason: requestedDisposition === SECTION_DISPOSITIONS.COLLAPSE ? reason : null,
    manifestDisclosure: reason,
  });
}

function buildMetrics({ sourceTruthPackage, coreMetrics }) {
  const units = coreFactMetric({
    sourceTruthPackage,
    coreKey: "rent_roll",
    candidates: ["total_units", "totals.total_units"],
    fallback: coreMetrics?.units,
    fallbackPath: "coreMetrics.units",
    key: "units",
    label: "Units",
    units: "count",
  });
  const occupancy = coreFactMetric({
    sourceTruthPackage,
    coreKey: "rent_roll",
    candidates: ["occupancy", "totals.occupancy", "physical_occupancy"],
    fallback: coreMetrics?.occupancy,
    fallbackPath: "coreMetrics.occupancy",
    key: "occupancy",
    label: "Occupancy",
    units: "ratio",
  });
  const annualInPlaceRent = coreFactMetric({
    sourceTruthPackage,
    coreKey: "rent_roll",
    candidates: [
      "annual_in_place_rent",
      "total_in_place_annual",
      "total_annual_in_place",
      "totals.in_place_rent_annual",
      "totals.current_rent_annual",
    ],
    fallback: coreMetrics?.annualInPlaceRent,
    fallbackPath: "coreMetrics.annualInPlaceRent",
    key: "annualInPlaceRent",
    label: "Annual In-Place Rent",
    units: "currency_per_year",
  });
  const annualMarketRent = coreFactMetric({
    sourceTruthPackage,
    coreKey: "rent_roll",
    candidates: ["annual_market_rent", "total_market_annual", "totals.market_rent_annual"],
    fallback: coreMetrics?.annualMarketRent,
    fallbackPath: "coreMetrics.annualMarketRent",
    key: "annualMarketRent",
    label: "Annual Market Rent",
    units: "currency_per_year",
  });
  const grossPotentialRent = coreFactMetric({
    sourceTruthPackage,
    coreKey: "t12",
    candidates: ["gross_potential_rent", "gross_scheduled_rent"],
    fallback: null,
    fallbackPath: null,
    key: "grossPotentialRent",
    label: "Gross Potential Rent",
    units: "currency_per_year",
  });
  const egi = coreFactMetric({
    sourceTruthPackage,
    coreKey: "t12",
    candidates: ["effective_gross_income", "gross_income"],
    fallback: coreMetrics?.egi,
    fallbackPath: "coreMetrics.egi",
    key: "egi",
    label: "Effective Gross Income",
    units: "currency_per_year",
  });
  const operatingExpenses = coreFactMetric({
    sourceTruthPackage,
    coreKey: "t12",
    candidates: ["total_operating_expenses", "operating_expenses"],
    fallback: coreMetrics?.opEx,
    fallbackPath: "coreMetrics.opEx",
    key: "operatingExpenses",
    label: "Operating Expenses",
    units: "currency_per_year",
  });
  const noi = coreFactMetric({
    sourceTruthPackage,
    coreKey: "t12",
    candidates: ["net_operating_income", "noi"],
    fallback: coreMetrics?.noi,
    fallbackPath: "coreMetrics.noi",
    key: "noi",
    label: "Net Operating Income",
    units: "currency_per_year",
  });

  const revenueRealizationGap =
    grossPotentialRent.displayReady && egi.displayReady
      ? calculatedMetric({
          key: "revenueRealizationGap",
          label: "Gross Potential Rent less EGI",
          value: grossPotentialRent.value - egi.value,
          units: "currency_per_year",
          formula: "gross_potential_rent_minus_effective_gross_income",
          inputs: { grossPotentialRent: grossPotentialRent.value, egi: egi.value },
          provenance: [grossPotentialRent.authorityPath, egi.authorityPath],
        })
      : metric({ key: "revenueRealizationGap", label: "Gross Potential Rent less EGI", units: "currency_per_year" });
  const revenueRealizationRatio =
    grossPotentialRent.displayReady && grossPotentialRent.value > 0 && egi.displayReady
      ? calculatedMetric({
          key: "revenueRealizationRatio",
          label: "EGI / Gross Potential Rent",
          value: egi.value / grossPotentialRent.value,
          units: "ratio",
          formula: "effective_gross_income_divided_by_gross_potential_rent",
          inputs: { egi: egi.value, grossPotentialRent: grossPotentialRent.value },
          provenance: [egi.authorityPath, grossPotentialRent.authorityPath],
        })
      : metric({ key: "revenueRealizationRatio", label: "EGI / Gross Potential Rent", units: "ratio" });
  const annualGrossRentDifference =
    annualMarketRent.displayReady && annualInPlaceRent.displayReady
      ? calculatedMetric({
          key: "annualGrossRentDifference",
          label: "Annual Gross Rent Difference",
          value: annualMarketRent.value - annualInPlaceRent.value,
          units: "currency_per_year",
          formula: "annual_market_rent_minus_annual_in_place_rent",
          inputs: { annualMarketRent: annualMarketRent.value, annualInPlaceRent: annualInPlaceRent.value },
          provenance: [annualMarketRent.authorityPath, annualInPlaceRent.authorityPath],
          qualification: "Gross rent evidence only; not NOI and not capitalized by this contract.",
        })
      : metric({ key: "annualGrossRentDifference", label: "Annual Gross Rent Difference", units: "currency_per_year" });
  const annualGrossRentGapRatio =
    annualGrossRentDifference.displayReady && annualInPlaceRent.displayReady && annualInPlaceRent.value > 0
      ? calculatedMetric({
          key: "annualGrossRentGapRatio",
          label: "Annual Gross Rent Difference / In-Place Rent",
          value: annualGrossRentDifference.value / annualInPlaceRent.value,
          units: "ratio",
          formula: "annual_gross_rent_difference_divided_by_annual_in_place_rent",
          inputs: { annualGrossRentDifference: annualGrossRentDifference.value, annualInPlaceRent: annualInPlaceRent.value },
          provenance: [annualGrossRentDifference.authorityPath, annualInPlaceRent.authorityPath],
          qualification: "Gross rent evidence only; not NOI and not capitalized by this contract.",
        })
      : metric({ key: "annualGrossRentGapRatio", label: "Annual Gross Rent Difference / In-Place Rent", units: "ratio" });
  const expenseRatio =
    operatingExpenses.displayReady && egi.displayReady && egi.value !== 0
      ? calculatedMetric({
          key: "expenseRatio",
          label: "Expense Ratio",
          value: operatingExpenses.value / egi.value,
          units: "ratio",
          formula: "operating_expenses_divided_by_effective_gross_income",
          inputs: { operatingExpenses: operatingExpenses.value, egi: egi.value },
          provenance: [operatingExpenses.authorityPath, egi.authorityPath],
        })
      : metric({ key: "expenseRatio", label: "Expense Ratio", value: coreMetrics?.expenseRatio, units: "ratio", evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "coreMetrics.expenseRatio" });
  const noiMargin =
    noi.displayReady && egi.displayReady && egi.value !== 0
      ? calculatedMetric({
          key: "noiMargin",
          label: "NOI Margin",
          value: noi.value / egi.value,
          units: "ratio",
          formula: "net_operating_income_divided_by_effective_gross_income",
          inputs: { noi: noi.value, egi: egi.value },
          provenance: [noi.authorityPath, egi.authorityPath],
        })
      : metric({ key: "noiMargin", label: "NOI Margin", value: coreMetrics?.noiMargin, units: "ratio", evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "coreMetrics.noiMargin" });
  const noiPerUnit =
    noi.displayReady && units.displayReady && units.value > 0
      ? calculatedMetric({
          key: "noiPerUnit",
          label: "NOI per Unit",
          value: noi.value / units.value,
          units: "currency_per_unit_per_year",
          formula: "net_operating_income_divided_by_units",
          inputs: { noi: noi.value, units: units.value },
          provenance: [noi.authorityPath, units.authorityPath],
        })
      : metric({ key: "noiPerUnit", label: "NOI per Unit", units: "currency_per_unit_per_year" });
  const breakEvenOccupancy =
    operatingExpenses.displayReady && grossPotentialRent.displayReady && grossPotentialRent.value > 0
      ? calculatedMetric({
          key: "breakEvenOccupancy",
          label: "Operating Break-Even Occupancy",
          value: operatingExpenses.value / grossPotentialRent.value,
          units: "ratio",
          formula: "operating_expenses_divided_by_gross_potential_rent",
          inputs: { operatingExpenses: operatingExpenses.value, grossPotentialRent: grossPotentialRent.value },
          provenance: [operatingExpenses.authorityPath, grossPotentialRent.authorityPath],
        })
      : metric({ key: "breakEvenOccupancy", label: "Operating Break-Even Occupancy", value: coreMetrics?.breakEvenOccupancy, units: "ratio", evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "coreMetrics.breakEvenOccupancy" });
  const occupancyBreakEvenSpread =
    occupancy.displayReady && breakEvenOccupancy.displayReady
      ? calculatedMetric({
          key: "occupancyBreakEvenSpread",
          label: "Occupancy less Operating Break-Even",
          value: occupancy.value - breakEvenOccupancy.value,
          units: "ratio_delta",
          formula: "occupancy_minus_operating_break_even_occupancy",
          inputs: { occupancy: occupancy.value, breakEvenOccupancy: breakEvenOccupancy.value },
          provenance: [occupancy.authorityPath, breakEvenOccupancy.authorityPath],
        })
      : metric({ key: "occupancyBreakEvenSpread", label: "Occupancy less Operating Break-Even", units: "ratio_delta" });
  const noiIdentityDifference =
    egi.displayReady && operatingExpenses.displayReady && noi.displayReady
      ? calculatedMetric({
          key: "noiIdentityDifference",
          label: "EGI less OpEx less NOI",
          value: egi.value - operatingExpenses.value - noi.value,
          units: "currency_per_year",
          formula: "effective_gross_income_minus_operating_expenses_minus_noi",
          inputs: { egi: egi.value, operatingExpenses: operatingExpenses.value, noi: noi.value },
          provenance: [egi.authorityPath, operatingExpenses.authorityPath, noi.authorityPath],
        })
      : metric({ key: "noiIdentityDifference", label: "EGI less OpEx less NOI", units: "currency_per_year" });

  return {
    units,
    occupancy,
    annualInPlaceRent,
    annualMarketRent,
    grossPotentialRent,
    egi,
    operatingExpenses,
    noi,
    revenueRealizationGap,
    revenueRealizationRatio,
    annualGrossRentDifference,
    annualGrossRentGapRatio,
    expenseRatio,
    noiMargin,
    noiPerUnit,
    breakEvenOccupancy,
    occupancyBreakEvenSpread,
    noiIdentityDifference,
  };
}

function buildUnitConcentration(unitMixRows) {
  const countRows = unitMixRows.filter((row) => row.count !== null && row.count > 0);
  const totalUnitsFromMix = countRows.reduce((sum, row) => sum + row.count, 0);
  const withShares = unitMixRows.map((row) => ({
    ...row,
    unitShare:
      totalUnitsFromMix > 0 && row.count !== null && row.count >= 0 ? row.count / totalUnitsFromMix : null,
  }));
  const rentRows = withShares.filter((row) => row.annualInPlaceContribution !== null && row.annualInPlaceContribution >= 0);
  const totalInPlaceContribution = rentRows.reduce((sum, row) => sum + row.annualInPlaceContribution, 0);
  const gapRows = withShares.filter((row) => row.annualRentGapContribution !== null);
  const enriched = withShares.map((row) => ({
    ...row,
    inPlaceRentContributionShare:
      totalInPlaceContribution > 0 && row.annualInPlaceContribution !== null
        ? row.annualInPlaceContribution / totalInPlaceContribution
        : null,
  }));
  const largestUnitCategory = [...enriched]
    .filter((row) => row.unitShare !== null)
    .sort((a, b) => b.unitShare - a.unitShare)[0] || null;
  const largestRentContributionCategory = [...enriched]
    .filter((row) => row.inPlaceRentContributionShare !== null)
    .sort((a, b) => b.inPlaceRentContributionShare - a.inPlaceRentContributionShare)[0] || null;
  const largestPositiveRentGapCategory = [...gapRows]
    .filter((row) => row.annualRentGapContribution > 0)
    .sort((a, b) => b.annualRentGapContribution - a.annualRentGapContribution)[0] || null;

  return {
    rows: enriched,
    totalUnitsFromMix,
    totalInPlaceContribution,
    largestUnitCategory,
    largestRentContributionCategory,
    largestPositiveRentGapCategory,
  };
}

function interpretation({ code, statement, metrics = [], provenance = [], qualification = null }) {
  return {
    code,
    statement: text(statement),
    evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
    metrics: unique(metrics),
    provenance: unique(provenance),
    qualification: qualification ? text(qualification) : null,
  };
}

function buildInterpretation({ metrics, expenseStructure, concentration, historicalPeriods }) {
  const items = [];
  if (metrics.revenueRealizationRatio.displayReady && metrics.revenueRealizationGap.displayReady) {
    items.push(interpretation({
      code: "REVENUE_REALIZATION",
      statement: `Effective gross income equals ${(metrics.revenueRealizationRatio.value * 100).toFixed(1)}% of accepted gross potential rent; the difference is $${Math.round(metrics.revenueRealizationGap.value).toLocaleString("en-US")}.`,
      metrics: ["revenueRealizationRatio", "revenueRealizationGap"],
      provenance: [metrics.revenueRealizationRatio.authorityPath, metrics.revenueRealizationGap.authorityPath],
    }));
  }
  if (metrics.expenseRatio.displayReady && metrics.noiMargin.displayReady) {
    items.push(interpretation({
      code: "NOI_CONVERSION",
      statement: `Operating expenses equal ${(metrics.expenseRatio.value * 100).toFixed(1)}% of effective gross income and the resulting NOI margin is ${(metrics.noiMargin.value * 100).toFixed(1)}%.`,
      metrics: ["expenseRatio", "noiMargin"],
      provenance: [metrics.expenseRatio.authorityPath, metrics.noiMargin.authorityPath],
    }));
  }
  if (metrics.occupancyBreakEvenSpread.displayReady) {
    const direction = metrics.occupancyBreakEvenSpread.value >= 0 ? "above" : "below";
    items.push(interpretation({
      code: "OCCUPANCY_BREAK_EVEN_POSITION",
      statement: `Accepted occupancy is ${Math.abs(metrics.occupancyBreakEvenSpread.value * 100).toFixed(1)} percentage points ${direction} deterministic operating break-even occupancy.`,
      metrics: ["occupancy", "breakEvenOccupancy", "occupancyBreakEvenSpread"],
      provenance: [metrics.occupancyBreakEvenSpread.authorityPath],
      qualification: "This is an operating break-even relationship only; it does not include debt service unless separately modeled elsewhere.",
    }));
  }
  if (metrics.annualGrossRentDifference.displayReady && metrics.annualGrossRentGapRatio.displayReady) {
    items.push(interpretation({
      code: "DOCUMENTED_RENT_POSITION",
      statement: `Accepted market rent exceeds accepted in-place rent by $${Math.round(metrics.annualGrossRentDifference.value).toLocaleString("en-US")} annually (${(metrics.annualGrossRentGapRatio.value * 100).toFixed(1)}% of in-place rent).`,
      metrics: ["annualGrossRentDifference", "annualGrossRentGapRatio"],
      provenance: [metrics.annualGrossRentDifference.authorityPath, metrics.annualGrossRentGapRatio.authorityPath],
      qualification: "The gross rent difference is not NOI and is not capitalized by this operating-intelligence contract.",
    }));
  }
  if (expenseStructure.largest) {
    items.push(interpretation({
      code: "LARGEST_EXPENSE_CATEGORY",
      statement: `${expenseStructure.largest.label} is the largest listed expense line at $${Math.round(expenseStructure.largest.amount).toLocaleString("en-US")}${expenseStructure.largest.shareOfOperatingExpenses !== null ? ` (${(expenseStructure.largest.shareOfOperatingExpenses * 100).toFixed(1)}% of stated operating expenses)` : ""}.`,
      metrics: ["operatingExpenses"],
      provenance: [expenseStructure.largest.authorityPath],
    }));
  }
  if (concentration.largestUnitCategory) {
    items.push(interpretation({
      code: "UNIT_MIX_CONCENTRATION",
      statement: `${concentration.largestUnitCategory.label} is the largest accepted unit category at ${(concentration.largestUnitCategory.unitShare * 100).toFixed(1)}% of units represented in the accepted unit mix.`,
      metrics: ["units"],
      provenance: [concentration.largestUnitCategory.authorityPath],
    }));
  }
  if (concentration.largestPositiveRentGapCategory) {
    items.push(interpretation({
      code: "LARGEST_RENT_GAP_CATEGORY",
      statement: `${concentration.largestPositiveRentGapCategory.label} contributes the largest positive documented annual gross rent difference among accepted unit-mix rows at $${Math.round(concentration.largestPositiveRentGapCategory.annualRentGapContribution).toLocaleString("en-US")}.`,
      metrics: ["annualGrossRentDifference"],
      provenance: [concentration.largestPositiveRentGapCategory.authorityPath],
      qualification: "Unit-mix rent gaps remain gross rent evidence only.",
    }));
  }
  if (historicalPeriods.length >= 2) {
    const first = historicalPeriods[0];
    const last = historicalPeriods[historicalPeriods.length - 1];
    if (first.noi !== null && last.noi !== null) {
      items.push(interpretation({
        code: "HISTORICAL_NOI_CHANGE",
        statement: `Accepted historical-period NOI changed from $${Math.round(first.noi).toLocaleString("en-US")} in ${first.period} to $${Math.round(last.noi).toLocaleString("en-US")} in ${last.period}.`,
        metrics: ["noi"],
        provenance: [first.authorityPath, last.authorityPath],
        qualification: "Trend language is limited to explicitly accepted historical periods; no additional periods are inferred.",
      }));
    }
  }
  return items;
}

export function buildFullUnderwritingOperatingIntelligenceContract({
  sourceTruthPackage,
  customerSurfaceModel = null,
  coreMetrics = null,
  propertyProfile = null,
  reportMeta = null,
} = {}) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error("CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_ELITE_OPERATING_INTELLIGENCE");
  }

  const metrics = buildMetrics({ sourceTruthPackage, coreMetrics });
  const incomeLines = normalizeIncomeLines(sourceTruthPackage);
  const expenseStructure = normalizeExpenseLines(sourceTruthPackage, metrics.operatingExpenses, metrics.units);
  const unitMixRows = normalizeUnitMixRows(sourceTruthPackage);
  const concentration = buildUnitConcentration(unitMixRows);
  const historicalPeriods = normalizeHistoricalPeriods(sourceTruthPackage);
  const interpretationItems = buildInterpretation({ metrics, expenseStructure, concentration, historicalPeriods });
  const coreSourceMode = text(sourceTruthPackage?.core_input_sufficiency_state?.evidence?.core_source_mode) ||
    text(sourceTruthPackage?.core_publication_constitution?.core_source_mode) || null;
  const hasT12 = Boolean(sourceTruthPackage?.core?.t12);
  const hasRentRoll = Boolean(sourceTruthPackage?.core?.rent_roll);

  const sectionDispositions = {
    operatingPerformanceOverview: disposition({
      sectionKey: "eliteOperatingPerformanceOverview",
      classification: SECTION_CLASSIFICATIONS.CORE_REQUIRED,
      requestedDisposition: hasT12 && hasRentRoll ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
      reason: hasT12 && hasRentRoll ? null : "Operating overview is qualified because one core operating lane is unavailable.",
      surviving: Object.entries(metrics).filter(([, value]) => value?.displayReady).map(([key]) => key),
    }),
    revenueQuality: disposition({
      sectionKey: "eliteRevenueQuality",
      classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
      requestedDisposition:
        metrics.egi.displayReady && metrics.grossPotentialRent.displayReady
          ? SECTION_DISPOSITIONS.INCLUDE
          : metrics.egi.displayReady || metrics.annualInPlaceRent.displayReady
            ? SECTION_DISPOSITIONS.INCLUDE_QUALIFIED
            : SECTION_DISPOSITIONS.COLLAPSE,
      reason: metrics.egi.displayReady && metrics.grossPotentialRent.displayReady
        ? null
        : "Revenue quality is limited because accepted gross-potential-rent and EGI coverage is incomplete.",
      surviving: ["grossPotentialRent", "egi", "annualInPlaceRent", "annualMarketRent"].filter((key) => metrics[key]?.displayReady),
    }),
    expenseStructure: disposition({
      sectionKey: "eliteExpenseStructure",
      classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
      requestedDisposition:
        expenseStructure.rows.length > 0 && expenseStructure.compositionEligible
          ? SECTION_DISPOSITIONS.INCLUDE
          : metrics.operatingExpenses.displayReady
            ? SECTION_DISPOSITIONS.COMPACT
            : SECTION_DISPOSITIONS.COLLAPSE,
      reason: expenseStructure.qualification,
      surviving: ["operatingExpenses", "expenseRatio"].filter((key) => metrics[key]?.displayReady),
    }),
    noiAnalysis: disposition({
      sectionKey: "eliteNoiMarginAnalysis",
      classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
      requestedDisposition:
        metrics.noi.displayReady && metrics.egi.displayReady && metrics.operatingExpenses.displayReady
          ? SECTION_DISPOSITIONS.INCLUDE
          : metrics.noi.displayReady
            ? SECTION_DISPOSITIONS.INCLUDE_QUALIFIED
            : SECTION_DISPOSITIONS.COLLAPSE,
      reason: metrics.noi.displayReady && metrics.egi.displayReady && metrics.operatingExpenses.displayReady
        ? null
        : "NOI interpretation is limited because one or more operating-statement totals are unavailable.",
      surviving: ["noi", "noiMargin", "noiPerUnit", "breakEvenOccupancy", "occupancyBreakEvenSpread"].filter((key) => metrics[key]?.displayReady),
    }),
    unitRentConcentration: disposition({
      sectionKey: "eliteUnitRentConcentration",
      classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
      requestedDisposition:
        concentration.rows.length > 0
          ? SECTION_DISPOSITIONS.INCLUDE
          : metrics.units.displayReady || metrics.annualInPlaceRent.displayReady
            ? SECTION_DISPOSITIONS.COMPACT
            : SECTION_DISPOSITIONS.COLLAPSE,
      reason: concentration.rows.length > 0 ? null : "Detailed unit-mix rows are unavailable; concentration analysis is limited.",
      surviving: ["units", "annualInPlaceRent", "annualMarketRent"].filter((key) => metrics[key]?.displayReady),
    }),
    operatingInterpretation: disposition({
      sectionKey: "eliteOperatingInterpretation",
      classification: SECTION_CLASSIFICATIONS.CORE_REQUIRED,
      requestedDisposition:
        interpretationItems.length >= 3
          ? SECTION_DISPOSITIONS.INCLUDE
          : interpretationItems.length > 0
            ? SECTION_DISPOSITIONS.INCLUDE_QUALIFIED
            : SECTION_DISPOSITIONS.COMPACT,
      reason: interpretationItems.length > 0 ? null : "Operating interpretation is limited to surviving governed facts.",
      surviving: interpretationItems.map((item) => item.code),
    }),
  };

  const propertyName = text(
    customerSurfaceModel?.identity?.propertyName ||
      propertyProfile?.propertyName || propertyProfile?.property_name ||
      reportMeta?.propertyName || reportMeta?.property_name ||
      sourceTruthPackage?.property_name
  ) || null;

  const contract = {
    version: FULL_UNDERWRITING_OPERATING_INTELLIGENCE_VERSION,
    authority: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      revisionAuthority: false,
      scenarioAllowed: false,
      thresholdInferenceAllowed: false,
      investmentRecommendationAllowed: false,
      grossRentCapitalizationAllowed: false,
    },
    sourceTruthReceipt: {
      source: sourceTruthPackage.source,
      schemaVersion: sourceTruthPackage.schema_version,
      jobId: sourceTruthPackage.job_id || null,
      coreSourceMode,
      corePublishable: sourceTruthPackage.core_publishable === true,
    },
    identity: {
      propertyName,
    },
    metrics,
    ttmOperatingStatement: {
      evidenceClass: hasT12 ? EVIDENCE_CLASSES.SOURCE_BACKED : EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
      incomeLines,
      expenseLines: expenseStructure.rows,
      historicalPeriods,
      historicalTrendAvailable: historicalPeriods.length >= 2,
    },
    revenueQuality: {
      disposition: sectionDispositions.revenueQuality,
      grossPotentialRent: metrics.grossPotentialRent,
      effectiveGrossIncome: metrics.egi,
      revenueRealizationGap: metrics.revenueRealizationGap,
      revenueRealizationRatio: metrics.revenueRealizationRatio,
      annualInPlaceRent: metrics.annualInPlaceRent,
      annualMarketRent: metrics.annualMarketRent,
      annualGrossRentDifference: metrics.annualGrossRentDifference,
      annualGrossRentGapRatio: metrics.annualGrossRentGapRatio,
      grossRentCapitalizationAuthorized: false,
    },
    expenseStructure: {
      disposition: sectionDispositions.expenseStructure,
      operatingExpenses: metrics.operatingExpenses,
      expenseRatio: metrics.expenseRatio,
      rows: expenseStructure.rows,
      largestExpenseCategory: expenseStructure.largest,
      topThreeExpenseShare: expenseStructure.topThreeShare,
      lineItemCoverageRatio: expenseStructure.lineItemCoverageRatio,
      sourceReconciliation: expenseStructure.sourceReconciliation,
      compositionEligible: expenseStructure.compositionEligible,
      qualification: expenseStructure.qualification,
    },
    noiAnalysis: {
      disposition: sectionDispositions.noiAnalysis,
      egi: metrics.egi,
      operatingExpenses: metrics.operatingExpenses,
      noi: metrics.noi,
      noiMargin: metrics.noiMargin,
      noiPerUnit: metrics.noiPerUnit,
      breakEvenOccupancy: metrics.breakEvenOccupancy,
      occupancy: metrics.occupancy,
      occupancyBreakEvenSpread: metrics.occupancyBreakEvenSpread,
      noiIdentityDifference: metrics.noiIdentityDifference,
      noiIdentityReconciles:
        metrics.noiIdentityDifference.displayReady && metrics.noi.displayReady
          ? Math.abs(metrics.noiIdentityDifference.value) <= Math.max(1, Math.abs(metrics.noi.value) * 0.01)
          : null,
    },
    unitRentConcentration: {
      disposition: sectionDispositions.unitRentConcentration,
      rows: concentration.rows,
      totalUnitsFromMix: concentration.totalUnitsFromMix,
      totalInPlaceContribution: concentration.totalInPlaceContribution,
      largestUnitCategory: concentration.largestUnitCategory,
      largestRentContributionCategory: concentration.largestRentContributionCategory,
      largestPositiveRentGapCategory: concentration.largestPositiveRentGapCategory,
      occupancyConcentrationEstablished: false,
      occupancyConcentrationQualification:
        "Occupancy concentration by unit type is not inferred unless accepted unit-level occupancy evidence establishes it.",
    },
    operatingInterpretation: {
      disposition: sectionDispositions.operatingInterpretation,
      items: interpretationItems,
    },
    sectionDispositions,
    provenance: {
      sourceTruthFieldsUsed: unique([
        ...Object.values(metrics).flatMap((entry) => entry?.provenance || []),
        ...expenseStructure.rows.map((row) => row.authorityPath),
        ...concentration.rows.map((row) => row.authorityPath),
        ...historicalPeriods.map((row) => row.authorityPath),
      ].map((value) => typeof value === "string" ? value : JSON.stringify(value))),
      rawParserInputsUsed: false,
      scenarioInputsUsed: false,
      externalMarketInputsUsed: false,
    },
  };

  return deepFreeze(contract);
}

export function validateFullUnderwritingOperatingIntelligenceContract(contract) {
  const issues = [];
  if (!contract || typeof contract !== "object") issues.push("CONTRACT_REQUIRED");
  if (contract?.version !== FULL_UNDERWRITING_OPERATING_INTELLIGENCE_VERSION) issues.push("VERSION_INVALID");
  if (contract?.authority?.authorityCreating !== false) issues.push("AUTHORITY_CREATING_MUST_BE_FALSE");
  if (contract?.authority?.sourceTruthMutationAllowed !== false) issues.push("SOURCE_TRUTH_MUTATION_MUST_BE_FALSE");
  if (contract?.authority?.scenarioAllowed !== false) issues.push("SCENARIO_MUST_BE_FALSE_FOR_ELITE_03");
  if (contract?.authority?.investmentRecommendationAllowed !== false) issues.push("RECOMMENDATION_MUST_BE_FALSE");
  if (contract?.authority?.grossRentCapitalizationAllowed !== false) issues.push("GROSS_RENT_CAPITALIZATION_MUST_BE_FALSE");
  if (contract?.sourceTruthReceipt?.source !== SOURCE_TRUTH_MARKER) issues.push("SOURCE_TRUTH_RECEIPT_INVALID");
  if (contract?.revenueQuality?.grossRentCapitalizationAuthorized !== false) issues.push("RENT_GAP_CAPITALIZATION_FIREWALL_INVALID");
  if (contract?.unitRentConcentration?.occupancyConcentrationEstablished !== false) issues.push("OCCUPANCY_CONCENTRATION_INFERENCE_FORBIDDEN");

  const serialized = JSON.stringify(contract).toUpperCase();
  for (const token of ["\"BUY\"", "\"SELL\"", "\"HOLD\"", "IRR", "MOIC"]) {
    if (serialized.includes(token)) issues.push(`FORBIDDEN_TOKEN_${token.replace(/[^A-Z]/g, "")}`);
  }
  return { ok: issues.length === 0, issues };
}

export const FULL_UNDERWRITING_OPERATING_INTELLIGENCE_EVIDENCE_CLASSES = EVIDENCE_CLASSES;
