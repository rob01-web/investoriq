import { isCanonicalSourceTruthPackage } from "./source-truth-package.js";
import { applyPhase7EliteReportPresentation } from "./phase7-elite-report-presentation.js";
import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";

export function runScreeningReportPipeline({
  finalHtml = "",
  qaHtml = "",
  reportMode = "screening_v1",
  sourceCoverageQa = null,
  deliveryGateDecisionResult = null,
  sourceTruthPackage = null,
  sourceTruthRequired = false,
  deterministicContractQaSeal = null,
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
  if (deterministicContractQaSeal?.ok !== true) {
    const error = new Error("SCREENING_DETERMINISTIC_CONTRACT_QA_FAILED");
    error.code = "REPORT_GENERATION_FAILED";
    error.context = {
      lane: "screening",
      stage: "deterministic_contract_qa",
      failure_class: "internal_render_contract_failure",
      customer_document_failure: false,
      issues: Array.isArray(deterministicContractQaSeal?.issues)
        ? deterministicContractQaSeal.issues
        : [],
    };
    throw error;
  }
  const html =
    typeof finalHtml === "string" && finalHtml.length > 0
      ? finalHtml
      : typeof qaHtml === "string"
        ? qaHtml
        : "";
  const presentationHtml = applyPhase7EliteReportPresentation(html, { reportMode });
  const decisionSupportHtml = applyPhase7DecisionSupport(presentationHtml, { reportMode });
  return {
    html: decisionSupportHtml,
    reportMode,
    sealedLane: "screening_lane",
    sealedCustomerOutput: true,
    sourceCoverageQa,
    deliveryGateDecisionResult,
    sourceTruthPackage,
    deterministicContractQaSeal,
  };
}