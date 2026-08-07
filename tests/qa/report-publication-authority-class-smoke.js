import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";
import { buildConstitutionalDeliveryGateDecision } from "../../api/_lib/delivery-gate-constitution.js";
import { buildAcquisitionMemoV2FinalDeliveryDecision } from "../../api/_lib/acquisition-memo-v2-final-decision.js";
import { ensureReportDownloadArtifact } from "../../api/_lib/report-delivery-output.js";

const sourceTruthPackage = buildCanonicalSourceTruthPackage({
  artifacts: [
    {
      id: "class-t12",
      type: "t12_parsed",
      payload: {
        effective_gross_income: 1500000,
        total_operating_expenses: 555000,
        net_operating_income: 945000,
        gross_potential_rent: 1600000,
        core_t12_validation: { ok: true, failures: [] },
      },
    },
    {
      id: "class-rent-roll",
      type: "rent_roll_parsed",
      payload: {
        total_units: 64,
        occupied_units: 60,
        occupancy: 0.9375,
        annual_in_place_rent: 1432800,
        units: Array.from({ length: 64 }, (_, index) => ({
          unit: String(index + 1),
          status: index < 60 ? "Occupied" : "Vacant",
          in_place_rent: index < 60 ? 1868.75 : 0,
        })),
      },
    },
  ],
});

assert.equal(sourceTruthPackage.core_publishable, true);

const gateWithRepresentationFailure = buildConstitutionalDeliveryGateDecision({
  sourceTruthPackage,
  pipelineCompliancePassed: false,
  htmlSafetyValidationPassed: false,
  rendererCompleted: false,
  customerBlockers: [],
});
assert.equal(gateWithRepresentationFailure.report_publishable, true);
assert.equal(gateWithRepresentationFailure.delivery_gate_status, "deliverable");
assert.equal(gateWithRepresentationFailure.report_authority_status, "publish_required");
assert.equal(gateWithRepresentationFailure.representation_required, true);

const finalDecisionWithRepresentationFailure = buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization: {
    compliance: { ok: false, violations: [{ code: "INTERNAL_RENDER_CONTRACT", classification: "internal_render_contract_failure" }] },
    bossCompliance: { ok: false, fatal_core: [] },
    customerSurfaceModelValidation: { ok: true, issues: [] },
    customerSurfaceHtmlValidation: { ok: false, issues: [] },
    deterministicContractQaSeal: { ok: false },
  },
  coreGate: { publishAllowed: true, fatalReasons: [], sourceTruthPackageValid: true },
});
assert.equal(finalDecisionWithRepresentationFailure.report_publishable, true);
assert.equal(finalDecisionWithRepresentationFailure.report_authority_status, "publish_required");
assert.equal(finalDecisionWithRepresentationFailure.representation_required, true);

function buildBossError(code, evidence = null) {
  const certification = {
    ok: false,
    status: "internal_pdf_publication_quality_failure",
    customer_delivery_allowed: false,
    blocking_issue_codes: [code],
    issues: [{ code, blocks_customer_delivery: true, ...(evidence ? { evidence } : {}) }],
  };
  const error = new Error(`boss blocked ${code}`);
  error.code = "PDF_ARTIFACT_FAILED";
  error.context = { final_pdf_publication_quality_boss: certification };
  return error;
}

function allowedBoss(label = "certified", issueCode = "AI_PROVIDER_429") {
  return {
    ok: true,
    status: label === "quality incident" ? "publishable_with_quality_incident" : "certified",
    customer_delivery_allowed: true,
    publication_disposition: label === "quality incident" ? "publish_with_quality_incident" : "publish",
    blocking_issue_codes: [],
    issues: label === "quality incident" ? [{ code: issueCode, blocks_customer_delivery: false }] : [],
    label,
  };
}

function buildFakes({ existingData = null, renderPlan = [], bossPlan = [] } = {}) {
  const calls = { rendered: [], uploaded: [], downloads: 0 };
  let stored = existingData;
  const bucket = {
    async download() {
      calls.downloads += 1;
      return stored ? { data: stored, error: null } : { data: null, error: new Error("not found") };
    },
    async upload(path, buffer) {
      stored = buffer;
      calls.uploaded.push({ path, buffer });
      return { data: { path }, error: null };
    },
  };
  const renderPdfBuffer = async ({ finalHtml }) => {
    calls.rendered.push(String(finalHtml || ""));
    const next = renderPlan.shift();
    if (next instanceof Error) throw next;
    return Buffer.from(`%PDF-1.4\n${calls.rendered.length}:${String(finalHtml || "")}`);
  };
  const runFinalPdfPublicationQualityBoss = async () => {
    const next = bossPlan.shift();
    if (next instanceof Error) throw next;
    return next || allowedBoss();
  };
  return {
    calls,
    renderPdfBuffer,
    runFinalPdfPublicationQualityBoss,
    supabaseAdmin: { storage: { from: () => bucket } },
  };
}

