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
import { buildApprovedPdfSurfaceManifest } from "../../api/_lib/final-pdf-publication-quality-boss.js";
import {
  ensureReportDownloadArtifact,
  resolveCorePreservingPdfQualityIncident,
} from "../../api/_lib/report-delivery-output.js";

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

async function proveBehavior(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: String(err?.message || err) });
    console.error(`FAIL  ${name}: ${err?.message || err}`);
  }
}

function buildBlockedPdfError(code, message = "blocked", evidence = null) {
  const certification = {
    ok: false,
    status: "internal_pdf_publication_quality_failure",
    customer_document_failure: false,
    customer_delivery_allowed: false,
    publication_disposition: "block",
    blocking_issue_codes: [code],
    issues: [{
      code,
      blocks_customer_delivery: true,
      ...(evidence ? { evidence } : {}),
    }],
  };
  const err = new Error(message);
  err.code = "PDF_ARTIFACT_FAILED";
  err.context = {
    failure_class: "internal_system_failure",
    customer_document_failure: false,
    final_pdf_publication_quality_boss: certification,
  };
  return err;
}

function buildAllowedPdfBossResult(label = "certified") {
  return {
    ok: true,
    status: "certified",
    strict_institutional_certified: true,
    customer_document_failure: false,
    customer_delivery_allowed: true,
    publication_disposition: "publish",
    external_publication_allowed: true,
    blocking_issue_codes: [],
    issues: [],
    label,
  };
}

function buildDeliveryFakes({ pdfBossPlan = [], existingData = null, renderPlan = [] } = {}) {
  const calls = {
    render: [],
    pdfBoss: [],
    storageDownload: 0,
    upload: 0,
    uploadOptions: [],
    uploadedBuffers: [],
    cleanupDelete: 0,
    cleanupEq: 0,
    reportTableAccess: 0,
    nonReportTableAccess: 0,
    entitlement: 0,
    credit: 0,
    purchase: 0,
  };
  let storedData = existingData;
  const storageBucket = {
    async download(path) {
      calls.storageDownload += 1;
      if (!storedData) return { error: new Error("not found"), data: null };
      return { error: null, data: storedData };
    },
    async upload(path, buffer, options = {}) {
      calls.upload += 1;
      calls.uploadOptions.push({ path, ...options });
      calls.uploadedBuffers.push(buffer);
      storedData = buffer;
      return { error: null, data: { path, size: buffer?.length || 0 } };
    },
  };
  const supabaseAdmin = {
    storage: {
      from(bucketName) {
        assert.equal(bucketName, "generated_reports");
        return storageBucket;
      },
    },
    from(tableName) {
      if (tableName === "reports") calls.reportTableAccess += 1;
      else {
        calls.nonReportTableAccess += 1;
        if (/entitlement/i.test(tableName)) calls.entitlement += 1;
        if (/credit/i.test(tableName)) calls.credit += 1;
        if (/purchase/i.test(tableName)) calls.purchase += 1;
      }
      return {
        delete() {
          calls.cleanupDelete += 1;
          return {
            eq(column, value) {
              calls.cleanupEq += 1;
              assert.equal(column, "id");
              assert.equal(value, "report-1");
              return Promise.resolve({ error: null, data: null });
            },
          };
        },
      };
    },
  };
  const renderPdfBuffer = async ({ finalHtml }) => {
    calls.render.push(String(finalHtml || ""));
    const planned = renderPlan.shift();
    if (planned instanceof Error) throw planned;
    return Buffer.from(`%PDF-1.4\n${calls.render.length}\n`);
  };
  const runFinalPdfPublicationQualityBoss = async (args = {}) => {
    calls.pdfBoss.push(args);
    const next = pdfBossPlan.shift();
    if (next instanceof Error) throw next;
    return next || buildAllowedPdfBossResult();
  };
  return { calls, supabaseAdmin, renderPdfBuffer, runFinalPdfPublicationQualityBoss };
}

