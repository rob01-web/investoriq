import React from 'react';
import { Helmet } from 'react-helmet';
import { CheckCircle } from 'lucide-react';

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
    description: 'Try InvestorIQ once—no subscription required.',
    features: [
      '1 IQ Report',
      'Elite PDF report',
      '48-hour turnaround',
      'IQ Report automatically returned if generation fails',
    ],
  },
  {
    title: 'InvestorIQ Monthly',
    price: '$249',
    cadence: '/month',
    href: STRIPE_LINKS.monthly1,
    highlight: true,
    description: 'For steady deal flow—1 IQ Report per month.',
    features: [
      '1 IQ Report every month',
      'Elite PDF report',
      '48-hour turnaround',
      'Unused IQ Reports roll 30 days',
    ],
  },
  {
    title: 'Pro Investor Monthly',
    price: '$599',
    cadence: '/month',
    href: STRIPE_LINKS.monthly3,
    description: 'For active investors analyzing multiple deals.',
    features: [
      '3 IQ Reports every month',
      'Elite PDF reports',
      'Priority processing',
      'Unused IQ Reports roll 30 days',
    ],
  },
];

const PricingTile = ({ tier }) => (
  <div
    className={`bg-white rounded-2xl shadow-xl p-8 flex flex-col transform hover:scale-[1.02] transition-transform duration-300 border ${
      tier.highlight ? 'border-[#1f8a8a]' : 'border-slate-200'
    }`}
  >
    {tier.highlight && (
      <div className="mb-3 inline-flex self-center px-3 py-1 rounded-full text-xs font-bold bg-[#1f8a8a]/10 text-[#1f8a8a]">
        Most Popular
      </div>
    )}
    <h3 className="text-2xl font-bold text-slate-900 text-center">{tier.title}</h3>
    <p className="text-5xl font-extrabold my-4 text-[#1f8a8a] text-center">
      {tier.price}
      <span className="text-xl font-semibold text-slate-500">{tier.cadence}</span>
    </p>
    <p className="text-slate-600 mb-6 text-center">{tier.description}</p>

    <ul className="space-y-3 mb-8">
      {tier.features.map((feature, i) => (
        <li key={i} className="flex items-start">
          <CheckCircle className="h-5 w-5 text-[#c9a227] mr-3 mt-1 flex-shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>

    <a
      href={tier.href}
      className="mt-auto w-full py-3 bg-[#0f172a] text-white font-bold rounded-lg shadow-md hover:shadow-xl text-center"
    >
      Get Started
    </a>
  </div>
);

export default function PricingPage() {
  return (
    <>
      <Helmet>
        <title>Pricing - InvestorIQ</title>
        <meta
          name="description"
          content="Simple, transparent pricing for elite real estate analysis. Buy one report or subscribe for monthly IQ Reports."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-10">
            All prices in USD. If a report fails to generate or contains errors, your IQ Report is returned so you can regenerate it. We do not offer cash refunds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((t) => (
              <PricingTile key={t.title} tier={t} />
            ))}
          </div>

          {/* Add-on: extra IQ Reports */}
          <div className="mt-12 max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Need more reports this month?</h3>
            <p className="text-slate-600 mb-4">
              Purchase additional IQ Reports anytime. Quantity can be adjusted in Stripe checkout.
            </p>
            <a
              href={STRIPE_LINKS.addon}
              className="inline-block px-5 py-3 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
            >
              Buy Additional IQ Reports — <span className="text-[#1f8a8a]">$229</span>
            </a>
            <p className="text-xs text-slate-500 mt-3">
              If a report fails, your IQ Report is returned so you can regenerate it. No cash refunds.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
