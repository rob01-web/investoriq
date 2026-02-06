'use client';

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { CheckCircle } from 'lucide-react';
import { PALETTE } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const tiers = [
  {
    title: 'Screening Report',
    price: '$249',
    cadence: '',
    productType: 'screening',
    description: 'Document-based screening report for initial investment review.',
    features: [
      'Based strictly on T12 + Rent Roll',
      'Formal, lightweight institutional snapshot',
      'No assumptions, no invented data',
      'Revisions: 2 total',
    ],
  },
  {
    title: 'Underwriting Report',
    price: '$699',
    cadence: '',
    productType: 'underwriting',
    highlight: true,
    description: 'Comprehensive, property-specific underwriting report suitable for investment committee review.',
    features: [
      'Based on T12 + Rent Roll + optional supporting documents',
      'Full institutional underwriting artifact',
      'No assumptions, no invented data',
      'Revisions: 3 total',
    ],
  },
];

function PricingTile({ tier, onCheckout, loadingKey, isAuthenticated }) {
  const isLoading = loadingKey === tier.productType;

  return (
    <div
      className={`bg-white rounded-lg border ${tier.highlight ? 'border-[1.5px]' : 'border-slate-200'} p-8 flex flex-col shadow-sm`}
      style={tier.highlight ? { borderColor: PALETTE.teal } : {}}
    >
      {tier.highlight && (
        <div
          className="mb-3 inline-flex self-center px-3 py-1 rounded-full text-xs font-bold border border-slate-200 bg-slate-50"
          style={{
            backgroundColor: `${PALETTE.teal}20`,
            color: PALETTE.teal,
          }}
        >
          Most Popular
        </div>
      )}

      <h3 className="text-2xl font-bold text-center mb-2" style={{ color: PALETTE.deepNavy }}>
        {tier.title}
      </h3>
      <p className="text-5xl font-extrabold text-center mb-4" style={{ color: PALETTE.teal }}>
        {tier.price}
        <span className="text-xl font-semibold text-slate-500">{tier.cadence}</span>
      </p>
      <p className="text-[#334155] mb-2 text-center font-semibold">{tier.description}</p>
      <a
        href={tier.productType === 'screening' ? '/samples/screening-sample.pdf' : '/samples/underwriting-sample.pdf'}
        className="text-sm text-[#334155] text-center mb-6 hover:underline"
      >
        View sample PDF
      </a>

      <ul className="space-y-3 mb-8">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start">
            <CheckCircle className="h-5 w-5 mr-3 mt-1 flex-shrink-0" style={{ color: PALETTE.gold }} />
            <span className="text-[#334155]">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onCheckout(tier.productType)}
        disabled={isLoading}
        className="mt-auto w-full py-3 text-center font-semibold rounded-md border border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326] transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading
          ? 'Redirecting…'
          : isAuthenticated
          ? 'Purchase report'
          : 'Sign in to purchase'}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const [loadingKey, setLoadingKey] = useState(null);

  const handleCheckout = async (productType) => {
    try {
      if (!user?.id) {
        // Force auth first for institutional flow
        window.location.href = `/login?next=/pricing`;
        return;
      }

      setLoadingKey(productType);

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType,
          userId: user.id,
          userEmail: user.email,
          // Do NOT pass cancelUrl; let server default to /dashboard?canceled=1
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        console.error('Checkout session error:', data);
        alert('Unable to start checkout. Please try again.');
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert('Unable to start checkout. Please try again.');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing — InvestorIQ</title>
        <meta
          name="description"
          content="Flat-fee institutional reports with transparent scope. Screening and underwriting options."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: PALETTE.teal }}>
            Launch Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3" style={{ color: PALETTE.deepNavy }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm text-[#334155] mt-2">
  <a href="/dashboard" className="underline hover:no-underline">
    Back to Dashboard
  </a>
</p>
          <p className="text-lg text-[#334155] max-w-2xl mx-auto mb-10">
            Two report types are available: Screening and Underwriting.
            <span className="block">Reports are property-specific, document-based, and deterministic.</span>
            <span className="block">No assumptions are made; missing or degraded inputs are disclosed as DATA NOT AVAILABLE.</span>
            <span className="block">Revisions included: Screening 2 total; Underwriting 3 total.</span>
            <span className="block">
              Revisions apply to the same property and underlying document set. Submitting materially different financials requires a new report purchase.
            </span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tiers.map((t) => (
              <PricingTile
                key={t.title}
                tier={t}
                onCheckout={handleCheckout}
                loadingKey={loadingKey}
                isAuthenticated={Boolean(user)}
              />
            ))}
          </div>

          <p className="text-sm text-[#334155] mt-10">
            Reports are bespoke, property-specific analyses.
            <span className="block">Once report generation begins, refunds are not available.</span>
            <span className="block">If generation fails due to a system error, InvestorIQ will regenerate the report at no cost.</span>
          </p>
          <p className="text-sm text-[#334155] mt-6">
            <span className="font-semibold" style={{ color: PALETTE.deepNavy }}>
              Need institutional support for portfolio or fund-level diligence? Contact us.
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

