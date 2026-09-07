import { applyPhase7EliteReportPresentation } from "./phase7-elite-report-presentation.js";
import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";
import { applyPhase8CustomerFacingVisualAuthority } from "./phase8-customer-facing-visual-authority.js";
import { applyInvestorIqFinalHumanPublicationAuthority } from "./investoriq-final-human-publication-authority.js";

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
    .replace(/\bnot ROI,\s*IRR,\s*or a value-creation forecast\b/gi, "not a return metric or a value-creation forecast")
    .replace(/\bELITE-\d+(?:\s+v\d+)?\b/gi, "analysis")
    .replace(/\bcanonical source truth(?: package)?\b/gi, "accepted source evidence")
    .replace(/\bcanonical\b/gi, "accepted")
    .replace(/\bgoverned\b/gi, "verified")
    .replace(/\bsource-backed\b/gi, "source-supported")
    .replace(/\bsource_backed\b/gi, "source-supported")
    .replace(/\bdisplay-ready\b/gi, "available")
    .replace(/\bversioned\b/gi, "defined")
    .replace(/\bdeterministic calculations?\b/gi, "calculated results")
    .replace(/\bdeterministic\b/gi, "calculated")
    .replace(/\braw parser\b/gi, "source processing")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/;\s*;/g, ";")
    .replace(/[ \t]{2,}/g, " ");
}

function collapseDuplicateCapRateWrapper(html = "") {
  return String(html || "").replace(
    /<section\s+class="section">\s*<div\s+class="section-header">\s*<span\s+class="section-header-title">Cap-Rate Value Indication<\/span>\s*<\/div>\s*(<section\s+class="section section-break">\s*<div\s+class="section-header">\s*<span\s+class="section-header-title">Cap-Rate Value Indication<\/span>[\s\S]*?<\/section>)\s*<\/section>/i,
    "$1"
  );
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

function plainText(markup = "") {
  return String(markup || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function dedupeRepeatedBoundaryNotes(html = "") {
  const seen = new Set();
  return String(html || "").replace(
    /<p\s+class="footer-note(?:\s+[^"]*)?"[^>]*>[\s\S]*?<\/p>/gi,
    (paragraph) => {
      const normalized = plainText(paragraph);
      if (normalized.length < 60) return paragraph;
      if (!/(scenario|source evidence|accepted inputs|calculated|publication record|not a forecast|not a lender|does not infer|source facts)/i.test(normalized)) {
        return paragraph;
      }
      if (seen.has(normalized)) return "";
      seen.add(normalized);
      return paragraph;
    }
  );
}

export function polishFullUnderwritingFinalHtml(html, { reportMode = null, sourceTruthPackage = null } = {}) {
  const source = String(html || "");
  if (!isFullUnderwritingMode(reportMode)) return source;

  const duplicateWrapperCollapsed = collapseDuplicateCapRateWrapper(source);
  const paginationReleased = releaseMethodologyPagination(duplicateWrapperCollapsed);
  const elitePresented = applyPhase7EliteReportPresentation(paginationReleased, { reportMode });
  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });
  const legacySanitized = decisionSupported
    .split(/(<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>)/gi)
    .map((part) => (/^<(?:style|script)\b/i.test(part) ? part : sanitizeMarkupText(part)))
    .join("");
  const deduped = dedupeRepeatedBoundaryNotes(legacySanitized);
  const phase8Html = applyPhase8CustomerFacingVisualAuthority(deduped, { reportMode, sourceTruthPackage });
  return applyInvestorIqFinalHumanPublicationAuthority(phase8Html, {
    lane: "underwriting",
    sourceTruthPackage,
  });
}
