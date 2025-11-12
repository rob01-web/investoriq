'use client';

import React from 'react';
import { Helmet } from 'react-helmet';
import { CheckCircle } from 'lucide-react';
import { PALETTE } from '@/lib/utils';

const STRIPE_LINKS = {
  single:   'https://buy.stripe.com/9B6aEZ4zK431ahb1UT2sM03', // $299 one-time
  monthly1: 'https://buy.stripe.com/aFa14p9U44318936b92sM01', // $249/mo
  monthly3: 'https://buy.stripe.com/9B67sN4zKgPN0GBdDB2sM02', // $599/mo
  addon:    'https://buy.stripe.com/eVq5kFeakarp4WR0QP2sM00', // $229 one-time, qty adjustable
};

const tiers = [
  {
    title: 'Single Report',
    price: '$299',
    cadence: 'one-time',
    href: STRIPE_LINKS.single,
    description: 'Access InvestorIQ once — no subscription required.',
    features: [
      '1 Property IQ Report',
      'Institutional-grade PDF analysis',
      '48-hour turnaround',
      'Automatic regeneration if report fails',
    ],
  },
  {
    title: 'InvestorIQ Monthly',
    price: '$249',
    cadence: '/month',
    href: STRIPE_LINKS.monthly1,
    highlight: true,
    description: 'Ideal for consistent deal flow — 1 report per month.',
    features: [
      '1 Property IQ Report per month',
      'Institutional-grade analysis',
      '48-hour turnaround',
      'Unused reports roll over for 30 days',
    ],
  },
  {
    title: 'Pro Investor Monthly',
    price: '$599',
    cadence: '/month',
    href: STRIPE_LINKS.monthly3,
    description: 'For active investors managing multiple properties.',
    features: [
      '3 Property IQ Reports per month',
      'Institutional-grade analysis',
      'Priority processing',
      'Unused reports roll over for 30 days',
    ],
  },
];

const PricingTile = ({ tier }) => (
  <div
    className={`bg-white rounded-2xl shadow-lg p-8 flex flex-col border transition-transform duration-300 hover:scale-[1.02] ${
      tier.highlight ? 'border-[1.5px]' : 'border-slate-200'
    }`}
    style={tier.highlight ? { borderColor: PALETTE.teal } : {}}
  >
    {tier.highlight && (
      <div
        className="mb-3 inline-flex self-center px-3 py-1 rounded-full text-xs font-bold shadow-sm"
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
    <p className="text-slate-600 mb-6 text-center">{tier.description}</p>

    <ul className="space-y-3 mb-8">
      {tier.features.map((feature, i) => (
        <li key={i} className="flex items-start">
          <CheckCircle
            className="h-5 w-5 mr-3 mt-1 flex-shrink-0"
            style={{ color: PALETTE.gold }}
          />
          <span className="text-slate-700">{feature}</span>
        </li>
      ))}
    </ul>

    <a
      href={tier.href}
      className="mt-auto w-full py-3 text-center font-bold rounded-lg text-white shadow-md hover:shadow-xl transition"
      style={{
        background: `linear-gradient(to right, ${PALETTE.navy}, ${PALETTE.teal})`,
      }}
    >
      Get Started
    </a>
  </div>
);

export default function PricingPage() {
  return (
    <>
      <Helmet>
        <title>Pricing — InvestorIQ</title>
        <meta
          name="description"
          content="Transparent pricing for institutional real estate analysis. Choose a single Property IQ Report or subscribe for ongoing insights."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1
            className="text-4xl md:text-5xl font-extrabold mb-3"
            style={{ color: PALETTE.deepNavy }}
          >
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-10">
            All prices are in USD. If a report fails to generate or contains errors, your IQ credit
            is automatically restored for regeneration. InvestorIQ does not issue cash refunds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((t) => (
              <PricingTile key={t.title} tier={t} />
            ))}
          </div>

          {/* Add-on: Additional Reports */}
          <div className="mt-12 max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow text-center">
            <h3
              className="text-xl font-bold mb-1"
              style={{ color: PALETTE.deepNavy }}
            >
              Need Additional Reports?
            </h3>
            <p className="text-slate-600 mb-4">
              Purchase extra Property IQ Reports anytime. Quantities can be adjusted during checkout.
            </p>
            <a
              href={STRIPE_LINKS.addon}
              className="inline-block px-5 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition"
              style={{
                background: `linear-gradient(to right, ${PALETTE.gold}, #b9972b)`,
              }}
            >
              Buy Additional Reports — <span className="font-bold">$229</span>
            </a>
            <p className="text-xs text-slate-500 mt-3">
              Failed generations automatically restore your IQ credit. No cash refunds.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
