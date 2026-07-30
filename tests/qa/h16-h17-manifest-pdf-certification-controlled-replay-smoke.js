import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  buildReportQualityManifestCandidate,
  buildUnavailableReportQualityManifestCandidate,
  finalizeBlockedReportQualityManifest,
  finalizeReportQualityManifest,
  validateReportQualityManifest,
} from "../../api/_lib/report-quality-manifest.js";
import {
  buildApprovedPdfSurfaceManifest,
  inspectFinalPdfPublicationQuality,
  isFinalPdfCustomerDeliveryAllowed,
} from "../../api/_lib/final-pdf-publication-quality-boss.js";
import {
  buildCanonicalReportIdentityReceipt,
  SCREENING_REPORT_IDENTITY,
  UNDERWRITING_REPORT_IDENTITY,
} from "../../api/_lib/report-identity-authority.js";
import {
  ensureReportDownloadArtifact,
} from "../../api/_lib/report-delivery-output.js";
import {
  buildInstitutionalPdfRecoveryHtml,
  isInstitutionalPdfRecoveryEligible,
  INSTITUTIONAL_PDF_RECOVERY_VERSION,
} from "../../api/_lib/institutional-pdf-recovery.js";

const deliverableDecision = {
  source: "canonical_delivery_decision",
  delivery_gate_status: "deliverable",
  customer_delivery_allowed: true,
  hold_delivery: false,
  reason_code: "DELIVERY_ALLOWED",
};

const blockedDecision = {
  source: "canonical_delivery_decision",
  delivery_gate_status: "blocked",
  customer_delivery_allowed: false,
  hold_delivery: true,
  customer_status_reason_code: "REPORT_CONTRACT_FAILED",
};

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "h16-h17-job",
  core_publishable: true,
  true_blockers: [],
  core: {
    t12: {
      status: "accepted_complete",
      artifact_id: "artifact-t12",
      file_id: "file-t12",
      original_filename: "T12.xlsx",
      accepted_facts: {
        gross_potential_rent: 1200000,
        effective_gross_income: 1140000,
        total_operating_expenses: 456000,
        net_operating_income: 684000,
      },
      evidence: { sufficiency_state: { status: "validated" } },
    },
    rent_roll: {
      status: "accepted_complete",
      artifact_id: "artifact-rent-roll",
      file_id: "file-rent-roll",
      original_filename: "Rent Roll.xlsx",
      accepted_facts: {
        total_units: 80,
        occupancy: 0.95,
        unit_mix: [{ unit_type: "1BR", units: 40 }],
      },
      evidence: { sufficiency_state: { status: "validated" } },
    },
  },
  support: {
    accepted: [],
    advisory: [],
    rejected: [],
    adjudication_decisions: [],
    conflicts: [],
    duplicates: [],
  },
  section_policy: {
    operating_statement: "render",
    operating_profile: "render",
    debt_structure: "render",
  },
  disclosures: [],
};

const customerSurfaceModel = {
  modelVersion: "acquisition_memo_v2_customer_surface_model_v1",
  coreSources: {
    coreT12: { fileId: "file-t12" },
    coreRentRoll: { fileId: "file-rent-roll" },
  },
  sections: {
    operatingStatementTTMSummary: {
      status: "required",
      sourceRole: "core_t12",
      sourceDoc: { fileId: "file-t12" },
      facts: { net_operating_income: 684000 },
      factAvailability: {
        required: ["net_operating_income"],
        available: ["net_operating_income"],
        missing: [],
        sourceBacked: true,
        sourcePresent: true,
      },
    },
    proposedFinancingContext: {
      status: "required",
      sourceRole: "purchase_assumptions",
      sourceDoc: {
        fileId: "support-purchase",
        acceptedSourceIdentityKey: "support:file:support-purchase",
      },
      facts: {
        proposed_loan_amount: 9450000,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
      },
      factAvailability: {
        required: [
          "proposed_loan_amount",
          "ltv",
          "interest_rate",
          "amortization_years",
          "lender_fee_percent",
        ],
        available: [
          "proposed_loan_amount",
          "ltv",
          "interest_rate",
          "amortization_years",
          "lender_fee_percent",
        ],
        missing: [],
        sourceBacked: true,
        sourcePresent: true,
      },
    },
    currentDebtContext: {
      status: "collapsed",
      sourceRole: "current_debt_context",
      facts: {
        current_outstanding_balance: null,
        monthly_payment: null,
      },
      factAvailability: {
        required: ["current_outstanding_balance", "monthly_payment"],
        available: [],
        missing: ["current_outstanding_balance", "monthly_payment"],
        sourceBacked: false,
        sourcePresent: true,
      },
    },
  },
  financialTruth: {
    breakEvenOccupancy: {
      label: "Break-Even Occupancy",
      formula: "total_operating_expenses / gross_potential_rent",
      numeratorFact: "total_operating_expenses",
      denominatorFact: "gross_potential_rent",
      numerator: 456000,
      denominator: 1200000,
      result: 0.38,
      displayReady: true,
    },
  },
};

