import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { analyzeTables } from '../../lib/textractClient.js';
import {
  recoverAcquisitionPurchaseAssumptionsWithAI,
  recoverAppraisalWithAI,
  recoverCurrentMortgageWithAI,
  recoverPropertyTaxWithAI,
  recoverRenovationWithAI,
  shouldAttemptAcquisitionPurchaseAssumptionsRecovery,
  shouldAttemptAppraisalRecovery,
  shouldAttemptCurrentMortgageRecovery,
  shouldAttemptPropertyTaxRecovery,
  shouldAttemptRenovationRecovery,
} from '../../lib/ai-support-doc-recovery.js';
import { recoverRentRollWithAI } from '../../lib/ai-rent-roll-recovery.js';
import { recoverT12WithAI } from '../../lib/ai-t12-recovery.js';

const safeTimestamp = (iso) => (iso || '').replace(/:/g, '-');

const writeAiRentRollRecoveryDiagnostic = async ({
  supabaseAdmin,
  jobId,
  userId,
  fileId,
  filename,
  diagnostics,
}) => {
  if (!diagnostics || typeof diagnostics !== 'object') return;
  const nowIso = new Date().toISOString();
  const safePayload = {
    event: 'ai_rent_roll_recovery_diagnostic',
    file_id: fileId || null,
    original_filename: filename || null,
    attempted: diagnostics.attempted === true,
    feature_enabled: diagnostics.feature_enabled === true,
    openai_api_key_present: diagnostics.openai_api_key_present === true,
    source_text_length: Number.isFinite(diagnostics.source_text_length)
      ? diagnostics.source_text_length
      : Number(diagnostics.source_text_length) || 0,
    openai_request_attempted: diagnostics.openai_request_attempted === true,
    openai_response_status: Number.isFinite(diagnostics.openai_response_status)
      ? diagnostics.openai_response_status
      : null,
    json_parse_success:
      typeof diagnostics.json_parse_success === 'boolean' ? diagnostics.json_parse_success : null,
    candidate_present: diagnostics.candidate_present === true,
    validation_accepted: diagnostics.validation_accepted === true,
    rejection_reason: diagnostics.rejection_reason || null,
    final_outcome: diagnostics.final_outcome || 'unknown_null',
    timestamp: nowIso,
  };

  const { error } = await supabaseAdmin.from('analysis_artifacts').insert([
    {
      job_id: jobId,
      user_id: userId || null,
      type: 'ai_rent_roll_recovery_diagnostic',
      bucket: 'internal',
      object_path: `analysis_jobs/${jobId}/ai_rent_roll_recovery_diagnostic/${fileId || 'unknown'}/${safeTimestamp(
        nowIso
      )}.json`,
      payload: safePayload,
    },
  ]);

  if (error) {
    console.error('Failed to write AI rent roll recovery diagnostic:', error.message);
  }
};

const writeAiSupportDocRecoveryDiagnostic = async ({
  supabaseAdmin,
  jobId,
  userId,
  fileId,
  filename,
  supportDocRecoveryType,
  initialDocType,
  declaredDocType,
  detectedDocType,
  eligibleRecovery,
  diagnostics,
}) => {
  if (!diagnostics || typeof diagnostics !== 'object') return;
  const nowIso = new Date().toISOString();
  const safePayload = {
    event: 'ai_support_doc_recovery_diagnostic',
    file_id: fileId || null,
    original_filename: filename || null,
    support_doc_recovery_type: supportDocRecoveryType || null,
    initial_doc_type: initialDocType || null,
    declared_doc_type: declaredDocType || null,
    detected_doc_type: detectedDocType || null,
    eligible_recovery: eligibleRecovery === true,
    eligible_acquisition_recovery: eligibleRecovery === true && supportDocRecoveryType === 'acquisition_purchase_assumptions',
    source_text_length: Number.isFinite(diagnostics.source_text_length)
      ? diagnostics.source_text_length
      : Number(diagnostics.source_text_length) || 0,
    feature_enabled: diagnostics.feature_enabled === true,
    openai_api_key_present: diagnostics.openai_api_key_present === true,
    model: diagnostics.model || null,
    recovery_attempted: diagnostics.openai_request_attempted === true,
    openai_request_attempted: diagnostics.openai_request_attempted === true,
    openai_response_status: Number.isFinite(diagnostics.openai_response_status)
      ? diagnostics.openai_response_status
      : null,
    openai_error_message: diagnostics.openai_error_message || null,
    openai_error_body: diagnostics.openai_error_body || null,
    candidate_present: diagnostics.candidate_present === true,
    validation_accepted: diagnostics.validation_accepted === true,
    accepted_fields: Array.isArray(diagnostics.accepted_fields)
      ? diagnostics.accepted_fields
      : [],
    rejection_reason: diagnostics.rejection_reason || null,
    final_outcome: diagnostics.final_outcome || 'unknown_null',
    timestamp: nowIso,
  };

  const { error } = await supabaseAdmin.from('analysis_artifacts').insert([
    {
      job_id: jobId,
      user_id: userId || null,
      type: 'ai_support_doc_recovery_diagnostic',
      bucket: 'internal',
      object_path: `analysis_jobs/${jobId}/ai_support_doc_recovery_diagnostic/${fileId || 'unknown'}/${safeTimestamp(
        nowIso
      )}.json`,
      payload: safePayload,
    },
  ]);

  if (error) {
    console.error('Failed to write AI support doc recovery diagnostic:', error.message);
  }
};

const getRequestBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (err) {
      return {};
    }
  }
  return req.body;
};

const normalizeHeader = (value) => String(value || '').trim().toLowerCase();
const normalizeCell = (value) => String(value || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim().toLowerCase();
const normalizeClassifierText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');

const parseMoneyLike = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const text = String(value).trim();
  if (!text || text === '-') return null;
  const isParenNegative = /^\(.*\)$/.test(text);
  // Extract first valid currency-like number only (ignore trailing % or extra numbers)
  const match = text.match(/\(?-?\$?\s*[\d,]+(?:\.\d{1,2})?\)?/);

  if (!match) return null;

  let cleaned = match[0]
    .replace(/[,$()\s]/g, '');

  let parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  if (isParenNegative && parsed > 0) parsed = -parsed;
  return parsed;
};

const isSpreadsheetMime = (mime) => String(mime || '').toLowerCase().includes('spreadsheetml');
const isXlsxName = (name) => String(name || '').toLowerCase().endsWith('.xlsx');
const isCsvName = (name) => String(name || '').toLowerCase().endsWith('.csv');
const isCsvMime = (mime) => String(mime || '').toLowerCase().includes('csv');

const detectRequiredFinancialDocTypeFromText = (text) => {
  const norm = String(text || '').toUpperCase().replace(/\s+/g, ' ');
  if (norm.length < 40) return 'unknown';
  const has = (terms) => terms.some((term) => norm.includes(term));
  const count = (terms) => terms.filter((term) => norm.includes(term)).length;
  const t12Score = count([
    'GROSS RENTAL INCOME',
    'GROSS POTENTIAL RENT',
    'GROSS POTENTIAL INCOME',
    'VACANCY LOSS',
    'EFFECTIVE GROSS INCOME',
    'TOTAL OPERATING EXPENSES',
    'TOTAL EXPENSES',
    'OPERATING EXPENSES',
    'NET OPERATING INCOME',
    ' NOI',
  ]);
  const rentRollScore = count([
    'TOTAL UNITS',
    'OCCUPIED UNITS',
    'VACANT UNITS',
    'OCCUPANCY',
    'CURRENT RENT',
    'IN-PLACE RENT',
    'IN PLACE RENT',
    'MARKET RENT',
    'IN-PLACE ANNUAL RENT',
    'MARKET ANNUAL RENT',
    'RENT ROLL',
    'UNIT ROSTER',
  ]);
  const hasT12Core =
    has(['EFFECTIVE GROSS INCOME']) &&
    has(['TOTAL OPERATING EXPENSES', 'TOTAL EXPENSES', 'OPERATING EXPENSES']) &&
    has(['NET OPERATING INCOME', ' NOI']);
  const hasRentRollCore =
    has(['TOTAL UNITS', 'UNIT ROSTER', 'RENT ROLL']) &&
    has(['OCCUPANCY', 'OCCUPIED UNITS', 'VACANT UNITS']) &&
    has(['CURRENT RENT', 'IN-PLACE RENT', 'IN PLACE RENT', 'MARKET RENT', 'IN-PLACE ANNUAL RENT', 'MARKET ANNUAL RENT']);

  if ((hasT12Core || t12Score >= 4) && t12Score >= rentRollScore + 2) return 't12';
  if ((hasRentRollCore || rentRollScore >= 4) && rentRollScore >= t12Score + 2) return 'rent_roll';
  return 'unknown';
};

const SUPPORTING_DOC_ALIASES = {
  mortgage_statement: [
    'Current Mortgage Statement',
    'Existing mortgage',
    'Current mortgage',
    'True current debt',
    'Current outstanding principal balance',
    'Unpaid principal balance',
    'Outstanding principal balance',
    'Current outstanding balance',
    'Principal balance',
    'Outstanding loan balance',
    'Mortgage balance',
    'Current monthly debt service',
    'Monthly payment',
    'Regular payment',
    'Maturity date',
    'Mortgagee',
    'Existing lender',
    'Current loan balance',
  ],
  loan_term_sheet: [
    'Indicative acquisition financing',
    'Proposed loan amount',
    'Proposed LTV',
    'Borrower to be determined',
    'Purchaser',
    'Acquisition financing',
    'Refinance / acquisition financing',
    'Loan amount at purchase price',
    'Not a financing commitment',
    'Term sheet',
    'Loan-to-value',
    'Exit cap',
    'Refi cap',
  ],
  property_tax: [
    'Property Tax Notice',
    'Municipal Property Taxes',
    'Realty Tax',
    'Real Estate Taxes',
    'Tax Bill',
    'Tax Notice',
    'Annual Taxes',
    'Roll Number',
    'Assessment Roll',
    'Installments',
  ],
  renovation: [
    'Renovation Budget',
    'CapEx',
    'Cap Ex',
    'Capital Expenditure',
    'Capital Budget',
    'Scope of Work',
    'Unit Turns',
    'Contingency',
    'Forward-looking renovation plan',
    'Rent lift',
    'Phasing',
    'Payback',
    'ROI',
  ],
};

export function inferSupportingDocTypeFromText(text, options = {}) {
  const allowFilenameHint = options.allowFilenameHint !== false;
  const filename = options.filename || '';
  const requiredFinancialType = detectRequiredFinancialDocTypeFromText(text);
  if (requiredFinancialType !== 'unknown') return requiredFinancialType;

  const norm = String(text || '').toUpperCase().replace(/\s+/g, ' ');
  const has = (terms) => terms.some((t) => norm.includes(String(t || '').toUpperCase()));
  const countMatches = (terms) => terms.filter((t) => norm.includes(String(t || '').toUpperCase())).length;
  const nameNorm = String(filename || '').toUpperCase().replace(/\s+/g, ' ');
  const hasFinancingValuePattern =
    /\d+(?:\.\d+)?\s*%/.test(norm) ||
    /\$\s*[\d,]+(?:\.\d{2})?/.test(norm) ||
    /\b\d+\s*(?:YRS|YR|YEARS)\b/.test(norm);

  const unsupportedSupportDoc =
    has(['UNSUPPORTED']) &&
    has(['MARKET SURVEY', 'APPRAISAL SUMMARY', 'APPRAISAL EXCERPT', 'PHASE I ESA', 'ENVIRONMENTAL REPORT']);
  if (unsupportedSupportDoc) return 'supporting_documents_unclassified';

  const currentDebtSignals = countMatches(SUPPORTING_DOC_ALIASES.mortgage_statement);
  const explicitCurrentDebtContext =
    /\b(?:current\s+mortgage\s+statement|existing\s+mortgage|true\s+(?:existing\s+)?current\s+debt|current\s+outstanding\s+principal\s+balance|unpaid\s+principal\s+balance|outstanding\s+principal\s+balance|current\s+loan\s+balance|mortgage\s+balance|current\s+monthly\s+debt\s+service)\b/i.test(text);
  if (explicitCurrentDebtContext && currentDebtSignals >= 2) {
    return 'mortgage_statement';
  }

  const acquisitionSignals = countMatches(SUPPORTING_DOC_ALIASES.loan_term_sheet);
  const acquisitionOnlyContext = has([
    'BORROWER TO BE DETERMINED',
    'PURCHASER',
    'ACQUISITION FINANCING',
    'INDICATIVE ACQUISITION FINANCING',
    'LOAN AMOUNT AT PURCHASE PRICE',
    'NOT A FINANCING COMMITMENT',
  ]);
  if (acquisitionSignals >= 2 || has(['TERM SHEET', 'REFI TERMS', 'LOAN TERMS']) || (acquisitionSignals >= 1 && hasFinancingValuePattern)) {
    return 'loan_term_sheet';
  }

  if (!acquisitionOnlyContext && currentDebtSignals >= 2 && has(['MORTGAGE', 'PRINCIPAL', 'LENDER', 'MORTGAGEE', 'PAYMENT', 'MATURITY'])) {
    return 'mortgage_statement';
  }

  const renovationSignals = countMatches(SUPPORTING_DOC_ALIASES.renovation);
  const renovationNameSignal = /renovation|capex|cap ex|capital|budget|scope/i.test(nameNorm);
  if ((allowFilenameHint && renovationNameSignal && renovationSignals >= 1) || renovationSignals >= 2) return 'renovation';

  if (countMatches(SUPPORTING_DOC_ALIASES.property_tax) >= 2 || has(['PROPERTY TAX', 'ASSESSMENT', 'MUNICIPAL', 'ROLL NUMBER'])) return 'property_tax';
  if (has(['APPRAISAL', 'OPINION OF VALUE', 'AS-IS VALUE', 'CAP RATE', 'VALUATION'])) return 'appraisal';
  if (has(['POLICY NUMBER', 'NAMED INSURED']) && countMatches(['COVERAGE', 'PREMIUM', 'EFFECTIVE DATE', 'EXPIRATION DATE', 'DEDUCTIBLE']) >= 2) return 'insurance_policy';
  if (has(['BEGINNING BALANCE', 'ENDING BALANCE']) && countMatches(['ACCOUNT NUMBER', 'DEPOSITS', 'WITHDRAWALS', 'DAILY BALANCE', 'STATEMENT PERIOD']) >= 2) return 'bank_statement';
  return 'supporting_documents_unclassified';
}

const extractDollarNearText = (text, labels) => {
  const lower = String(text || '').toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(String(label || '').toLowerCase());
    if (idx === -1) continue;
    const snippet = String(text || '').slice(idx, idx + 140);
    const match = snippet.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (Number.isFinite(val) && val > 500) return val;
    }
  }
  return null;
};

const extractPercentNearText = (text, labels) => {
  const lower = String(text || '').toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(String(label || '').toLowerCase());
    if (idx === -1) continue;
    const snippet = String(text || '').slice(idx, idx + 100);
    const match = snippet.match(/([\d]+(?:\.\d{1,4})?)\s*%/);
    if (match) {
      const val = parseFloat(match[1]);
      if (Number.isFinite(val) && val > 0) return val;
    }
  }
  return null;
};

const extractYearsNearText = (text, labels) => {
  const lower = String(text || '').toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(String(label || '').toLowerCase());
    if (idx === -1) continue;
    const snippet = String(text || '').slice(idx, idx + 100);
    const match = snippet.match(/(\d{1,2})\s*(?:years?|yr)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (Number.isFinite(val) && val > 0) return val;
    }
  }
  return null;
};

const extractDateNearText = (text, labels) => {
  const lower = String(text || '').toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(String(label || '').toLowerCase());
    if (idx === -1) continue;
    const snippet = String(text || '').slice(idx, idx + 120).trim();
    const match =
      snippet.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]{3,9}\s+\d{4}|\d{4})\b/) ||
      snippet.match(/\b(?:maturity\s+date|due\s+date)[:\s-]*([^\n;]+)/i);
    if (match) {
      const value = String(match[1] || match[0] || '').trim();
      if (value) return value;
    }
  }
  return null;
};

