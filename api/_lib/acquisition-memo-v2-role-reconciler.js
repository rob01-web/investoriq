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
    category = "Existing Debt â€” Contextual";
  } else if (hasPurchaseAssumptionsEvidence) {
    canonicalRole = "purchase_assumptions";
    authorityBasis = parserPurchaseSignal ? "parser_semantic" : "purchase_assumptions_evidence";
    roleLabel = "Purchase Assumptions / Proposed Acquisition Financing Context";
    canonicalLabel = roleLabel;
    treatment = "Acquisition context received";
    use = "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.";
    category = "Acquisition Assumptions â€” Contextual";
  } else if (parserCurrentDebtSignal && !parserPurchaseSignal) {
    canonicalRole = "current_debt_context";
    authorityBasis = "parser_semantic";
    roleLabel = "Existing Debt Context / Current Mortgage / Debt Statement";
    canonicalLabel = roleLabel;
    treatment = "Debt support received / contextual";
    use = "Uploaded existing/current debt context only; not proposed acquisition financing.";
    category = "Existing Debt â€” Contextual";
  } else if (parserPurchaseSignal && !parserCurrentDebtSignal) {
    canonicalRole = "purchase_assumptions";
    authorityBasis = "parser_semantic";
    roleLabel = "Purchase Assumptions / Proposed Acquisition Financing Context";
    canonicalLabel = roleLabel;
    treatment = "Acquisition context received";
    use = "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.";
    category = "Acquisition Assumptions â€” Contextual";
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