const deterministicContractQaSeal = {
  ok: true,
  status: "sealed",
  source_reconciliation: {
    required: true,
    publishability: "disclose_only_publishable",
  },
};

const sourceReconciliation = {
  state: {
    status: "source_reconciliation_required",
    source_reconciliation_disclosure:
      "Source reconciliation disclosure: the Rent Roll and T12 are aligned to the canonical underwriting fixture.",
  },
  sourceBacked: true,
};

const approvedHtml = `<!doctype html>
<html>
  <head>
    <title>InvestorIQ Underwriting Report</title>
  </head>
  <body>
    <h1>Underwriting Report</h1>
    <h2>Source Reconciliation</h2>
    <table>
      <tr><td>Net Operating Income</td><td>$684,000</td></tr>
      <tr><td>Annual Debt Service</td><td>$240,000</td></tr>
    </table>
    <p>Source reconciliation disclosure: the Rent Roll and T12 are aligned to the canonical underwriting fixture.</p>
  </body>
</html>`;

const basePdfAnalysis = {
  validPdf: true,
  byteLength: 8192,
  pageCount: 1,
  text: [
    "Underwriting Report",
    "Source Reconciliation",
    "Net Operating Income $684,000",
    "Annual Debt Service $240,000",
    "Source reconciliation disclosure: the Rent Roll and T12 are aligned to the canonical underwriting fixture.",
  ].join("\n"),
  pages: [
    {
      pageNumber: 1,
      width: 612,
      height: 792,
      text: [
        "Underwriting Report",
        "Source Reconciliation",
        "Net Operating Income $684,000",
        "Annual Debt Service $240,000",
        "Source reconciliation disclosure: the Rent Roll and T12 are aligned to the canonical underwriting fixture.",
      ].join("\n"),
      lines: [],
      items: [],
    },
  ],
};

function stableSnapshot(value) {
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(stableSnapshot(value)).digest("hex");
}

function makeStorage({ existingData = null } = {}) {
  const events = [];
  let storedData = existingData;
  const bucket = {
    async download() {
      events.push("download");
      return storedData
        ? { data: storedData, error: null }
        : { data: null, error: { message: "missing" } };
    },
    async upload(_path, pdfBytes) {
      events.push("upload");
      storedData = pdfBytes;
      return { error: null };
    },
  };
  return {
    events,
    client: {
      storage: { from: () => bucket },
      from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }),
    },
  };
}

function buildManifestCandidate({ approvedHtmlInput = approvedHtml, sourceTruth = sourceTruthPackage, model = customerSurfaceModel } = {}) {
  return buildReportQualityManifestCandidate({
    jobId: "h16-h17-job",
    userId: "h16-user",
    reportFamily: "acquisition_memo",
    reportType: "underwriting",
    reportMode: "v1_core",
    propertyName: "H16 H17 Property",
    generatedAt: "2026-07-15T20:00:00.000Z",
    sourceTruthPackage: sourceTruth,
    customerSurfaceModel: model,
    customerSurfaceModelValidation: { ok: true, issues: [] },
    customerSurfaceHtmlValidation: { ok: true, issues: [] },
    deterministicContractQaSeal,
    bossCompliance: { ok: true, violations: [] },
    deliveryDecision: deliverableDecision,
  });
}

