import { evaluateSupportDocumentSemanticFamilies } from "./support-doc-semantic-evidence.js";

export const SUPPORT_DOCUMENT_AUTHORITY_VERSION = "support_doc_authority_v1";

const FAMILY_ROLE_MAP = Object.freeze({
  acquisition_financing: "purchase_assumptions",
  current_debt: "current_debt_context",
  appraisal: "appraisal_context",
  market_survey: "market_survey_context",
  renovation: "renovation_capex_context",
  environmental: "environmental_context",
  property_tax: "property_tax_support",
  historical_debt: "historical_debt_context",
});

const FAMILY_ANCHORS = Object.freeze({
  acquisition_financing: [/purchase assumptions/i, /proposed acquisition financing/i, /proposed acquisition loan/i],
  current_debt: [/existing current debt/i, /current mortgage statement/i, /current debt context/i],
  appraisal: [/appraisal(?: summary| report)/i, /valuation report/i, /opinion of value/i],
  market_survey: [/market rent survey/i, /market survey/i, /rent comparables/i],
  renovation: [/renovation(?: plan| budget| scope)/i, /capital expenditure plan/i, /capex plan/i],
  environmental: [/phase\s*(?:i|1)\s*(?:esa|environmental site assessment)?/i, /environmental due diligence/i],
  property_tax: [/property tax (?:bill|notice|statement)/i, /assessment roll/i],
  historical_debt: [/discharged mortgage/i, /paid[-\s]*off (?:loan|mortgage|debt)/i, /historical debt/i, /former mortgage/i],
});

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return Array.from(value.values());
  return [];
}

function text(value) {
  return String(value ?? "").trim();
}

function fileIdOf(value = {}) {
  return text(
    value?.fileId ?? value?.file_id ?? value?.id ?? value?.payload?.file_id ?? value?.payload?.source_file_id
  );
}

function filenameOf(value = {}) {
  return text(
    value?.originalFilename ??
      value?.original_filename ??
      value?.filename ??
      value?.payload?.original_filename ??
      value?.payload?.source_original_filename
  );
}

function collectRawSourceText(file = {}, artifacts = []) {
  const parts = [];
  const push = (value) => {
    const normalized = text(value);
    if (normalized) parts.push(normalized);
  };
  for (const source of [file, ...toArray(artifacts)]) {
    if (!source || typeof source !== "object") continue;
    const payload = source?.payload && typeof source.payload === "object" ? source.payload : {};
    const artifactType = text(source?.type || payload?.type);
    const mayContainRawEvidence = !artifactType || artifactType === "document_text_extracted";
    if (!mayContainRawEvidence && source !== file) continue;
    for (const value of [
      source?.source_text,
      source?.raw_text,
      source?.extracted_text,
      source?.document_text_extracted,
      source?.text,
      source?.notes,
      payload?.source_text,
      payload?.raw_text,
      payload?.extracted_text,
      payload?.document_text_extracted,
      payload?.text,
      payload?.notes,
    ]) push(value);
  }
  return [...new Set(parts)].join("\n");
}

function legacyRoleOf(value = {}) {
  return text(
    value?.acceptedSemanticDocRole ??
      value?.accepted_semantic_doc_role ??
      value?.canonicalRole ??
      value?.canonical_role ??
      value?.semantic_doc_role ??
      value?.role
  ).toLowerCase();
}

