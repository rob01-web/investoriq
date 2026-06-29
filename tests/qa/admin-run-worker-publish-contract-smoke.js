import assert from "node:assert/strict";
import fs from "fs";
import {
  buildReportStoragePath,
  ensureReportDownloadArtifact,
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
