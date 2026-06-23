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

const HARD_FATAL_FORBIDDEN_SURFACE_PATTERNS = Object.freeze([
  /\bfinal recommendation\b/i,
  /\bBUY\b/i,
  /\bSELL\b/i,
  /\bHOLD\b/i,
  /\blender commitment\b/i,
]);

const COLLAPSEABLE_FORBIDDEN_SURFACE_PATTERNS = Object.freeze([
  /\bDSCR\b/i,
  /\brefinance\b/i,
  /\brefi\b/i,
  /\bDCF\b/i,
  /\bwaterfall\b/i,
  /\bequity return\b/i,
  /\bdeal score\b/i,
  /\bloan approval\b/i,
]);

const COLLAPSEABLE_BOSS_VIOLATION_CODES = Object.freeze([
  "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT",
  "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
  "CAP_RATE_PER_UNIT_REQUIRED_WHEN_UNITS_EXIST",
  "NO_ZERO_CAP_RATE",
  "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED",
  "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED",
  "ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED",
  "T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT",
  "DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED",
  "UNSUPPORTED_RENOVATION_MODELING_SURFACE",
  "UNSUPPORTED_APPRAISAL_MARKET_SURVEY_QUANT_RELIANCE",
]);

const HARD_FATAL_BOSS_VIOLATION_CODES = Object.freeze([
  "CONTRACT_NOT_OBJECT",
  "CONTRACT_VERSION_MISMATCH",
  "CORE_GATE_MISSING",
  "CORE_GATE_BOOL_MISSING",
  "CORE_GATE_FATAL_REASONS_MISSING",
  "SOURCE_TRUTH_MISSING",
  "SOURCE_TRUTH_CORE_MISSING",
  "SOURCE_TRUTH_SUPPORT_DOCS_MISSING",
  "SECTION_STATUS_MISSING",
  "SECTION_STATUS_INVALID",
  "SECTION_SOURCE_BINDINGS_MISSING",
  "SECTION_REQUIRED_FACTS_MISSING",
  "SECTION_ASSERTION_CODE_MISSING",
  "FORBIDDEN_SURFACES_MISSING",
  "FORBIDDEN_SURFACES_INCOMPLETE",
  "RENDER_REQUIREMENTS_MISSING",
  "POST_RENDER_ASSERTIONS_MISSING",
]);

const GENERIC_COLLAPSE_TEXT =
  "This section was omitted because the uploaded support context did not provide display-ready detail. Core report outputs remain based on the uploaded T12 and Rent Roll.";

const ALLOWED_SECTION_STATUSES = new Set(["required", "optional", "required_if_source_present", "collapsed"]);

const REQUIRED_SECTION_ASSERTION_CODES = {
  acquisitionRequestContext: ["ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED"],
  operatingStatementTTMSummary: ["T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT"],
  unitMix: ["UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS", "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT"],
  capRateValueIndication: ["CAP_RATE_PER_UNIT_REQUIRED_WHEN_UNITS_EXIST", "NO_ZERO_CAP_RATE"],
  currentDebtContext: ["CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED"],
  proposedFinancingContext: ["PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"],
  documentTreatment: ["DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED"],
};

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

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeRegExpForHtmlText(value) {
  return String(value ?? "")
    .split("&")
    .map((part) => escapeRegExp(part))
    .join("(?:&amp;|&)");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cloneArray(value) {
  return Array.isArray(value) ? value.map((item) => normalizeBossContractFact(item)) : [];
}

function truthyObject(value) {
  return isPlainObject(value) ? value : null;
}

function toArrayLike(value) {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return Array.from(value.values());
  if (isPlainObject(value)) return Object.values(value);
  return [];
}

function uniqueKeyForSupportDoc(doc) {
  return [
    String(doc?.fileId || "").trim(),
    String(doc?.originalFilename || "").trim(),
    String(doc?.canonicalRole || doc?.role || "").trim(),
    String(doc?.sourceKind || "").trim(),
  ].join("|");
}

function normalizeSupportDocRecord(doc, sourceLabel = null) {
  const source = truthyObject(doc);
  if (!source) return null;
  return normalizeBossContractFact({
    fileId: source.fileId || source.file_id || source.id || null,
    originalFilename: source.originalFilename || source.original_filename || source.filename || null,
    canonicalRole: source.canonicalRole || source.role || source.semantic_doc_role || null,
    roleLabel: source.roleLabel || source.role_label || null,
    canonicalLabel: source.canonicalLabel || source.canonical_label || null,
    treatment: source.treatment || null,
    use: source.use || null,
    sourceKind: source.sourceKind || source.kind || sourceLabel || "support_doc",
    authorityBasis: source.authorityBasis || source.authority_basis || null,
    allowedUses: Array.isArray(source.allowedUses) ? source.allowedUses : Array.isArray(source.allowed_uses) ? source.allowed_uses : [],
    forbiddenUses: Array.isArray(source.forbiddenUses) ? source.forbiddenUses : Array.isArray(source.forbidden_uses) ? source.forbidden_uses : [],
    extractedFacts: normalizeBossContractFact(source.extractedFacts || source.extracted_facts || {}),
    sourceEvidence: normalizeBossContractFact(source.sourceEvidence || source.source_evidence || {}),
  });
}

function collectSupportDocs(canonicalSourcePackage, acquisitionMemoProjection) {
  const collected = [];
  const push = (doc, sourceLabel) => {
    const normalized = normalizeSupportDocRecord(doc, sourceLabel);
    if (normalized) collected.push(normalized);
  };

  for (const doc of toArrayLike(canonicalSourcePackage?.supportDocs)) {
    push(doc, "canonical_source_package");
  }

  const supportDocProjection = acquisitionMemoProjection?.supportDocProjection;
  if (supportDocProjection) {
    for (const doc of toArrayLike(supportDocProjection.allSupportDocs)) {
      push(doc, "acquisition_memo_projection");
    }
    for (const doc of toArrayLike(supportDocProjection.otherSupportDocs)) {
      push(doc, "acquisition_memo_projection");
    }
    for (const doc of toArrayLike(supportDocProjection.purchaseAssumptions)) {
      push(doc, "acquisition_memo_projection");
    }
    for (const doc of toArrayLike(supportDocProjection.currentDebtContext)) {
      push(doc, "acquisition_memo_projection");
    }
    for (const doc of toArrayLike(supportDocProjection.structuredRenovation)) {
      push(doc, "acquisition_memo_projection");
    }
    for (const doc of toArrayLike(supportDocProjection.appraisalContext)) {
      push(doc, "acquisition_memo_projection");
    }
    for (const doc of toArrayLike(supportDocProjection.marketSurveyContext)) {
      push(doc, "acquisition_memo_projection");
    }
    for (const doc of toArrayLike(supportDocProjection.environmentalContext)) {
      push(doc, "acquisition_memo_projection");
    }
  }

  const rows = [];
  const seen = new Set();
  for (const doc of collected) {
    const key = uniqueKeyForSupportDoc(doc);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(doc);
  }
  return rows;
}

function getSupportDocEvidenceText(doc) {
  if (!isPlainObject(doc)) return "";
  return String(
    doc?.sourceEvidence?.textSnippet ||
      doc?.sourceEvidence?.text ||
      doc?.source_text ||
      doc?.text ||
      doc?.document_text_extracted ||
      doc?.payload?.document_text_extracted ||
      doc?.payload?.text ||
      ""
  ).trim();
}

function findSupportDocByRole(supportDocs, role) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) return null;
  return (Array.isArray(supportDocs) ? supportDocs : []).find((doc) => String(doc?.canonicalRole || doc?.role || "").trim().toLowerCase() === normalizedRole) || null;
}

