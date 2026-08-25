import { toCapRatio } from "./report-number-helpers.js";
import { buildFullUnderwritingScenarioEngineV1 as buildGovernedScenarioEngineV1 } from "./full-underwriting-scenario-engine-v1.js";

const MODEL_VERSION = "elite-08-valuation-reconciliation-v1";
const SCENARIO_AUTHORITY = "elite-04-scenario-engine-v1";

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(/[$,%\s,]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveMoney(value) {
  const parsed = toFiniteNumber(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function firstFinite(candidates = []) {
  for (const candidate of candidates) {
    const value = toFiniteNumber(candidate?.value ?? candidate);
    if (Number.isFinite(value)) return candidate && typeof candidate === "object" && "value" in candidate
      ? { value, source: candidate.source || null, evidenceClass: candidate.evidenceClass || null }
      : { value, source: null, evidenceClass: null };
  }
  return { value: null, source: null, evidenceClass: null };
}

function firstPositiveMoney(candidates = []) {
  for (const candidate of candidates) {
    const value = toPositiveMoney(candidate?.value ?? candidate);
    if (Number.isFinite(value)) return candidate && typeof candidate === "object" && "value" in candidate
      ? { value, source: candidate.source || null, evidenceClass: candidate.evidenceClass || null }
      : { value, source: null, evidenceClass: null };
  }
  return { value: null, source: null, evidenceClass: null };
}

function firstCapRate(candidates = []) {
  for (const candidate of candidates) {
    const normalized = toCapRatio(candidate?.value ?? candidate);
    if (Number.isFinite(normalized) && normalized > 0 && normalized <= 0.5) {
      return candidate && typeof candidate === "object" && "value" in candidate
        ? { value: normalized, source: candidate.source || null, evidenceClass: candidate.evidenceClass || null }
        : { value: normalized, source: null, evidenceClass: null };
    }
  }
  return { value: null, source: null, evidenceClass: null };
}

function getSupportDocs({ bossContract = null, sourcePackage = null } = {}) {
  const candidates = [
    bossContract?.sourceTruth?.supportDocs,
    sourcePackage?.supportDocs,
    sourcePackage?.supportingDocs,
    sourcePackage?.supportingDocuments,
    sourcePackage?.supporting_documents,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) return candidate.filter(Boolean);
  }
  return [];
}

function supportDocByRole(context = {}, role = "") {
  const normalized = String(role || "").trim().toLowerCase();
  return getSupportDocs(context).find((doc) => String(doc?.canonicalRole || doc?.role || "").trim().toLowerCase() === normalized) || null;
}

function acceptedAcquisitionFacts(customerSurfaceModel = null) {
  const acquisition = customerSurfaceModel?.sections?.acquisitionRequestContext;
  const proposed = customerSurfaceModel?.sections?.proposedFinancingContext;
  return {
    ...(acquisition?.factAvailability?.sourceBacked === true ? acquisition?.facts || {} : {}),
    ...(proposed?.factAvailability?.sourceBacked === true ? proposed?.facts || {} : {}),
  };
}

function resolveCanonicalInputs({
  sourcePackage = null,
  coreMetrics = null,
  acquisitionMemoProjection = null,
  bossContract = null,
  customerSurfaceModel = null,
} = {}) {
  const wholePropertyValue = customerSurfaceModel?.valueSemantics?.wholePropertyValue || {};
  const acquisitionFacts = acceptedAcquisitionFacts(customerSurfaceModel);
  const purchaseDoc = supportDocByRole({ bossContract, sourcePackage }, "purchase_assumptions");
  const appraisalSection = customerSurfaceModel?.sections?.appraisalContext;
  const appraisalDoc = supportDocByRole({ bossContract, sourcePackage }, "appraisal_context");
  const appraisalFacts = appraisalSection?.factAvailability?.sourceBacked === true ? appraisalSection?.facts || {} : {};

  const noi = firstPositiveMoney([
    { value: wholePropertyValue?.noi, source: "customer_surface.valueSemantics.wholePropertyValue.noi", evidenceClass: "source_backed" },
    { value: bossContract?.reportContext?.coreMetrics?.noi, source: "boss_contract.reportContext.coreMetrics.noi", evidenceClass: "source_backed" },
    { value: bossContract?.sourceTruth?.coreT12?.extractedFacts?.noi, source: "boss_contract.sourceTruth.coreT12.noi", evidenceClass: "source_backed" },
    { value: sourcePackage?.coreT12?.extractedFacts?.noi, source: "source_package.coreT12.noi", evidenceClass: "source_backed" },
    { value: coreMetrics?.noi, source: "core_metrics.noi", evidenceClass: "source_backed" },
    { value: acquisitionFacts?.noi_basis, source: "customer_surface.acquisition.noi_basis", evidenceClass: "source_backed" },
    { value: acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.noi_basis, source: "acquisition_projection.noi_basis", evidenceClass: "source_backed" },
  ]);

  const acceptedGoingInCapRate = firstCapRate([
    { value: wholePropertyValue?.goingInCapRate, source: "customer_surface.valueSemantics.wholePropertyValue.goingInCapRate", evidenceClass: "source_backed" },
    { value: acquisitionFacts?.going_in_cap_rate, source: "customer_surface.acquisition.going_in_cap_rate", evidenceClass: "source_backed" },
    { value: coreMetrics?.goingInCapRate, source: "core_metrics.goingInCapRate", evidenceClass: "source_backed" },
    { value: acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.going_in_cap_rate, source: "acquisition_projection.proposed.going_in_cap_rate", evidenceClass: "source_backed" },
    { value: acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.going_in_cap_rate, source: "acquisition_projection.acquisition.going_in_cap_rate", evidenceClass: "source_backed" },
    { value: purchaseDoc?.extractedFacts?.going_in_cap_rate, source: "purchase_assumptions.going_in_cap_rate", evidenceClass: "source_backed" },
  ]);

  const purchasePrice = firstPositiveMoney([
    { value: wholePropertyValue?.purchasePrice, source: "customer_surface.valueSemantics.wholePropertyValue.purchasePrice", evidenceClass: "source_backed" },
    { value: acquisitionFacts?.purchase_price, source: "customer_surface.acquisition.purchase_price", evidenceClass: "source_backed" },
    { value: coreMetrics?.purchasePrice, source: "core_metrics.purchasePrice", evidenceClass: "source_backed" },
    { value: acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.purchase_price, source: "acquisition_projection.acquisition.purchase_price", evidenceClass: "source_backed" },
    { value: acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.purchase_price, source: "acquisition_projection.proposed.purchase_price", evidenceClass: "source_backed" },
    { value: purchaseDoc?.extractedFacts?.purchase_price, source: "purchase_assumptions.purchase_price", evidenceClass: "source_backed" },
  ]);

  const appraisalValue = firstPositiveMoney([
    { value: appraisalFacts?.appraisal_value, source: "customer_surface.appraisal_context.appraisal_value", evidenceClass: "third_party_context" },
    { value: appraisalDoc?.extractedFacts?.appraisal_value, source: "appraisal_context.appraisal_value", evidenceClass: "third_party_context" },
    { value: appraisalDoc?.extractedFacts?.appraised_value, source: "appraisal_context.appraised_value", evidenceClass: "third_party_context" },
  ]);

  const appraisalStabilizedNoi = firstPositiveMoney([
    { value: appraisalFacts?.stabilized_noi, source: "customer_surface.appraisal_context.stabilized_noi", evidenceClass: "third_party_context" },
    { value: appraisalDoc?.extractedFacts?.stabilized_noi, source: "appraisal_context.stabilized_noi", evidenceClass: "third_party_context" },
  ]);

  const appraisalStabilizedCapRate = firstCapRate([
    { value: appraisalFacts?.stabilized_cap_rate, source: "customer_surface.appraisal_context.stabilized_cap_rate", evidenceClass: "third_party_context" },
    { value: appraisalDoc?.extractedFacts?.stabilized_cap_rate, source: "appraisal_context.stabilized_cap_rate", evidenceClass: "third_party_context" },
  ]);

  const units = firstFinite([
    { value: customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units, source: "customer_surface.unit_mix.total_units", evidenceClass: "source_backed" },
    { value: coreMetrics?.units, source: "core_metrics.units", evidenceClass: "source_backed" },
    { value: bossContract?.reportContext?.coreMetrics?.units, source: "boss_contract.reportContext.coreMetrics.units", evidenceClass: "source_backed" },
    { value: bossContract?.sourceTruth?.coreRentRoll?.extractedFacts?.total_units, source: "boss_contract.sourceTruth.coreRentRoll.total_units", evidenceClass: "source_backed" },
    { value: sourcePackage?.coreRentRoll?.extractedFacts?.total_units, source: "source_package.coreRentRoll.total_units", evidenceClass: "source_backed" },
  ]);

  const coreReconciliationSection = customerSurfaceModel?.sections?.coreReconciliation || null;
  const coreReconciliationFacts = coreReconciliationSection?.factAvailability?.sectionDisplayReady === true
    ? coreReconciliationSection?.facts || {}
    : {};
  const coreReconciliation = {
    supported: coreReconciliationSection?.factAvailability?.sectionDisplayReady === true,
    t12GrossPotentialRent: toFiniteNumber(coreReconciliationFacts?.t12GrossPotentialRent),
    rentRollAnnualInPlaceRent: toFiniteNumber(coreReconciliationFacts?.rentRollAnnualInPlaceRent),
    differenceAmount: toFiniteNumber(coreReconciliationFacts?.differenceAmount),
    varianceRatioToT12Gpr: toFiniteNumber(coreReconciliationFacts?.varianceRatioToT12Gpr),
    perUnitMonthlyDifference: toFiniteNumber(coreReconciliationFacts?.perUnitMonthlyDifference),
    evidenceClass: "deterministic_calculated",
  };

  return {
    noi,
    acceptedGoingInCapRate,
    purchasePrice,
    appraisalValue,
    appraisalStabilizedNoi,
    appraisalStabilizedCapRate,
    coreReconciliation,
    units: Number.isFinite(units.value) && units.value > 0 ? units : { value: null, source: null, evidenceClass: null },
  };
}

function runGovernedScenarioEngine(input = {}) {
  if (input?.scenarioAnalysis && typeof input.scenarioAnalysis === "object") {
    return { value: input.scenarioAnalysis, source: "injected_governed_scenario_output", error: null };
  }
  try {
    const value = buildGovernedScenarioEngineV1({
      sourcePackage: input?.sourcePackage || null,
      coreMetrics: input?.coreMetrics || null,
      acquisitionMemoProjection: input?.acquisitionMemoProjection || null,
      bossContract: input?.bossContract || null,
      customerSurfaceModel: input?.customerSurfaceModel || null,
    });
    if (!value || typeof value !== "object" || typeof value?.then === "function") {
      return { value: null, source: SCENARIO_AUTHORITY, error: null };
    }
    return { value, source: SCENARIO_AUTHORITY, error: null };
  } catch (error) {
    return { value: null, source: SCENARIO_AUTHORITY, error: String(error?.message || error || "scenario_engine_unavailable") };
  }
}

const SCENARIO_CAP_RATE_KEYS = new Set([
  "caprate",
  "cap_rate",
  "scenariocaprate",
  "scenario_cap_rate",
  "assumedcaprate",
  "assumed_cap_rate",
  "valuationcaprate",
  "valuation_cap_rate",
]);

function collectGovernedCapRates(node, path = "root", out = [], depth = 0) {
  if (depth > 7 || node === null || node === undefined) return out;
  if (Array.isArray(node)) {
    node.forEach((item, index) => collectGovernedCapRates(item, `${path}[${index}]`, out, depth + 1));
    return out;
  }
  if (typeof node !== "object") return out;

  for (const [key, raw] of Object.entries(node)) {
    const normalizedKey = String(key || "").replace(/[^a-z0-9_]/gi, "").toLowerCase();
    const nextPath = `${path}.${key}`;
    if (SCENARIO_CAP_RATE_KEYS.has(normalizedKey) && /cap/i.test(nextPath)) {
      const capRate = toCapRatio(raw);
      if (Number.isFinite(capRate) && capRate > 0 && capRate <= 0.5) {
        out.push({ capRate, sourcePath: nextPath });
      }
    }
    collectGovernedCapRates(raw, nextPath, out, depth + 1);
  }
  return out;
}

function uniqueScenarioCapRates(rows = [], acceptedCapRate = null) {
  const sorted = [...rows]
    .filter((row) => Number.isFinite(row?.capRate))
    .sort((a, b) => a.capRate - b.capRate);
  const unique = [];
  for (const row of sorted) {
    if (unique.some((existing) => Math.abs(existing.capRate - row.capRate) < 1e-8)) continue;
    unique.push(row);
  }
  if (Number.isFinite(acceptedCapRate) && !unique.some((row) => Math.abs(row.capRate - acceptedCapRate) < 1e-8)) {
    unique.push({ capRate: acceptedCapRate, sourcePath: "accepted_base_cap_rate" });
    unique.sort((a, b) => a.capRate - b.capRate);
  }
  return unique;
}

function moneyDelta(left, right) {
  return Number.isFinite(left) && Number.isFinite(right) ? left - right : null;
}

function percentDelta(delta, denominator) {
  return Number.isFinite(delta) && Number.isFinite(denominator) && denominator !== 0 ? delta / denominator : null;
}

function directionForDelta(delta) {
  if (!Number.isFinite(delta)) return null;
  if (Math.abs(delta) < 0.5) return "aligned";
  return delta > 0 ? "above" : "below";
}

function buildScenarioSensitivity({ scenarioAnalysis = null, noi = null, acceptedCapRate = null, purchasePrice = null, units = null } = {}) {
  if (!scenarioAnalysis || !Number.isFinite(noi) || noi <= 0) {
    return { supported: false, authority: SCENARIO_AUTHORITY, rows: [] };
  }
  const harvestedScenarioRates = collectGovernedCapRates(scenarioAnalysis);
  if (harvestedScenarioRates.length === 0) {
    return { supported: false, authority: SCENARIO_AUTHORITY, rows: [], scenarioRowCount: 0 };
  }
  const governedRates = uniqueScenarioCapRates(harvestedScenarioRates, acceptedCapRate);
  const rows = governedRates.map(({ capRate, sourcePath }) => {
    const impliedValue = noi / capRate;
    return {
      capRate,
      impliedValue,
      valuePerUnit: Number.isFinite(units) && units > 0 ? impliedValue / units : null,
      deltaVsPurchasePrice: Number.isFinite(purchasePrice) ? impliedValue - purchasePrice : null,
      sourcePath,
      evidenceClass: Math.abs(capRate - acceptedCapRate) < 1e-8 ? "deterministic_calculated" : "scenario",
    };
  });
  const nonBaseRows = rows.filter((row) => row.evidenceClass === "scenario");
  return {
    supported: nonBaseRows.length > 0,
    authority: SCENARIO_AUTHORITY,
    rows,
    scenarioRowCount: nonBaseRows.length,
  };
}

function buildObservations(model) {
  const observations = [];
  const base = model?.baseValue || {};
  const purchase = model?.purchasePriceComparison || {};
  const appraisal = model?.appraisalComparison || {};
  const sensitivity = model?.valueSensitivity || {};

  if (purchase.supported) {
    observations.push({
      code: "IMPLIED_VALUE_VS_PURCHASE_PRICE",
      evidenceClass: "deterministic_calculated",
      direction: purchase.direction,
      delta: purchase.delta,
      deltaPct: purchase.deltaPct,
    });
    observations.push({
      code: "PURCHASE_PRICE_IMPLIED_CAP_RATE_CROSSCHECK",
      evidenceClass: "deterministic_calculated",
      purchasePriceImpliedCapRate: purchase.purchasePriceImpliedCapRate,
      acceptedGoingInCapRate: base.acceptedGoingInCapRate,
      capRateDelta: Number.isFinite(purchase.purchasePriceImpliedCapRate) && Number.isFinite(base.acceptedGoingInCapRate)
        ? purchase.purchasePriceImpliedCapRate - base.acceptedGoingInCapRate
        : null,
    });
  }

  if (appraisal.supported) {
    observations.push({
      code: "APPRAISAL_VS_INVESTORIQ_VALUE",
      evidenceClass: "third_party_context",
      direction: appraisal.directionVsInvestorIq,
      delta: appraisal.deltaVsInvestorIq,
      deltaPct: appraisal.deltaPctVsInvestorIq,
    });
  }

  const coreReconciliation = model?.coreReconciliationContext || {};
  if (coreReconciliation.supported && Number.isFinite(coreReconciliation.differenceAmount)) {
    observations.push({
      code: Math.abs(coreReconciliation.differenceAmount) < 0.5 ? "CORE_REVENUE_BASES_ALIGNED" : "CORE_REVENUE_BASES_DIFFER",
      evidenceClass: "deterministic_calculated",
      differenceAmount: coreReconciliation.differenceAmount,
      varianceRatioToT12Gpr: coreReconciliation.varianceRatioToT12Gpr,
      valuationAuthority: "accepted_t12_noi",
    });
  }

  if (sensitivity.supported) {
    const scenarioRows = sensitivity.rows.filter((row) => row.evidenceClass === "scenario");
    const values = scenarioRows.map((row) => row.impliedValue).filter(Number.isFinite);
    if (values.length > 0) {
      observations.push({
        code: "GOVERNED_CAP_RATE_SCENARIO_RANGE",
        evidenceClass: "scenario",
        lowValue: Math.min(...values),
        highValue: Math.max(...values),
        scenarioCount: scenarioRows.length,
        authority: sensitivity.authority,
      });
    }
  }
  return observations;
}

export function buildFullUnderwritingValuationReconciliationV1(input = {}) {
  const resolved = resolveCanonicalInputs(input);
  const noi = resolved.noi.value;
  const acceptedGoingInCapRate = resolved.acceptedGoingInCapRate.value;
  const purchasePrice = resolved.purchasePrice.value;
  const appraisalValue = resolved.appraisalValue.value;
  const appraisalStabilizedNoi = resolved.appraisalStabilizedNoi.value;
  const appraisalStabilizedCapRate = resolved.appraisalStabilizedCapRate.value;
  const coreReconciliationContext = resolved.coreReconciliation;
  const units = resolved.units.value;

  const baseSupported = Number.isFinite(noi) && noi > 0 && Number.isFinite(acceptedGoingInCapRate) && acceptedGoingInCapRate > 0;
  const impliedValue = baseSupported ? noi / acceptedGoingInCapRate : null;
  const valuePerUnit = baseSupported && Number.isFinite(units) && units > 0 ? impliedValue / units : null;

  const purchaseDelta = baseSupported && Number.isFinite(purchasePrice) ? moneyDelta(impliedValue, purchasePrice) : null;
  const purchasePriceComparison = {
    supported: baseSupported && Number.isFinite(purchasePrice),
    purchasePrice,
    purchasePricePerUnit: Number.isFinite(purchasePrice) && Number.isFinite(units) && units > 0 ? purchasePrice / units : null,
    delta: purchaseDelta,
    deltaPct: percentDelta(purchaseDelta, purchasePrice),
    direction: directionForDelta(purchaseDelta),
    purchasePriceImpliedCapRate: Number.isFinite(purchasePrice) && purchasePrice > 0 && Number.isFinite(noi) ? noi / purchasePrice : null,
    evidenceClass: "deterministic_calculated",
  };

  const appraisalDeltaVsInvestorIq = baseSupported && Number.isFinite(appraisalValue) ? moneyDelta(appraisalValue, impliedValue) : null;
  const appraisalDeltaVsPurchasePrice = Number.isFinite(appraisalValue) && Number.isFinite(purchasePrice) ? moneyDelta(appraisalValue, purchasePrice) : null;
  const appraisalComparison = {
    supported: baseSupported && Number.isFinite(appraisalValue),
    visibleLabel: String(
      input?.customerSurfaceModel?.sections?.appraisalContext?.visibleLabel ||
      input?.bossContract?.sections?.appraisalContext?.visibleLabel ||
      supportDocByRole({ bossContract: input?.bossContract, sourcePackage: input?.sourcePackage }, "appraisal_context")?.canonicalLabel ||
      "Appraisal / Valuation Context"
    ).trim(),
    appraisalValue,
    appraisalStabilizedNoi,
    appraisalStabilizedCapRate,
    appraisalValuePerUnit: Number.isFinite(appraisalValue) && Number.isFinite(units) && units > 0 ? appraisalValue / units : null,
    deltaVsInvestorIq: appraisalDeltaVsInvestorIq,
    deltaPctVsInvestorIq: percentDelta(appraisalDeltaVsInvestorIq, impliedValue),
    directionVsInvestorIq: directionForDelta(appraisalDeltaVsInvestorIq),
    deltaVsPurchasePrice: appraisalDeltaVsPurchasePrice,
    deltaPctVsPurchasePrice: percentDelta(appraisalDeltaVsPurchasePrice, purchasePrice),
    evidenceClass: "third_party_context",
  };

  const governedScenario = runGovernedScenarioEngine(input);
  const valueSensitivity = buildScenarioSensitivity({
    scenarioAnalysis: governedScenario.value,
    noi,
    acceptedCapRate: acceptedGoingInCapRate,
    purchasePrice,
    units,
  });

  const missing = [];
  if (!Number.isFinite(noi)) missing.push({ code: "NO_ACCEPTED_T12_NOI", dependentSurface: "base_value" });
  if (!Number.isFinite(acceptedGoingInCapRate)) missing.push({ code: "NO_ACCEPTED_GOING_IN_CAP_RATE", dependentSurface: "base_value" });
  if (!Number.isFinite(purchasePrice)) missing.push({ code: "NO_ACCEPTED_PURCHASE_PRICE", dependentSurface: "purchase_price_comparison" });
  if (!Number.isFinite(appraisalValue)) missing.push({ code: "NO_SOURCE_BACKED_APPRAISAL_VALUE", dependentSurface: "appraisal_comparison" });
  if (!valueSensitivity.supported) missing.push({ code: "NO_GOVERNED_CAP_RATE_SCENARIO_ROWS", dependentSurface: "value_sensitivity" });

  let disposition = "collapsed";
  if (baseSupported) disposition = purchasePriceComparison.supported || appraisalComparison.supported || valueSensitivity.supported ? "qualified" : "compact";
  if (baseSupported && purchasePriceComparison.supported && appraisalComparison.supported && valueSensitivity.supported) disposition = "full";

  const model = {
    version: MODEL_VERSION,
    sectionKey: "eliteValuationReconciliation",
    visibleLabel: "Valuation Position & Reconciliation",
    disposition,
    authority: {
      sourceTruthReadOnly: true,
      sourceTruthMutationAllowed: false,
      publicationAuthority: false,
      deliveryAuthority: false,
      recommendationAuthority: false,
      scenarioAuthority: SCENARIO_AUTHORITY,
      scenarioOutputsAreSourceEvidence: false,
      appraisalOverridesCanonicalOperatingTruth: false,
    },
    evidence: {
      noi: resolved.noi,
      acceptedGoingInCapRate: resolved.acceptedGoingInCapRate,
      purchasePrice: resolved.purchasePrice,
      appraisalValue: resolved.appraisalValue,
      appraisalStabilizedNoi: resolved.appraisalStabilizedNoi,
      appraisalStabilizedCapRate: resolved.appraisalStabilizedCapRate,
      units: resolved.units,
    },
    baseValue: {
      supported: baseSupported,
      noi,
      acceptedGoingInCapRate,
      impliedValue,
      valuePerUnit,
      evidenceClass: "deterministic_calculated",
    },
    purchasePriceComparison,
    appraisalComparison,
    coreReconciliationContext,
    valueSensitivity,
    valuationBridge: [
      baseSupported ? { label: "InvestorIQ Implied Value", value: impliedValue, valuePerUnit, evidenceClass: "deterministic_calculated" } : null,
      Number.isFinite(purchasePrice) ? { label: "Purchase Price", value: purchasePrice, valuePerUnit: purchasePriceComparison.purchasePricePerUnit, evidenceClass: "source_backed" } : null,
      Number.isFinite(appraisalValue) ? { label: "Appraised Value", value: appraisalValue, valuePerUnit: appraisalComparison.appraisalValuePerUnit, evidenceClass: "third_party_context" } : null,
    ].filter(Boolean),
    missing,
    diagnostics: {
      governedScenarioSource: governedScenario.source,
      governedScenarioError: governedScenario.error,
    },
  };
  model.observations = buildObservations(model);
  return model;
}

export const FULL_UNDERWRITING_VALUATION_RECONCILIATION_V1 = Object.freeze({
  version: MODEL_VERSION,
  scenarioAuthority: SCENARIO_AUTHORITY,
  build: buildFullUnderwritingValuationReconciliationV1,
});
