import {
  applySectionDisposition,
  DETAILED_LINEAGE_PLACEMENTS,
  SECTION_CLASSIFICATIONS,
  SECTION_DISPOSITIONS,
} from "./section-disposition-contract.js";

export const FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION =
  "full_underwriting_chapter1_elite_v1";

const SOURCE_TRUTH_MARKER = "canonical_source_truth_package";
const FINANCIAL_INTELLIGENCE_MARKER = "canonical_institutional_financial_intelligence";

const EVIDENCE_CLASSES = Object.freeze({
  SOURCE_BACKED: "source_backed",
  DETERMINISTIC_CALCULATED: "deterministic_calculated",
  THIRD_PARTY_CONTEXT: "third_party_context",
  MISSING_UNSUPPORTED: "missing_unsupported",
});

const FORBIDDEN_DECISION_TOKENS = Object.freeze([
  "BUY",
  "SELL",
  "HOLD",
  "IRR",
  "MOIC",
  "FINAL RECOMMENDATION",
]);

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

function firstFinite(...values) {
  for (const value of values) {
    const number = finite(value);
    if (number !== null) return number;
  }
  return null;
}

function positive(value) {
  const number = finite(value);
  return number !== null && number > 0 ? number : null;
}

function normalizeRatio(value) {
  const number = finite(value);
  if (number === null) return null;
  return Math.abs(number) > 1.5 ? number / 100 : number;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
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

function isCanonicalFinancialIntelligenceForSource(value, sourceTruthPackage) {
  if (!value) return true;
  return Boolean(
    value &&
      typeof value === "object" &&
      value.source === FINANCIAL_INTELLIGENCE_MARKER &&
      Number(value.receiptVersion) === 1 &&
      value.sourceTruthReceipt?.source === SOURCE_TRUTH_MARKER &&
      String(value.sourceTruthReceipt?.jobId || "") === String(sourceTruthPackage?.job_id || "") &&
      value.policy?.authorityCreating === false &&
      value.policy?.sourceTruthMutationAllowed === false &&
      value.policy?.downstreamConsumeOnly === true &&
      value.policy?.deterministicMathOnly === true &&
      value.policy?.thresholdInferenceAllowed === false &&
      value.policy?.scenarioInferenceAllowed === false &&
      value.reportPublicationBlocker === false
  );
}

function evidencePath(source, field) {
  return `${source}.${field}`;
}

function valueAtPath(object, path) {
  if (!object || typeof object !== "object") return undefined;
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => (value && typeof value === "object" ? value[key] : undefined), object);
}

function metricReceipt({
  key,
  label,
  value = null,
  units = null,
  evidenceClass = EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
  qualification = null,
  authorityPath = null,
  calculationReceiptKey = null,
  provenance = [],
  formula = null,
  inputs = null,
} = {}) {
  const numericValue = finite(value);
  const displayReady = numericValue !== null;
  return {
    key,
    label,
    value: displayReady ? numericValue : null,
    units,
    evidenceClass: displayReady ? evidenceClass : EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
    displayReady,
    qualification: displayReady ? qualification || null : qualification || "Not established by governed inputs.",
    authorityPath: displayReady ? authorityPath || null : null,
    calculationReceiptKey: displayReady ? calculationReceiptKey || null : null,
    provenance: displayReady ? [...(Array.isArray(provenance) ? provenance : [])] : [],
    formula: displayReady ? formula || null : null,
    inputs: displayReady && inputs && typeof inputs === "object" ? { ...inputs } : null,
  };
}

function sourceMetric({ key, label, value, units, authorityPath, provenance = [] }) {
  return metricReceipt({
    key,
    label,
    value,
    units,
    evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
    authorityPath,
    provenance,
  });
}

function governedFallbackMetric({ key, label, value, units, authorityPath }) {
  return metricReceipt({
    key,
    label,
    value,
    units,
    evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
    authorityPath,
    qualification:
      "Existing governed Full Underwriting normalized metric; not promoted to a source-backed fact.",
    provenance: [authorityPath],
  });
}

function derivedMetric({ key, label, value, units, formula, inputs, provenance = [] }) {
  return metricReceipt({
    key,
    label,
    value,
    units,
    evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
    authorityPath: "full_underwriting_chapter1_elite_contract",
    qualification: "Deterministic calculation from governed accepted inputs.",
    provenance,
    formula,
    inputs,
  });
}

function acceptedSupportEntries(sourceTruthPackage) {
  return Array.isArray(sourceTruthPackage?.support?.accepted)
    ? sourceTruthPackage.support.accepted.filter((entry) => entry && typeof entry === "object")
    : [];
}

function supportEntryByRole(sourceTruthPackage, canonicalRole) {
  const role = String(canonicalRole || "").trim();
  const matches = acceptedSupportEntries(sourceTruthPackage).filter(
    (entry) => String(entry?.canonical_role || "").trim() === role
  );
  return matches.find((entry) => entry?.primary_for_role === true) || matches[0] || null;
}

function advisorySourcePresentByRole(sourceTruthPackage, canonicalRole) {
  const role = String(canonicalRole || "").trim();
  const advisory = Array.isArray(sourceTruthPackage?.support?.advisory)
    ? sourceTruthPackage.support.advisory
    : [];
  return advisory.some((entry) => {
    const decisionRole = String(entry?.authority_decision?.canonicalRole || entry?.canonical_role || "").trim();
    return decisionRole === role;
  });
}

function calculationReceiptByKey(financialIntelligence, calculationKey) {
  if (!financialIntelligence || !Array.isArray(financialIntelligence.calculationReceipts)) return null;
  return (
    financialIntelligence.calculationReceipts.find(
      (receipt) => String(receipt?.calculationKey || "") === String(calculationKey || "")
    ) || null
  );
}

function metricFromCalculationReceipt(financialIntelligence, calculationKey, key, label, units) {
  const receipt = calculationReceiptByKey(financialIntelligence, calculationKey);
  const eligible = Boolean(
    receipt?.eligible === true &&
      receipt?.sectionDisplayReady === true &&
      finite(receipt?.result) !== null &&
      receipt?.authority?.source === FINANCIAL_INTELLIGENCE_MARKER &&
      receipt?.authority?.authorityCreating === false
  );
  if (!eligible) return metricReceipt({ key, label, units });
  return metricReceipt({
    key,
    label,
    value: receipt.result,
    units,
    evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
    qualification: receipt.qualification || "Deterministic calculation from governed accepted inputs.",
    authorityPath: `financialIntelligence.calculationReceipts.${calculationKey}`,
    calculationReceiptKey: calculationKey,
    provenance: Array.isArray(receipt.inputProvenance) ? receipt.inputProvenance : [],
    formula: receipt.formula || null,
    inputs: receipt.inputs || null,
  });
}

function factEvidence(entry, field) {
  if (!entry || !field) return [];
  const evidence = entry?.accepted_fact_evidence?.[field] || entry?.accepted_return_input_fact_evidence?.[field];
  if (!evidence) return [];
  return [evidence];
}

