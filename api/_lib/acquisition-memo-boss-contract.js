const CONTRACT_VERSION = "acq_memo_boss_contract_v1";

const FORBIDDEN_SURFACES = Object.freeze([
  "DSCR",
  "refinance",
  "refi",
  "DCF",
  "waterfall",
  "equity return",
  "deal score",
  "final recommendation",
  "BUY",
  "SELL",
  "HOLD",
  "loan approval",
  "lender commitment",
]);

const GENERIC_COLLAPSE_TEXT =
  "This section was omitted because the uploaded support context did not provide display-ready detail. Core report outputs remain based on the uploaded T12 and Rent Roll.";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBossContractFact(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeBossContractFact(item));
  }
  if (isPlainObject(value)) {
    const normalized = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue === undefined) continue;
      normalized[key] = normalizeBossContractFact(nestedValue);
    }
    return normalized;
  }
  return value === undefined ? null : value;
}

function cloneArray(value) {
  return Array.isArray(value) ? value.map((item) => normalizeBossContractFact(item)) : [];
}

function truthyObject(value) {
  return isPlainObject(value) ? value : null;
}

function buildBossContractAssertion(code, description, severity = "critical", section = null) {
  return {
    code,
    description,
    severity,
    section,
  };
}

function buildSectionContract({
  status,
  requiredFacts = [],
  sourceBindings = [],
  collapseInstructions = [GENERIC_COLLAPSE_TEXT],
  forbiddenFallbackText = [],
  renderRequirements = [],
  postRenderAssertions = [],
}) {
  return {
    status,
    requiredFacts: cloneArray(requiredFacts),
    sourceBindings: cloneArray(sourceBindings),
    collapseInstructions: cloneArray(collapseInstructions),
    forbiddenFallbackText: cloneArray(forbiddenFallbackText),
    renderRequirements: cloneArray(renderRequirements),
    postRenderAssertions: cloneArray(postRenderAssertions),
  };
}

function summarizeCoreSource(coreSource, defaultRole, defaultLabel) {
  const source = truthyObject(coreSource);
  if (!source) return null;
  return normalizeBossContractFact({
    fileId: source.fileId || null,
    originalFilename: source.originalFilename || null,
    role: source.role || defaultRole,
    roleLabel: source.roleLabel || defaultLabel,
    canonicalLabel: source.canonicalLabel || defaultLabel,
    treatment: source.treatment || null,
    use: source.use || null,
    sourceKind: source.sourceKind || defaultRole,
    authorityBasis: source.authorityBasis || null,
    allowedUses: Array.isArray(source.allowedUses) ? source.allowedUses : [],
    forbiddenUses: Array.isArray(source.forbiddenUses) ? source.forbiddenUses : [],
    extractedFacts: normalizeBossContractFact(source.extractedFacts || {}),
    sourceEvidence: normalizeBossContractFact(source.sourceEvidence || {}),
  });
}

function summarizeSupportDoc(doc) {
  const source = truthyObject(doc);
  if (!source) return null;
  return normalizeBossContractFact({
    fileId: source.fileId || null,
    originalFilename: source.originalFilename || null,
    canonicalRole: source.canonicalRole || source.role || null,
    roleLabel: source.roleLabel || null,
    canonicalLabel: source.canonicalLabel || null,
    treatment: source.treatment || null,
    use: source.use || null,
    sourceKind: source.sourceKind || "support_doc",
    authorityBasis: source.authorityBasis || null,
    allowedUses: Array.isArray(source.allowedUses) ? source.allowedUses : [],
    forbiddenUses: Array.isArray(source.forbiddenUses) ? source.forbiddenUses : [],
    extractedFacts: normalizeBossContractFact(source.extractedFacts || {}),
    sourceEvidence: normalizeBossContractFact(source.sourceEvidence || {}),
  });
}

function isValidCoreDoc(doc) {
  return truthyObject(doc) && Boolean(doc.role || doc.canonicalLabel || doc.sourceKind);
}

function hasStructuredValues(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return value !== null && value !== undefined && value !== "";
}

function buildSectionBindings(role, factPaths, notes = []) {
  return [
    {
      sourceRole: role,
      factPaths: cloneArray(factPaths),
      notes: cloneArray(notes),
    },
  ];
}

