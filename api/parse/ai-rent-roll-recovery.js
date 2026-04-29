const OPENAI_RENT_ROLL_RECOVERY_MODEL =
  process.env.OPENAI_RENT_ROLL_RECOVERY_MODEL || 'gpt-4o-mini';

const FEATURE_ENABLED = process.env.ENABLE_AI_RENT_ROLL_RECOVERY === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MAX_TEXT_CHARS = 12000;
const MAX_TABLE_CHARS = 18000;
const MIN_CONFIDENCE = 0.85;
const MIN_UNIT_ROWS_WITHOUT_SUMMARY = 12;
const MAX_TOTAL_UNITS = 5000;
const MAX_UNIT_RENT = 100000;
const MAX_TOTAL_MONTHLY_RENT = 10000000;
const MAX_TOTAL_ANNUAL_RENT = 120000000;

const parseNumberLike = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  if (!text) return null;
  const cleaned = text.replace(/[$,%\s]/g, '').replace(/,/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const toIsoDateOrNull = (value) => {
  const text = normalizeText(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return null;
};

const clampText = (value, limit) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > limit ? text.slice(0, limit) : text;
};

const renderTablesForPrompt = (tables) => {
  const entries = Array.isArray(tables) ? tables : [];
  const chunks = [];
  for (const entry of entries) {
    const rows = Array.isArray(entry?.rows) ? entry.rows : Array.isArray(entry) ? entry : [];
    if (!rows.length) continue;
    const label = normalizeText(entry?.sheetName || entry?.table_id || entry?.name || 'Table');
    const renderedRows = rows
      .slice(0, 80)
      .map((row) =>
        (Array.isArray(row) ? row : [])
          .slice(0, 16)
          .map((cell) => normalizeText(cell))
          .join(' | ')
      )
      .filter(Boolean)
      .join('\n');
    if (!renderedRows) continue;
    chunks.push(`${label}\n${renderedRows}`);
  }
  return clampText(chunks.join('\n\n'), MAX_TABLE_CHARS);
};

const buildUnitMix = (units) => {
  const mixMap = {};
  for (const unit of units) {
    const unitType = normalizeText(unit?.unit_type || '') || 'Unknown';
    if (!mixMap[unitType]) {
      mixMap[unitType] = { count: 0, current: [], market: [] };
    }
    mixMap[unitType].count += 1;
    if (Number.isFinite(unit?.in_place_rent)) mixMap[unitType].current.push(unit.in_place_rent);
    if (Number.isFinite(unit?.market_rent)) mixMap[unitType].market.push(unit.market_rent);
  }
  return Object.entries(mixMap).map(([unit_type, value]) => ({
    unit_type,
    count: value.count,
    current_rent:
      value.current.length > 0
        ? Math.round(value.current.reduce((sum, amount) => sum + amount, 0) / value.current.length)
        : null,
    market_rent:
      value.market.length > 0
        ? Math.round(value.market.reduce((sum, amount) => sum + amount, 0) / value.market.length)
        : null,
  }));
};

const buildResponseSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: ['is_rent_roll', 'property_name', 'as_of_date', 'summary', 'units', 'evidence', 'confidence'],
  properties: {
    is_rent_roll: { type: 'boolean' },
    property_name: { type: ['string', 'null'] },
    as_of_date: { type: ['string', 'null'] },
    summary: {
      type: 'object',
      additionalProperties: false,
      required: [
        'total_units',
        'occupied_units',
        'vacant_units',
        'occupancy',
        'monthly_in_place_rent',
        'annual_in_place_rent',
        'monthly_market_rent',
        'annual_market_rent',
      ],
      properties: {
        total_units: { type: ['number', 'null'] },
        occupied_units: { type: ['number', 'null'] },
        vacant_units: { type: ['number', 'null'] },
        occupancy: { type: ['number', 'null'] },
        monthly_in_place_rent: { type: ['number', 'null'] },
        annual_in_place_rent: { type: ['number', 'null'] },
        monthly_market_rent: { type: ['number', 'null'] },
        annual_market_rent: { type: ['number', 'null'] },
      },
    },
    units: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'unit_id',
          'unit_type',
          'beds',
          'baths',
          'sqft',
          'status',
          'tenant_name_present',
          'current_rent',
          'market_rent',
          'lease_start',
          'lease_end',
          'evidence',
        ],
        properties: {
          unit_id: { type: ['string', 'null'] },
          unit_type: { type: ['string', 'null'] },
          beds: { type: ['number', 'null'] },
          baths: { type: ['number', 'null'] },
          sqft: { type: ['number', 'null'] },
          status: { type: ['string', 'null'] },
          tenant_name_present: { type: 'boolean' },
          current_rent: { type: ['number', 'null'] },
          market_rent: { type: ['number', 'null'] },
          lease_start: { type: ['string', 'null'] },
          lease_end: { type: ['string', 'null'] },
          evidence: { type: ['string', 'null'] },
        },
      },
    },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: ['summary_evidence', 'column_evidence', 'warnings'],
      properties: {
        summary_evidence: { type: 'array', items: { type: 'string' } },
        column_evidence: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
    confidence: { type: 'number' },
  },
});

