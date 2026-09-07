import {
  renderFullUnderwritingChapter1EliteHtml as renderBaseChapter1Html,
  executiveDecisionState as baseExecutiveDecisionState,
} from "./full-underwriting-chapter1-elite-renderer-base.js";

export function executiveDecisionState(primary = null) {
  if (String(primary?.code || "") === "PRIMARY_SOURCE_RECONCILIATION_REQUIRED") {
    return "SOURCE DIFFERENCE REQUIRES REVIEW";
  }
  return baseExecutiveDecisionState(primary);
}

function polishExecutiveSourceLanguage(html = "") {
  return String(html || "")
    .replace(/RECONCILIATION REQUIRED/g, "SOURCE DIFFERENCE REQUIRES REVIEW")
    .replace(/Primary source reconciliation required/gi, "Source difference requires review")
    .replace(/Primary Source Reconciliation Alert/gi, "Source Difference Review")
    .replace(/Source Reconciliation Required/gi, "Source Difference Requires Review")
    .replace(/\bLIGHT VALUE-ADD HOLD\b/gi, "LIGHT VALUE-ADD");
}

export function renderFullUnderwritingChapter1EliteHtml(contract = null) {
  return polishExecutiveSourceLanguage(renderBaseChapter1Html(contract));
}

export default renderFullUnderwritingChapter1EliteHtml;
