import { performance } from 'node:perf_hooks';

const [jobId, model, reasoningEffort = 'none'] = process.argv.slice(2);
const apiKey = String(process.env.OPENAI_API_KEY || '').trim();

if (!jobId || !model) {
  console.error('Usage: node scripts/ai-model-eval-02-worker.js <job> <model> [reasoning-effort]');
  process.exit(2);
}
if (!apiKey) {
  console.error('AI MODEL EVAL 02 worker requires OPENAI_API_KEY.');
  process.exit(2);
}

process.env.ENABLE_AI_MODEL_ARCHITECTURE_20260910 = 'true';
process.env.ENABLE_AI_T12_RECOVERY = 'true';
process.env.ENABLE_AI_RENT_ROLL_RECOVERY = 'true';
process.env.ENABLE_AI_SUPPORT_DOC_RECOVERY = 'true';
process.env.OPENAI_T12_RECOVERY_MODEL = model;
process.env.OPENAI_RENT_ROLL_RECOVERY_MODEL = model;
process.env.OPENAI_SUPPORT_DOC_RECOVERY_MODEL = model;
process.env.OPENAI_T12_RECOVERY_REASONING_EFFORT = reasoningEffort;
process.env.OPENAI_RENT_ROLL_RECOVERY_REASONING_EFFORT = reasoningEffort;
process.env.OPENAI_SUPPORT_DOC_RECOVERY_REASONING_EFFORT = reasoningEffort;

const CASES = Object.freeze({
  t12_recovery: Object.freeze({
    module: 't12',
    fn: 'recoverT12WithAI',
    filename: 'eval-02-t12.pdf',
    text: [
      'Trailing Twelve Month Operating Statement',
      'Gross Potential Rent: $110,000',
      'Vacancy Loss: $10,000',
      'Effective Gross Income: $100,000',
      'Total Operating Expenses: $40,000',
      'Net Operating Income: $60,000',
    ].join('\n'),
    expected: Object.freeze({
      effective_gross_income: 100000,
      total_operating_expenses: 40000,
      net_operating_income: 60000,
      gross_potential_rent: 110000,
      vacancy_loss: 10000,
    }),
  }),
  rent_roll_recovery: Object.freeze({
    module: 'rent_roll',
    fn: 'recoverRentRollWithAI',
    filename: 'eval-02-rent-roll.pdf',
    text: [
      'Rent Roll as of 2026-07-28',
      'Total Units: 1',
      'Occupied Units: 1',
      'Vacant Units: 0',
      'Occupancy: 100%',
      'Monthly In-Place Rent: $1,000',
      'Annual In-Place Rent: $12,000',
      'Monthly Market Rent: $1,100',
      'Annual Market Rent: $13,200',
      'Unit 1 | Studio | occupied | Current Rent $1,000 | Market Rent $1,100 | Lease Start 2026-01-01 | Lease End 2026-12-31',
    ].join('\n'),
    expected: Object.freeze({
      'summary.total_units': 1,
      'summary.occupied_units': 1,
      'summary.vacant_units': 0,
      'summary.monthly_in_place_rent': 1000,
      'summary.annual_in_place_rent': 12000,
      'summary.monthly_market_rent': 1100,
      'summary.annual_market_rent': 13200,
    }),
  }),
  acquisition_assumptions_recovery: Object.freeze({
    module: 'support',
    fn: 'recoverAcquisitionPurchaseAssumptionsWithAI',
    filename: 'eval-02-acquisition-term-sheet.pdf',
    text: [
      'Acquisition Term Sheet',
      'Purchase Price: $3,750,000',
      'Target LTV: 75%',
      'Interest Rate: 5.85%',
      'Amortization: 25 years',
      'Going-In Cap Rate: 6.25%',
      'Closing Costs: 2.5%',
      'These are proposed acquisition financing assumptions and are not current outstanding debt.',
    ].join('\n'),
    expected: Object.freeze({
      purchase_price: 3750000,
      ltv: 75,
      interest_rate: 5.85,
      amortization_years: 25,
      going_in_cap_rate: 6.25,
      closing_costs_percent: 2.5,
    }),
  }),
  current_mortgage_recovery: Object.freeze({
    module: 'support',
    fn: 'recoverCurrentMortgageWithAI',
    filename: 'eval-02-current-mortgage.pdf',
    text: [
      'Current Mortgage Statement',
      'Current outstanding principal balance: $2,100,000',
      'Monthly payment: $13,625',
      'Current debt service: $163,500',
      'Interest rate: 4.25% fixed',
      'Amortization remaining: 23 years',
      'Maturity date 2028-06-01',
      'Existing lender: ABC Bank',
      'This document represents true existing current debt, not proposed acquisition financing.',
    ].join('\n'),
    expected: Object.freeze({
      outstanding_balance: 2100000,
      monthly_payment: 13625,
      annual_debt_service: 163500,
      interest_rate: 4.25,
      amortization_years: 23,
      maturity_date: '2028-06-01',
      lender_name: 'ABC Bank',
    }),
  }),
  renovation_capex_recovery: Object.freeze({
    module: 'support',
    fn: 'recoverRenovationWithAI',
    filename: 'eval-02-renovation-budget.pdf',
    text: [
      'Renovation / CapEx Budget',
      'Exterior / Curb Appeal: $45,000',
      'Common Areas: $30,000',
      'Unit Turns: $120,000',
      'Contingency: $20,000',
      'Total Budget: $215,000',
      'Unit Count: 12',
      'Per Unit Cost: $17,500',
    ].join('\n'),
    expected: Object.freeze({
      total_budget: 215000,
      unit_count: 12,
      per_unit_cost: 17500,
    }),
  }),
  property_tax_recovery: Object.freeze({
    module: 'support',
    fn: 'recoverPropertyTaxWithAI',
    filename: 'eval-02-property-tax.pdf',
    text: [
      'Property Tax Notice',
      'Annual Tax 2025 $42,300',
      'Tax Year 2025',
      'Assessment Roll 1234-567',
      'Assessed Value $12,500,000',
    ].join('\n'),
    expected: Object.freeze({
      annual_tax: 42300,
      tax_year: '2025',
      assessed_value: 12500000,
      roll_number: '1234-567',
    }),
  }),
  appraisal_recovery: Object.freeze({
    module: 'support',
    fn: 'recoverAppraisalWithAI',
    filename: 'eval-02-appraisal.pdf',
    text: [
      'Full Appraisal Report',
      'As-Is Value: $12,500,000',
      'Valuation Date: 2025-03-31',
      'Cap Rate: 4.99%',
      'Effective Gross Income: $1,250,000',
      'Net Operating Income: $623,750',
      'Value Basis: as-is',
      'Appraisal Type: full appraisal',
    ].join('\n'),
    expected: Object.freeze({
      appraised_value: 12500000,
      valuation_date: '2025-03-31',
      cap_rate: 4.99,
      effective_gross_income: 1250000,
      net_operating_income: 623750,
    }),
  }),
});

