import axios from "axios";
import { sanitizeFinalCustomerHtml } from "./report-surface-contracts.js";
import {
  buildReportRevisionRequestKey,
  normalizeReportRevisionKind,
} from "../../src/lib/reportRevisionAuthority.js";
import {
  assertFinalPdfPublicationQuality,
  isFinalPdfCustomerDeliveryAllowed,
} from "./final-pdf-publication-quality-boss.js";
import { buildCanonicalReportIdentityReceipt } from "./report-identity-authority.js";
import {
  buildInstitutionalPdfRecoveryHtml,
  isInstitutionalPdfRecoveryEligible,
} from "./institutional-pdf-recovery.js";
import {
  isCollapseEligibleBossIssue,
  runSemanticRecompositionOnce,
} from "./section-disposition-runtime.js";

export function sanitizeTypography(html) {
  return sanitizeFinalCustomerHtml(html);
}

export function buildDeliveryResponseCompatibilityAliases(deliveryDecisionState = null) {
  const state = deliveryDecisionState && typeof deliveryDecisionState === "object" ? deliveryDecisionState : {};
  const rawDeliveryGateStatus = String(state.delivery_gate_status || state.final_delivery_status || "blocked");
  const hasCanonicalDeliveryGateState =
    state.source === "canonical_delivery_decision" &&
    state.core_valid_required_coverage === true;
  const finalBossCompliance = state.finalBossCompliance && typeof state.finalBossCompliance === "object"
    ? state.finalBossCompliance
    : {};
  const hasCanonicalAcquisitionFinalDecision =
    state.version === "acq_memo_v2_final_delivery_decision_v1" &&
    state.product === "acquisition_memo_v2" &&
    state.final_delivery_authority === "final_boss_customer_surface_model_delivery_decision" &&
    state.final_delivery_status === "deliverable" &&
    state.coreGate?.publishAllowed === true &&
    finalBossCompliance.ok === true &&
    finalBossCompliance.bossOk === true &&
    finalBossCompliance.customerSurfaceModelOk === true &&
    finalBossCompliance.customerSurfaceHtmlOk === true &&
    Number(finalBossCompliance.violationCount) === 0 &&
    state.customer_delivery_ready === true &&
    state.customer_publish_eligible === true &&
    state.report_publishable === true &&
    state.report_blocked === false &&
    Array.isArray(state.blockingReasons) &&
    state.blockingReasons.length === 0;
  const hasCanonicalCoreValidState = hasCanonicalDeliveryGateState || hasCanonicalAcquisitionFinalDecision;
  const deliveryGateStatus = hasCanonicalCoreValidState ? rawDeliveryGateStatus : "blocked";
  const customerDeliveryGateStatus =
    rawDeliveryGateStatus === "user_needs_documents"
      ? "replacement_source_required"
      : deliveryGateStatus;
  const customerBlockers = Array.isArray(state.customer_blockers)
    ? state.customer_blockers
    : Array.isArray(state.customer_publish_blockers)
      ? state.customer_publish_blockers
      : Array.isArray(state.blockingReasons)
        ? state.blockingReasons
        : [];
  const canonicalCustomerDeliveryAllowed = hasCanonicalAcquisitionFinalDecision
    ? state.customer_delivery_ready === true && state.customer_publish_eligible === true && state.report_publishable === true
    : state.customer_delivery_allowed === true;
  const customerDeliveryAllowed =
    hasCanonicalCoreValidState &&
    canonicalCustomerDeliveryAllowed &&
    deliveryGateStatus === "deliverable" &&
    !Boolean(state.hold_delivery) &&
    customerBlockers.length === 0;
  const holdDelivery = Boolean(state.hold_delivery) || !customerDeliveryAllowed;
  const publicSampleReady = Boolean(state.public_sample_ready);
  const highValueOutreachReady = Boolean(state.high_value_outreach_ready);
  const launchPathRecommendation =
    customerDeliveryAllowed
      ? (publicSampleReady && highValueOutreachReady
        ? "customer_deliverable"
        : "customer_deliverable_with_internal_advisory")
      : (rawDeliveryGateStatus === "user_needs_documents" ? "replacement_source_required" : "customer_deliverable");
  const readinessHierarchy = {
    final_delivery_authority: hasCanonicalAcquisitionFinalDecision
      ? state.final_delivery_authority
      : "delivery_gate",
    final_delivery_status: customerDeliveryGateStatus,
    customer_delivery_ready: customerDeliveryAllowed,
    customer_publish_eligible: customerDeliveryAllowed,
    report_publishable: customerDeliveryAllowed,
    report_blocked: !customerDeliveryAllowed,
    public_sample_ready: publicSampleReady,
    high_value_outreach_ready: highValueOutreachReady,
    advisory_only_findings: Array.isArray(state.advisory_only_findings) ? state.advisory_only_findings.length : 0,
  };
  return {
    delivery_gate_status: customerDeliveryGateStatus,
    customer_delivery_allowed: customerDeliveryAllowed,
    hold_delivery: holdDelivery,
    holdDelivery,
    report_publishable: customerDeliveryAllowed,
    report_blocked: !customerDeliveryAllowed,
    customer_delivery_ready: customerDeliveryAllowed,
    customer_publish_eligible: customerDeliveryAllowed,
    launch_path_recommendation: launchPathRecommendation,
    readiness_hierarchy: readinessHierarchy,
    legacy_compatibility: {
      delivery_gate_status: customerDeliveryGateStatus,
      customer_delivery_ready: customerDeliveryAllowed,
      customer_publish_eligible: customerDeliveryAllowed,
      report_publishable: customerDeliveryAllowed,
      report_blocked: !customerDeliveryAllowed,
      launch_path_recommendation: launchPathRecommendation,
      hold_delivery: holdDelivery,
      holdDelivery,
      public_sample_ready: publicSampleReady,
      high_value_outreach_ready: highValueOutreachReady,
    },
  };
}

