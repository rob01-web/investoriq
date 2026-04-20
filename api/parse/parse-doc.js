import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { analyzeTables } from '../../lib/textractClient.js';

const safeTimestamp = (iso) => (iso || '').replace(/:/g, '-');

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
  const cleaned = text.replace(/[,$()\s]/g, '').replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  let parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  if (isParenNegative && parsed > 0) parsed = -parsed;
  return parsed;
};

const isSpreadsheetMime = (mime) => String(mime || '').toLowerCase().includes('spreadsheetml');
const isXlsxName = (name) => String(name || '').toLowerCase().endsWith('.xlsx');
const isCsvName = (name) => String(name || '').toLowerCase().endsWith('.csv');
const isCsvMime = (mime) => String(mime || '').toLowerCase().includes('csv');

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

const labelRules = [
  { key: 'gross_potential_rent', labels: ['gross potential rent', 'gpr'] },
  { key: 'effective_gross_income', labels: ['effective gross income', 'egi'] },
  { key: 'total_operating_expenses', labels: ['total operating expenses', 'operating expenses', 'total expenses'] },
  { key: 'net_operating_income', labels: ['net operating income', 'noi'] },
];

const numericFromCell = (value) => {
  return parseMoneyLike(value);
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
  const normalized = headerCells.map((cell) => normalizeClassifierText(cell));
  for (let i = 0; i < normalized.length; i += 1) {
    const header = normalized[i];
    if (!header) continue;
    for (const token of tokenGroups) {
      const normalizedToken = normalizeClassifierText(token);
      if (header.includes(normalizedToken)) return i;
    }
  }
  return -1;
};

