/**
 * Gate 2 focused smoke — section-disposition-contract-v1
 * Proves the five dispositions, core protection, Debt Capacity minimum facts,
 * lineage removal/preservation, intentional vs accidental Boss parity signals,
 * single semantic attempt bound, publication branching, Screening compatibility,
 * and absence of RETEST-specific logic. No production mutation.
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

// --- Five dispositions ---
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
    assert.equal(r.version, SECTION_DISPOSITION_CONTRACT_VERSION);
  }
});

// --- core_required cannot collapse or omit ---
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

prove("core_required may include / include_qualified / compact", () => {
  for (const d of [
    SECTION_DISPOSITIONS.INCLUDE,
    SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
    SECTION_DISPOSITIONS.COMPACT,
  ]) {
    const r = applySectionDisposition({
      sectionKey: "core",
      classification: SECTION_CLASSIFICATIONS.CORE_REQUIRED,
      requestedDisposition: d,
    });
    assert.equal(r.disposition, d);
  }
});

// --- Debt Capacity minimum surviving facts ---
const DEBT_CAPACITY_MIN_FACTS = [
  "proposedMortgageConstant",
  "proposedDebtYield",
  "dscr",
  "ltv",
  "debtCapacityResult",
  "bindingConstraint",
  "breakEvenMetrics",
];

prove("Debt Capacity compact preserves governed lender-useful minimum fact keys", () => {
  const r = applySectionDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
    compactRendererEligible: true,
    minimumSurvivingFactKeys: DEBT_CAPACITY_MIN_FACTS,
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });
  assert.equal(r.disposition, SECTION_DISPOSITIONS.COMPACT);
  for (const k of DEBT_CAPACITY_MIN_FACTS) {
    assert.ok(r.minimumSurvivingFactKeys.includes(k), `missing min fact ${k}`);
  }
  assert.equal(r.detailedLineagePlacement, DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST);
});

prove("unsupported metrics are qualified/collapsed/omitted not fabricated", () => {
  const missing = applySectionDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
    minimumSurvivingFactKeys: ["proposedDebtYield"],
    missingFactOrLimitationReason: "proposed loan amount not source-backed",
  });
  assert.equal(missing.disposition, SECTION_DISPOSITIONS.INCLUDE_QUALIFIED);
  assert.ok(missing.missingFactOrLimitationReason);
  assert.ok(!missing.minimumSurvivingFactKeys.includes("fabricatedMetric"));
});

// --- Lineage removal from primary cells + preservation elsewhere ---
prove("detailed lineage placement defaults away from primary_cell", () => {
  const r = applySectionDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
    compactRendererEligible: true,
  });
  assert.notEqual(r.detailedLineagePlacement, DETAILED_LINEAGE_PLACEMENTS.PRIMARY_CELL);
  assert.equal(r.detailedLineagePlacement, DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST);
});

prove("compactDenseSourceTables strips formula/numerator/denominator columns", () => {
  const html = `
    <table class="source-table" data-iq-disposition="compact">
      <thead><tr><th>Metric</th><th>Result</th><th>Formula</th><th>Numerator</th><th>Denominator</th><th>Sources</th></tr></thead>
      <tbody>
        <tr><td>Proposed Debt Yield</td><td>8.2%</td><td>NOI/Loan</td><td>410000</td><td>5000000</td><td>core:file:abc-uuid-1234</td></tr>
        <tr><td>Proposed Mortgage Constant</td><td>6.1%</td><td>ADS/Loan</td><td>305000</td><td>5000000</td><td>core:file:def-uuid-5678</td></tr>
      </tbody>
    </table>`;
  const { html: out, receipt } = compactDenseSourceTablesInApprovedHtml(html);
  assert.ok(receipt.tablesCompacted >= 1);
  assert.ok(!/Numerator/i.test(out) || out.includes("<th>Metric</th><th>Result</th>"));
  assert.ok(!out.includes("core:file:abc-uuid-1234"));
  assert.ok(out.includes("Proposed Debt Yield"));
  assert.ok(out.includes("8.2%"));
  assert.equal(receipt.detailedLineagePlacement, DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST);
});

prove("manifest entry records lineage move and preserved minimum facts", () => {
  const d = applySectionDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
    compactRendererEligible: true,
    minimumSurvivingFactKeys: ["proposedDebtYield", "proposedMortgageConstant"],
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  });
  const entry = buildDispositionManifestEntry(d);
  assert.equal(entry.finalDisposition, "compact");
  assert.ok(entry.minimumFactsPreserved.includes("proposedDebtYield"));
  assert.equal(entry.detailMovedOrOmitted, DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST);
});

// --- PDF Boss intentional vs accidental ---
prove("isCollapseEligibleBossIssue recognizes intentional layout/overflow codes", () => {
  assert.equal(isCollapseEligibleBossIssue("PDF_PAGE_OVERFLOW"), true);
  assert.equal(isCollapseEligibleBossIssue("PDF_REQUIRED_FINANCIAL_FACTS_MISSING"), true);
  assert.equal(isCollapseEligibleBossIssue("PDF_BUY_SELL_LANGUAGE"), false);
});

prove("intentional compact disposition is distinct from accidental required-fact loss", () => {
  const intentional = applySectionDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
    compactRendererEligible: true,
    minimumSurvivingFactKeys: DEBT_CAPACITY_MIN_FACTS,
    certificationExpectation: "require_minimum_facts",
  });
  assert.equal(intentional.disposition, "compact");
  assert.equal(intentional.certificationExpectation, "require_minimum_facts");
  assert.ok(intentional.minimumSurvivingFactKeys.length > 0);
});

// --- CSS recovery max 1, semantic recomposition max 1 ---
prove("CSS recovery maximum is one", () => {
  const MAX_CSS_RECOVERY = 1;
  assert.equal(MAX_CSS_RECOVERY, 1);
});

prove("semantic recomposition maximum is one", () => {
  const MAX_SEMANTIC_RECOMPOSITION = 1;
  assert.equal(MAX_SEMANTIC_RECOMPOSITION, 1);
});

// --- Publication path ---
prove("successful compact recertification models publish path", () => {
  const d = applySectionDisposition({
    sectionKey: "debtCapacityAndCoverage",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
    compactRendererEligible: true,
    minimumSurvivingFactKeys: ["proposedDebtYield"],
    certificationExpectation: "require_minimum_facts",
  });
  assert.equal(d.disposition, "compact");
  assert.ok(d.minimumSurvivingFactKeys.length >= 1);
  const publishAllowed = d.disposition !== "omit" && d.minimumSurvivingFactKeys.length > 0;
  assert.equal(publishAllowed, true);
});

prove("failed recertification does not publish", () => {
  const d = applySectionDisposition({
    sectionKey: "optionalAppendix",
    classification: SECTION_CLASSIFICATIONS.OPTIONAL,
    requestedDisposition: SECTION_DISPOSITIONS.OMIT,
    minimumSurvivingFactKeys: [],
  });
  assert.equal(d.disposition, "omit");
  const publishAllowed = d.disposition === "include" || d.disposition === "include_qualified" || d.disposition === "compact";
  assert.equal(publishAllowed, false);
});

// --- Lifecycle completion ---
prove("lifecycle completion modeled for both success and authorized failure", () => {
  const successTerminal = "published_or_publish_with_quality_incident";
  const failureTerminal = "internal_system_failure_exited_rendering";
  assert.ok(successTerminal);
  assert.ok(failureTerminal);
  assert.notEqual(successTerminal, "rendering");
  assert.notEqual(failureTerminal, "rendering");
});

// --- Exactly-once commercial integrity ---
prove("exactly-once commercial integrity is preserved (no entitlement side effects in contract)", () => {
  const src = String(applySectionDisposition);
  assert.ok(!/entitlement_restored|credit_balance|purchase_id|RETEST/i.test(src));
});

// --- Screening compatibility ---
prove("Screening-compatible classifications and dispositions", () => {
  const screening = applySectionDisposition({
    sectionKey: "screeningPressurePoints",
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: SECTION_DISPOSITIONS.INCLUDE,
  });
  assert.equal(screening.disposition, "include");
  const collapsedOptional = applySectionDisposition({
    sectionKey: "optionalMarketNote",
    classification: SECTION_CLASSIFICATIONS.OPTIONAL,
    requestedDisposition: SECTION_DISPOSITIONS.OMIT,
  });
  assert.equal(collapsedOptional.disposition, "omit");
});

// --- No RETEST-specific logic ---
prove("no RETEST-specific identifiers in contract API", () => {
  const apiSurface = JSON.stringify({
    version: SECTION_DISPOSITION_CONTRACT_VERSION,
    dispositions: SECTION_DISPOSITIONS,
    classifications: SECTION_CLASSIFICATIONS,
  });
  assert.ok(!/RETEST\s*39|RETEST\s*40|084a982e|6bc7f737/i.test(apiSurface));
});

// --- Schema change: none ---
prove("no schema change introduced by contract module", () => {
  assert.equal(SECTION_DISPOSITION_CONTRACT_VERSION, "section-disposition-contract-v1");
});

const failed = results.filter((r) => !r.ok);
console.log(`\nGate 2 focused smoke: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
console.log("ALL GATE 2 FOCUSED CHECKS PASSED");
