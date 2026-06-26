import { formatMultiple } from "./report-formatting-helpers.js";
import { buildCurrentDebtAssessmentState } from "./report-surface-contracts.js";

export function buildAssumptionAttributionState({
  sourceProvided = false,
  userProvided = false,
  frameworkProvided = false,
} = {}) {
  const attribution = sourceProvided
    ? "document_derived"
    : userProvided
    ? "user_provided"
    : frameworkProvided
    ? "standardized_framework"
    : "unavailable";
  return {
    attribution,
    attribution_label: formatAssumptionAttributionLabel(attribution),
  };
}

export function formatAssumptionAttributionLabel(value) {
  switch (String(value || "").trim().toLowerCase()) {
    case "document_derived":
      return "document-derived";
    case "user_provided":
      return "user-provided";
    case "standardized_framework":
      return "standardized framework assumption";
    case "unavailable":
    default:
      return "unavailable";
  }
}

export function formatCurrentDebtAssessmentCopy({
  currentDebtState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  t12Noi = null,
} = {}) {
  const state =
    currentDebtState ||
    buildCurrentDebtAssessmentState({
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Noi,
    });
  if (state?.current_debt_dscr_status === "computed" && Number.isFinite(state?.current_debt_dscr)) {
    return {
      value: formatMultiple(state.current_debt_dscr, 2),
      explanation: "Current debt DSCR computed from verified current debt balance and debt service.",
      band: "Verified current debt balance and debt service",
      detail: "Current debt DSCR is assessed from verified current debt balance and debt service.",
    };
  }
  const baseText =
    "Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.";
  switch (state?.current_debt_limitation_reason_code) {
    case "acquisition_only_not_current_debt":
      return {
        value: "Not assessed - no current debt document",
        explanation: `Proposed acquisition financing is shown separately and is not treated as current outstanding debt. ${baseText}`,
        band: "Proposed acquisition financing is not current outstanding debt",
        detail: "Proposed acquisition financing is shown separately and is not treated as current outstanding debt.",
      };
    case "no_current_outstanding_balance":
      return {
        value: "Not assessed - no verified current debt balance",
        explanation: baseText,
        band: "Current debt balance not provided",
        detail: baseText,
      };
    case "incomplete_current_debt_terms":
      return {
        value: "Not assessed - incomplete current debt terms",
        explanation: "Current debt terms were not fully provided. " + baseText,
        band: "Current debt balance, rate, and amortization not fully provided",
        detail: "Current debt terms were not fully provided.",
      };
    case "no_current_debt_document":
    default:
      return {
        value: "Not assessed - no current debt document",
        explanation: "No current debt document provided. " + baseText,
        band: "No current debt document provided",
        detail: "No current debt document provided.",
      };
  }
}