function buildReplaySnapshot({
  sourceTruth = sourceTruthPackage,
  model = customerSurfaceModel,
  approvedHtmlInput = approvedHtml,
  pdfAnalysisInput = basePdfAnalysis,
  reportId = "h16-h17-report",
  storagePath = "h16-h17-user/h16-h17-report.pdf",
  reportIdentityInput = buildCanonicalReportIdentityReceipt({
    reportMode: UNDERWRITING_REPORT_IDENTITY.reportMode,
    reportType: UNDERWRITING_REPORT_IDENTITY.reportType,
  }),
} = {}) {
  const manifestCandidate = buildManifestCandidate({ approvedHtmlInput, sourceTruth, model });
  const pdfSurfaceManifest = buildApprovedPdfSurfaceManifest({
    approvedHtml: approvedHtmlInput,
    reportIdentity: reportIdentityInput,
    requiredTextAnchors: ["Underwriting Report"],
    sourceReconciliation,
    deterministicContractQaSeal,
  });
  return {
    sourceTruth,
    model,
    manifestCandidate: {
      report: manifestCandidate.report,
      publication: manifestCandidate.publication,
      qualityState: manifestCandidate.qualityState,
      calculations: manifestCandidate.calculations.map((calculation) => ({
        calculationKey: calculation.calculationKey,
        formula: calculation.formula,
        units: calculation.units,
        eligible: calculation.eligible,
        result: calculation.result,
        inputs: calculation.inputs,
        inputProvenance: calculation.inputProvenance,
      })),
      sections: manifestCandidate.sections.map((section) => ({
        sectionKey: section.sectionKey,
        outcome: section.outcome,
        sourceBacked: section.sourceBacked,
        sourceIdentityKeys: section.sourceIdentityKeys,
        acceptedFacts: section.acceptedFacts,
        requiredFacts: section.requiredFacts,
        availableFacts: section.availableFacts,
        missingFacts: section.missingFacts,
      })),
      receipts: {
        sourceTruth: manifestCandidate.receipts.sourceTruth,
        customerSurfaceModel: manifestCandidate.receipts.customerSurfaceModel,
        deterministicContractQaSeal: manifestCandidate.receipts.deterministicContractQaSeal,
        deliveryGate: manifestCandidate.receipts.deliveryGate,
      },
    },
    pdfSurfaceManifest: {
      reportIdentity: pdfSurfaceManifest.reportIdentity,
      requiredTextAnchors: pdfSurfaceManifest.requiredTextAnchors,
      reconciliation: pdfSurfaceManifest.reconciliation,
      financialRows: pdfSurfaceManifest.financialRows.map((row) => ({ label: row.label, value: row.value })),
      headings: pdfSurfaceManifest.headings,
      displayedNumbers: pdfSurfaceManifest.displayedNumbers,
    },
    pdfAnalysis: {
      pageCount: pdfAnalysisInput.pageCount,
      text: pdfAnalysisInput.text,
    },
    reportId,
    storagePath,
  };
}

async function certifyPdf({
  approvedHtmlInput = approvedHtml,
  pdfAnalysisInput = basePdfAnalysis,
  reportIdentityInput = buildCanonicalReportIdentityReceipt({
    reportMode: UNDERWRITING_REPORT_IDENTITY.reportMode,
    reportType: UNDERWRITING_REPORT_IDENTITY.reportType,
  }),
  requiredTextAnchors = ["Underwriting Report"],
  artifactMode = "production_pdf",
  publicationTarget = "internal_test",
} = {}) {
  return inspectFinalPdfPublicationQuality({
    pdfBytes: Buffer.from("%PDF-1.4 fake"),
    approvedHtml: approvedHtmlInput,
    deterministicContractQaSeal,
    sourceReconciliation,
    reportIdentity: reportIdentityInput,
    requiredTextAnchors,
    artifactMode,
    publicationTarget,
    pdfAnalysis: pdfAnalysisInput,
  });
}

const manifestCandidate = buildManifestCandidate();
assert.equal(validateReportQualityManifest(manifestCandidate).ok, true);
assert.equal(validateReportQualityManifest(manifestCandidate, { requireFinal: true }).ok, false);
assert.equal(manifestCandidate.publication.state, "candidate");
assert.equal(manifestCandidate.publication.pdfCertified, false);
assert.equal(manifestCandidate.sections.find((section) => section.sectionKey === "currentDebtContext").outcome, "collapsed");
assert.equal(manifestCandidate.calculations.length, 1);
assert.equal(manifestCandidate.calculations[0].result, 0.38);

