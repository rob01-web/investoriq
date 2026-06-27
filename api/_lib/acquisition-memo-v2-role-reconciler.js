function toText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff\ufffe\uffff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstFinite(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
}

function collectTextParts(source = {}, artifacts = []) {
  const parts = [];
  const push = (value) => {
    const text = String(value ?? "").trim();
    if (text) parts.push(text);
  };
  const sourceIdentityKey = getAcquisitionMemoV2SupportDocIdentityKey(source);

  push(source?.source_text);
  push(source?.raw_text);
  push(source?.notes);
  push(source?.loan_terms_text);
  push(source?.extracted_text);
  push(source?.document_text_extracted);
  push(source?.text);
  push(source?.excerpt);
  push(source?.source_original_filename);
  push(source?.original_filename);
  push(source?.file_name);
  push(source?.filename);
  push(source?.semantic_doc_role);
  push(source?.semantic_doc_display_label);
  push(source?.semantic_doc_role_reason);
  push(source?.debt_basis);

  for (const artifact of toArray(artifacts)) {
    if (!artifact || typeof artifact !== "object") continue;
    const artifactSource = artifact?.payload && typeof artifact.payload === "object" ? artifact.payload : artifact;
    const artifactIdentityKey = getAcquisitionMemoV2SupportDocIdentityKey(artifactSource);
    if (!sourceIdentityKey || !artifactIdentityKey || artifactIdentityKey !== sourceIdentityKey) continue;
    push(artifact?.source_text);
    push(artifact?.raw_text);
    push(artifact?.notes);
    push(artifact?.loan_terms_text);
    push(artifact?.extracted_text);
    push(artifact?.document_text_extracted);
    push(artifact?.text);
    push(artifact?.excerpt);
    push(artifact?.source_original_filename);
    push(artifact?.original_filename);
    push(artifact?.file_name);
    push(artifact?.filename);
    push(artifact?.semantic_doc_role);
    push(artifact?.semantic_doc_display_label);
    push(artifact?.semantic_doc_role_reason);
    push(artifact?.debt_basis);
    push(artifact?.payload?.source_text);
    push(artifact?.payload?.raw_text);
    push(artifact?.payload?.notes);
    push(artifact?.payload?.loan_terms_text);
    push(artifact?.payload?.extracted_text);
    push(artifact?.payload?.document_text_extracted);
    push(artifact?.payload?.text);
    push(artifact?.payload?.excerpt);
    push(artifact?.payload?.source_original_filename);
    push(artifact?.payload?.original_filename);
    push(artifact?.payload?.file_name);
    push(artifact?.payload?.filename);
    push(artifact?.payload?.semantic_doc_role);
    push(artifact?.payload?.semantic_doc_display_label);
    push(artifact?.payload?.semantic_doc_role_reason);
    push(artifact?.payload?.debt_basis);
  }

  return parts.join("\n");
}

function findArtifactField(source = {}, artifacts = [], fieldNames = []) {
  for (const fieldName of toArray(fieldNames)) {
    const value =
      source?.[fieldName] ??
      source?.payload?.[fieldName] ??
      source?.parser?.[fieldName] ??
      null;
    if (value != null && String(value).trim().length > 0) return value;
  }
  for (const artifact of toArray(artifacts)) {
    if (!artifact || typeof artifact !== "object") continue;
    for (const fieldName of toArray(fieldNames)) {
      const value = artifact?.[fieldName] ?? artifact?.payload?.[fieldName] ?? null;
      if (value != null && String(value).trim().length > 0) return value;
    }
  }
  return null;
}

function hasCurrentDebtEvidenceInSource(source = {}, text = "") {
  const normalizedText = toText(text);
  const currentDebtSignals =
    /(existing current debt statement|current debt context|existing current debt|current debt terms|current mortgage|existing debt|current mortgage statement|current debt|debt statement)/i.test(normalizedText) &&
    /(current outstanding balance|outstanding principal|outstanding balance|principal balance|monthly payment|maturity date|amortization remaining|remaining years|current loan balance|mortgage balance|loan balance)/i.test(normalizedText);

  const currentDebtFieldsPresent =
    firstFinite(
      source?.outstanding_balance,
      source?.current_outstanding_balance,
      source?.current_loan_balance,
      source?.monthly_payment
    ) != null ||
    firstFinite(source?.interest_rate) != null ||
    firstFinite(source?.amortization_remaining_years, source?.amortization_years, source?.amort_years) != null ||
    String(source?.maturity_date || "").trim().length > 0;

  const currentDebtFilenameSignals = /current[_\s-]?debt|current[_\s-]?loan|current mortgage|debt statement|existing debt/i.test(
    String(source?.original_filename || source?.source_original_filename || source?.file_name || source?.filename || "")
  );

  return Boolean(currentDebtSignals || (currentDebtFieldsPresent && currentDebtFilenameSignals));
}

