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
  const text = collectTextParts(source, artifacts);
  const parserSemanticDocRole = toText(
    acceptedTruth?.semanticDocRole ||
      source?.semantic_doc_role ||
      source?.payload?.semantic_doc_role ||
      source?.parser_role ||
      source?.payload?.parser_role
  );
  const parserDebtBasis = toText(
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
  const hasCurrentDebtEvidence = hasCurrentDebtEvidenceInSource(source, text);
  const hasPurchaseAssumptionsEvidence = hasPurchaseAssumptionsEvidenceInSource(source, text);
  const parserCurrentDebtSignal =
    parserSemanticDocRole === "current_debt" ||
    parserSemanticDocRole === "current_debt_context" ||
    parserSemanticDocRole === "current_mortgage_statement" ||
    parserSemanticDocRole === "current_debt_terms" ||
    parserSemanticDocRole === "mortgage_statement" ||
    parserDebtBasis === "current_debt" ||
    parserDebtBasis === "current_debt_context" ||
    /current debt|current mortgage|debt statement/i.test(parserDisplayLabel);
  const parserPurchaseSignal =
    parserSemanticDocRole === "purchase_assumptions" ||
    parserSemanticDocRole === "loan_term_sheet" ||
    parserDebtBasis === "acquisition_financing_assumption" ||
    parserDebtBasis === "proposed_acquisition" ||
    /purchase assumptions|proposed acquisition financing/i.test(parserDisplayLabel);
  const currentDebtScore =
    (hasCurrentDebtEvidence ? 8 : 0) +
    (firstFinite(source?.outstanding_balance, source?.current_outstanding_balance, source?.current_loan_balance) != null ? 3 : 0) +
    (firstFinite(source?.interest_rate) != null ? 2 : 0) +
    (firstFinite(source?.amortization_remaining_years, source?.amortization_years, source?.amort_years) != null ? 2 : 0) +
    (String(source?.maturity_date || "").trim().length > 0 ? 2 : 0) +
    (String(source?.monthly_payment || "").trim().length > 0 ? 1 : 0) +
    (parserCurrentDebtSignal ? 1 : 0);
  const purchaseScore =
    (hasPurchaseAssumptionsEvidence ? 8 : 0) +
    (firstFinite(source?.purchase_price, source?.acquisition_price, source?.asking_price, source?.purchase_price_amount) != null ? 3 : 0) +
    (firstFinite(source?.noi_basis, source?.net_operating_income_basis, source?.going_in_cap_rate) != null ? 2 : 0) +
    (firstFinite(source?.derived_acquisition_loan_amount, source?.stated_acquisition_loan_amount, source?.loan_amount, source?.proposed_loan_amount) != null ? 2 : 0) +
    (firstFinite(source?.ltv, source?.interest_rate, source?.amortization_years, source?.amort_years, source?.lender_fee_percent, source?.closing_costs_percent, source?.financing_fee_percent, source?.origination_fee_percent) != null ? 2 : 0) +
    (parserPurchaseSignal ? 1 : 0);

  const currentDebtFacts = {
    current_outstanding_balance: firstFinite(source?.outstanding_balance, source?.current_outstanding_balance, source?.current_loan_balance),
    interest_rate: firstFinite(source?.interest_rate),
    amortization_remaining_years: firstFinite(source?.amortization_remaining_years, source?.amortization_years, source?.amort_years),
    monthly_payment: firstFinite(source?.monthly_payment),
    maturity_date: String(source?.maturity_date || "").trim() || null,
  };
  const purchaseFacts = {
    purchase_price: firstFinite(source?.purchase_price, source?.acquisition_price, source?.asking_price, source?.purchase_price_amount),
    noi_basis: firstFinite(source?.noi_basis, source?.net_operating_income_basis),
    going_in_cap_rate: firstFinite(source?.going_in_cap_rate),
    derived_acquisition_loan_amount: firstFinite(source?.derived_acquisition_loan_amount, source?.stated_acquisition_loan_amount, source?.loan_amount, source?.proposed_loan_amount),
    ltv: firstFinite(source?.ltv),
    interest_rate: firstFinite(source?.interest_rate),
    amortization_years: firstFinite(source?.amortization_years, source?.amort_years),
    lender_fee_percent: firstFinite(source?.lender_fee_percent, source?.closing_costs_percent, source?.financing_fee_percent, source?.origination_fee_percent),
  };

  let canonicalRole = null;
  let authorityBasis = "evidence_only";
  let roleLabel = String(parserDisplayLabel || "").trim();
  let canonicalLabel = roleLabel || "Other Support Document";
  let treatment = "Context only";
  let use = "Listed for auditability only; not used quantitatively.";
  let category = "Listed but Not Quantitatively Modeled";

  if (hasCurrentDebtEvidence && currentDebtScore >= purchaseScore) {
    canonicalRole = "current_debt_context";
    authorityBasis = parserCurrentDebtSignal ? "parser_semantic" : "current_debt_evidence";
    roleLabel = "Existing Debt Context / Current Mortgage / Debt Statement";
    canonicalLabel = roleLabel;
    treatment = "Debt support received / contextual";
    use = "Uploaded existing/current debt context only; not proposed acquisition financing.";
    category = "Existing Debt - Contextual";
  } else if (hasPurchaseAssumptionsEvidence) {
    canonicalRole = "purchase_assumptions";
    authorityBasis = parserPurchaseSignal ? "parser_semantic" : "purchase_assumptions_evidence";
    roleLabel = "Purchase Assumptions / Proposed Acquisition Financing Context";
    canonicalLabel = roleLabel;
    treatment = "Acquisition context received";
    use = "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.";
    category = "Acquisition Assumptions - Contextual";
  } else if (parserCurrentDebtSignal && !parserPurchaseSignal) {
    canonicalRole = "current_debt_context";
    authorityBasis = "parser_semantic";
    roleLabel = "Existing Debt Context / Current Mortgage / Debt Statement";
    canonicalLabel = roleLabel;
    treatment = "Debt support received / contextual";
    use = "Uploaded existing/current debt context only; not proposed acquisition financing.";
    category = "Existing Debt - Contextual";
  } else if (parserPurchaseSignal && !parserCurrentDebtSignal) {
    canonicalRole = "purchase_assumptions";
    authorityBasis = "parser_semantic";
    roleLabel = "Purchase Assumptions / Proposed Acquisition Financing Context";
    canonicalLabel = roleLabel;
    treatment = "Acquisition context received";
    use = "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.";
    category = "Acquisition Assumptions - Contextual";
  }

  const acceptedSemanticDocRole = canonicalRole || parserSemanticDocRole || null;
  const acceptedDebtBasis = canonicalRole === "current_debt_context"
    ? "current_debt_context"
    : canonicalRole === "purchase_assumptions"
      ? "acquisition_financing_assumption"
      : parserDebtBasis || null;
  const acceptedSemanticDocDisplayLabel = canonicalRole
    ? canonicalLabel
    : parserDisplayLabel || null;

  return {
    canonicalRole,
    canonicalLabel,
    roleLabel,
    treatment,
    use,
    category,
    authorityBasis,
    parserSemanticDocRole: parserSemanticDocRole || null,
    parserDebtBasis: parserDebtBasis || null,
    parserDisplayLabel: parserDisplayLabel || null,
    acceptedSemanticDocRole,
    acceptedDebtBasis,
    acceptedSemanticDocDisplayLabel,
    acceptedSourceTruth: {
      hasPurchaseAssumptions: canonicalRole === "purchase_assumptions",
      hasCurrentDebt: canonicalRole === "current_debt_context",
    },
    evidence: {
      currentDebtScore,
      purchaseScore,
      hasCurrentDebtEvidence,
      hasPurchaseAssumptionsEvidence,
      currentDebtFacts,
      purchaseFacts,
    },
  };
}

