export function runScreeningReportPipeline({
  finalHtml = "",
  qaHtml = "",
  reportMode = "screening_v1",
  sourceCoverageQa = null,
  deliveryGateDecisionResult = null,
} = {}) {
  const html =
    typeof finalHtml === "string" && finalHtml.length > 0
      ? finalHtml
      : typeof qaHtml === "string"
        ? qaHtml
        : "";
  return {
    html,
    reportMode,
    sealedLane: "screening_lane",
    sealedCustomerOutput: true,
    sourceCoverageQa,
    deliveryGateDecisionResult,
  };
}