function normalizeRole(role) {
  const normalized = text(role).toLowerCase();
  if (["mortgage_statement", "current_mortgage_statement", "current_debt", "current_debt_terms"].includes(normalized)) {
    return "current_debt_context";
  }
  if (["loan_term_sheet", "proposed_acquisition_financing"].includes(normalized)) return "purchase_assumptions";
  if (["appraisal", "appraisal_valuation_context"].includes(normalized)) return "appraisal_context";
  if (["market_survey"].includes(normalized)) return "market_survey_context";
  if (["structured_renovation", "structured_renovation_capex_plan"].includes(normalized)) return "renovation_capex_context";
  if (["environmental_due_diligence", "environmental_due_diligence_context"].includes(normalized)) return "environmental_context";
  if (["property_tax"].includes(normalized)) return "property_tax_support";
  return normalized || null;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function stableSourceFingerprint(value) {
  const source = String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return source ? `fnv1a:${(hash >>> 0).toString(16)}:${source.length}` : null;
}

function hasFamilyAnchor(family, source) {
  return (FAMILY_ANCHORS[family] || []).some((pattern) => pattern.test(source));
}

function rankSemanticFamilies(semanticEvidence, rawSourceText) {
  return Object.values(semanticEvidence?.families || {})
    .filter((entry) => entry.score > 0)
    .map((entry) => ({
      ...entry,
      hasAnchor: hasFamilyAnchor(entry.family, rawSourceText),
      adjudicationScore: entry.score + (hasFamilyAnchor(entry.family, rawSourceText) ? 10 : 0),
    }))
    .sort((left, right) => right.adjudicationScore - left.adjudicationScore || right.score - left.score || left.family.localeCompare(right.family));
}

function hasNonAuthoritativeFinancingDisclaimer(source) {
  return /\b(?:illustrative|example only|for discussion purposes|non[-\s]?binding|indicative only|not (?:a )?(?:commitment|credit approval|loan offer)|subject to lender approval|superseded|void)\b/i.test(source);
}

function payloadOf(artifact = {}) {
  return artifact?.payload && typeof artifact.payload === "object" && !Array.isArray(artifact.payload)
    ? artifact.payload
    : artifact;
}

function finitePositive(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function numericValues(value) {
  const values = [];
  const pattern = /(?:[$]\s*)?(-?\d[\d,]*(?:\.\d+)?)\s*([kKmMbB])?/g;
  for (const match of String(value || "").matchAll(pattern)) {
    const parsed = Number(String(match[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(parsed)) continue;
    const suffix = String(match[2] || "").toLowerCase();
    const multiplier = suffix === "k" ? 1000 : suffix === "m" ? 1000000 : suffix === "b" ? 1000000000 : 1;
    values.push(parsed * multiplier);
  }
  return values;
}

function numericMatches(candidate, sourceValue, percent = false) {
  const candidateValues = percent && candidate > 0 && candidate <= 1 ? [candidate, candidate * 100] : [candidate];
  return candidateValues.some((candidateValue) => {
    const tolerance = Math.max(0.000001, Math.abs(candidateValue) * 0.000001);
    return Math.abs(sourceValue - candidateValue) <= tolerance;
  });
}

const FACT_SPECS = Object.freeze({
  purchase_price: { labels: [/purchase\s+price/i, /acquisition\s+price/i, /contract\s+price/i] },
  proposed_loan_amount: { labels: [/proposed\s+acquisition\s+loan/i, /proposed\s+loan(?:\s+amount)?/i, /loan\s+amount/i] },
  ltv: { labels: [/\bl\s*\.?\s*t\s*\.?\s*v\b/i, /loan[-\s]*to[-\s]*value/i], percent: true },
  interest_rate: { labels: [/interest\s+rate/i, /note\s+rate/i, /coupon\s+rate/i, /proposed\s+rate/i], percent: true },
  amortization_years: { labels: [/amortization/i, /amortisation/i] },
  lender_fee_percent: { labels: [/lender\s+fee/i, /origination\s+fee/i, /financing\s+fee/i], percent: true },
  going_in_cap_rate: { labels: [/going[-\s]*in cap/i, /entry cap/i], percent: true },
  noi_basis: { labels: [/noi basis/i] },
  current_outstanding_balance: { labels: [/current outstanding balance/i, /current loan balance/i, /unpaid principal balance/i, /outstanding balance/i] },
  monthly_payment: { labels: [/monthly payment/i, /monthly debt service/i] },
  amortization_remaining_years: { labels: [/amortization remaining/i, /remaining amortization/i] },
  appraised_value: { labels: [/appraised value/i, /as[-\s]*is value/i, /opinion of value/i, /value conclusion/i] },
  appraisal_cap_rate: { labels: [/appraisal cap rate/i, /stabilized cap rate/i, /capitalization rate/i], percent: true },
  appraisal_noi: { labels: [/stabilized noi/i, /appraisal noi/i] },
  total_renovation_budget: { labels: [/total renovation budget/i, /renovation budget/i, /capex budget/i, /capital budget/i] },
  annual_tax: { labels: [/annual tax/i, /property tax/i, /tax amount/i, /total taxes/i] },
});

function evidenceFromCandidate(payload, field, candidate, rawSourceText, spec) {
  const evidenceObject = payload?.candidate_evidence || payload?.ai_recovery_evidence || {};
  const excerpts = Array.isArray(evidenceObject?.[field]) ? evidenceObject[field] : [];
  for (const excerpt of excerpts) {
    if (!text(excerpt) || !rawSourceText.toLowerCase().includes(text(excerpt).toLowerCase())) continue;
    if (numericValues(excerpt).some((sourceValue) => numericMatches(candidate, sourceValue, spec.percent))) {
      return { excerpt: text(excerpt), method: "candidate_excerpt_value_bound" };
    }
  }
  for (const label of spec.labels) {
    const flags = label.flags.includes("g") ? label.flags : `${label.flags}g`;
    const matcher = new RegExp(label.source, flags);
    for (const match of rawSourceText.matchAll(matcher)) {
      const index = match.index || 0;
      const excerpt = rawSourceText.slice(Math.max(0, index - 40), Math.min(rawSourceText.length, index + match[0].length + 140));
      if (numericValues(excerpt).some((sourceValue) => numericMatches(candidate, sourceValue, spec.percent))) {
        return { excerpt: text(excerpt), method: "deterministic_label_value_binding" };
      }
    }
  }
  return null;
}

function candidateFromLabeledSource(rawSourceText, spec) {
  for (const label of spec.labels) {
    const flags = label.flags.includes("g") ? label.flags : `${label.flags}g`;
    const matcher = new RegExp(label.source, flags);
    for (const match of rawSourceText.matchAll(matcher)) {
      const index = match.index || 0;
      const afterLabel = rawSourceText.slice(index + match[0].length, Math.min(rawSourceText.length, index + match[0].length + 120));
      const values = numericValues(afterLabel);
      if (values.length > 0 && values[0] > 0) {
        return {
          value: values[0],
          excerpt: text(rawSourceText.slice(Math.max(0, index - 20), Math.min(rawSourceText.length, index + match[0].length + 120))),
        };
      }
    }
  }
  return null;
}

function candidateValueForField(payload, field) {
  const candidates = payload?.candidate_facts && typeof payload.candidate_facts === "object"
    ? [payload.candidate_facts, payload]
    : [payload];
  const aliases = {
    proposed_loan_amount: ["proposed_loan_amount", "stated_acquisition_loan_amount", "loan_amount"],
    current_outstanding_balance: ["current_outstanding_balance", "current_loan_balance", "outstanding_balance"],
    amortization_remaining_years: ["amortization_remaining_years", "amortization_years", "amort_years"],
    appraised_value: ["appraised_value", "appraisal_value"],
    appraisal_cap_rate: ["stabilized_cap_rate", "cap_rate"],
    appraisal_noi: ["stabilized_noi", "noi"],
    total_renovation_budget: ["total_renovation_budget", "total_budget", "renovation_budget"],
  };
  for (const source of candidates) {
    for (const key of aliases[field] || [field]) {
      const value = finitePositive(source?.[key]);
      if (value != null) return value;
    }
  }
  return null;
}

function normalizeBoundFactValue(candidate, evidence, spec) {
  if (!spec?.percent) return candidate;
  if (String(evidence?.excerpt || "").includes("%")) {
    const sourcePercent = numericValues(evidence.excerpt).find((sourceValue) => numericMatches(candidate, sourceValue, true));
    if (Number.isFinite(sourcePercent)) return sourcePercent / 100;
  }
  return candidate > 1 ? candidate / 100 : candidate;
}

function acceptedFactsForRole(role, artifacts, rawSourceText) {
  const fieldsByRole = {
    purchase_assumptions: ["purchase_price", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent", "going_in_cap_rate", "noi_basis"],
    current_debt_context: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment"],
    appraisal_context: ["appraised_value", "appraisal_cap_rate", "appraisal_noi"],
    renovation_capex_context: ["total_renovation_budget"],
    property_tax_support: ["annual_tax"],
  };
  const acceptedFacts = {};
  const factEvidence = {};
  for (const field of fieldsByRole[role] || []) {
    const spec = FACT_SPECS[field];
    if (!spec) continue;
    for (const artifact of toArray(artifacts)) {
      const payload = payloadOf(artifact);
      const candidate = candidateValueForField(payload, field);
      if (candidate == null) continue;
      const evidence = evidenceFromCandidate(payload, field, candidate, rawSourceText, spec);
      if (!evidence) continue;
      const canonicalField = field === "appraised_value"
        ? "appraisal_value"
        : field === "appraisal_cap_rate"
        ? "stabilized_cap_rate"
        : field === "appraisal_noi"
          ? "stabilized_noi"
          : field;
      const normalizedCandidate = normalizeBoundFactValue(candidate, evidence, spec);
      acceptedFacts[canonicalField] = normalizedCandidate;
      factEvidence[canonicalField] = { ...evidence, sourceValue: candidate, normalizedValue: normalizedCandidate };
      break;
    }
    const canonicalField = field === "appraised_value"
      ? "appraisal_value"
      : field === "appraisal_cap_rate"
        ? "stabilized_cap_rate"
        : field === "appraisal_noi"
          ? "stabilized_noi"
          : field;
    if (!(canonicalField in acceptedFacts)) {
      const direct = candidateFromLabeledSource(rawSourceText, spec);
      if (direct) {
        const normalizedDirectValue = spec.percent ? direct.value / 100 : direct.value;
        acceptedFacts[canonicalField] = normalizedDirectValue;
        factEvidence[canonicalField] = {
          excerpt: direct.excerpt,
          method: "deterministic_label_value_binding",
          sourceValue: direct.value,
          normalizedValue: normalizedDirectValue,
        };
      }
    }
  }
  if (role === "current_debt_context") {
    const maturityMatch = rawSourceText.match(
      /maturity date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|[A-Za-z]{3,9}\s+\d{4})/i
    );
    if (maturityMatch?.[1]) {
      acceptedFacts.maturity_date = text(maturityMatch[1]);
      factEvidence.maturity_date = { excerpt: text(maturityMatch[0]), method: "deterministic_label_value_binding", sourceValue: acceptedFacts.maturity_date };
    }
  }
  return { acceptedFacts, factEvidence };
}

function sectionEligibilityFor(role, acceptedFacts, roleAccepted) {
  const has = (field) => acceptedFacts[field] !== null && acceptedFacts[field] !== undefined && acceptedFacts[field] !== "";
  return {
    acquisitionRequest: role === "purchase_assumptions" && roleAccepted && ["purchase_price", "noi_basis", "going_in_cap_rate", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"].every(has),
    proposedFinancing: role === "purchase_assumptions" && roleAccepted && ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"].every(has),
    currentDebt: role === "current_debt_context" && roleAccepted && ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"].every(has),
    appraisal: role === "appraisal_context" && roleAccepted && Object.keys(acceptedFacts).length > 0,
    renovation: role === "renovation_capex_context" && roleAccepted && Object.keys(acceptedFacts).length > 0,
    marketSurvey: role === "market_survey_context" && roleAccepted,
    environmental: role === "environmental_context" && roleAccepted,
    propertyTax: role === "property_tax_support" && roleAccepted && Object.keys(acceptedFacts).length > 0,
  };
}

export function buildSupportDocumentAuthorityDecision({ file = {}, artifacts = [], mode = "shadow" } = {}) {
  const fileId = fileIdOf(file) || toArray(artifacts).map(fileIdOf).find(Boolean) || null;
  const originalFilename = filenameOf(file) || toArray(artifacts).map(filenameOf).find(Boolean) || null;
  const rawSourceText = collectRawSourceText(file, artifacts);
  const semanticEvidence = evaluateSupportDocumentSemanticFamilies(rawSourceText);
  const ranked = rankSemanticFamilies(semanticEvidence, rawSourceText);
  const top = ranked[0] || null;
  const second = ranked[1] || null;
  const tied = Boolean(top && second && top.adjudicationScore === second.adjudicationScore);
  const acquisitionEvidence = semanticEvidence.families.acquisition_financing;
  const currentDebtEvidence = semanticEvidence.families.current_debt;
  const acquisitionCoherent = Boolean(
    acquisitionEvidence?.hasAffirmativeEvidence &&
      (hasFamilyAnchor("acquisition_financing", rawSourceText) || acquisitionEvidence.score >= 2)
  );
  const currentDebtCoherent = Boolean(
    currentDebtEvidence?.hasAffirmativeEvidence &&
      (hasFamilyAnchor("current_debt", rawSourceText) || currentDebtEvidence.score >= 1)
  );
  const mixedFinancing = Boolean(
    acquisitionCoherent && currentDebtCoherent
  );
  const ambiguous = tied || mixedFinancing;
  const canonicalFamily = !ambiguous ? top?.family || null : null;
  const canonicalRole = canonicalFamily ? FAMILY_ROLE_MAP[canonicalFamily] || null : null;
  const sourcePresent = Boolean(fileId || originalFilename || rawSourceText);
  const candidateState = !sourcePresent
    ? "missing"
    : !rawSourceText
      ? "unreadable"
      : ambiguous
        ? "ambiguous"
        : canonicalRole
          ? "candidate_supported"
          : "unclassified";
  const { acceptedFacts, factEvidence } = acceptedFactsForRole(canonicalRole, artifacts, rawSourceText);
  const contextualRole = ["market_survey_context", "environmental_context", "historical_debt_context"].includes(canonicalRole);
  const financingDisclaimed = canonicalRole === "purchase_assumptions" && hasNonAuthoritativeFinancingDisclaimer(rawSourceText);
  const roleAccepted = mode === "active" && Boolean(canonicalRole) && !ambiguous && !financingDisclaimed && (contextualRole || Object.keys(acceptedFacts).length > 0);
  const sectionEligibility = sectionEligibilityFor(canonicalRole, acceptedFacts, roleAccepted);
  const sourceBacked = roleAccepted && Object.values(sectionEligibility).some(Boolean);
  const adjudicationState = mode !== "active"
    ? candidateState
    : ambiguous
      ? "ambiguous"
      : roleAccepted
        ? sourceBacked ? "accepted" : "accepted_constrained"
        : candidateState === "unreadable" ? "unreadable" : "rejected";

  return deepFreeze({
    authorityVersion: SUPPORT_DOCUMENT_AUTHORITY_VERSION,
    mode,
    fileId,
    originalFilename,
    sourcePresent,
    sourceFingerprint: stableSourceFingerprint(rawSourceText),
    extractionState: rawSourceText ? "text_available" : "text_unavailable",
    adjudicationState,
    canonicalFamily,
    canonicalRole,
    roleAccepted,
    acceptedFacts,
    acceptedFactEvidence: factEvidence,
    sourceBacked,
    sectionDisplayReady: sourceBacked,
    sectionEligibility,
    ambiguity: {
      present: ambiguous || financingDisclaimed,
      reasons: [
        tied ? "family_score_tie" : null,
        mixedFinancing ? "mixed_current_and_proposed_financing" : null,
        financingDisclaimed ? "financing_terms_non_authoritative" : null,
      ].filter(Boolean),
    },
    semanticEvidence,
    candidateMetadata: {
      filename: originalFilename,
      parserArtifactTypes: [...new Set(toArray(artifacts).map((artifact) => text(artifact?.type)).filter(Boolean))],
      parserRoles: [...new Set(toArray(artifacts).map((artifact) => normalizeRole(legacyRoleOf(artifact?.payload || artifact))).filter(Boolean))],
    },
  });
}

export function adjudicateSupportDocumentAuthority(args = {}) {
  return buildSupportDocumentAuthorityDecision({ ...args, mode: "active" });
}

export function buildSupportDocumentAuthorityShadowComparison({ file = {}, artifacts = [], legacyDecision = null } = {}) {
  const shadowDecision = buildSupportDocumentAuthorityDecision({ file, artifacts });
  const legacyRole = normalizeRole(legacyRoleOf(legacyDecision || {}));
  return deepFreeze({
    authorityVersion: SUPPORT_DOCUMENT_AUTHORITY_VERSION,
    mode: "shadow_comparison",
    fileId: shadowDecision.fileId,
    legacy: {
      role: legacyRole,
    },
    shadow: shadowDecision,
    agreement: Boolean(legacyRole && shadowDecision.canonicalRole && legacyRole === shadowDecision.canonicalRole),
    disagreementReasons: [
      legacyRole && shadowDecision.canonicalRole && legacyRole !== shadowDecision.canonicalRole ? "role_disagreement" : null,
      legacyRole && !shadowDecision.canonicalRole ? "legacy_role_without_shadow_support" : null,
      !legacyRole && shadowDecision.canonicalRole ? "shadow_role_without_legacy_role" : null,
      shadowDecision.ambiguity.present ? "shadow_ambiguity" : null,
    ].filter(Boolean),
    affectsAcceptedAuthority: false,
  });
}
