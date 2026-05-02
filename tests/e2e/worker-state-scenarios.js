import { FakeSupabaseState } from "./fake-supabase.js";

const requiredDocsMessage =
  "Required source documents were uploaded, but parsing did not produce all required structured financial artifacts.";
const scaleMismatchMessage =
  "InvestorIQ extracted financial values from the uploaded documents, but the operating statement and rent roll are materially inconsistent.";

function parsedDocTypes(state, jobId) {
  return new Set(
    state
      .filesFor(jobId)
      .filter((file) => file.parse_status === "parsed")
      .map((file) => file.doc_type)
  );
}

function restoreAndFail(state, jobId, errorCode, failureReason, artifactType, artifactPayload, reason) {
  state.updateJob(jobId, {
    status: "failed",
    error_code: errorCode,
    failure_reason: failureReason,
  });
  state.transitions.push({ job_id: jobId, from_status: "rendering", to_status: "failed", reason });
  if (artifactType) state.insertArtifact(jobId, artifactType, artifactPayload);
  state.restoreEntitlement(jobId, reason);
}

function deriveScaleMismatch(state, jobId) {
  const t12 = state.artifact(jobId, "t12_parsed")?.payload || {};
  const rentRoll = state.artifact(jobId, "rent_roll_parsed")?.payload || {};
  const egi = Number(t12.effective_gross_income);
  const annualInPlace = Number(rentRoll.annual_in_place_rent);
  if (!Number.isFinite(egi) || !Number.isFinite(annualInPlace) || egi <= 0 || annualInPlace <= 0) return null;
  const ratio = Math.max(egi, annualInPlace) / Math.min(egi, annualInPlace);
  return ratio > 5 ? { ratio, egi, annualInPlace } : null;
}

export function simulateWorkerLifecycle(seed) {
  const state = new FakeSupabaseState(seed);
  const jobId = seed.analysis_jobs[0].id;
  const job = state.job(jobId);

  state.transition(jobId, "extracting");
  state.transition(jobId, "underwriting");
  state.transition(jobId, "scoring");
  state.transition(jobId, "rendering");

  const parsed = parsedDocTypes(state, jobId);
  const missing = [];
  if (!parsed.has("rent_roll")) missing.push("rent_roll");
  if (!parsed.has("t12")) missing.push("t12");

  const hasT12Artifact = Boolean(state.artifact(jobId, "t12_parsed"));
  const hasRentRollArtifact = Boolean(state.artifact(jobId, "rent_roll_parsed"));
  if (hasT12Artifact === false && !missing.includes("t12")) missing.push("t12");
  if (hasRentRollArtifact === false && !missing.includes("rent_roll")) missing.push("rent_roll");

  if (missing.length > 0) {
    restoreAndFail(
      state,
      jobId,
      "MISSING_REQUIRED_DOCUMENTS",
      `${requiredDocsMessage} Missing: ${missing.join(", ")}.`,
      "missing_required_documents",
      { missing },
      "rendering_integrity_validation_failed"
    );
    return state;
  }

  const mismatch = deriveScaleMismatch(state, jobId);
  if (mismatch) {
    restoreAndFail(
      state,
      jobId,
      "DOCUMENT_FINANCIAL_SCALE_MISMATCH",
      scaleMismatchMessage,
      "document_financial_scale_mismatch",
      {
        code: "DOCUMENT_FINANCIAL_SCALE_MISMATCH",
        ratio: mismatch.ratio,
        t12_effective_gross_income: mismatch.egi,
        rent_roll_annual_in_place_rent: mismatch.annualInPlace,
      },
      "document_financial_scale_mismatch"
    );
    return state;
  }

  state.createReport(jobId, { report_type: job.report_type || "unknown" });
  state.insertArtifact(jobId, "report_generation", { source: "local-worker-state-simulator" });
  state.transition(jobId, "publishing");
  state.transition(jobId, "published");
  return state;
}

function baseJob(profile, reportType) {
  return {
    id: `wave3-${profile}`,
    user_id: "wave3-user",
    status: "queued",
    purchase_id: `purchase-${profile}`,
    report_type: reportType,
  };
}

function consumedPurchase(profile) {
  return { id: `purchase-${profile}`, job_id: `wave3-${profile}`, consumed_at: "2026-05-02T00:00:00.000Z" };
}

function t12Artifact(profile, overrides = {}) {
  return {
    job_id: `wave3-${profile}`,
    type: "t12_parsed",
    payload: { effective_gross_income: 186780, operating_expenses: 114610, net_operating_income: 72170, ...overrides },
  };
}

function rentRollArtifact(profile, overrides = {}) {
  return {
    job_id: `wave3-${profile}`,
    type: "rent_roll_parsed",
    payload: { units: 12, annual_in_place_rent: 186780, annual_market_rent: 219240, ...overrides },
  };
}

function parsedFile(profile, docType, parseStatus = "parsed", parseError = null) {
  return { job_id: `wave3-${profile}`, doc_type: docType, parse_status: parseStatus, parse_error: parseError };
}