function extractMoneyFromText(text, patterns = []) {
  const source = String(text || "");
  for (const pattern of Array.isArray(patterns) ? patterns : []) {
    const match = source.match(pattern);
    if (!match) continue;
    const value = Number(String(match[1] || "").replace(/,/g, ""));
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function extractPercentFractionFromText(text, patterns = []) {
  const source = String(text || "");
  for (const pattern of Array.isArray(patterns) ? patterns : []) {
    const match = source.match(pattern);
    if (!match) continue;
    const rawValue = Number(String(match[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(rawValue)) continue;
    if (rawValue > 1) return rawValue / 100;
    return rawValue;
  }
  return null;
}

function extractYearsFromText(text, patterns = []) {
  const source = String(text || "");
  for (const pattern of Array.isArray(patterns) ? patterns : []) {
    const match = source.match(pattern);
    if (!match) continue;
    const value = Number(String(match[1] || "").replace(/,/g, ""));
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function extractDateFromText(text, patterns = []) {
  const source = String(text || "");
  for (const pattern of Array.isArray(patterns) ? patterns : []) {
    const match = source.match(pattern);
    if (!match) continue;
    const value = String(match[1] || "").trim();
    if (value) return value;
  }
  return null;
}

function normalizeT12ExpenseLine(line) {
  if (!isPlainObject(line)) return null;
  const label = String(line.label || line.line_label || line.lineLabel || line.name || line.description || "").trim();
  const amount = Number(line.amount ?? line.value ?? line.total ?? line.expense ?? NaN);
  if (!label || !Number.isFinite(amount)) return null;
  return { label, amount };
}

function parseT12LineItemsFromText(text) {
  const lines = String(text || "")
    .split(/\r?\n+/)
    .map((line) => String(line || "").trim())
    .filter(Boolean);
  const items = [];
  for (const line of lines) {
    const match = line.match(/^(.+?)\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)$/);
    if (!match) continue;
    const label = String(match[1] || "").trim();
    const amount = Number(String(match[2] || "").replace(/,/g, ""));
    if (label && Number.isFinite(amount)) {
      items.push({ label, amount });
    }
  }
  return items;
}

function supplementPurchaseFactsFromEvidence(baseFacts, supportDoc) {
  const facts = normalizeBossContractFact(baseFacts || {});
  const text = getSupportDocEvidenceText(supportDoc);
  if (!text) return facts;
  const purchasePrice = extractMoneyFromText(text, [
    /\bpurchase price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bproposed acquisition price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
  ]);
  const noiBasis = extractMoneyFromText(text, [
    /\bnoi basis[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bnoi[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
  ]);
  const goingInCapRate = extractPercentFractionFromText(text, [
    /\bgoing[-\s]*cap(?: rate| reference)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bgoing[-\s]*in cap(?: rate| reference)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bcap rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
  ]);
  const proposedLoanAmount = extractMoneyFromText(text, [
    /\bproposed loan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bproposed acquisition loan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bloan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bloan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
  ]);
  const ltv = extractPercentFractionFromText(text, [
    /\bltv[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bloanto[-\s]*value[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
  ]);
  const interestRate = extractPercentFractionFromText(text, [
    /\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\brate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
  ]);
  const amortizationYears = extractYearsFromText(text, [
    /\bamortization(?: years?| remaining years?)?[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    /\bamort(?: years?)?[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
  ]);
  const lenderFeePercent = extractPercentFractionFromText(text, [
    /\blender fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bfinancing fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\borigination fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bfee[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
  ]);
  if (facts.purchase_price == null && purchasePrice != null) facts.purchase_price = purchasePrice;
  if (facts.noi_basis == null && noiBasis != null) facts.noi_basis = noiBasis;
  if (facts.going_in_cap_rate == null && goingInCapRate != null) facts.going_in_cap_rate = goingInCapRate;
  if (facts.proposed_loan_amount == null && proposedLoanAmount != null) facts.proposed_loan_amount = proposedLoanAmount;
  if (facts.loan_amount == null && proposedLoanAmount != null) facts.loan_amount = proposedLoanAmount;
  if (facts.ltv == null && ltv != null) facts.ltv = ltv;
  if (facts.interest_rate == null && interestRate != null) facts.interest_rate = interestRate;
  if (facts.amortization_years == null && amortizationYears != null) facts.amortization_years = amortizationYears;
  if (facts.lender_fee_percent == null && lenderFeePercent != null) facts.lender_fee_percent = lenderFeePercent;
  if (facts.has_proposed_acquisition_financing == null) facts.has_proposed_acquisition_financing = true;
  return facts;
}

function hasCurrentDebtEvidence(text) {
  const source = String(text || "");
  return Boolean(source) && (
    /(existing current debt statement|current debt context|current debt terms|current mortgage|existing mortgage|current outstanding balance|current debt balance|outstanding balance|principal balance|monthly payment|maturity date|amortization remaining|amortization remaining years)/i.test(source) ||
    /(current outstanding balance|interest rate|amortization remaining|monthly payment|maturity date)/i.test(source)
  );
}

function promoteCurrentDebtSupportDoc(doc) {
  if (!isPlainObject(doc)) return null;
  const evidenceText = getSupportDocEvidenceText(doc);
  if (!hasCurrentDebtEvidence(evidenceText) && !hasStructuredValues(doc?.extractedFacts?.current_outstanding_balance) && !hasStructuredValues(doc?.extractedFacts?.monthly_payment)) {
    return null;
  }
  return normalizeBossContractFact({
    ...doc,
    canonicalRole: "current_debt_context",
    role: "current_debt_context",
    canonicalLabel: "Existing Debt Context — Current Mortgage / Debt Statement",
    roleLabel: "Existing Debt Context — Current Mortgage / Debt Statement",
    treatment: "Debt support received / contextual",
    use: "Uploaded existing/current debt context only; not proposed acquisition financing.",
    category: "Existing Debt — Contextual",
    sourceKind: doc?.sourceKind || "support_doc",
    allowedUses: ["current_debt_context"],
    forbiddenUses: ["purchase_assumptions", "proposed_acquisition_financing_context"],
  });
}

function supplementCurrentDebtFactsFromEvidence(baseFacts, supportDoc) {
  const facts = normalizeBossContractFact(baseFacts || {});
  const text = getSupportDocEvidenceText(supportDoc);
  if (!text) return facts;
  const outstandingBalance = extractMoneyFromText(text, [
    /\bcurrent outstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bcurrent debt balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\boutstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bprincipal balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bbalance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
  ]);
  const interestRate = extractPercentFractionFromText(text, [
    /\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bnote rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bcoupon rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
  ]);
  const amortizationYears = extractYearsFromText(text, [
    /\bamortization remaining[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    /\bamortization remaining years[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    /\bamortization[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
  ]);
  const monthlyPayment = extractMoneyFromText(text, [
    /\bmonthly payment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bmonthly debt service[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /\bpayment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
  ]);
  const maturityDate = extractDateFromText(text, [
    /\bmaturity date[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    /\bmatures?[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  ]);
  if (facts.current_outstanding_balance == null && outstandingBalance != null) facts.current_outstanding_balance = outstandingBalance;
  if (facts.outstanding_balance == null && outstandingBalance != null) facts.outstanding_balance = outstandingBalance;
  if (facts.interest_rate == null && interestRate != null) facts.interest_rate = interestRate;
  if (facts.amortization_remaining_years == null && amortizationYears != null) facts.amortization_remaining_years = amortizationYears;
  if (facts.amortization_years == null && amortizationYears != null) facts.amortization_years = amortizationYears;
  if (facts.monthly_payment == null && monthlyPayment != null) facts.monthly_payment = monthlyPayment;
  if (facts.maturity_date == null && maturityDate != null) facts.maturity_date = maturityDate;
  if (facts.has_current_debt_context == null) facts.has_current_debt_context = true;
  return facts;
}

function supplementT12FactsFromEvidence(baseFacts, supportDoc) {
  const facts = normalizeBossContractFact(baseFacts || {});
  const text = getSupportDocEvidenceText(supportDoc);
  if (!text) return facts;
  const parsedLineItems = parseT12LineItemsFromText(text);
  if (!Array.isArray(facts.income_lines) || facts.income_lines.length === 0) {
    const incomeLines = parsedLineItems.filter((item) => /effective gross income|gross potential rent|noi|net operating income/i.test(item.label));
    if (incomeLines.length > 0) facts.income_lines = incomeLines.map((item) => ({ label: item.label, amount: item.amount }));
  }
  if (!Array.isArray(facts.expense_lines) || facts.expense_lines.length === 0) {
    const expenseLines = parsedLineItems.filter((item) => !/effective gross income|gross potential rent|noi|net operating income/i.test(item.label));
    if (expenseLines.length > 0) facts.expense_lines = expenseLines.map((item) => ({ label: item.label, amount: item.amount }));
  }
  if (facts.effective_gross_income == null) {
    const egi = extractMoneyFromText(text, [
      /\beffective gross income[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\begi[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (egi != null) facts.effective_gross_income = egi;
  }
  if (facts.total_operating_expenses == null) {
    const opEx = extractMoneyFromText(text, [
      /\btotal operating expenses[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\boperating expenses[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\btotal op(?:erating)? ex(?:penses?)?[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (opEx != null) facts.total_operating_expenses = opEx;
  }
  if (facts.net_operating_income == null) {
    const noi = extractMoneyFromText(text, [
      /\bnet operating income[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bnoi[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (noi != null) facts.net_operating_income = noi;
  }
  if (facts.gross_potential_rent == null) {
    const gpr = extractMoneyFromText(text, [
      /\bgross potential rent[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (gpr != null) facts.gross_potential_rent = gpr;
  }
  return facts;
}

function supplementT12FactsFromPayload(baseFacts, t12Payload) {
  const facts = normalizeBossContractFact(baseFacts || {});
  const payload = isPlainObject(t12Payload) ? t12Payload : null;
  if (!payload) return facts;
  const structuredPayload = isPlainObject(payload.t12_parsed) ? payload.t12_parsed : payload;
  const incomeLines = Array.isArray(structuredPayload.income_lines) ? structuredPayload.income_lines : [];
  const expenseLines = Array.isArray(structuredPayload.expense_lines) ? structuredPayload.expense_lines : [];
  if (!Array.isArray(facts.income_lines) || facts.income_lines.length === 0) {
    const normalizedIncome = incomeLines.map((item) => normalizeBossContractFact(item)).filter((item) => isPlainObject(item) && String(item.label || item.line_label || item.lineLabel || item.name || item.description || "").trim());
    if (normalizedIncome.length > 0) facts.income_lines = normalizedIncome;
  }
  if (!Array.isArray(facts.expense_lines) || facts.expense_lines.length === 0) {
    const normalizedExpense = expenseLines.map((item) => normalizeBossContractFact(item)).filter((item) => isPlainObject(item) && String(item.label || item.line_label || item.lineLabel || item.name || item.description || "").trim());
    if (normalizedExpense.length > 0) facts.expense_lines = normalizedExpense;
  }
  if (facts.effective_gross_income == null) {
    const egi = structuredPayload.effective_gross_income ?? structuredPayload.effectiveGrossIncome ?? structuredPayload.egi;
    if (Number.isFinite(Number(egi))) facts.effective_gross_income = Number(egi);
  }
  if (facts.total_operating_expenses == null) {
    const totalOpEx = structuredPayload.total_operating_expenses ?? structuredPayload.totalOperatingExpenses ?? structuredPayload.opEx ?? structuredPayload.opex;
    if (Number.isFinite(Number(totalOpEx))) facts.total_operating_expenses = Number(totalOpEx);
  }
  if (facts.net_operating_income == null) {
    const noi = structuredPayload.net_operating_income ?? structuredPayload.netOperatingIncome ?? structuredPayload.noi;
    if (Number.isFinite(Number(noi))) facts.net_operating_income = Number(noi);
  }
  if (facts.gross_potential_rent == null) {
    const gpr = structuredPayload.gross_potential_rent ?? structuredPayload.grossPotentialRent ?? structuredPayload.gpr;
    if (Number.isFinite(Number(gpr))) facts.gross_potential_rent = Number(gpr);
  }
  return facts;
}

function factAvailability(requiredFacts, availableFacts, sourceBacked = false) {
  const required = Array.from(new Set((Array.isArray(requiredFacts) ? requiredFacts : []).filter(Boolean).map(String)));
  const available = Array.from(new Set((Array.isArray(availableFacts) ? availableFacts : []).filter(Boolean).map(String)));
  const missing = required.filter((fact) => !available.includes(fact));
  return {
    required,
    available,
    missing,
    sourceBacked: Boolean(sourceBacked),
  };
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
  factAvailability = null,
}) {
  return {
    status,
    requiredFacts: cloneArray(requiredFacts),
    sourceBindings: cloneArray(sourceBindings),
    collapseInstructions: cloneArray(collapseInstructions),
    forbiddenFallbackText: cloneArray(forbiddenFallbackText),
    renderRequirements: cloneArray(renderRequirements),
    postRenderAssertions: cloneArray(postRenderAssertions),
    factAvailability: factAvailability ? normalizeBossContractFact(factAvailability) : null,
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

function isValidCoreDoc(doc) {
  return Boolean(truthyObject(doc) && Boolean(doc.role || doc.canonicalLabel || doc.sourceKind));
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

function collapseSectionByTitle(html, sectionTitle, collapseText = GENERIC_COLLAPSE_TEXT) {
  const source = String(html || "");
  const title = String(sectionTitle || "").trim();
  if (!source || !title) return source;
  const pattern = new RegExp(
    `<section\\b[^>]*>[\\s\\S]*?<span[^>]*class="section-header-title"[^>]*>\\s*${escapeRegExp(title)}\\s*<\\/span>[\\s\\S]*?<\\/section>`,
    "i"
  );
  if (!pattern.test(source)) return source;
  return source.replace(
    pattern,
    `<section class="section section-break"><div class="section-header"><span class="section-header-title">${escapeHtml(title)}</span></div><div class="card no-break"><p class="body-copy">${escapeHtml(collapseText)}</p></div></section>`
  );
}

function isAdvisoryViolation(violation) {
  const severity = String(violation?.severity || "").trim().toLowerCase();
  return severity === "advisory" || severity === "warning";
}

function isCollapseableViolationCode(code) {
  return COLLAPSEABLE_BOSS_VIOLATION_CODES.includes(String(code || ""));
}

function isHardFatalViolationCode(code) {
  return HARD_FATAL_BOSS_VIOLATION_CODES.includes(String(code || ""));
}

function getCollapseTargetSectionTitleByViolationCode(code) {
  switch (String(code || "")) {
    case "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT":
    case "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS":
      return "Unit Mix and Rent Positioning";
    case "CAP_RATE_PER_UNIT_REQUIRED_WHEN_UNITS_EXIST":
    case "NO_ZERO_CAP_RATE":
      return "Cap-Rate Value Indication";
    case "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED":
      return "Debt / Financing Context";
    case "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED":
    case "ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED":
      return "Acquisition Request Context";
    case "T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT":
      return "Operating Statement / TTM Summary";
    case "DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED":
      return "Source Context / Support Document Treatment";
    case "NO_FORBIDDEN_SURFACES":
      return "Debt / Financing Context";
    case "UNSUPPORTED_RENOVATION_MODELING_SURFACE":
      return "Key Upside Drivers";
    case "UNSUPPORTED_APPRAISAL_MARKET_SURVEY_QUANT_RELIANCE":
      return "Primary Constraint / Review Disclosure";
    default:
      return null;
  }
}

function getCollapsedReasonForViolationCode(code) {
  switch (String(code || "")) {
    case "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT":
    case "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS":
      return "The unit mix evidence was not display-ready, so the section was collapsed rather than showing a false missing-rows fallback.";
    case "CAP_RATE_PER_UNIT_REQUIRED_WHEN_UNITS_EXIST":
    case "NO_ZERO_CAP_RATE":
      return "Cap-rate support was not display-ready, so the value-indication section was collapsed rather than fabricating per-unit math.";
    case "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED":
      return "Current debt evidence was not display-ready, so the debt context was collapsed rather than borrowing proposed financing facts.";
    case "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED":
    case "ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED":
      return "Purchase-assumption or proposed financing support was not display-ready, so the acquisition request context was collapsed.";
    case "T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT":
      return "T12 expense-line detail was not display-ready, so the operating statement was collapsed rather than showing a summary-only approximation.";
    case "DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED":
      return "Source treatment detail was not display-ready, so the source context section was collapsed to a neutral disclosure.";
    case "NO_FORBIDDEN_SURFACES":
      return "Unsupported debt/refi terminology was collapsed from the debt and financing context rather than published as customer-facing output.";
    case "UNSUPPORTED_RENOVATION_MODELING_SURFACE":
      return "Unsupported renovation modeling was collapsed rather than presented as customer-facing underwriting output.";
    case "UNSUPPORTED_APPRAISAL_MARKET_SURVEY_QUANT_RELIANCE":
      return "Unsupported appraisal or market-survey quantitative reliance was collapsed rather than presented as customer-facing underwriting output.";
    default:
      return GENERIC_COLLAPSE_TEXT;
  }
}

function normalizeAcquisitionMemoBossViolations(validationOrViolations) {
  if (Array.isArray(validationOrViolations)) return validationOrViolations.filter(Boolean);
  if (Array.isArray(validationOrViolations?.violations)) return validationOrViolations.violations.filter(Boolean);
  return [];
}

function routeAcquisitionMemoBossViolations(bossContract, validationOrViolations = null, html = "") {
  const htmlString = String(html || "");
  const routed = {
    fatal_core: [],
    collapseable_surface: [],
    advisory_only: [],
    decision: "publish",
    coreGate: normalizeBossContractFact(bossContract?.coreGate || {}),
    publishAllowed: Boolean(bossContract?.coreGate?.publishAllowed),
  };
  const push = (bucket, violation, extra = {}) => {
    routed[bucket].push(
      normalizeBossContractFact({
        code: violation?.code || null,
        description: violation?.description || violation?.message || null,
        severity: violation?.severity || null,
        section: violation?.section || null,
        routing: bucket,
        ...extra,
      })
    );
  };

  if (!routed.publishAllowed) {
    for (const reason of Array.isArray(routed.coreGate?.fatalReasons) ? routed.coreGate.fatalReasons : []) {
      push("fatal_core", { code: reason, severity: "critical", section: "coreGate", description: "Core gate is not publishable." }, { routingReason: reason });
    }
    if (routed.fatal_core.length === 0) {
      push(
        "fatal_core",
        {
          code: "CORE_GATE_NOT_PUBLISHABLE",
          severity: "critical",
          section: "coreGate",
          description: "Core gate is not publishable.",
        },
        { routingReason: "core_gate_not_publishable" }
      );
    }
  }

  for (const violation of normalizeAcquisitionMemoBossViolations(validationOrViolations)) {
    if (isAdvisoryViolation(violation)) {
      push("advisory_only", violation);
      continue;
    }

    const code = String(violation?.code || "");
    if (isHardFatalViolationCode(code)) {
      push("fatal_core", violation);
      continue;
    }

    if (code === "NO_FORBIDDEN_SURFACES") {
      const hasHardFatalSurface = HARD_FATAL_FORBIDDEN_SURFACE_PATTERNS.some((pattern) => pattern.test(htmlString));
      const hasCollapseableSurface = COLLAPSEABLE_FORBIDDEN_SURFACE_PATTERNS.some((pattern) => pattern.test(htmlString));
      if (hasHardFatalSurface || (!hasCollapseableSurface && !hasHardFatalSurface)) {
        push("fatal_core", violation, {
          routingReason: hasHardFatalSurface ? "hard_fatal_forbidden_surface" : "forbidden_surface_unresolved",
        });
      } else {
        push("collapseable_surface", violation, {
          routingReason: "collapseable_forbidden_surface",
          section: "debtFinancingContext",
        });
      }
      continue;
    }

    if (isCollapseableViolationCode(code)) {
      push("collapseable_surface", violation);
      continue;
    }

    push("fatal_core", violation);
  }

  const unsupportedRenovationModelingPattern = /\b(renovation roi|payback|noi impact|value impact|refi impact|implementation modeling)\b/i;
  if (unsupportedRenovationModelingPattern.test(htmlString) && !routed.collapseable_surface.some((violation) => violation?.code === "UNSUPPORTED_RENOVATION_MODELING_SURFACE")) {
    push(
      "collapseable_surface",
      {
        code: "UNSUPPORTED_RENOVATION_MODELING_SURFACE",
        severity: "critical",
        section: "keyUpsideDrivers",
        description: "Unsupported renovation modeling surfaces should collapse instead of publishing as underwriting output.",
      },
      { routingReason: "html_pattern" }
    );
  }

  const unsupportedAppraisalMarketSurveyPattern = /\b(appraisal|market survey)[\s\S]{0,80}\b(quantitative|quantitative reliance|value impact|rent impact|cap rate impact)\b/i;
  if (unsupportedAppraisalMarketSurveyPattern.test(htmlString) && !routed.collapseable_surface.some((violation) => violation?.code === "UNSUPPORTED_APPRAISAL_MARKET_SURVEY_QUANT_RELIANCE")) {
    push(
      "collapseable_surface",
      {
        code: "UNSUPPORTED_APPRAISAL_MARKET_SURVEY_QUANT_RELIANCE",
        severity: "critical",
        section: "primaryConstraintReviewDisclosure",
        description: "Unsupported appraisal or market-survey quantitative reliance should collapse instead of publishing as underwriting output.",
      },
      { routingReason: "html_pattern" }
    );
  }

  routed.decision = routed.fatal_core.length > 0
    ? "fail"
    : routed.collapseable_surface.length > 0
      ? "collapse"
      : "publish";
  routed.publishAllowed = Boolean(routed.publishAllowed) && routed.fatal_core.length === 0;
  routed.summary = {
    fatal_core_count: routed.fatal_core.length,
    collapseable_surface_count: routed.collapseable_surface.length,
    advisory_only_count: routed.advisory_only.length,
  };
  return routed;
}

function collapseAcquisitionMemoBossViolationsHtml(bossContract, html, routing = null) {
  const routed = routing || routeAcquisitionMemoBossViolations(bossContract, validateAcquisitionMemoRenderAgainstBossContract(bossContract, html), html);
  let repairedHtml = String(html || "");

  for (const violation of Array.isArray(routed.collapseable_surface) ? routed.collapseable_surface : []) {
    const code = String(violation?.code || "");
    const sectionTitle = getCollapseTargetSectionTitleByViolationCode(code);
    const collapseText = getCollapsedReasonForViolationCode(code);
    if (sectionTitle) {
      repairedHtml = collapseSectionByTitle(repairedHtml, sectionTitle, collapseText);
    }
  }

  if (/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(repairedHtml)) {
    repairedHtml = repairedHtml.replace(
      /No parsed unit mix rows were available from the canonical rent roll evidence\./gi,
      renderComplianceRepairCollapseHtml()
    );
  }

  if (/Current Debt Maturity Not available/i.test(repairedHtml)) {
    repairedHtml = repairedHtml.replace(/Current Debt Maturity Not available/gi, "Current debt context omitted because the uploaded support context did not provide display-ready detail.");
  }
  if (/Maturity Date Not available/i.test(repairedHtml)) {
    repairedHtml = repairedHtml.replace(/Maturity Date Not available/gi, "Current debt context omitted because the uploaded support context did not provide display-ready detail.");
  }

  if (/<td style="font-weight:600;">-<\/td>/i.test(repairedHtml) && Number.isFinite(Number(bossContract?.reportContext?.coreMetrics?.units)) && Number(bossContract.reportContext.coreMetrics.units) > 0) {
    const units = Number(bossContract.reportContext.coreMetrics.units);
    const noi = Number(bossContract.reportContext.coreMetrics.noi);
    if (Number.isFinite(units) && units > 0 && Number.isFinite(noi)) {
      for (const cap of [5.0, 6.0, 7.0]) {
        const implied = noi / (cap / 100);
        const perUnit = implied / units;
        const replacement = `${Math.floor(perUnit).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
        repairedHtml = repairedHtml.replace(
          new RegExp(`(<tr><td>${cap.toFixed(1)}%<\\/td><td style="font-weight:600;">[^<]*<\\/td><td style="font-weight:600;">)-<\\/td>`, "i"),
          `$1${replacement}</td>`
        );
      }
    }
  }

  const collapseableForbiddenScrubPatterns = [
    /\bDSCR\b/gi,
    /\brefinance\b/gi,
    /\brefi\b/gi,
    /\bDCF\b/gi,
    /\bwaterfall\b/gi,
    /equity return/gi,
    /deal score/gi,
    /loan approval/gi,
  ];
  for (const pattern of collapseableForbiddenScrubPatterns) {
    repairedHtml = repairedHtml.replace(pattern, "");
  }

  return repairedHtml;
}

function assessAcquisitionMemoBossCompliance(bossContract, html, validationOrViolations = null) {
  const validation = validationOrViolations && Array.isArray(validationOrViolations.violations)
    ? validationOrViolations
    : validateAcquisitionMemoRenderAgainstBossContract(bossContract, html);
  const routing = routeAcquisitionMemoBossViolations(bossContract, validation, html);
  const ok = Boolean(bossContract?.coreGate?.publishAllowed) && routing.fatal_core.length === 0;
  return {
    ok,
    validation,
    routing,
    violations: Array.isArray(validation?.violations) ? validation.violations : [],
    fatal_core: routing.fatal_core,
    collapseable_surface: routing.collapseable_surface,
    advisory_only: routing.advisory_only,
  };
}

function buildAcquisitionMemoBossContract({
  canonicalSourcePackage = null,
  acquisitionMemoProjection = null,
  coreMetrics = null,
  t12Payload = null,
  propertyProfile = null,
  reportMeta = null,
  reportMode = null,
} = {}) {
  const coreT12 = summarizeCoreSource(
    canonicalSourcePackage?.coreT12,
    "core_t12",
    "Core Quantitative Source - Trailing 12-Month Income Statement"
  );
  const coreRentRoll = summarizeCoreSource(
    canonicalSourcePackage?.coreRentRoll,
    "core_rent_roll",
    "Core Quantitative Source - Rent Roll"
  );
  const supportDocs = collectSupportDocs(canonicalSourcePackage, acquisitionMemoProjection);
  const coreT12Source = findSupportDocByRole(supportDocs, "core_t12") || coreT12;
  const purchaseAssumptionsDoc = findSupportDocByRole(supportDocs, "purchase_assumptions") || acquisitionMemoProjection?.supportDocProjection?.purchaseAssumptions || null;
  const promotedCurrentDebtDoc =
    findSupportDocByRole(supportDocs, "current_debt_context") ||
    promoteCurrentDebtSupportDoc(findSupportDocByRole(supportDocs, "purchase_assumptions")) ||
    promoteCurrentDebtSupportDoc(acquisitionMemoProjection?.supportDocProjection?.purchaseAssumptions) ||
    promoteCurrentDebtSupportDoc(acquisitionMemoProjection?.supportDocProjection?.currentDebtContext) ||
    null;
  const supplementedCoreT12Facts = supplementT12FactsFromEvidence(normalizeBossContractFact(coreT12?.extractedFacts || {}), coreT12Source);
  const supplementedCoreT12FactsFromPayload = supplementT12FactsFromPayload(supplementedCoreT12Facts, t12Payload);
  const supplementedPurchaseFacts = supplementPurchaseFactsFromEvidence(
    normalizeBossContractFact(acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts || {}),
    purchaseAssumptionsDoc
  );
  const supplementedCurrentDebtFacts = supplementCurrentDebtFactsFromEvidence(
    normalizeBossContractFact(acquisitionMemoProjection?.currentDebtContext?.extractedFacts || promotedCurrentDebtDoc?.extractedFacts || {}),
    promotedCurrentDebtDoc
  );
  const coreT12SourceTruth = coreT12 ? { ...coreT12, extractedFacts: supplementedCoreT12FactsFromPayload } : null;
  const supportDocsWithSupplementedFacts = supportDocs.map((doc) => {
    const role = String(doc?.canonicalRole || doc?.role || "").trim().toLowerCase();
    if (role === "purchase_assumptions" || role === "proposed_acquisition_financing") {
      return { ...doc, extractedFacts: supplementedPurchaseFacts };
    }
    if (role === "current_debt_context") {
      return { ...doc, extractedFacts: supplementedCurrentDebtFacts };
    }
    if (role === "core_t12") {
      return { ...doc, extractedFacts: supplementedCoreT12FactsFromPayload };
    }
    return doc;
  });
  if (promotedCurrentDebtDoc && !supportDocsWithSupplementedFacts.some((doc) => String(doc?.canonicalRole || doc?.role || "").trim().toLowerCase() === "current_debt_context")) {
    supportDocsWithSupplementedFacts.push({
      ...promotedCurrentDebtDoc,
      extractedFacts: supplementedCurrentDebtFacts,
    });
  }

  const t12Valid = isValidCoreDoc(coreT12);
  const rentRollValid = isValidCoreDoc(coreRentRoll);
  const fatalReasons = [];
  if (!t12Valid) fatalReasons.push("core_t12_unusable");
  if (!rentRollValid) fatalReasons.push("core_rent_roll_unusable");

  const rentRollFacts = normalizeBossContractFact(coreRentRoll?.extractedFacts || {});
  const t12Facts = normalizeBossContractFact(coreT12SourceTruth?.extractedFacts || supplementedCoreT12FactsFromPayload || {});
  const purchaseFacts = supplementedPurchaseFacts;
  const currentDebtFacts = supplementedCurrentDebtFacts;

  const unitMixAvailable = hasStructuredValues(rentRollFacts?.unit_mix) || hasStructuredValues(rentRollFacts?.units);
  const totalUnitsAvailable = Number.isFinite(Number(rentRollFacts?.total_units)) || Number.isFinite(Number(coreMetrics?.units));
  const t12ExpenseLinesAvailable = hasStructuredValues(t12Facts?.expense_lines);
  const currentDebtAvailable =
    Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ||
    hasStructuredValues(currentDebtFacts);
  const purchaseAssumptionsAvailable =
    Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ||
    hasStructuredValues(purchaseFacts);
  const supportDocsAvailable = supportDocs.length > 0;
  const currentDebtRequiredFacts = [
    "current_outstanding_balance",
    "interest_rate",
    "amortization_remaining_years",
    "monthly_payment",
    "maturity_date",
  ];
  const proposedFinancingRequiredFacts = [
    "proposed_loan_amount",
    "ltv",
    "interest_rate",
    "amortization_years",
    "lender_fee_percent",
  ];
  const unitMixRequiredFacts = ["unit_mix", "units", "total_units", "occupancy"];
  const capRateRequiredFacts = ["purchase_price", "going_in_cap_rate", "total_units", "units", "noi"];
  const t12RequiredFacts = [
    "income_lines",
    "expense_lines",
    "effective_gross_income",
    "total_operating_expenses",
    "net_operating_income",
    "gross_potential_rent",
  ];
  const acquisitionRequestRequiredFacts = [
    "purchase_price",
    "noi_basis",
    "going_in_cap_rate",
    "proposed_loan_amount",
    "ltv",
    "interest_rate",
    "amortization_years",
    "lender_fee_percent",
  ];
  const documentTreatmentRequiredFacts = ["support_docs", "treatments", "uses"];

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
      requiredFacts: unitMixRequiredFacts,
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
      factAvailability: factAvailability(
        unitMixRequiredFacts,
        [
          ...(hasStructuredValues(rentRollFacts?.unit_mix) ? ["unit_mix"] : []),
          ...(hasStructuredValues(rentRollFacts?.units) ? ["units"] : []),
          ...(Number.isFinite(Number(rentRollFacts?.total_units)) ? ["total_units"] : []),
          ...(Number.isFinite(Number(rentRollFacts?.occupancy)) ? ["occupancy"] : []),
        ],
        unitMixAvailable
      ),
      postRenderAssertions: [
        buildBossContractAssertion("UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS", "Unit mix is required when structured rent roll evidence exists.", "critical", "unitMix"),
        buildBossContractAssertion("UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT", "False missing-row fallback text is forbidden when structured unit evidence exists.", "critical", "unitMix"),
      ],
    }),
    rentUpsideValueSensitivity: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["annual_in_place_rent", "annual_market_rent", "annual_rent_upside", "rent_gap"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["annual_in_place_rent", "annual_market_rent", "unit_mix", "units"]),
    }),
    capRateValueIndication: buildSectionContract({
      status: totalUnitsAvailable ? "required" : "required_if_source_present",
      requiredFacts: capRateRequiredFacts,
      sourceBindings: [
        { sourceRole: "core_t12", factPaths: ["net_operating_income", "effective_gross_income"], notes: [] },
        { sourceRole: "core_rent_roll", factPaths: ["total_units"], notes: [] },
        { sourceRole: "purchase_assumptions", factPaths: ["purchase_price", "going_in_cap_rate"], notes: [] },
      ],
      collapseInstructions: ["If total units are missing, omit per-unit values rather than fabricating them."],
      forbiddenFallbackText: ["-"],
      renderRequirements: ["Per-unit values are required when total units are available."],
      factAvailability: factAvailability(
        capRateRequiredFacts,
        [
          ...(Number.isFinite(Number(coreMetrics?.purchasePrice)) || Number.isFinite(Number(purchaseFacts?.purchase_price)) ? ["purchase_price"] : []),
          ...(Number.isFinite(Number(coreMetrics?.goingInCapRate)) || Number.isFinite(Number(purchaseFacts?.going_in_cap_rate)) ? ["going_in_cap_rate"] : []),
          ...(Number.isFinite(Number(rentRollFacts?.total_units)) || Number.isFinite(Number(coreMetrics?.units)) ? ["total_units"] : []),
          ...(Number.isFinite(Number(coreMetrics?.units)) || Number.isFinite(Number(rentRollFacts?.total_units)) ? ["units"] : []),
          ...(Number.isFinite(Number(coreMetrics?.noi)) || Number.isFinite(Number(t12Facts?.net_operating_income)) ? ["noi"] : []),
        ],
        totalUnitsAvailable
      ),
      postRenderAssertions: [
        buildBossContractAssertion("CAP_RATE_PER_UNIT_REQUIRED_WHEN_UNITS_EXIST", "Per-unit cap-rate values are required when units exist.", "critical", "capRateValueIndication"),
        buildBossContractAssertion("NO_ZERO_CAP_RATE", "Zero cap-rate display is forbidden when a valid source-backed cap exists.", "critical", "capRateValueIndication"),
      ],
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
      requiredFacts: acquisitionRequestRequiredFacts,
      sourceBindings: buildSectionBindings("purchase_assumptions", ["purchase_price", "noi_basis", "going_in_cap_rate", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"]),
      collapseInstructions: ["If purchase assumptions are absent, collapse the acquisition request context instead of inventing terms."],
      factAvailability: factAvailability(
        acquisitionRequestRequiredFacts,
        [
          ...(Number.isFinite(Number(purchaseFacts?.purchase_price)) ? ["purchase_price"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.noi_basis)) ? ["noi_basis"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.going_in_cap_rate)) ? ["going_in_cap_rate"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.proposed_loan_amount)) ? ["proposed_loan_amount"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.ltv)) ? ["ltv"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.interest_rate)) ? ["interest_rate"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.amortization_years)) ? ["amortization_years"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.lender_fee_percent)) ? ["lender_fee_percent"] : []),
        ],
        purchaseAssumptionsAvailable
      ),
      postRenderAssertions: [
        buildBossContractAssertion("ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED", "Acquisition request facts are required when purchase assumptions are source-backed.", "critical", "acquisitionRequestContext"),
        buildBossContractAssertion("PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED", "Proposed financing facts are required when purchase assumptions are source-backed.", "critical", "acquisitionRequestContext"),
      ],
    }),
    operatingSupport: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: t12RequiredFacts,
      sourceBindings: buildSectionBindings("core_t12", ["income_lines", "expense_lines", "effective_gross_income", "total_operating_expenses", "net_operating_income"]),
    }),
    rentValueSupport: buildSectionContract({
      status: "required_if_source_present",
      requiredFacts: ["annual_in_place_rent", "annual_market_rent", "annual_rent_upside"],
      sourceBindings: buildSectionBindings("core_rent_roll", ["annual_in_place_rent", "annual_market_rent", "unit_mix"]),
    }),
    currentDebtContext: buildSectionContract({
      status: currentDebtAvailable ? "required" : "collapsed",
      requiredFacts: currentDebtRequiredFacts,
      sourceBindings: buildSectionBindings("current_debt_context", ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"]),
      collapseInstructions: ["If current debt facts are unavailable or unusable, collapse the debt context section with a customer-safe note."],
      renderRequirements: ["Render source-backed current debt facts when available.", "Do not treat proposed acquisition financing as current debt."],
      factAvailability: factAvailability(
        currentDebtRequiredFacts,
        [
          ...(Number.isFinite(Number(currentDebtFacts?.current_outstanding_balance)) ? ["current_outstanding_balance"] : []),
          ...(Number.isFinite(Number(currentDebtFacts?.interest_rate)) ? ["interest_rate"] : []),
          ...(Number.isFinite(Number(currentDebtFacts?.amortization_remaining_years)) ? ["amortization_remaining_years"] : []),
          ...(Number.isFinite(Number(currentDebtFacts?.monthly_payment)) ? ["monthly_payment"] : []),
          ...(currentDebtFacts?.maturity_date ? ["maturity_date"] : []),
        ],
        currentDebtAvailable
      ),
      postRenderAssertions: [
        buildBossContractAssertion("CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED", "Current debt facts are required when current debt is source-backed.", "critical", "currentDebtContext"),
      ],
    }),
    proposedFinancingContext: buildSectionContract({
      status: purchaseAssumptionsAvailable ? "required" : "collapsed",
      requiredFacts: proposedFinancingRequiredFacts,
      sourceBindings: buildSectionBindings("purchase_assumptions", ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"]),
      collapseInstructions: ["If proposed financing facts are unavailable, collapse the proposed financing context section rather than borrowing current debt facts."],
      factAvailability: factAvailability(
        proposedFinancingRequiredFacts,
        [
          ...(Number.isFinite(Number(purchaseFacts?.proposed_loan_amount)) ? ["proposed_loan_amount"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.ltv)) ? ["ltv"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.interest_rate)) ? ["interest_rate"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.amortization_years)) ? ["amortization_years"] : []),
          ...(Number.isFinite(Number(purchaseFacts?.lender_fee_percent)) ? ["lender_fee_percent"] : []),
        ],
        purchaseAssumptionsAvailable
      ),
      postRenderAssertions: [
        buildBossContractAssertion("PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED", "Proposed financing facts are required when purchase assumptions are source-backed.", "critical", "proposedFinancingContext"),
      ],
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
      requiredFacts: t12RequiredFacts,
      sourceBindings: buildSectionBindings("core_t12", ["income_lines", "expense_lines", "effective_gross_income", "total_operating_expenses", "net_operating_income", "gross_potential_rent"]),
      collapseInstructions: ["If T12 line items are unavailable, collapse the detailed operating statement rather than showing a summary-only approximation."],
      factAvailability: factAvailability(
        t12RequiredFacts,
        [
          ...(hasStructuredValues(t12Facts?.income_lines) ? ["income_lines"] : []),
          ...(hasStructuredValues(t12Facts?.expense_lines) ? ["expense_lines"] : []),
          ...(Number.isFinite(Number(t12Facts?.effective_gross_income)) ? ["effective_gross_income"] : []),
          ...(Number.isFinite(Number(t12Facts?.total_operating_expenses)) ? ["total_operating_expenses"] : []),
          ...(Number.isFinite(Number(t12Facts?.net_operating_income)) ? ["net_operating_income"] : []),
          ...(Number.isFinite(Number(t12Facts?.gross_potential_rent)) ? ["gross_potential_rent"] : []),
        ],
        t12ExpenseLinesAvailable
      ),
      postRenderAssertions: [
        buildBossContractAssertion("T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT", "T12 expense lines are required when structured expense detail exists.", "critical", "operatingStatementTTMSummary"),
      ],
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
      requiredFacts: documentTreatmentRequiredFacts,
      sourceBindings: buildSectionBindings("acquisition_memo_projection", ["supportDocProjection", "documentTreatmentRows"]),
      renderRequirements: ["Render the source treatment schedule as customer-safe context, not as implementation commentary."],
      factAvailability: factAvailability(
        documentTreatmentRequiredFacts,
        [
          ...(supportDocsAvailable ? ["support_docs"] : []),
          ...(supportDocs.some((doc) => doc?.treatment) ? ["treatments"] : []),
          ...(supportDocs.some((doc) => doc?.use) ? ["uses"] : []),
        ],
        supportDocsAvailable
      ),
      postRenderAssertions: [
        buildBossContractAssertion("DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED", "Core source treatment schedule must be present when support docs exist.", "critical", "documentTreatment"),
      ],
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
    coreT12: coreT12SourceTruth,
    coreRentRoll,
    supportDocs: supportDocsWithSupplementedFacts,
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
      buildBossContractAssertion("CORE_VALID_PUBLISH_ALLOWED", "Core-valid publish must be allowed when T12 and Rent Roll are valid.", "critical", "global"),
      buildBossContractAssertion("OPTIONAL_SUPPORT_COLLAPSE_NOT_FATAL", "Optional/support collapse must not become a full-report failure.", "critical", "global"),
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
      const section = contract.sections[key];
      if (!isPlainObject(section)) {
        pushIssue("SECTION_MISSING", `${key} section is required.`, "critical", `sections.${key}`);
        continue;
      }
      if (typeof section.status !== "string" || !ALLOWED_SECTION_STATUSES.has(section.status)) {
        pushIssue("SECTION_STATUS_INVALID", `${key}.status must be one of ${Array.from(ALLOWED_SECTION_STATUSES).join(", ")}.`, "critical", `sections.${key}.status`);
      }
      for (const prop of ["requiredFacts", "sourceBindings", "collapseInstructions", "forbiddenFallbackText", "renderRequirements", "postRenderAssertions"]) {
        if (!Array.isArray(section[prop])) {
          pushIssue("SECTION_ARRAY_MISSING", `${key}.${prop} must be an array.`, "critical", `sections.${key}.${prop}`);
        }
      }
      if ((section.status === "required" || section.status === "required_if_source_present") && Array.isArray(section.requiredFacts) && section.requiredFacts.length === 0) {
        pushIssue("SECTION_REQUIRED_FACTS_EMPTY", `${key} requires explicit requiredFacts.`, "critical", `sections.${key}.requiredFacts`);
      }
      if ((section.status === "required" || section.status === "required_if_source_present") && Array.isArray(section.sourceBindings) && section.sourceBindings.length === 0) {
        pushIssue("SECTION_SOURCE_BINDINGS_EMPTY", `${key} requires source bindings.`, "critical", `sections.${key}.sourceBindings`);
      }
      if ((section.status === "required" || section.status === "required_if_source_present") && isPlainObject(section.factAvailability) && Array.isArray(section.factAvailability.missing) && section.factAvailability.missing.length > 0) {
        if (!Array.isArray(section.collapseInstructions) || section.collapseInstructions.length === 0) {
          pushIssue("SECTION_MISSING_FACTS_WITHOUT_COLLAPSE", `${key} has missing required facts but no collapse instructions.`, "critical", `sections.${key}.factAvailability`);
        }
      }
      const requiredCodes = REQUIRED_SECTION_ASSERTION_CODES[key] || [];
      for (const code of requiredCodes) {
        const found = Array.isArray(section.postRenderAssertions) && section.postRenderAssertions.some((assertion) => assertion?.code === code);
        if (!found) {
          pushIssue("SECTION_ASSERTION_CODE_MISSING", `${key} must include assertion code ${code}.`, "critical", `sections.${key}.postRenderAssertions`);
        }
      }
    }
  }

  if (!Array.isArray(contract.forbiddenSurfaces) || contract.forbiddenSurfaces.length === 0) {
    pushIssue("FORBIDDEN_SURFACES_MISSING", "forbiddenSurfaces must be a non-empty array.", "critical", "forbiddenSurfaces");
  } else {
    const requiredForbidden = FORBIDDEN_SURFACES.filter((surface) => !contract.forbiddenSurfaces.includes(surface));
    if (requiredForbidden.length > 0) {
      pushIssue("FORBIDDEN_SURFACES_INCOMPLETE", `forbiddenSurfaces is missing: ${requiredForbidden.join(", ")}.`, "critical", "forbiddenSurfaces");
    }
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

function findSection(contract, sectionName) {
  return isPlainObject(contract?.sections?.[sectionName]) ? contract.sections[sectionName] : null;
}

function getFactAvailability(section) {
  return isPlainObject(section?.factAvailability) ? section.factAvailability : null;
}

function hasAvailableFact(section, factName) {
  const availability = getFactAvailability(section);
  if (!availability) return false;
  return Array.isArray(availability.available) && availability.available.includes(String(factName));
}

function hasAnyAvailableFacts(section, factNames) {
  return (Array.isArray(factNames) ? factNames : []).some((factName) => hasAvailableFact(section, factName));
}

function addRenderViolation(violations, code, severity, section, message) {
  violations.push({ code, severity, section, message });
}

function renderComplianceRepairCollapseHtml() {
  return "This section was omitted because the uploaded support context did not provide display-ready detail. Core report outputs remain based on the uploaded T12 and Rent Roll.";
}

function validateAcquisitionMemoRenderAgainstBossContract(bossContract, html) {
  const htmlString = String(html || "");
  const violations = [];
  const sourceT12 = bossContract?.sourceTruth?.coreT12?.extractedFacts || {};
  const sourceRentRoll = bossContract?.sourceTruth?.coreRentRoll?.extractedFacts || {};
  const supportDocs = Array.isArray(bossContract?.sourceTruth?.supportDocs) ? bossContract.sourceTruth.supportDocs : [];
  const unitMixSection = findSection(bossContract, "unitMix");
  const capRateSection = findSection(bossContract, "capRateValueIndication");
  const currentDebtSection = findSection(bossContract, "currentDebtContext");
  const proposedFinancingSection = findSection(bossContract, "proposedFinancingContext");
  const acquisitionRequestSection = findSection(bossContract, "acquisitionRequestContext");
  const operatingStatementSection = findSection(bossContract, "operatingStatementTTMSummary");
  const documentTreatmentSection = findSection(bossContract, "documentTreatment");

  const coreT12Valid = Boolean(bossContract?.coreGate?.t12Valid);
  const coreRentRollValid = Boolean(bossContract?.coreGate?.rentRollValid);
  const totalUnits = Number(sourceRentRoll?.total_units ?? sourceRentRoll?.units?.length ?? bossContract?.reportContext?.coreMetrics?.units);
  const sourceBackedUnitMix = Boolean(getFactAvailability(unitMixSection)?.sourceBacked);
  const sourceBackedCapRate = Boolean(getFactAvailability(capRateSection)?.sourceBacked);
  const sourceBackedCurrentDebt = Boolean(getFactAvailability(currentDebtSection)?.sourceBacked);
  const sourceBackedProposed = Boolean(getFactAvailability(proposedFinancingSection)?.sourceBacked);
  const sourceBackedOperating = Boolean(getFactAvailability(operatingStatementSection)?.sourceBacked);
  const sourceBackedDocumentTreatment = Boolean(getFactAvailability(documentTreatmentSection)?.sourceBacked);
  const sourceBackedAcqRequest = Boolean(getFactAvailability(acquisitionRequestSection)?.sourceBacked);

  if (coreRentRollValid && sourceBackedUnitMix) {
    if (/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(htmlString)) {
      addRenderViolation(
        violations,
        "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT",
        "critical",
        "unitMix",
        "Unit Mix cannot show a false missing-rows fallback when structured unit evidence is source-backed."
      );
    }
    if (!/(1BR|2BR)/i.test(htmlString)) {
      addRenderViolation(
        violations,
        "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
        "critical",
        "unitMix",
        "Unit Mix must render structured unit rows when the rent roll is source-backed."
      );
    }
  }

  if (Number.isFinite(totalUnits) && totalUnits > 0 && sourceBackedCapRate) {
    const perUnitDashPatterns = [
      /<tr><td>5\.0%<\/td><td style="font-weight:600;">[\s\S]*?<\/td><td style="font-weight:600;">-<\/td><\/tr>/i,
      /<tr><td>6\.0%<\/td><td style="font-weight:600;">[\s\S]*?<\/td><td style="font-weight:600;">-<\/td><\/tr>/i,
      /<tr><td>7\.0%<\/td><td style="font-weight:600;">[\s\S]*?<\/td><td style="font-weight:600;">-<\/td><\/tr>/i,
    ];
    if (perUnitDashPatterns.some((pattern) => pattern.test(htmlString))) {
      addRenderViolation(
        violations,
        "NO_PER_UNIT_DASH_WITH_UNITS",
        "critical",
        "capRateValueIndication",
        "Cap-rate per-unit values cannot render as dashes when total units are available."
      );
    }
    if (/<td[^>]*>\s*Going-In Cap Rate\s*<\/td>\s*<td[^>]*>\s*0\.0%\s*<\/td>/i.test(htmlString)) {
      addRenderViolation(
        violations,
        "NO_ZERO_CAP_RATE",
        "critical",
        "capRateValueIndication",
        "Going-In Cap Rate cannot render as 0.0% when source-backed cap data exists."
      );
    }
  }

  if (sourceBackedCurrentDebt) {
    const requiredDebtLabels = [
      "Current Outstanding Balance",
      "Interest Rate",
      "Amortization Remaining",
      "Monthly Payment",
      "Maturity Date",
    ];
    for (const label of requiredDebtLabels) {
      if (!new RegExp(escapeRegExp(label), "i").test(htmlString)) {
        addRenderViolation(
          violations,
          "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED",
          "critical",
          "currentDebtContext",
          `Current debt facts must include ${label} when source-backed.`
        );
        break;
      }
    }
    if (/Current Debt Maturity Not available/i.test(htmlString) || /Maturity Date Not available/i.test(htmlString)) {
      addRenderViolation(
        violations,
        "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED",
        "critical",
        "currentDebtContext",
        "Current debt cannot collapse to maturity-only not available when source-backed facts exist."
      );
    }
  }

  if (sourceBackedProposed || sourceBackedAcqRequest) {
    const requiredProposedLabels = [
      "Proposed Acquisition Loan",
      "Proposed LTV",
      "Proposed Rate",
      "Proposed Amortization",
      "Lender / Origination Fee",
    ];
    for (const label of requiredProposedLabels) {
      if (!new RegExp(escapeRegExp(label), "i").test(htmlString)) {
        addRenderViolation(
          violations,
          "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED",
          "critical",
          "proposedFinancingContext",
          `Proposed financing must include ${label} when source-backed.`
        );
        break;
      }
    }
  }

  if (sourceBackedOperating) {
    const expenseLabels = Array.isArray(sourceT12.expense_lines)
      ? sourceT12.expense_lines
          .map((item) => String(item?.label || item?.line_label || item?.lineLabel || "").trim())
          .filter(Boolean)
      : [];
    if (expenseLabels.length > 0) {
      const missingExpense = expenseLabels.find((label) => !new RegExp(escapeRegExpForHtmlText(label), "i").test(htmlString));
      if (missingExpense) {
        addRenderViolation(
          violations,
          "T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT",
          "critical",
          "operatingStatementTTMSummary",
          `T12 expense line ${missingExpense} must render when structured expense detail exists.`
        );
      }
    }
  }

  if (supportDocs.length > 0 || coreT12Valid || coreRentRollValid) {
    if (!/Core Quantitative Source/i.test(htmlString) || !/Trailing 12-Month Income Statement/i.test(htmlString) || !/Rent Roll/i.test(htmlString)) {
      addRenderViolation(
        violations,
        "DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED",
        "critical",
        "documentTreatment",
        "Document Treatment must preserve the core quantitative source treatment schedule."
      );
    }
  }

  const forbiddenPatterns = [
    /\bDSCR\b/i,
    /\brefinance\b/i,
    /\brefi\b/i,
    /\bDCF\b/i,
    /\bwaterfall\b/i,
    /equity return/i,
    /deal score/i,
    /final recommendation/i,
    /\bBUY\b/i,
    /\bSELL\b/i,
    /\bHOLD\b/i,
    /loan approval/i,
    /lender commitment/i,
  ];
  if (forbiddenPatterns.some((pattern) => pattern.test(htmlString))) {
    addRenderViolation(
      violations,
      "NO_FORBIDDEN_SURFACES",
      "critical",
      "global",
      "Forbidden underwriting surfaces must not appear in the final HTML."
    );
  }

  return {
    ok: violations.length === 0,
    violations,
    routing: routeAcquisitionMemoBossViolations(bossContract, violations, htmlString),
  };
}

function enforceAcquisitionMemoBossContractOnHtml(bossContract, html) {
  const validation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, html);
  const initialRouting = validation.routing || routeAcquisitionMemoBossViolations(bossContract, validation, html);
  let repairedHtml = String(html || "");
  if (validation.ok || (initialRouting.fatal_core.length === 0 && initialRouting.collapseable_surface.length === 0)) {
    return {
      ok: initialRouting.fatal_core.length === 0,
      violations: [],
      routing: initialRouting,
      repairedHtml,
    };
  }

  repairedHtml = collapseAcquisitionMemoBossViolationsHtml(bossContract, repairedHtml, initialRouting);

  if (/<td style="font-weight:600;">-<\/td>/i.test(repairedHtml) && Number.isFinite(Number(bossContract?.reportContext?.coreMetrics?.units)) && Number(bossContract.reportContext.coreMetrics.units) > 0) {
    const units = Number(bossContract.reportContext.coreMetrics.units);
    const noi = Number(bossContract.reportContext.coreMetrics.noi);
    if (Number.isFinite(units) && units > 0 && Number.isFinite(noi)) {
      for (const cap of [5.0, 6.0, 7.0]) {
        const implied = noi / (cap / 100);
        const perUnit = implied / units;
        const replacement = `${Math.floor(perUnit).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
        repairedHtml = repairedHtml.replace(
          new RegExp(`(<tr><td>${cap.toFixed(1)}%<\\/td><td style="font-weight:600;">[^<]*<\\/td><td style="font-weight:600;">)-<\\/td>`, "i"),
          `$1${replacement}</td>`
        );
      }
    }
  }

  const postValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, repairedHtml);
  const postRouting = postValidation.routing || routeAcquisitionMemoBossViolations(bossContract, postValidation, repairedHtml);

  return {
    ok: Boolean(bossContract?.coreGate?.publishAllowed) && postRouting.fatal_core.length === 0,
    violations: postValidation.violations,
    routing: postRouting,
    repairedHtml,
  };
}

export {
  assessAcquisitionMemoBossCompliance,
  buildAcquisitionMemoBossContract,
  buildBossContractAssertion,
  buildSectionContract,
  collapseAcquisitionMemoBossViolationsHtml,
  collapseSectionByTitle,
  enforceAcquisitionMemoBossContractOnHtml,
  getCollapseTargetSectionTitleByViolationCode,
  getCollapsedReasonForViolationCode,
  normalizeBossContractFact,
  routeAcquisitionMemoBossViolations,
  validateAcquisitionMemoRenderAgainstBossContract,
  validateAcquisitionMemoBossContract,
};
