function normalizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff\ufffe\uffff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function displayLabelForDocType(value) {
  const normalized = normalizeText(value).replace(/[_/]+/g, " ");
  if (!normalized) return "";
  return normalized.replace(/\b([a-z])/g, (match) => match.toUpperCase()).replace(/\s+/g, " ").trim();
}

function positiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function hasHistoricalOnlyRenovationSignals({
  declaredDocType = null,
  detectedDocType = null,
  originalFilename = null,
  rawText = null,
  payload = null,
} = {}) {
  const source = payload && typeof payload === "object" ? payload : {};
  const combined = normalizeText([
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText,
    source?.original_filename,
    source?.semantic_doc_role,
    source?.semantic_doc_role_reason,
    source?.semantic_doc_display_label,
    source?.source_text,
    source?.raw_text,
    source?.notes,
    source?.extracted_text,
    source?.timing_or_phasing,
    source?.interpretation,
    source?.budget_note,
    source?.execution_note,
  ].filter(Boolean).join(" | "));
  const explicitHistoricalSignals =
    /(^|[^a-z])historical([^a-z]|$)|historical capex|historical capital|past repairs?|prior work|completed work|completed items?/i.test(combined);
  const explicitNoForwardSignals =
    /no forward-looking budget|no rent lift|no roi|no payback|no implementation schedule/i.test(combined);
  const timingHistorical =
    /\btiming[_\s-]*or[_\s-]*phasing\b[\s\S]{0,30}\bhistorical\b/i.test(`timing_or_phasing ${combined}`) ||
    /\bhistorical\b/.test(normalizeText(source?.timing_or_phasing));
  return explicitHistoricalSignals || explicitNoForwardSignals || timingHistorical;
}

function collectSupportDocSourceFacts(payload = null) {
  const source = payload && typeof payload === "object" ? payload : {};
  return {
    outstanding_balance: positiveNumber(source?.outstanding_balance) ? source.outstanding_balance : null,
    current_outstanding_balance: positiveNumber(source?.current_outstanding_balance) ? source.current_outstanding_balance : null,
    current_loan_balance: positiveNumber(source?.current_loan_balance) ? source.current_loan_balance : null,
    purchase_price: positiveNumber(source?.purchase_price) ? source.purchase_price : null,
    acquisition_price: positiveNumber(source?.acquisition_price) ? source.acquisition_price : null,
    asking_price: positiveNumber(source?.asking_price) ? source.asking_price : null,
    going_in_cap_rate: positiveNumber(source?.going_in_cap_rate) ? source.going_in_cap_rate : null,
    noi_basis: positiveNumber(source?.noi_basis) ? source.noi_basis : null,
    total_budget: positiveNumber(source?.total_budget) ? source.total_budget : null,
    total_capex: positiveNumber(source?.total_capex) ? source.total_capex : null,
    renovation_budget: positiveNumber(source?.renovation_budget) ? source.renovation_budget : null,
    interest_rate: positiveNumber(source?.interest_rate) ? source.interest_rate : null,
    amortization_years: positiveNumber(source?.amortization_years) ? source.amortization_years : null,
    amort_years: positiveNumber(source?.amort_years) ? source.amort_years : null,
    ltv: positiveNumber(source?.ltv) ? source.ltv : null,
    lender_fee_percent: positiveNumber(source?.lender_fee_percent) ? source.lender_fee_percent : null,
    financing_fee_percent: positiveNumber(source?.financing_fee_percent) ? source.financing_fee_percent : null,
    origination_fee_percent: positiveNumber(source?.origination_fee_percent) ? source.origination_fee_percent : null,
    rent_lift: source?.rent_lift || null,
    timing_or_phasing: source?.timing_or_phasing || null,
    budget_rows: Array.isArray(source?.budget_rows) ? source.budget_rows : null,
    execution_rows: Array.isArray(source?.execution_rows) ? source.execution_rows : null,
  };
}

function normalizeCanonicalSupportDocRole(role = "") {
  const normalized = String(role || "").trim().toLowerCase();
  if (["current_mortgage_statement", "current_debt_terms", "mortgage_statement"].includes(normalized)) {
    return "current_debt_context";
  }
  if (normalized === "structured_renovation_capex_plan") {
    return "structured_renovation";
  }
  if (normalized === "historical_capex_only") {
    return "historical_capex_only";
  }
  return normalized || "other_support";
}