function buildAcquisitionMemoBossContract({
  canonicalSourcePackage = null,
  acquisitionMemoProjection = null,
  coreMetrics = null,
  propertyProfile = null,
  reportMeta = null,
  reportMode = null,
} = {}) {
  const coreT12 = summarizeCoreSource(canonicalSourcePackage?.coreT12, "core_t12", "Core Quantitative Source — Trailing 12-Month Income Statement");
  const coreRentRoll = summarizeCoreSource(canonicalSourcePackage?.coreRentRoll, "core_rent_roll", "Core Quantitative Source — Rent Roll");
  const supportDocs = cloneArray(acquisitionMemoProjection?.supportDocProjection?.allSupportDocs)
    .map(summarizeSupportDoc)
    .filter(Boolean);

  const t12Valid = isValidCoreDoc(coreT12);
  const rentRollValid = isValidCoreDoc(coreRentRoll);
  const fatalReasons = [];
  if (!t12Valid) fatalReasons.push("core_t12_unusable");
  if (!rentRollValid) fatalReasons.push("core_rent_roll_unusable");

  const rentRollFacts = normalizeBossContractFact(coreRentRoll?.extractedFacts || {});
  const t12Facts = normalizeBossContractFact(coreT12?.extractedFacts || {});
  const purchaseFacts = normalizeBossContractFact(acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts || {});
  const currentDebtFacts = normalizeBossContractFact(acquisitionMemoProjection?.currentDebtContext?.extractedFacts || {});

  const unitMixAvailable = hasStructuredValues(rentRollFacts?.unit_mix) || hasStructuredValues(rentRollFacts?.units);
  const totalUnitsAvailable = Number.isFinite(Number(rentRollFacts?.total_units)) || Number.isFinite(Number(coreMetrics?.units));
  const t12ExpenseLinesAvailable = hasStructuredValues(t12Facts?.expense_lines);
  const currentDebtAvailable =
    Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ||
    hasStructuredValues(currentDebtFacts);
  const purchaseAssumptionsAvailable =
    Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ||
    hasStructuredValues(purchaseFacts);

  const sections = {
    executiveSummary: buildSectionContract({
      status: "required",
      requiredFacts: ["property_name", "units", "occupancy", "noi"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["total_units", "occupancy", "annual_in_place_rent", "annual_market_rent"]),
      renderRequirements: ["Must be customer-facing and non-technical.", "Must not expose implementation language."],
      postRenderAssertions: [buildBossContractAssertion("EXEC_SUMMARY_PRESENT", "Executive Summary must render.", "critical", "executiveSummary")],
    }),
    keyMetricsSnapshot: buildSectionContract({
      status: "required",
      requiredFacts: ["units", "occupancy", "noi", "expenseRatio", "noiMargin", "purchasePrice", "goingInCapRate"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["total_units", "occupancy", "annual_in_place_rent"], ["coreMetrics"]),
      renderRequirements: ["Display deterministic metrics from core facts and normalized core metrics."],
      postRenderAssertions: [buildBossContractAssertion("KEY_METRICS_PRESENT", "Key Metrics Snapshot must render.", "critical", "keyMetricsSnapshot")],
    }),
    keyUpsideDrivers: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["annual_rent_upside", "rent_gap", "cap_rate_sensitivity"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["annual_in_place_rent", "annual_market_rent", "unit_mix"]),
    }),
    primaryConstraintReviewDisclosure: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["source_reconciliation", "data_limitations"],
      sourceBindings: buildSectionBindings("canonical_source_package", ["supportDocs", "coreT12", "coreRentRoll"]),
    }),
    acquisitionMemoSummary: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["property_name", "asset_class", "units"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["total_units", "occupancy"]),
    }),
    operatingSnapshot: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["units", "occupancy", "annual_in_place_rent", "annual_market_rent", "total_operating_expenses", "net_operating_income"],
      sourceBindings: [
        { sourceRole: "core_rent_roll", factPaths: ["total_units", "occupancy", "annual_in_place_rent", "annual_market_rent"], notes: [] },
        { sourceRole: "core_t12", factPaths: ["effective_gross_income", "total_operating_expenses", "net_operating_income"], notes: [] },
      ],
    }),
    unitMix: buildSectionContract({
      status: unitMixAvailable ? "required" : "collapsed",
      requiredFacts: ["unit_mix", "units", "total_units", "occupancy"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["unit_mix", "units", "total_units", "occupancy"]),
      collapseInstructions: [
        "If structured unit mix or unit rows are unavailable, collapse the section with a customer-safe note.",
        "Do not show fallback text that claims no parsed unit mix rows were available when structured unit evidence exists.",
      ],
      forbiddenFallbackText: ["No parsed unit mix rows were available from the canonical rent roll evidence."],
      renderRequirements: [
        "Prefer structured unit_mix or units before any text fallback.",
        "If total units are available, render per-unit values rather than dashes.",
      ],
    }),
    rentUpsideValueSensitivity: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["annual_in_place_rent", "annual_market_rent", "annual_rent_upside", "rent_gap"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["annual_in_place_rent", "annual_market_rent", "unit_mix", "units"]),
    }),
    capRateValueIndication: buildSectionContract({
      status: totalUnitsAvailable ? "required" : "required_if_source_present",
      requiredFacts: ["purchase_price", "going_in_cap_rate", "total_units", "units", "noi"],
      sourceBindings: [
        { sourceRole: "core_t12", factPaths: ["net_operating_income", "effective_gross_income"], notes: [] },
        { sourceRole: "core_rent_roll", factPaths: ["total_units"], notes: [] },
        { sourceRole: "purchase_assumptions", factPaths: ["purchase_price", "going_in_cap_rate"], notes: [] },
      ],
      collapseInstructions: ["If total units are missing, omit per-unit values rather than fabricating them."],
      forbiddenFallbackText: ["-"],
      renderRequirements: ["Per-unit values are required when total units are available."],
    }),
    preliminaryFinancingReadinessSummary: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["purchase_assumptions", "current_debt_context", "lender_diligence_checklist"],
      sourceBindings: [
        { sourceRole: "purchase_assumptions", factPaths: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"], notes: [] },
        { sourceRole: "current_debt_context", factPaths: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"], notes: [] },
      ],
    }),
    acquisitionRequestContext: buildSectionContract({
      status: purchaseAssumptionsAvailable ? "required" : "collapsed",
      requiredFacts: ["purchase_price", "noi_basis", "going_in_cap_rate", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"],
      sourceBindings: buildSectionBindings("purchase_assumptions", ["purchase_price", "noi_basis", "going_in_cap_rate", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"]),
      collapseInstructions: ["If purchase assumptions are absent, collapse the acquisition request context instead of inventing terms."],
    }),
    operatingSupport: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["income_lines", "expense_lines", "effective_gross_income", "total_operating_expenses", "net_operating_income"],
      sourceBindings: buildSectionBindings("core_t12", ["income_lines", "expense_lines", "effective_gross_income", "total_operating_expenses", "net_operating_income"]),
    }),
    rentValueSupport: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["annual_in_place_rent", "annual_market_rent", "annual_rent_upside"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["annual_in_place_rent", "annual_market_rent", "unit_mix"]),
    }),
    currentDebtContext: buildSectionContract({
      status: currentDebtAvailable ? "required" : "collapsed",
      requiredFacts: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"],
      sourceBindings: buildSectionBindings("current_debt_context", ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"]),
      collapseInstructions: ["If current debt facts are unavailable or unusable, collapse the debt context section with a customer-safe note."],
      renderRequirements: ["Render source-backed current debt facts when available.", "Do not treat proposed acquisition financing as current debt."],
    }),
    proposedFinancingContext: buildSectionContract({
      status: purchaseAssumptionsAvailable ? "required" : "collapsed",
      requiredFacts: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"],
      sourceBindings: buildSectionBindings("purchase_assumptions", ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"]),
      collapseInstructions: ["If proposed financing facts are unavailable, collapse the proposed financing context section rather than borrowing current debt facts."],
    }),
    debtFinancingContext: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["current_debt_context", "purchase_assumptions"],
      sourceBindings: [
        { sourceRole: "current_debt_context", factPaths: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"], notes: [] },
        { sourceRole: "purchase_assumptions", factPaths: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"], notes: [] },
      ],
    }),
    lenderDiligenceChecklist: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["has_purchase_assumptions", "has_current_debt_context", "has_structured_renovation", "has_appraisal_context", "has_market_survey_context", "has_environmental_context"],
      sourceBindings: buildSectionBindings("acquisition_memo_projection", ["financingReadinessSignals", "lenderDiligenceChecklist"]),
    }),
    operatingStatementTTMSummary: buildSectionContract({
      status: t12ExpenseLinesAvailable ? "required" : "required_if_source_present",
      requiredFacts: ["income_lines", "expense_lines", "effective_gross_income", "total_operating_expenses", "net_operating_income", "gross_potential_rent"],
      sourceBindings: buildSectionBindings("core_t12", ["income_lines", "expense_lines", "effective_gross_income", "total_operating_expenses", "net_operating_income", "gross_potential_rent"]),
      collapseInstructions: ["If T12 line items are unavailable, collapse the detailed operating statement rather than showing a summary-only approximation."],
    }),
    dataCoverageSourceLimitations: buildSectionContract({
      status: "required",
      requiredFacts: ["core_t12", "core_rent_roll", "support_docs"],
      sourceBindings: buildSectionBindings("canonical_source_package", ["coreT12", "coreRentRoll", "supportDocs"]),
    }),
    sourceContextSupportDocumentTreatment: buildSectionContract({
      status: "required",
      requiredFacts: ["support_docs", "treatments", "uses"],
      sourceBindings: buildSectionBindings("acquisition_memo_projection", ["supportDocProjection", "documentTreatmentRows"]),
    }),
    documentTreatment: buildSectionContract({
      status: "required",
      requiredFacts: ["support_docs", "treatments", "uses"],
      sourceBindings: buildSectionBindings("acquisition_memo_projection", ["supportDocProjection", "documentTreatmentRows"]),
      renderRequirements: ["Render the source treatment schedule as customer-safe context, not as implementation commentary."],
    }),
    methodologyDataTransparency: buildSectionContract({
      status: "required",
      requiredFacts: ["methodology", "data_limitations", "uploaded_sources"],
      sourceBindings: buildSectionBindings("canonical_source_package", ["coreT12", "coreRentRoll", "supportDocs"]),
    }),
  };

  const contract = {
    contractVersion: CONTRACT_VERSION,
    reportMode: reportMode || null,
    coreGate: {
      t12Valid,
      rentRollValid,
      publishAllowed: t12Valid && rentRollValid && fatalReasons.length === 0,
      fatalReasons,
    },
    sourceTruth: {
      coreT12,
      coreRentRoll,
      supportDocs,
    },
    reportContext: normalizeBossContractFact({
      propertyProfile,
      reportMeta,
      coreMetrics,
    }),
    sections,
    forbiddenSurfaces: [...FORBIDDEN_SURFACES],
    renderRequirements: [
      "Renderer must obey the Boss Contract deterministically.",
      "Renderer must not invent facts or use unsupported fallback text when source-backed facts exist.",
      "Optional/support sections may collapse, but whole-report failure is reserved for unusable core T12, unusable core Rent Roll, or fatal contradiction.",
    ],
    postRenderAssertions: [
      buildBossContractAssertion("NO_FORBIDDEN_SURFACES", "Forbidden underwriting surfaces must never appear.", "critical", "global"),
      buildBossContractAssertion("NO_FAKE_UNIT_MIX_FALLBACK", "Unit mix fallback text must not appear when structured unit evidence exists.", "critical", "unitMix"),
      buildBossContractAssertion("NO_ZERO_CAP_RATE", "Going-in cap rate must not render as zero when a valid source-backed cap exists.", "critical", "capRateValueIndication"),
      buildBossContractAssertion("NO_PER_UNIT_DASH_WITH_UNITS", "Per-unit cap-rate values are required when total units are known.", "critical", "capRateValueIndication"),
    ],
    diagnostics: [],
  };

  return contract;
}

