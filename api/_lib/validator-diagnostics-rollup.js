const DERIVED_ALLOWED_CODE_SET = new Set([
  'row_cost_derived_from_unit_count_x_cost_per_unit',
  'annual_debt_service_derived_from_monthly_payment',
  'derived_acquisition_loan_amount_allowed',
  'net_operating_income_derived_from_egi_minus_opex',
]);

const OWNER_AREA_CODE_MAP = {
  user_document_quality: new Set([
    'missing_unit_rows',
    'missing_total_units',
    'missing_in_place_rent',
    'vague_rent_roll_no_reliable_totals',
    'missing_effective_gross_income',
    'missing_operating_expenses',
    'missing_noi',
    'missing_annual_tax',
    'missing_total_budget',
  ]),
  parser_validator: new Set([
    'percent_column_rejected',
    'implausible_numeric_value',
    'glued_number_detected',
    'row_evidence_unmatched',
    'annual_tax_looks_like_year',
  ]),
  source_reconciliation: new Set([
    'core_t12_equation_mismatch',
    'summary_totals_incoherent',
    'rent_roll_t12_scale_mismatch',
    'DOCUMENT_FINANCIAL_SCALE_MISMATCH',
  ]),
  production_config: new Set([
    'DOCRAPTOR_NOT_PRODUCTION_MODE',
    'PRODUCTION_PDF_DISABLED',
  ]),
  platform_infrastructure: new Set([
    'openai_non_ok',
    'insufficient_quota',
    'rate_limit_exceeded',
    'billing_limit',
    'model_access_denied',
    'model_unavailable',
    'provider_outage',
    'timeout',
    'network_error',
    'malformed_request',
    'unknown_non_ok',
    'unknown_exception',
    'missing_api_key',
    'exception',
    'textract_failed',
  ]),
  qa_review: new Set([
    'admin_review',
    'qa_status_admin_review',
    'MARKET_SURVEY_CLASSIFICATION_REVIEW',
  ]),
  derived_allowed: DERIVED_ALLOWED_CODE_SET,
};

