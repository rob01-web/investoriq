import { Link } from "react-router-dom";
import InvestorIQHeader from "@/components/InvestorIQHeader";

// ─── DESIGN TOKENS ────────────────────────────────────────────
const T = {
  green:    "#0F2318",
  gold:     "#C9A84C",
  goldDark: "#9A7A2C",
  ink:      "#0C0C0C",
  ink3:     "#606060",
  ink4:     "#9A9A9A",
  white:    "#FFFFFF",
  warm:     "#FAFAF8",
  hairline: "#E8E5DF",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

const footerLinks = [
  { to: "/about",       label: "About"               },
  { to: "/contact",     label: "Contact"              },
  { to: "/pricing",     label: "Pricing"              },
  { to: "/terms",       label: "Terms of Use"         },
  { to: "/privacy",     label: "Privacy Policy"       },
  { to: "/disclosures", label: "Analysis Disclosures" },
];

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        fontFamily:    "'DM Mono', monospace",
        fontSize:      9,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color:         T.ink4,
        textDecoration:"none",
        transition:    "color 0.15s",
        whiteSpace:    "nowrap",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = T.goldDark; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = T.ink4; }}
    >
      {children}
    </Link>
  );
}

export default function MainLayout({ children, showFooter = true }) {
  return (
    <>
      <style>{FONTS}</style>

      <InvestorIQHeader />

      <main style={{ minHeight: "100vh" }}>
        {children}
      </main>

      {showFooter && (
        <footer style={{
          background:  T.green,
          borderTop:   "1px solid rgba(201,168,76,0.1)",
          position:    "relative",
          overflow:    "hidden",
        }}>

          {/* Subtle gold line at very top */}
          <div style={{
            position:   "absolute",
            top: 0, left: 0, right: 0,
            height:     1,
            background: "rgba(201,168,76,0.18)",
            pointerEvents:"none",
          }} />

          <div style={{
            maxWidth: "88rem",
            margin:   "0 auto",
            padding:  "32px 40px",
            display:  "flex",
            flexDirection:"column",
            gap:      20,
          }}>

            {/* Top row — wordmark + links */}
            <div style={{
              display:        "flex",
              alignItems:     "flex-start",
              justifyContent: "space-between",
              flexWrap:       "wrap",
              gap:            20,
            }}>

              {/* Wordmark */}
              <div>
                <span style={{
                  fontFamily:   "'Cormorant Garamond', Georgia, serif",
                  fontSize:     12,
                  fontWeight:   600,
                  letterSpacing:"0.22em",
                  textTransform:"uppercase",
                  color:        T.gold,
                  display:      "block",
                  marginBottom: 4,
                }}>
                  InvestorIQ
                </span>
                <span style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     8,
                  letterSpacing:"0.16em",
                  textTransform:"uppercase",
                  color:        "rgba(201,168,76,0.32)",
                }}>
                  Institutional Real Estate Analysis
                </span>
              </div>

              {/* Footer links */}
              <div style={{
                display:  "flex",
                flexWrap: "wrap",
                gap:      "10px 24px",
                alignItems:"flex-start",
              }}>
                {footerLinks.map(({ to, label }) => (
                  <FooterLink key={to} to={to}>{label}</FooterLink>
                ))}
              </div>

            </div>

            {/* Bottom row — copyright + disclaimer */}
            <div style={{
              paddingTop:   16,
              borderTop:    "1px solid rgba(201,168,76,0.08)",
              display:      "flex",
              flexDirection:"column",
              gap:          6,
            }}>
              <p style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     8,
                letterSpacing:"0.1em",
                color:        "rgba(255,255,255,0.18)",
              }}>
                © 2026 InvestorIQ. All rights reserved.
              </p>
              <p style={{
                fontFamily:   "'DM Sans', sans-serif",
                fontSize:     11,
                fontWeight:   300,
                color:        "rgba(255,255,255,0.2)",
                lineHeight:   1.6,
                maxWidth:     640,
              }}>
                InvestorIQ does not provide investment advice, financial advice, or appraisals.
                Outputs are document-based and informational only. Not a substitute for professional judgment.
              </p>
            </div>

          </div>
        </footer>
      )}
    </>
  );
}
