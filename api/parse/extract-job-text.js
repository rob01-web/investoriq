import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';
import { analyzeTables } from '../_lib/textractClient.js';
import { textractTablesToMatrix } from '../_lib/textractTablesToMatrix.js';

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
      .select('id, job_id, user_id, bucket, object_path, original_filename, mime_type, created_at')
      .eq('job_id', jobId)
      .order('uploaded_at', { ascending: true });

    if (filesErr) {
      return res.status(500).json({ error: 'Failed to fetch job files', details: filesErr.message });
    }

    const results = [];
    let pdfCount = 0;
    let extractedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const nowIso = new Date().toISOString();

    for (const file of jobFiles || []) {
      const mimeType = String(file.mime_type || '').toLowerCase();
      const isPdf = mimeType === 'application/pdf';
      const canTextract =
        mimeType === 'application/pdf' || mimeType === 'image/png' || mimeType === 'image/jpeg';

      if (!canTextract) {
        skippedCount += 1;
        results.push({
          file_id: file.id,
          original_filename: file.original_filename,
          status: 'skipped',
        });
        continue;
      }

      if (isPdf) {
        pdfCount += 1;
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

        try {
          const textractResponse = await analyzeTables({ bytes: buffer, mimeType });
          const { tables } = textractTablesToMatrix(textractResponse?.Blocks || []);
          let maxRows = 0;
          let maxCols = 0;
          for (const table of tables) {
            const rowCount = table.rows?.length || 0;
            if (rowCount > maxRows) maxRows = rowCount;
            for (const row of table.rows || []) {
              if (row.length > maxCols) maxCols = row.length;
            }
          }

          const tablesSummary = {
            tableCount: tables.length,
            maxRows,
            maxCols,
          };

          const tablesBucket = 'system';
          const tablesObjectPath = `analysis_jobs/${jobId}/document_tables_extracted/${file.id}/${safeTimestamp(
            nowIso
          )}.json`;

          const { error: tablesUploadErr } = await supabaseAdmin.storage
            .from(tablesBucket)
            .upload(
              tablesObjectPath,
              JSON.stringify({ tables }),
              { contentType: 'application/json', upsert: true }
            );

          if (tablesUploadErr) {
            throw new Error(tablesUploadErr.message || 'Failed to upload tables JSON');
          }

          const { error: tablesArtifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'document_tables_extracted',
              bucket: tablesBucket,
              object_path: tablesObjectPath,
              payload: {
                source_file_id: file.id,
                source_mime: mimeType,
                parser: 'aws_textract_tables',
                tables_summary: tablesSummary,
                timestamp: nowIso,
              },
            },
          ]);
          if (tablesArtifactErr) {
            throw new Error(tablesArtifactErr.message || 'Failed to write tables artifact');
          }
        } catch (err) {
          const errorMessage = err?.message || 'Unknown error';
          const { error: textractEventErr } = await supabaseAdmin.from('analysis_artifacts').insert([
            {
              job_id: jobId,
              user_id: file.user_id || null,
              type: 'worker_event',
              bucket: 'internal',
              object_path: `analysis_jobs/${jobId}/worker_event/textract_failed/${safeTimestamp(nowIso)}.json`,
              payload: {
                event: 'textract_failed',
                source_file_id: file.id,
                source_mime: mimeType,
                error_message: errorMessage,
                timestamp: nowIso,
              },
            },
          ]);
          if (textractEventErr) {
            throw new Error(textractEventErr.message || 'Failed to write Textract error artifact');
          }
        }

        if (!isPdf) {
          results.push({
            file_id: file.id,
            original_filename: file.original_filename,
            status: 'tables_extracted',
          });
          continue;
        }

        const parsed = await pdfParse(buffer);
        const text = String(parsed?.text || '').trim();
        const excerpt = text.slice(0, 1200).trim();
        const pages = parsed?.numpages || parsed?.numPages || null;
        const chars = text.length;

        const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
          {
            job_id: jobId,
            user_id: file.user_id || null,
            type: 'document_text_extracted',
            bucket: 'internal',
            object_path: `analysis_jobs/${jobId}/document_text_extracted/${file.id}/${safeTimestamp(nowIso)}.json`,
            payload: {
              file_id: file.id,
              original_filename: file.original_filename,
              bucket: file.bucket,
              object_path: file.object_path,
              pages,
              chars,
              excerpt,
            },
          },
        ]);

        if (artifactErr) {
          throw new Error(artifactErr.message || 'Failed to write artifact');
        }

        await supabaseAdmin
          .from('analysis_job_files')
          .update({ parse_status: 'extracted', parse_error: null })
          .eq('id', file.id);

        extractedCount += 1;
        results.push({
          file_id: file.id,
          original_filename: file.original_filename,
          status: 'extracted',
          pages,
          chars,
        });
      } catch (err) {
        const errorMessage = err?.message || 'Unknown error';

        await supabaseAdmin.from('analysis_artifacts').insert([
          {
            job_id: jobId,
            user_id: file.user_id || null,
            type: 'document_parse_error',
            bucket: 'internal',
            object_path: `analysis_jobs/${jobId}/document_parse_error/${file.id}/${safeTimestamp(nowIso)}.json`,
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
        results.push({
          file_id: file.id,
          original_filename: file.original_filename,
          status: 'failed',
          error: errorMessage,
        });
      }
    }

    return res.status(200).json({
      ok: true,
      jobId,
      totals: {
        files: jobFiles?.length || 0,
        pdf: pdfCount,
        extracted: extractedCount,
        failed: failedCount,
        skipped: skippedCount,
      },
      results,
    });
  } catch (err) {
    console.error('extract-job-text error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