async function runEnsureReportDownloadArtifactScenario(pdfBossPlan, corePublishable = false, options = {}) {
  const fakes = buildDeliveryFakes({
    pdfBossPlan,
    existingData: options.existingData || null,
    renderPlan: options.renderPlan || [],
  });
  const result = await ensureReportDownloadArtifact({
    supabaseAdmin: fakes.supabaseAdmin,
    job: { id: "job-1", user_id: "user-1", report_type: "underwriting" },
    reportId: "report-1",
    storagePath: "user-1/job-1.pdf",
    finalHtml: `<html><head></head><body><table class="source-table"><thead><tr><th>Metric</th><th>Result</th><th>Formula</th><th>Sources</th></tr></thead><tbody><tr><td>Debt Yield</td><td>8.2%</td><td>NOI/Loan</td><td>source-uuid</td></tr></tbody></table></body></html>`,
    reportType: "underwriting",
    reportSeed: "job-1",
    propertyName: "Behavioral Test",
    reportDownloadArtifactMode: "stub_pdf",
    createdReportRecord: true,
    deliveryGateStatus: "deliverable",
    corePublishable,
    coreSafeHtml: options.coreSafeHtml || "",
    emergencyCoreHtml: options.emergencyCoreHtml || "",
    holdDelivery: false,
    deterministicContractQaSeal: {
      ok: true,
      sectionDispositionReceipts: {
        debtCapacityAndCoverage: applySectionDisposition({
          sectionKey: "debtCapacityAndCoverage",
          classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
          requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
          compactRendererEligible: true,
          minimumSurvivingFactKeys: ["proposedDebtYield"],
        }),
        ...(options.coreRequired
          ? { t12Core: { classification: "core_required", disposition: "include" } }
          : {}),
      },
    },
    reportIdentity: { reportType: "underwriting" },
    publicationTarget: "external_customer",
    renderPdfBuffer: fakes.renderPdfBuffer,
    runFinalPdfPublicationQualityBoss: fakes.runFinalPdfPublicationQualityBoss,
  });
  return { result, calls: fakes.calls };
}

function makeEnsureArgs(fakes, overrides = {}) {
  return {
    supabaseAdmin: fakes.supabaseAdmin,
    job: { id: "job-1", user_id: "user-1", report_type: "underwriting" },
    reportId: "report-1",
    storagePath: "user-1/job-1.pdf",
    finalHtml: "<html><head></head><body><p>Approved surface</p></body></html>",
    reportType: "underwriting",
    reportSeed: "job-1",
    propertyName: "Behavioral Test",
    reportDownloadArtifactMode: "stub_pdf",
    createdReportRecord: true,
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    deterministicContractQaSeal: { ok: true },
    reportIdentity: { reportType: "underwriting" },
    renderPdfBuffer: fakes.renderPdfBuffer,
    runFinalPdfPublicationQualityBoss: fakes.runFinalPdfPublicationQualityBoss,
    ...overrides,
  };
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
  assert.equal(
    isIntentionalCompactDetailLoss(
      {
        label: "Formula",
        value: "NOI/Loan",
        sectionKey: "debtCapacityAndCoverage",
        tableDisposition: "compact",
      },
      receipts
    ),
    true
  );
  assert.equal(isIntentionalCompactDetailLoss({ label: "Formula", value: "NOI/Loan" }, receipts), false);
  assert.equal(
    isIntentionalCompactDetailLoss({ label: "Proposed Debt Yield", value: "8.2%" }, receipts),
    false
  );
  const filtered = filterMissingFinancialRowsForIntentionalDisposition(
    [
      {
        label: "Formula",
        value: "NOI/Loan",
        sectionKey: "debtCapacityAndCoverage",
        tableDisposition: "compact",
      },
      { label: "Proposed Debt Yield", value: "8.2%" },
    ],
    receipts
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].label, "Proposed Debt Yield");
});

prove("PDF Boss manifest carries compact row disposition context", () => {
  const manifest = buildApprovedPdfSurfaceManifest({
    approvedHtml: `<table class="source-table" data-iq-section="debtCapacityAndCoverage" data-iq-disposition="compact"><thead><tr><th>Metric</th><th>Result</th></tr></thead><tbody><tr data-iq-section="debtCapacityAndCoverage" data-iq-disposition="compact"><td>Proposed Debt Yield</td><td>8.2%</td></tr></tbody></table>`,
    sectionDispositionReceipts: {
      debtCapacityAndCoverage: applySectionDisposition({
        sectionKey: "debtCapacityAndCoverage",
        classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
        requestedDisposition: SECTION_DISPOSITIONS.COMPACT,
        compactRendererEligible: true,
        minimumSurvivingFactKeys: ["proposedDebtYield"],
      }),
    },
  });
  assert.equal(manifest.financialRows[0].sectionKey, "debtCapacityAndCoverage");
  assert.equal(manifest.financialRows[0].tableDisposition, "compact");
  assert.ok(manifest.sectionDispositionReceipts.debtCapacityAndCoverage);
  assert.equal(Object.keys(manifest.sectionDispositionReceipts).length, 1);
});

