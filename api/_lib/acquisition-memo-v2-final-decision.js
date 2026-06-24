const DECISION_VERSION = "acq_memo_v2_final_delivery_decision_v1";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasCoreFatalSignal(finalization = {}, coreGate = null, repairPlan = null) {
  const gate = isPlainObject(coreGate) ? coreGate : {};
  if (gate.publishAllowed === false) return true;
  if (asArray(gate.fatalReasons).length > 0) return true;
  if (asArray(repairPlan?.coreFatal).length > 0) return true;
  const violations = asArray(finalization?.compliance?.violations);
  return violations.some((violation) => {
    const code = normalizeCode(violation?.code);
    const section = normalizeStatus(violation?.section || violation?.path);
    return (
      code.includes("CORE_T12") ||
      code.includes("CORE_RENT_ROLL") ||
      code === "MODEL_CORE_T12_MISSING" ||
      code === "MODEL_CORE_RENT_ROLL_MISSING" ||
      section.includes("coresources.coret12") ||
      section.includes("coresources.corerentroll")
    );
  });
}

function hasUnsafeFinalHtmlSignal(finalization = {}) {
  const htmlIssues = asArray(finalization?.customerSurfaceHtmlValidation?.issues);
  const bossFatal = asArray(finalization?.bossCompliance?.fatal_core);
  return htmlIssues.some((issue) => {
    const code = normalizeCode(issue?.code);
    const path = normalizeStatus(issue?.path);
    return (
      code.includes("HTML_") ||
      path.includes("html.") ||
      code.includes("FORBIDDEN") ||
      code.includes("INTERNAL")
    );
  }) || bossFatal.length > 0;
}

function hasRepairableOptionalSignal(repairPlan = null) {
  return (
    asArray(repairPlan?.repairableOptionalSupport).length > 0 ||
    asArray(repairPlan?.forbiddenSurface).length > 0 ||
    asArray(repairPlan?.repairableSectionKeys).length > 0
  );
}

export function buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization = null,
  qaActionPlan = null,
  reportContractQa = null,
  deliveryGateDecision = null,
  coreGate = null,
  repairPlan = null,
  diagnostics = null,
} = {}) {
  const final = isPlainObject(finalization) ? finalization : {};
  const bossOk = Boolean(final?.bossCompliance?.ok);
  const modelOk = final?.customerSurfaceModelValidation
    ? Boolean(final.customerSurfaceModelValidation.ok)
    : true;
  const htmlOk = final?.customerSurfaceHtmlValidation
    ? Boolean(final.customerSurfaceHtmlValidation.ok)
    : true;
  const complianceOk = Boolean(final?.compliance?.ok && bossOk && modelOk && htmlOk);
  const coreFatal = hasCoreFatalSignal(final, coreGate, repairPlan);
  const repairableOptional = hasRepairableOptionalSignal(repairPlan);
  const unsafeFinalHtml = !complianceOk && !coreFatal && hasUnsafeFinalHtmlSignal(final);
  const advisoryOnly =
    !coreFatal &&
    !unsafeFinalHtml &&
    !repairableOptional &&
    asArray(final?.compliance?.violations).every((violation) => {
      const severity = normalizeStatus(violation?.severity);
      return severity === "advisory" || severity === "warning";
    });

  const publishable = complianceOk && !coreFatal && !unsafeFinalHtml;
  const fatalCategory = publishable
    ? null
    : coreFatal
      ? "true_core_fatal"
      : unsafeFinalHtml
        ? "true_unrepaired_unsafe_final_html"
        : repairableOptional
          ? "repairable_optional_support_unresolved"
          : "final_compliance_unresolved";

  const blockingReasons = [];
  if (coreFatal) blockingReasons.push("true_core_fatal");
  if (unsafeFinalHtml) blockingReasons.push("true_unrepaired_unsafe_final_html");
  if (!complianceOk && repairableOptional) blockingReasons.push("repairable_optional_support_unresolved_after_repair");
  if (!complianceOk && blockingReasons.length === 0) blockingReasons.push("final_compliance_unresolved");

  return {
    version: DECISION_VERSION,
    product: "acquisition_memo_v2",
    final_delivery_authority: "final_boss_customer_surface_model_delivery_decision",
    final_delivery_status: publishable ? "deliverable" : "blocked",
    customer_delivery_ready: publishable,
    customer_publish_eligible: publishable,
    report_publishable: publishable,
    report_blocked: !publishable,
    fatalCategory,
    blockingReasons,
    classifications: {
      trueCoreFatal: coreFatal,
      trueUnrepairedUnsafeFinalHtml: unsafeFinalHtml,
      runtimeStoragePdfFatal: false,
      repairableOptionalSupport: repairableOptional,
      advisoryWarningOnly: advisoryOnly,
    },
    finalBossCompliance: {
      ok: Boolean(final?.compliance?.ok),
      bossOk,
      customerSurfaceModelOk: modelOk,
      customerSurfaceHtmlOk: htmlOk,
      violationCount: asArray(final?.compliance?.violations).length,
    },
    upstreamReadiness: {
      qaActionPlanCustomerReady: qaActionPlan?.customer_delivery_ready ?? null,
      qaActionPlanPublishable: qaActionPlan?.report_publishable ?? null,
      reportContractStatus: reportContractQa?.contract_status || null,
      reportContractQualityStatus: reportContractQa?.report_quality_status || null,
      reportContractCustomerReady: reportContractQa?.customer_delivery_ready ?? null,
      deliveryGateStatus: deliveryGateDecision?.delivery_gate_status || null,
      deliveryGateCustomerReady: deliveryGateDecision?.customer_delivery_ready ?? null,
      deliveryGatePublishEligible: deliveryGateDecision?.customer_publish_eligible ?? null,
      deliveryGateReportPublishable: deliveryGateDecision?.report_publishable ?? null,
    },
    coreGate: isPlainObject(coreGate) ? {
      publishAllowed: coreGate.publishAllowed ?? null,
      fatalReasons: asArray(coreGate.fatalReasons),
    } : null,
    repair: {
      attempted: Boolean(diagnostics?.repairAttempted),
      repairedHtmlRevalidated: Boolean(diagnostics?.repairedHtmlRevalidated),
      successful: publishable && Boolean(diagnostics?.repairAttempted),
      plan: repairPlan || null,
    },
  };
}
