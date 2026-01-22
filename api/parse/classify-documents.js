import { createClient } from '@supabase/supabase-js';

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

const normalize = (value) => String(value || '').toLowerCase();

const countMatches = (text, keywords) => {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) count += 1;
  }
  return count;
};

const classifyDocType = (combinedText) => {
  const text = normalize(combinedText);

  const rentRollKeywords = [
    'rent roll',
    'rentroll',
    'rr',
    'unit mix',
    'unit type',
    'schedule of rents',
  ];
  const t12Keywords = [
    't12',
    'trailing 12',
    'operating statement',
    'income statement',
    'profit and loss',
    'p&l',
    'noi',
  ];
  const offeringKeywords = [
    'offering memorandum',
    'offering memo',
    'cim',
    'confidential information memorandum',
    'investment summary',
    'executive summary',
  ];
  const debtKeywords = [
    'term sheet',
    'commitment letter',
    'loan terms',
    'interest rate',
    'amortization',
    'maturity',
    'lender',
  ];
  const capexKeywords = [
    'capex',
    'scope of work',
    'sow',
    'renovation budget',
    'contractor bid',
    'estimate',
  ];

  const rentRollCount = countMatches(text, rentRollKeywords);
  const t12Count = countMatches(text, t12Keywords);
  const offeringCount = countMatches(text, offeringKeywords);
  const debtCount = countMatches(text, debtKeywords);
  const capexCount = countMatches(text, capexKeywords);

  const candidates = [
    { type: 'rent_roll', count: rentRollCount },
    { type: 't12', count: t12Count },
    { type: 'offering_memo', count: offeringCount },
    { type: 'debt_term_sheet', count: debtCount },
    { type: 'capex_scope', count: capexCount },
  ];

  candidates.sort((a, b) => b.count - a.count);
  const top = candidates[0];

  if (!top || top.count === 0) {
    return { docType: 'other', confidence: 0.4 };
  }

  if (top.count >= 2) {
    return { docType: top.type, confidence: 0.9 };
  }

  return { docType: top.type, confidence: 0.7 };
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
      .select('id, user_id, original_filename, mime_type, bucket, object_path, doc_type, parse_status')
      .eq('job_id', jobId)
      .order('uploaded_at', { ascending: true });

    if (filesErr) {
      return res.status(500).json({ error: 'Failed to fetch job files', details: filesErr.message });
    }

    const results = [];
    let classifiedCount = 0;
    let skippedCount = 0;
    const nowIso = new Date().toISOString();

    for (const file of jobFiles || []) {
      if (file.doc_type && String(file.doc_type).trim() !== '') {
        skippedCount += 1;
        results.push({
          file_id: file.id,
          original_filename: file.original_filename,
          doc_type: file.doc_type,
          confidence: null,
          status: 'skipped',
        });
        continue;
      }

      let excerptText = '';
      const { data: excerptRow } = await supabaseAdmin
        .from('analysis_artifacts')
        .select('payload')
        .eq('type', 'document_text_extracted')
        .eq('payload->>file_id', String(file.id))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (excerptRow?.payload?.excerpt) {
        excerptText = String(excerptRow.payload.excerpt);
      }

      const combinedText = `${file.original_filename || ''} ${excerptText}`;
      const { docType, confidence } = classifyDocType(combinedText);

      const { error: updateErr } = await supabaseAdmin
        .from('analysis_job_files')
        .update({ doc_type: docType })
        .eq('id', file.id);

      if (updateErr) {
        return res.status(500).json({ error: 'Failed to update document type', details: updateErr.message });
      }

      const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: jobId,
          user_id: file.user_id || null,
          type: 'document_classified',
          bucket: 'system',
          object_path: `analysis_jobs/${jobId}/document_classified/${file.id}/${safeTimestamp(nowIso)}.json`,
          payload: {
            file_id: file.id,
            original_filename: file.original_filename,
            doc_type: docType,
            confidence,
            method: 'rules',
          },
        },
      ]);

      if (artifactErr) {
        return res.status(500).json({ error: 'Failed to write classification artifact', details: artifactErr.message });
      }

      classifiedCount += 1;
      results.push({
        file_id: file.id,
        original_filename: file.original_filename,
        doc_type: docType,
        confidence,
        status: 'classified',
      });
    }

    return res.status(200).json({
      ok: true,
      jobId,
      classified: classifiedCount,
      skipped: skippedCount,
      results,
    });
  } catch (err) {
    console.error('classify-documents error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
