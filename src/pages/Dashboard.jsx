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
  const [selectedReportType, setSelectedReportType] = useState('screening');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueMessage, setIssueMessage] = useState('');
  const [issueFile, setIssueFile] = useState(null);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueReport, setIssueReport] = useState(null);
  const [showScopePreview, setShowScopePreview] = useState(false);
  const [requiredDocsDb, setRequiredDocsDb] = useState({
    hasRentRoll: false,
    hasT12: false,
  });
  const [entitlements, setEntitlements] = useState({
    screening: null,
    underwriting: null,
    error: false,
  });
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
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

  async function fetchRequiredDocFlags(jobId) {
    if (!jobId) return;

    const { data, error } = await supabase
      .from('analysis_job_files')
      .select('doc_type')
      .eq('job_id', jobId)
      .in('doc_type', ['rent_roll', 't12']);

    if (error) {
      console.error('fetchRequiredDocFlags error:', error);
      setRequiredDocsDb({ hasRentRoll: false, hasT12: false });
      return;
    }

    const types = (data || []).map((r) => r.doc_type);
    setRequiredDocsDb({
      hasRentRoll: types.includes('rent_roll'),
      hasT12: types.includes('t12'),
    });
  }

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
      .select('id, property_name, status, created_at, runs_limit, runs_used, runs_inflight')
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

  const fetchEntitlements = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('report_purchases')
      .select('id, product_type')
      .eq('user_id', profile.id)
      .is('consumed_at', null);

    if (error) {
      console.error('Failed to fetch entitlements:', error);
      setEntitlements({ screening: null, underwriting: null, error: true });
      return;
    }

    const screeningCount = (data || []).filter((row) => row.product_type === 'screening').length;
    const underwritingCount = (data || []).filter((row) => row.product_type === 'underwriting').length;
    setEntitlements({ screening: screeningCount, underwriting: underwritingCount, error: false });
  };

  const fetchLatestFailedJob = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('analysis_jobs')
      .select(
        'id, property_name, status, created_at, error_message, error_code, runs_limit, runs_used, runs_inflight'
      )
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
    await fetchEntitlements();

        // Reuse the most recent in-progress job (supports walk-away / return later)
    if (!jobId) {
      const { data: existingJob, error } = await supabase
        .from('analysis_jobs')
        .select('id, status, created_at, property_name, runs_limit, runs_used, runs_inflight')
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
      
      // ELITE PERFORMANCE: Automatically check for newly purchased entitlements every 2 seconds
      // This ensures if they just came from checkout, the entitlement appears without a refresh.
      const fastInterval = setInterval(() => fetchProfile(profile.id), 2000);
      const timeout = setTimeout(() => clearInterval(fastInterval), 10000);

      return () => {
        clearInterval(fastInterval);
        clearTimeout(timeout);
      };
    }
  }, [profile?.id]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get('checkout');
    if (checkout === 'success') {
      toast({
        title: 'Payment received',
        description: 'Report entitlement added.',
      });
      setCheckoutSuccess(true);
    } else if (checkout === 'cancelled') {
      toast({
        title: 'Payment cancelled',
        description: 'No charge was made.',
      });
    }
    if (checkout) {
      url.searchParams.delete('checkout');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  useEffect(() => {
    if (!jobId) {
      setRentRollCoverage(null);
      return;
    }
    fetchRentRollCoverage(jobId);
    fetchRequiredDocFlags(jobId);
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

const rentRollFiles = uploadedFiles.filter((item) => item.docType === 'rent_roll');
const t12Files = uploadedFiles.filter((item) => item.docType === 't12');
const supportingDocGroups = [
  {
    title: 'Offering & diligence',
    docs: [
      { slug: 'om', label: 'Offering Memorandum (OM)' },
      { slug: 'appraisal', label: 'Appraisal' },
      { slug: 'pca', label: 'PCA (Property Condition Assessment)' },
      { slug: 'esa_phase_1', label: 'ESA Phase I' },
      { slug: 'esa_phase_2', label: 'ESA Phase II' },
      { slug: 'survey_site_plan', label: 'Survey / Site Plan' },
    ],
  },
  {
    title: 'Operating & maintenance',
    docs: [
      { slug: 'utility_bills', label: 'Utility Bills (12–24 months)' },
      { slug: 'property_tax', label: 'Property Tax Bill / Assessment' },
      { slug: 'insurance_loss_runs', label: 'Insurance Loss Runs' },
      { slug: 'service_contracts', label: 'Service Contracts (HVAC / Elevator / etc.)' },
      { slug: 'capex_history', label: 'CapEx History / Invoices' },
    ],
  },
  {
    title: 'Capital & leases',
    docs: [
      { slug: 'lease_abstracts', label: 'Lease Abstracts / Major Leases' },
      { slug: 'renovation_scope_bid', label: 'Unit Renovation Scope / Bid' },
      { slug: 'gc_proposal', label: 'GC Proposal / Contractor Bid' },
      { slug: 'property_photos', label: 'Property Photos / Inspection Package' },
    ],
  },
  {
    title: 'Legal & compliance',
    docs: [
      { slug: 'certificates_of_occupancy', label: 'Certificates of Occupancy' },
      { slug: 'zoning_compliance', label: 'Zoning / Compliance Letter' },
      { slug: 'litigation_claims', label: 'Litigation / Claims Summary' },
    ],
  },
];
const supportingDocTypes = supportingDocGroups.flatMap((group) => group.docs);
const hasRequiredUploads = requiredDocsDb.hasRentRoll && requiredDocsDb.hasT12;
const requiredDocsReady = hasRequiredUploads;
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
const jobFromInProgress = inProgressJobs.find((job) => job.id === jobId) || null;
const jobFromFailed = latestFailedJob?.id === jobId ? latestFailedJob : null;
const activeJobForRuns =
  jobFromInProgress || jobFromFailed || inProgressJobs[0] || latestFailedJob || null;
const hasRunsData = !!(
  activeJobForRuns &&
  activeJobForRuns.id === jobId &&
  typeof activeJobForRuns.runs_limit === 'number' &&
  typeof activeJobForRuns.runs_used === 'number' &&
  typeof activeJobForRuns.runs_inflight === 'number'
);
const runsLimitValue = Number(activeJobForRuns?.runs_limit ?? 0);
const runsUsedValue = Number(activeJobForRuns?.runs_used ?? 0);
const runsInflightValue = Number(activeJobForRuns?.runs_inflight ?? 0);
const remainingTotal = Math.max(0, runsLimitValue - runsUsedValue - runsInflightValue);
const availableReportsCount = entitlements.error
  ? 0
  : Number(entitlements.screening ?? 0) + Number(entitlements.underwriting ?? 0);
const hasAvailableReport = availableReportsCount >= 1;
const step2Locked = !propertyName.trim();
const statusBlocksRegen = activeJobForRuns
  ? [
      'queued',
      'validating_inputs',
      'extracting',
      'needs_documents',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
    ].includes(activeJobForRuns.status)
  : false;
const regenDisabled = activeJobForRuns
  ? remainingTotal <= 0 || statusBlocksRegen
  : false;
const step3Locked = !jobId || regenDisabled;

  const policyText =
    'InvestorIQ produces document-based underwriting only, does not provide investment or appraisal advice, and will disclose any missing or degraded inputs in the final report. Analysis outputs are generated strictly from the documents provided. No assumptions or gap-filling are performed.';

  const computePolicyTextHash = async () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(policyText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
      const reportType = (selectedReportType || '').toLowerCase();
      const allowedReportTypes = ['screening', 'underwriting'];
      if (!allowedReportTypes.includes(reportType)) {
        return;
      }
      const revisionsLimit = reportType === 'underwriting' ? 3 : 2;
      const jobPayload = {
        property_name: (propertyNameRef.current || propertyName).trim() || 'Untitled Property',
        status: 'needs_documents',
        prompt_version: 'v2026-01-17',
        parser_version: 'v1',
        template_version: 'v2026-01-14',
        scoring_version: 'v1',
        report_type: reportType,
        revisions_limit: revisionsLimit,
        revisions_used: 0,
      };

      const { data, error } = await supabase.rpc('consume_purchase_and_create_job', {
        p_report_type: reportType,
        p_job_payload: jobPayload,
      });

      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('NO_AVAILABLE_CREDIT')) {
          toast({
            title: 'Purchase required',
            description: 'No unused purchase found for this report type.',
            variant: 'destructive',
          });
          return;
        }
        console.error('Failed to create analysis job:', error);
        toast({
          title: 'Unable to start analysis job',
          description: 'We could not initialize your underwriting run. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const createdJobId = data?.[0]?.job_id || data?.job_id;
      if (!createdJobId) {
        toast({
          title: 'Unable to start analysis job',
          description: 'We could not initialize your underwriting run. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setJobId(createdJobId);
    }

    toast({
      title: 'Uploads received',
      description: 'Documents are stored and ready for review.',
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
  const reportType = (selectedReportType || '').toLowerCase();
  const allowedReportTypes = ['screening', 'underwriting'];
  if (!allowedReportTypes.includes(reportType)) {
    toast({
      title: 'Unable to start analysis job',
      description: 'Report type is not available. Please try again.',
      variant: 'destructive',
    });
    return;
  }
  const revisionsLimit = reportType === 'underwriting' ? 3 : 2;
  const jobPayload = {
    property_name: (propertyNameRef.current || propertyName).trim() || 'Untitled Property',
    status: 'needs_documents',
    prompt_version: 'v2026-01-17',
    parser_version: 'v1',
    template_version: 'v2026-01-14',
    scoring_version: 'v1',
    report_type: reportType,
    revisions_limit: revisionsLimit,
    revisions_used: 0,
  };

  const { data, error } = await supabase.rpc('consume_purchase_and_create_job', {
    p_report_type: reportType,
    p_job_payload: jobPayload,
  });

  if (error) {
    const msg = String(error.message || '');
    if (msg.includes('NO_AVAILABLE_CREDIT')) {
      toast({
        title: 'Purchase required',
        description: 'No unused purchase found for this report type.',
        variant: 'destructive',
      });
      return;
    }
    console.error('Failed to create analysis job:', error);
    toast({
      title: 'Unable to start analysis job',
      description: 'We could not initialize your underwriting run. Please try again.',
      variant: 'destructive',
    });
    return;
  }

  const createdJobId = data?.[0]?.job_id || data?.job_id;
  if (!createdJobId) {
    toast({
      title: 'Unable to start analysis job',
      description: 'We could not initialize your underwriting run. Please try again.',
      variant: 'destructive',
    });
    return;
  }

  effectiveJobId = createdJobId;
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

  toast({
    title: 'Uploads received',
    description: 'Documents are stored and ready for review.',
  });

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

  await fetchRequiredDocFlags(effectiveJobId);

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

    if (!jobId) {
      toast({
        title: 'Cannot generate report',
        description: 'Job is not ready yet. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }
    if (statusBlocksRegen) {
      toast({
        title: 'Report is already processing',
        description: 'Please wait for the current run to finish.',
        variant: 'destructive',
      });
      return;
    }

    // ELITE UX: Trigger the "Working" state immediately
    setLoading(true); 

    try {
      if (runsUsedValue > 0) {
        if (!hasRunsData) {
          toast({
            title: 'Cannot generate report',
            description: 'Generations: DATA NOT AVAILABLE. Please refresh and try again.',
            variant: 'destructive',
          });
          await Promise.all([
            fetchInProgressJobs(),
            fetchReports(),
            fetchLatestFailedJob(),
          ]);
          setLoading(false);
          return;
        }
        if (remainingTotal <= 0) {
          toast({
            title: 'Revision limit reached',
            description: 'You?ve used all available revisions for this report.',
            variant: 'destructive',
          });
          await Promise.all([
            fetchInProgressJobs(),
            fetchReports(),
            fetchLatestFailedJob(),
          ]);
          setLoading(false);
          return;
        }
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          toast({
            title: 'Failed to request revision',
            description: 'Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const revisionRes = await fetch('/api/jobs/request-revision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ job_id: jobId }),
        });

        const revisionData = await revisionRes.json().catch(() => ({}));
        if (revisionRes.ok && revisionData?.ok) {
          toast({
            title: 'Revision requested',
            description: 'Your revision request has been queued.',
          });
          await Promise.all([
            fetchInProgressJobs(),
            fetchReports(),
            fetchLatestFailedJob(),
          ]);
          setLoading(false);
          return;
        }

        if (revisionData?.code === 'REVISION_LIMIT_REACHED') {
          toast({
            title: 'Revision limit reached',
            description: 'You’ve used all available revisions for this job.',
            variant: 'destructive',
          });
          await Promise.all([
            fetchInProgressJobs(),
            fetchReports(),
            fetchLatestFailedJob(),
          ]);
          setLoading(false);
          return;
        }

        toast({
          title: 'Failed to request revision',
          description: 'Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Final update before status transition
      const { error: statusErr } = await supabase.rpc('queue_job_for_processing', {
        p_job_id: jobId,
      });

      if (statusErr) {
        console.error('Failed to advance job status:', statusErr);
        toast({
          title: 'Unable to start analysis',
          description: 'Could not queue job for processing.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Report queued',
        description: 'Your underwriting report has started. You may safely close this page and return later.',
      });

      // Refresh data to reflect updated job status
      await Promise.all([
        fetchInProgressJobs(),
        fetchReports(),
        fetchProfile(profile.id) 
      ]);

    } catch (error) {
      console.error('Queue Error FULL:', error, error?.stack);
      if (error?.status === 409 && error?.code === 'REVISION_LIMIT_REACHED') {
        toast({
          title: 'Revision limit reached',
          description: 'You’ve used all available revisions for this report.',
          variant: 'destructive',
        });
        await Promise.all([
          fetchInProgressJobs(),
          fetchReports(),
          fetchLatestFailedJob(),
        ]);
      } else {
        toast({
          title: 'Unable to queue report',
          description: error.message || 'An error occurred while starting the underwriting run.',
          variant: 'destructive',
        });
      }
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
        <div className="max-w-7xl w-full mx-auto flex-grow">
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
          </motion.div>
          <div className="mb-6 text-xs text-slate-600">
            Reports are property-specific and non-refundable once generation begins.
          </div>
          {checkoutSuccess && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Payment received</div>
              <div>1 report credit added</div>
              <div>Upload documents to begin</div>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0d1326]"
                onClick={() => {
                  const target = document.getElementById('upload-section');
                  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Upload documents
              </button>
            </div>
          )}
          <div className="mb-6 text-xs text-slate-600">
            <div className="font-semibold text-[#0F172A]">Workflow</div>
            <div className="mt-1 flex flex-col gap-1">
              <div>Step 1: Report type and availability</div>
              <div>Step 2: Property and documents</div>
              <div>Step 3: Generate report</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-700">Step 1: Report type and availability</div>
              <div className="text-xs text-slate-500">Select report type and confirm availability.</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="flex flex-col items-start">
                  <button
                    type="button"
                    onClick={() => setSelectedReportType('screening')}
                    className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                      selectedReportType === 'screening'
                        ? 'border-[#0F172A] bg-[#0F172A] text-white'
                        : 'border-slate-300 text-slate-600 hover:border-[#0F172A] hover:text-[#0F172A]'
                    }`}
                  >
                    Screening Report
                  </button>
                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div>T12 + Rent Roll only</div>
                    <div>For initial investment review.</div>
                    <div>No charts. No projections.</div>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <button
                    type="button"
                    onClick={() => setSelectedReportType('underwriting')}
                    className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                      selectedReportType === 'underwriting'
                        ? 'border-[#0F172A] bg-[#0F172A] text-white'
                        : 'border-slate-300 text-slate-600 hover:border-[#0F172A] hover:text-[#0F172A]'
                    }`}
                  >
                    Underwriting Report
                  </button>
                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div>T12 + Rent Roll plus supporting due diligence documents</div>
                    <div>For comprehensive, document-based underwriting.</div>
                    <div>Includes analysis tables and charts where supported by documents</div>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-[#0F172A]">Your available reports</div>
                  <div className="mt-2 text-sm text-slate-600">
                    Screening Report:{' '}
                    {entitlements.error ? 'DATA NOT AVAILABLE' : `${entitlements.screening ?? 0}`}
                  </div>
                  <div className="text-sm text-slate-600">
                    Underwriting Report:{' '}
                    {entitlements.error ? 'DATA NOT AVAILABLE' : `${entitlements.underwriting ?? 0}`}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Purchase Report</div>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/pricing';
                    }}
                    className="mt-3 inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0d1326]"
                  >
                    Purchase report
                  </button>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#0F172A]">What this report includes</div>
                  <button
                    type="button"
                    onClick={() => setShowScopePreview((prev) => !prev)}
                    className="text-xs font-semibold text-[#1F8A8A] hover:underline"
                  >
                    {showScopePreview ? 'Hide details' : 'View details'}
                  </button>
                </div>
                {!showScopePreview ? (
                  <div className="text-xs text-slate-600">
                    Included sections are determined strictly by the documents you upload. Missing sections render as DATA NOT AVAILABLE.
                  </div>
                ) : (
                  <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Analysis Scope Preview
                        </h3>
                        <p className="text-sm text-slate-600">
                          Summary of what will be included based on the documents provided.
                        </p>
                      </div>
                    </div>

                    {rentRollCoverage && Number.isFinite(rentRollCoverage.provided) && (
                      <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {Number.isFinite(rentRollCoverage.total) &&
                        Number.isFinite(rentRollCoverage.percent) ? (
                          <>
                            Rent Roll Coverage: {rentRollCoverage.provided} / {rentRollCoverage.total}{' '}
                            units ({Math.round(rentRollCoverage.percent)}%).
                            {rentRollCoverage.percent < 70
                              ? ' Analysis reflects only the units provided.'
                              : ''}
                          </>
                        ) : (
                          <>
                            Rent Roll Units Provided: {rentRollCoverage.provided}. Total unit count not
                            provided in uploaded documents.
                          </>
                        )}
                      </div>
                    )}

                    <div className="mt-6 space-y-6">
                      {selectedReportType === 'screening' && (
                        <div className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-900">
                              Screening Report Overview
                            </h4>
                            {hasRentRoll && hasT12 && (
                              <span className="text-xs font-semibold text-[#1F8A8A] bg-[#1F8A8A]/10 border border-[#1F8A8A] rounded-full px-2 py-0.5">
                                INCLUDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Requires: Rent Roll + T12 / Operating Statement
                          </p>
                          <ul className="mt-3 text-sm text-slate-700 list-disc list-inside space-y-1">
                            <li>Unit count, occupancy, and in-place rent summary (from rent roll)</li>
                            <li>Trailing twelve income and expense summary (from T12)</li>
                            <li>Document sources summary</li>
                          </ul>
                        </div>
                      )}

                      {selectedReportType === 'underwriting' && (
                        <div className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-900">
                              Underwriting Report Overview
                            </h4>
                            {hasRentRoll && hasT12 && hasPurchase && hasCapex && hasDebt && (
                              <span className="text-xs font-semibold text-[#1F8A8A] bg-[#1F8A8A]/10 border border-[#1F8A8A] rounded-full px-2 py-0.5">
                                INCLUDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Requires: Rent Roll + T12 / Operating Statement + supporting due diligence documents
                          </p>
                          <ul className="mt-3 text-sm text-slate-700 list-disc list-inside space-y-1">
                            <li>Purchase, capital, and financing inputs as provided</li>
                            <li>Return metrics and scenario outputs derived strictly from provided inputs</li>
                            <li>Risk scoring and sensitivities based on available data</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className={`rounded-xl border border-slate-200 bg-white p-6 transition-opacity ${
                step2Locked ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-700">Step 2: Property and documents</div>
                {step2Locked ? (
                  <div className="text-[11px] text-slate-400">Locked</div>
                ) : null}
              </div>
              <div className="text-xs text-slate-500">Add property details and upload documents.</div>
              <div className="mt-3 space-y-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border border-slate-200 rounded-xl p-5 md:p-6"
                  id="upload-section"
                >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1 space-y-6">
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

              <div className="lg:col-span-8 lg:col-start-1 lg:row-start-1 space-y-6">
                {!propertyName.trim() && (
                  <div className="mb-2 text-xs font-semibold text-slate-600">
                    Enter a property name to enable uploads.
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Required</div>
                    <div className="mt-1 text-sm font-semibold text-[#0F172A]">
                      Rent Roll <span className="text-red-700">*</span>
                    </div>
                    <button
                      type="button"
                      disabled={!propertyName.trim() || !hasAvailableReport}
                      onClick={async () => {
                        if (!hasAvailableReport) {
                          toast({
                            title: 'No reports available',
                            description: 'Purchase a report to upload documents.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        if (!profile) {
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
                          propertyName.trim() && hasAvailableReport
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

                  <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Required</div>
                    <div className="mt-1 text-sm font-semibold text-[#0F172A]">
                      T12 (Operating Statement) <span className="text-red-700">*</span>
                    </div>
                    <button
                      type="button"
                      disabled={!propertyName.trim() || !hasAvailableReport}
                      onClick={async () => {
                        if (!hasAvailableReport) {
                          toast({
                            title: 'No reports available',
                            description: 'Purchase a report to upload documents.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        if (!profile) {
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
                          propertyName.trim() && hasAvailableReport
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
                </div>
            {selectedReportType === 'underwriting' && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[#0F172A]">
                    Supporting documents (recommended)
                  </h4>
                  <div className="relative group">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-500">
                      i
                    </span>
                    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <div className="text-xs font-semibold text-[#0F172A]">
                        Supporting documents (recommended)
                      </div>
                      <ul className="mt-2 list-disc pl-4 text-slate-600">
                        <li>
                          Upload any available supporting materials to improve coverage and
                          reduce DATA NOT AVAILABLE sections.
                        </li>
                        <li>
                          InvestorIQ does not assume missing information.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload what you have. Missing inputs render as DATA NOT AVAILABLE.
                </p>
                {!requiredDocsReady && (
                  <div className="mt-2 text-xs text-slate-500">
                    Upload Rent Roll and T12 to unlock supporting documents.
                  </div>
                )}

                <div className="mt-4 space-y-5">
                  {supportingDocGroups.map((group) => (
                    <div key={group.title}>
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {group.title}
                      </div>
                      <div className="mt-2 space-y-3">
                        {group.docs.map((doc) => {
                          const docFiles = uploadedFiles.filter(
                            (entry) => entry.docType === doc.slug
                          );
                          return (
                            <div
                              key={doc.slug}
                              className="rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-[#0F172A]">
                                  {doc.label}
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!hasAvailableReport) {
                                      toast({
                                        title: 'No reports available',
                                        description: 'Purchase a report to upload documents.',
                                        variant: 'destructive',
                                      });
                                      return;
                                    }
                                    if (!requiredDocsReady) {
                                      return;
                                    }

                                    if (!profile) {
                                      window.location.href = '/pricing';
                                      return;
                                    }

                                    if (!propertyName.trim()) {
                                      toast({
                                        title: 'Property name required',
                                        description:
                                          'Enter a property name before uploading documents.',
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

                                    document
                                      .getElementById(`supporting-${doc.slug}-input`)
                                      ?.click();
                                  }}
                                  disabled={!propertyName.trim() || !hasAvailableReport || !requiredDocsReady}
                                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold
                                    ${
                                      propertyName.trim() && hasAvailableReport && requiredDocsReady
                                        ? 'border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326]'
                                        : 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                  <UploadCloud className="h-4 w-4" />
                                  {docFiles.length > 0 ? 'Replace' : 'Upload'}
                                </button>
                              </div>

                              <div className="mt-2 space-y-2">
                                {docFiles.length === 0 ? (
                                  <div className="text-xs text-slate-500">No file uploaded.</div>
                                ) : (
                                  docFiles.map((entry, index) => (
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
                                                  item.docType === doc.slug &&
                                                  item.file?.name === entry.file.name &&
                                                  item.file?.size === entry.file.size
                                                )
                                            )
                                          )
                                        }
                                        className="text-xs font-bold text-red-700 hover:text-red-900"
                                      >
                                        ??
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </div>

              <div className="lg:col-span-4 lg:col-start-9 lg:row-start-2 space-y-6">
            {/* DISCLAIMER */}
            <div className="bg-[#1F8A8A]/10 border border-[#1F8A8A]/30 rounded-lg p-4 text-sm text-[#334155] font-medium flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-[#1F8A8A] flex-shrink-0 mt-[2px]" />
              <span>
                <strong className="text-[#0F172A]">Note:</strong> Report accuracy depends on the completeness and clarity
                of your uploaded data.
              </span>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
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
                    I acknowledge that InvestorIQ provides document-based analysis only, makes no assumptions, and
                    discloses missing inputs as DATA NOT AVAILABLE. I acknowledge that refunds are not available once
                    report generation begins.
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

            {supportingDocTypes.map((doc) => (
              <input
                key={doc.slug}
                id={`supporting-${doc.slug}-input`}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                onChange={(e) => handleUpload(e, doc.slug)}
                className="hidden"
              />
            ))}
            </motion.div>
            </div>
          </div>
            <div
              className={`rounded-xl border border-slate-200 bg-white p-6 transition-opacity ${
                step3Locked ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-700">Step 3: Generate report</div>
                {step3Locked ? (
                  <div className="text-[11px] text-slate-400">Locked</div>
                ) : null}
              </div>
              <div className="text-xs text-slate-500">
                {activeJobForRuns?.status === 'queued'
                  ? 'Queued for processing.'
                  : ['validating_inputs', 'extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing'].includes(
                      activeJobForRuns?.status
                    )
                  ? 'Processing in progress.'
                  : activeJobForRuns?.status === 'published'
                  ? 'Report generated.'
                  : activeJobForRuns?.status === 'failed'
                  ? 'Action required. See issue details.'
                  : 'Processing starts only after you click Generate Report.'}
              </div>
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading || regenDisabled || !jobId}
                  className={`inline-flex items-center rounded-md border px-6 py-3 text-sm font-semibold ${
                    loading || regenDisabled || !jobId
                      ? 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326]'
                  }`}
                >
                  {loading ? 'Working…' : runsUsedValue === 0 ? 'Generate Report' : 'Generate Revision'}
                </button>
                <div className="text-xs leading-relaxed text-slate-500">
                  Starting report generation consumes one available report entitlement for this property. Once generation begins, refunds are not available.
                </div>
                {hasRunsData ? (
                  <div className="text-xs text-slate-600">
                    Generations {runsUsedValue + runsInflightValue} of {runsLimitValue}
                  </div>
                ) : (
                  <div className="text-xs text-slate-600">Generations: DATA NOT AVAILABLE</div>
                )}
                <div className="text-xs text-slate-500">
                  Revisions are limited to the same property and underlying documents. Materially different rent rolls or operating statements require a new report.
                </div>
                {hasRunsData && remainingTotal <= 0 ? (
                  <div className="text-xs text-red-700">
                    You’ve used all available revisions for this report.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

                    {/* RESULT CARD */}
          {reportData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 bg-white rounded-xl border border-slate-200 p-8 text-center"
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

    <div className="overflow-hidden border border-slate-200 rounded-xl divide-y">
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
                    <div className="text-xs text-slate-500">Log: {errorMessage}</div>
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
              <div className="mt-1 text-xs text-slate-500">
                Revision {Math.max(0, Number(job.runs_used ?? 0) - 1)} of{' '}
                {Math.max(0, Number(job.runs_limit ?? 0) - 1)}
                {Number.isFinite(Number(job.runs_used)) &&
                Number.isFinite(Number(job.runs_limit)) ? (
                  <span className="ml-2 text-slate-400">
                    Runs used: {Number(job.runs_used)} / {Number(job.runs_limit)}
                  </span>
                ) : null}
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
            <div className="overflow-hidden border border-slate-200 rounded-xl">
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
                            onClick={() => {
                              setIssueReport(report);
                              setIssueMessage('');
                              setIssueFile(null);
                              setIssueModalOpen(true);
                            }}
                            className="text-[#0F172A] hover:text-[#1F8A8A] font-bold mr-4"
                          >
                            Report an issue
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

      {/* INSTITUTIONAL LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col items-center max-w-sm text-center">
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

      {issueModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-lg font-semibold text-[#0F172A]">Report an issue</div>
            <div className="mt-2 text-sm text-[#334155]">
              Provide a brief description and an optional attachment.
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                What went wrong?
              </label>
              <textarea
                value={issueMessage}
                onChange={(e) => setIssueMessage(e.target.value)}
                maxLength={1000}
                className="w-full min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F8A8A]/30"
                placeholder="Describe the issue you encountered."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                Attachment (optional)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setIssueFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <div className="mr-auto text-xs text-slate-600">
                Use this option for system or processing issues. InvestorIQ does not revise reports based on missing or unsuitable source documents.
              </div>
              <button
                type="button"
                onClick={() => {
                  if (issueSubmitting) return;
                  setIssueModalOpen(false);
                  setIssueMessage('');
                  setIssueFile(null);
                  setIssueReport(null);
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={issueSubmitting}
                onClick={async () => {
                  const trimmed = issueMessage.trim();
                  if (!trimmed) {
                    toast({
                      title: 'Message required',
                      description: 'Please describe the issue before submitting.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  if (!profile?.id || !issueReport) {
                    toast({
                      title: 'Submission failed',
                      description: 'Please refresh and try again.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  setIssueSubmitting(true);
                  try {
                    let attachmentPath = null;
                    if (issueFile) {
                      const uploadPath = `${user.id}/${issueReport.job_id}/${Date.now()}-${issueFile.name}`;
                      const { error: uploadErr } = await supabase.storage
                        .from('report-issues')
                        .upload(uploadPath, issueFile, { upsert: false });
                      if (uploadErr) {
                        toast({
                          title: 'Submission failed',
                          description: uploadErr.message || 'Attachment upload failed.',
                          variant: 'destructive',
                        });
                        setIssueSubmitting(false);
                        return;
                      }
                      attachmentPath = uploadPath;
                    }

                    const { error: insertErr } = await supabase
                      .from('report_issues')
                      .insert({
                        user_id: profile.id,
                        job_id: issueReport.job_id || issueReport.jobId || null,
                        artifact_id: issueReport.artifact_id || null,
                        message: trimmed,
                        attachment_path: attachmentPath,
                        status: 'open',
                      });

                    if (insertErr) {
                      toast({
                        title: 'Submission failed',
                        description: insertErr.message || 'Unable to submit issue.',
                        variant: 'destructive',
                      });
                      setIssueSubmitting(false);
                      return;
                    }

                    toast({
                      title: 'Issue submitted',
                      description: 'We received your message and will review it.',
                    });
                    setIssueModalOpen(false);
                    setIssueMessage('');
                    setIssueFile(null);
                    setIssueReport(null);
                  } catch (err) {
                    toast({
                      title: 'Submission failed',
                      description: err?.message || 'Unable to submit issue.',
                      variant: 'destructive',
                    });
                  } finally {
                    setIssueSubmitting(false);
                  }
                }}
                className="rounded-md border border-[#0F172A] bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1326] disabled:opacity-60"
              >
                {issueSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}