assert.throws(
  () => finalizeReportQualityManifest({
    candidate: manifestCandidate,
    reportId: "",
    storagePath: "h16-h17-user/h16-h17-report.pdf",
    deliveryDecision: deliverableDecision,
    finalPdfPublicationQualityBoss: { ok: true, status: "certified" },
    publicationState: "published",
  }),
  /REPORT_QUALITY_MANIFEST_FINAL_INVALID/
);

assert.throws(
  () => finalizeReportQualityManifest({
    candidate: manifestCandidate,
    reportId: "h16-h17-report",
    storagePath: "",
    deliveryDecision: deliverableDecision,
    finalPdfPublicationQualityBoss: { ok: true, status: "certified" },
    publicationState: "published",
  }),
  /REPORT_QUALITY_MANIFEST_FINAL_INVALID/
);

assert.throws(
  () => finalizeReportQualityManifest({
    candidate: manifestCandidate,
    reportId: "h16-h17-report",
    storagePath: "h16-h17-user/h16-h17-report.pdf",
    deliveryDecision: {
      delivery_gate_status: "deliverable",
      customer_delivery_allowed: true,
      hold_delivery: false,
    },
    finalPdfPublicationQualityBoss: { ok: true, status: "certified" },
    publicationState: "published",
  }),
  /REPORT_QUALITY_MANIFEST_FINAL_INVALID/
);

const certifiedPdfBoss = await certifyPdf();
assert.equal(certifiedPdfBoss.ok, true);
assert.equal(certifiedPdfBoss.status, "certified");
assert.equal(certifiedPdfBoss.customer_delivery_allowed, true);
assert.equal(isFinalPdfCustomerDeliveryAllowed(certifiedPdfBoss), true);

const certifiedPdfBossRepeat = await certifyPdf();
assert.deepEqual(certifiedPdfBossRepeat, certifiedPdfBoss);

const publishedManifest = finalizeReportQualityManifest({
  candidate: manifestCandidate,
  reportId: "h16-h17-report",
  storagePath: "h16-h17-user/h16-h17-report.pdf",
  deliveryDecision: deliverableDecision,
  finalPdfPublicationQualityBoss: certifiedPdfBoss,
  publicationState: "published",
  creditState: { state: "reconciled", consumed: true },
  remedyState: { state: "not_required" },
  finalizedAt: "2026-07-15T20:01:00.000Z",
});
assert.equal(publishedManifest.publication.state, "published");
assert.equal(publishedManifest.publication.pdfCertified, true);
assert.equal(validateReportQualityManifest(publishedManifest, { requireFinal: true }).ok, true);

const blockedManifest = finalizeBlockedReportQualityManifest({
  candidate: buildUnavailableReportQualityManifestCandidate({
    jobId: "h16-h17-blocked",
    userId: "h16-user",
    reportFamily: "acquisition_memo",
    reportType: "underwriting",
    reportMode: "v1_core",
    propertyName: "Blocked H16 H17 Property",
    blockerCode: "REPORT_RENDER_FAILED",
  }),
  deliveryDecision: blockedDecision,
  terminalOutcome: {
    code: "REPORT_RENDER_FAILED",
    failureClass: "internal_system_failure",
    retrySafe: true,
  },
  creditState: { state: "restored" },
  remedyState: { state: "internal_review_required" },
  finalizedAt: "2026-07-15T20:02:00.000Z",
});
assert.equal(blockedManifest.publication.state, "blocked");
assert.equal(blockedManifest.publication.pdfCertified, false);
assert.equal(validateReportQualityManifest(blockedManifest, { requireFinal: true }).ok, true);
assert.equal(blockedManifest.receipts.finalPdfPublicationQualityBoss, null);

const blockedPdfBoss = await certifyPdf({
  artifactMode: "stub_pdf",
  publicationTarget: "external_customer",
});
assert.equal(blockedPdfBoss.customer_delivery_allowed, false);
assert.equal(blockedPdfBoss.ok, false);
assert.equal(
  blockedPdfBoss.issues.some((issue) => issue.code === "TEST_MODE_PDF_EXTERNAL_PUBLICATION_BLOCKED"),
  true
);

