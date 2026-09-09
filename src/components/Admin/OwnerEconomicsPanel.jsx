import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, RefreshCcw, TrendingUp } from 'lucide-react';
import { loadCommerceCatalog } from '@/lib/pricingConfig';
import {
  DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS,
  OWNER_ECONOMICS_STORAGE_KEY,
  deriveOwnerEconomics,
  normalizeOwnerEconomicsAssumptions,
} from '@/lib/ownerEconomics';

const T = {
  green: '#0F2318',
  gold: '#C9A84C',
  goldDark: '#9A7A2C',
  ink: '#0C0C0C',
  ink2: '#363636',
  ink3: '#606060',
  ink4: '#9A9A9A',
  white: '#FFFFFF',
  warm: '#FAFAF8',
  hairline: '#E8E5DF',
  hairlineMid: '#D0CCC4',
  okGreen: '#1A4A22',
  okBg: '#F2F8F3',
  okBorder: '#B8D4BC',
  warnAmber: '#7A4A00',
  warnBg: '#FDF8EE',
  warnBorder: '#E8D4A0',
};

const usd = (value, digits = 0) => Number(value || 0).toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

const cad = (value, digits = 0) => Number(value || 0).toLocaleString('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

const percent = (value) => Number.isFinite(value) ? `${value.toFixed(1)}%` : 'Not applicable';

function loadSavedAssumptions() {
  if (typeof window === 'undefined') return DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS;
  try {
    const raw = window.localStorage.getItem(OWNER_ECONOMICS_STORAGE_KEY);
    if (!raw) return DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS;
    return normalizeOwnerEconomicsAssumptions({
      ...DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS,
      ...JSON.parse(raw),
    });
  } catch (_) {
    return DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS;
  }
}

function MetricCard({ label, value, sub, tone = 'neutral' }) {
  const accent = tone === 'good' ? T.okGreen : tone === 'warn' ? T.warnAmber : T.goldDark;
  return (
    <div style={{ background:T.white, border:`1px solid ${T.hairline}`, borderTop:`3px solid ${accent}`, padding:'15px 18px', minHeight:110 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:T.ink4, marginBottom:8 }}>
        {label}
      </div>
      <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:27, lineHeight:1, fontWeight:500, color:T.ink }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5, lineHeight:1.45, color:T.ink4, marginTop:7 }}>{sub}</div>}
    </div>
  );
}

function NumberField({ label, value, onChange, helper, prefix, suffix, step = '1', min = '0' }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase', color:T.ink4 }}>{label}</span>
      <div style={{ position:'relative' }}>
        {prefix && <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.ink4 }}>{prefix}</span>}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width:'100%',
            boxSizing:'border-box',
            padding:`9px ${suffix ? 28 : 10}px 9px ${prefix ? 22 : 10}px`,
            border:`1px solid ${T.hairlineMid}`,
            background:T.white,
            color:T.ink,
            outline:'none',
            fontFamily:"'DM Sans',sans-serif",
            fontSize:12,
          }}
        />
        {suffix && <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.ink4 }}>{suffix}</span>}
      </div>
      {helper && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9.5, lineHeight:1.4, color:T.ink4 }}>{helper}</span>}
    </label>
  );
}

function SectionTitle({ eyebrow, title, body }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.18em', textTransform:'uppercase', color:T.goldDark, marginBottom:4 }}>{eyebrow}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:21, fontWeight:500, color:T.ink, lineHeight:1.1 }}>{title}</div>
      {body && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, lineHeight:1.55, color:T.ink4, marginTop:6, maxWidth:850 }}>{body}</div>}
    </div>
  );
}

