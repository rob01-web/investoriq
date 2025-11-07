import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { FileText, Cpu, Shield, Loader2, LogOut } from 'lucide-react';
import HeroImage from '@/components/HeroImage';
import BackButton from '@/components/BackButton';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white p-6 text-center border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition"
  >
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#1F8A8A]/10 text-[#1F8A8A] mb-4 mx-auto">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-slate-900">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const logoUrl =
    'https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    navigate('/');
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <Helmet>
        <title>InvestorIQ - Smarter Real Estate Decisions</title>
        <meta
          name="description"
          content="Upload your property documents and receive a detailed institutional-style analysis within 48 hours. Smarter real estate decisions start here."
        />
      </Helmet>

      <div className="min-h-screen bg-white flex flex-col">
        {/* NAVBAR */}
        <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 sm:space-x-4 cursor-pointer"
                onClick={scrollToTop}
              >
                <img
                  src={logoUrl}
                  alt="InvestorIQ Logo"
                  className="h-16 sm:h-20 md:h-24 w-auto transition-transform duration-200 hover:scale-105"
                />
              </motion.div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/sample-report')}>
                  Sample Report
                </Button>
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="border-[#1F8A8A] text-[#1F8A8A] hover:bg-[#1F8A8A] hover:text-white transition"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                      Log In
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate('/signup')}
                      className="bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-semibold hover:opacity-90 shadow-md"
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <main className="flex-grow">
          <section className="py-20 sm:py-24 text-center bg-slate-50/50">
            <div className="max-w-4xl mx-auto px-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6"
              >
                Smarter Real Estate Decisions.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="max-w-2xl mx-auto text-lg text-slate-600 mb-8"
              >
                Upload your <strong>property documents</strong> and our proprietary AI engine will
                deliver a professional, data-backed analysis within 48 hours. Supports PDFs, images,
                and all common document formats (max 10 MB each). Works for both off-market and MLS
                properties when you have supporting files from your broker or agent.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="flex justify-center items-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:scale-105 transition-transform"
                >
                  Upload Your Deal
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/sample-report')}
                  className="border-2 border-[#1F8A8A] text-[#1F8A8A] font-semibold hover:bg-[#1F8A8A] hover:text-white transition-all"
                >
                  View Sample Report
                </Button>
              </motion.div>
              <HeroImage />
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Why Investors Choose InvestorIQ
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Institutional-quality analysis designed for modern investors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<FileText size={28} />}
                  title="Comprehensive Reports"
                  description="Full financial, risk, and market breakdown with charts, maps, and insights."
                  delay={0.1}
                />
                <FeatureCard
                  icon={<Cpu size={28} />}
                  title="Proprietary Intelligence"
                  description="InvestorIQ models evaluate your property using institutional-level frameworks."
                  delay={0.2}
                />
                <FeatureCard
                  icon={<Shield size={28} />}
                  title="Verified Accuracy"
                  description="Reports are structured and benchmarked against proven investment standards."
                  delay={0.3}
                />
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section id="pricing" className="py-20 bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Simple, Transparent Pricing (USD)
                </h2>
                <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                  The more information you upload, the more detailed and accurate your report will
                  be. (10 MB max per document)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Single Report */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg flex flex-col">
                  <h3 className="text-2xl font-bold text-slate-900 text-center">Single Report</h3>
                  <p className="text-5xl font-extrabold my-4 text-[#1F8A8A] text-center">$299</p>
                  <p className="text-slate-600 mb-6 text-center">
                    Try InvestorIQ once with no subscription.
                  </p>
                  <a
                    href="https://buy.stripe.com/9B6aEZ4zK431ahb1UT2sM03"
                    className="mt-auto w-full py-3 rounded-lg text-center font-bold text-white bg-gradient-to-r from-[#1F8A8A] to-[#177272] hover:opacity-90 transition"
                  >
                    Buy Report
                  </a>
                </div>

                {/* InvestorIQ Monthly */}
                <div className="bg-white p-8 rounded-2xl border-2 border-[#1F8A8A] shadow-xl flex flex-col">
                  <div className="mb-3 inline-flex self-center px-3 py-1 rounded-full text-xs font-bold bg-[#E6C14D]/20 text-[#1F8A8A]">
                    Most Popular
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 text-center">
                    InvestorIQ Monthly
                  </h3>
                  <p className="text-5xl font-extrabold my-4 text-[#1F8A8A] text-center">
                    $249<span className="text-xl text-slate-500">/mo</span>
                  </p>
                  <p className="text-slate-600 mb-6 text-center">
                    One IQ Report per month, ideal for consistent deal flow.
                  </p>
                  <a
                    href="https://buy.stripe.com/aFa14p9U44318936b92sM01"
                    className="mt-auto w-full py-3 rounded-lg text-center font-bold text-white bg-gradient-to-r from-[#1F8A8A] to-[#177272] hover:opacity-90 transition"
                  >
                    Start Subscription
                  </a>
                </div>

                {/* Pro Investor Monthly */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg flex flex-col">
                  <h3 className="text-2xl font-bold text-slate-900 text-center">
                    Pro Investor Monthly
                  </h3>
                  <p className="text-5xl font-extrabold my-4 text-[#1F8A8A] text-center">
                    $599<span className="text-xl text-slate-500">/mo</span>
                  </p>
                  <p className="text-slate-600 mb-6 text-center">
                    Three IQ Reports per month, built for active investors.
                  </p>
                  <a
                    href="https://buy.stripe.com/9B67sN4zKgPN0GBdDB2sM02"
                    className="mt-auto w-full py-3 rounded-lg text-center font-bold text-white bg-gradient-to-r from-[#1F8A8A] to-[#177272] hover:opacity-90 transition"
                  >
                    Start Subscription
                  </a>
                </div>
              </div>

              {/* Add-On Reports */}
              <div className="mt-12 max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Need more this month?</h3>
                <p className="text-slate-600 mb-4">
                  Buy additional IQ Reports anytime. You can adjust quantity at checkout.
                </p>
                <a
                  href="https://buy.stripe.com/eVq5kFeakarp4WR0QP2sM00"
                  className="inline-block px-5 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#1F8A8A] to-[#177272] hover:opacity-90 transition"
                >
                  Buy Additional IQ Reports - <span className="font-bold">$229</span>
                </a>
                <p className="text-xs text-slate-500 mt-3">
                  If a report fails to generate, your IQ Report credit is automatically restored.
                  No cash refunds.
                </p>
              </div>

              <div className="mt-10 text-center text-sm text-slate-500">
                InvestorIQ supports both off-market and MLS properties when documents are available.
                Direct MLS integration is scheduled for early 2026.
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="py-6 border-t bg-white text-center text-slate-500 text-sm">
          © 2025 <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
        </footer>
      </div>

      {/* BACK BUTTON (appears for external navigations) */}
      <BackButton />
    </>
  );
};

export default LandingPage;
