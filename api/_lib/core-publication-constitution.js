const T12_MINIMUM_TRUTH_FIELDS = Object.freeze([
  "effective_gross_income",
  "total_operating_expenses",
  "net_operating_income",
]);

const RENT_ROLL_MINIMUM_TRUTH_FIELDS = Object.freeze([
  "total_units",
  "annual_in_place_rent",
  "unit_mix_or_derivable_unit_rows",
]);

function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeBucket(value) {
  return String(value || "").trim().toLowerCase();
}

function isFinitePositiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

function countTruthy(values = []) {
  return values.reduce((sum, value) => sum + (value ? 1 : 0), 0);
}

function freezeReceipt(receipt) {
  return Object.freeze(receipt);
}

function buildFieldReceipt({
  field_name,
  source_basis,
  source_value = null,
  accepted = false,
  present = false,
  usable = false,
  contradictory = false,
  rejected = false,
  missing = false,
  source_path = null,
  note = null,
} = {}) {
  return freezeReceipt({
    field_name,
    source_basis,
    source_value,
    accepted: Boolean(accepted),
    present: Boolean(present),
    usable: Boolean(usable),
    contradictory: Boolean(contradictory),
    rejected: Boolean(rejected),
    missing: Boolean(missing),
    source_path: source_path || null,
    note: note || null,
  });
}

function buildTruthSetState({
  sourceTruthPackage = null,
  state = null,
  acceptedFacts = null,
  requiredFields = [],
  fieldBasisResolver = null,
  fieldValueResolver = null,
  sourceBasis = "",
  constructibleReason = "",
} = {}) {
  const safeState = state && typeof state === "object" ? state : {};
  const accepted = acceptedFacts && typeof acceptedFacts === "object" ? acceptedFacts : {};
  const evidence = safeState?.evidence && typeof safeState.evidence === "object" ? safeState.evidence : {};
  const publishabilityBucket = normalizeBucket(safeState?.publishability_bucket);
  const status = normalizeBucket(safeState?.status);
  const contradictory = publishabilityBucket === "admin_review_required" || status === "contradiction" || safeState?.system_contract_failure === true;
  const missingFields = [];
  const presentFields = [];
  const usableFields = [];
  const contradictoryFields = [];
  const fieldReceipts = requiredFields.map((fieldName) => {
    const resolvedValue = typeof fieldValueResolver === "function"
      ? fieldValueResolver(fieldName, { accepted, evidence, state: safeState })
      : undefined;
    const sourceValue = resolvedValue !== undefined
      ? resolvedValue
      : accepted[fieldName] ?? evidence[fieldName] ?? null;
    const present =
      sourceValue !== null &&
      sourceValue !== undefined &&
      sourceValue !== "" &&
      (typeof sourceValue === "boolean" ? sourceValue === true : Number.isFinite(Number(sourceValue)));
    const acceptedField = Object.prototype.hasOwnProperty.call(accepted, fieldName) && present;
    const usable = present && !contradictory && publishabilityBucket !== "user_needs_documents" && publishabilityBucket !== "admin_review_required";
    const missing = !present;
    const rejected = contradictory || safeState?.system_contract_failure === true || (publishabilityBucket === "user_needs_documents" && !present);
    const sourcePath = typeof fieldBasisResolver === "function" ? fieldBasisResolver(fieldName, { accepted, evidence, state: safeState }) : null;
    const receipt = buildFieldReceipt({
      field_name: fieldName,
      source_basis: sourceBasis,
      source_value: sourceValue,
      accepted: acceptedField,
      present,
      usable,
      contradictory,
      rejected,
      missing,
      source_path: sourcePath,
      note: usable ? "canonical_minimum_truth_field" : missing ? "field_missing" : contradictory ? "field_contradicted" : "field_constrained",
    });
    if (present) presentFields.push(fieldName);
    if (usable) usableFields.push(fieldName);
    if (missing) missingFields.push(fieldName);
    if (contradictory) contradictoryFields.push(fieldName);
    return receipt;
  });

  const satisfied =
    requiredFields.length > 0 &&
    missingFields.length === 0 &&
    contradictoryFields.length === 0 &&
    usableFields.length === requiredFields.length &&
    publishabilityBucket !== "user_needs_documents" &&
    publishabilityBucket !== "admin_review_required" &&
    safeState?.system_contract_failure !== true;

  return freezeReceipt({
    satisfied,
    constructible: satisfied,
    constructible_reason: satisfied ? "truthful_minimum_core_report_constructible" : constructibleReason || "truthful_minimum_core_report_not_constructible",
    source_basis: sourceBasis,
    required_fields: Object.freeze([...requiredFields]),
    field_receipts: Object.freeze(fieldReceipts),
    present_fields: Object.freeze(presentFields),
    usable_fields: Object.freeze(usableFields),
    missing_fields: Object.freeze(missingFields),
    contradictory_fields: Object.freeze(contradictoryFields),
    source_status: safeState?.status || null,
    source_publishability_bucket: safeState?.publishability_bucket || null,
    source_reason_code: safeState?.reason_code || null,
  });
}

