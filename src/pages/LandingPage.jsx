import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { BarChart3, FileText, Cpu, Shield, Loader2, LogOut, Check } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import HeroImage from '@/components/HeroImage';
import CallToAction from '@/components/CallToAction';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: delay, duration: 0.5 }}
    className="bg-white p-6 text-center"
  >
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4 mx-auto">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </motion.div>
);

const PricingTier = React.memo(({ tier, onAction, isLoading, activePriceId }) => {
  const isThisTierLoading = isLoading && activePriceId === tier.priceId;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className={`relative p-8 rounded-2xl border bg-white flex flex-col hover:shadow-xl transition-all duration-300 ${
        tier.popular ? 'border-blue-600 shadow-lg' : 'border-slate-200'
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="text-xl font-bold mb-2 text-center">{tier.name}</h3>
      <div className="text-3xl font-bold text-blue-600 mb-2 text-center">{tier.price}</div>
      <p className="text-slate-600 mb-6 text-center h-12">{tier.description}</p>
      <ul className="space-y-3 mb-8 flex-grow">
        {tier.features.map((feature, fIndex) => (
          <li key={fIndex} className="flex items-start">
            <Check className="text-blue-600 mr-2 h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className="w-full mt-auto"
        variant={tier.popular ? 'default' : 'outline'}
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
});

const LandingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activePriceId, setActivePriceId] = useState(null);
  const logoUrl = "https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png";


  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    navigate('/');
  };

  const pricingTiers = [
    {
      name: 'Single Report',
      price: '$199 USD',
      priceId: 'price_1Pg54jRsg629mofCWy2v9wzK',
      credits: 1,
      description: 'Perfect for testing the waters',
      features: ['1 Property Analysis', '360° Comprehensive Report', 'Charts & Heat Maps', 'PDF Download'],
    },
    {
      name: '5 Report Bundle',
      price: '$895 USD',
      priceId: 'price_1Pg55ORsg629mofCK0Jp473v',
      credits: 5,
      description: 'Best for active investors',
      features: ['5 Property Analyses', 'Save Over 50%', 'Priority Processing', 'All Premium Features'],
      popular: true
    },
    {
      name: '10 Report Bundle',
      price: '$1,590 USD',
      priceId: 'price_1Pg55sRsg629mofCTpGjW0iP',
      credits: 10,
      description: 'For serious portfolios',
      features: ['10 Property Analyses', 'Save Over 60%', 'Fastest Processing', 'Dedicated Support']
    },
    {
      name: 'Enterprise',
      price: 'Contact Us',
      priceId: null,
      credits: 0,
      description: 'Custom solutions for firms',
      features: ['API Access', 'White Label', 'Custom Integration'],
    }
  ];

  const handlePricingAction = async (tier) => {
    if (!tier.priceId) {
      toast({
        title: "Coming in 2026!",
        description: "Enterprise solutions and sales contact will be available soon.",
      });
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: 'pricing' } });
      return;
    }

    setIsLoading(true);
    setActivePriceId(tier.priceId);

    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId: tier.priceId, credits: tier.credits }
      });
      
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      window.location.href = data.url;

    } catch (err) {
      toast({
        title: "Checkout Failed",
        description: err.message || "Please try again or contact support.",
        variant: "destructive"
      });
      setIsLoading(false);
      setActivePriceId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>InvestorIQ - Hedge Fund-Quality Analysis Delivered in 48 Hours</title>
        <meta name="description" content="Get comprehensive 360° property analysis reports for your income properties. Upload any deal and our AI will generate an elite report, ready within 48 hours." />
      </Helmet>

      <div className="min-h-screen bg-white">
        <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <img src={logoUrl} alt="InvestorIQ Logo" className="h-12" />
              </motion.div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/sample-report')}>
                  Sample Report
                </Button>
                {user ? (
                  <>
                     <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
                      {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
                    <Button size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main>
          <section className="py-20 sm:py-24 text-center bg-slate-50/50">
            <div className="max-w-4xl mx-auto px-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-800 mb-6"
              >
                Hedge Fund-Quality Analysis <br />
                <span className="text-blue-600">Delivered in 48 Hours</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="max-w-2xl mx-auto text-lg text-slate-600 mb-8"
              >
                Get comprehensive 360° property analysis reports for your income properties. Upload any deal and our AI will generate an elite report, ready within 48 hours.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="flex justify-center items-center gap-4"
              >
                <Button size="lg" onClick={() => navigate('/dashboard')}>
                  Upload Your Deal
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/sample-report')}>
                  View Sample Report
                </Button>
              </motion.div>
              <HeroImage />
            </div>
          </section>

          <section id="features" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Why InvestorIQ?
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Professional analysis that big hedge funds trust.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard icon={<FileText size={28}/>} title="Comprehensive Reports" description="Get detailed 360° analysis with charts, graphs, heat maps, and actionable insights." delay={0.1} />
                <FeatureCard icon={<Cpu size={28}/>} title="AI-Powered Analysis" description="Our proprietary AI analyzes every aspect of your property investment opportunity." delay={0.2} />
                <FeatureCard icon={<Shield size={28}/>} title="Institutional Quality" description="Analysis quality that rivals $5K+ reports from top firms, powered by cutting-edge AI." delay={0.3} />
              </div>
            </div>
          </section>

          <section id="pricing" className="py-20 bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <p className="text-blue-600 font-semibold mb-2">*Current introductory pricing. Price increases in 2026!</p>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Simple, Transparent Pricing
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Choose the plan that fits your investment strategy.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {pricingTiers.map((tier, index) => (
                  <PricingTier 
                    key={index} 
                    tier={tier} 
                    onAction={handlePricingAction} 
                    isLoading={isLoading}
                    activePriceId={activePriceId}
                  />
                ))}
              </div>
            </div>
          </section>

          <CallToAction />

        </main>

        <footer className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                <img src={logoUrl} alt="InvestorIQ Logo" className="h-10" />
            </div>
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} InvestorIQ. All Rights Reserved.</p>
          </div>
           <p className="text-xs text-slate-400 mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">Disclaimer: The information provided by InvestorIQ is for informational purposes only and does not constitute financial, investment, or legal advice. All investment decisions should be made with the consultation of a qualified professional. We are not liable for any losses or damages arising from the use of our reports.</p>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;