function directFactMetric({ key, label, units, entry, candidates = [], fallback = null, fallbackPath = null }) {
  const facts = entry?.accepted_facts || {};
  for (const field of candidates) {
    const value = finite(valueAtPath(facts, field));
    if (value !== null) {
      return sourceMetric({
        key,
        label,
        value,
        units,
        authorityPath: evidencePath("sourceTruthPackage", `support.accepted.${entry?.canonical_role || "support"}.accepted_facts.${field}`),
        provenance: factEvidence(entry, field),
      });
    }
  }
  return governedFallbackMetric({ key, label, value: fallback, units, authorityPath: fallbackPath });
}

function coreFactMetric({
  key,
  label,
  units,
  coreEntry,
  coreKey,
  candidates = [],
  fallback = null,
  fallbackPath = null,
}) {
  const facts = coreEntry?.accepted_facts || {};
  for (const field of candidates) {
    const value = finite(valueAtPath(facts, field));
    if (value !== null) {
      return sourceMetric({
        key,
        label,
        value,
        units,
        authorityPath: `sourceTruthPackage.core.${coreKey}.accepted_facts.${field}`,
        provenance: [
          {
            source: SOURCE_TRUTH_MARKER,
            coreRole: coreKey,
            fileId: coreEntry?.file_id || null,
            artifactId: coreEntry?.artifact_id || null,
            fact: field,
          },
        ],
      });
    }
  }
  return governedFallbackMetric({ key, label, value: fallback, units, authorityPath: fallbackPath });
}

