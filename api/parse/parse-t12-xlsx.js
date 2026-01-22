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

const normalizeCell = (value) => String(value || '').trim().toLowerCase();

const isSpreadsheetMime = (mime) => String(mime || '').toLowerCase().includes('spreadsheetml');

const isXlsxName = (name) => String(name || '').toLowerCase().endsWith('.xlsx');

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
      .eq('doc_type', 't12')
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

        const payload = {
          file_id: file.id,
          original_filename: file.original_filename,
          method: 'xlsx',
          confidence: 0.9,
          ...found,
        };

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
    console.error('parse-t12-xlsx error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
