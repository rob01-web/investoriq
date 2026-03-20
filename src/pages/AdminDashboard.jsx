import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { FileText, Loader2, Users, BarChart3, RefreshCcw, Shield } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
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
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background:   T.white,
      border:       `1px solid ${T.hairline}`,
      padding:      '28px 32px',
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'flex-start',
      justifyContent: 'space-between',
      marginBottom:   20,
      paddingBottom:  12,
      borderBottom:   `1px solid ${T.hairline}`,
      gap:            12,
    }}>
      <div>
        <p style={{
          fontFamily:   "'DM Mono', monospace",
          fontSize:     9,
          letterSpacing:'0.2em',
          textTransform:'uppercase',
          color:        T.goldDark,
          marginBottom: 4,
        }}>{eyebrow}</p>
        <h2 style={{
          fontFamily:   "'Cormorant Garamond', Georgia, serif",
          fontSize:     20,
          fontWeight:   500,
          letterSpacing:'-0.015em',
          color:        T.ink,
          lineHeight:   1.1,
        }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StatBadge({ status }) {
  const map = {
    published:      { bg: T.okBg,   border: T.okBorder,   color: T.okGreen  },
    queued:         { bg: T.warnBg, border: T.warnBorder,  color: T.warnAmber },
    in_progress:    { bg: T.warnBg, border: T.warnBorder,  color: T.warnAmber },
    failed:         { bg: T.errBg,  border: T.errBorder,   color: T.errRed   },
    needs_documents:{ bg: '#F0F4FF',border: '#B8C8F0',     color: '#1A3A7A'  },
    open:           { bg: T.errBg,  border: T.errBorder,   color: T.errRed   },
    reviewing:      { bg: T.warnBg, border: T.warnBorder,  color: T.warnAmber },
    resolved:       { bg: T.okBg,   border: T.okBorder,    color: T.okGreen  },
    Completed:      { bg: T.okBg,   border: T.okBorder,    color: T.okGreen  },
    Processing:     { bg: T.warnBg, border: T.warnBorder,  color: T.warnAmber },
  };
  const s = map[status] || { bg: T.warm, border: T.hairline, color: T.ink4 };
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
    }}>{status || '—'}</span>
  );
}

