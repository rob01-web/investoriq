/**
 * Single source of truth for all document role and authority decisions.
 * Raw files, extracted text, parser artifacts, and filename heuristics may only be read here.
 * All downstream consumers must treat this output as immutable authority.
 */

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff\ufffe\uffff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getFileId(file) {
  return String(file?.fileId ?? file?.file_id ?? file?.id ?? "").trim();
}

function getOriginalFilename(file, artifactsByFileId) {
  const fileId = getFileId(file);
  const artifact = artifactsByFileId.get(fileId)?.[0] || null;
  return String(
    file?.originalFilename ||
      file?.original_filename ||
      artifact?.originalFilename ||
      artifact?.original_filename ||
      artifact?.payload?.originalFilename ||
      artifact?.payload?.original_filename ||
      ""
  ).trim();
}

function getMimeType(file, artifactsByFileId) {
  const fileId = getFileId(file);
  const artifact = artifactsByFileId.get(fileId)?.[0] || null;
  return String(
    file?.mimeType ||
      file?.mime_type ||
      artifact?.mimeType ||
      artifact?.mime_type ||
      artifact?.payload?.mimeType ||
      artifact?.payload?.mime_type ||
      ""
  ).trim().toLowerCase();
}

function getArtifactOriginalFilename(artifact) {
  return String(
    artifact?.originalFilename ||
      artifact?.original_filename ||
      artifact?.filename ||
      artifact?.fileName ||
      artifact?.document_name ||
      artifact?.documentName ||
      artifact?.name ||
      artifact?.payload?.originalFilename ||
      artifact?.payload?.original_filename ||
      artifact?.payload?.filename ||
      artifact?.payload?.fileName ||
      artifact?.payload?.document_name ||
      artifact?.payload?.documentName ||
      artifact?.payload?.name ||
      ""
  ).trim();
}

function getArtifactMimeType(artifact) {
  return String(
    artifact?.mimeType ||
      artifact?.mime_type ||
      artifact?.mime ||
      artifact?.payload?.mimeType ||
      artifact?.payload?.mime_type ||
      artifact?.payload?.mime ||
      ""
  ).trim().toLowerCase();
}

function isSpreadsheetMimeType(mimeType) {
  const normalized = String(mimeType || "").trim().toLowerCase();
  return (
    normalized.includes("spreadsheet") ||
    normalized.includes("excel") ||
    normalized.includes("sheet") ||
    normalized.includes("xls")
  );
}

function collectArtifactTexts(file, artifacts) {
  const texts = [];
  const push = (value) => {
    const text = String(value ?? "").trim();
    if (text) texts.push(text);
  };

  push(file?.source_text);
  push(file?.raw_text);
  push(file?.notes);
  push(file?.loan_terms_text);
  push(file?.extracted_text);
  push(file?.text);
  push(file?.excerpt);
  push(file?.document_text_extracted);
  push(file?.payload?.text);
  push(file?.payload?.excerpt);
  push(file?.payload?.document_text_extracted);

  for (const artifact of artifacts) {
    push(artifact?.source_text);
    push(artifact?.raw_text);
    push(artifact?.notes);
    push(artifact?.loan_terms_text);
    push(artifact?.extracted_text);
    push(artifact?.text);
    push(artifact?.excerpt);
    push(artifact?.document_text_extracted);
    push(artifact?.payload?.source_text);
    push(artifact?.payload?.raw_text);
    push(artifact?.payload?.notes);
    push(artifact?.payload?.loan_terms_text);
    push(artifact?.payload?.extracted_text);
    push(artifact?.payload?.text);
    push(artifact?.payload?.excerpt);
    push(artifact?.payload?.document_text_extracted);
  }

  return texts.join("\n");
}

function extractEvidenceText(file, artifacts) {
  return normalizeText(collectArtifactTexts(file, artifacts));
}

function extractFirstMatchNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (!match) continue;
    const raw = match[1] ?? match[0];
    const normalized = String(raw).replace(/[$,]/g, "").trim();
    const value = Number(normalized);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function extractMoney(text, patterns) {
  const value = extractFirstMatchNumber(text, patterns);
  return Number.isFinite(value) ? value : null;
}

