import { classifyOpenAiError } from "./openai-error-classifier.js";

const OPENAI_MODEL = process.env.OPENAI_SUPPORT_DOC_RECOVERY_MODEL || 'gpt-4o-mini';
const FEATURE_ENABLED = process.env.ENABLE_AI_SUPPORT_DOC_RECOVERY === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TIMEOUT_MS = Math.min(
  55000,
  Math.max(10000, Number(process.env.OPENAI_SUPPORT_DOC_RECOVERY_TIMEOUT_MS) || 55000)
);

const MAX_TEXT_CHARS = 16000;
const MIN_CONFIDENCE = 0.9;
const MAX_PURCHASE_PRICE = 1000000000;
const MAX_APPRAISED_VALUE = MAX_PURCHASE_PRICE;
const MAX_RENOVATION_BUDGET = 1000000000;
const MAX_PROPERTY_TAX = 10000000;

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normalizeComparableText = (value) => normalizeText(value).toLowerCase();

const clampText = (value, limit) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > limit ? text.slice(0, limit) : text;
};

const parseNumberLike = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  if (!text) return null;
  const cleaned = text.replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeEvidenceArray = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => normalizeText(entry))
    .filter(Boolean);

const evidenceMatchesSource = (excerpt, sourceText) => {
  const normalizedExcerpt = normalizeComparableText(excerpt);
  const normalizedSource = normalizeComparableText(sourceText);
  if (!normalizedExcerpt || !normalizedSource) return false;
  return normalizedSource.includes(normalizedExcerpt);
};

const parseDateLike = (value) => {
  const text = normalizeText(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(text)) return text;
  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(text)) return text;
  if (/^\d{4}$/.test(text)) return text;
  return null;
};

export function shouldAttemptAcquisitionPurchaseAssumptionsRecovery(text) {
  const source = String(text || '');
  const normalized = normalizeComparableText(source);
  if (!normalized) return false;

  const hasPurchasePrice = /\b(?:purchase price|acquisition price|contract price|offer price)\b/i.test(source);
  if (!hasPurchasePrice) return false;

  const acquisitionSignals = [
    /\b(?:loan\s*to\s*value|loan-to-value|ltv)\b/i,
    /\b(?:interest\s*rate|note\s*rate|coupon\s*rate|financing)\b/i,
    /\b(?:amortization|amortisation|amort)\b/i,
    /\b(?:closing\s*costs?|transaction\s*costs?|acquisition\s*costs?)\b/i,
    /\b(?:going[-\s]*in\s*cap\s*rate|entry\s*cap\s*rate|purchase\s*cap\s*rate)\b/i,
    /\b(?:cmhc|select|term\s*sheet|purchase\s*assumptions?)\b/i,
  ];
  const signalCount = acquisitionSignals.reduce((count, pattern) => count + (pattern.test(source) ? 1 : 0), 0);
  if (signalCount < 2) return false;

  const hasNumericFinancingSignal =
    /\b\d+(?:\.\d+)?\s*%/.test(source) ||
    /\b\d+\s*(?:years?|yrs?|yr)\b/i.test(source) ||
    /\$\s*[\d,]+(?:\.\d{2})?/.test(source);
  return hasNumericFinancingSignal;
}

export function shouldAttemptCurrentMortgageRecovery(text) {
  const source = String(text || '');
  const normalized = normalizeComparableText(source);
  if (!normalized) return false;

  const currentDebtLanguage = [
    /\bcurrent\s+(?:mortgage|debt|balance|loan|outstanding)\b/i,
    /\bexisting\s+(?:mortgage|loan|debt|balance)\b/i,
    /\btrue\s+current\s+debt\b/i,
    /\bcurrent\s+outstanding\s+(?:principal\s+)?balance\b/i,
    /\bunpaid\s+principal\s+balance\b/i,
    /\boutstanding\s+principal\s+balance\b/i,
    /\bcurrent\s+loan\s+balance\b/i,
    /\bmortgage\s+balance\b/i,
    /\bremaining\s+balance\b/i,
  ];
  if (!currentDebtLanguage.some((pattern) => pattern.test(source))) return false;

  const acquisitionLanguage = [
    /\bpurchase\s+price\b/i,
    /\bacquisition\b/i,
    /\bproposed\b/i,
    /\bindicative\b/i,
    /\bltv\b/i,
    /\bloan[-\s]*to[-\s]*value\b/i,
    /\bterm\s+sheet\b/i,
  ];
  if (acquisitionLanguage.some((pattern) => pattern.test(source))) {
    const hasOverrideContext =
      /\bcurrent\s+(?:mortgage|debt|balance|loan|outstanding)\b/i.test(source) ||
      /\bcurrent\s+outstanding\s+(?:principal\s+)?balance\b/i.test(source);
    if (!hasOverrideContext) return false;
  }

  const hasNumericSignal =
    /\b\d+(?:\.\d+)?\s*%/.test(source) ||
    /\$\s*[\d,]+(?:\.\d{2})?/.test(source) ||
    /\b\d+\s*(?:years?|yrs?|yr)\b/i.test(source) ||
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(source) ||
    /\b[A-Za-z]{3,9}\s+\d{4}\b/.test(source);
  return hasNumericSignal;
}

export function shouldAttemptRenovationRecovery(text) {
  const source = String(text || '');
  const normalized = normalizeComparableText(source);
  if (!normalized) return false;
  const hasRenovationSignal =
    /\b(?:renovation|capex|cap ex|capital expenditure|capital budget|scope of work|unit turns|phasing|rent lift|roi|payback)\b/i.test(source);
  if (!hasRenovationSignal) return false;
  return (
    /\$\s*[\d,]+(?:\.\d{2})?/.test(source) ||
    /\b\d+(?:\.\d+)?\s*%/.test(source) ||
    /\b\d+\s*(?:units?|beds?|apartments?|suites?)\b/i.test(source) ||
    /\b\d+\s*(?:months?|years?|yrs?|yr)\b/i.test(source)
  );
}

export function shouldAttemptPropertyTaxRecovery(text) {
  const source = String(text || '');
  const normalized = normalizeComparableText(source);
  if (!normalized) return false;
  const hasTaxSignal = /\b(?:property tax|municipal tax|realty tax|tax notice|tax bill|annual tax|annual taxes|roll number|assessment roll)\b/i.test(source);
  if (!hasTaxSignal) return false;
  return /\$\s*[\d,]+(?:\.\d{2})?/.test(source) || /\b\d{4}\b/.test(source) || /\b[\w-]{4,}\b/.test(source);
}

export function shouldAttemptAppraisalRecovery(text) {
  const source = String(text || '');
  const normalized = normalizeComparableText(source);
  if (!normalized) return false;

  const hasAppraisalLanguage =
    /\b(?:appraisal|appraised value|as[-\s]*is value|stabilized value|value conclusion|opinion of value|valuation report|appraisal report|broker opinion|market survey|valuation)\b/i.test(source);
  if (!hasAppraisalLanguage) return false;

  const hasNumericSignal =
    /\$\s*[\d,]+(?:\.\d{2})?/.test(source) ||
    /\b\d+(?:\.\d+)?\s*%/.test(source) ||
    /\b\d{4}\b/.test(source) ||
    /\b\d+\s*(?:units?|beds?|apartments?|suites?)\b/i.test(source);
  return hasNumericSignal;
}

const buildResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: [
    'is_acquisition_purchase_assumptions',
    'confidence',
    'purchase_price',
    'ltv',
    'interest_rate',
    'amortization_years',
    'going_in_cap_rate',
    'closing_costs_percent',
    'evidence',
  ],
  properties: {
    is_acquisition_purchase_assumptions: { type: 'boolean' },
    confidence: { type: 'number' },
    purchase_price: { type: ['number', 'null'] },
    ltv: { type: ['number', 'null'] },
    interest_rate: { type: ['number', 'null'] },
    amortization_years: { type: ['number', 'null'] },
    going_in_cap_rate: { type: ['number', 'null'] },
    closing_costs_percent: { type: ['number', 'null'] },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: [
        'purchase_price',
        'ltv',
        'interest_rate',
        'amortization_years',
        'going_in_cap_rate',
        'closing_costs_percent',
        'warnings',
      ],
      properties: {
        purchase_price: { type: 'array', items: { type: 'string' } },
        ltv: { type: 'array', items: { type: 'string' } },
        interest_rate: { type: 'array', items: { type: 'string' } },
        amortization_years: { type: 'array', items: { type: 'string' } },
        going_in_cap_rate: { type: 'array', items: { type: 'string' } },
        closing_costs_percent: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  },
});

const buildCurrentMortgageResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: [
    'is_current_mortgage',
    'confidence',
    'outstanding_balance',
    'monthly_payment',
    'annual_debt_service',
    'interest_rate',
    'amortization_years',
    'maturity_date',
    'lender_name',
    'evidence',
  ],
  properties: {
    is_current_mortgage: { type: 'boolean' },
    confidence: { type: 'number' },
    outstanding_balance: { type: ['number', 'null'] },
    monthly_payment: { type: ['number', 'null'] },
    annual_debt_service: { type: ['number', 'null'] },
    interest_rate: { type: ['number', 'null'] },
    amortization_years: { type: ['number', 'null'] },
    maturity_date: { type: ['string', 'null'] },
    lender_name: { type: ['string', 'null'] },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: [
        'outstanding_balance',
        'monthly_payment',
        'annual_debt_service',
        'interest_rate',
        'amortization_years',
        'maturity_date',
        'lender_name',
        'warnings',
      ],
      properties: {
        outstanding_balance: { type: 'array', items: { type: 'string' } },
        monthly_payment: { type: 'array', items: { type: 'string' } },
        annual_debt_service: { type: 'array', items: { type: 'string' } },
        interest_rate: { type: 'array', items: { type: 'string' } },
        amortization_years: { type: 'array', items: { type: 'string' } },
        maturity_date: { type: 'array', items: { type: 'string' } },
        lender_name: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  },
});

const buildRenovationResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: [
    'is_renovation_capex',
    'confidence',
    'total_budget',
    'budget_rows',
    'unit_count',
    'per_unit_cost',
    'timing_or_phasing',
    'rent_lift',
    'roi',
    'payback_period',
    'evidence',
  ],
  properties: {
    is_renovation_capex: { type: 'boolean' },
    confidence: { type: 'number' },
    total_budget: { type: ['number', 'null'] },
    budget_rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'category',
          'scope',
          'unit_type',
          'unit_count',
          'estimated_cost',
          'cost_per_unit',
          'scope_of_work',
          'expected_monthly_rent_lift',
          'phase_timing',
          'timing_or_phasing',
          'total_budget',
          'evidence',
        ],
        properties: {
          category: { type: ['string', 'null'] },
          scope: { type: ['string', 'null'] },
          unit_type: { type: ['string', 'null'] },
          unit_count: { type: ['number', 'null'] },
          estimated_cost: { type: ['number', 'null'] },
          cost_per_unit: { type: ['number', 'null'] },
          scope_of_work: { type: ['string', 'null'] },
          expected_monthly_rent_lift: { type: ['number', 'null'] },
          phase_timing: { type: ['string', 'null'] },
          timing_or_phasing: { type: ['string', 'null'] },
          total_budget: { type: ['number', 'null'] },
          evidence: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    unit_count: { type: ['number', 'null'] },
    per_unit_cost: { type: ['number', 'null'] },
    timing_or_phasing: { type: ['string', 'null'] },
    rent_lift: { type: ['string', 'null'] },
    roi: { type: ['string', 'null'] },
    payback_period: { type: ['string', 'null'] },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: [
        'total_budget',
        'budget_rows',
        'unit_count',
        'per_unit_cost',
        'timing_or_phasing',
        'rent_lift',
        'roi',
        'payback_period',
        'warnings',
      ],
      properties: {
        total_budget: { type: 'array', items: { type: 'string' } },
        budget_rows: { type: 'array', items: { type: 'string' } },
        unit_count: { type: 'array', items: { type: 'string' } },
        per_unit_cost: { type: 'array', items: { type: 'string' } },
        timing_or_phasing: { type: 'array', items: { type: 'string' } },
        rent_lift: { type: 'array', items: { type: 'string' } },
        roi: { type: 'array', items: { type: 'string' } },
        payback_period: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  },
});

const buildPropertyTaxResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: [
    'is_property_tax',
    'confidence',
    'annual_tax',
    'tax_year',
    'assessed_value',
    'roll_number',
    'evidence',
  ],
  properties: {
    is_property_tax: { type: 'boolean' },
    confidence: { type: 'number' },
    annual_tax: { type: ['number', 'null'] },
    tax_year: { type: ['string', 'null'] },
    assessed_value: { type: ['number', 'null'] },
    roll_number: { type: ['string', 'null'] },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: ['annual_tax', 'tax_year', 'assessed_value', 'roll_number', 'warnings'],
      properties: {
        annual_tax: { type: 'array', items: { type: 'string' } },
        tax_year: { type: 'array', items: { type: 'string' } },
        assessed_value: { type: 'array', items: { type: 'string' } },
        roll_number: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  },
});

const buildAppraisalResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: [
    'is_appraisal_support',
    'confidence',
    'appraised_value',
    'valuation_date',
    'cap_rate',
    'effective_gross_income',
    'noi',
    'value_basis',
    'appraisal_type',
    'evidence',
  ],
  properties: {
    is_appraisal_support: { type: 'boolean' },
    confidence: { type: 'number' },
    appraised_value: { type: ['number', 'null'] },
    valuation_date: { type: ['string', 'null'] },
    cap_rate: { type: ['number', 'null'] },
    effective_gross_income: { type: ['number', 'null'] },
    noi: { type: ['number', 'null'] },
    value_basis: { type: ['string', 'null'] },
    appraisal_type: { type: ['string', 'null'] },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: [
        'appraised_value',
        'valuation_date',
        'cap_rate',
        'effective_gross_income',
        'noi',
        'value_basis',
        'appraisal_type',
        'warnings',
      ],
      properties: {
        appraised_value: { type: 'array', items: { type: 'string' } },
        valuation_date: { type: 'array', items: { type: 'string' } },
        cap_rate: { type: 'array', items: { type: 'string' } },
        effective_gross_income: { type: 'array', items: { type: 'string' } },
        noi: { type: 'array', items: { type: 'string' } },
        value_basis: { type: 'array', items: { type: 'string' } },
        appraisal_type: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  },
});

const validateFieldEvidence = (fieldName, candidateValue, sourceText, evidenceObject) => {
  if (!Number.isFinite(candidateValue)) return null;
  const evidence = normalizeEvidenceArray(evidenceObject?.[fieldName]);
  const acceptedEvidence = evidence.find((excerpt) => evidenceMatchesSource(excerpt, sourceText)) || null;
  if (!acceptedEvidence) return null;
  return {
    value: candidateValue,
    evidence: [acceptedEvidence],
  };
};

const validateStringEvidence = (fieldName, candidateValue, sourceText, evidenceObject) => {
  const text = normalizeText(candidateValue);
  if (!text) return null;
  const evidence = normalizeEvidenceArray(evidenceObject?.[fieldName]);
  const acceptedEvidence = evidence.find((excerpt) => evidenceMatchesSource(excerpt, sourceText)) || null;
  if (!acceptedEvidence) return null;
  return {
    value: text,
    evidence: [acceptedEvidence],
  };
};

const validateEvidenceString = (fieldName, candidateValue, sourceText, evidenceObject) => {
  const value = normalizeText(candidateValue);
  if (!value) return null;
  const evidence = normalizeEvidenceArray(evidenceObject?.[fieldName]);
  const acceptedEvidence = evidence.find((excerpt) => evidenceMatchesSource(excerpt, sourceText)) || null;
  if (!acceptedEvidence) return null;
  return { value, evidence: [acceptedEvidence] };
};

const validateBudgetRowEvidence = (row, sourceText) => {
  const rowDiagnostics = {
    reasons: [],
    derived_fields: [],
  };
  if (!row || typeof row !== 'object') {
    rowDiagnostics.reasons.push('missing_budget_row');
    return { row: null, diagnostics: rowDiagnostics };
  }
  const category = normalizeText(row.category ?? row.scope ?? row.scope_of_work);
  const scopeOfWork = normalizeText(row.scope_of_work ?? row.scope);
  const unitType = normalizeText(row.unit_type);
  const phaseTiming = normalizeText(row.phase_timing ?? row.timing_or_phasing);
  const explicitEstimatedCost = parseNumberLike(row.estimated_cost ?? row.total_budget);
  const unitCount = parseNumberLike(row.unit_count);
  const costPerUnit = parseNumberLike(row.cost_per_unit);
  const expectedMonthlyRentLift = parseNumberLike(row.expected_monthly_rent_lift);
  const evidence = normalizeEvidenceArray(row.evidence);
  if (!category) {
    rowDiagnostics.reasons.push('missing_budget_row_category_or_scope');
    return { row: null, diagnostics: rowDiagnostics };
  }
  if (!evidence.length) {
    rowDiagnostics.reasons.push('row_evidence_missing');
    return { row: null, diagnostics: rowDiagnostics };
  }
  if (!evidence.some((excerpt) => evidenceMatchesSource(excerpt, sourceText))) {
    rowDiagnostics.reasons.push('row_evidence_unmatched');
    return { row: null, diagnostics: rowDiagnostics };
  }

  let estimatedCost = explicitEstimatedCost;
  const estimatedCostMissing = !Number.isFinite(explicitEstimatedCost) || explicitEstimatedCost <= 0;
  if (estimatedCostMissing) {
    if (Number.isFinite(unitCount) && unitCount >= 0 && Number.isFinite(costPerUnit) && costPerUnit >= 0) {
      estimatedCost = unitCount * costPerUnit;
      rowDiagnostics.derived_fields.push('row_cost_derived_from_unit_count_x_cost_per_unit');
    } else {
      rowDiagnostics.reasons.push('row_cost_derivation_inputs_missing');
      return { row: null, diagnostics: rowDiagnostics };
    }
  }
  if (!Number.isFinite(estimatedCost) || estimatedCost <= 0 || estimatedCost > MAX_RENOVATION_BUDGET) {
    rowDiagnostics.reasons.push('missing_budget_row_estimated_cost');
    return { row: null, diagnostics: rowDiagnostics };
  }

  return {
    row: {
      category,
      estimated_cost: estimatedCost,
      scope_of_work: scopeOfWork || null,
      unit_type: unitType || null,
      unit_count: Number.isFinite(unitCount) && unitCount >= 0 ? unitCount : null,
      cost_per_unit: Number.isFinite(costPerUnit) && costPerUnit >= 0 ? costPerUnit : null,
      expected_monthly_rent_lift:
        Number.isFinite(expectedMonthlyRentLift) && expectedMonthlyRentLift >= 0 ? expectedMonthlyRentLift : null,
      phase_timing: phaseTiming || null,
      evidence: evidence.slice(0, 1),
    },
    diagnostics: rowDiagnostics,
  };
};

const normalizeAppraisalValueBasis = (value) => {
  const text = normalizeComparableText(value);
  if (!text) return null;
  if (/as[-\s]*is/.test(text)) return 'as_is';
  if (/stabiliz/.test(text)) return 'stabilized';
  if (/opinion of value/.test(text)) return 'opinion_of_value';
  if (/broker opinion/.test(text)) return 'broker_opinion';
  if (/market survey/.test(text)) return 'market_survey';
  if (/unknown/.test(text)) return 'unknown';
  return null;
};

