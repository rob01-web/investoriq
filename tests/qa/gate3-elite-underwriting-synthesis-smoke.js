/**
 * Gate 3 focused behavioral smoke — elite Full Underwriting customer synthesis.
 * Invokes actual assembly + identity exports (not string-only helper checks).
 */
import assert from "node:assert/strict";
import {
  UNDERWRITING_REPORT_IDENTITY,
  SCREENING_REPORT_IDENTITY,
  buildCanonicalReportIdentityReceipt,
} from "../../api/_lib/report-identity-authority.js";
import {
  buildExecutiveUnderwritingSynthesis,
  buildUnresolvedQuestionsRegister,
  buildDeterministicRiskRegister,
  buildMethodologyAssumptionsLimitationsChapter,
  buildGate3EliteUnderwritingCustomerBlocks,
  applyAcquisitionMemoV2FinalAssembly,
} from "../../api/_lib/acquisition-memo-v2-final-assembly.js";

const results = [];
function prove(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: String(err?.message || err) });
    console.error(`FAIL  ${name}: ${err?.message || err}`);
  }
}

function fixtureSurface({ withProposed = true, withRecon = true } = {}) {
  return {
    sections: {
      operatingStatementTTMSummary: {
        status: "required",
        disposition: "include",
        classification: "core_required",
        facts: { noi: { result: 410000, displayReady: true } },
      },
      unitMix: {
        status: "required",
        disposition: "include",
        classification: "core_required",
        facts: { total_units: { result: 40, displayReady: true } },
      },
      currentDebtContext: {
        status: "required",
        disposition: "include",
        facts: { outstandingBalance: { result: 3200000, displayReady: true } },
      },
      proposedFinancingContext: withProposed
        ? {
            status: "required",
            disposition: "include",
            factAvailability: { sourceBacked: true },
            facts: { proposedLoanAmount: { result: 5000000, displayReady: true } },
          }
        : {
            status: "collapsed",
            disposition: "omit",
            facts: {},
            missingFacts: ["proposedLoanAmount"],
          },
      debtCapacityAndCoverage: {
        status: "required",
        disposition: "compact",
        facts: {
          proposedMortgageConstant: { result: 0.061, displayReady: true },
          proposedDebtYield: { result: 0.082, displayReady: true },
          dscr: { result: 1.35, displayReady: true },
          ltv: { result: 0.65, displayReady: true },
          debtCapacityResult: { result: "Loan supportable within governed screens", displayReady: true },
          bindingConstraint: { result: "DSCR", displayReady: true },
        },
      },
      coreReconciliation: withRecon
        ? {
            status: "required",
            disposition: "include",
            displayReady: true,
            facts: { differenceAmount: 12000, varianceRatioToT12Gpr: 0.02 },
          }
        : { status: "collapsed", disposition: "collapse", facts: {} },
      appraisalContext: {
        status: "collapsed",
        disposition: "omit",
        missingFacts: ["appraisalValue"],
      },
      renovationContext: {
        status: "collapsed",
        disposition: "collapse",
        missingFacts: ["capexSchedule"],
      },
      environmentalContext: {
        status: "collapsed",
        disposition: "omit",
      },
      capRateValueIndication: {
        status: "required",
        disposition: "include",
        facts: { indicatedValue: { result: 5200000, displayReady: true } },
      },
    },
  };
}

prove("FU identity is Underwriting Report, not Acquisition Memo primary", () => {
  assert.equal(UNDERWRITING_REPORT_IDENTITY.canonicalTitle, "Underwriting Report");
  assert.equal(UNDERWRITING_REPORT_IDENTITY.reportFamily, "underwriting");
  assert.ok(UNDERWRITING_REPORT_IDENTITY.acceptedVisibleTitles.includes("Underwriting Report"));
  assert.ok(!UNDERWRITING_REPORT_IDENTITY.acceptedVisibleTitles.includes("Acquisition Memo"));
  assert.ok(UNDERWRITING_REPORT_IDENTITY.prohibitedVisibleTitles.includes("Acquisition Memo"));
  const receipt = buildCanonicalReportIdentityReceipt({ reportType: "underwriting" });
  assert.equal(receipt.canonicalTitle, "Underwriting Report");
  assert.equal(receipt.reportFamily, "underwriting");
});

prove("Screening identity unchanged", () => {
  assert.equal(SCREENING_REPORT_IDENTITY.reportFamily, "screening");
  assert.equal(
    SCREENING_REPORT_IDENTITY.canonicalTitle,
    "Preliminary Investment Screening Memorandum"
  );
  assert.ok(
    SCREENING_REPORT_IDENTITY.prohibitedVisibleTitles.includes("Underwriting Report")
  );
});

prove("executive synthesis fact/calc/limitation only — no recommendation language", () => {
  const surface = fixtureSurface({ withProposed: true });
  const synth = buildExecutiveUnderwritingSynthesis({ customerSurfaceModel: surface });
  assert.ok(synth.statements.length > 0);
  const blob = JSON.stringify(synth).toLowerCase();
  assert.ok(!/buy\b|sell\b|recommend|thesis|invest now|proceed with acquisition/.test(blob));
  assert.ok(synth.statements.some((s) => s.kind === "sourced_fact"));
  assert.ok(synth.statements.some((s) => s.topic === "proposed_financing"));
  assert.ok(synth.statements.some((s) => s.topic === "proposedDebtYield"));
});

