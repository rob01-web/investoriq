import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { FileText, Loader2, FileDown } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import BackButton from "@/components/BackButton";

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
  warnAmber:   '#7A4A00',
  warnBg:      '#FDF8EE',
  warnBorder:  '#E8D4A0',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

// Status badge — matches Dashboard and AdminDashboard
function StatusBadge({ status }) {
  const isCompleted  = status === "Completed";
  const isProcessing = status === "Processing";
  const bg     = isCompleted ? T.okBg    : isProcessing ? T.warnBg    : T.warm;
  const border = isCompleted ? T.okBorder: isProcessing ? T.warnBorder: T.hairline;
  const color  = isCompleted ? T.okGreen : isProcessing ? T.warnAmber : T.ink4;
  return (
    <span style={{
      fontFamily:   "'DM Mono', monospace",
      fontSize:     9,
      letterSpacing:'0.14em',
      textTransform:'uppercase',
      padding:      '2px 8px',
      background:   bg,
      border:       `1px solid ${border}`,
      color,
      whiteSpace:   'nowrap',
    }}>
      {status || '—'}
    </span>
  );
}

// Download button
function DownloadBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          5,
        fontFamily:   "'DM Mono', monospace",
        fontSize:     9,
        letterSpacing:'0.12em',
        textTransform:'uppercase',
        fontWeight:   500,
        padding:      '5px 12px',
        background:   hov ? T.gold : T.green,
        color:        hov ? T.green : T.gold,
        border:       `1px solid ${T.green}`,
        cursor:       'pointer',
        transition:   'all 0.15s',
      }}
    >
      <FileDown style={{ width: 11, height: 11 }} />
      Download
    </button>
  );
}

// Go to dashboard button
function DashboardBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily:   "'DM Mono', monospace",
        fontSize:     10,
        letterSpacing:'0.14em',
        textTransform:'uppercase',
        fontWeight:   500,
        padding:      '11px 28px',
        background:   hov ? T.gold : T.green,
        color:        hov ? T.green : T.gold,
        border:       `1px solid ${T.green}`,
        cursor:       'pointer',
        transition:   'all 0.15s',
      }}
    >
      Upload a New Deal
    </button>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ReportHistory() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // All original Supabase logic preserved exactly
  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("id, property_address, created_at, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  return (
    <>
      <style>{FONTS}</style>

      <Helmet>
        <title>Report History — InvestorIQ</title>
        <meta
          name="description"
          content="Review, manage, and download your previously generated InvestorIQ Property IQ Reports."
        />
      </Helmet>

      <div style={{ minHeight: '100vh', background: T.warm, fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── PAGE HEADER ───────────────────────────────────────── */}
        <div style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position:   'absolute', top: 0, bottom: 0, left: 40,
            width:      1,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 20%, rgba(201,168,76,0.4) 80%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ maxWidth: '88rem', margin: '0 auto', padding: '40px 48px 36px' }}
          >
            <p style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     9,
              letterSpacing:'0.22em',
              textTransform:'uppercase',
              color:        'rgba(201,168,76,0.45)',
              marginBottom: 8,
            }}>
              InvestorIQ — Report History
            </p>
            <h1 style={{
              fontFamily:   "'Cormorant Garamond', Georgia, serif",
              fontSize:     'clamp(24px, 3vw, 34px)',
              fontWeight:   500,
              letterSpacing:'-0.02em',
              color:        '#FFFFFF',
              lineHeight:   1.05,
              marginBottom: 6,
            }}>
              Your Reports
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   13,
              fontWeight: 300,
              color:      'rgba(255,255,255,0.4)',
              lineHeight: 1.6,
            }}>
              Access and download your previously generated InvestorIQ reports.
            </p>
          </motion.div>
        </div>

        {/* ── CONTENT ───────────────────────────────────────────── */}
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '28px 48px 80px' }}>

          {/* Loading */}
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:12 }}>
              <Loader2 style={{ width:18, height:18, color:T.gold, animation:'spin 1s linear infinite' }} />
              <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight:300, color:T.ink3 }}>
                Fetching your report history…
              </span>
            </div>

          ) : reports.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: T.white,
                border:     `1px solid ${T.hairline}`,
                padding:    '56px 40px',
                textAlign:  'center',
                maxWidth:   520,
                margin:     '0 auto',
              }}
            >
              <FileText style={{ width:32, height:32, color:T.goldDark, margin:'0 auto 16px' }} />
              <p style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     9,
                letterSpacing:'0.2em',
                textTransform:'uppercase',
                color:        T.goldDark,
                marginBottom: 10,
              }}>
                No Reports Yet
              </p>
              <h3 style={{
                fontFamily:   "'Cormorant Garamond', Georgia, serif",
                fontSize:     22,
                fontWeight:   500,
                letterSpacing:'-0.01em',
                color:        T.ink,
                lineHeight:   1.15,
                marginBottom: 12,
              }}>
                No reports generated yet.
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize:   14,
                fontWeight: 300,
                color:      T.ink3,
                lineHeight: 1.65,
                marginBottom:28,
              }}>
                Upload your first property documents to generate your first
                InvestorIQ Property IQ Report.
              </p>
              <DashboardBtn onClick={() => (window.location.href = '/dashboard')} />
            </motion.div>

          ) : (
            /* Reports table */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                background: T.white,
                border:     `1px solid ${T.hairline}`,
                overflow:   'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'DM Sans', sans-serif", fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:`1.5px solid ${T.ink}` }}>
                      {['Property Address', 'Created', 'Status', 'Action'].map((h, i) => (
                        <th key={h} style={{
                          fontFamily:   "'DM Mono', monospace",
                          fontSize:     9,
                          letterSpacing:'0.14em',
                          textTransform:'uppercase',
                          color:        T.ink3,
                          fontWeight:   400,
                          padding:      '0 12px 12px',
                          textAlign:    i === 3 ? 'right' : 'left',
                          whiteSpace:   'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r, i) => (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: `1px solid ${T.hairline}`,
                          background:   i % 2 === 1 ? T.warm : T.white,
                        }}
                      >
                        <td style={{ padding:'11px 12px', color:T.ink2, fontWeight:400 }}>
                          {r.property_address || '—'}
                        </td>
                        <td style={{
                          padding:    '11px 12px',
                          fontFamily: "'DM Mono', monospace",
                          fontSize:   9,
                          letterSpacing:'0.08em',
                          color:      T.ink4,
                          whiteSpace: 'nowrap',
                        }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          <StatusBadge status={r.status} />
                        </td>
                        <td style={{ padding:'11px 12px', textAlign:'right' }}>
                          <DownloadBtn
                            onClick={() =>
                              alert(`Download for ${r.property_address} coming soon.`)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* BackButton — original component, unchanged */}
      <BackButton />
    </>
  );
}