export function validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics(candidate, sourceText) {
  const validationReasons = [];
  const derivedFields = [];
  const fieldDiagnostics = [];
  if (!candidate || candidate.is_acquisition_purchase_assumptions !== true) {
    validationReasons.push('candidate_not_acquisition_purchase_assumptions');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: derivedFields, accepted_fields: [] } };
  }

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) {
    validationReasons.push('candidate_below_confidence');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: derivedFields, accepted_fields: [] } };
  }

  const source = String(sourceText || '');
  const evidenceObject = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const warnings = normalizeEvidenceArray(evidenceObject.warnings);

  const purchasePriceCandidate = parseNumberLike(candidate.purchase_price);
  const ltvCandidate = parseNumberLike(candidate.ltv);
  const rateCandidate = parseNumberLike(candidate.interest_rate);
  const amortCandidate = parseNumberLike(candidate.amortization_years);
  const capRateCandidate = parseNumberLike(candidate.going_in_cap_rate);
  const closingCostsCandidate = parseNumberLike(candidate.closing_costs_percent);

  const accepted = {};
  const acceptedEvidence = {};
  const parseWarnings = ['ai_support_doc_recovery_used'];

  const fieldSpecs = [
    {
      key: 'purchase_price',
      value: purchasePriceCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= MAX_PURCHASE_PRICE,
      warning: 'missing_purchase_price',
    },
    {
      key: 'ltv',
      value: ltvCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 100,
      warning: 'missing_ltv',
    },
    {
      key: 'interest_rate',
      value: rateCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 30,
      warning: 'missing_interest_rate',
    },
    {
      key: 'amortization_years',
      value: amortCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 50,
      warning: 'missing_amortization_years',
    },
    {
      key: 'going_in_cap_rate',
      value: capRateCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 20,
      warning: 'missing_going_in_cap_rate',
    },
    {
      key: 'closing_costs_percent',
      value: closingCostsCandidate,
      validate: (value) => Number.isFinite(value) && value >= 0 && value <= 20,
      warning: 'missing_closing_costs_percent',
    },
  ];

  let acceptedFieldCount = 0;
  for (const spec of fieldSpecs) {
    if (!spec.validate(spec.value)) {
      validationReasons.push(spec.warning);
      fieldDiagnostics.push({ field: spec.key, reason_codes: [spec.warning] });
      parseWarnings.push(spec.warning);
      continue;
    }
    const fieldEvidence = validateFieldEvidence(spec.key, spec.value, source, evidenceObject);
    if (!fieldEvidence) {
      validationReasons.push(`unverified_${spec.key}`);
      fieldDiagnostics.push({ field: spec.key, reason_codes: [`unverified_${spec.key}`] });
      parseWarnings.push(`unverified_${spec.key}`);
      continue;
    }
    accepted[spec.key] = spec.value;
    acceptedEvidence[spec.key] = fieldEvidence.evidence;
    acceptedFieldCount += 1;
  }

  if (acceptedFieldCount === 0) {
    validationReasons.push('no_accepted_acquisition_fields');
    return { payload: null, diagnostics: { validation_reasons: [...new Set(validationReasons)], field_diagnostics: fieldDiagnostics, derived_fields: derivedFields, accepted_fields: [] } };
  }

  const purchasePrice = accepted.purchase_price ?? null;
  const ltv = accepted.ltv ?? null;
  const derivedAcquisitionLoanAmount =
    Number.isFinite(purchasePrice) &&
    purchasePrice > 0 &&
    Number.isFinite(ltv) &&
    ltv > 0 &&
    ltv <= 100
      ? Math.round(purchasePrice * (ltv / 100))
      : null;
  if (derivedAcquisitionLoanAmount) {
    derivedFields.push('derived_acquisition_loan_amount_allowed');
  }
  if (!(Number.isFinite(purchasePrice) && Number.isFinite(ltv))) {
    if (!Number.isFinite(purchasePrice)) {
      validationReasons.push('acquisition_debt_sizing_not_modeled');
      parseWarnings.push('acquisition_debt_sizing_not_modeled');
    }
    if (!Number.isFinite(ltv)) {
      validationReasons.push('acquisition_debt_sizing_not_modeled_due_to_missing_ltv');
      parseWarnings.push('acquisition_debt_sizing_not_modeled_due_to_missing_ltv');
    }
  }
  if (!Number.isFinite(accepted.amortization_years)) {
    validationReasons.push('estimated_acquisition_debt_service_not_modeled');
    parseWarnings.push('estimated_acquisition_debt_service_not_modeled');
  }

  const acceptedWarnings = warnings.filter(Boolean);
  const payload = {
    method: 'ai_support_doc_recovery_validated',
    ai_assisted: true,
    validated: true,
    confidence,
    purchase_price: Number.isFinite(accepted.purchase_price) ? accepted.purchase_price : null,
    ltv: Number.isFinite(accepted.ltv) ? accepted.ltv : null,
    interest_rate: Number.isFinite(accepted.interest_rate) ? accepted.interest_rate : null,
    amortization_years: Number.isFinite(accepted.amortization_years) ? accepted.amortization_years : null,
    amort_years: Number.isFinite(accepted.amortization_years) ? accepted.amortization_years : null,
    going_in_cap_rate: Number.isFinite(accepted.going_in_cap_rate) ? accepted.going_in_cap_rate : null,
    closing_costs_percent: Number.isFinite(accepted.closing_costs_percent) ? accepted.closing_costs_percent : null,
    derived_acquisition_loan_amount: derivedAcquisitionLoanAmount,
    debt_basis: derivedAcquisitionLoanAmount ? 'acquisition_financing_assumption' : null,
    parse_warnings: [...new Set([...parseWarnings, ...acceptedWarnings])],
    ai_recovery_evidence: acceptedEvidence,
    validation_diagnostics: {
      validation_reasons: [...new Set(validationReasons)],
      field_diagnostics: fieldDiagnostics,
      derived_fields: [...new Set(derivedFields)],
      accepted_fields: Object.keys(accepted).concat(
        derivedAcquisitionLoanAmount ? ['derived_acquisition_loan_amount', 'debt_basis'] : []
      ),
    },
  };
  return {
    payload,
    diagnostics: payload.validation_diagnostics,
  };
}

export function validateAcquisitionPurchaseAssumptionsCandidate(candidate, sourceText) {
  return validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics(candidate, sourceText).payload;
}

export function validateCurrentMortgageCandidateWithDiagnostics(candidate, sourceText) {
  const validationReasons = [];
  const derivedFields = [];
  const fieldDiagnostics = [];
  if (!candidate || candidate.is_current_mortgage !== true) {
    validationReasons.push('candidate_not_current_mortgage');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: derivedFields, accepted_fields: [] } };
  }

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < 0.85) {
    validationReasons.push('candidate_below_confidence');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: derivedFields, accepted_fields: [] } };
  }

  const source = String(sourceText || '');
  const evidenceObject = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const warnings = normalizeEvidenceArray(evidenceObject.warnings);

  const outstandingBalanceCandidate = parseNumberLike(candidate.outstanding_balance);
  const monthlyPaymentCandidate = parseNumberLike(candidate.monthly_payment);
  const annualDebtServiceCandidate = parseNumberLike(candidate.annual_debt_service);
  const rateCandidate = parseNumberLike(candidate.interest_rate);
  const amortCandidate = parseNumberLike(candidate.amortization_years);
  const maturityDateCandidate = parseDateLike(candidate.maturity_date);
  const lenderNameCandidate = normalizeText(candidate.lender_name) || null;

  const parseWarnings = ['ai_support_doc_recovery_used'];
  const accepted = {};
  const acceptedEvidence = {};

  const fieldSpecs = [
    {
      key: 'outstanding_balance',
      value: outstandingBalanceCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= MAX_PURCHASE_PRICE,
      warning: 'missing_outstanding_balance',
    },
    {
      key: 'monthly_payment',
      value: monthlyPaymentCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 1000000,
      warning: 'missing_monthly_payment',
    },
    {
      key: 'annual_debt_service',
      value: annualDebtServiceCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 12000000,
      warning: 'missing_annual_debt_service',
    },
    {
      key: 'interest_rate',
      value: rateCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 30,
      warning: 'missing_interest_rate',
    },
    {
      key: 'amortization_years',
      value: amortCandidate,
      validate: (value) => Number.isFinite(value) && value > 0 && value <= 50,
      warning: 'missing_amortization_years',
    },
    {
      key: 'maturity_date',
      value: maturityDateCandidate,
      validate: (value) => typeof value === 'string' && value.length > 0,
      warning: 'missing_maturity_date',
    },
    {
      key: 'lender_name',
      value: lenderNameCandidate,
      validate: (value) => typeof value === 'string' && value.length > 0,
      warning: 'missing_lender_name',
    },
  ];

  let acceptedFieldCount = 0;
  for (const spec of fieldSpecs) {
    if (!spec.validate(spec.value)) {
      validationReasons.push(spec.warning);
      fieldDiagnostics.push({ field: spec.key, reason_codes: [spec.warning] });
      parseWarnings.push(spec.warning);
      continue;
    }
    const fieldEvidence = Number.isFinite(spec.value)
      ? validateFieldEvidence(spec.key, spec.value, source, evidenceObject)
      : validateStringEvidence(spec.key, spec.value, source, evidenceObject);
    if (!fieldEvidence) {
      validationReasons.push(`unverified_${spec.key}`);
      fieldDiagnostics.push({ field: spec.key, reason_codes: [`unverified_${spec.key}`] });
      parseWarnings.push(`unverified_${spec.key}`);
      continue;
    }
    accepted[spec.key] = spec.value;
    acceptedEvidence[spec.key] = fieldEvidence.evidence;
    acceptedFieldCount += 1;
  }

  if (acceptedFieldCount === 0) {
    validationReasons.push('no_accepted_current_debt_fields');
    return { payload: null, diagnostics: { validation_reasons: [...new Set(validationReasons)], field_diagnostics: fieldDiagnostics, derived_fields: derivedFields, accepted_fields: [] } };
  }

  const outstandingBalance = Number.isFinite(accepted.outstanding_balance) ? accepted.outstanding_balance : null;
  const monthlyPayment = Number.isFinite(accepted.monthly_payment) ? accepted.monthly_payment : null;
  const annualDebtService =
    Number.isFinite(accepted.annual_debt_service) && accepted.annual_debt_service > 0
      ? accepted.annual_debt_service
      : Number.isFinite(monthlyPayment) && monthlyPayment > 0
      ? Math.round(monthlyPayment * 12)
      : null;
  if (Number.isFinite(monthlyPayment) && !Number.isFinite(accepted.annual_debt_service)) {
    derivedFields.push('annual_debt_service_derived_from_monthly_payment');
    acceptedEvidence.annual_debt_service = acceptedEvidence.monthly_payment || [];
  }
  const payload = {
    method: 'ai_support_doc_recovery_validated',
    ai_assisted: true,
    validated: true,
    confidence,
    outstanding_balance: outstandingBalance,
    monthly_payment: monthlyPayment,
    annual_debt_service: annualDebtService,
    interest_rate: Number.isFinite(accepted.interest_rate) ? accepted.interest_rate : null,
    amortization_years: Number.isFinite(accepted.amortization_years) ? accepted.amortization_years : null,
    maturity_date: accepted.maturity_date || null,
    lender_name: accepted.lender_name || null,
    monthly_debt_service: monthlyPayment,
    amort_years: Number.isFinite(accepted.amortization_years) ? accepted.amortization_years : null,
    parse_warnings: [...new Set([...parseWarnings, ...warnings])],
    ai_recovery_evidence: acceptedEvidence,
    validation_diagnostics: {
      validation_reasons: [...new Set(validationReasons)],
      field_diagnostics: fieldDiagnostics,
      derived_fields: [...new Set(derivedFields)],
      accepted_fields: Object.keys(accepted).concat(
        annualDebtService && !Number.isFinite(accepted.annual_debt_service)
          ? ['annual_debt_service']
          : []
      ),
    },
  };
  return {
    payload,
    diagnostics: payload.validation_diagnostics,
  };
}

