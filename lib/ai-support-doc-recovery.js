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
        required: ['category', 'estimated_cost', 'scope_of_work', 'evidence'],
        properties: {
          category: { type: ['string', 'null'] },
          estimated_cost: { type: ['number', 'null'] },
          scope_of_work: { type: ['string', 'null'] },
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
  if (!row || typeof row !== 'object') return null;
  const category = normalizeText(row.category);
  const scopeOfWork = normalizeText(row.scope_of_work);
  const estimatedCost = parseNumberLike(row.estimated_cost);
  const evidence = normalizeEvidenceArray(row.evidence);
  if (!category || !Number.isFinite(estimatedCost) || estimatedCost <= 0 || estimatedCost > MAX_RENOVATION_BUDGET) return null;
  if (!evidence.length) return null;
  if (!evidence.some((excerpt) => evidenceMatchesSource(excerpt, sourceText))) return null;
  return {
    category,
    estimated_cost: estimatedCost,
    scope_of_work: scopeOfWork || null,
    evidence: evidence.slice(0, 1),
  };
};

export function validateAcquisitionPurchaseAssumptionsCandidate(candidate, sourceText) {
  if (!candidate || candidate.is_acquisition_purchase_assumptions !== true) return null;

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) return null;

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
      parseWarnings.push(spec.warning);
      continue;
    }
    const fieldEvidence = validateFieldEvidence(spec.key, spec.value, source, evidenceObject);
    if (!fieldEvidence) {
      parseWarnings.push(`unverified_${spec.key}`);
      continue;
    }
    accepted[spec.key] = spec.value;
    acceptedEvidence[spec.key] = fieldEvidence.evidence;
    acceptedFieldCount += 1;
  }

  if (acceptedFieldCount === 0) return null;

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
  if (!(Number.isFinite(purchasePrice) && Number.isFinite(ltv))) {
    if (!Number.isFinite(purchasePrice)) parseWarnings.push('acquisition_debt_sizing_not_modeled');
    if (!Number.isFinite(ltv)) parseWarnings.push('acquisition_debt_sizing_not_modeled_due_to_missing_ltv');
  }
  if (!Number.isFinite(accepted.amortization_years)) {
    parseWarnings.push('estimated_acquisition_debt_service_not_modeled');
  }

  const acceptedWarnings = warnings.filter(Boolean);

  return {
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
  };
}

export function validateCurrentMortgageCandidate(candidate, sourceText) {
  if (!candidate || candidate.is_current_mortgage !== true) return null;

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < 0.85) return null;

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
      parseWarnings.push(spec.warning);
      continue;
    }
    const fieldEvidence = Number.isFinite(spec.value)
      ? validateFieldEvidence(spec.key, spec.value, source, evidenceObject)
      : validateStringEvidence(spec.key, spec.value, source, evidenceObject);
    if (!fieldEvidence) {
      parseWarnings.push(`unverified_${spec.key}`);
      continue;
    }
    accepted[spec.key] = spec.value;
    acceptedEvidence[spec.key] = fieldEvidence.evidence;
    acceptedFieldCount += 1;
  }

  if (acceptedFieldCount === 0) return null;

  const outstandingBalance = Number.isFinite(accepted.outstanding_balance) ? accepted.outstanding_balance : null;
  const monthlyPayment = Number.isFinite(accepted.monthly_payment) ? accepted.monthly_payment : null;
  const annualDebtService =
    Number.isFinite(accepted.annual_debt_service) && accepted.annual_debt_service > 0
      ? accepted.annual_debt_service
      : Number.isFinite(monthlyPayment) && monthlyPayment > 0
      ? Math.round(monthlyPayment * 12)
      : null;
  if (Number.isFinite(monthlyPayment) && !Number.isFinite(accepted.annual_debt_service)) {
    acceptedEvidence.annual_debt_service = acceptedEvidence.monthly_payment || [];
  }

  return {
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
  };
}

export function validateRenovationCandidate(candidate, sourceText) {
  if (!candidate || candidate.is_renovation_capex !== true) return null;

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) return null;

  const source = String(sourceText || '');
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
  const budgetRows = Array.isArray(candidate.budget_rows)
    ? candidate.budget_rows
        .map((row) => validateBudgetRowEvidence(row, source))
        .filter(Boolean)
    : [];
  const totalBudgetEvidence = normalizeEvidenceArray(evidenceObject.total_budget);
  const hasTotalBudgetEvidence = totalBudgetEvidence.some((excerpt) => evidenceMatchesSource(excerpt, source));
  const totalBudget =
    Number.isFinite(totalBudgetCandidate) &&
    totalBudgetCandidate > 0 &&
    totalBudgetCandidate <= MAX_RENOVATION_BUDGET &&
    hasTotalBudgetEvidence
      ? totalBudgetCandidate
      : null;
  if (Number.isFinite(totalBudgetCandidate) && !totalBudget) {
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
    return null;
  }
  if (budgetRows.length === 0) {
    parseWarnings.push('missing_budget_line_items');
  }
  if (budgetRows.length > 0 && totalBudget) {
    const rowsTotal = budgetRows.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0);
    if (Math.abs(rowsTotal - totalBudget) > Math.max(5000, totalBudget * 0.02)) {
      return null;
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

  return {
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
  };
}