function normalizeIdentityToken(value) {
  const token = String(value ?? "").trim().toLowerCase();
  return token.length > 0 ? token : "";
}

function collectRowText(row = {}, artifacts = []) {
  const parts = [];
  const push = (value) => {
    const text = String(value ?? "").trim();
    if (text) parts.push(text);
  };
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

function scoreAcquisitionMemoV2SupportDoc(row = {}, text = "") {
  const normalizedText = String(text || "").toLowerCase();
  const explicitRole = normalizeIdentityToken(row?.semantic_doc_role || row?.payload?.semantic_doc_role);
  const debtBasis = normalizeIdentityToken(row?.debt_basis || row?.payload?.debt_basis);
  const purchaseSignals =
    explicitRole === "purchase_assumptions" ||
    explicitRole === "loan_term_sheet" ||
    debtBasis === "acquisition_financing_assumption" ||
    /(purchase assumptions|proposed acquisition financing|purchase price|going[-\s]*in cap|noi basis|ltv|lender fee|financing fee|origination fee)/i.test(normalizedText);
  const currentDebtSignals =
    explicitRole === "current_debt_context" ||
    explicitRole === "current_mortgage_statement" ||
    debtBasis === "current_debt_context" ||
    /(current debt|current mortgage|debt statement|outstanding principal|current outstanding balance|monthly payment|maturity date|amortization remaining|current loan balance)/i.test(normalizedText);
  const renovationSignals =
    /(renovation|capex|capital expenditure|capital budget|construction budget|scope of work|rent lift|phasing)/i.test(normalizedText);
  const propertyTaxSignals =
    /(property tax|tax bill|tax notice|municipal tax)/i.test(normalizedText);
  const marketSurveySignals =
    /(market survey|rent survey|rent comp|rent comparable)/i.test(normalizedText);
  const environmentalSignals =
    /(phase\s*i|phase\s*1|esa|environment|environmental|site assessment)/i.test(normalizedText);
  const appraisalSignals =
    /(appraisal|appraised value|valuation report|opinion of value)/i.test(normalizedText);
  const evidenceBonus = (row?.validated === true ? 50 : 0) + (typeof row?.artifact_type === "string" && /_parsed$/i.test(String(row?.artifact_type)) ? 25 : 0);
  if (currentDebtSignals) return 2000 + evidenceBonus;
  if (purchaseSignals) return 1800 + evidenceBonus;
  if (renovationSignals) return 1600 + evidenceBonus;
  if (propertyTaxSignals) return 1400 + evidenceBonus;
  if (marketSurveySignals) return 1200 + evidenceBonus;
  if (environmentalSignals) return 1000 + evidenceBonus;
  if (appraisalSignals) return 800 + evidenceBonus;
  return 100 + evidenceBonus;
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

    return {
      ...row,
      canonical_support_doc_role: row?.canonical_support_doc_role || row?.semantic_doc_role || "other_support_context",
      semantic_doc_role: row?.semantic_doc_role || row?.canonical_support_doc_role || null,
      semantic_doc_display_label: canonicalLabel,
      document_role_label: canonicalLabel,
      treatment_label: treatmentLabel,
      use_label: useLabel,
      treatment_category: category,
      canonical_document_treatment_identity_key: getAcquisitionMemoV2SupportDocIdentityKey(row),
      authoritySource: roleMatch?.authorityBasis || "evidence_only",
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