function resolveExplicitSupportDocAuthority({
  declaredDocType = null,
  detectedDocType = null,
  originalFilename = null,
  rawText = null,
  payload = null,
} = {}) {
  const text = normalizeText([
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText,
    payload?.original_filename,
    payload?.semantic_doc_role,
    payload?.semantic_doc_display_label,
    payload?.doc_type,
    payload?.display_doc_type,
    payload?.source_text,
    payload?.raw_text,
    payload?.notes,
    payload?.loan_terms_text,
    payload?.extracted_text,
  ].filter(Boolean).join(" "));
  const hasText = (terms = []) => terms.some((term) => text.includes(normalizeText(term)));

  const purchaseAssumptions = hasText([
    "purchase assumptions / proposed acquisition financing",
    "purchase assumptions",
    "proposed acquisition financing",
    "acquisition context",
    "purchase price",
    "going-in cap rate",
    "noi basis",
  ]);
  if (purchaseAssumptions) {
    return {
      semantic_doc_role: "purchase_assumptions",
      semantic_doc_role_reason: "explicit_purchase_assumptions_source_text",
      semantic_doc_role_confidence: 0.99,
      semantic_doc_display_label: "Purchase Assumptions / Acquisition Context",
    };
  }

  const currentDebt = hasText([
    "existing current debt statement",
    "current outstanding balance",
    "current debt context",
    "current mortgage statement",
    "existing mortgage",
    "true current debt",
    "outstanding principal",
    "unpaid principal",
    "current loan balance",
    "monthly payment",
    "maturity",
  ]);
  if (currentDebt) {
    return {
      semantic_doc_role: "current_mortgage_statement",
      semantic_doc_role_reason: "explicit_current_debt_source_text",
      semantic_doc_role_confidence: 0.99,
      semantic_doc_display_label: "Debt Support Received / Contextual",
    };
  }

  if (
    hasHistoricalOnlyRenovationSignals({
      declaredDocType,
      detectedDocType,
      originalFilename,
      rawText,
      payload,
    }) &&
    hasText(["renov", "capex", "capital budget", "capital expenditure", "capital items", "scope of work", "unit turn", "improvement"])
  ) {
    return {
      semantic_doc_role: "historical_capex_only",
      semantic_doc_role_reason: "explicit_historical_capex_source_text",
      semantic_doc_role_confidence: 0.99,
      semantic_doc_display_label: "Historical Capital Items",
    };
  }

  const structuredRenovation =
    !hasText([
      "not provided",
      "no rent lift",
      "no roi",
      "no payback",
      "no implementation schedule",
      "historical capex",
      "historical capital",
      "past repairs",
      "prior work",
      "completed work",
    ]) && (
      hasText([
        "structured renovation / capex plan",
        "structured renovation / capex context",
        "forward-looking renovation plan",
        "expected monthly rent lift",
        "monthly rent lift",
        "phasing",
        "implementation schedule",
      ]) ||
      hasText(["capex", "capital budget", "capital expenditure", "scope of work", "unit turn", "improvement"]) &&
      hasText(["budget", "total budget", "rent lift", "phasing", "months", "phase"])
    );
  if (structuredRenovation) {
    const rowHasForwardLookingSignals = (rows = []) => rows.some((row) => {
      const rowText = normalizeText([
        row?.phase_timing,
        row?.timing_or_phasing,
        row?.notes,
        row?.description,
      ].filter(Boolean).join(" "));
      const hasFutureTiming = /\b(month|months|phase|q[1-4]|quarter|year|years)\b/.test(rowText) && !/\bhistorical\b/.test(rowText);
      const hasRentLift = positiveNumber(row?.expected_monthly_rent_lift) > 0 || positiveNumber(row?.rent_lift) > 0;
      return hasFutureTiming || hasRentLift;
    });
    const forwardLooking =
      hasText(["rent lift", "phasing", "implementation schedule", "months", "phase"]) ||
      rowHasForwardLookingSignals(Array.isArray(payload?.budget_rows) ? payload.budget_rows : []) ||
      rowHasForwardLookingSignals(Array.isArray(payload?.execution_rows) ? payload.execution_rows : []);
    return {
      semantic_doc_role: forwardLooking ? "structured_renovation_capex_plan" : "renovation_capex_budget_context",
      semantic_doc_role_reason: forwardLooking
        ? "explicit_renovation_capex_source_text"
        : "explicit_renovation_budget_source_text",
      semantic_doc_role_confidence: 0.99,
      semantic_doc_display_label: forwardLooking
        ? "Structured Renovation / CapEx Plan"
        : "Renovation / CapEx Budget Context",
    };
  }

  if (hasText(["market rent survey", "market survey", "rent survey", "rent comp", "rent comparables"])) {
    return {
      semantic_doc_role: "market_survey",
      semantic_doc_role_reason: "explicit_market_survey_source_text",
      semantic_doc_role_confidence: 0.98,
      semantic_doc_display_label: "Market Rent Context",
    };
  }

  if (hasText(["appraisal summary", "appraisal context", "valuation context", "appraisal excerpt", "opinion of value", "valuation report"]) ||
    positiveNumber(payload?.appraised_value) ||
    positiveNumber(payload?.cap_rate)) {
    return {
      semantic_doc_role: "appraisal",
      semantic_doc_role_reason: "explicit_appraisal_source_text",
      semantic_doc_role_confidence: 0.98,
      semantic_doc_display_label: "Appraisal Context",
    };
  }

  if (hasText(["phase i esa", "phase i", "phase 1", "environmental due diligence", "environmental report", "esa", "site assessment", "recognized environmental condition"])) {
    return {
      semantic_doc_role: "environmental_due_diligence",
      semantic_doc_role_reason: "explicit_environmental_source_text",
      semantic_doc_role_confidence: 0.98,
      semantic_doc_display_label: "Environmental Due Diligence Context",
    };
  }

  if (hasText(["property tax", "tax bill", "tax notice", "municipal tax", "assessment roll", "annual taxes", "realty tax", "real estate taxes"])) {
    return {
      semantic_doc_role: "property_tax",
      semantic_doc_role_reason: "explicit_property_tax_source_text",
      semantic_doc_role_confidence: 0.95,
      semantic_doc_display_label: "Property Tax Support",
    };
  }

  return null;
}