export function validateCurrentMortgageCandidate(candidate, sourceText) {
  return validateCurrentMortgageCandidateWithDiagnostics(candidate, sourceText).payload;
}

export function validateRenovationCandidateWithDiagnostics(candidate, sourceText) {
  const validationReasons = [];
  const rowDiagnostics = [];
  const derivedFields = [];
  if (!candidate || candidate.is_renovation_capex !== true) {
    validationReasons.push('deterministic_validation_rejected_candidate');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, row_diagnostics: rowDiagnostics, derived_fields: derivedFields } };
  }

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) {
    validationReasons.push('candidate_below_confidence');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, row_diagnostics: rowDiagnostics, derived_fields: derivedFields } };
  }

  const source = String(sourceText || '');
  if (!source.trim()) {
    validationReasons.push('source_text_missing');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, row_diagnostics: rowDiagnostics, derived_fields: derivedFields } };
  }
  const evidenceObject = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const warnings = normalizeEvidenceArray(evidenceObject.warnings);
  const parseWarnings = ['ai_support_doc_recovery_used'];
  const acceptedEvidence = {};

  const totalBudgetCandidate = parseNumberLike(candidate.total_budget);
  const unitCountCandidate = parseNumberLike(candidate.unit_count);
  const perUnitCostCandidate = parseNumberLike(candidate.per_unit_cost);
  const timingCandidate = normalizeText(candidate.timing_or_phasing) || null;
  const rentLiftCandidate = normalizeText(candidate.rent_lift) || null;
  const roiCandidate = normalizeText(candidate.roi) || null;
  const paybackCandidate = normalizeText(candidate.payback_period) || null;
  const budgetRows = [];
  for (const [index, row] of (Array.isArray(candidate.budget_rows) ? candidate.budget_rows : []).entries()) {
    const rowValidation = validateBudgetRowEvidence(row, source);
    const rowReasonCodes = rowValidation?.diagnostics?.reasons || [];
    const rowDerivedCodes = rowValidation?.diagnostics?.derived_fields || [];
    if (rowReasonCodes.length > 0) {
      rowDiagnostics.push({ row_index: index, reason_codes: rowReasonCodes });
    }
    if (rowDerivedCodes.length > 0) {
      derivedFields.push(...rowDerivedCodes);
    }
    if (rowValidation?.row) {
      budgetRows.push(rowValidation.row);
    }
  }
  const totalBudgetEvidence = normalizeEvidenceArray(evidenceObject.total_budget);
  const hasTotalBudgetEvidence = totalBudgetEvidence.some((excerpt) => evidenceMatchesSource(excerpt, source));
  const totalBudget =
    Number.isFinite(totalBudgetCandidate) &&
    totalBudgetCandidate > 0 &&
    totalBudgetCandidate <= MAX_RENOVATION_BUDGET &&
    hasTotalBudgetEvidence
      ? totalBudgetCandidate
      : null;
  if (!Number.isFinite(totalBudgetCandidate) || totalBudgetCandidate <= 0) {
    validationReasons.push('missing_total_budget');
  } else if (!totalBudget) {
    validationReasons.push('unverified_total_budget');
    parseWarnings.push('missing_total_budget');
  }

  const timingEvidence = timingCandidate ? validateEvidenceString('timing_or_phasing', timingCandidate, source, evidenceObject) : null;
  const rentLiftEvidence = rentLiftCandidate ? validateEvidenceString('rent_lift', rentLiftCandidate, source, evidenceObject) : null;
  const roiEvidence = roiCandidate ? validateEvidenceString('roi', roiCandidate, source, evidenceObject) : null;
  const paybackEvidence = paybackCandidate ? validateEvidenceString('payback_period', paybackCandidate, source, evidenceObject) : null;

  const unitCountEvidence = Number.isFinite(unitCountCandidate)
    ? validateFieldEvidence('unit_count', unitCountCandidate, source, evidenceObject)
    : null;
  const perUnitCostEvidence = Number.isFinite(perUnitCostCandidate)
    ? validateFieldEvidence('per_unit_cost', perUnitCostCandidate, source, evidenceObject)
    : null;

  const budgetRowsEvidence = budgetRows.map((row) => row.evidence[0]).filter(Boolean);
  if (budgetRows.length === 0 && !totalBudget && !timingEvidence && !rentLiftEvidence && !roiEvidence && !paybackEvidence && !unitCountEvidence && !perUnitCostEvidence) {
    if (!validationReasons.includes('missing_budget_line_items')) {
      validationReasons.push('missing_budget_line_items');
    }
    return {
      payload: null,
      diagnostics: {
        validation_reasons: [...new Set(validationReasons)],
        row_diagnostics: rowDiagnostics,
        derived_fields: [...new Set(derivedFields)],
      },
    };
  }
  if (budgetRows.length === 0) {
    validationReasons.push('missing_budget_line_items');
    parseWarnings.push('missing_budget_line_items');
  }
  if (budgetRows.length > 0 && totalBudget) {
    const rowsTotal = budgetRows.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0);
    if (Math.abs(rowsTotal - totalBudget) > Math.max(5000, totalBudget * 0.02)) {
      validationReasons.push('total_budget_row_sum_mismatch');
      return {
        payload: null,
        diagnostics: {
          validation_reasons: [...new Set(validationReasons)],
          row_diagnostics: rowDiagnostics,
          derived_fields: [...new Set(derivedFields)],
        },
      };
    }
  }

  const executionRows = [];
  if (Number.isFinite(unitCountEvidence?.value)) {
    executionRows.push({ metric: 'Unit Count', value: unitCountEvidence.value });
  }
  if (Number.isFinite(perUnitCostEvidence?.value)) {
    executionRows.push({ metric: 'Per Unit Cost', value: perUnitCostEvidence.value });
  }
  if (timingEvidence) executionRows.push({ metric: 'Timing / Phasing', value: timingEvidence.value });
  if (rentLiftEvidence) executionRows.push({ metric: 'Rent Lift', value: rentLiftEvidence.value });
  if (roiEvidence) executionRows.push({ metric: 'ROI', value: roiEvidence.value });
  if (paybackEvidence) executionRows.push({ metric: 'Payback Period', value: paybackEvidence.value });

  if (unitCountEvidence) acceptedEvidence.unit_count = unitCountEvidence.evidence;
  else if (Number.isFinite(unitCountCandidate)) parseWarnings.push('unverified_unit_count');
  if (perUnitCostEvidence) acceptedEvidence.per_unit_cost = perUnitCostEvidence.evidence;
  else if (Number.isFinite(perUnitCostCandidate)) parseWarnings.push('unverified_per_unit_cost');
  if (timingEvidence) acceptedEvidence.timing_or_phasing = timingEvidence.evidence;
  if (rentLiftEvidence) acceptedEvidence.rent_lift = rentLiftEvidence.evidence;
  if (roiEvidence) acceptedEvidence.roi = roiEvidence.evidence;
  if (paybackEvidence) acceptedEvidence.payback_period = paybackEvidence.evidence;
  if (totalBudget) acceptedEvidence.total_budget = totalBudgetEvidence.slice(0, 1);
  if (budgetRowsEvidence.length > 0) acceptedEvidence.budget_rows = budgetRowsEvidence;
  const acceptedFieldsDiagnostics = [];
  if (totalBudget !== null) acceptedFieldsDiagnostics.push('total_budget');
  if (budgetRows.length > 0) acceptedFieldsDiagnostics.push('budget_rows');
  if (unitCountEvidence) acceptedFieldsDiagnostics.push('unit_count');
  if (perUnitCostEvidence) acceptedFieldsDiagnostics.push('per_unit_cost');
  if (timingEvidence) acceptedFieldsDiagnostics.push('timing_or_phasing');
  if (rentLiftEvidence) acceptedFieldsDiagnostics.push('rent_lift');
  if (roiEvidence) acceptedFieldsDiagnostics.push('roi');
  if (paybackEvidence) acceptedFieldsDiagnostics.push('payback_period');
  if (executionRows.length > 0) acceptedFieldsDiagnostics.push('execution_rows');
  if (
    budgetRows.some((row) => {
      const monthlyRentLift = parseNumberLike(row?.expected_monthly_rent_lift);
      return Number.isFinite(monthlyRentLift) && monthlyRentLift > 0;
    })
  ) {
    acceptedFieldsDiagnostics.push('budget_rows.expected_monthly_rent_lift');
  }

  return {
    payload: {
    method: 'ai_support_doc_recovery_validated',
    ai_assisted: true,
    validated: true,
    confidence,
    total_budget: totalBudget,
    budget_rows: budgetRows,
    unit_count: unitCountEvidence ? unitCountEvidence.value : null,
    per_unit_cost: perUnitCostEvidence ? perUnitCostEvidence.value : null,
    timing_or_phasing: timingEvidence ? timingEvidence.value : null,
    rent_lift: rentLiftEvidence ? rentLiftEvidence.value : null,
    roi: roiEvidence ? roiEvidence.value : null,
    payback_period: paybackEvidence ? paybackEvidence.value : null,
    execution_rows: executionRows,
    parse_warnings: [...new Set([...parseWarnings, ...warnings])],
    ai_recovery_evidence: acceptedEvidence,
    validation_diagnostics: {
      validation_reasons: [...new Set(validationReasons)],
      row_diagnostics: rowDiagnostics,
      derived_fields: [...new Set(derivedFields)],
      accepted_fields: [...new Set(acceptedFieldsDiagnostics)],
    },
  },
    diagnostics: {
      validation_reasons: [...new Set(validationReasons)],
      row_diagnostics: rowDiagnostics,
      derived_fields: [...new Set(derivedFields)],
      accepted_fields: [...new Set(acceptedFieldsDiagnostics)],
    },
  };
}