prove("proposed financing absent when no governed evidence", () => {
  const surface = fixtureSurface({ withProposed: false });
  const synth = buildExecutiveUnderwritingSynthesis({ customerSurfaceModel: surface });
  assert.ok(!synth.statements.some((s) => s.topic === "proposed_financing"));
  assert.ok(synth.limitations.some((l) => l.topic === "proposed_financing"));
});

prove("unresolved questions from actual gaps only", () => {
  const surface = fixtureSurface({ withProposed: false });
  const synth = buildExecutiveUnderwritingSynthesis({ customerSurfaceModel: surface });
  const reg = buildUnresolvedQuestionsRegister({
    customerSurfaceModel: surface,
    executiveSynthesis: synth,
  });
  assert.ok(reg.items.length > 0);
  assert.ok(reg.items.every((i) => i.missing && i.whyItMatters && i.documentNeeded));
});

prove("risk register observed conditions only — no invented severity", () => {
  const surface = fixtureSurface({ withProposed: false, withRecon: true });
  const risk = buildDeterministicRiskRegister({ customerSurfaceModel: surface });
  assert.equal(risk.severityInvented, false);
  assert.ok(risk.signals.length > 0);
  const blob = JSON.stringify(risk).toLowerCase();
  assert.ok(!/\"severity\"\s*:\s*\"high\"|\"severity\"\s*:\s*\"medium\"|\"severity\"\s*:\s*\"low\"/.test(blob));
  assert.ok(risk.signals.every((s) => s.condition && s.sourceBasis && s.requiredFollowUp));
});

prove("methodology distinguishes facts, calcs, assumptions, limitations, dispositions", () => {
  const chapter = buildMethodologyAssumptionsLimitationsChapter({
    customerSurfaceModel: fixtureSurface(),
  });
  assert.ok(chapter.principles.length >= 4);
  assert.ok(chapter.qualityManifestDispositionOutcomes.some((d) => d.disposition === "compact"));
  assert.ok(chapter.qualityManifestDispositionOutcomes.some((d) => d.disposition === "omit"));
});

prove("financing metrics render when supported; current vs proposed separated", () => {
  const surface = fixtureSurface({ withProposed: true });
  const synth = buildExecutiveUnderwritingSynthesis({ customerSurfaceModel: surface });
  assert.ok(synth.statements.some((s) => s.topic === "current_debt"));
  assert.ok(synth.statements.some((s) => s.topic === "proposed_financing"));
  assert.ok(synth.statements.some((s) => s.topic === "proposedMortgageConstant"));
  assert.ok(synth.statements.some((s) => s.topic === "dscr"));
  assert.ok(synth.statements.some((s) => s.topic === "bindingConstraint"));
});

prove("assembly inserts elite blocks and strips Acquisition Memo primary framing", () => {
  const surface = fixtureSurface({ withProposed: false });
  const inputHtml = `<html><head><title>Acquisition Memo - Test</title></head><body><h1>Acquisition Memo</h1><p>Core content</p></body></html>`;
  const out = applyAcquisitionMemoV2FinalAssembly({
    html: inputHtml,
    customerSurfaceModel: surface,
    acquisitionMemoProjection: {
      financingReadinessSignals: { hasCurrentDebtContext: true, hasPurchaseAssumptions: false },
    },
  });
  assert.ok(/Executive Underwriting Synthesis/i.test(out));
  assert.ok(/Unresolved Underwriting Questions/i.test(out));
  assert.ok(/Risk Register: Observed Conditions/i.test(out));
  assert.ok(/Methodology, Assumptions Boundary/i.test(out));
  assert.ok(!/Acquisition Memo/i.test(out));
  assert.ok(/Underwriting Report/i.test(out));
  assert.ok(!/data-iq-synthesis-kind="recommendation"/.test(out));
  assert.ok(!/\buuid\b|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(out));
});

prove("no sources-and-uses invention in synthesis path", () => {
  const elite = buildGate3EliteUnderwritingCustomerBlocks({
    customerSurfaceModel: fixtureSurface(),
  });
  const blob = JSON.stringify(elite).toLowerCase();
  assert.ok(!/sources and uses|equity multiple|cash-on-cash|irr\b/.test(blob));
});

prove("appraisal NOI not substituted; cap rate not interest rate", () => {
  const elite = buildGate3EliteUnderwritingCustomerBlocks({
    customerSurfaceModel: fixtureSurface(),
  });
  const blob = JSON.stringify(elite.synthesis).toLowerCase();
  assert.ok(/appraisal noi is not substituted for t12 noi/.test(blob));
  assert.ok(!/stabilized cap rate.*interest rate|interest rate.*stabilized cap/.test(blob));
});

const failed = results.filter((r) => !r.ok);
console.log(`\nGate 3 focused smoke: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
console.log("ALL GATE 3 FOCUSED CHECKS PASSED");