function buildT12TruthSetState({
  sourceTruthPackage = null,
  t12State = null,
} = {}) {
  return buildTruthSetState({
    sourceTruthPackage,
    state: t12State,
    acceptedFacts: sourceTruthPackage?.core?.t12?.accepted_facts || null,
    requiredFields: T12_MINIMUM_TRUTH_FIELDS,
    sourceBasis: "validated_t12_core_contract",
    constructibleReason: "t12_minimum_truth_set_not_constructible",
    fieldBasisResolver: (fieldName) => `source_truth_package.core.t12.accepted_facts.${fieldName}`,
  });
}

function buildRentRollTruthSetState({
  sourceTruthPackage = null,
  rentRollState = null,
} = {}) {
  const acceptedFacts = sourceTruthPackage?.core?.rent_roll?.accepted_facts || {};
  const evidence = rentRollState?.evidence && typeof rentRollState.evidence === "object" ? rentRollState.evidence : {};
  return buildTruthSetState({
    sourceTruthPackage,
    state: rentRollState,
    acceptedFacts,
    requiredFields: RENT_ROLL_MINIMUM_TRUTH_FIELDS,
    sourceBasis: "validated_rent_roll_core_contract",
    constructibleReason: "rent_roll_minimum_truth_set_not_constructible",
    fieldValueResolver: (fieldName, { evidence: stateEvidence, accepted }) => {
      if (fieldName === "unit_mix_or_derivable_unit_rows") {
        return Boolean(
          stateEvidence?.has_unit_mix_or_derivable_rows === true ||
          stateEvidence?.unit_row_count > 0 ||
          accepted?.unit_mix_or_derivable_unit_rows === true
        );
      }
      return undefined;
    },
    fieldBasisResolver: (fieldName, { evidence: stateEvidence }) => {
      if (fieldName === "annual_in_place_rent") {
        return stateEvidence?.source_path || "canonical_deterministic_derivation";
      }
      if (fieldName === "unit_mix_or_derivable_unit_rows") {
        return stateEvidence?.has_unit_mix_or_derivable_rows === true
          ? "canonical_deterministic_derivation"
          : "source_truth_package.core.rent_roll.accepted_facts.unit_rows";
      }
      return `source_truth_package.core.rent_roll.accepted_facts.${fieldName}`;
    },
  });
}

function buildBand(value) {
  if (value >= 80) return "80-100";
  if (value >= 60) return "60-79";
  if (value >= 40) return "40-59";
  return "0-39";
}

function scoreT12Coverage(t12TruthSet, t12State) {
  const requiredCoverage = countTruthy(t12TruthSet.field_receipts.map((receipt) => receipt.usable)) * 5;
  const evidence = t12State?.evidence && typeof t12State.evidence === "object" ? t12State.evidence : {};
  const optionalCoverage = countTruthy([
    Number.isFinite(Number(evidence.gross_potential_rent)) && Number(evidence.gross_potential_rent) > 0,
    Number.isFinite(Number(evidence.income_line_count)) && Number(evidence.income_line_count) > 0,
    Number.isFinite(Number(evidence.expense_line_count)) && Number(evidence.expense_line_count) > 0,
    evidence.reconciles === true,
  ]) * 1.25;
  return Math.min(20, requiredCoverage + optionalCoverage);
}