export function validateRenovationCandidate(candidate, sourceText) {
  return validateRenovationCandidateWithDiagnostics(candidate, sourceText).payload;
}

export function validatePropertyTaxCandidateWithDiagnostics(candidate, sourceText) {
  const validationReasons = [];
  const fieldDiagnostics = [];
  if (!candidate || candidate.is_property_tax !== true) {
    validationReasons.push('candidate_not_property_tax');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: [], accepted_fields: [] } };
  }

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) {
    validationReasons.push('candidate_below_confidence');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: [], accepted_fields: [] } };
  }

  const source = String(sourceText || '');
  const evidenceObject = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const warnings = normalizeEvidenceArray(evidenceObject.warnings);
  const parseWarnings = ['ai_support_doc_recovery_used'];

  const annualTaxCandidate = parseNumberLike(candidate.annual_tax);
  const taxYearCandidate = parseNumberLike(candidate.tax_year);
  const assessedValueCandidate = parseNumberLike(candidate.assessed_value);
  const rollNumberCandidate = normalizeText(candidate.roll_number) || null;

  const annualTaxEvidence = normalizeEvidenceArray(evidenceObject.annual_tax);
  if (!Number.isFinite(annualTaxCandidate)) {
    validationReasons.push('missing_annual_tax');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: [{ field: 'annual_tax', reason_codes: ['missing_annual_tax'] }], derived_fields: [], accepted_fields: [] } };
  }
  if (!annualTaxEvidence.length) {
    validationReasons.push('annual_tax_evidence_missing');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: [{ field: 'annual_tax', reason_codes: ['annual_tax_evidence_missing'] }], derived_fields: [], accepted_fields: [] } };
  }
  if (!annualTaxEvidence.some((excerpt) => evidenceMatchesSource(excerpt, source))) {
    validationReasons.push('annual_tax_evidence_unmatched');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: [{ field: 'annual_tax', reason_codes: ['annual_tax_evidence_unmatched'] }], derived_fields: [], accepted_fields: [] } };
  }
  if (annualTaxCandidate < 1000 || annualTaxCandidate > MAX_PROPERTY_TAX) {
    validationReasons.push('annual_tax_out_of_range');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: [{ field: 'annual_tax', reason_codes: ['annual_tax_out_of_range'] }], derived_fields: [], accepted_fields: [] } };
  }
  if (annualTaxCandidate >= 1900 && annualTaxCandidate <= 2100) {
    validationReasons.push('annual_tax_looks_like_year');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: [{ field: 'annual_tax', reason_codes: ['annual_tax_looks_like_year'] }], derived_fields: [], accepted_fields: [] } };
  }

  const taxYear = Number.isFinite(taxYearCandidate) && taxYearCandidate >= 1900 && taxYearCandidate <= 2100 ? taxYearCandidate : null;
  const assessedValue = Number.isFinite(assessedValueCandidate) && assessedValueCandidate > 0 ? assessedValueCandidate : null;
  const rollNumberEvidence = rollNumberCandidate ? validateEvidenceString('roll_number', rollNumberCandidate, source, evidenceObject) : null;
  const assessedValueEvidence = assessedValue ? validateFieldEvidence('assessed_value', assessedValue, source, evidenceObject) : null;
  const taxYearEvidence = taxYear ? validateEvidenceString('tax_year', String(taxYear), source, evidenceObject) : null;
  if (taxYear && !taxYearEvidence) {
    validationReasons.push('unverified_tax_year');
    fieldDiagnostics.push({ field: 'tax_year', reason_codes: ['unverified_tax_year'] });
    parseWarnings.push('unverified_tax_year');
  }
  if (assessedValue && !assessedValueEvidence) {
    validationReasons.push('unverified_assessed_value');
    fieldDiagnostics.push({ field: 'assessed_value', reason_codes: ['unverified_assessed_value'] });
    parseWarnings.push('unverified_assessed_value');
  }
  if (rollNumberCandidate && !rollNumberEvidence) {
    validationReasons.push('unverified_roll_number');
    fieldDiagnostics.push({ field: 'roll_number', reason_codes: ['unverified_roll_number'] });
    parseWarnings.push('unverified_roll_number');
  }

  const payload = {
    method: 'ai_support_doc_recovery_validated',
    ai_assisted: true,
    validated: true,
    confidence,
    annual_tax: annualTaxCandidate,
    tax_year: taxYear ? String(taxYear) : null,
    assessed_value: assessedValue,
    roll_number: rollNumberEvidence ? rollNumberEvidence.value : null,
    parse_warnings: [...new Set([...parseWarnings, ...warnings])],
    ai_recovery_evidence: {
      annual_tax: annualTaxEvidence.slice(0, 1),
      tax_year: taxYearEvidence ? taxYearEvidence.evidence : [],
      assessed_value: assessedValueEvidence ? assessedValueEvidence.evidence : [],
      roll_number: rollNumberEvidence ? rollNumberEvidence.evidence : [],
      warnings,
    },
    validation_diagnostics: {
      validation_reasons: [...new Set(validationReasons)],
      field_diagnostics: fieldDiagnostics,
      derived_fields: [],
      accepted_fields: ['annual_tax'].concat(
        taxYearEvidence ? ['tax_year'] : [],
        assessedValueEvidence ? ['assessed_value'] : [],
        rollNumberEvidence ? ['roll_number'] : []
      ),
    },
  };
  return {
    payload,
    diagnostics: payload.validation_diagnostics,
  };
}

export function validatePropertyTaxCandidate(candidate, sourceText) {
  return validatePropertyTaxCandidateWithDiagnostics(candidate, sourceText).payload;
}

