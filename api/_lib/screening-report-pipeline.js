import { isCanonicalSourceTruthPackage } from "./source-truth-package.js";

export function runScreeningReportPipeline({
  finalHtml = "",
  qaHtml = "",
  reportMode = "screening_v1",
  sourceCoverageQa = null,
  deliveryGateDecisionResult = null,
  sourceTruthPackage = null,
  sourceTruthRequired = false,
} = {}) {
  if (sourceTruthRequired && !isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    const error = new Error("CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED");
    error.code = "REPORT_GENERATION_FAILED";
    error.context = { lane: "screening", stage: "source_truth_authority" };
    throw error;
  }
  if (
    sourceTruthRequired &&
    deliveryGateDecisionResult?.delivery_gate_status === "deliverable" &&
    sourceTruthPackage?.core_publishable !== true
  ) {
    const error = new Error("SCREENING_DELIVERY_CONTRADICTS_SOURCE_TRUTH");
    error.code = "REPORT_GENERATION_FAILED";
    error.context = {
      lane: "screening",
      stage: "source_truth_authority",
      true_blockers: sourceTruthPackage?.true_blockers || [],
    };
    throw error;
  }
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
    sourceTruthPackage,
  };
}
