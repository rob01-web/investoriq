import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, AlertCircle, FileDown } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

// DESIGN TOKENS
const T = {
  green:       '#0F2318',
  greenMid:    '#163320',
  gold:        '#C9A84C',
  goldDark:    '#9A7A2C',
  ink:         '#0C0C0C',
  ink2:        '#363636',
  ink3:        '#606060',
  ink4:        '#9A9A9A',
  white:       '#FFFFFF',
  warm:        '#FAFAF8',
  hairline:    '#E8E5DF',
  hairlineMid: '#D0CCC4',
  errorRed:    '#7A1A1A',
  errorBg:     '#FDF4F4',
  errorBorder: '#E8C0C0',
  warnAmber:   '#7A4A00',
  warnBg:      '#FDF8EE',
  warnBorder:  '#E8D4A0',
  okGreen:     '#1A4A22',
  okBg:        '#F2F8F3',
  okBorder:    '#B8D4BC',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

// Inject fonts once at module load, never inside render
if (typeof document !== 'undefined' && !document.getElementById('iq-fonts')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'iq-fonts';
  styleEl.textContent = FONTS;
  document.head.appendChild(styleEl);
}

// SHARED STYLE HELPERS

const sectionCard = {
  background:   T.white,
  border:       `1px solid ${T.hairline}`,
  borderRadius: 0,
  padding:      '28px 32px',
  marginBottom: 12,
};

const stepEyebrow = {
  fontFamily:   "'DM Mono', monospace",
  fontSize:     9,
  letterSpacing:'0.22em',
  textTransform:'uppercase',
  color:        T.goldDark,
  display:      'block',
  marginBottom: 4,
};

const stepTitle = {
  fontFamily:   "'Cormorant Garamond', Georgia, serif",
  fontSize:     18,
  fontWeight:   500,
  letterSpacing:'-0.015em',
  color:        T.ink,
  lineHeight:   1.1,
  display:      'block',
  marginBottom: 3,
};

const stepSub = {
  fontFamily:   "'DM Sans', sans-serif",
  fontSize:     12,
  fontWeight:   300,
  color:        T.ink3,
  fontStyle:    'italic',
};

const labelMono = {
  fontFamily:   "'DM Mono', monospace",
  fontSize:     9,
  letterSpacing:'0.16em',
  textTransform:'uppercase',
  color:        T.ink4,
};

const bodySmall = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize:   13,
  fontWeight: 300,
  color:      T.ink3,
  lineHeight: 1.65,
};

const hairlineRule = {
  borderTop:  `1px solid ${T.hairline}`,
  margin:     '20px 0',
};

// Primary button - Forest Green / Gold hover
function PrimaryBtn({ children, onClick, disabled, style = {}, loading = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          6,
        fontFamily:   "'DM Mono', monospace",
        fontSize:     10,
        letterSpacing:'0.14em',
        textTransform:'uppercase',
        fontWeight:   500,
        padding:      '10px 20px',
        background:   disabled || loading ? T.hairline : hov ? T.gold : T.green,
        color:        disabled || loading ? T.ink4    : hov ? T.green : T.gold,
        border:       `1px solid ${disabled || loading ? T.hairlineMid : T.green}`,
        cursor:       disabled || loading ? 'not-allowed' : 'pointer',
        transition:   'background 0.15s, color 0.15s',
        ...style,
      }}
    >
      {loading && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}

