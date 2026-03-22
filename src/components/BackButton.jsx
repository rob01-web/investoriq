import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  hairline: '#E8E5DF',
  ink4:     '#9A9A9A',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
`;

/**
 * InvestorIQ Reusable Back Button
 * src/components/BackButton.jsx
 * --------------------------------
 * Fixed top-left nav button for standalone pages.
 * Forest Green / Gold hover inversion. No rounded corners.
 * All navigation logic preserved exactly.
 */
const BackButton = ({ label = 'Back to Dashboard', to = '/' }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);

  // Original navigation logic unchanged
  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(to);
    }
  };

  return (
    <>
      <style>{FONTS}</style>
      <button
        onClick={handleClick}
        aria-label={label}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position:    'fixed',
          top:         24,
          left:        24,
          zIndex:      50,
          display:     'inline-flex',
          alignItems:  'center',
          gap:         8,
          fontFamily:  "'DM Mono', monospace",
          fontSize:    10,
          letterSpacing:'0.14em',
          textTransform:'uppercase',
          fontWeight:  500,
          padding:     '9px 16px',
          background:  hov ? T.gold : T.green,
          color:       hov ? T.green : T.gold,
          border:      `1px solid ${T.green}`,
          cursor:      'pointer',
          transition:  'all 0.15s',
          boxShadow:   '0 2px 12px rgba(15,35,24,0.18)',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        <span className="hidden sm:inline">{label}</span>
      </button>
    </>
  );
};

export default BackButton;
