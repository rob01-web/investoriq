import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  FileText, Loader2, Users, BarChart3, RefreshCcw, Shield,
  AlertTriangle, ChevronDown, ChevronUp, Search, Trash2,
  Eye, RotateCcw, XCircle, Plus, Minus, ExternalLink,
  Activity, DollarSign, Zap, Clock, CheckCircle, Filter,
  Bot, TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

// DESIGN TOKENS
const T = {
  green:       '#0F2318',
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
  okGreen:     '#1A4A22',
  okBg:        '#F2F8F3',
  okBorder:    '#B8D4BC',
  errRed:      '#7A1A1A',
  errBg:       '#FDF4F4',
  errBorder:   '#E8C0C0',
  warnAmber:   '#7A4A00',
  warnBg:      '#FDF8EE',
  warnBorder:  '#E8D4A0',
  infoBg:      '#F0F4FF',
  infoBorder:  '#B8C8F0',
  infoBlue:    '#1A3A7A',
};

const PAGE_SIZE = 20;
const STUCK_THRESHOLD_MINS = 10;

// FONTS
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
`;

// SHARED COMPONENTS
function Card({ children, style = {} }) {
  return (
    <div style={{ background:T.white, border:`1px solid ${T.hairline}`, padding:'24px 28px', marginBottom:10, ...style }}>
      {children}
    </div>
  );
}
function SectionHeader({ eyebrow, title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18, paddingBottom:12, borderBottom:`1px solid ${T.hairline}`, gap:12 }}>
      <div>
        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:T.goldDark, marginBottom:4 }}>{eyebrow}</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:20, fontWeight:500, letterSpacing:'-0.015em', color:T.ink, lineHeight:1.1 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    published:       { bg:T.okBg,    border:T.okBorder,   color:T.okGreen   },
    queued:          { bg:T.warnBg,  border:T.warnBorder,  color:T.warnAmber },
    in_progress:     { bg:T.warnBg,  border:T.warnBorder,  color:T.warnAmber },
    failed:          { bg:T.errBg,   border:T.errBorder,   color:T.errRed    },
    needs_documents: { bg:T.infoBg,  border:T.infoBorder,  color:T.infoBlue  },
    open:            { bg:T.errBg,   border:T.errBorder,   color:T.errRed    },
    reviewing:       { bg:T.warnBg,  border:T.warnBorder,  color:T.warnAmber },
    resolved:        { bg:T.okBg,    border:T.okBorder,    color:T.okGreen   },
    Completed:       { bg:T.okBg,    border:T.okBorder,    color:T.okGreen   },
    Processing:      { bg:T.warnBg,  border:T.warnBorder,  color:T.warnAmber },
    stuck:           { bg:T.errBg,   border:T.errBorder,   color:T.errRed    },
  };
  const s = map[status] || { bg:T.warm, border:T.hairline, color:T.ink4 };
  return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', padding:'2px 8px', background:s.bg, border:`1px solid ${s.border}`, color:s.color, whiteSpace:'nowrap' }}>
      {status || '-'}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    critical: { bg:T.errBg, border:T.errBorder, color:T.errRed },
    high: { bg:T.warnBg, border:T.warnBorder, color:T.warnAmber },
    medium: { bg:T.infoBg, border:T.infoBorder, color:T.infoBlue },
    low: { bg:T.okBg, border:T.okBorder, color:T.okGreen },
    none: { bg:T.warm, border:T.hairline, color:T.ink4 },
  };
  const s = map[String(severity || "none").toLowerCase()] || map.none;
  return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', padding:'2px 8px', background:s.bg, border:`1px solid ${s.border}`, color:s.color, whiteSpace:'nowrap' }}>
      {severity || '-'}
    </span>
  );
}

function StatusPill({ label, tone = 'neutral' }) {
  const styles =
    tone === 'danger' ? { bg:'#FEF2F2', fg:'#B91C1C', border:'#FECACA' } :
    tone === 'warn' ? { bg:'#FFF7ED', fg:'#B45309', border:'#FED7AA' } :
    tone === 'info' ? { bg:'#EFF6FF', fg:'#1D4ED8', border:'#BFDBFE' } :
    tone === 'success' ? { bg:'#F0FDF4', fg:'#15803D', border:'#BBF7D0' } :
    { bg:T.warm, fg:T.ink3, border:T.hairline };
  return (
    <span style={{
      display:'inline-flex',
      alignItems:'center',
      padding:'2px 7px',
      border:`1px solid ${styles.border}`,
      borderRadius:999,
      background:styles.bg,
      color:styles.fg,
      fontFamily:"'DM Mono',monospace",
      fontSize:9,
      letterSpacing:'0.08em',
      textTransform:'uppercase',
      whiteSpace:'nowrap',
    }}>
      {label}
    </span>
  );
}

function AiBadge({ type }) {
  if (!type) return null;
  const label = type === 'both' ? 'AI: T12+RR' : type === 't12' ? 'AI: T12' : 'AI: RR';
  return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.12em', textTransform:'uppercase', padding:'2px 6px', background:'#EDE9FE', border:'1px solid #C4B5FD', color:'#4C1D95', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:3 }}>
      <Bot size={9} /> {label}
    </span>
  );
}

function Btn({ children, onClick, disabled, variant='ghost', style={} }) {
  const [hov, setHov] = useState(false);
  const variants = {
    ghost:   { bg:'transparent',      border:T.hairlineMid, color: hov ? T.ink  : T.ink3,    hbg:'transparent' },
    danger:  { bg: hov ? T.errBg :'transparent', border:T.errBorder,  color:T.errRed,    hbg:T.errBg  },
    success: { bg: hov ? T.okBg  :'transparent', border:T.okBorder,   color:T.okGreen,   hbg:T.okBg   },
    warn:    { bg: hov ? T.warnBg:'transparent', border:T.warnBorder, color:T.warnAmber, hbg:T.warnBg },
    primary: { bg: hov ? T.green :'#0F2318',     border:T.green,      color:T.white,     hbg:T.green  },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', padding:'5px 10px', background:v.bg, color:v.color, border:`1px solid ${v.border}`, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.4:1, transition:'all 0.15s', ...style }}>
      {children}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
      <Search size={11} style={{ position:'absolute', left:9, color:T.ink4, pointerEvents:'none' }} />
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
        style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:300, padding:'7px 10px 7px 28px', border:`1px solid ${T.hairline}`, background:T.warm, color:T.ink, outline:'none', width:220 }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{ background:T.white, border:`1px solid ${T.hairline}`, padding:'16px 20px', borderTop:`3px solid ${accent || T.gold}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:T.ink4 }}>{label}</span>
        {Icon && <Icon size={13} color={accent || T.goldDark} />}
      </div>
      <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:500, color:T.ink, lineHeight:1 }}>{value ?? '-'}</div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:300, color:T.ink4, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(12,12,12,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
        style={{ background:T.white, border:`1px solid ${T.hairlineMid}`, padding:'28px 32px', maxWidth:400, width:'90%' }}>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.ink, marginBottom:20, lineHeight:1.55 }}>{message}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn onClick={onConfirm} variant="danger"><Trash2 size={10} /> Confirm Delete</Btn>
        </div>
      </motion.div>
    </div>
  );
}

