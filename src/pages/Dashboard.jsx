import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, AlertCircle, FileDown } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import AnalysisScopePreview from '../components/AnalysisScopePreview';

export default function Dashboard() {
  const { toast } = useToast();
  const { profile, fetchProfile } = useAuth();
  const [propertyName, setPropertyName] = useState('');
  const propertyNameRef = useRef('');
  const [jobId, setJobId] = useState(null);
  const [inProgressJobs, setInProgressJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackLocked, setAckLocked] = useState(false);
  const [ackAcceptedAtLocal, setAckAcceptedAtLocal] = useState(null);
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [jobEvents, setJobEvents] = useState({});
  const [latestFailedJob, setLatestFailedJob] = useState(null);
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [rentRollCoverage, setRentRollCoverage] = useState(null);
  const hasBlockingJob = inProgressJobs.some((job) =>
    [
      'queued',
      'validating_inputs',
      'extracting',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
    ].includes(job.status)
  );

  const fetchReports = async () => {
    if (!profile?.id) return;
    try {
      setReportsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchJobEvents = async (jobIds) => {
    if (!jobIds || jobIds.length === 0) {
      setJobEvents({});
      return;
    }

    const eventTypes = [
      'missing_structured_financials',
      'missing_required_documents',
      'textract_failed',
      'rent_roll_fallback_failed',
      't12_fallback_failed',
    ];

    const { data, error } = await supabase
      .from('analysis_artifacts')
      .select('id, job_id, payload, created_at')
      .eq('type', 'worker_event')
      .in('job_id', jobIds)
      .in('payload->>event', eventTypes)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch job events:', error);
      return;
    }

    const priority = {
      missing_required_documents: 0,
      missing_structured_financials: 1,
      textract_failed: 2,
      rent_roll_fallback_failed: 3,
      t12_fallback_failed: 4,
    };

    const nextEvents = {};
    for (const row of data || []) {
      const eventName = row?.payload?.event;
      if (!eventName) continue;
      const current = nextEvents[row.job_id];
      if (!current || priority[eventName] < priority[current.payload?.event]) {
        nextEvents[row.job_id] = row;
      }
    }

    setJobEvents(nextEvents);
  };

  const fetchInProgressJobs = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('id, property_name, status, created_at')
      .eq('user_id', profile.id)
    .in('status', [
      'queued',
      'validating_inputs',
      'extracting',
      'needs_documents',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
    ])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch in-progress jobs:', error);
      return;
    }

    const rows = data || [];
    setInProgressJobs(rows);
    await fetchJobEvents(rows.map((job) => job.id));
  };

  const fetchLatestFailedJob = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('id, property_name, status, created_at, error_message, error_code')
      .eq('user_id', profile.id)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch failed job:', error);
      return;
    }

    setLatestFailedJob(data || null);
  };

  const fetchRentRollCoverage = async (targetJobId) => {
    if (!targetJobId) return;

    const { data, error } = await supabase
      .from('analysis_artifacts')
      .select('payload, created_at')
      .eq('job_id', targetJobId)
      .eq('type', 'rent_roll_parsed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.payload) {
      setRentRollCoverage(null);
      return;
    }

    const payload = data.payload || {};
    let provided = null;
    if (Array.isArray(payload.units)) {
      provided = payload.units.length;
    } else if (typeof payload.unit_count === 'number') {
      provided = payload.unit_count;
    } else if (typeof payload.total_units_provided === 'number') {
      provided = payload.total_units_provided;
    }

    let total = null;
    if (typeof payload.total_units === 'number') {
      total = payload.total_units;
    } else if (typeof payload.totalUnits === 'number') {
      total = payload.totalUnits;
    } else if (typeof payload.property_total_units === 'number') {
      total = payload.property_total_units;
    }

    const percent =
      provided != null && total != null && total > 0
        ? Math.round((provided / total) * 100)
        : null;

    setRentRollCoverage({ provided, total, percent });
  };

  useEffect(() => {
  const syncEverything = async () => {
    await fetchProfile(profile.id);
    await fetchReports();
    await fetchInProgressJobs();
    await fetchLatestFailedJob();

        // Reuse the most recent in-progress job (supports walk-away / return later)
    if (!jobId) {
      const { data: existingJob, error } = await supabase
        .from('analysis_jobs')
        .select('id, status, created_at, property_name')
        .eq('user_id', profile.id)
        .in('status', [
          'queued',
          'validating_inputs',
          'extracting',
          'needs_documents',
          'underwriting',
          'scoring',
          'rendering',
          'pdf_generating',
          'publishing',
        ])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && existingJob?.id) {
        setJobId(existingJob.id);

        // Hydrate the input only if the user has not typed anything yet
        if (!propertyName.trim() && existingJob.property_name) {
          setPropertyName(existingJob.property_name);
        }
      }
    }
  };

  if (profile?.id) {
    syncEverything();
      
      // ELITE PERFORMANCE: Automatically check for newly purchased credits every 2 seconds
      // This ensures if they just came from checkout, the credit appears without a refresh.
      const fastInterval = setInterval(() => fetchProfile(profile.id), 2000);
      const timeout = setTimeout(() => clearInterval(fastInterval), 10000);

      return () => {
        clearInterval(fastInterval);
        clearTimeout(timeout);
      };
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!jobId) {
      setRentRollCoverage(null);
      return;
    }
    fetchRentRollCoverage(jobId);
  }, [jobId]);

  // REAL-TIME LISTENER: Watch for status changes (Queued -> Underwriting -> Success)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analysis_jobs',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          // Whenever a job changes status in the DB, refresh the UI list
          fetchInProgressJobs();
          fetchReports();
          fetchLatestFailedJob();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    setScopeConfirmed(false);
  }, [
    `${uploadedFiles
      .map((file) => file.docType)
      .sort()
      .join('|')}::${uploadedFiles.length}`,
  ]);

  const removeUploadedFile = (index) => {
  setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
};

  // Immutable policy identity (must match server constants)
