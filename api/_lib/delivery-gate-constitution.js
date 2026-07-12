import { isCanonicalSourceTruthPackage } from "./source-truth-package.js";

export function buildConstitutionalDeliveryGateDecision({
  sourceTruthPackage = null,
  pipelineCompliancePassed = false,
  htmlSafetyValidationPassed = false,
  rendererCompleted = false,
  customerBlockers = [],
  complianceDecision = null,
} = {}) {
  const blockers = Array.isArray(customerBlockers)
    ? [...new Set(customerBlockers.map((code) => String(code || "").trim()).filter(Boolean))]
    : [];
  const constitutionalChecks = {
    source_truth_package_valid: isCanonicalSourceTruthPackage(sourceTruthPackage),
    core_publishable: sourceTruthPackage?.core_publishable === true,
    pipeline_compliance_passed: pipelineCompliancePassed === true,
    html_safety_validation_passed: htmlSafetyValidationPassed === true,
    renderer_completed: rendererCompleted === true,
    no_true_customer_blocker: blockers.length === 0,
  };
  const failedChecks = Object.entries(constitutionalChecks)
    .filter(([, passed]) => passed !== true)
    .map(([name]) => name);
  const deliverable = failedChecks.length === 0;

  return {
    ...(complianceDecision && typeof complianceDecision === "object" ? complianceDecision : {}),
    final_delivery_authority: "constitutional_delivery_gate",
    delivery_gate_status: deliverable ? "deliverable" : "admin_review_required",
    customer_delivery_allowed: deliverable,
    customer_delivery_ready: deliverable,
    customer_publish_eligible: deliverable,
    report_publishable: deliverable,
    report_blocked: !deliverable,
    core_valid_required_coverage: constitutionalChecks.core_publishable,
    customer_publish_blockers: blockers,
    constitutional_checks: constitutionalChecks,
    constitutional_failed_checks: failedChecks,
    source_truth_authority: constitutionalChecks.source_truth_package_valid
      ? {
          source: sourceTruthPackage.source,
          schema_version: sourceTruthPackage.schema_version,
          core_publishable: sourceTruthPackage.core_publishable,
        }
      : null,
    readiness_source: "constitutional_delivery_gate",
    readiness_fallback_used: false,
  };
}