export function validatePropertyTaxCandidate(candidate, sourceText) {
  if (!candidate || candidate.is_property_tax !== true) return null;

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) return null;

  const source = String(sourceText || '');
  const evidenceObject = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const warnings = normalizeEvidenceArray(evidenceObject.warnings);
  const parseWarnings = ['ai_support_doc_recovery_used'];

  const annualTaxCandidate = parseNumberLike(candidate.annual_tax);
  const taxYearCandidate = parseNumberLike(candidate.tax_year);
  const assessedValueCandidate = parseNumberLike(candidate.assessed_value);
  const rollNumberCandidate = normalizeText(candidate.roll_number) || null;

  const annualTaxEvidence = normalizeEvidenceArray(evidenceObject.annual_tax);
  if (!annualTaxEvidence.some((excerpt) => evidenceMatchesSource(excerpt, source))) return null;
  if (!Number.isFinite(annualTaxCandidate) || annualTaxCandidate < 1000 || annualTaxCandidate > MAX_PROPERTY_TAX) return null;
  if (annualTaxCandidate >= 1900 && annualTaxCandidate <= 2100) return null;

  const taxYear = Number.isFinite(taxYearCandidate) && taxYearCandidate >= 1900 && taxYearCandidate <= 2100 ? taxYearCandidate : null;
  const assessedValue = Number.isFinite(assessedValueCandidate) && assessedValueCandidate > 0 ? assessedValueCandidate : null;
  const rollNumberEvidence = rollNumberCandidate ? validateEvidenceString('roll_number', rollNumberCandidate, source, evidenceObject) : null;
  const assessedValueEvidence = assessedValue ? validateFieldEvidence('assessed_value', assessedValue, source, evidenceObject) : null;
  const taxYearEvidence = taxYear ? validateEvidenceString('tax_year', String(taxYear), source, evidenceObject) : null;
  if (taxYear && !taxYearEvidence) parseWarnings.push('unverified_tax_year');
  if (assessedValue && !assessedValueEvidence) parseWarnings.push('unverified_assessed_value');
  if (rollNumberCandidate && !rollNumberEvidence) parseWarnings.push('unverified_roll_number');

  return {
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
  };
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
      const errorBody = normalizeText(errorBodyRaw).slice(0, 1000) || null;
      let errorMessage = null;
      if (errorBodyRaw) {
        try {
          const parsedError = JSON.parse(errorBodyRaw);
          errorMessage =
            normalizeText(parsedError?.error?.message || parsedError?.message || parsedError?.error || '') || null;
        } catch (_err) {
          errorMessage = errorBody;
        }
      }
      return finish(null, 'openai_non_ok', {
        rejection_reason: 'openai_non_ok',
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

    const validated = validateAcquisitionPurchaseAssumptionsCandidate(candidate, promptText);
    if (!validated) {
      return finish(null, 'validation_rejected', {
        validation_accepted: false,
        rejection_reason: 'deterministic_validation_rejected_candidate',
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
    });
  } catch (_err) {
    return finish(null, 'exception', { rejection_reason: _err?.name || 'exception' });
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
      const errorBody = normalizeText(errorBodyRaw).slice(0, 1000) || null;
      let errorMessage = null;
      if (errorBodyRaw) {
        try {
          const parsedError = JSON.parse(errorBodyRaw);
          errorMessage =
            normalizeText(parsedError?.error?.message || parsedError?.message || parsedError?.error || '') || null;
        } catch (_err) {
          errorMessage = errorBody;
        }
      }
      return finish(null, 'openai_non_ok', {
        rejection_reason: 'openai_non_ok',
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

    const validated = validateCurrentMortgageCandidate(candidate, promptText);
    if (!validated) {
      return finish(null, 'validation_rejected', {
        validation_accepted: false,
        rejection_reason: 'deterministic_validation_rejected_candidate',
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
    });
  } catch (_err) {
    return finish(null, 'exception', { rejection_reason: _err?.name || 'exception' });
  } finally {
    clearTimeout(timeout);
  }
}

const readOpenAiResponseError = async (response) => {
  const errorBodyRaw = await response.text().catch(() => '');
  const errorBody = normalizeText(errorBodyRaw).slice(0, 1000) || null;
  let errorMessage = null;
  if (errorBodyRaw) {
    try {
      const parsedError = JSON.parse(errorBodyRaw);
      errorMessage =
        normalizeText(parsedError?.error?.message || parsedError?.message || parsedError?.error || '') || null;
    } catch (_err) {
      errorMessage = errorBody;
    }
  }
  return { errorBody, errorMessage };
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
      const { errorBody, errorMessage } = await readOpenAiResponseError(response);
      return finish(null, 'openai_non_ok', {
        rejection_reason: 'openai_non_ok',
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

    const validated = validateCandidate(candidate, promptText);
    if (!validated) {
      return finish(null, 'validation_rejected', {
        validation_accepted: false,
        rejection_reason: 'deterministic_validation_rejected_candidate',
      });
    }

    return finish(validated, 'accepted', {
      validation_accepted: true,
      accepted_fields: acceptedFieldNames.filter(
        (field) => validated[field] !== null && validated[field] !== undefined
      ),
    });
  } catch (_err) {
    return finish(null, 'exception', { rejection_reason: _err?.name || 'exception' });
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
      '- Keep budget rows limited to explicit category / scope / cost entries.',
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

export const __test__ = {
  buildResponseSchema,
  buildCurrentMortgageResponseSchema,
  buildRenovationResponseSchema,
  buildPropertyTaxResponseSchema,
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery,
  shouldAttemptCurrentMortgageRecovery,
  shouldAttemptRenovationRecovery,
  shouldAttemptPropertyTaxRecovery,
  validateAcquisitionPurchaseAssumptionsCandidate,
  validateCurrentMortgageCandidate,
  validateRenovationCandidate,
  validatePropertyTaxCandidate,
};