function buildMetrics({ sourceTruthPackage, financialIntelligence, coreMetrics }) {
  const t12 = sourceTruthPackage?.core?.t12 || null;
  const rentRoll = sourceTruthPackage?.core?.rent_roll || null;
  const purchase = supportEntryByRole(sourceTruthPackage, "purchase_assumptions");
  const currentDebt = supportEntryByRole(sourceTruthPackage, "current_debt_context");

  const units = coreFactMetric({
    key: "units",
    label: "Units",
    units: "count",
    coreEntry: rentRoll,
    coreKey: "rent_roll",
    candidates: ["total_units", "totals.total_units", "units"],
    fallback: coreMetrics?.units,
    fallbackPath: "coreMetrics.units",
  });

  const occupancy = coreFactMetric({
    key: "occupancy",
    label: "Occupancy",
    units: "ratio",
    coreEntry: rentRoll,
    coreKey: "rent_roll",
    candidates: ["occupancy", "totals.occupancy", "physical_occupancy"],
    fallback: coreMetrics?.occupancy,
    fallbackPath: "coreMetrics.occupancy",
  });

  const annualInPlaceRent = coreFactMetric({
    key: "annualInPlaceRent",
    label: "Annual In-Place Rent",
    units: "currency_per_year",
    coreEntry: rentRoll,
    coreKey: "rent_roll",
    candidates: [
      "total_in_place_annual",
      "annual_in_place_rent",
      "total_annual_in_place",
      "in_place_rent_annual",
      "current_rent_annual",
      "totals.in_place_rent_annual",
      "totals.current_rent_annual",
    ],
    fallback: coreMetrics?.annualInPlaceRent,
    fallbackPath: "coreMetrics.annualInPlaceRent",
  });

  let annualMarketRent = coreFactMetric({
    key: "annualMarketRent",
    label: "Annual Market Rent",
    units: "currency_per_year",
    coreEntry: rentRoll,
    coreKey: "rent_roll",
    candidates: [
      "total_market_annual",
      "annual_market_rent",
      "total_annual_market",
      "market_rent_annual",
      "totals.market_rent_annual",
    ],
    fallback: coreMetrics?.annualMarketRent,
    fallbackPath: "coreMetrics.annualMarketRent",
  });
  if (annualMarketRent.displayReady !== true) {
    const monthlyMarket = firstFinite(
      rentRoll?.accepted_facts?.totals?.market_rent_monthly,
      rentRoll?.accepted_facts?.market_rent_monthly
    );
    if (monthlyMarket !== null) {
      annualMarketRent = derivedMetric({
        key: "annualMarketRent",
        label: "Annual Market Rent",
        value: monthlyMarket * 12,
        units: "currency_per_year",
        formula: "accepted_monthly_market_rent_times_12",
        inputs: { monthlyMarketRent: monthlyMarket },
        provenance: ["sourceTruthPackage.core.rent_roll.accepted_facts.market_rent_monthly"],
      });
    }
  }

  const egi = coreFactMetric({
    key: "egi",
    label: "Effective Gross Income",
    units: "currency_per_year",
    coreEntry: t12,
    coreKey: "t12",
    candidates: ["effective_gross_income", "gross_income"],
    fallback: coreMetrics?.egi,
    fallbackPath: "coreMetrics.egi",
  });

  const operatingExpenses = coreFactMetric({
    key: "operatingExpenses",
    label: "Operating Expenses",
    units: "currency_per_year",
    coreEntry: t12,
    coreKey: "t12",
    candidates: ["total_operating_expenses", "operating_expenses"],
    fallback: coreMetrics?.opEx,
    fallbackPath: "coreMetrics.opEx",
  });

  const noi = coreFactMetric({
    key: "noi",
    label: "Net Operating Income",
    units: "currency_per_year",
    coreEntry: t12,
    coreKey: "t12",
    candidates: ["net_operating_income", "noi"],
    fallback: coreMetrics?.noi,
    fallbackPath: "coreMetrics.noi",
  });

  const grossPotentialRent = coreFactMetric({
    key: "grossPotentialRent",
    label: "Gross Potential Rent",
    units: "currency_per_year",
    coreEntry: t12,
    coreKey: "t12",
    candidates: ["gross_potential_rent", "gross_scheduled_rent"],
    fallback: null,
    fallbackPath: null,
  });

  const annualGrossRentDifference =
    annualMarketRent.displayReady && annualInPlaceRent.displayReady
      ? derivedMetric({
          key: "annualGrossRentDifference",
          label: "Annual Gross Rent Difference",
          value: annualMarketRent.value - annualInPlaceRent.value,
          units: "currency_per_year",
          formula: "annual_market_rent_minus_annual_in_place_rent",
          inputs: {
            annualMarketRent: annualMarketRent.value,
            annualInPlaceRent: annualInPlaceRent.value,
          },
          provenance: [annualMarketRent.authorityPath, annualInPlaceRent.authorityPath].filter(Boolean),
        })
      : metricReceipt({ key: "annualGrossRentDifference", label: "Annual Gross Rent Difference", units: "currency_per_year" });

  const annualGrossRentGapRatio =
    annualGrossRentDifference.displayReady && annualInPlaceRent.displayReady && annualInPlaceRent.value > 0
      ? derivedMetric({
          key: "annualGrossRentGapRatio",
          label: "Annual Gross Rent Gap",
          value: annualGrossRentDifference.value / annualInPlaceRent.value,
          units: "ratio",
          formula: "annual_gross_rent_difference_divided_by_annual_in_place_rent",
          inputs: {
            annualGrossRentDifference: annualGrossRentDifference.value,
            annualInPlaceRent: annualInPlaceRent.value,
          },
          provenance: [annualGrossRentDifference.authorityPath, annualInPlaceRent.authorityPath].filter(Boolean),
        })
      : metricReceipt({ key: "annualGrossRentGapRatio", label: "Annual Gross Rent Gap", units: "ratio" });

  const expenseRatio =
    operatingExpenses.displayReady && egi.displayReady && egi.value !== 0
      ? derivedMetric({
          key: "expenseRatio",
          label: "Expense Ratio",
          value: operatingExpenses.value / egi.value,
          units: "ratio",
          formula: "operating_expenses_divided_by_effective_gross_income",
          inputs: { operatingExpenses: operatingExpenses.value, egi: egi.value },
          provenance: [operatingExpenses.authorityPath, egi.authorityPath].filter(Boolean),
        })
      : governedFallbackMetric({
          key: "expenseRatio",
          label: "Expense Ratio",
          value: coreMetrics?.expenseRatio,
          units: "ratio",
          authorityPath: "coreMetrics.expenseRatio",
        });

  const noiMargin =
    noi.displayReady && egi.displayReady && egi.value !== 0
      ? derivedMetric({
          key: "noiMargin",
          label: "NOI Margin",
          value: noi.value / egi.value,
          units: "ratio",
          formula: "net_operating_income_divided_by_effective_gross_income",
          inputs: { noi: noi.value, egi: egi.value },
          provenance: [noi.authorityPath, egi.authorityPath].filter(Boolean),
        })
      : governedFallbackMetric({
          key: "noiMargin",
          label: "NOI Margin",
          value: coreMetrics?.noiMargin,
          units: "ratio",
          authorityPath: "coreMetrics.noiMargin",
        });

  const breakEvenOccupancy =
    operatingExpenses.displayReady && grossPotentialRent.displayReady && grossPotentialRent.value > 0
      ? derivedMetric({
          key: "breakEvenOccupancy",
          label: "Break-Even Occupancy",
          value: operatingExpenses.value / grossPotentialRent.value,
          units: "ratio",
          formula: "operating_expenses_divided_by_gross_potential_rent",
          inputs: {
            operatingExpenses: operatingExpenses.value,
            grossPotentialRent: grossPotentialRent.value,
          },
          provenance: [operatingExpenses.authorityPath, grossPotentialRent.authorityPath].filter(Boolean),
        })
      : governedFallbackMetric({
          key: "breakEvenOccupancy",
          label: "Break-Even Occupancy",
          value: coreMetrics?.breakEvenOccupancy,
          units: "ratio",
          authorityPath: "coreMetrics.breakEvenOccupancy",
        });

  const occupancyBreakEvenSpread =
    occupancy.displayReady && breakEvenOccupancy.displayReady
      ? derivedMetric({
          key: "occupancyBreakEvenSpread",
          label: "Occupancy Above Break-Even",
          value: occupancy.value - breakEvenOccupancy.value,
          units: "ratio_delta",
          formula: "occupancy_minus_break_even_occupancy",
          inputs: { occupancy: occupancy.value, breakEvenOccupancy: breakEvenOccupancy.value },
          provenance: [occupancy.authorityPath, breakEvenOccupancy.authorityPath].filter(Boolean),
        })
      : metricReceipt({ key: "occupancyBreakEvenSpread", label: "Occupancy Above Break-Even", units: "ratio_delta" });

  const purchasePrice = directFactMetric({
    key: "purchasePrice",
    label: "Purchase Price",
    units: "currency",
    entry: purchase,
    candidates: ["purchase_price", "acquisition_price"],
    fallback: coreMetrics?.purchasePrice,
    fallbackPath: "coreMetrics.purchasePrice",
  });

  const acceptedGoingInCapRateRaw = firstFinite(
    purchase?.accepted_facts?.going_in_cap_rate,
    purchase?.accepted_facts?.cap_rate
  );
  const goingInCapRate = acceptedGoingInCapRateRaw !== null
    ? sourceMetric({
        key: "goingInCapRate",
        label: "Going-In Cap Rate",
        value: normalizeRatio(acceptedGoingInCapRateRaw),
        units: "ratio",
        authorityPath: "sourceTruthPackage.support.accepted.purchase_assumptions.accepted_facts.going_in_cap_rate",
        provenance: factEvidence(purchase, "going_in_cap_rate"),
      })
    : governedFallbackMetric({
        key: "goingInCapRate",
        label: "Going-In Cap Rate",
        value: normalizeRatio(coreMetrics?.goingInCapRate),
        units: "ratio",
        authorityPath: "coreMetrics.goingInCapRate",
      });

  const pricePerUnit =
    purchasePrice.displayReady && units.displayReady && units.value > 0
      ? derivedMetric({
          key: "pricePerUnit",
          label: "Price per Unit",
          value: purchasePrice.value / units.value,
          units: "currency_per_unit",
          formula: "purchase_price_divided_by_units",
          inputs: { purchasePrice: purchasePrice.value, units: units.value },
          provenance: [purchasePrice.authorityPath, units.authorityPath].filter(Boolean),
        })
      : metricReceipt({ key: "pricePerUnit", label: "Price per Unit", units: "currency_per_unit" });

  const noiPerUnit =
    noi.displayReady && units.displayReady && units.value > 0
      ? derivedMetric({
          key: "noiPerUnit",
          label: "NOI per Unit",
          value: noi.value / units.value,
          units: "currency_per_unit_per_year",
          formula: "net_operating_income_divided_by_units",
          inputs: { noi: noi.value, units: units.value },
          provenance: [noi.authorityPath, units.authorityPath].filter(Boolean),
        })
      : metricReceipt({ key: "noiPerUnit", label: "NOI per Unit", units: "currency_per_unit_per_year" });

  const noiToPurchasePriceCapRate =
    noi.displayReady && purchasePrice.displayReady && purchasePrice.value > 0
      ? derivedMetric({
          key: "noiToPurchasePriceCapRate",
          label: "NOI / Purchase Price Cap Rate",
          value: noi.value / purchasePrice.value,
          units: "ratio",
          formula: "accepted_noi_divided_by_accepted_purchase_price",
          inputs: { noi: noi.value, purchasePrice: purchasePrice.value },
          provenance: [noi.authorityPath, purchasePrice.authorityPath].filter(Boolean),
        })
      : metricReceipt({ key: "noiToPurchasePriceCapRate", label: "NOI / Purchase Price Cap Rate", units: "ratio" });

  const proposedLoanAmount = directFactMetric({
    key: "proposedLoanAmount",
    label: "Proposed Loan Amount",
    units: "currency",
    entry: purchase,
    candidates: ["proposed_loan_amount", "stated_acquisition_loan_amount", "derived_acquisition_loan_amount", "loan_amount"],
  });

  const ltvRaw = firstFinite(purchase?.accepted_facts?.ltv, purchase?.accepted_facts?.loan_to_value);
  const proposedLtv = ltvRaw !== null
    ? sourceMetric({
        key: "proposedLtv",
        label: "Proposed LTV",
        value: normalizeRatio(ltvRaw),
        units: "ratio",
        authorityPath: "sourceTruthPackage.support.accepted.purchase_assumptions.accepted_facts.ltv",
        provenance: factEvidence(purchase, "ltv"),
      })
    : metricReceipt({ key: "proposedLtv", label: "Proposed LTV", units: "ratio" });

  const currentDebtBalance = directFactMetric({
    key: "currentDebtBalance",
    label: "Current Debt Balance",
    units: "currency",
    entry: currentDebt,
    candidates: ["current_outstanding_balance", "outstanding_balance", "current_loan_balance"],
  });

  let currentAnnualDebtService = metricFromCalculationReceipt(
    financialIntelligence,
    "currentDebtAnnualDebtService",
    "currentAnnualDebtService",
    "Current Annual Debt Service",
    "currency_per_year"
  );
  let proposedAnnualDebtService = metricFromCalculationReceipt(
    financialIntelligence,
    "proposedFinancingAnnualDebtService",
    "proposedAnnualDebtService",
    "Proposed Annual Debt Service",
    "currency_per_year"
  );
  let currentDebtDscr = metricFromCalculationReceipt(
    financialIntelligence,
    "currentDebtDscr",
    "currentDebtDscr",
    "Current Debt DSCR",
    "ratio_x"
  );
  let proposedFinancingDscr = metricFromCalculationReceipt(
    financialIntelligence,
    "proposedFinancingDscr",
    "proposedFinancingDscr",
    "Proposed Financing DSCR",
    "ratio_x"
  );

  // The canonical financial-intelligence receipt remains first authority. When
  // the exact report-generation path does not carry that optional receipt into
  // Chapter 1, reconstruct only the same deterministic debt math from accepted
  // source facts. No debt assumption is introduced here.
  const acceptedCurrentMonthlyPayment = firstFinite(currentDebt?.accepted_facts?.monthly_payment);
  if (
    currentAnnualDebtService.displayReady !== true &&
    acceptedCurrentMonthlyPayment !== null &&
    acceptedCurrentMonthlyPayment > 0
  ) {
    currentAnnualDebtService = derivedMetric({
      key: "currentAnnualDebtService",
      label: "Current Annual Debt Service",
      value: acceptedCurrentMonthlyPayment * 12,
      units: "currency_per_year",
      formula: "accepted_current_monthly_payment_times_12",
      inputs: { monthlyPayment: acceptedCurrentMonthlyPayment },
      provenance: ["sourceTruthPackage.support.accepted.current_debt_context.accepted_facts.monthly_payment"],
    });
  }

  const acceptedProposedInterestRateRaw = firstFinite(purchase?.accepted_facts?.interest_rate);
  const acceptedProposedInterestRate = acceptedProposedInterestRateRaw !== null
    ? normalizeRatio(acceptedProposedInterestRateRaw)
    : null;
  const acceptedProposedAmortizationYears = firstFinite(purchase?.accepted_facts?.amortization_years);
  if (
    proposedAnnualDebtService.displayReady !== true &&
    proposedLoanAmount.displayReady === true &&
    proposedLoanAmount.value > 0 &&
    acceptedProposedInterestRate !== null &&
    acceptedProposedInterestRate >= 0 &&
    acceptedProposedAmortizationYears !== null &&
    acceptedProposedAmortizationYears > 0
  ) {
    const periodicRate = acceptedProposedInterestRate / 12;
    const totalPeriods = Math.round(acceptedProposedAmortizationYears * 12);
    const monthlyDebtService = periodicRate === 0
      ? proposedLoanAmount.value / totalPeriods
      : proposedLoanAmount.value * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
    proposedAnnualDebtService = derivedMetric({
      key: "proposedAnnualDebtService",
      label: "Proposed Annual Debt Service",
      value: monthlyDebtService * 12,
      units: "currency_per_year",
      formula: periodicRate === 0
        ? "principal_divided_by_total_periods_times_12"
        : "principal_times_periodic_rate_divided_by_one_minus_one_plus_periodic_rate_to_negative_total_periods_times_12",
      inputs: {
        principal: proposedLoanAmount.value,
        annualInterestRate: acceptedProposedInterestRate,
        amortizationYears: acceptedProposedAmortizationYears,
        periodicRate,
        totalPeriods,
      },
      provenance: [
        proposedLoanAmount.authorityPath,
        "sourceTruthPackage.support.accepted.purchase_assumptions.accepted_facts.interest_rate",
        "sourceTruthPackage.support.accepted.purchase_assumptions.accepted_facts.amortization_years",
      ].filter(Boolean),
    });
  }

  if (
    currentDebtDscr.displayReady !== true &&
    noi.displayReady === true &&
    currentAnnualDebtService.displayReady === true &&
    currentAnnualDebtService.value > 0
  ) {
    currentDebtDscr = derivedMetric({
      key: "currentDebtDscr",
      label: "Current Debt DSCR",
      value: noi.value / currentAnnualDebtService.value,
      units: "ratio_x",
      formula: "accepted_noi_divided_by_current_debt_service",
      inputs: { noi: noi.value, annualDebtService: currentAnnualDebtService.value },
      provenance: [noi.authorityPath, currentAnnualDebtService.authorityPath].filter(Boolean),
    });
  }

  if (
    proposedFinancingDscr.displayReady !== true &&
    noi.displayReady === true &&
    proposedAnnualDebtService.displayReady === true &&
    proposedAnnualDebtService.value > 0
  ) {
    proposedFinancingDscr = derivedMetric({
      key: "proposedFinancingDscr",
      label: "Proposed Financing DSCR",
      value: noi.value / proposedAnnualDebtService.value,
      units: "ratio_x",
      formula: "accepted_noi_divided_by_proposed_debt_service",
      inputs: { noi: noi.value, annualDebtService: proposedAnnualDebtService.value },
      provenance: [noi.authorityPath, proposedAnnualDebtService.authorityPath].filter(Boolean),
    });
  }

  return {
    units,
    occupancy,
    annualInPlaceRent,
    annualMarketRent,
    annualGrossRentDifference,
    annualGrossRentGapRatio,
    grossPotentialRent,
    egi,
    operatingExpenses,
    noi,
    expenseRatio,
    noiMargin,
    breakEvenOccupancy,
    occupancyBreakEvenSpread,
    purchasePrice,
    pricePerUnit,
    noiPerUnit,
    goingInCapRate,
    noiToPurchasePriceCapRate,
    proposedLoanAmount,
    proposedLtv,
    currentDebtBalance,
    currentAnnualDebtService,
    proposedAnnualDebtService,
    currentDebtDscr,
    proposedFinancingDscr,
  };
}

