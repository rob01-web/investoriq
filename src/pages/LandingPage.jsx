import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const heroUrl = "/hero-dashboard.jpg";

  return (
    <>
      {/* META TAGS */}
      <Helmet>
        <title>InvestorIQ — Institutional Intelligence for Modern Investors</title>
        <meta
          name="description"
          content="Upload property documents and let InvestorIQ’s AI engine generate data-backed Property IQ Reports™ with institutional precision."
        />
      </Helmet>

      {/* HERO SECTION */}
      <main className="min-h-[80vh] bg-gradient-to-b from-white via-[#F9FAFB] to-[#EEF2F6]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-6 text-center pt-24 sm:pt-28"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0F172A] leading-tight">
            Institutional Intelligence for{" "}
            <span className="text-[#1F8A8A]">Modern Investors</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 mt-6 leading-relaxed">
            Upload your property documents and our AI-driven underwriting engine delivers
            a comprehensive, data-backed{" "}
            <span className="text-[#1F8A8A] font-semibold">Property IQ Report™</span>{" "}
            within 48 hours. Works for both off-market and MLS-listed deals.
          </p>

          {/* BUTTON GROUP */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">

            {/* PRIMARY CTA */}
            <Button
              size="lg"
              className="bg-[#1F8A8A] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#177272] shadow-md transition-transform hover:scale-105"
              onClick={() => (window.location.href = "/signup")}
            >
              Analyze My Property
            </Button>

            {/* VIEW SAMPLE REPORT — OPEN HTML */}
            <Button
              size="lg"
              variant="outline"
              className="border-[#1F8A8A] text-[#1F8A8A] px-8 py-3 rounded-xl hover:bg-[#1F8A8A]/10 transition"
              onClick={() => window.open("/reports/sample-report.html", "_blank")}
            >
              View Sample Report
            </Button>

            {/* DOWNLOAD PDF — DOCRAPTOR */}
            <Button
              size="lg"
              variant="outline"
              className="border-[#1F8A8A] text-[#1F8A8A] px-8 py-3 rounded-xl hover:bg-[#1F8A8A]/10 transition"
              onClick={() => window.open("/api/generate-sample-pdf", "_blank")}
            >
              Download PDF
            </Button>

          </div>

          {/* HERO IMAGE */}
          <div className="mt-16 relative">
            <div className="overflow-hidden rounded-2xl shadow-2xl border border-slate-200">
              <img
                src={heroUrl}
                alt="InvestorIQ Dashboard"
                className="w-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-200 bg-white/80 backdrop-blur-md text-center text-slate-500 text-sm">
        © 2025{" "}
        <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
      </footer>
    </>
  );
}
