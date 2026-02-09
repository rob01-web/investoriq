import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const IS_SAMPLE_REPORT = false;
  const SHOW_SAMPLE_REPORTS = false;
  
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
            Institutional underwriting output, built from your documents.
          </h1>

          <p className="text-base sm:text-lg text-slate-700 leading-7 max-w-3xl mx-auto">
            Document-based, deterministic outputs are traceable to source inputs. Missing items are
            shown as DATA NOT AVAILABLE.
          </p>

          <ul className="text-sm sm:text-base text-slate-700 max-w-3xl mx-auto space-y-2 text-left">
            <li>Document-based only</li>
            <li>Deterministic pipeline with audit trail</li>
            <li>No assumptions. No inferred numbers.</li>
          </ul>

          <div className="text-sm sm:text-base text-slate-700 max-w-3xl mx-auto text-left space-y-1">
            <div>Flat fee per property. Professional PDF output.</div>
            <div>Revisions scoped to the same property and document set.</div>
          </div>

          {/* CTA GROUP */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="inline-flex items-center rounded-lg border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Start a report
            </Button>
          </div>

          {/* HERO IMAGE */}
          <div className="mt-14 relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img
                src="/hero-image.png"
                alt="InvestorIQ institutional underwriting report preview"
                className="w-full object-contain"
              />
            </div>
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
                <p>Each stage is logged and fail-closed.</p>
              </div>
            </div>
          </div>

          {/* TRUST STRIP */}
          <div className="mt-10 max-w-6xl mx-auto">
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

            </div>
          </div>

          {SHOW_SAMPLE_REPORTS && (
            <div className="mt-10 max-w-6xl mx-auto border border-slate-200 rounded-2xl p-8 bg-white text-left">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-4">
                  <h2 className="text-lg font-semibold text-[#0F172A]">Sample report</h2>
                </div>
                <div className="md:col-span-8 space-y-4 text-sm text-slate-700 leading-relaxed">
                  <p>Preview the institutional format before purchase.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      className="inline-flex items-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-[#0F172A] hover:border-slate-400"
                      onClick={() => window.location.href = "/sample-report/screening"}
                    >
                      Download screening sample
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="inline-flex items-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-[#0F172A] hover:border-slate-400"
                      onClick={() => window.location.href = "/sample-report/underwriting"}
                    >
                      Download underwriting sample
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </>
  );
}
