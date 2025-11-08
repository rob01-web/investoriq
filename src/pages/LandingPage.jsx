// src/pages/LandingPage.jsx
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { FileText, Cpu, Shield, Loader2, LogOut } from "lucide-react";
import HeroImage from "@/components/HeroImage";
import BackButton from "@/components/BackButton";

const PALETTE = {
  deepNavy: "#0F172A",
  teal: "#1F8A8A",
  aqua: "#94D9D9",
  gold: "#D4AF37",
  gray: "#6B7280",
};

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6, ease: "easeOut" }}
    className="bg-white p-6 text-center border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
  >
    <div
      className="flex items-center justify-center h-16 w-16 rounded-full mb-4 mx-auto"
      style={{ backgroundColor: `${PALETTE.teal}15`, color: PALETTE.teal }}
    >
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-slate-900">{title}</h3>
    <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const logoUrl =
    "https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <Helmet>
        <title>InvestorIQ — Elite Real Estate Intelligence</title>
        <meta
          name="description"
          content="InvestorIQ delivers institutional-grade property analysis using advanced AI. Upload your deal and receive your Elite Report in 48 hours."
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
                <Button variant="ghost" size="sm" onClick={() => navigate("/sample-report")}>
                  Sample Report
                </Button>
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/dashboard")}
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
                    <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                      Log In
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate("/signup")}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#b9972b] text-white font-semibold hover:opacity-90 shadow-md"
                    >
                      Join InvestorIQ
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <main className="flex-grow">
          <section className="py-20 sm:py-24 text-center bg-gradient-to-b from-white via-[#f9fafb] to-[#f1f5f9]">
            <div className="max-w-4xl mx-auto px-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] mb-6"
              >
                Elite Property Intelligence for Modern Investors
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="max-w-2xl mx-auto text-lg text-slate-600 mb-8 leading-relaxed"
              >
                Upload your <strong>property documents</strong> and our AI-driven analysis engine
                delivers a comprehensive, data-backed <span className="text-[#1F8A8A] font-semibold">InvestorIQ Elite Report</span> within 48 hours.
                Works for both <em>off-market</em> and MLS-listed deals.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="flex justify-center items-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:scale-105 transition-transform"
                >
                  Analyze My Property
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/sample-report")}
                  className="border-2 border-[#D4AF37] text-[#0F172A] font-semibold hover:bg-[#D4AF37] hover:text-white transition-all"
                >
                  View Sample Report
                </Button>
              </motion.div>
              <HeroImage />
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
                  Why Investors Choose InvestorIQ
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Institutional-grade intelligence designed for serious investors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<FileText size={28} />}
                  title="Comprehensive Reports"
                  description="Full financial, risk, and market breakdown with charts, maps, and performance indicators."
                  delay={0.1}
                />
                <FeatureCard
                  icon={<Cpu size={28} />}
                  title="AI-Driven Intelligence"
                  description="Our proprietary algorithms replicate the frameworks of institutional underwriters."
                  delay={0.2}
                />
                <FeatureCard
                  icon={<Shield size={28} />}
                  title="Verified Accuracy"
                  description="Benchmarked against live market data and proven investment standards."
                  delay={0.3}
                />
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section id="pricing" className="py-20 bg-[#f9fafb]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
                  Simple, Transparent Pricing (USD)
                </h2>
                <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                  The more details you provide, the more refined and accurate your analysis.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Single Report */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md flex flex-col hover:shadow-xl transition">
                  <h3 className="text-2xl font-bold text-[#0F172A] text-center">Single Report</h3>
                  <p className="text-5xl font-extrabold my-4 text-[#1F8A8A] text-center">$299</p>
                  <p className="text-slate-600 mb-6 text-center">
                    Try InvestorIQ once—no subscription required.
                  </p>
                  <a
                    href="https://buy.stripe.com/9B6aEZ4zK431ahb1UT2sM03"
                    className="mt-auto w-full py-3 rounded-lg text-center font-bold text-white bg-gradient-to-r from-[#1F8A8A] to-[#177272] hover:opacity-90 transition"
                  >
                    Buy Report
                  </a>
                </div>

                {/* Monthly Subscription */}
                <div className="bg-white p-8 rounded-2xl border-2 border-[#D4AF37] shadow-xl flex flex-col relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#D4AF37] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                    Most Popular
                  </div>
                  <h3 className="text-2xl font-bold text-[#0F172A] text-center mt-2">
                    InvestorIQ Monthly
                  </h3>
                  <p className="text-5xl font-extrabold my-4 text-[#1F8A8A] text-center">
                    $249<span className="text-xl text-slate-500">/mo</span>
                  </p>
                  <p className="text-slate-600 mb-6 text-center">
                    One Elite Report per month for consistent deal flow.
                  </p>
                  <a
                    href="https://buy.stripe.com/aFa14p9U44318936b92sM01"
                    className="mt-auto w-full py-3 rounded-lg text-center font-bold text-white bg-gradient-to-r from-[#1F8A8A] to-[#177272] hover:opacity-90 transition"
                  >
                    Start Subscription
                  </a>
                </div>

                {/* Pro Investor */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md flex flex-col hover:shadow-xl transition">
                  <h3 className="text-2xl font-bold text-[#0F172A] text-center">
                    Pro Investor Monthly
                  </h3>
                  <p className="text-5xl font-extrabold my-4 text-[#1F8A8A] text-center">
                    $599<span className="text-xl text-slate-500">/mo</span>
                  </p>
                  <p className="text-slate-600 mb-6 text-center">
                    Three Elite Reports monthly for active portfolio builders.
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
              <div className="mt-12 max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow text-center">
                <h3 className="text-xl font-bold text-[#0F172A] mb-1">Need more this month?</h3>
                <p className="text-slate-600 mb-4">
                  Buy additional IQ Reports anytime—quantity adjustable at checkout.
                </p>
                <a
                  href="https://buy.stripe.com/eVq5kFeakarp4WR0QP2sM00"
                  className="inline-block px-5 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#D4AF37] to-[#b9972b] hover:opacity-90 transition"
                >
                  Buy Additional Reports – <span className="font-bold">$229</span>
                </a>
                <p className="text-xs text-slate-500 mt-3">
                  Failed generations automatically restore your IQ credit. No cash refunds.
                </p>
              </div>

              <div className="mt-10 text-center text-sm text-slate-500">
                InvestorIQ supports both off-market and MLS properties when documents are available.
                MLS API integration is scheduled for early 2026.
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="py-6 border-t bg-white text-center text-slate-500 text-sm">
          © 2025{" "}
          <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
        </footer>
      </div>

      {/* BACK BUTTON */}
      <BackButton />
    </>
  );
};

export default LandingPage;
