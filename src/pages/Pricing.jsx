'use client';

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getValidatedPriceConfig } from '@/lib/pricingConfig';
import { supabase } from '@/lib/customSupabaseClient';

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
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

// ─── TIER DATA ───────────────────────────────────────────────────────────────
const tiers = [
  {
    title:       'Screening Report',
    price:       '$249',
    productType: 'screening',
    eyebrow:     'Entry-level analysis',
    description: 'Document-based screening report for initial investment review.',
    features: [
      'Based strictly on T12 + Rent Roll',
      'Formal, lightweight institutional snapshot',
      'No assumptions, no invented data',
      'One generation per purchase',
    ],
    cta: 'Purchase screening report',
    highlight: false,
  },
  {
    title:       'Underwriting Report',
    price:       '$699',
    productType: 'underwriting',
    eyebrow:     'Full institutional analysis',
    description: 'Comprehensive, property-specific underwriting report suitable for investment committee review.',
    features: [
      'Based on T12 + Rent Roll + supporting due diligence documents',
      'Full institutional underwriting artifact',
      'No assumptions, no invented data',
      'One generation per purchase',
    ],
    cta: 'Purchase underwriting report',
    highlight: true,
  },
];

// ─── PRICING TILE ────────────────────────────────────────────────────────────
function PricingTile({ tier, onCheckout, loadingKey, isAuthenticated, pricingOk }) {
  const isLoading = loadingKey === tier.productType;
  const [hovered, setHovered] = useState(false);

  const buttonLabel = isLoading
    ? 'Redirecting…'
    : !pricingOk
    ? 'Pricing unavailable'
    : !isAuthenticated
    ? 'Log in to purchase'
    : tier.cta;

  return (
    <motion.div
      variants={fadeUp}
      style={{
        background:   T.white,
        border:       `1px solid ${tier.highlight ? T.goldDark : T.hairline}`,
        borderTop:    `3px solid ${tier.highlight ? T.gold : T.hairlineMid}`,
        display:      'flex',
        flexDirection:'column',
        padding:      '36px 36px 32px',
        position:     'relative',
      }}
    >

      {/* Highlight badge */}
      {tier.highlight && (
        <div style={{
          position:    'absolute',
          top:         -1,
          right:       28,
          background:  T.gold,
          padding:     '3px 12px',
          fontFamily:  "'DM Mono', monospace",
          fontSize:    9,
          letterSpacing:'0.18em',
          textTransform:'uppercase',
          color:       T.green,
          fontWeight:  500,
        }}>
          Recommended
        </div>
      )}

      {/* Eyebrow */}
      <p style={{
        fontFamily:   "'DM Mono', monospace",
        fontSize:     10,
        letterSpacing:'0.2em',
        textTransform:'uppercase',
        color:        T.goldDark,
        marginBottom: 10,
      }}>
        {tier.eyebrow}
      </p>

      {/* Title */}
      <h3 style={{
        fontFamily:   "'Cormorant Garamond', Georgia, serif",
        fontSize:     26,
        fontWeight:   500,
        letterSpacing:'-0.015em',
        color:        T.ink,
        marginBottom: 4,
        lineHeight:   1.1,
      }}>
        {tier.title}
      </h3>

      {/* Hairline */}
      <div style={{
        width:        32,
        height:       1.5,
        background:   tier.highlight ? T.gold : T.hairlineMid,
        marginBottom: 20,
        marginTop:    6,
        opacity:      tier.highlight ? 0.8 : 1,
      }} />

      {/* Price */}
      <div style={{ marginBottom: 20 }}>
        <span style={{
          fontFamily:   "'Cormorant Garamond', Georgia, serif",
          fontSize:     52,
          fontWeight:   500,
          letterSpacing:'-0.03em',
          color:        T.ink,
          lineHeight:   1,
          display:      'block',
        }}>
          {tier.price}
        </span>
        <span style={{
          fontFamily:   "'DM Mono', monospace",
          fontSize:     10,
          letterSpacing:'0.14em',
          color:        T.ink4,
          textTransform:'uppercase',
          marginTop:    4,
          display:      'block',
        }}>
          Flat fee · One property
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontFamily:   "'DM Sans', sans-serif",
        fontSize:     13,
        fontWeight:   300,
        color:        T.ink3,
        lineHeight:   1.65,
        marginBottom: 24,
        fontStyle:    'italic',
      }}>
        {tier.description}
      </p>

      {/* Features */}
      <ul style={{
        listStyle:    'none',
        padding:      0,
        margin:       0,
        marginBottom: 32,
        display:      'flex',
        flexDirection:'column',
        gap:          10,
        borderTop:    `1px solid ${T.hairline}`,
        paddingTop:   20,
      }}>
        {tier.features.map((f, i) => (
          <li key={i} style={{
            display:    'flex',
            alignItems: 'baseline',
            gap:        10,
          }}>
            {/* Gold dash marker */}
            <span style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     10,
              color:        T.gold,
              opacity:      0.7,
              flexShrink:   0,
              lineHeight:   1.65,
            }}>
              —
            </span>
            <span style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     13,
              fontWeight:   300,
              color:        T.ink3,
              lineHeight:   1.65,
            }}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => onCheckout(tier.productType)}
        disabled={isLoading || !pricingOk}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          marginTop:    'auto',
          width:        '100%',
          padding:      '13px 24px',
          fontFamily:   "'DM Mono', monospace",
          fontSize:     11,
          letterSpacing:'0.14em',
          textTransform:'uppercase',
          fontWeight:   500,
          background:   hovered && !isLoading && pricingOk ? T.gold : T.green,
          color:        hovered && !isLoading && pricingOk ? T.green : T.gold,
          border:       `1px solid ${T.green}`,
          cursor:       isLoading || !pricingOk ? 'not-allowed' : 'pointer',
          opacity:      isLoading || !pricingOk ? 0.5 : 1,
          transition:   'background 0.18s, color 0.18s',
        }}
      >
        {buttonLabel}
      </button>

    </motion.div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PricingPage() {
  const { user } = useAuth();
  const [loadingKey, setLoadingKey]   = useState(null);
  const [isAuthed, setIsAuthed]       = useState(false);
  const pricingConfig                  = getValidatedPriceConfig();
  const pricingOk                      = pricingConfig.ok;

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setIsAuthed(Boolean(data?.session?.user));
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleCheckout = async (productType) => {
    try {
      if (!isAuthed) {
        window.location.href = `/login?next=/pricing`;
        return;
      }

      setLoadingKey(productType);

      const res = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType,
          userId:    user.id,
          userEmail: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        console.error('Checkout session error:', data);
        alert('Unable to start checkout. Please try again.');
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert('Unable to start checkout. Please try again.');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <>
      <style>{FONTS}</style>

      <Helmet>
        <title>Pricing — InvestorIQ</title>
        <meta
          name="description"
          content="Flat-fee institutional reports with transparent scope. Screening and underwriting options."
        />
      </Helmet>

      <main style={{ background: T.white, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── HEADER BAND ─────────────────────────────────────────────── */}
        <section style={{
          background:   T.green,
          position:     'relative',
          overflow:     'hidden',
        }}>

          {/* Vertical gold thread */}
          <div style={{
            position:   'absolute',
            top: 0, bottom: 0, left: 48,
            width:      1,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 20%, rgba(201,168,76,0.4) 80%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            style={{
              maxWidth: 1100,
              margin:   '0 auto',
              padding:  '64px 48px 56px',
            }}
          >

            <motion.p variants={fadeUp} style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     10,
              letterSpacing:'0.26em',
              textTransform:'uppercase',
              color:        'rgba(201,168,76,0.5)',
              marginBottom: 14,
            }}>
              InvestorIQ — Report Pricing
            </motion.p>

            <motion.h1 variants={fadeUp} style={{
              fontFamily:   "'Cormorant Garamond', Georgia, serif",
              fontSize:     'clamp(32px, 4.5vw, 52px)',
              fontWeight:   500,
              letterSpacing:'-0.025em',
              color:        '#FFFFFF',
              lineHeight:   1.05,
              marginBottom: 16,
              maxWidth:     600,
            }}>
              Flat fee. One property.<br />One report.
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     15,
              fontWeight:   300,
              color:        'rgba(255,255,255,0.45)',
              maxWidth:     480,
              lineHeight:   1.65,
              marginBottom: isAuthed ? 20 : 0,
            }}>
              Two report types. Transparent scope. No subscriptions.
            </motion.p>

            {isAuthed && (
              <motion.p variants={fadeUp}>
                <Link
                  to="/dashboard"
                  style={{
                    fontFamily:   "'DM Mono', monospace",
                    fontSize:     10,
                    letterSpacing:'0.14em',
                    textTransform:'uppercase',
                    color:        'rgba(201,168,76,0.5)',
                    textDecoration:'none',
                    transition:   'color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; }}
                >
                  ← Back to Dashboard
                </Link>
              </motion.p>
            )}

          </motion.div>
        </section>

        {/* ── PRICING TILES ───────────────────────────────────────────── */}
        <section style={{
          background:   T.warm,
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{
            maxWidth: 1100,
            margin:   '0 auto',
            padding:  '72px 48px',
          }}>

            {!pricingOk && (
              <div style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     11,
                letterSpacing:'0.1em',
                color:        T.ink3,
                marginBottom: 24,
                padding:      '10px 16px',
                border:       `1px solid ${T.hairline}`,
                background:   T.white,
              }}>
                Pricing configuration is unavailable. Please try again later.
              </div>
            )}

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap:                 24,
                marginBottom:        48,
              }}
            >
              {tiers.map((tier) => (
                <PricingTile
                  key={tier.title}
                  tier={tier}
                  onCheckout={handleCheckout}
                  loadingKey={loadingKey}
                  isAuthenticated={isAuthed}
                  pricingOk={pricingOk}
                />
              ))}
            </motion.div>

            {/* Footnotes */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              style={{
                borderTop:  `1px solid ${T.hairline}`,
                paddingTop: 28,
                display:    'flex',
                flexDirection:'column',
                gap:        10,
              }}
            >
              <motion.p variants={fadeUp} style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     10,
                letterSpacing:'0.1em',
                color:        T.goldDark,
                textTransform:'uppercase',
              }}>
                High-volume institutional usage available by request.
              </motion.p>

              <motion.p variants={fadeUp} style={{
                fontFamily:   "'DM Sans', sans-serif",
                fontSize:     12,
                fontWeight:   300,
                color:        T.ink4,
                lineHeight:   1.7,
                maxWidth:     680,
              }}>
                Reports are property-specific and document-based. Once generation begins, refunds are not available.
                If generation fails due to a system error, InvestorIQ will regenerate the same report at no cost.
                InvestorIQ does not provide investment advice or appraisals.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* ── COMPARISON TABLE ─────────────────────────────────────────── */}
        <section style={{
          background:   T.white,
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{
            maxWidth: 1100,
            margin:   '0 auto',
            padding:  '64px 48px',
          }}>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.p variants={fadeUp} style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     10,
                letterSpacing:'0.22em',
                textTransform:'uppercase',
                color:        T.goldDark,
                marginBottom: 10,
              }}>
                What's included
              </motion.p>

              <motion.h2 variants={fadeUp} style={{
                fontFamily:   "'Cormorant Garamond', Georgia, serif",
                fontSize:     'clamp(24px, 3vw, 34px)',
                fontWeight:   500,
                letterSpacing:'-0.02em',
                color:        T.ink,
                lineHeight:   1.1,
                marginBottom: 4,
              }}>
                Side-by-side comparison.
              </motion.h2>

              <div style={{
                width:        28,
                height:       1.5,
                background:   T.gold,
                opacity:      0.7,
                marginBottom: 36,
                marginTop:    10,
              }} />

              {/* Table */}
              <motion.div variants={fadeUp} style={{ overflowX: 'auto' }}>
                <table style={{
                  width:          '100%',
                  borderCollapse: 'collapse',
                  fontFamily:     "'DM Sans', sans-serif",
                  fontSize:       13,
                }}>
                  <thead>
                    <tr style={{ borderBottom: `1.5px solid ${T.ink}` }}>
                      <th style={{
                        textAlign:    'left',
                        padding:      '0 12px 10px 0',
                        fontFamily:   "'DM Mono', monospace",
                        fontSize:     9,
                        letterSpacing:'0.16em',
                        textTransform:'uppercase',
                        color:        T.ink4,
                        fontWeight:   400,
                      }}>
                        Feature
                      </th>
                      {tiers.map((t) => (
                        <th key={t.title} style={{
                          textAlign:    'center',
                          padding:      '0 12px 10px',
                          fontFamily:   "'DM Mono', monospace",
                          fontSize:     9,
                          letterSpacing:'0.16em',
                          textTransform:'uppercase',
                          color:        t.highlight ? T.goldDark : T.ink3,
                          fontWeight:   500,
                        }}>
                          {t.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'T12 document analysis',                 screening: true,  underwriting: true  },
                      { label: 'Rent roll analysis',                    screening: true,  underwriting: true  },
                      { label: 'Supporting due diligence documents',    screening: false, underwriting: true  },
                      { label: 'Institutional format PDF output',       screening: true,  underwriting: true  },
                      { label: 'No assumptions — DATA NOT AVAILABLE',  screening: true,  underwriting: true  },
                      { label: 'Investment committee-ready depth',      screening: false, underwriting: true  },
                      { label: 'Full underwriting artifact',            screening: false, underwriting: true  },
                      { label: 'One generation per purchase',           screening: true,  underwriting: true  },
                    ].map((row, i) => (
                      <tr key={i} style={{
                        borderBottom: `1px solid ${T.hairline}`,
                        background:   i % 2 === 1 ? T.warm : T.white,
                      }}>
                        <td style={{
                          padding:    '9px 12px 9px 0',
                          color:      T.ink3,
                          fontWeight: 300,
                        }}>
                          {row.label}
                        </td>
                        {[row.screening, row.underwriting].map((val, ci) => (
                          <td key={ci} style={{
                            padding:   '9px 12px',
                            textAlign: 'center',
                            color:     val ? T.gold : T.hairlineMid,
                            fontSize:  14,
                          }}>
                            {val ? '✓' : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* ── CLOSING CTA ─────────────────────────────────────────────── */}
        <section style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position:   'absolute',
            top: 0, left: 0, right: 0,
            height:     1,
            background: 'rgba(201,168,76,0.18)',
            pointerEvents: 'none',
          }} />
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{
              maxWidth:      1100,
              margin:        '0 auto',
              padding:       '64px 48px',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'space-between',
              gap:           32,
              flexWrap:      'wrap',
            }}
          >
            <div>
              <motion.p variants={fadeUp} style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     10,
                letterSpacing:'0.22em',
                textTransform:'uppercase',
                color:        'rgba(201,168,76,0.45)',
                marginBottom: 10,
              }}>
                Ready to begin
              </motion.p>
              <motion.p variants={fadeUp} style={{
                fontFamily:   "'Cormorant Garamond', Georgia, serif",
                fontSize:     'clamp(22px, 3vw, 34px)',
                fontWeight:   500,
                letterSpacing:'-0.02em',
                color:        '#FFFFFF',
                lineHeight:   1.1,
                maxWidth:     480,
              }}>
                One property. One report. No subscriptions required.
              </motion.p>
            </div>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
              <Link
                to="/signup"
                style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     11,
                  letterSpacing:'0.14em',
                  textTransform:'uppercase',
                  padding:      '12px 28px',
                  background:   T.gold,
                  color:        T.green,
                  fontWeight:   500,
                  textDecoration:'none',
                  transition:   'opacity 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Create Account
              </Link>
              <Link
                to="/login"
                style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     11,
                  letterSpacing:'0.14em',
                  textTransform:'uppercase',
                  padding:      '12px 28px',
                  background:   'transparent',
                  color:        'rgba(255,255,255,0.5)',
                  border:       '1px solid rgba(255,255,255,0.18)',
                  textDecoration:'none',
                  transition:   'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)';
                  e.currentTarget.style.color = T.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        </section>

      </main>
    </>
  );
}
