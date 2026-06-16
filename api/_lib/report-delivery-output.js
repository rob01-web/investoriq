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
