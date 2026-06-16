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
