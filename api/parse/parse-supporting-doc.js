import { createClient } from '@supabase/supabase-js';
import { analyzeTables } from '../_lib/textractClient.js';

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

const isPdfOrImage = (mime) => {
  const normalized = String(mime || '').toLowerCase();
  return (
    normalized.includes('application/pdf') ||
    normalized.includes('image/png') ||
    normalized.includes('image/jpeg')
  );
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
    const { job_id: jobId, file_id: fileId } = body || {};

    if (!jobId || !fileId) {
      return res.status(400).json({ error: 'Missing job_id or file_id' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: fileRow, error: fileErr } = await supabaseAdmin
      .from('analysis_job_files')
      .select('id, job_id, user_id, original_filename, mime_type, bytes, bucket, object_path, doc_type')
      .eq('id', fileId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (fileErr || !fileRow?.id) {
      return res.status(200).json({ ok: true, warning: 'file_not_found' });
    }

    let extraction = { ok: false, method: 'none' };
    let warning = null;
    const nowIso = new Date().toISOString();

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
  } catch (err) {
    console.error('parse-supporting-doc error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
