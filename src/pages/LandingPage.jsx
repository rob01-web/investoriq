import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  
  return (
    <>
      {/* META TAGS */}
      <Helmet>
        <title>InvestorIQ | Institutional Property Intelligence</title>
        <meta
          name="description"
          content="InvestorIQ provides institutional-grade real estate underwriting and analysis using only documents supplied by the user, with explicit disclosure of limitations and data gaps."
        />
      </Helmet>

      {/* HERO SECTION */}
      <main className="bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-6 pt-16 pb-14 text-center"
        >
          <p className="text-xs tracking-[0.18em] uppercase text-[#1F8A8A] mb-4 font-semibold">
            Institutional Real Estate Underwriting
          </p>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-[#0F172A] leading-tight max-w-4xl mx-auto">
            Institutional Property Intelligence for{" "}
            <span className="text-[#1F8A8A]">Serious Investors</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 mt-6 leading-7 max-w-3xl mx-auto">
            InvestorIQ produces institutional-grade underwriting and analysis using only
            the documents you provide. All limitations, conflicts, and data gaps are
            explicitly disclosed.
          </p>

          {/* CTA GROUP */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Button
              size="lg"
              className="inline-flex items-center rounded-lg border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
              onClick={() => (window.location.href = "/signup")}
            >
              Analyze My Property
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="inline-flex items-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-[#0F172A] hover:border-slate-400"
              onClick={() => window.location.href = "/sample-report"}
            >
              View Sample Report
            </Button>
          </div>

          {/* HERO IMAGE */}
          <div className="mt-14 relative">
            <div className="overflow-hidden rounded-2xl shadow-2xl border border-slate-200 bg-white">
              <img
                src="/hero-sample-report.jpg"
                alt="InvestorIQ institutional underwriting report preview"
                className="w-full object-contain"
              />
            </div>
          </div>
                    {/* TRUST STRIP */}
          <div className="mt-10 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <div className="text-sm font-semibold text-[#0F172A]">Document-only</div>
                <div className="mt-2 text-sm text-slate-600">
                  Outputs are produced strictly from the documents you upload.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <div className="text-sm font-semibold text-[#0F172A]">No assumptions</div>
                <div className="mt-2 text-sm text-slate-600">
                  Missing, conflicting, or degraded data is disclosed, not filled.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <div className="text-sm font-semibold text-[#0F172A]">Deterministic</div>
                <div className="mt-2 text-sm text-slate-600">
                  The same inputs produce the same outputs, with an auditable trail.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <div className="text-sm font-semibold text-[#0F172A]">IC-grade format</div>
                <div className="mt-2 text-sm text-slate-600">
                  Built for professional review, not marketing slides.
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </>
  );
}