const hasSummaryEvidence = (evidence) =>
  Array.isArray(evidence?.summary_evidence) &&
  evidence.summary_evidence.some((entry) => normalizeText(entry).length > 0);

const isFiniteAndPositive = (value) => Number.isFinite(value) && value > 0;

const normalizeSummary = (summary) => {
  const source = summary && typeof summary === 'object' ? summary : {};
  return {
    total_units: parseNumberLike(source.total_units),
    occupied_units: parseNumberLike(source.occupied_units),
    vacant_units: parseNumberLike(source.vacant_units),
    occupancy: parseNumberLike(source.occupancy),
    monthly_in_place_rent: parseNumberLike(source.monthly_in_place_rent),
    annual_in_place_rent: parseNumberLike(source.annual_in_place_rent),
    monthly_market_rent: parseNumberLike(source.monthly_market_rent),
    annual_market_rent: parseNumberLike(source.annual_market_rent),
  };
};

const normalizeUnits = (units) => {
  return (Array.isArray(units) ? units : [])
    .map((unit) => {
      const normalizedUnitId = normalizeText(unit?.unit_id);
      const currentRent = parseNumberLike(unit?.current_rent);
      const marketRent = parseNumberLike(unit?.market_rent);
      const beds = parseNumberLike(unit?.beds);
      const baths = parseNumberLike(unit?.baths);
      const sqft = parseNumberLike(unit?.sqft);
      const status = normalizeText(unit?.status) || null;
      const evidence = normalizeText(unit?.evidence) || null;
      if (!normalizedUnitId || !Number.isFinite(currentRent)) return null;
      if (currentRent < 0 || currentRent > MAX_UNIT_RENT) return null;
      if (Number.isFinite(marketRent) && (marketRent < 0 || marketRent > MAX_UNIT_RENT)) return null;
      if (Number.isFinite(beds) && (beds < 0 || beds > 10)) return null;
      if (Number.isFinite(baths) && (baths < 0 || baths > 10)) return null;
      if (Number.isFinite(sqft) && (sqft < 0 || sqft > 20000)) return null;
      return {
        unit: normalizedUnitId,
        unit_type: normalizeText(unit?.unit_type) || null,
        beds: Number.isFinite(beds) ? beds : null,
        baths: Number.isFinite(baths) ? baths : null,
        sqft: Number.isFinite(sqft) ? sqft : null,
        in_place_rent: currentRent,
        market_rent: Number.isFinite(marketRent) ? marketRent : null,
        status,
        lease_start: toIsoDateOrNull(unit?.lease_start),
        lease_end: toIsoDateOrNull(unit?.lease_end),
        tenant_name_present: unit?.tenant_name_present === true,
        evidence,
      };
    })
    .filter(Boolean);
};