function signal({ code, category, statement, evidenceClass, metrics = [], provenance = [], qualification = null }) {
  return {
    code,
    category,
    statement: text(statement),
    evidenceClass,
    metrics: [...metrics],
    provenance: [...provenance],
    qualification: qualification || null,
  };
}

function risk({ code, title, statement, investorImpact, affectedDomains = [], followUp = null, metrics = [], provenance = [] }) {
  return {
    code,
    title,
    evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
    statement: text(statement),
    investorImpact: text(investorImpact),
    affectedDomains: unique(affectedDomains),
    followUp: followUp ? text(followUp) : null,
    metrics: [...metrics],
    provenance: [...provenance],
  };
}

function question({ code, question: questionText, whyItMatters, affectedDomains = [], trigger, provenance = [] }) {
  return {
    code,
    question: text(questionText),
    whyItMatters: text(whyItMatters),
    affectedDomains: unique(affectedDomains),
    trigger: text(trigger),
    provenance: [...provenance],
  };
}

function buildSourceReconciliationAlert(sourceTruthPackage) {
  const state = sourceTruthPackage?.source_reconciliation_state || null;
  const status = String(state?.status || "").trim();
  const displayCandidate = ["source_reconciliation_required", "parser_suspected"].includes(status);
  const t12GrossPotentialRent = finite(state?.t12_gpr);
  const rentRollAnnualInPlaceRent = finite(state?.rr_annual_in_place);
  const differenceAmount = finite(state?.difference_amount);
  const varianceRatio = finite(state?.variance_pct);
  const disclosure = text(state?.source_reconciliation_disclosure);
  const sourceBacked = Boolean(
    displayCandidate &&
      t12GrossPotentialRent !== null &&
      rentRollAnnualInPlaceRent !== null &&
      differenceAmount !== null &&
      varianceRatio !== null
  );
  const displayReady = sourceBacked && disclosure.length > 0;

  return {
    displayReady,
    sourceBacked,
    evidenceClass: displayReady
      ? EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED
      : EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
    status: status || null,
    t12GrossPotentialRent: displayReady ? t12GrossPotentialRent : null,
    rentRollAnnualInPlaceRent: displayReady ? rentRollAnnualInPlaceRent : null,
    differenceAmount: displayReady ? differenceAmount : null,
    varianceRatio: displayReady ? varianceRatio : null,
    disclosure: displayReady ? disclosure : null,
    sourceSelection: displayReady ? state?.source_selection || null : null,
    t12Source: displayReady ? state?.t12_gpr_source || null : null,
    rentRollSource: displayReady ? state?.rr_annual_in_place_source || null : null,
    provenance: displayReady
      ? [
          "sourceTruthPackage.source_reconciliation_state.t12_gpr",
          "sourceTruthPackage.source_reconciliation_state.rr_annual_in_place",
          "sourceTruthPackage.source_reconciliation_state.difference_amount",
          "sourceTruthPackage.source_reconciliation_state.variance_pct",
          "sourceTruthPackage.source_reconciliation_state.source_reconciliation_disclosure",
        ]
      : [],
  };
}

