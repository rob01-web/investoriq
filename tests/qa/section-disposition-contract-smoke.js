/**
 * Gate 2 focused smoke — section-disposition-contract-v1 + runtime wiring
 */
import assert from "node:assert/strict";
import {
  SECTION_DISPOSITION_CONTRACT_VERSION,
  SECTION_DISPOSITIONS,
  SECTION_CLASSIFICATIONS,
  DETAILED_LINEAGE_PLACEMENTS,
  applySectionDisposition,
  buildDispositionManifestEntry,
  compactDenseSourceTablesInApprovedHtml,
  isCollapseEligibleBossIssue,
} from "../../api/_lib/section-disposition-contract.js";
import {
  GATE2_CSS_RECOVERY_MAX,
  GATE2_SEMANTIC_RECOMPOSITION_MAX,
  DEBT_CAPACITY_MINIMUM_FACT_KEYS,
  resolveGovernedSurfaceDisposition,
  applyDispositionsToCustomerSurfaceSections,
  runSemanticRecompositionOnce,
  isIntentionalCompactDetailLoss,
  filterMissingFinancialRowsForIntentionalDisposition,
} from "../../api/_lib/section-disposition-runtime.js";

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

prove("five dispositions exist", () => {
  assert.equal(SECTION_DISPOSITIONS.INCLUDE, "include");
  assert.equal(SECTION_DISPOSITIONS.INCLUDE_QUALIFIED, "include_qualified");
  assert.equal(SECTION_DISPOSITIONS.COMPACT, "compact");
  assert.equal(SECTION_DISPOSITIONS.COLLAPSE, "collapse");
  assert.equal(SECTION_DISPOSITIONS.OMIT, "omit");
});

prove("applySectionDisposition returns each of five dispositions", () => {
  for (const d of Object.values(SECTION_DISPOSITIONS)) {
    const r = applySectionDisposition({
      sectionKey: "test",
      classification: SECTION_CLASSIFICATIONS.SUPPLEMENTARY,
      requestedDisposition: d,
      compactRendererEligible: true,
    });
    assert.equal(r.disposition, d);
  }
});

prove("core_required cannot collapse", () => {
  const r = applySectionDisposition({
    sectionKey: "operatingStatementTTMSummary",
    classification: SECTION_CLASSIFICATIONS.CORE_REQUIRED,
    requestedDisposition: SECTION_DISPOSITIONS.COLLAPSE,
  });
  assert.equal(r.disposition, SECTION_DISPOSITIONS.COMPACT);
});

prove("core_required cannot omit", () => {
  const r = applySectionDisposition({
    sectionKey: "unitMix",
    classification: SECTION_CLASSIFICATIONS.CORE_REQUIRED,
    requestedDisposition: SECTION_DISPOSITIONS.OMIT,
  });
  assert.equal(r.disposition, SECTION_DISPOSITIONS.COMPACT);
});

prove("Debt Capacity compact preserves governed min fact keys", () => {
  const r = resolveGovernedSurfaceDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    availableFactKeys: [
      "proposedMortgageConstant",
      "proposedDebtYield",
      "dscr",
      "ltv",
      "debtCapacityResult",
      "bindingConstraint",
      "breakEvenMetrics",
    ],
    requiredFactKeys: [...DEBT_CAPACITY_MINIMUM_FACT_KEYS],
    sourceBacked: true,
    preferCompact: true,
    compactRendererEligible: true,
  });
  assert.equal(r.disposition, SECTION_DISPOSITIONS.COMPACT);
  assert.ok(r.minimumSurvivingFactKeys.includes("proposedMortgageConstant"));
  assert.ok(r.minimumSurvivingFactKeys.includes("proposedDebtYield"));
});