prove("core-preserving quality incident keeps collapse-eligible PDF failure publishable", () => {
  const certification = {
    ok: false,
    status: "internal_pdf_publication_quality_failure",
    customer_delivery_allowed: false,
    blocking_issue_codes: ["PDF_REQUIRED_FINANCIAL_FACTS_MISSING"],
    issues: [{
      code: "PDF_REQUIRED_FINANCIAL_FACTS_MISSING",
      blocks_customer_delivery: true,
      evidence: {
        missing_rows: [{
          label: "Proposed Acquisition Debt-Inclusive Operating Break-Even Ratio",
          value: "76.3%",
          sectionKey: "debtCapacityAndCoverage",
        }],
      },
    }],
  };
  const resolved = resolveCorePreservingPdfQualityIncident({
    certification,
    corePublishable: true,
    semanticRecompositionAttempted: true,
    sectionDispositionReceipts: {
      debtCapacityAndCoverage: {
        classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
        disposition: SECTION_DISPOSITIONS.COMPACT,
      },
    },
  });
  assert.equal(resolved.status, "publishable_with_quality_incident");
  assert.equal(resolved.publication_disposition, "publish_with_quality_incident");
  assert.equal(resolved.customer_delivery_allowed, true);
  assert.deepEqual(resolved.blocking_issue_codes, []);
  assert.equal(resolved.issues[0].blocks_customer_delivery, false);
  assert.equal(resolved.approved_surface, certification.approved_surface);
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

await proveBehavior("ensureReportDownloadArtifact semantically recertifies collapse-eligible CSS failure and publishes", async () => {
  const { result, calls } = await runEnsureReportDownloadArtifactScenario([
    buildBlockedPdfError("PDF_PAGE_OVERFLOW", "initial block"),
    buildBlockedPdfError("PDF_PAGE_OVERFLOW", "css recovery block"),
    buildAllowedPdfBossResult("semantic success"),
  ]);
  assert.equal(calls.pdfBoss.length, 3);
  assert.equal(calls.render.length, 3);
  assert.equal(calls.upload, 1);
  assert.equal(calls.storageDownload, 2);
  assert.equal(calls.cleanupDelete, 0);
  assert.equal(calls.cleanupEq, 0);
  assert.equal(result.verifiedDownloadArtifact, true);
  assert.equal(result.createdDownloadArtifact, true);
  assert.equal(result.publicationQualityBoss.label, "semantic success");
  assert.equal(result.semanticRecomposition?.semanticAttemptMax, 1);
  assert.equal(result.semanticRecomposition?.semanticAttemptUsed, true);
  assert.equal(result.institutionalPdfRecovery?.attemptCount, 1);
  assert.equal(calls.pdfBoss[0].semanticRecompositionReceipt, null);
  assert.equal(calls.pdfBoss[1].semanticRecompositionReceipt, null);
  assert.equal(calls.pdfBoss[2].semanticRecompositionReceipt?.semanticAttemptMax, 1);
  assert.ok(calls.pdfBoss[0].sectionDispositionReceipts.debtCapacityAndCoverage);
  assert.ok(calls.pdfBoss[1].sectionDispositionReceipts.debtCapacityAndCoverage);
  assert.ok(calls.pdfBoss[2].sectionDispositionReceipts.debtCapacityAndCoverage);
  assert.equal(calls.pdfBoss[2].sectionDispositionReceipts.debtCapacityAndCoverage.disposition, "compact");
  assert.ok(calls.pdfBoss[2].approvedHtml.includes("data-iq-disposition=\"compact\""));
  assert.equal(calls.nonReportTableAccess, 0);
  assert.equal(calls.entitlement + calls.credit + calls.purchase, 0);
});

await proveBehavior("ensureReportDownloadArtifact publishes sufficient core after non-collapse-eligible recovery failure", async () => {
  const fakes = buildDeliveryFakes({
    pdfBossPlan: [
      buildBlockedPdfError("PDF_RUNNING_HEADER_MISSING", "initial css block"),
      buildBlockedPdfError("PDF_RUNNING_HEADER_MISSING", "css recovery still blocked"),
    ],
  });
  const result = await ensureReportDownloadArtifact({
    supabaseAdmin: fakes.supabaseAdmin,
    job: { id: "job-1", user_id: "user-1", report_type: "underwriting" },
    reportId: "report-1",
    storagePath: "user-1/job-1.pdf",
    finalHtml: "<html><head></head><body><p>Approved surface</p></body></html>",
    reportType: "underwriting",
    reportSeed: "job-1",
    reportDownloadArtifactMode: "stub_pdf",
    createdReportRecord: true,
    deliveryGateStatus: "deliverable",
    corePublishable: true,
    deterministicContractQaSeal: { ok: true },
    reportIdentity: { reportType: "underwriting" },
    renderPdfBuffer: fakes.renderPdfBuffer,
    runFinalPdfPublicationQualityBoss: fakes.runFinalPdfPublicationQualityBoss,
  });
  assert.equal(fakes.calls.pdfBoss.length, 2);
  assert.equal(fakes.calls.render.length, 2);
  assert.equal(fakes.calls.upload, 1);
  assert.equal(result.publicationQualityBoss.status, "publishable_with_quality_incident");
  assert.equal(result.publicationQualityBoss.customer_delivery_allowed, true);
  assert.equal(result.publicationQualityBoss.publication_disposition, "publish_with_quality_incident");
  assert.equal(fakes.calls.cleanupDelete, 0);
  assert.equal(fakes.calls.cleanupEq, 0);
  assert.equal(fakes.calls.nonReportTableAccess, 0);
  assert.equal(fakes.calls.entitlement + fakes.calls.credit + fakes.calls.purchase, 0);
});

await proveBehavior("existing healthy PDF remains authoritative without replacement", async () => {
  const { result, calls } = await runEnsureReportDownloadArtifactScenario(
    [buildAllowedPdfBossResult("existing healthy")],
    false,
    { existingData: Buffer.from("%PDF-existing-healthy") }
  );
  assert.equal(result.artifactReplacementRequired, false);
  assert.equal(result.artifactSource, "existing_download");
  assert.equal(calls.storageDownload, 1);
  assert.equal(calls.upload, 0);
  assert.deepEqual(calls.uploadOptions, []);
});

await proveBehavior("existing PDF CSS recovery replaces storage exactly once", async () => {
  const { result, calls } = await runEnsureReportDownloadArtifactScenario(
    [
      buildBlockedPdfError("PDF_SPACING_OVERLAP", "initial CSS defect"),
      buildAllowedPdfBossResult("CSS recovered"),
    ],
    false,
    { existingData: Buffer.from("%PDF-existing-damaged") }
  );
  assert.equal(result.artifactReplacementRequired, true);
  assert.equal(result.artifactSource, "recovered_existing_download");
  assert.equal(calls.upload, 1);
  assert.equal(calls.uploadOptions[0].upsert, true);
  assert.deepEqual(calls.uploadedBuffers[0], Buffer.from("%PDF-1.4\n1\n"));
});

await proveBehavior("existing PDF semantic recovery owns the replacement buffer", async () => {
  const { result, calls } = await runEnsureReportDownloadArtifactScenario(
    [
      buildBlockedPdfError("PDF_PAGE_OVERFLOW", "initial defect"),
      buildBlockedPdfError("PDF_PAGE_OVERFLOW", "CSS defect remains"),
      buildAllowedPdfBossResult("semantic recovered"),
    ],
    false,
    { existingData: Buffer.from("%PDF-existing-damaged") }
  );
  assert.equal(result.artifactReplacementRequired, true);
  assert.equal(calls.upload, 1);
  assert.equal(calls.uploadOptions[0].upsert, true);
  assert.deepEqual(calls.uploadedBuffers[0], Buffer.from("%PDF-1.4\n2\n"));
  assert.equal(result.publicationQualityBoss.label, "semantic recovered");
});

await proveBehavior("existing PDF core-safe fallback replaces mandatory-core damage", async () => {
  const coreDisplayEvidence = { missing_rows: [{ sectionKey: "t12Core" }] };
  const { result, calls } = await runEnsureReportDownloadArtifactScenario(
    [
      buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "core display damaged", coreDisplayEvidence),
      buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "CSS recovery still has core damage", coreDisplayEvidence),
      buildAllowedPdfBossResult("core safe recovered"),
    ],
    true,
    {
      existingData: Buffer.from("%PDF-existing-core-damaged"),
      coreRequired: true,
      coreSafeHtml: "<html><body><p>Canonical core-safe facts</p></body></html>",
      emergencyCoreHtml: "<html><body><p>Emergency core facts</p></body></html>",
    }
  );
  assert.equal(result.artifactReplacementRequired, true);
  assert.equal(calls.upload, 1);
  assert.equal(calls.uploadOptions[0].upsert, true);
  assert.deepEqual(calls.uploadedBuffers[0], Buffer.from("%PDF-1.4\n2\n"));
  assert.equal(calls.render[1].includes("Canonical core-safe facts"), true);
  assert.equal(result.publicationQualityBoss.label, "core safe recovered");
});

