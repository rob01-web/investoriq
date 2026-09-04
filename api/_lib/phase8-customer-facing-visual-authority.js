import { applyPhase8AOwnerAcceptanceAuthority } from "./phase8a-owner-acceptance-authority.js";
import { applyPhase8BCrossProductPublicationAuthority } from "./phase8b-cross-product-publication-authority.js";

const PHASE8_MARKER = "elite-customer-facing-authority-v1";

function normalizeMode(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function resolveLane(reportMode = "") {
  const mode = normalizeMode(reportMode);
  if (["screening", "screening_v1", "screening_report"].includes(mode)) return "screening";
  if (
    mode === "v1_core" ||
    mode === "underwriting" ||
    mode === "underwriting_report" ||
    mode === "full_underwriting" ||
    mode.startsWith("full_underwriting_")
  ) return "underwriting";
  return null;
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[$,%]/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const n = finite(value);
    if (n !== null) return n;
  }
  return null;
}

function ratio(value) {
  const n = finite(value);
  if (n === null) return null;
  return Math.abs(n) > 1.5 ? n / 100 : n;
}

function money(value) {
  const n = finite(value);
  if (n === null) return null;
  const normalized = Object.is(n, -0) ? 0 : n;
  const absolute = Math.abs(Math.round(normalized)).toLocaleString("en-CA");
  return normalized < 0 ? `($${absolute})` : `$${absolute}`;
}

function percent(value, decimals = 1) {
  const n = ratio(value);
  if (n === null) return null;
  return `${(n * 100).toFixed(decimals)}%`;
}

function escapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function acceptedFacts(sourceTruthPackage, coreKey) {
  const facts = sourceTruthPackage?.core?.[coreKey]?.accepted_facts;
  return facts && typeof facts === "object" && !Array.isArray(facts) ? facts : {};
}

function canonicalCoreMetrics(sourceTruthPackage = null) {
  const t12 = acceptedFacts(sourceTruthPackage, "t12");
  const rr = acceptedFacts(sourceTruthPackage, "rent_roll");
  const totals = rr?.totals && typeof rr.totals === "object" ? rr.totals : {};
  const units = firstFinite(rr.total_units, totals.total_units);
  const occupied = firstFinite(rr.occupied_units, totals.occupied_units);
  const occupancy = ratio(firstFinite(rr.occupancy, totals.occupancy, rr.physical_occupancy)) ??
    (units && occupied !== null ? occupied / units : null);
  const annualInPlace = firstFinite(
    rr.total_in_place_annual,
    rr.total_annual_in_place,
    rr.annual_in_place_rent,
    rr.in_place_rent_annual,
    totals.in_place_rent_annual,
    totals.current_rent_annual
  );
  const annualMarket = firstFinite(
    rr.total_market_annual,
    rr.total_annual_market,
    rr.annual_market_rent,
    rr.market_rent_annual,
    totals.market_rent_annual
  );
  const egi = firstFinite(t12.effective_gross_income, t12.gross_income);
  const opex = firstFinite(t12.total_operating_expenses, t12.operating_expenses);
  const noi = firstFinite(t12.net_operating_income, t12.noi);
  const gpr = firstFinite(t12.gross_potential_rent, t12.gross_scheduled_rent);
  return {
    t12,
    rr,
    units,
    occupied,
    occupancy,
    annualInPlace,
    annualMarket,
    egi,
    opex,
    noi,
    gpr,
    expenseRatio: egi && opex !== null ? opex / egi : null,
    noiMargin: egi && noi !== null ? noi / egi : null,
    rentGapRatio: annualInPlace && annualMarket !== null ? (annualMarket - annualInPlace) / annualInPlace : null,
    reconciliationVariance: gpr && annualInPlace !== null ? (annualInPlace - gpr) / gpr : null,
  };
}

function metricRow(label, value) {
  if (value === null || value === undefined || value === "") return "";
  return `<tr><td>${escapeHtml(label)}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`;
}

