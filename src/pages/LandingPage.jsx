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
        <title>InvestorIQ — Institutional Property Intelligence for Modern Investors</title>
        <meta
          name="description"
          content="Upload property documents and let InvestorIQ’s AI engine generate data-backed Property IQ Reports™ with institutional precision."
        />
      </Helmet>

      {/* HERO SECTION */}
      <main className="min-h-[80vh] bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-6 text-center pt-14 sm:pt-18 pb-10"
        >
          <p className="text-xs tracking-[0.18em] uppercase text-[#1F8A8A] mb-3 font-semibold">
            Institutional Underwriting
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-6xl font-black tracking-tight text-[#0F172A] leading-tight max-w-4xl mx-auto">
            Institutional Property Intelligence for{" "}
            <span className="text-[#1F8A8A]">Modern Investors</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 mt-4 leading-7 max-w-3xl mx-auto">
            Upload your property documents and our IQ-driven underwriting engine delivers
            a comprehensive, data-backed{" "}
            <span className="text-[#1F8A8A] font-semibold">Property IQ Report™</span>{" "}
            within 48 hours. Works for both off-market and MLS-listed deals.
          </p>

          {/* BUTTON GROUP */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            {/* PRIMARY CTA */}
            <Button
              size="lg"
              className="inline-flex items-center rounded-lg border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
              onClick={() => (window.location.href = "/signup")}
            >
              Analyze My Property
            </Button>

            {/* VIEW SAMPLE REPORT — OPEN HTML */}
            <Button
              size="lg"
              variant="outline"
              className="inline-flex items-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-[#0F172A] hover:border-slate-400"
              onClick={() => window.open("/reports/sample-report.html", "_blank")}
            >
              View Sample Report
            </Button>

            {/* DOWNLOAD PDF — DOCRAPTOR */}
            <Button
              size="lg"
              variant="outline"
              className="inline-flex items-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-[#0F172A] hover:border-slate-400"
              onClick={() => window.open("/api/generate-sample-pdf", "_blank")}
            >
              Download PDF
            </Button>
          </div>

          {/* REPORT-FIRST CUES */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <a
              href="/reports/sample-report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-40 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md transition"
            >
              <div className="h-2 w-20 rounded-full bg-[#0F172A] mb-3" />
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-slate-200" />
                <div className="h-2 w-3/4 rounded bg-slate-200" />
                <div className="h-2 w-5/6 rounded bg-slate-200" />
                <div className="h-2 w-2/3 rounded bg-slate-200" />
              </div>
              <div className="mt-3 text-xs font-semibold text-[#0F172A]">
                Sample Report Preview
              </div>
            </a>

            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-[#0F172A]">
                Institutional Report Standard
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[#0F172A]">
                5-year IRR + DSCR Sensitivities
              </span>
            </div>
          </div>

          {/* HERO IMAGE */}
          <div className="mt-10 relative">
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
        Ac 2025{" "}
        <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
      </footer>
    </>
  );
}