function extractPercentFraction(text, patterns) {
  const value = extractFirstMatchNumber(text, patterns);
  if (!Number.isFinite(value)) return null;
  return value / 100;
}

function extractYears(text, patterns) {
  const value = extractFirstMatchNumber(text, patterns);
  return Number.isFinite(value) ? value : null;
}

function extractDate(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match && match[1]) return String(match[1]).trim();
  }
  return null;
}

function buildProvenance(file, authorityBasis, text) {
  return {
    authorityBasis,
    sourceTextPresent: Boolean(text),
    sourceTextSnippet: text ? text.slice(0, 500) : null,
    sourceAuthorityVersion: "v2",
    extractedAt: new Date().toISOString(),
  };
}

function buildExtractedFacts(role, text) {
  const facts = {};
  if (role === "purchase_assumptions") {
    const purchasePrice = extractMoney(text, [
      /\bpurchase price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bproposed acquisition price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const noiBasis = extractMoney(text, [
      /\bnoi basis[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bnoi[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const goingInCapRate = extractPercentFraction(text, [
      /\bgoing[-\s]*in cap(?: rate| reference)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bcap rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const goingInCapRateFallback = extractPercentFraction(text, [
      /\bgoing[-\s]*in cap(?: rate| reference)?\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bgoing[-\s]*cap(?: rate| reference)?\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bgoing[-\s]*in\s*cap\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bgoing[-\s]*cap\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const proposedLoanAmount = extractMoney(text, [
      /\bproposed loan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bproposed acquisition loan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bloan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bloan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const ltv = extractPercentFraction(text, [
      /\bltv[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bloanto[-\s]*value[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const interestRate = extractPercentFraction(text, [
      /\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\brate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const amortizationYears = extractYears(text, [
      /\bamortization(?: years?| remaining years?)?[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /\bamort(?: years?)?[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    ]);
    const lenderFeePercent = extractPercentFraction(text, [
      /\blender fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bfinancing fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\borigination fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bfee[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\blender fee(?: percent)?\s+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bfinancing fee(?: percent)?\s+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\borigination fee(?: percent)?\s+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    if (purchasePrice != null) facts.purchase_price = purchasePrice;
    if (noiBasis != null) facts.noi_basis = noiBasis;
    if (goingInCapRate != null || goingInCapRateFallback != null) facts.going_in_cap_rate = goingInCapRate ?? goingInCapRateFallback;
    if (proposedLoanAmount != null) facts.proposed_loan_amount = proposedLoanAmount;
    if (ltv != null) facts.ltv = ltv;
    if (interestRate != null) facts.interest_rate = interestRate;
    if (amortizationYears != null) facts.amortization_years = amortizationYears;
    if (lenderFeePercent != null) facts.lender_fee_percent = lenderFeePercent;
    facts.has_proposed_acquisition_financing = true;
  } else if (role === "current_debt_context") {
    const outstandingBalance = extractMoney(text, [
      /\bcurrent outstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bcurrent debt balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\boutstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bprincipal balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bbalance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const interestRate = extractPercentFraction(text, [
      /\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bnote rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bcoupon rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const amortYears = extractYears(text, [
      /\bamortization remaining[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /\bamortization remaining years[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /\bamortization[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    ]);
    const monthlyPayment = extractMoney(text, [
      /\bmonthly payment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bmonthly debt service[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bpayment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const maturityDate = extractDate(text, [
      /\bmaturity date[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
      /\bmatures?[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    ]);
    if (outstandingBalance != null) facts.current_outstanding_balance = outstandingBalance;
    if (interestRate != null) facts.interest_rate = interestRate;
    if (amortYears != null) facts.amortization_remaining_years = amortYears;
    if (monthlyPayment != null) facts.monthly_payment = monthlyPayment;
    if (maturityDate != null) facts.maturity_date = maturityDate;
    facts.has_current_debt_context = true;
  } else if (role === "structured_renovation_capex_plan") {
    const totalRenovationBudget = extractMoney(text, [
      /\btotal renovation budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\breno budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\brenovation budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bcapex budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bbudget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (totalRenovationBudget != null) facts.total_renovation_budget = totalRenovationBudget;
    facts.has_rent_lift = /(rent lift|expected rent lift|expected monthly rent lift|monthly rent lift)/i.test(text);
    facts.has_phasing = /(phasing|implementation schedule|months?\s+\d+\s*[-–]\s*\d+)/i.test(text);
    facts.context_only = true;
  } else if (role === "appraisal_context") {
    const appraisalValue = extractMoney(text, [
      /\bappraisal value[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bvalue[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (appraisalValue != null) facts.appraisal_value = appraisalValue;
  } else if (role === "market_survey_context") {
    facts.context_only = true;
  } else if (role === "environmental_context") {
    facts.context_only = true;
  }
  return facts;
}

function hasPositiveCurrentDebtEvidence(text) {
  if (!text) return false;
  const hasDebtContext = /(existing current debt statement|current debt context|current debt terms|current mortgage|existing mortgage|current outstanding balance|outstanding balance|principal balance|monthly payment|maturity date|amortization remaining|amortization remaining years)/i.test(text);
  const hasDebtFinanceTerms = /(interest rate|note rate|coupon rate)/i.test(text);
  return hasDebtContext && hasDebtFinanceTerms;
}

function hasStructuredRenovationEvidence(text) {
  if (!text) return false;
  const hasPlan = /(structured renovation \/ capex plan|structured forward-looking renovation|total renovation budget|renovation budget|capex plan)/i.test(text);
  const hasLift = /(rent lift|expected rent lift|expected monthly rent lift|monthly rent lift)/i.test(text);
  const hasPhasing = /(phasing|implementation schedule|months?\s+\d+\s*[-–]\s*\d+|months?\b)/i.test(text);
  return hasPlan && hasLift && hasPhasing;
}

function classifySupportDoc(file, artifacts, artifactsByFileId) {
  const fileId = getFileId(file);
  const originalFilename = getOriginalFilename(file, artifactsByFileId);
  const mimeType = getMimeType(file, artifactsByFileId);
  const text = extractEvidenceText(file, artifacts);
  const semanticRoles = toArray(artifacts)
    .map((artifact) => artifact?.semantic_doc_role ?? artifact?.payload?.semantic_doc_role ?? null)
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
  const debtBases = toArray(artifacts)
    .map((artifact) => artifact?.debt_basis ?? artifact?.payload?.debt_basis ?? null)
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const filename = normalizeText(originalFilename).replace(/[_-]+/g, " ");
  const hasAssumptionFilename = /\bassumption(s)?\b/.test(filename);
  const hasCurrentDebtFilename = /\bcurrent[_\s-]?debt\b|\bcurrent[_\s-]?loan\b|\bmortgage\b|\bdebt statement\b/.test(filename);
  const hasT12Filename = /\bt12\b|\btrailing\b/.test(filename);
  const hasRentRollFilename = /\brent[_\s-]?roll\b|\brentroll\b/.test(filename);
  const hasRenovationFilename = /\breno\b|\brenovation\b|\bcapex\b/.test(filename);
  const hasAppraisalFilename = /\bappraisal\b/.test(filename);
  const hasMarketSurveyFilename = /\bmarket\b|\bsurvey\b/.test(filename);
  const hasEnvironmentalFilename = /(esa|phase[_\s-]?i|environmental|\bphase\b)/i.test(filename);

  const explicitSemanticRole = semanticRoles[0] || "";
  const explicitDebtBasis = debtBases[0] || "";
  const positiveCurrentDebtEvidence = hasPositiveCurrentDebtEvidence(text);
  const structuredRenovationEvidence = hasStructuredRenovationEvidence(text);
  const explicitPurchaseAssumptionsText = /(purchase assumptions|proposed acquisition financing|going[-\s]*in cap reference|proposed loan amount|lender fee)/i.test(text);
  const explicitPhaseIText = /(phase i esa|phase i environmental site assessment|environmental due diligence|phase i)/i.test(text);
  const explicitAppraisalText = /(appraisal summary|valuation context|appraisal \/ valuation|appraisal)/i.test(text);
  const explicitMarketSurveyText = /(market survey|rent survey|market rent survey)/i.test(text);
  if (hasT12Filename || (isSpreadsheetMimeType(mimeType) && explicitSemanticRole === "t12")) {
    return {
      role: "core_t12",
      roleLabel: "Core Quantitative Source — Trailing 12-Month Income Statement",
      treatment: "Primary quantitative input",
      use: "Core quantitative source; drives EGI, OpEx, NOI, and all income/expense modeling.",
      category: "Core Quantitative Input",
      authorityBasis: hasT12Filename ? "filename_heuristic" : "parser_semantic",
      sourceKind: "core_t12",
      canonicalLabel: "Core Quantitative Source — Trailing 12-Month Income Statement",
      allowedUses: ["core_quantitative_input"],
      forbiddenUses: ["support_doc"],
      extractedFacts: {},
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, hasT12Filename ? "filename_heuristic" : "parser_semantic", text),
    };
  }

  if (hasRentRollFilename || (isSpreadsheetMimeType(mimeType) && explicitSemanticRole === "rent_roll")) {
    return {
      role: "core_rent_roll",
      roleLabel: "Core Quantitative Source — Rent Roll",
      treatment: "Primary quantitative input",
      use: "Core quantitative source; drives unit count, occupancy, in-place rent, and market rent gap.",
      category: "Core Quantitative Input",
      authorityBasis: hasRentRollFilename ? "filename_heuristic" : "parser_semantic",
      sourceKind: "core_rent_roll",
      canonicalLabel: "Core Quantitative Source — Rent Roll",
      allowedUses: ["core_quantitative_input"],
      forbiddenUses: ["support_doc"],
      extractedFacts: {},
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, hasRentRollFilename ? "filename_heuristic" : "parser_semantic", text),
    };
  }

  if (
    positiveCurrentDebtEvidence ||
    hasCurrentDebtFilename ||
    ((explicitSemanticRole === "current_debt" || explicitDebtBasis === "current_debt") && !explicitPurchaseAssumptionsText)
  ) {
    const extractedFacts = buildExtractedFacts("current_debt_context", text);
    return {
      role: "current_debt_context",
      roleLabel: "Existing Debt Context — Current Mortgage / Debt Statement",
      treatment: "Debt support received / contextual",
      use: "Uploaded existing/current debt context only; not proposed acquisition financing.",
      category: "Existing Debt — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Existing Debt Context — Current Mortgage / Debt Statement",
      allowedUses: ["current_debt_context"],
      forbiddenUses: ["purchase_assumptions", "proposed_acquisition_financing_context"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(
        file,
        positiveCurrentDebtEvidence
          ? "keyword_match"
          : hasCurrentDebtFilename
            ? "filename_heuristic"
            : explicitDebtBasis === "current_debt"
              ? "debt_basis_signal"
              : "parser_semantic",
        text
      ),
      authorityBasis:
        hasCurrentDebtFilename
          ? "filename_heuristic"
          : explicitDebtBasis === "current_debt"
          ? "debt_basis_signal"
          : explicitSemanticRole === "current_debt"
            ? "parser_semantic"
            : "keyword_match",
    };
  }

  if (
    (explicitSemanticRole === "purchase_assumptions" && !explicitAppraisalText && !explicitMarketSurveyText && !explicitPhaseIText) ||
    explicitDebtBasis === "proposed_acquisition" ||
    hasAssumptionFilename ||
    (explicitPurchaseAssumptionsText && !explicitAppraisalText && !explicitMarketSurveyText && !explicitPhaseIText)
  ) {
    const extractedFacts = buildExtractedFacts("purchase_assumptions", text);
    return {
      role: "purchase_assumptions",
      roleLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
      treatment: "Acquisition context received",
      use: "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.",
      category: "Acquisition Assumptions — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
      allowedUses: ["purchase_assumptions", "proposed_acquisition_financing_context"],
      forbiddenUses: ["current_debt_context"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(
        file,
        explicitSemanticRole === "purchase_assumptions"
          ? "parser_semantic"
          : explicitDebtBasis === "proposed_acquisition"
            ? "debt_basis_signal"
            : hasAssumptionFilename
              ? "filename_heuristic"
              : "keyword_match",
        text
      ),
      authorityBasis:
        explicitSemanticRole === "purchase_assumptions"
          ? "parser_semantic"
          : explicitDebtBasis === "proposed_acquisition"
            ? "debt_basis_signal"
            : hasAssumptionFilename
              ? "filename_heuristic"
              : "keyword_match",
    };
  }

  if (
    explicitSemanticRole === "renovation_plan" ||
    hasRenovationFilename ||
    structuredRenovationEvidence
  ) {
    const extractedFacts = buildExtractedFacts("structured_renovation_capex_plan", text);
    return {
      role: "structured_renovation_capex_plan",
      roleLabel: "Structured Renovation / CapEx Plan",
      treatment: "Renovation / CapEx context received",
      use: "Structured renovation scope, CapEx budget, rent-lift assumptions, and phasing acknowledged as source-transparent context.",
      category: "Renovation / CapEx — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Structured Renovation / CapEx Plan",
      allowedUses: ["structured_renovation_capex_plan"],
      forbiddenUses: ["roi_modeling", "payback_modeling", "value_modeling", "advanced_underwriting_returns"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "renovation_plan" ? "parser_semantic" : hasRenovationFilename ? "filename_heuristic" : "keyword_match", text),
      authorityBasis: explicitSemanticRole === "renovation_plan" ? "parser_semantic" : hasRenovationFilename ? "filename_heuristic" : "keyword_match",
    };
  }

  if (explicitSemanticRole === "appraisal" || hasAppraisalFilename || explicitAppraisalText) {
    const extractedFacts = buildExtractedFacts("appraisal_context", text);
    return {
      role: "appraisal_context",
      roleLabel: "Appraisal / Valuation Context",
      treatment: "Appraisal context received",
      use: "Third-party appraisal or valuation context; does not override T12 NOI, Rent Roll market rent, or cap-rate value framework.",
      category: "Appraisal — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Appraisal / Valuation Context",
      allowedUses: ["appraisal_context"],
      forbiddenUses: ["purchase_assumptions", "t12_override", "rent_roll_override"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "appraisal" ? "parser_semantic" : "filename_heuristic", text),
      authorityBasis: explicitSemanticRole === "appraisal" ? "parser_semantic" : "filename_heuristic",
    };
  }

  if (explicitSemanticRole === "market_survey" || hasMarketSurveyFilename || explicitMarketSurveyText) {
    const extractedFacts = buildExtractedFacts("market_survey_context", text);
    return {
      role: "market_survey_context",
      roleLabel: "Market Rent Survey Context",
      treatment: "Market context received",
      use: "Market rent survey context; corroborates or informs rent gap analysis but does not override Rent Roll market rent inputs.",
      category: "Market Survey — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Market Rent Survey Context",
      allowedUses: ["market_survey_context"],
      forbiddenUses: ["rent_roll_override"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "market_survey" ? "parser_semantic" : "filename_heuristic", text),
      authorityBasis: explicitSemanticRole === "market_survey" ? "parser_semantic" : "filename_heuristic",
    };
  }

  if (
    explicitSemanticRole === "phase_i_esa" ||
    explicitSemanticRole === "environmental" ||
    hasEnvironmentalFilename ||
    explicitPhaseIText
  ) {
    const extractedFacts = buildExtractedFacts("environmental_context", text);
    return {
      role: "environmental_context",
      roleLabel: "Environmental Due Diligence / Phase I ESA Context",
      treatment: "Environmental context received",
      use: "Phase I Environmental Site Assessment or environmental due diligence context; not a property tax document.",
      category: "Environmental — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Environmental Due Diligence / Phase I ESA Context",
      allowedUses: ["environmental_context"],
      forbiddenUses: ["property_tax_support", "quantitative_model_input"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "phase_i_esa" || explicitSemanticRole === "environmental" ? "parser_semantic" : "filename_heuristic", text),
      authorityBasis: explicitSemanticRole === "phase_i_esa" || explicitSemanticRole === "environmental" ? "parser_semantic" : "filename_heuristic",
    };
  }

  return {
    role: "other_support",
    roleLabel: "Other Support Document",
    treatment: "Context only",
    use: "Listed for auditability only; not used quantitatively.",
    category: "Listed but Not Quantitatively Modeled",
    sourceKind: "support_doc",
    canonicalLabel: "Other Support Document",
    allowedUses: [],
    forbiddenUses: ["quantitative_model_input"],
    extractedFacts: {},
    sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
    sourceAuthorityVersion: "v2",
    provenance: buildProvenance(file, "filename_heuristic", text),
    authorityBasis: "filename_heuristic",
  };
}

export function buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts) {
  const files = toArray(uploadedFiles).filter((file) => file && typeof file === "object");
  const artifacts = toArray(parsedArtifacts).filter((artifact) => artifact && typeof artifact === "object");
  const artifactsByFileId = new Map();
  const seenFileIds = new Set();

  for (const artifact of artifacts) {
    const fileId = String(artifact?.fileId ?? artifact?.file_id ?? artifact?.uploadedFileId ?? artifact?.uploaded_file_id ?? artifact?.id ?? "").trim();
    if (!fileId) continue;
    const bucket = artifactsByFileId.get(fileId) || [];
    bucket.push(artifact);
    artifactsByFileId.set(fileId, bucket);
  }

  const supportDocs = new Map();
  let coreT12 = null;
  let coreRentRoll = null;

  for (const file of files) {
    const fileId = getFileId(file);
    if (!fileId) continue;
    seenFileIds.add(fileId);
    const fileArtifacts = artifactsByFileId.get(fileId) || [];
    const authority = classifySupportDoc(file, fileArtifacts, artifactsByFileId);
    const originalFilename = getOriginalFilename(file, artifactsByFileId);

    if (authority.role === "core_t12") {
      coreT12 = {
        fileId,
        originalFilename,
        sourceKind: "core_t12",
        canonicalRole: "core_t12",
        canonicalLabel: authority.canonicalLabel,
        roleLabel: authority.roleLabel,
        treatment: authority.treatment,
        use: authority.use,
        category: authority.category,
        allowedUses: authority.allowedUses,
        forbiddenUses: authority.forbiddenUses,
        extractedFacts: authority.extractedFacts || {},
        sourceEvidence: authority.sourceEvidence || null,
        sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
        provenance: authority.provenance || null,
        role: "core_t12",
      };
      continue;
    }

    if (authority.role === "core_rent_roll") {
      coreRentRoll = {
        fileId,
        originalFilename,
        sourceKind: "core_rent_roll",
        canonicalRole: "core_rent_roll",
        canonicalLabel: authority.canonicalLabel,
        roleLabel: authority.roleLabel,
        treatment: authority.treatment,
        use: authority.use,
        category: authority.category,
        allowedUses: authority.allowedUses,
        forbiddenUses: authority.forbiddenUses,
        extractedFacts: authority.extractedFacts || {},
        sourceEvidence: authority.sourceEvidence || null,
        sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
        provenance: authority.provenance || null,
        role: "core_rent_roll",
      };
      continue;
    }

    supportDocs.set(fileId, {
      fileId,
      originalFilename,
      sourceKind: authority.sourceKind || "support_doc",
      canonicalRole: authority.role,
      canonicalLabel: authority.canonicalLabel || authority.roleLabel,
      roleLabel: authority.roleLabel,
      treatment: authority.treatment,
      use: authority.use,
      category: authority.category,
      allowedUses: authority.allowedUses || [],
      forbiddenUses: authority.forbiddenUses || [],
      extractedFacts: authority.extractedFacts || {},
      sourceEvidence: authority.sourceEvidence || null,
      sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
      provenance: authority.provenance || null,
      authorityBasis: authority.authorityBasis,
    });
  }

  for (const [fileId, fileArtifacts] of artifactsByFileId.entries()) {
    if (!fileId || seenFileIds.has(fileId)) continue;
    const primaryArtifact = fileArtifacts[0] || null;
    const originalFilename = getArtifactOriginalFilename(primaryArtifact);
    if (!originalFilename) continue;
    const syntheticFile = {
      fileId,
      id: fileId,
      originalFilename,
      mimeType: getArtifactMimeType(primaryArtifact),
      source_text: primaryArtifact?.source_text || primaryArtifact?.sourceText || primaryArtifact?.payload?.source_text || primaryArtifact?.payload?.sourceText || "",
      raw_text: primaryArtifact?.raw_text || primaryArtifact?.rawText || primaryArtifact?.payload?.raw_text || primaryArtifact?.payload?.rawText || "",
      notes: primaryArtifact?.notes || primaryArtifact?.payload?.notes || "",
      loan_terms_text: primaryArtifact?.loan_terms_text || primaryArtifact?.loanTermsText || primaryArtifact?.payload?.loan_terms_text || primaryArtifact?.payload?.loanTermsText || "",
      extracted_text: primaryArtifact?.extracted_text || primaryArtifact?.extractedText || primaryArtifact?.payload?.extracted_text || primaryArtifact?.payload?.extractedText || "",
      text: primaryArtifact?.text || primaryArtifact?.payload?.text || "",
      excerpt: primaryArtifact?.excerpt || primaryArtifact?.payload?.excerpt || "",
      document_text_extracted:
        primaryArtifact?.document_text_extracted ||
        primaryArtifact?.documentTextExtracted ||
        primaryArtifact?.payload?.document_text_extracted ||
        primaryArtifact?.payload?.documentTextExtracted ||
        "",
    };
    const authority = classifySupportDoc(syntheticFile, fileArtifacts, artifactsByFileId);
    if (authority.role === "core_t12") {
      if (!coreT12) {
        coreT12 = {
          fileId,
          originalFilename,
          sourceKind: "core_t12",
          canonicalRole: "core_t12",
          canonicalLabel: authority.canonicalLabel,
          roleLabel: authority.roleLabel,
          treatment: authority.treatment,
          use: authority.use,
          category: authority.category,
          allowedUses: authority.allowedUses,
          forbiddenUses: authority.forbiddenUses,
          extractedFacts: authority.extractedFacts || {},
          sourceEvidence: authority.sourceEvidence || null,
          sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
          provenance: authority.provenance || null,
          role: "core_t12",
        };
      }
      continue;
    }
    if (authority.role === "core_rent_roll") {
      if (!coreRentRoll) {
        coreRentRoll = {
          fileId,
          originalFilename,
          sourceKind: "core_rent_roll",
          canonicalRole: "core_rent_roll",
          canonicalLabel: authority.canonicalLabel,
          roleLabel: authority.roleLabel,
          treatment: authority.treatment,
          use: authority.use,
          category: authority.category,
          allowedUses: authority.allowedUses,
          forbiddenUses: authority.forbiddenUses,
          extractedFacts: authority.extractedFacts || {},
          sourceEvidence: authority.sourceEvidence || null,
          sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
          provenance: authority.provenance || null,
          role: "core_rent_roll",
        };
      }
      continue;
    }
    if (!supportDocs.has(fileId)) {
      supportDocs.set(fileId, {
        fileId,
        originalFilename,
        sourceKind: authority.sourceKind || "support_doc",
        canonicalRole: authority.role,
        canonicalLabel: authority.canonicalLabel || authority.roleLabel,
        roleLabel: authority.roleLabel,
        treatment: authority.treatment,
        use: authority.use,
        category: authority.category,
        allowedUses: authority.allowedUses || [],
        forbiddenUses: authority.forbiddenUses || [],
        extractedFacts: authority.extractedFacts || {},
        sourceEvidence: authority.sourceEvidence || null,
        sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
        provenance: authority.provenance || null,
        authorityBasis: authority.authorityBasis,
      });
    }
  }

  return {
    coreT12,
    coreRentRoll,
    supportDocs,
    authorityVersion: "v2",
  };
}