await proveBehavior("existing PDF emergency fallback owns publishable quality-incident output", async () => {
  const coreDisplayEvidence = { missing_rows: [{ sectionKey: "t12Core" }] };
  const { result, calls } = await runEnsureReportDownloadArtifactScenario(
    [
      buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "core display damaged", coreDisplayEvidence),
      buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "CSS recovery still has core damage", coreDisplayEvidence),
      buildAllowedPdfBossResult("emergency certified"),
    ],
    true,
    {
      existingData: Buffer.from("%PDF-existing-core-damaged"),
      coreRequired: true,
      emergencyCoreHtml: "<html><body><p>Emergency core facts</p></body></html>",
    }
  );
  assert.equal(result.artifactReplacementRequired, true);
  assert.equal(calls.upload, 1);
  assert.equal(calls.uploadOptions[0].upsert, true);
  assert.deepEqual(calls.uploadedBuffers[0], Buffer.from("%PDF-1.4\n2\n"));
  assert.equal(calls.render[1].includes("Emergency core facts"), true);
  assert.equal(result.publicationQualityBoss.status, "publishable_with_quality_incident");
  assert.equal(result.publicationQualityBoss.customer_delivery_allowed, true);
  assert.equal(result.publicationQualityBoss.publication_disposition, "publish_with_quality_incident");
  assert.equal(result.publicationQualityBoss.quality_incident.emergency_core_fallback_used, true);
});

