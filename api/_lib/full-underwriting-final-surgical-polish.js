import { applyPhase7EliteReportPresentation } from "./phase7-elite-report-presentation.js";
import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";

function isFullUnderwritingMode(value = "") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "v1_core" || normalized === "underwriting" || normalized === "full_underwriting" || normalized.startsWith("full_underwriting_");
}

function polishCustomerText(value = "") {
  const RANGE_SENTINEL = "__IQ_SOURCE_RANGE__";
  return String(value || "")
    .replace(/(\$?\d[\d,.%]*)\s*(?:&ndash;|&#8211;|&#x2013;|\u2013)\s*(\$?\d[\d,.%]*)/gi, "$1-$2")
    .replace(/\s*(?:&mdash;|&#8212;|&#x2014;|\u2014)\s*/gi, "; ")
    .replace(/\s*(?:&ndash;|&#8211;|&#x2013;|\u2013)\s*/gi, "; ")
    .replace(/(\$?\d[\d,.%]*)\s+-\s+(\$?\d[\d,.%]*)/g, `$1${RANGE_SENTINEL}$2`)
    .replace(/\s+-\s+/g, ": ")
    .replace(new RegExp(RANGE_SENTINEL, "g"), " - ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/;\s*;/g, ";");
}

function releaseMethodologyPagination(html = "") {
  return String(html || "").replace(
    /<section class="section section-break">(\s*<div class="section-header"><span[^>]*class="section-header-title">Methodology &amp; Data Transparency<\/span>)/i,
    '<section class="section">$1'
  );
}

function sanitizeMarkupText(markup = "") {
  return String(markup || "")
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith("<") ? part : polishCustomerText(part)))
    .join("");
}

export function polishFullUnderwritingFinalHtml(html, { reportMode = null } = {}) {
  const source = String(html || "");
  if (!isFullUnderwritingMode(reportMode)) return source;

  const paginationReleased = releaseMethodologyPagination(source);
  const elitePresented = applyPhase7EliteReportPresentation(paginationReleased, { reportMode });
  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });
  return decisionSupported
    .split(/(<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>)/gi)
    .map((part) => (/^<(?:style|script)\b/i.test(part) ? part : sanitizeMarkupText(part)))
    .join("");
}