function hasPurchaseAssumptionsEvidenceInSource(source = {}, text = "") {
  const normalizedText = toText(text);
  const purchaseSignals =
    /(purchase assumptions|proposed acquisition financing|proposed acquisition loan|acquisition financing assumption|purchase price|going[-\s]*in cap|noi basis|ltv|lender fee|origination fee|financing fee)/i.test(normalizedText) &&
    /(purchase price|going[-\s]*in cap|noi basis|proposed acquisition loan|proposed loan amount|ltv|lender fee|interest rate|amortization)/i.test(normalizedText);

  const purchaseFieldsPresent =
    firstFinite(
      source?.purchase_price,
      source?.acquisition_price,
      source?.asking_price,
      source?.purchase_price_amount
    ) != null ||
    firstFinite(source?.noi_basis, source?.net_operating_income_basis) != null ||
    firstFinite(source?.going_in_cap_rate) != null ||
    firstFinite(source?.derived_acquisition_loan_amount, source?.stated_acquisition_loan_amount, source?.loan_amount, source?.proposed_loan_amount) != null ||
    firstFinite(source?.ltv) != null ||
    firstFinite(source?.interest_rate) != null ||
    firstFinite(source?.amortization_years, source?.amort_years) != null ||
    firstFinite(source?.lender_fee_percent, source?.closing_costs_percent, source?.financing_fee_percent, source?.origination_fee_percent) != null;

  const purchaseFilenameSignals = /assumption|purchase assumptions|proposed acquisition financing|loan term sheet|acquisition context/i.test(
    String(source?.original_filename || source?.source_original_filename || source?.file_name || source?.filename || "")
  );

  return Boolean(purchaseSignals || (purchaseFieldsPresent && purchaseFilenameSignals));
}

export function reconcileAcquisitionMemoV2SupportDocRole({
  file = null,
  artifacts = [],
  acceptedTruth = null,
} = {}) {
  const source = file && typeof file === "object" ? file : {};
  return buildAcquisitionMemoV2SupportDocRoleDecision({ source, artifacts, acceptedTruth });
}

function normalizeIdentityToken(value) {
  const token = String(value ?? "").trim().toLowerCase();
  return token.length > 0 ? token : "";
}

function normalizeAcquisitionMemoV2CanonicalRole(role = "") {
  const normalized = normalizeIdentityToken(role);
  if (
    normalized === "current_mortgage_statement" ||
    normalized === "current_debt_terms" ||
    normalized === "current_debt"
  ) {
    return "current_debt_context";
  }
  if (normalized === "purchase_assumptions" || normalized === "loan_term_sheet" || normalized === "proposed_acquisition_financing") {
    return "purchase_assumptions";
  }
  if (
    normalized === "structured_renovation" ||
    normalized === "structured_renovation_capex_plan" ||
    normalized === "renovation_budget" ||
    normalized === "renovation_capex_budget_context" ||
    normalized === "renovation_capex_context"
  ) {
    return "renovation_capex_context";
  }
  if (normalized === "environmental_due_diligence" || normalized === "environmental_due_diligence_context") {
    return "environmental_due_diligence_context";
  }
  if (normalized === "appraisal" || normalized === "appraisal_valuation_context") {
    return "appraisal_valuation_context";
  }
  if (normalized === "property_tax" || normalized === "property_tax_support") {
    return "property_tax_support";
  }
  if (normalized === "market_survey" || normalized === "market_survey_context") {
    return "market_survey_context";
  }
  if (normalized === "historical_capex_only") {
    return "historical_capex_only";
  }
  if (normalized === "core_t12" || normalized === "t12") {
    return "core_t12";
  }
  if (normalized === "core_rent_roll" || normalized === "rent_roll") {
    return "core_rent_roll";
  }
  if (normalized === "other_support" || normalized === "other_support_context") {
    return "other_support_context";
  }
  return normalized || "other_support_context";
}

function hasHistoricalOnlyRenovationSignalsLocal(text = "", source = {}) {
  const normalizedText = String(text || "").toLowerCase();
  const sourceText = String([
    source?.source_text,
    source?.raw_text,
    source?.notes,
    source?.semantic_doc_role_reason,
    source?.semantic_doc_display_label,
    source?.timing_or_phasing,
    source?.budget_note,
    source?.execution_note,
  ].filter(Boolean).join(" ")).toLowerCase();
  return Boolean(
    /(historical capex|historical capital|past repairs?|prior work|completed work|historical only|historical-only)/i.test(normalizedText) ||
      /(historical capex|historical capital|past repairs?|prior work|completed work|historical only|historical-only)/i.test(sourceText) ||
      /(no forward-looking budget|no rent lift|no roi|no payback|no implementation schedule)/i.test(normalizedText) ||
      /(no forward-looking budget|no rent lift|no roi|no payback|no implementation schedule)/i.test(sourceText) ||
      /historical/.test(String(source?.timing_or_phasing || "").toLowerCase())
  );
}

function hasRenovationEvidenceLocal(text = "", source = {}) {
  const normalizedText = String(text || "").toLowerCase();
  return Boolean(
    /(renovation|capex|capital expenditure|capital budget|construction budget|scope of work|rent lift|phasing)/i.test(normalizedText) ||
      Array.isArray(source?.budget_rows) && source.budget_rows.length > 0 ||
      Array.isArray(source?.execution_rows) && source.execution_rows.length > 0 ||
      firstFinite(source?.total_budget, source?.total_capex, source?.renovation_budget) != null
  );
}

