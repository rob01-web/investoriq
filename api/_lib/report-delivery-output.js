import axios from "axios";
import { sanitizeFinalCustomerHtml } from "./report-surface-contracts.js";

export function sanitizeTypography(html) {
  return sanitizeFinalCustomerHtml(html);
}

export function buildDeliveryResponseCompatibilityAliases(deliveryDecisionState = null) {
  const state = deliveryDecisionState && typeof deliveryDecisionState === "object" ? deliveryDecisionState : {};
  const rawDeliveryGateStatus = String(state.delivery_gate_status || "blocked");
  const customerDeliveryAllowed =
    state.customer_delivery_allowed === true &&
    rawDeliveryGateStatus === "deliverable" &&
    !Boolean(state.hold_delivery);
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
    reportDownloadArtifactMode,
    job,
    reportSeed,
    propertyName,
    storagePath: normalizedStoragePath,
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