function buildDecisionSurfaces({ sourceTruthPackage, financialIntelligence, metrics, reconciliationAlert }) {
  const opportunitySignals = [];
  const operatingSignals = [];
  const valueSignals = [];
  const financingSignals = [];
  const constraintSignals = [];
  const risks = [];
  const questions = [];

  if (metrics.occupancy.displayReady) {
    operatingSignals.push(
      signal({
        code: "OPERATING_OCCUPANCY_ESTABLISHED",
        category: "operating",
        statement: "Current occupancy is established from governed operating inputs.",
        evidenceClass: metrics.occupancy.evidenceClass,
        metrics: ["occupancy"],
        provenance: metrics.occupancy.provenance,
      })
    );
  }

  if (metrics.noi.displayReady) {
    operatingSignals.push(
      signal({
        code: "OPERATING_NOI_ESTABLISHED",
        category: "operating",
        statement: "Current NOI is established from governed operating inputs.",
        evidenceClass: metrics.noi.evidenceClass,
        metrics: ["noi", "noiMargin"].filter((key) => metrics[key]?.displayReady),
        provenance: metrics.noi.provenance,
      })
    );
  }

  if (metrics.occupancyBreakEvenSpread.displayReady) {
    const spread = metrics.occupancyBreakEvenSpread.value;
    if (spread >= 0) {
      opportunitySignals.push(
        signal({
          code: "OCCUPANCY_ABOVE_BREAK_EVEN",
          category: "operating",
          statement: "Current occupancy is above deterministic break-even occupancy.",
          evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
          metrics: ["occupancy", "breakEvenOccupancy", "occupancyBreakEvenSpread"],
          provenance: metrics.occupancyBreakEvenSpread.provenance,
        })
      );
    } else {
      const item = risk({
        code: "OCCUPANCY_BELOW_BREAK_EVEN",
        title: "Occupancy below break-even occupancy",
        statement: "Current occupancy is below deterministic break-even occupancy.",
        investorImpact: "Current occupancy does not cover the operating-expense break-even level represented by the governed inputs.",
        affectedDomains: ["operations", "cash_flow"],
        followUp: "Reconcile occupancy, expense, and gross-potential-rent inputs before relying on operating headroom.",
        metrics: ["occupancy", "breakEvenOccupancy", "occupancyBreakEvenSpread"],
        provenance: metrics.occupancyBreakEvenSpread.provenance,
      });
      risks.push(item);
      constraintSignals.push(signal({
        code: item.code,
        category: "constraint",
        statement: item.statement,
        evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
        metrics: item.metrics,
        provenance: item.provenance,
      }));
    }
  }

  if (
    metrics.annualGrossRentDifference.displayReady &&
    metrics.annualGrossRentDifference.value > 0 &&
    metrics.annualMarketRent.displayReady
  ) {
    opportunitySignals.push(
      signal({
        code: "DOCUMENTED_GROSS_RENT_GAP",
        category: "operating",
        statement: "Documented annual market rent exceeds annual in-place rent on the governed Rent Roll basis.",
        evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
        metrics: ["annualInPlaceRent", "annualMarketRent", "annualGrossRentDifference", "annualGrossRentGapRatio"],
        provenance: metrics.annualGrossRentDifference.provenance,
        qualification: "Gross rent difference is not NOI and is not capitalized without an authorized NOI conversion basis.",
      })
    );
    questions.push(
      question({
        code: "VERIFY_MARKET_RENT_ACHIEVABILITY",
        question: "What evidence supports achievability of the documented market-rent level?",
        whyItMatters: "The governed Rent Roll shows a gross rent difference, but realization timing and NOI conversion are not assumed.",
        affectedDomains: ["operations", "rent_positioning", "valuation"],
        trigger: "annual_market_rent_exceeds_annual_in_place_rent",
        provenance: metrics.annualGrossRentDifference.provenance,
      })
    );
  }

  if (metrics.purchasePrice.displayReady) {
    valueSignals.push(
      signal({
        code: "PURCHASE_BASIS_ESTABLISHED",
        category: "value",
        statement: "Purchase-price basis is established from accepted acquisition support.",
        evidenceClass: metrics.purchasePrice.evidenceClass,
        metrics: ["purchasePrice", "pricePerUnit", "noiToPurchasePriceCapRate"].filter(
          (key) => metrics[key]?.displayReady
        ),
        provenance: metrics.purchasePrice.provenance,
      })
    );
  } else {
    questions.push(
      question({
        code: "ESTABLISH_ACQUISITION_BASIS",
        question: "What acquisition price or basis should govern transaction-level valuation analysis?",
        whyItMatters: "Purchase-price-dependent value and leverage comparisons remain unavailable without accepted acquisition basis.",
        affectedDomains: ["transaction", "valuation", "financing"],
        trigger: "accepted_purchase_price_not_established",
        provenance: [],
      })
    );
  }

  if (metrics.goingInCapRate.displayReady) {
    valueSignals.push(
      signal({
        code: "GOING_IN_CAP_RATE_ESTABLISHED",
        category: "value",
        statement: "A governed going-in cap-rate reference is available.",
        evidenceClass: metrics.goingInCapRate.evidenceClass,
        metrics: ["goingInCapRate"],
        provenance: metrics.goingInCapRate.provenance,
      })
    );
  }

  for (const [key, label, domain] of [
    ["currentDebtDscr", "current debt", "current_debt"],
    ["proposedFinancingDscr", "proposed financing", "proposed_financing"],
  ]) {
    const receipt = metrics[key];
    if (!receipt.displayReady) continue;
    financingSignals.push(
      signal({
        code: `${domain.toUpperCase()}_DSCR_ESTABLISHED`,
        category: "financing",
        statement:
          receipt.value >= 1
            ? `Governed ${label} DSCR is at or above 1.00x annual debt-service coverage.`
            : `Governed ${label} DSCR is below 1.00x annual debt-service coverage.`,
        evidenceClass: receipt.evidenceClass,
        metrics: [key],
        provenance: receipt.provenance,
        qualification: receipt.qualification,
      })
    );
    if (receipt.value < 1) {
      const item = risk({
        code: `${domain.toUpperCase()}_DSCR_BELOW_1X`,
        title: `${label === "current debt" ? "Current debt" : "Proposed financing"} coverage below 1.00x`,
        statement: `Governed ${label} DSCR is below 1.00x.`,
        investorImpact: "Accepted NOI does not mathematically cover the governed annual debt-service amount.",
        affectedDomains: ["financing", "cash_flow"],
        followUp: "Confirm the governing debt terms and operating basis before relying on financing coverage.",
        metrics: [key],
        provenance: receipt.provenance,
      });
      risks.push(item);
      constraintSignals.push(signal({
        code: item.code,
        category: "constraint",
        statement: item.statement,
        evidenceClass: EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
        metrics: item.metrics,
        provenance: item.provenance,
      }));
      questions.push(
        question({
          code: `${domain.toUpperCase()}_COVERAGE_FOLLOW_UP`,
          question: `What operating or debt-term evidence could resolve the ${label} coverage shortfall?`,
          whyItMatters: "The current governed calculation is below 1.00x coverage and should be reconciled before financing conclusions are relied upon.",
          affectedDomains: ["financing", "cash_flow"],
          trigger: `${domain}_dscr_below_1x`,
          provenance: receipt.provenance,
        })
      );
    }
  }

  const hasAcceptedDebt = Boolean(
    supportEntryByRole(sourceTruthPackage, "current_debt_context") ||
      supportEntryByRole(sourceTruthPackage, "purchase_assumptions")
  );
  const hasDebtSourceButUnaccepted = Boolean(
    advisorySourcePresentByRole(sourceTruthPackage, "current_debt_context") ||
      advisorySourcePresentByRole(sourceTruthPackage, "purchase_assumptions")
  );
  const hasAnyDscr = metrics.currentDebtDscr.displayReady || metrics.proposedFinancingDscr.displayReady;
  if ((hasAcceptedDebt || hasDebtSourceButUnaccepted) && !hasAnyDscr) {
    questions.push(
      question({
        code: "DEBT_COVERAGE_INPUTS_INCOMPLETE",
        question: "Which accepted debt terms are still required to establish deterministic debt-service coverage?",
        whyItMatters: "Debt context is present, but the canonical financial-intelligence contract does not have a display-ready DSCR calculation.",
        affectedDomains: ["financing"],
        trigger: hasDebtSourceButUnaccepted
          ? "debt_source_present_not_authority_accepted_or_complete"
          : "accepted_debt_context_without_display_ready_dscr",
        provenance: [],
      })
    );
  }

  if (reconciliationAlert.displayReady) {
    const item = risk({
      code: "PRIMARY_SOURCE_RECONCILIATION_REQUIRED",
      title: "Primary source reconciliation required",
      statement: "T12 Gross Potential Rent and Rent Roll annual in-place rent are not aligned on the canonical reconciliation basis.",
      investorImpact: "The variance can affect operating interpretation and any downstream analysis that depends on the differing rent bases.",
      affectedDomains: ["operations", "valuation", "financing"],
      followUp: reconciliationAlert.disclosure,
      metrics: [],
      provenance: reconciliationAlert.provenance,
    });
    risks.unshift(item);
    constraintSignals.unshift(
      signal({
        code: item.code,
        category: "constraint",
        statement: item.statement,
        evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
        metrics: [],
        provenance: reconciliationAlert.provenance,
        qualification: reconciliationAlert.disclosure,
      })
    );
    questions.unshift(
      question({
        code: "RECONCILE_T12_RENT_ROLL_VARIANCE",
        question: "What explains the difference between T12 Gross Potential Rent and Rent Roll annual in-place rent?",
        whyItMatters: "InvestorIQ does not infer the cause of the canonical source variance.",
        affectedDomains: ["operations", "valuation", "financing"],
        trigger: reconciliationAlert.status,
        provenance: reconciliationAlert.provenance,
      })
    );
  }

  const capitalSection = financialIntelligence?.customerSections?.capitalPlanAnalysis || null;
  const deferredMaintenanceAmount = finite(capitalSection?.facts?.deferredMaintenance?.amount);
  if (capitalSection?.displayReady === true && deferredMaintenanceAmount !== null && deferredMaintenanceAmount > 0) {
    const item = risk({
      code: "DEFERRED_MAINTENANCE_AMOUNT_ESTABLISHED",
      title: "Deferred maintenance identified",
      statement: "Accepted capital-plan evidence establishes a deferred-maintenance amount.",
      investorImpact: "The documented capital requirement may affect transaction funding, reserves, or near-term execution planning.",
      affectedDomains: ["capital_plan", "transaction", "cash_flow"],
      followUp: "Confirm timing, funding source, and whether the documented amount is complete.",
      metrics: [],
      provenance: [],
    });
    risks.push(item);
    constraintSignals.push(
      signal({
        code: item.code,
        category: "constraint",
        statement: item.statement,
        evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
        metrics: [],
        provenance: [],
      })
    );
    questions.push(
      question({
        code: "DEFERRED_MAINTENANCE_FUNDING",
        question: "How will the documented deferred-maintenance requirement be funded and timed?",
        whyItMatters: "Accepted capital evidence establishes a non-zero deferred-maintenance amount.",
        affectedDomains: ["capital_plan", "transaction", "cash_flow"],
        trigger: "accepted_deferred_maintenance_amount_positive",
        provenance: [],
      })
    );
  }

  return {
    opportunitySignals,
    operatingSignals,
    valueSignals,
    financingSignals,
    constraintSignals,
    risks,
    questions,
  };
}

