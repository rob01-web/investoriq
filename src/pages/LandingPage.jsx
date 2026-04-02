import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
// Mirrors the report design system exactly.
// Forest Green on the hero. Ink + Gold everywhere else.
const T = {
  green:      "#0F2318",
  greenMid:   "#163320",
  gold:       "#C9A84C",
  goldDark:   "#9A7A2C",
  goldPale:   "#FBF7EE",
  ink:        "#0C0C0C",
  ink2:       "#363636",
  ink3:       "#606060",
  ink4:       "#9A9A9A",
  white:      "#FFFFFF",
  warm:       "#FAFAF8",
  hairline:   "#E8E5DF",
  hairlineMid:"#D0CCC4",
};

// ─── FONT IMPORT ───────────────────────────────────────────────────────────
// Injected once via a style tag to avoid a separate CSS file dependency.
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

// ─── ANIMATION VARIANTS ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

// ─── SAMPLE CAROUSEL ───────────────────────────────────────────────────────
function SampleCarousel({ pages, label, sublabel, pdfPath }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const SWIPE = 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Label */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: T.goldDark,
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 300,
          color: T.ink3,
        }}>
          {sublabel}
        </div>
      </div>

      {/* Page viewer */}
      <div
        style={{
          aspectRatio: "8.5 / 11",
          width: "100%",
          border: `1px solid ${T.hairline}`,
          background: T.warm,
          overflow: "hidden",
          position: "relative",
        }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          const startX = touchStartX.current;
          if (startX == null) return;
          const endX = e.changedTouches[0]?.clientX ?? null;
          if (endX == null) return;
          const dx = endX - startX;
          if (dx <= -SWIPE) setIndex((i) => Math.min(pages.length - 1, i + 1));
          else if (dx >= SWIPE) setIndex((i) => Math.max(0, i - 1));
          touchStartX.current = null;
        }}
      >
        {pages.length > 0 ? (
          <img
            src={pages[index]}
            alt={`${label} page ${index + 1}`}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: T.ink4,
          }}>
            Sample preview unavailable
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 10,
      }}>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            padding: "4px 10px",
            border: `1px solid ${T.hairline}`,
            background: "transparent",
            color: index === 0 ? T.ink4 : T.ink,
            cursor: index === 0 ? "not-allowed" : "pointer",
            opacity: index === 0 ? 0.4 : 1,
          }}
        >
          ←
        </button>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          color: T.ink4,
        }}>
          {index + 1} / {pages.length}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))}
          disabled={index === pages.length - 1}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            padding: "4px 10px",
            border: `1px solid ${T.hairline}`,
            background: "transparent",
            color: index === pages.length - 1 ? T.ink4 : T.ink,
            cursor: index === pages.length - 1 ? "not-allowed" : "pointer",
            opacity: index === pages.length - 1 ? 0.4 : 1,
          }}
        >
          →
        </button>
      </div>

      {/* PDF links */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <a
          href={pdfPath}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.1em",
            padding: "5px 12px",
            border: `1px solid ${T.hairlineMid}`,
            color: T.ink3,
            textDecoration: "none",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.ink; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.hairlineMid; e.currentTarget.style.color = T.ink3; }}
        >
          View PDF
        </a>
        <a
          href={pdfPath}
          download
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.1em",
            padding: "5px 12px",
            border: `1px solid ${T.hairlineMid}`,
            color: T.ink3,
            textDecoration: "none",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.ink; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.hairlineMid; e.currentTarget.style.color = T.ink3; }}
        >
          Download
        </a>
      </div>

    </div>
  );
}

// ─── TRUST PILLAR ──────────────────────────────────────────────────────────
function TrustPillar({ label, body }) {
  return (
    <motion.div
      variants={fadeUp}
      style={{
        padding: "24px 28px",
        border: `1px solid ${T.hairline}`,
        background: T.warm,
      }}
    >
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: T.goldDark,
        marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        fontWeight: 300,
        color: T.ink3,
        lineHeight: 1.65,
      }}>
        {body}
      </div>
    </motion.div>
  );
}