// TABLE HELPERS
function TblTh({ children, right }) {
  return (
    <th style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.18em', textTransform:'uppercase', color:T.ink4, padding:'8px 10px', textAlign:right?'right':'left', borderBottom:`1px solid ${T.hairline}`, fontWeight:400, whiteSpace:'nowrap' }}>
      {children}
    </th>
  );
}
function TblTd({ children, mono, right, style={} }) {
  return (
    <td style={{ fontFamily: mono ? "'DM Mono',monospace" : "'DM Sans',sans-serif", fontSize: mono ? 10 : 12, fontWeight:300, color:T.ink2, padding:'9px 10px', borderBottom:`1px solid ${T.hairline}`, textAlign:right?'right':'left', verticalAlign:'top', ...style }}>
      {children}
    </td>
  );
}

// MAIN COMPONENT
export default function AdminDashboard() {
  const { toast } = useToast();
  const [adminRunKey, setAdminRunKey] = useState(
    () => typeof window !== 'undefined' ? localStorage.getItem('ADMIN_RUN_KEY') || '' : ''
  );
  const [authed, setAuthed]           = useState(false);
  const [loading, setLoading]         = useState(false);

  // Command strip
  const [cmdStats, setCmdStats]       = useState(null);
  const [stuckJobs, setStuckJobs]     = useState([]);

  // Reports
  const [reports, setReports]         = useState([]);
  const [rptTotal, setRptTotal]       = useState(0);
  const [rptPage, setRptPage]         = useState(0);
  const [rptSearch, setRptSearch]     = useState('');
  const [rptFilter, setRptFilter]     = useState('all');
  const [rptLoading, setRptLoading]   = useState(false);
  const [expandedRpt, setExpandedRpt] = useState(null);
  const [rptBusy, setRptBusy]         = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Users
  const [users, setUsers]             = useState([]);
  const [userSearch, setUserSearch]   = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [creditBusy, setCreditBusy]   = useState({});

  // Issues
  const [issues, setIssues]           = useState([]);
  const [issueFilter, setIssueFilter] = useState('open');
  const [issuesBusy, setIssuesBusy]   = useState({});
  const [fixQueue, setFixQueue]       = useState([]);
  const [fixQueueLoading, setFixQueueLoading] = useState(false);
  const [fixQueueOpen, setFixQueueOpen] = useState(false);
  const [fixQueueError, setFixQueueError] = useState('');
  const [fixQueueDetailsById, setFixQueueDetailsById] = useState({});
  const [selectedFixQueueJobId, setSelectedFixQueueJobId] = useState(null);
  const [selectedFixQueueTab, setSelectedFixQueueTab] = useState('job');
  const [fixQueueDetailLoading, setFixQueueDetailLoading] = useState(false);
  const [fixQueueDetailError, setFixQueueDetailError] = useState('');
  const [fixQueueActionLoading, setFixQueueActionLoading] = useState('');
  const [fixQueueActionMessage, setFixQueueActionMessage] = useState('');
  const [fixQueueActionError, setFixQueueActionError] = useState('');
  const [userError, setUserError]     = useState('');
  const fixQueueDetailPanelRef = useRef(null);
  const fixQueueForDisplay = useMemo(() => (
    [...fixQueue].sort((a, b) => {
      const statusRank = (item) => String(item?.delivery_gate_status || '').toLowerCase() === 'admin_review_required' ? 0 : 1;
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      const aSeverity = severityOrder[String(a?.highest_severity || 'none').toLowerCase()] ?? 4;
      const bSeverity = severityOrder[String(b?.highest_severity || 'none').toLowerCase()] ?? 4;
      const aTime = new Date(a?.created_at || 0).getTime();
      const bTime = new Date(b?.created_at || 0).getTime();
      return statusRank(a) - statusRank(b) || aSeverity - bSeverity || bTime - aTime;
    })
  ), [fixQueue]);
  const selectedFixQueueItem = useMemo(() => (
    fixQueueForDisplay.find((item) => item.job_id === selectedFixQueueJobId) || null
  ), [fixQueueForDisplay, selectedFixQueueJobId]);
  const selectedFixQueueDetail = useMemo(() => (
    selectedFixQueueJobId ? (fixQueueDetailsById[selectedFixQueueJobId] || null) : null
  ), [fixQueueDetailsById, selectedFixQueueJobId]);

  const searchTimer = useRef(null);

  useEffect(() => {
    if (!selectedFixQueueJobId || !fixQueueDetailPanelRef.current) return;
    fixQueueDetailPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedFixQueueJobId]);

  // AUTH
  async function handleAuth() {
    if (!adminRunKey.trim()) { toast({ title:'Admin key required', variant:'destructive' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/run-eligible-jobs-once', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${adminRunKey.trim()}` },
        body: JSON.stringify({ action:'ping' }),
      });
      if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
      localStorage.setItem('ADMIN_RUN_KEY', adminRunKey.trim());
      setAuthed(true);
      toast({ title:'Access granted' });
    } catch {
      toast({ title:'Invalid admin key', variant:'destructive' });
    } finally { setLoading(false); }
  }

  // COMMAND STRIP
  const fetchCmdStats = useCallback(async () => {
    try {
      // Revenue MTD from report_purchases
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      // Revenue: count consumed purchases MTD  product price
      const { data: purchases } = await supabase
        .from('report_purchases')
        .select('product_type, consumed_at, created_at')
        .not('consumed_at', 'is', null)
        .gte('created_at', startOfMonth.toISOString());
      const revMTD = (purchases || []).reduce((s, p) => {
        return s + (p.product_type === 'underwriting' ? 149900 : 49900);
      }, 0);

      // Reports today
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const { count: rptToday } = await supabase
        .from('reports').select('id', { count:'exact', head:true })
        .gte('created_at', startOfDay.toISOString());

      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles').select('id', { count:'exact', head:true });

      // Open issues
      const { count: openIssues } = await supabase
        .from('report_issues').select('id', { count:'exact', head:true })
        .eq('status', 'open');

      // Stuck jobs - analysis_jobs in_progress > threshold
      const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINS * 60 * 1000).toISOString();
      const { data: stuck } = await supabase
        .from('analysis_jobs').select('id, user_id, created_at')
        .eq('status', 'in_progress')
        .lt('created_at', cutoff)
        .order('created_at', { ascending:true });

      setStuckJobs(stuck || []);
      setCmdStats({ revMTD, rptToday: rptToday || 0, totalUsers: totalUsers || 0, openIssues: openIssues || 0, stuckCount: (stuck || []).length });
    } catch (e) {
      console.error('cmdStats error', e);
    }
  }, []);

  // REPORTS
  const fetchReports = useCallback(async (page = 0, search = '', filter = 'all') => {
    setRptLoading(true);
    try {
      // reports table: id, user_id, property_name, storage_path, created_at, report_type
      let q = supabase
        .from('reports')
        .select('id, user_id, property_name, storage_path, created_at, report_type', { count:'exact' });

      if (search.trim()) q = q.ilike('property_name', `%${search.trim()}%`);

      const { data, count, error } = await q
        .order('created_at', { ascending:false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (error) throw error;
      setReports(data || []);
      setRptTotal(count || 0);
    } catch (e) {
      toast({ title:'Failed to load reports', variant:'destructive' });
    } finally { setRptLoading(false); }
  }, [toast]);

  // USERS
  const fetchUsers = useCallback(async (search = '') => {
    setUserLoading(true);
    setUserError('');
    try {
      const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const res = await fetch(`/api/admin/queue-metrics?include_users=true${params ? `&${params.slice(1)}` : ''}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminRunKey.trim()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load users');
      setUsers(Array.isArray(data?.users) ? data.users : []);
      if (data?.users_error || data?.purchases_error) {
        setUserError('Users & Credits loaded with partial data.');
      }
    } catch {
      setUserError('Failed to load users');
      toast({ title:'Failed to load users', variant:'destructive' });
    } finally { setUserLoading(false); }
  }, [adminRunKey, toast]);

  // ISSUES
  const fetchIssues = useCallback(async (filter = 'open') => {
    try {
      // report_issues: id, user_id, job_id, artifact_id, message, attachment_path, status, created_at, updated_at
      let q = supabase
        .from('report_issues')
        .select('id, created_at, updated_at, status, job_id, artifact_id, user_id, message, attachment_path');
      if (filter !== 'all') q = q.eq('status', filter);
      const { data } = await q.order('created_at', { ascending:false }).limit(50);
      setIssues(data || []);
    } catch { /* silent */ }
  }, []);

  const fetchFixQueue = useCallback(async () => {
    if (!adminRunKey.trim()) return;
    setFixQueueOpen(true);
    setFixQueueLoading(true);
    setFixQueueError('');
    try {
      const res = await fetch('/api/admin/queue-metrics?include_fix_queue=true', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminRunKey.trim()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load fix queue');
      setFixQueue(Array.isArray(data?.fix_queue) ? data.fix_queue.slice(0, 10) : []);
    } catch (e) {
      console.error('fixQueue error', e);
      setFixQueueError('Failed to load Fix Queue.');
    } finally {
      setFixQueueLoading(false);
    }
  }, [adminRunKey]);

  const refreshFixQueueDetail = useCallback(async (jobId, tab = 'job', preserveActionFeedback = false) => {
    if (!adminRunKey.trim() || !jobId || fixQueueDetailLoading) return;
    setSelectedFixQueueJobId(jobId);
    setSelectedFixQueueTab(tab);
    setFixQueueDetailError('');
    if (!preserveActionFeedback) {
      setFixQueueActionMessage('');
      setFixQueueActionError('');
    }
    setFixQueueDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/queue-metrics?include_fix_queue_details=true&fix_queue_job_id=${encodeURIComponent(jobId)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminRunKey.trim()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load Fix Queue details');
      setFixQueueDetailsById((prev) => ({
        ...prev,
        [jobId]: data?.fix_queue_details || null,
      }));
      if (data?.fix_queue_details_error) {
        setFixQueueDetailError('Some detail fields could not be loaded.');
      }
    } catch (e) {
      console.error('fixQueue detail error', e);
      setFixQueueDetailError('Failed to load details.');
    } finally {
      setFixQueueDetailLoading(false);
    }
  }, [adminRunKey, fixQueueDetailLoading]);

  const openFixQueueDetail = useCallback(async (jobId, tab = 'job') => {
    if (!jobId) return;
    if (fixQueueDetailsById[jobId]) {
      setSelectedFixQueueJobId(jobId);
      setSelectedFixQueueTab(tab);
      setFixQueueDetailError('');
      setFixQueueActionMessage('');
      setFixQueueActionError('');
      return;
    }
    await refreshFixQueueDetail(jobId, tab);
  }, [fixQueueDetailsById, refreshFixQueueDetail]);

  const runControlledFixQueueAction = useCallback(async (action) => {
    const jobId = selectedFixQueueJobId;
    const job = selectedFixQueueDetail?.job || null;
    if (!adminRunKey.trim() || !jobId || !job || fixQueueActionLoading) return;
    setFixQueueActionLoading(action);
    setFixQueueActionMessage('');
    setFixQueueActionError('');
    try {
      const res = await fetch('/api/admin-run-worker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-run-key': adminRunKey.trim(),
        },
        body: JSON.stringify({
          action,
          job_id: jobId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Controlled action failed');
      }
      setFixQueueActionMessage(
        action === 'mark_still_reviewing'
          ? 'Still reviewing logged. Admin hold remains active.'
          : data?.message || 'Action completed.'
      );
      await fetchFixQueue();
      await refreshFixQueueDetail(jobId, selectedFixQueueTab, true);
    } catch (e) {
      console.error('fixQueue controlled action error', e);
      setFixQueueActionError(e?.message || 'Action failed.');
    } finally {
      setFixQueueActionLoading('');
    }
  }, [adminRunKey, fetchFixQueue, fixQueueActionLoading, refreshFixQueueDetail, selectedFixQueueDetail, selectedFixQueueJobId, selectedFixQueueTab]);

  const controlledActionLabel = useCallback((action, fallback) => (
    fixQueueActionLoading === action ? `${fallback}...` : fallback
  ), [fixQueueActionLoading]);

  // INIT
  useEffect(() => {
    if (!authed) return;
    fetchCmdStats();
    fetchReports(0, '', 'all');
    fetchUsers('');
    fetchIssues('open');
  }, [authed, fetchCmdStats, fetchReports, fetchUsers, fetchIssues]);

  // DEBOUNCED SEARCH
  useEffect(() => {
    if (!authed) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setRptPage(0);
      fetchReports(0, rptSearch, rptFilter);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [rptSearch, rptFilter, authed, fetchReports]);

  // REPORT ACTIONS
  async function regenReport(jobId) {
    if (!adminRunKey.trim()) { toast({ title:'Admin key required', variant:'destructive' }); return; }
    setRptBusy(p => ({ ...p, [`regen-${jobId}`]:true }));
    try {
      const res = await fetch('/api/admin/run-eligible-jobs-once', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${adminRunKey.trim()}` },
        body: JSON.stringify({ action:'regenerate_pdf', job_id:jobId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      toast({ title:'Regeneration started' });
      await fetchReports(rptPage, rptSearch, rptFilter);
    } catch { toast({ title:'Regen failed', variant:'destructive' }); }
    finally { setRptBusy(p => ({ ...p, [`regen-${jobId}`]:false })); }
  }

  async function forceFailJob(jobId) {
    if (!adminRunKey.trim()) { toast({ title:'Admin key required', variant:'destructive' }); return; }
    setRptBusy(p => ({ ...p, [`fail-${jobId}`]:true }));
    try {
      const { error } = await supabase
        .from('analysis_jobs')
        .update({ status:'failed' })
        .eq('id', jobId);
      if (error) throw error;
      toast({ title:'Job marked failed', description:'Credit restored if entitlement logic is in place.' });
      await fetchReports(rptPage, rptSearch, rptFilter);
      await fetchCmdStats();
    } catch { toast({ title:'Force-fail failed', variant:'destructive' }); }
    finally { setRptBusy(p => ({ ...p, [`fail-${jobId}`]:false })); }
  }

  async function deleteReport(jobId) {
    setRptBusy(p => ({ ...p, [`del-${jobId}`]:true }));
    try {
      const { error } = await supabase.from('reports').delete().eq('id', jobId);
      if (error) throw error;
      toast({ title:'Report deleted' });
      setConfirmDelete(null);
      await fetchReports(rptPage, rptSearch, rptFilter);
      await fetchCmdStats();
    } catch { toast({ title:'Delete failed', variant:'destructive' }); }
    finally { setRptBusy(p => ({ ...p, [`del-${jobId}`]:false })); }
  }

  // CREDIT ACTIONS
  async function adjustCredits(userId, delta, productType = 'screening') {
    setCreditBusy(p => ({ ...p, [`${userId}-${productType}`]:true }));
    try {
      if (delta > 0) {
        // Grant: insert unconsumed rows into report_purchases
        const rows = Array.from({ length: delta }, () => ({
          user_id:      userId,
          product_type: productType,
          consumed_at:  null,
        }));
        const { error } = await supabase.from('report_purchases').insert(rows);
        if (error) throw error;
        toast({ title: `+${delta} ${productType} credit granted` });
      } else {
        // Revoke: delete one unconsumed row of that type
        const { data: rows, error: fetchErr } = await supabase
          .from('report_purchases')
          .select('id')
          .eq('user_id', userId)
          .eq('product_type', productType)
          .is('consumed_at', null)
          .limit(Math.abs(delta));
        if (fetchErr) throw fetchErr;
        if (!rows || rows.length === 0) { toast({ title:'No credits to remove' }); return; }
        const ids = rows.map(r => r.id);
        const { error: delErr } = await supabase.from('report_purchases').delete().in('id', ids);
        if (delErr) throw delErr;
        toast({ title: `${delta} ${productType} credit removed` });
      }
      await fetchUsers(userSearch);
    } catch { toast({ title:'Credit update failed', variant:'destructive' }); }
    finally { setCreditBusy(p => ({ ...p, [`${userId}-${productType}`]:false })); }
  }

  // ISSUE ACTIONS
  async function updateIssue(issueId, status) {
    if (!adminRunKey.trim()) { toast({ title:'Admin key required', variant:'destructive' }); return; }
    setIssuesBusy(p => ({ ...p, [issueId]:true }));
    try {
      const res = await fetch('/api/admin/queue-metrics', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${adminRunKey.trim()}` },
        body: JSON.stringify({ issue_id:issueId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      toast({ title:'Updated' });
      await fetchIssues(issueFilter);
      await fetchCmdStats();
    } catch { toast({ title:'Update failed', variant:'destructive' }); }
    finally { setIssuesBusy(p => ({ ...p, [issueId]:false })); }
  }

  async function regenFromIssue(jobId, issueId) {
    if (!adminRunKey.trim()) { toast({ title:'Admin key required', variant:'destructive' }); return; }
    setIssuesBusy(p => ({ ...p, [`regen-${issueId}`]:true }));
    try {
      const res = await fetch('/api/admin/run-eligible-jobs-once', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${adminRunKey.trim()}` },
        body: JSON.stringify({ action:'regenerate_pdf', job_id:jobId, reason:`admin_issue_${issueId}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      toast({ title:'Regeneration started' });
      await fetchIssues(issueFilter);
    } catch { toast({ title:'Regen failed', variant:'destructive' }); }
    finally { setIssuesBusy(p => ({ ...p, [`regen-${issueId}`]:false })); }
  }

  // PAGE CHANGE
  function goPage(p) {
    setRptPage(p);
    fetchReports(p, rptSearch, rptFilter);
  }

  const totalPages = Math.ceil(rptTotal / PAGE_SIZE);

  // LOCKED SCREEN
  if (!authed) {
    return (
      <>
        <style>{FONTS}</style>
        <Helmet><title>Admin - InvestorIQ</title></Helmet>
        <div style={{ minHeight:'100vh', background:T.green, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ background:T.white, border:`1px solid ${T.hairline}`, padding:'40px 48px', maxWidth:420, width:'100%' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <Shield size={18} color={T.goldDark} />
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:T.goldDark }}>Admin Access</span>
            </div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:500, color:T.ink, marginBottom:24, letterSpacing:'-0.02em' }}>InvestorIQ Command Centre</h1>
            <input
              type="password" placeholder="Admin run key"
              value={adminRunKey} onChange={e => setAdminRunKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              style={{ width:'100%', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'12px 14px', border:`1px solid ${T.hairlineMid}`, background:T.warm, color:T.ink, outline:'none', marginBottom:12, boxSizing:'border-box' }}
            />
            <button onClick={handleAuth} disabled={loading}
              style={{ width:'100%', fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', padding:'13px 0', background:T.green, color:T.white, border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
              {loading ? 'Verifying...' : 'Authenticate ->'}
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  // COMMAND CENTRE
  return (
    <>
      <style>{FONTS}</style>
      <Helmet><title>Admin Command Centre - InvestorIQ</title></Helmet>

      {confirmDelete && (
        <ConfirmModal
          message={`Permanently delete report for "${confirmDelete.addr || 'this property'}"? This cannot be undone.`}
          onConfirm={() => deleteReport(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div style={{ minHeight:'100vh', background:T.warm }}>

        {/*  TOP BAR  */}
        <div style={{ background:T.green, padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Shield size={14} color={T.gold} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:T.gold }}>InvestorIQ Command Centre</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={11} color='rgba(255,255,255,0.4)' />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em' }}>LIVE</span>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', display:'inline-block', animation:'pulse 2s infinite' }} />
          </div>
        </div>

        <div style={{ maxWidth:1400, margin:'0 auto', padding:'24px 24px 48px' }}>

          {/*  ZONE 1: COMMAND STRIP  */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
            <StatCard icon={DollarSign} label="Revenue MTD" value={cmdStats ? `$${(cmdStats.revMTD/100).toLocaleString('en-CA', { minimumFractionDigits:0 })}` : '-'} sub="Canadian dollars" accent={T.goldDark} />
            <StatCard icon={FileText} label="Reports Today" value={cmdStats?.rptToday ?? '-'} sub="generated today" accent='#1A4A22' />
            <StatCard icon={Users} label="Total Users" value={cmdStats?.totalUsers ?? '-'} sub="registered accounts" accent={T.infoBlue} />
            <StatCard icon={AlertTriangle} label="Open Issues" value={cmdStats?.openIssues ?? '-'} sub="pending support" accent={cmdStats?.openIssues > 0 ? T.errRed : T.ink4} />
            <StatCard icon={Clock} label="Stuck Jobs" value={cmdStats?.stuckCount ?? '-'} sub={`>${STUCK_THRESHOLD_MINS}min in_progress`} accent={cmdStats?.stuckCount > 0 ? T.errRed : T.ink4} />
          </div>

          {/*  ZONE 2: STUCK JOBS ALERT  */}
          <AnimatePresence>
            {stuckJobs.length > 0 && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                <div style={{ background:T.errBg, border:`1px solid ${T.errBorder}`, padding:'16px 20px', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <AlertTriangle size={13} color={T.errRed} />
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:T.errRed }}>
                      {stuckJobs.length} Stuck Job{stuckJobs.length !== 1 ? 's' : ''} - In Progress &gt;{STUCK_THRESHOLD_MINS} Minutes
                    </span>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>
                          <TblTh>Job ID</TblTh>
                          <TblTh>Property</TblTh>
                          <TblTh>Type</TblTh>
                          <TblTh>Started</TblTh>
                          <TblTh right>Actions</TblTh>
                        </tr>
                      </thead>
                      <tbody>
                        {stuckJobs.map(j => (
                          <tr key={j.id}>
                            <TblTd mono>{j.id?.slice(0,8)}...</TblTd>
                            <TblTd>{j.property_name || j.user_id?.slice(0,8) || '-'}</TblTd>
                            <TblTd mono>{j.report_type || '-'}</TblTd>
                            <TblTd mono>{new Date(j.created_at).toLocaleString()}</TblTd>
                            <TblTd right>
                              <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                                <Btn onClick={() => regenReport(j.id)} disabled={rptBusy[`regen-${j.id}`]} variant="warn">
                                  <RotateCcw size={9} /> Regen
                                </Btn>
                                <Btn onClick={() => forceFailJob(j.id)} disabled={rptBusy[`fail-${j.id}`]} variant="danger">
                                  <XCircle size={9} /> Force-Fail
                                </Btn>
                              </div>
                            </TblTd>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/*  ZONE 3: REPORTS TABLE  */}
          <Card>
            <SectionHeader
              eyebrow="Internal"
              title="Admin Review / Fix Queue"
              action={
                <Btn onClick={fetchFixQueue} disabled={fixQueueLoading} variant={fixQueueOpen ? 'warn' : 'primary'}>
                  <RefreshCcw size={9} />
                  {fixQueueOpen ? 'Refresh Fix Queue' : 'Load Fix Queue'}
                </Btn>
              }
            />
            {!fixQueueOpen ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'18px 0 6px' }}>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4, margin:0 }}>
                  Fix Queue is deferred until explicitly loaded.
                </p>
                <Btn onClick={fetchFixQueue} disabled={fixQueueLoading} variant="primary">
                  <RefreshCcw size={9} /> Load Fix Queue
                </Btn>
              </div>
            ) : fixQueueLoading ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <Loader2 size={16} color={T.ink4} style={{ animation:'spin 1s linear infinite' }} />
              </div>
            ) : fixQueueError ? (
              <div style={{ padding:'18px 20px', background:T.errBg, border:`1px solid ${T.errBorder}`, color:T.errRed, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300 }}>
                {fixQueueError}
              </div>
            ) : fixQueue.length === 0 ? (
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4, textAlign:'center', padding:'24px 0' }}>No review items require attention.</p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <TblTh>Property</TblTh>
                      <TblTh>Report</TblTh>
                      <TblTh>Severity</TblTh>
                      <TblTh>Status / Priority</TblTh>
                      <TblTh>Issue</TblTh>
                      <TblTh>Reason</TblTh>
                      <TblTh>Next Step</TblTh>
                      <TblTh>Created</TblTh>
                      <TblTh>Actions</TblTh>
                    </tr>
                  </thead>
                  <tbody>
                    {fixQueueForDisplay.map((item, i) => {
                      const displayTitle = item.display_title || item.top_action_title || item.top_action_code || '-';
                      const displayReason = item.display_reason || '-';
                      const displayNextStep = item.display_next_step || item.recommended_next_step || '-';
                      const displayCategory = item.display_category || item.owner_area || '-';
                      const displayPriority = item.display_priority || (String(item.delivery_gate_status || '').toLowerCase() === 'admin_review_required' ? 'Admin review required' : '-');
                      const isCustomerHold = item.customer_delivery_ready === false;
                      const isPublicBlocked = item.public_sample_ready === false;
                      const isOutreachBlocked = item.high_value_outreach_ready === false;
                      const actionBtnStyle = { padding:'4px 8px', background:T.white, borderColor:T.hairlineMid, color:T.ink2 };
                      return (
                        <tr key={`${item.job_id || 'job'}-${i}`} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                          <TblTd style={{ fontWeight:400, color:T.ink, maxWidth:180 }}>{item.property_name || '-'}</TblTd>
                          <TblTd mono style={{ fontSize:9 }}>{item.report_type || '-'}</TblTd>
                          <TblTd><SeverityBadge severity={item.highest_severity || 'none'} /></TblTd>
                          <TblTd style={{ maxWidth:170 }}>
                            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                              <StatusPill label={displayPriority} tone="warn" />
                              {displayCategory !== '-' && <div style={{ fontSize:11, color:T.ink3 }}>{displayCategory}</div>}
                            </div>
                          </TblTd>
                          <TblTd style={{ maxWidth:240 }}>
                            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:T.ink, lineHeight:1.4 }}>{displayTitle}</div>
                            {item.top_action_code && (
                              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.ink4, marginTop:4 }}>
                                {item.top_action_code}
                              </div>
                            )}
                          </TblTd>
                          <TblTd style={{ maxWidth:320 }}>
                            <div style={{ fontSize:11, color:T.ink2, lineHeight:1.55 }}>{displayReason}</div>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                              <StatusPill label={isCustomerHold ? 'Customer Hold' : 'Customer Ready'} tone={isCustomerHold ? 'warn' : 'success'} />
                              <StatusPill label={isPublicBlocked ? 'Public Blocked' : 'Public Ready'} tone={isPublicBlocked ? 'warn' : 'success'} />
                              <StatusPill label={isOutreachBlocked ? 'Outreach Blocked' : 'Outreach Ready'} tone={isOutreachBlocked ? 'warn' : 'success'} />
                              {item.requires_code_patch && <StatusPill label="Patch Required" tone="danger" />}
                              {item.requires_regeneration && <StatusPill label="Regeneration Required" tone="info" />}
                            </div>
                          </TblTd>
                          <TblTd style={{ maxWidth:320, fontSize:11, color:T.ink2, lineHeight:1.55 }}>{displayNextStep}</TblTd>
                          <TblTd mono style={{ fontSize:9 }}>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</TblTd>
                          <TblTd style={{ minWidth:260 }}>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                              <Btn title="View job details" onClick={() => openFixQueueDetail(item.job_id, 'job')} disabled={fixQueueDetailLoading && selectedFixQueueJobId === item.job_id} variant="ghost" style={actionBtnStyle}>
                                <Eye size={9} /> Job
                              </Btn>
                              <Btn title="View QA / action plan details" onClick={() => openFixQueueDetail(item.job_id, 'qa')} disabled={fixQueueDetailLoading && selectedFixQueueJobId === item.job_id} variant="ghost" style={actionBtnStyle}>
                                <Shield size={9} /> QA
                              </Btn>
                              <Btn title="View uploaded files" onClick={() => openFixQueueDetail(item.job_id, 'files')} disabled={fixQueueDetailLoading && selectedFixQueueJobId === item.job_id} variant="ghost" style={actionBtnStyle}>
                                <FileText size={9} /> Files
                              </Btn>
                              <Btn title="View parsed/internal artifact summary" onClick={() => openFixQueueDetail(item.job_id, 'artifacts')} disabled={fixQueueDetailLoading && selectedFixQueueJobId === item.job_id} variant="ghost" style={actionBtnStyle}>
                                <BarChart3 size={9} /> Artifacts
                              </Btn>
                              <Btn title="View worker events / log trail" onClick={() => openFixQueueDetail(item.job_id, 'events')} disabled={fixQueueDetailLoading && selectedFixQueueJobId === item.job_id} variant="ghost" style={actionBtnStyle}>
                                <Activity size={9} /> Events
                              </Btn>
                            </div>
                          </TblTd>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {selectedFixQueueJobId && (
              <div ref={fixQueueDetailPanelRef} style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.hairline}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:10 }}>
                  <div>
                    <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:T.goldDark, marginBottom:4 }}>Selected Item</p>
                    <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:20, fontWeight:500, color:T.ink, lineHeight:1.1 }}>
                      {selectedFixQueueItem?.property_name || selectedFixQueueDetail?.job?.property_name || 'Unnamed property'}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.ink3, marginTop:4 }}>
                      {selectedFixQueueDetail?.job?.report_type || selectedFixQueueItem?.report_type || '-'}  -  {selectedFixQueueDetail?.job?.status || selectedFixQueueItem?.delivery_gate_status || '-'}
                    </div>
                  </div>
                </div>
                <div style={{ padding:'6px 10px', border:`1px solid ${T.hairlineMid}`, background:T.warnBg, color:T.warnAmber, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, letterSpacing:'0.02em', marginBottom:10 }}>
                  Read-only detail panel
                </div>

                {fixQueueDetailError && (
                  <div style={{ padding:'10px 12px', background:T.errBg, border:`1px solid ${T.errBorder}`, color:T.errRed, fontFamily:"'DM Sans',sans-serif", fontSize:12, marginBottom:12 }}>
                    {fixQueueDetailError}
                  </div>
                )}

                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {[
                    ['job', 'Job'],
                    ['qa', 'QA / Action Plan'],
                    ['files', 'Files'],
                    ['artifacts', 'Artifacts'],
                    ['events', 'Events'],
                  ].map(([key, label]) => (
                    <Btn
                      key={key}
                      onClick={() => setSelectedFixQueueTab(key)}
                      variant={selectedFixQueueTab === key ? 'warn' : 'ghost'}
                      style={{ padding:'4px 8px' }}
                    >
                      {label}
                    </Btn>
                  ))}
                </div>

                <div style={{ marginBottom:12, padding:14, border:`1px solid ${T.warnBorder}`, background:'#FFF9EE' }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.warnAmber, marginBottom:6 }}>Controlled admin actions</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.6, color:T.ink2, marginBottom:10 }}>
                    Controlled admin action. Does not publish, notify customer, regenerate reports, or change credits.
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
                    <div style={{ padding:10, border:`1px solid ${T.warnBorder}`, background:T.white }}>
                      <Btn
                        title="Requeue failed job"
                        onClick={() => runControlledFixQueueAction('requeue_failed_job')}
                        disabled={
                          !!fixQueueActionLoading ||
                          !(selectedFixQueueDetail?.job?.status === 'failed')
                        }
                        variant="danger"
                        style={{ width:'100%', justifyContent:'center', padding:'6px 10px' }}
                      >
                        {controlledActionLabel('requeue_failed_job', 'Requeue failed job')}
                      </Btn>
                      <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif", fontSize:11, lineHeight:1.45, color:T.ink3 }}>
                        Only enabled when the selected job is failed.
                      </div>
                    </div>
                    <div style={{ padding:10, border:`1px solid ${T.warnBorder}`, background:T.white }}>
                      <Btn
                        title="Retry queued job"
                        onClick={() => runControlledFixQueueAction('retry_worker_job')}
                        disabled={
                          !!fixQueueActionLoading ||
                          selectedFixQueueDetail?.job?.status !== 'queued'
                        }
                        variant="warn"
                        style={{ width:'100%', justifyContent:'center', padding:'6px 10px' }}
                      >
                        {controlledActionLabel('retry_worker_job', 'Retry queued job')}
                      </Btn>
                      <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif", fontSize:11, lineHeight:1.45, color:T.ink3 }}>
                        Only enabled when the selected job is queued.
                      </div>
                    </div>
                    <div style={{ padding:10, border:`1px solid ${T.warnBorder}`, background:T.white }}>
                      <Btn
                        title="Mark still reviewing"
                        onClick={() => runControlledFixQueueAction('mark_still_reviewing')}
                        disabled={
                          !!fixQueueActionLoading ||
                          !(
                            selectedFixQueueDetail?.job?.status === 'publishing' &&
                            String(selectedFixQueueDetail?.job?.error_code || '') === 'ADMIN_REVIEW_REQUIRED'
                          )
                        }
                        variant="ghost"
                        style={{ width:'100%', justifyContent:'center', padding:'6px 10px' }}
                      >
                        {controlledActionLabel('mark_still_reviewing', 'Mark still reviewing')}
                      </Btn>
                      <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif", fontSize:11, lineHeight:1.45, color:T.ink3 }}>
                        Only enabled for admin-held publishing jobs.
                      </div>
                    </div>
                  </div>
                  {(fixQueueActionMessage || fixQueueActionError) && (
                    <div style={{ marginTop:10, padding:'8px 10px', border:`1px solid ${fixQueueActionError ? T.errBorder : T.okBorder}`, background:fixQueueActionError ? T.errBg : T.okBg, color:fixQueueActionError ? T.errRed : T.okGreen, fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.55 }}>
                      {fixQueueActionError || fixQueueActionMessage}
                    </div>
                  )}
                  {fixQueueActionLoading && (
                    <div style={{ marginTop:8, fontFamily:"'DM Sans',sans-serif", fontSize:11, lineHeight:1.45, color:T.ink3 }}>
                      Action in progress.
                    </div>
                  )}
                </div>

                {fixQueueDetailLoading && selectedFixQueueJobId ? (
                  <div style={{ textAlign:'center', padding:'18px 0', color:T.ink3, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                    <Loader2 size={14} color={T.ink4} style={{ animation:'spin 1s linear infinite' }} />
                    <div style={{ marginTop:8 }}>Loading read-only details for the selected row.</div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12 }}>
                    {selectedFixQueueTab === 'job' && (
                      <div style={{ padding:12, border:`1px solid ${T.hairline}`, background:T.warm }}>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:8 }}>Job Details</div>
                        {selectedFixQueueDetail?.job ? (
                          <div style={{ fontSize:12, lineHeight:1.6, color:T.ink2 }}>
                            <div><strong>Status:</strong> {selectedFixQueueDetail.job.status || '-'}</div>
                            <div><strong>Created:</strong> {selectedFixQueueDetail.job.created_at ? new Date(selectedFixQueueDetail.job.created_at).toLocaleString() : '-'}</div>
                            <div><strong>Started:</strong> {selectedFixQueueDetail.job.started_at ? new Date(selectedFixQueueDetail.job.started_at).toLocaleString() : '-'}</div>
                            <div><strong>Failed:</strong> {selectedFixQueueDetail.job.failed_at ? new Date(selectedFixQueueDetail.job.failed_at).toLocaleString() : '-'}</div>
                            <div><strong>Priority:</strong> {selectedFixQueueDetail?.qa?.display_priority || selectedFixQueueDetail?.qa?.highest_severity || '-'}</div>
                            <div><strong>Owner:</strong> {selectedFixQueueDetail?.qa?.owner_area || '-'}</div>
                          </div>
                        ) : (
                          <div style={{ fontSize:12, color:T.ink4 }}>No records found for this section.</div>
                        )}
                      </div>
                    )}

                    {selectedFixQueueTab === 'qa' && (
                      <div style={{ padding:12, border:`1px solid ${T.hairline}`, background:T.warm, gridColumn:'1 / -1' }}>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:8 }}>QA / Action Plan</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12 }}>
                          <div style={{ fontSize:12, lineHeight:1.6, color:T.ink2 }}>
                            <div><strong>Delivery Gate:</strong> {selectedFixQueueDetail?.qa?.delivery_gate_status || '-'}</div>
                            <div><strong>Reason:</strong> {selectedFixQueueDetail?.qa?.reason_code || '-'}</div>
                            <div><strong>Contract:</strong> {selectedFixQueueDetail?.qa?.contract_status || '-'}</div>
                            <div><strong>Director:</strong> {selectedFixQueueDetail?.qa?.director_decision || '-'}</div>
                            <div><strong>QA Flags:</strong> {selectedFixQueueDetail?.qa?.report_qa_flags_severity || '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:T.ink, marginBottom:6 }}>Next Step</div>
                            <div style={{ fontSize:12, lineHeight:1.6, color:T.ink2 }}>{selectedFixQueueDetail?.qa?.recommended_next_step || '-'}</div>
                          </div>
                        </div>
                        <div style={{ marginTop:12 }}>
                          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:T.ink, marginBottom:6 }}>Prioritized Actions</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {(selectedFixQueueDetail?.qa?.prioritized_actions || []).length === 0 ? (
                              <div style={{ fontSize:12, color:T.ink4 }}>No records found for this section.</div>
                            ) : selectedFixQueueDetail.qa.prioritized_actions.map((action) => (
                              <div key={action.code || action.title} style={{ padding:'8px 10px', border:`1px solid ${T.hairline}`, background:T.white }}>
                                <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                                  <div style={{ fontSize:12, fontWeight:500, color:T.ink }}>{action.title || action.code || '-'}</div>
                                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.ink4 }}>{action.action_type || '-'}</div>
                                </div>
                                <div style={{ fontSize:11, lineHeight:1.5, color:T.ink2, marginTop:4 }}>
                                  {action.recommended_next_step || '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedFixQueueTab === 'files' && (
                      <div style={{ padding:12, border:`1px solid ${T.hairline}`, background:T.warm, gridColumn:'1 / -1' }}>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:8 }}>Uploaded Files</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {(selectedFixQueueDetail?.files || []).length === 0 ? (
                            <div style={{ fontSize:12, color:T.ink4 }}>No records found for this section.</div>
                          ) : selectedFixQueueDetail.files.map((file) => (
                            <div key={file.id || `${file.doc_type}-${file.original_filename}`} style={{ padding:'8px 10px', border:`1px solid ${T.hairline}`, background:T.white, fontSize:12, lineHeight:1.5, color:T.ink2 }}>
                              <div style={{ fontWeight:500, color:T.ink }}>{file.original_filename || 'Unnamed file'}</div>
                              <div>Type: {file.doc_type || '-'}  -  Parse: {file.parse_status || '-'}</div>
                              {file.parse_error && <div style={{ color:T.errRed }}>{file.parse_error}</div>}
                              <div style={{ color:T.ink4 }}>{file.created_at ? new Date(file.created_at).toLocaleString() : '-'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFixQueueTab === 'artifacts' && (
                      <div style={{ padding:12, border:`1px solid ${T.hairline}`, background:T.warm, gridColumn:'1 / -1' }}>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:8 }}>Internal Artifacts</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {(selectedFixQueueDetail?.artifacts || []).length === 0 ? (
                            <div style={{ fontSize:12, color:T.ink4 }}>No records found for this section.</div>
                          ) : selectedFixQueueDetail.artifacts.map((artifact, idx) => (
                            <div key={`${artifact.type || 'artifact'}-${idx}`} style={{ padding:'8px 10px', border:`1px solid ${T.hairline}`, background:T.white, fontSize:12, lineHeight:1.5, color:T.ink2 }}>
                              <div style={{ fontWeight:500, color:T.ink }}>{artifact.type || 'artifact'}</div>
                              <div>{artifact.summary || '-'}</div>
                              <div style={{ color:T.ink4 }}>{artifact.bucket || '-'}  -  {artifact.created_at ? new Date(artifact.created_at).toLocaleString() : '-'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFixQueueTab === 'events' && (
                      <div style={{ padding:12, border:`1px solid ${T.hairline}`, background:T.warm, gridColumn:'1 / -1' }}>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:8 }}>Worker Events / Log Trail</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {(selectedFixQueueDetail?.worker_events || []).length === 0 ? (
                            <div style={{ fontSize:12, color:T.ink4 }}>No records found for this section.</div>
                          ) : selectedFixQueueDetail.worker_events.map((event, idx) => (
                            <div key={`${event.type || 'event'}-${idx}`} style={{ padding:'8px 10px', border:`1px solid ${T.hairline}`, background:T.white, fontSize:12, lineHeight:1.5, color:T.ink2 }}>
                              <div style={{ fontWeight:500, color:T.ink }}>{event.type || 'worker_event'}</div>
                              <div>{event.summary || '-'}</div>
                              <div style={{ color:T.ink4 }}>{event.bucket || '-'}  -  {event.created_at ? new Date(event.created_at).toLocaleString() : '-'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader
              eyebrow="Properties"
              title="Reports"
              action={
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <SearchInput value={rptSearch} onChange={setRptSearch} placeholder="Search property..." />
                  <select
                    value={rptFilter} onChange={e => { setRptFilter(e.target.value); setRptPage(0); }}
                    style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.1em', padding:'7px 10px', border:`1px solid ${T.hairline}`, background:T.warm, color:T.ink3, outline:'none', cursor:'pointer' }}>
                    <option value="all">All types</option>
                    <option value="screening">Screening</option>
                    <option value="underwriting">Underwriting</option>
                  </select>
                  <Btn onClick={() => fetchReports(rptPage, rptSearch, rptFilter)}>
                    <RefreshCcw size={9} /> Refresh
                  </Btn>
                </div>
              }
            />

            {rptLoading ? (
              <div style={{ textAlign:'center', padding:'32px 0' }}>
                <Loader2 size={18} color={T.ink4} style={{ animation:'spin 1s linear infinite' }} />
              </div>
            ) : reports.length === 0 ? (
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4, textAlign:'center', padding:'24px 0' }}>No reports found.</p>
            ) : (
              <>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <TblTh>Property</TblTh>
                        <TblTh>User</TblTh>
                        <TblTh>Type</TblTh>
                        <TblTh>Created</TblTh>
                        <TblTh>Status</TblTh>
                          <TblTh right>Actions</TblTh>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r, i) => {
                        const isExpanded = expandedRpt === r.id;
                        return (
                          <React.Fragment key={r.id}>
                            <tr
                              style={{ background: i % 2 === 1 ? T.warm : T.white, cursor:'pointer' }}
                              onClick={() => setExpandedRpt(isExpanded ? null : r.id)}
                            >
                              <TblTd style={{ fontWeight:400, color:T.ink, maxWidth:200 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  {isExpanded ? <ChevronUp size={10} color={T.ink4} /> : <ChevronDown size={10} color={T.ink4} />}
                                  {r.property_name || '-'}
                                </div>
                              </TblTd>
                              <TblTd mono style={{ fontSize:9 }}>{r.user_id?.slice(0,8) || '-'}</TblTd>
                              <TblTd mono style={{ fontSize:9 }}>{r.report_type || '-'}</TblTd>
                              <TblTd mono style={{ fontSize:9 }}>{new Date(r.created_at).toLocaleDateString()}</TblTd>
                              <TblTd><StatusBadge status={r.report_type} /></TblTd>
                              <TblTd right onClick={e => e.stopPropagation()}>
                                <div style={{ display:'flex', gap:5, justifyContent:'flex-end', flexWrap:'wrap' }}>
                                  {r.storage_path && (
                                    <Btn onClick={() => window.open(r.storage_path, '_blank')} variant="ghost">
                                      <Eye size={9} /> View
                                    </Btn>
                                  )}
                                  <Btn onClick={() => regenReport(r.id)} disabled={rptBusy[`regen-${r.id}`]} variant="warn">
                                    <RotateCcw size={9} /> Regen
                                  </Btn>

                                  <Btn onClick={() => setConfirmDelete({ id:r.id, addr:r.property_name })} disabled={rptBusy[`del-${r.id}`]} variant="danger">
                                    <Trash2 size={9} /> Del
                                  </Btn>
                                </div>
                              </TblTd>
                            </tr>

                            {/* Expanded job detail */}
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} style={{ padding:0, background:T.infoBg, borderBottom:`1px solid ${T.hairline}` }}>
                                    <motion.div
                                      initial={{ opacity:0, height:0 }}
                                      animate={{ opacity:1, height:'auto' }}
                                      exit={{ opacity:0, height:0 }}
                                      style={{ padding:'14px 20px', overflow:'hidden' }}
                                    >
                                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:300, color:T.ink3 }}>
                                        <div>
                                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:4 }}>Job ID</div>
                                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.ink2, wordBreak:'break-all' }}>{r.id}</div>
                                        </div>
                                        <div>
                                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:4 }}>User ID</div>
                                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.ink2, wordBreak:'break-all' }}>{r.user_id || '-'}</div>
                                        </div>
                                        <div>
                                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:4 }}>AI Recovery</div>
                                          <div>{ai ? <AiBadge type={ai} /> : <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.ink4 }}>None - deterministic only</span>}</div>
                                        </div>
                                        {r.storage_path && (
                                          <div style={{ gridColumn:'1/-1' }}>
                                            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:4 }}>Storage Path</div>
                                            <a href={r.storage_path} target="_blank" rel="noreferrer"
                                              style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.goldDark, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
                                              <ExternalLink size={9} /> Open Report PDF
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:`1px solid ${T.hairline}` }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:300, color:T.ink4 }}>
                      {rptTotal} reports  -  Page {rptPage + 1} of {totalPages}
                    </span>
                    <div style={{ display:'flex', gap:6 }}>
                      <Btn onClick={() => goPage(rptPage - 1)} disabled={rptPage === 0}>Prev</Btn>
                      <Btn onClick={() => goPage(rptPage + 1)} disabled={rptPage >= totalPages - 1}>Next {"->"}</Btn>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/*  ZONE 4: USERS & CREDITS  */}
          <Card>
            <SectionHeader
              eyebrow="Accounts"
              title="Users & Credits"
              action={
                <div style={{ display:'flex', gap:8 }}>
                  <SearchInput value={userSearch} onChange={v => { setUserSearch(v); clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => fetchUsers(v), 300); }} placeholder="Search name..." />
                  <Btn onClick={() => fetchUsers(userSearch)}><RefreshCcw size={9} /> Refresh</Btn>
                </div>
              }
            />
            {userError && !userLoading && (
              <div style={{ marginBottom:12, padding:'12px 14px', background:T.warnBg, border:`1px solid ${T.warnBorder}`, color:T.warnAmber, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:300 }}>
                {userError}
              </div>
            )}
            {userLoading ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}><Loader2 size={16} color={T.ink4} style={{ animation:'spin 1s linear infinite' }} /></div>
            ) : users.length === 0 ? (
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4, textAlign:'center', padding:'24px 0' }}>No users found.</p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <TblTh>Name</TblTh>
                      <TblTh>Role</TblTh>
                      <TblTh>Screening</TblTh>
                      <TblTh>Underwriting</TblTh>
                      <TblTh right>Adjust Credits</TblTh>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id || i} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                        <TblTd mono style={{ fontSize:10 }}>{u.full_name || '-'}</TblTd>
                        <TblTd mono style={{ fontSize:9 }}>{u.role || '-'}</TblTd>
                        <TblTd>
                          <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:18, fontWeight:500, color: u.screening_credits > 0 ? T.okGreen : T.errRed }}>
                            {u.screening_credits ?? 0}
                          </span>
                        </TblTd>
                        <TblTd>
                          <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:18, fontWeight:500, color: u.underwriting_credits > 0 ? T.okGreen : T.errRed }}>
                            {u.underwriting_credits ?? 0}
                          </span>
                        </TblTd>
                        <TblTd right>
                          <div style={{ display:'flex', gap:5, justifyContent:'flex-end', flexWrap:'wrap' }}>
                            <Btn onClick={() => adjustCredits(u.id, 1, 'screening')} disabled={creditBusy[`${u.id}-screening`]} variant="success">
                              <Plus size={9} /> Screen
                            </Btn>
                            <Btn onClick={() => adjustCredits(u.id, 1, 'underwriting')} disabled={creditBusy[`${u.id}-underwriting`]} variant="success">
                              <Plus size={9} /> UW
                            </Btn>
                            <Btn onClick={() => adjustCredits(u.id, -1, 'screening')} disabled={creditBusy[`${u.id}-screening`] || u.screening_credits <= 0} variant="danger">
                              <Minus size={9} /> Screen
                            </Btn>
                            <Btn onClick={() => adjustCredits(u.id, -1, 'underwriting')} disabled={creditBusy[`${u.id}-underwriting`] || u.underwriting_credits <= 0} variant="danger">
                              <Minus size={9} /> UW
                            </Btn>
                          </div>
                        </TblTd>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/*  ZONE 5: ISSUES QUEUE  */}
          <Card>
            <SectionHeader
              eyebrow="Support"
              title="Issues Queue"
              action={
                <div style={{ display:'flex', gap:8 }}>
                  <select
                    value={issueFilter} onChange={e => { setIssueFilter(e.target.value); fetchIssues(e.target.value); }}
                    style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.1em', padding:'7px 10px', border:`1px solid ${T.hairline}`, background:T.warm, color:T.ink3, outline:'none', cursor:'pointer' }}>
                    <option value="open">Open</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="all">All</option>
                  </select>
                  <Btn onClick={() => fetchIssues(issueFilter)}><RefreshCcw size={9} /> Refresh</Btn>
                </div>
              }
            />
            {issues.length === 0 ? (
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4, textAlign:'center', padding:'24px 0' }}>
                {issueFilter === 'open' ? 'No open issues.' : 'No issues found.'}
              </p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <TblTh>Date</TblTh>
                      <TblTh>Status</TblTh>
                      <TblTh>Job / Property</TblTh>
                      <TblTh>User</TblTh>
                      <TblTh>Message</TblTh>
                      <TblTh right>Actions</TblTh>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue, i) => {
                      const isUpdating = issuesBusy[issue.id];
                      const isRegen    = issuesBusy[`regen-${issue.id}`];
                      const truncated  = issue.message?.length > 80 ? issue.message.slice(0, 80) + '...' : issue.message;
                      return (
                        <tr key={issue.id} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                          <TblTd mono style={{ fontSize:9 }}>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '-'}</TblTd>
                          <TblTd><StatusBadge status={issue.status || 'open'} /></TblTd>
                          <TblTd mono style={{ fontSize:9 }}>
                            <div>{issue.job_id?.slice(0,8) || '-'}</div>
                            {issue.artifact_id && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:300, color:T.ink4, marginTop:2 }}>artifact: {issue.artifact_id.slice(0,8)}</div>}
                          </TblTd>
                          <TblTd mono style={{ fontSize:9 }}>{issue.user_id?.slice(0,8) || '-'}</TblTd>
                          <TblTd style={{ maxWidth:180, fontSize:11, color:T.ink3 }}>{truncated || '-'}</TblTd>
                          <TblTd right>
                            <div style={{ display:'flex', gap:5, justifyContent:'flex-end', flexWrap:'wrap' }}>
                              {issue.status !== 'reviewing' && (
                                <Btn onClick={() => updateIssue(issue.id, 'reviewing')} disabled={isUpdating} variant="warn">Reviewing</Btn>
                              )}
                              {issue.status !== 'resolved' && (
                                <Btn onClick={() => updateIssue(issue.id, 'resolved')} disabled={isUpdating} variant="success">
                                  <CheckCircle size={9} /> Resolve
                                </Btn>
                              )}
                              {issue.job_id && (
                                <Btn onClick={() => regenFromIssue(issue.job_id, issue.id)} disabled={isRegen || !issue.job_id} variant="ghost">
                                  <RotateCcw size={9} /> Regen
                                </Btn>
                              )}
                            </div>
                          </TblTd>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      </div>
    </>
  );
}