function buildAssetIdentity({ sourceTruthPackage, customerSurfaceModel, coreMetrics, propertyProfile, reportMeta, metrics }) {
  const propertyName = text(
    propertyProfile?.propertyName ||
      propertyProfile?.property_name ||
      customerSurfaceModel?.identity?.propertyName ||
      reportMeta?.propertyName ||
      sourceTruthPackage?.property_name
  );
  const propertyAddress = text(
    propertyProfile?.propertyAddress ||
      propertyProfile?.property_address ||
      customerSurfaceModel?.identity?.propertyAddress ||
      reportMeta?.propertyAddress
  );
  const assetClass = text(
    customerSurfaceModel?.identity?.assetClass ||
      propertyProfile?.assetClass ||
      propertyProfile?.asset_class ||
      coreMetrics?.assetClass
  );
  const unitCount = metrics?.units?.displayReady ? Math.round(metrics.units.value) : null;
  const assetIdentity = [unitCount ? `${unitCount}-Unit` : null, assetClass || null].filter(Boolean).join(" ") || "Property";
  return { propertyName: propertyName || null, propertyAddress: propertyAddress || null, assetClass: assetClass || null, assetIdentity };
}

function buildDispositions({ metrics, surfaces, reconciliationAlert }) {
  const coreMetricKeys = ["units", "occupancy", "noi"];
  const availableCoreMetricKeys = coreMetricKeys.filter((key) => metrics?.[key]?.displayReady === true);
  const keyMetricKeys = Object.entries(metrics)
    .filter(([, receipt]) => receipt?.displayReady === true)
    .map(([key]) => key);

  const executiveInvestmentSummary = applySectionDisposition({
    sectionKey: "executiveInvestmentSummary",
    classification: SECTION_CLASSIFICATIONS.CORE_REQUIRED,
    requestedDisposition:
      availableCoreMetricKeys.length === coreMetricKeys.length
        ? SECTION_DISPOSITIONS.INCLUDE
        : SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
    minimumSurvivingFactKeys: availableCoreMetricKeys,
    missingFactOrLimitationReason:
      availableCoreMetricKeys.length === coreMetricKeys.length
        ? null
        : `unsupported_or_missing: ${coreMetricKeys.filter((key) => !availableCoreMetricKeys.includes(key)).join(", ")}`,
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });

  const keyMetricsSnapshot = applySectionDisposition({
    sectionKey: "keyMetricsSnapshot",
    classification: SECTION_CLASSIFICATIONS.CORE_REQUIRED,
    requestedDisposition:
      availableCoreMetricKeys.length === coreMetricKeys.length
        ? SECTION_DISPOSITIONS.INCLUDE
        : SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
    minimumSurvivingFactKeys: keyMetricKeys,
    missingFactOrLimitationReason:
      availableCoreMetricKeys.length === coreMetricKeys.length
        ? null
        : "One or more core committee metrics are unavailable; render only governed surviving metrics.",
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });

  const signalCount =
    surfaces.opportunitySignals.length +
    surfaces.operatingSignals.length +
    surfaces.valueSignals.length +
    surfaces.financingSignals.length +
    surfaces.constraintSignals.length;
  const investmentCase = applySectionDisposition({
    sectionKey: "investmentCase",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition:
      signalCount >= 2
        ? SECTION_DISPOSITIONS.INCLUDE
        : signalCount === 1
          ? SECTION_DISPOSITIONS.INCLUDE_QUALIFIED
          : SECTION_DISPOSITIONS.COLLAPSE,
    minimumSurvivingFactKeys: unique(
      [
        ...surfaces.opportunitySignals,
        ...surfaces.operatingSignals,
        ...surfaces.valueSignals,
        ...surfaces.financingSignals,
        ...surfaces.constraintSignals,
      ].flatMap((item) => item.metrics)
    ),
    missingFactOrLimitationReason: signalCount === 0 ? "No governed decision signals available." : null,
    collapseReason: signalCount === 0 ? "NO_GOVERNED_DECISION_SIGNALS" : null,
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });

  const principalRisksAndConstraints = applySectionDisposition({
    sectionKey: "principalRisksAndConstraints",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: surfaces.risks.length > 0 ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.COLLAPSE,
    minimumSurvivingFactKeys: unique(surfaces.risks.flatMap((item) => item.metrics)),
    missingFactOrLimitationReason: surfaces.risks.length === 0 ? "No evidence-triggered constraint item established; no absence-of-risk conclusion is implied." : null,
    collapseReason: surfaces.risks.length === 0 ? "NO_EVIDENCE_TRIGGERED_CONSTRAINT_ITEM" : null,
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });

  const investorQuestions = applySectionDisposition({
    sectionKey: "investorQuestions",
    classification: SECTION_CLASSIFICATIONS.OPTIONAL,
    requestedDisposition: surfaces.questions.length > 0 ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.OMIT,
    minimumSurvivingFactKeys: surfaces.questions.map((item) => item.code),
    collapseReason: surfaces.questions.length === 0 ? "NO_EVIDENCE_TRIGGERED_INVESTOR_QUESTIONS" : null,
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });

  const sourceReconciliationAlert = applySectionDisposition({
    sectionKey: "sourceReconciliationAlert",
    classification: SECTION_CLASSIFICATIONS.OPTIONAL,
    requestedDisposition: reconciliationAlert.displayReady ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.OMIT,
    minimumSurvivingFactKeys: reconciliationAlert.displayReady
      ? ["t12GrossPotentialRent", "rentRollAnnualInPlaceRent", "differenceAmount", "varianceRatio", "disclosure"]
      : [],
    collapseReason: reconciliationAlert.displayReady ? null : "CANONICAL_SOURCE_RECONCILIATION_ALERT_NOT_REQUIRED",
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });

  return {
    executiveInvestmentSummary,
    keyMetricsSnapshot,
    investmentCase,
    principalRisksAndConstraints,
    investorQuestions,
    sourceReconciliationAlert,
  };
}