export function validateAppraisalCandidateWithDiagnostics(candidate, sourceText) {
  const validationReasons = [];
  const fieldDiagnostics = [];
  if (!candidate || candidate.is_appraisal_support !== true) {
    validationReasons.push('candidate_not_appraisal_support');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: [], accepted_fields: [] } };
  }

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) {
    validationReasons.push('candidate_below_confidence');
    return { payload: null, diagnostics: { validation_reasons: validationReasons, field_diagnostics: fieldDiagnostics, derived_fields: [], accepted_fields: [] } };
  }

  const source = String(sourceText || '');
  const evidenceObject = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const warnings = normalizeEvidenceArray(evidenceObject.warnings);
  const parseWarnings = ['ai_support_doc_recovery_used'];
  const acceptedEvidence = {};

  const appraisedValueCandidate = parseNumberLike(candidate.appraised_value);
  const valuationDateCandidate = parseDateLike(candidate.valuation_date);
  const capRateCandidate = parseNumberLike(candidate.cap_rate);
  const egiCandidate = parseNumberLike(candidate.effective_gross_income);
  const noiCandidate = parseNumberLike(candidate.noi);
  const valueBasisCandidate = normalizeAppraisalValueBasis(candidate.value_basis);
  const appraisalTypeCandidate = normalizeText(candidate.appraisal_type) || null;

  const appraisedValueEvidence = normalizeEvidenceArray(evidenceObject.appraised_value);
  const hasFormalValueLanguage = appraisedValueEvidence.some((excerpt) =>
    evidenceMatchesSource(excerpt, source) &&
    /\b(?:appraised value|as[-\s]*is value|stabilized value|value conclusion|opinion of value)\b/i.test(source)
  );
  const appraisedValue =
    Number.isFinite(appraisedValueCandidate) &&
    appraisedValueCandidate > 0 &&
    appraisedValueCandidate <= MAX_APPRAISED_VALUE &&
    hasFormalValueLanguage
      ? appraisedValueCandidate
      : null;
  if (Number.isFinite(appraisedValueCandidate) && !appraisedValue) {
    validationReasons.push('unverified_appraised_value');
    if (!hasFormalValueLanguage) {
      validationReasons.push('appraised_value_missing_formal_value_language');
      fieldDiagnostics.push({ field: 'appraised_value', reason_codes: ['appraised_value_missing_formal_value_language'] });
    } else {
      fieldDiagnostics.push({ field: 'appraised_value', reason_codes: ['unverified_appraised_value'] });
    }
    parseWarnings.push('unverified_appraised_value');
  }

  const valuationDateEvidence = valuationDateCandidate
    ? validateEvidenceString('valuation_date', valuationDateCandidate, source, evidenceObject)
    : null;
  const capRateEvidence = Number.isFinite(capRateCandidate)
    ? validateFieldEvidence('cap_rate', capRateCandidate, source, evidenceObject)
    : null;
  const egiEvidence = Number.isFinite(egiCandidate)
    ? validateFieldEvidence('effective_gross_income', egiCandidate, source, evidenceObject)
    : null;
  const noiEvidence = Number.isFinite(noiCandidate)
    ? validateFieldEvidence('noi', noiCandidate, source, evidenceObject)
    : null;
  const valueBasisEvidence = valueBasisCandidate
    ? (() => {
        const evidence = normalizeEvidenceArray(evidenceObject.value_basis);
        const acceptedEvidence = evidence.find((excerpt) => evidenceMatchesSource(excerpt, source)) || null;
        return acceptedEvidence ? { value: valueBasisCandidate, evidence: [acceptedEvidence] } : null;
      })()
    : null;
  const appraisalTypeEvidence = appraisalTypeCandidate
    ? validateEvidenceString('appraisal_type', appraisalTypeCandidate, source, evidenceObject)
    : null;

  if (valuationDateCandidate && !valuationDateEvidence) {
    validationReasons.push('unverified_valuation_date');
    fieldDiagnostics.push({ field: 'valuation_date', reason_codes: ['unverified_valuation_date'] });
    parseWarnings.push('unverified_valuation_date');
  }
  if (Number.isFinite(capRateCandidate) && !capRateEvidence) {
    validationReasons.push('unverified_cap_rate');
    fieldDiagnostics.push({ field: 'cap_rate', reason_codes: ['unverified_cap_rate'] });
    parseWarnings.push('unverified_cap_rate');
  }
  if (Number.isFinite(egiCandidate) && !egiEvidence) {
    validationReasons.push('unverified_effective_gross_income');
    fieldDiagnostics.push({ field: 'effective_gross_income', reason_codes: ['unverified_effective_gross_income'] });
    parseWarnings.push('unverified_effective_gross_income');
  }
  if (Number.isFinite(noiCandidate) && !noiEvidence) {
    validationReasons.push('unverified_noi');
    fieldDiagnostics.push({ field: 'noi', reason_codes: ['unverified_noi'] });
    parseWarnings.push('unverified_noi');
  }
  if (valueBasisCandidate && !valueBasisEvidence) {
    validationReasons.push('unverified_value_basis');
    fieldDiagnostics.push({ field: 'value_basis', reason_codes: ['unverified_value_basis'] });
    parseWarnings.push('unverified_value_basis');
  }
  if (appraisalTypeCandidate && !appraisalTypeEvidence) {
    validationReasons.push('unverified_appraisal_type');
    fieldDiagnostics.push({ field: 'appraisal_type', reason_codes: ['unverified_appraisal_type'] });
    parseWarnings.push('unverified_appraisal_type');
  }

  if (
    !appraisedValue &&
    !valuationDateEvidence &&
    !capRateEvidence &&
    !egiEvidence &&
    !noiEvidence &&
    !valueBasisEvidence &&
    !appraisalTypeEvidence
  ) {
    validationReasons.push('no_accepted_appraisal_fields');
    return { payload: null, diagnostics: { validation_reasons: [...new Set(validationReasons)], field_diagnostics: fieldDiagnostics, derived_fields: [], accepted_fields: [] } };
  }

  if (appraisedValue) acceptedEvidence.appraised_value = appraisedValueEvidence.slice(0, 1);
  if (valuationDateEvidence) acceptedEvidence.valuation_date = valuationDateEvidence.evidence;
  if (capRateEvidence) acceptedEvidence.cap_rate = capRateEvidence.evidence;
  if (egiEvidence) acceptedEvidence.effective_gross_income = egiEvidence.evidence;
  if (noiEvidence) acceptedEvidence.noi = noiEvidence.evidence;
  if (valueBasisEvidence) acceptedEvidence.value_basis = valueBasisEvidence.evidence;
  if (appraisalTypeEvidence) acceptedEvidence.appraisal_type = appraisalTypeEvidence.evidence;

  const payload = {
    method: 'ai_support_doc_recovery_validated',
    ai_assisted: true,
    validated: true,
    confidence,
    appraised_value: appraisedValue,
    valuation_date: valuationDateEvidence ? valuationDateEvidence.value : null,
    cap_rate: capRateEvidence ? capRateEvidence.value : null,
    effective_gross_income: egiEvidence ? egiEvidence.value : null,
    noi: noiEvidence ? noiEvidence.value : null,
    value_basis: valueBasisEvidence ? valueBasisEvidence.value : null,
    appraisal_type: appraisalTypeEvidence ? appraisalTypeEvidence.value : null,
    parse_warnings: [...new Set([...parseWarnings, ...warnings])],
    ai_recovery_evidence: acceptedEvidence,
    validation_diagnostics: {
      validation_reasons: [...new Set(validationReasons)],
      field_diagnostics: fieldDiagnostics,
      derived_fields: [],
      accepted_fields: [
        appraisedValue ? 'appraised_value' : null,
        valuationDateEvidence ? 'valuation_date' : null,
        capRateEvidence ? 'cap_rate' : null,
        egiEvidence ? 'effective_gross_income' : null,
        noiEvidence ? 'noi' : null,
        valueBasisEvidence ? 'value_basis' : null,
        appraisalTypeEvidence ? 'appraisal_type' : null,
      ].filter(Boolean),
    },
  };
  return {
    payload,
    diagnostics: payload.validation_diagnostics,
  };
}

export function validateAppraisalCandidate(candidate, sourceText) {
  return validateAppraisalCandidateWithDiagnostics(candidate, sourceText).payload;
}

const extractJsonText = (responseJson) => {
  if (typeof responseJson?.output_text === 'string' && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }
  const outputs = Array.isArray(responseJson?.output) ? responseJson.output : [];
  for (const output of outputs) {
    const contents = Array.isArray(output?.content) ? output.content : [];
    for (const content of contents) {
      if (typeof content?.text === 'string' && content.text.trim()) {
        return content.text.trim();
      }
    }
  }
  return null;
};

