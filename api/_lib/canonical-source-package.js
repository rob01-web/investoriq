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

function hasPositiveCurrentDebtEvidence(text) {
  if (!text) return false;
  const hasDebtContext = /(existing current debt statement|current debt context|current debt terms|current mortgage|existing mortgage|existing debt|current debt|debt statement|debt context)/i.test(text);
  const hasDebtFinanceTerms = /(current outstanding balance|outstanding balance|interest rate|note rate|coupon rate|amortization|amortisation|monthly payment|maturity date|principal balance)/i.test(text);
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

  const filename = normalizeText(originalFilename);
  const hasAssumptionFilename = /\bassumption(s)?\b/.test(filename);
  const hasT12Filename = /\bt12\b|\btrailing\b/.test(filename);
  const hasRentRollFilename = /\brent[_\s-]?roll\b|\brentroll\b/.test(filename);
  const hasRenovationFilename = /\breno\b|\brenovation\b|\bcapex\b/.test(filename);
  const hasAppraisalFilename = /\bappraisal\b/.test(filename);
  const hasMarketSurveyFilename = /\bmarket\b|\bsurvey\b/.test(filename);
  const hasEnvironmentalFilename = /\besa\b|\bphase[_\s-]?i\b|\benvironmental\b|\bphase\b/.test(filename);

  const explicitSemanticRole = semanticRoles[0] || "";
  const explicitDebtBasis = debtBases[0] || "";
  const positiveCurrentDebtEvidence = hasPositiveCurrentDebtEvidence(text);
  const structuredRenovationEvidence = hasStructuredRenovationEvidence(text);
  if (hasT12Filename || (isSpreadsheetMimeType(mimeType) && explicitSemanticRole === "t12")) {
    return {
      role: "core_t12",
      roleLabel: "Core Quantitative Source — Trailing 12-Month Income Statement",
      treatment: "Primary quantitative input",
      use: "Core quantitative source; drives EGI, OpEx, NOI, and all income/expense modeling.",
      category: "Core Quantitative Input",
      authorityBasis: hasT12Filename ? "filename_heuristic" : "parser_semantic",
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
    };
  }

  if (
    explicitSemanticRole === "purchase_assumptions" ||
    explicitDebtBasis === "proposed_acquisition" ||
    hasAssumptionFilename
  ) {
    return {
      role: "purchase_assumptions",
      roleLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
      treatment: "Acquisition context received",
      use: "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.",
      category: "Acquisition Assumptions — Contextual",
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
    explicitSemanticRole === "current_debt" ||
    explicitDebtBasis === "current_debt" ||
    (positiveCurrentDebtEvidence && !hasAssumptionFilename)
  ) {
    return {
      role: "current_debt_context",
      roleLabel: "Existing Debt Context — Current Mortgage / Debt Statement",
      treatment: "Debt support received / contextual",
      use: "Uploaded existing/current debt context only; not proposed acquisition financing.",
      category: "Existing Debt — Contextual",
      authorityBasis:
        explicitDebtBasis === "current_debt"
          ? "debt_basis_signal"
          : explicitSemanticRole === "current_debt"
            ? "parser_semantic"
            : "keyword_match",
    };
  }

  if (
    explicitSemanticRole === "renovation_plan" ||
    hasRenovationFilename ||
    structuredRenovationEvidence
  ) {
    return {
      role: "structured_renovation_capex_plan",
      roleLabel: "Structured Renovation / CapEx Plan",
      treatment: "Renovation / CapEx context received",
      use: "Structured renovation scope, CapEx budget, rent-lift assumptions, and phasing acknowledged as source-transparent context.",
      category: "Renovation / CapEx — Contextual",
      authorityBasis: explicitSemanticRole === "renovation_plan" ? "parser_semantic" : hasRenovationFilename ? "filename_heuristic" : "keyword_match",
    };
  }

  if (explicitSemanticRole === "appraisal" || hasAppraisalFilename) {
    return {
      role: "appraisal_context",
      roleLabel: "Appraisal / Valuation Context",
      treatment: "Appraisal context received",
      use: "Third-party appraisal or valuation context; does not override T12 NOI, Rent Roll market rent, or cap-rate value framework.",
      category: "Appraisal — Contextual",
      authorityBasis: explicitSemanticRole === "appraisal" ? "parser_semantic" : "filename_heuristic",
    };
  }

  if (explicitSemanticRole === "market_survey" || hasMarketSurveyFilename) {
    return {
      role: "market_survey_context",
      roleLabel: "Market Rent Survey Context",
      treatment: "Market context received",
      use: "Market rent survey context; corroborates or informs rent gap analysis but does not override Rent Roll market rent inputs.",
      category: "Market Survey — Contextual",
      authorityBasis: explicitSemanticRole === "market_survey" ? "parser_semantic" : "filename_heuristic",
    };
  }

  if (
    explicitSemanticRole === "phase_i_esa" ||
    explicitSemanticRole === "environmental" ||
    hasEnvironmentalFilename
  ) {
    return {
      role: "environmental_context",
      roleLabel: "Environmental Due Diligence / Phase I ESA Context",
      treatment: "Environmental context received",
      use: "Phase I Environmental Site Assessment or environmental due diligence context; not a property tax document.",
      category: "Environmental — Contextual",
      authorityBasis: explicitSemanticRole === "phase_i_esa" || explicitSemanticRole === "environmental" ? "parser_semantic" : "filename_heuristic",
    };
  }

  return {
    role: "other_support",
    roleLabel: "Other Support Document",
    treatment: "Context only",
    use: "Listed for auditability only; not used quantitatively.",
    category: "Listed but Not Quantitatively Modeled",
    authorityBasis: "filename_heuristic",
  };
}

export function buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts) {
  const files = toArray(uploadedFiles).filter((file) => file && typeof file === "object");
  const artifacts = toArray(parsedArtifacts).filter((artifact) => artifact && typeof artifact === "object");
  const artifactsByFileId = new Map();

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
    const fileArtifacts = artifactsByFileId.get(fileId) || [];
    const authority = classifySupportDoc(file, fileArtifacts, artifactsByFileId);
    const originalFilename = getOriginalFilename(file, artifactsByFileId);

    if (authority.role === "core_t12") {
      coreT12 = { fileId, originalFilename, role: "core_t12" };
      continue;
    }

    if (authority.role === "core_rent_roll") {
      coreRentRoll = { fileId, originalFilename, role: "core_rent_roll" };
      continue;
    }

    supportDocs.set(fileId, {
      fileId,
      originalFilename,
      canonicalRole: authority.role,
      roleLabel: authority.roleLabel,
      treatment: authority.treatment,
      use: authority.use,
      category: authority.category,
      authorityBasis: authority.authorityBasis,
    });
  }

  return {
    coreT12,
    coreRentRoll,
    supportDocs,
    authorityVersion: "v2",
  };
}