export function parseMortgageStatementFromText(rawText, fileRow = {}) {
  const parse_warnings = [];
  const outstanding_balance = extractDollarNearText(rawText, [
    'current outstanding principal balance',
    'unpaid principal balance',
    'outstanding principal balance',
    'current outstanding balance',
    'outstanding balance',
    'principal balance',
    'current loan balance',
    'mortgage balance',
    'loan balance',
    'outstanding loan',
    'remaining balance',
    'balance outstanding',
  ]);
  const interest_rate = extractPercentNearText(rawText, [
    'interest rate',
    'rate:',
    'annual rate',
    'note rate',
  ]);
  const monthly_payment = extractDollarNearText(rawText, [
    'current monthly debt service',
    'monthly debt service',
    'monthly payment',
    'regular payment',
    'payment amount',
    'principal and interest',
    'p&i payment',
    'total payment',
  ]);
  const amort_years = extractYearsNearText(rawText, [
    'amortization remaining',
    'remaining amortization',
    'amortization',
    'amortization period',
    'amort period',
  ]);
  const lender_name_match = String(rawText || '').match(/(?:lender|bank|mortgagee)[:\s]+([A-Za-z0-9 &.,'-]{3,60})/i);
  const lender_name = lender_name_match ? lender_name_match[1].trim() : null;
  const maturity_date = extractDateNearText(rawText, [
    'maturity date',
    'due date',
    'matures',
    'maturity',
  ]);

  if (!outstanding_balance) parse_warnings.push('missing_outstanding_balance');
  if (!interest_rate) parse_warnings.push('missing_interest_rate');
  if (!monthly_payment) parse_warnings.push('missing_monthly_payment');

  return {
    file_id: fileRow?.id || null,
    original_filename: fileRow?.original_filename || null,
    method: 'text_excerpt',
    lender_name,
    outstanding_balance,
    interest_rate,
    monthly_payment,
    monthly_debt_service: monthly_payment,
    annual_debt_service: Number.isFinite(monthly_payment) ? Math.round(monthly_payment * 12) : null,
    amort_years,
    maturity_date,
    parse_warnings,
  };
}

const hasAnyValue = (row) => row.some((cell) => String(cell || '').trim() !== '');

const isBlankRow = (row) => !row || row.every((cell) => String(cell || '').trim() === '');

const headerTokenSet = [
  'unit',
  'apt',
  'suite',
  'bed',
  'bath',
  'rent',
  'market',
  'sqft',
  'sf',
  'occup',
  'status',
  'tenant',
];

const RENT_ROLL_ALIASES = {
  unit: [
    'Unit',
    'Suite',
    'Unit Number',
    'Unit #',
    'Apt',
    'Apt #',
    'Apartment',
    'Apartment Number',
    'Suite Number',
    'Unit ID',
    'UnitID',
    'Unit Name',
    'Door',
    'Premises',
    'Premise',
  ],
  unit_type: [
    'Unit Type',
    'Type',
    'Layout',
    'Floor Plan',
    'Floorplan',
    'Bedroom Type',
    'Beds',
    'Bedrooms',
    'BR',
    'Plan',
    'Model',
    'Suite Type',
    'Beds/Baths',
    'Bed/Bath',
    'BR/BA',
    'Configuration',
  ],
  status: [
    'Status',
    'Occupancy Status',
    'Occupied',
    'Vacant',
    'Lease Status',
    'Unit Status',
    'Occupancy',
    'Occ Status',
    'Availability',
    'Available',
    'Vacancy',
    'Vacant/Occupied',
  ],
  in_place_rent: [
    'In-Place Rent',
    'In Place Rent',
    'Current Rent',
    'Rent',
    'Monthly Rent',
    'Current Monthly Rent',
    'Monthly Charge',
    'Contract Rent',
    'Actual Rent',
    'Lease Rent',
    'Tenant Rent',
    'Rent Amount',
    'Base Rent',
    'Scheduled Rent',
    'Collected Rent',
    'Residential Rent',
  ],
  market_rent: [
    'Market Rent',
    'Asking Rent',
    'Legal Rent',
    'Target Rent',
    'Pro Forma Rent',
    'Proforma Rent',
    'Stabilized Rent',
    'Estimated Market Rent',
    'Market',
    'Market Monthly Rent',
    'Projected Rent',
    'Asking',
    'Street Rent',
    'Target Monthly Rent',
    'Post-Reno Rent',
    'Renovated Rent',
  ],
  sqft: [
    'Sq Ft',
    'SQFT',
    'SqFt',
    'Sq. Ft.',
    'SF',
    'Area',
    'Square Feet',
    'Square Footage',
    'Rentable SF',
    'RSF',
    'Size',
    'Area SF',
    'Unit Area',
  ],
  lease_dates: [
    'Lease Start',
    'Lease End',
    'Start Date',
    'End Date',
    'Move In',
    'Move-In Date',
    'Expiration',
    'Expiry',
    'Term',
  ],
  total_units: ['Total Units', 'Unit Count', 'Number of Units', '# Units', 'Suites', 'Total Suites', 'Door Count'],
  occupied_units: ['Occupied Units', 'Units Occupied', 'Occupied Suites', 'Occupied', 'Leased Units', 'Leased'],
  vacant_units: ['Vacant Units', 'Units Vacant', 'Vacant Suites', 'Vacancy', 'Available Units'],
  occupancy: ['Occupancy', 'Occupancy %', 'Physical Occupancy', 'Economic Occupancy', 'Leased %', 'Occupied %'],
};

const RENT_ROLL_EXACT_ONLY_ALIASES = new Set(
  ['Unit', 'Suite', 'Apt', 'Apartment', 'Door', 'Premises', 'Premise', 'Type', 'Beds', 'Bedrooms', 'BR', 'Plan', 'Model', 'Status', 'Occupied', 'Vacant', 'Occupancy', 'Available', 'Vacancy', 'Rent', 'Market', 'Asking', 'SF', 'Area', 'Size', 'Leased'].map((value) =>
    normalizeClassifierText(value)
  )
);

const rentRollHeaderMatches = (header, alias) => {
  const normalizedHeader = normalizeClassifierText(header);
  const normalizedAlias = normalizeClassifierText(alias);
  if (!normalizedHeader || !normalizedAlias) return false;
  if (normalizedHeader === normalizedAlias) return true;
  if (RENT_ROLL_EXACT_ONLY_ALIASES.has(normalizedAlias)) return false;
  return normalizedHeader.includes(normalizedAlias);
};

const countHeaderTokens = (row) => {
  if (!Array.isArray(row)) return 0;
  const joined = row.map((cell) => normalizeText(cell)).join(' ');
  let count = 0;
  for (const token of headerTokenSet) {
    if (joined.includes(token)) count += 1;
  }
  return count;
};

const findColumnIndex = (row, tokens) => {
  if (!Array.isArray(row)) return -1;
  for (let i = 0; i < row.length; i += 1) {
    const value = normalizeText(row[i]);
    if (!value) continue;
    for (const token of tokens) {
      if (value.includes(token)) {
        return i;
      }
    }
  }
  return -1;
};

const extractNumericRight = (row, startIndex) => {
  for (let i = startIndex + 1; i < row.length; i += 1) {
    const value = parseMoneyLike(row[i]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

const T12_VALUE_COLUMN_ALIASES = [
  'Annual Total',
  'Annual Amount',
  'Annual',
  'T12',
  'T-12',
  'TTM',
  'TTM Amount',
  'TTM Total',
  'Trailing 12',
  'Trailing Twelve',
  'Trailing Twelve Months',
  'Last Twelve Months',
  'LTM',
  'LTM Amount',
  'T-12 Total',
  'Total',
  'Amount',
  'Value',
  'Actual',
  'Actuals',
  'Current Year',
  'Year End',
  'Year-End',
  'Fiscal Year',
  'FY',
  'FY Total',
  'CY',
  'CY Total',
  'Current Period',
  'Period Total',
  'Year to Date',
  'YTD',
  'YTD Actual',
  'YTD Total',
];

const T12_LABEL_ALIASES = {
  effective_gross_income: [
    'Effective Gross Income',
    'EGI',
    'Total Effective Income',
    'Effective Rental Income',
    'Net Rental Income',
    'Total Income After Vacancy',
    'Rental Income Net of Vacancy',
    'Gross Operating Income',
    'GOI',
    'Total Operating Income',
    'Operating Income',
    'Gross Income',
    'Total Revenue',
    'Operating Revenue',
    'Rental Revenue Net of Vacancy',
    'Income After Vacancy',
    'Revenue After Vacancy',
  ],
  gross_potential_rent: [
    'Gross Potential Rent',
    'GPR',
    'Gross Scheduled Rent',
    'Scheduled Rent',
    'Market Rent Potential',
    'Potential Rental Income',
    'Potential Gross Rent',
    'Scheduled Rental Income',
    'Gross Scheduled Income',
    'Apartment Rent',
    'Residential Rental Income',
    'Base Rent',
    'Contract Rent',
    'Rental Revenue',
    'Total Rental Income',
    'Gross Potential Income',
    'Gross Rental Income',
    'Rental Income',
    'Gross Rental Revenue',
  ],
  vacancy_loss: [
    'Vacancy',
    'Vacancy Loss',
    'Vacancy / Credit Loss',
    'Credit Loss',
    'Collection Loss',
    'Bad Debt',
    'Concessions',
    'Vacancy Allowance',
    'Vacancy & Collection Loss',
    'Vacancy and Credit Loss',
    'Vacancy Deduction',
    'Vacancy Reserve',
    'Loss to Lease',
    'Loss-to-Lease',
    'Rent Loss',
    'Bad Debt Expense',
    'Concession Loss',
    'Rent Concessions',
  ],
  total_operating_expenses: [
    'Total Operating Expenses',
    'Total Expenses',
    'Operating Expenses',
    'OpEx',
    'Total OpEx',
    'Expenses Total',
    'Operating Expense Total',
    'Total Operating Expense',
    'Total Controllable Expenses',
    'Total Property Expenses',
    'Property Operating Expenses',
    'Real Estate Operating Expenses',
    'Expenses',
  ],
  net_operating_income: [
    'Net Operating Income',
    'NOI',
    'Net Income from Operations',
    'Operating NOI',
    'Net Operating',
    'Net Operating Revenue',
    'Income Before Debt Service',
    'Cash Flow Before Debt Service',
    'Net Income Before Debt',
    'Property NOI',
    'Stabilized NOI',
  ],
  other_income: [
    'Other Income',
    'Laundry Income',
    'Parking Income',
    'Misc Income',
    'Miscellaneous Income',
    'Ancillary Income',
    'Ancillary Revenue',
    'Laundry Revenue',
    'Parking Revenue',
    'Storage Income',
    'Storage Revenue',
    'Pet Fees',
    'Application Fees',
    'Late Fees',
    'Utility Recoveries',
    'Utility Reimbursements',
    'RUBS',
    'Reimbursement Income',
    'Admin Fees',
  ],
};

const T12_EXPENSE_LINE_ALIASES = {
  property_taxes: ['Property Taxes', 'Taxes', 'Real Estate Taxes'],
  insurance: ['Insurance'],
  utilities: ['Utilities', 'Water', 'Sewer', 'Gas', 'Hydro', 'Electricity'],
  repairs_maintenance: ['Repairs', 'Maintenance', 'Repairs & Maintenance', 'Repairs and Maintenance'],
  management: ['Management', 'Property Management', 'Management Fee'],
  payroll_admin: ['Payroll', 'Superintendent', 'Admin', 'Administrative'],
  garbage_misc: ['Garbage', 'Waste', 'Trash', 'Snow', 'Landscaping', 'Contract Services', 'Misc'],
};

const T12_EXACT_ONLY_ALIASES = new Set(
  [
    'Operating Income',
    'Gross Income',
    'Total Revenue',
    'Operating Revenue',
    'Expenses',
    'Rental Income',
    'Base Rent',
    'Contract Rent',
    'Rent Loss',
    'Net Operating',
    'Taxes',
    'Management',
    'Admin',
    'Water',
    'Gas',
    'Hydro',
    'Snow',
    'Misc',
  ].map((value) => normalizeClassifierText(value))
);

const isProjectedT12LabelWithoutActualContext = (label) => {
  const normalizedLabel = normalizeClassifierText(label);
  if (!/\b(?:proforma|proposed|projected|forecast|budget|stabilized)\b/.test(normalizedLabel)) return false;
  return !/\b(?:actual|current|t12|ttm|ltm|trailing|annual|year|fiscal)\b/.test(normalizedLabel);
};

const labelMatchesT12Alias = (label, alias) => {
  const normalizedLabel = normalizeClassifierText(label);
  const normalizedAlias = normalizeClassifierText(alias);
  if (!normalizedLabel || !normalizedAlias) return false;
  if (isProjectedT12LabelWithoutActualContext(normalizedLabel)) return false;
  if (normalizedLabel === normalizedAlias) return true;
  if (T12_EXACT_ONLY_ALIASES.has(normalizedAlias)) return false;
  return normalizedLabel.includes(normalizedAlias);
};

const T12_TOTAL_HEADER_RE =
  /\b(?:ttm(?:\s*(?:amount|total))?|t\s*-?\s*12(?:\s*total)?|trailing\s*(?:12|twelve)(?:\s*months)?|last\s*twelve\s*months|ltm(?:\s*amount)?|annual(?:\s*(?:total|amount))?|total|amount|value|actuals?|current\s*year|year[-\s]*end|fiscal\s*year|fy(?:\s*total)?|cy(?:\s*total)?|current\s*period|period\s*total|year\s*to\s*date|ytd(?:\s*(?:actual|total))?)\b/i;
const T12_MONTH_HEADER_RE = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;

const getT12TotalColumnIndexes = (headerRows) => {
  const rows = Array.isArray(headerRows) ? headerRows : [];
  const indexes = new Set();
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (let i = 0; i < row.length; i += 1) {
      const text = String(row[i] || '').trim();
      if (!text) continue;
      if (T12_TOTAL_HEADER_RE.test(text) && !T12_MONTH_HEADER_RE.test(text)) {
        indexes.add(i);
      }
    }
  }
  return Array.from(indexes).sort((a, b) => a - b);
};

const parseT12TotalColumnValue = (row, totalColumnIndexes, key = null) => {
  if (!Array.isArray(row) || !Array.isArray(totalColumnIndexes) || totalColumnIndexes.length === 0) return null;
  for (const idx of [...totalColumnIndexes].sort((a, b) => b - a)) {
    const cell = String(row[idx] || '').toLowerCase();
    if (cell.includes('%')) continue;
    const value = numericFromCell(row[idx]);
    if (!Number.isFinite(value)) continue;
    if (value > 1_000_000_000) continue;
    if (key && !isPlausibleT12Field(key, value)) continue;
    return value;
  }
  return null;
};

const labelRules = [
  { key: 'gross_potential_rent', labels: T12_LABEL_ALIASES.gross_potential_rent },
  { key: 'effective_gross_income', labels: T12_LABEL_ALIASES.effective_gross_income },
  { key: 'total_operating_expenses', labels: T12_LABEL_ALIASES.total_operating_expenses },
  { key: 'net_operating_income', labels: T12_LABEL_ALIASES.net_operating_income },
];

const numericFromCell = (value) => {
  return parseMoneyLike(value);
};

const isPlausibleT12Field = (key, value) => {
  if (!Number.isFinite(value)) return false;
  if (key === 'effective_gross_income' && value <= 0) return false;
  if (key === 'total_operating_expenses' && value < 0) return false;
  return true;
};

export const validateCoreT12Payload = (payload, parseBranch) => {
  const effectiveGrossIncome = Number(payload?.effective_gross_income);
  const totalOperatingExpenses = Number(payload?.total_operating_expenses);
  const netOperatingIncome = Number(payload?.net_operating_income);
  const failures = [];

  if (!isPlausibleT12Field('effective_gross_income', effectiveGrossIncome)) failures.push('invalid_effective_gross_income');
  if (!isPlausibleT12Field('total_operating_expenses', totalOperatingExpenses)) failures.push('invalid_total_operating_expenses');
  if (!isPlausibleT12Field('net_operating_income', netOperatingIncome)) failures.push('invalid_net_operating_income');

if (failures.length === 0) {
  const expectedNoi = effectiveGrossIncome - totalOperatingExpenses;
  const normalizedNoi = Math.abs(netOperatingIncome);
  const tolerance = Math.max(5000, Math.abs(effectiveGrossIncome) * 0.03);
  if (Math.abs(expectedNoi - normalizedNoi) > tolerance) {
    failures.push('core_t12_equation_mismatch');
  }
}

  return {
    ok: failures.length === 0,
    failures,
    parse_branch: parseBranch,
    accepted_core_values: {
      effective_gross_income: Number.isFinite(effectiveGrossIncome) ? effectiveGrossIncome : null,
      total_operating_expenses: Number.isFinite(totalOperatingExpenses) ? totalOperatingExpenses : null,
      net_operating_income: Number.isFinite(netOperatingIncome) ? netOperatingIncome : null,
    },
  };
};

const parseT12CurrencyAmountFromLine = (line) => {
  const text = String(line || '');
  const match = text.match(/\(?-?\$\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?:\d+(?:\.\d+)?%)?\)?/);
  if (!match) return null;
  let value = Number(String(match[1] || '').replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  if (/^\s*\(|^\s*-/.test(match[0])) value = -Math.abs(value);
  return value;
};

export const extractT12LineItemsFromText = (text, totalOpex) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const amountOnLine = (pattern) => {
    for (const line of lines) {
      if (!pattern.test(line)) continue;
      const value = parseT12CurrencyAmountFromLine(line);
      if (Number.isFinite(value)) return value;
    }
    return null;
  };
  const incomeLineSpecs = [
    { label: 'Gross Potential Rent', pattern: /gross\s+potential\s+rent|gross\s+rental\s+income/i },
    { label: 'Other Income', pattern: /other\s+income|laundry|parking/i },
    { label: 'Vacancy Loss', pattern: /vacancy\s+loss|vacancy/i },
    { label: 'Effective Gross Income', pattern: /effective\s+gross\s+income|egi/i },
  ];
  const expenseLineSpecs = [
    { label: 'Property Taxes', pattern: /property\s+taxes|real\s+estate\s+taxes/i },
    { label: 'Insurance', pattern: /^insurance\b|[^a-z]insurance\b/i },
    { label: 'Utilities', pattern: /utilities|water|hydro|gas/i },
    { label: 'Repairs & Maintenance', pattern: /repairs|maintenance/i },
    { label: 'Management Fee', pattern: /management\s+fee|property\s+management/i },
    { label: 'Payroll / Admin', pattern: /payroll|admin/i },
    { label: 'Garbage / Miscellaneous', pattern: /garbage|misc/i },
  ];
  const incomeLines = incomeLineSpecs
    .map((spec) => ({ label: spec.label, amount: amountOnLine(spec.pattern) }))
    .filter((row) => Number.isFinite(row.amount));
  const expenseLines = expenseLineSpecs
    .map((spec) => ({ label: spec.label, amount: amountOnLine(spec.pattern) }))
    .filter((row) => Number.isFinite(row.amount) && row.amount > 0);
  const expenseSum = expenseLines.reduce((sum, row) => sum + row.amount, 0);
  const expenseTolerance = Number.isFinite(totalOpex) ? Math.max(5000, Math.abs(totalOpex) * 0.02) : null;
  const expenseLinesValidated =
    expenseLines.length >= 3 &&
    (!Number.isFinite(totalOpex) || Math.abs(expenseSum - totalOpex) <= expenseTolerance);
  return {
    income_lines: incomeLines,
    expense_lines: expenseLinesValidated ? expenseLines : [],
    expense_lines_found: expenseLinesValidated ? expenseLines.length : 0,
  };
};

const deleteExistingT12Artifacts = async (supabaseAdmin, jobId, fileId) => {
  const { error } = await supabaseAdmin
    .from('analysis_artifacts')
    .delete()
    .eq('job_id', jobId)
    .eq('type', 't12_parsed')
    .or(`payload->>file_id.eq.${String(fileId)},object_path.eq.analysis_jobs/${jobId}/t12/${fileId}.json`);

  if (error) {
    throw new Error(`Failed to clear previous t12 artifact: ${error.message}`);
  }
};

const toSheetRows = (sheet) => {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) || [];
  return rawRows.map((row) =>
    Array.isArray(row) ? row.map((cell) => String(cell ?? '').trim()) : []
  );
};

const getWorkbookRowMatrices = (workbook) =>
  (workbook?.SheetNames || [])
    .map((sheetName) => {
      const sheet = workbook.Sheets?.[sheetName];
      if (!sheet) return null;
      const rows = toSheetRows(sheet);
      return { sheetName, rows };
    })
    .filter((entry) => Array.isArray(entry?.rows) && entry.rows.length > 0);

const findHeaderIndex = (headerCells, tokenGroups) => {
  for (let i = 0; i < headerCells.length; i += 1) {
    const header = headerCells[i];
    if (!header) continue;
    for (const token of tokenGroups) {
      if (rentRollHeaderMatches(header, token)) return i;
    }
  }
  return -1;
};

const isMarketRentHeaderLabel = (value) => {
  const label = normalizeClassifierText(value);
  if (!label) return false;
  return RENT_ROLL_ALIASES.market_rent.some((alias) => rentRollHeaderMatches(label, alias));
};

const rentRollStatusIsOccupied = (value) => {
  const status = normalizeClassifierText(value);
  if (!status) return null;
  if (/\b(?:vacant|vacancy|available|down|model)\b/.test(status)) return false;
  if (/\b(?:occupied|leased|current|tenant|rented)\b/.test(status)) return true;
  return null;
};

export const parseRentRollFromRowMatrices = (rowMatrices) => {
  const matrices = Array.isArray(rowMatrices) ? rowMatrices : [];
  for (const matrix of matrices) {
    const rows = Array.isArray(matrix?.rows) ? matrix.rows : [];
    if (!rows.length) continue;

    let headerIdx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const hasUnitHeader = row.some((cell) =>
        RENT_ROLL_ALIASES.unit.some((alias) => rentRollHeaderMatches(cell, alias))
      );
      const hasRentHeader = row.some((cell) =>
        RENT_ROLL_ALIASES.in_place_rent.some((alias) => rentRollHeaderMatches(cell, alias)) && !isMarketRentHeaderLabel(cell)
      );
      if (hasUnitHeader && hasRentHeader) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) continue;

    const header = rows[headerIdx] || [];
    const unitIdx = findHeaderIndex(header, RENT_ROLL_ALIASES.unit);
    let rentIdx = findHeaderIndex(header, RENT_ROLL_ALIASES.in_place_rent);
    if (rentIdx !== -1 && isMarketRentHeaderLabel(header[rentIdx])) rentIdx = -1;
    if (rentIdx === -1) {
      rentIdx = header.findIndex((cell) => {
        const label = normalizeClassifierText(cell);
        return label.includes('rent') && !isMarketRentHeaderLabel(cell);
      });
    }
    const marketRentIdx = findHeaderIndex(header, RENT_ROLL_ALIASES.market_rent);
    const statusIdx = findHeaderIndex(header, RENT_ROLL_ALIASES.status);
    const unitTypeIdx = findHeaderIndex(header, RENT_ROLL_ALIASES.unit_type);
    const bedsIdx = findHeaderIndex(header, ['beds', 'bed', 'bedrooms', 'br', 'bedroom type', 'beds/baths', 'bed/bath', 'br/ba']);
    const bathsIdx = findHeaderIndex(header, ['baths', 'bath', 'ba']);
    const sqftIdx = findHeaderIndex(header, RENT_ROLL_ALIASES.sqft);

    const units = [];
    const unitMixMap = {};
    const rentValuesByType = {};
    const marketValuesByType = {};
    let occupiedCount = 0;
    let statusCount = 0;
    let blankRowStreak = 0;
    let explicitTotalUnits = null;
    const summaryTotals = {};
    const assignFiniteSummaryTotal = (key, value) => {
      if (Number.isFinite(value)) summaryTotals[key] = value;
    };
    const parseSummaryPercent = (row) => {
      const text = row.map((cell) => String(cell || '')).join(' ');
      const afterValue = text.match(/\b(\d{1,3}(?:\.\d+)?)\s*%\s*(?:occ|occupancy)\b/i);
      const beforeValue = text.match(/\b(?:occ|occupancy)\b[^\d]{0,12}(\d{1,3}(?:\.\d+)?)\s*%/i);
      const match = afterValue || beforeValue;
      if (!match) return null;
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed / 100 : null;
    };
    const parseSummaryCount = (row, label) => {
      const text = row.map((cell) => String(cell || '')).join(' ');
      const afterValue = text.match(new RegExp(`\\b(\\d{1,5})\\s+${label}\\b`, 'i'));
      const beforeValue = text.match(new RegExp(`\\b${label}\\b[^\\d]{0,12}(\\d{1,5})\\b`, 'i'));
      const match = afterValue || beforeValue;
      if (!match) return null;
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };
    const parseSummaryMoneyAt = (row, index) => {
      if (index === -1) return null;
      const raw = String(row[index] || '');
      if (!raw.trim() || raw.includes('%')) return null;
      const parsed = parseMoneyLike(raw);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };
    const applySummaryTotalsFromRow = (row) => {
      summaryTotals.summary_row_detected = true;
      for (const cell of row) {
        const match = String(cell || '').match(/\b(\d{1,5})\s*units?\b/i);
        if (match) {
          const parsed = Number(match[1]);
          if (Number.isFinite(parsed) && parsed > 0) {
            explicitTotalUnits = parsed;
            summaryTotals.total_units = parsed;
          }
        }
      }
      assignFiniteSummaryTotal('occupancy', parseSummaryPercent(row));
      assignFiniteSummaryTotal('occupied_units', parseSummaryCount(row, 'occupied'));
      assignFiniteSummaryTotal('vacant_units', parseSummaryCount(row, 'vacant'));

      const currentRentTotal = parseSummaryMoneyAt(row, rentIdx);
      if (Number.isFinite(currentRentTotal)) {
        const rentHeaderLabel = normalizeClassifierText(header[rentIdx]);
        if (rentHeaderLabel.includes('annual') || rentHeaderLabel.includes('year')) {
          summaryTotals.in_place_rent_annual = currentRentTotal;
          summaryTotals.in_place_rent_monthly = currentRentTotal / 12;
          summaryTotals.current_rent_monthly = currentRentTotal / 12;
        } else {
          summaryTotals.current_rent_monthly = currentRentTotal;
          summaryTotals.in_place_rent_monthly = currentRentTotal;
          summaryTotals.in_place_rent_annual = currentRentTotal * 12;
        }
      }

      const marketRentTotal = parseSummaryMoneyAt(row, marketRentIdx);
      if (Number.isFinite(marketRentTotal)) {
        const marketHeaderLabel = normalizeClassifierText(header[marketRentIdx]);
        if (marketHeaderLabel.includes('annual') || marketHeaderLabel.includes('year')) {
          summaryTotals.market_rent_annual = marketRentTotal;
          summaryTotals.market_rent_monthly = marketRentTotal / 12;
        } else {
          summaryTotals.market_rent_monthly = marketRentTotal;
          summaryTotals.market_rent_annual = marketRentTotal * 12;
        }
      }

      const totalUnitsForAverage = Number.isFinite(summaryTotals.total_units)
        ? summaryTotals.total_units
        : explicitTotalUnits;
      if (Number.isFinite(totalUnitsForAverage) && totalUnitsForAverage > 0) {
        if (Number.isFinite(summaryTotals.in_place_rent_monthly)) {
          summaryTotals.avg_in_place_rent = summaryTotals.in_place_rent_monthly / totalUnitsForAverage;
        }
        if (Number.isFinite(summaryTotals.market_rent_monthly)) {
          summaryTotals.avg_market_rent = summaryTotals.market_rent_monthly / totalUnitsForAverage;
        }
      }
      if (
        Number.isFinite(summaryTotals.occupancy) ||
        Number.isFinite(summaryTotals.occupied_units) ||
        Number.isFinite(summaryTotals.vacant_units)
      ) {
        summaryTotals.status_summary_present = true;
      }
    };

    for (let i = headerIdx + 1; i < rows.length; i += 1) {
      const row = rows[i] || [];
      if (!hasAnyValue(row)) {
        blankRowStreak += 1;
        if (blankRowStreak >= 2) break;
        continue;
      }
      blankRowStreak = 0;

      const firstLabel = normalizeClassifierText(row[0]);
      if (firstLabel && (firstLabel.includes('total') || firstLabel.includes('summary'))) {
        applySummaryTotalsFromRow(row);
        continue;
      }

      const unitCellLabel = unitIdx !== -1 ? normalizeClassifierText(row[unitIdx]) : '';
      const rowSummaryLabel = normalizeClassifierText(
        `${String(row[0] || '')} ${unitIdx !== -1 ? String(row[unitIdx] || '') : ''}`
      );
      const isSummaryLikeRow =
        /\btotal\b/.test(rowSummaryLabel) ||
        /\bsubtotal\b/.test(rowSummaryLabel) ||
        /\bgrand\s*total\b/.test(rowSummaryLabel) ||
        /\baverage\b/.test(rowSummaryLabel) ||
        /\bavg\b/.test(rowSummaryLabel) ||
        /\boccupied\b/.test(firstLabel) ||
        /\bvacant\b/.test(firstLabel) ||
        /\bmodel\b/.test(firstLabel) ||
        /\bdown\b/.test(firstLabel) ||
        /\btotal\b/.test(unitCellLabel) ||
        /\bsubtotal\b/.test(unitCellLabel) ||
        /\bgrand\s*total\b/.test(unitCellLabel) ||
        /\baverage\b/.test(unitCellLabel) ||
        /\bavg\b/.test(unitCellLabel);
      if (isSummaryLikeRow) {
        applySummaryTotalsFromRow(row);
        continue;
      }

      const unit = unitIdx !== -1 ? String(row[unitIdx] || '').trim() : '';
      const inPlaceRent = rentIdx !== -1 ? parseMoneyLike(row[rentIdx]) : null;
      if (!unit || !Number.isFinite(inPlaceRent)) continue;

      const marketRent = marketRentIdx !== -1 ? parseMoneyLike(row[marketRentIdx]) : null;
      const status = statusIdx !== -1 ? String(row[statusIdx] || '').trim() : '';
      const rawUnitType = unitTypeIdx !== -1 ? String(row[unitTypeIdx] || '').trim() : '';
      const beds = bedsIdx !== -1 ? parseMoneyLike(row[bedsIdx]) : null;
      const baths = bathsIdx !== -1 ? parseMoneyLike(row[bathsIdx]) : null;
      const sqft = sqftIdx !== -1 ? parseMoneyLike(row[sqftIdx]) : null;

      if (status) {
        const occupied = rentRollStatusIsOccupied(status);
        if (occupied !== null) {
          statusCount += 1;
          if (occupied) occupiedCount += 1;
        }
      }

      let unitType = rawUnitType;
      if (!unitType && Number.isFinite(beds)) {
        unitType = `${Math.round(beds)} Bed`;
      }
      if (!unitType) unitType = 'Unknown';

      units.push({
        unit,
        unit_type: unitType,
        beds: Number.isFinite(beds) ? beds : null,
        baths: Number.isFinite(baths) ? baths : null,
        sqft: Number.isFinite(sqft) ? sqft : null,
        in_place_rent: inPlaceRent,
        market_rent: Number.isFinite(marketRent) ? marketRent : null,
        status: status || null,
      });

      unitMixMap[unitType] = (unitMixMap[unitType] || 0) + 1;
      if (!rentValuesByType[unitType]) rentValuesByType[unitType] = [];
      rentValuesByType[unitType].push(inPlaceRent);
      if (Number.isFinite(marketRent)) {
        if (!marketValuesByType[unitType]) marketValuesByType[unitType] = [];
        marketValuesByType[unitType].push(marketRent);
      }
    }

    if (units.length < 4) continue;

    const unitMix = Object.entries(unitMixMap).map(([unit_type, count]) => {
      const inPlace = rentValuesByType[unit_type] || [];
      const market = marketValuesByType[unit_type] || [];
      const row = {
        unit_type,
        count,
      };
      if (inPlace.length) {
        row.current_rent = Math.round(inPlace.reduce((a, b) => a + b, 0) / inPlace.length);
      }
      if (market.length) {
        row.market_rent = Math.round(market.reduce((a, b) => a + b, 0) / market.length);
      }
      return row;
    });

    return {
      total_units: explicitTotalUnits || units.length,
      totals: Object.keys(summaryTotals).length > 0 ? summaryTotals : null,
      unit_mix: unitMix,
      occupancy: statusCount > 0 ? occupiedCount / statusCount : null,
      units,
      column_map: {
        unit: unitIdx !== -1 ? header[unitIdx] : null,
        unit_type: unitTypeIdx !== -1 ? header[unitTypeIdx] : null,
        beds: bedsIdx !== -1 ? header[bedsIdx] : null,
        baths: bathsIdx !== -1 ? header[bathsIdx] : null,
        sqft: sqftIdx !== -1 ? header[sqftIdx] : null,
        in_place_rent: rentIdx !== -1 ? header[rentIdx] : null,
        market_rent: marketRentIdx !== -1 ? header[marketRentIdx] : null,
        status: statusIdx !== -1 ? header[statusIdx] : null,
      },
    };
  }
  return null;
};

export const parseT12FromRowMatrices = (rowMatrices) => {
  const matrices = Array.isArray(rowMatrices) ? rowMatrices : [];
  const entries = [];
  for (const matrix of matrices) {
    const rows = Array.isArray(matrix?.rows) ? matrix.rows : [];
    const totalColumnIndexes = getT12TotalColumnIndexes(rows.slice(0, 2));
    for (const row of rows) {
      if (!Array.isArray(row) || row.length === 0) continue;
      const labelIdx = row.findIndex((cell) => /[A-Za-z]/.test(String(cell || '')));
      if (labelIdx === -1) continue;
      const label = normalizeClassifierText(row[labelIdx]);
      if (!label) continue;
      let value = parseT12TotalColumnValue(row, totalColumnIndexes);
      for (let i = 0; i < row.length; i += 1) {
        if (Number.isFinite(value)) break;
        if (i === labelIdx) continue;
        const cell = String(row[i] || '').toLowerCase();
        if (cell.includes('%')) continue;
        const candidate = parseMoneyLike(row[i]);
        if (Number.isFinite(candidate)) {
          if (candidate > 1_000_000_000) continue;
          value = candidate;
          break;
        }
      }
      if (!Number.isFinite(value)) continue;
      entries.push({ label, value });
    }
  }

  const column_map = {
    gross_potential_rent: null,
    effective_gross_income: null,
    total_operating_expenses: null,
    net_operating_income: null,
  };
  const findValue = (synonyms) => {
    for (const entry of entries) {
      if (synonyms.some((term) => labelMatchesT12Alias(entry.label, term))) {
        return entry;
      }
    }
    return null;
  };
  const sumValues = (synonyms) => {
    const matches = entries.filter((entry) =>
      synonyms.some((term) => labelMatchesT12Alias(entry.label, term))
    );
    if (!matches.length) return null;
    return matches.reduce((sum, entry) => sum + entry.value, 0);
  };

  const grossRental = findValue(['gross rental income', 'rental income', 'gross rent']);
  const laundryIncomeTotal = sumValues(['laundry income', 'laundry revenue']);
  const parkingIncomeTotal = sumValues(['parking income', 'parking revenue']);
  const otherIncomeTotal = sumValues([
    'Other Income',
    'Misc Income',
    'Miscellaneous Income',
    'Ancillary Income',
    'Ancillary Revenue',
    'Storage Income',
    'Storage Revenue',
    'Pet Fees',
    'Application Fees',
    'Late Fees',
    'Utility Recoveries',
    'Utility Reimbursements',
    'RUBS',
    'Reimbursement Income',
    'Admin Fees',
  ]);
  const vacancyLoss = findValue(T12_LABEL_ALIASES.vacancy_loss);
  const egiDirect = findValue(T12_LABEL_ALIASES.effective_gross_income);
  const gprDirect = findValue(T12_LABEL_ALIASES.gross_potential_rent);
  const totalOpexDirect = findValue(T12_LABEL_ALIASES.total_operating_expenses);
  const noiDirect = findValue(T12_LABEL_ALIASES.net_operating_income);

  const expenseSynonyms = [
    { key: 'property_taxes', synonyms: T12_EXPENSE_LINE_ALIASES.property_taxes },
    { key: 'insurance', synonyms: T12_EXPENSE_LINE_ALIASES.insurance },
    { key: 'repairs_maintenance', synonyms: T12_EXPENSE_LINE_ALIASES.repairs_maintenance },
    { key: 'utilities', synonyms: T12_EXPENSE_LINE_ALIASES.utilities },
    { key: 'management', synonyms: T12_EXPENSE_LINE_ALIASES.management },
    { key: 'payroll_admin', synonyms: T12_EXPENSE_LINE_ALIASES.payroll_admin },
    { key: 'garbage_misc', synonyms: T12_EXPENSE_LINE_ALIASES.garbage_misc },
  ];

  const expenseValues = {};
  for (const group of expenseSynonyms) {
    const value = sumValues(group.synonyms);
    if (Number.isFinite(value)) expenseValues[group.key] = value;
  }
  const expenseLinesFound = Object.keys(expenseValues).length;
  const summedExpenseLines = Object.values(expenseValues).reduce((sum, value) => sum + value, 0);
  const total_other_income =
    (Number.isFinite(laundryIncomeTotal) ? laundryIncomeTotal : 0) +
    (Number.isFinite(parkingIncomeTotal) ? parkingIncomeTotal : 0) +
    (Number.isFinite(otherIncomeTotal) ? otherIncomeTotal : 0);

  let gross_potential_rent = Number.isFinite(gprDirect?.value)
    ? gprDirect.value
    : Number.isFinite(grossRental?.value)
    ? grossRental.value
    : null;
  const hasGrossRentalIncome = Number.isFinite(grossRental?.value) || Number.isFinite(gprDirect?.value);
  const hasMinimumT12Coverage = hasGrossRentalIncome && expenseLinesFound >= 3;
  const vacancyAdjusted = Number.isFinite(vacancyLoss?.value)
    ? vacancyLoss.value > 0
      ? -vacancyLoss.value
      : vacancyLoss.value
    : 0;
  const derivedEgi =
    Number.isFinite(grossRental?.value)
      ? grossRental.value + total_other_income + vacancyAdjusted
      : null;

  let effective_gross_income = Number.isFinite(egiDirect?.value)
    ? egiDirect.value
    : Number.isFinite(derivedEgi)
    ? derivedEgi
    : null;
  let total_operating_expenses = Number.isFinite(totalOpexDirect?.value)
    ? totalOpexDirect.value
    : expenseLinesFound > 0
    ? summedExpenseLines
    : null;
  let net_operating_income = Number.isFinite(noiDirect?.value) ? noiDirect.value : null;

  if (
    !Number.isFinite(net_operating_income) &&
    Number.isFinite(effective_gross_income) &&
    Number.isFinite(total_operating_expenses)
  ) {
    net_operating_income = effective_gross_income - total_operating_expenses;
  }

  if (!isPlausibleT12Field('effective_gross_income', effective_gross_income)) effective_gross_income = null;
  if (!isPlausibleT12Field('total_operating_expenses', total_operating_expenses)) total_operating_expenses = null;
  if (!isPlausibleT12Field('net_operating_income', net_operating_income)) net_operating_income = null;

  const coreSummaryValidation = validateCoreT12Payload(
    { effective_gross_income, total_operating_expenses, net_operating_income },
    't12_core_summary_rows'
  );
  const acceptedCoreSummaryRows = !hasMinimumT12Coverage && coreSummaryValidation.ok;

  if (!hasMinimumT12Coverage && !acceptedCoreSummaryRows) {
    gross_potential_rent = null;
    effective_gross_income = null;
    total_operating_expenses = null;
    net_operating_income = null;
  }

  if (Number.isFinite(gross_potential_rent)) column_map.gross_potential_rent = gprDirect?.label || grossRental?.label || null;
  if (Number.isFinite(effective_gross_income)) column_map.effective_gross_income = egiDirect?.label || null;
  if (Number.isFinite(total_operating_expenses)) column_map.total_operating_expenses = totalOpexDirect?.label || 'expense_lines_sum';
  if (Number.isFinite(net_operating_income)) column_map.net_operating_income = noiDirect?.label || null;

  // Build income_lines array for the report renderer
  const income_lines = [
    ...(Number.isFinite(grossRental?.value) ? [{ label: 'Gross Rental Income', amount: grossRental.value }] : []),
    ...(Number.isFinite(laundryIncomeTotal) && laundryIncomeTotal > 0 ? [{ label: 'Laundry Income', amount: laundryIncomeTotal }] : []),
    ...(Number.isFinite(parkingIncomeTotal) && parkingIncomeTotal > 0 ? [{ label: 'Parking Income', amount: parkingIncomeTotal }] : []),
    ...(Number.isFinite(otherIncomeTotal) && otherIncomeTotal > 0 ? [{ label: 'Other Income', amount: otherIncomeTotal }] : []),
    ...(Number.isFinite(vacancyAdjusted) && vacancyAdjusted !== 0 ? [{ label: 'Vacancy Allowance', amount: vacancyAdjusted }] : []),
  ];

  // Build expense_lines array for the report renderer
  const expenseDisplayLabels = {
    property_taxes: 'Property Taxes',
    insurance: 'Insurance',
    repairs_maintenance: 'Repairs & Maintenance',
    landscaping_snow: 'Landscaping & Snow Removal',
    utilities: 'Utilities',
    management: 'Property Management',
    administrative: 'Administrative',
    payroll_admin: 'Payroll / Admin',
    garbage_misc: 'Garbage & Miscellaneous',
  };
  const expense_lines = Object.entries(expenseValues).map(([key, value]) => ({
    label: expenseDisplayLabels[key] || key,
    amount: value,
  }));

  return {
    gross_potential_rent: Number.isFinite(gross_potential_rent) ? gross_potential_rent : null,
    effective_gross_income: Number.isFinite(effective_gross_income) ? effective_gross_income : null,
    total_operating_expenses: Number.isFinite(total_operating_expenses) ? total_operating_expenses : null,
    net_operating_income: Number.isFinite(net_operating_income) ? net_operating_income : null,
    expense_lines_found: expenseLinesFound,
    has_gross_rental_income: hasGrossRentalIncome,
    has_minimum_t12_coverage: hasMinimumT12Coverage,
    core_summary_rows_accepted: acceptedCoreSummaryRows,
    income_lines,
    expense_lines,
    column_map,
  };
};

const detectDocTypeFromTabular = ({ headers, sampleRows }) => {
  const normalizedHeaders = Array.isArray(headers)
    ? headers.map((h) => String(h || '').trim().toLowerCase())
    : [];
  const normalizedHeaderCompact = normalizedHeaders.map((h) =>
    h.replace(/[^a-z0-9]/g, '')
  );
  const _rows = Array.isArray(sampleRows) ? sampleRows : [];
  const hasHeaderTerm = (term) => {
    const normalizedTerm = String(term || '').trim().toLowerCase();
    const compactTerm = normalizedTerm.replace(/[^a-z0-9]/g, '');
    return (
      normalizedHeaders.some((header) => header.includes(normalizedTerm)) ||
      normalizedHeaderCompact.some((header) => header.includes(compactTerm))
    );
  };

  const rentRollIndicators = [
    'unit',
    'bed',
    'bath',
    'sqft',
    'tenantname',
    'leasestart',
    'leaseend',
    'marketrent',
    'inplacerent',
    'totalmonthly',
    'deposit',
    'status',
  ];
  const t12Indicators = [
    'month',
    'gpr_rent',
    'vacancyloss',
    'concessions',
    'baddebt',
    'otherincome',
    'egi',
    'totalopex',
    'noi',
    'repairsmaintenance',
    'propertymanagement',
    'insurance',
    'taxes',
    'utilities',
    'payroll',
    'revenue',
    'income',
    'expenses',
  ];

  const rentRollMatched = rentRollIndicators.filter((term) => hasHeaderTerm(term));
  const t12Matched = t12Indicators.filter((term) => hasHeaderTerm(term));
  const rent_roll_score = rentRollMatched.length;
  const t12_score = t12Matched.length;

  let detected_doc_type = 'unknown';
  if (t12_score >= 3 && t12_score > rent_roll_score) {
    detected_doc_type = 't12';
  } else if (rent_roll_score >= 3 && rent_roll_score > t12_score) {
    detected_doc_type = 'rent_roll';
  }

  return {
    detected_doc_type,
    signals: {
      rent_roll: { matched_terms: rentRollMatched },
      t12: { matched_terms: t12Matched },
    },
    score: { rent_roll_score, t12_score },
  };
};

const isPdfOrImage = (mime) => {
  const normalized = String(mime || '').toLowerCase();
  return (
    normalized.includes('application/pdf') ||
    normalized.includes('image/png') ||
    normalized.includes('image/jpeg')
  );
};

export function extractAnnualPropertyTaxFromText(text) {
  const source = String(text || '');
  const labels = [
    'annual property tax', 'total property tax', 'total taxes', 'tax amount due',
    'amount due', 'municipal taxes', 'property tax', 'annual tax', 'total tax',
    'taxes owing', 'tax amount', 'tax due', 'realty tax', 'municipal tax',
  ];
  let rejectedCandidate = false;
  const isValidAnnualTax = (value, context) => {
    if (!Number.isFinite(value)) return false;
    const isYearLike = value >= 1900 && value <= 2100;
    const hasYearContext = /\b(?:tax year|roll year|billing year|assessment year|year)\b/i.test(context);
    if (isYearLike || (hasYearContext && value <= 5000) || value <= 5000) {
      rejectedCandidate = true;
      return false;
    }
    return true;
  };

  for (const label of labels) {
    const idx = source.toLowerCase().indexOf(label);
    if (idx === -1) continue;
    const snippet = source.slice(idx, idx + 180);
    const snippetLine = snippet.split(/\r?\n/)[0] || snippet;
    const candidates = [
      ...snippetLine.matchAll(/(?:\$\s*([\d,]+(?:\.\d{1,2})?)|(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?))/g),
    ];
    for (const match of candidates) {
      const raw = match[1] || match[2] || '';
      const val = parseFloat(raw.replace(/,/g, ''));
      const matchStart = match.index || 0;
      const context = snippetLine.slice(Math.max(0, matchStart - 40), matchStart + match[0].length + 40);
      if (isValidAnnualTax(val, context)) {
        return { value: val, rejectedCandidate };
      }
    }

    const fallbackMatches = snippet.matchAll(/\$?\s*([\d,]+(?:\.\d{1,2})?)/g);
    for (const match of fallbackMatches) {
      const val = parseFloat(String(match[1] || '').replace(/,/g, ''));
      const matchStart = match.index || 0;
      const context = snippet.slice(Math.max(0, matchStart - 40), matchStart + match[0].length + 40);
      if (isValidAnnualTax(val, context)) {
        return { value: val, rejectedCandidate };
      }
    }
  }
  return { value: null, rejectedCandidate };
}

export function parseT12FromExtractedTables(tables) {
  const monthTokens = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const periodTokens = ['ytd', 'trailing 12', 't-12'];
  const metricTokens = ['noi', 'net operating income', 'total operating expenses', 'effective gross income'];
  const annualSummaryTokens = ['annual total', 'annual', 'category', '% of egi', 'notes'];
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerHasToken = (rows, token, { prefix = false, word = false } = {}) =>
    (rows || []).some((row) =>
      Array.isArray(row) &&
      row.some((cell) => {
        const text = normalizeText(cell);
        if (!text) return false;
        if (prefix) {
          return new RegExp(`\\b${escapeRegExp(token)}`, 'i').test(text);
        }
        if (word) {
          return new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i').test(text);
        }
        return text.includes(token);
      })
    );

  const candidates = (Array.isArray(tables) ? tables : [])
    .map((table) => {
      const rows = Array.isArray(table?.rows) ? table.rows : [];
      if (rows.length === 0) return null;
      const headerRows = rows.slice(0, 2);
      const hasPeriod =
        monthTokens.some((token) => headerHasToken(headerRows, token, { prefix: true })) ||
        periodTokens.some((token) => headerHasToken(headerRows, token));
      const metricMatches = metricTokens.filter((token) =>
        headerHasToken(headerRows, token, { word: token === 'noi' })
      );
      const annualSummaryMatches = annualSummaryTokens.filter((token) => headerHasToken(headerRows, token));
      const rowMetricMatches = labelRules.filter((rule) =>
        rows.some((row) =>
          Array.isArray(row) &&
          row.some((cell) => {
            const text = normalizeText(cell);
            return text && rule.labels.some((label) => labelMatchesT12Alias(text, label));
          })
        )
      );
      const hasMetric = metricMatches.length > 0;
      const hasAnnualSummaryStructure = annualSummaryMatches.length >= 2;
      const hasAnnualSummaryMetrics = rowMetricMatches.length >= 4;
      const hasPeriodRowMetricStructure = hasPeriod && hasAnnualSummaryMetrics;
      if (
        (!hasPeriod || !hasMetric) &&
        !hasPeriodRowMetricStructure &&
        !(hasAnnualSummaryStructure && hasAnnualSummaryMetrics)
      ) return null;

      const score =
        monthTokens.filter((token) => headerHasToken(headerRows, token, { prefix: true })).length +
        periodTokens.filter((token) => headerHasToken(headerRows, token)).length +
        metricMatches.length +
        annualSummaryMatches.length +
        rowMetricMatches.length;
      return { rows, score };
    })
    .filter(Boolean);

  if (candidates.length === 0) {
    throw new Error('No T12 table detected in extracted tables.');
  }

  const bestCandidate = candidates.reduce((best, current) =>
    !best || current.score > best.score ? current : best
  );
  const rows = Array.isArray(bestCandidate?.rows) ? bestCandidate.rows : [];
  const totalColumnIndexes = getT12TotalColumnIndexes(rows.slice(0, 2));
  const found = {
    gross_potential_rent: null,
    effective_gross_income: null,
    total_operating_expenses: null,
    net_operating_income: null,
  };

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (let i = 0; i < row.length; i += 1) {
      const cellText = normalizeText(row[i]);
      if (!cellText) continue;
      for (const rule of labelRules) {
        if (found[rule.key] !== null) {
          continue;
        }
        if (rule.labels.some((label) => labelMatchesT12Alias(cellText, label))) {
          const totalColumnValue = parseT12TotalColumnValue(row, totalColumnIndexes, rule.key);
          if (totalColumnValue !== null) {
            found[rule.key] = totalColumnValue;
            continue;
          }
          for (let j = i + 1; j < row.length; j += 1) {
            const cell = String(row[j] || '').toLowerCase();

            // Skip percentage columns explicitly
            if (cell.includes('%')) continue;

            const value = numericFromCell(row[j]);

            // Reject suspiciously large values (likely concatenation or bad extraction)
            if (Number.isFinite(value) && value > 1_000_000_000) continue;

            if (value !== null) {
              found[rule.key] = value;
              break;
            }
          }
        }
      }
    }
  }

  if (!isPlausibleT12Field('effective_gross_income', found.effective_gross_income)) found.effective_gross_income = null;
  if (!isPlausibleT12Field('total_operating_expenses', found.total_operating_expenses)) found.total_operating_expenses = null;
  if (!isPlausibleT12Field('net_operating_income', found.net_operating_income)) found.net_operating_income = null;

  return {
    file_id: null,
    original_filename: null,
    method: 'aws_textract_tables',
    confidence: null,
    gross_potential_rent: found.gross_potential_rent ?? null,
    effective_gross_income: found.effective_gross_income ?? null,
    total_operating_expenses: found.total_operating_expenses ?? null,
    net_operating_income: found.net_operating_income ?? null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const adminRunKey = (process.env.ADMIN_RUN_KEY || '').trim();

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return res.status(500).json({
        error: 'Server misconfigured: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY',
      });
    }

    const headerKeyRaw = req.headers['x-admin-run-key'];
    const headerKey = Array.isArray(headerKeyRaw) ? headerKeyRaw[0] : headerKeyRaw || '';
    const hasAdminKey = adminRunKey && String(headerKey).trim() === adminRunKey;

    if (!hasAdminKey) {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      });

      const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);

      if (userErr || !userRes?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const adminEmail = 'hello@investoriq.tech';
      if ((userRes.user.email || '').toLowerCase() !== adminEmail) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const body = getRequestBody(req);
    const { job_id: jobId, file_id: fileId, doc_type: docType } = body || {};
    const declaredDocType = docType;

    if (!jobId || !fileId || !docType) {
      return res.status(400).json({ error: 'Missing job_id, file_id, or doc_type' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: fileRow, error: fileErr } = await supabaseAdmin
      .from('analysis_job_files')
      .select('id, job_id, user_id, bucket, object_path, original_filename, mime_type, doc_type, bytes')
      .eq('id', fileId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (fileErr || !fileRow?.id) {
      return res.status(200).json({ ok: true, warning: 'file_not_found' });
    }

    const nowIso = new Date().toISOString();
    const isTabularInput =
      isSpreadsheetMime(fileRow.mime_type) ||
      isXlsxName(fileRow.original_filename) ||
      isCsvMime(fileRow.mime_type) ||
      isCsvName(fileRow.original_filename);

    let detectedDocType = 'unknown';
    let classifierScore = null;
    let classifierSignals = null;
    let effectiveDocType = declaredDocType;
    let declaredTypeMismatch = false;

    if (isTabularInput) {
      try {
        const { data: classifyData, error: classifyErr } = await supabaseAdmin.storage
          .from(fileRow.bucket)
          .download(fileRow.object_path);
        if (!classifyErr && classifyData) {
          const classifyBuffer = Buffer.from(await classifyData.arrayBuffer());
          const classifyIsCsv = isCsvMime(fileRow.mime_type) || isCsvName(fileRow.original_filename);
          const classifyWorkbook = classifyIsCsv
            ? XLSX.read(classifyBuffer.toString('utf-8'), { type: 'string' })
            : XLSX.read(classifyBuffer, { type: 'buffer' });
          const matrices = getWorkbookRowMatrices(classifyWorkbook);
          if (matrices.length > 0) {
            let bestClassifier = null;
            for (const matrix of matrices) {
              const classifyHeader = Array.isArray(matrix.rows?.[0]) ? matrix.rows[0] : [];
              const classifySampleRows = (matrix.rows || []).slice(1, 26);
              const classifier = detectDocTypeFromTabular({
                headers: classifyHeader,
                sampleRows: classifySampleRows,
              });
              const classifierTotalScore =
                Number(classifier?.score?.rent_roll_score || 0) + Number(classifier?.score?.t12_score || 0);
              const bestScore =
                Number(bestClassifier?.score?.rent_roll_score || 0) +
                Number(bestClassifier?.score?.t12_score || 0);
              if (!bestClassifier || classifierTotalScore > bestScore) {
                bestClassifier = classifier;
              }
            }
            if (bestClassifier) {
              const previewHeaders =
                (Array.isArray(matrices[0]?.rows?.[0]) ? matrices[0].rows[0] : [])
                  .slice(0, 15)
                  .map((h) => String(h || '').trim().toLowerCase());
              console.log('[parse-doc] classifier', {
                detected_doc_type: bestClassifier.detected_doc_type,
                headers: previewHeaders,
              });
              detectedDocType = bestClassifier.detected_doc_type;
              classifierSignals = bestClassifier.signals;
              classifierScore = bestClassifier.score;
              if (detectedDocType !== 'unknown') {
                effectiveDocType = detectedDocType;
              }
              if (detectedDocType !== 'unknown' && detectedDocType !== declaredDocType) {
                declaredTypeMismatch = true;
              }
            }
          }
        }
      } catch (classifyError) {
        // Fail closed on classification: preserve declared type when classifier cannot run.
      }
    }

    // Text-based inference for supporting_documents PDFs
    function inferDocTypeFromText(text, options = {}) {
      return inferSupportingDocTypeFromText(text, {
        allowFilenameHint: options.allowFilenameHint !== false,
        filename: fileRow?.original_filename || '',
      });
    }

    if (
  ['supporting', 'supporting_documents', 'supporting_documents_ui'].includes(declaredDocType) &&
  !isTabularInput
) {
      try {
        const { data: textArtifact } = await supabaseAdmin
          .from('analysis_artifacts')
          .select('payload')
          .eq('job_id', jobId)
          .eq('type', 'document_text_extracted')
          .eq('payload->>file_id', String(fileRow.id))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const fullText = String(textArtifact?.payload?.excerpt || textArtifact?.payload?.text || '');
        const normalizedText = fullText.replace(/\s+/g, ' ').trim();
        const readableWordCount = (normalizedText.match(/[A-Za-z]{3,}/g) || []).length;
        const looksGarbageLike =
          /stream|endstream|obj|endobj/.test(normalizedText.toLowerCase()) && readableWordCount < 20;
        if (!normalizedText || normalizedText.length <= 40 || readableWordCount < 8 || looksGarbageLike) {
          effectiveDocType = 'supporting_documents_unclassified';
          detectedDocType = 'supporting_documents_unclassified';
        } else {
          const inferred = inferDocTypeFromText(fullText);
          effectiveDocType = inferred;
          detectedDocType = inferred;
          console.log('[parse-doc] supporting_documents inferred as', inferred);
        }
      } catch (_inferErr) {
        // fail-closed: leave effectiveDocType as 'supporting_documents'
      }
    }

    if (effectiveDocType === 'debt_term_sheet') {
      effectiveDocType = 'loan_term_sheet';
    }
    if (detectedDocType === 'debt_term_sheet') {
      detectedDocType = 'loan_term_sheet';
    }

    if (['rent_roll', 't12'].includes(String(declaredDocType || '').toLowerCase()) && !isTabularInput) {
      try {
        const { data: textArtifact } = await supabaseAdmin
          .from('analysis_artifacts')
          .select('payload')
          .eq('job_id', jobId)
          .eq('type', 'document_text_extracted')
          .eq('payload->>file_id', String(fileRow.id))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const fullText = String(textArtifact?.payload?.text || textArtifact?.payload?.excerpt || '');
        const supportedRequiredSlotRescueTypes = new Set([
          't12',
          'rent_roll',
          'loan_term_sheet',
          'mortgage_statement',
          'renovation',
          'appraisal',
          'property_tax',
          'insurance_policy',
          'bank_statement',
        ]);
        const requiredFinancialType = detectRequiredFinancialDocTypeFromText(fullText);
        const inferredDocType =
          requiredFinancialType !== 'unknown'
            ? requiredFinancialType
            : inferDocTypeFromText(fullText, { allowFilenameHint: false });
        const textDetectedDocType = supportedRequiredSlotRescueTypes.has(inferredDocType)
          ? inferredDocType
          : 'unknown';
        if (
          textDetectedDocType !== 'unknown' &&
          textDetectedDocType !== String(declaredDocType || '').toLowerCase()
        ) {
          detectedDocType = textDetectedDocType;
          effectiveDocType = textDetectedDocType;
          declaredTypeMismatch = true;
          await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: fileRow.user_id || null,
              type: 'worker_event',
              bucket: 'internal',
              object_path: `analysis_jobs/${jobId}/worker_event/parser_doc_type_rescue/${fileRow.id}/${safeTimestamp(
                nowIso
              )}.json`,
              payload: {
                event: 'parser_doc_type_rescue',
                original_filename: fileRow.original_filename || null,
                declared_doc_type: declaredDocType,
                detected_doc_type: textDetectedDocType,
                rescue_attempted: true,
                rescue_accepted: null,
                rescue_stage: 'rerouted_before_validation',
                rescue_validation_status: 'pending_parser_validation',
                job_id: jobId,
                file_id: fileRow.id,
                timestamp: nowIso,
              },
            },
          ]);
        }
      } catch (rescueErr) {
        console.error('Required financial doc-type rescue failed:', rescueErr?.message || rescueErr);
      }
    }

    if (detectedDocType !== 'unknown' && detectedDocType !== declaredDocType) {
      await supabaseAdmin
        .from('analysis_job_files')
        .update({ doc_type: detectedDocType })
        .eq('id', fileRow.id);
    }

    if (effectiveDocType === 'other') {
      let extraction = { ok: false, method: 'none' };
      let warning = null;

      if (isPdfOrImage(fileRow.mime_type)) {
        try {
          const { data: fileData, error: downloadErr } = await supabaseAdmin.storage
            .from(fileRow.bucket)
            .download(fileRow.object_path);

          if (downloadErr || !fileData) {
            throw new Error(downloadErr?.message || 'Failed to download file');
          }

          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await analyzeTables({ bytes: buffer, mimeType: fileRow.mime_type });
          extraction = { ok: true, method: 'textract' };
        } catch (err) {
          warning = 'textract_failed';
          extraction = { ok: false, method: 'textract' };
        }
      } else {
        warning = 'textract_unavailable';
      }

      const artifactPayload = {
        file_id: fileRow.id,
        original_filename: fileRow.original_filename,
        mime_type: fileRow.mime_type,
        bytes: fileRow.bytes,
        doc_type: fileRow.doc_type,
        extraction: {
          ok: extraction.ok,
          method: extraction.method,
          ...(warning ? { warning } : {}),
        },
      };

      const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: jobId,
          user_id: fileRow.user_id || null,
          type: 'supporting_doc_received',
          bucket: 'system',
          object_path: `analysis_jobs/${jobId}/supporting_doc/${fileRow.id}/${safeTimestamp(nowIso)}.json`,
          payload: artifactPayload,
        },
      ]);

      if (artifactErr) {
        return res.status(500).json({ error: 'Failed to write supporting doc artifact', details: artifactErr.message });
      }

      const nextStatus = extraction.ok ? 'parsed' : 'parsed_with_warnings';
      const { error: updateErr } = await supabaseAdmin
        .from('analysis_job_files')
        .update({
          parse_status: nextStatus,
          parse_error: warning || null,
        })
        .eq('id', fileRow.id);

      if (updateErr) {
        return res.status(500).json({ error: 'Failed to update parse status', details: updateErr.message });
      }

      return res.status(200).json({ ok: true });
    }

    if (effectiveDocType === 'rent_roll') {
      const jobFiles = [fileRow];
      let parsedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (const file of jobFiles || []) {
        const eligible =
          isSpreadsheetMime(file.mime_type) ||
          isXlsxName(file.original_filename) ||
          isCsvMime(file.mime_type) ||
          isCsvName(file.original_filename);
        if (!eligible) {
          try {
            const { data: tablesArtifact } = await supabaseAdmin
              .from('analysis_artifacts')
              .select('bucket, object_path')
              .eq('job_id', jobId)
              .eq('type', 'document_tables_extracted')
              .eq('payload->>source_file_id', String(file.id))
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!tablesArtifact?.bucket || !tablesArtifact?.object_path) {
              let aiRecoveredRentRoll = null;
              try {
                const { data: textArtifact } = await supabaseAdmin
                  .from('analysis_artifacts')
                  .select('payload')
                  .eq('job_id', jobId)
                  .eq('type', 'document_text_extracted')
                  .eq('payload->>file_id', String(file.id))
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                const aiRecoveryResult = await recoverRentRollWithAI({
                  text: textArtifact?.payload?.text || textArtifact?.payload?.excerpt || '',
                  tables: [],
                  filename: file.original_filename,
                  jobId,
                  includeDiagnostics: true,
                });
                aiRecoveredRentRoll = aiRecoveryResult?.payload || null;
                await writeAiRentRollRecoveryDiagnostic({
                  supabaseAdmin,
                  jobId,
                  userId: file.user_id,
                  fileId: file.id,
                  filename: file.original_filename,
                  diagnostics: aiRecoveryResult?.diagnostics,
                });
              } catch (_aiRecoveryErr) {
                aiRecoveredRentRoll = null;
              }

              if (aiRecoveredRentRoll) {
                const { error: aiArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                  {
                    job_id: jobId,
                    user_id: file.user_id || null,
                    type: 'rent_roll_parsed',
                    bucket: 'system',
                    object_path: `analysis_jobs/${jobId}/rent_roll/${file.id}.json`,
                    payload: {
                      file_id: file.id,
                      original_filename: file.original_filename,
                      declared_doc_type: declaredDocType,
                      detected_doc_type: detectedDocType,
                      classifier_score: classifierScore,
                      classifier_signals: classifierSignals,
                      method: aiRecoveredRentRoll.method,
                      ai_assisted: aiRecoveredRentRoll.ai_assisted === true,
                      validated: aiRecoveredRentRoll.validated === true,
                      confidence: aiRecoveredRentRoll.confidence,
                      total_units: aiRecoveredRentRoll.total_units,
                      totals: aiRecoveredRentRoll.totals || null,
                      unit_mix: Array.isArray(aiRecoveredRentRoll.unit_mix) ? aiRecoveredRentRoll.unit_mix : [],
                      occupancy: Number.isFinite(aiRecoveredRentRoll.occupancy) ? aiRecoveredRentRoll.occupancy : null,
                      units: Array.isArray(aiRecoveredRentRoll.units) ? aiRecoveredRentRoll.units : [],
                      column_map: aiRecoveredRentRoll.column_map || null,
                      parse_warnings: Array.isArray(aiRecoveredRentRoll.parse_warnings)
                        ? aiRecoveredRentRoll.parse_warnings
                        : [],
                    },
                  },
                ]);

                if (aiArtifactErr) {
                  throw new Error(aiArtifactErr.message || 'Failed to write rent roll artifact');
                }

                await supabaseAdmin
                  .from('analysis_job_files')
                  .update({ parse_status: 'parsed', parse_error: null })
                  .eq('id', file.id);

                const { error: aiParsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                  {
                    job_id: jobId,
                    user_id: file.user_id || null,
                    type: 'worker_event',
                    bucket: 'internal',
                    object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                      nowIso
                    )}.json`,
                    payload: {
                      event: 'parser_completed',
                      parser: 'rent_roll',
                      result: 'parsed',
                      job_id: jobId,
                      timestamp: nowIso,
                    },
                  },
                ]);

                if (aiParsedEventErr) {
                  console.error('Failed to write parser_completed event:', aiParsedEventErr.message);
                }

                parsedCount += 1;
                continue;
              }

              await supabaseAdmin
                .from('analysis_job_files')
                .update({
                  parse_status: 'failed',
                  parse_error: 'unsupported_file_type_for_structured_parsing',
                })
                .eq('id', file.id);
              return res.status(200).json({ ok: true, skipped: 1 });
            }

            const { data: tablesFile, error: tablesDownloadErr } = await supabaseAdmin.storage
              .from(tablesArtifact.bucket)
              .download(tablesArtifact.object_path);

            if (tablesDownloadErr || !tablesFile) {
              throw new Error(tablesDownloadErr?.message || 'Failed to download extracted rent roll tables');
            }

            const tablesBuffer = Buffer.from(await tablesFile.arrayBuffer());
            const tablesPayload = JSON.parse(tablesBuffer.toString('utf-8'));
            const parsedRentRoll = parseRentRollFromRowMatrices(tablesPayload?.tables);
            let parseWarnings = [];
            const units = Array.isArray(parsedRentRoll?.units) ? parsedRentRoll.units : [];
            const columnMap = parsedRentRoll?.column_map || null;
            const totals = parsedRentRoll?.totals || null;
            const unitMix = Array.isArray(parsedRentRoll?.unit_mix) ? parsedRentRoll.unit_mix : [];
            const totalUnits = Number.isFinite(parsedRentRoll?.total_units) ? parsedRentRoll.total_units : 0;
            const occupancy = Number.isFinite(parsedRentRoll?.occupancy) ? parsedRentRoll.occupancy : null;

            if (!columnMap?.unit) parseWarnings.push('missing_unit');
            if (!columnMap?.in_place_rent) parseWarnings.push('missing_in_place_rent');
            if (!parsedRentRoll) parseWarnings.push('insufficient_rent_roll_structure');

            if (declaredTypeMismatch && !parseWarnings.includes('declared_doc_type_mismatch')) {
              parseWarnings.push('declared_doc_type_mismatch');
            }

            const hasFiniteInPlaceRent = units.some((row) => Number.isFinite(row?.in_place_rent));
            const hasUnitIdentifier = units.some((row) => String(row?.unit || '').trim() !== '');
            const hasBedsOrStatus = units.some(
              (row) => Number.isFinite(row?.beds) || String(row?.status || '').trim() !== ''
            );
            const hasMarketRent = units.some((row) => Number.isFinite(row?.market_rent));
            const hasMinimumRentRoll =
              Number.isFinite(totalUnits) && totalUnits >= 4 && hasFiniteInPlaceRent;
            const hasSecondarySignal = hasUnitIdentifier || hasBedsOrStatus || hasMarketRent;
            const rentRollConfidence = hasMinimumRentRoll && hasSecondarySignal ? 0.9 : 0.5;

            if (!(Number.isFinite(totalUnits) && totalUnits >= 4) && !parseWarnings.includes('missing_total_units')) {
              parseWarnings.push('missing_total_units');
            }
            if (!hasFiniteInPlaceRent && !parseWarnings.includes('missing_in_place_rent')) {
              parseWarnings.push('missing_in_place_rent');
            }
            if (!hasUnitIdentifier && !parseWarnings.includes('missing_unit_identifier')) {
              parseWarnings.push('missing_unit_identifier');
            }

            if (!(hasMinimumRentRoll && hasSecondarySignal)) {
              let aiRecoveredRentRoll = null;
              try {
                const { data: textArtifact } = await supabaseAdmin
                  .from('analysis_artifacts')
                  .select('payload')
                  .eq('job_id', jobId)
                  .eq('type', 'document_text_extracted')
                  .eq('payload->>file_id', String(file.id))
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                const aiRecoveryResult = await recoverRentRollWithAI({
                  text: textArtifact?.payload?.text || textArtifact?.payload?.excerpt || '',
                  tables: tablesPayload?.tables,
                  filename: file.original_filename,
                  jobId,
                  includeDiagnostics: true,
                });
                aiRecoveredRentRoll = aiRecoveryResult?.payload || null;
                await writeAiRentRollRecoveryDiagnostic({
                  supabaseAdmin,
                  jobId,
                  userId: file.user_id,
                  fileId: file.id,
                  filename: file.original_filename,
                  diagnostics: aiRecoveryResult?.diagnostics,
                });
              } catch (_aiRecoveryErr) {
                aiRecoveredRentRoll = null;
              }

              if (aiRecoveredRentRoll) {
                const aiParseWarnings = [
                  ...new Set([
                    ...parseWarnings,
                    ...(Array.isArray(aiRecoveredRentRoll.parse_warnings)
                      ? aiRecoveredRentRoll.parse_warnings
                      : []),
                  ]),
                ];
                const { error: aiArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                  {
                    job_id: jobId,
                    user_id: file.user_id || null,
                    type: 'rent_roll_parsed',
                    bucket: 'system',
                    object_path: `analysis_jobs/${jobId}/rent_roll/${file.id}.json`,
                    payload: {
                      file_id: file.id,
                      original_filename: file.original_filename,
                      declared_doc_type: declaredDocType,
                      detected_doc_type: detectedDocType,
                      classifier_score: classifierScore,
                      classifier_signals: classifierSignals,
                      method: aiRecoveredRentRoll.method,
                      ai_assisted: aiRecoveredRentRoll.ai_assisted === true,
                      validated: aiRecoveredRentRoll.validated === true,
                      confidence: aiRecoveredRentRoll.confidence,
                      total_units: aiRecoveredRentRoll.total_units,
                      totals: aiRecoveredRentRoll.totals || null,
                      unit_mix: Array.isArray(aiRecoveredRentRoll.unit_mix) ? aiRecoveredRentRoll.unit_mix : [],
                      occupancy: Number.isFinite(aiRecoveredRentRoll.occupancy) ? aiRecoveredRentRoll.occupancy : null,
                      units: Array.isArray(aiRecoveredRentRoll.units) ? aiRecoveredRentRoll.units : [],
                      column_map: aiRecoveredRentRoll.column_map || null,
                      parse_warnings: aiParseWarnings,
                    },
                  },
                ]);

                if (aiArtifactErr) {
                  throw new Error(aiArtifactErr.message || 'Failed to write rent roll artifact');
                }

                await supabaseAdmin
                  .from('analysis_job_files')
                  .update({ parse_status: 'parsed', parse_error: null })
                  .eq('id', file.id);

                const { error: aiParsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                  {
                    job_id: jobId,
                    user_id: file.user_id || null,
                    type: 'worker_event',
                    bucket: 'internal',
                    object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                      nowIso
                    )}.json`,
                    payload: {
                      event: 'parser_completed',
                      parser: 'rent_roll',
                      result: 'parsed',
                      job_id: jobId,
                      timestamp: nowIso,
                    },
                  },
                ]);

                if (aiParsedEventErr) {
                  console.error('Failed to write parser_completed event:', aiParsedEventErr.message);
                }

                parsedCount += 1;
                continue;
              }

              await supabaseAdmin
                .from('analysis_job_files')
                .update({
                  parse_status: 'failed',
                  parse_error: 'insufficient_rent_roll_text_coverage',
                })
                .eq('id', file.id);
              return res.status(200).json({ ok: true, skipped: 1 });
            }

            const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 'rent_roll_parsed',
                bucket: 'system',
                object_path: `analysis_jobs/${jobId}/rent_roll/${file.id}.json`,
                payload: {
                  file_id: file.id,
                  original_filename: file.original_filename,
                  declared_doc_type: declaredDocType,
                  detected_doc_type: detectedDocType,
                  classifier_score: classifierScore,
                  classifier_signals: classifierSignals,
                  method: 'aws_textract_tables',
                  confidence: rentRollConfidence,
                  total_units: totalUnits,
                  totals,
                  unit_mix: unitMix,
                  occupancy,
                  units,
                  column_map: columnMap,
                  parse_warnings: parseWarnings,
                },
              },
            ]);

            if (artifactErr) {
              throw new Error(artifactErr.message || 'Failed to write rent roll artifact');
            }

            await supabaseAdmin
              .from('analysis_job_files')
              .update({ parse_status: 'parsed', parse_error: null })
              .eq('id', file.id);

            const { error: parsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 'worker_event',
                bucket: 'internal',
                object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                  nowIso
                )}.json`,
                payload: {
                  event: 'parser_completed',
                  parser: 'rent_roll',
                  result: 'parsed',
                  job_id: jobId,
                  timestamp: nowIso,
                },
              },
            ]);

            if (parsedEventErr) {
              console.error('Failed to write parser_completed event:', parsedEventErr.message);
            }

            parsedCount += 1;
            continue;
          } catch (err) {
            const errorMessage = err?.message || 'Unknown error';

            await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 'rent_roll_parse_error',
                bucket: 'system',
                object_path: `analysis_jobs/${jobId}/rent_roll_error/${file.id}/${safeTimestamp(nowIso)}.json`,
                payload: {
                  file_id: file.id,
                  original_filename: file.original_filename,
                  error_message: errorMessage,
                },
              },
            ]);

            await supabaseAdmin
              .from('analysis_job_files')
              .update({ parse_status: 'failed', parse_error: errorMessage })
              .eq('id', file.id);

            const { error: failedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 'worker_event',
                bucket: 'internal',
                object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                  nowIso
                )}.json`,
                payload: {
                  event: 'parser_completed',
                  parser: 'rent_roll',
                  result: 'failed',
                  job_id: jobId,
                  timestamp: nowIso,
                },
              },
            ]);

            if (failedEventErr) {
              console.error('Failed to write parser_completed event:', failedEventErr.message);
            }

            failedCount += 1;
            continue;
          }
        }

        try {
          const { data: fileData, error: downloadErr } = await supabaseAdmin.storage
            .from(file.bucket)
            .download(file.object_path);

          if (downloadErr || !fileData) {
            throw new Error(downloadErr?.message || 'Failed to download file');
          }

          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const isCsv = isCsvMime(file.mime_type) || isCsvName(file.original_filename);
          const workbook = isCsv
            ? XLSX.read(buffer.toString('utf-8'), { type: 'string' })
            : XLSX.read(buffer, { type: 'buffer' });
          const rowMatrices = getWorkbookRowMatrices(workbook);
          if (!rowMatrices.length) {
            throw new Error('No worksheet found');
          }
          const parsedRentRoll = parseRentRollFromRowMatrices(rowMatrices);
          let parseWarnings = [];
          const units = Array.isArray(parsedRentRoll?.units) ? parsedRentRoll.units : [];
          const columnMap = parsedRentRoll?.column_map || null;
          const totals = parsedRentRoll?.totals || null;
          const unitMix = Array.isArray(parsedRentRoll?.unit_mix) ? parsedRentRoll.unit_mix : [];
          const totalUnits = Number.isFinite(parsedRentRoll?.total_units) ? parsedRentRoll.total_units : 0;
          const occupancy = Number.isFinite(parsedRentRoll?.occupancy) ? parsedRentRoll.occupancy : null;

          if (!columnMap?.unit) parseWarnings.push('missing_unit');
          if (!columnMap?.in_place_rent) parseWarnings.push('missing_in_place_rent');
          if (!parsedRentRoll) parseWarnings.push('insufficient_rent_roll_structure');

          if (declaredTypeMismatch && !parseWarnings.includes('declared_doc_type_mismatch')) {
            parseWarnings.push('declared_doc_type_mismatch');
          }

          const hasFiniteInPlaceRent = units.some((row) => Number.isFinite(row?.in_place_rent));
          const hasUnitIdentifier = units.some((row) => String(row?.unit || '').trim() !== '');
          const hasBedsOrStatus = units.some(
            (row) => Number.isFinite(row?.beds) || String(row?.status || '').trim() !== ''
          );
          const hasMarketRent = units.some((row) => Number.isFinite(row?.market_rent));
          const hasMinimumRentRoll =
            Number.isFinite(totalUnits) && totalUnits >= 4 && hasFiniteInPlaceRent;
          const hasSecondarySignal = hasUnitIdentifier || hasBedsOrStatus || hasMarketRent;
          const rentRollConfidence = hasMinimumRentRoll && hasSecondarySignal ? 0.95 : 0.5;

          if (!(hasMinimumRentRoll && hasSecondarySignal)) {
            let aiRecoveredRentRoll = null;
            try {
              const aiRecoveryResult = await recoverRentRollWithAI({
                text: '',
                tables: rowMatrices,
                filename: file.original_filename,
                jobId,
                includeDiagnostics: true,
              });
              aiRecoveredRentRoll = aiRecoveryResult?.payload || null;
              await writeAiRentRollRecoveryDiagnostic({
                supabaseAdmin,
                jobId,
                userId: file.user_id,
                fileId: file.id,
                filename: file.original_filename,
                diagnostics: aiRecoveryResult?.diagnostics,
              });
            } catch (_aiRecoveryErr) {
              aiRecoveredRentRoll = null;
            }

            if (aiRecoveredRentRoll) {
              const aiParseWarnings = [
                ...new Set([
                  ...parseWarnings,
                  ...(Array.isArray(aiRecoveredRentRoll.parse_warnings)
                    ? aiRecoveredRentRoll.parse_warnings
                    : []),
                ]),
              ];
              const { error: aiArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                {
                  job_id: jobId,
                  user_id: file.user_id || null,
                  type: 'rent_roll_parsed',
                  bucket: 'system',
                  object_path: `analysis_jobs/${jobId}/rent_roll/${file.id}.json`,
                  payload: {
                    file_id: file.id,
                    original_filename: file.original_filename,
                    declared_doc_type: declaredDocType,
                    detected_doc_type: detectedDocType,
                    classifier_score: classifierScore,
                    classifier_signals: classifierSignals,
                    method: aiRecoveredRentRoll.method,
                    ai_assisted: aiRecoveredRentRoll.ai_assisted === true,
                    validated: aiRecoveredRentRoll.validated === true,
                    confidence: aiRecoveredRentRoll.confidence,
                    total_units: aiRecoveredRentRoll.total_units,
                    totals: aiRecoveredRentRoll.totals || null,
                    unit_mix: Array.isArray(aiRecoveredRentRoll.unit_mix) ? aiRecoveredRentRoll.unit_mix : [],
                    occupancy: Number.isFinite(aiRecoveredRentRoll.occupancy) ? aiRecoveredRentRoll.occupancy : null,
                    units: Array.isArray(aiRecoveredRentRoll.units) ? aiRecoveredRentRoll.units : [],
                    column_map: aiRecoveredRentRoll.column_map || null,
                    parse_warnings: aiParseWarnings,
                  },
                },
              ]);

              if (aiArtifactErr) {
                throw new Error(aiArtifactErr.message || 'Failed to write rent roll artifact');
              }

              await supabaseAdmin
                .from('analysis_job_files')
                .update({ parse_status: 'parsed', parse_error: null })
                .eq('id', file.id);

              const { error: aiParsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                {
                  job_id: jobId,
                  user_id: file.user_id || null,
                  type: 'worker_event',
                  bucket: 'internal',
                  object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                    nowIso
                  )}.json`,
                  payload: {
                    event: 'parser_completed',
                    parser: 'rent_roll',
                    result: 'parsed',
                    job_id: jobId,
                    timestamp: nowIso,
                  },
                },
              ]);

              if (aiParsedEventErr) {
                console.error('Failed to write parser_completed event:', aiParsedEventErr.message);
              }

              parsedCount += 1;
              continue;
            }

            await supabaseAdmin
              .from('analysis_job_files')
              .update({
                parse_status: 'failed',
                parse_error: 'insufficient_rent_roll_spreadsheet_coverage',
              })
              .eq('id', file.id);
            return res.status(200).json({ ok: true, skipped: 1 });
          }

          if (!(Number.isFinite(totalUnits) && totalUnits >= 4) && !parseWarnings.includes('missing_total_units')) {
            parseWarnings.push('missing_total_units');
          }
          if (!hasFiniteInPlaceRent && !parseWarnings.includes('missing_in_place_rent')) {
            parseWarnings.push('missing_in_place_rent');
          }
          if (!hasUnitIdentifier && !parseWarnings.includes('missing_unit_identifier')) {
            parseWarnings.push('missing_unit_identifier');
          }

          const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'rent_roll_parsed',
              bucket: 'system',
              object_path: `analysis_jobs/${jobId}/rent_roll/${file.id}.json`,
              payload: {
                file_id: file.id,
                original_filename: file.original_filename,
                declared_doc_type: declaredDocType,
                detected_doc_type: detectedDocType,
                classifier_score: classifierScore,
                classifier_signals: classifierSignals,
                method: isCsv ? 'csv' : 'xlsx',
                confidence: rentRollConfidence,
                total_units: totalUnits,
                totals,
                unit_mix: unitMix,
                occupancy,
                units,
                column_map: columnMap,
                parse_warnings: parseWarnings,
              },
            },
          ]);

          if (artifactErr) {
            throw new Error(artifactErr.message || 'Failed to write rent roll artifact');
          }

          await supabaseAdmin
            .from('analysis_job_files')
            .update({ parse_status: 'parsed', parse_error: null })
            .eq('id', file.id);

          const { error: parsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'worker_event',
              bucket: 'internal',
              object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                nowIso
              )}.json`,
              payload: {
                event: 'parser_completed',
                parser: 'rent_roll',
                result: 'parsed',
                job_id: jobId,
                timestamp: nowIso,
              },
            },
          ]);

          if (parsedEventErr) {
            console.error('Failed to write parser_completed event:', parsedEventErr.message);
          }

          parsedCount += 1;
        } catch (err) {
          const errorMessage = err?.message || 'Unknown error';

          await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'rent_roll_parse_error',
              bucket: 'system',
              object_path: `analysis_jobs/${jobId}/rent_roll_error/${file.id}/${safeTimestamp(nowIso)}.json`,
              payload: {
                file_id: file.id,
                original_filename: file.original_filename,
                error_message: errorMessage,
              },
            },
          ]);

          await supabaseAdmin
            .from('analysis_job_files')
            .update({ parse_status: 'failed', parse_error: errorMessage })
            .eq('id', file.id);

          const { error: failedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'worker_event',
              bucket: 'internal',
              object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                nowIso
              )}.json`,
              payload: {
                event: 'parser_completed',
                parser: 'rent_roll',
                result: 'failed',
                job_id: jobId,
                timestamp: nowIso,
              },
            },
          ]);

          if (failedEventErr) {
            console.error('Failed to write parser_completed event:', failedEventErr.message);
          }

          failedCount += 1;
        }
      }

      return res.status(200).json({
        ok: true,
        jobId,
        parsed: parsedCount,
        skipped: skippedCount,
        failed: failedCount,
      });
    }

    if (effectiveDocType === 't12') {
      const jobFiles = [fileRow];
      let parsedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (const file of jobFiles || []) {
        const eligible =
          isSpreadsheetMime(file.mime_type) ||
          isXlsxName(file.original_filename) ||
          isCsvMime(file.mime_type) ||
          isCsvName(file.original_filename);
        if (!eligible) {
          try {
            const { data: textArtifact } = await supabaseAdmin
              .from('analysis_artifacts')
              .select('payload')
              .eq('job_id', jobId)
              .eq('type', 'document_text_extracted')
              .eq('payload->>file_id', String(file.id))
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const rawText = String(textArtifact?.payload?.excerpt || textArtifact?.payload?.text || '');
            const extractDollarNear = (text, labels) => {
              for (const label of labels) {
                const idx = text.toLowerCase().indexOf(label);
                if (idx === -1) continue;
                const snippet = text.slice(idx, idx + 120);
                // Match ONLY first standalone currency-like number (stop before space + % or next number)
                const match = snippet.match(/\(?-?\$?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?:\d+(?:\.\d+)?%)?\)?/);
                if (match) {
                  let val = parseFloat(match[1].replace(/,/g, ''));
                  if (!Number.isFinite(val)) continue;
                  if (/^\s*\(/.test(match[0]) || /^\s*-\s*/.test(match[0])) val = -Math.abs(val);
                  return val;
                }
              }
              return null;
            };

            const gross_potential_rent = extractDollarNear(rawText, [
              'gross potential rent', 'gpr', 'gross potential income',
              'gross rental income', 'gross rental revenue', 'rental income',
            ]);
            const effective_gross_income = extractDollarNear(rawText, [
              'effective gross income', 'egi', 'effective gross',
            ]);
            const total_operating_expenses = extractDollarNear(rawText, [
              'total operating expenses', 'operating expenses', 'total expenses', 'opex',
            ]);
            const net_operating_income = extractDollarNear(rawText, [
              'net operating income', 'noi', 'net operating',
            ]);

            const parse_warnings = [];
            if (!Number.isFinite(gross_potential_rent)) parse_warnings.push('missing_gross_potential_rent');
            if (!Number.isFinite(effective_gross_income)) parse_warnings.push('missing_effective_gross_income');
            if (!Number.isFinite(total_operating_expenses)) parse_warnings.push('missing_total_operating_expenses');
            if (!Number.isFinite(net_operating_income)) parse_warnings.push('missing_net_operating_income');
            if (declaredTypeMismatch) parse_warnings.push('declared_doc_type_mismatch');

            const tryAiT12Recovery = async () => {
              const aiCandidate = await recoverT12WithAI({
                text: textArtifact?.payload?.text || textArtifact?.payload?.excerpt || '',
                filename: file.original_filename,
                jobId,
              });
              if (!aiCandidate) return false;

              const aiCoreValidation = validateCoreT12Payload(aiCandidate, 'ai_t12_recovery_validated');
              if (!aiCoreValidation.ok) return false;

              await deleteExistingT12Artifacts(supabaseAdmin, jobId, file.id);

              const { error: aiArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                {
                  job_id: jobId,
                  user_id: file.user_id || null,
                  type: 't12_parsed',
                  bucket: 'system',
                  object_path: `analysis_jobs/${jobId}/t12/${file.id}.json`,
                  payload: {
                    file_id: file.id,
                    original_filename: file.original_filename,
                    declared_doc_type: declaredDocType,
                    detected_doc_type: detectedDocType,
                    classifier_score: classifierScore,
                    classifier_signals: classifierSignals,
                    ...aiCandidate,
                    parse_branch: aiCoreValidation.parse_branch,
                    core_t12_validation: aiCoreValidation,
                  },
                },
              ]);

              if (aiArtifactErr) {
                throw new Error(aiArtifactErr.message || 'Failed to write t12 artifact');
              }

              const { error: aiParsedStatusErr } = await supabaseAdmin
                .from('analysis_job_files')
                .update({ parse_status: 'parsed', parse_error: null })
                .eq('id', file.id);

              if (aiParsedStatusErr) {
                throw new Error(`Failed to mark t12 file parsed: ${aiParsedStatusErr.message}`);
              }

              const { error: aiParsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                {
                  job_id: jobId,
                  user_id: file.user_id || null,
                  type: 'worker_event',
                  bucket: 'internal',
                  object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                    nowIso
                  )}.json`,
                  payload: {
                    event: 'parser_completed',
                    parser: 't12',
                    result: 'parsed',
                    job_id: jobId,
                    timestamp: nowIso,
                  },
                },
              ]);

              if (aiParsedEventErr) {
                console.error('Failed to write parser_completed event:', aiParsedEventErr.message);
              }

              parsedCount += 1;
              return true;
            };

            const requiredValues = [
              gross_potential_rent,
              effective_gross_income,
              total_operating_expenses,
              net_operating_income,
            ];
            const presentCount = requiredValues.filter((value) => Number.isFinite(value)).length;

            if (presentCount < 4) {
              try {
                const { data: tablesArtifact } = await supabaseAdmin
                  .from('analysis_artifacts')
                  .select('bucket, object_path')
                  .eq('job_id', jobId)
                  .eq('type', 'document_tables_extracted')
                  .eq('payload->>source_file_id', String(file.id))
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();

                if (tablesArtifact?.bucket && tablesArtifact?.object_path) {
                  const { data: tablesFile, error: tablesDownloadErr } = await supabaseAdmin.storage
                    .from(tablesArtifact.bucket)
                    .download(tablesArtifact.object_path);

                  if (!tablesDownloadErr && tablesFile) {
                    const tablesBuffer = Buffer.from(await tablesFile.arrayBuffer());
                    const tablesPayload = JSON.parse(tablesBuffer.toString('utf-8'));
                    const parsedT12FromTables = parseT12FromExtractedTables(tablesPayload?.tables);
                    const fallbackRequiredValues = [
                      parsedT12FromTables?.gross_potential_rent,
                      parsedT12FromTables?.effective_gross_income,
                      parsedT12FromTables?.total_operating_expenses,
                      parsedT12FromTables?.net_operating_income,
                    ];
                    const fallbackPresentCount = fallbackRequiredValues.filter((value) => Number.isFinite(value)).length;

                    if (fallbackPresentCount === 4) {
                      const fallbackParseWarnings = [];
                      if (!Number.isFinite(parsedT12FromTables?.gross_potential_rent)) fallbackParseWarnings.push('missing_gross_potential_rent');
                      if (!Number.isFinite(parsedT12FromTables?.effective_gross_income)) fallbackParseWarnings.push('missing_effective_gross_income');
                      if (!Number.isFinite(parsedT12FromTables?.total_operating_expenses)) fallbackParseWarnings.push('missing_total_operating_expenses');
                      if (!Number.isFinite(parsedT12FromTables?.net_operating_income)) fallbackParseWarnings.push('missing_net_operating_income');
                      if (declaredTypeMismatch) fallbackParseWarnings.push('declared_doc_type_mismatch');

                      const fallbackCoreValidation = validateCoreT12Payload(parsedT12FromTables, 'aws_textract_tables');
                      if (!fallbackCoreValidation.ok) {
                        if (await tryAiT12Recovery()) {
                          continue;
                        }
                        await deleteExistingT12Artifacts(supabaseAdmin, jobId, file.id);
                        await supabaseAdmin
                          .from('analysis_job_files')
                          .update({
                            parse_status: 'failed',
                            parse_error: `invalid_core_t12_values:${fallbackCoreValidation.failures.join(',')}`,
                          })
                          .eq('id', file.id);
                        return res.status(200).json({ ok: true, skipped: 1 });
                      }

                      await deleteExistingT12Artifacts(supabaseAdmin, jobId, file.id);

                      const { error: fallbackArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                        {
                          job_id: jobId,
                          user_id: file.user_id || null,
                          type: 't12_parsed',
                          bucket: 'system',
                          object_path: `analysis_jobs/${jobId}/t12/${file.id}.json`,
                          payload: {
                            file_id: file.id,
                            original_filename: file.original_filename,
                            declared_doc_type: declaredDocType,
                            detected_doc_type: detectedDocType,
                            classifier_score: classifierScore,
                            classifier_signals: classifierSignals,
                            method: 'aws_textract_tables',
                            parse_branch: fallbackCoreValidation.parse_branch,
                            confidence: 0.9,
                            core_t12_validation: fallbackCoreValidation,
                            gross_potential_rent: parsedT12FromTables.gross_potential_rent,
                            effective_gross_income: parsedT12FromTables.effective_gross_income,
                            total_operating_expenses: parsedT12FromTables.total_operating_expenses,
                            net_operating_income: parsedT12FromTables.net_operating_income,
                            income_lines: Array.isArray(parsedT12FromTables?.income_lines) ? parsedT12FromTables.income_lines : [],
                            expense_lines: Array.isArray(parsedT12FromTables?.expense_lines) ? parsedT12FromTables.expense_lines : [],
                            column_map: parsedT12FromTables?.column_map || null,
                            parse_warnings: fallbackParseWarnings,
                          },
                        },
                      ]);

                      if (fallbackArtifactErr) {
                        throw new Error(fallbackArtifactErr.message || 'Failed to write t12 artifact');
                      }

                      const { error: fallbackParsedStatusErr } = await supabaseAdmin
                        .from('analysis_job_files')
                        .update({ parse_status: 'parsed', parse_error: null })
                        .eq('id', file.id);

                      if (fallbackParsedStatusErr) {
                        throw new Error(`Failed to mark t12 file parsed: ${fallbackParsedStatusErr.message}`);
                      }

                      const { error: fallbackParsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                        {
                          job_id: jobId,
                          user_id: file.user_id || null,
                          type: 'worker_event',
                          bucket: 'internal',
                          object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                            nowIso
                          )}.json`,
                          payload: {
                            event: 'parser_completed',
                            parser: 't12',
                            result: 'parsed',
                            job_id: jobId,
                            timestamp: nowIso,
                          },
                        },
                      ]);

                      if (fallbackParsedEventErr) {
                        console.error('Failed to write parser_completed event:', fallbackParsedEventErr.message);
                      }

                      parsedCount += 1;
                      continue;
                    }
                  }
                }
              } catch (_fallbackErr) {
                // Fall through to the existing fail-closed text coverage error.
              }

              if (await tryAiT12Recovery()) {
                continue;
              }

              await supabaseAdmin
                .from('analysis_job_files')
                .update({
                  parse_status: 'failed',
                  parse_error: 'insufficient_t12_text_coverage',
                })
                .eq('id', file.id);
              return res.status(200).json({ ok: true, skipped: 1 });
            }

            const coreT12Validation = validateCoreT12Payload(
              {
                effective_gross_income,
                total_operating_expenses,
                net_operating_income,
              },
              'text_excerpt'
            );
            if (!coreT12Validation.ok) {
              if (await tryAiT12Recovery()) {
                continue;
              }
              await supabaseAdmin
                .from('analysis_job_files')
                .update({
                  parse_status: 'failed',
                  parse_error: `invalid_core_t12_values:${coreT12Validation.failures.join(',')}`,
                })
                .eq('id', file.id);
              return res.status(200).json({ ok: true, skipped: 1 });
            }

            const textLineItems = extractT12LineItemsFromText(rawText, total_operating_expenses);

            await deleteExistingT12Artifacts(supabaseAdmin, jobId, file.id);

            const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 't12_parsed',
                bucket: 'system',
                object_path: `analysis_jobs/${jobId}/t12/${file.id}.json`,
                payload: {
                  file_id: file.id,
                  original_filename: file.original_filename,
                  declared_doc_type: declaredDocType,
                  detected_doc_type: detectedDocType,
                  classifier_score: classifierScore,
                  classifier_signals: classifierSignals,
                  method: 'text_excerpt',
                  parse_branch: coreT12Validation.parse_branch,
                  confidence: 0.9,
                  core_t12_validation: coreT12Validation,
                  gross_potential_rent,
                  effective_gross_income,
                  total_operating_expenses,
                  net_operating_income,
                  income_lines: textLineItems.income_lines,
                  expense_lines: textLineItems.expense_lines,
                  income_line_count: textLineItems.income_lines.length,
                  expense_line_count: textLineItems.expense_lines.length,
                  expense_lines_found: textLineItems.expense_lines_found,
                  column_map: textLineItems.expense_lines_found > 0 ? { line_items: 'text_excerpt_lines' } : null,
                  parse_warnings,
                },
              },
            ]);

            if (artifactErr) {
              throw new Error(artifactErr.message || 'Failed to write t12 artifact');
            }

            const { error: parsedStatusErr } = await supabaseAdmin
              .from('analysis_job_files')
              .update({ parse_status: 'parsed', parse_error: null })
              .eq('id', file.id);

            if (parsedStatusErr) {
              throw new Error(`Failed to mark t12 file parsed: ${parsedStatusErr.message}`);
            }

            const { error: parsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 'worker_event',
                bucket: 'internal',
                object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                  nowIso
                )}.json`,
                payload: {
                  event: 'parser_completed',
                  parser: 't12',
                  result: 'parsed',
                  job_id: jobId,
                  timestamp: nowIso,
                },
              },
            ]);

            if (parsedEventErr) {
              console.error('Failed to write parser_completed event:', parsedEventErr.message);
            }

            parsedCount += 1;
            continue;
          } catch (err) {
            const errorMessage = err?.message || 'Unknown error';

            await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 't12_parse_error',
                bucket: 'system',
                object_path: `analysis_jobs/${jobId}/t12_error/${file.id}/${safeTimestamp(nowIso)}.json`,
                payload: {
                  file_id: file.id,
                  original_filename: file.original_filename,
                  error_message: errorMessage,
                },
              },
            ]);

            await supabaseAdmin
              .from('analysis_job_files')
              .update({ parse_status: 'failed', parse_error: errorMessage })
              .eq('id', file.id);

            const { error: failedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
              {
                job_id: jobId,
                user_id: file.user_id || null,
                type: 'worker_event',
                bucket: 'internal',
                object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                  nowIso
                )}.json`,
                payload: {
                  event: 'parser_completed',
                  parser: 't12',
                  result: 'failed',
                  job_id: jobId,
                  timestamp: nowIso,
                },
              },
            ]);

            if (failedEventErr) {
              console.error('Failed to write parser_completed event:', failedEventErr.message);
            }

            failedCount += 1;
            continue;
          }
        }

        try {
          const { data: fileData, error: downloadErr } = await supabaseAdmin.storage
            .from(file.bucket)
            .download(file.object_path);

          if (downloadErr || !fileData) {
            throw new Error(downloadErr?.message || 'Failed to download file');
          }

          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const isCsv = isCsvMime(file.mime_type) || isCsvName(file.original_filename);
          const workbook = isCsv
            ? XLSX.read(buffer.toString('utf-8'), { type: 'string' })
            : XLSX.read(buffer, { type: 'buffer' });
          const rowMatrices = getWorkbookRowMatrices(workbook);
          if (!rowMatrices.length) {
            throw new Error('No worksheet found');
          }
          const parsedT12 = parseT12FromRowMatrices(rowMatrices);
          const rows = rowMatrices[0].rows;

          let payload = null;

          if (isCsv) {
            const headerRow = rows[0] || [];
            const normalizedHeaders = headerRow.map(normalizeHeader);
            const findCsvColumnIndex = (headers, synonyms) => {
              const tokens = synonyms.map((token) => normalizeHeader(token));
              for (let i = 0; i < headers.length; i += 1) {
                const header = headers[i] || '';
                for (const token of tokens) {
                  if (header.includes(token)) return i;
                }
              }
              return -1;
            };

            const gprSynonyms = [
              'gross potential rent',
              'gpr',
              'gross potential',
              'potential rent',
              'gross potential income',
            ];
            const egiSynonyms = ['effective gross income', 'egi', 'effective gross', 'effective income'];
            const opexSynonyms = ['total operating expenses', 'operating expenses', 'total expenses', 'opex'];
            const noiSynonyms = ['net operating income', 'noi', 'net operating', 'net op income'];

            const gprIdx = findCsvColumnIndex(normalizedHeaders, gprSynonyms);
            const egiIdx = findCsvColumnIndex(normalizedHeaders, egiSynonyms);
            const opexIdx = findCsvColumnIndex(normalizedHeaders, opexSynonyms);
            const noiIdx = findCsvColumnIndex(normalizedHeaders, noiSynonyms);
            const gprAliasIdx = normalizedHeaders.findIndex((header) => header === 'gpr_rent');
            const egiAliasIdx = normalizedHeaders.findIndex((header) => header === 'egi');
            const opexAliasIdx = normalizedHeaders.findIndex((header) => header === 'totalopex');
            const noiAliasIdx = normalizedHeaders.findIndex((header) => header === 'noi');

            const sumColumn = (idx, key = null) => {
              if (idx === -1) return null;
              let total = 0;
              let count = 0;
              for (let r = 1; r < rows.length; r += 1) {
                const row = rows[r];
                if (!Array.isArray(row)) continue;
                const cell = String(row[idx] || '').toLowerCase();
                if (cell.includes('%')) continue;
                const value = numericFromCell(row[idx]);
                if (!Number.isFinite(value)) continue;
                if (key && !isPlausibleT12Field(key, value)) continue;
                total += value;
                count += 1;
              }
              if (key && !isPlausibleT12Field(key, total)) return null;
              return count > 0 ? total : null;
            };

            let gross_potential_rent = sumColumn(gprIdx);
            let effective_gross_income = sumColumn(egiIdx, 'effective_gross_income');
            let total_operating_expenses = sumColumn(opexIdx, 'total_operating_expenses');
            let net_operating_income = sumColumn(noiIdx, 'net_operating_income');
            if (gross_potential_rent === null) gross_potential_rent = sumColumn(gprAliasIdx);
            if (effective_gross_income === null) effective_gross_income = sumColumn(egiAliasIdx, 'effective_gross_income');
            if (total_operating_expenses === null) total_operating_expenses = sumColumn(opexAliasIdx, 'total_operating_expenses');
            if (net_operating_income === null) net_operating_income = sumColumn(noiAliasIdx, 'net_operating_income');

            if (!Number.isFinite(gross_potential_rent) && Number.isFinite(parsedT12.gross_potential_rent)) {
              gross_potential_rent = parsedT12.gross_potential_rent;
            }
            if (!Number.isFinite(effective_gross_income) && Number.isFinite(parsedT12.effective_gross_income)) {
              effective_gross_income = parsedT12.effective_gross_income;
            }
            if (!Number.isFinite(total_operating_expenses) && Number.isFinite(parsedT12.total_operating_expenses)) {
              total_operating_expenses = parsedT12.total_operating_expenses;
            }
            if (!Number.isFinite(net_operating_income) && Number.isFinite(parsedT12.net_operating_income)) {
              net_operating_income = parsedT12.net_operating_income;
            }

            const column_map = {
              gross_potential_rent:
                gprIdx >= 0
                  ? headerRow[gprIdx]
                  : gprAliasIdx >= 0
                  ? headerRow[gprAliasIdx]
                  : null,
              effective_gross_income:
                egiIdx >= 0
                  ? headerRow[egiIdx]
                  : egiAliasIdx >= 0
                  ? headerRow[egiAliasIdx]
                  : null,
              total_operating_expenses:
                opexIdx >= 0
                  ? headerRow[opexIdx]
                  : opexAliasIdx >= 0
                  ? headerRow[opexAliasIdx]
                  : null,
              net_operating_income:
                noiIdx >= 0
                  ? headerRow[noiIdx]
                  : noiAliasIdx >= 0
                  ? headerRow[noiAliasIdx]
                  : null,
            };

            if (
              (gross_potential_rent === null ||
                effective_gross_income === null ||
                total_operating_expenses === null ||
                net_operating_income === null) &&
              rows.length > 1
            ) {
              const labelCol = 0;
              const rulesByKey = labelRules.reduce((acc, rule) => {
                acc[rule.key] = rule.labels;
                return acc;
              }, {});
              const totalColumnIndexes = getT12TotalColumnIndexes([headerRow]);
              const sumRow = (row, key = null) => {
                const explicitTotal = parseT12TotalColumnValue(row, totalColumnIndexes, key);
                if (explicitTotal !== null) return explicitTotal;
                const values = [];
                for (let i = 1; i < row.length; i += 1) {
                  const cell = String(row[i] || '').toLowerCase();
                  if (cell.includes('%')) continue;
                  const value = numericFromCell(row[i]);
                  if (!Number.isFinite(value)) continue;
                  if (key && !isPlausibleT12Field(key, value)) continue;
                  values.push(value);
                }
                if (values.length === 1) return values[0];
                if (values.length === 12) {
                  const total = values.reduce((sum, value) => sum + value, 0);
                  return key && !isPlausibleT12Field(key, total) ? null : total;
                }
                return null;
              };

              const applyRowMatch = (key, row) => sumRow(row, key);

              for (const row of rows.slice(1)) {
                if (!Array.isArray(row)) continue;
                const labelText = normalizeText(row[labelCol]);
                if (!labelText) continue;
                for (const [key, synonyms] of Object.entries(rulesByKey)) {
                  if (
                    (key === 'gross_potential_rent' && gross_potential_rent !== null) ||
                    (key === 'effective_gross_income' && effective_gross_income !== null) ||
                    (key === 'total_operating_expenses' && total_operating_expenses !== null) ||
                    (key === 'net_operating_income' && net_operating_income !== null)
                  ) {
                    continue;
                  }
                  const matched = synonyms.some((label) => labelMatchesT12Alias(labelText, label));
                  if (!matched) continue;
                  const rowValue = applyRowMatch(key, row);
                  if (rowValue === null) continue;
                  if (key === 'gross_potential_rent') {
                    gross_potential_rent = rowValue;
                    column_map.gross_potential_rent = row[labelCol];
                  } else if (key === 'effective_gross_income') {
                    effective_gross_income = rowValue;
                    column_map.effective_gross_income = row[labelCol];
                  } else if (key === 'total_operating_expenses') {
                    total_operating_expenses = rowValue;
                    column_map.total_operating_expenses = row[labelCol];
                  } else if (key === 'net_operating_income') {
                    net_operating_income = rowValue;
                    column_map.net_operating_income = row[labelCol];
                  }
                }
              }
            }

            const parse_warnings = [];
            if (gross_potential_rent === null) parse_warnings.push('missing_gross_potential_rent');
            if (effective_gross_income === null) parse_warnings.push('missing_effective_gross_income');
            if (total_operating_expenses === null) parse_warnings.push('missing_total_operating_expenses');
            if (net_operating_income === null) parse_warnings.push('missing_net_operating_income');
            if (declaredTypeMismatch) parse_warnings.push('declared_doc_type_mismatch');

            const hasMinimumT12Coverage =
              parsedT12.has_gross_rental_income && Number(parsedT12.expense_lines_found || 0) >= 3;
            const coreSummaryValidation = validateCoreT12Payload(
              { effective_gross_income, total_operating_expenses, net_operating_income },
              'csv_core_summary_rows'
            );
            const acceptedCoreSummaryRows = !hasMinimumT12Coverage && coreSummaryValidation.ok;
            if (!hasMinimumT12Coverage && !acceptedCoreSummaryRows) {
              gross_potential_rent = null;
              effective_gross_income = null;
              total_operating_expenses = null;
              net_operating_income = null;
              if (!parse_warnings.includes('insufficient_t12_coverage')) {
                parse_warnings.push('insufficient_t12_coverage');
              }
            } else if (acceptedCoreSummaryRows) {
              parse_warnings.push('t12_core_values_accepted_from_summary_rows');
              if (Number(parsedT12.expense_lines_found || 0) < 3 || !parsedT12.has_gross_rental_income) {
                parse_warnings.push('limited_t12_line_item_detail');
              }
            }

            const requiredValues = [
              gross_potential_rent,
              effective_gross_income,
              total_operating_expenses,
              net_operating_income,
            ];
            const presentCount = requiredValues.filter((value) => Number.isFinite(value)).length;
            let confidence = Math.min(presentCount / 4, 0.95);
            if (acceptedCoreSummaryRows) confidence = Math.min(confidence, 0.85);
            if (presentCount === 0) {
              confidence = 0.1;
              parse_warnings.push('missing_all_required_t12_fields');
            }

            payload = {
              file_id: file.id,
              original_filename: file.original_filename,
              declared_doc_type: declaredDocType,
              detected_doc_type: detectedDocType,
              classifier_score: classifierScore,
              classifier_signals: classifierSignals,
              method: 'csv',
              confidence,
              gross_potential_rent,
              effective_gross_income,
              total_operating_expenses,
              net_operating_income,
              income_lines: parsedT12.income_lines || [],
              expense_lines: parsedT12.expense_lines || [],
              expense_lines_found: parsedT12.expense_lines_found || 0,
              has_gross_rental_income: parsedT12.has_gross_rental_income === true,
              has_minimum_t12_coverage: hasMinimumT12Coverage,
              core_summary_rows_accepted: acceptedCoreSummaryRows,
              column_map,
              parse_warnings,
            };
          } else {
            const found = {
              gross_potential_rent: parsedT12.gross_potential_rent,
              effective_gross_income: parsedT12.effective_gross_income,
              total_operating_expenses: parsedT12.total_operating_expenses,
              net_operating_income: parsedT12.net_operating_income,
            };

            const parse_warnings = [];
            if (!Number.isFinite(found.gross_potential_rent)) parse_warnings.push('missing_gross_potential_rent');
            if (!Number.isFinite(found.effective_gross_income)) parse_warnings.push('missing_effective_gross_income');
            if (!Number.isFinite(found.total_operating_expenses)) parse_warnings.push('missing_total_operating_expenses');
            if (!Number.isFinite(found.net_operating_income)) parse_warnings.push('missing_net_operating_income');
            if (declaredTypeMismatch) parse_warnings.push('declared_doc_type_mismatch');

            const hasMinimumT12Coverage =
              parsedT12.has_gross_rental_income && Number(parsedT12.expense_lines_found || 0) >= 3;
            const coreSummaryValidation = validateCoreT12Payload(
              {
                effective_gross_income: found.effective_gross_income,
                total_operating_expenses: found.total_operating_expenses,
                net_operating_income: found.net_operating_income,
              },
              'xlsx_core_summary_rows'
            );
            const acceptedCoreSummaryRows = !hasMinimumT12Coverage && coreSummaryValidation.ok;
            if (!hasMinimumT12Coverage && !acceptedCoreSummaryRows) {
              found.gross_potential_rent = null;
              found.effective_gross_income = null;
              found.total_operating_expenses = null;
              found.net_operating_income = null;
              if (!parse_warnings.includes('insufficient_t12_coverage')) {
                parse_warnings.push('insufficient_t12_coverage');
              }
            } else if (acceptedCoreSummaryRows) {
              parse_warnings.push('t12_core_values_accepted_from_summary_rows');
              if (Number(parsedT12.expense_lines_found || 0) < 3 || !parsedT12.has_gross_rental_income) {
                parse_warnings.push('limited_t12_line_item_detail');
              }
            }

            const requiredValues = [
              found.gross_potential_rent,
              found.effective_gross_income,
              found.total_operating_expenses,
              found.net_operating_income,
            ];
            const presentCount = requiredValues.filter((value) => Number.isFinite(value)).length;
            let confidence = Math.min(presentCount / 4, 0.95);
            if (acceptedCoreSummaryRows) confidence = Math.min(confidence, 0.85);
            if (presentCount === 0) {
              confidence = 0.1;
              parse_warnings.push('missing_all_required_t12_fields');
            }

            payload = {
              file_id: file.id,
              original_filename: file.original_filename,
              declared_doc_type: declaredDocType,
              detected_doc_type: detectedDocType,
              classifier_score: classifierScore,
              classifier_signals: classifierSignals,
              method: 'xlsx',
              confidence,
              ...found,
              income_lines: parsedT12.income_lines || [],
              expense_lines: parsedT12.expense_lines || [],
              expense_lines_found: parsedT12.expense_lines_found || 0,
              has_gross_rental_income: parsedT12.has_gross_rental_income === true,
              has_minimum_t12_coverage: hasMinimumT12Coverage,
              core_summary_rows_accepted: acceptedCoreSummaryRows,
              column_map: parsedT12.column_map,
              parse_warnings,
            };
          }

          const coreT12Validation = validateCoreT12Payload(
            payload,
            payload?.method || 'spreadsheet'
          );
          if (!coreT12Validation.ok) {
            await supabaseAdmin
              .from('analysis_job_files')
              .update({
                parse_status: 'failed',
                parse_error: `invalid_core_t12_values:${coreT12Validation.failures.join(',')}`,
              })
              .eq('id', file.id);
            return res.status(200).json({ ok: true, skipped: 1 });
          }

          payload = {
            ...payload,
            parse_branch: coreT12Validation.parse_branch,
            core_t12_validation: coreT12Validation,
          };

          await deleteExistingT12Artifacts(supabaseAdmin, jobId, file.id);

          const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 't12_parsed',
              bucket: 'system',
              object_path: `analysis_jobs/${jobId}/t12/${file.id}.json`,
              payload,
            },
          ]);

          if (artifactErr) {
            throw new Error(artifactErr.message || 'Failed to write t12 artifact');
          }

          const { error: parsedStatusErr } = await supabaseAdmin
            .from('analysis_job_files')
            .update({ parse_status: 'parsed', parse_error: null })
            .eq('id', file.id);

          if (parsedStatusErr) {
            throw new Error(`Failed to mark t12 file parsed: ${parsedStatusErr.message}`);
          }

          const { error: parsedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'worker_event',
              bucket: 'internal',
              object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                nowIso
              )}.json`,
              payload: {
                event: 'parser_completed',
                parser: 't12',
                result: 'parsed',
                job_id: jobId,
                timestamp: nowIso,
              },
            },
          ]);

          if (parsedEventErr) {
            console.error('Failed to write parser_completed event:', parsedEventErr.message);
          }

          parsedCount += 1;
        } catch (err) {
          const errorMessage = err?.message || 'Unknown error';

          await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 't12_parse_error',
              bucket: 'system',
              object_path: `analysis_jobs/${jobId}/t12_error/${file.id}/${safeTimestamp(nowIso)}.json`,
              payload: {
                file_id: file.id,
                original_filename: file.original_filename,
                error_message: errorMessage,
              },
            },
          ]);

          await supabaseAdmin
            .from('analysis_job_files')
            .update({ parse_status: 'failed', parse_error: errorMessage })
            .eq('id', file.id);

          const { error: failedEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'worker_event',
              bucket: 'internal',
              object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${file.id}/${safeTimestamp(
                nowIso
              )}.json`,
              payload: {
                event: 'parser_completed',
                parser: 't12',
                result: 'failed',
                job_id: jobId,
                timestamp: nowIso,
              },
            },
          ]);

          if (failedEventErr) {
            console.error('Failed to write parser_completed event:', failedEventErr.message);
          }

          failedCount += 1;
        }
      }

      return res.status(200).json({
        ok: true,
        jobId,
        parsed: parsedCount,
        skipped: skippedCount,
        failed: failedCount,
      });
    }

    // ── Mortgage Statement ──────────────────────────────────────────────────
    if (effectiveDocType === 'supporting_documents_unclassified') {
      const { error: unclassifiedArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: jobId,
          user_id: fileRow.user_id || null,
          type: 'supporting_doc_unclassified',
          bucket: 'system',
          object_path: `analysis_jobs/${jobId}/supporting_doc_unclassified/${fileRow.id}/${safeTimestamp(nowIso)}.json`,
          payload: {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            mime_type: fileRow.mime_type,
            bytes: fileRow.bytes,
            declared_doc_type: declaredDocType,
            effective_doc_type: effectiveDocType,
          },
        },
      ]);
      if (unclassifiedArtifactErr) {
        return res.status(500).json({ error: 'Failed to write unclassified artifact', details: unclassifiedArtifactErr.message });
      }
      await supabaseAdmin
        .from('analysis_job_files')
        .update({ parse_status: 'parsed_with_warnings', parse_error: 'doc_type_unclassified' })
        .eq('id', fileRow.id);
      return res.status(200).json({ ok: true, inferred: 'supporting_documents_unclassified' });
    }

    if (effectiveDocType === 'mortgage_statement' || effectiveDocType === 'loan_term_sheet' || effectiveDocType === 'appraisal' || effectiveDocType === 'property_tax' || effectiveDocType === 'insurance_policy' || effectiveDocType === 'bank_statement' || effectiveDocType === 'renovation') {
      const artifactType = `${effectiveDocType}_parsed`;
      const parserName = effectiveDocType;

      try {
        // Attempt to read the document_text_extracted artifact for text-based parsing
        const { data: textArtifact } = await supabaseAdmin
          .from('analysis_artifacts')
          .select('payload')
          .eq('job_id', jobId)
          .eq('type', 'document_text_extracted')
          .eq('payload->>file_id', String(fileRow.id))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const rawText = String(textArtifact?.payload?.text || textArtifact?.payload?.excerpt || '');
        const lowerText = rawText.toLowerCase();

        // Helper: extract dollar value near a label in raw text
        const extractDollarNear = (text, labels) => {
          for (const label of labels) {
            const idx = text.toLowerCase().indexOf(label);
            if (idx === -1) continue;
            const snippet = text.slice(idx, idx + 120);
            const match = snippet.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
            if (match) {
              const val = parseFloat(match[1].replace(/,/g, ''));
              if (Number.isFinite(val) && val > 500) return val;
            }
          }
          return null;
        };

        // Helper: extract percentage near a label
        const extractPercentNear = (text, labels) => {
          for (const label of labels) {
            const idx = text.toLowerCase().indexOf(label);
            if (idx === -1) continue;
            const snippet = text.slice(idx, idx + 80);
            const match = snippet.match(/([\d]+(?:\.\d{1,4})?)\s*%/);
            if (match) {
              const val = parseFloat(match[1]);
              if (Number.isFinite(val) && val > 0) return val;
            }
          }
          return null;
        };

        // Helper: extract integer years near a label
        const extractYearsNear = (text, labels) => {
          for (const label of labels) {
            const idx = text.toLowerCase().indexOf(label);
            if (idx === -1) continue;
            const snippet = text.slice(idx, idx + 80);
            const match = snippet.match(/(\d{1,2})\s*(?:years?|yr)/i);
            if (match) {
              const val = parseInt(match[1], 10);
              if (Number.isFinite(val) && val > 0) return val;
            }
          }
          return null;
        };

        let payload = null;
        const parse_warnings = [];

        if (effectiveDocType === 'loan_term_sheet') {
          let loan_amount = (() => {
            const candidates = [];
            const addCandidate = (value) => {
              const parsed = Number(String(value || '').replace(/,/g, ''));
              if (Number.isFinite(parsed) && parsed >= 10000) candidates.push(parsed);
            };
            const explicitMatches = rawText.matchAll(
              /loan amount(?:\s*\([^)]*\))?\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/gi
            );
            for (const match of explicitMatches) addCandidate(match[1]);
            const compactLoanMatches = rawText.matchAll(
              /(?:->\s*)?loan\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/gi
            );
            for (const match of compactLoanMatches) addCandidate(match[1]);
            if (candidates.length === 0) {
              const fallbackAmount = extractDollarNear(rawText, [
                'loan amount', 'mortgage amount', 'principal amount', 'total loan', 'facility amount',
                'outstanding loan balance', 'outstanding balance', 'current loan balance', 'current mortgage balance',
              ]);
              addCandidate(fallbackAmount);
            }
            return candidates.length > 0 ? Math.max(...candidates) : null;
          })();
          const purchase_price = extractDollarNear(rawText, [
            'purchase price', 'acquisition price', 'contract price',
          ]);

          const compact_interest_rate = (() => {
            const beforeLabel = rawText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:interest\s*rate|note\s*rate|coupon\s*rate)\b/i);
            if (beforeLabel) return Number(beforeLabel[1]);
            const afterLabel = rawText.match(/\b(?:interest\s*rate|note\s*rate|coupon\s*rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i);
            if (afterLabel) return Number(afterLabel[1]);
            const genericDebtRate = rawText.match(/\b(?:fixed\s+rate|loan\s+rate|rate)\s*[:\-]\s*(\d+(?:\.\d+)?)\s*%\s*(?:fixed|floating|variable)?(?=\s|$|[.;,)])/i);
            if (genericDebtRate) return Number(genericDebtRate[1]);
            const financingContext = rawText.match(/\bfinancing\b[\s\S]{0,160}?(\d+(?:\.\d+)?)\s*%[\s\S]{0,80}?\b(?:interest\s*rate|note\s*rate|coupon\s*rate)\b/i);
            return financingContext ? Number(financingContext[1]) : null;
          })();

          const compact_ltv = (() => {
            const parseCandidate = (value) => {
              const parsed = Number(value);
              return Number.isFinite(parsed) && parsed > 0 && parsed <= 100 ? parsed : null;
            };
            const lines = rawText.split(/\r?\n/).filter((line) =>
              /\b(?:loan\s*to\s*value|loan-to-value|ltv)\b/i.test(line)
            );
            for (const line of lines) {
              const afterLabel = line.match(/\b(?:loan\s*to\s*value|loan-to-value|ltv)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:%|percent)(?=\s|$|[.;,)])/i);
              const afterValue = parseCandidate(afterLabel?.[1]);
              if (afterValue !== null) return afterValue;

              const beforeLabel = line.match(/\b(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:loan\s*to\s*value|loan-to-value|ltv)\b/i);
              const beforeValue = parseCandidate(beforeLabel?.[1]);
              if (beforeValue !== null) return beforeValue;
            }
            return null;
          })();

          const compact_amort_years = (() => {
            const compactAmMatch = rawText.match(/\bAM\s*[:\-]?\s*(\d+)\s*(?:years?|yrs?|yr)\b/i);
            if (compactAmMatch) return parseInt(compactAmMatch[1], 10);
            const beforeAmortMatch = rawText.match(/\b(\d+)\s*-?\s*(?:years?|yrs?|yr)\s+amort(?:ization)?\b/i);
            if (beforeAmortMatch) return parseInt(beforeAmortMatch[1], 10);
            const idx = lowerText.search(/amortiz/);
            if (idx !== -1) {
              const snippet = rawText.slice(idx, idx + 80);
              const m = snippet.match(/(\d+)\s*(?:year|yr)/i);
              if (m) return parseInt(m[1], 10);
            }
            return null;
          })();

          const compact_refi_cap_rate = (() => {
            const m = rawText.match(/\b(?:exit\s*cap(?:\s*rate)?|refi\s*cap(?:\s*rate)?|cap\s*rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i);
            return m ? Number(m[1]) : null;
          })();

          const going_in_cap_rate =
            extractPercentNear(rawText, [
              'going in cap rate',
              'going-in cap rate',
              'entry cap rate',
              'purchase cap rate',
              'going in capitalization rate',
            ]);

          const closing_costs_percent =
            extractPercentNear(rawText, [
              'closing costs',
              'closing cost',
              'acquisition closing costs',
              'transaction costs',
              'acquisition costs',
            ]);

          const interest_rate =
            compact_interest_rate ??
            extractPercentNear(rawText, [
              'interest rate', 'note rate', 'coupon rate',
            ]);

          let ltv =
            compact_ltv ??
            extractPercentNear(rawText, [
              'loan to value', 'ltv', 'loan-to-value',
            ]);

          if (
            Number.isFinite(ltv) &&
            Number.isFinite(interest_rate) &&
            ltv === interest_rate
          ) {
            ltv = null;
          }

          const amort_years = compact_amort_years;

          const refi_cap_rate =
            compact_refi_cap_rate ??
            extractPercentNear(rawText, [
              'exit cap', 'refi cap', 'cap rate', 'exit cap rate', 'refi cap rate',
            ]);

          let derived_acquisition_loan_amount = null;
          if (!loan_amount && Number.isFinite(purchase_price) && purchase_price > 0 && Number.isFinite(ltv) && ltv > 0 && ltv <= 100) {
            derived_acquisition_loan_amount = Math.round(purchase_price * (ltv / 100));
            if (!parse_warnings.includes('loan_amount_derived_from_purchase_price_and_ltv')) {
              parse_warnings.push('loan_amount_derived_from_purchase_price_and_ltv');
            }
          }
          if (!loan_amount && !derived_acquisition_loan_amount) parse_warnings.push('missing_loan_amount');

          const isValidPurchasePrice = (value) =>
            Number.isFinite(value) && value > 0 && value <= 1000000000;
          const isValidLtv = (value) => Number.isFinite(value) && value > 0 && value <= 100;
          const isValidInterestRate = (value) => Number.isFinite(value) && value > 0 && value <= 30;
          const isValidAmortYears = (value) => Number.isFinite(value) && value > 0 && value <= 50;
          const isValidCapRate = (value) => Number.isFinite(value) && value > 0 && value <= 20;
          const isValidClosingCostsPercent = (value) =>
            Number.isFinite(value) && value >= 0 && value <= 20;

          const eligibleAcquisitionRecovery = shouldAttemptAcquisitionPurchaseAssumptionsRecovery(rawText);
          const acquisitionRecoveryResult = eligibleAcquisitionRecovery
            ? await recoverAcquisitionPurchaseAssumptionsWithAI({
                text: rawText,
                filename: fileRow.original_filename,
                jobId,
                includeDiagnostics: true,
              })
            : { payload: null, diagnostics: null };
          const maybeAiAcquisitionRecovery = acquisitionRecoveryResult?.payload || null;
          const acquisitionRecoveryDiagnostics = acquisitionRecoveryResult?.diagnostics || null;

          const mergeValidatedAcquisitionField = (aiValue, deterministicValue, predicate) => {
            if (predicate(deterministicValue)) return deterministicValue;
            if (predicate(aiValue)) return aiValue;
            return null;
          };

          const validatedPurchasePrice = mergeValidatedAcquisitionField(
            maybeAiAcquisitionRecovery?.purchase_price,
            purchase_price,
            isValidPurchasePrice
          );
          const validatedLtv = mergeValidatedAcquisitionField(
            maybeAiAcquisitionRecovery?.ltv,
            ltv,
            isValidLtv
          );
          const validatedInterestRate = mergeValidatedAcquisitionField(
            maybeAiAcquisitionRecovery?.interest_rate,
            interest_rate,
            isValidInterestRate
          );
          const validatedAmortYears = mergeValidatedAcquisitionField(
            maybeAiAcquisitionRecovery?.amortization_years ?? maybeAiAcquisitionRecovery?.amort_years,
            amort_years,
            isValidAmortYears
          );
          const validatedGoingInCapRate = mergeValidatedAcquisitionField(
            maybeAiAcquisitionRecovery?.going_in_cap_rate,
            going_in_cap_rate,
            isValidCapRate
          );
          const validatedClosingCostsPercent = mergeValidatedAcquisitionField(
            maybeAiAcquisitionRecovery?.closing_costs_percent,
            closing_costs_percent,
            isValidClosingCostsPercent
          );

          let validatedDerivedAcquisitionLoanAmount = derived_acquisition_loan_amount;
          if (
            !Number.isFinite(validatedDerivedAcquisitionLoanAmount) &&
            Number.isFinite(validatedPurchasePrice) &&
            validatedPurchasePrice > 0 &&
            Number.isFinite(validatedLtv) &&
            validatedLtv > 0 &&
            validatedLtv <= 100
          ) {
            validatedDerivedAcquisitionLoanAmount = Math.round(validatedPurchasePrice * (validatedLtv / 100));
            if (!parse_warnings.includes('loan_amount_derived_from_purchase_price_and_ltv')) {
              parse_warnings.push('loan_amount_derived_from_purchase_price_and_ltv');
            }
          }

          if (maybeAiAcquisitionRecovery && maybeAiAcquisitionRecovery.parse_warnings) {
            parse_warnings.push(...maybeAiAcquisitionRecovery.parse_warnings);
          }
          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: maybeAiAcquisitionRecovery ? maybeAiAcquisitionRecovery.method : 'text_excerpt',
            ai_assisted: Boolean(maybeAiAcquisitionRecovery),
            validated: Boolean(maybeAiAcquisitionRecovery),
            loan_amount,
            purchase_price: validatedPurchasePrice,
            derived_acquisition_loan_amount: validatedDerivedAcquisitionLoanAmount,
            debt_basis: validatedDerivedAcquisitionLoanAmount ? 'acquisition_financing_assumption' : null,
            interest_rate: validatedInterestRate,
            ltv: validatedLtv,
            amortization_years: validatedAmortYears,
            amort_years: validatedAmortYears,
            going_in_cap_rate: validatedGoingInCapRate,
            closing_costs_percent: validatedClosingCostsPercent,
            refi_cap_rate,
            parse_warnings,
            ai_recovery_evidence: maybeAiAcquisitionRecovery?.ai_recovery_evidence || null,
          };

          if (acquisitionRecoveryDiagnostics) {
            await writeAiSupportDocRecoveryDiagnostic({
              supabaseAdmin,
              jobId,
              userId: fileRow.user_id || null,
              fileId: fileRow.id,
              filename: fileRow.original_filename,
              supportDocRecoveryType: 'acquisition_purchase_assumptions',
              initialDocType: effectiveDocType,
              declaredDocType,
              detectedDocType,
              eligibleRecovery: eligibleAcquisitionRecovery,
              diagnostics: acquisitionRecoveryDiagnostics,
            });
          }
        } else if (effectiveDocType === 'renovation') {
          const total_budget = extractDollarNear(rawText, [
            'total budget', 'renovation budget', 'capex budget', 'capital budget',
          ]);
          const compactText = rawText.replace(/\s+/g, ' ').trim();
          const budgetSpecs = [
            { category: 'Exterior / Curb Appeal', pattern: /exterior\s*\/\s*curb\s+appeal\s*:\s*\$?\s*([\d,]+(?:\.\d{1,2})?)([^$]*?)(?=common areas|unit turns|contingency|$)/i },
            { category: 'Common Areas', pattern: /common\s+areas\s*:\s*\$?\s*([\d,]+(?:\.\d{1,2})?)([^$]*?)(?=unit turns|contingency|$)/i },
            { category: 'Unit Turns', pattern: /unit\s+turns(?:\s*\([^)]+\))?\s*:\s*(?:\d+\s+units\s*@\s*\$?[\d,]+(?:\/each)?\s*)?\(?\$?\s*([\d,]+(?:\.\d{1,2})?)\)?([^$]*?)(?=contingency|$)/i },
            { category: 'Contingency', pattern: /contingency(?:\s*\([^)]+\))?\s*:\s*\$?\s*([\d,]+(?:\.\d{1,2})?)([^$]*?)(?=$)/i },
          ];
          const budget_rows = budgetSpecs
            .map((spec) => {
              const match = compactText.match(spec.pattern);
              if (!match) return null;
              const amount = Number(String(match[1] || '').replace(/,/g, ''));
              if (!Number.isFinite(amount) || amount <= 0) return null;
              const scope = String(match[2] || '').replace(/^[\s:,-]+/, '').trim();
              return {
                category: spec.category,
                estimated_cost: amount,
                scope_of_work: scope,
              };
            })
            .filter(Boolean);
          const rowsTotal = budget_rows.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0);
          if (!total_budget) parse_warnings.push('missing_total_budget');
          if (budget_rows.length === 0) parse_warnings.push('missing_budget_line_items');
          if (Number.isFinite(total_budget) && budget_rows.length > 0 && Math.abs(rowsTotal - total_budget) > Math.max(5000, total_budget * 0.02)) {
            parse_warnings.push('budget_line_items_do_not_sum_to_total');
          }
          const eligibleRenovationRecovery = shouldAttemptRenovationRecovery(rawText);
          const renovationRecoveryResult = eligibleRenovationRecovery
            ? await recoverRenovationWithAI({
                text: rawText,
                filename: fileRow.original_filename,
                jobId,
                includeDiagnostics: true,
              })
            : { payload: null, diagnostics: null };
          const maybeAiRenovationRecovery = renovationRecoveryResult?.payload || null;
          const renovationRecoveryDiagnostics = renovationRecoveryResult?.diagnostics || null;
          const mergeValidatedRenovationField = (aiValue, deterministicValue, predicate) => {
            if (predicate(deterministicValue)) return deterministicValue;
            if (predicate(aiValue)) return aiValue;
            return null;
          };
          const isValidRenovationBudget = (value) =>
            Number.isFinite(value) && value > 0 && value <= 1000000000;
          const isValidPositiveCount = (value) =>
            Number.isFinite(value) && value > 0 && value <= 100000;
          const isValidRenovationText = (value) => typeof value === 'string' && value.trim().length > 0;
          const validatedTotalBudget = mergeValidatedRenovationField(
            maybeAiRenovationRecovery?.total_budget,
            total_budget,
            isValidRenovationBudget
          );
          const validatedBudgetRows = budget_rows.length > 0
            ? budget_rows
            : Array.isArray(maybeAiRenovationRecovery?.budget_rows)
              ? maybeAiRenovationRecovery.budget_rows
              : [];
          const validatedUnitCount = mergeValidatedRenovationField(
            maybeAiRenovationRecovery?.unit_count,
            null,
            isValidPositiveCount
          );
          const validatedPerUnitCost = mergeValidatedRenovationField(
            maybeAiRenovationRecovery?.per_unit_cost,
            null,
            isValidRenovationBudget
          );
          const validatedTimingOrPhasing = mergeValidatedRenovationField(
            maybeAiRenovationRecovery?.timing_or_phasing,
            null,
            isValidRenovationText
          );
          const validatedRentLift = mergeValidatedRenovationField(
            maybeAiRenovationRecovery?.rent_lift,
            null,
            isValidRenovationText
          );
          const validatedRoi = mergeValidatedRenovationField(
            maybeAiRenovationRecovery?.roi,
            null,
            isValidRenovationText
          );
          const validatedPaybackPeriod = mergeValidatedRenovationField(
            maybeAiRenovationRecovery?.payback_period,
            null,
            isValidRenovationText
          );
          const validatedExecutionRows = Array.isArray(maybeAiRenovationRecovery?.execution_rows)
            ? maybeAiRenovationRecovery.execution_rows
            : [];
          const execution_rows = [
            ...(validatedUnitCount ? [{ metric: 'Unit Count', value: validatedUnitCount }] : []),
            ...(validatedPerUnitCost ? [{ metric: 'Per Unit Cost', value: validatedPerUnitCost }] : []),
            ...validatedExecutionRows,
          ];
          const budget_note = Number.isFinite(validatedTotalBudget)
            ? `Uploaded renovation budget identifies a total budget of $${Math.round(validatedTotalBudget).toLocaleString('en-US')}.`
            : validatedBudgetRows.length > 0
              ? 'Uploaded renovation support includes structured line items, but no verified total budget was extracted.'
              : 'Renovation support was identified, but no verified total budget or structured line items were extracted.';
          const execution_note =
            execution_rows.length > 0
              ? 'Verified renovation timing, phasing, and return assumptions were retained where explicitly supported. Unverified return calculations were not modeled.'
              : 'No implementation timing, rent lift, ROI, or payback inputs were included unless explicitly shown in structured source fields.';
          const interpretation = validatedBudgetRows.length > 0
            ? 'Structured CapEx budget categories were extracted from the uploaded renovation source. Return impact is not calculated without document-supported rent lift, timing, and cost recovery assumptions.'
            : 'Renovation support was identified, but no structured budget categories were extracted.';
          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: maybeAiRenovationRecovery ? maybeAiRenovationRecovery.method : 'text_excerpt',
            ai_assisted: Boolean(maybeAiRenovationRecovery),
            validated: Boolean(maybeAiRenovationRecovery),
            total_budget: validatedTotalBudget,
            budget_rows: validatedBudgetRows,
            unit_count: validatedUnitCount,
            per_unit_cost: validatedPerUnitCost,
            timing_or_phasing: validatedTimingOrPhasing,
            rent_lift: validatedRentLift,
            roi: validatedRoi,
            payback_period: validatedPaybackPeriod,
            execution_rows,
            budget_note,
            execution_note,
            interpretation,
            parse_warnings,
            ai_recovery_evidence: maybeAiRenovationRecovery?.ai_recovery_evidence || null,
          };
          if (renovationRecoveryDiagnostics) {
            await writeAiSupportDocRecoveryDiagnostic({
              supabaseAdmin,
              jobId,
              userId: fileRow.user_id || null,
              fileId: fileRow.id,
              filename: fileRow.original_filename,
              supportDocRecoveryType: 'renovation',
              initialDocType: effectiveDocType,
              declaredDocType,
              detectedDocType,
              eligibleRecovery: eligibleRenovationRecovery,
              diagnostics: renovationRecoveryDiagnostics,
            });
          }
        } else if (effectiveDocType === 'mortgage_statement') {
          const deterministicMortgagePayload = parseMortgageStatementFromText(rawText, fileRow);
          const eligibleCurrentMortgageRecovery = shouldAttemptCurrentMortgageRecovery(rawText);
          const currentMortgageRecoveryResult = eligibleCurrentMortgageRecovery
            ? await recoverCurrentMortgageWithAI({
                text: rawText,
                filename: fileRow.original_filename,
                jobId,
                includeDiagnostics: true,
              })
            : { payload: null, diagnostics: null };
          const maybeAiCurrentMortgageRecovery = currentMortgageRecoveryResult?.payload || null;
          const currentMortgageRecoveryDiagnostics = currentMortgageRecoveryResult?.diagnostics || null;
          const mergeValidatedCurrentMortgageField = (aiValue, deterministicValue, predicate) => {
            if (predicate(deterministicValue)) return deterministicValue;
            if (predicate(aiValue)) return aiValue;
            return null;
          };
          const isValidOutstandingBalance = (value) => Number.isFinite(value) && value > 0 && value <= 1000000000;
          const isValidMonthlyPayment = (value) => Number.isFinite(value) && value > 0 && value <= 1000000;
          const isValidAnnualDebtService = (value) => Number.isFinite(value) && value > 0 && value <= 12000000;
          const isValidInterestRate = (value) => Number.isFinite(value) && value > 0 && value <= 30;
          const isValidAmortYears = (value) => Number.isFinite(value) && value > 0 && value <= 50;
          const isValidMaturityDate = (value) => typeof value === 'string' && value.length > 0;
          const isValidLenderName = (value) => typeof value === 'string' && value.length > 0;

          const validatedOutstandingBalance = mergeValidatedCurrentMortgageField(
            maybeAiCurrentMortgageRecovery?.outstanding_balance,
            deterministicMortgagePayload.outstanding_balance,
            isValidOutstandingBalance
          );
          const validatedMonthlyPayment = mergeValidatedCurrentMortgageField(
            maybeAiCurrentMortgageRecovery?.monthly_payment,
            deterministicMortgagePayload.monthly_payment,
            isValidMonthlyPayment
          );
          const validatedAnnualDebtService = mergeValidatedCurrentMortgageField(
            maybeAiCurrentMortgageRecovery?.annual_debt_service,
            deterministicMortgagePayload.annual_debt_service,
            isValidAnnualDebtService
          );
          const validatedInterestRate = mergeValidatedCurrentMortgageField(
            maybeAiCurrentMortgageRecovery?.interest_rate,
            deterministicMortgagePayload.interest_rate,
            isValidInterestRate
          );
          const validatedAmortYears = mergeValidatedCurrentMortgageField(
            maybeAiCurrentMortgageRecovery?.amortization_years ?? maybeAiCurrentMortgageRecovery?.amort_years,
            deterministicMortgagePayload.amort_years,
            isValidAmortYears
          );
          const validatedMaturityDate = mergeValidatedCurrentMortgageField(
            maybeAiCurrentMortgageRecovery?.maturity_date,
            deterministicMortgagePayload.maturity_date,
            isValidMaturityDate
          );
          const validatedLenderName = mergeValidatedCurrentMortgageField(
            maybeAiCurrentMortgageRecovery?.lender_name,
            deterministicMortgagePayload.lender_name,
            isValidLenderName
          );
          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: maybeAiCurrentMortgageRecovery ? maybeAiCurrentMortgageRecovery.method : 'text_excerpt',
            ai_assisted: Boolean(maybeAiCurrentMortgageRecovery),
            validated: Boolean(maybeAiCurrentMortgageRecovery),
            outstanding_balance: validatedOutstandingBalance,
            loan_amount: validatedOutstandingBalance,
            monthly_payment: validatedMonthlyPayment,
            monthly_debt_service: validatedMonthlyPayment,
            annual_debt_service: validatedAnnualDebtService,
            interest_rate: validatedInterestRate,
            amort_years: validatedAmortYears,
            maturity_date: validatedMaturityDate,
            lender_name: validatedLenderName,
            parse_warnings: [
              ...new Set([
                ...deterministicMortgagePayload.parse_warnings,
                ...(maybeAiCurrentMortgageRecovery?.parse_warnings || []),
              ]),
            ],
            ai_recovery_evidence: maybeAiCurrentMortgageRecovery?.ai_recovery_evidence || null,
          };
          if (currentMortgageRecoveryDiagnostics) {
            await writeAiSupportDocRecoveryDiagnostic({
              supabaseAdmin,
              jobId,
              userId: fileRow.user_id || null,
              fileId: fileRow.id,
              filename: fileRow.original_filename,
              supportDocRecoveryType: 'current_mortgage',
              initialDocType: effectiveDocType,
              declaredDocType,
              detectedDocType,
              eligibleRecovery: eligibleCurrentMortgageRecovery,
              diagnostics: currentMortgageRecoveryDiagnostics,
            });
          }
        } else if (effectiveDocType === 'appraisal') {
          const appraised_value = extractDollarNear(rawText, [
            'appraised value', 'as-is value', 'market value', 'estimated value',
            'opinion of value', 'value conclusion',
          ]);
          const cap_rate = extractPercentNear(rawText, [
            'capitalization rate', 'cap rate', 'overall rate', 'overall capitalization',
          ]);
          const effective_gross_income = extractDollarNear(rawText, [
            'effective gross income', 'egi', 'effective gross revenue',
          ]);

          if (!appraised_value) parse_warnings.push('missing_appraised_value');

          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: 'text_excerpt',
            appraised_value,
            cap_rate,
            effective_gross_income,
            parse_warnings,
          };

          const eligibleAppraisalRecovery = shouldAttemptAppraisalRecovery(rawText);
          const appraisalRecoveryResult = eligibleAppraisalRecovery
            ? await recoverAppraisalWithAI({
                text: rawText,
                filename: fileRow.original_filename,
                jobId,
                includeDiagnostics: true,
              })
            : { payload: null, diagnostics: null };
          const maybeAiAppraisalRecovery = appraisalRecoveryResult?.payload || null;
          const appraisalRecoveryDiagnostics = appraisalRecoveryResult?.diagnostics || null;
          const mergeValidatedAppraisalField = (aiValue, deterministicValue, predicate) => {
            if (predicate(deterministicValue)) return deterministicValue;
            if (predicate(aiValue)) return aiValue;
            return null;
          };
          const isValidAppraisedValue = (value) =>
            Number.isFinite(value) && value > 0 && value <= 1000000000;
          const isValidCapRate = (value) => Number.isFinite(value) && value > 0 && value <= 20;
          const isValidIncome = (value) => Number.isFinite(value) && value > 0 && value <= 1000000000;
          const isValidAppraisalText = (value) => typeof value === 'string' && value.trim().length > 0;
          const validatedAppraisedValue = mergeValidatedAppraisalField(
            maybeAiAppraisalRecovery?.appraised_value,
            appraised_value,
            isValidAppraisedValue
          );
          const validatedValuationDate = mergeValidatedAppraisalField(
            maybeAiAppraisalRecovery?.valuation_date,
            null,
            isValidAppraisalText
          );
          const validatedCapRate = mergeValidatedAppraisalField(
            maybeAiAppraisalRecovery?.cap_rate,
            cap_rate,
            isValidCapRate
          );
          const validatedEffectiveGrossIncome = mergeValidatedAppraisalField(
            maybeAiAppraisalRecovery?.effective_gross_income,
            effective_gross_income,
            isValidIncome
          );
          const validatedNoi = mergeValidatedAppraisalField(
            maybeAiAppraisalRecovery?.noi,
            null,
            isValidIncome
          );
          const validatedValueBasis = mergeValidatedAppraisalField(
            maybeAiAppraisalRecovery?.value_basis,
            null,
            isValidAppraisalText
          );
          const validatedAppraisalType = mergeValidatedAppraisalField(
            maybeAiAppraisalRecovery?.appraisal_type,
            null,
            isValidAppraisalText
          );
          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: maybeAiAppraisalRecovery ? maybeAiAppraisalRecovery.method : 'text_excerpt',
            ai_assisted: Boolean(maybeAiAppraisalRecovery),
            validated: Boolean(maybeAiAppraisalRecovery),
            appraised_value: validatedAppraisedValue,
            valuation_date: validatedValuationDate,
            cap_rate: validatedCapRate,
            effective_gross_income: validatedEffectiveGrossIncome,
            noi: validatedNoi,
            value_basis: validatedValueBasis,
            appraisal_type: validatedAppraisalType,
            parse_warnings,
            ai_recovery_evidence: maybeAiAppraisalRecovery?.ai_recovery_evidence || null,
          };
          if (appraisalRecoveryDiagnostics) {
            await writeAiSupportDocRecoveryDiagnostic({
              supabaseAdmin,
              jobId,
              userId: fileRow.user_id || null,
              fileId: fileRow.id,
              filename: fileRow.original_filename,
              supportDocRecoveryType: 'appraisal',
              initialDocType: effectiveDocType,
              declaredDocType,
              detectedDocType,
              eligibleRecovery: eligibleAppraisalRecovery,
              diagnostics: appraisalRecoveryDiagnostics,
            });
          }

          const eligibleAcquisitionRecovery = shouldAttemptAcquisitionPurchaseAssumptionsRecovery(rawText);
          if (eligibleAcquisitionRecovery) {
            const acquisitionRecoveryResult = await recoverAcquisitionPurchaseAssumptionsWithAI({
              text: rawText,
              filename: fileRow.original_filename,
              jobId,
              includeDiagnostics: true,
            });
            const acquisitionRecovery = acquisitionRecoveryResult?.payload || null;
            const acquisitionRecoveryDiagnostics = acquisitionRecoveryResult?.diagnostics || null;
            if (acquisitionRecovery) {
              const acquisitionArtifactPayload = {
                file_id: fileRow.id,
                original_filename: fileRow.original_filename,
                method: acquisitionRecovery.method,
                ai_assisted: acquisitionRecovery.ai_assisted,
                validated: acquisitionRecovery.validated,
                purchase_price: acquisitionRecovery.purchase_price,
                ltv: acquisitionRecovery.ltv,
                interest_rate: acquisitionRecovery.interest_rate,
                amortization_years: acquisitionRecovery.amortization_years,
                amort_years: acquisitionRecovery.amort_years,
                going_in_cap_rate: acquisitionRecovery.going_in_cap_rate,
                closing_costs_percent: acquisitionRecovery.closing_costs_percent,
                derived_acquisition_loan_amount: acquisitionRecovery.derived_acquisition_loan_amount,
                debt_basis: acquisitionRecovery.debt_basis,
                parse_warnings: acquisitionRecovery.parse_warnings,
                ai_recovery_evidence: acquisitionRecovery.ai_recovery_evidence,
              };
              const { error: acquisitionArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
                {
                  job_id: jobId,
                  user_id: fileRow.user_id || null,
                  type: 'loan_term_sheet_parsed',
                  bucket: 'system',
                  object_path: `analysis_jobs/${jobId}/loan_term_sheet/${fileRow.id}_acquisition.json`,
                  payload: acquisitionArtifactPayload,
                },
              ]);
              if (acquisitionArtifactErr) {
                throw new Error(acquisitionArtifactErr.message || 'Failed to write acquisition artifact');
              }
            }
            if (acquisitionRecoveryDiagnostics) {
              await writeAiSupportDocRecoveryDiagnostic({
                supabaseAdmin,
                jobId,
                userId: fileRow.user_id || null,
                fileId: fileRow.id,
                filename: fileRow.original_filename,
                initialDocType: effectiveDocType,
                declaredDocType,
                detectedDocType,
                eligibleAcquisitionRecovery,
                diagnostics: acquisitionRecoveryDiagnostics,
              });
            }
          }
        } else if (effectiveDocType === 'property_tax') {
          const annualTaxResult = extractAnnualPropertyTaxFromText(rawText);
          const annual_tax = annualTaxResult.value;
          const assessed_value = extractDollarNear(rawText, [
            'assessed value', 'assessment value', 'property assessment',
            'phased-in assessment', 'current value assessment',
          ]);

          if (!annual_tax) {
            parse_warnings.push(annualTaxResult.rejectedCandidate ? 'implausible_annual_tax' : 'missing_annual_tax');
          }

          const eligiblePropertyTaxRecovery = shouldAttemptPropertyTaxRecovery(rawText);
          const propertyTaxRecoveryResult = eligiblePropertyTaxRecovery
            ? await recoverPropertyTaxWithAI({
                text: rawText,
                filename: fileRow.original_filename,
                jobId,
                includeDiagnostics: true,
              })
            : { payload: null, diagnostics: null };
          const maybeAiPropertyTaxRecovery = propertyTaxRecoveryResult?.payload || null;
          const propertyTaxRecoveryDiagnostics = propertyTaxRecoveryResult?.diagnostics || null;
          const mergeValidatedPropertyTaxField = (aiValue, deterministicValue, predicate) => {
            if (predicate(deterministicValue)) return deterministicValue;
            if (predicate(aiValue)) return aiValue;
            return null;
          };
          const isValidAnnualTax = (value) =>
            Number.isFinite(value) && value >= 1000 && value <= 10000000 && (value < 1900 || value > 2100);
          const isValidPositiveMoney = (value) => Number.isFinite(value) && value > 0 && value <= 1000000000;
          const isValidString = (value) => typeof value === 'string' && value.trim().length > 0;
          const validatedAnnualTax = mergeValidatedPropertyTaxField(
            maybeAiPropertyTaxRecovery?.annual_tax,
            annual_tax,
            isValidAnnualTax
          );
          const validatedTaxYear = mergeValidatedPropertyTaxField(
            maybeAiPropertyTaxRecovery?.tax_year,
            null,
            isValidString
          );
          const validatedAssessedValue = mergeValidatedPropertyTaxField(
            maybeAiPropertyTaxRecovery?.assessed_value,
            assessed_value,
            isValidPositiveMoney
          );
          const validatedRollNumber = mergeValidatedPropertyTaxField(
            maybeAiPropertyTaxRecovery?.roll_number,
            null,
            isValidString
          );

          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: maybeAiPropertyTaxRecovery ? maybeAiPropertyTaxRecovery.method : 'text_excerpt',
            ai_assisted: Boolean(maybeAiPropertyTaxRecovery),
            validated: Boolean(maybeAiPropertyTaxRecovery),
            annual_tax: validatedAnnualTax,
            assessed_value: validatedAssessedValue,
            tax_year: validatedTaxYear,
            roll_number: validatedRollNumber,
            property_tax_note: Number.isFinite(validatedAnnualTax)
              ? `Uploaded property tax support identifies an annual tax amount of $${Math.round(validatedAnnualTax).toLocaleString('en-US')}.`
              : 'Property tax modeling was not included because no verified annual property tax amount was extracted.',
            parse_warnings,
            ai_recovery_evidence: maybeAiPropertyTaxRecovery?.ai_recovery_evidence || null,
          };
          if (propertyTaxRecoveryDiagnostics) {
            await writeAiSupportDocRecoveryDiagnostic({
              supabaseAdmin,
              jobId,
              userId: fileRow.user_id || null,
              fileId: fileRow.id,
              filename: fileRow.original_filename,
              supportDocRecoveryType: 'property_tax',
              initialDocType: effectiveDocType,
              declaredDocType,
              detectedDocType,
              eligibleRecovery: eligiblePropertyTaxRecovery,
              diagnostics: propertyTaxRecoveryDiagnostics,
            });
          }
        } else if (effectiveDocType === 'insurance_policy') {
          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: 'text_excerpt',
            parse_warnings,
          };
        } else if (effectiveDocType === 'bank_statement') {
          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: 'text_excerpt',
            parse_warnings,
          };
        }

        const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
          {
            job_id: jobId,
            user_id: fileRow.user_id || null,
            type: artifactType,
            bucket: 'system',
            object_path: `analysis_jobs/${jobId}/${parserName}/${fileRow.id}.json`,
            payload,
          },
        ]);

        if (artifactErr) {
          throw new Error(artifactErr.message || `Failed to write ${artifactType} artifact`);
        }

        await supabaseAdmin
          .from('analysis_job_files')
          .update({ parse_status: 'parsed', parse_error: null })
          .eq('id', fileRow.id);

        await supabaseAdmin.from('analysis_artifacts').insert([
          {
            job_id: jobId,
            user_id: fileRow.user_id || null,
            type: 'worker_event',
            bucket: 'internal',
            object_path: `analysis_jobs/${jobId}/worker_event/parser_completed/${fileRow.id}/${safeTimestamp(nowIso)}.json`,
            payload: {
              event: 'parser_completed',
              parser: parserName,
              result: 'parsed',
              job_id: jobId,
              timestamp: nowIso,
            },
          },
        ]);

        return res.status(200).json({ ok: true, jobId, parsed: 1 });
      } catch (err) {
        const errorMessage = err?.message || 'Unknown error';
        await supabaseAdmin.from('analysis_job_files').update({
          parse_status: 'failed',
          parse_error: errorMessage,
        }).eq('id', fileRow.id);
        return res.status(200).json({ ok: true, jobId, parsed: 0, failed: 1, error: errorMessage });
      }
    }

    return res.status(400).json({ error: 'Unsupported doc_type' });
  } catch (err) {
    console.error('parse-doc error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
