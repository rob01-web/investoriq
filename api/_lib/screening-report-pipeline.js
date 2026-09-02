import { isCanonicalSourceTruthPackage } from "./source-truth-package.js";
import { applyPhase7EliteReportPresentation } from "./phase7-elite-report-presentation.js";
import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";
import { applyPhase8CustomerFacingVisualAuthority } from "./phase8-customer-facing-visual-authority.js";

function removeEmptyScreeningSupportContextSection(html = "") {
  const source = String(html || "");
  return source.replace(
    /<section\b[^>]*class\s*=\s*(["'])[^"']*\bsection\b[^"']*\bpage-break\b[^"']*\1[^>]*>\s*<div\b[^>]*class\s*=\s*(["'])[^"']*\bsection-header\b[^"']*\2[^>]*>[\s\S]*?<span\b[^>]*class\s*=\s*(["'])[^"']*\bsection-header-title\b[^"']*\3[^>]*>\s*Source Context\s*\/\s*Support Document Treatment\s*<\/span>[\s\S]*?<\/div>\s*<\/section>/i,
    ""
  );
}

function normalizeScreeningCustomerIdentity(html = "") {
  return String(html || "")
    .replace(/InvestorIQ Capital Intelligence Memorandum/gi, "InvestorIQ Screening Report")
    .replace(
      /Confidential\s*(?:&mdash;|&#8212;|&#x2014;|\u2014)\s*InvestorIQ Technologies Inc\./gi,
      "Confidential | InvestorIQ Technologies Inc."
    );
}

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
  const compactedHtml = removeEmptyScreeningSupportContextSection(html);
  const identityHtml = normalizeScreeningCustomerIdentity(compactedHtml);
  const presentationHtml = applyPhase7EliteReportPresentation(identityHtml, { reportMode });
  const decisionSupportHtml = applyPhase7DecisionSupport(presentationHtml, { reportMode });
  const phase8Html = applyPhase8CustomerFacingVisualAuthority(decisionSupportHtml, {
    reportMode,
    sourceTruthPackage,
  });
  return {
    html: phase8Html,
    reportMode,
    sealedLane: "screening_lane",
    sealedCustomerOutput: true,
    sourceCoverageQa,
    deliveryGateDecisionResult,
    sourceTruthPackage,
    deterministicContractQaSeal,
  };
}