function collectRowText(row = {}, artifacts = []) {
  const parts = [];
  const push = (value) => {
    const text = String(value ?? "").trim();
    if (text) parts.push(text);
  };
  const rowIdentityKey = getAcquisitionMemoV2SupportDocIdentityKey(row);
  push(row?.source_text);
  push(row?.raw_text);
  push(row?.notes);
  push(row?.loan_terms_text);
  push(row?.extracted_text);
  push(row?.document_text_extracted);
  push(row?.text);
  push(row?.excerpt);
  push(row?.source_original_filename);
  push(row?.original_filename);
  push(row?.file_name);
  push(row?.filename);
  push(row?.semantic_doc_role);
  push(row?.semantic_doc_display_label);
  push(row?.semantic_doc_role_reason);
  push(row?.debt_basis);
  for (const artifact of Array.isArray(artifacts) ? artifacts : []) {
    if (!artifact || typeof artifact !== "object") continue;
    const artifactSource = artifact?.payload && typeof artifact.payload === "object" ? artifact.payload : artifact;
    const artifactIdentityKey = getAcquisitionMemoV2SupportDocIdentityKey(artifactSource);
    if (!rowIdentityKey || !artifactIdentityKey || artifactIdentityKey !== rowIdentityKey) continue;
    push(artifact?.source_text);
    push(artifact?.raw_text);
    push(artifact?.notes);
    push(artifact?.loan_terms_text);
    push(artifact?.extracted_text);
    push(artifact?.document_text_extracted);
    push(artifact?.text);
    push(artifact?.excerpt);
    push(artifact?.source_original_filename);
    push(artifact?.original_filename);
    push(artifact?.file_name);
    push(artifact?.filename);
    push(artifact?.semantic_doc_role);
    push(artifact?.semantic_doc_display_label);
    push(artifact?.semantic_doc_role_reason);
    push(artifact?.debt_basis);
    push(artifact?.payload?.source_text);
    push(artifact?.payload?.raw_text);
    push(artifact?.payload?.notes);
    push(artifact?.payload?.loan_terms_text);
    push(artifact?.payload?.extracted_text);
    push(artifact?.payload?.document_text_extracted);
    push(artifact?.payload?.text);
    push(artifact?.payload?.excerpt);
    push(artifact?.payload?.source_original_filename);
    push(artifact?.payload?.original_filename);
    push(artifact?.payload?.file_name);
    push(artifact?.payload?.filename);
    push(artifact?.payload?.semantic_doc_role);
    push(artifact?.payload?.semantic_doc_display_label);
    push(artifact?.payload?.semantic_doc_role_reason);
    push(artifact?.payload?.debt_basis);
  }
  return parts.join("\n");
}

function getAcquisitionMemoV2SupportDocIdentityKey(row = {}) {
  const filename = normalizeIdentityToken(row?.original_filename || row?.source_original_filename || row?.file_name || row?.filename);
  if (filename) return `filename:${filename}`;
  const id = [
    row?.source_file_id,
    row?.file_id,
    row?.document_id,
    row?.artifact_file_id,
    row?.id,
  ].map(normalizeIdentityToken).find(Boolean);
  return id ? `id:${id}` : "";
}

