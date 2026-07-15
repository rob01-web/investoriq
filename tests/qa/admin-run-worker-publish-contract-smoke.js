import assert from "node:assert/strict";
import axios from "axios";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import fs from "fs";
import {
  buildReportStoragePath,
  ensureReportDownloadArtifact,
  renderReportPdfBuffer,
  resolveOrCreateReportPublicationRecord,
} from "../../api/_lib/report-delivery-output.js";

const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
const generatorSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const dashboardSource = fs.readFileSync("src/pages/Dashboard.jsx", "utf8");
const traverse = traverseModule.default || traverseModule;

const workerAst = parse(workerSource, { sourceType: "module" });
const unboundArtifactResolutionReferences = [];
traverse(workerAst, {
  ReferencedIdentifier(path) {
    if (path.node.name === "artifactResolution" && !path.scope.hasBinding("artifactResolution")) {
      unboundArtifactResolutionReferences.push(path.node.loc?.start || null);
    }
  },
});
assert.deepEqual(
  unboundArtifactResolutionReferences,
  [],
  "artifactResolution must remain bound across artifact verification and report-event publication"
);

assert.match(
  workerSource,
  /import \{\s*buildReportStoragePath,\s*ensureReportDownloadArtifact,\s*resolveOrCreateReportPublicationRecord,\s*\} from '\.\/_lib\/report-delivery-output\.js';/
);
assert.match(workerSource, /allowCreate:\s*!shouldHoldDeliveryOutcome/);
assert.match(workerSource, /ensureReportDownloadArtifact\(\{/);
assert.match(
  workerSource,
  /finalHtml:\s*reportData\?\.final_html \|\| ""/
);
assert.match(
  workerSource,
  /createdReportRecord:\s*Boolean\(publicationResolution\?\.createdReportRecord\),/
);
assert.match(workerSource, /deterministicContractQaSeal:\s*reportData\?\.deterministic_contract_qa_seal \|\| null/);
assert.match(workerSource, /sourceReconciliation:\s*reportData\?\.source_reconciliation \|\| null/);
assert.match(workerSource, /let artifactResolution = null;\s*let verifiedPublicationCheckpoint = null;/);
assert.match(
  workerSource,
  /resolvedDeliveryDecision\.deliveryGateStatus === 'deliverable'[\s\S]*?resolvedDeliveryDecision\.customerDeliveryAllowed === true[\s\S]*?artifactResolution\?\.verifiedDownloadArtifact === true[\s\S]*?publicationQualityBoss\?\.ok === true[\s\S]*?publicationQualityBoss\?\.status === 'certified'/
);
assert.match(
  workerSource,
  /if \(verifiedPublicationCheckpoint\) \{[\s\S]*?preserveVerifiedPublicationAfterLateWorkerError\([\s\S]*?continue;[\s\S]*?\}\s*await recordJobFailure\(job, 'rendering', err\);/
);
const preservationStart = workerSource.indexOf("const preserveVerifiedPublicationAfterLateWorkerError");
const preservationEnd = workerSource.indexOf("const controlledAction", preservationStart);
assert.notEqual(preservationStart, -1);
assert.notEqual(preservationEnd, -1);
const preservationSource = workerSource.slice(preservationStart, preservationEnd);
assert.match(preservationSource, /checkpoint\?\.verifiedDownloadArtifact !== true/);
assert.match(preservationSource, /checkpoint\?\.publicationQualityBoss\?\.status !== 'certified'/);
assert.match(preservationSource, /const completeUpdate = \{ status: 'published' \};/);
assert.match(preservationSource, /POST_VERIFIED_PUBLICATION_WORKER_ERROR/);
assert.equal(/applyTerminalFailureOutcome|restoreEntitlementForFailedJob/.test(preservationSource), false);
assert.match(dashboardSource, /supabase\.storage\.from\('generated_reports'\)\.createSignedUrl\(report\.storage_path, 300\)/);
assert.match(generatorSource, /reportId,\s*storagePath:\s*validatedStoragePath,\s*report_type:\s*reportType,/);
const gateArtifactDeclaration = generatorSource.indexOf(
  "const deliveryGateArtifactDecision = deliveryGateDecisionResult"
);
const gateArtifactUse = generatorSource.indexOf(
  "...(deliveryGateArtifactDecision || deliveryGateDecision)"
);
assert.notEqual(gateArtifactDeclaration, -1);
assert.notEqual(gateArtifactUse, -1);
assert.ok(
  gateArtifactDeclaration < gateArtifactUse,
  "canonical delivery-gate audit payload must be initialized before artifact persistence"
);

const publishedRouteResponse = {
  reportId: "report-live-contract-123",
  storagePath: "user-123/job-live-contract-123.pdf",
  report_type: "underwriting",
};
const passPublicationQualityBoss = async () => ({
  ok: true,
  status: "certified",
  customer_document_failure: false,
});
const publishedRouteResolution = await resolveOrCreateReportPublicationRecord({
  supabaseAdmin: {},
  job: {
    id: "job-live-contract-123",
    user_id: "user-123",
    report_type: "underwriting",
  },
  reportData: publishedRouteResponse,
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
});
assert.deepEqual(publishedRouteResolution, {
  reportId: "report-live-contract-123",
  storagePath: "user-123/job-live-contract-123.pdf",
  publicationSource: "route_response",
  createdReportRecord: false,
});

await assert.rejects(
  () =>
    resolveOrCreateReportPublicationRecord({
      supabaseAdmin: {},
      job: {
        id: "job-live-contract-123",
        user_id: "user-123",
        report_type: "underwriting",
      },
      reportData: {
        reportId: "report-live-contract-123",
        report_type: "underwriting",
      },
      deliveryGateStatus: "deliverable",
      holdDelivery: false,
    }),
  /omitted authoritative storage path/
);

let publishedArtifactUploadAttempted = false;
const verifiedPublishedArtifact = await ensureReportDownloadArtifact({
  supabaseAdmin: {
    storage: {
      from(bucketName) {
        assert.equal(bucketName, "generated_reports");
        return {
          async download(storagePath) {
            assert.equal(storagePath, publishedRouteResponse.storagePath);
            return { data: { size: 1024, storagePath }, error: null };
          },
          async upload() {
            publishedArtifactUploadAttempted = true;
            return { data: null, error: null };
          },
        };
      },
    },
  },
  job: {
    id: "job-live-contract-123",
    user_id: "user-123",
    report_type: "underwriting",
  },
  reportId: publishedRouteResponse.reportId,
  storagePath: publishedRouteResponse.storagePath,
  finalHtml: "",
  reportType: publishedRouteResponse.report_type,
  reportSeed: "job-live-contract-123",
  propertyName: "Generic Property",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  runFinalPdfPublicationQualityBoss: passPublicationQualityBoss,
});
assert.equal(verifiedPublishedArtifact.artifactSource, "existing_download");
assert.equal(verifiedPublishedArtifact.verifiedDownloadArtifact, true);
assert.equal(verifiedPublishedArtifact.createdDownloadArtifact, false);
assert.equal(publishedArtifactUploadAttempted, false);

const uploadAttempts = [];
let downloadCalls = 0;
const mockStorageBucket = {
  async download(storagePath) {
    downloadCalls += 1;
    if (downloadCalls === 1) {
      return { data: null, error: new Error("not found") };
    }
    return { data: { size: 3, storagePath }, error: null };
  },
  async upload(storagePath, payload, options) {
    uploadAttempts.push({
      storagePath,
      payload: Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload),
      options,
    });
    return { data: { path: storagePath }, error: null };
  },
};

let deleteCount = 0;
const mockSupabaseAdmin = {
  storage: {
    from(bucketName) {
      assert.equal(bucketName, "generated_reports");
      return mockStorageBucket;
    },
  },
  from(tableName) {
    assert.equal(tableName, "reports");
    return {
      delete() {
        deleteCount += 1;
        return {
          eq() {
            return Promise.resolve({ error: null });
          },
        };
      },
    };
  },
};

const createdArtifact = await ensureReportDownloadArtifact({
  supabaseAdmin: mockSupabaseAdmin,
  job: {
    id: "job-sealed-screening-123",
    user_id: "user-123",
    report_type: "screening",
  },
  reportId: "report-123",
  storagePath: buildReportStoragePath({
    effectiveUserId: "user-123",
    reportSeed: "report-123",
  }),
  finalHtml: "<html><body>sealed screening html</body></html>",
  reportType: "screening",
  reportSeed: "report-123",
  propertyName: "Generic Property",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  renderPdfBuffer: async ({ finalHtml }) => Buffer.from(finalHtml, "utf8"),
  runFinalPdfPublicationQualityBoss: passPublicationQualityBoss,
});

assert.equal(createdArtifact.reportId, "report-123");
assert.equal(createdArtifact.storagePath, "user-123/report-123.pdf");
assert.equal(createdArtifact.artifactSource, "created_download");
assert.equal(createdArtifact.verifiedDownloadArtifact, true);
assert.equal(createdArtifact.createdDownloadArtifact, true);
assert.equal(uploadAttempts.length, 1);
assert.equal(uploadAttempts[0].storagePath, "user-123/report-123.pdf");
assert.equal(uploadAttempts[0].payload, "<html><body>sealed screening html</body></html>");
assert.equal(uploadAttempts[0].options.contentType, "application/pdf");
assert.equal(uploadAttempts[0].options.upsert, false);
assert.equal(deleteCount, 0);

const envSnapshot = {
  REPORT_DOWNLOAD_ARTIFACT_MODE: process.env.REPORT_DOWNLOAD_ARTIFACT_MODE,
  ALLOW_PRODUCTION_PDF: process.env.ALLOW_PRODUCTION_PDF,
  DOCRAPTOR_MODE: process.env.DOCRAPTOR_MODE,
  DOCRAPTOR_API_KEY: process.env.DOCRAPTOR_API_KEY,
};

const restoreEnv = () => {
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const originalAxiosPost = axios.post;

try {
  process.env.REPORT_DOWNLOAD_ARTIFACT_MODE = "production_pdf";
  process.env.ALLOW_PRODUCTION_PDF = "false";
  process.env.DOCRAPTOR_MODE = "test";
  process.env.DOCRAPTOR_API_KEY = "";

  let guardDocraptorCalls = 0;
  axios.post = async () => {
    guardDocraptorCalls += 1;
    throw new Error("DocRaptor should not be called when production mode is disabled");
  };

  await assert.rejects(
    () =>
      renderReportPdfBuffer({
        finalHtml: "<html><body>guard screening html</body></html>",
        reportType: "screening",
        reportDownloadArtifactMode: "production_pdf",
        allowProductionPdf: false,
        docraptorMode: "test",
      }),
    (err) => err?.code === "DOCRAPTOR_NOT_PRODUCTION_MODE"
  );
  assert.equal(guardDocraptorCalls, 0);

  process.env.REPORT_DOWNLOAD_ARTIFACT_MODE = "docraptor_test_pdf";
  process.env.ALLOW_PRODUCTION_PDF = "false";
  process.env.DOCRAPTOR_MODE = "test";
  process.env.DOCRAPTOR_API_KEY = "";

  await assert.rejects(
    () =>
      renderReportPdfBuffer({
        finalHtml: "<html><body>docraptor test missing key</body></html>",
        reportType: "screening",
        reportDownloadArtifactMode: "docraptor_test_pdf",
        allowProductionPdf: false,
        docraptorMode: "test",
      }),
    (err) => err?.code === "DOCRAPTOR_API_KEY_REQUIRED"
  );

  process.env.REPORT_DOWNLOAD_ARTIFACT_MODE = "docraptor_test_pdf";
  process.env.ALLOW_PRODUCTION_PDF = "false";
  process.env.DOCRAPTOR_MODE = "test";
  process.env.DOCRAPTOR_API_KEY = "unit-test-key";

  let docraptorTestCalls = 0;
  axios.post = async (url, body, options) => {
    docraptorTestCalls += 1;
    assert.match(url, /docraptor\.com\/docs/);
    assert.equal(body.test, true);
    assert.equal(body.document_type, "pdf");
    assert.match(body.document_content, /docraptor test render/i);
    assert.match(String(options.headers.Authorization || ""), /^Basic\s+/);
    return { data: Buffer.from("%PDF-1.4 docraptor test pdf\n%%EOF\n", "utf8") };
  };

  const docraptorTestBuffer = await renderReportPdfBuffer({
    finalHtml: "<html><body>docraptor test render</body></html>",
    reportType: "screening",
    reportDownloadArtifactMode: "docraptor_test_pdf",
    allowProductionPdf: false,
    docraptorMode: "test",
    reportSeed: "report-docraptor-test-123",
    propertyName: "Generic Property",
    storagePath: "user-123/report-docraptor-test-123.pdf",
  });

  assert.equal(Buffer.isBuffer(docraptorTestBuffer), true);
  assert.match(docraptorTestBuffer.toString("utf8"), /^%PDF-1\.4/);
  assert.equal(docraptorTestCalls, 1);

  process.env.REPORT_DOWNLOAD_ARTIFACT_MODE = "test_pdf";
  process.env.ALLOW_PRODUCTION_PDF = "false";
  process.env.DOCRAPTOR_MODE = "test";
  process.env.DOCRAPTOR_API_KEY = "";

  let docraptorCalls = 0;
  axios.post = async () => {
    docraptorCalls += 1;
    throw new Error("DocRaptor should not be called in prelaunch mode");
  };

  const stubStorageAttempts = [];
  let stubDownloadCalls = 0;
  const stubModeArtifact = await ensureReportDownloadArtifact({
    supabaseAdmin: {
      storage: {
        from(bucketName) {
          assert.equal(bucketName, "generated_reports");
          return {
            async download() {
              stubDownloadCalls += 1;
              if (stubDownloadCalls === 1) {
                return { data: null, error: new Error("missing") };
              }
              return { data: { size: 3, storagePath: "user-123/report-prelaunch-123.pdf" }, error: null };
            },
            async upload(storagePath, payload, options) {
              stubStorageAttempts.push({
                storagePath,
                payload: Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload),
                options,
              });
              return { data: { path: storagePath }, error: null };
            },
          };
        },
      },
      from() {
        return {
          delete() {
            return {
              eq() {
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      },
    },
    job: {
      id: "job-sealed-screening-prelaunch",
      user_id: "user-123",
      report_type: "screening",
    },
    reportId: "report-prelaunch-123",
    storagePath: "user-123/report-prelaunch-123.pdf",
    finalHtml: "<html><body>sealed screening html</body></html>",
    reportType: "screening",
    reportSeed: "report-prelaunch-123",
    propertyName: "Generic Property",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    runFinalPdfPublicationQualityBoss: passPublicationQualityBoss,
  });

  assert.equal(stubModeArtifact.artifactSource, "created_download");
  assert.equal(stubModeArtifact.verifiedDownloadArtifact, true);
  assert.equal(stubModeArtifact.createdDownloadArtifact, true);
  assert.equal(docraptorCalls, 0);
  assert.equal(stubStorageAttempts.length, 1);
  assert.match(stubStorageAttempts[0].payload, /^%PDF-1\.4/);
  assert.match(stubStorageAttempts[0].payload, /InvestorIQ prelaunch test artifact/i);
  assert.match(stubStorageAttempts[0].payload, /Production PDF generation disabled/i);

  process.env.REPORT_DOWNLOAD_ARTIFACT_MODE = "production_pdf";
  process.env.ALLOW_PRODUCTION_PDF = "true";
  process.env.DOCRAPTOR_MODE = "production";
  process.env.DOCRAPTOR_API_KEY = "unit-test-key";

  const productionPostCalls = [];
  axios.post = async (url, body, options) => {
    productionPostCalls.push({ url, body, options });
    return { data: Buffer.from("%PDF-1.4 production test pdf\n%%EOF\n", "utf8") };
  };

  const productionBuffer = await renderReportPdfBuffer({
    finalHtml: "<html><body>prod screening html</body></html>",
    reportType: "screening",
    reportDownloadArtifactMode: "production_pdf",
    allowProductionPdf: true,
    docraptorMode: "production",
    reportSeed: "report-prod-123",
    propertyName: "Generic Property",
    storagePath: "user-123/report-prod-123.pdf",
  });

  assert.equal(Buffer.isBuffer(productionBuffer), true);
  assert.match(productionBuffer.toString("utf8"), /^%PDF-1\.4/);
  assert.equal(productionPostCalls.length, 1);
  assert.match(productionPostCalls[0].url, /docraptor\.com\/docs/);
  assert.equal(productionPostCalls[0].body.test, false);
  assert.equal(productionPostCalls[0].body.document_type, "pdf");
  assert.match(productionPostCalls[0].body.document_content, /prod screening html/);
  assert.match(String(productionPostCalls[0].options.headers.Authorization || ""), /^Basic\s+/);
} finally {
  axios.post = originalAxiosPost;
  restoreEnv();
}

let cleanupCount = 0;
const failingSupabaseAdmin = {
  storage: {
    from(bucketName) {
      assert.equal(bucketName, "generated_reports");
      return {
        async download() {
          return { data: null, error: new Error("missing") };
        },
        async upload() {
          return { data: null, error: new Error("storage write failed") };
        },
      };
    },
  },
  from(tableName) {
    assert.equal(tableName, "reports");
    return {
      delete() {
        cleanupCount += 1;
        return {
          eq() {
            return Promise.resolve({ error: null });
          },
        };
      },
    };
  },
};

await assert.rejects(
  () =>
    ensureReportDownloadArtifact({
      supabaseAdmin: failingSupabaseAdmin,
      job: {
        id: "job-sealed-screening-123",
        user_id: "user-123",
        report_type: "screening",
      },
      reportId: "report-123",
      storagePath: buildReportStoragePath({
        effectiveUserId: "user-123",
        reportSeed: "report-123",
      }),
      finalHtml: "<html><body>sealed screening html</body></html>",
      reportType: "screening",
      reportSeed: "report-123",
      propertyName: "Generic Property",
      createdReportRecord: true,
      deliveryGateStatus: "deliverable",
      holdDelivery: false,
      renderPdfBuffer: async () => Buffer.from("pdf", "utf8"),
      runFinalPdfPublicationQualityBoss: passPublicationQualityBoss,
    }),
  /Failed to upload report to storage/
);
assert.equal(cleanupCount, 1);

console.log("admin-run-worker-publish-contract smoke PASS");