export default function OwnerEconomicsPanel({ actualRevenueMinor = null, actualCheckoutCount = null }) {
  const [assumptions, setAssumptions] = useState(loadSavedAssumptions);
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    let mounted = true;
    loadCommerceCatalog()
      .then((nextCatalog) => {
        if (!mounted) return;
        setCatalog(nextCatalog);
        setCatalogError('');
      })
      .catch(() => {
        if (!mounted) return;
        setCatalog(null);
        setCatalogError('Pricing catalog unavailable. Scenario revenue cannot be calculated until pricing loads.');
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(OWNER_ECONOMICS_STORAGE_KEY, JSON.stringify(assumptions));
    } catch (_) {
      // Browser persistence is helpful, but never required for the calculator.
    }
  }, [assumptions]);

  const prices = useMemo(() => ({
    screening: Number(catalog?.products?.screening?.unitAmount || 0) / 100,
    underwriting: Number(catalog?.products?.underwriting?.unitAmount || 0) / 100,
    bundle: Number(catalog?.products?.bundle?.unitAmount || 0) / 100,
  }), [catalog]);

  const economics = useMemo(() => deriveOwnerEconomics({ assumptions, prices }), [assumptions, prices]);

  const update = (field) => (value) => {
    setAssumptions((current) => normalizeOwnerEconomicsAssumptions({ ...current, [field]: value }));
  };

  const reset = () => setAssumptions({ ...DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS });
  const actualRevenueUsd = Number.isFinite(actualRevenueMinor) ? actualRevenueMinor / 100 : null;
  const scenarioAvailable = prices.screening > 0 && prices.underwriting > 0 && prices.bundle > 0;

  return (
    <section data-testid="owner-economics-panel" style={{ marginBottom:16 }}>
      <div style={{ background:T.white, border:`1px solid ${T.hairline}`, padding:'22px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap', paddingBottom:16, borderBottom:`1px solid ${T.hairline}` }}>
          <div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:T.goldDark, marginBottom:5 }}>Owner Economics</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:24, fontWeight:500, color:T.ink, lineHeight:1.05, margin:0 }}>Revenue and contribution planner</h2>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, lineHeight:1.55, color:T.ink4, margin:'7px 0 0', maxWidth:760 }}>
              Planning only. Change purchase volume and cost assumptions to estimate monthly contribution. This panel never changes Stripe, report credits, customer jobs, or production billing.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 10px', border:`1px solid ${T.hairlineMid}`, background:T.white, color:T.ink3, cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:'0.12em', textTransform:'uppercase' }}
          >
            <RefreshCcw size={11} /> Reset launch baseline
          </button>
        </div>

        <div style={{ paddingTop:18 }}>
          <SectionTitle
            eyebrow="Actual Month to Date"
            title="What InvestorIQ has actually collected"
            body="Gross settled checkout activity from the existing governed admin commerce summary. Net actuals will become more precise once live product-mix and observed provider fees are available."
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, marginBottom:24 }}>
            <MetricCard label="Settled Revenue MTD" value={actualRevenueUsd === null ? 'Unavailable' : usd(actualRevenueUsd, 2)} sub="Gross settled checkout receipts" />
            <MetricCard label="Settled Checkouts MTD" value={Number.isFinite(actualCheckoutCount) ? actualCheckoutCount.toLocaleString('en-US') : 'Unavailable'} sub="Completed settled checkout count" />
            <MetricCard label="Canonical Screening Price" value={scenarioAvailable ? usd(prices.screening) : 'Unavailable'} sub="Loaded from server-owned commerce catalog" />
            <MetricCard label="Canonical Underwriting Price" value={scenarioAvailable ? usd(prices.underwriting) : 'Unavailable'} sub={`Bundle ${scenarioAvailable ? usd(prices.bundle) : 'unavailable'}`} />
          </div>
        </div>

        <div style={{ background:T.warm, border:`1px solid ${T.hairline}`, padding:'20px', marginBottom:20 }}>
          <SectionTitle
            eyebrow="Scenario Planner"
            title="What if we sell more reports?"
            body="Enter monthly purchases. Bundle purchases automatically create two Screening report obligations and one Underwriting report obligation."
          />
          {catalogError && <div style={{ marginBottom:14, padding:'9px 11px', background:T.warnBg, border:`1px solid ${T.warnBorder}`, color:T.warnAmber, fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>{catalogError}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14 }}>
            <NumberField label="Screening Purchases" value={assumptions.screeningPurchases} onChange={update('screeningPurchases')} helper={scenarioAvailable ? `${usd(prices.screening)} each` : 'Price unavailable'} />
            <NumberField label="Underwriting Purchases" value={assumptions.underwritingPurchases} onChange={update('underwritingPurchases')} helper={scenarioAvailable ? `${usd(prices.underwriting)} each` : 'Price unavailable'} />
            <NumberField label="Bundle Purchases" value={assumptions.bundlePurchases} onChange={update('bundlePurchases')} helper={scenarioAvailable ? `${usd(prices.bundle)} each | 2 Screening + 1 Underwriting` : 'Price unavailable'} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, marginTop:18 }}>
            <MetricCard label="Monthly Checkouts" value={economics.checkoutCount.toLocaleString('en-US')} sub="Used for Stripe fixed-fee estimate" />
            <MetricCard label="Screening Reports" value={economics.screeningReports.toLocaleString('en-US')} sub="Standalone Screening + 2 per Bundle" />
            <MetricCard label="Underwriting Reports" value={economics.underwritingReports.toLocaleString('en-US')} sub="Standalone Underwriting + 1 per Bundle" />
            <MetricCard label="Total Reports" value={economics.totalReports.toLocaleString('en-US')} sub="Estimated monthly report workload" />
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <SectionTitle
            eyebrow="Cost Assumptions"
            title="Enter the costs you actually expect to pay"
            body="Launch planning defaults use the paid infrastructure we expect to operate with, not today&apos;s temporary free tiers. Provider assumptions remain editable and should be replaced with observed production costs as sales accumulate."
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14 }}>
            <NumberField label="Stripe Base Percentage" value={assumptions.stripePercent} onChange={update('stripePercent')} suffix="%" step="0.1" helper="Canada standard online-card baseline: 2.9%" />
            <NumberField label="Stripe Fixed Fee / Checkout" value={assumptions.stripeFixedPerCheckout} onChange={update('stripeFixedPerCheckout')} prefix="$" step="0.01" helper="USD-presented charge baseline: US$0.30" />
            <NumberField label="Stripe Currency Conversion" value={assumptions.stripeCurrencyConversionPercent} onChange={update('stripeCurrencyConversionPercent')} suffix="%" step="0.1" helper="Leave 0 unless Stripe currency conversion is required; current public add-on is 2%" />
            <NumberField label="Screening AI / API Cost" value={assumptions.screeningAiCost} onChange={update('screeningAiCost')} prefix="$" step="0.01" helper="Conservative owner-planning allowance: $1.00 per Screening report" />
            <NumberField label="Underwriting AI / API Cost" value={assumptions.underwritingAiCost} onChange={update('underwritingAiCost')} prefix="$" step="0.01" helper="Conservative owner-planning allowance: $2.00 per Underwriting report" />
            <NumberField label="Textract $ / Analyzed Page" value={assumptions.textractPricePerPage} onChange={update('textractPricePerPage')} prefix="$" step="0.001" helper="AnalyzeDocument TABLES launch baseline: $0.015 per analyzed page" />
            <NumberField label="Screening Textract Pages" value={assumptions.screeningTextractPages} onChange={update('screeningTextractPages')} step="1" helper="Conservative launch allowance: 34 analyzed pages, about $0.51 per Screening report" />
            <NumberField label="Underwriting Textract Pages" value={assumptions.underwritingTextractPages} onChange={update('underwritingTextractPages')} step="1" helper="Conservative launch allowance: 100 analyzed pages, $1.50 per Underwriting report" />
            <NumberField label="Screening Other Variable" value={assumptions.screeningOtherVariableCost} onChange={update('screeningOtherVariableCost')} prefix="$" step="0.01" helper="Optional per-Screening cost not modeled above" />
            <NumberField label="Underwriting Other Variable" value={assumptions.underwritingOtherVariableCost} onChange={update('underwritingOtherVariableCost')} prefix="$" step="0.01" helper="Optional per-Underwriting cost not modeled above" />
            <NumberField label="Vercel Monthly" value={assumptions.vercelMonthlyCost} onChange={update('vercelMonthlyCost')} prefix="$" step="0.01" helper="Launch baseline: Pro $20/month" />
            <NumberField label="Supabase Monthly" value={assumptions.supabaseMonthlyCost} onChange={update('supabaseMonthlyCost')} prefix="$" step="0.01" helper="Launch baseline: Pro $25/month" />
            <NumberField label="DocRaptor Monthly" value={assumptions.docraptorMonthlyCost} onChange={update('docraptorMonthlyCost')} prefix="$" step="0.01" helper="Launch baseline: Professional $29/month for 325 documents" />
            <NumberField label="Domain + Email Monthly" value={assumptions.domainEmailMonthlyCost} onChange={update('domainEmailMonthlyCost')} prefix="$" step="0.01" helper="Hostinger planning baseline: about $100/year normalized monthly" />
            <NumberField label="Resend Monthly" value={assumptions.resendMonthlyCost} onChange={update('resendMonthlyCost')} prefix="$" step="0.01" helper="Report-ready email provider. Current launch baseline: $0" />
            <NumberField label="Other Monthly Costs" value={assumptions.otherMonthlyCost} onChange={update('otherMonthlyCost')} prefix="$" step="0.01" />
            <NumberField label="CAD per USD" value={assumptions.cadPerUsd} onChange={update('cadPerUsd')} step="0.01" helper="Planning conversion for CAD-equivalent headline values" />
          </div>
        </div>

        <div style={{ margin:'4px 0 20px', padding:'11px 13px', background:T.okBg, border:`1px solid ${T.okBorder}`, color:T.okGreen, fontFamily:"'DM Sans',sans-serif", fontSize:10.5, lineHeight:1.55 }}>
          Launch baseline as of September 9, 2026: Vercel Pro $20/month, Supabase Pro $25/month, DocRaptor Professional $29/month, Hostinger domain and email about $100/year, Resend $0/month at current launch volume, Amazon Textract AnalyzeDocument TABLES $0.015 per analyzed page, and Stripe base card processing 2.9% + US$0.30 for a USD-presented charge. AWS promotional credits are intentionally excluded. OpenAI owner-planning allowances are $1 per Screening report and $2 per Underwriting report. Textract planning allowances are 34 analyzed pages per Screening report and 100 analyzed pages per Underwriting report. These are deliberately conservative planning assumptions and should be replaced with observed post-launch averages when enough production data exists.
        </div>

        <div style={{ borderTop:`1px solid ${T.hairline}`, paddingTop:20 }}>
          <SectionTitle
            eyebrow="Projected Economics"
            title="What is left after the modeled costs?"
            body="Contribution is before income tax and owner compensation. It is intended as an operating planning view, not accounting or tax advice."
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:10 }}>
            <MetricCard label="Gross Monthly Revenue" value={usd(economics.grossRevenue, 2)} sub={`${cad(economics.grossRevenueCad, 0)} CAD equivalent`} />
            <MetricCard label="Estimated Stripe Fees" value={usd(economics.stripeFees, 2)} sub={`${economics.stripeEffectivePercent.toFixed(1)}% effective + ${usd(economics.stripeFixedFees, 2)} fixed`} tone="warn" />
            <MetricCard label="AI / API Costs" value={usd(economics.aiCosts, 2)} sub="Observed per-report OpenAI assumptions" tone="warn" />
            <MetricCard label="Textract Costs" value={usd(economics.textractCosts, 2)} sub={`${economics.textractPagesTotal.toLocaleString('en-US')} analyzed pages at ${usd(assumptions.textractPricePerPage, 3)} each`} tone="warn" />
            <MetricCard label="Other Variable Costs" value={usd(economics.otherVariableCosts, 2)} sub="Optional per-report variable assumptions" tone="warn" />
            <MetricCard label="Total Variable Report Costs" value={usd(economics.variableReportCosts, 2)} sub="AI + Textract + other variable costs" tone="warn" />
            <MetricCard label="Fixed Monthly Costs" value={usd(economics.fixedMonthlyCosts, 2)} sub="Vercel + Supabase + DocRaptor + domain/email + Resend + other" tone="warn" />
            <MetricCard label="Projected Net Monthly Contribution" value={usd(economics.netMonthlyContribution, 2)} sub={`${cad(economics.netMonthlyContributionCad, 0)} CAD equivalent`} tone={economics.netMonthlyContribution >= 0 ? 'good' : 'warn'} />
            <MetricCard label="Net Contribution Margin" value={percent(economics.netMarginPercent)} sub="Projected net contribution / gross revenue" tone={economics.netMonthlyContribution >= 0 ? 'good' : 'warn'} />
            <MetricCard label="Annualized Revenue" value={usd(economics.annualizedRevenue, 0)} sub="Scenario monthly revenue x 12" />
            <MetricCard label="Annualized Net Contribution" value={usd(economics.annualizedNetContribution, 0)} sub="Scenario monthly contribution x 12" tone={economics.annualizedNetContribution >= 0 ? 'good' : 'warn'} />
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:18, padding:'10px 12px', background:T.okBg, border:`1px solid ${T.okBorder}`, color:T.okGreen }}>
          <TrendingUp size={13} />
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5, lineHeight:1.45 }}>
            Your scenario assumptions are saved only in this browser. They are never submitted to Stripe or used to change production pricing.
          </span>
        </div>
      </div>
    </section>
  );
}