function buildAcquisitionMemoV2SupportDocRoleDecision({
  source = {},
  artifacts = [],
  acceptedTruth = null,
} = {}) {
  const text = collectTextParts(source, artifacts);
  const normalizedText = String(text || "").toLowerCase();
  const parserSemanticDocRole = normalizeIdentityToken(
    acceptedTruth?.semanticDocRole ||
      source?.semantic_doc_role ||
      source?.payload?.semantic_doc_role ||
      source?.parser_role ||
      source?.payload?.parser_role
  );
  const parserDebtBasis = normalizeIdentityToken(
    acceptedTruth?.debtBasis ||
      source?.debt_basis ||
      source?.payload?.debt_basis ||
      source?.parser_debt_basis
  );
  const parserDisplayLabel = String(
    acceptedTruth?.semanticDocDisplayLabel ||
      source?.semantic_doc_display_label ||
      source?.payload?.semantic_doc_display_label ||
      source?.document_role_label ||
      source?.payload?.document_role_label ||
      ""
  ).trim();
  const parserRole = normalizeAcquisitionMemoV2CanonicalRole(parserSemanticDocRole || parserDebtBasis || parserDisplayLabel);
  const hasCurrentDebtEvidence = hasCurrentDebtEvidenceInSource(source, text);
  const hasPurchaseAssumptionsEvidence = hasPurchaseAssumptionsEvidenceInSource(source, text);
  const hasHistoricalOnlyRenovation = hasHistoricalOnlyRenovationSignalsLocal(normalizedText, source);
  const hasRenovationEvidence = hasRenovationEvidenceLocal(normalizedText, source);
  const hasEnvironmentalEvidence = Boolean(/(phase\s*i|phase\s*1|esa|environment|environmental|site assessment)/i.test(normalizedText));
  const hasAppraisalEvidence = Boolean(
    /(appraisal|appraised value|valuation report|opinion of value|valuation context)/i.test(normalizedText) ||
      firstFinite(source?.appraised_value, source?.valuation_value) != null
  );
  const hasPropertyTaxEvidence = Boolean(
    /(property tax|tax bill|tax notice|municipal tax|assessment roll|annual taxes|realty tax|real estate taxes)/i.test(normalizedText) ||
      firstFinite(source?.annual_tax, source?.tax_amount, source?.property_tax_amount) != null
  );
  const hasMarketSurveyEvidence = Boolean(/(market survey|rent survey|rent comp|rent comparable)/i.test(normalizedText));
  const hasCoreT12Evidence = Boolean(
    /(t12|trailing 12|trailing twelve)/i.test(normalizedText) ||
      firstFinite(source?.gross_potential_rent, source?.effective_gross_income, source?.total_operating_expenses, source?.net_operating_income, source?.gross_scheduled_rent) != null
  );
  const hasCoreRentRollEvidence = Boolean(
    /(rent roll|rentroll)/i.test(normalizedText) ||
      firstFinite(source?.total_units, source?.occupied_units, source?.in_place_rent_annual, source?.market_rent_annual) != null ||
      Array.isArray(source?.unit_mix) && source.unit_mix.length > 0 ||
      Array.isArray(source?.units) && source.units.length > 0
  );

  const currentDebtFieldCount = [
    firstFinite(source?.outstanding_balance, source?.current_outstanding_balance, source?.current_loan_balance),
    firstFinite(source?.interest_rate),
    firstFinite(source?.amortization_remaining_years, source?.amortization_years, source?.amort_years),
    String(source?.maturity_date || "").trim() || null,
    firstFinite(source?.monthly_payment),
  ].filter(Boolean).length;
  const purchaseFieldCount = [
    firstFinite(source?.purchase_price, source?.acquisition_price, source?.asking_price, source?.purchase_price_amount),
    firstFinite(source?.noi_basis, source?.net_operating_income_basis),
    firstFinite(source?.going_in_cap_rate),
    firstFinite(source?.derived_acquisition_loan_amount, source?.stated_acquisition_loan_amount, source?.loan_amount, source?.proposed_loan_amount),
    firstFinite(source?.ltv),
    firstFinite(source?.interest_rate),
    firstFinite(source?.amortization_years, source?.amort_years),
    firstFinite(source?.lender_fee_percent, source?.closing_costs_percent, source?.financing_fee_percent, source?.origination_fee_percent),
  ].filter(Boolean).length;

  const roleCandidates = [
    {
      role: "current_debt_context",
      score: (hasCurrentDebtEvidence ? 200 : 0) + currentDebtFieldCount * 15 + (parserRole === "current_debt_context" ? 1 : 0),
      canonicalLabel: "Existing Debt Context / Current Mortgage / Debt Statement",
      treatment: "Debt support received / contextual",
      use: "Uploaded existing/current debt context only; not proposed acquisition financing.",
      category: "Existing Debt - Contextual",
      acceptedDebtBasis: "current_debt_context",
      authorityBasis: hasCurrentDebtEvidence ? "current_debt_evidence" : "parser_semantic",
      hasPositiveEvidence: hasCurrentDebtEvidence || currentDebtFieldCount > 0,
    },
    {
      role: "purchase_assumptions",
      score: (hasPurchaseAssumptionsEvidence ? 200 : 0) + purchaseFieldCount * 15 + (parserRole === "purchase_assumptions" ? 1 : 0),
      canonicalLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
      treatment: "Acquisition context received",
      use: "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.",
      category: "Acquisition Assumptions - Contextual",
      acceptedDebtBasis: "acquisition_financing_assumption",
      authorityBasis: hasPurchaseAssumptionsEvidence ? "purchase_assumptions_evidence" : "parser_semantic",
      hasPositiveEvidence: hasPurchaseAssumptionsEvidence || purchaseFieldCount > 0,
    },
    {
      role: "historical_capex_only",
      score: (hasHistoricalOnlyRenovation ? 180 : 0) + (parserRole === "historical_capex_only" ? 1 : 0),
      canonicalLabel: "Historical Capital Items",
      treatment: "Context only",
      use: "Historical capital items are displayed for context only.",
      category: "Displayed / Limited Use",
      acceptedDebtBasis: "historical_capex_only",
      authorityBasis: hasHistoricalOnlyRenovation ? "historical_capex_evidence" : "parser_semantic",
      hasPositiveEvidence: hasHistoricalOnlyRenovation,
    },
    {
      role: "renovation_capex_context",
      score: (hasRenovationEvidence && !hasHistoricalOnlyRenovation ? 150 : 0) + (parserRole === "renovation_capex_context" ? 1 : 0),
      canonicalLabel: "Renovation / CapEx Context",
      treatment: "Context only",
      use: "Document-stated renovation budget/scope is acknowledged for context only; it does not create ROI, payback, DSCR, refinance, DCF, waterfall, deal score, or final recommendation analysis.",
      category: "Displayed / Limited Use",
      acceptedDebtBasis: "renovation_capex_context",
      authorityBasis: hasRenovationEvidence ? "renovation_evidence" : "parser_semantic",
      hasPositiveEvidence: hasRenovationEvidence,
    },
    {
      role: "environmental_due_diligence_context",
      score: (hasEnvironmentalEvidence ? 150 : 0) + (parserRole === "environmental_due_diligence_context" ? 1 : 0),
      canonicalLabel: "Environmental Due Diligence Context",
      treatment: "Context only",
      use: "Environmental due-diligence context only; not used quantitatively.",
      category: "Listed but Not Quantitatively Modeled",
      acceptedDebtBasis: "environmental_due_diligence_context",
      authorityBasis: hasEnvironmentalEvidence ? "environmental_evidence" : "parser_semantic",
      hasPositiveEvidence: hasEnvironmentalEvidence,
    },
    {
      role: "appraisal_valuation_context",
      score: (hasAppraisalEvidence ? 140 : 0) + (parserRole === "appraisal_valuation_context" ? 1 : 0),
      canonicalLabel: "Appraisal Context",
      treatment: "Context only",
      use: "Appraisal context only unless structured appraised value is verified; does not override deterministic valuation.",
      category: "Listed but Not Quantitatively Modeled",
      acceptedDebtBasis: "appraisal_valuation_context",
      authorityBasis: hasAppraisalEvidence ? "appraisal_evidence" : "parser_semantic",
      hasPositiveEvidence: hasAppraisalEvidence,
    },
    {
      role: "property_tax_support",
      score: (hasPropertyTaxEvidence ? 130 : 0) + (parserRole === "property_tax_support" ? 1 : 0),
      canonicalLabel: "Property Tax Support",
      treatment: "Corroborating support",
      use: "Uploaded support document - not used quantitatively.",
      category: "Displayed / Limited Use",
      acceptedDebtBasis: "property_tax_support",
      authorityBasis: hasPropertyTaxEvidence ? "property_tax_evidence" : "parser_semantic",
      hasPositiveEvidence: hasPropertyTaxEvidence,
    },
    {
      role: "market_survey_context",
      score: (hasMarketSurveyEvidence ? 120 : 0) + (parserRole === "market_survey_context" ? 1 : 0),
      canonicalLabel: "Market Rent Context",
      treatment: "Context only",
      use: "Market/rent context only; does not override Rent Roll market rent.",
      category: "Listed but Not Quantitatively Modeled",
      acceptedDebtBasis: "market_survey_context",
      authorityBasis: hasMarketSurveyEvidence ? "market_survey_evidence" : "parser_semantic",
      hasPositiveEvidence: hasMarketSurveyEvidence,
    },
    {
      role: "core_t12",
      score: (hasCoreT12Evidence ? 220 : 0) + (parserRole === "core_t12" ? 1 : 0),
      canonicalLabel: "T12 Core Source",
      treatment: "Core quantitative source",
      use: "Verified T12 operating data used as modeled input.",
      category: "Modeled Inputs",
      acceptedDebtBasis: "core_t12",
      authorityBasis: hasCoreT12Evidence ? "core_t12_evidence" : "parser_semantic",
      hasPositiveEvidence: hasCoreT12Evidence,
    },
    {
      role: "core_rent_roll",
      score: (hasCoreRentRollEvidence ? 220 : 0) + (parserRole === "core_rent_roll" ? 1 : 0),
      canonicalLabel: "Rent Roll Core Source",
      treatment: "Core quantitative source",
      use: "Verified rent roll data used as modeled input.",
      category: "Modeled Inputs",
      acceptedDebtBasis: "core_rent_roll",
      authorityBasis: hasCoreRentRollEvidence ? "core_rent_roll_evidence" : "parser_semantic",
      hasPositiveEvidence: hasCoreRentRollEvidence,
    },
  ];

  roleCandidates.sort((left, right) => (right.hasPositiveEvidence === true ? 1 : 0) - (left.hasPositiveEvidence === true ? 1 : 0) || (right.score - left.score));
  const bestCandidate = roleCandidates.find((candidate) => candidate.hasPositiveEvidence === true) || null;

  if (!bestCandidate) {
    return {
      canonicalRole: "other_support_context",
      canonicalLabel: "Other Support Document",
      roleLabel: "Other Support Document",
      treatment: "Context only",
      use: "Listed for auditability only; not used quantitatively.",
      category: "Listed but Not Quantitatively Modeled",
      authorityBasis: "no_same_source_positive_evidence",
      parserSemanticDocRole: parserSemanticDocRole || null,
      parserDebtBasis: parserDebtBasis || null,
      parserDisplayLabel: parserDisplayLabel || null,
      acceptedSemanticDocRole: "other_support_context",
      acceptedDebtBasis: parserDebtBasis || null,
      acceptedSemanticDocDisplayLabel: "Other Support Document",
      acceptedSourceTruth: {
        hasPurchaseAssumptions: false,
        hasCurrentDebt: false,
      },
      evidence: {
        roleCandidates,
        hasCurrentDebtEvidence,
        hasPurchaseAssumptionsEvidence,
        hasHistoricalOnlyRenovation,
        hasRenovationEvidence,
        hasEnvironmentalEvidence,
        hasAppraisalEvidence,
        hasPropertyTaxEvidence,
        hasMarketSurveyEvidence,
        hasCoreT12Evidence,
        hasCoreRentRollEvidence,
      },
    };
  }

  return {
    canonicalRole: bestCandidate.role,
    canonicalLabel: bestCandidate.canonicalLabel,
    roleLabel: bestCandidate.canonicalLabel,
    treatment: bestCandidate.treatment,
    use: bestCandidate.use,
    category: bestCandidate.category,
    authorityBasis: bestCandidate.authorityBasis,
    parserSemanticDocRole: parserSemanticDocRole || null,
    parserDebtBasis: parserDebtBasis || null,
    parserDisplayLabel: parserDisplayLabel || null,
    acceptedSemanticDocRole: bestCandidate.role,
    acceptedDebtBasis: bestCandidate.acceptedDebtBasis || null,
    acceptedSemanticDocDisplayLabel: bestCandidate.canonicalLabel,
    acceptedSourceTruth: {
      hasPurchaseAssumptions: bestCandidate.role === "purchase_assumptions",
      hasCurrentDebt: bestCandidate.role === "current_debt_context",
      hasHistoricalCapex: bestCandidate.role === "historical_capex_only",
      hasRenovationCapex: bestCandidate.role === "renovation_capex_context",
      hasEnvironmentalDueDiligence: bestCandidate.role === "environmental_due_diligence_context",
      hasAppraisal: bestCandidate.role === "appraisal_valuation_context",
      hasPropertyTax: bestCandidate.role === "property_tax_support",
      hasMarketSurvey: bestCandidate.role === "market_survey_context",
      hasCoreT12: bestCandidate.role === "core_t12",
      hasCoreRentRoll: bestCandidate.role === "core_rent_roll",
    },
    evidence: {
      roleCandidates,
      hasCurrentDebtEvidence,
      hasPurchaseAssumptionsEvidence,
      hasHistoricalOnlyRenovation,
      hasRenovationEvidence,
      hasEnvironmentalEvidence,
      hasAppraisalEvidence,
      hasPropertyTaxEvidence,
      hasMarketSurveyEvidence,
      hasCoreT12Evidence,
      hasCoreRentRollEvidence,
    },
  };
}

