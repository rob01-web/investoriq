import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

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

const isSpreadsheetMime = (mime) => String(mime || '').toLowerCase().includes('spreadsheetml');

const isXlsxName = (name) => String(name || '').toLowerCase().endsWith('.xlsx');

const hasAnyValue = (row) => row.some((cell) => String(cell || '').trim() !== '');

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
    const { jobId } = body || {};

    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: jobFiles, error: filesErr } = await supabaseAdmin
      .from('analysis_job_files')
      .select('id, job_id, user_id, bucket, object_path, original_filename, mime_type, doc_type')
      .eq('job_id', jobId)
      .eq('doc_type', 'rent_roll')
      .order('uploaded_at', { ascending: true });

    if (filesErr) {
      return res.status(500).json({ error: 'Failed to fetch job files', details: filesErr.message });
    }

    let parsedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const nowIso = new Date().toISOString();

    for (const file of jobFiles || []) {
      const eligible = isSpreadsheetMime(file.mime_type) || isXlsxName(file.original_filename);
      if (!eligible) {
        skippedCount += 1;
        continue;
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
        const workbook = XLSX.read(buffer, { type: 'buffer' });
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

        const unitTypeHeaders = ['unit', 'unit type', 'type'];
        const rentHeaders = ['rent', 'current rent'];
        const occupancyHeaders = ['occupied', 'status', 'lease status'];

        const findHeaderIndex = (candidates) =>
          normalizedHeaders.findIndex((header) => candidates.includes(header));

        const unitTypeIdx = findHeaderIndex(unitTypeHeaders);
        const rentIdx = findHeaderIndex(rentHeaders);
        const occupancyIdx = findHeaderIndex(occupancyHeaders);

        const dataRows = rows.slice(1).filter(hasAnyValue);
        const totalUnits = dataRows.length;

        const unitMixMap = {};
        const rentValuesByType = {};
        for (const row of dataRows) {
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
        if (occupancyIdx !== -1) {
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
              method: 'xlsx',
              confidence: 0.9,
              total_units: totalUnits,
              unit_mix: unitMix,
              occupancy,
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
  } catch (err) {
    console.error('parse-rent-roll-xlsx error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
