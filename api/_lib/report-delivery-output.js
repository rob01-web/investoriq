import axios from "axios";
import { sanitizeFinalCustomerHtml } from "./report-surface-contracts.js";

export function sanitizeTypography(html) {
  return sanitizeFinalCustomerHtml(html);
}

export function buildDeliveryResponseCompatibilityAliases(deliveryDecisionState = null) {
  const state = deliveryDecisionState && typeof deliveryDecisionState === "object" ? deliveryDecisionState : {};
  const rawDeliveryGateStatus = String(state.delivery_gate_status || "deliverable");
  const customerDeliveryAllowed =
    state.customer_delivery_allowed !== undefined && state.customer_delivery_allowed !== null
      ? Boolean(state.customer_delivery_allowed)
      : rawDeliveryGateStatus === "deliverable" && !Boolean(state.hold_delivery);
  const holdDelivery = Boolean(state.hold_delivery);
  const publicSampleReady = Boolean(state.public_sample_ready);
  const highValueOutreachReady = Boolean(state.high_value_outreach_ready);
  const launchPathRecommendation =
    customerDeliveryAllowed
      ? (publicSampleReady && highValueOutreachReady
        ? "customer_deliverable"
        : "customer_deliverable_with_internal_advisory")
      : (rawDeliveryGateStatus === "user_needs_documents" ? "user_needs_documents" : "customer_deliverable");
  const readinessHierarchy = {
    final_delivery_authority: "delivery_gate",
    final_delivery_status: rawDeliveryGateStatus,
    customer_delivery_ready: customerDeliveryAllowed,
    customer_publish_eligible: customerDeliveryAllowed,
    report_publishable: customerDeliveryAllowed,
    report_blocked: !customerDeliveryAllowed,
    public_sample_ready: publicSampleReady,
    high_value_outreach_ready: highValueOutreachReady,
    advisory_only_findings: Array.isArray(state.advisory_only_findings) ? state.advisory_only_findings.length : 0,
  };
  return {
    delivery_gate_status: rawDeliveryGateStatus,
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
      delivery_gate_status: rawDeliveryGateStatus,
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

async function renderReportPdfBuffer({
  finalHtml,
  reportType = "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
} = {}) {
  if (docraptorMode !== "production" || !allowProductionPdf) {
    const err = new Error("DOCRAPTOR_NOT_PRODUCTION_MODE");
    err.code = "DOCRAPTOR_NOT_PRODUCTION_MODE";
    err.context = {
      docraptor_mode: docraptorMode,
      allow_production_pdf: Boolean(allowProductionPdf),
      report_type: String(reportType || "").trim() || null,
    };
    throw err;
  }

  const pdfResponse = await axios.post(
    "https://docraptor.com/docs",
    {
      test: docraptorMode !== "production",
      document_content: String(finalHtml || ""),
      name: "InvestorIQ-ClientReport.pdf",
      document_type: "pdf",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(process.env.DOCRAPTOR_API_KEY + ":").toString("base64")}`,
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
  renderPdfBuffer = renderReportPdfBuffer,
  createdReportRecord = false,
  bucketName = "generated_reports",
} = {}) {
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

  const existingCheck = await storageBucket.download(normalizedStoragePath);
  if (!existingCheck?.error && existingCheck?.data) {
    return {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      artifactSource: "existing_download",
      verifiedDownloadArtifact: true,
      createdDownloadArtifact: false,
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

  const pdfBuffer = await renderPdfBuffer({
    finalHtml,
    reportType,
    allowProductionPdf,
    docraptorMode,
    job,
    reportSeed,
    propertyName,
  });

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
  };
}

export async function resolveOrCreateReportPublicationRecord({
  supabaseAdmin,
  job = {},
  reportData = {},
  existingReportId = null,
  existingStoragePath = null,
  allowCreate = true,
} = {}) {
  const effectiveUserId = String(job?.user_id ?? "").trim();
  const reportType = String(reportData?.report_type ?? job?.report_type ?? "").trim();
  const reportSeed = String(job?.id ?? reportData?.jobId ?? "").trim();
  const resolvedReportId = String(reportData?.reportId ?? existingReportId ?? "").trim() || null;
  const resolvedStoragePath = String(reportData?.storagePath ?? existingStoragePath ?? "").trim() || null;

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
  const { data: reportRow, error: reportCreateError } = await supabaseAdmin
    .from("reports")
    .insert([
      {
        user_id: effectiveUserId,
        property_name: propertyName,
        report_type: reportType,
        storage_path: storagePath,
      },
    ])
    .select("id")
    .single();

  if (reportCreateError || !reportRow?.id) {
    const err = new Error(`Failed to create report record: ${reportCreateError?.message || "unknown error"}`);
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      user_id: effectiveUserId || null,
      property_name: propertyName,
      report_type: reportType || null,
      storage_path: storagePath || null,
      report_seed: reportSeed || null,
    };
    throw err;
  }

  return {
    reportId: reportRow.id,
    storagePath,
    publicationSource: "created_report",
    createdReportRecord: true,
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
  const normalizedDeliveryGateStatus =
    String(deliveryGateStatus || "deliverable") === "admin_review_required"
      ? "deliverable"
      : deliveryGateStatus;
  if (
    !coreValidRequiredCoverage &&
    (
      holdDelivery ||
      (typeof normalizedDeliveryGateStatus === "string" && normalizedDeliveryGateStatus !== "deliverable")
    )
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
