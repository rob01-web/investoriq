import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

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
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

// ─── STRIPE (unchanged) ──────────────────────────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ─── TIER CARD ───────────────────────────────────────────────────────────────
const Tier = ({ tier, onAction, isLoading, activePriceId }) => {
  const isThisTierLoading = isLoading && activePriceId === tier.priceId;
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.08 }}
      style={{
        position:      'relative',
        padding:       '32px 28px',
        background:    T.white,
        border:        `1px solid ${tier.popular ? T.goldDark : T.hairline}`,
        borderTop:     tier.popular ? `3px solid ${T.gold}` : `1px solid ${T.hairline}`,
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div style={{
          position:    'absolute',
          top:         -1,
          right:       24,
          background:  T.gold,
          padding:     '2px 12px',
          fontFamily:  "'DM Mono', monospace",
          fontSize:    9,
          letterSpacing:'0.18em',
          textTransform:'uppercase',
          color:       T.green,
          fontWeight:  500,
        }}>
          Most Popular
        </div>
      )}

      {/* Tier name */}
      <p style={{
        fontFamily:   "'DM Mono', monospace",
        fontSize:     10,
        letterSpacing:'0.18em',
        textTransform:'uppercase',
        color:        T.goldDark,
        marginBottom: 10,
      }}>
        {tier.name}
      </p>

      {/* Price */}
      <div style={{
        fontFamily:   "'Cormorant Garamond', Georgia, serif",
        fontSize:     40,
        fontWeight:   500,
        letterSpacing:'-0.03em',
        color:        T.ink,
        lineHeight:   1,
        marginBottom: 4,
      }}>
        {tier.price}
      </div>

      {/* Gold rule */}
      <div style={{ width:28, height:1.5, background:T.gold, opacity:0.7, marginBottom:14 }} />

      {/* Description */}
      <p style={{
        fontFamily:   "'DM Sans', sans-serif",
        fontSize:     13,
        fontWeight:   300,
        color:        T.ink3,
        fontStyle:    'italic',
        lineHeight:   1.6,
        marginBottom: 20,
        minHeight:    40,
      }}>
        {tier.description}
      </p>

      {/* Features */}
      <div style={{
        borderTop:   `1px solid ${T.hairline}`,
        paddingTop:  16,
        display:     'flex',
        flexDirection:'column',
        gap:         8,
        flex:        1,
        marginBottom:24,
      }}>
        {tier.features.map((feature, i) => (
          <div key={i} style={{ display:'flex', alignItems:'baseline', gap:10 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize:   10,
              color:      T.gold,
              opacity:    0.7,
              flexShrink: 0,
            }}>—</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   13,
              fontWeight: 300,
              color:      T.ink3,
              lineHeight: 1.55,
            }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => onAction(tier)}
        disabled={isThisTierLoading}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width:        '100%',
          padding:      '12px 20px',
          fontFamily:   "'DM Mono', monospace",
          fontSize:     10,
          letterSpacing:'0.14em',
          textTransform:'uppercase',
          fontWeight:   500,
          background:   isThisTierLoading ? T.hairline
                        : tier.popular
                          ? hov ? T.gold : T.green
                          : hov ? T.warm : T.white,
          color:        isThisTierLoading ? T.ink4
                        : tier.popular
                          ? hov ? T.green : T.gold
                          : hov ? T.ink : T.ink3,
          border:       `1px solid ${isThisTierLoading ? T.hairlineMid : tier.popular ? T.green : T.hairlineMid}`,
          cursor:       isThisTierLoading ? 'not-allowed' : 'pointer',
          transition:   'all 0.15s',
          display:      'inline-flex',
          alignItems:   'center',
          justifyContent:'center',
          gap:          6,
        }}
      >
        {isThisTierLoading && (
          <Loader2 style={{ width:12, height:12, animation:'spin 1s linear infinite' }} />
        )}
        {tier.priceId ? 'Purchase' : 'Contact Sales'}
      </button>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ⚠️  NOTE: Pricing data and Stripe price IDs are UNCHANGED from original.
//     If pricing has been updated in Pricing.jsx ($399/$1,499), verify these
//     tier definitions match the current Stripe products before deploying.
const PricingTiers = ({ title, description }) => {
  const { toast }    = useToast();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [isLoading, setIsLoading]       = useState(false);
  const [activePriceId, setActivePriceId] = useState(null);

  // ── Pricing data — updated to current $399 / $1,499 two-tier model ────────
  const pricingTiers = [
    {
      name:        'Screening Report',
      price:       '$399',
      priceId:     import.meta.env.VITE_STRIPE_SCREENING_PRICE_ID,
      credits:     1,
      description: 'Document-based screening report for initial investment review.',
      features: [
        'Based strictly on T12 + Rent Roll',
        'Formal, lightweight institutional snapshot',
        'No assumptions, no invented data',
        'One generation per purchase',
      ],
    },
    {
      name:        'Underwriting Report',
      price:       '$1,499',
      priceId:     import.meta.env.VITE_STRIPE_UNDERWRITING_PRICE_ID,
      credits:     1,
      description: 'Comprehensive underwriting report suitable for investment committee review.',
      features: [
        'Based on T12 + Rent Roll + supporting due diligence documents',
        'Full institutional underwriting artifact',
        'No assumptions, no invented data',
        'One generation per purchase',
      ],
      popular: true,
    },
  ];

  // ── Stripe checkout — UNCHANGED from original ────────────────────────────
  const handleStripeCheckout = async (priceId, credits) => {
    setIsLoading(true);
    setActivePriceId(priceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/signup'); return; }
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId, credits },
      });
      if (error) throw new Error(`Function error: ${error.message}`);
      if (!data.id) throw new Error("Could not create Stripe checkout session.");
      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({ sessionId: data.id });
      if (result.error) throw new Error(result.error.message);
    } catch (error) {
      console.error("Stripe Checkout Error:", error);
      toast({
        title:       "Payment System Error",
        description: error.message || "Could not connect to the payment gateway. Please try again.",
        variant:     "destructive",
      });
      setIsLoading(false);
      setActivePriceId(null);
    }
  };

  const handlePricingAction = (tier) => {
    if (tier.priceId) {
      handleStripeCheckout(tier.priceId, tier.credits);
    } else {
      // Safety net — both current tiers have priceIds
      toast({
        title:       "Contact us",
        description: "Please reach out to hello@investoriq.tech for pricing assistance.",
      });
    }
  };

  return (
    <>
      <style>{FONTS}</style>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      <div style={{
        background: T.white,
        border:     `1px solid ${T.hairline}`,
        padding:    '48px 40px',
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Section header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <p style={{
            fontFamily:   "'DM Mono', monospace",
            fontSize:     10,
            letterSpacing:'0.22em',
            textTransform:'uppercase',
            color:        T.goldDark,
            marginBottom: 12,
          }}>
            Report Pricing
          </p>
          <h2 style={{
            fontFamily:   "'Cormorant Garamond', Georgia, serif",
            fontSize:     'clamp(26px, 3vw, 36px)',
            fontWeight:   500,
            letterSpacing:'-0.02em',
            color:        T.ink,
            lineHeight:   1.1,
            marginBottom: 4,
          }}>
            {title}
          </h2>
          {description && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   14,
              fontWeight: 300,
              color:      T.ink3,
              lineHeight: 1.65,
              maxWidth:   520,
              margin:     '10px auto 0',
            }}>
              {description}
            </p>
          )}
        </div>

        {/* Tier grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap:                 12,
          maxWidth:            1100,
          margin:              '0 auto',
        }}>
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
    </>
  );
};

export default PricingTiers;
