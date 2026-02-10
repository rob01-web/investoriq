import React from "react";
import { Helmet } from "react-helmet";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const IS_SAMPLE_REPORT = false;
  const SHOW_SAMPLE_REPORTS = false;
  const screeningSamplePages = [
    "/samples/screening/p01.webp",
    "/samples/screening/p02.webp",
    "/samples/screening/p03.webp",
    "/samples/screening/p04.webp",
    "/samples/screening/p05.webp",
    "/samples/screening/p06.webp",
    "/samples/screening/p07.webp",
    "/samples/screening/p08.webp",
  ];
  const underwritingSamplePages = [
    "/samples/underwriting/p01.webp",
    "/samples/underwriting/p02.webp",
    "/samples/underwriting/p03.webp",
    "/samples/underwriting/p04.webp",
    "/samples/underwriting/p05.webp",
    "/samples/underwriting/p06.webp",
    "/samples/underwriting/p07.webp",
    "/samples/underwriting/p08.webp",
  ];
  const [screeningIndex, setScreeningIndex] = useState(0);
  const [underwritingIndex, setUnderwritingIndex] = useState(0);
  const screeningTouchStartX = useRef(null);
  const underwritingTouchStartX = useRef(null);
  const swipeThreshold = 50;
  
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

          {/* HERO IMAGE */}
          {/* TODO: Sample pages are defined in src/lib/sampleReportPages.js
              Add optimized images under /public/samples/... and update the arrays
              Keep page count reasonable for homepage performance (e.g., first 6–10 pages) */}
          <div className="mt-14 relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
                <div className="p-6">
                  <div className="text-sm font-semibold text-[#0F172A]">Screening sample</div>
                  <div className="mt-1 text-xs text-slate-500">T12 + Rent Roll only</div>
                  <div
                    className="mt-4 aspect-[8.5/11] w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500 overflow-hidden"
                    onTouchStart={(e) => {
                      if (screeningSamplePages.length === 0) return;
                      screeningTouchStartX.current = e.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(e) => {
                      if (screeningSamplePages.length === 0) return;
                      const startX = screeningTouchStartX.current;
                      if (startX == null) return;
                      const endX = e.changedTouches[0]?.clientX ?? null;
                      if (endX == null) return;
                      const deltaX = endX - startX;
                      if (deltaX <= -swipeThreshold) {
                        setScreeningIndex((i) =>
                          Math.min(screeningSamplePages.length - 1, i + 1)
                        );
                      } else if (deltaX >= swipeThreshold) {
                        setScreeningIndex((i) => Math.max(0, i - 1));
                      }
                      screeningTouchStartX.current = null;
                    }}
                  >
                    {screeningSamplePages.length > 0 ? (
                      <img
                        src={screeningSamplePages[screeningIndex]}
                        alt={`Screening sample page ${screeningIndex + 1}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span>Sample not available</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setScreeningIndex((i) => Math.max(0, i - 1))}
                      disabled={screeningSamplePages.length === 0 || screeningIndex === 0}
                      className="px-2 py-1 rounded border border-slate-200 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <div>
                      {screeningSamplePages.length > 0
                        ? `Page ${screeningIndex + 1} of ${screeningSamplePages.length}`
                        : "Page — of —"}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setScreeningIndex((i) =>
                          Math.min(screeningSamplePages.length - 1, i + 1)
                        )
                      }
                      disabled={
                        screeningSamplePages.length === 0 ||
                        screeningIndex === screeningSamplePages.length - 1
                      }
                      className="px-2 py-1 rounded border border-slate-200 disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-sm font-semibold text-[#0F172A]">Underwriting sample</div>
                  <div className="mt-1 text-xs text-slate-500">
                    T12 + Rent Roll + supporting due diligence documents
                  </div>
                  <div
                    className="mt-4 aspect-[8.5/11] w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500 overflow-hidden"
                    onTouchStart={(e) => {
                      if (underwritingSamplePages.length === 0) return;
                      underwritingTouchStartX.current = e.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(e) => {
                      if (underwritingSamplePages.length === 0) return;
                      const startX = underwritingTouchStartX.current;
                      if (startX == null) return;
                      const endX = e.changedTouches[0]?.clientX ?? null;
                      if (endX == null) return;
                      const deltaX = endX - startX;
                      if (deltaX <= -swipeThreshold) {
                        setUnderwritingIndex((i) =>
                          Math.min(underwritingSamplePages.length - 1, i + 1)
                        );
                      } else if (deltaX >= swipeThreshold) {
                        setUnderwritingIndex((i) => Math.max(0, i - 1));
                      }
                      underwritingTouchStartX.current = null;
                    }}
                  >
                    {underwritingSamplePages.length > 0 ? (
                      <img
                        src={underwritingSamplePages[underwritingIndex]}
                        alt={`Underwriting sample page ${underwritingIndex + 1}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span>Sample not available</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setUnderwritingIndex((i) => Math.max(0, i - 1))}
                      disabled={underwritingSamplePages.length === 0 || underwritingIndex === 0}
                      className="px-2 py-1 rounded border border-slate-200 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <div>
                      {underwritingSamplePages.length > 0
                        ? `Page ${underwritingIndex + 1} of ${underwritingSamplePages.length}`
                        : "Page — of —"}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setUnderwritingIndex((i) =>
                          Math.min(underwritingSamplePages.length - 1, i + 1)
                        )
                      }
                      disabled={
                        underwritingSamplePages.length === 0 ||
                        underwritingIndex === underwritingSamplePages.length - 1
                      }
                      className="px-2 py-1 rounded border border-slate-200 disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
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