// Ghost button
function GhostBtn({ children, onClick, disabled, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          6,
        fontFamily:   "'DM Mono', monospace",
        fontSize:     10,
        letterSpacing:'0.14em',
        textTransform:'uppercase',
        fontWeight:   500,
        padding:      '9px 18px',
        background:   'transparent',
        color:        disabled ? T.ink4 : hov ? T.ink : T.ink3,
        border:       `1px solid ${disabled ? T.hairline : hov ? T.hairlineMid : T.hairline}`,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        transition:   'color 0.15s, border-color 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Status badge
function StatusBadge({ status }) {
  const map = {
    published:     { bg: T.okBg,      border: T.okBorder,    color: T.okGreen,   label: 'Published'    },
    queued:        { bg: T.warnBg,    border: T.warnBorder,  color: T.warnAmber, label: 'Queued'       },
    extracting:    { bg: T.warnBg,    border: T.warnBorder,  color: T.warnAmber, label: 'Extracting'   },
    underwriting:  { bg: T.warnBg,    border: T.warnBorder,  color: T.warnAmber, label: 'Underwriting' },
    scoring:       { bg: T.warnBg,    border: T.warnBorder,  color: T.warnAmber, label: 'Scoring'      },
    rendering:     { bg: T.warnBg,    border: T.warnBorder,  color: T.warnAmber, label: 'Rendering'    },
    pdf_generating:{ bg: T.warnBg,    border: T.warnBorder,  color: T.warnAmber, label: 'Generating'   },
    publishing:    { bg: T.warnBg,    border: T.warnBorder,  color: T.warnAmber, label: 'Publishing'   },
    needs_documents:{ bg:'#F0F4FF',   border:'#B8C8F0',      color:'#1A3A7A',    label: 'Needs Docs'   },
    failed:        { bg: T.errorBg,   border: T.errorBorder, color: T.errorRed,  label: 'Failed'       },
  };
  const s = map[status] || { bg: T.warm, border: T.hairline, color: T.ink4, label: status };
  return (
    <span style={{
      fontFamily:   "'DM Mono', monospace",
      fontSize:     9,
      letterSpacing:'0.14em',
      textTransform:'uppercase',
      padding:      '2px 8px',
      background:   s.bg,
      border:       `1px solid ${s.border}`,
      color:        s.color,
      whiteSpace:   'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// File row
function FileRow({ name, size, onRemove }) {
  const kb = size < 1024 * 1024
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / 1024 / 1024).toFixed(2)} MB`;
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '7px 10px',
      background:     T.warm,
      border:         `1px solid ${T.hairline}`,
      marginBottom:   4,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   12,
          fontWeight: 400,
          color:      T.ink2,
          overflow:   'hidden',
          textOverflow:'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth:   220,
        }}>
          {name}
        </div>
        <div style={{ ...labelMono, fontSize: 9, marginTop: 2 }}>{kb}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        style={{
          fontFamily:   "'DM Mono', monospace",
          fontSize:     9,
          letterSpacing:'0.1em',
          textTransform:'uppercase',
          color:        T.errorRed,
          background:   'none',
          border:       'none',
          cursor:       'pointer',
          flexShrink:   0,
          marginLeft:   12,
        }}
      >
        Remove
      </button>
    </div>
  );
}

// Info notice box
function NoticeBox({ type = 'info', children }) {
  const styles = {
    info:    { bg: T.warm,      border: T.hairlineMid, color: T.ink3        },
    warning: { bg: T.warnBg,   border: T.warnBorder,  color: T.warnAmber   },
    error:   { bg: T.errorBg,  border: T.errorBorder, color: T.errorRed    },
    success: { bg: T.okBg,     border: T.okBorder,    color: T.okGreen     },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{
      padding:      '12px 16px',
      background:   s.bg,
      border:       `1px solid ${s.border}`,
      borderLeft:   `3px solid ${s.border}`,
      marginBottom: 12,
    }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize:   13,
        fontWeight: 300,
        color:      s.color,
        lineHeight: 1.6,
      }}>
        {children}
      </div>
    </div>
  );
}

// MAIN COMPONENT
export default function Dashboard() {
  const { toast } = useToast();
  const { user, profile, fetchProfile, signOut } = useAuth();
  const DASHBOARD_DIAG_MINIMAL = false;
  const DISMISSED_JOBS_KEY = "investoriq_dismissed_jobs";
  const loadDismissedJobs = () => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(DISMISSED_JOBS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
      return new Set(ids.filter((id) => id.length > 0));
    } catch (err) { return new Set(); }
  };
  const saveDismissedJobs = (set) => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(DISMISSED_JOBS_KEY, JSON.stringify(Array.from(set))); } catch (err) {}
  };
  const [dismissedJobIds, setDismissedJobIds] = useState(() => loadDismissedJobs());
  const dismissJob = (jobId) => {
    if (!jobId) return;
    setDismissedJobIds((prev) => {
      const next = new Set(prev);
      next.add(String(jobId));
      saveDismissedJobs(next);
      return next;
    });
  };
  const handleDiagnosticSignOut = async () => {
    await signOut();
  };
  const [propertyName, setPropertyName] = useState('');
  const propertyNameRef = useRef('');
  const propertyInputRef = useRef(null);
  const analyzeInFlightRef = useRef(false);
  const [jobId, setJobId] = useState(null);
  const [inProgressJobs, setInProgressJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [lockedJobIdForUploads, setLockedJobIdForUploads] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackLocked, setAckLocked] = useState(false);
  const [ackAcceptedAtLocal, setAckAcceptedAtLocal] = useState(null);
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [stagedBatchId, setStagedBatchId] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [jobEvents, setJobEvents] = useState({});
  const [latestFailedJob, setLatestFailedJob] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [rentRollCoverage, setRentRollCoverage] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState('screening');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueMessage, setIssueMessage] = useState('');
  const [issueFile, setIssueFile] = useState(null);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueReport, setIssueReport] = useState(null);
  const [entitlements, setEntitlements] = useState({ screening: null, underwriting: null, error: false });
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const visibleInProgressJobs = useMemo(() => (
    inProgressJobs.filter((job) => {
      const dismissed = dismissedJobIds.has(String(job.id));
      return ['queued','extracting','underwriting','scoring','rendering','pdf_generating','publishing'].includes(job.status) && !dismissed;
    })
  ), [inProgressJobs, dismissedJobIds]);

  const failedJobsForDisplay = useMemo(() => (
    inProgressJobs.filter((job) => {
      const dismissed = dismissedJobIds.has(String(job.id));
      return job.status === 'failed' && !dismissed;
    })
  ), [inProgressJobs, dismissedJobIds]);

  const hasActiveProcessingJob = useMemo(() => (
    inProgressJobs.some((job) =>
      ['queued','extracting','underwriting','scoring','rendering','pdf_generating','publishing'].includes(job.status)
    )
  ), [inProgressJobs]);

  const fetchReports = async () => {
    if (!profile?.id) return;
    try {
      setReportsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('id, property_name, report_type, created_at, storage_path')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      setReports(data || []);
    } catch (err) { console.error('Error fetching reports FULL:', JSON.stringify(err, null, 2)); }
    finally { setReportsLoading(false); }
  };

  const fetchJobEvents = async (jobIds) => {
    if (!jobIds || jobIds.length === 0) { setJobEvents({}); return; }
    const eventTypes = ['missing_structured_financials','missing_required_documents','textract_failed','rent_roll_fallback_failed','t12_fallback_failed'];
    const { data, error } = await supabase.from('analysis_artifacts').select('id, job_id, payload, created_at').eq('type', 'worker_event').in('job_id', jobIds).in('payload->>event', eventTypes).order('created_at', { ascending: false });
    if (error) { console.error('Failed to fetch job events:', error); return; }
    const priority = { missing_required_documents: 0, missing_structured_financials: 1, textract_failed: 2, rent_roll_fallback_failed: 3, t12_fallback_failed: 4 };
    const nextEvents = {};
    for (const row of data || []) {
      const eventName = row?.payload?.event;
      if (!eventName) continue;
      const current = nextEvents[row.job_id];
      if (!current || priority[eventName] < priority[current.payload?.event]) { nextEvents[row.job_id] = row; }
    }
    setJobEvents(nextEvents);
  };

  const getNeedsDocumentsWorkerEvent = (jobEventsByJobId, activeJobId) => {
    if (!activeJobId || !jobEventsByJobId) return null;
    const row = jobEventsByJobId[activeJobId];
    const payload = row?.payload || {};
    const eventName = String(payload.event || '');
    const code = String(payload.code || '');
    const isRelevant = row?.type === 'worker_event' || eventName === 'missing_structured_financials' || code === 'NO_STRUCTURED_FINANCIALS';
    if (!isRelevant) return null;
    return { missing: Array.isArray(payload.missing) ? payload.missing : [], detected: Array.isArray(payload.detected) ? payload.detected : [], code: code || null };
  };

  const fetchInProgressJobs = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase.from('analysis_jobs').select('id, property_name, status, created_at, failure_reason').eq('user_id', profile.id)
      .in('status', ['queued','extracting','underwriting','scoring','rendering','pdf_generating','publishing'])
      .order('created_at', { ascending: false }).limit(10);
    if (error) { console.error('Failed to fetch in-progress jobs:', error); return; }
    const rows = data || [];
    setInProgressJobs(rows);
    await fetchJobEvents(rows.map((job) => job.id));
  };

  const fetchRecentJobs = async () => {
    if (!profile?.id) return [];
    const { data, error } = await supabase.from('analysis_jobs').select('id, property_name, report_type, status, created_at').eq('user_id', profile.id)
      .in('status', ['needs_documents','queued','extracting','underwriting','scoring','rendering','pdf_generating','publishing','published','failed'])
      .order('created_at', { ascending: false }).limit(25);
    if (error) { console.error('Failed to fetch recent jobs:', error); return []; }
    const rows = data || [];
    setRecentJobs(rows);
    return rows;
  };

  const fetchEntitlements = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase.from('report_purchases').select('id, product_type').eq('user_id', profile.id).is('consumed_at', null);
    if (error) { console.error('Failed to fetch entitlements:', error); setEntitlements({ screening: null, underwriting: null, error: true }); return; }
    const screeningCount = (data || []).filter((row) => row.product_type === 'screening').length;
    const underwritingCount = (data || []).filter((row) => row.product_type === 'underwriting').length;
    setEntitlements({ screening: screeningCount, underwriting: underwritingCount, error: false });
  };

  const fetchLatestFailedJob = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase.from('analysis_jobs').select('id, property_name, status, created_at, failure_reason, error_message, error_code').eq('user_id', profile.id).eq('status', 'failed').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) { console.error('Failed to fetch failed job:', error); return; }
    setLatestFailedJob(data || null);
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: selectedReportType,
          quantity: 1,
          userId: profile?.id,
          userEmail: user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        console.error('Checkout session error:', data);
        toast({ title: 'Unable to start checkout', description: 'Please try again.', variant: 'destructive' });
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast({ title: 'Unable to start checkout', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const fetchRentRollCoverage = async (targetJobId) => {
    if (!targetJobId) return;
    const { data, error } = await supabase.from('analysis_artifacts').select('payload, created_at').eq('job_id', targetJobId).eq('type', 'rent_roll_parsed').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !data?.payload) { setRentRollCoverage(null); return; }
    const payload = data.payload || {};
    let provided = null;
    if (Array.isArray(payload.units)) provided = payload.units.length;
    else if (typeof payload.unit_count === 'number') provided = payload.unit_count;
    else if (typeof payload.total_units_provided === 'number') provided = payload.total_units_provided;
    let total = null;
    if (typeof payload.total_units === 'number') total = payload.total_units;
    else if (typeof payload.totalUnits === 'number') total = payload.totalUnits;
    else if (typeof payload.property_total_units === 'number') total = payload.property_total_units;
    const percent = provided != null && total != null && total > 0 ? Math.round((provided / total) * 100) : null;
    setRentRollCoverage({ provided, total, percent });
  };

  useEffect(() => {
    const syncEverything = async () => {
      await Promise.all([
        fetchInProgressJobs(),
        fetchLatestFailedJob(),
        fetchEntitlements(),
      ]);
      setAcknowledged(false);
      setAckLocked(false);
      setAckAcceptedAtLocal(null);
    };
    if (profile?.id) syncEverything();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    const timeoutId = window.setTimeout(() => {
      fetchReports();
    }, 1200);
    return () => { window.clearTimeout(timeoutId); };
  }, [profile?.id]);

  useEffect(() => {
    if (recentJobs.length === 0) return;
    const typedJobs = recentJobs.filter((job) => job.report_type === selectedReportType);
    if (typedJobs.length === 0) { if (jobId) setJobId(null); setLockedJobIdForUploads(null); return; }

    const preferredNeedsDocsJob = typedJobs.find((job) => {
      const hasName = String(job?.property_name || '').trim().length > 0;
      return job.status === 'needs_documents' && hasName;
    });

    const preferredJob = preferredNeedsDocsJob || typedJobs[0];

    if (preferredJob?.id && preferredJob.id !== jobId) {
      setJobId(preferredJob.id);
      setLockedJobIdForUploads(preferredJob.id);
    }
  }, [recentJobs, selectedReportType]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get('checkout');
    if (checkout === 'success') { toast({ title: 'Payment received', description: 'Report entitlement added.' }); setCheckoutSuccess(true); }
    else if (checkout === 'cancelled') { toast({ title: 'Payment cancelled', description: 'No charge was made.' }); }
    if (checkout) { url.searchParams.delete('checkout'); window.history.replaceState({}, document.title, url.toString()); }
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    if (!hasActiveProcessingJob) return;
    const intervalId = window.setInterval(() => {
      fetchInProgressJobs();
    }, 60000);
    return () => { window.clearInterval(intervalId); };
  }, [profile?.id, hasActiveProcessingJob]);

  useEffect(() => {
    if (!jobId) { setRentRollCoverage(null); return; }
    return;
  }, [jobId]);

  useEffect(() => {
    if (!profile?.id) return;
    return undefined;
  }, [profile?.id]);

  useEffect(() => { setScopeConfirmed(false); }, [`${uploadedFiles.map((file) => file.docType).sort().join('|')}::${uploadedFiles.length}`]);
  // All the existing computed values and handlers (unchanged)
  const supportingDocTypes = [
    { docType: 'mortgage_statement', label: 'Mortgage Statement' },
    { docType: 'loan_terms',         label: 'Loan Terms / Term Sheet' },
    { docType: 'property_tax',       label: 'Property Tax Bill' },
    { docType: 'appraisal',          label: 'Appraisal' },
    { docType: 'inspection_report',  label: 'Inspection Report' },
    { docType: 'environmental',      label: 'Environmental Report' },
    { docType: 'lease_agreement',    label: 'Lease Agreement' },
    { docType: 'other',              label: 'Other Supporting Document' },
  ];

  const rentRollFiles = useMemo(
    () => uploadedFiles.filter((f) => f.docType === 'rent_roll'),
    [uploadedFiles]
  );
  const t12Files = useMemo(
    () => uploadedFiles.filter((f) => f.docType === 't12' || f.docType === 't12_or_operating_statement'),
    [uploadedFiles]
  );
  const hasRentRoll = rentRollFiles.length > 0;
  const hasT12 = t12Files.length > 0;
  const requiredDocsReady = hasRentRoll && hasT12;
  const hasUnderwritingSupportDocs = useMemo(
    () => uploadedFiles.some((f) => f.docType === 'supporting_documents' || f.docType === 'supporting_documents_ui' || supportingDocTypes.some((t) => t.docType === f.docType)),
    [uploadedFiles]
  );
  const hasRequiredUploads = selectedReportType === 'underwriting' ? requiredDocsReady && hasUnderwritingSupportDocs : requiredDocsReady;
  const preflightDebtTerms = useMemo(() => (
    uploadedFiles.some((f) => {
      if (f.docType !== 'supporting_documents' && f.docType !== 'supporting_documents_ui') return false;
      const n = String(f.original_name || f.file?.name || '').toLowerCase();
      return n.includes('term') || n.includes('debt') || n.includes('loan');
    })
  ), [uploadedFiles]);
  const preflightPropertyTax = useMemo(() => (
    uploadedFiles.some((f) => {
      if (f.docType !== 'supporting_documents' && f.docType !== 'supporting_documents_ui') return false;
      return String(f.original_name || f.file?.name || '').toLowerCase().includes('tax');
    })
  ), [uploadedFiles]);
  const preflightAppraisal = useMemo(() => (
    uploadedFiles.some((f) => {
      if (f.docType !== 'supporting_documents' && f.docType !== 'supporting_documents_ui') return false;
      return String(f.original_name || f.file?.name || '').toLowerCase().includes('appraisal');
    })
  ), [uploadedFiles]);
  const preflightHardMissing = selectedReportType === 'underwriting' && (!hasRentRoll || !hasT12 || !hasUnderwritingSupportDocs);
  const visibleLatestFailedJob = latestFailedJob && !dismissedJobIds.has(String(latestFailedJob.id)) ? latestFailedJob : null;
  const jobFromInProgress = inProgressJobs.find((job) => job.id === jobId) || null;
  const jobFromFailed = visibleLatestFailedJob?.id === jobId ? visibleLatestFailedJob : null;
  const activeJobForRuns = jobFromInProgress || jobFromFailed || inProgressJobs[0] || visibleLatestFailedJob || null;
  const activeNeedsDocumentsEvent = getNeedsDocumentsWorkerEvent(jobEvents, activeJobForRuns?.id || null);
  const showNeedsDocsWarning = Boolean(jobId) && activeJobForRuns?.id === jobId && activeJobForRuns?.status === 'needs_documents' && Boolean(activeNeedsDocumentsEvent);
  const activeFailedReason =
    activeJobForRuns?.failure_reason ||
    activeJobForRuns?.error_message ||
    '';
  const safeName = (s) => String(s || '').replace(/[^\x20-\x7E]/g, '').trim();
  const normalizeDocType = (s) => {
    const dt = String(s || '').toLowerCase().trim();
    if (!dt) return '';
    if (dt === 'supporting' || dt === 'supporting_documents_ui') return 'supporting_documents';
    return dt;
  };

  const extractJobId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value?.job_id === 'string') return value.job_id;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string') return first;
      if (typeof first?.job_id === 'string') return first.job_id;
    }
    return null;
  };
  const formatDocLabel = (label) => {
    const normalized = String(label || '').trim().toLowerCase();
    if (normalized === 't12_or_operating_statement' || normalized === 't12') return 'T12 (Operating Statement)';
    if (normalized === 'rent_roll') return 'Rent Roll';
    if (normalized === 'supporting') return 'Supporting Document';
    return String(label || '').trim() || String(label || '');
  };
  const joinLabels = (labels) => {
    if (!labels || labels.length === 0) return '';
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
  };
  const defaultNeedsDocumentsMessage = 'Action required: Required documents were not recognized. Please upload a T12 (Operating Statement) and a Rent Roll.';
  const needsDocumentsMessage = (() => {
    if (activeJobForRuns?.status !== 'needs_documents') return defaultNeedsDocumentsMessage;
    if (!activeNeedsDocumentsEvent) return defaultNeedsDocumentsMessage;
    const missingRaw = Array.isArray(activeNeedsDocumentsEvent.missing) ? activeNeedsDocumentsEvent.missing : [];
    const detectedRaw = Array.isArray(activeNeedsDocumentsEvent.detected) ? activeNeedsDocumentsEvent.detected : [];
    const missingCanonical = new Set(missingRaw.map((value) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === 't12_or_operating_statement' || normalized === 't12') return 't12';
      if (normalized === 'rent_roll') return 'rent_roll';
      if (normalized === 'supporting') return 'supporting';
      return normalized;
    }));
    const detectedCanonical = detectedRaw.map((value) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === 't12_or_operating_statement' || normalized === 't12') return 't12';
      if (normalized === 'rent_roll') return 'rent_roll';
      if (normalized === 'supporting') return 'supporting';
      return normalized;
    });
    const detectedLabels = detectedRaw.map((value) => formatDocLabel(value)).filter(Boolean);
    const hasDetectedDuplicates = detectedCanonical.length > 1 && detectedCanonical.some((value, idx) => value && detectedCanonical.indexOf(value) !== idx);
    if (hasDetectedDuplicates && detectedLabels.length > 0) return `Action required: Uploaded documents were detected as ${joinLabels(detectedLabels)}. Please upload one T12 (Operating Statement) and one Rent Roll.`;
    const missingT12 = missingCanonical.has('t12');
    const missingRentRoll = missingCanonical.has('rent_roll');
    if (missingT12 && missingRentRoll) return 'Action required: Uploaded documents were not recognized as a T12 (Operating Statement) and Rent Roll. Please re-upload both documents.';
    if (missingT12) { const s = detectedLabels.length > 0 ? ` Detected: ${joinLabels(detectedLabels)}.` : ''; return `Action required: T12 (Operating Statement) was not recognized.${s} Please upload a valid T12 (Operating Statement).`; }
    if (missingRentRoll) { const s = detectedLabels.length > 0 ? ` Detected: ${joinLabels(detectedLabels)}.` : ''; return `Action required: Rent Roll was not recognized.${s} Please upload a valid Rent Roll.`; }
    return defaultNeedsDocumentsMessage;
  })();
  const availableReportsCount = entitlements.error ? 0 : Number(entitlements[selectedReportType] ?? 0);
  const hasAvailableReport = availableReportsCount >= 1;
  const step2Locked = !propertyName.trim();
  const step3Locked = !propertyName.trim() || !hasAvailableReport || !hasRequiredUploads || !acknowledged;
  const policyText = 'InvestorIQ produces document-based underwriting only, does not provide investment or appraisal advice, and will disclose any missing or degraded inputs in the final report. Analysis outputs are generated strictly from the documents provided. No assumptions or gap-filling are performed.';
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
      const res = await fetch('/api/legal-acceptance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: profile.id, policyTextHash }) });
      if (!res.ok) { console.error('Legal acceptance API failed:', await res.text()); return { ok: false }; }
      const data = await res.json().catch(() => ({}));
      const acceptedAt = data?.accepted_at || data?.acceptedAt || null;
      return { ok: true, acceptedAt };
    } catch (err) { console.error('Legal acceptance error:', err); return false; }
  };
  const fetchLegalAcceptance = async () => {
    if (!profile?.id) return null;
    const policyTextHash = await computePolicyTextHash();
    try {
      const params = new URLSearchParams({ userId: profile.id, policyTextHash });
      const res = await fetch(`/api/legal-acceptance?${params.toString()}`);
      if (!res.ok) { console.error('Legal acceptance read failed:', await res.text()); return null; }
      const data = await res.json().catch(() => ({}));
      return data?.accepted_at || data?.acceptedAt || null;
    } catch (err) { console.error('Legal acceptance read error:', err); return null; }
  };
  const formatAcceptedAtLocal = (value) => {
    if (!value) return '';
    const acceptedDate = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(acceptedDate.getTime())) return '';
    return acceptedDate.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  const handleUploadSuccess = async () => {
    if (!profile?.id) return;
    toast({ title: 'Uploads received', description: 'Documents are stored and ready for review.' });
    await fetchProfile(profile.id);
  };
  const handleUpload = async (e, slotDocType) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const allowedExt = new Set(['pdf','doc','docx','xls','xlsx','csv','ppt','pptx','jpg','jpeg','png','txt']);
    const blockedExt = new Set(['exe','msi','bat','cmd','com','scr','pif','cpl','jar','js','jse','vbs','vbe','ps1','psm1','psd1','sh','bash','zsh','py','rb','php','pl','dll','sys','lnk']);
    const getExt = (name) => { const base = (name || '').trim().toLowerCase(); const lastDot = base.lastIndexOf('.'); if (lastDot === -1) return ''; return base.slice(lastDot + 1); };
    const blocked = [];
    const invalid = [];
    const valid = [];
    for (const f of files) {
      const ext = getExt(f.name);
      if (!ext) { invalid.push(f.name || '(unnamed file)'); continue; }
      if (blockedExt.has(ext)) { blocked.push(f.name); continue; }
      if (!allowedExt.has(ext)) { invalid.push(f.name); continue; }
      valid.push(f);
    }
    if (blocked.length > 0) { toast({ title: 'File blocked', description: `${blocked.join(', ')} cannot be uploaded.`, variant: 'destructive' }); }
    if (invalid.length > 0) { toast({ title: 'Unsupported file type', description: `${invalid.join(', ')} is not supported.`, variant: 'destructive' }); }
    if (valid.length === 0) return;
    const newEntries = valid.map((file) => ({ file, docType: slotDocType, original_name: file.name }));
    setUploadedFiles((prev) => {
      const isExclusive = slotDocType === 'rent_roll' || slotDocType === 't12' || slotDocType === 't12_or_operating_statement';
      if (isExclusive) { const filtered = prev.filter((item) => item.docType !== slotDocType); return [...filtered, ...newEntries]; }
      return [...prev, ...newEntries];
    });
  };

  const handleAnalyze = async () => {
    if (analyzeInFlightRef.current) return;
    analyzeInFlightRef.current = true;
    const preRunEntitlementCount = entitlements[selectedReportType] ?? 0;
    try {
      setLoading(true);
      if (!profile?.id) { toast({ title: 'Not authenticated', description: 'Please log in.', variant: 'destructive' }); setLoading(false); analyzeInFlightRef.current = false; return; }
      if (!acknowledged) { toast({ title: 'Acknowledgement required', description: 'Please acknowledge the disclosures before generating.', variant: 'destructive' }); setLoading(false); analyzeInFlightRef.current = false; return; }
      const effectivePropertyName = propertyNameRef.current.trim();
      if (!effectivePropertyName) { toast({ title: 'Property name required', variant: 'destructive' }); setLoading(false); analyzeInFlightRef.current = false; return; }
      const rentRolls = uploadedFiles.filter((f) => f.docType === 'rent_roll');
      const t12s = uploadedFiles.filter((f) => f.docType === 't12' || f.docType === 't12_or_operating_statement');
      if (rentRolls.length === 0 || t12s.length === 0) { toast({ title: 'Required documents missing', description: 'Upload a Rent Roll and T12 to proceed.', variant: 'destructive' }); setLoading(false); analyzeInFlightRef.current = false; return; }
      if (selectedReportType === 'underwriting' && !hasUnderwritingSupportDocs) { toast({ title: 'Supporting documents required', description: 'Underwriting reports require at least one supporting document.', variant: 'destructive' }); setLoading(false); analyzeInFlightRef.current = false; return; }

      const batchId = stagedBatchId || crypto.randomUUID();
      if (!stagedBatchId) setStagedBatchId(batchId);

      const allFiles = [...rentRolls, ...t12s, ...uploadedFiles.filter((f) => f.docType !== 'rent_roll' && f.docType !== 't12' && f.docType !== 't12_or_operating_statement')];

      const stagedFiles = [];
      for (const entry of allFiles) {
        const { file, docType } = entry;
        const ext = file.name.split('.').pop() || 'bin';
        const normalizedDocType = normalizeDocType(docType);
        const safeOriginalName = safeName(file.name);
        const storagePath = `staged/${profile.id}/${batchId}/${normalizedDocType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('staged_uploads').upload(storagePath, file, { upsert: false });
        if (uploadError) { toast({ title: 'Upload failed', description: `${file.name}: ${uploadError.message}`, variant: 'destructive' }); setLoading(false); analyzeInFlightRef.current = false; return; }
        stagedFiles.push({
          storage_path: storagePath,
          original_name: safeOriginalName,
          content_type: file.type || 'application/octet-stream',
          size: file.size,
          doc_type: normalizedDocType,
        });
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('consume_purchase_and_create_job', {
        p_report_type: selectedReportType,
        p_job_payload: { property_name: effectivePropertyName },
        p_staged_files: stagedFiles,
      });

      if (rpcError) { toast({ title: 'Unable to start analysis', description: rpcError.message, variant: 'destructive' }); setLoading(false); analyzeInFlightRef.current = false; return; }
      const newJobId = extractJobId(rpcData);
      if (!newJobId) {
        console.error('consume_purchase_and_create_job returned unexpected shape:', rpcData);
        toast({ title: 'Unable to start analysis', description: 'Job id not returned.', variant: 'destructive' });
        setLoading(false);
        analyzeInFlightRef.current = false;
        return;
      }
      setJobId(newJobId);

      const { data: queueData, error: queueErr } = await supabase.rpc('queue_job_for_processing', { p_job_id: newJobId });
      if (queueErr && !String(queueErr.message || '').includes('status=queued')) {
        toast({ title: 'Unable to start analysis', description: `queue_job_for_processing: ${queueErr.message}`, variant: 'destructive' });
        setLoading(false);
        return;
      }
      toast({ title: 'Report queued', description: 'Your report has started. You may safely close this page and return later.' });
      propertyNameRef.current = '';
      setPropertyName('');
      if (propertyInputRef.current) propertyInputRef.current.value = '';
      setUploadedFiles([]);
      setAcknowledged(false);
      setAckLocked(false);
      setAckAcceptedAtLocal(null);
      setStagedBatchId(null);
      setTimeout(() => {
        Promise.all([
          fetchInProgressJobs(),
          fetchReports(),
          fetchEntitlements(),
        ]);
      }, 250);
    } catch (error) {
      console.error('Queue Error FULL:', error, error?.stack);
      await fetchEntitlements();
      const postRunEntitlementCount = entitlements[selectedReportType] ?? 0;
      const creditRestored = postRunEntitlementCount > preRunEntitlementCount;
      toast({ title: 'Unable to queue report', description: `${error.message || 'An error occurred.'}${creditRestored ? ' Credit restored.' : ''}`, variant: 'destructive' });
    } finally { setLoading(false); analyzeInFlightRef.current = false; }
  };

  // RENDER
  if (DASHBOARD_DIAG_MINIMAL) {
    return (
      <>
        <Helmet>
          <title>InvestorIQ - Dashboard</title>
          <meta name="description" content="Upload property documents and generate institutional-grade underwriting reports." />
        </Helmet>

        <div style={{ minHeight: '100vh', background: T.warm, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position:'absolute', top:0, bottom:0, left:40, width:1, background:'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 20%, rgba(201,168,76,0.4) 80%, transparent 100%)', pointerEvents:'none' }} />

            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px 36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}
            >
              <div>
                <p style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:'rgba(201,168,76,0.45)', marginBottom:8 }}>
                  InvestorIQ - Dashboard
                </p>
                <h1 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:'clamp(26px, 3.5vw, 36px)', fontWeight:500, letterSpacing:'-0.02em', color:'#FFFFFF', lineHeight:1.05, marginBottom:6 }}>
                  Welcome, {profile?.full_name || 'Investor'}.
                </h1>
                <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:300, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                  Normal dashboard content is temporarily bypassed to isolate whether the freeze is caused by Dashboard-local rendering or broader authenticated-session behavior.
                </p>
              </div>
              <GhostBtn
                onClick={handleDiagnosticSignOut}
                style={{ borderColor:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.45)', alignSelf:'flex-end' }}
              >
                Log Out
              </GhostBtn>
            </motion.div>
          </div>

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 48px 64px' }}>
            <div style={{ ...sectionCard, maxWidth: 760 }}>
              <label style={{ ...labelMono, display:'block', marginBottom:8 }}>
                Property Name or Address
              </label>
              <input
                ref={propertyInputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue={propertyName}
                onChange={(e) => { propertyNameRef.current = e.target.value; }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextValue = propertyNameRef.current.trim();
                    if (nextValue !== propertyName) setPropertyName(nextValue);
                  }
                }}
                placeholder="e.g. 4200 Commerce Drive, Austin TX"
                style={{ width:'100%', background:T.warm, border:`1px solid ${T.hairlineMid}`, padding:'14px 16px', fontFamily:"'DM Sans', sans-serif", fontSize:14, fontWeight:300, color:T.ink, outline:'none', boxSizing:'border-box' }}
                onBlur={(e)  => {
                  propertyNameRef.current = e.target.value;
                  const nextValue = e.target.value.trim();
                  if (nextValue !== propertyName) setPropertyName(nextValue);
                  e.target.style.borderColor = T.hairlineMid;
                }}
              />
            </div>

            <div style={{ ...sectionCard, marginTop:8 }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:8 }}>
                <div>
                  <p style={stepEyebrow}>Generated Reports</p>
                  <span style={stepTitle}>Report history</span>
                </div>
                <GhostBtn onClick={fetchReports}>Refresh</GhostBtn>
              </div>

              {reportsLoading ? (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 0' }}>
                  <Loader2 style={{ width:16, height:16, color:T.gold, animation:'spin 1s linear infinite' }} />
                  <span style={{ ...bodySmall, fontSize:12 }}>Loading reports...</span>
                </div>
              ) : reports.length === 0 ? (
                <div style={{ padding:'24px 0', textAlign:'center' }}>
                  <span style={{ ...bodySmall, fontSize:13, color:T.ink4 }}>No reports generated yet. Complete steps 1-3 above to generate your first report.</span>
                </div>
              ) : (
                <div style={{ padding:'24px 0' }}>
                  <span style={{ ...bodySmall, fontSize:13, color:T.ink3 }}>Reports loaded successfully. Table rendering is temporarily bypassed for freeze isolation. {reports.length} reports loaded.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <Helmet>
        <title>InvestorIQ - Dashboard</title>
        <meta name="description" content="Upload property documents and generate institutional-grade underwriting reports." />
      </Helmet>

      <div style={{ minHeight: '100vh', background: T.warm, fontFamily: "'DM Sans', sans-serif" }}>

        {/* PAGE HEADER */}
        <div style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>
          {/* Vertical thread */}
          <div style={{ position:'absolute', top:0, bottom:0, left:40, width:1, background:'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 20%, rgba(201,168,76,0.4) 80%, transparent 100%)', pointerEvents:'none' }} />

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px 36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}
          >
            <div>
              <p style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:'rgba(201,168,76,0.45)', marginBottom:8 }}>
                InvestorIQ - Dashboard
              </p>
              <h1 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:'clamp(26px, 3.5vw, 36px)', fontWeight:500, letterSpacing:'-0.02em', color:'#FFFFFF', lineHeight:1.05, marginBottom:6 }}>
                Welcome, {profile?.full_name || 'Investor'}.
              </h1>
              <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:300, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                Upload your documents to generate an institutional underwriting report.
              </p>
            </div>
            <GhostBtn
              onClick={() => window.location.reload()}
              style={{ borderColor:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.45)', alignSelf:'flex-end' }}
            >
              Reload
            </GhostBtn>
          </motion.div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 48px 64px' }}>

          {/* Non-refundable notice */}
          <div style={{ ...labelMono, marginBottom: 16 }}>
            Reports are property-specific and non-refundable once generation begins.
          </div>

          {/* Checkout success */}
          {checkoutSuccess && (
            <NoticeBox type="success">
              <strong style={{ fontWeight: 500 }}>Payment received.</strong> Report credits added to your account. Upload documents below to begin.
              <br />
              <button
                type="button"
                onClick={() => { const t = document.getElementById('upload-section'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                style={{ ...labelMono, color: T.okGreen, background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}
              >
                Jump to upload →
              </button>
            </NoticeBox>
          )}

          {/* Failed jobs */}
          {failedJobsForDisplay.map((job) => (
            <NoticeBox key={job.id} type="error">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div>
                  <strong style={{ fontWeight:500 }}>Generation failed</strong> - {job.property_name || 'Unknown property'}
                  {job.failure_reason && <div style={{ marginTop:4 }}>{job.failure_reason}</div>}
                </div>
                <button type="button" onClick={() => dismissJob(job.id)} style={{ ...labelMono, color:T.errorRed, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>Dismiss</button>
              </div>
            </NoticeBox>
          ))}

          {/* Active jobs */}
          {visibleInProgressJobs.length > 0 && (
            <div style={{ ...sectionCard, marginBottom: 16 }}>
              <p style={stepEyebrow}>Active Jobs</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {visibleInProgressJobs.map((job) => (
                  <div key={job.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${T.hairline}`, flexWrap:'wrap', gap:8 }}>
                    <div>
                      <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:400, color:T.ink2 }}>{String(job.property_name || '').trim() || (job.id === jobId ? propertyName.trim() : '') || 'Unnamed property'}</span>
                      <span style={{ ...labelMono, marginLeft:10 }}>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <StatusBadge status={job.status} />
                      <button type="button" onClick={() => dismissJob(job.id)} style={{ ...labelMono, color:T.ink4, background:'none', border:'none', cursor:'pointer' }}>Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Needs documents warning */}
          {showNeedsDocsWarning && (
            <NoticeBox type="warning">{needsDocumentsMessage}</NoticeBox>
          )}

          {/* STEP 1 */}
          <div style={sectionCard}>
            <p style={stepEyebrow}>Step 01</p>
            <span style={stepTitle}>Report type and availability</span>
            <span style={stepSub}>Select report type and confirm an available credit.</span>

            <div style={{ ...hairlineRule, marginTop: 20 }} />

            {/* Report type selector */}
            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
              {['screening','underwriting'].map((type) => {
                const active = selectedReportType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedReportType(type)}
                    style={{
                      fontFamily:   "'DM Mono', monospace",
                      fontSize:     10,
                      letterSpacing:'0.14em',
                      textTransform:'uppercase',
                      fontWeight:   500,
                      padding:      '9px 20px',
                      background:   active ? T.green : T.white,
                      color:        active ? T.gold : T.ink3,
                      border:       `1px solid ${active ? T.green : T.hairlineMid}`,
                      cursor:       'pointer',
                      transition:   'all 0.15s',
                    }}
                  >
                    {type === 'screening' ? 'Screening Report' : 'Underwriting Report'}
                  </button>
                );
              })}
            </div>

            {/* Report type descriptor */}
            {selectedReportType === 'screening' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:20 }}>
                <span style={{ ...bodySmall, fontSize:12 }}>T12 + Rent Roll only</span>
                <span style={{ ...bodySmall, fontSize:12 }}>For initial investment review.</span>
                <span style={{ ...bodySmall, fontSize:12 }}>No charts. No projections.</span>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:20 }}>
                <span style={{ ...bodySmall, fontSize:12 }}>T12 + Rent Roll + supporting due diligence documents</span>
                <span style={{ ...bodySmall, fontSize:12 }}>Full institutional underwriting artifact.</span>
                <span style={{ ...bodySmall, fontSize:12 }}>Investment committee-ready depth.</span>
              </div>
            )}

            {/* Entitlement status */}
            {entitlements.error ? (
              <NoticeBox type="error">Unable to confirm report availability. Refresh to retry.</NoticeBox>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:hasAvailableReport ? T.okBg : T.errorBg, border:`1px solid ${hasAvailableReport ? T.okBorder : T.errorBorder}`, flexWrap:'wrap', gap:10 }}>
                <div>
                  <span style={{ ...labelMono, color: hasAvailableReport ? T.okGreen : T.errorRed }}>
                    {selectedReportType === 'screening' ? 'Screening' : 'Underwriting'} credits available
                  </span>
                  <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, fontWeight:500, color: hasAvailableReport ? T.okGreen : T.errorRed, lineHeight:1, marginTop:4 }}>
                    {availableReportsCount}
                  </div>
                </div>
                <PrimaryBtn onClick={handleCheckout} loading={checkoutLoading}>
                  Purchase Report
                </PrimaryBtn>
              </div>
            )}
          </div>

          {/* STEP 2 */}
          <div
            id="upload-section"
            style={{ ...sectionCard, opacity: step2Locked && !hasAvailableReport ? 0.55 : 1, transition:'opacity 0.2s' }}
          >
            <p style={stepEyebrow}>Step 02</p>
            <span style={stepTitle}>Property and documents</span>
            <span style={stepSub}>Enter the property name and upload required documents.</span>

            <div style={hairlineRule} />

            {/* Property name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelMono, display:'block', marginBottom:8 }}>Property Name or Address</label>
              <input
                ref={propertyInputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue={propertyName}
                onChange={(e) => { propertyNameRef.current = e.target.value; }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextValue = propertyNameRef.current.trim();
                    if (nextValue !== propertyName) setPropertyName(nextValue);
                  }
                }}
                placeholder="e.g. 4200 Commerce Drive, Austin TX"
                style={{
                  width:        '100%',
                  fontFamily:   "'DM Sans', sans-serif",
                  fontSize:     13,
                  fontWeight:   300,
                  color:        T.ink,
                  background:   T.white,
                  border:       `1px solid ${T.hairlineMid}`,
                  padding:      '10px 14px',
                  outline:      'none',
                  boxSizing:    'border-box',
                }}
                onBlur={(e)  => {
                  propertyNameRef.current = e.target.value;
                  const nextValue = e.target.value.trim();
                  if (nextValue !== propertyName) setPropertyName(nextValue);
                  e.target.style.borderColor = T.hairlineMid;
                }}
              />
            </div>

            {/* Acknowledgement */}
            <div style={{ padding:'14px 16px', background:acknowledged ? T.okBg : T.warm, border:`1px solid ${acknowledged ? T.okBorder : T.hairlineMid}`, marginBottom:20 }}>
              <label style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer' }}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  disabled={ackSubmitting}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    if (ackSubmitting) return;
                    if (!next) { setAcknowledged(false); setAckLocked(false); setAckAcceptedAtLocal(null); return; }
                    setAckSubmitting(true);
                    const accepted = await recordLegalAcceptance();
                    if (!accepted?.ok) {
                      toast({ title: 'Unable to record acknowledgement', description: 'Please try again.', variant: 'destructive' });
                      setAcknowledged(false); setAckLocked(false); setAckSubmitting(false); return;
                    }
                    const acceptedAtValue = accepted?.acceptedAt ? new Date(accepted.acceptedAt) : new Date();
                    setAcknowledged(true); setAckLocked(false); setAckAcceptedAtLocal(acceptedAtValue); setAckSubmitting(false);
                  }}
                  style={{ marginTop:2, flexShrink:0 }}
                />
                <div>
                  <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:400, color:T.ink2, lineHeight:1.6 }}>
                    I acknowledge that InvestorIQ provides document-based analysis only, makes no assumptions, and discloses missing inputs as DATA NOT AVAILABLE. Refunds are not available once report generation begins.
                  </div>
                  <div style={{ ...labelMono, marginTop:6, color:T.ink4 }}>
                    Disclosures v2026-01-14{ackAcceptedAtLocal ? ` - Accepted ${formatAcceptedAtLocal(ackAcceptedAtLocal)}` : ''}
                  </div>
                </div>
              </label>
            </div>

            {/* Upload slots */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, marginBottom:16 }}>

              {/* Rent Roll */}
              <div style={{ padding:'16px', border:`1px solid ${hasRentRoll ? T.okBorder : T.hairline}`, background:hasRentRoll ? T.okBg : T.white }}>
                <div style={{ ...labelMono, marginBottom:6 }}>Required</div>
                <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:500, color:T.ink, marginBottom:12 }}>Rent Roll</div>
                <PrimaryBtn
                  disabled={!hasAvailableReport}
                  onClick={async () => {
                    if (!hasAvailableReport) { toast({ title:'No reports available', description:'Purchase a report to upload documents.', variant:'destructive' }); return; }
                    if (!acknowledged) { toast({ title:'Acknowledgement required', description:'Please acknowledge the disclosures before uploading.', variant:'destructive' }); return; }
                    document.getElementById('rentRollInput')?.click();
                  }}
                  style={{ width:'100%', justifyContent:'center', marginBottom:10 }}
                >
                  <UploadCloud style={{ width:12, height:12 }} /> Upload Rent Roll
                </PrimaryBtn>
                {rentRollFiles.length === 0
                  ? <div style={{ ...bodySmall, fontSize:11, color:T.ink4 }}>No file uploaded.</div>
                  : rentRollFiles.map((entry, idx) => (
                    <FileRow key={idx} name={safeName(entry.file.name)} size={entry.file.size} onRemove={() => setUploadedFiles((prev) => prev.filter((item) => !(item.docType === 'rent_roll' && item.file?.name === entry.file.name && item.file?.size === entry.file.size)))} />
                  ))
                }
              </div>

              {/* T12 */}
              <div style={{ padding:'16px', border:`1px solid ${hasT12 ? T.okBorder : T.hairline}`, background:hasT12 ? T.okBg : T.white }}>
                <div style={{ ...labelMono, marginBottom:6 }}>Required</div>
                <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:500, color:T.ink, marginBottom:12 }}>T12 (Operating Statement)</div>
                <PrimaryBtn
                  disabled={!hasAvailableReport}
                  onClick={async () => {
                    if (!hasAvailableReport) { toast({ title:'No reports available', description:'Purchase a report to upload documents.', variant:'destructive' }); return; }
                    if (!acknowledged) { toast({ title:'Acknowledgement required', description:'Please acknowledge the disclosures before uploading.', variant:'destructive' }); return; }
                    document.getElementById('t12Input')?.click();
                  }}
                  style={{ width:'100%', justifyContent:'center', marginBottom:10 }}
                >
                  <UploadCloud style={{ width:12, height:12 }} /> Upload T12
                </PrimaryBtn>
                {t12Files.length === 0
                  ? <div style={{ ...bodySmall, fontSize:11, color:T.ink4 }}>No file uploaded.</div>
                  : t12Files.map((entry, idx) => (
                    <FileRow key={idx} name={safeName(entry.file.name)} size={entry.file.size} onRemove={() => setUploadedFiles((prev) => prev.filter((item) => !(item.docType === 't12' && item.file?.name === entry.file.name && item.file?.size === entry.file.size)))} />
                  ))
                }
              </div>

            </div>

            {/* Supporting docs - underwriting only */}
            {selectedReportType === 'underwriting' && (
              <div style={{ marginBottom:16 }}>
                {!requiredDocsReady && (
                  <div style={{ ...bodySmall, fontSize:11, marginBottom:8, color:T.ink4 }}>Upload Rent Roll and T12 to unlock supporting documents.</div>
                )}
                <div style={{ padding:'16px', border:`1px solid ${hasUnderwritingSupportDocs ? T.okBorder : T.hairline}`, background:T.white }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:500, color:T.ink, marginBottom:3 }}>Supporting Documents</div>
                      <div style={{ ...bodySmall, fontSize:11 }}>Mortgage statements, loan terms, appraisals, tax bills, or other supporting documents.</div>
                    </div>
                    <PrimaryBtn
                      disabled={!hasAvailableReport || !requiredDocsReady}
                      onClick={async () => {
                        if (!hasAvailableReport) { toast({ title:'No reports available', description:'Purchase a report to upload documents.', variant:'destructive' }); return; }
                        if (!requiredDocsReady) return;
                        if (!acknowledged) { toast({ title:'Acknowledgement required', variant:'destructive' }); return; }
                        document.getElementById('supporting-docs-input')?.click();
                      }}
                      style={{ flexShrink:0 }}
                    >
                      <UploadCloud style={{ width:12, height:12 }} /> Upload
                    </PrimaryBtn>
                  </div>
                  {(() => {
                    const supportingFiles = uploadedFiles.filter((f) => f.docType === 'supporting_documents' || f.docType === 'supporting_documents_ui' || supportingDocTypes.some((t) => t.docType === f.docType));
                    return supportingFiles.length === 0
                      ? <div style={{ ...bodySmall, fontSize:11, color:T.ink4 }}>No files uploaded.</div>
                      : supportingFiles.map((entry, idx) => (
                        <FileRow key={idx} name={safeName(entry.file.name)} size={entry.file.size} onRemove={() => setUploadedFiles((prev) => prev.filter((item) => !(item.docType === entry.docType && item.file?.name === entry.file.name && item.file?.size === entry.file.size)))} />
                      ));
                  })()}
                </div>

                {/* Preflight */}
                <div style={{ padding:'14px 16px', background:T.warm, border:`1px solid ${T.hairline}`, marginTop:10 }}>
                  <div style={{ ...labelMono, marginBottom:10 }}>Document preflight</div>
                  {[
                    { label:'Rent Roll', val: hasRentRoll ? 'Present' : 'Missing', ok: hasRentRoll, required: true },
                    { label:'T12 (Operating Statement)', val: hasT12 ? 'Present' : 'Missing', ok: hasT12, required: true },
                    { label:'Supporting Docs', val: hasUnderwritingSupportDocs ? 'Present' : 'Missing', ok: hasUnderwritingSupportDocs, required: true },
                    { label:'Debt Terms', val: preflightDebtTerms ? 'Found' : 'Recommended', ok: preflightDebtTerms, required: false },
                    { label:'Property Tax', val: preflightPropertyTax ? 'Found' : 'Optional', ok: preflightPropertyTax, required: false },
                    { label:'Appraisal', val: preflightAppraisal ? 'Found' : 'Optional', ok: preflightAppraisal, required: false },
                  ].map(({ label, val, ok, required }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'4px 0', borderBottom:`1px solid ${T.hairline}` }}>
                      <span style={{ ...bodySmall, fontSize:12 }}>{label}</span>
                      <span style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color: ok ? T.okGreen : required ? T.errorRed : T.warnAmber }}>{val}</span>
                    </div>
                  ))}
                  {preflightHardMissing && <div style={{ ...bodySmall, fontSize:12, color:T.errorRed, fontWeight:500, marginTop:10 }}>Missing required documents. Generation is blocked until all required items are uploaded.</div>}
                  {!preflightHardMissing && !preflightDebtTerms && <div style={{ ...bodySmall, fontSize:12, color:T.warnAmber, marginTop:10 }}>Some optional inputs are missing. Related sections may be omitted and shown as DATA NOT AVAILABLE.</div>}
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input id="rentRollInput" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt" onChange={(e) => handleUpload(e, 'rent_roll')} className="hidden" style={{ display:'none' }} />
            <input id="t12Input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt" onChange={(e) => handleUpload(e, 't12')} className="hidden" style={{ display:'none' }} />
            <input id="supporting-docs-input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt" onChange={(e) => handleUpload(e, 'supporting_documents')} className="hidden" style={{ display:'none' }} />
          </div>

          {/* STEP 3 */}
          <div style={{ ...sectionCard, opacity: step3Locked ? 0.55 : 1, transition:'opacity 0.2s' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div>
                <p style={stepEyebrow}>Step 03</p>
                <span style={stepTitle}>Generate report</span>
                <span style={{ ...stepSub, display:'block' }}>
                  {showNeedsDocsWarning
                    ? needsDocumentsMessage
                    : activeJobForRuns?.status === 'queued' ? 'Queued for processing.'
                    : ['extracting','underwriting','scoring','rendering','pdf_generating','publishing'].includes(activeJobForRuns?.status) ? 'Processing in progress.'
                    : activeJobForRuns?.status === 'published' ? 'Report complete. Available below.'
                    : activeJobForRuns?.status === 'failed' ? (activeFailedReason || 'Previous job failed. Ready to retry.')
                    : 'Complete steps 1 and 2 to generate your report.'}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                {activeJobForRuns?.status === 'failed' && activeJobForRuns?.id && (
                  <button
                    type="button"
                    onClick={() => dismissJob(activeJobForRuns.id)}
                    style={{ ...labelMono, color:T.errorRed, background:'none', border:'none', cursor:'pointer' }}
                  >
                    Dismiss
                  </button>
                )}
                {step3Locked && <span style={{ ...labelMono, color:T.ink4 }}>Locked</span>}
              </div>
            </div>

            <div style={hairlineRule} />

            <PrimaryBtn
              onClick={handleAnalyze}
              disabled={step3Locked}
              loading={loading}
              style={{ minWidth: 200 }}
            >
              {loading ? 'Processing...' : `Generate ${selectedReportType} report`}
            </PrimaryBtn>

            {activeJobForRuns && (
              <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ ...bodySmall, fontSize:12 }}>{activeJobForRuns.property_name || 'Current job'}</span>
                <StatusBadge status={activeJobForRuns.status} />
              </div>
            )}
          </div>

          {/* REPORTS TABLE */}
          <div style={{ ...sectionCard, marginTop:8 }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:8 }}>
              <div>
                <p style={stepEyebrow}>Generated Reports</p>
                <span style={stepTitle}>Report history</span>
              </div>
              <GhostBtn onClick={fetchReports}>Refresh</GhostBtn>
            </div>

            {reportsLoading ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 0' }}>
                <Loader2 style={{ width:16, height:16, color:T.gold, animation:'spin 1s linear infinite' }} />
                <span style={{ ...bodySmall, fontSize:12 }}>Loading reports...</span>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ padding:'24px 0', textAlign:'center' }}>
                <span style={{ ...bodySmall, fontSize:13, color:T.ink4 }}>No reports generated yet. Complete steps 1-3 above to generate your first report.</span>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {reports.map((report) => (
                  <div key={report.id} style={{ border:`1px solid ${T.hairline}`, background:T.white, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:10 }}>
                      <div style={{ minWidth:0, flex:'1 1 260px' }}>
                        <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:400, color:T.ink2, marginBottom:4 }}>
                          {report.property_name || '-'}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:T.ink3 }}>{report.report_type || '-'}</span>
                          <span style={{ ...bodySmall, fontSize:12, color:T.ink4 }}>
                            {report.created_at ? new Date(report.created_at).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={report.status || 'published'} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      {report.storage_path && (
                        <button
                          type="button"
                          onClick={async () => {
                            const { data, error } = await supabase.storage.from('generated_reports').createSignedUrl(report.storage_path, 300);
                            if (error || !data?.signedUrl) { toast({ title:'Download failed', description: error?.message || 'Unable to generate link.', variant:'destructive' }); return; }
                            window.open(data.signedUrl, '_blank');
                          }}
                          style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.goldDark, background:'none', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, padding:0 }}
                        >
                          <FileDown style={{ width:11, height:11 }} /> Download
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setIssueReport(report); setIssueModalOpen(true); }}
                        style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.ink4, background:'none', border:'none', cursor:'pointer', padding:0 }}
                      >
                        Issue
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Permanently remove this report?')) {
                            try {
                              await supabase.storage.from('generated_reports').remove([report.storage_path]);
                              await supabase.from('reports').delete().eq('id', report.id);
                              toast({ title:'Report deleted' });
                              fetchReports();
                            } catch (err) { console.error(err); }
                          }
                        }}
                        style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.errorRed, background:'none', border:'none', cursor:'pointer', padding:0 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.88)' }}>
          <div style={{ background:T.white, border:`1px solid ${T.hairline}`, padding:'40px 48px', maxWidth:360, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Loader2 style={{ width:28, height:28, color:T.green, animation:'spin 1s linear infinite', marginBottom:20 }} />
            <p style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:18, fontWeight:500, color:T.ink, marginBottom:8 }}>Underwriting in Progress</p>
            <p style={{ ...bodySmall, fontSize:13 }}>InvestorIQ is analyzing your documents and generating your institutional-grade report.</p>
            <div style={{ width:'100%', height:2, background:T.hairline, marginTop:20, overflow:'hidden' }}>
              <div style={{ height:'100%', background:T.gold, width:'40%', animation:'progress 2s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* ISSUE MODAL */}
      {issueModalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:120, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(12,12,12,0.4)' }}>
          <div style={{ width:'100%', maxWidth:520, background:T.white, border:`1px solid ${T.hairline}`, padding:'32px', margin:'0 16px' }}>
            <p style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:18, fontWeight:500, color:T.ink, marginBottom:6 }}>Report an issue</p>
            <p style={{ ...bodySmall, fontSize:12, marginBottom:20 }}>Provide a brief description and an optional attachment.</p>

            <label style={{ ...labelMono, display:'block', marginBottom:6 }}>What went wrong?</label>
            <textarea
              value={issueMessage}
              onChange={(e) => setIssueMessage(e.target.value)}
              maxLength={1000}
              placeholder="Describe the issue you encountered."
              style={{ width:'100%', minHeight:100, fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:300, color:T.ink, background:T.warm, border:`1px solid ${T.hairlineMid}`, padding:'10px 12px', outline:'none', resize:'vertical', boxSizing:'border-box', marginBottom:16 }}
              onFocus={(e) => { e.target.style.borderColor = T.gold; }}
              onBlur={(e)  => { e.target.style.borderColor = T.hairlineMid; }}
            />

            <label style={{ ...labelMono, display:'block', marginBottom:6 }}>Attachment (optional)</label>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setIssueFile(e.target.files?.[0] || null)} style={{ ...bodySmall, fontSize:12, marginBottom:20, display:'block' }} />

            <div style={{ ...bodySmall, fontSize:11, color:T.ink4, marginBottom:16 }}>
              Use this option for system or processing issues. InvestorIQ does not revise reports based on missing or unsuitable source documents.
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <GhostBtn onClick={() => { if (issueSubmitting) return; setIssueModalOpen(false); setIssueMessage(''); setIssueFile(null); setIssueReport(null); }}>Cancel</GhostBtn>
              <PrimaryBtn
                loading={issueSubmitting}
                onClick={async () => {
                  const trimmed = issueMessage.trim();
                  if (!trimmed) { toast({ title:'Message required', description:'Please describe the issue.', variant:'destructive' }); return; }
                  if (!profile?.id || !issueReport) { toast({ title:'Submission failed', description:'Please refresh and try again.', variant:'destructive' }); return; }
                  setIssueSubmitting(true);
                  try {
                    let attachmentPath = null;
                    if (issueFile) {
                      const uploadPath = `${profile.id}/${issueReport.job_id}/${Date.now()}-${issueFile.name}`;
                      const { error: uploadErr } = await supabase.storage.from('report-issues').upload(uploadPath, issueFile, { upsert: false });
                      if (uploadErr) { toast({ title:'Submission failed', description:uploadErr.message || 'Attachment upload failed.', variant:'destructive' }); setIssueSubmitting(false); return; }
                      attachmentPath = uploadPath;
                    }
                    const { error: insertErr } = await supabase.from('report_issues').insert({ user_id: profile.id, job_id: issueReport.job_id || issueReport.jobId || null, artifact_id: issueReport.artifact_id || null, message: trimmed, attachment_path: attachmentPath, status: 'open' });
                    if (insertErr) { toast({ title:'Submission failed', description:insertErr.message || 'Unable to submit issue.', variant:'destructive' }); setIssueSubmitting(false); return; }
                    toast({ title:'Issue submitted', description:'We received your message and will review it.' });
                    setIssueModalOpen(false); setIssueMessage(''); setIssueFile(null); setIssueReport(null);
                  } catch (err) {
                    toast({ title:'Submission failed', description:err?.message || 'Unable to submit issue.', variant:'destructive' });
                  } finally { setIssueSubmitting(false); }
                }}
              >
                {issueSubmitting ? 'Submitting...' : 'Submit'}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}

    </>
  );
}