export const workerStateScenarios = [
  {
    profile: "happy-screening",
    seed: {
      analysis_jobs: [baseJob("happy-screening", "screening")],
      analysis_job_files: [parsedFile("happy-screening", "t12"), parsedFile("happy-screening", "rent_roll")],
      analysis_artifacts: [t12Artifact("happy-screening"), rentRollArtifact("happy-screening")],
      report_purchases: [consumedPurchase("happy-screening")],
      reports: [],
    },
    expected: {
      status: "published",
      reportCreated: true,
      entitlementRestored: false,
      errorCode: null,
      transitionsInclude: ["queued>extracting", "rendering>publishing", "publishing>published"],
      artifactsPresent: ["report_generation"],
    },
  },
  {
    profile: "happy-underwriting",
    seed: {
      analysis_jobs: [baseJob("happy-underwriting", "underwriting")],
      analysis_job_files: [parsedFile("happy-underwriting", "t12"), parsedFile("happy-underwriting", "rent_roll")],
      analysis_artifacts: [t12Artifact("happy-underwriting"), rentRollArtifact("happy-underwriting")],
      report_purchases: [consumedPurchase("happy-underwriting")],
      reports: [],
    },
    expected: {
      status: "published",
      reportCreated: true,
      entitlementRestored: false,
      errorCode: null,
      transitionsInclude: ["queued>extracting", "rendering>publishing", "publishing>published"],
      artifactsPresent: ["report_generation"],
    },
  },
  {
    profile: "missing-rent-roll",
    seed: {
      analysis_jobs: [baseJob("missing-rent-roll", "underwriting")],
      analysis_job_files: [parsedFile("missing-rent-roll", "t12")],
      analysis_artifacts: [t12Artifact("missing-rent-roll")],
      report_purchases: [consumedPurchase("missing-rent-roll")],
      reports: [],
    },
    expected: {
      status: "failed",
      reportCreated: false,
      entitlementRestored: true,
      errorCode: "MISSING_REQUIRED_DOCUMENTS",
      failureReasonIncludes: "structured financial artifacts",
      artifactsPresent: ["missing_required_documents", "entitlement_restored"],
      artifactsAbsent: ["rent_roll_parsed"],
      fileDiagnostics: [{ doc_type: "t12", parse_status: "parsed" }],
    },
  },
  {
    profile: "missing-t12",
    seed: {
      analysis_jobs: [baseJob("missing-t12", "underwriting")],
      analysis_job_files: [parsedFile("missing-t12", "rent_roll")],
      analysis_artifacts: [rentRollArtifact("missing-t12")],
      report_purchases: [consumedPurchase("missing-t12")],
      reports: [],
    },
    expected: {
      status: "failed",
      reportCreated: false,
      entitlementRestored: true,
      errorCode: "MISSING_REQUIRED_DOCUMENTS",
      failureReasonIncludes: "structured financial artifacts",
      artifactsPresent: ["missing_required_documents", "entitlement_restored"],
      artifactsAbsent: ["t12_parsed"],
      fileDiagnostics: [{ doc_type: "rent_roll", parse_status: "parsed" }],
    },
  },
  {
    profile: "missing-structured-artifacts",
    seed: {
      analysis_jobs: [baseJob("missing-structured-artifacts", "underwriting")],
      analysis_job_files: [
        parsedFile("missing-structured-artifacts", "t12", "failed", "no structured T12 rows detected"),
        parsedFile("missing-structured-artifacts", "rent_roll", "failed", "no rent roll unit rows detected"),
      ],
      analysis_artifacts: [],
      report_purchases: [consumedPurchase("missing-structured-artifacts")],
      reports: [],
    },
    expected: {
      status: "failed",
      reportCreated: false,
      entitlementRestored: true,
      errorCode: "MISSING_REQUIRED_DOCUMENTS",
      failureReasonIncludes: "structured financial artifacts",
      artifactsPresent: ["missing_required_documents", "entitlement_restored"],
      fileDiagnostics: [
        { doc_type: "t12", parse_status: "failed", parse_error: "no structured T12 rows detected" },
        { doc_type: "rent_roll", parse_status: "failed", parse_error: "no rent roll unit rows detected" },
      ],
    },
  },
  {
    profile: "scale-mismatch",
    seed: {
      analysis_jobs: [baseJob("scale-mismatch", "underwriting")],
      analysis_job_files: [parsedFile("scale-mismatch", "t12"), parsedFile("scale-mismatch", "rent_roll")],
      analysis_artifacts: [t12Artifact("scale-mismatch", { effective_gross_income: 1036800 }), rentRollArtifact("scale-mismatch", { annual_in_place_rent: 120000 })],
      report_purchases: [consumedPurchase("scale-mismatch")],
      reports: [],
    },
    expected: {
      status: "failed",
      reportCreated: false,
      entitlementRestored: true,
      errorCode: "DOCUMENT_FINANCIAL_SCALE_MISMATCH",
      failureReasonIncludes: "materially inconsistent",
      artifactsPresent: ["document_financial_scale_mismatch", "entitlement_restored"],
    },
  },
  {
    profile: "incomplete-debt",
    seed: {
      analysis_jobs: [baseJob("incomplete-debt", "underwriting")],
      analysis_job_files: [parsedFile("incomplete-debt", "t12"), parsedFile("incomplete-debt", "rent_roll"), parsedFile("incomplete-debt", "loan_term_sheet")],
      analysis_artifacts: [
        t12Artifact("incomplete-debt"),
        rentRollArtifact("incomplete-debt"),
        { job_id: "wave3-incomplete-debt", type: "loan_term_sheet_parsed", payload: { loan_amount: null, interest_rate: 5.85, amort_years: 30 } },
        { job_id: "wave3-incomplete-debt", type: "report_qa_flags", payload: { flags: [{ code: "DEBT_FILE_WITH_MISSING_BALANCE" }] } },
      ],
      report_purchases: [consumedPurchase("incomplete-debt")],
      reports: [],
    },
    expected: {
      status: "published",
      reportCreated: true,
      entitlementRestored: false,
      errorCode: null,
      artifactsPresent: ["loan_term_sheet_parsed", "report_qa_flags", "report_generation"],
      debtDscrAssessed: false,
    },
  },
];