const identityMismatch = await certifyPdf({
  approvedHtmlInput: approvedHtml.replace("Underwriting Report", "Underwriting Report"),
  reportIdentityInput: buildCanonicalReportIdentityReceipt({
    reportMode: SCREENING_REPORT_IDENTITY.reportMode,
    reportType: SCREENING_REPORT_IDENTITY.reportType,
  }),
  requiredTextAnchors: ["Preliminary Investment Screening Memorandum"],
});
assert.equal(identityMismatch.ok, false);
assert.equal(
  identityMismatch.issues.some((issue) =>
    issue.code === "PDF_CONTENT_DISAGREES_WITH_APPROVED_SURFACE" ||
    issue.code === "PDF_CALLER_IDENTITY_ANCHOR_REJECTED"
  ),
  true
);

const currentManifest = finalizeReportQualityManifest({
  candidate: manifestCandidate,
  reportId: "h16-h17-current-report",
  storagePath: "h16-h17-user/current-report.pdf",
  deliveryDecision: deliverableDecision,
  finalPdfPublicationQualityBoss: certifiedPdfBoss,
  publicationState: "published",
  finalizedAt: "2026-07-15T20:03:00.000Z",
});
const historicalManifest = finalizeReportQualityManifest({
  candidate: manifestCandidate,
  reportId: "h16-h17-historical-report",
  storagePath: "h16-h17-user/historical-report.pdf",
  deliveryDecision: deliverableDecision,
  finalPdfPublicationQualityBoss: certifiedPdfBoss,
  publicationState: "published",
  finalizedAt: "2026-07-15T20:04:00.000Z",
});
assert.notDeepEqual(currentManifest, historicalManifest);
assert.equal(currentManifest.report.reportId, "h16-h17-current-report");
assert.equal(historicalManifest.report.reportId, "h16-h17-historical-report");
assert.equal(currentManifest.publication.storagePath, "h16-h17-user/current-report.pdf");
assert.equal(historicalManifest.publication.storagePath, "h16-h17-user/historical-report.pdf");

const recoverableCertification = {
  ok: false,
  customer_document_failure: false,
  issues: [
    { code: "PDF_SPACING_OVERLAP" },
    { code: "PDF_NUMERIC_COLUMN_MISALIGNMENT" },
  ],
};
assert.equal(isInstitutionalPdfRecoveryEligible(recoverableCertification), true);
assert.equal(INSTITUTIONAL_PDF_RECOVERY_VERSION, 1);

const recoveryA = buildInstitutionalPdfRecoveryHtml({
  approvedHtml,
  certification: recoverableCertification,
});
const recoveryB = buildInstitutionalPdfRecoveryHtml({
  approvedHtml,
  certification: recoverableCertification,
});
assert.deepEqual(recoveryA, recoveryB);
assert.match(recoveryA.html, /data-iq-pdf-recovery="conservative-v1"/);
assert.equal(recoveryA.receipt.attemptCount, 1);
assert.equal(recoveryA.receipt.valuesMayChange, false);
assert.equal(recoveryA.receipt.sourcesMayChange, false);
assert.equal(recoveryA.receipt.disclosuresMayChange, false);
assert.equal(recoveryA.receipt.calculationsMayChange, false);

assert.equal(isInstitutionalPdfRecoveryEligible({
  ok: false,
  customer_document_failure: false,
  issues: [{ code: "PDF_BYTES_INVALID" }],
}), false);

const recoveryStorage = makeStorage();
const renderCalls = [];
let certificationCalls = 0;
const recoveredArtifact = await ensureReportDownloadArtifact({
  supabaseAdmin: recoveryStorage.client,
  reportId: "h16-h17-recovery-report",
  storagePath: "h16-h17-user/recovery-report.pdf",
  finalHtml: approvedHtml,
  reportType: "underwriting",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  renderPdfBuffer: async ({ finalHtml }) => {
    renderCalls.push(finalHtml);
    return Buffer.from("%PDF-recovery");
  },
  runFinalPdfPublicationQualityBoss: async () => {
    certificationCalls += 1;
    if (certificationCalls === 1) {
      const error = new Error("Final PDF failed Publication Quality Boss certification");
      error.code = "PDF_ARTIFACT_FAILED";
      error.context = {
        customer_document_failure: false,
        final_pdf_publication_quality_boss: {
          ok: false,
          status: "internal_pdf_publication_quality_failure",
          customer_document_failure: false,
          issues: [{ code: "PDF_SPACING_OVERLAP" }],
        },
      };
      throw error;
    }
    return certifiedPdfBoss;
  },
});
assert.equal(certificationCalls, 2);
assert.equal(renderCalls.length, 2);
assert.match(renderCalls[1], /data-iq-pdf-recovery="conservative-v1"/);
assert.equal(recoveredArtifact.institutionalPdfRecovery.recovered, true);
assert.equal(recoveredArtifact.institutionalPdfRecovery.valuesMayChange, false);
assert.equal(recoveredArtifact.institutionalPdfRecovery.sourcesMayChange, false);
assert.equal(recoveredArtifact.institutionalPdfRecovery.disclosuresMayChange, false);

