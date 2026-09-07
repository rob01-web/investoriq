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
    .replace(/Source Reconciliation Required/gi, "Source Difference Requires Review");
}

function removeDuplicateExecutiveSourceDifferenceReview(html = "") {
  return String(html || "").replace(
    /<section\s+class="section"\s+data-iq-elite-section="sourceReconciliationAlert"[\s\S]*?<\/section>/i,
    ""
  );
}

export function renderFullUnderwritingChapter1EliteHtml(contract = null) {
  const polished = polishExecutiveSourceLanguage(renderBaseChapter1Html(contract));
  return removeDuplicateExecutiveSourceDifferenceReview(polished);
}

export default renderFullUnderwritingChapter1EliteHtml;
