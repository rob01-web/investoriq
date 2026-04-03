import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

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
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
`;

function PrimaryBtn({ children, onClick, style = {} }) {
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
        gap:           8,
        fontFamily:    "'DM Mono', monospace",
        fontSize:      11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight:    500,
        padding:       '12px 28px',
        background:    hov ? T.gold : T.green,
        color:         hov ? T.green : T.gold,
        border:        `1px solid ${T.green}`,
        cursor:        'pointer',
        transition:    'background 0.15s, color 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function CheckoutSuccess() {
  const { toast }              = useToast();
  const { profile, fetchProfile } = useAuth();

  const [status, setStatus]           = useState('loading');
  const [productType, setProductType] = useState('');

  useEffect(() => {
    let isMounted = true;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      try {
        const url       = new URL(window.location.href);
        const sessionId = url.searchParams.get('session_id');

        if (!sessionId) {
          if (isMounted) setStatus('error');
          return;
        }

        const res  = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.payment_status !== 'paid') {
          if (isMounted) setStatus('error');
          return;
        }

        const localProductType = String(data?.metadata?.productType || '');
        if (isMounted) setProductType(localProductType);

        if (profile?.id) {
          for (let i = 0; i < 8; i++) {
            await fetchProfile(profile.id);
            await sleep(500);
          }
        }

        if (!isMounted) return;

        setStatus('ok');

        const purchaseLabel =
          localProductType === 'underwriting' ? 'Underwriting Report'
          : localProductType === 'screening'  ? 'Screening Report'
          : 'Report';

        toast({ title: 'Payment received', description: `${purchaseLabel} purchased.` });

        setTimeout(() => { window.location.href = '/dashboard'; }, 3500);

      } catch (e) {
        console.error(e);
        if (isMounted) setStatus('error');
      }
    };

    run();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purchaseLabel =
    productType === 'underwriting' ? 'Underwriting Report'
    : productType === 'screening'  ? 'Screening Report'
    : 'Report';

  return (
    <>
      <style>{FONTS}</style>

      {/* Full-page centered layout — Forest Green top band, white canvas */}
      <div style={{
        minHeight:   '100vh',
        background:  T.warm,
        fontFamily:  "'DM Sans', sans-serif",
        display:     'flex',
        flexDirection:'column',
      }}>

        {/* Top band — brand identity */}
        <div style={{
          background:   T.green,
          height:       52,
          display:      'flex',
          alignItems:   'center',
          padding:      '0 48px',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
          position:     'relative',
          overflow:     'hidden',
        }}>
          <div style={{
            position:   'absolute',
            top: 0, bottom: 0, left: 40,
            width:      1,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 20%, rgba(201,168,76,0.4) 80%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          <span style={{
            fontFamily:   "'Cormorant Garamond', Georgia, serif",
            fontSize:     13,
            fontWeight:   600,
            letterSpacing:'0.22em',
            color:        T.gold,
            textTransform:'uppercase',
          }}>
            InvestorIQ
          </span>
        </div>

        {/* Content — vertically centered */}
        <div style={{
          flex:           1,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '48px 24px',
        }}>
          <div style={{ width: '100%', maxWidth: 520 }}>

            {/* ── LOADING ─────────────────────────────────────────────── */}
            {status === 'loading' && (
              <div style={{
                background: T.white,
                border:     `1px solid ${T.hairline}`,
                padding:    '40px 48px',
                textAlign:  'center',
              }}>
                <Loader2 style={{
                  width: 24, height: 24,
                  color: T.green,
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px',
                  display: 'block',
                }} />
                <p style={{
                  fontFamily:   "'Cormorant Garamond', Georgia, serif",
                  fontSize:     20,
                  fontWeight:   500,
                  letterSpacing:'-0.01em',
                  color:        T.ink,
                  marginBottom: 8,
                }}>
                  Finalizing purchase
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize:   13,
                  fontWeight: 300,
                  color:      T.ink3,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}>
                  Confirming payment and updating your account.
                </p>
                {/* Progress bar */}
                <div style={{
                  width:    '100%',
                  height:   2,
                  background: T.hairline,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height:     '100%',
                    width:      '30%',
                    background: T.gold,
                    animation:  'progress 1.8s ease-in-out infinite',
                  }} />
                </div>
              </div>
            )}

            {/* ── SUCCESS ──────────────────────────────────────────────── */}
            {status === 'ok' && (
              <div style={{
                background: T.white,
                border:     `1px solid ${T.okBorder}`,
                borderTop:  `3px solid ${T.gold}`,
                padding:    '40px 48px',
              }}>
                {/* Gold accent line top */}
                <p style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     9,
                  letterSpacing:'0.22em',
                  textTransform:'uppercase',
                  color:        T.goldDark,
                  marginBottom: 14,
                }}>
                  Payment Confirmed
                </p>
                <h2 style={{
                  fontFamily:   "'Cormorant Garamond', Georgia, serif",
                  fontSize:     28,
                  fontWeight:   500,
                  letterSpacing:'-0.02em',
                  color:        T.ink,
                  lineHeight:   1.1,
                  marginBottom: 4,
                }}>
                  Payment received.
                </h2>
                <div style={{ width: 24, height: 1.5, background: T.gold, opacity: 0.7, marginBottom: 20 }} />

                <div style={{
                  padding:    '14px 16px',
                  background: T.okBg,
                  border:     `1px solid ${T.okBorder}`,
                  borderLeft: `3px solid ${T.okBorder}`,
                  marginBottom: 28,
                }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize:   13,
                    fontWeight: 400,
                    color:      T.okGreen,
                    lineHeight: 1.6,
                  }}>
                    <strong style={{ fontWeight: 500 }}>{purchaseLabel}</strong> purchased and added to your account. Redirecting to your dashboard…
                  </p>
                </div>

                <PrimaryBtn onClick={() => { window.location.href = '/dashboard'; }}>
                  Upload Documents →
                </PrimaryBtn>

                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize:   9,
                  letterSpacing:'0.1em',
                  color:      T.ink4,
                  marginTop:  16,
                }}>
                  You will be redirected automatically in a few seconds.
                </p>
              </div>
            )}

            {/* ── ERROR ────────────────────────────────────────────────── */}
            {status === 'error' && (
              <div style={{
                background: T.white,
                border:     `1px solid ${T.hairline}`,
                borderTop:  `3px solid ${T.hairlineMid}`,
                padding:    '40px 48px',
              }}>
                <p style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     9,
                  letterSpacing:'0.22em',
                  textTransform:'uppercase',
                  color:        T.ink4,
                  marginBottom: 14,
                }}>
                  Checkout Complete
                </p>
                <h2 style={{
                  fontFamily:   "'Cormorant Garamond', Georgia, serif",
                  fontSize:     28,
                  fontWeight:   500,
                  letterSpacing:'-0.02em',
                  color:        T.ink,
                  lineHeight:   1.1,
                  marginBottom: 4,
                }}>
                  Checkout complete.
                </h2>
                <div style={{ width: 24, height: 1.5, background: T.hairlineMid, marginBottom: 20 }} />

                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize:   13,
                  fontWeight: 300,
                  color:      T.ink3,
                  lineHeight: 1.65,
                  marginBottom: 28,
                }}>
                  We could not confirm payment details on this page. If your payment was completed, your report credit will appear in your dashboard shortly. If the issue persists, contact us at billing@investoriq.tech.
                </p>

                <PrimaryBtn onClick={() => { window.location.href = '/dashboard'; }}>
                  Return to Dashboard →
                </PrimaryBtn>
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
