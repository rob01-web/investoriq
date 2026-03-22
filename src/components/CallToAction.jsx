import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  goldDark: '#9A7A2C',
  ink:      '#0C0C0C',
  white:    '#FFFFFF',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

/**
 * InvestorIQ Call to Action
 * --------------------------
 * Closing section — Forest Green band, Cormorant headline, gold CTA.
 * Matches the Landing Page and Pricing page closing bands exactly.
 * All navigation logic preserved.
 */
const CallToAction = () => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);

  return (
    <>
      <style>{FONTS}</style>

      <section style={{
        background: T.green,
        position:   'relative',
        overflow:   'hidden',
      }}>

        {/* Gold top line */}
        <div style={{
          position:    'absolute',
          top: 0, left: 0, right: 0,
          height:      1,
          background:  'rgba(201,168,76,0.2)',
          pointerEvents: 'none',
        }} />

        {/* Vertical gold thread */}
        <div style={{
          position:   'absolute',
          top: 0, bottom: 0, left: 48,
          width:      1,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.3) 20%, rgba(201,168,76,0.3) 80%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            maxWidth:   1100,
            margin:     '0 auto',
            padding:    '72px 48px',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap:        32,
            flexWrap:   'wrap',
          }}
        >

          {/* Left — headline */}
          <div>
            <p style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     10,
              letterSpacing:'0.22em',
              textTransform:'uppercase',
              color:        'rgba(201,168,76,0.45)',
              marginBottom: 12,
            }}>
              Get Started
            </p>
            <h2 style={{
              fontFamily:   "'Cormorant Garamond', Georgia, serif",
              fontSize:     'clamp(22px, 3vw, 36px)',
              fontWeight:   500,
              letterSpacing:'-0.02em',
              color:        T.white,
              lineHeight:   1.1,
              maxWidth:     480,
            }}>
              Ready to analyze your next deal?
            </h2>
          </div>

          {/* Right — CTA button */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     11,
              letterSpacing:'0.14em',
              textTransform:'uppercase',
              fontWeight:   500,
              padding:      '13px 32px',
              background:   hov ? 'rgba(201,168,76,0.88)' : T.gold,
              color:        T.green,
              border:       `1px solid ${T.gold}`,
              cursor:       'pointer',
              transition:   'background 0.15s',
              flexShrink:   0,
            }}
          >
            Upload Your Property
          </button>

        </motion.div>
      </section>
    </>
  );
};

export default CallToAction;
