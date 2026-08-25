import {
  applySectionDisposition,
  SECTION_CLASSIFICATIONS,
  SECTION_DISPOSITIONS,
} from "./section-disposition-contract.js";
import {
  FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION,
  FULL_UNDERWRITING_SCENARIO_POLICY_VERSION,
  validateFullUnderwritingScenarioEngineV1,
} from "./full-underwriting-scenario-engine-v1.js";

export const FULL_UNDERWRITING_DRIVER_ANALYSIS_VERSION = "full_underwriting_driver_analysis_v1";
export const FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_VERSION = "full_underwriting_driver_analysis_policy_v1";

const EVIDENCE_CLASS_SCENARIO = "scenario";
const ALLOWED_IMPACT_LABELS = Object.freeze([
  "Primary driver",
  "Material driver",
  "Secondary driver",
]);

export const FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_V1 = Object.freeze({
  version: FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_VERSION,
  rankingBasis: "absolute_relative_change_in_primary_target_output_under_versioned_elite04_stress",
  rules: Object.freeze({
    sourceTruthMutationAllowed: false,
    scenarioOutputsAreEvidence: false,
    scenarioOutputsMayOverrideSourceTruth: false,
    scenarioValuesMayBePromotedToAcceptedFacts: false,
    hiddenStressMagnitudeAllowed: false,
    probabilityAssignmentAllowed: false,
    investmentRecommendationAllowed: false,
    riskLabelInferenceAllowed: false,
    thresholdInferenceAllowed: false,
    crossOutputRankingRequiresVisibleCaveat: true,
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

function normalizeZero(value, tolerance = 1e-9) {
  const n = finite(value);
  if (n === null) return null;
  return Math.abs(n) <= tolerance ? 0 : n;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isScenarioEngine(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.version === FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION &&
      value.policyVersion === FULL_UNDERWRITING_SCENARIO_POLICY_VERSION &&
      validateFullUnderwritingScenarioEngineV1(value).ok === true
  );
}

function pickMaximumStressRow(rows, stressAccessor) {
  const candidates = (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.scenario === true && row?.evidenceClass === EVIDENCE_CLASS_SCENARIO)
    .map((row) => ({ row, stress: Math.abs(finite(stressAccessor(row)) ?? 0) }))
    .filter((entry) => entry.stress > 0)
    .sort((a, b) => b.stress - a.stress || String(a.row?.key || "").localeCompare(String(b.row?.key || "")));
  return candidates[0]?.row || null;
}

function pickBaseRow(rows, key) {
  return (Array.isArray(rows) ? rows : []).find((row) => row?.key === key) || null;
}

function relativeImpact(baseOutput, outputChange) {
  const base = finite(baseOutput);
  const delta = finite(outputChange);
  if (base === null || delta === null || Math.abs(base) <= 1e-9) return null;
  return Math.abs(delta) / Math.abs(base);
}

function buildDriverCandidate({
  driverKey,
  label,
  scenarioFamily,
  scenarioRow,
  baseInput,
  stressedInput,
  inputUnits,
  stressLabel,
  targetOutput,
  targetLabel,
  baseOutput,
  stressedOutput,
  outputUnits,
  secondaryOutputs = {},
  baseEvidenceClass,
  baseAuthorityPath,
  scenarioPolicyVersion,
} = {}) {
  const base = finite(baseOutput);
  const stressed = finite(stressedOutput);
  const baseInputValue = finite(baseInput);
  const stressedInputValue = finite(stressedInput);
  if (!scenarioRow || base === null || stressed === null || baseInputValue === null || stressedInputValue === null) return null;
  const outputChange = normalizeZero(stressed - base);
  const impact = relativeImpact(base, outputChange);
  if (impact === null) return null;
  return {
    driverKey,
    label,
    evidenceClass: EVIDENCE_CLASS_SCENARIO,
    sourceBacked: false,
    scenario: true,
    scenarioFamily,
    scenarioKey: scenarioRow.key || null,
    scenarioPolicyVersion,
    baseInput: {
      value: baseInputValue,
      units: inputUnits,
      evidenceClass: baseEvidenceClass || null,
      authorityPath: baseAuthorityPath || null,
    },
    stressInput: {
      value: stressedInputValue,
      units: inputUnits,
      label: stressLabel,
    },
    targetOutput: {
      key: targetOutput,
      label: targetLabel,
      units: outputUnits,
      baseValue: base,
      stressedValue: stressed,
      outputChange,
      relativeImpactRatio: impact,
    },
    secondaryOutputs: { ...secondaryOutputs },
    evidenceBasis: {
      basis: "governed_elite04_scenario_from_accepted_or_deterministic_base",
      scenarioFamily,
      scenarioKey: scenarioRow.key || null,
      scenarioPolicyVersion,
      baseEvidenceClass: baseEvidenceClass || null,
      baseAuthorityPath: baseAuthorityPath || null,
      scenarioOutputIsEvidence: false,
    },
  };
}

function impactLabelForRank(rank) {
  if (rank === 1) return "Primary driver";
  if (rank === 2) return "Material driver";
  return "Secondary driver";
}

function rankDrivers(candidates) {
  return (Array.isArray(candidates) ? candidates : [])
    .filter(Boolean)
    .sort((a, b) => {
      const impactDiff = Number(b?.targetOutput?.relativeImpactRatio || 0) - Number(a?.targetOutput?.relativeImpactRatio || 0);
      if (Math.abs(impactDiff) > 1e-12) return impactDiff;
      return String(a.driverKey || "").localeCompare(String(b.driverKey || ""));
    })
    .map((candidate, index) => ({
      ...candidate,
      overallRank: index + 1,
      impactLabel: impactLabelForRank(index + 1),
    }));
}

function buildRankingsByTargetOutput(rankedDrivers) {
  const grouped = new Map();
  for (const driver of rankedDrivers) {
    const key = driver?.targetOutput?.key || "unknown";
    const existing = grouped.get(key) || [];
    existing.push(driver);
    grouped.set(key, existing);
  }
  const result = {};
  for (const [key, rows] of grouped.entries()) {
    result[key] = rows
      .slice()
      .sort((a, b) => b.targetOutput.relativeImpactRatio - a.targetOutput.relativeImpactRatio || a.overallRank - b.overallRank)
      .map((row, index) => ({
        driverKey: row.driverKey,
        targetRank: index + 1,
        relativeImpactRatio: row.targetOutput.relativeImpactRatio,
      }));
  }
  return result;
}

function buildDecisionInterpretation(rankedDrivers, scenarioEngine) {
  if (!rankedDrivers.length) {
    return {
      displayReady: false,
      headline: null,
      targetNotes: [],
      combinedDownsideContext: null,
      caveat: "No governed ELITE-04 scenario family supports driver ranking.",
    };
  }
  const top = rankedDrivers[0];
  const targetNotes = Object.entries(buildRankingsByTargetOutput(rankedDrivers)).map(([targetKey, rows]) => {
    const topForTarget = rankedDrivers.find((driver) => driver.driverKey === rows[0]?.driverKey);
    return topForTarget
      ? `${topForTarget.label} produces the largest modeled relative movement in ${topForTarget.targetOutput.label} among currently supported single-driver tests.`
      : null;
  }).filter(Boolean);

  const matrix = scenarioEngine?.occupancyExpenseMatrix || null;
  const baseNoi = finite(scenarioEngine?.scenarioBasis?.base?.noi?.value);
  const worstCell = (Array.isArray(matrix?.cells) ? matrix.cells : [])
    .filter((cell) => cell?.scenario === true && finite(cell?.noiDeltaVsBase) !== null)
    .sort((a, b) => Number(a.noiDeltaVsBase) - Number(b.noiDeltaVsBase))[0] || null;
  const combinedDownsideContext = worstCell && baseNoi !== null && Math.abs(baseNoi) > 1e-9
    ? {
        evidenceClass: EVIDENCE_CLASS_SCENARIO,
        sourceBacked: false,
        scenario: true,
        scenarioOccupancy: finite(worstCell.scenarioOccupancy),
        operatingExpenseStressRate: finite(worstCell.operatingExpenseStressRate),
        scenarioNoi: finite(worstCell.scenarioNoi),
        noiDeltaVsBase: finite(worstCell.noiDeltaVsBase),
        relativeNoiImpactRatio: Math.abs(Number(worstCell.noiDeltaVsBase)) / Math.abs(baseNoi),
        interpretation: "The combined occupancy and operating-expense case is shown as compound downside context only and is not ranked as an independent driver.",
      }
    : null;

  return {
    displayReady: true,
    headline: `${top.label} produces the largest normalized modeled output movement under the current governed ELITE-04 stress set.`,
    targetNotes,
    combinedDownsideContext,
    caveat: "Driver ranking compares absolute percentage movement in each driver's primary target output under different versioned stress magnitudes. It is a conditional sensitivity ranking, not a probability, forecast, risk grade, or investment recommendation.",
  };
}

function disposition({ sectionKey, displayReady, surviving, reason, compact = true, optional = false }) {
  return applySectionDisposition({
    sectionKey,
    classification: optional ? SECTION_CLASSIFICATIONS.OPTIONAL : SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: displayReady
      ? (optional ? SECTION_DISPOSITIONS.COMPACT : SECTION_DISPOSITIONS.INCLUDE)
      : (optional ? SECTION_DISPOSITIONS.OMIT : SECTION_DISPOSITIONS.COLLAPSE),
    minimumSurvivingFactKeys: Array.isArray(surviving) ? surviving : [],
    missingFactOrLimitationReason: reason || null,
    compactRendererEligible: compact,
    collapseReason: !displayReady && !optional ? reason || null : null,
    manifestDisclosure: displayReady
      ? "Driver ranking is derived only from governed ELITE-04 scenario outputs and remains non-evidentiary."
      : reason || null,
    certificationExpectation: "driver_ranking_must_remain_scenario_derived_and_non_recommendation",
  });
}

function buildDeferredDrivers(scenarioEngine) {
  const scenarioDeferred = new Map(
    (Array.isArray(scenarioEngine?.deferredScenarioFamilies) ? scenarioEngine.deferredScenarioFamilies : [])
      .map((item) => [String(item?.key || ""), text(item?.reason)])
  );
  return [
    {
      driverKey: "rent",
      label: "Rent",
      reason: scenarioDeferred.get("rent_stress") || "No governed rent stress family is available in ELITE-04 v1.",
    },
    {
      driverKey: "interestRate",
      label: "Interest Rate",
      reason: scenarioDeferred.get("interest_rate_stress") || "No governed interest-rate stress family is available in ELITE-04 v1.",
    },
    {
      driverKey: "purchasePrice",
      label: "Purchase Price",
      reason: scenarioDeferred.get("purchase_price_stress") || "No governed purchase-price stress family is available in ELITE-04 v1.",
    },
    {
      driverKey: "debtAmount",
      label: "Debt Amount",
      reason: "Debt-amount sensitivity is deferred to the governed Debt Intelligence upgrade.",
    },
    {
      driverKey: "majorCapEx",
      label: "Major CapEx",
      reason: "No governed ELITE-04 capital-burden stress family exists yet; capital sensitivity remains deferred.",
    },
    {
      driverKey: "taxExpense",
      label: "Tax Expense",
      reason: "No governed tax-expense stress family exists yet; tax sensitivity remains deferred.",
    },
  ];
}

export function buildFullUnderwritingDriverAnalysisV1({
  scenarioEngine,
  propertyProfile = null,
  reportMeta = null,
} = {}) {
  if (!isScenarioEngine(scenarioEngine)) {
    throw new Error("ELITE_DRIVER_VALID_SCENARIO_ENGINE_REQUIRED");
  }

  const base = scenarioEngine.scenarioBasis?.base || {};
  const occupancyRow = pickMaximumStressRow(
    scenarioEngine.occupancyStress?.rows,
    (row) => row?.scenarioInputs?.occupancyDeltaPercentagePoints
  );
  const expenseRow = pickMaximumStressRow(
    scenarioEngine.expenseStress?.rows,
    (row) => row?.scenarioInputs?.operatingExpenseStressRate
  );
  const capRateRow = pickMaximumStressRow(
    scenarioEngine.capRateValueSensitivity?.rows,
    (row) => row?.scenarioInputs?.capRateStressBasisPoints
  );
  const capRateBaseRow = pickBaseRow(scenarioEngine.capRateValueSensitivity?.rows, "cap_rate_base");

  const candidates = [
    buildDriverCandidate({
      driverKey: "occupancy",
      label: "Occupancy",
      scenarioFamily: "occupancy_stress",
      scenarioRow: occupancyRow,
      baseInput: base?.occupancy?.value,
      stressedInput: occupancyRow?.scenarioInputs?.scenarioOccupancy,
      inputUnits: base?.occupancy?.units || "ratio",
      stressLabel: occupancyRow?.label || null,
      targetOutput: "noi",
      targetLabel: "NOI",
      baseOutput: base?.noi?.value,
      stressedOutput: occupancyRow?.outputs?.noi,
      outputUnits: "currency",
      secondaryOutputs: {
        noiMargin: finite(occupancyRow?.outputs?.noiMargin),
        egi: finite(occupancyRow?.outputs?.egi),
      },
      baseEvidenceClass: base?.occupancy?.evidenceClass,
      baseAuthorityPath: base?.occupancy?.authorityPath,
      scenarioPolicyVersion: scenarioEngine.policyVersion,
    }),
    buildDriverCandidate({
      driverKey: "operatingExpenses",
      label: "Operating Expenses",
      scenarioFamily: "operating_expense_stress",
      scenarioRow: expenseRow,
      baseInput: base?.operatingExpenses?.value,
      stressedInput: expenseRow?.outputs?.operatingExpenses,
      inputUnits: base?.operatingExpenses?.units || "currency",
      stressLabel: expenseRow?.label || null,
      targetOutput: "noi",
      targetLabel: "NOI",
      baseOutput: base?.noi?.value,
      stressedOutput: expenseRow?.outputs?.noi,
      outputUnits: "currency",
      secondaryOutputs: {
        noiMargin: finite(expenseRow?.outputs?.noiMargin),
      },
      baseEvidenceClass: base?.operatingExpenses?.evidenceClass,
      baseAuthorityPath: base?.operatingExpenses?.authorityPath,
      scenarioPolicyVersion: scenarioEngine.policyVersion,
    }),
    buildDriverCandidate({
      driverKey: "capRate",
      label: "Cap Rate",
      scenarioFamily: "cap_rate_value_sensitivity",
      scenarioRow: capRateRow,
      baseInput: base?.goingInCapRate?.value,
      stressedInput: capRateRow?.scenarioInputs?.scenarioCapRate,
      inputUnits: base?.goingInCapRate?.units || "ratio",
      stressLabel: capRateRow?.label || null,
      targetOutput: "impliedValue",
      targetLabel: "Implied Value",
      baseOutput: capRateBaseRow?.outputs?.impliedValue,
      stressedOutput: capRateRow?.outputs?.impliedValue,
      outputUnits: "currency",
      secondaryOutputs: {
        valuePerUnit: finite(capRateRow?.outputs?.valuePerUnit),
        valueDeltaVsPurchasePrice: finite(capRateRow?.outputs?.valueDeltaVsPurchasePrice),
      },
      baseEvidenceClass: base?.goingInCapRate?.evidenceClass,
      baseAuthorityPath: base?.goingInCapRate?.authorityPath,
      scenarioPolicyVersion: scenarioEngine.policyVersion,
    }),
  ].filter(Boolean);

  const rankedDrivers = rankDrivers(candidates);
  const rankingsByTargetOutput = buildRankingsByTargetOutput(rankedDrivers);
  const decisionInterpretation = buildDecisionInterpretation(rankedDrivers, scenarioEngine);
  const deferredDrivers = buildDeferredDrivers(scenarioEngine);
  const propertyName = text(
    propertyProfile?.propertyName || propertyProfile?.property_name ||
      reportMeta?.propertyName || reportMeta?.property_name ||
      scenarioEngine?.identity?.propertyName
  ) || null;

  const sectionDispositions = {
    underwritingDriverAnalysis: disposition({
      sectionKey: "eliteUnderwritingDriverAnalysis",
      displayReady: rankedDrivers.length > 0,
      surviving: rankedDrivers.map((driver) => driver.driverKey),
      reason: rankedDrivers.length > 0 ? null : "No supported single-driver ELITE-04 scenario output can be ranked.",
    }),
    decisionInterpretation: disposition({
      sectionKey: "eliteDriverDecisionInterpretation",
      displayReady: decisionInterpretation.displayReady,
      surviving: rankedDrivers.map((driver) => driver.driverKey),
      reason: decisionInterpretation.caveat,
    }),
    deferredDrivers: disposition({
      sectionKey: "eliteDeferredDriverFamilies",
      displayReady: deferredDrivers.length > 0,
      surviving: deferredDrivers.map((driver) => driver.driverKey),
      reason: "Drivers without governed ELITE-04 stress families are disclosed but not ranked.",
      optional: true,
    }),
  };

  const contract = {
    version: FULL_UNDERWRITING_DRIVER_ANALYSIS_VERSION,
    policyVersion: FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_VERSION,
    authority: {
      sourceTruthMutationAllowed: false,
      sourceFactAuthority: false,
      deterministicBaseAuthority: false,
      scenarioAuthority: false,
      driverComputationAuthority: true,
      deliveryAuthority: false,
      publicationAuthority: false,
      revisionAuthority: false,
      probabilityAuthority: false,
      investmentRecommendationAllowed: false,
      riskLabelInferenceAllowed: false,
      thresholdInferenceAllowed: false,
    },
    scenarioEngineReceipt: {
      version: scenarioEngine.version,
      policyVersion: scenarioEngine.policyVersion,
      sourceTruthReceipt: { ...(scenarioEngine.sourceTruthReceipt || {}) },
      propertyName: scenarioEngine?.identity?.propertyName || propertyName,
    },
    identity: { propertyName },
    rankingPolicy: {
      version: FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_VERSION,
      basis: FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_V1.rankingBasis,
      stressSelection: "maximum_single_driver_downside_stress_available_in_elite04_v1",
      impactFormula: "absolute(stressed_primary_output - base_primary_output) / absolute(base_primary_output)",
      impactLabels: [...ALLOWED_IMPACT_LABELS],
      labelRule: "rank_1_primary_rank_2_material_rank_3_plus_secondary",
      crossOutputComparisonCaveat: "Relative impact is normalized by each driver's primary target output. Stress magnitudes differ by driver and are versioned by ELITE-04 policy.",
    },
    rankedDrivers,
    rankingsByTargetOutput,
    decisionInterpretation,
    deferredDrivers,
    unsupportedTargetOutputs: [
      {
        key: "dscr",
        reason: "DSCR driver ranking is deferred until governed debt-service sensitivity is implemented.",
      },
      {
        key: "breakEvenOccupancy",
        reason: "Break-even occupancy is not directly shocked by an ELITE-04 v1 single-driver family.",
      },
      {
        key: "annualCashBurden",
        reason: "Annual cash burden requires a separately governed debt/capital basis.",
      },
    ],
    sectionDispositions,
    availability: {
      rankedDriverCount: rankedDrivers.length,
      supportedDriverKeys: rankedDrivers.map((driver) => driver.driverKey),
      chapterContributionDisplayReady: rankedDrivers.length > 0,
    },
    provenance: {
      scenarioEngineVersion: scenarioEngine.version,
      scenarioPolicyVersion: scenarioEngine.policyVersion,
      sourceTruthReceiptReused: true,
      rawParserInputsUsed: false,
      externalMarketInputsUsed: false,
      hiddenStressMagnitudesUsed: false,
      scenarioValuesPromotedToAcceptedFacts: false,
      scenarioValuesPromotedToDeterministicBaseFacts: false,
      recommendationAuthorityCreated: false,
    },
  };

  return deepFreeze(contract);
}

export function validateFullUnderwritingDriverAnalysisV1(contract) {
  const issues = [];
  if (!contract || typeof contract !== "object") issues.push("CONTRACT_REQUIRED");
  if (contract?.version !== FULL_UNDERWRITING_DRIVER_ANALYSIS_VERSION) issues.push("VERSION_INVALID");
  if (contract?.policyVersion !== FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_VERSION) issues.push("POLICY_VERSION_INVALID");
  if (contract?.scenarioEngineReceipt?.version !== FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION) issues.push("SCENARIO_ENGINE_RECEIPT_INVALID");
  if (contract?.scenarioEngineReceipt?.policyVersion !== FULL_UNDERWRITING_SCENARIO_POLICY_VERSION) issues.push("SCENARIO_POLICY_RECEIPT_INVALID");
  if (contract?.scenarioEngineReceipt?.sourceTruthReceipt?.source !== "canonical_source_truth_package") issues.push("SOURCE_TRUTH_RECEIPT_INVALID");
  if (contract?.scenarioEngineReceipt?.sourceTruthReceipt?.corePublishable !== true) issues.push("VALIDATED_CORE_RECEIPT_REQUIRED");
  if (contract?.authority?.sourceTruthMutationAllowed !== false) issues.push("SOURCE_TRUTH_MUTATION_MUST_BE_FALSE");
  if (contract?.authority?.sourceFactAuthority !== false) issues.push("SOURCE_FACT_AUTHORITY_MUST_BE_FALSE");
  if (contract?.authority?.deterministicBaseAuthority !== false) issues.push("BASE_AUTHORITY_MUST_BE_FALSE");
  if (contract?.authority?.scenarioAuthority !== false) issues.push("SCENARIO_AUTHORITY_MUST_BE_FALSE");
  if (contract?.authority?.driverComputationAuthority !== true) issues.push("DRIVER_COMPUTATION_AUTHORITY_REQUIRED");
  if (contract?.authority?.investmentRecommendationAllowed !== false) issues.push("RECOMMENDATION_AUTHORITY_MUST_BE_FALSE");
  if (contract?.authority?.riskLabelInferenceAllowed !== false) issues.push("RISK_LABEL_INFERENCE_MUST_BE_FALSE");
  if (contract?.authority?.thresholdInferenceAllowed !== false) issues.push("THRESHOLD_INFERENCE_MUST_BE_FALSE");
  if (contract?.provenance?.rawParserInputsUsed !== false) issues.push("RAW_PARSER_INPUTS_FORBIDDEN");
  if (contract?.provenance?.hiddenStressMagnitudesUsed !== false) issues.push("HIDDEN_STRESS_MAGNITUDES_FORBIDDEN");
  if (contract?.provenance?.scenarioValuesPromotedToAcceptedFacts !== false) issues.push("SCENARIO_ACCEPTED_FACT_PROMOTION_FORBIDDEN");
  if (contract?.provenance?.scenarioValuesPromotedToDeterministicBaseFacts !== false) issues.push("SCENARIO_BASE_PROMOTION_FORBIDDEN");
  if (contract?.provenance?.recommendationAuthorityCreated !== false) issues.push("RECOMMENDATION_AUTHORITY_CREATED");

  const rows = Array.isArray(contract?.rankedDrivers) ? contract.rankedDrivers : [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row?.evidenceClass !== EVIDENCE_CLASS_SCENARIO) issues.push(`DRIVER_EVIDENCE_CLASS_INVALID:${row?.driverKey || index}`);
    if (row?.sourceBacked !== false) issues.push(`DRIVER_SOURCE_BACKED_FORBIDDEN:${row?.driverKey || index}`);
    if (row?.scenario !== true) issues.push(`DRIVER_SCENARIO_FLAG_REQUIRED:${row?.driverKey || index}`);
    if (row?.overallRank !== index + 1) issues.push(`DRIVER_RANK_INVALID:${row?.driverKey || index}`);
    if (!ALLOWED_IMPACT_LABELS.includes(row?.impactLabel)) issues.push(`DRIVER_IMPACT_LABEL_INVALID:${row?.driverKey || index}`);
    if (row?.impactLabel !== impactLabelForRank(index + 1)) issues.push(`DRIVER_IMPACT_LABEL_RANK_MISMATCH:${row?.driverKey || index}`);
    if (finite(row?.targetOutput?.relativeImpactRatio) === null || Number(row.targetOutput.relativeImpactRatio) < 0) {
      issues.push(`DRIVER_RELATIVE_IMPACT_INVALID:${row?.driverKey || index}`);
    }
    if (row?.evidenceBasis?.scenarioOutputIsEvidence !== false) issues.push(`DRIVER_SCENARIO_EVIDENCE_FIREWALL_INVALID:${row?.driverKey || index}`);
  }
  for (let index = 1; index < rows.length; index += 1) {
    if (Number(rows[index - 1]?.targetOutput?.relativeImpactRatio || 0) + 1e-12 < Number(rows[index]?.targetOutput?.relativeImpactRatio || 0)) {
      issues.push("DRIVER_SORT_ORDER_INVALID");
      break;
    }
  }

  const serialized = JSON.stringify(contract).toUpperCase();
  for (const token of ["HIGH RISK", "MODERATE RISK", "LOW RISK", '"BUY"', '"SELL"', '"HOLD"']) {
    if (serialized.includes(token)) issues.push(`FORBIDDEN_DRIVER_LANGUAGE:${token.replace(/[^A-Z]/g, "_")}`);
  }
  return { ok: issues.length === 0, issues };
}

export const FULL_UNDERWRITING_DRIVER_IMPACT_LABELS = ALLOWED_IMPACT_LABELS;