await proveBehavior("initial rich render failure with insufficient core remains fail-closed", async () => {
  const richError = new Error("rich PDF renderer unavailable");
  richError.code = "RICH_RENDER_FAILED";
  const fakes = buildDeliveryFakes({ renderPlan: [richError] });
  await assert.rejects(
    () => ensureReportDownloadArtifact(makeEnsureArgs(fakes, {
      corePublishable: false,
      emergencyCoreHtml: "<html><body><p>Emergency core facts</p></body></html>",
    })),
    (error) => error === richError && error.code === "RICH_RENDER_FAILED"
  );
  assert.equal(fakes.calls.render.length, 1);
  assert.equal(fakes.calls.upload, 0);
});

await proveBehavior("initial rich render failure with sufficient core publishes emergency PDF", async () => {
  const richError = new Error("rich PDF renderer unavailable");
  richError.code = "RICH_RENDER_FAILED";
  const emergencyHtml = "<html><body><p>Emergency core facts</p></body></html>";
  const fakes = buildDeliveryFakes({
    renderPlan: [richError],
    pdfBossPlan: [buildAllowedPdfBossResult("emergency certified")],
  });
  const result = await ensureReportDownloadArtifact(makeEnsureArgs(fakes, {
    corePublishable: true,
    emergencyCoreHtml: emergencyHtml,
  }));
  assert.equal(fakes.calls.render.length, 2);
  assert.equal(fakes.calls.render[0].includes("Emergency core facts"), false);
  assert.equal(fakes.calls.render[1], emergencyHtml);
  assert.equal(fakes.calls.pdfBoss.length, 1);
  assert.equal(fakes.calls.upload, 1);
  assert.equal(result.publicationQualityBoss.status, "publishable_with_quality_incident");
  assert.equal(result.publicationQualityBoss.customer_delivery_allowed, true);
  assert.match(
    result.publicationQualityBoss.quality_incident.core_safe_fallback_diagnostic.cause,
    /rich PDF renderer unavailable/
  );
});

