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
  show:   { transition: { staggerChildren: 0.09 } },
};

const contacts = [
  {
    label:   'General Inquiries',
    desc:    'Product questions, report scope, or anything else.',
    value:   'support@investoriq.tech',
    href:    'mailto:support@investoriq.tech',
    cta:     'Send email',
  },
  {
    label:   'Billing & Payments',
    desc:    'Questions about charges, receipts, or report credits.',
    value:   'billing@investoriq.tech',
    href:    'mailto:billing@investoriq.tech?subject=Billing inquiry',
    cta:     'Contact billing',
  },
  {
    label:   'Report Issues',
    desc:    'System or processing errors with a generated report.',
    value:   'reports@investoriq.tech',
    href:    'mailto:reports@investoriq.tech?subject=Report issue',
    cta:     'Report issue',
  },
];

export default function Contact() {
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

          <div style={{
            position: 'absolute', top: 32, right: 48,
            width: 60, height: 60,
            borderTop: '1px solid rgba(201,168,76,0.1)',
            borderRight: '1px solid rgba(201,168,76,0.1)',
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
              InvestorIQ | Contact
            </motion.p>
            <motion.h1 variants={fadeUp} style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 500,
              letterSpacing: '-0.025em', color: '#FFFFFF',
              lineHeight: 1.05, marginBottom: 16, maxWidth: 520,
            }}>
              Get in touch.
            </motion.h1>
            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15,
              fontWeight: 300, color: 'rgba(255,255,255,0.45)',
              maxWidth: 420, lineHeight: 1.65,
            }}>
              For product, billing, or report-related questions. We're here.
            </motion.p>
          </motion.div>
        </section>

        {/* ── CONTACT CHANNELS ────────────────────────────────────────── */}
        <section style={{ background: T.warm, borderBottom: `1px solid ${T.hairline}` }}>
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
              How to reach us
            </motion.p>
            <motion.h2 variants={fadeUp} style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 500,
              letterSpacing: '-0.02em', color: T.ink, lineHeight: 1.1,
              marginBottom: 4,
            }}>
              Choose the right channel.
            </motion.h2>
            <div style={{ width: 28, height: 1.5, background: T.gold, opacity: 0.7, marginTop: 10, marginBottom: 40 }} />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 0,
              border: `1px solid ${T.hairline}`,
            }}>
              {contacts.map((c, i) => (
                <motion.div key={c.label} variants={fadeUp} style={{
                  padding: '32px 28px',
                  background: T.white,
                  borderRight: i < contacts.length - 1 ? `1px solid ${T.hairline}` : 'none',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 10,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: T.goldDark, marginBottom: 10,
                  }}>
                    {c.label}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    fontWeight: 300, color: T.ink3, lineHeight: 1.65,
                    marginBottom: 20, flex: 1,
                  }}>
                    {c.desc}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 11,
                    letterSpacing: '0.08em', color: T.ink2,
                    marginBottom: 16,
                  }}>
                    {c.value}
                  </div>
                  {c.isLink ? (
                    <Link
                      to={c.href}
                      style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 10,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        padding: '10px 20px', background: T.green, color: T.gold,
                        fontWeight: 500, textDecoration: 'none',
                        display: 'inline-block', transition: 'opacity 0.15s',
                        alignSelf: 'flex-start',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      {c.cta}
                    </Link>
                  ) : (
                    <a
                      href={c.href}
                      style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 10,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        padding: '10px 20px', background: T.green, color: T.gold,
                        fontWeight: 500, textDecoration: 'none',
                        display: 'inline-block', transition: 'opacity 0.15s',
                        alignSelf: 'flex-start',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      {c.cta}
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── SCOPE NOTICE ────────────────────────────────────────────── */}
        <section style={{ background: T.white, borderBottom: `1px solid ${T.hairline}` }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show"
            viewport={{ once: true }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 48px' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 56px',
              alignItems: 'start',
            }}
            className="contact-scope-grid"
            >
              <style>{`@media (max-width: 720px) { .contact-scope-grid { grid-template-columns: 1fr !important; } }`}</style>

              <motion.div variants={fadeUp}>
                <p style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: T.goldDark, marginBottom: 10,
                }}>
                  Support Scope
                </p>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em',
                  color: T.ink, lineHeight: 1.15, marginBottom: 4,
                }}>
                  What we can help with.
                </h2>
                <div style={{ width: 24, height: 1.5, background: T.gold, opacity: 0.7, marginTop: 10 }} />
              </motion.div>

              <motion.div variants={fadeUp}>
                {[
                  { can: true,  item: 'System or processing errors on generated reports' },
                  { can: true,  item: 'Billing questions, receipts, and credit issues' },
                  { can: true,  item: 'Product questions about report scope and methodology' },
                  { can: false, item: 'Revising reports based on missing source documents' },
                  { can: false, item: 'Investment advice or property valuations' },
                  { can: false, item: 'Refunds once report generation has begun' },
                ].map(({ can, item }) => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'baseline', gap: 14,
                    padding: '10px 0',
                    borderBottom: `1px solid ${T.hairline}`,
                  }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 10,
                      color: can ? T.goldDark : T.ink4,
                      flexShrink: 0, opacity: can ? 1 : 0.5,
                    }}>
                      {can ? '✓' : '-'}
                    </span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                      fontWeight: 300,
                      color: can ? T.ink2 : T.ink4,
                      lineHeight: 1.6,
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER LINKS ────────────────────────────────────────────── */}
        <section style={{ background: T.warm, borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto', padding: '36px 48px',
            display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
          }}>
            <Link
              to="/privacy"
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: T.ink4, textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.goldDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.ink4; }}
            >
              Security &amp; Privacy →
            </Link>
            <Link
              to="/about"
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: T.ink4, textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.goldDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.ink4; }}
            >
              About InvestorIQ →
            </Link>
            <Link
              to="/pricing"
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: T.ink4, textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.goldDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.ink4; }}
            >
              Report Pricing →
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