const failedRecoveryStorage = makeStorage();
let failedRecoveryCertCalls = 0;
await assert.rejects(
  ensureReportDownloadArtifact({
    supabaseAdmin: failedRecoveryStorage.client,
    reportId: "h16-h17-failed-recovery-report",
    storagePath: "h16-h17-user/failed-recovery-report.pdf",
    finalHtml: approvedHtml,
    reportType: "underwriting",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    renderPdfBuffer: async () => Buffer.from("%PDF-failed-recovery"),
    runFinalPdfPublicationQualityBoss: async () => {
      failedRecoveryCertCalls += 1;
      const error = new Error("Final PDF failed Publication Quality Boss certification");
      error.code = "PDF_ARTIFACT_FAILED";
      error.context = {
        customer_document_failure: false,
        final_pdf_publication_quality_boss: {
          ok: false,
          status: "internal_pdf_publication_quality_failure",
          customer_document_failure: false,
          issues: [{ code: "PDF_BYTES_INVALID" }],
        },
      };
      throw error;
    },
  }),
  (error) => error?.code === "PDF_ARTIFACT_FAILED"
);
assert.equal(failedRecoveryCertCalls, 1);

const replayStorage = makeStorage();
const replaySnapshots = [];
const replayEvents = [];
for (let index = 0; index < 3; index += 1) {
  const replayApprovedHtml = approvedHtml;
  const replayPdfAnalysis = basePdfAnalysis;
  const replayPdfBoss = async () => certifyPdf({
    approvedHtmlInput: replayApprovedHtml,
    pdfAnalysisInput: replayPdfAnalysis,
  });
  const replayArtifact = await ensureReportDownloadArtifact({
    supabaseAdmin: replayStorage.client,
    reportId: "h16-h17-replay-report",
    storagePath: "h16-h17-user/replay-report.pdf",
    finalHtml: replayApprovedHtml,
    reportType: "underwriting",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    renderPdfBuffer: async ({ finalHtml }) => Buffer.from(createHash("sha256").update(finalHtml).digest("hex")),
    runFinalPdfPublicationQualityBoss: replayPdfBoss,
  });
  replayEvents.push(replayArtifact.artifactSource);
  replaySnapshots.push({
    sourceTruth: sourceTruthPackage,
    customerSurfaceModel,
    manifestCandidate: buildReplaySnapshot().manifestCandidate,
    finalManifest: {
      report: publishedManifest.report,
      publication: publishedManifest.publication,
      qualityState: publishedManifest.qualityState,
      credit: publishedManifest.credit,
      remedy: publishedManifest.remedy,
    },
    pdfSurfaceManifest: buildApprovedPdfSurfaceManifest({
      approvedHtml: replayApprovedHtml,
      reportIdentity: buildCanonicalReportIdentityReceipt({
        reportMode: UNDERWRITING_REPORT_IDENTITY.reportMode,
        reportType: UNDERWRITING_REPORT_IDENTITY.reportType,
      }),
      requiredTextAnchors: ["Underwriting Report"],
      sourceReconciliation,
      deterministicContractQaSeal,
    }),
    pdfBoss: {
      status: replayArtifact.publicationQualityBoss.status,
      ok: replayArtifact.publicationQualityBoss.ok,
      customer_delivery_allowed: replayArtifact.publicationQualityBoss.customer_delivery_allowed,
      publication_disposition: replayArtifact.publicationQualityBoss.publication_disposition,
      blocking_issue_codes: replayArtifact.publicationQualityBoss.blocking_issue_codes,
      issues: replayArtifact.publicationQualityBoss.issues.map((issue) => issue.code),
    },
    pdfEvidence: {
      pageCount: basePdfAnalysis.pageCount,
      text: basePdfAnalysis.text,
    },
    reportId: replayArtifact.reportId,
    storagePath: replayArtifact.storagePath,
  });
}