function buildScreeningEvidenceSection(sourceTruthPackage = null) {
  if (!sourceTruthPackage || sourceTruthPackage.source !== "canonical_source_truth_package") return "";
  const m = canonicalCoreMetrics(sourceTruthPackage);
  const t12Rows = [
    metricRow("Gross Potential Rent", money(m.gpr)),
    metricRow("Effective Gross Income", money(m.egi)),
    metricRow("Operating Expenses", money(m.opex)),
    metricRow("Net Operating Income", money(m.noi)),
    metricRow("Expense Ratio", percent(m.expenseRatio)),
    metricRow("NOI Margin", percent(m.noiMargin)),
  ].filter(Boolean).join("");
  const rrRows = [
    metricRow("Units", m.units !== null ? String(Math.round(m.units)) : null),
    metricRow("Occupied Units", m.occupied !== null ? String(Math.round(m.occupied)) : null),
    metricRow("Occupancy", percent(m.occupancy)),
    metricRow("Annual In-Place Rent", money(m.annualInPlace)),
    metricRow("Annual Market Rent", money(m.annualMarket)),
    metricRow("Gross Rent Gap", percent(m.rentGapRatio)),
  ].filter(Boolean).join("");
  if (!t12Rows && !rrRows) return "";

  const reconciliationSupported = m.gpr !== null && m.annualInPlace !== null && m.gpr > 0;
  const reconciliationMaterial = reconciliationSupported && Math.abs(m.reconciliationVariance) >= 0.05;
  const reconciliationHtml = reconciliationSupported
    ? `<div class="phase8-reconciliation-card card no-break"><p class="subsection-title">Source Reconciliation</p><table><tbody>${metricRow("T12 Gross Potential Rent", money(m.gpr))}${metricRow("Rent Roll Annual In-Place Rent", money(m.annualInPlace))}${metricRow("Rent Roll less T12", money(m.annualInPlace - m.gpr))}${metricRow("Variance", percent(m.reconciliationVariance, 2))}</tbody></table><p class="small">${reconciliationMaterial ? "The income-scale variance is material and remains a diligence item. InvestorIQ does not infer the cause." : "The two core income scales are within the screening reconciliation tolerance."}</p></div>`
    : "";

  const priorities = [];
  if (reconciliationMaterial) priorities.push("Reconcile the rent roll income scale to the T12 before relying on variance-sensitive conclusions.");
  if (m.rentGapRatio !== null && m.rentGapRatio > 0.05) priorities.push("Validate documented market rents and the practical path from in-place rent to market rent.");
  if (m.expenseRatio !== null && m.expenseRatio >= 0.55) priorities.push("Review the largest operating-expense drivers and their controllability.");
  if (m.occupancy !== null && m.occupancy < 0.95) priorities.push("Review vacancy, turnover, and leasing drivers before deeper underwriting.");
  if (priorities.length === 0) priorities.push("Confirm the latest T12 and rent roll remain current before advancing to full underwriting.");
  const priorityHtml = priorities.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const t12Name = sourceTruthPackage?.core?.t12?.original_filename || "T12 operating statement";
  const rrName = sourceTruthPackage?.core?.rent_roll?.original_filename || "Rent roll";

  return `<section class="section page-break phase8-screening-evidence" data-iq-phase8-section="screening-operating-evidence"><div class="section-header"><span class="section-header-eyebrow">Decision Evidence</span><span class="section-header-title">Operating Evidence &amp; Diligence Priorities</span><span class="section-header-sub">Source-bound operating facts used to decide whether deeper underwriting is warranted</span></div><div class="grid-2-balanced"><div class="card no-break"><p class="subsection-title">T12 Operating Evidence</p><table><tbody>${t12Rows}</tbody></table><p class="small">Source: ${escapeHtml(t12Name)}</p></div><div class="card no-break"><p class="subsection-title">Rent Roll Evidence</p><table><tbody>${rrRows}</tbody></table><p class="small">Source: ${escapeHtml(rrName)}</p></div></div>${reconciliationHtml}<div class="card no-break phase8-diligence-card"><p class="subsection-title">Diligence Priorities</p><ul>${priorityHtml}</ul><p class="small">Screening identifies operating signals and evidence gaps. Financing, valuation, and return modeling remain outside this report unless separately authorized in the appropriate product.</p></div></section>`;
}

function injectScreeningEvidence(html = "", sourceTruthPackage = null) {
  const evidence = buildScreeningEvidenceSection(sourceTruthPackage);
  if (!evidence || String(html).includes('data-iq-phase8-section="screening-operating-evidence"')) return String(html || "");
  if (String(html).includes("<!-- END SECTION_0_5 -->")) {
    return String(html).replace("<!-- END SECTION_0_5 -->", `<!-- END SECTION_0_5 -->\n${evidence}`);
  }
  return String(html || "");
}

function releaseScreeningMethodologyPageBreak(html = "") {
  return String(html || "").replace(
    /<section class="section page-break">(\s*<div class="section-header">[\s\S]*?<span[^>]*class="section-header-title">Methodology &amp; Data Transparency<\/span>)/i,
    '<section class="section phase8-methodology-compact">$1'
  );
}