function scoreRentRollCoverage(rentRollTruthSet, rentRollState) {
  const requiredCoverage = countTruthy(rentRollTruthSet.field_receipts.map((receipt) => receipt.usable)) * 5;
  const evidence = rentRollState?.evidence && typeof rentRollState.evidence === "object" ? rentRollState.evidence : {};
  const optionalCoverage = countTruthy([
    Number.isFinite(Number(evidence.unit_row_count)) && Number(evidence.unit_row_count) > 0,
    Number.isFinite(Number(evidence.occupancy)) && Number(evidence.occupancy) >= 0 && Number(evidence.occupancy) <= 1,
    evidence.has_unit_mix_or_derivable_rows === true,
    evidence.optional_detail_present === true,
    evidence.summary_row_detected === true,
  ]) * 1;
  return Math.min(20, requiredCoverage + optionalCoverage);
}

function scoreReliability({ t12State = null, rentRollState = null, t12TruthSet = null, rentRollTruthSet = null } = {}) {
  const buckets = [
    normalizeBucket(t12State?.publishability_bucket),
    normalizeBucket(rentRollState?.publishability_bucket),
  ];
  const statuses = [
    normalizeBucket(t12State?.status),
    normalizeBucket(rentRollState?.status),
  ];
  if (buckets.includes("system_contract_failure") || statuses.includes("contradiction")) return 0;
  if (t12TruthSet?.satisfied !== true || rentRollTruthSet?.satisfied !== true) return 8;
  if (buckets.includes("section_constrained_publishable") || buckets.includes("disclose_only_publishable")) return 12;
  return 20;
}

function scoreReconciliation(sourceReconciliationState = null) {
  const bucket = normalizeBucket(sourceReconciliationState?.publishability_bucket);
  if (bucket === "admin_review_required" || bucket === "system_contract_failure") return 0;
  if (bucket === "disclose_only_publishable") return 12;
  if (bucket === "section_constrained_publishable") return 8;
  if (bucket === "core_sufficient_publishable") return 20;
  return 10;
}

function scoreOptionalRichness({ t12State = null, rentRollState = null } = {}) {
  const t12Evidence = t12State?.evidence && typeof t12State.evidence === "object" ? t12State.evidence : {};
  const rentRollEvidence = rentRollState?.evidence && typeof rentRollState.evidence === "object" ? rentRollState.evidence : {};
  return Math.min(20, countTruthy([
    Number.isFinite(Number(t12Evidence.gross_potential_rent)) && Number(t12Evidence.gross_potential_rent) > 0,
    Number.isFinite(Number(t12Evidence.income_line_count)) && Number(t12Evidence.income_line_count) > 0,
    Number.isFinite(Number(t12Evidence.expense_line_count)) && Number(t12Evidence.expense_line_count) > 0,
    Number.isFinite(Number(rentRollEvidence.unit_row_count)) && Number(rentRollEvidence.unit_row_count) > 0,
    rentRollEvidence.has_unit_mix_or_derivable_rows === true,
    rentRollEvidence.has_market_rent === true,
    rentRollEvidence.has_lease_dates === true,
    rentRollEvidence.has_square_footage === true,
    rentRollEvidence.summary_row_detected === true,
    rentRollEvidence.optional_detail_present === true,
  ]) * 2);
}

function buildMinimumTruthSetState({
  sourceTruthPackage = null,
  t12State = null,
  rentRollState = null,
} = {}) {
  const t12 = buildT12TruthSetState({ sourceTruthPackage, t12State });
  const rentRoll = buildRentRollTruthSetState({ sourceTruthPackage, rentRollState });
  const sourceMode =
    t12.satisfied && rentRoll.satisfied
      ? "dual_source_core"
      : t12.satisfied
        ? "t12_minimum_core"
        : rentRoll.satisfied
          ? "rent_roll_minimum_core"
          : "insufficient_core";
  const satisfied = sourceMode !== "insufficient_core";
  return freezeReceipt({
    satisfied,
    constructible: satisfied,
    constructible_reason: satisfied
      ? sourceMode
      : "minimum_truth_set_not_satisfied",
    basis: sourceMode,
    source_mode: sourceMode,
    t12,
    rent_roll: rentRoll,
  });
}

