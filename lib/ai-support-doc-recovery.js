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
  const hasAcquisitionSignal = acquisitionSignals.some((pattern) => pattern.test(source));
  if (!hasAcquisitionSignal) return false;

  const hasNumericFinancingSignal =
    /\b\d+(?:\.\d+)?\s*%/.test(source) ||
    /\b\d+\s*(?:years?|yrs?|yr)\b/i.test(source) ||
    /\$\s*[\d,]+(?:\.\d{2})?/.test(source);
  return hasNumericFinancingSignal;
}

const buildResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: ['is_acquisition_purchase_assumptions', 'confidence', 'evidence'],
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
}) {
  if (!FEATURE_ENABLED || !OPENAI_API_KEY) return null;

  const promptText = clampText(text, MAX_TEXT_CHARS);
  if (!promptText) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
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

    if (!response.ok) return null;

    const responseJson = await response.json();
    const jsonText = extractJsonText(responseJson);
    if (!jsonText) return null;

    let candidate = null;
    try {
      candidate = JSON.parse(jsonText);
    } catch (_err) {
      return null;
    }

    return validateAcquisitionPurchaseAssumptionsCandidate(candidate, promptText);
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
