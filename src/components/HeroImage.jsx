import React from 'react';
import { motion } from 'framer-motion';

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  goldDark: '#9A7A2C',
  ink:      '#0C0C0C',
  ink4:     '#9A9A9A',
  white:    '#FFFFFF',
  hairline: '#E8E5DF',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
`;

/**
 * HeroImage Component — InvestorIQ
 * ---------------------------------
 * Floating hero visual featuring the InvestorIQ dashboard preview.
 * No rounded corners — institutional posture.
 * Subtle float animation preserved exactly.
 */
const HeroImage = () => {
  return (
    <>
      <style>{FONTS}</style>

      <motion.div
        style={{ marginTop: 48, position: 'relative' }}
        initial={{ opacity: 0, scale: 0.96, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
      >
        <div style={{
          maxWidth:   '1000px',
          margin:     '0 auto',
          position:   'relative',
          overflow:   'hidden',
          border:     `1px solid ${T.hairline}`,
          boxShadow:  '0 10px 50px rgba(15,35,24,0.12)',
        }}>

          {/* Floating hero image — original animation preserved */}
          <motion.img
            src="/hero-image.png"
            alt="InvestorIQ institutional underwriting report preview"
            style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
            initial={{ y: 0 }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Caption overlay — Forest Green + Gold */}
          <div style={{
            position:    'absolute',
            bottom:      12,
            right:       16,
            background:  'rgba(15,35,24,0.88)',
            backdropFilter:'blur(4px)',
            padding:     '4px 12px',
            zIndex:      20,
            display:     'inline-flex',
            alignItems:  'center',
            gap:         6,
          }}>
            <span style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     9,
              letterSpacing:'0.14em',
              textTransform:'uppercase',
              color:        T.gold,
              fontWeight:   500,
            }}>
              InvestorIQ Dashboard Preview
            </span>
          </div>

        </div>
      </motion.div>
    </>
  );
};

export default HeroImage;