function sanitizeVisibleText(text = "", lane = null) {
  let out = String(text || "")
    .replace(/[\u2013\u2014]/g, " - ")
    .replace(/&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/gi, " - ")
    .replace(/\s+-\s+-\s+/g, " - ")
    .replace(/\bgoverned deterministic framework\b/gi, "source-bound analysis framework")
    .replace(/\bdeterministic calculation framework\b/gi, "source-bound calculation framework")
    .replace(/\bparser\b/gi, "source processing")
    .replace(/\bLLM\b/gi, "automated analysis")
    .replace(/\bAI\b/g, "automated analysis")
    .replace(/\bprompt\b/gi, "instruction")
    .replace(/\bworker\b/gi, "processing service")
    .replace(/\bruntime\b/gi, "processing")
    .replace(/\bdatabase\b/gi, "system")
    .replace(/stack trace/gi, "technical detail");
  if (lane === "underwriting") {
    out = out.replace(/InvestorIQ Investment Committee Memorandum/gi, "InvestorIQ Underwriting Report");
  }
  return out.replace(/[ \t]{2,}/g, " ");
}

function sanitizeVisibleMarkup(html = "", lane = null) {
  return String(html || "")
    .split(/(<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>|<[^>]+>)/gi)
    .map((part) => /^</.test(part) ? part : sanitizeVisibleText(part, lane))
    .join("");
}