export async function recoverAcquisitionPurchaseAssumptionsWithAI({
  text,
  filename,
  jobId: _jobId,
  includeDiagnostics = false,
}) {
  const diagnostics = {
    attempted: true,
    feature_enabled: FEATURE_ENABLED,
    openai_api_key_present: Boolean(OPENAI_API_KEY),
    model: OPENAI_MODEL,
    source_text_length: String(text || '').length,
    openai_request_attempted: false,
    openai_response_status: null,
    provider_error_class: null,
    provider_error_code: null,
    provider_error_type: null,
    provider_error_message: null,
    provider_response_status: null,
    provider_request_id: null,
    openai_error_message: null,
    openai_error_body: null,
    json_parse_success: null,
    candidate_present: false,
    validation_accepted: false,
    accepted_fields: [],
    rejection_reason: null,
    final_outcome: 'unknown_null',
  };
  const finish = (payload, outcome, extra = {}) => {
    Object.assign(diagnostics, extra);
    diagnostics.final_outcome = outcome;
    if (includeDiagnostics) {
      return { payload, diagnostics };
    }
    return payload;
  };

  if (!FEATURE_ENABLED) return finish(null, 'disabled', { rejection_reason: 'feature_disabled' });
  if (!OPENAI_API_KEY) return finish(null, 'missing_api_key', { rejection_reason: 'missing_api_key' });

  const promptText = clampText(text, MAX_TEXT_CHARS);
  if (!promptText) return finish(null, 'candidate_missing', { rejection_reason: 'missing_source_text' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    diagnostics.openai_request_attempted = true;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You extract acquisition / purchase assumptions only. Return strict JSON only. Do not infer missing values. Do not generate narrative. Do not calculate investment conclusions. Use null when unavailable. Provide exact evidence excerpts for every populated field.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `Filename: ${filename || 'unknown'}`,
                  'Task: recover acquisition / purchase assumptions from already extracted source text.',
                  'Rules:',
                  '- Set is_acquisition_purchase_assumptions true only if the source is clearly a purchase assumption or acquisition financing document.',
                  '- Return only explicitly supported values.',
                  '- Provide exact evidence excerpts for every populated field.',
                  '- Do not infer missing values.',
                  '- Do not compute derived acquisition loan amount; that is validated deterministically.',
                  `Source text:\n${promptText}`,
                ].join('\n\n'),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'acquisition_support_doc_recovery',
            strict: true,
            schema: buildResponseSchema(),
          },
        },
      }),
    });

    diagnostics.openai_response_status = response.status;
    if (!response.ok) {
      const errorBodyRaw = await response.text().catch(() => '');
      const provider = classifyOpenAiError(response.status, errorBodyRaw, null, response.headers);
      return finish(null, 'openai_non_ok', {
        rejection_reason: 'openai_non_ok',
        provider_error_class: provider.provider_error_class,
        provider_error_code: provider.provider_error_code,
        provider_error_type: provider.provider_error_type,
        provider_error_message: provider.provider_error_message,
        provider_response_status: provider.provider_response_status,
        provider_request_id: provider.provider_request_id,
        openai_error_message: provider.provider_error_message,
        openai_error_body: provider.provider_error_body,
      });
    }

    const responseJson = await response.json();
    const jsonText = extractJsonText(responseJson);
    if (!jsonText) {
      return finish(null, 'candidate_missing', { rejection_reason: 'missing_response_json_text' });
    }

    let candidate = null;
    try {
      candidate = JSON.parse(jsonText);
      diagnostics.json_parse_success = true;
      diagnostics.candidate_present = Boolean(candidate);
    } catch (_err) {
      return finish(null, 'json_parse_failed', { json_parse_success: false });
    }

    const validation = validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics(candidate, promptText);
    const validated = validation?.payload;
    if (!validated) {
      const rejectionReasons = validation?.diagnostics?.validation_reasons || ['deterministic_validation_rejected_candidate'];
      return finish(null, 'validation_rejected', {
        validation_accepted: false,
        rejection_reason: rejectionReasons[0] || 'deterministic_validation_rejected_candidate',
        rejection_reasons: rejectionReasons,
        accepted_fields: validation?.diagnostics?.accepted_fields || [],
        field_diagnostics: validation?.diagnostics?.field_diagnostics || [],
        derived_fields: validation?.diagnostics?.derived_fields || [],
      });
    }

    return finish(validated, 'accepted', {
      validation_accepted: true,
      accepted_fields: Object.keys(validated).filter((key) =>
        [
          'purchase_price',
          'ltv',
          'interest_rate',
          'amortization_years',
          'amort_years',
          'going_in_cap_rate',
          'closing_costs_percent',
          'derived_acquisition_loan_amount',
          'debt_basis',
        ].includes(key) && validated[key] !== null && validated[key] !== undefined
      ),
      validation_reasons: validation?.diagnostics?.validation_reasons || [],
      field_diagnostics: validation?.diagnostics?.field_diagnostics || [],
      derived_fields: validation?.diagnostics?.derived_fields || [],
    });
  } catch (_err) {
    const provider = classifyOpenAiError(null, null, _err?.name || 'exception', null);
    return finish(null, 'exception', {
      rejection_reason: _err?.name || 'exception',
      provider_error_class: provider.provider_error_class,
      provider_error_code: provider.provider_error_code,
      provider_error_type: provider.provider_error_type,
      provider_error_message: provider.provider_error_message,
      provider_response_status: provider.provider_response_status,
      provider_request_id: provider.provider_request_id,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function recoverCurrentMortgageWithAI({
  text,
  filename,
  jobId: _jobId,
  includeDiagnostics = false,
}) {
  const diagnostics = {
    attempted: true,
    feature_enabled: FEATURE_ENABLED,
    openai_api_key_present: Boolean(OPENAI_API_KEY),
    model: OPENAI_MODEL,
    support_doc_recovery_type: 'current_mortgage',
    source_text_length: String(text || '').length,
    openai_request_attempted: false,
    openai_response_status: null,
    provider_error_class: null,
    provider_error_code: null,
    provider_error_type: null,
    provider_error_message: null,
    provider_response_status: null,
    provider_request_id: null,
    openai_error_message: null,
    openai_error_body: null,
    json_parse_success: null,
    candidate_present: false,
    validation_accepted: false,
    accepted_fields: [],
    rejection_reason: null,
    final_outcome: 'unknown_null',
  };
  const finish = (payload, outcome, extra = {}) => {
    Object.assign(diagnostics, extra);
    diagnostics.final_outcome = outcome;
    if (includeDiagnostics) {
      return { payload, diagnostics };
    }
    return payload;
  };

  if (!FEATURE_ENABLED) return finish(null, 'disabled', { rejection_reason: 'feature_disabled' });
  if (!OPENAI_API_KEY) return finish(null, 'missing_api_key', { rejection_reason: 'missing_api_key' });

  const promptText = clampText(text, MAX_TEXT_CHARS);
  if (!promptText) return finish(null, 'candidate_missing', { rejection_reason: 'missing_source_text' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    diagnostics.openai_request_attempted = true;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You extract true current mortgage / current debt fields only. Return strict JSON only. Do not infer acquisition financing as current debt. Do not generate narrative. Use null when unavailable. Provide exact evidence excerpts for every populated field.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `Filename: ${filename || 'unknown'}`,
                  'Task: recover true current mortgage / current debt values from already extracted source text.',
                  'Rules:',
                  '- Set is_current_mortgage true only if this is clearly a current/existing/outstanding debt document.',
                  '- Reject proposed, acquisition, indicative, or purchase-assumption financing as current debt.',
                  '- Return only explicitly supported values.',
                  '- Provide exact evidence excerpts for every populated field.',
                  '- Do not infer missing values.',
                  '- Do not calculate conclusions; use null when unavailable.',
                  `Source text:\n${promptText}`,
                ].join('\n\n'),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'current_mortgage_recovery',
            strict: true,
            schema: buildCurrentMortgageResponseSchema(),
          },
        },
      }),
    });

    diagnostics.openai_response_status = response.status;
    if (!response.ok) {
      const errorBodyRaw = await response.text().catch(() => '');
      const provider = classifyOpenAiError(response.status, errorBodyRaw, null, response.headers);
      return finish(null, 'openai_non_ok', {
        rejection_reason: 'openai_non_ok',
        provider_error_class: provider.provider_error_class,
        provider_error_code: provider.provider_error_code,
        provider_error_type: provider.provider_error_type,
        provider_error_message: provider.provider_error_message,
        provider_response_status: provider.provider_response_status,
        provider_request_id: provider.provider_request_id,
        openai_error_message: provider.provider_error_message,
        openai_error_body: provider.provider_error_body,
      });
    }

    const responseJson = await response.json();
    const jsonText = extractJsonText(responseJson);
    if (!jsonText) {
      return finish(null, 'candidate_missing', { rejection_reason: 'missing_response_json_text' });
    }

    let candidate = null;
    try {
      candidate = JSON.parse(jsonText);
      diagnostics.json_parse_success = true;
      diagnostics.candidate_present = Boolean(candidate);
    } catch (_err) {
      return finish(null, 'json_parse_failed', { json_parse_success: false });
    }

    const validation = validateCurrentMortgageCandidateWithDiagnostics(candidate, promptText);
    const validated = validation?.payload;
    if (!validated) {
      const rejectionReasons = validation?.diagnostics?.validation_reasons || ['deterministic_validation_rejected_candidate'];
      return finish(null, 'validation_rejected', {
        validation_accepted: false,
        rejection_reason: rejectionReasons[0] || 'deterministic_validation_rejected_candidate',
        rejection_reasons: rejectionReasons,
        accepted_fields: validation?.diagnostics?.accepted_fields || [],
        field_diagnostics: validation?.diagnostics?.field_diagnostics || [],
        derived_fields: validation?.diagnostics?.derived_fields || [],
      });
    }

    return finish(validated, 'accepted', {
      validation_accepted: true,
      accepted_fields: Object.keys(validated).filter((key) =>
        [
          'outstanding_balance',
          'monthly_payment',
          'annual_debt_service',
          'interest_rate',
          'amortization_years',
          'maturity_date',
          'lender_name',
        ].includes(key) && validated[key] !== null && validated[key] !== undefined
      ),
      validation_reasons: validation?.diagnostics?.validation_reasons || [],
      field_diagnostics: validation?.diagnostics?.field_diagnostics || [],
      derived_fields: validation?.diagnostics?.derived_fields || [],
    });
  } catch (_err) {
    const provider = classifyOpenAiError(null, null, _err?.name || 'exception', null);
    return finish(null, 'exception', {
      rejection_reason: _err?.name || 'exception',
      provider_error_class: provider.provider_error_class,
      provider_error_code: provider.provider_error_code,
      provider_error_type: provider.provider_error_type,
      provider_error_message: provider.provider_error_message,
      provider_response_status: provider.provider_response_status,
      provider_request_id: provider.provider_request_id,
    });
  } finally {
    clearTimeout(timeout);
  }
}

const readOpenAiResponseError = async (response) => {
  const errorBodyRaw = await response.text().catch(() => '');
  const provider = classifyOpenAiError(response.status, errorBodyRaw, null, response.headers);
  return {
    provider_error_class: provider.provider_error_class,
    provider_error_code: provider.provider_error_code,
    provider_error_type: provider.provider_error_type,
    provider_error_message: provider.provider_error_message,
    provider_response_status: provider.provider_response_status,
    provider_request_id: provider.provider_request_id,
    errorBody: provider.provider_error_body,
    errorMessage: provider.provider_error_message,
  };
};

