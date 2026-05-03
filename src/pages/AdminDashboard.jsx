import React, { useEffect, useState, useCallback, useRef } from "react";
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

// ─── DESIGN TOKENS ────────────────────────────────────────────
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

// ─── FONTS ────────────────────────────────────────────────────
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
`;

// ─── SHARED COMPONENTS ────────────────────────────────────────
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
      <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:500, color:T.ink, lineHeight:1 }}>{value ?? '—'}</div>
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

// ─── TABLE HELPERS ────────────────────────────────────────────
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

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function AdminDashboard() {
  const { toast } = useToast();
  const [adminRunKey, setAdminRunKey] = useState(
    () => typeof window !== 'undefined' ? localStorage.getItem('ADMIN_RUN_KEY') || '' : ''
  );
  const [authed, setAuthed]           = useState(false);
  const [loading, setLoading]         = useState(false);

  // ── Command strip
  const [cmdStats, setCmdStats]       = useState(null);
  const [stuckJobs, setStuckJobs]     = useState([]);

  // ── Reports
  const [reports, setReports]         = useState([]);
  const [rptTotal, setRptTotal]       = useState(0);
  const [rptPage, setRptPage]         = useState(0);
  const [rptSearch, setRptSearch]     = useState('');
  const [rptFilter, setRptFilter]     = useState('all');
  const [rptLoading, setRptLoading]   = useState(false);
  const [expandedRpt, setExpandedRpt] = useState(null);
  const [rptBusy, setRptBusy]         = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Users
  const [users, setUsers]             = useState([]);
  const [userSearch, setUserSearch]   = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [creditBusy, setCreditBusy]   = useState({});

  // ── Issues
  const [issues, setIssues]           = useState([]);
  const [issueFilter, setIssueFilter] = useState('open');
  const [issuesBusy, setIssuesBusy]   = useState({});

  const searchTimer = useRef(null);

  // ─── AUTH ─────────────────────────────────────────────────
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

  // ─── COMMAND STRIP ────────────────────────────────────────
  const fetchCmdStats = useCallback(async () => {
    try {
      // Revenue MTD from report_purchases
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const { data: purchases } = await supabase
        .from('report_purchases')
        .select('amount_paid, created_at')
        .gte('created_at', startOfMonth.toISOString());

      const revMTD = (purchases || []).reduce((s, p) => s + (p.amount_paid || 0), 0);

      // Reports today
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const { count: rptToday } = await supabase
        .from('report_jobs').select('id', { count:'exact', head:true })
        .gte('created_at', startOfDay.toISOString());

      // Total users
      const { count: totalUsers } = await supabase
        .from('users').select('id', { count:'exact', head:true });

      // Open issues
      const { count: openIssues } = await supabase
        .from('support_issues').select('id', { count:'exact', head:true })
        .eq('status', 'open');

      // Stuck jobs
      const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINS * 60 * 1000).toISOString();
      const { data: stuck } = await supabase
        .from('report_jobs').select('id, property_address, user_id, created_at, report_type')
        .eq('status', 'in_progress')
        .lt('created_at', cutoff)
        .order('created_at', { ascending:true });

      setStuckJobs(stuck || []);
      setCmdStats({ revMTD, rptToday: rptToday || 0, totalUsers: totalUsers || 0, openIssues: openIssues || 0, stuckCount: (stuck || []).length });
    } catch (e) {
      console.error('cmdStats error', e);
    }
  }, []);

  // ─── REPORTS ──────────────────────────────────────────────
  const fetchReports = useCallback(async (page = 0, search = '', filter = 'all') => {
    setRptLoading(true);
    try {
      let q = supabase
        .from('report_jobs')
        .select(`id, property_address, user_id, created_at, status, report_type,
                 pdf_url, ai_t12_used, ai_rent_roll_used, error_message,
                 users(email)`, { count:'exact' });

      if (filter !== 'all') q = q.eq('status', filter);
      if (search.trim()) q = q.ilike('property_address', `%${search.trim()}%`);

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

  // ─── USERS ────────────────────────────────────────────────
  const fetchUsers = useCallback(async (search = '') => {
    setUserLoading(true);
    try {
      let q = supabase
        .from('users')
        .select('id, email, created_at, report_credits, total_reports_generated');
      if (search.trim()) q = q.ilike('email', `%${search.trim()}%`);
      const { data, error } = await q.order('created_at', { ascending:false }).limit(50);
      if (error) throw error;
      setUsers(data || []);
    } catch {
      toast({ title:'Failed to load users', variant:'destructive' });
    } finally { setUserLoading(false); }
  }, [toast]);

  // ─── ISSUES ───────────────────────────────────────────────
  const fetchIssues = useCallback(async (filter = 'open') => {
    try {
      let q = supabase
        .from('support_issues')
        .select('id, created_at, status, job_id, user_id, message, property_name, report_type, job_status, attachment_url, attachment_path');
      if (filter !== 'all') q = q.eq('status', filter);
      const { data } = await q.order('created_at', { ascending:false }).limit(50);
      setIssues(data || []);
    } catch { /* silent */ }
  }, []);

  // ─── INIT ────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    fetchCmdStats();
    fetchReports(0, '', 'all');
    fetchUsers('');
    fetchIssues('open');
  }, [authed, fetchCmdStats, fetchReports, fetchUsers, fetchIssues]);

  // ─── DEBOUNCED SEARCH ────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setRptPage(0);
      fetchReports(0, rptSearch, rptFilter);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [rptSearch, rptFilter, authed, fetchReports]);

  // ─── REPORT ACTIONS ───────────────────────────────────────
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
        .from('report_jobs')
        .update({ status:'failed', error_message:'Force-failed by admin' })
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
      const { error } = await supabase.from('report_jobs').delete().eq('id', jobId);
      if (error) throw error;
      toast({ title:'Report deleted' });
      setConfirmDelete(null);
      await fetchReports(rptPage, rptSearch, rptFilter);
      await fetchCmdStats();
    } catch { toast({ title:'Delete failed', variant:'destructive' }); }
    finally { setRptBusy(p => ({ ...p, [`del-${jobId}`]:false })); }
  }

  // ─── CREDIT ACTIONS ───────────────────────────────────────
  async function adjustCredits(userId, delta) {
    setCreditBusy(p => ({ ...p, [userId]:true }));
    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error();
      const newCredits = Math.max(0, (user.report_credits || 0) + delta);
      const { error } = await supabase
        .from('users')
        .update({ report_credits: newCredits })
        .eq('id', userId);
      if (error) throw error;
      toast({ title: delta > 0 ? `+${delta} credit granted` : `${delta} credit removed` });
      await fetchUsers(userSearch);
    } catch { toast({ title:'Credit update failed', variant:'destructive' }); }
    finally { setCreditBusy(p => ({ ...p, [userId]:false })); }
  }

  // ─── ISSUE ACTIONS ────────────────────────────────────────
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

  // ─── DETECT AI RECOVERY TYPE ──────────────────────────────
  function aiType(r) {
    if (r.ai_t12_used && r.ai_rent_roll_used) return 'both';
    if (r.ai_t12_used) return 't12';
    if (r.ai_rent_roll_used) return 'rr';
    return null;
  }

  // ─── PAGE CHANGE ─────────────────────────────────────────
  function goPage(p) {
    setRptPage(p);
    fetchReports(p, rptSearch, rptFilter);
  }

  const totalPages = Math.ceil(rptTotal / PAGE_SIZE);

  // ─── LOCKED SCREEN ────────────────────────────────────────
  if (!authed) {
    return (
      <>
        <style>{FONTS}</style>
        <Helmet><title>Admin — InvestorIQ</title></Helmet>
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
              {loading ? 'Verifying...' : 'Authenticate →'}
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  // ─── COMMAND CENTRE ───────────────────────────────────────
  return (
    <>
      <style>{FONTS}</style>
      <Helmet><title>Admin Command Centre — InvestorIQ</title></Helmet>

      {confirmDelete && (
        <ConfirmModal
          message={`Permanently delete report for "${confirmDelete.addr || 'this property'}"? This cannot be undone.`}
          onConfirm={() => deleteReport(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div style={{ minHeight:'100vh', background:T.warm }}>

        {/* ── TOP BAR ──────────────────────────────────── */}
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

          {/* ── ZONE 1: COMMAND STRIP ────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
            <StatCard icon={DollarSign} label="Revenue MTD" value={cmdStats ? `$${(cmdStats.revMTD/100).toLocaleString('en-CA', { minimumFractionDigits:0 })}` : '—'} sub="Canadian dollars" accent={T.goldDark} />
            <StatCard icon={FileText} label="Reports Today" value={cmdStats?.rptToday ?? '—'} sub="generated today" accent='#1A4A22' />
            <StatCard icon={Users} label="Total Users" value={cmdStats?.totalUsers ?? '—'} sub="registered accounts" accent={T.infoBlue} />
            <StatCard icon={AlertTriangle} label="Open Issues" value={cmdStats?.openIssues ?? '—'} sub="pending support" accent={cmdStats?.openIssues > 0 ? T.errRed : T.ink4} />
            <StatCard icon={Clock} label="Stuck Jobs" value={cmdStats?.stuckCount ?? '—'} sub={`>${STUCK_THRESHOLD_MINS}min in_progress`} accent={cmdStats?.stuckCount > 0 ? T.errRed : T.ink4} />
          </div>

          {/* ── ZONE 2: STUCK JOBS ALERT ─────────────────── */}
          <AnimatePresence>
            {stuckJobs.length > 0 && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                <div style={{ background:T.errBg, border:`1px solid ${T.errBorder}`, padding:'16px 20px', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <AlertTriangle size={13} color={T.errRed} />
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:T.errRed }}>
                      {stuckJobs.length} Stuck Job{stuckJobs.length !== 1 ? 's' : ''} — In Progress &gt;{STUCK_THRESHOLD_MINS} Minutes
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
                            <TblTd mono>{j.id?.slice(0,8)}…</TblTd>
                            <TblTd>{j.property_address || '—'}</TblTd>
                            <TblTd mono>{j.report_type || '—'}</TblTd>
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

          {/* ── ZONE 3: REPORTS TABLE ────────────────────── */}
          <Card>
            <SectionHeader
              eyebrow="Properties"
              title="Reports"
              action={
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <SearchInput value={rptSearch} onChange={setRptSearch} placeholder="Search property…" />
                  <select
                    value={rptFilter} onChange={e => { setRptFilter(e.target.value); setRptPage(0); }}
                    style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.1em', padding:'7px 10px', border:`1px solid ${T.hairline}`, background:T.warm, color:T.ink3, outline:'none', cursor:'pointer' }}>
                    <option value="all">All statuses</option>
                    <option value="published">Published</option>
                    <option value="in_progress">In Progress</option>
                    <option value="queued">Queued</option>
                    <option value="failed">Failed</option>
                    <option value="needs_documents">Needs Docs</option>
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
                        <TblTh>AI</TblTh>
                        <TblTh right>Actions</TblTh>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r, i) => {
                        const isExpanded = expandedRpt === r.id;
                        const ai = aiType(r);
                        return (
                          <React.Fragment key={r.id}>
                            <tr
                              style={{ background: i % 2 === 1 ? T.warm : T.white, cursor:'pointer' }}
                              onClick={() => setExpandedRpt(isExpanded ? null : r.id)}
                            >
                              <TblTd style={{ fontWeight:400, color:T.ink, maxWidth:200 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  {isExpanded ? <ChevronUp size={10} color={T.ink4} /> : <ChevronDown size={10} color={T.ink4} />}
                                  {r.property_address || '—'}
                                </div>
                              </TblTd>
                              <TblTd mono style={{ fontSize:9 }}>{r.users?.email || r.user_id?.slice(0,8) || '—'}</TblTd>
                              <TblTd mono style={{ fontSize:9 }}>{r.report_type || '—'}</TblTd>
                              <TblTd mono style={{ fontSize:9 }}>{new Date(r.created_at).toLocaleDateString()}</TblTd>
                              <TblTd><StatusBadge status={r.status} /></TblTd>
                              <TblTd>{ai && <AiBadge type={ai} />}</TblTd>
                              <TblTd right onClick={e => e.stopPropagation()}>
                                <div style={{ display:'flex', gap:5, justifyContent:'flex-end', flexWrap:'wrap' }}>
                                  {r.pdf_url && (
                                    <Btn onClick={() => window.open(r.pdf_url, '_blank')} variant="ghost">
                                      <Eye size={9} /> View
                                    </Btn>
                                  )}
                                  <Btn onClick={() => regenReport(r.id)} disabled={rptBusy[`regen-${r.id}`]} variant="warn">
                                    <RotateCcw size={9} /> Regen
                                  </Btn>
                                  {r.status === 'in_progress' && (
                                    <Btn onClick={() => forceFailJob(r.id)} disabled={rptBusy[`fail-${r.id}`]} variant="danger">
                                      <XCircle size={9} /> Fail
                                    </Btn>
                                  )}
                                  <Btn onClick={() => setConfirmDelete({ id:r.id, addr:r.property_address })} disabled={rptBusy[`del-${r.id}`]} variant="danger">
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
                                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.ink2, wordBreak:'break-all' }}>{r.user_id || '—'}</div>
                                        </div>
                                        <div>
                                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:4 }}>AI Recovery</div>
                                          <div>{ai ? <AiBadge type={ai} /> : <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.ink4 }}>None — deterministic only</span>}</div>
                                        </div>
                                        {r.error_message && (
                                          <div style={{ gridColumn:'1/-1' }}>
                                            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.errRed, marginBottom:4 }}>Error</div>
                                            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.errRed, background:T.errBg, padding:'8px 10px', border:`1px solid ${T.errBorder}` }}>{r.error_message}</div>
                                          </div>
                                        )}
                                        {r.pdf_url && (
                                          <div style={{ gridColumn:'1/-1' }}>
                                            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:4 }}>PDF URL</div>
                                            <a href={r.pdf_url} target="_blank" rel="noreferrer"
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
                      {rptTotal} reports · Page {rptPage + 1} of {totalPages}
                    </span>
                    <div style={{ display:'flex', gap:6 }}>
                      <Btn onClick={() => goPage(rptPage - 1)} disabled={rptPage === 0}>← Prev</Btn>
                      <Btn onClick={() => goPage(rptPage + 1)} disabled={rptPage >= totalPages - 1}>Next →</Btn>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* ── ZONE 4: USERS & CREDITS ──────────────────── */}
          <Card>
            <SectionHeader
              eyebrow="Accounts"
              title="Users & Credits"
              action={
                <div style={{ display:'flex', gap:8 }}>
                  <SearchInput value={userSearch} onChange={v => { setUserSearch(v); clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => fetchUsers(v), 300); }} placeholder="Search email…" />
                  <Btn onClick={() => fetchUsers(userSearch)}><RefreshCcw size={9} /> Refresh</Btn>
                </div>
              }
            />
            {userLoading ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}><Loader2 size={16} color={T.ink4} style={{ animation:'spin 1s linear infinite' }} /></div>
            ) : users.length === 0 ? (
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4, textAlign:'center', padding:'24px 0' }}>No users found.</p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <TblTh>Email</TblTh>
                      <TblTh>Joined</TblTh>
                      <TblTh>Reports</TblTh>
                      <TblTh>Credits</TblTh>
                      <TblTh right>Adjust Credits</TblTh>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                        <TblTd mono style={{ fontSize:10 }}>{u.email || '—'}</TblTd>
                        <TblTd mono style={{ fontSize:9 }}>{new Date(u.created_at).toLocaleDateString()}</TblTd>
                        <TblTd mono>{u.total_reports_generated ?? 0}</TblTd>
                        <TblTd>
                          <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:18, fontWeight:500, color: u.report_credits > 0 ? T.okGreen : T.errRed }}>
                            {u.report_credits ?? 0}
                          </span>
                        </TblTd>
                        <TblTd right>
                          <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                            <Btn onClick={() => adjustCredits(u.id, -1)} disabled={creditBusy[u.id] || (u.report_credits ?? 0) <= 0} variant="danger">
                              <Minus size={9} /> 1
                            </Btn>
                            <Btn onClick={() => adjustCredits(u.id, 1)} disabled={creditBusy[u.id]} variant="success">
                              <Plus size={9} /> 1
                            </Btn>
                            <Btn onClick={() => adjustCredits(u.id, 5)} disabled={creditBusy[u.id]} variant="success">
                              <Plus size={9} /> 5
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

          {/* ── ZONE 5: ISSUES QUEUE ─────────────────────── */}
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
                {issueFilter === 'open' ? '🎉 No open issues.' : 'No issues found.'}
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
                      const truncated  = issue.message?.length > 80 ? issue.message.slice(0, 80) + '…' : issue.message;
                      return (
                        <tr key={issue.id} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                          <TblTd mono style={{ fontSize:9 }}>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'}</TblTd>
                          <TblTd><StatusBadge status={issue.status || 'open'} /></TblTd>
                          <TblTd mono style={{ fontSize:9 }}>
                            <div>{issue.job_id?.slice(0,8) || '—'}</div>
                            {issue.property_name && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:300, color:T.ink4, marginTop:2 }}>{issue.property_name}</div>}
                          </TblTd>
                          <TblTd mono style={{ fontSize:9 }}>{issue.user_id?.slice(0,8) || '—'}</TblTd>
                          <TblTd style={{ maxWidth:180, fontSize:11, color:T.ink3 }}>{truncated || '—'}</TblTd>
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
