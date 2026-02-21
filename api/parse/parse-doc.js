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
    const raw = String(row[i] ?? '').replace(/[^0-9.\-]/g, '');
    if (!raw) continue;
    const value = Number(raw);
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
  const text = String(value ?? '').trim();
  if (!text) return null;
  const isParenNegative = /^\s*\(.*\)\s*$/.test(text);
  const cleaned = text.replace(/[(),$]/g, '').replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  let num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  if (isParenNegative && num > 0) {
    num = -num;
  }
  return num;
};

const detectDocTypeFromTabular = ({ headers, sampleRows }) => {
  const normalizedHeaders = Array.isArray(headers)
    ? headers.map((h) => normalizeClassifierText(h))
    : [];
  const rows = Array.isArray(sampleRows) ? sampleRows : [];

  const headerHasAny = (terms) =>
    normalizedHeaders.some((header) =>
      terms.some((term) => header.includes(normalizeClassifierText(term)))
    );

  const isNumericLike = (value) => Number.isFinite(numericFromCell(value));
  const unitLikeRegex = /^(?:[a-z]?\d{1,4}[a-z]?|\d{1,4}-\d{1,4}|[a-z]{1,3}-?\d{1,4})$/i;
  const sampleHasUnitLike = (() => {
    if (!rows.length) return false;
    let rowHits = 0;
    for (const row of rows) {
      const values = Array.isArray(row)
        ? row
        : row && typeof row === 'object'
        ? Object.values(row)
        : [];
      const hit = values.some((v) => unitLikeRegex.test(String(v || '').trim()));
      if (hit) rowHits += 1;
    }
    return rowHits / rows.length >= 0.2;
  })();
  const rowCountSignal = rows.length >= 8;

  const monthHeaderSignal = headerHasAny([
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
    'q1',
    'q2',
    'q3',
    'q4',
  ]) || normalizedHeaders.some((h) => /\b\d{4}[/-]\d{1,2}\b/.test(h));
  const lineItemNumericSignal = (() => {
    let qualifyingRows = 0;
    for (const row of rows) {
      const values = Array.isArray(row)
        ? row
        : row && typeof row === 'object'
        ? Object.values(row)
        : [];
      const textCount = values.filter((v) => {
        const t = String(v || '').trim();
        return t && !isNumericLike(t);
      }).length;
      const numericCount = values.filter((v) => isNumericLike(v)).length;
      if (textCount >= 1 && numericCount >= 4) {
        qualifyingRows += 1;
      }
    }
    return qualifyingRows >= 2;
  })();

  const rentRollSignals = {
    unit_identifier_header: headerHasAny(['unit', 'apt', 'suite', 'apartment', 'unitid']),
    rent_header: headerHasAny(['inplacerent', 'currentrent', 'actualrent', 'rent']),
    market_header: headerHasAny(['marketrent', 'askingrent', 'market']),
    status_header: headerHasAny(['status', 'occupied', 'vacant', 'occupancy']),
    unit_like_values: sampleHasUnitLike,
    row_count_signal: rowCountSignal,
  };
  const t12Signals = {
    finance_total_header: headerHasAny([
      'noi',
      'netoperatingincome',
      'effectivegrossincome',
      'egi',
      'grosspotentialrent',
      'gpr',
      'operatingexpenses',
      'opex',
    ]),
    expense_line_header: headerHasAny([
      'taxes',
      'insurance',
      'payroll',
      'repairs',
      'utilities',
      'management',
      'admin',
    ]),
    month_or_period_header: monthHeaderSignal,
    line_item_numeric_pattern: lineItemNumericSignal,
  };

  const rent_roll_score = Object.values(rentRollSignals).filter(Boolean).length;
  const t12_score = Object.values(t12Signals).filter(Boolean).length;

  let detected_doc_type = 'unknown';
  if (rent_roll_score >= 3 && rent_roll_score > t12_score) {
    detected_doc_type = 'rent_roll';
  } else if (t12_score >= 3 && t12_score > rent_roll_score) {
    detected_doc_type = 't12';
  }

  return {
    detected_doc_type,
    signals: { rent_roll: rentRollSignals, t12: t12Signals },
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
          const classifySheetName = classifyWorkbook.SheetNames?.[0];
          if (classifySheetName) {
            const classifySheet = classifyWorkbook.Sheets[classifySheetName];
            const classifyRows = XLSX.utils.sheet_to_json(classifySheet, { header: 1, blankrows: false }) || [];
            const classifyHeader = Array.isArray(classifyRows[0]) ? classifyRows[0] : [];
            const classifySampleRows = classifyRows.slice(1, 26);
            const classifier = detectDocTypeFromTabular({
              headers: classifyHeader,
              sampleRows: classifySampleRows,
            });
            detectedDocType = classifier.detected_doc_type;
            classifierSignals = classifier.signals;
            classifierScore = classifier.score;
            if (detectedDocType !== 'unknown') {
              effectiveDocType = detectedDocType;
            }
            if (detectedDocType !== 'unknown' && detectedDocType !== declaredDocType) {
              declaredTypeMismatch = true;
            }
          }
        }
      } catch (classifyError) {
        // Fail closed on classification: preserve declared type when classifier cannot run.
      }
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
          await supabaseAdmin
            .from('analysis_job_files')
            .update({
              parse_status: 'failed',
              parse_error: 'unsupported_file_type_for_structured_parsing',
            })
            .eq('id', file.id);
          return res.status(200).json({ ok: true, skipped: 1 });
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
          const firstSheetName = workbook.SheetNames?.[0];
          if (!firstSheetName) {
            throw new Error('No worksheet found');
          }

          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
          if (!rows || rows.length === 0) {
            throw new Error('Worksheet is empty');
          }

          const headerRow = rows[0] || [];
          const normalizedHeaders = headerRow.map(normalizeHeader);

          let unitTypeIdx = -1;
          let rentIdx = -1;
          let occupancyIdx = -1;
          let bedsIdx = -1;
          let bathsIdx = -1;
          let sqftIdx = -1;
          let marketRentIdx = -1;
          let unitIdx = -1;
          let statusIdx = -1;
          let units = [];
          let columnMap = null;
          let parseWarnings = [];

          if (isCsv) {
            const findCsvColumnIndex = (headers, synonyms) => {
              const tokens = synonyms.map((token) => normalizeHeader(token));
              for (let i = 0; i < headers.length; i += 1) {
                const header = headers[i];
                if (!header) continue;
                for (const token of tokens) {
                  if (header === token || header.includes(token)) {
                    return i;
                  }
                }
              }
              return -1;
            };

            const headerLabels = headerRow.map((cell) => String(cell || '').trim());
            const unitSynonyms = ['unit', 'unit number', 'unit #', 'apt', 'apartment', 'suite', 'unit id'];
            const unitTypeSynonyms = ['unit type', 'type', 'layout', 'floor plan', 'plan'];
            const bedsSynonyms = ['beds', 'bed', 'bedrooms', 'br'];
            const bathsSynonyms = ['baths', 'bath', 'bathrooms', 'ba'];
            const sqftSynonyms = ['sqft', 'sq ft', 'square feet', 'sf'];
            const inPlaceRentSynonyms = ['rent', 'in place rent', 'in-place rent', 'current rent', 'in_place_rent'];
            const marketRentSynonyms = ['market rent', 'market', 'market_rent'];
            const statusSynonyms = ['status', 'occupied', 'occupancy', 'lease status'];

            unitIdx = findCsvColumnIndex(normalizedHeaders, unitSynonyms);
            unitTypeIdx = findCsvColumnIndex(normalizedHeaders, unitTypeSynonyms);
            bedsIdx = findCsvColumnIndex(normalizedHeaders, bedsSynonyms);
            bathsIdx = findCsvColumnIndex(normalizedHeaders, bathsSynonyms);
            sqftIdx = findCsvColumnIndex(normalizedHeaders, sqftSynonyms);
            rentIdx = findCsvColumnIndex(normalizedHeaders, inPlaceRentSynonyms);
            marketRentIdx = findCsvColumnIndex(normalizedHeaders, marketRentSynonyms);
            statusIdx = findCsvColumnIndex(normalizedHeaders, statusSynonyms);

            columnMap = {
              unit: unitIdx !== -1 ? headerLabels[unitIdx] : null,
              unit_type: unitTypeIdx !== -1 ? headerLabels[unitTypeIdx] : null,
              beds: bedsIdx !== -1 ? headerLabels[bedsIdx] : null,
              baths: bathsIdx !== -1 ? headerLabels[bathsIdx] : null,
              sqft: sqftIdx !== -1 ? headerLabels[sqftIdx] : null,
              in_place_rent: rentIdx !== -1 ? headerLabels[rentIdx] : null,
              market_rent: marketRentIdx !== -1 ? headerLabels[marketRentIdx] : null,
              status: statusIdx !== -1 ? headerLabels[statusIdx] : null,
            };

            const requiredFields = ['unit', 'in_place_rent'];
            parseWarnings = requiredFields.filter((field) => !columnMap?.[field]).map((field) => `missing_${field}`);
          } else {
            const unitTypeHeaders = ['unit', 'unit type', 'type'];
            const rentHeaders = ['rent', 'current rent'];
            const occupancyHeaders = ['occupied', 'status', 'lease status'];

            const findHeaderIndex = (candidates) =>
              normalizedHeaders.findIndex((header) => candidates.includes(header));

            unitTypeIdx = findHeaderIndex(unitTypeHeaders);
            rentIdx = findHeaderIndex(rentHeaders);
            occupancyIdx = findHeaderIndex(occupancyHeaders);
          }

          const dataRows = rows.slice(1).filter(hasAnyValue);
          const totalUnits = dataRows.length;

          const unitMixMap = {};
          const rentValuesByType = {};
          for (const row of dataRows) {
            if (isCsv) {
              const rawUnit = unitIdx !== -1 ? String(row[unitIdx] || '').trim() : '';
              const rawUnitType = unitTypeIdx !== -1 ? String(row[unitTypeIdx] || '').trim() : '';
              const normUnitType = rawUnitType.toLowerCase();
              const rawBeds = bedsIdx !== -1 ? String(row[bedsIdx] || '').replace(/[^0-9.\-]/g, '') : '';
              const rawBaths = bathsIdx !== -1 ? String(row[bathsIdx] || '').replace(/[^0-9.\-]/g, '') : '';
              const rawSqft = sqftIdx !== -1 ? String(row[sqftIdx] || '').replace(/[^0-9.\-]/g, '') : '';
              const rawRent = rentIdx !== -1 ? String(row[rentIdx] || '').replace(/[^0-9.\-]/g, '') : '';
              const rawMarketRent =
                marketRentIdx !== -1 ? String(row[marketRentIdx] || '').replace(/[^0-9.\-]/g, '') : '';
              const rawStatus = statusIdx !== -1 ? String(row[statusIdx] || '').trim() : '';

              let beds = rawBeds ? Number(rawBeds) : null;
              const baths = rawBaths ? Number(rawBaths) : null;
              const sqft = rawSqft ? Number(rawSqft) : null;
              const inPlaceRent = rawRent ? Number(rawRent) : null;
              const marketRent = rawMarketRent ? Number(rawMarketRent) : null;
              if (!Number.isFinite(beds) && (normUnitType.includes('studio') || normUnitType.includes('bachelor'))) {
                beds = 0;
              }

              units.push({
                unit: rawUnit || null,
                unit_type: rawUnitType || null,
                beds: Number.isFinite(beds) ? beds : null,
                baths: Number.isFinite(baths) ? baths : null,
                sqft: Number.isFinite(sqft) ? sqft : null,
                in_place_rent: Number.isFinite(inPlaceRent) ? inPlaceRent : null,
                market_rent: Number.isFinite(marketRent) ? marketRent : null,
                status: rawStatus || null,
              });

              let unitTypeValue = null;
              if (Number.isFinite(beds) && beds === 0 && (normUnitType.includes('studio') || normUnitType.includes('bachelor'))) {
                unitTypeValue = 'Studio';
              } else if (Number.isFinite(beds)) {
                if (Number.isFinite(baths)) {
                  unitTypeValue = `${beds} Bed / ${baths} Bath`;
                } else {
                  unitTypeValue = `${beds} Bed`;
                }
              }

              if (unitTypeValue) {
                unitMixMap[unitTypeValue] = (unitMixMap[unitTypeValue] || 0) + 1;
                if (Number.isFinite(inPlaceRent)) {
                  if (!rentValuesByType[unitTypeValue]) {
                    rentValuesByType[unitTypeValue] = [];
                  }
                  rentValuesByType[unitTypeValue].push(inPlaceRent);
                }
              }
            } else {
              if (unitTypeIdx === -1) {
                break;
              }
              const unitType = String(row[unitTypeIdx] || '').trim();
              if (!unitType) {
                continue;
              }
              unitMixMap[unitType] = (unitMixMap[unitType] || 0) + 1;
              if (rentIdx !== -1) {
                const rawRent = String(row[rentIdx] || '').replace(/[^0-9.\-]/g, '');
                const rentValue = Number(rawRent);
                if (Number.isFinite(rentValue)) {
                  if (!rentValuesByType[unitType]) {
                    rentValuesByType[unitType] = [];
                  }
                  rentValuesByType[unitType].push(rentValue);
                }
              }
            }
          }

          const unitMix = Object.entries(unitMixMap).map(([unit_type, count]) => {
            const rentValues = rentValuesByType[unit_type] || [];
            const hasRent = rentValues.length > 0;
            const avgRent = hasRent
              ? Math.round(rentValues.reduce((sum, value) => sum + value, 0) / rentValues.length)
              : null;

            return hasRent
              ? { unit_type, count, current_rent: avgRent }
              : { unit_type, count };
          });

          let occupancy = null;
          if (!isCsv && occupancyIdx !== -1) {
            let occupiedCount = 0;
            let vacantCount = 0;
            let invalidValue = false;
            for (const row of dataRows) {
              const raw = String(row[occupancyIdx] || '').trim().toLowerCase();
              if (!raw) continue;
              if (raw === 'occupied') {
                occupiedCount += 1;
              } else if (raw === 'vacant') {
                vacantCount += 1;
              } else {
                invalidValue = true;
                break;
              }
            }
            if (!invalidValue && totalUnits > 0) {
              occupancy = occupiedCount / totalUnits;
            }
          }
          if (isCsv && statusIdx !== -1) {
            let occupiedCount = 0;
            for (const row of units) {
              const raw = String(row.status || '').trim().toLowerCase();
              if (!raw) continue;
              if (raw.includes('occup')) {
                occupiedCount += 1;
              } else if (raw.includes('vacant')) {
                continue;
              }
            }
            if (totalUnits > 0) {
              occupancy = occupiedCount / totalUnits;
            }
          }

          if (declaredTypeMismatch && !parseWarnings.includes('declared_doc_type_mismatch')) {
            parseWarnings.push('declared_doc_type_mismatch');
          }

          const hasFiniteInPlaceRent = isCsv
            ? units.some((row) => Number.isFinite(row?.in_place_rent))
            : Object.values(rentValuesByType).some(
                (values) => Array.isArray(values) && values.some((value) => Number.isFinite(value))
              );
          const hasUnitIdentifier = isCsv
            ? units.some((row) => String(row?.unit || '').trim() !== '')
            : normalizedHeaders.some((header) =>
                ['unit', 'apt', 'suite', 'apartment', 'unitid'].some((token) => header.includes(token))
              );
          const hasBedsOrStatus = isCsv
            ? units.some(
                (row) => Number.isFinite(row?.beds) || String(row?.status || '').trim() !== ''
              )
            : normalizedHeaders.some((header) =>
                ['bed', 'status', 'occup', 'vacant'].some((token) => header.includes(token))
              );
          const hasMarketRent = isCsv
            ? units.some((row) => Number.isFinite(row?.market_rent))
            : normalizedHeaders.some((header) =>
                ['market', 'askingrent', 'marketrent'].some((token) => header.includes(token))
              );
          const hasMinimumRentRoll =
            Number.isFinite(totalUnits) && totalUnits > 0 && hasFiniteInPlaceRent;
          const hasSecondarySignal = hasUnitIdentifier || hasBedsOrStatus || hasMarketRent;
          const rentRollConfidence = hasMinimumRentRoll && hasSecondarySignal ? 0.95 : 0.5;

          if (!(Number.isFinite(totalUnits) && totalUnits > 0) && !parseWarnings.includes('missing_total_units')) {
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
                ...(isCsv ? { units, column_map: columnMap } : {}),
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
          await supabaseAdmin
            .from('analysis_job_files')
            .update({
              parse_status: 'failed',
              parse_error: 'unsupported_file_type_for_structured_parsing',
            })
            .eq('id', file.id);
          return res.status(200).json({ ok: true, skipped: 1 });
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
          const firstSheetName = workbook.SheetNames?.[0];
          if (!firstSheetName) {
            throw new Error('No worksheet found');
          }

          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
          if (!rows || rows.length === 0) {
            throw new Error('Worksheet is empty');
          }

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

            const column_map = {
              gross_potential_rent: gprIdx >= 0 ? headerRow[gprIdx] : null,
              effective_gross_income: egiIdx >= 0 ? headerRow[egiIdx] : null,
              total_operating_expenses: opexIdx >= 0 ? headerRow[opexIdx] : null,
              net_operating_income: noiIdx >= 0 ? headerRow[noiIdx] : null,
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
            const found = {};
            for (const row of rows) {
              if (!Array.isArray(row)) continue;
              for (let i = 0; i < row.length; i += 1) {
                const cellText = normalizeCell(row[i]);
                if (!cellText) continue;
                for (const rule of labelRules) {
                  if (found[rule.key] !== undefined) {
                    continue;
                  }
                  if (rule.labels.includes(cellText)) {
                    const value = extractNumericRight(row, i);
                    if (value !== null) {
                      found[rule.key] = value;
                    }
                  }
                }
              }
            }

            const parse_warnings = [];
            if (!Number.isFinite(found.gross_potential_rent)) parse_warnings.push('missing_gross_potential_rent');
            if (!Number.isFinite(found.effective_gross_income)) parse_warnings.push('missing_effective_gross_income');
            if (!Number.isFinite(found.total_operating_expenses)) parse_warnings.push('missing_total_operating_expenses');
            if (!Number.isFinite(found.net_operating_income)) parse_warnings.push('missing_net_operating_income');
            if (declaredTypeMismatch) parse_warnings.push('declared_doc_type_mismatch');

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

    return res.status(400).json({ error: 'Unsupported doc_type' });
  } catch (err) {
    console.error('parse-doc error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
