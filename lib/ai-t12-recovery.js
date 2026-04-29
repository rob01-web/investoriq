const OPENAI_T12_RECOVERY_MODEL =
  process.env.OPENAI_T12_RECOVERY_MODEL || 'gpt-4o-mini';

const FEATURE_ENABLED = process.env.ENABLE_AI_T12_RECOVERY === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MAX_TEXT_CHARS = 12000;
const MIN_CONFIDENCE = 0.9;
const MAX_DOLLAR_VALUE = 1000000000;

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

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

const buildResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: [
    'is_t12',
    'period_label',
    'is_trailing_twelve_months',
    'gross_potential_rent',
    'vacancy_loss',
    'effective_gross_income',
    'total_operating_expenses',
    'net_operating_income',
    'evidence',
    'confidence',
  ],
  properties: {
    is_t12: { type: 'boolean' },
    period_label: { type: ['string', 'null'] },
    is_trailing_twelve_months: { type: ['boolean', 'null'] },
    gross_potential_rent: { type: ['number', 'null'] },
    vacancy_loss: { type: ['number', 'null'] },
    effective_gross_income: { type: ['number', 'null'] },
    total_operating_expenses: { type: ['number', 'null'] },
    net_operating_income: { type: ['number', 'null'] },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: [
        'effective_gross_income',
        'total_operating_expenses',
        'net_operating_income',
        'gross_potential_rent',
        'vacancy_loss',
        'warnings',
      ],
      properties: {
        effective_gross_income: { type: 'array', items: { type: 'string' } },
        total_operating_expenses: { type: 'array', items: { type: 'string' } },
        net_operating_income: { type: 'array', items: { type: 'string' } },
        gross_potential_rent: { type: 'array', items: { type: 'string' } },
        vacancy_loss: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
    confidence: { type: 'number' },
  },
});

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

const normalizeEvidenceArray = (value) =>
  (Array.isArray(value) ? value : []).map((entry) => normalizeText(entry)).filter(Boolean);

const hasEvidence = (entries) => Array.isArray(entries) && entries.length > 0;

const isAbsurdDollarValue = (value) => !Number.isFinite(value) || Math.abs(value) > MAX_DOLLAR_VALUE;

const isLikelyPercentPollution = (value) => {
  if (!Number.isFinite(value)) return true;
  if (Math.abs(value) > 0 && Math.abs(value) < 1) return true;
  return false;
};

export function validateAiT12RecoveryPayload(candidate) {
  if (!candidate || candidate.is_t12 !== true) return null;

  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) return null;

  const effectiveGrossIncome = parseNumberLike(candidate.effective_gross_income);
  const totalOperatingExpenses = parseNumberLike(candidate.total_operating_expenses);
  const netOperatingIncome = parseNumberLike(candidate.net_operating_income);
  const grossPotentialRent = parseNumberLike(candidate.gross_potential_rent);
  const vacancyLoss = parseNumberLike(candidate.vacancy_loss);

  if (!Number.isFinite(effectiveGrossIncome) || effectiveGrossIncome <= 0) return null;
  if (!Number.isFinite(totalOperatingExpenses) || totalOperatingExpenses < 0) return null;
  if (!Number.isFinite(netOperatingIncome)) return null;

  if (
    isAbsurdDollarValue(effectiveGrossIncome) ||
    isAbsurdDollarValue(totalOperatingExpenses) ||
    isAbsurdDollarValue(netOperatingIncome)
  ) {
    return null;
  }

  if (
    isLikelyPercentPollution(effectiveGrossIncome) ||
    isLikelyPercentPollution(totalOperatingExpenses) ||
    isLikelyPercentPollution(netOperatingIncome)
  ) {
    return null;
  }

  if (Number.isFinite(grossPotentialRent)) {
    if (grossPotentialRent <= 0 || isAbsurdDollarValue(grossPotentialRent) || isLikelyPercentPollution(grossPotentialRent)) {
      return null;
    }
  }

  if (Number.isFinite(vacancyLoss) && (isAbsurdDollarValue(vacancyLoss) || isLikelyPercentPollution(vacancyLoss))) {
    return null;
  }

  const evidence = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const egiEvidence = normalizeEvidenceArray(evidence.effective_gross_income);
  const opexEvidence = normalizeEvidenceArray(evidence.total_operating_expenses);
  const noiEvidence = normalizeEvidenceArray(evidence.net_operating_income);
  const gprEvidence = normalizeEvidenceArray(evidence.gross_potential_rent);
  const vacancyEvidence = normalizeEvidenceArray(evidence.vacancy_loss);
  const warnings = normalizeEvidenceArray(evidence.warnings);

  if (!hasEvidence(egiEvidence) || !hasEvidence(opexEvidence) || !hasEvidence(noiEvidence)) return null;
  if (Number.isFinite(grossPotentialRent) && !hasEvidence(gprEvidence)) return null;
  if (Number.isFinite(vacancyLoss) && !hasEvidence(vacancyEvidence)) return null;

  const expectedNoi = effectiveGrossIncome - totalOperatingExpenses;
  const tolerance = Math.max(5000, Math.abs(effectiveGrossIncome) * 0.03);
  if (Math.abs(expectedNoi - Math.abs(netOperatingIncome)) > tolerance) return null;

  const periodLabel = normalizeText(candidate.period_label) || null;
  const isTrailingTwelveMonths =
    typeof candidate.is_trailing_twelve_months === 'boolean' ? candidate.is_trailing_twelve_months : null;

  return {
    method: 'ai_t12_recovery_validated',
    ai_assisted: true,
    validated: true,
    confidence,
    period_label: periodLabel,
    is_trailing_twelve_months: isTrailingTwelveMonths,
    gross_potential_rent: Number.isFinite(grossPotentialRent) ? grossPotentialRent : null,
    vacancy_loss: Number.isFinite(vacancyLoss) ? vacancyLoss : null,
    effective_gross_income: effectiveGrossIncome,
    total_operating_expenses: totalOperatingExpenses,
    net_operating_income: netOperatingIncome,
    income_lines: [],
    expense_lines: [],
    column_map: null,
    parse_warnings: ['ai_t12_recovery_used', ...warnings],
    ai_recovery_evidence: {
      effective_gross_income: egiEvidence,
      total_operating_expenses: opexEvidence,
      net_operating_income: noiEvidence,
      gross_potential_rent: gprEvidence,
      vacancy_loss: vacancyEvidence,
      warnings,
    },
  };
}

export async function recoverT12WithAI({ text, filename, jobId: _jobId }) {
  if (!FEATURE_ENABLED || !OPENAI_API_KEY) return null;

  const promptText = clampText(text, MAX_TEXT_CHARS);
  if (!promptText) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_T12_RECOVERY_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You extract trailing-twelve-month operating statement structure only. Return strict JSON only. Do not infer unsupported values. Do not generate narrative. Do not calculate investment conclusions. Use null when unavailable.',
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
                  'Task: recover core T12 / operating statement values from already extracted document text.',
                  'Rules:',
                  '- Set is_t12 true only if this is clearly an operating statement / T12.',
                  '- Extract only explicitly supported values.',
                  '- Do not turn percentages into dollar values.',
                  '- Do not include conclusions or narrative.',
                  '- Provide evidence snippets for each populated core field.',
                  `Document text:\n${promptText}`,
                ].join('\n\n'),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 't12_recovery',
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

    return validateAiT12RecoveryPayload(candidate);
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
