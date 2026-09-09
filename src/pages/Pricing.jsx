'use client';

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  EMPTY_PRICING_CATALOG,
  getPricingAvailabilityMap,
  loadCommerceCatalog,
} from '@/lib/pricingConfig';
import { buildAuthRoute } from '@/lib/authReturnPath';
import { supabase } from '@/lib/customSupabaseClient';

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
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

const PRICING_PAGE_STYLES = `
  .pricing-note {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 400;
    line-height: 1.45;
    color: #606060;
    display: block;
    margin-top: 6px;
    letter-spacing: 0;
    text-transform: none;
    min-height: 32px;
  }

  .pricing-card-header {
    min-height: 86px;
  }

  .pricing-card-price {
    min-height: 104px;
  }

  .pricing-card-description {
    min-height: 66px;
  }

  @media (max-width: 760px) {
    .pricing-note,
    .pricing-card-header,
    .pricing-card-price,
    .pricing-card-description {
      min-height: 0;
    }
  }
`;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

// TIER DATA
const tiers = [
  {
    title:       'Screening Report',
    productType: 'screening',
    eyebrow:     'Acquisition Screening',
    description: 'Fast, document-driven screening for early deal triage and acquisition decisions.',
    pricingNote: 'One-time purchase | No subscription',
    features: [
      'Requires both a Rent Roll and T12; no additional documents accepted',
      'Core operating, occupancy, rent, and source-risk signals',
      'Material source gaps and inconsistencies disclosed',
      '1 Screening report credit',
    ],
    cta: 'Start Screening',
    highlight: false,
  },
  {
    title:       'Underwriting Report',
    productType: 'underwriting',
    eyebrow:     'Institutional Underwriting',
    description: 'Deeper document-driven underwriting for investment review, financing analysis, and downside testing.',
    pricingNote: 'One-time purchase | No subscription',
    features: [
      'Requires both a Rent Roll and T12 plus at least one supporting document',
      'Debt, refinance, and sensitivity analysis where supported',
      'Decision-focused risks, source differences, and unresolved items',
      '1 Underwriting Report credit',
    ],
    cta: 'Start Underwriting',
    highlight: true,
  },
  {
    title:       'Launch Bundle',
    productType: 'bundle',
    eyebrow:     'Screening + Underwriting',
    description: 'Two Screening Reports plus one Underwriting Report at a lower combined price.',
    pricingNote: 'One-time purchase | 3 report credits',
    features: [
      '2 Screening Report credits',
      '1 Underwriting Report credit',
      'Use the credits on the opportunities you choose',
      'Lower price than purchasing the same three reports separately',
    ],
    cta: 'Purchase Bundle',
    highlight: false,
  },
];

const comparisonTiers = tiers.filter((tier) => tier.productType !== 'bundle');

function formatBundleSavings(pricingAvailability) {
  const screening = pricingAvailability?.screening?.product?.unitAmount;
  const underwriting = pricingAvailability?.underwriting?.product?.unitAmount;
  const bundle = pricingAvailability?.bundle?.product?.unitAmount;
  if (![screening, underwriting, bundle].every(Number.isSafeInteger)) return null;
  const savings = (screening * 2) + underwriting - bundle;
  if (savings <= 0) return null;
  return `Save $${Math.round(savings / 100).toLocaleString('en-US')} versus purchasing separately`;
}