const parseRentRollFromRowMatrices = (rowMatrices) => {
  const matrices = Array.isArray(rowMatrices) ? rowMatrices : [];
  for (const matrix of matrices) {
    const rows = Array.isArray(matrix?.rows) ? matrix.rows : [];
    if (!rows.length) continue;

    let headerIdx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const normalized = row.map((cell) => normalizeClassifierText(cell));
      const hasUnitHeader = normalized.some((cell) =>
        ['unit', 'apt', 'apartment', 'suite', 'unitid'].some((token) => cell.includes(token))
      );
      const hasRentHeader = normalized.some((cell) =>
        ['currentrent', 'inplacerent', 'monthlyrent', 'rent'].some((token) => cell.includes(token))
      );
      if (hasUnitHeader && hasRentHeader) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) continue;

    const header = rows[headerIdx] || [];
    const unitIdx = findHeaderIndex(header, ['unit', 'unit number', 'unit #', 'apt', 'suite', 'apartment']);
    const rentIdx = findHeaderIndex(header, ['current rent', 'in place rent', 'monthly rent', 'rent']);
    const marketRentIdx = findHeaderIndex(header, ['market rent', 'asking rent', 'market']);
    const statusIdx = findHeaderIndex(header, ['status', 'occupied', 'vacant', 'occupancy']);
    const unitTypeIdx = findHeaderIndex(header, ['type', 'unit type', 'layout', 'floor plan', '1br', '2br', '3br']);
    const bedsIdx = findHeaderIndex(header, ['beds', 'bed', 'bedrooms', 'br']);
    const bathsIdx = findHeaderIndex(header, ['baths', 'bath', 'ba']);
    const sqftIdx = findHeaderIndex(header, ['sqft', 'sq ft', 'sf', 'square feet']);

    const units = [];
    const unitMixMap = {};
    const rentValuesByType = {};
    const marketValuesByType = {};
    let occupiedCount = 0;
    let statusCount = 0;
    let blankRowStreak = 0;

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
        break;
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
        statusCount += 1;
        const s = status.toLowerCase();
        if (s.includes('occup')) occupiedCount += 1;
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
      total_units: units.length,
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

const parseT12FromRowMatrices = (rowMatrices) => {
  const matrices = Array.isArray(rowMatrices) ? rowMatrices : [];
  const entries = [];
  for (const matrix of matrices) {
    const rows = Array.isArray(matrix?.rows) ? matrix.rows : [];
    for (const row of rows) {
      if (!Array.isArray(row) || row.length === 0) continue;
      const labelIdx = row.findIndex((cell) => /[A-Za-z]/.test(String(cell || '')));
      if (labelIdx === -1) continue;
      const label = normalizeClassifierText(row[labelIdx]);
      if (!label) continue;
      let value = null;
      for (let i = 0; i < row.length; i += 1) {
        if (i === labelIdx) continue;
        const candidate = parseMoneyLike(row[i]);
        if (Number.isFinite(candidate)) {
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
    const normalizedSynonyms = synonyms.map((s) => normalizeClassifierText(s));
    for (const entry of entries) {
      if (normalizedSynonyms.some((term) => entry.label.includes(term))) {
        return entry;
      }
    }
    return null;
  };
  const sumValues = (synonyms) => {
    const normalizedSynonyms = synonyms.map((s) => normalizeClassifierText(s));
    const matches = entries.filter((entry) =>
      normalizedSynonyms.some((term) => entry.label.includes(term))
    );
    if (!matches.length) return null;
    return matches.reduce((sum, entry) => sum + entry.value, 0);
  };

  const grossRental = findValue(['gross rental income', 'rental income', 'gross rent']);
  const laundryIncomeTotal = sumValues(['laundry', 'laundry income']);
  const parkingIncomeTotal = sumValues(['parking', 'parking income']);
  const otherIncomeTotal = sumValues(['other income', 'misc income']);
  const vacancyLoss = findValue(['vacancy loss', 'vacancy']);
  const egiDirect = findValue(['effective gross income', 'egi']);
  const gprDirect = findValue(['gross potential rent', 'gpr', 'gpr rent']);
  const totalOpexDirect = findValue(['total operating expenses', 'operating expenses', 'total expenses', 'total opex', 'opex']);
  const noiDirect = findValue(['net operating income', 'noi']);

  const expenseSynonyms = [
    { key: 'property_taxes', synonyms: ['property taxes', 'taxes'] },
    { key: 'insurance', synonyms: ['insurance'] },
    { key: 'repairs_maintenance', synonyms: ['repairs', 'repairs maintenance', 'maintenance'] },
    { key: 'landscaping_snow', synonyms: ['landscaping', 'snow', 'landscaping snow'] },
    { key: 'utilities', synonyms: ['utilities', 'utilities water gas', 'water', 'gas'] },
    { key: 'management', synonyms: ['management', 'property management'] },
    { key: 'administrative', synonyms: ['administrative', 'admin'] },
    { key: 'garbage_misc', synonyms: ['garbage', 'misc', 'garbage misc'] },
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
  const hasMinimumT12Coverage =
    Number.isFinite(grossRental?.value) && expenseLinesFound >= 3;
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

  if (!hasMinimumT12Coverage) {
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
    has_gross_rental_income: Number.isFinite(grossRental?.value),
    has_minimum_t12_coverage: hasMinimumT12Coverage,
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

export function parseT12FromExtractedTables(tables) {
  const monthTokens = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const periodTokens = ['ytd', 'trailing 12', 't-12'];
  const metricTokens = ['noi', 'net operating income', 'total operating expenses', 'effective gross income'];
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
      const hasMetric = metricTokens.some((token) =>
        headerHasToken(headerRows, token, { word: token === 'noi' })
      );
      if (!hasPeriod || !hasMetric) return null;

      const score =
        monthTokens.filter((token) => headerHasToken(headerRows, token, { prefix: true })).length +
        periodTokens.filter((token) => headerHasToken(headerRows, token)).length +
        metricTokens.filter((token) => headerHasToken(headerRows, token, { word: token === 'noi' })).length;
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
        if (rule.labels.some((label) => cellText.includes(label))) {
          for (let j = i + 1; j < row.length; j += 1) {
            const value = numericFromCell(row[j]);
            if (value !== null) {
              found[rule.key] = value;
              break;
            }
          }
        }
      }
    }
  }

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
    function inferDocTypeFromText(text) {
      const norm = String(text || '').toUpperCase().replace(/\s+/g, ' ');
      const has = (terms) => terms.some((t) => norm.includes(t));
      const countMatches = (terms) => terms.filter((t) => norm.includes(t)).length;
      const hasDebtHeader = has(['TERM SHEET', 'REFI TERMS', 'LOAN TERMS']);
      const compactDebtSignals = countMatches(['LTV', 'RATE', 'AM', 'LOAN', 'EXIT CAP', 'IO']);
      const hasFinancingValuePattern =
        /\d+(?:\.\d+)?\s*%/.test(norm) ||
        /\$\s*[\d,]+(?:\.\d{2})?/.test(norm) ||
        /\b\d+\s*(?:YRS|YR|YEARS)\b/.test(norm);
      if (hasDebtHeader || (compactDebtSignals >= 3 && hasFinancingValuePattern)) return 'loan_term_sheet';
      if (has(['OUTSTANDING BALANCE', 'MONTHLY PAYMENT']) && has(['MORTGAGE', 'PRINCIPAL', 'AMORTIZATION', 'INTEREST RATE', 'MATURITY', 'DSCR'])) return 'mortgage_statement';
      if (has(['APPRAISAL', 'OPINION OF VALUE', 'AS-IS VALUE', 'CAP RATE', 'VALUATION'])) return 'appraisal';
      if (has(['PROPERTY TAX', 'ASSESSMENT', 'MUNICIPAL', 'ROLL NUMBER'])) return 'property_tax';
      if (has(['POLICY NUMBER', 'NAMED INSURED']) && countMatches(['COVERAGE', 'PREMIUM', 'EFFECTIVE DATE', 'EXPIRATION DATE', 'DEDUCTIBLE']) >= 2) return 'insurance_policy';
      if (has(['BEGINNING BALANCE', 'ENDING BALANCE']) && countMatches(['ACCOUNT NUMBER', 'DEPOSITS', 'WITHDRAWALS', 'DAILY BALANCE', 'STATEMENT PERIOD']) >= 2) return 'bank_statement';
      return 'supporting_documents_unclassified';
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
                const match = snippet.match(/\(?-?\$?\s*([\d,]+(?:\.\d{1,2})?)\)?/);
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

            const requiredValues = [
              gross_potential_rent,
              effective_gross_income,
              total_operating_expenses,
              net_operating_income,
            ];
            const presentCount = requiredValues.filter((value) => Number.isFinite(value)).length;

            if (presentCount < 4) {
              await supabaseAdmin
                .from('analysis_job_files')
                .update({
                  parse_status: 'failed',
                  parse_error: 'insufficient_t12_text_coverage',
                })
                .eq('id', file.id);
              return res.status(200).json({ ok: true, skipped: 1 });
            }

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
                  confidence: 0.9,
                  gross_potential_rent,
                  effective_gross_income,
                  total_operating_expenses,
                  net_operating_income,
                  income_lines: [],
                  expense_lines: [],
                  column_map: null,
                  parse_warnings,
                },
              },
            ]);

            if (artifactErr) {
              throw new Error(artifactErr.message || 'Failed to write t12 artifact');
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

            const sumColumn = (idx) => {
              if (idx === -1) return null;
              let total = 0;
              let count = 0;
              for (let r = 1; r < rows.length; r += 1) {
                const row = rows[r];
                if (!Array.isArray(row)) continue;
                const value = numericFromCell(row[idx]);
                if (!Number.isFinite(value)) continue;
                total += value;
                count += 1;
              }
              return count > 0 ? total : null;
            };

            let gross_potential_rent = sumColumn(gprIdx);
            let effective_gross_income = sumColumn(egiIdx);
            let total_operating_expenses = sumColumn(opexIdx);
            let net_operating_income = sumColumn(noiIdx);
            if (gross_potential_rent === null) gross_potential_rent = sumColumn(gprAliasIdx);
            if (effective_gross_income === null) effective_gross_income = sumColumn(egiAliasIdx);
            if (total_operating_expenses === null) total_operating_expenses = sumColumn(opexAliasIdx);
            if (net_operating_income === null) net_operating_income = sumColumn(noiAliasIdx);

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
              const sumRow = (row) => {
                let total = 0;
                let count = 0;
                for (let i = 1; i < row.length; i += 1) {
                  const value = numericFromCell(row[i]);
                  if (!Number.isFinite(value)) continue;
                  total += value;
                  count += 1;
                }
                return count > 0 ? total : null;
              };

              const applyRowMatch = (key, row) => sumRow(row);

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
                  const matched = synonyms.some((label) =>
                    labelText.includes(normalizeText(label))
                  );
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
            if (!hasMinimumT12Coverage) {
              gross_potential_rent = null;
              effective_gross_income = null;
              total_operating_expenses = null;
              net_operating_income = null;
              if (!parse_warnings.includes('insufficient_t12_coverage')) {
                parse_warnings.push('insufficient_t12_coverage');
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
            if (!hasMinimumT12Coverage) {
              found.gross_potential_rent = null;
              found.effective_gross_income = null;
              found.total_operating_expenses = null;
              found.net_operating_income = null;
              if (!parse_warnings.includes('insufficient_t12_coverage')) {
                parse_warnings.push('insufficient_t12_coverage');
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
              column_map: parsedT12.column_map,
              parse_warnings,
            };
          }

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

    if (effectiveDocType === 'mortgage_statement' || effectiveDocType === 'loan_term_sheet' || effectiveDocType === 'appraisal' || effectiveDocType === 'property_tax' || effectiveDocType === 'insurance_policy' || effectiveDocType === 'bank_statement') {
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

        const rawText = String(textArtifact?.payload?.excerpt || '');
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
          const loan_amount = (() => {
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
              ]);
              addCandidate(fallbackAmount);
            }
            return candidates.length > 0 ? Math.max(...candidates) : null;
          })();

          const compact_interest_rate = (() => {
            const m = rawText.match(/\b(?:interest\s*rate|note\s*rate|coupon\s*rate|rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i);
            return m ? Number(m[1]) : null;
          })();

          const compact_ltv = (() => {
            const beforeLabel = rawText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:loan\s*to\s*value|loan-to-value|ltv)\b/i);
            if (beforeLabel) return Number(beforeLabel[1]);
            const afterLabel = rawText.match(/\b(?:loan\s*to\s*value|loan-to-value|ltv)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i);
            return afterLabel ? Number(afterLabel[1]) : null;
          })();

          const compact_amort_years = (() => {
            const compactAmMatch = rawText.match(/\bAM\s*[:\-]?\s*(\d+)\s*(?:years?|yrs?|yr)\b/i);
            if (compactAmMatch) return parseInt(compactAmMatch[1], 10);
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

          const interest_rate =
            compact_interest_rate ??
            extractPercentNear(rawText, [
              'interest rate', 'rate:', 'rate', 'note rate', 'coupon rate',
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

          if (!loan_amount) parse_warnings.push('missing_loan_amount');
          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: 'text_excerpt',
            loan_amount,
            interest_rate,
            ltv,
            amort_years,
            refi_cap_rate,
            parse_warnings,
          };
        } else if (effectiveDocType === 'mortgage_statement') {
          const outstanding_balance = extractDollarNear(rawText, [
            'outstanding balance', 'principal balance', 'loan balance', 'outstanding loan',
            'remaining balance', 'balance outstanding',
          ]);
          const interest_rate = extractPercentNear(rawText, [
            'interest rate', 'rate:', 'annual rate', 'note rate',
          ]);
          const monthly_payment = extractDollarNear(rawText, [
            'monthly payment', 'regular payment', 'payment amount', 'principal and interest',
            'p&i payment', 'total payment',
          ]);
          const amort_years = extractYearsNear(rawText, [
            'amortization', 'amortization period', 'amort period',
          ]);
          const lender_name_match = rawText.match(/(?:lender|bank|mortgagee)[:\s]+([A-Za-z0-9 &.,'-]{3,60})/i);
          const lender_name = lender_name_match ? lender_name_match[1].trim() : null;

          if (!outstanding_balance) parse_warnings.push('missing_outstanding_balance');
          if (!interest_rate) parse_warnings.push('missing_interest_rate');
          if (!monthly_payment) parse_warnings.push('missing_monthly_payment');

          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: 'text_excerpt',
            lender_name,
            outstanding_balance,
            interest_rate,
            monthly_payment,
            amort_years,
            parse_warnings,
          };
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
        } else if (effectiveDocType === 'property_tax') {
          const annual_tax = extractDollarNear(rawText, [
            'property tax', 'annual tax', 'total tax', 'taxes owing',
            'tax amount', 'tax due', 'realty tax', 'municipal tax',
          ]);
          const assessed_value = extractDollarNear(rawText, [
            'assessed value', 'assessment value', 'property assessment',
            'phased-in assessment', 'current value assessment',
          ]);

          if (!annual_tax) parse_warnings.push('missing_annual_tax');

          payload = {
            file_id: fileRow.id,
            original_filename: fileRow.original_filename,
            method: 'text_excerpt',
            annual_tax,
            assessed_value,
            parse_warnings,
          };
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
