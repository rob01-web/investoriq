export class FakeSupabaseState {
  constructor(seed) {
    this.jobs = new Map((seed.analysis_jobs || []).map((job) => [job.id, { ...job }]));
    this.files = (seed.analysis_job_files || []).map((file) => ({ ...file }));
    this.artifacts = (seed.analysis_artifacts || []).map((artifact) => ({ ...artifact }));
    this.reports = (seed.reports || []).map((report) => ({ ...report }));
    this.purchases = (seed.report_purchases || []).map((purchase) => ({ ...purchase }));
    this.transitions = [];
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
    this.artifacts.push({ job_id: jobId, type, bucket, payload });
  }

  createReport(jobId, report = {}) {
    const id = report.id || `mock-report-${jobId}`;
    this.reports.push({ id, job_id: jobId, status: "published", ...report });
    return id;
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