// PRICING TILE
function PricingTile({ tier, onCheckout, loadingKey, isAuthenticated, pricingAvailable }) {
  const isLoading = loadingKey === tier.productType;
  const [hovered, setHovered] = useState(false);

  const buttonLabel = isLoading
    ? 'Redirecting...'
    : !pricingAvailable
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

      <div className="pricing-card-header">
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

        <div style={{
          width:        32,
          height:       1.5,
          background:   tier.highlight ? T.gold : T.hairlineMid,
          marginBottom: 20,
          marginTop:    6,
          opacity:      tier.highlight ? 0.8 : 1,
        }} />
      </div>

      <div className="pricing-card-price" style={{ marginBottom: 20 }}>
        <span style={{
          fontFamily:   "'Cormorant Garamond', Georgia, serif",
          fontSize:     52,
          fontWeight:   500,
          letterSpacing:'-0.03em',
          color:        T.ink,
          lineHeight:   1,
          display:      'inline-block',
        }}>
          {tier.price}
        </span>
        <span style={{
          fontFamily:   "'DM Mono', monospace",
          fontSize:     11,
          letterSpacing:'0.14em',
          color:        T.ink4,
          textTransform:'uppercase',
          marginLeft:   8,
          verticalAlign:'baseline',
        }}>
          USD
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
          {tier.productType === 'bundle' ? 'Flat fee | 3 report credits' : 'Flat fee | One property'}
        </span>
        <span className="pricing-note">
          {tier.pricingNote}
        </span>
      </div>

      <p className="pricing-card-description" style={{
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
            <span style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     10,
              color:        T.gold,
              opacity:      0.7,
              flexShrink:   0,
              lineHeight:   1.65,
            }}>
              |
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

      <button
        type="button"
        onClick={() => onCheckout(tier.productType, 1)}
        disabled={isLoading || !pricingAvailable}
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
          background:   hovered && !isLoading && pricingAvailable ? T.gold : T.green,
          color:        hovered && !isLoading && pricingAvailable ? T.green : T.gold,
          border:       `1px solid ${T.green}`,
          cursor:       isLoading || !pricingAvailable ? 'not-allowed' : 'pointer',
          opacity:      isLoading || !pricingAvailable ? 0.5 : 1,
          transition:   'background 0.18s, color 0.18s',
        }}
      >
        {buttonLabel}
      </button>
    </motion.div>
  );
}