export function buildCoreTruthSufficiencyScore({
  sourceTruthPackage = null,
  t12State = null,
  rentRollState = null,
  sourceReconciliationState = null,
} = {}) {
  const t12TruthSet = buildT12TruthSetState({ sourceTruthPackage, t12State });
  const rentRollTruthSet = buildRentRollTruthSetState({ sourceTruthPackage, rentRollState });
  const t12Coverage = scoreT12Coverage(t12TruthSet, t12State);
  const rentRollCoverage = scoreRentRollCoverage(rentRollTruthSet, rentRollState);
  const reliability = scoreReliability({ t12State, rentRollState, t12TruthSet, rentRollTruthSet });
  const reconciliation = scoreReconciliation(sourceReconciliationState);
  const richness = scoreOptionalRichness({ t12State, rentRollState });
  const value = clampScore(t12Coverage + rentRollCoverage + reliability + reconciliation + richness);
  return freezeReceipt({
    value,
    band: buildBand(value),
    explanation: "governance_score_for_minimum_truth_set_and_core_quality_factors",
    terminal_failure_prohibited: t12TruthSet.satisfied || rentRollTruthSet.satisfied,
    components: freezeReceipt({
      t12_coverage: t12Coverage,
      rent_roll_coverage: rentRollCoverage,
      reliability,
      reconciliation,
      optional_richness: richness,
    }),
  });
}

export function buildCorePublicationConstitution({
  sourceTruthPackage = null,
  t12State = null,
  rentRollState = null,
  sourceReconciliationState = null,
  coreInputState = null,
} = {}) {
  const minimumTruthSet = buildMinimumTruthSetState({ sourceTruthPackage, t12State, rentRollState });
  const t12TruthSet = minimumTruthSet.t12;
  const rentRollTruthSet = minimumTruthSet.rent_roll;
  const minimumTruthSetSatisfied = minimumTruthSet.satisfied;
  const coreSourceMode = normalizeBucket(coreInputState?.evidence?.core_source_mode);
  const coreInputAllowsPublication =
    coreInputState && typeof coreInputState === "object"
      ? coreInputState.status === "validated" &&
        coreInputState.user_needs_documents !== true &&
        coreInputState.admin_review_required !== true &&
        coreInputState.system_contract_failure !== true &&
        coreSourceMode !== "insufficient_core"
      : minimumTruthSetSatisfied;
  const ctss = buildCoreTruthSufficiencyScore({
    sourceTruthPackage,
    t12State,
    rentRollState,
    sourceReconciliationState,
  });
  const disclosureVariance =
    normalizeBucket(sourceReconciliationState?.publishability_bucket) === "disclose_only_publishable";
  const canConstructTruthfulMinimumCoreReport = coreInputAllowsPublication;

  return freezeReceipt({
    source: "core_publication_constitution",
    version: "core_publication_constitution_v2",
    core_publishable: canConstructTruthfulMinimumCoreReport,
    terminal_failure_prohibited: canConstructTruthfulMinimumCoreReport,
    terminal_failure_rate: canConstructTruthfulMinimumCoreReport ? "0.000%" : null,
    required_publication_rate: canConstructTruthfulMinimumCoreReport ? "100.000%" : null,
    truthful_minimum_core_report_constructible: canConstructTruthfulMinimumCoreReport,
    ctss,
    minimum_truth_set: freezeReceipt({
      ...minimumTruthSet,
      constructible: canConstructTruthfulMinimumCoreReport,
      constructible_reason: canConstructTruthfulMinimumCoreReport
        ? minimumTruthSet.source_mode || "truthful_minimum_core_report_constructible"
        : "minimum_truth_set_not_satisfied",
    }),
    t12_truth_set: t12TruthSet,
    rent_roll_truth_set: rentRollTruthSet,
    section_collapse_rule: freezeReceipt({
      narrowest_truthful_level: ["qualify", "compact", "collapse", "omit"].join(" -> "),
      customer_visibility_reason:
        "Section unavailable because the uploaded source did not contain sufficient source-verifiable information to support this analysis. No unsupported assumptions were introduced.",
    }),
    non_core_failures_must_recover: minimumTruthSetSatisfied,
    cross_source_conflict_policy: freezeReceipt({
      preserve_both_sources: true,
      disclose_variance: true,
      infer_cause: false,
      fabricate_reconciliation: false,
      terminal_failure_only_if_no_truthful_minimum_core_basis: true,
      disclose_only_publishable: disclosureVariance,
    }),
  });
}

export {
  buildMinimumTruthSetState,
  buildT12TruthSetState,
  buildRentRollTruthSetState,
};
