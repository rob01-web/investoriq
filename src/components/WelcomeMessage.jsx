import React from "react";
import { motion } from "framer-motion";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  ink:  '#0C0C0C',
  ink3: '#606060',
  gold: '#C9A84C',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');
`;

/**
 * WelcomeMessage — InvestorIQ
 * Animated intro blurb reinforcing the platform's institutional,
 * document-led underwriting identity.
 */
const WelcomeMessage = () => {
  return (
    <>
      <style>{FONTS}</style>
      <motion.p
        style={{
          fontFamily:  "'DM Sans', sans-serif",
          fontSize:    'clamp(16px, 2vw, 20px)',
          fontWeight:  300,
          color:       T.ink3,
          maxWidth:    680,
          margin:      '0 auto',
          textAlign:   'center',
          lineHeight:  1.75,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      >
        Welcome to{' '}
        <span style={{
          fontFamily:  "'Cormorant Garamond', Georgia, serif",
          fontSize:    'clamp(18px, 2.2vw, 22px)',
          fontWeight:  600,
          letterSpacing: '-0.01em',
          color:       T.ink,
        }}>
          InvestorIQ
        </span>
        {' '}- the document-based underwriting platform delivering
        institutional-grade real estate analysis. Upload your documents.
        Receive a report a committee would trust.
      </motion.p>
    </>
  );
};

export default WelcomeMessage;
