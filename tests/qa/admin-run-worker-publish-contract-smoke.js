import assert from "node:assert/strict";
import axios from "axios";
import fs from "fs";
import {
  buildReportStoragePath,
  ensureReportDownloadArtifact,
  renderReportPdfBuffer,
} from "../../api/_lib/report-delivery-output.js";

const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
const dashboardSource = fs.readFileSync("src/pages/Dashboard.jsx", "utf8");

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
assert.match(dashboardSource, /supabase\.storage\.from\('generated_reports'\)\.createSignedUrl\(report\.storage_path, 300\)/);

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
  renderPdfBuffer: async ({ finalHtml }) => Buffer.from(finalHtml, "utf8"),
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
      renderPdfBuffer: async () => Buffer.from("pdf", "utf8"),
    }),
  /Failed to upload report to storage/
);
assert.equal(cleanupCount, 1);

console.log("admin-run-worker-publish-contract smoke PASS");