function primaryConstraint(risks) {
  if (!Array.isArray(risks) || risks.length === 0) return null;
  const priority = [
    "PRIMARY_SOURCE_RECONCILIATION_REQUIRED",
    "CURRENT_DEBT_DSCR_BELOW_1X",
    "PROPOSED_FINANCING_DSCR_BELOW_1X",
    "OCCUPANCY_BELOW_BREAK_EVEN",
    "DEFERRED_MAINTENANCE_AMOUNT_ESTABLISHED",
  ];
  for (const code of priority) {
    const match = risks.find((item) => item.code === code);
    if (match) return match;
  }
  return risks[0];
}

function assertNoForbiddenDecisionLanguage(value) {
  const serialized = JSON.stringify(value);
  for (const token of FORBIDDEN_DECISION_TOKENS) {
    const pattern = new RegExp(`(?:^|[^A-Z])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^A-Z]|$)`, "i");
    if (pattern.test(serialized)) {
      throw new Error(`ELITE_CHAPTER1_FORBIDDEN_DECISION_LANGUAGE:${token}`);
    }
  }
}

function buildPhase8ADecisionSnapshotContext(customerSurfaceModel = null, metrics = {}) {
  const renovationSection = customerSurfaceModel?.sections?.renovationContext || null;
  const renovationFacts = renovationSection?.factAvailability?.sourceBacked === true
    ? renovationSection?.facts || {}
    : {};
  const planRows = Array.isArray(renovationFacts.renovation_plan_rows)
    ? renovationFacts.renovation_plan_rows
    : [];
  let plannedInteriorUnits = 0;
  let documentedAnnualGrossRentLift = 0;
  for (const row of planRows) {
    const unitCount = finite(row?.unit_count);
    const monthlyLift = finite(row?.expected_monthly_rent_lift);
    if (unitCount !== null && unitCount > 0) plannedInteriorUnits += unitCount;
    if (unitCount !== null && unitCount > 0 && monthlyLift !== null && monthlyLift > 0) {
      documentedAnnualGrossRentLift += unitCount * monthlyLift * 12;
    }
  }
  const totalCapitalBudget = finite(renovationFacts.total_renovation_budget);
  const planDurationMonths = finite(renovationFacts.capital_plan_duration_months);
  const totalUnits = metrics?.units?.displayReady === true ? finite(metrics.units.value) : null;
  const purchasePrice = metrics?.purchasePrice?.displayReady === true ? finite(metrics.purchasePrice.value) : null;
  const proposedLoan = metrics?.proposedLoanAmount?.displayReady === true ? finite(metrics.proposedLoanAmount.value) : null;
  const proposedLtv = metrics?.proposedLtv?.displayReady === true ? finite(metrics.proposedLtv.value) : null;
  const plannedUnitShare = totalUnits && plannedInteriorUnits > 0 ? plannedInteriorUnits / totalUnits : null;
  const budgetToPurchasePrice = purchasePrice && totalCapitalBudget ? totalCapitalBudget / purchasePrice : null;

  const appraisalSection = customerSurfaceModel?.sections?.appraisalContext || null;
  const appraisalFacts = appraisalSection?.factAvailability?.sourceBacked === true
    ? appraisalSection?.facts || {}
    : {};
  const appraisalValue = finite(appraisalFacts.appraisal_value);
  const appraisalStabilizedNoi = finite(appraisalFacts.stabilized_noi);
  const appraisalStabilizedCapRate = normalizeRatio(appraisalFacts.stabilized_cap_rate);

  const strategyEvidenceReady = Boolean(
    purchasePrice && proposedLoan && proposedLtv !== null &&
    totalCapitalBudget && plannedInteriorUnits > 0 && documentedAnnualGrossRentLift > 0 &&
    totalUnits && totalUnits > 0
  );
  let strategyFit = "INSUFFICIENT EVIDENCE";
  if (strategyEvidenceReady) {
    strategyFit = budgetToPurchasePrice !== null && budgetToPurchasePrice <= 0.15 && plannedUnitShare !== null && plannedUnitShare <= 0.70
      ? "LIGHT VALUE-ADD HOLD"
      : "MAJOR VALUE-ADD / REPOSITION";
  }

  return {
    evidenceBound: true,
    strategyEvidenceReady,
    strategyFit,
    totalCapitalBudget: totalCapitalBudget ?? null,
    plannedInteriorUnits: plannedInteriorUnits > 0 ? plannedInteriorUnits : null,
    plannedUnitShare,
    documentedAnnualGrossRentLift: documentedAnnualGrossRentLift > 0 ? documentedAnnualGrossRentLift : null,
    planDurationMonths: planDurationMonths ?? null,
    budgetToPurchasePrice,
    appraisalValue: appraisalValue ?? null,
    appraisalStabilizedNoi: appraisalStabilizedNoi ?? null,
    appraisalStabilizedCapRate: appraisalStabilizedCapRate ?? null,
  };
}