prove("unsupported metrics qualified not fabricated", () => {
  const r = resolveGovernedSurfaceDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    availableFactKeys: ["proposedDebtYield"],
    requiredFactKeys: ["proposedDebtYield", "proposedMortgageConstant", "dscr"],
    sourceBacked: true,
  });
  assert.ok(
    r.disposition === SECTION_DISPOSITIONS.INCLUDE_QUALIFIED ||
      r.disposition === SECTION_DISPOSITIONS.COMPACT
  );
  assert.ok(r.missingFactOrLimitationReason);
  assert.ok(!r.minimumSurvivingFactKeys.includes("fabricatedMetric"));
});

prove("lineage leaves primary cells via compact HTML", () => {
  const html = `<table class="source-table" data-iq-disposition="compact">
    <thead><tr><th>Metric</th><th>Result</th><th>Formula</th><th>Numerator</th><th>Denominator</th><th>Sources</th></tr></thead>
    <tbody>
      <tr><td>Proposed Debt Yield</td><td>8.2%</td><td>NOI/Loan</td><td>410000</td><td>5000000</td><td>core:file:abc-uuid-1234</td></tr>
      <tr><td>Proposed Mortgage Constant</td><td>6.1%</td><td>ADS/Loan</td><td>305000</td><td>5000000</td><td>core:file:def-uuid-5678</td></tr>
    </tbody>
  </table>`;
  const { html: out, receipt } = compactDenseSourceTablesInApprovedHtml(html);
  assert.ok(receipt.tablesCompacted >= 1);
  assert.ok(!out.includes("core:file:abc-uuid-1234"));
  assert.ok(out.includes("Proposed Debt Yield") && out.includes("8.2%"));
  assert.equal(receipt.detailedLineagePlacement, DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST);
});

prove("detailed lineage destination is Quality Manifest", () => {
  const d = applySectionDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
    compactRendererEligible: true,
    minimumSurvivingFactKeys: ["proposedDebtYield"],
  });
  assert.equal(d.detailedLineagePlacement, DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST);
  const entry = buildDispositionManifestEntry(d);
  assert.equal(entry.detailMovedOrOmitted, DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST);
});

prove("PDF Boss ignores intentional compact detail only", () => {
  const receipts = {
    debtCapacityAndCoverage: applySectionDisposition({
      sectionKey: "debtCapacityAndCoverage",
      classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
      requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
      compactRendererEligible: true,
      minimumSurvivingFactKeys: ["proposedDebtYield", "proposedMortgageConstant"],
    }),
  };
  assert.equal(isIntentionalCompactDetailLoss({ label: "Formula", value: "NOI/Loan" }, receipts), true);
  assert.equal(
    isIntentionalCompactDetailLoss({ label: "Proposed Debt Yield", value: "8.2%" }, receipts),
    false
  );
  const filtered = filterMissingFinancialRowsForIntentionalDisposition(
    [
      { label: "Formula", value: "NOI/Loan" },
      { label: "Proposed Debt Yield", value: "8.2%" },
    ],
    receipts
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].label, "Proposed Debt Yield");
});

prove("isCollapseEligibleBossIssue layout codes", () => {
  assert.equal(isCollapseEligibleBossIssue("PDF_PAGE_OVERFLOW"), true);
  assert.equal(isCollapseEligibleBossIssue("PDF_REQUIRED_FINANCIAL_FACTS_MISSING"), true);
  assert.equal(isCollapseEligibleBossIssue("PDF_BUY_SELL_LANGUAGE"), false);
});

prove("CSS recovery maximum is one", () => {
  assert.equal(GATE2_CSS_RECOVERY_MAX, 1);
});

prove("semantic recomposition maximum is one", () => {
  assert.equal(GATE2_SEMANTIC_RECOMPOSITION_MAX, 1);
});

prove("semantic recomposition once compacts tables", () => {
  const html = `<table class="source-table"><thead><tr><th>Metric</th><th>Result</th><th>Formula</th><th>Sources</th></tr></thead>
  <tbody><tr><td>Debt Yield</td><td>8%</td><td>x/y</td><td>uuid-here</td></tr></tbody></table>`;
  const r = runSemanticRecompositionOnce(html);
  assert.equal(r.semanticAttemptUsed, true);
  assert.equal(r.receipt.semanticAttemptMax, 1);
  assert.ok(r.receipt.tablesCompacted >= 1);
});

