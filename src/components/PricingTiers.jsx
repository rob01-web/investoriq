import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Tier = ({ tier, onAction, isLoading, activePriceId }) => {
  const isThisTierLoading = isLoading && activePriceId === tier.priceId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className={`relative p-8 rounded-xl border bg-white flex flex-col shadow-sm ${
        tier.popular ? 'border-[#0F172A]' : 'border-slate-200'
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="border border-slate-200 bg-slate-50 text-[#0F172A] px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-xl font-bold mb-2 text-center text-iqnavy">{tier.name}</h3>
      <div className="text-3xl font-extrabold text-iqteal mb-2 text-center">{tier.price}</div>
      <p className="text-[#334155] mb-6 text-center h-12 font-medium">{tier.description}</p>

      <ul className="space-y-3 mb-8 flex-grow">
        {tier.features.map((feature, fIndex) => (
          <li key={fIndex} className="flex items-start">
            <Check className="text-iqgold mr-2 h-5 w-5 flex-shrink-0" />
            <span className="text-sm text-slate-800">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={`w-full mt-auto font-semibold rounded-md ${
          tier.popular
            ? 'border border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326]'
            : 'border border-slate-300 text-[#0F172A] hover:border-slate-400 hover:bg-slate-50'
        }`}
        onClick={() => onAction(tier)}
        disabled={isThisTierLoading}
      >
        {isThisTierLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          tier.priceId ? 'Buy Now' : 'Contact Sales'
        )}
      </Button>
    </motion.div>
  );
};

const PricingTiers = ({ title, description }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activePriceId, setActivePriceId] = useState(null);

  const pricingTiers = [
    {
      name: 'Single IQ Report',
      price: '$199 USD',
      priceId: import.meta.env.VITE_STRIPE_SINGLE_REPORT_PRICE_ID,
      credits: 1,
      description: 'Perfect for testing your first analysis',
      features: [
        '1 Property IQ Report',
        'Full 360° Data Analysis',
        'Charts & Heat Maps',
        'Downloadable PDF'
      ]
    },
    {
      name: '5 Report Bundle',
      price: '$895 USD',
      priceId: import.meta.env.VITE_STRIPE_5_REPORT_PRICE_ID,
      credits: 5,
      description: 'Best value for active investors',
      features: [
        '5 Property IQ Reports',
        'Save Over 50%',
        'Priority Processing',
        'All Premium Features'
      ],
      popular: true
    },
    {
      name: '10 Report Bundle',
      price: '$1,590 USD',
      priceId: import.meta.env.VITE_STRIPE_10_REPORT_PRICE_ID,
      credits: 10,
      description: 'For serious real estate portfolios',
      features: [
        '10 Property IQ Reports',
        'Save Over 60%',
        'Fastest Turnaround',
        'Dedicated Support'
      ]
    },
    {
      name: 'Enterprise Access',
      price: 'Contact Us',
      priceId: null,
      credits: 0,
      description: 'Coming early 2026',
      features: [
        'MLS Data Integration',
        'Custom API Access',
        'White-Glove Support'
      ]
    }
  ];

  const handleStripeCheckout = async (priceId, credits) => {
    setIsLoading(true);
    setActivePriceId(priceId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signup');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId, credits }
      });

      if (error) throw new Error(`Function error: ${error.message}`);
      if (!data.id) throw new Error("Could not create Stripe checkout session.");

      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({ sessionId: data.id });
      if (result.error) throw new Error(result.error.message);

    } catch (error) {
      console.error("Stripe Checkout Error:", error);
      toast({
        title: "Payment System Error",
        description: error.message || "Could not connect to the payment gateway. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setActivePriceId(null);
    }
  };

  const handlePricingAction = (tier) => {
    if (tier.priceId) {
      handleStripeCheckout(tier.priceId, tier.credits);
    } else {
      toast({
        title: "Coming in 2026!",
        description: "Enterprise solutions and sales contact will be available soon.",
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-iqnavy">{title}</h2>
      <p className="text-lg text-[#334155] font-medium max-w-2xl mx-auto">{description}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto">
        {pricingTiers.map((tier) => (
          <Tier
            key={tier.name}
            tier={tier}
            onAction={handlePricingAction}
            isLoading={isLoading}
            activePriceId={activePriceId}
          />
        ))}
      </div>
    </div>
  );
};

export default PricingTiers;