const testCase = CASES[jobId];
if (!testCase) {
  console.error(`Unknown AI MODEL EVAL 02 recovery job: ${jobId}`);
  process.exit(2);
}

const originalFetch = globalThis.fetch;
let providerUsage = null;
let providerModel = null;
let providerStatus = null;
let providerError = null;
let providerRequestId = null;
let requestEnvelope = null;
globalThis.fetch = async (...args) => {
  const options = args[1] || {};
  try {
    requestEnvelope = JSON.parse(String(options.body || '{}'));
    providerModel = requestEnvelope?.model || null;
  } catch {
    requestEnvelope = null;
  }
  const response = await originalFetch(...args);
  providerStatus = response.status;
  providerRequestId = response.headers?.get?.('x-request-id') || null;
  try {
    const copy = response.clone();
    const body = await copy.json();
    providerUsage = body?.usage || null;
    const error = body?.error;
    if (error) {
      providerError = {
        type: error.type || null,
        code: error.code || null,
        message: error.message || null,
        param: error.param || null,
      };
    }
  } catch {
    providerUsage = null;
  }
  return response;
};

const module =
  testCase.module === 't12'
    ? await import('../lib/ai-t12-recovery.js')
    : testCase.module === 'rent_roll'
      ? await import('../lib/ai-rent-roll-recovery.js')
      : await import('../lib/ai-support-doc-recovery.js');

const recoveryFn = module[testCase.fn];
if (typeof recoveryFn !== 'function') {
  console.error(`Recovery function not found: ${testCase.fn}`);
  process.exit(2);
}

const getPath = (value, path) => String(path).split('.').reduce((cursor, key) => cursor?.[key], value);
const equalExpected = (actual, expected) => {
  if (typeof expected === 'number') {
    const parsed = Number(actual);
    const tolerance = Math.max(0.000001, Math.abs(expected) * 0.000001);
    return Number.isFinite(parsed) && Math.abs(parsed - expected) <= tolerance;
  }
  return String(actual ?? '') === String(expected);
};

const startedAt = performance.now();
let result;
try {
  result = await recoveryFn({
    text: testCase.text,
    filename: testCase.filename,
    jobId: `ai-model-eval-02-${jobId}`,
    tables: [],
    includeDiagnostics: true,
  });
} catch (error) {
  console.log(JSON.stringify({
    eval: 'AI_MODEL_EVAL_02',
    job: jobId,
    model,
    reasoning_effort: reasoningEffort,
    pass: false,
    error: error instanceof Error ? error.message : String(error),
    elapsed_ms: Math.round(performance.now() - startedAt),
    provider_model: providerModel,
    provider_status: providerStatus,
    provider_error: providerError,
    provider_request_id: providerRequestId,
    usage: providerUsage,
  }));
  process.exit(1);
}

const elapsedMs = Math.round(performance.now() - startedAt);
const payload = result?.payload ?? result ?? null;
const diagnostics = result?.diagnostics ?? null;
const checks = Object.entries(testCase.expected).map(([path, expected]) => {
  const actual = getPath(payload, path);
  return { path, expected, actual: actual ?? null, pass: equalExpected(actual, expected) };
});
const fieldHits = checks.filter((check) => check.pass).length;
const accepted = Boolean(payload) && (diagnostics?.final_outcome ? diagnostics.final_outcome === 'accepted' : true);
const pass = accepted && fieldHits === checks.length;

console.log(JSON.stringify({
  eval: 'AI_MODEL_EVAL_02',
  job: jobId,
  model,
  reasoning_effort: reasoningEffort,
  pass,
  accepted,
  field_hits: fieldHits,
  field_total: checks.length,
  field_accuracy: checks.length ? fieldHits / checks.length : 0,
  elapsed_ms: elapsedMs,
  provider_model: providerModel,
  provider_status: providerStatus,
  provider_error: providerError,
  provider_request_id: providerRequestId,
  usage: providerUsage,
  diagnostics: diagnostics
    ? {
        final_outcome: diagnostics.final_outcome || null,
        openai_response_status: diagnostics.openai_response_status || null,
        validation_accepted: diagnostics.validation_accepted ?? null,
        rejection_reason: diagnostics.rejection_reason || null,
      }
    : null,
  checks,
}));

if (!pass) process.exitCode = 1;