export function buildFullUnderwritingChapter1EliteContract({
  sourceTruthPackage,
  customerSurfaceModel = null,
  financialIntelligence = null,
  coreMetrics = null,
  propertyProfile = null,
  reportMeta = null,
} = {}) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error("CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_ELITE_CHAPTER1");
  }
  const financialIntelligenceAccepted = isCanonicalFinancialIntelligenceForSource(
    financialIntelligence,
    sourceTruthPackage
  );
  const governedFinancialIntelligence = financialIntelligenceAccepted ? financialIntelligence : null;

  const metrics = buildMetrics({
    sourceTruthPackage,
    financialIntelligence: governedFinancialIntelligence,
    coreMetrics: coreMetrics || {},
  });
  const reconciliationAlert = buildSourceReconciliationAlert(sourceTruthPackage);
  const surfaces = buildDecisionSurfaces({
    sourceTruthPackage,
    financialIntelligence: governedFinancialIntelligence,
    metrics,
    reconciliationAlert,
  });
  const identity = buildAssetIdentity({
    sourceTruthPackage,
    customerSurfaceModel,
    coreMetrics: coreMetrics || {},
    propertyProfile,
    reportMeta,
    metrics,
  });
  const sectionDispositions = buildDispositions({ metrics, surfaces, reconciliationAlert });
  const primary = primaryConstraint(surfaces.risks);
  const decisionSnapshotContext = buildPhase8ADecisionSnapshotContext(customerSurfaceModel, metrics);

  const executiveInvestmentSummary = {
    disposition: sectionDispositions.executiveInvestmentSummary.disposition,
    assetStatement: identity.assetIdentity,
    operatingPosition: surfaces.operatingSignals.slice(0, 3),
    valuePosition: surfaces.valueSignals.slice(0, 3),
    financingPosition: surfaces.financingSignals.slice(0, 2),
    primaryConstraint: primary,
    unresolvedDiligence: surfaces.questions.slice(0, 4),
  };

  const investmentCase = {
    disposition: sectionDispositions.investmentCase.disposition,
    opportunitySignals: surfaces.opportunitySignals,
    operatingSignals: surfaces.operatingSignals,
    valueSignals: surfaces.valueSignals,
    financingSignals: surfaces.financingSignals,
    constraintSignals: surfaces.constraintSignals,
  };

  const principalRisksAndConstraints = {
    disposition: sectionDispositions.principalRisksAndConstraints.disposition,
    items: surfaces.risks,
  };

  const investorQuestions = {
    disposition: sectionDispositions.investorQuestions.disposition,
    items: surfaces.questions,
  };

  const sourceReconciliationAlert = {
    ...reconciliationAlert,
    disposition: sectionDispositions.sourceReconciliationAlert.disposition,
  };

  const sourceSectionsUsed = unique(
    Object.values(metrics)
      .filter((receipt) => receipt?.displayReady)
      .map((receipt) => receipt.authorityPath)
      .filter(Boolean)
  );
  const calculationReceiptsUsed = unique(
    Object.values(metrics)
      .filter((receipt) => receipt?.displayReady && receipt?.calculationReceiptKey)
      .map((receipt) => receipt.calculationReceiptKey)
  );
  const sourceTruthFieldsUsed = unique([
    ...sourceReconciliationAlert.provenance,
    ...Object.values(metrics).flatMap((receipt) => (Array.isArray(receipt?.provenance) ? receipt.provenance : []))
      .filter((item) => typeof item === "string"),
  ]);

  const result = {
    version: FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION,
    authority: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      scenarioAuthority: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      revisionAuthority: false,
      investmentRecommendationAllowed: false,
      downstreamConsumeOnly: true,
    },
    authorityDiagnostics: {
      financialIntelligenceProvided: Boolean(financialIntelligence),
      financialIntelligenceAccepted: Boolean(financialIntelligence && financialIntelligenceAccepted),
      invalidFinancialIntelligenceIgnored: Boolean(financialIntelligence && !financialIntelligenceAccepted),
    },
    sourceTruthReceipt: {
      source: sourceTruthPackage.source,
      schemaVersion: sourceTruthPackage.schema_version,
      jobId: sourceTruthPackage.job_id || null,
      coreSourceMode:
        sourceTruthPackage?.core_input_sufficiency_state?.evidence?.core_source_mode || null,
      corePublishable: sourceTruthPackage.core_publishable === true,
    },
    identity,
    decisionSnapshotContext,
    metrics,
    executiveInvestmentSummary,
    investmentCase,
    principalRisksAndConstraints,
    investorQuestions,
    sourceReconciliationAlert,
    sectionDispositions,
    provenance: {
      sourceSectionsUsed,
      calculationReceiptsUsed,
      sourceTruthFieldsUsed,
    },
  };

  assertNoForbiddenDecisionLanguage({
    executiveInvestmentSummary: result.executiveInvestmentSummary,
    investmentCase: result.investmentCase,
    principalRisksAndConstraints: result.principalRisksAndConstraints,
    investorQuestions: result.investorQuestions,
  });
  return deepFreeze(result);
}

export const FULL_UNDERWRITING_CHAPTER1_ELITE_EVIDENCE_CLASSES = EVIDENCE_CLASSES;

export default buildFullUnderwritingChapter1EliteContract;
