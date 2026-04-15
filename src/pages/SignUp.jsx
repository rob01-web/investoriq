"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User } from "lucide-react";
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

export default function SignUpPage() {
  const [loading, setLoading]     = useState(false);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [fullName, setFullName]   = useState("");
  const [errorMsg, setErrorMsg]   = useState("");
  const [focusedField, setFocused] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
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
    position:      'absolute',
    left:          14,
    top:           '50%',
    transform:     'translateY(-50%)',
    width:         15,
    height:        15,
    color:         T.ink4,
    pointerEvents: 'none',
  };

  const labelStyle = {
    fontFamily:   "'DM Mono', monospace",
    fontSize:     9,
    letterSpacing:'0.18em',
    textTransform:'uppercase',
    color:        T.ink4,
    display:      'block',
    marginBottom: 8,
  };

  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 700px) { .signup-grid { grid-template-columns: 1fr !important; } .signup-left { display: none !important; } }
      `}</style>

      <div className="signup-grid" style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight:           '100vh',
        fontFamily:          "'DM Sans', sans-serif",
      }}>

        {/* LEFT — Forest Green brand panel */}
        <div className="signup-left" style={{
          background:     T.green,
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'space-between',
          padding:        '48px',
          position:       'relative',
          overflow:       'hidden',
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
            position:    'absolute',
            top: 40, right: 40,
            width: 60, height: 60,
            borderTop:   '1px solid rgba(201,168,76,0.12)',
            borderRight: '1px solid rgba(201,168,76,0.12)',
          }} />

          {/* Brand */}
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
              Create Account
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
              Start underwriting<br />with authority.
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
              Create your InvestorIQ account to generate institutional underwriting reports from your property documents.
            </p>

            {/* Mini feature list */}
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Flat fee per property',
                'Screening & Underwriting reports',
                'Document-based · No assumptions',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{
                    fontFamily:   "'DM Mono', monospace",
                    fontSize:     9,
                    color:        T.gold,
                    opacity:      0.55,
                    flexShrink:   0,
                  }}>|</span>
                  <span style={{
                    fontFamily:   "'DM Sans', sans-serif",
                    fontSize:     12,
                    fontWeight:   300,
                    color:        'rgba(255,255,255,0.35)',
                  }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom trust signal */}
          <div style={{
            paddingTop:  20,
            borderTop:   '1px solid rgba(201,168,76,0.12)',
            fontFamily:  "'DM Mono', monospace",
            fontSize:    9,
            letterSpacing:'0.14em',
            textTransform:'uppercase',
            color:       'rgba(255,255,255,0.18)',
          }}>
            Document-based · Deterministic · No assumptions
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
            <div style={{ marginBottom: 32 }}>
              <p style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     9,
                letterSpacing:'0.22em',
                textTransform:'uppercase',
                color:        T.goldDark,
                marginBottom: 10,
              }}>
                Create Account
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
                Get started today.
              </h2>
              <div style={{ width: 24, height: 1.5, background: T.gold, opacity: 0.7, marginTop: 10 }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={iconStyle} />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('name')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={iconStyle} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('email')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={iconStyle} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('password')}
                  />
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div style={{
                  padding:    '10px 14px',
                  background: T.errorBg,
                  border:     `1px solid ${T.errorBorder}`,
                  borderLeft: `3px solid ${T.errorBorder}`,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize:   13,
                  fontWeight: 300,
                  color:      T.errorRed,
                  lineHeight: 1.5,
                }}>
                  {errorMsg}
                </div>
              )}

              <CreateAccountButton loading={loading} />

            </form>

            {/* Footer link */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   13,
              fontWeight: 300,
              color:      T.ink3,
              textAlign:  'center',
              marginTop:  22,
            }}>
              Already have an account?{' '}
              <Link
                to="/login"
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
                Sign in →
              </Link>
            </p>

          </div>
        </motion.div>

      </div>
    </>
  );
}

function CreateAccountButton({ loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width:         '100%',
        padding:       '13px 24px',
        fontFamily:    "'DM Mono', monospace",
        fontSize:      11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight:    500,
        background:    loading ? '#E8E5DF' : hov ? '#C9A84C' : '#0F2318',
        color:         loading ? '#9A9A9A' : hov ? '#0F2318' : '#C9A84C',
        border:        `1px solid ${loading ? '#D0CCC4' : '#0F2318'}`,
        cursor:        loading ? 'not-allowed' : 'pointer',
        transition:    'background 0.15s, color 0.15s',
        display:       'inline-flex',
        alignItems:    'center',
        justifyContent:'center',
        gap:           8,
        marginTop:     4,
      }}
    >
      {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
      {loading ? 'Creating account…' : 'Create account'}
    </button>
  );
}
