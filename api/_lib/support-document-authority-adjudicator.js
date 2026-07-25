import { evaluateSupportDocumentSemanticFamilies } from "./support-doc-semantic-evidence.js";

export const SUPPORT_DOCUMENT_AUTHORITY_VERSION = "support_doc_authority_v2";

const FAMILY_ROLE_MAP = Object.freeze({
  acquisition_financing: "purchase_assumptions",
  current_debt: "current_debt_context",
  appraisal: "appraisal_context",
  market_survey: "market_survey_context",
  property_condition: "property_condition_context",
  historical_capital: "historical_capital_context",
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
  property_condition: [
    /property condition assessment/i,
    /physical needs assessment/i,
    /capital needs assessment/i,
    /building condition (?:assessment|report)/i,
    /(?:replacement|capital) reserve study/i,
  ],
  historical_capital: [/historical capex/i, /historical capital expenditures?/i, /completed capital improvements?/i],
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
  if (["property_condition", "property_condition_assessment", "physical_needs_assessment", "capital_needs_assessment"].includes(normalized)) {
    return "property_condition_context";
  }
  if (["historical_capex_only", "historical_capital", "historical_capital_context"].includes(normalized)) {
    return "historical_capital_context";
  }
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

function hasHistoricalCapitalOnlyEvidence(source) {
  const normalized = String(source || "").toLowerCase();
  const historical = /\b(?:historical capex|historical capital|completed capital improvements?|completed repairs?|prior capital improvements?|past renovations?)\b/.test(normalized);
  const capital = /\b(?:capex|capital expenditures?|capital improvements?|repairs?|renovations?)\b/.test(normalized);
  const forward = /\b(?:forward[-\s]*looking|proposed|planned|future scope|to be completed|implementation schedule|expected rent lift|months?\s*\d+\s*(?:-|to|through)\s*\d+)\b/.test(normalized);
  return historical && capital && !forward;
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

function finiteNonNegative(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function numericValues(value) {
  const values = [];
  const pattern = /(?:[$]\s*)?(-?\d[\d,]*(?:\.\d+)?)\s*([kKmMbB](?![A-Za-z]))?/g;
  for (const match of String(value || "").matchAll(pattern)) {
    const parsed = Number(String(match[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(parsed)) continue;
    const suffix = String(match[2] || "").toLowerCase();
    const multiplier = suffix === "k" ? 1000 : suffix === "m" ? 1000000 : suffix === "b" ? 1000000000 : 1;
    values.push(parsed * multiplier);
  }
  return values;
}

function monetaryValues(value) {
  const values = [];
  const pattern = /[$]\s*(-?\d[\d,]*(?:\.\d+)?)\s*([kKmMbB](?![A-Za-z]))?/g;
  for (const match of String(value || "").matchAll(pattern)) {
    const parsed = Number(String(match[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(parsed)) continue;
    const suffix = String(match[2] || "").toLowerCase();
    const multiplier = suffix === "k" ? 1000 : suffix === "m" ? 1000000 : suffix === "b" ? 1000000000 : 1;
    values.push(parsed * multiplier);
  }
  return values;
}

function factNumericValues(value, spec) {
  if (!spec?.money) return numericValues(value);
  const explicitMoney = monetaryValues(value);
  if (explicitMoney.length > 0) return explicitMoney;
  return numericValues(value).filter((numeric) => numeric === 0 || Math.abs(numeric) >= 1000);
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
  loan_term_years: { labels: [/loan\s+term/i, /term\s+to\s+maturity/i, /initial\s+term/i] },
  lender_fee_percent: { labels: [/lender\s+fee/i, /origination\s+fee/i, /financing\s+fee/i], percent: true },
  going_in_cap_rate: { labels: [/going[-\s]*in cap/i, /entry cap/i], percent: true },
  noi_basis: { labels: [/noi basis/i] },
  current_outstanding_balance: { labels: [/current outstanding balance/i, /current loan balance/i, /unpaid principal balance/i, /outstanding balance/i] },
  monthly_payment: { labels: [/monthly payment/i, /monthly debt service/i] },
  amortization_remaining_years: { labels: [/amortization remaining/i, /remaining amortization/i] },
  appraised_value: { labels: [/appraised value/i, /as[-\s]*is value/i, /opinion of value/i, /value conclusion/i] },
  appraisal_cap_rate: { labels: [/appraisal cap rate/i, /stabilized cap rate/i, /capitalization rate/i], percent: true },
  appraisal_noi: { labels: [/stabilized noi/i, /appraisal noi/i] },
  total_renovation_budget: { labels: [/total renovation budget/i, /renovation budget/i, /capex budget/i, /capital budget/i], money: true, sameLine: true },
  total_capital_plan_amount: {
    labels: [
      /total capital (?:plan|needs?|requirements?|budget)/i,
      /total (?:repair|replacement) (?:needs?|requirements?|budget)/i,
      /total recommended (?:repairs?|capital)/i,
      /capital plan total/i,
    ],
    money: true,
    allowZero: true,
    sameLine: true,
  },
  capital_reserve_balance: {
    labels: [
      /capital reserve balance/i,
      /replacement reserve balance/i,
      /reserve account balance/i,
      /available capital reserves?/i,
      /capital reserves? available/i,
    ],
    money: true,
    allowZero: true,
    sameLine: true,
  },
  annual_reserve_contribution: {
    labels: [
      /annual reserve contribution/i,
      /annual replacement reserve/i,
      /replacement reserve contribution/i,
      /annual capital reserve/i,
    ],
    money: true,
    allowZero: true,
    sameLine: true,
  },
  deferred_maintenance_amount: { labels: [/deferred maintenance/i], money: true, allowZero: true, sameLine: true },
  immediate_capital_amount: {
    labels: [/immediate capital needs?/i, /immediate repairs?/i, /year\s*0 capital/i, /capital required at acquisition/i],
    money: true,
    allowZero: true,
    sameLine: true,
  },
  near_term_capital_amount: {
    labels: [/near[-\s]*term capital needs?/i, /near[-\s]*term repairs?/i, /short[-\s]*term capital needs?/i, /short[-\s]*term repairs?/i],
    money: true,
    allowZero: true,
    sameLine: true,
  },
  long_term_capital_amount: {
    labels: [/long[-\s]*term capital needs?/i, /long[-\s]*term repairs?/i, /future capital needs?/i],
    money: true,
    allowZero: true,
    sameLine: true,
  },
  annual_tax: { labels: [/annual tax/i, /property tax/i, /tax amount/i, /total taxes/i] },
});

const RETURN_INPUT_FACT_SPECS = Object.freeze({
  purchase_assumptions: {
    closing_costs_percent: {
      labels: [/closing\s+costs?(?:\s+percent)?/i, /acquisition\s+closing\s+costs?/i],
      percent: true,
      allowZero: true,
      sameLine: true,
    },
  },
});

function labeledValueWindow(rawSourceText, labelIndex, labelLength, spec) {
  const afterLabel = rawSourceText.slice(labelIndex + labelLength, Math.min(rawSourceText.length, labelIndex + labelLength + 160));
  if (!spec?.sameLine) return afterLabel;
  const lines = afterLabel.split(/\r?\n/);
  const firstLine = lines[0] || "";
  if (factNumericValues(firstLine, spec).length > 0) return firstLine;
  const secondLine = lines[1] || "";
  if (/^\s*(?:[$]|-?\d)/.test(secondLine)) return `${firstLine}\n${secondLine}`;
  return firstLine;
}

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
      const valueWindow = labeledValueWindow(rawSourceText, index, match[0].length, spec);
      const excerpt = rawSourceText.slice(Math.max(0, index - 40), index + match[0].length) + valueWindow;
      const evidenceValues = factNumericValues(valueWindow, spec);
      if (evidenceValues.some((sourceValue) => numericMatches(candidate, sourceValue, spec.percent))) {
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
      const afterLabel = labeledValueWindow(rawSourceText, index, match[0].length, spec);
      const values = factNumericValues(afterLabel, spec);
      const acceptedValue = values.find((value) => spec.allowZero ? value >= 0 : value > 0);
      if (Number.isFinite(acceptedValue)) {
        return {
          value: acceptedValue,
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
    total_capital_plan_amount: ["total_capital_plan_amount", "total_capital_needs", "total_repair_requirements"],
    capital_reserve_balance: ["capital_reserve_balance", "replacement_reserve_balance", "reserve_balance"],
    annual_reserve_contribution: ["annual_reserve_contribution", "replacement_reserve_contribution"],
    deferred_maintenance_amount: ["deferred_maintenance_amount", "deferred_maintenance_cost"],
    immediate_capital_amount: ["immediate_capital_amount", "immediate_repairs_amount"],
    near_term_capital_amount: ["near_term_capital_amount", "short_term_capital_amount"],
    long_term_capital_amount: ["long_term_capital_amount", "future_capital_amount"],
  };
  const spec = FACT_SPECS[field] || {};
  for (const source of candidates) {
    for (const key of aliases[field] || [field]) {
      const value = spec.allowZero ? finiteNonNegative(source?.[key]) : finitePositive(source?.[key]);
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

function isNegatedCategoricalMatch(source, index) {
  const prefix = source.slice(Math.max(0, index - 30), index);
  return /\b(?:not|no)\s+(?:an?\s+)?$/i.test(prefix) || /\bnon[-\s]?$/i.test(prefix);
}

function categoricalMatches(source, patterns) {
  const matches = [];
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    for (const match of source.matchAll(matcher)) {
      const index = match.index || 0;
      if (isNegatedCategoricalMatch(source, index)) continue;
      matches.push({
        index,
        value: text(match[0]),
        excerpt: text(source.slice(Math.max(0, index - 30), Math.min(source.length, index + match[0].length + 50))),
      });
    }
  }
  return matches.sort((left, right) => left.index - right.index);
}

function rateStructureFromSource(rawSourceText) {
  const hybrid = categoricalMatches(rawSourceText, [
    /\bhybrid(?:\s+interest)?\s+rate\b/i,
    /\bfixed[-\s]+to[-\s]+(?:floating|variable|adjustable)(?:\s+rate)?\b/i,
    /\bfixed[-\s]+(?:interest[-\s]+)?rate\b[^\r\n]{0,100}\b(?:then|thereafter)\b[^\r\n]{0,60}\b(?:floating|variable|adjustable)(?:[-\s]+(?:interest[-\s]+)?rate)?\b/i,
    /\b(?:interest\s+)?rate\s+(?:is\s+)?fixed\b[^\r\n]{0,100}\b(?:then|thereafter)\b[^\r\n]{0,60}\b(?:floating|variable|adjustable)\b/i,
  ]);
  if (hybrid.length > 0) {
    return {
      accepted: true,
      value: "hybrid",
      evidence: {
        excerpt: hybrid[0].excerpt,
        method: "deterministic_categorical_source_binding",
        sourceValue: hybrid[0].value,
        normalizedValue: "hybrid",
      },
      ambiguity: null,
    };
  }

  const fixed = categoricalMatches(rawSourceText, [
    /\bfixed[-\s]+(?:interest[-\s]+)?rate\b/i,
    /\b(?:interest\s+)?rate\s+(?:is\s+)?fixed\b/i,
    /\b(?:rate\s+structure|interest\s+rate\s+type|rate\s+type)\s*[:\-]?\s*fixed\b/i,
  ]);
  const floating = categoricalMatches(rawSourceText, [
    /\b(?:floating|variable|adjustable)[-\s]+(?:interest[-\s]+)?rate\b/i,
    /\b(?:interest\s+)?rate\s+(?:is\s+)?(?:floating|variable|adjustable)\b/i,
    /\b(?:rate\s+structure|interest\s+rate\s+type|rate\s+type)\s*[:\-]?\s*(?:floating|variable|adjustable)\b/i,
  ]);
  if (fixed.length > 0 && floating.length > 0) {
    return {
      accepted: false,
      value: null,
      evidence: null,
      ambiguity: {
        reason: "conflicting_fixed_and_floating_rate_language",
        excerpts: [fixed[0].excerpt, floating[0].excerpt],
      },
    };
  }
  const acceptedMatch = fixed[0] || floating[0] || null;
  const normalizedValue = fixed.length > 0 ? "fixed" : floating.length > 0 ? "floating" : null;
  return {
    accepted: Boolean(acceptedMatch && normalizedValue),
    value: normalizedValue,
    evidence: acceptedMatch
      ? {
          excerpt: acceptedMatch.excerpt,
          method: "deterministic_categorical_source_binding",
          sourceValue: acceptedMatch.value,
          normalizedValue,
        }
      : null,
    ambiguity: null,
  };
}

function sourceExcerpt(source, index, length, before = 40, after = 100) {
  return text(source.slice(Math.max(0, index - before), Math.min(source.length, index + length + after)));
}

function normalizedEvidenceText(value) {
  return text(value).replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, " ").toLowerCase();
}

function exactEvidenceExcerpt(rawSourceText, excerpts) {
  const source = normalizedEvidenceText(rawSourceText);
  return toArray(excerpts)
    .map((excerpt) => text(excerpt))
    .find((excerpt) => excerpt && source.includes(normalizedEvidenceText(excerpt))) || null;
}

function renovationPlanRowsFromArtifacts(artifacts, rawSourceText) {
  const acceptedRows = [];
  const rowsByCategory = new Map();
  const ambiguities = [];
  for (const artifact of toArray(artifacts)) {
    const payload = payloadOf(artifact);
    const rows = Array.isArray(payload?.candidate_facts?.budget_rows)
      ? payload.candidate_facts.budget_rows
      : Array.isArray(payload?.budget_rows)
        ? payload.budget_rows
        : [];
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const category = text(row.category);
      const evidenceExcerpt = exactEvidenceExcerpt(rawSourceText, row.evidence);
      if (!category || !evidenceExcerpt) continue;
      const normalizedExcerpt = normalizedEvidenceText(evidenceExcerpt);
      if (!normalizedExcerpt.includes(normalizedEvidenceText(category))) continue;

      const accepted = { category };
      const unitType = text(row.unit_type);
      if (unitType && normalizedExcerpt.includes(normalizedEvidenceText(unitType))) accepted.unit_type = unitType;

      const categoryIndex = evidenceExcerpt.toLowerCase().indexOf(category.toLowerCase());
      const evidenceAfterCategory = categoryIndex >= 0
        ? evidenceExcerpt.slice(categoryIndex + category.length)
        : "";
      const unitCountMatch =
        evidenceAfterCategory.match(/^\s*(\d{1,5})\s+units?\b/i) ||
        evidenceExcerpt.match(/\b(\d{1,5})\s+units?\b/i);
      const unitCount = Number(unitCountMatch?.[1]);
      if (Number.isInteger(unitCount) && unitCount > 0 && Number(row.unit_count) === unitCount) {
        accepted.unit_count = unitCount;
      }

      const perUnitMatch = evidenceExcerpt.match(/[$]\s*([\d,]+(?:\.\d{1,2})?)\s*(?:\/\s*(?:unit|each)|per\s+(?:unit|each))/i);
      const costPerUnit = Number(String(perUnitMatch?.[1] || "").replace(/,/g, ""));
      if (Number.isFinite(costPerUnit) && costPerUnit > 0 && Number(row.cost_per_unit) === costPerUnit) {
        accepted.cost_per_unit = costPerUnit;
      }

      const rentLiftMatch = evidenceExcerpt.match(/(?:expected\s+)?rent\s+lift\s*[$]\s*([\d,]+(?:\.\d{1,2})?)\s*(?:\/\s*month|per\s+month)/i);
      const monthlyRentLift = Number(String(rentLiftMatch?.[1] || "").replace(/,/g, ""));
      if (Number.isFinite(monthlyRentLift) && monthlyRentLift >= 0 && Number(row.expected_monthly_rent_lift) === monthlyRentLift) {
        accepted.expected_monthly_rent_lift = monthlyRentLift;
      }

      const timingMatch = evidenceExcerpt.replace(/[\u2013\u2014]/g, "-").match(/\bmonths?\s*(\d{1,3})\s*(?:-|to|through)\s*(\d{1,3})\b/i);
      const startMonth = Number(timingMatch?.[1]);
      const endMonth = Number(timingMatch?.[2]);
      if (Number.isInteger(startMonth) && Number.isInteger(endMonth) && startMonth >= 0 && endMonth >= startMonth) {
        const candidateTiming = normalizedEvidenceText(row.phase_timing);
        if (!candidateTiming || candidateTiming.includes(String(startMonth)) && candidateTiming.includes(String(endMonth))) {
          accepted.start_month = startMonth;
          accepted.end_month = endMonth;
        }
      }

      const statedAmounts = monetaryValues(evidenceExcerpt);
      const candidateAmount = finitePositive(row.estimated_cost ?? row.total_cost ?? row.stated_amount);
      if (Number.isFinite(candidateAmount) && statedAmounts.some((value) => numericMatches(candidateAmount, value))) {
        accepted.stated_amount = candidateAmount;
      }

      if (Object.keys(accepted).length === 1) continue;
      const categoryKey = normalizedEvidenceText(category);
      const prior = rowsByCategory.get(categoryKey);
      if (prior) {
        const conflictingFields = Object.keys(accepted).filter((field) => (
          field !== "category" &&
          Object.prototype.hasOwnProperty.call(prior, field) &&
          JSON.stringify(prior[field]) !== JSON.stringify(accepted[field])
        ));
        if (conflictingFields.length > 0) {
          ambiguities.push({ category, evidenceExcerpt, conflictingFields });
          continue;
        }
        for (const [field, value] of Object.entries(accepted)) {
          if (!Object.prototype.hasOwnProperty.call(prior, field)) prior[field] = value;
        }
        continue;
      }
      const acceptedRow = {
        ...accepted,
        evidence: {
          excerpt: evidenceExcerpt,
          method: "deterministic_exact_renovation_row_binding",
        },
      };
      rowsByCategory.set(categoryKey, acceptedRow);
      acceptedRows.push(acceptedRow);
    }
  }
  if (ambiguities.length > 0) {
    return {
      rows: [],
      ambiguity: {
        reason: "conflicting_exact_renovation_rows",
        excerpts: ambiguities.map((entry) => entry.evidenceExcerpt),
      },
    };
  }
  return { rows: acceptedRows, ambiguity: null };
}

function marketRentRangesFromSource(rawSourceText) {
  const source = String(rawSourceText || "").replace(/[\u2013\u2014]/g, "-");
  const ranges = [];
  const byUnitType = new Map();
  const conflicts = [];
  const patterns = [
    {
      matcher: /\b(studio|efficiency|\d+\s*(?:br|bed(?:room)?s?))\b[^\r\n$]{0,80}[$]\s*([\d,]+(?:\.\d{1,2})?)\s*(?:-|to|through)\s*[$]\s*([\d,]+(?:\.\d{1,2})?)/gi,
      method: "deterministic_exact_market_range_binding",
    },
    {
      matcher: /\b(studio|efficiency|\d+\s*(?:br|bed(?:room)?s?))\b[^\r\n$]{0,40}\bmarket\s+rent\s+range\b[^\r\n$]{0,20}[$]\s*([\d,]+(?:\.\d{1,2})?)\s+[$]\s*([\d,]+(?:\.\d{1,2})?)/gi,
      method: "deterministic_labeled_market_range_table_binding",
    },
  ];
  for (const { matcher, method } of patterns) {
    for (const match of source.matchAll(matcher)) {
      const unitType = text(match[1]).replace(/\s+/g, "");
      const low = Number(String(match[2] || "").replace(/,/g, ""));
      const high = Number(String(match[3] || "").replace(/,/g, ""));
      if (!unitType || !Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high < low) continue;
      const value = { unit_type: unitType, low_monthly_rent: low, high_monthly_rent: high };
      const key = unitType.toLowerCase();
      const comparable = JSON.stringify(value);
      const prior = byUnitType.get(key);
      if (prior && prior !== comparable) {
        conflicts.push(sourceExcerpt(source, match.index || 0, match[0].length));
        continue;
      }
      if (prior) continue;
      byUnitType.set(key, comparable);
      ranges.push({
        ...value,
        evidence: {
          excerpt: sourceExcerpt(source, match.index || 0, match[0].length, 0, 0),
          method,
        },
      });
    }
  }
  if (conflicts.length > 0) {
    return {
      ranges: [],
      ambiguity: { reason: "conflicting_exact_market_rent_ranges", excerpts: conflicts },
    };
  }
  return { ranges, ambiguity: null };
}

function environmentalStatusFromSource(rawSourceText) {
  const source = String(rawSourceText || "");
  const noneMatches = collectPatternExcerpts(source, [
    /recognized environmental conditions?\s*[:\-]?\s*none identified(?:\s+in this summary)?/i,
  ]);
  const adverseMatches = collectPatternExcerpts(source, [
    /recognized environmental conditions?\s*[:\-]?\s*(?:one or more|identified|present)/i,
  ]);
  if (noneMatches.length > 0 && adverseMatches.length > 0) {
    return {
      value: null,
      evidence: null,
      ambiguity: {
        reason: "conflicting_rec_status",
        excerpts: [noneMatches[0], adverseMatches[0]],
      },
    };
  }
  if (noneMatches.length === 0) return { value: null, evidence: null, ambiguity: null };
  return {
    value: "none_identified_in_summary",
    evidence: {
      excerpt: noneMatches[0],
      method: "deterministic_exact_environmental_status_binding",
      sourceValue: "None identified in this summary",
      normalizedValue: "none_identified_in_summary",
    },
    ambiguity: null,
  };
}

function capitalPlanTimingFromSource(rawSourceText) {
  const source = String(rawSourceText || "").replace(/[\u2013\u2014]/g, "-");
  const ranges = [];
  const rangePattern = /\bmonths?\s*(\d{1,3})\s*(?:-|to|through)\s*(?:months?\s*)?(\d{1,3})\b/gi;
  for (const match of source.matchAll(rangePattern)) {
    const startMonth = Number(match[1]);
    const endMonth = Number(match[2]);
    if (!Number.isInteger(startMonth) || !Number.isInteger(endMonth) || startMonth < 0 || endMonth < startMonth || endMonth > 600) continue;
    ranges.push({
      startMonth,
      endMonth,
      excerpt: sourceExcerpt(source, match.index || 0, match[0].length),
    });
  }

  const explicitDurations = [];
  const durationPatterns = [
    /\b(\d{1,3})\s*[- ]\s*months?\s+(?:renovation|capital|capex|work|program|plan|schedule)\b/gi,
    /\b(?:duration|schedule|phasing|implementation(?: period)?)\s*[:\-]?\s*(\d{1,3})\s*months?\b/gi,
    /\bover\s+(?:a\s+)?(\d{1,3})\s*months?\b/gi,
  ];
  for (const pattern of durationPatterns) {
    for (const match of source.matchAll(pattern)) {
      const duration = Number(match[1]);
      if (!Number.isInteger(duration) || duration <= 0 || duration > 600) continue;
      explicitDurations.push({
        duration,
        excerpt: sourceExcerpt(source, match.index || 0, match[0].length),
      });
    }
  }

  const startMonth = ranges.length > 0 ? Math.min(...ranges.map((entry) => entry.startMonth)) : null;
  const endMonth = ranges.length > 0 ? Math.max(...ranges.map((entry) => entry.endMonth)) : null;
  const rangeDuration = Number.isInteger(startMonth) && startMonth <= 1 ? endMonth : null;
  const distinctExplicitDurations = [...new Set(explicitDurations.map((entry) => entry.duration))];
  const timingValues = [...new Set([
    Number.isInteger(rangeDuration) ? rangeDuration : null,
    ...distinctExplicitDurations,
  ].filter(Number.isInteger))];

  if (timingValues.length > 1) {
    return {
      acceptedFacts: {},
      factEvidence: {},
      ambiguity: {
        reason: "conflicting_capital_plan_timing_horizons",
        excerpts: [...ranges.map((entry) => entry.excerpt), ...explicitDurations.map((entry) => entry.excerpt)],
      },
    };
  }

  const durationMonths = timingValues[0] || null;
  const startEvidence = ranges.find((entry) => entry.startMonth === startMonth)?.excerpt || null;
  const endEvidence = ranges.find((entry) => entry.endMonth === endMonth)?.excerpt || null;
  const durationEvidence = explicitDurations.find((entry) => entry.duration === durationMonths)?.excerpt || endEvidence;
  const acceptedFacts = {};
  const factEvidence = {};
  if (Number.isInteger(startMonth)) {
    acceptedFacts.capital_plan_start_month = startMonth;
    factEvidence.capital_plan_start_month = {
      excerpt: startEvidence,
      method: "deterministic_relative_month_range_binding",
      sourceValue: startMonth,
      normalizedValue: startMonth,
    };
  }
  if (Number.isInteger(endMonth)) {
    acceptedFacts.capital_plan_end_month = endMonth;
    factEvidence.capital_plan_end_month = {
      excerpt: endEvidence,
      method: "deterministic_relative_month_range_binding",
      sourceValue: endMonth,
      normalizedValue: endMonth,
    };
  }
  if (Number.isInteger(durationMonths)) {
    acceptedFacts.capital_plan_duration_months = durationMonths;
    factEvidence.capital_plan_duration_months = {
      excerpt: durationEvidence,
      method: explicitDurations.length > 0
        ? "deterministic_explicit_duration_binding"
        : "deterministic_relative_plan_horizon_derivation",
      sourceValue: durationMonths,
      normalizedValue: durationMonths,
    };
  }
  return { acceptedFacts, factEvidence, ambiguity: null };
}

function collectPatternExcerpts(source, patterns) {
  const excerpts = [];
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    for (const match of source.matchAll(matcher)) {
      excerpts.push(sourceExcerpt(source, match.index || 0, match[0].length));
    }
  }
  return excerpts;
}

function deferredMaintenanceStatusFromSource(rawSourceText, acceptedAmount, amountEvidenceExcerpt = null) {
  const source = String(rawSourceText || "");
  const notAssessed = collectPatternExcerpts(source, [
    /deferred maintenance\s+(?:was\s+)?not assessed/i,
    /deferred maintenance\s*[:\-]?\s*(?:not assessed|not reviewed|unknown|not provided)/i,
  ]);
  const noneIdentified = collectPatternExcerpts(source, [
    /\bno(?:\s+material)?\s+deferred maintenance\b/i,
    /deferred maintenance\s*[:\-]?\s*(?:none|nil|zero)\b/i,
    /deferred maintenance\s+(?:was\s+)?not identified\b/i,
  ]);
  const identified = categoricalMatches(source, [
    /deferred maintenance\s+(?:was\s+)?(?:identified|noted|observed|reported|present|required)\b/i,
    /deferred maintenance\s*[:\-]\s*(?!none\b|nil\b|zero\b|not assessed\b|not reviewed\b|unknown\b|not provided\b)[^\r\n]{1,120}/i,
  ]).map((entry) => entry.excerpt);
  if (Number.isFinite(acceptedAmount) && text(amountEvidenceExcerpt)) {
    if (acceptedAmount > 0) identified.push(text(amountEvidenceExcerpt));
    if (acceptedAmount === 0) noneIdentified.push(text(amountEvidenceExcerpt));
  }
  if (notAssessed.length > 0 && noneIdentified.length === 0 && identified.length === 0) {
    return { accepted: false, value: null, evidence: null, ambiguity: null };
  }
  if (noneIdentified.length > 0 && identified.length > 0) {
    return {
      accepted: false,
      value: null,
      evidence: null,
      ambiguity: {
        reason: "conflicting_deferred_maintenance_status",
        excerpts: [noneIdentified[0], identified[0]],
      },
    };
  }
  const value = noneIdentified.length > 0 ? "none_identified" : identified.length > 0 ? "identified" : null;
  const excerpt = noneIdentified[0] || identified[0] || null;
  return {
    accepted: Boolean(value && excerpt),
    value,
    evidence: value && excerpt
      ? {
          excerpt,
          method: "deterministic_categorical_source_binding",
          sourceValue: value,
          normalizedValue: value,
        }
      : null,
    ambiguity: null,
  };
}

function acceptedFactsForRole(role, artifacts, rawSourceText) {
  const capitalConditionFacts = [
    "capital_reserve_balance",
    "annual_reserve_contribution",
    "deferred_maintenance_amount",
    "immediate_capital_amount",
    "near_term_capital_amount",
    "long_term_capital_amount",
  ];
  const fieldsByRole = {
    purchase_assumptions: ["purchase_price", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "loan_term_years", "lender_fee_percent", "going_in_cap_rate", "noi_basis"],
    current_debt_context: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment"],
    appraisal_context: ["appraised_value", "appraisal_cap_rate", "appraisal_noi", "capital_reserve_balance", "annual_reserve_contribution", "deferred_maintenance_amount"],
    property_condition_context: ["total_capital_plan_amount", ...capitalConditionFacts],
    renovation_capex_context: ["total_renovation_budget", ...capitalConditionFacts],
    property_tax_support: ["annual_tax"],
  };
  const acceptedFacts = {};
  const factEvidence = {};
  const factAmbiguities = {};
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
  if (["current_debt_context", "purchase_assumptions"].includes(role)) {
    const maturityMatch = rawSourceText.match(
      /maturity date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|[A-Za-z]{3,9}\s+\d{4})/i
    );
    if (maturityMatch?.[1]) {
      acceptedFacts.maturity_date = text(maturityMatch[1]);
      factEvidence.maturity_date = { excerpt: text(maturityMatch[0]), method: "deterministic_label_value_binding", sourceValue: acceptedFacts.maturity_date };
    }
    const rateStructure = rateStructureFromSource(rawSourceText);
    if (rateStructure.accepted) {
      acceptedFacts.rate_structure = rateStructure.value;
      factEvidence.rate_structure = rateStructure.evidence;
    } else if (rateStructure.ambiguity) {
      factAmbiguities.rate_structure = rateStructure.ambiguity;
    }
  }
  if (["property_condition_context", "renovation_capex_context"].includes(role)) {
    const timing = capitalPlanTimingFromSource(rawSourceText);
    Object.assign(acceptedFacts, timing.acceptedFacts);
    Object.assign(factEvidence, timing.factEvidence);
    if (timing.ambiguity) factAmbiguities.capital_plan_timing = timing.ambiguity;
  }
  if (role === "renovation_capex_context") {
    const renovationRows = renovationPlanRowsFromArtifacts(artifacts, rawSourceText);
    if (renovationRows.rows.length > 0) {
      acceptedFacts.renovation_plan_rows = renovationRows.rows.map(({ evidence, ...row }) => row);
      factEvidence.renovation_plan_rows = renovationRows.rows.map((row) => row.evidence);
    } else if (renovationRows.ambiguity) {
      factAmbiguities.renovation_plan_rows = renovationRows.ambiguity;
    }
  }
  if (role === "market_survey_context") {
    const marketRanges = marketRentRangesFromSource(rawSourceText);
    if (marketRanges.ranges.length > 0) {
      acceptedFacts.market_rent_ranges = marketRanges.ranges.map(({ evidence, ...range }) => range);
      factEvidence.market_rent_ranges = marketRanges.ranges.map((range) => range.evidence);
    } else if (marketRanges.ambiguity) {
      factAmbiguities.market_rent_ranges = marketRanges.ambiguity;
    }
  }
  if (role === "environmental_context") {
    const environmentalStatus = environmentalStatusFromSource(rawSourceText);
    if (environmentalStatus.value) {
      acceptedFacts.phase_i_status = environmentalStatus.value;
      factEvidence.phase_i_status = environmentalStatus.evidence;
    } else if (environmentalStatus.ambiguity) {
      factAmbiguities.phase_i_status = environmentalStatus.ambiguity;
    }
  }
  if (["appraisal_context", "property_condition_context", "renovation_capex_context"].includes(role)) {
    const deferredStatus = deferredMaintenanceStatusFromSource(
      rawSourceText,
      Number.isFinite(acceptedFacts.deferred_maintenance_amount)
        ? acceptedFacts.deferred_maintenance_amount
        : null,
      factEvidence.deferred_maintenance_amount?.excerpt || null
    );
    if (deferredStatus.accepted) {
      acceptedFacts.deferred_maintenance_status = deferredStatus.value;
      factEvidence.deferred_maintenance_status = deferredStatus.evidence;
    } else if (deferredStatus.ambiguity) {
      factAmbiguities.deferred_maintenance_status = deferredStatus.ambiguity;
    }
  }
  return { acceptedFacts, factEvidence, factAmbiguities };
}

function exactReturnInputFactsForRole(role, rawSourceText) {
  const acceptedReturnInputFacts = {};
  const acceptedReturnInputFactEvidence = {};
  const returnInputFactAmbiguities = {};
  for (const [field, spec] of Object.entries(RETURN_INPUT_FACT_SPECS[role] || {})) {
    const candidates = [];
    for (const label of spec.labels) {
      const flags = label.flags.includes("g") ? label.flags : `${label.flags}g`;
      const matcher = new RegExp(label.source, flags);
      for (const match of rawSourceText.matchAll(matcher)) {
        const index = match.index || 0;
        const valueWindow = labeledValueWindow(rawSourceText, index, match[0].length, spec);
        const excerpt = text(rawSourceText.slice(
          Math.max(0, index - 20),
          Math.min(rawSourceText.length, index + match[0].length + valueWindow.length)
        ));
        for (const sourceValue of factNumericValues(valueWindow, spec)) {
          if (spec.allowZero ? sourceValue < 0 : sourceValue <= 0) continue;
          candidates.push({
            sourceValue,
            normalizedValue: spec.percent ? sourceValue / 100 : sourceValue,
            excerpt,
          });
        }
      }
    }
    const distinctValues = [...new Set(candidates.map((candidate) => candidate.normalizedValue))];
    if (distinctValues.length > 1) {
      returnInputFactAmbiguities[field] = {
        reason: "conflicting_exact_source_values",
        excerpts: [...new Set(candidates.map((candidate) => candidate.excerpt))],
      };
      continue;
    }
    if (distinctValues.length !== 1) continue;
    const accepted = candidates.find((candidate) => candidate.normalizedValue === distinctValues[0]);
    acceptedReturnInputFacts[field] = accepted.normalizedValue;
    acceptedReturnInputFactEvidence[field] = {
      excerpt: accepted.excerpt,
      method: "deterministic_exact_return_input_label_value_binding",
      sourceValue: accepted.sourceValue,
      normalizedValue: accepted.normalizedValue,
    };
  }
  return {
    acceptedReturnInputFacts,
    acceptedReturnInputFactEvidence,
    returnInputFactAmbiguities,
  };
}

function sectionEligibilityFor(role, acceptedFacts, roleAccepted) {
  const has = (field) => acceptedFacts[field] !== null && acceptedFacts[field] !== undefined && acceptedFacts[field] !== "";
  return {
    acquisitionRequest: role === "purchase_assumptions" && roleAccepted && ["purchase_price", "noi_basis", "going_in_cap_rate", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"].every(has),
    proposedFinancing: role === "purchase_assumptions" && roleAccepted && ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"].every(has),
    currentDebt: role === "current_debt_context" && roleAccepted && ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"].every(has),
    appraisal: role === "appraisal_context" && roleAccepted && Object.keys(acceptedFacts).length > 0,
    propertyCondition: role === "property_condition_context" && roleAccepted && Object.keys(acceptedFacts).length > 0,
    historicalCapital: role === "historical_capital_context" && roleAccepted,
    renovation: role === "renovation_capex_context" && roleAccepted && Object.keys(acceptedFacts).length > 0,
    marketSurvey: role === "market_survey_context" && roleAccepted && Object.keys(acceptedFacts).length > 0,
    environmental: role === "environmental_context" && roleAccepted && Object.keys(acceptedFacts).length > 0,
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
  const historicalCapitalOnly = Boolean(
    hasHistoricalCapitalOnlyEvidence(rawSourceText) &&
    !acquisitionCoherent &&
    !currentDebtCoherent &&
    ["historical_capital", "renovation", "property_condition"].includes(top?.family)
  );
  const ambiguous = historicalCapitalOnly ? false : tied || mixedFinancing;
  const canonicalFamily = historicalCapitalOnly ? "historical_capital" : !ambiguous ? top?.family || null : null;
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
  const { acceptedFacts, factEvidence, factAmbiguities } = acceptedFactsForRole(canonicalRole, artifacts, rawSourceText);
  const {
    acceptedReturnInputFacts,
    acceptedReturnInputFactEvidence,
    returnInputFactAmbiguities,
  } = exactReturnInputFactsForRole(canonicalRole, rawSourceText);
  const contextualRole = ["market_survey_context", "environmental_context", "historical_debt_context", "historical_capital_context"].includes(canonicalRole);
  const financingDisclaimed = canonicalRole === "purchase_assumptions" && hasNonAuthoritativeFinancingDisclaimer(rawSourceText);
  const roleAccepted = mode === "active" && Boolean(canonicalRole) && !ambiguous && !financingDisclaimed && (
    contextualRole ||
    Object.keys(acceptedFacts).length > 0 ||
    Object.keys(acceptedReturnInputFacts).length > 0
  );
  const sectionEligibility = sectionEligibilityFor(canonicalRole, acceptedFacts, roleAccepted);
  const sourceBacked = roleAccepted && Object.values(sectionEligibility).some(Boolean);
  const returnInputSourceBacked = roleAccepted && Object.keys(acceptedReturnInputFacts).length > 0;
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
    factAmbiguities,
    acceptedReturnInputFacts,
    acceptedReturnInputFactEvidence,
    returnInputFactAmbiguities,
    returnInputSourceBacked,
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