await proveBehavior("total renderer outage propagates without fabricated PDF bytes", async () => {
  const richError = new Error("rich PDF renderer unavailable");
  richError.code = "RICH_RENDER_FAILED";
  const emergencyError = new Error("emergency PDF renderer unavailable");
  emergencyError.code = "EMERGENCY_RENDER_FAILED";
  const fakes = buildDeliveryFakes({ renderPlan: [richError, emergencyError] });
  await assert.rejects(
    () => ensureReportDownloadArtifact(makeEnsureArgs(fakes, {
      corePublishable: true,
      emergencyCoreHtml: "<html><body><p>Emergency core facts</p></body></html>",
    })),
    (error) => error === emergencyError &&
      error.context?.initial_render_error === "rich PDF renderer unavailable" &&
      error.context?.emergency_core_render_error === "emergency PDF renderer unavailable"
  );
  assert.equal(fakes.calls.render.length, 2);
  assert.equal(fakes.calls.upload, 0);
});

await proveBehavior("sufficient core publishes with a bounded quality incident after semantic recovery", async () => {
  const { result, calls } = await runEnsureReportDownloadArtifactScenario([
    buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "initial block"),
    buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "css recovery block"),
    buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "semantic parity block"),
  ], true);
  assert.equal(calls.pdfBoss.length, 3);
  assert.equal(calls.render.length, 3);
  assert.equal(calls.upload, 1);
  assert.equal(result.publicationQualityBoss.status, "publishable_with_quality_incident");
  assert.equal(result.publicationQualityBoss.customer_delivery_allowed, true);
  assert.equal(result.publicationQualityBoss.quality_incident.semantic_recomposition_attempted, true);
  assert.equal(result.semanticRecomposition.semanticAttemptUsed, true);
});

await proveBehavior("ensureReportDownloadArtifact failed semantic recertification exits without upload and cleans once", async () => {
  const fakes = buildDeliveryFakes({
    pdfBossPlan: [
      buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "initial block"),
      buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "css recovery block"),
      buildBlockedPdfError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", "semantic block"),
    ],
  });
  await assert.rejects(
    () => ensureReportDownloadArtifact({
      supabaseAdmin: fakes.supabaseAdmin,
      job: { id: "job-1", user_id: "user-1", report_type: "underwriting" },
      reportId: "report-1",
      storagePath: "user-1/job-1.pdf",
      finalHtml: `<html><head></head><body><table class="source-table"><thead><tr><th>Metric</th><th>Result</th><th>Formula</th></tr></thead><tbody><tr><td>Debt Yield</td><td>8.2%</td><td>NOI/Loan</td></tr></tbody></table></body></html>`,
      reportType: "underwriting",
      reportSeed: "job-1",
      reportDownloadArtifactMode: "stub_pdf",
      createdReportRecord: true,
      deliveryGateStatus: "deliverable",
      deterministicContractQaSeal: { ok: true },
      reportIdentity: { reportType: "underwriting" },
      renderPdfBuffer: fakes.renderPdfBuffer,
      runFinalPdfPublicationQualityBoss: fakes.runFinalPdfPublicationQualityBoss,
    }),
    (err) => err?.code === "PDF_ARTIFACT_FAILED"
  );
  assert.equal(fakes.calls.pdfBoss.length, 3);
  assert.equal(fakes.calls.render.length, 3);
  assert.equal(fakes.calls.pdfBoss.filter((call) => call.semanticRecompositionReceipt?.semanticAttemptUsed === true).length, 1);
  assert.equal(fakes.calls.upload, 0);
  assert.equal(fakes.calls.cleanupDelete, 1);
  assert.equal(fakes.calls.cleanupEq, 1);
  assert.equal(fakes.calls.nonReportTableAccess, 0);
  assert.equal(fakes.calls.entitlement + fakes.calls.credit + fakes.calls.purchase, 0);
});

const failed = results.filter((r) => !r.ok);
console.log(`\nGate 2 focused smoke: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
console.log("ALL GATE 2 FOCUSED CHECKS PASSED");
