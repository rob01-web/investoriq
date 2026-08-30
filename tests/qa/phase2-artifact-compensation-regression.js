import assert from 'node:assert/strict';

import {
  ensureReportDownloadArtifact,
  resolveOrCreateReportPublicationRecord,
} from '../../api/_lib/report-delivery-output.js';

const certified = Object.freeze({
  ok: true,
  status: 'internal_test_artifact_only',
  customer_delivery_allowed: true,
  external_publication_allowed: false,
  publication_disposition: 'publish',
  blocking_issue_codes: [],
  issues: [],
});

function buildReportsClient({ insertError = null } = {}) {
  const state = {
    insertCalls: 0,
    deleteIds: [],
  };

  const reportsTable = {
    select() {
      return {
        eq() { return this; },
        maybeSingle: async () => ({ data: null, error: null }),
      };
    },
    insert() {
      state.insertCalls += 1;
      return {
        select() { return this; },
        single: async () => ({
          data: insertError ? null : {
            id: 'report-1',
            storage_path: 'user-1/job-1.pdf',
            revision_kind: 'original',
            revision_family_key: 'job-1',
            revision_root_report_id: null,
            revision_parent_report_id: null,
            revision_number: 1,
            revision_request_key: 'original:job-1',
            revision_source_job_id: 'job-1',
            is_current_revision: false,
            revision_published_at: null,
          },
          error: insertError,
        }),
      };
    },
    delete() {
      return {
        eq(column, value) {
          assert.equal(column, 'id');
          state.deleteIds.push(value);
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
  };

  return { state, reportsTable };
}

{
  const { state, reportsTable } = buildReportsClient({
    insertError: { message: 'forced report insert failure', code: 'XX001' },
  });
  let storageTouched = false;
  const supabaseAdmin = {
    from(table) {
      assert.equal(table, 'reports');
      return reportsTable;
    },
    storage: {
      from() {
        storageTouched = true;
        throw new Error('storage must not be touched after report insert failure');
      },
    },
  };

  await assert.rejects(
    resolveOrCreateReportPublicationRecord({
      supabaseAdmin,
      job: {
        id: 'job-1',
        user_id: 'user-1',
        property_name: 'Compensation Test',
        report_type: 'screening',
      },
      reportData: {
        report_type: 'screening',
        final_html: '<html><body>ready</body></html>',
      },
      deliveryGateStatus: 'deliverable',
      holdDelivery: false,
    }),
    /Failed to create report record/,
  );

  assert.equal(state.insertCalls, 1);
  assert.equal(storageTouched, false, 'Report insert failure must happen before any generated-report upload.');
}

function buildArtifactClient({ verifyFails = false, uploadFails = false } = {}) {
  const state = {
    downloadCalls: 0,
    uploadCalls: 0,
    removedPaths: [],
    deletedReportIds: [],
  };

  const bucket = {
    async download() {
      state.downloadCalls += 1;
      if (state.downloadCalls === 1) {
        return { data: null, error: { message: 'not found' } };
      }
      if (verifyFails) {
        return { data: null, error: { message: 'forced verification failure' } };
      }
      return { data: Buffer.from('%PDF-1.4 verified'), error: null };
    },
    async upload() {
      state.uploadCalls += 1;
      return uploadFails
        ? { data: null, error: { message: 'forced upload failure' } }
        : { data: { path: 'user-1/job-1.pdf' }, error: null };
    },
    async remove(paths) {
      state.removedPaths.push(...paths);
      return { data: paths.map((name) => ({ name })), error: null };
    },
  };

  const supabaseAdmin = {
    storage: {
      from(bucketName) {
        assert.equal(bucketName, 'generated_reports');
        return bucket;
      },
    },
    from(table) {
      assert.equal(table, 'reports');
      return {
        delete() {
          return {
            eq(column, value) {
              assert.equal(column, 'id');
              state.deletedReportIds.push(value);
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  };

  return { state, supabaseAdmin };
}

{
  const { state, supabaseAdmin } = buildArtifactClient({ uploadFails: true });
  await assert.rejects(
    ensureReportDownloadArtifact({
      supabaseAdmin,
      job: { id: 'job-1', user_id: 'user-1', report_type: 'screening' },
      reportId: 'report-1',
      storagePath: 'user-1/job-1.pdf',
      finalHtml: '<html><body>artifact</body></html>',
      reportType: 'screening',
      reportSeed: 'job-1',
      propertyName: 'Compensation Test',
      createdReportRecord: true,
      deliveryGateStatus: 'deliverable',
      holdDelivery: false,
      corePublishable: false,
      reportDownloadArtifactMode: 'stub_pdf',
      publicationTarget: 'internal_test',
      renderPdfBuffer: async () => Buffer.from('%PDF-1.4 upload-failure'),
      runFinalPdfPublicationQualityBoss: async () => certified,
    }),
    /Failed to upload report to storage/,
  );
  assert.deepEqual(state.deletedReportIds, ['report-1']);
  assert.deepEqual(state.removedPaths, [], 'No Storage delete is needed when upload never succeeded.');
}

{
  const { state, supabaseAdmin } = buildArtifactClient({ verifyFails: true });
  await assert.rejects(
    ensureReportDownloadArtifact({
      supabaseAdmin,
      job: { id: 'job-1', user_id: 'user-1', report_type: 'screening' },
      reportId: 'report-1',
      storagePath: 'user-1/job-1.pdf',
      finalHtml: '<html><body>artifact</body></html>',
      reportType: 'screening',
      reportSeed: 'job-1',
      propertyName: 'Compensation Test',
      createdReportRecord: true,
      deliveryGateStatus: 'deliverable',
      holdDelivery: false,
      corePublishable: false,
      reportDownloadArtifactMode: 'stub_pdf',
      publicationTarget: 'internal_test',
      renderPdfBuffer: async () => Buffer.from('%PDF-1.4 verify-failure'),
      runFinalPdfPublicationQualityBoss: async () => certified,
    }),
    /Failed to verify report download artifact/,
  );
  assert.deepEqual(state.removedPaths, ['user-1/job-1.pdf'], 'Fresh unverified object must be removed.');
  assert.deepEqual(state.deletedReportIds, ['report-1'], 'Fresh report row must be removed after object compensation succeeds.');
}

console.log('phase2-artifact-compensation-regression: PASS');