export function resolveSupportDocDisplayLabel({
  semanticDocRole = null,
  semanticDocRoleConfidence = null,
  originalFilename = null,
  declaredDocType = null,
  detectedDocType = null,
  docType = null,
} = {}) {
  const confidence = Number(semanticDocRoleConfidence);
  if (semanticDocRole && Number.isFinite(confidence) && confidence >= 0.75) {
    return semanticDocRole;
  }
  const filenameText = normalizeText(originalFilename);
  const fallbackDocType = normalizeText(declaredDocType || detectedDocType || docType || "");
  if (
    /broker/.test(filenameText) &&
    /email/.test(filenameText) &&
    /loan[\s_-]*term[\s_-]*sheet|loan_term_sheet/.test(fallbackDocType)
  ) {
    return "broker_email";
  }
  if (
    /purchase[\s_-]*assumptions|acquisition[\s_-]*assumptions|acquisition support/.test(filenameText) &&
    /appraisal|valuation/.test(fallbackDocType)
  ) {
    return "purchase_assumptions";
  }
  if (/renov|capex|capital budget|capital expenditure/.test(filenameText)) {
    return "renovation_budget";
  }
  if (
    /(current|existing|outstanding).*(mortgage|debt)|mortgage|debt/.test(filenameText) &&
    /loan[\s_-]*term[\s_-]*sheet|loan_term_sheet|mortgage_statement/.test(fallbackDocType)
  ) {
    return "current_mortgage_statement";
  }
  if (semanticDocRole) {
    return semanticDocRole;
  }
  return displayLabelForDocType(fallbackDocType || "");
}

