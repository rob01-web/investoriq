import {
  applySectionDisposition,
  SECTION_CLASSIFICATIONS,
  SECTION_DISPOSITIONS,
} from "./section-disposition-contract.js";

export const FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION = "full_underwriting_scenario_engine_v1";
export const FULL_UNDERWRITING_SCENARIO_POLICY_VERSION = "full_underwriting_scenario_policy_v1";

const SOURCE_TRUTH_MARKER = "canonical_source_truth_package";
const OPERATING_INTELLIGENCE_VERSION = "full_underwriting_operating_intelligence_v1";
const EVIDENCE_CLASSES = Object.freeze({
  SOURCE_BACKED: "source_backed",
  DETERMINISTIC_CALCULATED: "deterministic_calculated",
  SCENARIO: "scenario",
  MISSING_UNSUPPORTED: "missing_unsupported",
});

export const FULL_UNDERWRITING_SCENARIO_POLICY_V1 = Object.freeze({
  version: FULL_UNDERWRITING_SCENARIO_POLICY_VERSION,
  purpose: "downside_sensitivity_not_forecast",
  occupancyStressPercentagePoints: Object.freeze([0, -0.05, -0.10]),
  operatingExpenseStressRates: Object.freeze([0, 0.05, 0.10]),
  capRateStressBasisPoints: Object.freeze([0, 50, 100]),
  rules: Object.freeze({
    scenarioOutputsAreEvidence: false,
    scenarioOutputsMayOverrideSourceTruth: false,
    sourceTruthMutationAllowed: false,
    scenarioValuesMayBePromotedToSourceBacked: false,
    scenarioValuesMayBePromotedToDeterministicBaseFacts: false,
    forwardForecastClaimAllowed: false,
    probabilityAssignmentAllowed: false,
    investmentRecommendationAllowed: false,
    thresholdInferenceAllowed: false,
    irrAllowed: false,
    moicAllowed: false,
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ratio(value) {
  const n = finite(value);
  if (n === null) return null;
  return Math.abs(n) > 1.5 ? n / 100 : n;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeZero(value, tolerance = 1e-9) {
  const n = finite(value);
  if (n === null) return null;
  return Math.abs(n) <= tolerance ? 0 : n;
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

function isOperatingIntelligence(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.version === OPERATING_INTELLIGENCE_VERSION &&
      value.authority?.sourceTruthMutationAllowed === false &&
      value.authority?.scenarioAllowed === false &&
      value.sourceTruthReceipt?.source === SOURCE_TRUTH_MARKER &&
      value.metrics &&
      typeof value.metrics === "object"
  );
}

function baseReceiptFromOperatingMetric(metric, fallbackKey) {
  if (!metric || metric.displayReady !== true || finite(metric.value) === null) {
    return {
      key: fallbackKey,
      value: null,
      units: metric?.units || null,
      evidenceClass: EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
      displayReady: false,
      authorityPath: null,
      provenance: [],
    };
  }
  const evidenceClass = [EVIDENCE_CLASSES.SOURCE_BACKED, EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED].includes(metric.evidenceClass)
    ? metric.evidenceClass
    : EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED;
  return {
    key: metric.key || fallbackKey,
    value: Number(metric.value),
    units: metric.units || null,
    evidenceClass,
    displayReady: true,
    authorityPath: metric.authorityPath || "full_underwriting_operating_intelligence_contract",
    provenance: Array.isArray(metric.provenance) ? [...metric.provenance] : [],
  };
}

function sourceBackedAcquisitionFact(customerSurfaceModel, factName, { units = null } = {}) {
  const section = customerSurfaceModel?.sections?.acquisitionRequestContext || null;
  const sourceBacked = section?.factAvailability?.sourceBacked === true;
  const value = ratio(factName === "going_in_cap_rate" ? section?.facts?.[factName] : null);
  const moneyValue = factName === "going_in_cap_rate" ? null : finite(section?.facts?.[factName]);
  const normalized = factName === "going_in_cap_rate" ? value : moneyValue;
  if (!sourceBacked || normalized === null) {
    return {
      key: factName,
      value: null,
      units,
      evidenceClass: EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
      displayReady: false,
      authorityPath: null,
      provenance: [],
    };
  }
  return {
    key: factName,
    value: normalized,
    units,
    evidenceClass: EVIDENCE_CLASSES.SOURCE_BACKED,
    displayReady: true,
    authorityPath: `customerSurfaceModel.sections.acquisitionRequestContext.facts.${factName}`,
    provenance: [
      `customerSurfaceModel.sections.acquisitionRequestContext.facts.${factName}`,
      section?.sourceDoc?.acceptedProvenance?.acceptedSourceIdentityKey || null,
    ].filter(Boolean),
  };
}

function scenarioRow({
  key,
  label,
  scenarioInputs,
  outputs,
  formula,
  baseInputKeys,
  qualification,
} = {}) {
  return {
    key,
    label,
    evidenceClass: EVIDENCE_CLASSES.SCENARIO,
    sourceBacked: false,
    deterministicBaseFact: false,
    scenario: true,
    scenarioInputs: { ...(scenarioInputs || {}) },
    outputs: { ...(outputs || {}) },
    formula,
    baseInputKeys: [...(Array.isArray(baseInputKeys) ? baseInputKeys : [])],
    qualification,
  };
}

function disposition({ sectionKey, requestedDisposition, surviving = [], reason = null, compact = true }) {
  return applySectionDisposition({
    sectionKey,
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition,
    minimumSurvivingFactKeys: surviving,
    missingFactOrLimitationReason: reason,
    compactRendererEligible: compact,
    collapseReason: requestedDisposition === SECTION_DISPOSITIONS.COLLAPSE ? reason : null,
    manifestDisclosure: requestedDisposition === SECTION_DISPOSITIONS.COLLAPSE
      ? `Scenario section ${sectionKey} was collapsed because its governed deterministic base was unavailable.`
      : "Scenario outputs are hypothetical perturbations, not source evidence or forecasts.",
    certificationExpectation: "scenario_outputs_must_remain_non_evidentiary",
  });
}

function buildOccupancyStress(base) {
  const occupancy = finite(base.occupancy?.value);
  const egi = finite(base.egi?.value);
  const operatingExpenses = finite(base.operatingExpenses?.value);
  const baseNoi = finite(base.noi?.value);
  const eligible = occupancy !== null && occupancy > 0 && occupancy <= 1 && egi !== null && operatingExpenses !== null && baseNoi !== null;
  if (!eligible) {
    return {
      displayReady: false,
      rows: [],
      formula: null,
      qualification: "Occupancy stress requires governed base occupancy, EGI, and operating expenses.",
    };
  }
  const rows = FULL_UNDERWRITING_SCENARIO_POLICY_V1.occupancyStressPercentagePoints.map((delta) => {
    const scenarioOccupancy = Math.max(0, Math.min(1, occupancy + delta));
    const scenarioEgi = egi * (scenarioOccupancy / occupancy);
    const scenarioNoi = scenarioEgi - operatingExpenses;
    const scenarioNoiMargin = scenarioEgi !== 0 ? scenarioNoi / scenarioEgi : null;
    return scenarioRow({
      key: delta === 0 ? "occupancy_base" : `occupancy_stress_${Math.round(Math.abs(delta) * 100)}pp`,
      label: delta === 0 ? "Base" : `${Math.round(Math.abs(delta) * 100)} pp occupancy stress`,
      scenarioInputs: {
        occupancyDeltaPercentagePoints: delta,
        scenarioOccupancy,
        operatingExpensesHeldConstant: operatingExpenses,
      },
      outputs: {
        egi: scenarioEgi,
        noi: scenarioNoi,
        noiMargin: scenarioNoiMargin,
        noiDeltaVsBase: normalizeZero(scenarioNoi - baseNoi),
      },
      formula: "scenario_egi = base_egi * (scenario_occupancy / base_occupancy); scenario_noi = scenario_egi - base_operating_expenses",
      baseInputKeys: ["occupancy", "egi", "operatingExpenses", "noi"],
      qualification: "InvestorIQ downside sensitivity. EGI is scaled linearly with occupancy while operating expenses are held constant; this is not a forecast.",
    });
  });
  return {
    displayReady: true,
    rows,
    formula: "scenario_egi = base_egi * (scenario_occupancy / base_occupancy); scenario_noi = scenario_egi - base_operating_expenses",
    qualification: "Occupancy stress is a transparent hypothetical perturbation. It does not assert future occupancy or a sourced revenue-conversion forecast.",
  };
}

function buildExpenseStress(base) {
  const egi = finite(base.egi?.value);
  const operatingExpenses = finite(base.operatingExpenses?.value);
  const baseNoi = finite(base.noi?.value);
  const eligible = egi !== null && operatingExpenses !== null && baseNoi !== null;
  if (!eligible) {
    return {
      displayReady: false,
      rows: [],
      formula: null,
      qualification: "Operating-expense stress requires governed base EGI, operating expenses, and NOI.",
    };
  }
  const rows = FULL_UNDERWRITING_SCENARIO_POLICY_V1.operatingExpenseStressRates.map((stressRate) => {
    const scenarioOperatingExpenses = operatingExpenses * (1 + stressRate);
    const scenarioNoi = egi - scenarioOperatingExpenses;
    const scenarioNoiMargin = egi !== 0 ? scenarioNoi / egi : null;
    return scenarioRow({
      key: stressRate === 0 ? "expense_base" : `expense_stress_${Math.round(stressRate * 100)}pct`,
      label: stressRate === 0 ? "Base" : `Operating expenses +${Math.round(stressRate * 100)}%`,
      scenarioInputs: {
        operatingExpenseStressRate: stressRate,
        egiHeldConstant: egi,
      },
      outputs: {
        operatingExpenses: scenarioOperatingExpenses,
        noi: scenarioNoi,
        noiMargin: scenarioNoiMargin,
        noiDeltaVsBase: normalizeZero(scenarioNoi - baseNoi),
      },
      formula: "scenario_operating_expenses = base_operating_expenses * (1 + stress_rate); scenario_noi = base_egi - scenario_operating_expenses",
      baseInputKeys: ["egi", "operatingExpenses", "noi"],
      qualification: "InvestorIQ downside sensitivity. EGI is held constant while operating expenses are stressed; this is not a forecast.",
    });
  });
  return {
    displayReady: true,
    rows,
    formula: "scenario_operating_expenses = base_operating_expenses * (1 + stress_rate); scenario_noi = base_egi - scenario_operating_expenses",
    qualification: "Expense stress is a transparent hypothetical perturbation. It does not assert future expense inflation.",
  };
}

function buildCapRateSensitivity(base) {
  const noi = finite(base.noi?.value);
  const capRate = ratio(base.goingInCapRate?.value);
  const units = finite(base.units?.value);
  const purchasePrice = finite(base.purchasePrice?.value);
  const eligible = noi !== null && noi > 0 && capRate !== null && capRate > 0 && capRate <= 0.5;
  if (!eligible) {
    return {
      displayReady: false,
      rows: [],
      formula: null,
      qualification: "Cap-rate value sensitivity requires governed NOI and an accepted going-in cap rate.",
    };
  }
  const rows = FULL_UNDERWRITING_SCENARIO_POLICY_V1.capRateStressBasisPoints.map((basisPoints) => {
    const scenarioCapRate = capRate + (basisPoints / 10000);
    const impliedValue = scenarioCapRate > 0 ? noi / scenarioCapRate : null;
    const valuePerUnit = impliedValue !== null && units !== null && units > 0 ? impliedValue / units : null;
    const valueDeltaVsPurchasePrice = impliedValue !== null && purchasePrice !== null ? normalizeZero(impliedValue - purchasePrice, 0.5) : null;
    return scenarioRow({
      key: basisPoints === 0 ? "cap_rate_base" : `cap_rate_stress_${basisPoints}bps`,
      label: basisPoints === 0 ? "Base" : `Cap rate +${basisPoints} bps`,
      scenarioInputs: {
        capRateStressBasisPoints: basisPoints,
        scenarioCapRate,
        noiHeldConstant: noi,
      },
      outputs: {
        impliedValue,
        valuePerUnit,
        valueDeltaVsPurchasePrice,
      },
      formula: "scenario_implied_value = base_noi / scenario_cap_rate",
      baseInputKeys: ["noi", "goingInCapRate", ...(units !== null ? ["units"] : []), ...(purchasePrice !== null ? ["purchasePrice"] : [])],
      qualification: "InvestorIQ cap-rate sensitivity. NOI is held constant and the cap rate is widened only for hypothetical downside testing; this is not a market forecast.",
    });
  });
  return {
    displayReady: true,
    rows,
    formula: "scenario_implied_value = base_noi / scenario_cap_rate",
    qualification: "Cap-rate sensitivity uses the accepted going-in cap rate as the base and applies clearly labeled hypothetical basis-point expansion.",
  };
}

function buildOccupancyExpenseMatrix(base) {
  const occupancy = finite(base.occupancy?.value);
  const egi = finite(base.egi?.value);
  const operatingExpenses = finite(base.operatingExpenses?.value);
  const baseNoi = finite(base.noi?.value);
  const eligible = occupancy !== null && occupancy > 0 && occupancy <= 1 && egi !== null && operatingExpenses !== null && baseNoi !== null;
  if (!eligible) {
    return {
      displayReady: false,
      occupancyLevels: [],
      expenseLevels: [],
      cells: [],
      qualification: "Two-dimensional occupancy × expense sensitivity requires governed occupancy, EGI, operating expenses, and NOI.",
    };
  }
  const occupancyLevels = FULL_UNDERWRITING_SCENARIO_POLICY_V1.occupancyStressPercentagePoints.map((delta) => ({
    key: delta === 0 ? "base" : `minus_${Math.round(Math.abs(delta) * 100)}pp`,
    deltaPercentagePoints: delta,
    occupancy: Math.max(0, Math.min(1, occupancy + delta)),
  }));
  const expenseLevels = FULL_UNDERWRITING_SCENARIO_POLICY_V1.operatingExpenseStressRates.map((rate) => ({
    key: rate === 0 ? "base" : `plus_${Math.round(rate * 100)}pct`,
    stressRate: rate,
  }));
  const cells = [];
  for (const occ of occupancyLevels) {
    for (const exp of expenseLevels) {
      const scenarioEgi = egi * (occ.occupancy / occupancy);
      const scenarioOperatingExpenses = operatingExpenses * (1 + exp.stressRate);
      const scenarioNoi = scenarioEgi - scenarioOperatingExpenses;
      cells.push({
        rowKey: occ.key,
        columnKey: exp.key,
        evidenceClass: EVIDENCE_CLASSES.SCENARIO,
        sourceBacked: false,
        scenario: true,
        scenarioOccupancy: occ.occupancy,
        operatingExpenseStressRate: exp.stressRate,
        scenarioEgi,
        scenarioOperatingExpenses,
        scenarioNoi,
        noiDeltaVsBase: normalizeZero(scenarioNoi - baseNoi),
        formula: "scenario_noi = base_egi * (scenario_occupancy / base_occupancy) - base_operating_expenses * (1 + expense_stress_rate)",
      });
    }
  }
  return {
    displayReady: true,
    occupancyLevels,
    expenseLevels,
    cells,
    qualification: "Matrix combines the same transparent occupancy and operating-expense perturbations. It does not add a probability, forecast, or investment recommendation.",
  };
}

export function buildFullUnderwritingScenarioEngineV1({
  sourceTruthPackage,
  operatingIntelligence,
  customerSurfaceModel = null,
  propertyProfile = null,
  reportMeta = null,
} = {}) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error("ELITE_SCENARIO_CANONICAL_SOURCE_TRUTH_REQUIRED");
  }
  if (!isOperatingIntelligence(operatingIntelligence)) {
    throw new Error("ELITE_SCENARIO_OPERATING_INTELLIGENCE_REQUIRED");
  }
  if (sourceTruthPackage.core_publishable !== true) {
    throw new Error("ELITE_SCENARIO_VALIDATED_CORE_REQUIRED");
  }

  const base = {
    units: baseReceiptFromOperatingMetric(operatingIntelligence.metrics?.units, "units"),
    occupancy: baseReceiptFromOperatingMetric(operatingIntelligence.metrics?.occupancy, "occupancy"),
    egi: baseReceiptFromOperatingMetric(operatingIntelligence.metrics?.egi, "egi"),
    operatingExpenses: baseReceiptFromOperatingMetric(operatingIntelligence.metrics?.operatingExpenses, "operatingExpenses"),
    noi: baseReceiptFromOperatingMetric(operatingIntelligence.metrics?.noi, "noi"),
    noiMargin: baseReceiptFromOperatingMetric(operatingIntelligence.metrics?.noiMargin, "noiMargin"),
    goingInCapRate: sourceBackedAcquisitionFact(customerSurfaceModel, "going_in_cap_rate", { units: "ratio" }),
    purchasePrice: sourceBackedAcquisitionFact(customerSurfaceModel, "purchase_price", { units: "currency" }),
  };

  const occupancyStress = buildOccupancyStress(base);
  const expenseStress = buildExpenseStress(base);
  const capRateValueSensitivity = buildCapRateSensitivity(base);
  const occupancyExpenseMatrix = buildOccupancyExpenseMatrix(base);

  const sectionDispositions = {
    scenarioBasis: disposition({
      sectionKey: "eliteScenarioBasis",
      requestedDisposition: [occupancyStress, expenseStress, capRateValueSensitivity, occupancyExpenseMatrix].some((section) => section.displayReady)
        ? SECTION_DISPOSITIONS.INCLUDE
        : SECTION_DISPOSITIONS.COLLAPSE,
      surviving: Object.keys(base).filter((key) => base[key]?.displayReady),
      reason: "No governed deterministic base supports an ELITE-04 scenario family.",
    }),
    occupancyStress: disposition({
      sectionKey: "eliteOccupancyStress",
      requestedDisposition: occupancyStress.displayReady ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.COLLAPSE,
      surviving: occupancyStress.displayReady ? ["occupancy", "egi", "operatingExpenses", "noi"] : [],
      reason: occupancyStress.qualification,
    }),
    expenseStress: disposition({
      sectionKey: "eliteOperatingExpenseStress",
      requestedDisposition: expenseStress.displayReady ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.COLLAPSE,
      surviving: expenseStress.displayReady ? ["egi", "operatingExpenses", "noi"] : [],
      reason: expenseStress.qualification,
    }),
    capRateValueSensitivity: disposition({
      sectionKey: "eliteCapRateValueSensitivity",
      requestedDisposition: capRateValueSensitivity.displayReady
        ? (base.purchasePrice.displayReady ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.INCLUDE_QUALIFIED)
        : SECTION_DISPOSITIONS.COLLAPSE,
      surviving: ["noi", "goingInCapRate", "units", "purchasePrice"].filter((key) => base[key]?.displayReady),
      reason: capRateValueSensitivity.displayReady && !base.purchasePrice.displayReady
        ? "Purchase price is unavailable; value delta versus purchase price is omitted."
        : capRateValueSensitivity.qualification,
    }),
    occupancyExpenseMatrix: disposition({
      sectionKey: "eliteOccupancyExpenseNoiMatrix",
      requestedDisposition: occupancyExpenseMatrix.displayReady ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.COLLAPSE,
      surviving: occupancyExpenseMatrix.displayReady ? ["occupancy", "egi", "operatingExpenses", "noi"] : [],
      reason: occupancyExpenseMatrix.qualification,
    }),
  };

  const availableScenarioFamilies = [
    occupancyStress.displayReady ? "occupancy_stress" : null,
    expenseStress.displayReady ? "operating_expense_stress" : null,
    capRateValueSensitivity.displayReady ? "cap_rate_value_sensitivity" : null,
    occupancyExpenseMatrix.displayReady ? "occupancy_expense_noi_matrix" : null,
  ].filter(Boolean);

  const propertyName = text(
    propertyProfile?.propertyName || propertyProfile?.property_name ||
      reportMeta?.propertyName || reportMeta?.property_name ||
      operatingIntelligence?.identity?.propertyName ||
      sourceTruthPackage?.property_name
  ) || null;

  const contract = {
    version: FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION,
    policyVersion: FULL_UNDERWRITING_SCENARIO_POLICY_VERSION,
    authority: {
      sourceTruthMutationAllowed: false,
      sourceFactAuthority: false,
      deterministicBaseAuthority: false,
      scenarioComputationAuthority: true,
      deliveryAuthority: false,
      publicationAuthority: false,
      revisionAuthority: false,
      forwardForecastAuthority: false,
      probabilityAuthority: false,
      investmentRecommendationAllowed: false,
      thresholdInferenceAllowed: false,
      irrAllowed: false,
      moicAllowed: false,
    },
    sourceTruthReceipt: {
      source: sourceTruthPackage.source,
      schemaVersion: sourceTruthPackage.schema_version,
      jobId: sourceTruthPackage.job_id || null,
      corePublishable: sourceTruthPackage.core_publishable === true,
      coreSourceMode: sourceTruthPackage?.core_input_sufficiency_state?.evidence?.core_source_mode ||
        operatingIntelligence?.sourceTruthReceipt?.coreSourceMode || null,
    },
    identity: { propertyName },
    scenarioBasis: {
      evidenceClass: EVIDENCE_CLASSES.SCENARIO,
      sourceBacked: false,
      label: "Scenario - Hypothetical Downside Sensitivity",
      policyVersion: FULL_UNDERWRITING_SCENARIO_POLICY_VERSION,
      purpose: FULL_UNDERWRITING_SCENARIO_POLICY_V1.purpose,
      base,
      assumptions: [
        "Occupancy stress scales base EGI linearly relative to base occupancy and holds operating expenses constant.",
        "Operating-expense stress holds base EGI constant and increases operating expenses by the stated scenario rate.",
        "Cap-rate sensitivity holds base NOI constant and widens the accepted going-in cap rate by the stated basis points.",
        "The occupancy × expense matrix combines only the preceding transparent perturbations.",
        "Scenario outputs are hypothetical tests, not sourced facts, forecasts, probabilities, or investment recommendations.",
      ],
    },
    occupancyStress: {
      disposition: sectionDispositions.occupancyStress,
      ...occupancyStress,
    },
    expenseStress: {
      disposition: sectionDispositions.expenseStress,
      ...expenseStress,
    },
    capRateValueSensitivity: {
      disposition: sectionDispositions.capRateValueSensitivity,
      ...capRateValueSensitivity,
    },
    occupancyExpenseMatrix: {
      disposition: sectionDispositions.occupancyExpenseMatrix,
      ...occupancyExpenseMatrix,
    },
    deferredScenarioFamilies: [
      {
        key: "rent_stress",
        reason: "Deferred from ELITE-04 v1 because a governed rent-to-EGI/NOI conversion basis is not universally established.",
      },
      {
        key: "interest_rate_stress",
        reason: "Deferred from ELITE-04 v1 to avoid expanding this packet into debt-term scenario authority.",
      },
      {
        key: "purchase_price_stress",
        reason: "Deferred from ELITE-04 v1; purchase-price driver ranking belongs in later governed driver analysis.",
      },
      {
        key: "irr_moic",
        reason: "Prohibited without a separately authorized complete cash-flow and equity basis.",
      },
    ],
    sectionDispositions: {
      ...sectionDispositions,
      scenarioBasis: sectionDispositions.scenarioBasis,
    },
    availability: {
      scenarioFamilyCount: availableScenarioFamilies.length,
      availableScenarioFamilies,
      chapterDisplayReady: availableScenarioFamilies.length > 0,
    },
    provenance: {
      operatingIntelligenceVersion: operatingIntelligence.version,
      sourceTruthFieldsUsed: unique([
        ...Object.values(base).flatMap((receipt) => receipt.provenance || []),
      ].map((value) => typeof value === "string" ? value : JSON.stringify(value))),
      scenarioPolicyVersion: FULL_UNDERWRITING_SCENARIO_POLICY_VERSION,
      rawParserInputsUsed: false,
      externalMarketInputsUsed: false,
      hiddenAssumptionsUsed: false,
      scenarioValuesPromotedToSourceBacked: false,
      scenarioValuesPromotedToDeterministicBaseFacts: false,
    },
  };

  return deepFreeze(contract);
}

export function validateFullUnderwritingScenarioEngineV1(contract) {
  const issues = [];
  if (!contract || typeof contract !== "object") issues.push("CONTRACT_REQUIRED");
  if (contract?.version !== FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION) issues.push("VERSION_INVALID");
  if (contract?.policyVersion !== FULL_UNDERWRITING_SCENARIO_POLICY_VERSION) issues.push("POLICY_VERSION_INVALID");
  if (contract?.sourceTruthReceipt?.source !== SOURCE_TRUTH_MARKER) issues.push("SOURCE_TRUTH_RECEIPT_INVALID");
  if (contract?.authority?.sourceTruthMutationAllowed !== false) issues.push("SOURCE_TRUTH_MUTATION_MUST_BE_FALSE");
  if (contract?.authority?.sourceFactAuthority !== false) issues.push("SOURCE_FACT_AUTHORITY_MUST_BE_FALSE");
  if (contract?.authority?.deterministicBaseAuthority !== false) issues.push("BASE_AUTHORITY_MUST_BE_FALSE");
  if (contract?.authority?.scenarioComputationAuthority !== true) issues.push("SCENARIO_COMPUTATION_AUTHORITY_REQUIRED");
  if (contract?.authority?.investmentRecommendationAllowed !== false) issues.push("RECOMMENDATION_MUST_BE_FALSE");
  if (contract?.authority?.thresholdInferenceAllowed !== false) issues.push("THRESHOLD_INFERENCE_MUST_BE_FALSE");
  if (contract?.authority?.irrAllowed !== false) issues.push("IRR_MUST_BE_FALSE");
  if (contract?.authority?.moicAllowed !== false) issues.push("MOIC_MUST_BE_FALSE");
  if (contract?.provenance?.scenarioValuesPromotedToSourceBacked !== false) issues.push("SCENARIO_SOURCE_PROMOTION_FORBIDDEN");
  if (contract?.provenance?.scenarioValuesPromotedToDeterministicBaseFacts !== false) issues.push("SCENARIO_BASE_PROMOTION_FORBIDDEN");
  if (contract?.provenance?.rawParserInputsUsed !== false) issues.push("RAW_PARSER_INPUTS_FORBIDDEN");
  if (contract?.provenance?.hiddenAssumptionsUsed !== false) issues.push("HIDDEN_ASSUMPTIONS_FORBIDDEN");

  const scenarioRows = [
    ...(Array.isArray(contract?.occupancyStress?.rows) ? contract.occupancyStress.rows : []),
    ...(Array.isArray(contract?.expenseStress?.rows) ? contract.expenseStress.rows : []),
    ...(Array.isArray(contract?.capRateValueSensitivity?.rows) ? contract.capRateValueSensitivity.rows : []),
  ];
  for (const row of scenarioRows) {
    if (row?.evidenceClass !== EVIDENCE_CLASSES.SCENARIO) issues.push(`SCENARIO_EVIDENCE_CLASS_INVALID:${row?.key || "unknown"}`);
    if (row?.sourceBacked !== false) issues.push(`SCENARIO_SOURCE_BACKED_FORBIDDEN:${row?.key || "unknown"}`);
    if (row?.scenario !== true) issues.push(`SCENARIO_FLAG_REQUIRED:${row?.key || "unknown"}`);
  }
  for (const cell of Array.isArray(contract?.occupancyExpenseMatrix?.cells) ? contract.occupancyExpenseMatrix.cells : []) {
    if (cell?.evidenceClass !== EVIDENCE_CLASSES.SCENARIO || cell?.sourceBacked !== false || cell?.scenario !== true) {
      issues.push(`MATRIX_SCENARIO_CLASS_INVALID:${cell?.rowKey || "row"}:${cell?.columnKey || "column"}`);
    }
  }

  const serialized = JSON.stringify(contract).toUpperCase();
  for (const token of ["\"BUY\"", "\"SELL\"", "\"HOLD\""]) {
    if (serialized.includes(token)) issues.push(`FORBIDDEN_RECOMMENDATION_${token.replace(/[^A-Z]/g, "")}`);
  }
  return { ok: issues.length === 0, issues };
}

export const FULL_UNDERWRITING_SCENARIO_EVIDENCE_CLASSES = EVIDENCE_CLASSES;
