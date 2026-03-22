import React from "react";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  goldDark: '#9A7A2C',
  ink:      '#0C0C0C',
  ink3:     '#606060',
  white:    '#FFFFFF',
  warm:     '#FAFAF8',
  hairline: '#E8E5DF',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

/**
 * PageShell
 * src/layouts/PageShell.jsx
 * --------------------------------
 * Generic page wrapper used by marketing and workflow pages.
 * Marketing pages: max-w-6xl. Workflow pages (Dashboard): max-w-7xl.
 * Forest Green header band + white card body.
 * All props preserved exactly.
 */
export default function PageShell({ title, subtitle, children }) {
  return (
    <>
      <style>{FONTS}</style>

      <div style={{ minHeight: '100vh', background: T.warm, fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header band */}
        <div style={{
          background:   T.green,
          position:     'relative',
          overflow:     'hidden',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
        }}>
          {/* Vertical gold thread */}
          <div style={{
            position:   'absolute',
            top: 0, bottom: 0, left: 48,
            width:      1,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.35) 15%, rgba(201,168,76,0.35) 85%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '48px 48px 40px' }}>
            <p style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     9,
              letterSpacing:'0.22em',
              textTransform:'uppercase',
              color:        'rgba(201,168,76,0.45)',
              marginBottom: 10,
            }}>
              InvestorIQ
            </p>
            <h1 style={{
              fontFamily:   "'Cormorant Garamond', Georgia, serif",
              fontSize:     'clamp(26px, 3.5vw, 40px)',
              fontWeight:   500,
              letterSpacing:'-0.02em',
              color:        '#FFFFFF',
              lineHeight:   1.05,
              marginBottom: subtitle ? 8 : 0,
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize:   14,
                fontWeight: 300,
                color:      'rgba(255,255,255,0.45)',
                lineHeight: 1.65,
                maxWidth:   520,
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Content card */}
        <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '32px 48px 64px' }}>
          <div style={{
            background: T.white,
            border:     `1px solid ${T.hairline}`,
            padding:    '40px 48px',
          }}>
            {children}
          </div>
        </div>

      </div>
    </>
  );
}