function validateAcquisitionMemoBossContract(contract) {
  const issues = [];
  const pushIssue = (code, description, severity = "critical", path = null) => {
    issues.push({ code, description, severity, path });
  };

  if (!isPlainObject(contract)) {
    pushIssue("CONTRACT_NOT_OBJECT", "Boss Contract must be an object.");
    return { ok: false, issues };
  }

  if (contract.contractVersion !== CONTRACT_VERSION) {
    pushIssue("CONTRACT_VERSION_MISMATCH", `Expected ${CONTRACT_VERSION}.`, "critical", "contractVersion");
  }

  if (!isPlainObject(contract.coreGate)) {
    pushIssue("CORE_GATE_MISSING", "coreGate is required.", "critical", "coreGate");
  } else {
    for (const key of ["t12Valid", "rentRollValid", "publishAllowed"]) {
      if (typeof contract.coreGate[key] !== "boolean") {
        pushIssue("CORE_GATE_BOOL_MISSING", `${key} must be boolean.`, "critical", `coreGate.${key}`);
      }
    }
    if (!Array.isArray(contract.coreGate.fatalReasons)) {
      pushIssue("CORE_GATE_FATAL_REASONS_MISSING", "coreGate.fatalReasons must be an array.", "critical", "coreGate.fatalReasons");
    }
  }

  if (!isPlainObject(contract.sourceTruth)) {
    pushIssue("SOURCE_TRUTH_MISSING", "sourceTruth is required.", "critical", "sourceTruth");
  } else {
    if (!isPlainObject(contract.sourceTruth.coreT12) && contract.coreGate?.t12Valid) {
      pushIssue("CORE_T12_MISSING", "Valid core T12 must be represented in sourceTruth.", "critical", "sourceTruth.coreT12");
    }
    if (!isPlainObject(contract.sourceTruth.coreRentRoll) && contract.coreGate?.rentRollValid) {
      pushIssue("CORE_RENT_ROLL_MISSING", "Valid core Rent Roll must be represented in sourceTruth.", "critical", "sourceTruth.coreRentRoll");
    }
    if (!Array.isArray(contract.sourceTruth.supportDocs)) {
      pushIssue("SUPPORT_DOCS_MISSING", "sourceTruth.supportDocs must be an array.", "critical", "sourceTruth.supportDocs");
    }
  }

  if (!isPlainObject(contract.sections)) {
    pushIssue("SECTIONS_MISSING", "sections is required.", "critical", "sections");
  } else {
    const requiredSectionKeys = [
      "executiveSummary",
      "keyMetricsSnapshot",
      "acquisitionRequestContext",
      "operatingStatementTTMSummary",
      "unitMix",
      "capRateValueIndication",
      "currentDebtContext",
      "proposedFinancingContext",
      "documentTreatment",
      "lenderDiligenceChecklist",
    ];
    for (const key of requiredSectionKeys) {
      if (!isPlainObject(contract.sections[key])) {
        pushIssue("SECTION_MISSING", `${key} section is required.`, "critical", `sections.${key}`);
        continue;
      }
      for (const prop of ["status", "requiredFacts", "sourceBindings", "collapseInstructions", "forbiddenFallbackText", "renderRequirements", "postRenderAssertions"]) {
        if (prop === "status" && typeof contract.sections[key][prop] !== "string") {
          pushIssue("SECTION_STATUS_MISSING", `${key}.status must be a string.`, "critical", `sections.${key}.status`);
        } else if (prop !== "status" && !Array.isArray(contract.sections[key][prop])) {
          pushIssue("SECTION_ARRAY_MISSING", `${key}.${prop} must be an array.`, "critical", `sections.${key}.${prop}`);
        }
      }
    }
  }

  if (!Array.isArray(contract.forbiddenSurfaces) || contract.forbiddenSurfaces.length === 0) {
    pushIssue("FORBIDDEN_SURFACES_MISSING", "forbiddenSurfaces must be a non-empty array.", "critical", "forbiddenSurfaces");
  }

  if (!Array.isArray(contract.renderRequirements)) {
    pushIssue("RENDER_REQUIREMENTS_MISSING", "renderRequirements must be an array.", "critical", "renderRequirements");
  }

  if (!Array.isArray(contract.postRenderAssertions)) {
    pushIssue("POST_RENDER_ASSERTIONS_MISSING", "postRenderAssertions must be an array.", "critical", "postRenderAssertions");
  }

  const ok = issues.length === 0;
  return {
    ok,
    issues,
    criticalIssueCount: issues.filter((issue) => issue.severity === "critical").length,
    warningIssueCount: issues.filter((issue) => issue.severity !== "critical").length,
    contractVersion: contract.contractVersion || null,
  };
}

export {
  buildAcquisitionMemoBossContract,
  buildBossContractAssertion,
  buildSectionContract,
  normalizeBossContractFact,
  validateAcquisitionMemoBossContract,
};