export function isValidReportStoragePath(storagePath) {
  const normalized = typeof storagePath === "string" ? storagePath.trim() : "";
  return normalized.length > 0 && normalized.includes("/") && normalized.toLowerCase().endsWith(".pdf");
}

export function buildReportStoragePath({ effectiveUserId, reportSeed } = {}) {
  const userPart = String(effectiveUserId ?? "").trim();
  const seedPart = String(reportSeed ?? "").trim();
  if (!userPart || !seedPart) return "";
  return `${userPart}/${seedPart}.pdf`;
}

function buildReportRevisionInsertValues({
  job = {},
  reportData = {},
  revision = null,
  existingReportId = null,
} = {}) {
  const explicitRevision =
    revision && typeof revision === "object" ? revision :
    reportData?.revision && typeof reportData.revision === "object" ? reportData.revision :
    {};
  const effectiveJobId = String(job?.id ?? reportData?.jobId ?? reportData?.job_id ?? "").trim() || null;
  const revisionKind = normalizeReportRevisionKind(
    explicitRevision.revision_kind ??
      explicitRevision.kind ??
      reportData?.revision_kind ??
      reportData?.revision?.kind ??
      "original",
    "original",
  );
  const revisionRootReportId = String(
    explicitRevision.revision_root_report_id ??
      reportData?.revision_root_report_id ??
      reportData?.revision?.root_report_id ??
      "",
  ).trim() || null;
  const revisionParentReportId = String(
    explicitRevision.revision_parent_report_id ??
      reportData?.revision_parent_report_id ??
      reportData?.revision?.parent_report_id ??
      "",
  ).trim() || null;
  const explicitRevisionNumber = Number(
    explicitRevision.revision_number ??
      reportData?.revision_number ??
      reportData?.revision?.number ??
      NaN,
  );
  const revisionNumber =
    Number.isInteger(explicitRevisionNumber) && explicitRevisionNumber >= 1
      ? explicitRevisionNumber
      : revisionKind === "original"
        ? 1
        : null;
  const revisionFamilyKey = String(
    explicitRevision.revision_family_key ??
      reportData?.revision_family_key ??
      reportData?.revision?.family_key ??
      revisionRootReportId ??
      "",
  ).trim() || null;
  const revisionSourceJobId = String(
    explicitRevision.revision_source_job_id ??
      reportData?.revision_source_job_id ??
      effectiveJobId ??
      "",
  ).trim() || null;
  const revisionRequestKey = String(
    explicitRevision.revision_request_key ??
      reportData?.revision_request_key ??
      buildReportRevisionRequestKey({
        revisionKind,
        revisionFamilyKey: revisionFamilyKey || revisionRootReportId || existingReportId,
        revisionNumber,
        revisionParentReportId,
        revisionSourceJobId,
      }),
  ).trim() || null;

  if (revisionKind !== "original") {
    if (!revisionRootReportId) {
      const err = new Error(`Missing revision root report id for ${revisionKind} report publication`);
      err.code = "REPORT_GENERATION_FAILED";
      err.context = { revisionKind };
      throw err;
    }
    if (!revisionNumber) {
      const err = new Error(`Missing revision number for ${revisionKind} report publication`);
      err.code = "REPORT_GENERATION_FAILED";
      err.context = { revisionKind, revisionRootReportId };
      throw err;
    }
  }

  return {
    revision_kind: revisionKind,
    revision_family_key: revisionFamilyKey,
    revision_root_report_id: revisionRootReportId,
    revision_parent_report_id: revisionParentReportId,
    revision_number: revisionNumber,
    revision_request_key: revisionRequestKey,
    revision_source_job_id: revisionSourceJobId,
    is_current_revision: false,
    revision_published_at: null,
  };
}