const pushCount = (map, key) => {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const uniqueSorted = (value) => [...new Set(asArray(value).filter(Boolean))].sort();

export function classifyDiagnosticOwnerArea(code) {
  const normalized = String(code || '').trim();
  if (!normalized) return null;
  for (const [area, codes] of Object.entries(OWNER_AREA_CODE_MAP)) {
    if (codes.has(normalized)) return area;
  }
  return null;
}

const extractDiagnosticsFromPayload = (payload) => {
  const p = payload && typeof payload === 'object' ? payload : {};
  const parser = p.parser_diagnostics && typeof p.parser_diagnostics === 'object' ? p.parser_diagnostics : {};
  const aiRecovery =
    p.ai_recovery_diagnostics && typeof p.ai_recovery_diagnostics === 'object' ? p.ai_recovery_diagnostics : {};
  const validationDiag =
    p.validation_diagnostics && typeof p.validation_diagnostics === 'object' ? p.validation_diagnostics : {};
  const coreT12Validation =
    p.core_t12_validation && typeof p.core_t12_validation === 'object' ? p.core_t12_validation : {};

  return {
    reasonCodes: [
      ...asArray(parser.validation_reasons),
      ...asArray(aiRecovery.validation_reasons),
      ...asArray(aiRecovery.rejection_reasons),
      ...asArray(validationDiag.validation_reasons),
      ...asArray(validationDiag.rejection_reasons),
      ...asArray(p.rejection_reasons),
      ...asArray(p.validation_reasons),
      ...asArray(p.flags).map((flag) => flag?.code),
      ...asArray(p.parse_warnings),
      ...asArray(coreT12Validation.failures),
      p.provider_error_class || null,
    ],
    acceptedFields: [
      ...asArray(parser.accepted_fields),
      ...asArray(aiRecovery.accepted_fields),
      ...asArray(validationDiag.accepted_fields),
      ...asArray(p.accepted_fields),
    ],
    derivedFields: [
      ...asArray(parser.derived_fields),
      ...asArray(aiRecovery.derived_fields),
      ...asArray(validationDiag.derived_fields),
      ...asArray(p.derived_fields),
    ],
    fieldReasonCodes: [
      ...asArray(parser.field_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
      ...asArray(aiRecovery.field_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
      ...asArray(validationDiag.field_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
      ...asArray(p.field_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
    ],
    rowReasonCodes: [
      ...asArray(parser.row_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
      ...asArray(aiRecovery.row_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
      ...asArray(validationDiag.row_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
      ...asArray(p.row_diagnostics).flatMap((row) => asArray(row?.reason_codes)),
    ],
    familiesSeen: [
      parser && Object.keys(parser).length ? 'parser_diagnostics' : null,
      aiRecovery && Object.keys(aiRecovery).length ? 'ai_recovery_diagnostics' : null,
      validationDiag && Object.keys(validationDiag).length ? 'validation_diagnostics' : null,
      asArray(p.flags).length ? 'flags' : null,
      asArray(p.parse_warnings).length ? 'parse_warnings' : null,
      asArray(coreT12Validation.failures).length ? 'core_t12_validation' : null,
    ].filter(Boolean),
    validationAccepted:
      aiRecovery.validation_accepted === true ||
      validationDiag.validation_accepted === true ||
      p.validation_accepted === true,
    hasWarnings: asArray(p.parse_warnings).length > 0,
  };
};

export function buildValidatorDiagnosticsRollup({ jobId, reportType, artifacts, timestamp }) {
  const rows = asArray(artifacts);
  const reasonCodeCounts = {};
  const acceptedFieldCounts = {};
  const derivedFieldCounts = {};
  const fieldReasonCodeCounts = {};
  const rowReasonCodeCounts = {};

  const artifactTypesSeen = new Set();
  const validatorFamiliesSeen = new Set();
  const acceptedValidators = new Set();
  const rejectedValidators = new Set();
  const warningValidators = new Set();

  const allReasonCodes = [];

  for (const artifact of rows) {
    const type = String(artifact?.type || '').trim();
    if (type) artifactTypesSeen.add(type);
    const extracted = extractDiagnosticsFromPayload(artifact?.payload);

    for (const family of extracted.familiesSeen) validatorFamiliesSeen.add(family);

    const reasonCodes = uniqueSorted(extracted.reasonCodes);
    const acceptedFields = uniqueSorted(extracted.acceptedFields);
    const derivedFields = uniqueSorted(extracted.derivedFields);
    const fieldReasonCodes = uniqueSorted(extracted.fieldReasonCodes);
    const rowReasonCodes = uniqueSorted(extracted.rowReasonCodes);

    for (const code of reasonCodes) {
      pushCount(reasonCodeCounts, code);
      allReasonCodes.push(code);
    }
    for (const code of acceptedFields) pushCount(acceptedFieldCounts, code);
    for (const code of derivedFields) pushCount(derivedFieldCounts, code);
    for (const code of fieldReasonCodes) pushCount(fieldReasonCodeCounts, code);
    for (const code of rowReasonCodes) pushCount(rowReasonCodeCounts, code);

    const nonDerivedReasonCodes = reasonCodes.filter((code) => !DERIVED_ALLOWED_CODE_SET.has(code));
    const hasRejectedSignals = nonDerivedReasonCodes.length > 0;
    const hasAcceptedSignals = acceptedFields.length > 0 || derivedFields.length > 0;
    const hasOnlyDerivedAllowedReasons = reasonCodes.length > 0 && nonDerivedReasonCodes.length === 0;

    if (type && extracted.validationAccepted) {
      acceptedValidators.add(type);
    } else if (type && hasRejectedSignals) {
      rejectedValidators.add(type);
    } else if (type && (hasAcceptedSignals || hasOnlyDerivedAllowedReasons)) {
      acceptedValidators.add(type);
      if (extracted.hasWarnings && !hasAcceptedSignals) warningValidators.add(type);
    } else if (type && extracted.hasWarnings) {
      warningValidators.add(type);
    }
  }

  const sourceDocumentIssueCodes = new Set();
  const parserValidatorIssueCodes = new Set();
  const sourceReconciliationIssueCodes = new Set();
  const productionConfigIssueCodes = new Set();
  const platformInfrastructureIssueCodes = new Set();
  const qaReviewIssueCodes = new Set();
  const derivedAllowedCodes = new Set();
  const suggestedOwnerAreas = new Set();

  for (const code of uniqueSorted(allReasonCodes)) {
    const area = classifyDiagnosticOwnerArea(code);
    if (!area) continue;
    suggestedOwnerAreas.add(area);
    if (area === 'user_document_quality') sourceDocumentIssueCodes.add(code);
    if (area === 'parser_validator') parserValidatorIssueCodes.add(code);
    if (area === 'source_reconciliation') sourceReconciliationIssueCodes.add(code);
    if (area === 'production_config') productionConfigIssueCodes.add(code);
    if (area === 'platform_infrastructure') platformInfrastructureIssueCodes.add(code);
    if (area === 'qa_review') qaReviewIssueCodes.add(code);
    if (area === 'derived_allowed') derivedAllowedCodes.add(code);
  }

  const publishabilityRelevantCodes = uniqueSorted(
    uniqueSorted(allReasonCodes).filter((code) => !derivedAllowedCodes.has(code))
  );

  const topReasonCodes = Object.entries(reasonCodeCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([code, count]) => ({ code, count }));

  return {
    event: 'validator_diagnostics_rollup',
    job_id: jobId || null,
    report_type: reportType || null,
    timestamp: timestamp || new Date().toISOString(),
    artifact_types_seen: uniqueSorted([...artifactTypesSeen]),
    validator_families_seen: uniqueSorted([...validatorFamiliesSeen]),
    accepted_validators: uniqueSorted([...acceptedValidators]),
    rejected_validators: uniqueSorted([...rejectedValidators]),
    warning_validators: uniqueSorted([...warningValidators]),
    reason_code_counts: reasonCodeCounts,
    accepted_field_counts: acceptedFieldCounts,
    derived_field_counts: derivedFieldCounts,
    field_reason_code_counts: fieldReasonCodeCounts,
    row_reason_code_counts: rowReasonCodeCounts,
    source_document_issue_codes: uniqueSorted([...sourceDocumentIssueCodes]),
    parser_validator_issue_codes: uniqueSorted([...parserValidatorIssueCodes]),
    source_reconciliation_issue_codes: uniqueSorted([...sourceReconciliationIssueCodes]),
    production_config_issue_codes: uniqueSorted([...productionConfigIssueCodes]),
    platform_infrastructure_issue_codes: uniqueSorted([...platformInfrastructureIssueCodes]),
    qa_review_issue_codes: uniqueSorted([...qaReviewIssueCodes]),
    publishability_relevant_codes: publishabilityRelevantCodes,
    derived_allowed_codes: uniqueSorted([...derivedAllowedCodes]),
    top_reason_codes: topReasonCodes,
    suggested_owner_areas: uniqueSorted([...suggestedOwnerAreas]),
  };
}
