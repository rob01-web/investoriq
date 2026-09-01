export class FakeSupabaseState {
  constructor(seed) {
    this.jobs = new Map((seed.analysis_jobs || []).map((job) => [job.id, { ...job }]));
    this.files = (seed.analysis_job_files || []).map((file) => ({ ...file }));
    this.artifacts = (seed.analysis_artifacts || []).map((artifact) => ({ ...artifact }));
    this.reports = (seed.reports || []).map((report) => ({ ...report }));
    this.purchases = (seed.report_purchases || []).map((purchase) => ({ ...purchase }));
    this.publicationReceipts = (seed.report_publication_receipts || []).map((receipt) => ({ ...receipt }));
    this.generatedReportObjects = (seed.generated_report_objects || []).map((object) => ({ ...object }));
    this.transitions = [];
    this.finalizationCalls = [];
  }

  job(jobId) {
    return this.jobs.get(jobId) || null;
  }

  updateJob(jobId, patch) {
    const current = this.job(jobId);
    if (!current) throw new Error(`Missing fake job ${jobId}`);
    const next = { ...current, ...patch };
    this.jobs.set(jobId, next);
    return next;
  }

  transition(jobId, toStatus, meta = {}) {
    const current = this.job(jobId);
    const fromStatus = current?.status || null;
    this.updateJob(jobId, { status: toStatus });
    this.transitions.push({ job_id: jobId, from_status: fromStatus, to_status: toStatus, ...meta });
  }

  filesFor(jobId) {
    return this.files.filter((file) => file.job_id === jobId);
  }

  artifactsFor(jobId) {
    return this.artifacts.filter((artifact) => artifact.job_id === jobId);
  }

  artifact(jobId, type) {
    return this.artifactsFor(jobId).find((artifact) => artifact.type === type) || null;
  }

  insertArtifact(jobId, type, payload = {}, bucket = "system") {
    const job = this.job(jobId);
    const artifact = {
      id: `mock-artifact-${jobId}-${type}-${this.artifacts.length + 1}`,
      job_id: jobId,
      user_id: job?.user_id || null,
      type,
      bucket,
      payload,
    };
    this.artifacts.push(artifact);
    return artifact;
  }

  createReport(jobId, report = {}) {
    const job = this.job(jobId);
    if (!job) throw new Error(`Missing fake job ${jobId}`);

    const id = report.id || `mock-report-${jobId}`;
    const storagePath = report.storage_path || `generated/${job.user_id}/${jobId}/${id}.pdf`;
    const revisionRequestKey = report.revision_request_key || `revision-request-${jobId}`;
    const revisionFamilyKey = report.revision_family_key || `revision-family-${jobId}`;
    const row = {
      ...report,
      id,
      job_id: jobId,
      user_id: report.user_id || job.user_id,
      storage_path: storagePath,
      revision_request_key: revisionRequestKey,
      revision_family_key: revisionFamilyKey,
      revision_source_job_id: jobId,
      is_current_revision: false,
    };

    // reports is revision/storage metadata only. Publication authority belongs to
    // finalize_worker_publication_v2 and its complete publication receipt.
    delete row.status;
    this.reports.push(row);
    this.updateJob(jobId, { report_id: id });
    return id;
  }

  registerGeneratedReportObject(jobId, reportId) {
    const report = this.reports.find((candidate) => candidate.id === reportId && candidate.job_id === jobId);
    if (!report) throw new Error(`Missing fake report ${reportId}`);
    const object = {
      id: `mock-storage-object-${reportId}`,
      bucket_id: "generated_reports",
      name: report.storage_path,
    };
    this.generatedReportObjects.push(object);
    return object;
  }

  finalizeWorkerPublicationV2(jobId) {
    const job = this.job(jobId);
    if (!job) throw new Error(`Missing fake job ${jobId}`);
    if (!job.report_id) throw new Error("PUBLICATION_REPORT_LINK_REQUIRED");

    const report = this.reports.find((candidate) => candidate.id === job.report_id && candidate.job_id === jobId);
    if (!report) throw new Error("PUBLICATION_REPORT_NOT_FOUND");

    const existingReceipt = this.publicationReceipts.find((receipt) => receipt.job_id === jobId);
    if (job.status === "published") {
      if (
        !existingReceipt ||
        existingReceipt.publication_status !== "complete" ||
        existingReceipt.report_id !== report.id ||
        report.is_current_revision !== true
      ) {
        throw new Error("PUBLICATION_PUBLISHED_LINEAGE_INCOMPLETE");
      }
      return job;
    }

    if (job.status !== "publishing") throw new Error("PUBLICATION_EXPECTED_PUBLISHING_STATE_REQUIRED");
    if (existingReceipt) throw new Error("PUBLICATION_PREEXISTING_RECEIPT_CONFLICT");

    const storageObject = this.generatedReportObjects.find(
      (object) => object.bucket_id === "generated_reports" && object.name === report.storage_path
    );
    if (!storageObject) throw new Error("PUBLICATION_GENERATED_OBJECT_MISSING");

    const delivery = this.artifact(jobId, "delivery_gate_decision");
    const decision = delivery?.payload?.deliveryDecisionState || delivery?.payload || {};
    if (
      decision.source !== "canonical_delivery_decision" ||
      decision.customer_delivery_allowed !== true ||
      decision.hold_delivery === true ||
      decision.delivery_gate_status !== "deliverable" ||
      decision.core_valid_required_coverage !== true
    ) {
      throw new Error("PUBLICATION_DELIVERY_NOT_ALLOWED");
    }

    const manifest = this.insertArtifact(
      jobId,
      "report_quality_manifest",
      {
        publication: {
          state: "published",
          storagePath: report.storage_path,
        },
      },
      "internal"
    );

    const receipt = {
      id: `mock-publication-receipt-${jobId}`,
      job_id: jobId,
      report_id: report.id,
      user_id: job.user_id,
      revision_request_key: report.revision_request_key,
      storage_path: report.storage_path,
      storage_object_id: storageObject.id,
      manifest_artifact_id: manifest.id,
      delivery_gate_artifact_id: delivery.id,
      canonical_delivery_action: "DELIVER",
      publication_status: "complete",
      completed_at: "2026-09-01T00:00:00.000Z",
    };
    this.publicationReceipts.push(receipt);

    this.reports = this.reports.map((candidate) =>
      candidate.revision_family_key === report.revision_family_key
        ? {
            ...candidate,
            is_current_revision: candidate.id === report.id,
            revision_published_at:
              candidate.id === report.id ? candidate.revision_published_at || receipt.completed_at : candidate.revision_published_at,
          }
        : candidate
    );

    this.updateJob(jobId, {
      status: "published",
      last_checkpoint: "published",
      error_code: null,
      failure_reason: null,
    });
    this.transitions.push({
      job_id: jobId,
      from_status: "publishing",
      to_status: "published",
      authority: "finalize_worker_publication_v2",
    });
    this.finalizationCalls.push({ job_id: jobId, authority: "finalize_worker_publication_v2" });
    return this.job(jobId);
  }

  restoreEntitlement(jobId, reason) {
    const job = this.job(jobId);
    const purchaseId = job?.purchase_id || this.purchases.find((purchase) => purchase.job_id === jobId)?.id || null;
    if (purchaseId) {
      this.purchases = this.purchases.map((purchase) =>
        purchase.id === purchaseId ? { ...purchase, consumed_at: null } : purchase
      );
      this.updateJob(jobId, { purchase_id: null });
    }
    this.insertArtifact(jobId, "entitlement_restored", { reason, purchase_id: purchaseId });
  }
}