// ─── PIPELINE STEP ─────────────────────────────────────────────────────────
function PipelineStep({ step, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.16em",
        color: T.gold,
        opacity: 0.7,
      }}>
        {String(step).padStart(2, "0")}
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        fontWeight: 500,
        color: T.ink2,
        letterSpacing: "0.02em",
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function LandingPage() {

  const screeningSamplePages = [
    "/samples/screening/p01.webp",
    "/samples/screening/p02.webp",
    "/samples/screening/p03.webp",
    "/samples/screening/p04.webp",
    "/samples/screening/p05.webp",
    "/samples/screening/p06.webp",
    "/samples/screening/p07.webp",
    "/samples/screening/p08.webp",
  ];

  const underwritingSamplePages = [
    "/samples/underwriting/p01.webp",
    "/samples/underwriting/p02.webp",
    "/samples/underwriting/p03.webp",
    "/samples/underwriting/p04.webp",
    "/samples/underwriting/p05.webp",
    "/samples/underwriting/p06.webp",
    "/samples/underwriting/p07.webp",
    "/samples/underwriting/p08.webp",
  ];

  const pipeline = [
    "Upload", "Parse", "Extract", "Validate",
    "Underwrite", "Score", "Render", "Publish", "Notify",
  ];

  return (
    <>
      <style>{FONTS}</style>

      <Helmet>
        <title>InvestorIQ | Institutional Property Intelligence</title>
        <meta
          name="description"
          content="InvestorIQ produces institutional-grade real estate underwriting reports built strictly from the documents you provide."
        />
      </Helmet>

      <main style={{ background: T.white, fontFamily: "'DM Sans', sans-serif" }}>

        {/* ══════════════════════════════════════════════════════════════════
            HERO — Forest Green. One time. Commands attention.
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{
          background: T.green,
          position: "relative",
          overflow: "hidden",
        }}>

          {/* Vertical gold thread — left */}
          <div style={{
            position: "absolute",
            top: 0, bottom: 0,
            left: 48,
            width: 1,
            background: `linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 15%, rgba(201,168,76,0.4) 85%, transparent 100%)`,
            pointerEvents: "none",
          }} />

          {/* Corner geometry */}
          <div style={{
            position: "absolute",
            top: 32, right: 40,
            width: 80, height: 80,
            borderTop: `1px solid rgba(201,168,76,0.12)`,
            borderRight: `1px solid rgba(201,168,76,0.12)`,
            pointerEvents: "none",
          }} />

          <div style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "80px 48px 72px",
          }}>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
            >

              {/* Eyebrow */}
              <motion.p variants={fadeUp} style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "rgba(201,168,76,0.6)",
                marginBottom: 20,
              }}>
                Document-Driven Real Estate Analysis
              </motion.p>

              {/* Headline */}
              <motion.h1 variants={fadeUp} style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(36px, 5vw, 60px)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
                color: "#FFFFFF",
                maxWidth: 760,
                marginBottom: 24,
              }}>
                Document-driven underwriting reports built for real estate investment decisions.
              </motion.h1>

              {/* Sub */}
              <motion.p variants={fadeUp} style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 300,
                color: "rgba(255,255,255,0.5)",
                maxWidth: 560,
                lineHeight: 1.7,
                marginBottom: 40,
                letterSpacing: "0.01em",
              }}>
                Built strictly from your documents, with outputs traceable to source inputs. Missing items are disclosed as DATA NOT AVAILABLE.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  to="/pricing"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "12px 28px",
                    background: T.gold,
                    color: T.green,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  View Pricing
                </Link>
                <a
                  href="#samples"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "12px 28px",
                    background: "transparent",
                    color: "rgba(255,255,255,0.55)",
                    border: `1px solid rgba(255,255,255,0.18)`,
                    textDecoration: "none",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                    e.currentTarget.style.color = T.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  Review Sample Reports
                </a>
              </motion.div>

              {/* Meta strip */}
              <motion.div variants={fadeUp} style={{
                display: "flex",
                gap: 32,
                marginTop: 56,
                paddingTop: 32,
                borderTop: "1px solid rgba(201,168,76,0.15)",
                flexWrap: "wrap",
              }}>
                {[
                  ["Report Types", "Screening · Underwriting"],
                  ["Pricing", "Flat fee per property"],
                  ["Output", "Professional PDF"],
                  ["Generations", "One per purchase"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(201,168,76,0.45)",
                      marginBottom: 4,
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 300,
                      color: "rgba(255,255,255,0.55)",
                    }}>
                      {val}
                    </div>
                  </div>
                ))}
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SAMPLES — Ink + Gold. White canvas.
        ══════════════════════════════════════════════════════════════════ */}
        <section id="samples" style={{
          background: T.white,
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 48px" }}>

            {/* Section header */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              style={{ marginBottom: 48 }}
            >
              <motion.p variants={fadeUp} style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: T.goldDark,
                marginBottom: 8,
              }}>
                Sample Reports
              </motion.p>
              <motion.h2 variants={fadeUp} style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: T.ink,
                lineHeight: 1.1,
                marginBottom: 4,
              }}>
                Review sample reports before purchase.
              </motion.h2>
              <div style={{
                width: 36,
                height: 1.5,
                background: T.gold,
                marginTop: 12,
                opacity: 0.7,
              }} />
            </motion.div>

            {/* Two-column carousels */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px 56px",
            }}>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
              >
                <SampleCarousel
                  pages={screeningSamplePages}
                  label="Screening Report"
                  sublabel="Built from T12 and Rent Roll documents"
                  pdfPath="/samples/investoriq-screening-sample.pdf"
                />
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
              >
                <SampleCarousel
                  pages={underwritingSamplePages}
                  label="Underwriting Report"
                  sublabel="T12 + Rent Roll + supporting due diligence documents"
                  pdfPath="/samples/investoriq-underwriting-sample.pdf"
                />
              </motion.div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            METHOD — Pipeline strip
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{
          background: T.warm,
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 48px" }}>

            <div style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: "0 56px",
              alignItems: "start",
            }}
            className="method-grid"
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: T.goldDark,
                  marginBottom: 12,
                }}>
                  Method &amp; Controls
                </p>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: T.ink,
                  lineHeight: 1.15,
                  marginBottom: 4,
                }}>
                  A locked underwriting process.
                </h2>
                <div style={{
                  width: 28,
                  height: 1.5,
                  background: T.gold,
                  marginTop: 12,
                  opacity: 0.7,
                }} />
              </motion.div>

              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                {/* Pipeline steps */}
                <motion.div variants={fadeUp} style={{
                  display: "flex",
                  gap: 0,
                  flexWrap: "wrap",
                  borderTop: `1px solid ${T.hairline}`,
                  borderLeft: `1px solid ${T.hairline}`,
                  marginBottom: 28,
                }}>
                  {pipeline.map((step, i) => (
                    <div key={step} style={{
                      flex: "1 1 auto",
                      minWidth: 80,
                      padding: "16px 14px",
                      borderRight: `1px solid ${T.hairline}`,
                      borderBottom: `1px solid ${T.hairline}`,
                      textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.16em",
                        color: T.gold,
                        opacity: 0.6,
                        marginBottom: 5,
                      }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        fontWeight: 500,
                        color: T.ink2,
                        letterSpacing: "0.02em",
                      }}>
                        {step}
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Body copy */}
                {[
                  "InvestorIQ follows a locked underwriting process. Outputs are generated strictly from extracted and computed data.",
                  "The system does not infer missing values or introduce unsupported assumptions. Where inputs are absent, InvestorIQ displays DATA NOT AVAILABLE.",
                  "Outputs are structured for investment committee review. Each stage is logged and fail-closed.",
                ].map((para, i) => (
                  <motion.p key={i} variants={fadeUp} style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 300,
                    color: T.ink3,
                    lineHeight: 1.7,
                    marginBottom: 12,
                  }}>
                    {para}
                  </motion.p>
                ))}

              </motion.div>
            </div>
          </div>

          {/* Responsive override for method grid */}
          <style>{`
            @media (max-width: 720px) {
              .method-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            TRUST PILLARS
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{
          background: T.white,
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 48px" }}>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 1,
                border: `1px solid ${T.hairline}`,
              }}
            >
              {[
                {
                  label: "Document-Only",
                  body: "Outputs are produced strictly from the documents you upload. Nothing is sourced externally or assumed.",
                },
                {
                  label: "No Assumptions",
                  body: "Missing, conflicting, or degraded data is disclosed, not filled. Every gap is surfaced explicitly.",
                },
                {
                  label: "Deterministic",
                  body: "The same inputs produce the same outputs, with a complete audit trail.",
                },
                {
                  label: "Institutional Format",
                  body: "Outputs are structured for investment committee review.",
                },
              ].map(({ label, body }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  style={{
                    padding: "32px 28px",
                    background: T.warm,
                    borderRight: `1px solid ${T.hairline}`,
                  }}
                >
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: T.goldDark,
                    marginBottom: 12,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 300,
                    color: T.ink3,
                    lineHeight: 1.65,
                  }}>
                    {body}
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            CLOSING CTA — Forest Green again. Bookends the page.
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{
          background: T.green,
          position: "relative",
          overflow: "hidden",
        }}>

          {/* Bottom gold thread */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 1,
            background: `rgba(201,168,76,0.2)`,
            pointerEvents: "none",
          }} />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "72px 48px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 28,
            }}
          >
            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(201,168,76,0.5)",
            }}>
              Get Reports
            </motion.p>

            <motion.h2 variants={fadeUp} style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
              lineHeight: 1.1,
              maxWidth: 600,
            }}>
              Flat-fee reports. One property per analysis. No subscription required.
            </motion.h2>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                to="/pricing"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "12px 28px",
                  background: T.gold,
                  color: T.green,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                View Pricing
              </Link>
              <Link
                to="/signup"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "12px 28px",
                  background: "transparent",
                  color: "rgba(255,255,255,0.55)",
                  border: `1px solid rgba(255,255,255,0.18)`,
                  textDecoration: "none",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                  e.currentTarget.style.color = T.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                }}
              >
                Create Account
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 300,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.01em",
              maxWidth: 480,
              lineHeight: 1.6,
            }}>
              InvestorIQ does not provide investment advice or appraisals. Reports are property-specific and document-based.
            </motion.p>

          </motion.div>
        </section>

      </main>
    </>
  );
}