async function runScenario({
  corePublishable = true,
  existingData = null,
  renderPlan = [],
  bossPlan = [],
  coreSafeHtml = "",
  emergencyCoreHtml = "",
  buildEmergencyCoreHtml = null,
} = {}) {
  const fakes = buildFakes({ existingData, renderPlan, bossPlan });
  const result = await ensureReportDownloadArtifact({
    supabaseAdmin: fakes.supabaseAdmin,
    job: { id: "class-job", user_id: "class-user", report_type: "underwriting" },
    reportId: "class-report",
    storagePath: "class-user/class-report.pdf",
    finalHtml: "<html><body><p>Rich report representation</p></body></html>",
    reportType: "underwriting",
    reportSeed: "class-report",
    propertyName: "Generic Class Fixture",
    reportDownloadArtifactMode: "stub_pdf",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    corePublishable,
    coreSafeHtml,
    emergencyCoreHtml,
    buildEmergencyCoreHtml,
    deterministicContractQaSeal: {
      ok: true,
      corePublishable,
      sectionDispositionReceipts: { t12Core: { classification: "core_required", disposition: "include" } },
    },
    reportIdentity: { reportType: "underwriting" },
    renderPdfBuffer: fakes.renderPdfBuffer,
    runFinalPdfPublicationQualityBoss: fakes.runFinalPdfPublicationQualityBoss,
  });
  return { result, calls: fakes.calls };
}

const coreDamage = { missing_rows: [{ sectionKey: "t12Core" }] };

const healthy = await runScenario({ bossPlan: [allowedBoss()] });
assert.equal(healthy.result.verifiedDownloadArtifact, true);

const cssRecovery = await runScenario({
  bossPlan: [buildBossError("PDF_PAGE_OVERFLOW"), allowedBoss("css recovered")],
});
assert.equal(cssRecovery.result.publicationQualityBoss.label, "css recovered");

const semanticRecovery = await runScenario({
  bossPlan: [buildBossError("PDF_PAGE_OVERFLOW"), buildBossError("PDF_PAGE_OVERFLOW"), allowedBoss("semantic recovered")],
});
assert.equal(semanticRecovery.result.publicationQualityBoss.label, "semantic recovered");

const coreSafeRecovery = await runScenario({
  bossPlan: [buildBossError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", coreDamage), buildBossError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", coreDamage), allowedBoss("core safe")],
  coreSafeHtml: "<html><body>Canonical core-safe facts</body></html>",
});
assert.equal(coreSafeRecovery.result.publicationQualityBoss.label, "core safe");
assert.equal(coreSafeRecovery.calls.uploaded[0].buffer.toString().includes("Canonical core-safe facts"), true);

const emergencyRecovery = await runScenario({
  bossPlan: [buildBossError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", coreDamage), buildBossError("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", coreDamage), allowedBoss("emergency")],
  buildEmergencyCoreHtml: () => "<html><body>Deterministic minimum core facts</body></html>",
});
assert.equal(emergencyRecovery.result.publicationQualityBoss.status, "publishable_with_quality_incident");
assert.equal(emergencyRecovery.result.publicationQualityBoss.customer_delivery_allowed, true);
assert.equal(emergencyRecovery.result.artifactReplacementRequired, true);
assert.equal(emergencyRecovery.calls.uploaded.length, 1);

const bossDegradedPublication = await runScenario({
  bossPlan: [buildBossError("PDF_PAGE_OVERFLOW"), allowedBoss("PDF Boss degraded")],
});
assert.equal(bossDegradedPublication.result.verifiedDownloadArtifact, true);

const optionalCorruption = await runScenario({
  bossPlan: [buildBossError("PDF_PAGE_OVERFLOW"), allowedBoss("optional collapsed")],
});
assert.equal(optionalCorruption.result.verifiedDownloadArtifact, true);

const advisory429 = await runScenario({ bossPlan: [allowedBoss("quality incident", "AI_PROVIDER_429")] });
assert.equal(advisory429.result.verifiedDownloadArtifact, true);
const advisoryTimeout = await runScenario({ bossPlan: [allowedBoss("quality incident", "AI_PROVIDER_TIMEOUT")] });
assert.equal(advisoryTimeout.result.verifiedDownloadArtifact, true);

const richRendererError = new Error("rich renderer outage");
const emergencyRendererError = new Error("emergency renderer outage");
await assert.rejects(
  () => runScenario({ renderPlan: [richRendererError, emergencyRendererError], emergencyCoreHtml: "<html><body>Minimum core</body></html>" }),
  (error) => error === emergencyRendererError
);
const totalOutageFakes = buildFakes({ renderPlan: [new Error("rich"), new Error("emergency")] });
assert.equal(totalOutageFakes.calls.uploaded.length, 0);

const insufficientCoreError = new Error("rich renderer outage");
await assert.rejects(
  () => runScenario({ corePublishable: false, renderPlan: [insufficientCoreError], emergencyCoreHtml: "<html><body>Must not publish</body></html>" }),
  (error) => error === insufficientCoreError
);

const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
assert.match(workerSource, /corePublishable:\s*reportData\?\.core_publishable === true/);
assert.match(workerSource, /coreSafeHtml:\s*reportData\?\.core_safe_html \|\| ""/);
assert.match(workerSource, /emergencyCoreHtml:\s*reportData\?\.emergency_core_html \|\| ""/);
assert.match(workerSource, /restoreEntitlementForFailedJob/);

console.log("report publication authority class smoke PASS");
