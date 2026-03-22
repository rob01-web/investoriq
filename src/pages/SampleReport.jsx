// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  goldDark: '#9A7A2C',
  ink:      '#0C0C0C',
  ink3:     '#606060',
  ink4:     '#9A9A9A',
  white:    '#FFFFFF',
  warm:     '#FAFAF8',
  hairline: '#E8E5DF',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

/**
 * SampleReport
 * src/pages/SampleReport.jsx
 * --------------------------------
 * Dev-only sample report viewer.
 * Returns null in production — original guard preserved exactly.
 * All props preserved.
 */
export default function SampleReport({
  sampleTitle = "Sample Report",
  sampleUrl   = "/reports/sample.pdf",
}) {
  // Original production guard — unchanged
  if (import.meta.env.PROD) {
    return null;
  }

  const handleViewReport = () => {
    window.open(sampleUrl, "_blank");
  };

  return (
    <>
      <style>{FONTS}</style>

      <div style={{
        minHeight:      '100vh',
        background:     T.warm,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '48px 24px',
        fontFamily:     "'DM Sans', sans-serif",
        textAlign:      'center',
      }}>

        <div style={{
          background: T.white,
          border:     `1px solid ${T.hairline}`,
          borderTop:  `3px solid ${T.green}`,
          padding:    '48px 52px',
          maxWidth:   520,
          width:      '100%',
        }}>
          <p style={{
            fontFamily:   "'DM Mono', monospace",
            fontSize:     9,
            letterSpacing:'0.22em',
            textTransform:'uppercase',
            color:        T.goldDark,
            marginBottom: 14,
          }}>
            InvestorIQ — Sample Report
          </p>

          <h1 style={{
            fontFamily:   "'Cormorant Garamond', Georgia, serif",
            fontSize:     28,
            fontWeight:   500,
            letterSpacing:'-0.02em',
            color:        T.ink,
            lineHeight:   1.1,
            marginBottom: 4,
          }}>
            {sampleTitle}
          </h1>

          <div style={{ width:24, height:1.5, background:T.gold, opacity:0.7, margin:'10px auto 20px' }} />

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   14,
            fontWeight: 300,
            color:      T.ink3,
            lineHeight: 1.65,
            marginBottom:28,
          }}>
            View the flagship Harborview Drive analysis in a new tab.
            You can download or print directly from the PDF viewer.
          </p>

          <SampleButton onClick={handleViewReport} />
        </div>

      </div>
    </>
  );
}

function SampleButton({ onClick }) {
  const [hov, setHov] = require("react").useState(false);
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
        padding:      '12px 28px',
        background:   hov ? T.gold : T.green,
        color:        hov ? T.green : T.gold,
        border:       `1px solid ${T.green}`,
        cursor:       'pointer',
        transition:   'all 0.15s',
      }}
    >
      View Sample Report
    </button>
  );
}
