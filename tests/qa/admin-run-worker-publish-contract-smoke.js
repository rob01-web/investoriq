import assert from "node:assert/strict";
import fs from "fs";
import { buildReportStoragePath, resolveOrCreateReportPublicationRecord } from "../../api/_lib/report-delivery-output.js";

const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");

assert.match(
  workerSource,
  /import \{\s*buildReportStoragePath,\s*resolveOrCreateReportPublicationRecord,\s*\} from '\.\/_lib\/report-delivery-output\.js';/
);
assert.match(workerSource, /allowCreate:\s*!shouldHoldDeliveryOutcome/);
assert.match(
  workerSource,
  /final_html:\s*typeof reportData\?\.final_html === 'string' \? reportData\.final_html : null,[\s\S]{0,80}final_html_length:\s*typeof reportData\?\.final_html === 'string' \? reportData\.final_html\.length : 0,/
);

const insertedRows = [];
const mockSupabaseAdmin = {
  from(table) {
    assert.equal(table, "reports");
    return {
      insert(rows) {
        insertedRows.push(...rows);
        return {
          select() {
            return {
              single: async () => ({ data: { id: "report-created-123" }, error: null }),
            };
          },
        };
      },
    };
  },
};

const createdPublication = await resolveOrCreateReportPublicationRecord({
  supabaseAdmin: mockSupabaseAdmin,
  job: {
    id: "job-sealed-screening-123",
    user_id: "user-123",
    property_name: "Generic Property",
    report_type: "screening",
  },
  reportData: {
    success: true,
    final_html: "<html><body>sealed screening html</body></html>",
    report_type: "screening",
  },
  allowCreate: true,
});

assert.equal(createdPublication.reportId, "report-created-123");
assert.equal(
  createdPublication.storagePath,
  buildReportStoragePath({ effectiveUserId: "user-123", reportSeed: "job-sealed-screening-123" })
);
assert.equal(createdPublication.publicationSource, "created_report");
assert.equal(insertedRows.length, 1);
assert.deepEqual(insertedRows[0], {
  user_id: "user-123",
  property_name: "Generic Property",
  report_type: "screening",
  storage_path: buildReportStoragePath({
    effectiveUserId: "user-123",
    reportSeed: "job-sealed-screening-123",
  }),
});

let insertTouched = false;
const holdSupabaseAdmin = {
  from() {
    insertTouched = true;
    throw new Error("hold path should not create a report row");
  },
};

const holdPublication = await resolveOrCreateReportPublicationRecord({
  supabaseAdmin: holdSupabaseAdmin,
  job: {
    id: "job-sealed-screening-123",
    user_id: "user-123",
    property_name: "Generic Property",
    report_type: "screening",
  },
  reportData: {
    success: true,
    final_html: "<html><body>sealed screening html</body></html>",
    report_type: "screening",
  },
  allowCreate: false,
});

assert.equal(holdPublication.reportId, null);
assert.equal(holdPublication.storagePath, null);
assert.equal(holdPublication.publicationSource, "creation_disabled");
assert.equal(insertTouched, false);

console.log("admin-run-worker-publish-contract smoke PASS");
