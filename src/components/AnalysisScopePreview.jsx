import React from "react";

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
  warnAmber:   '#7A4A00',
  warnBg:      '#FDF8EE',
  warnBorder:  '#E8D4A0',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

// Included / Not Included badge
function StatusBadge({ included }) {
  return included ? (
    <span style={{
      fontFamily:   "'DM Mono', monospace",
      fontSize:     9,
      letterSpacing:'0.14em',
      textTransform:'uppercase',
      fontWeight:   500,
      padding:      '2px 10px',
      background:   T.okBg,
      border:       `1px solid ${T.okBorder}`,
      color:        T.okGreen,
      whiteSpace:   'nowrap',
    }}>
      Included
    </span>
  ) : (
    <span style={{
      fontFamily:   "'DM Mono', monospace",
      fontSize:     9,
      letterSpacing:'0.14em',
      textTransform:'uppercase',
      fontWeight:   500,
      padding:      '2px 10px',
      background:   T.warm,
      border:       `1px solid ${T.hairline}`,
      color:        T.ink4,
      whiteSpace:   'nowrap',
    }}>
      Not Included
    </span>
  );
}

// Scope tier card
function ScopeTier({ title, requires, items, included }) {
  return (
    <div style={{
      border:     `1px solid ${included ? T.okBorder : T.hairline}`,
      background: included ? T.okBg : T.white,
      padding:    '16px 18px',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:6 }}>
        <h4 style={{
          fontFamily:   "'DM Sans', sans-serif",
          fontSize:     13,
          fontWeight:   500,
          color:        T.ink,
          lineHeight:   1.3,
        }}>
          {title}
        </h4>
        <StatusBadge included={included} />
      </div>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize:   9,
        letterSpacing:'0.1em',
        color:      T.ink4,
        marginBottom: 10,
      }}>
        Requires: {requires}
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {items.map((item) => (
          <div key={item} style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize:   9,
              color:      included ? T.goldDark : T.ink4,
              opacity:    included ? 0.8 : 0.5,
              flexShrink: 0,
            }}>—</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   12,
              fontWeight: 300,
              color:      included ? T.ink2 : T.ink4,
              lineHeight: 1.55,
            }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const AnalysisScopePreview = ({
  hasRentRoll,
  hasT12,
  hasPurchase,
  hasCapex,
  hasDebt,
  hasMarket,
  rentRollCoverage = null,
}) => {
  // All original logic preserved exactly
  const operatingIncluded = Boolean(hasRentRoll && hasT12);
  const dealIncluded = Boolean(operatingIncluded && hasPurchase && hasCapex && hasDebt);
  const icIncluded = Boolean(dealIncluded && hasMarket);

  const hasProvidedUnits = rentRollCoverage && Number.isFinite(rentRollCoverage.provided);
  const hasTotalUnits    = rentRollCoverage && Number.isFinite(rentRollCoverage.total);
  const hasPercent       = rentRollCoverage && Number.isFinite(rentRollCoverage.percent);
  const showCoverageWarning = hasPercent && rentRollCoverage.percent < 70;

  return (
    <>
      <style>{FONTS}</style>

      <div style={{
        background:  T.white,
        border:      `1px solid ${T.hairline}`,
        padding:     '24px 28px',
        fontFamily:  "'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontFamily:   "'DM Mono', monospace",
            fontSize:     9,
            letterSpacing:'0.2em',
            textTransform:'uppercase',
            color:        T.goldDark,
            marginBottom: 6,
          }}>
            Analysis Scope Preview
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   13,
            fontWeight: 300,
            color:      T.ink3,
            lineHeight: 1.6,
          }}>
            Summary of what will be included based on the documents provided.
          </p>
        </div>

        {/* Rent roll coverage notice */}
        {hasProvidedUnits && (
          <div style={{
            padding:      '10px 14px',
            background:   T.warnBg,
            border:       `1px solid ${T.warnBorder}`,
            borderLeft:   `3px solid ${T.warnBorder}`,
            marginBottom: 16,
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     13,
            fontWeight:   300,
            color:        T.warnAmber,
            lineHeight:   1.6,
          }}>
            {hasPercent && hasTotalUnits ? (
              <>
                Rent Roll Coverage: {rentRollCoverage.provided} / {rentRollCoverage.total}{' '}
                units ({Math.round(rentRollCoverage.percent)}%).
                {showCoverageWarning ? ' Analysis reflects only the units provided.' : ''}
              </>
            ) : (
              <>
                Rent Roll Units Provided: {rentRollCoverage.provided}. Total unit count not
                provided in uploaded documents.
              </>
            )}
          </div>
        )}

        {/* Scope tiers */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <ScopeTier
            title="First-Look Operating Snapshot"
            requires="Rent Roll + T12 / Operating Statement"
            included={operatingIncluded}
            items={[
              'Unit count, occupancy, and rent roll summary',
              'Trailing 12 income and expense snapshot',
              'Document source summary',
            ]}
          />
          <ScopeTier
            title="Deal Underwriting"
            requires="Operating Snapshot + Purchase, Capex, Debt"
            included={dealIncluded}
            items={[
              'Underwriting inputs for price, capex, and debt',
              'Base-case return summary',
              'Scenario highlights from provided inputs',
            ]}
          />
          <ScopeTier
            title="IC-Ready Investment Memo"
            requires="Deal Underwriting + Market Data"
            included={icIncluded}
            items={[
              'Market positioning and location summary',
              'Risk and sensitivity highlights',
              'Institutional report formatting',
            ]}
          />
        </div>

      </div>
    </>
  );
};

export default AnalysisScopePreview;
