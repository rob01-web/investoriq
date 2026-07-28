import assert from 'node:assert/strict';

process.env.ENABLE_AI_RENT_ROLL_RECOVERY = 'true';
process.env.ENABLE_AI_SUPPORT_DOC_RECOVERY = 'true';
process.env.ENABLE_AI_T12_RECOVERY = 'true';
process.env.OPENAI_API_KEY = 'test-key';
delete process.env.OPENAI_RENT_ROLL_RECOVERY_MODEL;
delete process.env.OPENAI_SUPPORT_DOC_RECOVERY_MODEL;
delete process.env.OPENAI_T12_RECOVERY_MODEL;

const requests = [];

globalThis.fetch = async (_url, options = {}) => {
  const body = JSON.parse(options.body || '{}');
  requests.push(body);
  const schemaName = body?.text?.format?.name || '';
  const candidate =
    schemaName === 'rent_roll_recovery'
      ? rentRollCandidate
      : schemaName === 'acquisition_support_doc_recovery'
      ? acquisitionCandidate
      : schemaName === 't12_recovery'
      ? t12Candidate
      : {};
  return {
    ok: true,
    status: 200,
    json: async () => ({
      output_text: JSON.stringify(candidate),
    }),
    text: async () => '',
  };
};

const { recoverRentRollWithAI } = await import('../../lib/ai-rent-roll-recovery.js');
const { recoverAcquisitionPurchaseAssumptionsWithAI } = await import('../../lib/ai-support-doc-recovery.js');
const { recoverT12WithAI } = await import('../../lib/ai-t12-recovery.js');

const rentRollCandidate = {
  is_rent_roll: true,
  confidence: 0.96,
  property_name: 'Test Property',
  as_of_date: '2026-07-28',
  summary: {
    total_units: 1,
    occupied_units: 1,
    vacant_units: 0,
    occupancy: 1,
    monthly_in_place_rent: 1000,
    annual_in_place_rent: 12000,
    monthly_market_rent: 1100,
    annual_market_rent: 13200,
  },
  units: [
    {
      unit_id: '1',
      unit_type: 'Studio',
      beds: 0,
      baths: 1,
      sqft: 500,
      status: 'occupied',
      tenant_name_present: false,
      current_rent: 1000,
      market_rent: 1100,
      lease_start: '2026-01-01',
      lease_end: '2026-12-31',
      evidence: 'Unit 1 rents for $1,000.',
    },
  ],
  evidence: {
    summary_evidence: ['Total units: 1'],
    column_evidence: [],
    warnings: [],
  },
};

const acquisitionCandidate = {
  is_acquisition_purchase_assumptions: true,
  confidence: 0.96,
  purchase_price: 1200000,
  ltv: 70,
  interest_rate: 5.25,
  amortization_years: 25,
  going_in_cap_rate: 6.1,
  closing_costs_percent: 2,
  evidence: {
    purchase_price: ['Purchase price is $1,200,000.'],
    ltv: ['Target LTV is 70%.'],
    interest_rate: ['Interest rate is 5.25%.'],
    amortization_years: ['Amortization is 25 years.'],
    going_in_cap_rate: ['Going-in cap rate is 6.1%.'],
    closing_costs_percent: ['Closing costs are 2%.'],
    warnings: [],
  },
};

const t12Candidate = {
  is_t12: true,
  period_label: 'Trailing Twelve Months',
  is_trailing_twelve_months: true,
  gross_potential_rent: 110000,
  vacancy_loss: 10000,
  effective_gross_income: 100000,
  total_operating_expenses: 40000,
  net_operating_income: 60000,
  evidence: {
    effective_gross_income: ['Effective Gross Income: $100,000'],
    total_operating_expenses: ['Total Operating Expenses: $40,000'],
    net_operating_income: ['Net Operating Income: $60,000'],
    gross_potential_rent: ['Gross Potential Rent: $110,000'],
    vacancy_loss: ['Vacancy Loss: $10,000'],
    warnings: [],
  },
  confidence: 0.97,
};

const canonicalize = (value) => JSON.parse(JSON.stringify(value));

async function runThreeTimes(label, invoke) {
  const runs = [];
  for (let i = 0; i < 3; i += 1) {
    runs.push(canonicalize(await invoke()));
  }
  assert.deepEqual(runs[1], runs[0], `${label} run 2 must match run 1`);
  assert.deepEqual(runs[2], runs[0], `${label} run 3 must match run 1`);
  return runs[0];
}

const rentRollEnvelope = await runThreeTimes('rent_roll', () =>
  recoverRentRollWithAI({
    text: 'Unit 1 rents for $1,000.',
    tables: [],
    filename: 'rent-roll.pdf',
    includeDiagnostics: true,
  })
);
assert.equal(rentRollEnvelope?.payload?.method, 'ai_rent_roll_recovery_validated');
assert.equal(rentRollEnvelope?.diagnostics?.final_outcome, 'accepted');

const acquisitionEnvelope = await runThreeTimes('acquisition_support_doc', () =>
  recoverAcquisitionPurchaseAssumptionsWithAI({
    text: 'Purchase price is $1,200,000. Target LTV is 70%. Interest rate is 5.25%. Going-in cap rate is 6.1%. Closing costs are 2%.',
    filename: 'purchase-assumptions.pdf',
    includeDiagnostics: true,
  })
);
assert.equal(acquisitionEnvelope?.payload?.method, 'ai_support_doc_candidate_evidence_checked');
assert.equal(acquisitionEnvelope?.diagnostics?.final_outcome, 'accepted');

const t12Envelope = await runThreeTimes('t12', () =>
  recoverT12WithAI({
    text: 'Effective Gross Income: $100,000. Total Operating Expenses: $40,000. Net Operating Income: $60,000. Gross Potential Rent: $110,000. Vacancy Loss: $10,000.',
    filename: 't12.pdf',
    includeDiagnostics: true,
  })
);
assert.equal(t12Envelope?.payload?.method, 'ai_t12_recovery_validated');
assert.equal(t12Envelope?.diagnostics?.final_outcome, 'accepted');

assert.equal(requests.length, 9);
assert.equal(requests[0].text.format.name, 'rent_roll_recovery');
assert.equal(requests[3].text.format.name, 'acquisition_support_doc_recovery');
assert.equal(requests[6].text.format.name, 't12_recovery');
assert.equal(requests.every((request) => request.temperature === 0), true);

console.log('h0-5 deterministic recovery 3x repro smoke PASS');