function visibleText(html = "") {
  return String(html || "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function assertCustomerSurface(html = "", lane = null, sourceTruthPackage = null) {
  const text = visibleText(html);
  const violations = [];
  if (/[\u2013\u2014]/.test(text) || /&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/i.test(text)) violations.push("customer_dash_punctuation");
  if (/\b(?:AI|LLM|parser|prompt|worker|runtime|database)\b|stack trace/i.test(text)) violations.push("internal_technical_language");
  if (lane === "screening" && /Capital Intelligence Memorandum/i.test(text)) violations.push("legacy_screening_identity");
  if (lane === "screening" && /\b(?:DSCR|LTV|debt yield|financing|purchase price|valuation|appraisal|IRR|cash-on-cash|equity multiple)\b/i.test(text)) {
    violations.push("underwriting_semantic_leakage");
  }
  if (lane === "underwriting" && /InvestorIQ Investment Committee Memorandum/i.test(text)) violations.push("legacy_underwriting_identity");

  if (lane === "underwriting" && sourceTruthPackage?.source === "canonical_source_truth_package") {
    const m = canonicalCoreMetrics(sourceTruthPackage);
    const match = String(html).match(/Rent Roll Annual In-Place Rent<\/td>\s*<td[^>]*>\s*(?:<strong>)?\$([0-9,]+)/i);
    if (match && m.annualInPlace !== null) {
      const rendered = finite(match[1]);
      if (rendered !== null && Math.abs(rendered - m.annualInPlace) > Math.max(100, Math.abs(m.annualInPlace) * 0.02)) {
        violations.push("reconciliation_surface_not_canonical");
      }
    }
  }

  if (violations.length > 0) {
    const error = new Error(`PHASE8_CUSTOMER_SURFACE_AUTHORITY_FAILED:${violations.join(",")}`);
    error.code = "REPORT_GENERATION_FAILED";
    error.context = { lane, violations };
    throw error;
  }
}

function addPhase8BodyMarker(html = "", lane = null) {
  if (!lane) return String(html || "");
  return String(html || "").replace(/<body\b([^>]*)>/i, (_match, attrs = "") => {
    let next = String(attrs || "");
    const wanted = ["iq-phase8", `iq-phase8-${lane}`];
    const classMatch = next.match(/\bclass\s*=\s*(["'])([^"']*)\1/i);
    if (classMatch) {
      const classes = [...new Set([...classMatch[2].split(/\s+/).filter(Boolean), ...wanted])].join(" ");
      next = next.replace(classMatch[0], `class=${classMatch[1]}${classes}${classMatch[1]}`);
    } else {
      next += ` class="${wanted.join(" ")}"`;
    }
    if (/\bdata-iq-phase8\s*=/i.test(next)) {
      next = next.replace(/\bdata-iq-phase8\s*=\s*(["'])[^"']*\1/i, `data-iq-phase8="${PHASE8_MARKER}"`);
    } else {
      next += ` data-iq-phase8="${PHASE8_MARKER}"`;
    }
    return `<body${next}>`;
  });
}

const PHASE8_STYLE = `<style id="investoriq-phase8-customer-facing-authority">
.iq-phase8 { --iq8-forest:#10291d; --iq8-gold:#b8953f; --iq8-paper:#f8f6ef; --iq8-rule:#ded9cd; }
.iq-phase8-screening .cover-wrap { background:linear-gradient(145deg,#fbfaf6 0%,#f3f0e6 100%) !important; border-top:10px solid var(--iq8-forest); color:var(--iq8-forest) !important; }
.iq-phase8-screening .cover-brand-name,.iq-phase8-screening .cover-prop-name,.iq-phase8-screening .cover-verdict-value,.iq-phase8-screening .cover-report-type,.iq-phase8-screening .cover-title { color:var(--iq8-forest) !important; }
.iq-phase8-screening .cover-brand-sub,.iq-phase8-screening .cover-prop-address,.iq-phase8-screening .cover-meta,.iq-phase8-screening .cover-verdict-label { color:#526057 !important; }
.iq-phase8-screening .cover-divider { background:var(--iq8-gold) !important; }
.iq-phase8-screening .cover-wrap::after { border-color:rgba(184,149,63,.30) !important; }
.iq-phase8-screening .phase8-screening-evidence { padding-top:16px; padding-bottom:14px; }
.iq-phase8-screening .phase8-screening-evidence .section-header { margin-bottom:12px; }
.iq-phase8-screening .phase8-screening-evidence .card { padding:10px 12px; }
.iq-phase8-screening .phase8-screening-evidence table { margin-top:6px; }
.iq-phase8-screening .phase8-reconciliation-card { margin-top:10px; border-left:3px solid var(--iq8-gold); }
.iq-phase8-screening .phase8-diligence-card { margin-top:10px; background:var(--iq8-paper); }
.iq-phase8-screening .phase8-methodology-compact { padding-top:10px; padding-bottom:4px; }
.iq-phase8-screening .phase8-methodology-compact .section-header { margin-bottom:7px; padding-bottom:7px; }
.iq-phase8-screening .phase8-methodology-compact .methodology-section p { margin:2px 0 6px !important; line-height:1.38; }
.iq-phase8-screening .phase8-methodology-compact .methodology-section h3 { margin:7px 0 2px !important; font-size:14px; line-height:1.18; }
.iq-phase8-underwriting .subsection-title { letter-spacing:.085em !important; }
.iq-phase8-underwriting .section-header-sub { letter-spacing:0 !important; }
.iq-phase8-underwriting .institutional-eyebrow,.iq-phase8-underwriting .section-header-eyebrow { letter-spacing:.10em !important; }
.iq-phase8-underwriting #quality-manifest-title { margin-top:4px; }
@media print {
  .iq-phase8-screening .phase8-screening-evidence .card { break-inside:avoid; page-break-inside:avoid; }
  .iq-phase8-screening .phase8-methodology-compact { break-before:page !important; page-break-before:always !important; }
  .iq-phase8-screening .report-footer { display:none !important; }
}
</style>`;

function injectStyle(html = "") {
  const source = String(html || "");
  if (source.includes('id="investoriq-phase8-customer-facing-authority"')) return source;
  return /<\/head>/i.test(source) ? source.replace(/<\/head>/i, `${PHASE8_STYLE}\n</head>`) : `${PHASE8_STYLE}${source}`;
}

export function applyPhase8CustomerFacingVisualAuthority(html, { reportMode = null, sourceTruthPackage = null } = {}) {
  const lane = resolveLane(reportMode);
  let source = String(html || "");
  if (!lane || !source) return source;
  if (lane === "screening") {
    source = injectScreeningEvidence(source, sourceTruthPackage);
    source = releaseScreeningMethodologyPageBreak(source);
  }
  source = sanitizeVisibleMarkup(source, lane);
  source = injectStyle(addPhase8BodyMarker(source, lane));
  source = applyPhase8AOwnerAcceptanceAuthority(source, { lane, sourceTruthPackage });
  source = applyPhase8BCrossProductPublicationAuthority(source, { lane, sourceTruthPackage });
  assertCustomerSurface(source, lane, sourceTruthPackage);
  return source;
}

export function phase8CustomerFacingAuthorityMetadata(reportMode = null) {
  return {
    marker: PHASE8_MARKER,
    lane: resolveLane(reportMode),
    sourceTruthRequiredForNewFacts: true,
    addsUnsupportedFinancialMetrics: false,
    hardcodedPageCount: false,
    customerDashPunctuationAllowed: false,
    internalTechnicalLanguageAllowed: false,
  };
}
