import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

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
          className="max-w-6xl mx-auto px-6 pt-20 pb-20 text-center space-y-6"
        >
          <p className="text-xs tracking-[0.18em] uppercase text-[#1F8A8A] font-semibold">
            INVESTMENT COMMITTEE-READY, DOCUMENT-TRACEABLE OUTPUT
          </p>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0F172A] leading-tight max-w-4xl mx-auto">
            Institutional underwriting reports for investment property analysis.
          </h1>

          <p className="text-base sm:text-lg text-slate-700 leading-7 max-w-3xl mx-auto">
            Built strictly from your documents for residential and commercial real estate investors.
          </p>

          <p className="text-base sm:text-lg text-slate-700 leading-7 max-w-3xl mx-auto">
            Document-based, deterministic outputs are traceable to source inputs. Missing items are
            shown as DATA NOT AVAILABLE.
          </p>

          <div className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto text-left space-y-1">
            <div>Flat fee per property. Professional PDF output.</div>
            <div>Revisions scoped to the same property and document set.</div>
          </div>

          <div className="mt-12 max-w-6xl mx-auto border border-slate-200 rounded-2xl p-8 bg-white text-left">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4">
                <h2 className="text-lg font-semibold text-[#0F172A]">Method and controls</h2>
              </div>
              <div className="md:col-span-8 space-y-3 text-sm text-slate-700 leading-relaxed">
                <p>
                  InvestorIQ operates a locked analysis pipeline: Upload → Parse → Extract → Validate → Underwrite → Score → Render → Publish → Notify.
                </p>
                <p>
                  Outputs are generated strictly from extracted and computed data. The system does not infer missing values or introduce unsupported assumptions.
                </p>
                <p>Where inputs are absent, InvestorIQ displays DATA NOT AVAILABLE.</p>
                <p>Outputs are formatted for Investment Committee review, not marketing presentation.</p>
                <p>Each stage is logged and fail-closed.</p>
              </div>
            </div>
          </div>

          {/* TRUST STRIP */}
          <div className="mt-10 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
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

            </div>
          </div>

        </motion.div>
      </main>
    </>
  );
}