export function buildSupportDocTaxonomyState({
  declaredDocType = null,
  detectedDocType = null,
  originalFilename = null,
  rawText = null,
  payload = null,
} = {}) {
  const text = normalizeText([
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText,
    payload?.original_filename,
    payload?.semantic_doc_role,
  ].filter(Boolean).join(" "));

  const hasText = (terms = []) => terms.some((term) => text.includes(normalizeText(term)));
  const explicitAuthority = resolveExplicitSupportDocAuthority({
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText,
    payload,
  });
  if (explicitAuthority) {
    return {
      semantic_doc_role: explicitAuthority.semantic_doc_role,
      semantic_doc_role_confidence: explicitAuthority.semantic_doc_role_confidence,
      semantic_doc_role_reason: explicitAuthority.semantic_doc_role_reason,
      semantic_doc_family: "support_doc",
      semantic_doc_display_label: explicitAuthority.semantic_doc_display_label,
    };
  }

  const historicalOnlyRenovation = hasHistoricalOnlyRenovationSignals({
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText,
    payload,
  });

  let semanticDocRole = null;
  let confidence = 0.25;
  let semanticDocRoleReason = "fallback_file_type";
  if (
    /mortgage|debt/.test(text) &&
    /loan[\s_-]*term[\s_-]*sheet|loan_term_sheet|mortgage_statement/.test(text)
  ) {
    semanticDocRole = "current_mortgage_statement";
    confidence = 0.88;
    semanticDocRoleReason = "filename_or_doc_type_current_debt";
  } else if (/purchase[\s_-]*assumptions|acquisition[\s_-]*assumptions|acquisition support/.test(text)) {
    semanticDocRole = "purchase_assumptions";
    confidence = 0.86;
    semanticDocRoleReason = "filename_or_doc_type_purchase_assumptions";
  } else if (/renov|capex|capital budget|capital expenditure/.test(text)) {
    semanticDocRole = historicalOnlyRenovation ? "historical_capex_only" : "renovation_budget";
    confidence = 0.78;
    semanticDocRoleReason = historicalOnlyRenovation
      ? "filename_or_doc_type_historical_capex"
      : "filename_or_doc_type_renovation";
  } else if (/appraisal|valuation/.test(text)) {
    semanticDocRole = "appraisal";
    confidence = 0.76;
    semanticDocRoleReason = "filename_or_doc_type_appraisal";
  } else if (/phase i esa|environmental|site assessment/.test(text)) {
    semanticDocRole = "environmental_due_diligence";
    confidence = 0.76;
    semanticDocRoleReason = "filename_or_doc_type_environmental";
  }

  const semanticDocDisplayLabel = resolveSupportDocDisplayLabel({
    semanticDocRole,
    semanticDocRoleConfidence: confidence,
    originalFilename,
    declaredDocType,
    detectedDocType,
    docType: declaredDocType || detectedDocType,
  });

  return {
    semantic_doc_role: semanticDocRole,
    semantic_doc_role_confidence: confidence,
    semantic_doc_role_reason: semanticDocRoleReason,
    semantic_doc_family: "support_doc",
    semantic_doc_display_label: semanticDocDisplayLabel,
  };
}