export async function promoteReportRevisionToCurrent({
  supabaseAdmin,
  reportId = null,
} = {}) {
  if (!supabaseAdmin?.rpc) {
    throw new Error("Missing report promotion database client");
  }
  const trimmedReportId = String(reportId ?? "").trim();
  if (!trimmedReportId) {
    throw new Error("Missing report id for revision promotion");
  }
  const { data, error } = await supabaseAdmin.rpc("promote_report_revision_to_current", {
    p_report_id: trimmedReportId,
  });
  if (error) {
    throw error;
  }
  const resolved = Array.isArray(data) ? data[0] : data;
  return {
    promoted: Boolean(resolved?.promoted),
    stale: Boolean(resolved?.stale),
    reportId: String(resolved?.report_id ?? trimmedReportId).trim() || trimmedReportId,
    demotedReportId: String(resolved?.demoted_report_id ?? "").trim() || null,
    revisionFamilyKey: String(resolved?.revision_family_key ?? "").trim() || null,
    revisionNumber: Number.isInteger(Number(resolved?.revision_number)) ? Number(resolved.revision_number) : null,
  };
}

function normalizeReportDownloadArtifactMode(reportDownloadArtifactMode = "") {
  const normalized = String(reportDownloadArtifactMode || "").trim().toLowerCase();
  if (!normalized) return "";
  if (["production", "production_pdf", "prod", "launch"].includes(normalized)) return "production_pdf";
  if (["docraptor_test_pdf", "docraptor_test", "watermarked_pdf", "watermarked"].includes(normalized)) {
    return "docraptor_test_pdf";
  }
  if (["test", "test_pdf", "stub", "stub_pdf", "prelaunch"].includes(normalized)) return "stub_pdf";
  return normalized;
}