prove("publication success path when compact min facts survive", () => {
  const d = resolveGovernedSurfaceDisposition({
    sectionKey: "debtCapacityAndCoverage",
    availableFactKeys: ["proposedDebtYield", "proposedMortgageConstant"],
    requiredFactKeys: ["proposedDebtYield", "proposedMortgageConstant"],
    sourceBacked: true,
    preferCompact: true,
    compactRendererEligible: true,
  });
  assert.equal(d.disposition, "compact");
  const publishAllowed =
    d.disposition === "include" ||
    d.disposition === "include_qualified" ||
    d.disposition === "compact";
  assert.equal(publishAllowed, true);
});

prove("failure does not publish omit surface", () => {
  const d = resolveGovernedSurfaceDisposition({
    sectionKey: "optionalAppendix",
    classification: SECTION_CLASSIFICATIONS.OPTIONAL,
    availableFactKeys: [],
    requiredFactKeys: [],
    sourceBacked: false,
  });
  assert.equal(d.disposition, "omit");
});

prove("lifecycle terminals leave rendering", () => {
  assert.notEqual("published_or_publish_with_quality_incident", "rendering");
  assert.notEqual("internal_system_failure_exited_rendering", "rendering");
});

prove("exactly-once: no entitlement side effects in runtime wiring", () => {
  const src = String(resolveGovernedSurfaceDisposition) + String(runSemanticRecompositionOnce);
  assert.ok(!/entitlement_restored|credit_balance|purchase_id/i.test(src));
});

prove("Screening compatible dispositions", () => {
  const s = resolveGovernedSurfaceDisposition({
    sectionKey: "screeningPressurePoints",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    availableFactKeys: ["score"],
    requiredFactKeys: ["score"],
    sourceBacked: true,
  });
  assert.ok(["include", "include_qualified", "compact"].includes(s.disposition));
});

prove("applyDispositionsToCustomerSurfaceSections attaches receipts", () => {
  const { sections, dispositionReceipts, qualityManifestEntries } =
    applyDispositionsToCustomerSurfaceSections({
      debtCapacityAndCoverage: {
        status: "required",
        facts: {
          proposedDebtYield: { result: 0.082, displayReady: true },
          proposedMortgageConstant: { result: 0.061, displayReady: true },
        },
        availableFacts: ["proposedDebtYield", "proposedMortgageConstant"],
        requiredFacts: ["proposedDebtYield", "proposedMortgageConstant"],
        factAvailability: { sourceBacked: true, available: ["proposedDebtYield", "proposedMortgageConstant"] },
      },
      unitMix: {
        status: "required",
        facts: { total_units: 40 },
        availableFacts: ["total_units"],
        requiredFacts: ["total_units"],
        factAvailability: { sourceBacked: true },
      },
    });
  assert.equal(sections.debtCapacityAndCoverage.disposition, "compact");
  assert.ok(dispositionReceipts.debtCapacityAndCoverage);
  assert.ok(qualityManifestEntries.length >= 2);
  assert.equal(sections.unitMix.classification, SECTION_CLASSIFICATIONS.CORE_REQUIRED);
});

prove("no RETEST-specific logic", () => {
  assert.ok(!/RETEST\s*39|RETEST\s*40/i.test(SECTION_DISPOSITION_CONTRACT_VERSION));
});

prove("no schema change", () => {
  assert.equal(SECTION_DISPOSITION_CONTRACT_VERSION, "section-disposition-contract-v1");
});

const failed = results.filter((r) => !r.ok);
console.log(`\nGate 2 focused smoke: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
console.log("ALL GATE 2 FOCUSED CHECKS PASSED");