export default function PricingPage() {
  const { session } = useAuth();
  const [loadingKey, setLoadingKey] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [commerceCatalog, setCommerceCatalog] = useState(EMPTY_PRICING_CATALOG);
  const pricingAvailability = getPricingAvailabilityMap(commerceCatalog);
  const hasAnyPricingAvailable = Object.values(pricingAvailability).some((entry) => entry.ok);
  const bundleSavingsLabel = formatBundleSavings(pricingAvailability);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setIsAuthed(Boolean(data?.session?.user));
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setIsAuthed(Boolean(authSession?.user));
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    loadCommerceCatalog()
      .then((catalog) => {
        if (mounted) setCommerceCatalog(catalog);
      })
      .catch((error) => {
        console.error('Commerce catalog unavailable:', error);
        if (mounted) setCommerceCatalog(EMPTY_PRICING_CATALOG);
      });
    return () => { mounted = false; };
  }, []);

  const handleCheckout = async (productType, quantity = 1) => {
    try {
      if (!isAuthed) {
        window.location.href = buildAuthRoute('/login', '/pricing');
        return;
      }

      setLoadingKey(productType);
      const accessToken = session?.access_token || '';
      if (!accessToken) {
        window.location.href = buildAuthRoute('/login', '/pricing');
        return;
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ productType, quantity }),
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
      <style>{`${FONTS}\n${PRICING_PAGE_STYLES}`}</style>

      <Helmet>
        <title>Pricing | InvestorIQ</title>
        <meta
          name="description"
          content="Flat-fee InvestorIQ Screening and Underwriting Reports with source-based analysis and transparent scope."
        />
      </Helmet>

      <main style={{ background: T.white, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        <section style={{ background: T.green, position: 'relative', overflow: 'hidden' }}>
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
            style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 48px 56px' }}
          >
            <motion.p variants={fadeUp} style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     10,
              letterSpacing:'0.26em',
              textTransform:'uppercase',
              color:        'rgba(201,168,76,0.5)',
              marginBottom: 14,
            }}>
              InvestorIQ | Report Pricing
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
              Document-driven real estate analysis for investment decisions.
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     15,
              fontWeight:   300,
              color:        'rgba(255,255,255,0.45)',
              maxWidth:     600,
              lineHeight:   1.65,
              marginBottom: isAuthed ? 20 : 0,
            }}>
              Screening requires both a Rent Roll and T12. Underwriting requires both core documents plus at least one supporting due diligence document.
            </motion.p>

            <motion.p variants={fadeUp} style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     13,
              fontWeight:   300,
              color:        'rgba(255,255,255,0.58)',
              maxWidth:     760,
              lineHeight:   1.6,
              marginTop:    10,
              marginBottom: isAuthed ? 20 : 0,
            }}>
              InvestorIQ analyzes only what your uploaded evidence can support. Missing or conflicting inputs are disclosed, and unsupported sections are limited or omitted rather than invented. If the required document package is incomplete or cannot be verified, generation does not begin and no report credit is consumed.
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
                  {"<- Back to Dashboard"}
                </Link>
              </motion.p>
            )}
          </motion.div>
        </section>

        <section style={{ background: T.warm, borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 48px' }}>
            {!hasAnyPricingAvailable && (
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
                  tier={{
                    ...tier,
                    price: pricingAvailability[tier.productType]?.product?.displayPrice || 'Unavailable',
                    pricingNote: tier.productType === 'bundle' && bundleSavingsLabel
                      ? bundleSavingsLabel
                      : tier.pricingNote,
                  }}
                  onCheckout={handleCheckout}
                  loadingKey={loadingKey}
                  isAuthenticated={isAuthed}
                  pricingAvailable={pricingAvailability[tier.productType]?.ok ?? false}
                />
              ))}
            </motion.div>

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
                Portfolio pricing available on request.
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
                If generation fails due to an InvestorIQ system error, the report credit is restored automatically.
                InvestorIQ does not provide investment advice or appraisals.
              </motion.p>

              <motion.p variants={fadeUp} style={{
                fontFamily:   "'DM Sans', sans-serif",
                fontSize:     12,
                fontWeight:   300,
                color:        T.ink4,
                lineHeight:   1.7,
                maxWidth:     680,
              }}>
                InvestorIQ reports are typically delivered within 1 business day.
                Submissions received after business hours, on weekends, or on holidays begin processing on the next business day.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section style={{ background: T.white, borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 48px' }}>
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
                Report Scope
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
                Report Comparison
              </motion.h2>

              <div style={{
                width:        28,
                height:       1.5,
                background:   T.gold,
                opacity:      0.7,
                marginBottom: 36,
                marginTop:    10,
              }} />

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
                        Report Element
                      </th>
                      {comparisonTiers.map((t) => (
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
                      { label: 'Both Rent Roll and T12 required',                         screening: true,  underwriting: true  },
                      { label: 'Additional supporting documents accepted',                screening: false, underwriting: true  },
                      { label: 'At least one supporting document required',               screening: false, underwriting: true  },
                      { label: 'Professional PDF report',                                screening: true,  underwriting: true  },
                      { label: 'Source gaps and inconsistencies disclosed',               screening: true,  underwriting: true  },
                      { label: 'Debt and refinance analysis where supported',             screening: false, underwriting: true  },
                      { label: 'Scenario and downside analysis where supported',           screening: false, underwriting: true  },
                      { label: '1 report credit per purchase',                            screening: true,  underwriting: true  },
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
                            color:     val ? T.ink2 : T.ink4,
                            fontSize:  13,
                            fontFamily:"'DM Sans', sans-serif",
                            fontWeight: val ? 400 : 300,
                            lineHeight: 1.55,
                          }}>
                            {val ? 'Included' : 'Not included'}
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
                Report Purchase
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
                Property-specific pricing. No subscription.
              </motion.p>
            </div>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
              <Link
                to={buildAuthRoute('/signup', '/pricing')}
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
                to={buildAuthRoute('/login', '/pricing')}
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