function scoreAcquisitionMemoV2SupportDoc(row = {}, text = "") {
  const decision = buildAcquisitionMemoV2SupportDocRoleDecision({
    source: row,
    artifacts: [],
    acceptedTruth: row,
  });
  const canonicalRole = normalizeAcquisitionMemoV2CanonicalRole(decision?.canonicalRole);
  const candidate = Array.isArray(decision?.evidence?.roleCandidates)
    ? decision.evidence.roleCandidates.find((entry) => normalizeAcquisitionMemoV2CanonicalRole(entry?.role) === canonicalRole)
    : null;
  return Number(candidate?.score || 0);
}

export function canonicalizeAcquisitionMemoV2DocumentTreatmentSources(documentSources = []) {
  return buildAcquisitionMemoV2SupportDocAuthorityRows({
    documentSources,
  }).map((row) => ({
    ...row,
    canonical_document_treatment_identity_key: row?.canonical_document_treatment_identity_key || getAcquisitionMemoV2SupportDocIdentityKey(row),
  }));
}

export function buildAcquisitionMemoV2SupportDocAuthorityRows({
  documentSources = [],
  artifacts = [],
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  mortgagePayload = null,
  renovationPayload = null,
  propertyTaxPayload = null,
  appraisalPayload = null,
} = {}) {
  const rows = [
    ...(Array.isArray(documentSources) ? documentSources : []),
    ...(Array.isArray(artifacts) ? artifacts.map((artifact) => artifact?.payload || artifact).filter(Boolean) : []),
    loanTermSheetTermsPayload,
    acquisitionTermsPayload,
    mortgagePayload,
    renovationPayload,
    propertyTaxPayload,
    appraisalPayload,
  ].filter((row) => row && typeof row === "object");

  if (rows.length === 0) return [];

  const grouped = new Map();
  rows.forEach((row, index) => {
    const key = getAcquisitionMemoV2SupportDocIdentityKey(row) || `row:${index}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ row, index });
  });

  const pickCanonical = (row = {}) => {
    const text = collectRowText(row, artifacts);
    const roleMatch = reconcileAcquisitionMemoV2SupportDocRole({ file: row, artifacts, acceptedTruth: row });
    const explicitRole = normalizeIdentityToken(roleMatch?.acceptedSemanticDocRole || row?.semantic_doc_role || row?.payload?.semantic_doc_role);
    const canonicalRole = roleMatch?.canonicalRole || null;
    const canonicalLabel = roleMatch?.canonicalLabel || roleMatch?.acceptedSemanticDocDisplayLabel || row?.semantic_doc_display_label || row?.document_role_label || row?.roleLabel || "Other Support Document";
    const treatmentLabel = roleMatch?.treatment || row?.treatment_label || row?.treatment || "Context only";
    const useLabel = roleMatch?.use || row?.use_label || row?.use || "Listed for auditability only; not used quantitatively.";
    const category = roleMatch?.category || row?.treatment_category || "Listed but Not Quantitatively Modeled";
    const score = scoreAcquisitionMemoV2SupportDoc(row, text);

    if (canonicalRole === "purchase_assumptions" || explicitRole === "purchase_assumptions") {
      const purchasePrice = firstFinite(row?.purchase_price, row?.acquisition_price, row?.asking_price, row?.purchase_price_amount);
      const noiBasis = firstFinite(row?.noi_basis, row?.net_operating_income_basis);
      const goingInCapRate = firstFinite(row?.going_in_cap_rate);
      const proposedLoanAmount = firstFinite(row?.derived_acquisition_loan_amount, row?.stated_acquisition_loan_amount, row?.loan_amount, row?.proposed_loan_amount);
      const ltv = firstFinite(row?.ltv);
      const interestRate = firstFinite(row?.interest_rate);
      const amortYears = firstFinite(row?.amortization_years, row?.amort_years);
      const lenderFeePercent = firstFinite(row?.lender_fee_percent, row?.closing_costs_percent, row?.financing_fee_percent, row?.origination_fee_percent);
      return {
        ...row,
        canonical_support_doc_role: "purchase_assumptions",
        semantic_doc_role: "purchase_assumptions",
        semantic_doc_display_label: canonicalLabel || "Purchase Assumptions / Acquisition Context",
        document_role_label: canonicalLabel || "Purchase Assumptions / Acquisition Context",
        treatment_label: treatmentLabel || "Acquisition context / document-derived acquisition context",
        use_label: useLabel || "Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth.",
        treatment_category: category || "Displayed / Limited Use",
        has_acquisition_support: true,
        has_proposed_acquisition_financing: true,
        purchase_price: purchasePrice,
        acquisition_price: purchasePrice,
        asking_price: row?.asking_price ?? null,
        noi_basis: noiBasis,
        going_in_cap_rate: goingInCapRate,
        derived_acquisition_loan_amount: proposedLoanAmount,
        stated_acquisition_loan_amount: firstFinite(row?.stated_acquisition_loan_amount, row?.loan_amount, row?.proposed_loan_amount),
        loan_amount: firstFinite(row?.loan_amount, row?.proposed_loan_amount),
        ltv,
        interest_rate: interestRate,
        amortization_years: amortYears,
        amort_years: amortYears,
        lender_fee_percent: lenderFeePercent,
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "purchase_assumptions_evidence",
        score,
      };
    }

    if (canonicalRole === "current_debt_context" || explicitRole === "current_debt_context" || explicitRole === "current_mortgage_statement") {
      const outstandingBalance = firstFinite(row?.outstanding_balance, row?.current_outstanding_balance, row?.current_loan_balance);
      const interestRate = firstFinite(row?.interest_rate);
      const amortYears = firstFinite(row?.amortization_remaining_years, row?.amortization_years, row?.amort_years);
      const monthlyPayment = firstFinite(row?.monthly_payment);
      const ltv = firstFinite(row?.ltv);
      return {
        ...row,
        canonical_support_doc_role: "current_debt_context",
        semantic_doc_role: "current_debt_context",
        semantic_doc_display_label: canonicalLabel || "Debt Support Received / Contextual",
        document_role_label: canonicalLabel || "Debt Support Received / Contextual",
        treatment_label: treatmentLabel || "Debt support received / contextual",
        use_label: useLabel || "Uploaded existing/current debt context only; not proposed acquisition financing.",
        treatment_category: category || "Displayed / Limited Use",
        has_current_debt_context: true,
        current_debt_context: true,
        outstanding_balance: outstandingBalance,
        current_outstanding_balance: outstandingBalance,
        current_loan_balance: outstandingBalance,
        interest_rate: interestRate,
        amortization_years: amortYears,
        amort_years: amortYears,
        monthly_payment: monthlyPayment,
        ltv,
        debt_basis: "current_debt_context",
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "current_debt_evidence",
        score,
      };
    }

    if (canonicalRole === "historical_capex_only" || explicitRole === "historical_capex_only") {
      return {
        ...row,
        canonical_support_doc_role: "historical_capex_only",
        semantic_doc_role: "historical_capex_only",
        semantic_doc_display_label: canonicalLabel || "Historical Capital Items",
        document_role_label: canonicalLabel || "Historical Capital Items",
        treatment_label: treatmentLabel || "Context only",
        use_label: useLabel || "Historical capital items are displayed for context only.",
        treatment_category: category || "Displayed / Limited Use",
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "historical_capex_evidence",
        score,
      };
    }

    if (canonicalRole === "renovation_capex_context" || explicitRole === "renovation_capex_context" || explicitRole === "renovation_budget" || explicitRole === "structured_renovation" || explicitRole === "structured_renovation_capex_plan") {
      return {
        ...row,
        canonical_support_doc_role: "renovation_capex_context",
        semantic_doc_role: "renovation_capex_context",
        semantic_doc_display_label: canonicalLabel || "Renovation / CapEx Context",
        document_role_label: canonicalLabel || "Renovation / CapEx Context",
        treatment_label: treatmentLabel || "Context only",
        use_label: useLabel || "Document-stated renovation budget/scope is acknowledged for context only; it does not create ROI, payback, DSCR, refinance, DCF, waterfall, deal score, or final recommendation analysis.",
        treatment_category: category || "Displayed / Limited Use",
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "renovation_evidence",
        score,
      };
    }

    if (canonicalRole === "environmental_due_diligence_context" || explicitRole === "environmental_due_diligence_context" || explicitRole === "environmental_due_diligence") {
      return {
        ...row,
        canonical_support_doc_role: "environmental_due_diligence_context",
        semantic_doc_role: "environmental_due_diligence_context",
        semantic_doc_display_label: canonicalLabel || "Environmental Due Diligence Context",
        document_role_label: canonicalLabel || "Environmental Due Diligence Context",
        treatment_label: treatmentLabel || "Context only",
        use_label: useLabel || "Environmental due-diligence context only; not used quantitatively.",
        treatment_category: category || "Listed but Not Quantitatively Modeled",
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "environmental_evidence",
        score,
      };
    }

    if (canonicalRole === "appraisal_valuation_context" || explicitRole === "appraisal_valuation_context" || explicitRole === "appraisal") {
      return {
        ...row,
        canonical_support_doc_role: "appraisal_valuation_context",
        semantic_doc_role: "appraisal_valuation_context",
        semantic_doc_display_label: canonicalLabel || "Appraisal Context",
        document_role_label: canonicalLabel || "Appraisal Context",
        treatment_label: treatmentLabel || "Context only",
        use_label: useLabel || "Appraisal context only unless structured appraised value is verified; does not override deterministic valuation.",
        treatment_category: category || "Listed but Not Quantitatively Modeled",
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "appraisal_evidence",
        score,
      };
    }

    if (canonicalRole === "property_tax_support" || explicitRole === "property_tax_support" || explicitRole === "property_tax") {
      return {
        ...row,
        canonical_support_doc_role: "property_tax_support",
        semantic_doc_role: "property_tax_support",
        semantic_doc_display_label: canonicalLabel || "Property Tax Support",
        document_role_label: canonicalLabel || "Property Tax Support",
        treatment_label: treatmentLabel || "Corroborating support",
        use_label: useLabel || "Uploaded support document - not used quantitatively.",
        treatment_category: category || "Displayed / Limited Use",
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "property_tax_evidence",
        score,
      };
    }

    if (canonicalRole === "market_survey_context" || explicitRole === "market_survey_context" || explicitRole === "market_survey") {
      return {
        ...row,
        canonical_support_doc_role: "market_survey_context",
        semantic_doc_role: "market_survey_context",
        semantic_doc_display_label: canonicalLabel || "Market Rent Context",
        document_role_label: canonicalLabel || "Market Rent Context",
        treatment_label: treatmentLabel || "Context only",
        use_label: useLabel || "Market/rent context only; does not override Rent Roll market rent.",
        treatment_category: category || "Listed but Not Quantitatively Modeled",
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "market_survey_evidence",
        score,
      };
    }

    if (canonicalRole === "core_t12" || explicitRole === "core_t12" || explicitRole === "t12") {
      return {
        ...row,
        canonical_support_doc_role: "core_t12",
        semantic_doc_role: "core_t12",
        semantic_doc_display_label: canonicalLabel || "T12 Core Source",
        document_role_label: canonicalLabel || "T12 Core Source",
        treatment_label: treatmentLabel || "Core quantitative source",
        use_label: useLabel || "Verified T12 operating data used as modeled input.",
        treatment_category: category || "Modeled Inputs",
        has_core_t12: true,
        core_t12: true,
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "core_t12_evidence",
        score,
      };
    }

    if (canonicalRole === "core_rent_roll" || explicitRole === "core_rent_roll" || explicitRole === "rent_roll") {
      return {
        ...row,
        canonical_support_doc_role: "core_rent_roll",
        semantic_doc_role: "core_rent_roll",
        semantic_doc_display_label: canonicalLabel || "Rent Roll Core Source",
        document_role_label: canonicalLabel || "Rent Roll Core Source",
        treatment_label: treatmentLabel || "Core quantitative source",
        use_label: useLabel || "Verified rent roll data used as modeled input.",
        treatment_category: category || "Modeled Inputs",
        has_core_rent_roll: true,
        core_rent_roll: true,
        canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
        authoritySource: roleMatch?.authorityBasis || "core_rent_roll_evidence",
        score,
      };
    }

    return {
      ...row,
      canonical_support_doc_role: "other_support_context",
      semantic_doc_role: "other_support_context",
      semantic_doc_display_label: "Other Support Document",
      document_role_label: "Other Support Document",
      treatment_label: "Context only",
      use_label: "Listed for auditability only; not used quantitatively.",
      treatment_category: "Listed but Not Quantitatively Modeled",
      canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
      authoritySource: roleMatch?.authorityBasis || "no_same_source_positive_evidence",
      score,
    };
  };

  const authorityRows = [];
  for (const [key, entries] of grouped.entries()) {
    entries.sort((left, right) => scoreAcquisitionMemoV2SupportDoc(right.row, collectRowText(right.row, artifacts)) - scoreAcquisitionMemoV2SupportDoc(left.row, collectRowText(left.row, artifacts)) || left.index - right.index);
    const winner = entries[0]?.row || {};
    const canonical = pickCanonical(winner);
    authorityRows.push({
      ...canonical,
      original_filename: String(canonical?.original_filename || canonical?.source_original_filename || canonical?.file_name || canonical?.filename || "").trim(),
      canonical_support_doc_identity_key: key,
      canonical_document_treatment_identity_key: key,
      allowed_uses: [canonical?.use_label || "Listed for auditability only; not used quantitatively."],
      forbidden_uses: [
        "Does not override T12 or Rent Roll core truth.",
        "Does not open DSCR, refinance, DCF, waterfall, equity return, deal score, or final recommendation surfaces.",
      ],
    });
  }

  return authorityRows.filter((row) => String(row?.original_filename || "").trim().length > 0);
}