function GhostBtn({ children, onClick, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        fontFamily:    "'DM Mono', monospace",
        fontSize:      10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding:       '8px 16px',
        background:    'transparent',
        color:         hov ? T.ink : T.ink3,
        border:        `1px solid ${hov ? T.hairlineMid : T.hairline}`,
        cursor:        'pointer',
        transition:    'all 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        fontFamily:    "'DM Mono', monospace",
        fontSize:      10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding:       '8px 16px',
        background:    disabled ? T.hairline : hov ? T.gold : T.green,
        color:         disabled ? T.ink4     : hov ? T.green : T.gold,
        border:        `1px solid ${disabled ? T.hairlineMid : T.green}`,
        cursor:        disabled ? 'not-allowed' : 'pointer',
        transition:    'all 0.15s',
        opacity:       disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function TblTh({ children, right = false }) {
  return (
    <th style={{
      fontFamily:   "'DM Mono', monospace",
      fontSize:     9,
      letterSpacing:'0.14em',
      textTransform:'uppercase',
      color:        T.ink3,
      fontWeight:   400,
      padding:      '0 10px 10px',
      textAlign:    right ? 'right' : 'left',
      background:   'none',
      border:       'none',
      borderBottom: `1.5px solid ${T.ink}`,
      whiteSpace:   'nowrap',
    }}>{children}</th>
  );
}

function TblTd({ children, mono = false, right = false, style = {} }) {
  return (
    <td style={{
      fontFamily:  mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
      fontSize:    mono ? 9 : 12,
      fontWeight:  300,
      color:       T.ink2,
      padding:     '9px 10px',
      textAlign:   right ? 'right' : 'left',
      borderBottom:`1px solid ${T.hairline}`,
      letterSpacing: mono ? '0.06em' : 'normal',
      ...style,
    }}>{children}</td>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading]       = useState(true);
  const [stats, setStats]           = useState({ totalUsers: 0, totalReports: 0, activeReports: 0 });
  const [jobSummary, setJobSummary] = useState({ queued: 0, inProgress: 0, published: 0, failed: 0, needsDocuments: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [queueMetrics, setQueueMetrics]   = useState(null);
  const [queueLoading, setQueueLoading]   = useState(false);
  const [queueError, setQueueError]       = useState(null);
  const [lastQueueMetricsAt, setLastQueueMetricsAt] = useState(null);
  const [issueUpdating, setIssueUpdating] = useState({});
  const [adminRunKey, setAdminRunKey] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("ADMIN_RUN_KEY") || "" : "")
  );

  const fetchQueueMetrics = async () => {
    if (!adminRunKey?.trim()) { setQueueError("Admin Run Key required."); return; }
    setQueueLoading(true);
    setQueueError(null);
    try {
      const res  = await fetch("/api/admin/queue-metrics", { method: "GET", headers: { Authorization: `Bearer ${adminRunKey.trim()}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load queue metrics.");
      setQueueMetrics(data);
      setLastQueueMetricsAt(new Date());
    } catch (err) {
      setQueueError(err?.message || "Failed to load queue metrics.");
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const adminEmail = "hello@investoriq.tech";
        setIsAdmin((user?.email || "").toLowerCase().trim() === adminEmail);

        const { count: userCount }               = await supabase.from("users").select("*", { count: "exact", head: true });
        const { count: reportCount, data: reports } = await supabase.from("properties").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(5);
        const activeCount = (reports || []).filter((r) => r.status === "Processing").length;

        const { count: queuedCount }        = await supabase.from("analysis_jobs").select("*", { count: "exact", head: true }).eq("status", "queued");
        const { count: inProgressCount }    = await supabase.from("analysis_jobs").select("*", { count: "exact", head: true }).in("status", ["extracting","underwriting","scoring","rendering","pdf_generating","publishing"]);
        const { count: publishedCount }     = await supabase.from("analysis_jobs").select("*", { count: "exact", head: true }).eq("status", "published");
        const { count: failedCount }        = await supabase.from("analysis_jobs").select("*", { count: "exact", head: true }).eq("status", "failed");
        const { count: needsDocumentsCount} = await supabase.from("analysis_jobs").select("*", { count: "exact", head: true }).eq("status", "needs_documents");

        setStats({ totalUsers: userCount || 0, totalReports: reportCount || 0, activeReports: activeCount });
        setRecentReports(reports || []);
        setJobSummary({ queued: queuedCount || 0, inProgress: inProgressCount || 0, published: publishedCount || 0, failed: failedCount || 0, needsDocuments: needsDocumentsCount || 0 });
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
    fetchQueueMetrics();
    const interval = setInterval(fetchQueueMetrics, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{FONTS}</style>

      <Helmet>
        <title>Admin Console — InvestorIQ</title>
        <meta name="description" content="Administrative overview of user activity, report performance, and platform usage." />
      </Helmet>

      <div style={{ minHeight: '100vh', background: T.warm, fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
        <div style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position:'absolute', top:0, bottom:0, left:40, width:1, background:'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 20%, rgba(201,168,76,0.4) 80%, transparent 100%)', pointerEvents:'none' }} />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px 36px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}
          >
            <div>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:'rgba(201,168,76,0.45)', marginBottom:8 }}>
                InvestorIQ — Admin Console
              </p>
              <h1 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:'clamp(24px,3vw,34px)', fontWeight:500, letterSpacing:'-0.02em', color:'#FFFFFF', lineHeight:1.05, marginBottom:6 }}>
                Operational Overview
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
                Queue health, issue triage, and platform metrics.
              </p>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignSelf:'flex-end' }}>
              <GhostBtn
                onClick={() => window.location.reload()}
                style={{ borderColor:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.4)' }}
              >
                <RefreshCcw style={{ width:11, height:11 }} /> Reload
              </GhostBtn>
            </div>
          </motion.div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 48px 64px' }}>

          {/* Admin Run Key */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <Shield style={{ width:16, height:16, color:T.goldDark, flexShrink:0 }} />
              <div>
                <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:T.goldDark, marginBottom:3 }}>Admin Authentication</p>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:300, color:T.ink3 }}>Required to access admin endpoints and queue operations.</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:200, maxWidth:340 }}>
                <label style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, display:'block', marginBottom:7 }}>
                  Admin Run Key
                </label>
                <input
                  type="password"
                  value={adminRunKey}
                  onChange={(e) => setAdminRunKey(e.target.value)}
                  onBlur={(e) => localStorage.setItem("ADMIN_RUN_KEY", e.target.value || "")}
                  placeholder="Enter admin key"
                  style={{
                    width:'100%', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300,
                    color:T.ink, background:T.white, border:`1px solid ${T.hairlineMid}`,
                    padding:'10px 12px', outline:'none', boxSizing:'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = T.gold; }}
                  onBlur={(e)  => { e.target.style.borderColor = T.hairlineMid; }}
                />
                {!adminRunKey.trim() && (
                  <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.errRed, marginTop:6, letterSpacing:'0.08em' }}>
                    Admin Run Key required to access admin endpoints.
                  </p>
                )}
              </div>
              <PrimaryBtn onClick={fetchQueueMetrics} disabled={!adminRunKey.trim()} style={{ alignSelf:'flex-end', marginBottom:2 }}>
                {queueLoading ? <Loader2 style={{ width:11, height:11, animation:'spin 1s linear infinite' }} /> : null}
                {queueLoading ? 'Loading…' : 'Fetch metrics'}
              </PrimaryBtn>
            </div>
          </Card>

          {/* Operations notice (admin only) */}
          {isAdmin && (
            <div style={{
              padding:'12px 16px', background:T.warm,
              border:`1px solid ${T.hairline}`, borderLeft:`3px solid ${T.goldDark}`,
              marginBottom:12, display:'flex', alignItems:'center', gap:12,
            }}>
              <Shield style={{ width:14, height:14, color:T.goldDark, flexShrink:0 }} />
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink3 }}>
                Queue processing runs automatically every few minutes.
              </p>
            </div>
          )}

          {/* ── LOADING ─────────────────────────────────────────────────── */}
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:12 }}>
              <Loader2 style={{ width:20, height:20, color:T.gold, animation:'spin 1s linear infinite' }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink3 }}>Loading platform data…</span>
            </div>
          ) : (
            <>

              {/* ── JOB STATUS STRIP ───────────────────────────────────── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:12 }}>
                {[
                  { label:'Queued',          val: jobSummary.queued },
                  { label:'In Progress',     val: jobSummary.inProgress },
                  { label:'Needs Documents', val: jobSummary.needsDocuments },
                  { label:'Published',       val: jobSummary.published },
                  { label:'Failed',          val: jobSummary.failed },
                ].map(({ label, val }) => (
                  <div key={label} style={{
                    background:T.white, border:`1px solid ${T.hairline}`,
                    padding:'16px 12px', textAlign:'center',
                  }}>
                    <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:8 }}>{label}</p>
                    <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:500, color:T.ink, lineHeight:1 }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* ── PLATFORM STATS ─────────────────────────────────────── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                {[
                  { icon: Users,    label:'Total Users',   val: stats.totalUsers   },
                  { icon: FileText, label:'Total Reports',  val: stats.totalReports  },
                  { icon: BarChart3,label:'Active Reports', val: stats.activeReports },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} style={{
                    background:T.white, border:`1px solid ${T.hairline}`,
                    padding:'24px 20px', display:'flex', alignItems:'center', gap:16,
                  }}>
                    <Icon style={{ width:20, height:20, color:T.goldDark, flexShrink:0 }} />
                    <div>
                      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:5 }}>{label}</p>
                      <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:500, color:T.ink, lineHeight:1 }}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── QUEUE HEALTH ───────────────────────────────────────── */}
              <Card>
                <SectionHeader
                  eyebrow="Queue Health"
                  title="Recent Jobs"
                  action={
                    <GhostBtn onClick={fetchQueueMetrics} disabled={queueLoading}>
                      {queueLoading
                        ? <Loader2 style={{ width:11, height:11, animation:'spin 1s linear infinite' }} />
                        : <RefreshCcw style={{ width:11, height:11 }} />}
                      {queueLoading ? 'Loading…' : 'Refresh'}
                    </GhostBtn>
                  }
                />

                {lastQueueMetricsAt && (
                  <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.ink4, letterSpacing:'0.08em', marginBottom:12 }}>
                    Last fetched: {lastQueueMetricsAt.toLocaleString()}
                  </p>
                )}

                {queueError && (
                  <div style={{ padding:'10px 14px', background:T.errBg, border:`1px solid ${T.errBorder}`, borderLeft:`3px solid ${T.errBorder}`, marginBottom:16, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.errRed }}>
                    {queueError}
                  </div>
                )}

                {queueMetrics && (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>
                          <TblTh>Job ID</TblTh>
                          <TblTh>Property</TblTh>
                          <TblTh>Status</TblTh>
                          <TblTh>Created</TblTh>
                          <TblTh>Started</TblTh>
                          <TblTh>User</TblTh>
                        </tr>
                      </thead>
                      <tbody>
                        {(queueMetrics?.recent_jobs || []).length === 0 ? (
                          <tr><td colSpan="6" style={{ padding:'20px 10px', textAlign:'center', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4 }}>No recent jobs found.</td></tr>
                        ) : (
                          queueMetrics.recent_jobs.map((job, i) => (
                            <tr key={job.id} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                              <TblTd mono>{job.id}</TblTd>
                              <TblTd style={{ fontWeight:400, color:T.ink }}>{job.property_name || "—"}</TblTd>
                              <TblTd><StatBadge status={job.status} /></TblTd>
                              <TblTd mono>{job.created_at ? new Date(job.created_at).toLocaleString() : '—'}</TblTd>
                              <TblTd mono>{(job.started_at || job.created_at) ? new Date(job.started_at || job.created_at).toLocaleString() : '—'}</TblTd>
                              <TblTd mono>{job.user_id}</TblTd>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* ── ISSUE INBOX ────────────────────────────────────────── */}
              <Card>
                <SectionHeader eyebrow="Support" title="Issue Inbox" />

                {queueMetrics?.issues_error ? (
                  <p style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.ink4, letterSpacing:'0.1em' }}>DATA NOT AVAILABLE</p>
                ) : (queueMetrics?.issues || []).length === 0 ? (
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4 }}>No issues reported.</p>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>
                          <TblTh>Created</TblTh>
                          <TblTh>Status</TblTh>
                          <TblTh>Job ID</TblTh>
                          <TblTh>User ID</TblTh>
                          <TblTh>Message</TblTh>
                          <TblTh>Attachment</TblTh>
                          <TblTh right>Actions</TblTh>
                        </tr>
                      </thead>
                      <tbody>
                        {(queueMetrics?.issues || []).map((issue, i) => {
                          const message    = issue?.message || "";
                          const truncated  = message.length > 120 ? `${message.slice(0, 120)}…` : message;
                          const isUpdating = Boolean(issueUpdating[issue.id]);
                          const regenKey   = `regen-${issue.id}`;
                          const isRegen    = Boolean(issueUpdating[regenKey]);
                          return (
                            <tr key={issue.id} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                              <TblTd mono>{issue.created_at ? new Date(issue.created_at).toLocaleString() : '—'}</TblTd>
                              <TblTd><StatBadge status={issue.status || 'open'} /></TblTd>
                              <TblTd mono>{issue.job_id || '—'}</TblTd>
                              <TblTd mono>{issue.user_id || '—'}</TblTd>
                              <TblTd style={{ maxWidth:200, color:T.ink3, fontSize:12 }}>{truncated}</TblTd>
                              <TblTd>
                                {issue.attachment_url ? (
                                  <a href={issue.attachment_url} target="_blank" rel="noreferrer"
                                    style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:T.goldDark, textDecoration:'none' }}>
                                    View →
                                  </a>
                                ) : issue.attachment_path ? (
                                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.ink4 }}>DATA NOT AVAILABLE</span>
                                ) : '—'}
                              </TblTd>
                              <TblTd right>
                                <div style={{ display:'flex', gap:6, justifyContent:'flex-end', flexWrap:'wrap' }}>
                                  {issue.status !== "reviewing" && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={async () => {
                                        if (!adminRunKey?.trim()) { toast({ title:"Admin Run Key required", variant:"destructive" }); return; }
                                        try {
                                          setIssueUpdating((p) => ({ ...p, [issue.id]: true }));
                                          const res  = await fetch("/api/admin/queue-metrics", { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${adminRunKey.trim()}`}, body:JSON.stringify({ issue_id:issue.id, status:"reviewing" }) });
                                          const data = await res.json().catch(() => ({}));
                                          if (!res.ok || !data?.ok) throw new Error("Update failed");
                                          toast({ title:"Updated" });
                                          await fetchQueueMetrics();
                                        } catch { toast({ title:"Update failed", variant:"destructive" }); }
                                        finally { setIssueUpdating((p) => ({ ...p, [issue.id]: false })); }
                                      }}
                                      style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 10px', background:'transparent', border:`1px solid ${T.hairlineMid}`, color:T.ink3, cursor:isUpdating?'not-allowed':'pointer', opacity:isUpdating?0.5:1 }}
                                    >
                                      Reviewing
                                    </button>
                                  )}
                                  {issue.status !== "resolved" && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={async () => {
                                        if (!adminRunKey?.trim()) { toast({ title:"Admin Run Key required", variant:"destructive" }); return; }
                                        try {
                                          setIssueUpdating((p) => ({ ...p, [issue.id]: true }));
                                          const res  = await fetch("/api/admin/queue-metrics", { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${adminRunKey.trim()}`}, body:JSON.stringify({ issue_id:issue.id, status:"resolved" }) });
                                          const data = await res.json().catch(() => ({}));
                                          if (!res.ok || !data?.ok) throw new Error("Update failed");
                                          toast({ title:"Updated" });
                                          await fetchQueueMetrics();
                                        } catch { toast({ title:"Update failed", variant:"destructive" }); }
                                        finally { setIssueUpdating((p) => ({ ...p, [issue.id]: false })); }
                                      }}
                                      style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 10px', background:'transparent', border:`1px solid ${T.hairlineMid}`, color:T.okGreen, cursor:isUpdating?'not-allowed':'pointer', opacity:isUpdating?0.5:1 }}
                                    >
                                      Resolved
                                    </button>
                                  )}
                                  <button
                                    disabled={isRegen || !issue.job_id}
                                    onClick={async () => {
                                      if (!issue.job_id) return;
                                      if (!adminRunKey?.trim()) { toast({ title:"Admin Run Key required", variant:"destructive" }); return; }
                                      try {
                                        setIssueUpdating((p) => ({ ...p, [regenKey]: true }));
                                        const res  = await fetch("/api/admin/run-eligible-jobs-once", { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${adminRunKey.trim()}`}, body:JSON.stringify({ job_id:issue.job_id }) });
                                        const data = await res.json().catch(() => ({}));
                                        if (!res.ok || !data?.ok) throw new Error("Regeneration failed");
                                        toast({ title:"Regeneration started", description:"Job queued for regeneration." });
                                        await fetchQueueMetrics();
                                      } catch { toast({ title:"Regeneration failed", description:"Unable to start regeneration.", variant:"destructive" }); }
                                      finally { setIssueUpdating((p) => ({ ...p, [regenKey]: false })); }
                                    }}
                                    style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 10px', background:'transparent', border:`1px solid ${T.hairlineMid}`, color:T.warnAmber, cursor:isRegen||!issue.job_id?'not-allowed':'pointer', opacity:isRegen||!issue.job_id?0.4:1 }}
                                    title={!issue.job_id ? "No job id" : undefined}
                                  >
                                    Regen
                                  </button>
                                </div>
                                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:300, color:T.ink4, textAlign:'right', marginTop:4, lineHeight:1.5 }}>
                                  Regen re-queues the same job. No new job, no credit consumed.
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

              {/* ── RECENT REPORTS ─────────────────────────────────────── */}
              <Card>
                <SectionHeader
                  eyebrow="Properties"
                  title="Recent Reports"
                  action={
                    <GhostBtn onClick={() => window.location.reload()}>
                      <RefreshCcw style={{ width:11, height:11 }} /> Refresh
                    </GhostBtn>
                  }
                />

                {recentReports.length === 0 ? (
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:300, color:T.ink4, textAlign:'center', padding:'24px 0' }}>
                    No recent reports available.
                  </p>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>
                          <TblTh>Property</TblTh>
                          <TblTh>User</TblTh>
                          <TblTh>Created</TblTh>
                          <TblTh>Status</TblTh>
                        </tr>
                      </thead>
                      <tbody>
                        {recentReports.map((r, i) => (
                          <tr key={r.id || i} style={{ background: i % 2 === 1 ? T.warm : T.white }}>
                            <TblTd style={{ fontWeight:400, color:T.ink }}>{r.property_address || '—'}</TblTd>
                            <TblTd mono>{r.user_email || '—'}</TblTd>
                            <TblTd mono>{new Date(r.created_at).toLocaleDateString()}</TblTd>
                            <TblTd><StatBadge status={r.status} /></TblTd>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

            </>
          )}
        </div>
      </div>
    </>
  );
}