assert.equal(replayEvents[0], "created_download");
assert.equal(replayEvents[1], "existing_download");
assert.equal(replayEvents[2], "existing_download");
assert.equal(replayStorage.events.filter((event) => event === "upload").length, 1);
assert.equal(replayStorage.events.filter((event) => event === "download").length, 4);

const replayDigests = replaySnapshots.map((snapshot) => digest(snapshot));
assert.equal(new Set(replayDigests).size, 1);
assert.deepEqual(replaySnapshots[0], replaySnapshots[1]);
assert.deepEqual(replaySnapshots[1], replaySnapshots[2]);

const changedSourceTruth = structuredClone(sourceTruthPackage);
changedSourceTruth.core.t12.accepted_facts.net_operating_income = 685000;
const changedApprovedHtml = approvedHtml.replace("$684,000", "$685,000");
const changedPdfAnalysis = structuredClone(basePdfAnalysis);
changedPdfAnalysis.text = changedPdfAnalysis.text.replace("$684,000", "$685,000");
changedPdfAnalysis.pages[0].text = changedPdfAnalysis.pages[0].text.replace("$684,000", "$685,000");
const changedStorage = makeStorage();
const changedReplay = await ensureReportDownloadArtifact({
  supabaseAdmin: changedStorage.client,
  reportId: "h16-h17-replay-report-changed",
  storagePath: "h16-h17-user/replay-report-changed.pdf",
  finalHtml: changedApprovedHtml,
  reportType: "underwriting",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  renderPdfBuffer: async ({ finalHtml }) => Buffer.from(createHash("sha256").update(finalHtml).digest("hex")),
  runFinalPdfPublicationQualityBoss: async () => certifyPdf({
    approvedHtmlInput: changedApprovedHtml,
    pdfAnalysisInput: changedPdfAnalysis,
  }),
});
const changedSnapshot = {
  sourceTruth: changedSourceTruth,
  customerSurfaceModel,
  manifestCandidate: buildReplaySnapshot({ sourceTruth: changedSourceTruth }).manifestCandidate,
  finalManifest: {
    report: finalizeReportQualityManifest({
      candidate: buildManifestCandidate({ sourceTruth: changedSourceTruth }),
      reportId: "h16-h17-replay-report-changed",
      storagePath: "h16-h17-user/replay-report-changed.pdf",
      deliveryDecision: deliverableDecision,
      finalPdfPublicationQualityBoss: changedReplay.publicationQualityBoss,
      publicationState: "published",
      creditState: { state: "reconciled", consumed: true },
      remedyState: { state: "not_required" },
      finalizedAt: "2026-07-15T21:00:00.000Z",
    }).report,
    publication: changedReplay.publicationQualityBoss,
  },
  pdfSurfaceManifest: buildApprovedPdfSurfaceManifest({
    approvedHtml: changedApprovedHtml,
    reportIdentity: buildCanonicalReportIdentityReceipt({
      reportMode: UNDERWRITING_REPORT_IDENTITY.reportMode,
      reportType: UNDERWRITING_REPORT_IDENTITY.reportType,
    }),
    requiredTextAnchors: ["Underwriting Report"],
    sourceReconciliation,
    deterministicContractQaSeal,
  }),
  pdfBoss: {
    status: changedReplay.publicationQualityBoss.status,
    ok: changedReplay.publicationQualityBoss.ok,
    customer_delivery_allowed: changedReplay.publicationQualityBoss.customer_delivery_allowed,
    publication_disposition: changedReplay.publicationQualityBoss.publication_disposition,
    blocking_issue_codes: changedReplay.publicationQualityBoss.blocking_issue_codes,
    issues: changedReplay.publicationQualityBoss.issues.map((issue) => issue.code),
  },
  pdfEvidence: {
    pageCount: changedPdfAnalysis.pageCount,
    text: changedPdfAnalysis.text,
  },
  reportId: changedReplay.reportId,
  storagePath: changedReplay.storagePath,
};

assert.notEqual(digest(changedSnapshot), replayDigests[0]);
assert.notDeepEqual(changedSnapshot, replaySnapshots[0]);
assert.equal(changedReplay.artifactSource, "created_download");
assert.equal(changedStorage.events.filter((event) => event === "upload").length, 1);

console.log("h16-h17 manifest pdf certification and controlled replay smoke PASS");