export function resolveCanonicalSupportDocAuthority({
  fileId = null,
  declaredDocType = null,
  detectedDocType = null,
  originalFilename = null,
  extractedText = null,
  rawText = null,
  payload = null,
  parserArtifact = null,
  aiRecoveryHints = null,
} = {}) {
  const parserPayload = parserArtifact && typeof parserArtifact === "object" && parserArtifact.payload && typeof parserArtifact.payload === "object"
    ? parserArtifact.payload
    : null;
  const effectivePayload = payload && typeof payload === "object" ? payload : parserPayload;
  const categoryForRole = (role) =>
    role === "purchase_assumptions" ||
    role === "current_debt_context" ||
    role === "structured_renovation" ||
    role === "renovation_capex_budget_context" ||
    role === "historical_capex_only" ||
    role === "property_tax"
      ? "Displayed / Limited Use"
      : role === "t12" || role === "rent_roll"
      ? "Modeled Inputs"
      : "Listed but Not Quantitatively Modeled";
  const explicitAuthority = resolveExplicitSupportDocAuthority({
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText: extractedText || rawText,
    payload: effectivePayload,
  });
  if (explicitAuthority) {
    const role = normalizeCanonicalSupportDocRole(explicitAuthority.semantic_doc_role);
    return {
      role,
      displayLabel: String(explicitAuthority.semantic_doc_display_label || "").trim() || "Other Support Document",
      category: categoryForRole(role),
      treatment: role === "purchase_assumptions"
        ? "Acquisition context / document-derived acquisition context"
        : role === "current_debt_context"
        ? "Debt support received / contextual or deferred"
        : role === "structured_renovation"
        ? "Structured renovation / CapEx context"
        : role === "historical_capex_only"
        ? "Context only"
        : role === "renovation_capex_budget_context"
        ? "Budget/scope only"
        : role === "appraisal"
        ? "Context only"
        : role === "market_survey"
        ? "Context only"
        : role === "environmental_due_diligence"
        ? "Context only"
        : "Context only",
      use: role === "purchase_assumptions"
        ? "Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth."
        : role === "current_debt_context"
        ? "Uploaded existing/current debt context only; not proposed acquisition financing."
        : role === "structured_renovation"
        ? "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled."
        : role === "historical_capex_only"
        ? "Historical capital items are displayed for context only."
        : role === "renovation_capex_budget_context"
        ? "Document-stated renovation budget/scope is acknowledged; rent lift, ROI, payback, and phasing are not modeled unless provided."
        : role === "appraisal"
        ? "Appraisal context only unless structured appraised value is verified; does not override deterministic valuation."
        : role === "market_survey"
        ? "Market/rent context only; does not override Rent Roll market rent."
        : role === "environmental_due_diligence"
        ? "Environmental due-diligence context only; no quantitative model impact."
        : "Listed for auditability only; not used quantitatively.",
      authoritySource: "explicit_keyword",
      confidence: 1.0,
      fileId: String(fileId || "").trim() || null,
      originalFilename: String(originalFilename || "").trim() || null,
      ...collectSupportDocSourceFacts(effectivePayload),
    };
  }

  const aiConfidence = Number(aiRecoveryHints?.confidence);
  if (Number.isFinite(aiConfidence) && aiConfidence > 0.8) {
    const aiRole = normalizeCanonicalSupportDocRole(String(
      aiRecoveryHints?.semantic_doc_role ||
      aiRecoveryHints?.role ||
      aiRecoveryHints?.doc_role ||
      ""
    ));
    return {
      role: aiRole || "other_support",
      displayLabel: String(
        aiRecoveryHints?.semantic_doc_display_label ||
        aiRecoveryHints?.display_label ||
        aiRecoveryHints?.document_role_label ||
        "Other Support Document"
      ).trim() || "Other Support Document",
      category: categoryForRole(aiRole || "other_support"),
      treatment: String(aiRecoveryHints?.treatment_label || aiRecoveryHints?.treatment || "Context only").trim() || "Context only",
      use: String(aiRecoveryHints?.use_label || aiRecoveryHints?.use || "Listed for auditability only; not used quantitatively.").trim() || "Listed for auditability only; not used quantitatively.",
      authoritySource: "ai_recovery",
      confidence: aiConfidence,
      fileId: String(fileId || "").trim() || null,
      originalFilename: String(originalFilename || "").trim() || null,
      ...collectSupportDocSourceFacts(aiRecoveryHints?.payload || effectivePayload),
    };
  }

  const parsedTaxonomy = buildSupportDocTaxonomyState({
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText: extractedText || rawText,
    payload: effectivePayload,
  });
  const parsedConfidence = Number(parsedTaxonomy?.semantic_doc_role_confidence);
  if (Number.isFinite(parsedConfidence) && parsedConfidence >= 0.8) {
    const role = normalizeCanonicalSupportDocRole(parsedTaxonomy?.semantic_doc_role);
    return {
      role: role || "other_support",
      displayLabel: String(parsedTaxonomy?.semantic_doc_display_label || "Other Support Document").trim() || "Other Support Document",
      category: categoryForRole(role || "other_support"),
      treatment:
        role === "purchase_assumptions"
          ? "Acquisition context / document-derived acquisition context"
          : role === "current_debt_context"
          ? "Debt support received / contextual or deferred"
          : role === "structured_renovation"
          ? "Structured renovation / CapEx context"
          : role === "historical_capex_only"
          ? "Context only"
          : role === "renovation_capex_budget_context"
          ? "Budget/scope only"
          : role === "appraisal"
          ? "Context only"
          : role === "market_survey"
          ? "Context only"
          : role === "environmental_due_diligence"
          ? "Context only"
          : "Context only",
      use:
        role === "purchase_assumptions"
          ? "Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth."
          : role === "current_debt_context"
          ? "Uploaded existing/current debt context only; not proposed acquisition financing."
          : role === "structured_renovation"
          ? "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled."
          : role === "historical_capex_only"
          ? "Historical capital items are displayed for context only."
          : role === "renovation_capex_budget_context"
          ? "Document-stated renovation budget/scope is acknowledged; rent lift, ROI, payback, and phasing are not modeled unless provided."
          : role === "appraisal"
          ? "Appraisal context only unless structured appraised value is verified; does not override deterministic valuation."
          : role === "market_survey"
          ? "Market/rent context only; does not override Rent Roll market rent."
          : role === "environmental_due_diligence"
          ? "Environmental due-diligence context only; no quantitative model impact."
          : "Listed for auditability only; not used quantitatively.",
      authoritySource: "semantic_parse",
      confidence: parsedConfidence,
      fileId: String(fileId || "").trim() || null,
      originalFilename: String(originalFilename || "").trim() || null,
      ...collectSupportDocSourceFacts(effectivePayload),
    };
  }

  return {
    role: "other_support",
    displayLabel: "Other Support Document",
    category: categoryForRole("other_support"),
    treatment: "Context only",
    use: "Listed for auditability only; not used quantitatively.",
    authoritySource: "fallback",
    confidence: 0.3,
    fileId: String(fileId || "").trim() || null,
    originalFilename: String(originalFilename || "").trim() || null,
    ...collectSupportDocSourceFacts(effectivePayload),
  };
}
