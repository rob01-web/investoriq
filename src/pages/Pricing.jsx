import React from 'react';
import { Helmet } from 'react-helmet';
import { CheckCircle } from 'lucide-react';

const PricingTier = ({ title, price, description, features, buttonText, buttonAction }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col transform hover:scale-105 transition-transform duration-300">
    <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
    <p className="text-5xl font-extrabold my-4 text-blue-600">{price}</p>
    <p className="text-slate-600 mb-6 flex-grow">{description}</p>
    <ul className="space-y-3 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <button onClick={buttonAction} className="mt-auto w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-xl transition-shadow">
      {buttonText}
    </button>
  </div>
);

export default function PricingPage() {
  const handlePurchase = (tier) => {
    alert(`Redirecting to purchase ${tier}... (Stripe integration needed)`);
  };

  return (
    <>
      <Helmet>
        <title>Pricing - InvestorIQ</title>
        <meta name="description" content="Choose the right plan for your real estate analysis needs." />
      </Helmet>
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Find Your Edge.
          </h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-12">
            Unlock institutional-grade property analysis with our AI-powered reports. Simple pricing for every investor.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingTier
              title="Starter Pack"
              price="$50"
              description="Perfect for analyzing a single, high-potential deal."
              features={["1 Report Credit", "PDF & Document Analysis", "Standard AI Valuation", "Email Support"]}
              buttonText="Get Started"
              buttonAction={() => handlePurchase('Starter Pack')}
            />
            <PricingTier
              title="Pro Bundle"
              price="$200"
              description="Best value for active investors sourcing multiple deals."
              features={["5 Report Credits ($40/report)", "PDF & Document Analysis", "Advanced AI Valuation", "Priority Email Support"]}
              buttonText="Go Pro"
              buttonAction={() => handlePurchase('Pro Bundle')}
            />
            <PricingTier
              title="Enterprise"
              price="Contact Us"
              description="For teams and high-volume funds needing custom solutions."
              features={["Unlimited Credits", "API Access", "Custom Model Training", "Dedicated Account Manager"]}
              buttonText="Contact Sales"
              buttonAction={() => window.location.href = 'mailto:hello@investoriq.tech'}
            />
          </div>

          <div className="mt-16 bg-blue-600 text-white rounded-lg p-6 max-w-3xl mx-auto shadow-2xl">
             <h4 className="font-bold text-xl mb-2">Roadmap Sneak Peek</h4>
             <p><span className="font-semibold bg-green-400 text-green-900 px-2 py-1 rounded-md text-sm">V1.0 Live:</span> Off-Market Deal Analysis is now available for all users.</p>
             <p className="mt-3"><span className="font-semibold bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md text-sm">Coming Early 2026:</span> Full MLS integration, portfolio tracking, and enhanced market trend dashboards!</p>
          </div>
        </div>
      </div>
    </>
  );
}