function buildPrelaunchTestPdfBuffer({
  finalHtml = "",
  reportType = "",
  reportSeed = null,
  propertyName = "",
  storagePath = "",
} = {}) {
  const escapePdfText = (value) =>
    String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r?\n/g, " ");

  const bodyLines = [
    "InvestorIQ prelaunch test artifact. Production PDF generation disabled.",
    `Report type: ${String(reportType || "").trim() || "unknown"}`,
    reportSeed ? `Report seed: ${String(reportSeed || "").trim()}` : "",
    propertyName ? `Property: ${String(propertyName || "").trim()}` : "",
    storagePath ? `Storage path: ${String(storagePath || "").trim()}` : "",
    String(finalHtml || "").trim() ? "Sealed customer HTML captured for prelaunch delivery proof." : "",
  ].filter(Boolean);

  const contentLines = bodyLines.length
    ? bodyLines.map((line, index) => `${index === 0 ? "" : "0 -18 Td\n"}(${escapePdfText(line)}) Tj`).join("\n")
    : "(InvestorIQ prelaunch test artifact.) Tj";
  const contentStream = `BT\n/F1 12 Tf\n72 740 Td\n${contentLines}\nET\n`;

  const header = "%PDF-1.4\n";
  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}endstream\nendobj\n`,
  ];

  const offsets = [0];
  let currentOffset = Buffer.byteLength(header, "utf8");
  for (const object of objects) {
    offsets.push(currentOffset);
    currentOffset += Buffer.byteLength(object, "utf8");
  }

  const xrefEntries = offsets
    .map((offset, index) => (index === 0 ? "0000000000 65535 f \n" : `${String(offset).padStart(10, "0")} 00000 n \n`))
    .join("");
  const xref = `xref\n0 ${offsets.length}\n${xrefEntries}trailer\n<< /Root 1 0 R /Size ${offsets.length} >>\nstartxref\n${currentOffset}\n%%EOF\n`;

  return Buffer.from(`${header}${objects.join("")}${xref}`, "utf8");
}

export function resolveReportDownloadArtifactMode({
  reportDownloadArtifactMode = process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
  hasDocRaptorApiKey = Boolean(String(process.env.DOCRAPTOR_API_KEY || "").trim()),
} = {}) {
  const normalizedMode = normalizeReportDownloadArtifactMode(reportDownloadArtifactMode);
  if (normalizedMode === "stub_pdf") return "stub_pdf";
  if (normalizedMode === "docraptor_test_pdf") {
    if (!hasDocRaptorApiKey) {
      const err = new Error("DOCRAPTOR_API_KEY_REQUIRED");
      err.code = "DOCRAPTOR_API_KEY_REQUIRED";
      err.context = {
        report_download_artifact_mode: normalizedMode,
        has_docraptor_api_key: Boolean(hasDocRaptorApiKey),
      };
      throw err;
    }
    return "docraptor_test_pdf";
  }
  if (normalizedMode === "production_pdf") {
    if (docraptorMode !== "production" || !allowProductionPdf || !hasDocRaptorApiKey) {
      const err = new Error("DOCRAPTOR_NOT_PRODUCTION_MODE");
      err.code = "DOCRAPTOR_NOT_PRODUCTION_MODE";
      err.context = {
        report_download_artifact_mode: normalizedMode,
        docraptor_mode: docraptorMode,
        allow_production_pdf: Boolean(allowProductionPdf),
        has_docraptor_api_key: Boolean(hasDocRaptorApiKey),
      };
      throw err;
    }
    return "production_pdf";
  }
  if (docraptorMode === "production" && allowProductionPdf && hasDocRaptorApiKey) {
    return "production_pdf";
  }
  return "stub_pdf";
}

export async function renderReportPdfBuffer({
  finalHtml,
  reportType = "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
  reportDownloadArtifactMode = process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
  reportSeed = null,
  propertyName = "",
  storagePath = "",
} = {}) {
  const artifactMode = resolveReportDownloadArtifactMode({
    reportDownloadArtifactMode,
    allowProductionPdf,
    docraptorMode,
  });
  if (artifactMode === "stub_pdf") {
    return buildPrelaunchTestPdfBuffer({
      finalHtml,
      reportType,
      reportSeed,
      propertyName,
      storagePath,
    });
  }

  const apiKey = String(process.env.DOCRAPTOR_API_KEY || "").trim();
  const pdfResponse = await axios.post(
    "https://docraptor.com/docs",
    {
      test: artifactMode !== "production_pdf",
      document_content: String(finalHtml || ""),
      name: "InvestorIQ-ClientReport.pdf",
      document_type: "pdf",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
      responseType: "arraybuffer",
    }
  );

  return Buffer.isBuffer(pdfResponse.data) ? pdfResponse.data : Buffer.from(pdfResponse.data);
}

export async function ensureReportDownloadArtifact({
  supabaseAdmin,
  job = {},
  reportId = null,
  storagePath = null,
  finalHtml = "",
  reportType = "",
  reportSeed = null,
  propertyName = "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
  reportDownloadArtifactMode = process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
  renderPdfBuffer = renderReportPdfBuffer,
  createdReportRecord = false,
  bucketName = "generated_reports",
  deliveryGateStatus = null,
  holdDelivery = false,
  deterministicContractQaSeal = null,
  sourceReconciliation = null,
  reportIdentity = null,
  publicationTarget = process.env.REPORT_PUBLICATION_TARGET || "",
  runFinalPdfPublicationQualityBoss = assertFinalPdfPublicationQuality,
} = {}) {
  if (deliveryGateStatus !== "deliverable" || holdDelivery === true) {
    const err = new Error("Report download artifact blocked before resolution");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      deliveryGateStatus: deliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  const normalizedStoragePath = typeof storagePath === "string" ? storagePath.trim() : "";
  if (!normalizedStoragePath) {
    const err = new Error("Missing valid report storage path before download artifact");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath || null,
      reportType: String(reportType || "").trim() || null,
      reportSeed: String(reportSeed || "").trim() || null,
    };
    throw err;
  }

  const storageBucket = supabaseAdmin?.storage?.from?.(bucketName);
  if (!storageBucket) {
    const err = new Error("Missing report storage client");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      bucketName,
    };
    throw err;
  }

  const artifactMode = resolveReportDownloadArtifactMode({
    reportDownloadArtifactMode,
    allowProductionPdf,
    docraptorMode,
  });
  const resolvedPublicationTarget = String(publicationTarget || "").trim() ||
    (artifactMode === "production_pdf" ? "external_customer" : "internal_test");
  const canonicalReportIdentity = buildCanonicalReportIdentityReceipt({
    reportMode: reportIdentity?.reportMode || null,
    reportType: reportIdentity?.reportType || reportType || null,
  });
  const baseSectionDispositionReceipts =
    deterministicContractQaSeal?.sectionDispositionReceipts ||
    deterministicContractQaSeal?.section_disposition_receipts ||
    deterministicContractQaSeal?.qualityManifest?.sectionDispositionReceipts ||
    {};
  const certifyPdf = async (
    pdfBytes,
    {
      approvedHtmlForCertification = finalHtml,
      sectionDispositionReceipts = baseSectionDispositionReceipts,
      semanticRecompositionReceipt = null,
    } = {}
  ) => runFinalPdfPublicationQualityBoss({
    pdfBytes,
    approvedHtml: approvedHtmlForCertification,
    deterministicContractQaSeal,
    sourceReconciliation,
    reportIdentity: canonicalReportIdentity,
    artifactMode,
    publicationTarget: resolvedPublicationTarget,
    sectionDispositionReceipts,
    semanticRecompositionReceipt,
  });
  const cleanupCreatedReportRecord = async (logContext) => {
    if (!createdReportRecord || !reportId) return;
    try {
      await supabaseAdmin.from("reports").delete().eq("id", reportId);
    } catch (cleanupErr) {
      console.error(`Failed to cleanup report record after ${logContext}:`, cleanupErr);
    }
  };

  const existingCheck = await storageBucket.download(normalizedStoragePath);
  if (!existingCheck?.error && existingCheck?.data) {
    let publicationQualityBoss;
    try {
      publicationQualityBoss = await certifyPdf(existingCheck.data);
    } catch (error) {
      await cleanupCreatedReportRecord("existing PDF publication quality failure");
      throw error;
    }
    return {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      artifactSource: "existing_download",
      verifiedDownloadArtifact: true,
      createdDownloadArtifact: false,
      publicationQualityBoss,
    };
  }

  if (!String(finalHtml || "").trim()) {
    const err = new Error("Missing final HTML before download artifact");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      reportType: String(reportType || "").trim() || null,
    };
    throw err;
  }

  let pdfBuffer = await renderPdfBuffer({
    finalHtml,
    reportType,
    allowProductionPdf,
    docraptorMode,
    reportDownloadArtifactMode,
    job,
    reportSeed,
    propertyName,
    storagePath: normalizedStoragePath,
  });

  let publicationQualityBoss;
  let institutionalPdfRecovery = null;
  let recoveryAttempted = false;
  let semanticRecompositionAttempted = false;
  let semanticRecomposition = null;
  const recoverPdfOnce = async (initialCertification, { cleanupOnFailure = true } = {}) => {
    recoveryAttempted = true;
    const recovery = buildInstitutionalPdfRecoveryHtml({
      approvedHtml: finalHtml,
      certification: initialCertification,
    });
    const recoveredBuffer = await renderPdfBuffer({
      finalHtml: recovery.html,
      reportType,
      allowProductionPdf,
      docraptorMode,
      reportDownloadArtifactMode,
      job,
      reportSeed,
      propertyName,
      storagePath: normalizedStoragePath,
    });
    try {
      const recoveredCertification = await certifyPdf(recoveredBuffer);
      return {
        pdfBuffer: recoveredBuffer,
        publicationQualityBoss: recoveredCertification,
        institutionalPdfRecovery: {
          ...recovery.receipt,
          initialCertificationStatus: initialCertification?.status || null,
          finalCertificationStatus: recoveredCertification?.status || null,
          recovered: recoveredCertification?.ok === true,
          customerDeliveryPreserved: isFinalPdfCustomerDeliveryAllowed(recoveredCertification),
        },
      };
    } catch (recoveryError) {
      const recoveredCertification = recoveryError?.context?.final_pdf_publication_quality_boss || null;
      if (isFinalPdfCustomerDeliveryAllowed(recoveredCertification)) {
        return {
          pdfBuffer: recoveredBuffer,
          publicationQualityBoss: recoveredCertification,
          institutionalPdfRecovery: {
            ...recovery.receipt,
            initialCertificationStatus: initialCertification?.status || null,
            finalCertificationStatus: recoveredCertification?.status || null,
            recovered: false,
            customerDeliveryPreserved: true,
          },
        };
      }
      recoveryError.context = {
        ...(recoveryError.context || {}),
        institutional_pdf_recovery: {
          ...recovery.receipt,
          initialCertificationStatus: initialCertification?.status || null,
          recovered: false,
          customerDeliveryPreserved: false,
        },
      };
      if (cleanupOnFailure) {
        await cleanupCreatedReportRecord("PDF publication quality recovery failure");
      }
      throw recoveryError;
    }
  };
  const semanticRecomposePdfOnce = async (initialCertification, priorRecovery = null) => {
    semanticRecompositionAttempted = true;
    const semantic = runSemanticRecompositionOnce(finalHtml);
    semanticRecomposition = {
      ...semantic.receipt,
      initialCertificationStatus: initialCertification?.status || null,
      priorCssRecovery: priorRecovery || null,
    };
    const semanticBuffer = await renderPdfBuffer({
      finalHtml: semantic.html,
      reportType,
      allowProductionPdf,
      docraptorMode,
      reportDownloadArtifactMode,
      job,
      reportSeed,
      propertyName,
      storagePath: normalizedStoragePath,
    });
    try {
      const semanticCertification = await certifyPdf(semanticBuffer, {
        approvedHtmlForCertification: semantic.html,
        semanticRecompositionReceipt: semantic.receipt,
      });
      return {
        pdfBuffer: semanticBuffer,
        publicationQualityBoss: semanticCertification,
        semanticRecomposition: {
          ...semanticRecomposition,
          finalCertificationStatus: semanticCertification?.status || null,
          recovered: semanticCertification?.ok === true,
          customerDeliveryPreserved: isFinalPdfCustomerDeliveryAllowed(semanticCertification),
        },
      };
    } catch (semanticError) {
      const semanticCertification = semanticError?.context?.final_pdf_publication_quality_boss || null;
      if (isFinalPdfCustomerDeliveryAllowed(semanticCertification)) {
        return {
          pdfBuffer: semanticBuffer,
          publicationQualityBoss: semanticCertification,
          semanticRecomposition: {
            ...semanticRecomposition,
            finalCertificationStatus: semanticCertification?.status || null,
            recovered: false,
            customerDeliveryPreserved: true,
          },
        };
      }
      semanticError.context = {
        ...(semanticError.context || {}),
        semantic_recomposition: {
          ...semanticRecomposition,
          finalCertificationStatus: semanticCertification?.status || null,
          recovered: false,
          customerDeliveryPreserved: false,
        },
      };
      await cleanupCreatedReportRecord("PDF semantic recomposition failure");
      throw semanticError;
    }
  };
  const canAttemptSemanticRecomposition = (certification = null) => {
    const codes = [
      ...(Array.isArray(certification?.blocking_issue_codes) ? certification.blocking_issue_codes : []),
      ...(Array.isArray(certification?.issues) ? certification.issues.map((issue) => issue?.code) : []),
    ].map((code) => String(code || "").trim()).filter(Boolean);
    return codes.length > 0 && codes.every((code) => isCollapseEligibleBossIssue(code));
  };
  try {
    publicationQualityBoss = await certifyPdf(pdfBuffer);
  } catch (error) {
    const initialCertification = error?.context?.final_pdf_publication_quality_boss || null;
    if (!isInstitutionalPdfRecoveryEligible(initialCertification)) {
      await cleanupCreatedReportRecord("PDF publication quality failure");
      throw error;
    }
    try {
      const recovered = await recoverPdfOnce(initialCertification, { cleanupOnFailure: false });
      pdfBuffer = recovered.pdfBuffer;
      publicationQualityBoss = recovered.publicationQualityBoss;
      institutionalPdfRecovery = recovered.institutionalPdfRecovery;
    } catch (cssRecoveryError) {
      const cssRecoveryReceipt = cssRecoveryError?.context?.institutional_pdf_recovery || null;
      const cssRecoveryCertification =
        cssRecoveryError?.context?.final_pdf_publication_quality_boss || initialCertification;
      if (!canAttemptSemanticRecomposition(cssRecoveryCertification)) {
        await cleanupCreatedReportRecord("PDF publication quality recovery failure");
        throw cssRecoveryError;
      }
      const semanticRecovered = await semanticRecomposePdfOnce(
        cssRecoveryCertification,
        cssRecoveryReceipt
      );
      pdfBuffer = semanticRecovered.pdfBuffer;
      publicationQualityBoss = semanticRecovered.publicationQualityBoss;
      semanticRecomposition = semanticRecovered.semanticRecomposition;
      institutionalPdfRecovery = cssRecoveryReceipt;
    }
  }
  if (
    !recoveryAttempted &&
    publicationQualityBoss?.ok === false &&
    isInstitutionalPdfRecoveryEligible(publicationQualityBoss)
  ) {
    try {
      const recovered = await recoverPdfOnce(publicationQualityBoss, { cleanupOnFailure: false });
      pdfBuffer = recovered.pdfBuffer;
      publicationQualityBoss = recovered.publicationQualityBoss;
      institutionalPdfRecovery = recovered.institutionalPdfRecovery;
    } catch (cssRecoveryError) {
      const cssRecoveryReceipt = cssRecoveryError?.context?.institutional_pdf_recovery || null;
      const cssRecoveryCertification =
        cssRecoveryError?.context?.final_pdf_publication_quality_boss || publicationQualityBoss;
      if (!canAttemptSemanticRecomposition(cssRecoveryCertification)) {
        await cleanupCreatedReportRecord("PDF publication quality recovery failure");
        throw cssRecoveryError;
      }
      const semanticRecovered = await semanticRecomposePdfOnce(
        cssRecoveryCertification,
        cssRecoveryReceipt
      );
      pdfBuffer = semanticRecovered.pdfBuffer;
      publicationQualityBoss = semanticRecovered.publicationQualityBoss;
      semanticRecomposition = semanticRecovered.semanticRecomposition;
      institutionalPdfRecovery = cssRecoveryReceipt;
    }
  }
  if (!isFinalPdfCustomerDeliveryAllowed(publicationQualityBoss)) {
    await cleanupCreatedReportRecord("PDF publication safety failure");
    const error = new Error("Final PDF failed customer delivery safety certification");
    error.code = "PDF_ARTIFACT_FAILED";
    error.context = {
      failure_class: "internal_system_failure",
      customer_document_failure: false,
      final_pdf_publication_quality_boss: publicationQualityBoss || null,
    };
    throw error;
  }

  const { error: uploadError } = await storageBucket.upload(normalizedStoragePath, pdfBuffer, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    if (createdReportRecord && reportId) {
      try {
        await supabaseAdmin.from("reports").delete().eq("id", reportId);
      } catch (cleanupErr) {
        console.error("Failed to cleanup report record after storage upload failure:", cleanupErr);
      }
    }
    const err = new Error(`Failed to upload report to storage: ${uploadError.message}`);
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      bucketName,
      createdReportRecord: Boolean(createdReportRecord),
    };
    throw err;
  }

  const verifyResult = await storageBucket.download(normalizedStoragePath);
  if (verifyResult?.error || !verifyResult?.data) {
    if (createdReportRecord && reportId) {
      try {
        await supabaseAdmin.from("reports").delete().eq("id", reportId);
      } catch (cleanupErr) {
        console.error("Failed to cleanup report record after storage verification failure:", cleanupErr);
      }
    }
    const err = new Error("Failed to verify report download artifact");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      bucketName,
      createdReportRecord: Boolean(createdReportRecord),
    };
    throw err;
  }

  return {
    reportId: reportId || null,
    storagePath: normalizedStoragePath,
    artifactSource: "created_download",
    verifiedDownloadArtifact: true,
    createdDownloadArtifact: true,
    publicationQualityBoss,
    institutionalPdfRecovery,
    semanticRecomposition: semanticRecompositionAttempted ? semanticRecomposition : null,
  };
}

export async function resolveOrCreateReportPublicationRecord({
  supabaseAdmin,
  job = {},
  reportData = {},
  existingReportId = null,
  existingStoragePath = null,
  revision = null,
  allowCreate = true,
  deliveryGateStatus = null,
  holdDelivery = false,
} = {}) {
  if (deliveryGateStatus !== "deliverable" || holdDelivery === true) {
    const err = new Error("Report publication record blocked before resolution");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      deliveryGateStatus: deliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  const effectiveUserId = String(job?.user_id ?? "").trim();
  const reportType = String(reportData?.report_type ?? job?.report_type ?? "").trim();
  const reportSeed = String(job?.id ?? reportData?.jobId ?? "").trim();
  const resolvedReportId = String(reportData?.reportId ?? existingReportId ?? "").trim() || null;
  const resolvedStoragePath = String(reportData?.storagePath ?? existingStoragePath ?? "").trim() || null;

  if (reportData?.reportId && !resolvedStoragePath) {
    const err = new Error("Generator response omitted authoritative storage path");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: resolvedReportId,
      reportType: reportType || null,
      responseContract: "published_report_requires_reportId_and_storagePath",
    };
    throw err;
  }

  if (resolvedReportId && resolvedStoragePath) {
    return {
      reportId: resolvedReportId,
      storagePath: resolvedStoragePath,
      publicationSource: reportData?.reportId ? "route_response" : existingReportId ? "existing_report" : "resolved_report",
      createdReportRecord: false,
    };
  }

  const derivedStoragePath =
    effectiveUserId && (resolvedReportId || reportSeed)
      ? buildReportStoragePath({
          effectiveUserId,
          reportSeed: resolvedReportId || reportSeed,
        })
      : "";

  if (resolvedReportId) {
    return {
      reportId: resolvedReportId,
      storagePath: derivedStoragePath || resolvedStoragePath || null,
      publicationSource: reportData?.reportId ? "route_response" : "resolved_report",
      createdReportRecord: false,
    };
  }

  if (!allowCreate) {
    return {
      reportId: null,
      storagePath: null,
      publicationSource: "creation_disabled",
      createdReportRecord: false,
    };
  }

  if (!effectiveUserId || !reportType || !reportSeed || !reportData?.final_html) {
    return {
      reportId: null,
      storagePath: null,
      publicationSource: "missing_publication_prereqs",
      createdReportRecord: false,
    };
  }

  if (!supabaseAdmin?.from) {
    throw new Error("Missing report publication database client");
  }

  const storagePath = buildReportStoragePath({ effectiveUserId, reportSeed });
  const propertyName = String(job?.property_name ?? "").trim() || "Property";
  const revisionValues = buildReportRevisionInsertValues({
    job,
    reportData,
    revision,
    existingReportId,
  });
  const selectedColumns = [
    "id",
    "storage_path",
    "revision_kind",
    "revision_family_key",
    "revision_root_report_id",
    "revision_parent_report_id",
    "revision_number",
    "revision_request_key",
    "revision_source_job_id",
    "is_current_revision",
    "revision_published_at",
  ].join(", ");

  if (revisionValues.revision_request_key) {
    const { data: existingRevisionRow, error: existingRevisionError } = await supabaseAdmin
      .from("reports")
      .select(selectedColumns)
      .eq("revision_request_key", revisionValues.revision_request_key)
      .maybeSingle();
    if (existingRevisionError) {
      throw existingRevisionError;
    }
    if (existingRevisionRow?.id) {
      return {
        reportId: existingRevisionRow.id,
        storagePath: existingRevisionRow.storage_path || storagePath || null,
        publicationSource: revisionValues.revision_kind === "original" ? "existing_report" : "existing_revision",
        createdReportRecord: false,
        revision: existingRevisionRow,
      };
    }
  }

  const { data: reportRow, error: reportCreateError } = await supabaseAdmin
    .from("reports")
    .insert([
      {
        user_id: effectiveUserId,
        property_name: propertyName,
        report_type: reportType,
        storage_path: storagePath,
        ...revisionValues,
      },
    ])
    .select(selectedColumns)
    .single();

  if (reportCreateError || !reportRow?.id) {
    const duplicateKeyHints = [
      "duplicate key value violates unique constraint",
      "23505",
    ];
    const isPotentialDuplicate = duplicateKeyHints.some((hint) =>
      String(reportCreateError?.message || "").toLowerCase().includes(String(hint).toLowerCase()) ||
      String(reportCreateError?.code || "").includes(hint)
    );
    if (isPotentialDuplicate && revisionValues.revision_request_key) {
      const { data: conflictingReportRow, error: conflictingLookupError } = await supabaseAdmin
        .from("reports")
        .select(selectedColumns)
        .eq("revision_request_key", revisionValues.revision_request_key)
        .maybeSingle();
      if (!conflictingLookupError && conflictingReportRow?.id) {
        return {
          reportId: conflictingReportRow.id,
          storagePath: conflictingReportRow.storage_path || storagePath || null,
          publicationSource: revisionValues.revision_kind === "original" ? "conflicting_report" : "conflicting_revision",
          createdReportRecord: false,
          revision: conflictingReportRow,
        };
      }
    }
    const err = new Error(`Failed to create report record: ${reportCreateError?.message || "unknown error"}`);
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      user_id: effectiveUserId || null,
      property_name: propertyName,
      report_type: reportType || null,
      storage_path: storagePath || null,
      report_seed: reportSeed || null,
      revision_kind: revisionValues.revision_kind || null,
      revision_request_key: revisionValues.revision_request_key || null,
      revision_number: revisionValues.revision_number || null,
    };
    throw err;
  }

  return {
    reportId: reportRow.id,
    storagePath: reportRow.storage_path || storagePath,
    publicationSource: revisionValues.revision_kind === "original" ? "created_report" : "created_revision",
    createdReportRecord: true,
    revision: reportRow,
  };
}

export function assertValidReportPublicationInsert({
  storagePath,
  reportType,
  deliveryGateStatus = null,
  holdDelivery = false,
  coreValidRequiredCoverage = false,
  context = {},
} = {}) {
  const normalizedStoragePath = typeof storagePath === "string" ? storagePath.trim() : "";
  const normalizedDeliveryGateStatus = deliveryGateStatus;
  if (
    holdDelivery ||
    normalizedDeliveryGateStatus !== "deliverable"
  ) {
    const err = new Error("Report publication blocked before storage insert");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      ...context,
      storagePath: normalizedStoragePath || null,
      deliveryGateStatus: normalizedDeliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
      coreValidRequiredCoverage: Boolean(coreValidRequiredCoverage),
    };
    throw err;
  }
  if (!isValidReportStoragePath(normalizedStoragePath)) {
    const err = new Error("Missing valid report storage path before report insert");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      ...context,
      storagePath: normalizedStoragePath || null,
      deliveryGateStatus: normalizedDeliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  if (!String(reportType ?? "").trim()) {
    const err = new Error("Missing report type before report insert");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      ...context,
      storagePath: normalizedStoragePath,
      deliveryGateStatus: normalizedDeliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  return normalizedStoragePath;
}