const POLICY_KEY = 'analysis_disclosures';
const POLICY_VERSION = 'v2026-01-14';

const credits = Number(profile?.report_credits ?? 0);
const rentRollFiles = uploadedFiles.filter((item) => item.docType === 'rent_roll');
const t12Files = uploadedFiles.filter((item) => item.docType === 't12');
const otherFiles = uploadedFiles.filter((item) => item.docType === 'other');
const hasRequiredUploads = rentRollFiles.length > 0 && t12Files.length > 0;
const hasRentRoll = rentRollFiles.length > 0;
const hasT12 = t12Files.length > 0;
const hasPurchase = uploadedFiles.some((item) =>
  ['purchase_agreement', 'loi', 'offering_memorandum'].includes(item.docType)
);
const hasCapex = uploadedFiles.some((item) =>
  ['capex_budget', 'renovation_scope', 'contractor_bid'].includes(item.docType)
);
const hasDebt = uploadedFiles.some((item) =>
  ['debt_term_sheet', 'lender_quote'].includes(item.docType)
);
const hasMarket = uploadedFiles.some((item) =>
  ['market_study', 'broker_package', 'appraisal', 'engineering_report', 'environmental_report'].includes(
    item.docType
  )
);

  const policyText =
    'InvestorIQ produces document-based underwriting only, does not provide investment or appraisal advice, and will disclose any missing or degraded inputs in the final report. Analysis outputs are generated strictly from the documents provided. No assumptions or gap-filling are performed.';

  const computePolicyTextHash = async () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(policyText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const startCheckout = async () => {
  try {
    if (!profile?.id) {
      toast({
        title: 'Please sign in',
        description: 'You must be signed in to purchase credits.',
        variant: 'destructive',
      });
      return;
    }

    const origin = window.location.origin;

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planKey: 'single',
        productType: 'singleReport',
        userId: profile.id,
        userEmail: profile.email,
        successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/pricing?canceled=1`,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.url) {
      toast({
        title: 'Checkout could not be started',
        description: data?.error || 'Please try again.',
        variant: 'destructive',
      });
      console.error('create-checkout-session failed:', res.status, data);
      return;
    }

    window.location.href = data.url;
  } catch (err) {
    console.error(err);
    toast({
      title: 'Checkout could not be started',
      description: 'Please try again.',
      variant: 'destructive',
    });
  }
};
  
    const recordLegalAcceptance = async () => {
    if (!profile?.id) return false;

    const policyTextHash = await computePolicyTextHash();

    try {
      const res = await fetch('/api/legal-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
          userId: profile.id,
          policyTextHash,
        }),
      });

        if (!res.ok) {
        console.error('Legal acceptance API failed:', await res.text());
        return { ok: false };
      }

      const data = await res.json().catch(() => ({}));

      // If the API returns the authoritative server timestamp, use it.
      const acceptedAt = data?.accepted_at || data?.acceptedAt || null;

      return { ok: true, acceptedAt };
    } catch (err) {
      console.error('Legal acceptance error:', err);
      return false;
    }
  };

    const handleUploadSuccess = async () => {
    if (!profile?.id) return;

    // Create a job the moment the user begins uploading (async underwriting anchor)
    if (!jobId) {
      const { data, error } = await supabase
        .from('analysis_jobs')
        .insert({
                    user_id: profile.id,
          property_name: (propertyNameRef.current || propertyName).trim() || 'Untitled Property',
          status: 'queued',
          prompt_version: 'v2026-01-17',
          parser_version: 'v1',
          template_version: 'v2026-01-14',
          scoring_version: 'v1',
        })
        .select('id')
        .single();

      if (error || !data?.id) {
        console.error('Failed to create analysis job:', error);
        toast({
          title: 'Unable to start analysis job',
          description: 'We could not initialize your underwriting run. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setJobId(data.id);
    }

    toast({
      title: 'Upload Successful',
      description: 'Your documents have been received and queued for processing.',
    });

    await fetchProfile(profile.id);
  };

    const handleUpload = async (e, slotDocType) => {
    const files = Array.from(e.target.files || []);

  // allow selecting the same file again later
  e.target.value = '';

  // --- File type enforcement (allowlist + hard block) ---
  const allowedExt = new Set([
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'csv',
    'ppt',
    'pptx',
    'jpg',
    'jpeg',
    'png',
    'txt',
  ]);

  // Block executables / scripts even if someone bypasses the picker
  const blockedExt = new Set([
    'exe',
    'msi',
    'bat',
    'cmd',
    'com',
    'scr',
    'pif',
    'cpl',
    'jar',
    'js',
    'jse',
    'vbs',
    'vbe',
    'ps1',
    'psm1',
    'psd1',
    'sh',
    'bash',
    'zsh',
    'py',
    'rb',
    'php',
    'pl',
    'dll',
    'sys',
    'lnk',
  ]);

  const getExt = (name) => {
    const base = (name || '').trim().toLowerCase();
    const lastDot = base.lastIndexOf('.');
    if (lastDot === -1) return '';
    return base.slice(lastDot + 1);
  };

  const blocked = [];
  const invalid = [];

  for (const f of files) {
    const ext = getExt(f.name);

    if (!ext) {
      invalid.push(f.name || '(unnamed file)');
      continue;
    }

    if (blockedExt.has(ext)) {
      blocked.push(f.name);
      continue;
    }

    if (!allowedExt.has(ext)) {
      invalid.push(f.name);
      continue;
    }
  }

  if (blocked.length > 0) {
    toast({
      title: 'Blocked file type',
      description: `For security reasons, these file types are not allowed: ${blocked.join(', ')}`,
      variant: 'destructive',
    });
    return;
  }

  if (invalid.length > 0) {
    toast({
      title: 'Unsupported file type',
      description:
        'Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, JPG, JPEG, PNG.',
      variant: 'destructive',
    });
    return;
  }

  const oversized = files.some((f) => f.size > 10 * 1024 * 1024);
  if (oversized) {
    toast({
      title: 'File Too Large',
      description: 'Each file must be under 10 MB.',
      variant: 'destructive',
    });
    return;
  }

  if (!slotDocType) {
    toast({
      title: 'Upload blocked',
      description: 'Select a document slot before uploading files.',
      variant: 'destructive',
    });
    return;
  }

    // Use a local job id to avoid React state timing issues
let effectiveJobId = jobId;

// Create a job the moment the user begins uploading (async underwriting anchor)
if (profile?.id && !effectiveJobId) {
  const { data, error } = await supabase
    .from('analysis_jobs')
    .insert({
      user_id: profile.id,
      property_name: (propertyNameRef.current || propertyName).trim() || 'Untitled Property',
      status: 'queued',
      prompt_version: 'v2026-01-17',
      parser_version: 'v1',
      template_version: 'v2026-01-14',
      scoring_version: 'v1',
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    console.error('Failed to create analysis job:', error);
    toast({
      title: 'Unable to start analysis job',
      description: 'We could not initialize your underwriting run. Please try again.',
      variant: 'destructive',
    });
    return;
  }

  effectiveJobId = data.id;
  setJobId(effectiveJobId);
}

// Upload files to Supabase Storage under this underwriting job
if (!profile?.id || !effectiveJobId) {
  toast({
    title: 'Upload blocked',
    description: 'Unable to initialize your underwriting run. Please try again.',
    variant: 'destructive',
  });
  return;
}

  const bucket = 'staged_uploads';

  for (const file of files) {
  // Prevent path injection
  const safeName = String(file.name || 'file').replaceAll('/', '_');
  const objectPath = `staged/${profile.id}/${effectiveJobId}/${safeName}`;

    const { error: uploadErr } = await supabase.storage
  .from(bucket)
  .upload(objectPath, file, {
    contentType: file.type || 'application/octet-stream',
    cacheControl: '3600',
    upsert: true, // allow safe overwrite of staged files
  });

    if (uploadErr) {
      console.error('Staged upload failed:', uploadErr);
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${safeName}. Please try again.`,
        variant: 'destructive',
      });
      return;
    }

        const { error: rowErr } = await supabase
      .from('analysis_job_files')
      .insert({
        job_id: effectiveJobId,
        user_id: profile.id,
        bucket,
        object_path: objectPath,
        original_filename: safeName,
        mime_type: file.type || 'application/octet-stream',
        bytes: file.size,
        doc_type: slotDocType,
        parse_status: 'pending',
      });

    if (rowErr) {
      console.error('analysis_job_files insert failed:', rowErr);
      toast({
        title: 'Upload recorded incompletely',
        description: `File uploaded but could not be linked to your job: ${safeName}.`,
        variant: 'destructive',
      });
      return;
    }
  }

  const { error: requeueErr } = await supabase
    .from('analysis_jobs')
    .update({ status: 'queued' })
    .eq('id', effectiveJobId)
    .in('status', ['needs_documents', 'extracting']);

  if (requeueErr) {
    console.error('Failed to requeue job after upload:', requeueErr);
    toast({
      title: 'Uploads received',
      description: 'Uploads received, but processing could not resume yet.',
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Uploads received',
      description: 'Processing resumed.',
    });
  }

  // Append new files instead of overwriting existing ones
  setUploadedFiles((prev) => {
    const nextEntries = files.map((file) => ({ file, docType: slotDocType }));
    const combined = [...prev, ...nextEntries];

    // Prevent accidental duplicates (same name + size)
    const seen = new Set();
    return combined.filter((f) => {
      const key = `${f.file?.name}__${f.file?.size}__${f.docType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  // IMPORTANT: do not force re-acknowledgement on each upload.
};

  const handleAnalyze = async () => {
    if (!propertyName.trim()) {
      toast({
        title: 'Property name required',
        description: 'Enter a property name before generating your report.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasRequiredUploads) {
      toast({
        title: 'Document Required',
        description: 'Rent Roll and T12/Operating Statement are required to start underwriting.',
        variant: 'destructive',
      });
      return;
    }

    // ELITE UX: Trigger the "Working" state immediately
    setLoading(true); 
    
    // Deterministic credit check (do NOT rely on React state here)
const { data: creditsRow, error: creditsErr } = await supabase
  .from('profiles')
  .select('report_credits')
  .eq('id', profile.id)
  .maybeSingle();

if (creditsErr) {
  console.error('Failed to verify credits:', creditsErr);
  setLoading(false);
  toast({
    title: 'Unable to verify credits',
    description: 'Please refresh and try again.',
    variant: 'destructive',
  });
  return;
}

const verifiedCredits = Number(creditsRow?.report_credits ?? 0);

if (verifiedCredits < 1) {
  setLoading(false);
  toast({
    title: 'Insufficient Credits',
    description: 'Your balance is 0. Please ensure your purchase has processed.',
    variant: 'destructive',
  });
  return;
}

    try {
      if (!jobId) {
        toast({
          title: 'Analysis not initialized',
          description: 'Rent Roll and T12/Operating Statement are required to start underwriting.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // ELITE SYNC: This final update pushes the actual name and triggers the backend credit deduction
      const { error: statusErr } = await supabase
        .from('analysis_jobs')
        .update({
          status: 'validating_inputs',
          started_at: new Date().toISOString(),
          // This grabs WHATEVER you typed (e.g., Forest City Manor)
          property_name: propertyName.trim() || 'Untitled Property', 
        })
        .eq('id', jobId)
        .eq('user_id', profile.id);

      if (statusErr) {
        console.error('Failed to advance job status:', statusErr);
        toast({
          title: 'Unable to start analysis',
          description: 'Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Report queued',
        description: 'Your underwriting report has started. You may safely close this page and return later.',
      });

      // REFRESH DATA: This forces the name to update AND the credit to drop from 4 to 3
      await Promise.all([
        fetchInProgressJobs(),
        fetchReports(),
        fetchProfile(profile.id) 
      ]);

    } catch (error) {
      console.error('Queue Error FULL:', error, error?.stack);
      toast({
        title: 'Unable to queue report',
        description: error.message || 'An error occurred while starting the underwriting run.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

    return (
    <>
      <Helmet>
        <title>InvestorIQ Dashboard - Property IQ Reports</title>
        <meta
          name="description"
          content="Upload property documents and generate institutional-grade Property IQ Reports with InvestorIQ."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col">
        <div className="max-w-6xl w-full mx-auto flex-grow">
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-10"
          >
            <div>
              <h1 className="text-4xl font-extrabold text-[#0F172A]">
                Welcome, {profile?.full_name || 'Investor'}
              </h1>
              <p className="text-[#334155] mt-2 font-semibold">
                Upload your documents to generate your{' '}
                <span className="text-[#1F8A8A] font-semibold">Property IQ Report</span>.
              </p>
            </div>

            <div className="text-right mt-4 sm:mt-0">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Report Credits
                </div>
                <div className="mt-2 text-3xl font-extrabold text-[#0F172A]">
                  {profile ? credits : '...'}
                </div>
                {credits === 0 && (
                  <p className="mt-2 text-sm text-[#334155]">
                    Buy credits to unlock uploads and generate your report.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/pricing';
                  }}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-[#0F172A] bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1326]"
                >
                  Buy Credits
                </button>
              </div>
            </div>
          </motion.div>

          {/* UPLOAD SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-10"
            id="upload-section"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Property Details</h2>

<div className="mb-4">
  <label className="block text-sm font-semibold text-[#0F172A] mb-1">
  Property Name <span className="text-red-700">*</span>
</label>

  <input
    type="text"
    value={propertyName}
    onChange={async (e) => {
      const next = e.target.value;
      propertyNameRef.current = next;
      setPropertyName(next);

      // If a job already exists, persist the name immediately
      if (profile?.id && jobId) {
        const { error } = await supabase
          .from('analysis_jobs')
          .update({ property_name: next.trim() || 'Untitled Property' })
          .eq('id', jobId)
          .eq('user_id', profile.id);

        if (error) {
          console.error('Failed to update property name:', error);
        }
      }
    }}
    placeholder="e.g. 123 Main Street Apartments"
    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F8A8A]/30"
  />
</div>

<p className="text-[#334155] leading-relaxed font-medium">
  Upload <strong>PDFs, spreadsheets, or property photos.</strong>{' '}
  <span className="text-[#1F8A8A] font-semibold">Spreadsheets power structured financial metrics.</span>{' '}
  Other documents are extracted for reference. (10 MB max per file)
</p>
                <p className="text-[#334155] text-sm mt-2">
                  Works for both <strong>off-market</strong> and MLS properties.
                </p>
              </div>

              <div className="w-full">
                {!propertyName.trim() && (
                  <div className="mb-2 text-xs font-semibold text-slate-600">
                    Enter a property name to enable uploads.
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Required</div>
                    <div className="mt-1 text-sm font-semibold text-[#0F172A]">Rent Roll</div>
                    <button
                      type="button"
                      disabled={!propertyName.trim()}
                      onClick={async () => {
                        if (!profile || credits <= 0) {
                          window.location.href = '/pricing';
                          return;
                        }

                        if (!propertyName.trim()) {
                          toast({
                            title: 'Property name required',
                            description: 'Enter a property name before uploading documents.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        if (!acknowledged) {
                          toast({
                            title: 'Acknowledgement required',
                            description:
                              'Please acknowledge the document-based limitations before uploading files.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        document.getElementById('rentRollInput')?.click();
                      }}
                      className={`mt-auto inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold
                        ${
                          propertyName.trim()
                            ? 'border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326]'
                            : 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload Rent Roll
                    </button>
                    <div className="mt-3 space-y-2">
                      {rentRollFiles.length === 0 ? (
                        <div className="text-xs text-slate-500">No files uploaded.</div>
                      ) : (
                        rentRollFiles.map((entry, index) => (
                          <div
                            key={`${entry.file.name}-${index}`}
                            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-[#0F172A]">
                                {entry.file.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {entry.file.size < 1024 * 1024
                                  ? `${(entry.file.size / 1024).toFixed(2)} KB`
                                  : `${(entry.file.size / 1024 / 1024).toFixed(2)} MB`}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setUploadedFiles((prev) =>
                                  prev.filter(
                                    (item) =>
                                      !(
                                        item.docType === 'rent_roll' &&
                                        item.file?.name === entry.file.name &&
                                        item.file?.size === entry.file.size
                                      )
                                  )
                                )
                              }
                              className="text-xs font-bold text-red-700 hover:text-red-900"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Required</div>
                    <div className="mt-1 text-sm font-semibold text-[#0F172A]">
                      T12 (Operating Statement)
                    </div>
                    <button
                      type="button"
                      disabled={!propertyName.trim()}
                      onClick={async () => {
                        if (!profile || credits <= 0) {
                          window.location.href = '/pricing';
                          return;
                        }

                        if (!propertyName.trim()) {
                          toast({
                            title: 'Property name required',
                            description: 'Enter a property name before uploading documents.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        if (!acknowledged) {
                          toast({
                            title: 'Acknowledgement required',
                            description:
                              'Please acknowledge the document-based limitations before uploading files.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        document.getElementById('t12Input')?.click();
                      }}
                      className={`mt-auto inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold
                        ${
                          propertyName.trim()
                            ? 'border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326]'
                            : 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload T12
                    </button>
                    <div className="mt-3 space-y-2">
                      {t12Files.length === 0 ? (
                        <div className="text-xs text-slate-500">No files uploaded.</div>
                      ) : (
                        t12Files.map((entry, index) => (
                          <div
                            key={`${entry.file.name}-${index}`}
                            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-[#0F172A]">
                                {entry.file.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {entry.file.size < 1024 * 1024
                                  ? `${(entry.file.size / 1024).toFixed(2)} KB`
                                  : `${(entry.file.size / 1024 / 1024).toFixed(2)} MB`}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setUploadedFiles((prev) =>
                                  prev.filter(
                                    (item) =>
                                      !(
                                        item.docType === 't12' &&
                                        item.file?.name === entry.file.name &&
                                        item.file?.size === entry.file.size
                                      )
                                  )
                                )
                              }
                              className="text-xs font-bold text-red-700 hover:text-red-900"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Optional</div>
                    <div className="mt-1 text-sm font-semibold text-[#0F172A]">Other / Supporting</div>
                    <button
                      type="button"
                      disabled={!propertyName.trim()}
                      onClick={async () => {
                        if (!profile || credits <= 0) {
                          window.location.href = '/pricing';
                          return;
                        }

                        if (!propertyName.trim()) {
                          toast({
                            title: 'Property name required',
                            description: 'Enter a property name before uploading documents.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        if (!acknowledged) {
                          toast({
                            title: 'Acknowledgement required',
                            description:
                              'Please acknowledge the document-based limitations before uploading files.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        document.getElementById('otherDocsInput')?.click();
                      }}
                      className={`mt-auto inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold
                        ${
                          propertyName.trim()
                            ? 'border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326]'
                            : 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload Supporting
                    </button>
                    <div className="mt-3 space-y-2">
                      {otherFiles.length === 0 ? (
                        <div className="text-xs text-slate-500">No files uploaded.</div>
                      ) : (
                        otherFiles.map((entry, index) => (
                          <div
                            key={`${entry.file.name}-${index}`}
                            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-[#0F172A]">
                                {entry.file.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {entry.file.size < 1024 * 1024
                                  ? `${(entry.file.size / 1024).toFixed(2)} KB`
                                  : `${(entry.file.size / 1024 / 1024).toFixed(2)} MB`}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setUploadedFiles((prev) =>
                                  prev.filter(
                                    (item) =>
                                      !(
                                        item.docType === 'other' &&
                                        item.file?.name === entry.file.name &&
                                        item.file?.size === entry.file.size
                                      )
                                  )
                                )
                              }
                              className="text-xs font-bold text-red-700 hover:text-red-900"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <input
              id="rentRollInput"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
              onChange={(e) => handleUpload(e, 'rent_roll')}
              className="hidden"
            />

            <input
              id="t12Input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
              onChange={(e) => handleUpload(e, 't12')}
              className="hidden"
            />

            <input
              id="otherDocsInput"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
              onChange={(e) => handleUpload(e, 'other')}
              className="hidden"
            />

            {/* DISCLAIMER */}
            <div className="mt-6 bg-[#1F8A8A]/10 border border-[#1F8A8A]/30 rounded-lg p-4 text-sm text-[#334155] font-medium flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-[#1F8A8A] flex-shrink-0 mt-[2px]" />
              <span>
                <strong className="text-[#0F172A]">Note:</strong> Report accuracy depends on the completeness and clarity
                of your uploaded data.
              </span>
            </div>

            <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  disabled={ackLocked || ackSubmitting}
                  onChange={async (e) => {
                    const next = e.target.checked;

                    // Do not allow unchecking once accepted (institutional audit posture)
                    if (!next) return;

                    // Belt and suspenders: block duplicate submits
                    if (ackLocked || acknowledged || ackSubmitting) return;

                    setAckSubmitting(true);

                    // Attempt to record acceptance immediately when the user checks the box
                    const accepted = await recordLegalAcceptance();
                    if (!accepted?.ok) {
                      toast({
                        title: 'Unable to record acknowledgement',
                        description:
                          'We could not record your acceptance of the required disclosures. Please try again.',
                        variant: 'destructive',
                      });
                      setAcknowledged(false);
                      setAckLocked(false);
                      setAckSubmitting(false);
                      return;
                    }

                    setAcknowledged(true);
                    setAckLocked(true);
                    setAckAcceptedAtLocal(accepted?.acceptedAt || new Date().toISOString());
                    setAckSubmitting(false);
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0F172A]"
                />
                <span className="flex flex-col">
                  <span className="font-medium">
                    I acknowledge that InvestorIQ produces document-based underwriting only, does not provide investment
                    or appraisal advice, and will disclose any missing or degraded inputs in the final report.
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Accepted disclosures v2026-01-14
                    {ackAcceptedAtLocal
                      ? ` on ${new Date(ackAcceptedAtLocal).toLocaleString()}`
                      : ''}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Analysis outputs are generated strictly from the documents provided. No assumptions or gap-filling are
                    performed.
                  </span>
                </span>
              </label>
            </div>

            <AnalysisScopePreview
              hasRentRoll={hasRentRoll}
              hasT12={hasT12}
              hasPurchase={hasPurchase}
              hasCapex={hasCapex}
              hasDebt={hasDebt}
              hasMarket={hasMarket}
              rentRollCoverage={rentRollCoverage}
            />

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={scopeConfirmed}
                onChange={(event) => setScopeConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0F172A]"
              />
              <span>
                I understand that this analysis will include only the sections supported by the documents I have uploaded.
                One credit underwrites one property. I may upload additional documents later to deepen the analysis at no
                additional cost.
              </span>
            </div>

            {/* ACTION BUTTON */}
                        <div className="flex flex-col items-center mt-8">
            <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={
                  !propertyName.trim() ||
                  !hasRequiredUploads ||
                  loading ||
                  !acknowledged ||
                  hasBlockingJob ||
                  !scopeConfirmed
                }
                className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-8 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                  </>
                ) : hasBlockingJob ? (
                  'Report In Progress'
                ) : (
                  'Generate IQ Report'
                )}
              </Button>

              {!propertyName.trim() && (
                <div className="mt-2 text-xs font-semibold text-red-700">
                  Enter a property name to generate a report.
                </div>
              )}

              {propertyName.trim() && !hasRequiredUploads && (
                <div className="mt-2 text-xs font-semibold text-red-700">
                  Rent Roll and T12/Operating Statement are required to start underwriting.
                </div>
              )}

              {propertyName.trim() && hasRequiredUploads && !acknowledged && (
                <div className="mt-2 text-xs font-semibold text-red-700">
                  Acknowledge the disclosures to generate a report.
                </div>
              )}
              {hasBlockingJob && (
                <div className="mt-2 text-xs font-semibold text-slate-600">
                  A report is already in progress. If Action Required appears, upload required documents and
                  processing will resume automatically.
                </div>
              )}
            </div>
          </motion.div>

                    {/* RESULT CARD */}
          {reportData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center"
            >
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                Report Generated Successfully
              </h3>
              <p className="text-[#334155] mb-6 font-medium">
                Address: {reportData.address}
              </p>
              <Button
                size="lg"
                onClick={() => {
                  if (reportData?.reportUrl) {
                    window.open(reportData.reportUrl, '_blank');
                  }
                }}
                className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
              >
                <FileDown className="mr-2 h-5 w-5" /> Download Report
              </Button>
            </motion.div>
          )}

          {/* IN-PROGRESS ANALYSIS JOBS */}
{inProgressJobs.length > 0 && (
  <div className="mt-12">
    <h2 className="text-xl font-bold text-[#0F172A] mb-6">
      In Progress
    </h2>
    {inProgressJobs.some((job) => job.status === 'queued') && (
      <div className="mb-4 text-sm font-medium text-[#334155]">
        Scheduled for processing. Queue processing runs automatically every few minutes.
      </div>
    )}

    {inProgressJobs.some((job) =>
      ['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing'].includes(job.status)
    ) && (
      <div className="mb-4 text-sm font-medium text-[#334155]">
        Report generation is in progress. Processing can take up to 24 hours depending on document complexity.
      </div>
    )}

    <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm divide-y">
      {inProgressJobs.map((job) => {
        const jobEvent = jobEvents[job.id];
        const eventName = jobEvent?.payload?.event || '';
        const errorMessage = jobEvent?.payload?.error_message || '';
        const isActionRequired = eventName === 'missing_required_documents';
        const isWarning = !isActionRequired && Boolean(eventName);

        return (
          <div
            key={job.id}
            className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex-1">
              {isActionRequired && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#0F172A]">
                  <div className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    Action required
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
  A Rent Roll and an Operating Statement (T12/P&amp;L) are required to complete underwriting. We did not receive a
  usable version for this job. Please upload a Rent Roll and/or T12 (spreadsheet preferred).
</div>
                  {errorMessage ? (
                    <div className="mt-2 text-xs text-slate-500">Log: {errorMessage}</div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
                      document.getElementById('rentRollInput')?.click();
                    }}
                    className="mt-3 inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0d1326]"
                  >
                    Upload required documents
                  </button>
                </div>
              )}

              {isWarning && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Document processing issue
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {errorMessage || 'We encountered an issue processing one of your documents.'}
                  </div>
                </div>
              )}

              <div className="text-sm font-semibold text-[#0F172A]">
                {job.property_name || 'Untitled Property'}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
                Status: {job.status.replaceAll('_', ' ')}
              </div>
            </div>

            <div className="text-sm font-semibold text-[#1F8A8A]">
              Processing
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

          {latestFailedJob?.id && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
              <div>
                {latestFailedJob.error_code === 'REPORT_GENERATION_FAILED' ? (
                  <>
                    <div className="text-xs font-bold uppercase tracking-wide text-red-700">
                      Report could not be generated
                    </div>
                    <div className="mt-1">
                      We could not generate your report due to a system error. Please try again in a few minutes. If
                      the issue persists, contact support and provide Reference ID: {latestFailedJob.id}.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold uppercase tracking-wide text-red-700">
                      Report failed
                    </div>
                    <div className="mt-1">
                      {latestFailedJob.error_message ||
                        'Report failed. Review the job details and try again.'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* RECENT REPORTS TABLE */}
          <div className="mt-12 mb-20">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">
              Recent Property IQ Reports
            </h2>
            <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-[#0F172A] uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-[#0F172A] uppercase tracking-wider"
                    >
                      Property Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-[#0F172A] uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {reportsLoading ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-sm text-slate-500"
                      >
                        Retrieving report records...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-sm text-slate-500"
                      >
                        No reports found in your vault.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0F172A]">
                          {report.property_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              const { data } = await supabase.storage
                                .from('generated_reports')
                                .createSignedUrl(report.storage_path, 3600);
                              if (data?.signedUrl)
                                window.open(data.signedUrl, '_blank');
                            }}
                            className="text-[#1F8A8A] hover:text-[#0F172A] font-bold mr-4"
                          >
                            Download
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  'Are you sure you want to permanently remove this report?'
                                )
                              ) {
                                try {
                                  await supabase.storage
                                    .from('generated_reports')
                                    .remove([report.storage_path]);
                                  await supabase
                                    .from('reports')
                                    .delete()
                                    .eq('id', report.id);
                                  toast({ title: 'Report Deleted' });
                                  fetchReports();
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                            className="text-red-700 hover:text-red-900 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* INSTITUTIONAL LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center max-w-sm text-center">
            <Loader2 className="h-12 w-12 text-[#0F172A] animate-spin mb-6" />
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Underwriting in Progress</h3>
            <p className="text-slate-600 text-sm leading-relaxed text-center">
              InvestorIQ is analyzing your documents and generating your institutional-grade Property IQ Report.
            </p>
            <div className="mt-6 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-[#1F8A8A] h-full animate-progress" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