const recoverSupportDocWithAI = async ({
  supportDocRecoveryType,
  text,
  filename,
  includeDiagnostics = false,
  schemaName,
  schemaBuilder,
  systemText,
  userTextLines,
  validateCandidate,
  acceptedFieldNames = [],
}) => {
  const diagnostics = {
    attempted: true,
    feature_enabled: FEATURE_ENABLED,
    openai_api_key_present: Boolean(OPENAI_API_KEY),
    model: OPENAI_MODEL,
    support_doc_recovery_type: supportDocRecoveryType || null,
    source_text_length: String(text || '').length,
    openai_request_attempted: false,
    openai_response_status: null,
    provider_error_class: null,
    provider_error_code: null,
    provider_error_type: null,
    provider_error_message: null,
    provider_response_status: null,
    provider_request_id: null,
    openai_error_message: null,
    openai_error_body: null,
    json_parse_success: null,
    candidate_present: false,
    validation_accepted: false,
    accepted_fields: [],
    rejection_reason: null,
    final_outcome: 'unknown_null',
  };
  const finish = (payload, outcome, extra = {}) => {
    Object.assign(diagnostics, extra);
    diagnostics.final_outcome = outcome;
    if (includeDiagnostics) {
      return { payload, diagnostics };
    }
    return payload;
  };

  if (!FEATURE_ENABLED) return finish(null, 'disabled', { rejection_reason: 'feature_disabled' });
  if (!OPENAI_API_KEY) return finish(null, 'missing_api_key', { rejection_reason: 'missing_api_key' });

  const promptText = clampText(text, MAX_TEXT_CHARS);
  if (!promptText) return finish(null, 'candidate_missing', { rejection_reason: 'missing_source_text' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    diagnostics.openai_request_attempted = true;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: systemText,
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `Filename: ${filename || 'unknown'}`,
                  ...userTextLines,
                  `Source text:\n${promptText}`,
                ].join('\n\n'),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: schemaName,
            strict: true,
            schema: schemaBuilder(),
          },
        },
      }),
    });

    diagnostics.openai_response_status = response.status;
    if (!response.ok) {
      const {
        provider_error_class,
        provider_error_code,
        provider_error_type,
        provider_error_message,
        provider_response_status,
        provider_request_id,
        errorBody,
        errorMessage,
      } = await readOpenAiResponseError(response);
      return finish(null, 'openai_non_ok', {
        rejection_reason: 'openai_non_ok',
        provider_error_class,
        provider_error_code,
        provider_error_type,
        provider_error_message,
        provider_response_status,
        provider_request_id,
        openai_error_message: errorMessage,
        openai_error_body: errorBody,
      });
    }

    const responseJson = await response.json();
    const jsonText = extractJsonText(responseJson);
    if (!jsonText) {
      return finish(null, 'candidate_missing', { rejection_reason: 'missing_response_json_text' });
    }

    let candidate = null;
    try {
      candidate = JSON.parse(jsonText);
      diagnostics.json_parse_success = true;
      diagnostics.candidate_present = Boolean(candidate);
    } catch (_err) {
      return finish(null, 'json_parse_failed', { json_parse_success: false });
    }

    const validationWithDiagnostics =
      supportDocRecoveryType === 'renovation'
        ? validateRenovationCandidateWithDiagnostics(candidate, promptText)
        : supportDocRecoveryType === 'acquisition_purchase_assumptions'
        ? validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics(candidate, promptText)
        : supportDocRecoveryType === 'current_mortgage'
        ? validateCurrentMortgageCandidateWithDiagnostics(candidate, promptText)
        : supportDocRecoveryType === 'property_tax'
        ? validatePropertyTaxCandidateWithDiagnostics(candidate, promptText)
        : supportDocRecoveryType === 'appraisal'
        ? validateAppraisalCandidateWithDiagnostics(candidate, promptText)
        : null;
    const validated = validationWithDiagnostics ? validationWithDiagnostics?.payload : validateCandidate(candidate, promptText);
    if (!validated) {
      const rejectionReasons =
        validationWithDiagnostics
          ? validationWithDiagnostics?.diagnostics?.validation_reasons || ['deterministic_validation_rejected_candidate']
          : ['deterministic_validation_rejected_candidate'];
      return finish(null, 'validation_rejected', {
        validation_accepted: false,
        rejection_reason: rejectionReasons[0] || 'deterministic_validation_rejected_candidate',
        rejection_reasons: rejectionReasons,
        accepted_fields: validationWithDiagnostics?.diagnostics?.accepted_fields || [],
        row_diagnostics: validationWithDiagnostics?.diagnostics?.row_diagnostics || [],
        field_diagnostics: validationWithDiagnostics?.diagnostics?.field_diagnostics || [],
        derived_fields: validationWithDiagnostics?.diagnostics?.derived_fields || [],
      });
    }

    const acceptedFields = acceptedFieldNames.filter(
      (field) => validated[field] !== null && validated[field] !== undefined
    );
    if (
      supportDocRecoveryType === 'renovation' &&
      Array.isArray(validated?.budget_rows) &&
      validated.budget_rows.some((row) => {
        const monthlyRentLift = parseNumberLike(row?.expected_monthly_rent_lift);
        return Number.isFinite(monthlyRentLift) && monthlyRentLift > 0;
      })
    ) {
      acceptedFields.push('budget_rows.expected_monthly_rent_lift');
    }

    return finish(validated, 'accepted', {
      validation_accepted: true,
      accepted_fields: [...new Set(acceptedFields)],
      validation_reasons:
        validationWithDiagnostics ? validationWithDiagnostics?.diagnostics?.validation_reasons || [] : [],
      row_diagnostics: validationWithDiagnostics?.diagnostics?.row_diagnostics || [],
      field_diagnostics: validationWithDiagnostics?.diagnostics?.field_diagnostics || [],
      derived_fields: validationWithDiagnostics?.diagnostics?.derived_fields || [],
    });
  } catch (_err) {
    const provider = classifyOpenAiError(null, null, _err?.name || 'exception', null);
    return finish(null, 'exception', {
      rejection_reason: _err?.name || 'exception',
      provider_error_class: provider.provider_error_class,
      provider_error_code: provider.provider_error_code,
      provider_error_type: provider.provider_error_type,
      provider_error_message: provider.provider_error_message,
      provider_response_status: provider.provider_response_status,
      provider_request_id: provider.provider_request_id,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export async function recoverRenovationWithAI({
  text,
  filename,
  jobId: _jobId,
  includeDiagnostics = false,
}) {
  return recoverSupportDocWithAI({
    supportDocRecoveryType: 'renovation',
    text,
    filename,
    includeDiagnostics,
    schemaName: 'renovation_recovery',
    schemaBuilder: buildRenovationResponseSchema,
    systemText:
      'You extract renovation / CapEx support only. Return strict JSON only. Do not infer unsupported values. Do not generate narrative. Do not calculate ROI, payback, or return conclusions unless the source explicitly states them. Use null when unavailable. Provide exact evidence excerpts for every populated field.',
    userTextLines: [
      'Task: recover structured renovation / CapEx values from already extracted document text.',
      'Rules:',
      '- Set is_renovation_capex true only if this is clearly a renovation / CapEx / capital budget support document.',
      '- Return only explicitly supported values.',
      '- Provide exact evidence excerpts for every populated field.',
      '- Do not infer missing values.',
      '- Do not fabricate ROI, payback, rent lift, timing, unit count, or per-unit cost unless the source explicitly states them.',
      '- Budget rows may include explicit category, scope, estimated cost, unit type, unit count, cost per unit, expected monthly rent lift, and phase timing when those values are stated in the source. Use null when unavailable.',
    ],
    validateCandidate: validateRenovationCandidate,
    acceptedFieldNames: [
      'total_budget',
      'budget_rows',
      'unit_count',
      'per_unit_cost',
      'timing_or_phasing',
      'rent_lift',
      'roi',
      'payback_period',
      'execution_rows',
    ],
  });
}

export async function recoverPropertyTaxWithAI({
  text,
  filename,
  jobId: _jobId,
  includeDiagnostics = false,
}) {
  return recoverSupportDocWithAI({
    supportDocRecoveryType: 'property_tax',
    text,
    filename,
    includeDiagnostics,
    schemaName: 'property_tax_recovery',
    schemaBuilder: buildPropertyTaxResponseSchema,
    systemText:
      'You extract property tax support only. Return strict JSON only. Do not infer unsupported values. Do not generate narrative. Use null when unavailable. Provide exact evidence excerpts for every populated field.',
    userTextLines: [
      'Task: recover structured property tax values from already extracted document text.',
      'Rules:',
      '- Set is_property_tax true only if this is clearly a property tax notice, tax bill, assessment notice, or related tax support document.',
      '- Return only explicitly supported values.',
      '- Provide exact evidence excerpts for every populated field.',
      '- Do not infer annual tax from assessed value, tax year, or installment schedules.',
      '- Do not substitute assessed value or tax year for annual tax.',
    ],
    validateCandidate: validatePropertyTaxCandidate,
    acceptedFieldNames: ['annual_tax', 'tax_year', 'assessed_value', 'roll_number'],
  });
}

export async function recoverAppraisalWithAI({
  text,
  filename,
  jobId: _jobId,
  includeDiagnostics = false,
}) {
  return recoverSupportDocWithAI({
    supportDocRecoveryType: 'appraisal',
    text,
    filename,
    includeDiagnostics,
    schemaName: 'appraisal_recovery',
    schemaBuilder: buildAppraisalResponseSchema,
    systemText:
      'You extract formal appraisal / cap-rate support only. Return strict JSON only. Do not infer unsupported values. Do not generate narrative. Use null when unavailable. Provide exact evidence excerpts for every populated field. Keep formal appraisal value distinct from purchase price, loan amount, tax assessment, broker opinion, and market survey unless the source explicitly supports the comparison.',
    userTextLines: [
      'Task: recover structured appraisal / cap-rate support values from already extracted document text.',
      'Rules:',
      '- Set is_appraisal_support true only if this is clearly an appraisal, valuation, cap-rate support, broker opinion, or market survey document.',
      '- Return only explicitly supported values.',
      '- Provide exact evidence excerpts for every populated field.',
      '- Do not infer appraised value from purchase price, loan amount, or tax assessment.',
      '- Do not fabricate valuation date, cap rate, NOI, effective gross income, value basis, or appraisal type unless explicitly stated.',
      '- Do not treat broker opinion or market survey as formal appraised value unless the source explicitly states a value conclusion.',
    ],
    validateCandidate: validateAppraisalCandidate,
    acceptedFieldNames: [
      'appraised_value',
      'valuation_date',
      'cap_rate',
      'effective_gross_income',
      'noi',
      'value_basis',
      'appraisal_type',
    ],
  });
}

export const __test__ = {
  buildResponseSchema,
  buildCurrentMortgageResponseSchema,
  buildRenovationResponseSchema,
  buildPropertyTaxResponseSchema,
  buildAppraisalResponseSchema,
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery,
  shouldAttemptCurrentMortgageRecovery,
  shouldAttemptRenovationRecovery,
  shouldAttemptPropertyTaxRecovery,
  shouldAttemptAppraisalRecovery,
  validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics,
  validateAcquisitionPurchaseAssumptionsCandidate,
  validateCurrentMortgageCandidateWithDiagnostics,
  validateCurrentMortgageCandidate,
  validateRenovationCandidateWithDiagnostics,
  validateRenovationCandidate,
  validatePropertyTaxCandidateWithDiagnostics,
  validatePropertyTaxCandidate,
  validateAppraisalCandidateWithDiagnostics,
  validateAppraisalCandidate,
};
