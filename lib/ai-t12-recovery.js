const OPENAI_T12_RECOVERY_MODEL =
  process.env.OPENAI_T12_RECOVERY_MODEL || 'gpt-4o-mini';

const FEATURE_ENABLED = process.env.ENABLE_AI_T12_RECOVERY === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TIMEOUT_MS = Math.min(
  55000,
  Math.max(10000, Number(process.env.OPENAI_T12_RECOVERY_TIMEOUT_MS) || 55000)
);

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

export async function recoverT12WithAI({ text, filename, jobId: _jobId, includeDiagnostics = false }) {
  const diagnostics = {
    attempted: true,
    feature_enabled: FEATURE_ENABLED,
    openai_api_key_present: Boolean(OPENAI_API_KEY),
    source_text_length: String(text || '').length,
    openai_request_attempted: false,
    openai_response_status: null,
    json_parse_success: null,
    candidate_present: false,
    validation_accepted: false,
    rejection_reason: null,
    rejection_reasons: [],
    validation_reasons: [],
    accepted_fields: [],
    derived_fields: [],
    final_outcome: 'unknown_null',
  };
  const finish = (payload, outcome, extra = {}) => {
    Object.assign(diagnostics, extra);
    diagnostics.final_outcome = outcome;
    if (includeDiagnostics) return { payload, diagnostics };
    return payload;
  };
  if (!FEATURE_ENABLED) return finish(null, 'disabled');
  if (!OPENAI_API_KEY) return finish(null, 'missing_api_key');

  const promptText = clampText(text, MAX_TEXT_CHARS);
  if (!promptText) {
    return finish(null, 'candidate_missing', {
      rejection_reason: 'missing_source_text',
      rejection_reasons: ['missing_source_text'],
    });
  }

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

    diagnostics.openai_response_status = response.status;
    if (!response.ok) return finish(null, 'openai_non_ok');

    const responseJson = await response.json();
    const jsonText = extractJsonText(responseJson);
    if (!jsonText) {
      return finish(null, 'candidate_missing', {
        json_parse_success: false,
        rejection_reason: 'missing_response_json_text',
        rejection_reasons: ['missing_response_json_text'],
      });
    }

    let candidate = null;
    try {
      candidate = JSON.parse(jsonText);
      diagnostics.json_parse_success = true;
      diagnostics.candidate_present = Boolean(candidate);
    } catch (_err) {
      return finish(null, 'json_parse_failed', {
        json_parse_success: false,
        rejection_reason: 'json_parse_failed',
        rejection_reasons: ['json_parse_failed'],
      });
    }

    const rejectionReasons = [];
    const confidence = parseNumberLike(candidate?.confidence);
    if (candidate?.is_t12 !== true) rejectionReasons.push('candidate_not_t12');
    if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) rejectionReasons.push('candidate_below_confidence');

    const egi = parseNumberLike(candidate?.effective_gross_income);
    const opex = parseNumberLike(candidate?.total_operating_expenses);
    const noi = parseNumberLike(candidate?.net_operating_income);

    if (!Number.isFinite(egi)) rejectionReasons.push('missing_effective_gross_income');
    else if (egi <= 0 || isAbsurdDollarValue(egi) || isLikelyPercentPollution(egi)) rejectionReasons.push('invalid_effective_gross_income');
    if (!Number.isFinite(opex)) rejectionReasons.push('missing_operating_expenses');
    else if (opex < 0 || isAbsurdDollarValue(opex) || isLikelyPercentPollution(opex)) rejectionReasons.push('invalid_operating_expenses');
    if (!Number.isFinite(noi)) rejectionReasons.push('missing_noi');
    else if (isAbsurdDollarValue(noi) || isLikelyPercentPollution(noi)) rejectionReasons.push('invalid_noi');

    if (Number.isFinite(egi) && Number.isFinite(opex) && Number.isFinite(noi)) {
      const expectedNoi = egi - opex;
      const tolerance = Math.max(5000, Math.abs(egi) * 0.03);
      if (Math.abs(expectedNoi - Math.abs(noi)) > tolerance) {
        rejectionReasons.push('core_t12_equation_mismatch');
      }
    }

    const validated = validateAiT12RecoveryPayload(candidate);
    if (!validated) {
      const reasonCodes = [
        'ai_t12_candidate_validation_rejected',
        ...(rejectionReasons.length ? rejectionReasons : ['deterministic_validation_rejected_candidate']),
      ];
      return finish(null, 'validation_rejected', {
        validation_accepted: false,
        rejection_reason: reasonCodes[0],
        rejection_reasons: reasonCodes,
        validation_reasons: reasonCodes,
      });
    }

    return finish(validated, 'accepted', {
      validation_accepted: true,
      validation_reasons: ['t12_recovered_from_ai_validated'],
      accepted_fields: [
        'effective_gross_income',
        'total_operating_expenses',
        'net_operating_income',
        ...(Number.isFinite(validated.gross_potential_rent) ? ['gross_potential_rent'] : []),
      ],
      derived_fields: [],
    });
  } catch (_err) {
    return finish(null, 'exception', { rejection_reason: _err?.name || 'exception' });
  } finally {
    clearTimeout(timeout);
  }
}
