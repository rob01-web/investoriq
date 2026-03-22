import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

const pipeline = [
  'Upload', 'Parse', 'Extract', 'Validate',
  'Underwrite', 'Score', 'Render', 'Publish', 'Notify',
];

const notList = [
  'Not investment advice',
  'Not an appraisal',
  'No assumptions. Missing inputs disclosed as not present in source documents.',
];

export default function About() {
  return (
    <>
      <style>{FONTS}</style>

      <main style={{ minHeight: '100vh', background: T.white, fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── HEADER BAND ─────────────────────────────────────────────── */}
        <section style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>

          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 48, width: 1,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 15%, rgba(201,168,76,0.4) 85%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          <motion.div
            variants={stagger} initial="hidden" animate="show"
            style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 48px 56px' }}
          >
            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.26em', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.5)', marginBottom: 14,
            }}>
              InvestorIQ — About
            </motion.p>
            <motion.h1 variants={fadeUp} style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 500,
              letterSpacing: '-0.025em', color: '#FFFFFF',
              lineHeight: 1.05, marginBottom: 16, maxWidth: 580,
            }}>
              Built to underwrite.<br />Not to impress.
            </motion.h1>
            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15,
              fontWeight: 300, color: 'rgba(255,255,255,0.45)',
              maxWidth: 480, lineHeight: 1.65,
            }}>
              InvestorIQ produces institutional-format underwriting reports strictly from the documents you provide.
            </motion.p>
          </motion.div>
        </section>

        {/* ── WHAT IT DOES ────────────────────────────────────────────── */}
        <section style={{ background: T.warm, borderBottom: `1px solid ${T.hairline}` }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show"
            viewport={{ once: true }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 48px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '0 56px', alignItems: 'start' }}
              className="about-grid"
            >
              <style>{`@media (max-width: 720px) { .about-grid { grid-template-columns: 1fr !important; } }`}</style>

              <motion.div variants={fadeUp}>
                <p style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: T.goldDark, marginBottom: 12,
                }}>
                  What InvestorIQ Does
                </p>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em',
                  color: T.ink, lineHeight: 1.15,
                }}>
                  Document-based.<br />Deterministic.
                </h2>
                <div style={{ width: 28, height: 1.5, background: T.gold, opacity: 0.7, marginTop: 14 }} />
              </motion.div>

              <motion.div variants={fadeUp}>
                {[
                  'InvestorIQ produces institutional-format underwriting reports from the documents you provide. Outputs are document-based and deterministic.',
                  'Missing inputs are never assumed or filled. Where data is absent or unreadable, InvestorIQ displays DATA NOT AVAILABLE. Every gap is disclosed, not papered over.',
                  'Outputs are formatted for Investment Committee review. Not marketing, not pitch decks. The same inputs always produce the same outputs, with a complete and auditable trail.',
                ].map((para, i) => (
                  <p key={i} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    fontWeight: 300, color: T.ink3, lineHeight: 1.7,
                    marginBottom: 14,
                  }}>
                    {para}
                  </p>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── PIPELINE ────────────────────────────────────────────────── */}
        <section style={{ background: T.white, borderBottom: `1px solid ${T.hairline}` }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show"
            viewport={{ once: true }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 48px' }}
          >
            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: T.goldDark, marginBottom: 10,
            }}>
              Method &amp; Controls
            </motion.p>
            <motion.h2 variants={fadeUp} style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 500,
              letterSpacing: '-0.02em', color: T.ink, lineHeight: 1.1,
              marginBottom: 4,
            }}>
              A locked analysis pipeline.
            </motion.h2>
            <div style={{ width: 28, height: 1.5, background: T.gold, opacity: 0.7, marginTop: 10, marginBottom: 36 }} />

            {/* Pipeline grid */}
            <motion.div variants={fadeUp} style={{
              display: 'flex', flexWrap: 'wrap',
              borderTop: `1px solid ${T.hairline}`,
              borderLeft: `1px solid ${T.hairline}`,
              marginBottom: 28,
            }}>
              {pipeline.map((step, i) => (
                <div key={step} style={{
                  flex: '1 1 auto', minWidth: 90,
                  padding: '18px 16px', textAlign: 'center',
                  borderRight: `1px solid ${T.hairline}`,
                  borderBottom: `1px solid ${T.hairline}`,
                }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9,
                    letterSpacing: '0.16em', color: T.gold, opacity: 0.6, marginBottom: 6,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                    fontWeight: 500, color: T.ink2,
                  }}>
                    {step}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              fontWeight: 300, color: T.ink3, lineHeight: 1.7,
              maxWidth: 640,
            }}>
              Each stage is logged and fail-closed. The system does not proceed past a failed stage — it surfaces the failure and stops. No partial outputs, no silent gaps.
            </motion.p>
          </motion.div>
        </section>

        {/* ── WHAT IT IS NOT ──────────────────────────────────────────── */}
        <section style={{ background: T.warm, borderBottom: `1px solid ${T.hairline}` }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show"
            viewport={{ once: true }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 48px' }}
          >
            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: T.goldDark, marginBottom: 10,
            }}>
              Scope &amp; Limitations
            </motion.p>
            <motion.h2 variants={fadeUp} style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 500,
              letterSpacing: '-0.02em', color: T.ink, lineHeight: 1.1,
              marginBottom: 4,
            }}>
              What InvestorIQ is not.
            </motion.h2>
            <div style={{ width: 28, height: 1.5, background: T.gold, opacity: 0.7, marginTop: 10, marginBottom: 32 }} />

            <motion.div variants={fadeUp} style={{
              display: 'flex', flexDirection: 'column', gap: 0,
              borderTop: `1px solid ${T.hairline}`,
            }}>
              {notList.map((item) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'baseline', gap: 16,
                  padding: '14px 0',
                  borderBottom: `1px solid ${T.hairline}`,
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 10,
                    color: T.gold, opacity: 0.6, flexShrink: 0,
                  }}>
                    —
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    fontWeight: 300, color: T.ink3, lineHeight: 1.65,
                  }}>
                    {item}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── CONTACT BAND ────────────────────────────────────────────── */}
        <section style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 1, background: 'rgba(201,168,76,0.18)', pointerEvents: 'none',
          }} />
          <motion.div
            variants={stagger} initial="hidden" whileInView="show"
            viewport={{ once: true }}
            style={{
              maxWidth: 1100, margin: '0 auto', padding: '64px 48px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 32, flexWrap: 'wrap',
            }}
          >
            <div>
              <motion.p variants={fadeUp} style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.45)', marginBottom: 10,
              }}>
                Contact
              </motion.p>
              <motion.h2 variants={fadeUp} style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 500,
                letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.1,
                maxWidth: 440,
              }}>
                Questions about product, billing, or reports?
              </motion.h2>
            </div>
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
              <a
                href="mailto:hello@investoriq.tech"
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '12px 28px', background: T.gold, color: T.green,
                  fontWeight: 500, textDecoration: 'none', transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                hello@investoriq.tech
              </a>
              <Link
                to="/contact"
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '12px 28px', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'; e.currentTarget.style.color = T.gold; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                Contact page →
              </Link>
            </motion.div>
          </motion.div>
        </section>

      </main>
    </>
  );
}
