"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { useNavigate, Link } from "react-router-dom";

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
  errorRed:    '#7A1A1A',
  errorBg:     '#FDF4F4',
  errorBorder: '#E8C0C0',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

export default function LoginPage() {
  const [loading, setLoading]   = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const inputStyle = (field) => ({
    width:        '100%',
    fontFamily:   "'DM Sans', sans-serif",
    fontSize:     13,
    fontWeight:   300,
    color:        T.ink,
    background:   T.white,
    border:       `1px solid ${focusedField === field ? T.gold : T.hairlineMid}`,
    padding:      '11px 14px 11px 40px',
    outline:      'none',
    transition:   'border-color 0.15s',
    boxSizing:    'border-box',
  });

  const iconStyle = {
    position:  'absolute',
    left:      14,
    top:       '50%',
    transform: 'translateY(-50%)',
    width:     15,
    height:    15,
    color:     T.ink4,
    pointerEvents: 'none',
  };

  return (
    <>
      <style>{FONTS}</style>

      {/* Full-page layout — left panel green, right panel form */}
      <div style={{
        minHeight:   '100vh',
        display:     'grid',
        gridTemplateColumns: '1fr 1fr',
        fontFamily:  "'DM Sans', sans-serif",
      }}
      className="login-grid"
      >
        <style>{`
          @media (max-width: 700px) {
            .login-grid { grid-template-columns: 1fr !important; }
            .login-left  { display: none !important; }
          }
        `}</style>

        {/* LEFT — Forest Green brand panel */}
        <div className="login-left" style={{
          background: T.green,
          display:    'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding:    '48px',
          position:   'relative',
          overflow:   'hidden',
        }}>

          {/* Vertical gold thread */}
          <div style={{
            position:   'absolute',
            top: 0, bottom: 0, left: 40,
            width:      1,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.4) 15%, rgba(201,168,76,0.4) 85%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Corner geometry */}
          <div style={{
            position:   'absolute',
            top: 40, right: 40,
            width: 60, height: 60,
            borderTop:   '1px solid rgba(201,168,76,0.12)',
            borderRight: '1px solid rgba(201,168,76,0.12)',
          }} />

          {/* Top — brand */}
          <div>
            <div style={{
              fontFamily:   "'Cormorant Garamond', Georgia, serif",
              fontSize:     13,
              fontWeight:   600,
              letterSpacing:'0.22em',
              color:        T.gold,
              textTransform:'uppercase',
              marginBottom: 8,
            }}>
              InvestorIQ
            </div>
            <div style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     9,
              letterSpacing:'0.18em',
              textTransform:'uppercase',
              color:        'rgba(201,168,76,0.35)',
            }}>
              Institutional Real Estate Analysis
            </div>
          </div>

          {/* Middle — headline */}
          <div>
            <p style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     9,
              letterSpacing:'0.22em',
              textTransform:'uppercase',
              color:        'rgba(201,168,76,0.45)',
              marginBottom: 16,
            }}>
              Secure Access
            </p>
            <h1 style={{
              fontFamily:   "'Cormorant Garamond', Georgia, serif",
              fontSize:     'clamp(28px, 3vw, 40px)',
              fontWeight:   500,
              letterSpacing:'-0.02em',
              color:        '#FFFFFF',
              lineHeight:   1.1,
              marginBottom: 20,
            }}>
              Welcome back.
            </h1>
            <div style={{
              width:      36,
              height:     1.5,
              background: T.gold,
              opacity:    0.6,
              marginBottom: 20,
            }} />
            <p style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     14,
              fontWeight:   300,
              color:        'rgba(255,255,255,0.4)',
              lineHeight:   1.65,
              maxWidth:     320,
            }}>
              Sign in to access your InvestorIQ dashboard and generate institutional underwriting reports.
            </p>
          </div>

          {/* Bottom — trust signal */}
          <div style={{
            paddingTop:   20,
            borderTop:    '1px solid rgba(201,168,76,0.12)',
          }}>
            <div style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     9,
              letterSpacing:'0.14em',
              textTransform:'uppercase',
              color:        'rgba(255,255,255,0.18)',
            }}>
              Document-based · Deterministic · No assumptions
            </div>
          </div>

        </div>

        {/* RIGHT — Form panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background:     T.warm,
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'center',
            padding:        '48px',
          }}
        >
          <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>

            {/* Form header */}
            <div style={{ marginBottom: 36 }}>
              <p style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     9,
                letterSpacing:'0.22em',
                textTransform:'uppercase',
                color:        T.goldDark,
                marginBottom: 10,
              }}>
                Sign In
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
                Access your account.
              </h2>
              <div style={{ width: 24, height: 1.5, background: T.gold, opacity: 0.7, marginTop: 10 }} />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Email */}
              <div>
                <label style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     9,
                  letterSpacing:'0.18em',
                  textTransform:'uppercase',
                  color:        T.ink4,
                  display:      'block',
                  marginBottom: 8,
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={iconStyle} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('email')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     9,
                  letterSpacing:'0.18em',
                  textTransform:'uppercase',
                  color:        T.ink4,
                  display:      'block',
                  marginBottom: 8,
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={iconStyle} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('password')}
                  />
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div style={{
                  padding:      '10px 14px',
                  background:   T.errorBg,
                  border:       `1px solid ${T.errorBorder}`,
                  borderLeft:   `3px solid ${T.errorBorder}`,
                  fontFamily:   "'DM Sans', sans-serif",
                  fontSize:     13,
                  fontWeight:   300,
                  color:        T.errorRed,
                  lineHeight:   1.5,
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <SignInButton loading={loading} />

            </form>

            {/* Footer link */}
            <p style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     13,
              fontWeight:   300,
              color:        T.ink3,
              textAlign:    'center',
              marginTop:    24,
            }}>
              Don't have an account?{' '}
              <Link
                to="/signup"
                style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     10,
                  letterSpacing:'0.12em',
                  textTransform:'uppercase',
                  color:        T.goldDark,
                  textDecoration:'none',
                  fontWeight:   500,
                }}
              >
                Create account →
              </Link>
            </p>

          </div>
        </motion.div>
      </div>
    </>
  );
}

// Extracted to avoid hook-in-render issues
function SignInButton({ loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width:        '100%',
        padding:      '13px 24px',
        fontFamily:   "'DM Mono', monospace",
        fontSize:     11,
        letterSpacing:'0.14em',
        textTransform:'uppercase',
        fontWeight:   500,
        background:   loading ? '#E8E5DF' : hov ? '#C9A84C' : '#0F2318',
        color:        loading ? '#9A9A9A' : hov ? '#0F2318' : '#C9A84C',
        border:       `1px solid ${loading ? '#D0CCC4' : '#0F2318'}`,
        cursor:       loading ? 'not-allowed' : 'pointer',
        transition:   'background 0.15s, color 0.15s',
        display:      'inline-flex',
        alignItems:   'center',
        justifyContent:'center',
        gap:          8,
      }}
    >
      {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
      {loading ? 'Signing in…' : 'Sign in'}
    </button>
  );
}