export function validateAiRentRollRecoveryPayload(candidate) {
  if (!candidate || candidate.is_rent_roll !== true) return null;
  const confidence = parseNumberLike(candidate.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) return null;

  const summary = normalizeSummary(candidate.summary);
  const evidence = candidate.evidence && typeof candidate.evidence === 'object' ? candidate.evidence : {};
  const units = normalizeUnits(candidate.units);
  const usableUnitCount = units.length;
  const hasSummary =
    isFiniteAndPositive(summary.total_units) ||
    isFiniteAndPositive(summary.monthly_in_place_rent) ||
    isFiniteAndPositive(summary.annual_in_place_rent) ||
    isFiniteAndPositive(summary.monthly_market_rent) ||
    isFiniteAndPositive(summary.annual_market_rent) ||
    Number.isFinite(summary.occupancy);

  if (!hasSummary && usableUnitCount < MIN_UNIT_ROWS_WITHOUT_SUMMARY) return null;
  if (!hasSummary && usableUnitCount === 0) return null;

  if (Number.isFinite(summary.total_units)) {
    if (summary.total_units <= 0 || summary.total_units > MAX_TOTAL_UNITS) return null;
    if (!hasSummaryEvidence(evidence)) return null;
  }
  if (Number.isFinite(summary.occupied_units) && summary.occupied_units < 0) return null;
  if (Number.isFinite(summary.vacant_units) && summary.vacant_units < 0) return null;
  if (Number.isFinite(summary.occupancy) && (summary.occupancy < 0 || summary.occupancy > 1)) return null;

  if (
    Number.isFinite(summary.total_units) &&
    Number.isFinite(summary.occupied_units) &&
    Number.isFinite(summary.vacant_units) &&
    Math.abs(summary.total_units - (summary.occupied_units + summary.vacant_units)) > 1
  ) {
    return null;
  }

  if (
    Number.isFinite(summary.total_units) &&
    Number.isFinite(summary.occupied_units) &&
    Number.isFinite(summary.occupancy)
  ) {
    const computedOccupancy = summary.occupied_units / summary.total_units;
    if (Math.abs(computedOccupancy - summary.occupancy) > 0.05) return null;
  }

  const summaryRentFields = [
    summary.monthly_in_place_rent,
    summary.annual_in_place_rent,
    summary.monthly_market_rent,
    summary.annual_market_rent,
  ];
  if (summaryRentFields.some((value) => Number.isFinite(value)) && !hasSummaryEvidence(evidence)) return null;
  if (Number.isFinite(summary.monthly_in_place_rent) && (summary.monthly_in_place_rent < 0 || summary.monthly_in_place_rent > MAX_TOTAL_MONTHLY_RENT)) return null;
  if (Number.isFinite(summary.monthly_market_rent) && (summary.monthly_market_rent < 0 || summary.monthly_market_rent > MAX_TOTAL_MONTHLY_RENT)) return null;
  if (Number.isFinite(summary.annual_in_place_rent) && (summary.annual_in_place_rent < 0 || summary.annual_in_place_rent > MAX_TOTAL_ANNUAL_RENT)) return null;
  if (Number.isFinite(summary.annual_market_rent) && (summary.annual_market_rent < 0 || summary.annual_market_rent > MAX_TOTAL_ANNUAL_RENT)) return null;

  const explicitSummaryTotals =
    Number.isFinite(summary.total_units) ||
    Number.isFinite(summary.occupancy) ||
    Number.isFinite(summary.occupied_units) ||
    Number.isFinite(summary.vacant_units) ||
    Number.isFinite(summary.monthly_in_place_rent) ||
    Number.isFinite(summary.annual_in_place_rent) ||
    Number.isFinite(summary.monthly_market_rent) ||
    Number.isFinite(summary.annual_market_rent);

  const totals = explicitSummaryTotals
    ? {
        summary_row_detected: true,
        ...(Number.isFinite(summary.total_units) ? { total_units: summary.total_units } : {}),
        ...(Number.isFinite(summary.occupied_units) ? { occupied_units: summary.occupied_units } : {}),
        ...(Number.isFinite(summary.vacant_units) ? { vacant_units: summary.vacant_units } : {}),
        ...(Number.isFinite(summary.occupancy) ? { occupancy: summary.occupancy } : {}),
        ...(Number.isFinite(summary.monthly_in_place_rent)
          ? {
              current_rent_monthly: summary.monthly_in_place_rent,
              in_place_rent_monthly: summary.monthly_in_place_rent,
            }
          : {}),
        ...(Number.isFinite(summary.annual_in_place_rent)
          ? { in_place_rent_annual: summary.annual_in_place_rent }
          : {}),
        ...(Number.isFinite(summary.monthly_market_rent)
          ? { market_rent_monthly: summary.monthly_market_rent }
          : {}),
        ...(Number.isFinite(summary.annual_market_rent)
          ? { market_rent_annual: summary.annual_market_rent }
          : {}),
      }
    : null;

  if (totals && Number.isFinite(totals.total_units) && totals.total_units > 0) {
    if (Number.isFinite(totals.in_place_rent_monthly)) {
      totals.avg_in_place_rent = totals.in_place_rent_monthly / totals.total_units;
    }
    if (Number.isFinite(totals.market_rent_monthly)) {
      totals.avg_market_rent = totals.market_rent_monthly / totals.total_units;
    }
    if (
      Number.isFinite(totals.occupancy) ||
      Number.isFinite(totals.occupied_units) ||
      Number.isFinite(totals.vacant_units)
    ) {
      totals.status_summary_present = true;
    }
  }

  const totalUnits = Number.isFinite(summary.total_units) ? summary.total_units : usableUnitCount;
  if (!Number.isFinite(totalUnits) || totalUnits <= 0 || totalUnits > MAX_TOTAL_UNITS) return null;

  return {
    method: 'ai_rent_roll_recovery_validated',
    ai_assisted: true,
    validated: true,
    confidence,
    total_units: totalUnits,
    totals,
    unit_mix: buildUnitMix(units),
    occupancy: Number.isFinite(summary.occupancy) ? summary.occupancy : null,
    units,
    column_map: null,
    parse_warnings: [
      'ai_rent_roll_recovery_used',
      ...(Array.isArray(evidence?.warnings) ? evidence.warnings.map((entry) => normalizeText(entry)).filter(Boolean) : []),
      ...(!explicitSummaryTotals ? ['ai_unit_rows_without_trusted_summary_totals'] : []),
    ],
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

export async function recoverRentRollWithAI({ text, tables, filename, jobId: _jobId }) {
  if (!FEATURE_ENABLED || !OPENAI_API_KEY) return null;

  const promptText = clampText(text, MAX_TEXT_CHARS);
  const promptTables = renderTablesForPrompt(tables);
  if (!promptText && !promptTables) return null;

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
        model: OPENAI_RENT_ROLL_RECOVERY_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You extract rent roll structure only. Return strict JSON only. Do not infer missing values. Do not calculate investment conclusions. Do not include tenant names. Use null when unavailable. Only capture explicit summary totals when supported by the document.',
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
                  'Task: recover structured rent roll data from already extracted document text and tables.',
                  'Rules:',
                  '- Set is_rent_roll true only if this is clearly a rent roll.',
                  '- Use occupancy as a decimal between 0 and 1.',
                  '- Do not infer annual rent from monthly rent unless the document explicitly labels the annual value.',
                  '- If the document only shows a few unit rows and no explicit summary totals, return the unit rows only and leave summary totals null.',
                  '- Provide evidence strings for populated summary totals.',
                  promptText ? `Document text:\n${promptText}` : 'Document text: none',
                  promptTables ? `Extracted tables:\n${promptTables}` : 'Extracted tables: none',
                ].join('\n\n'),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'rent_roll_recovery',
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

    return validateAiRentRollRecoveryPayload(candidate);
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
