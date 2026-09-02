import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function write(rel, content) {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

function replaceExact(rel, before, after, { count = 1 } = {}) {
  const source = read(rel);
  const hits = source.split(before).length - 1;
  if (hits !== count) {
    throw new Error(`PHASE8_PATCH_SEAM_MISMATCH:${rel}:expected=${count}:actual=${hits}:needle=${before.slice(0, 120)}`);
  }
  write(rel, source.split(before).join(after));
}

function replaceAllExact(rel, before, after, { min = 1 } = {}) {
  const source = read(rel);
  const hits = source.split(before).length - 1;
  if (hits < min) {
    throw new Error(`PHASE8_PATCH_SEAM_MISSING:${rel}:actual=${hits}:needle=${before.slice(0, 120)}`);
  }
  write(rel, source.split(before).join(after));
}

// ---------------------------------------------------------------------------
// 1. Canonical rent-roll reconciliation authority.
// Partial row excerpts must never outrank a property-wide annual total.
// Also recognize the canonical total_annual_* aliases used elsewhere.
// ---------------------------------------------------------------------------
const contracts = "api/_lib/report-surface-contracts.js";
replaceExact(
  contracts,
  `  const rowCoveragePartial =\n    Number.isFinite(totalUnits) &&\n    totalUnits > 0 &&\n    representedUnitCount > 0 &&\n    representedUnitCount < totalUnits;`,
  `  const rowCoveragePartial =\n    Number.isFinite(totalUnits) &&\n    totalUnits > 0 &&\n    representedUnitCount > 0 &&\n    representedUnitCount < totalUnits;\n  const propertyWidePartialSignal =\n    payloadPartialSignal ||\n    rowCoveragePartial ||\n    sampleOrExcerptSignal ||\n    explicitControllingSummarySignal;`
);

replaceExact(
  contracts,
  `      value: metricKey === "market"\n        ? rentRollPayload?.total_market_annual\n        : rentRollPayload?.total_in_place_annual,\n      source_path: metricKey === "market"\n        ? "rentRollPayload.total_market_annual"\n        : "rentRollPayload.total_in_place_annual",`,
  `      value: metricKey === "market"\n        ? rentRollPayload?.total_market_annual ?? rentRollPayload?.total_annual_market ?? rentRollPayload?.annual_market_rent\n        : rentRollPayload?.total_in_place_annual ?? rentRollPayload?.total_annual_in_place ?? rentRollPayload?.annual_in_place_rent,\n      source_path: metricKey === "market"\n        ? (rentRollPayload?.total_market_annual != null ? "rentRollPayload.total_market_annual" : rentRollPayload?.total_annual_market != null ? "rentRollPayload.total_annual_market" : "rentRollPayload.annual_market_rent")\n        : (rentRollPayload?.total_in_place_annual != null ? "rentRollPayload.total_in_place_annual" : rentRollPayload?.total_annual_in_place != null ? "rentRollPayload.total_annual_in_place" : "rentRollPayload.annual_in_place_rent"),`
);

replaceExact(
  contracts,
  `      value: metricKey === "market"\n        ? computedRentRoll?.total_market_annual\n        : computedRentRoll?.total_in_place_annual,\n      source_path: metricKey === "market"\n        ? "computedRentRoll.total_market_annual"\n        : "computedRentRoll.total_in_place_annual",`,
  `      value: metricKey === "market"\n        ? computedRentRoll?.total_market_annual ?? computedRentRoll?.total_annual_market ?? computedRentRoll?.annual_market_rent\n        : computedRentRoll?.total_in_place_annual ?? computedRentRoll?.total_annual_in_place ?? computedRentRoll?.annual_in_place_rent,\n      source_path: metricKey === "market"\n        ? (computedRentRoll?.total_market_annual != null ? "computedRentRoll.total_market_annual" : computedRentRoll?.total_annual_market != null ? "computedRentRoll.total_annual_market" : "computedRentRoll.annual_market_rent")\n        : (computedRentRoll?.total_in_place_annual != null ? "computedRentRoll.total_in_place_annual" : computedRentRoll?.total_annual_in_place != null ? "computedRentRoll.total_annual_in_place" : "computedRentRoll.annual_in_place_rent"),`
);

replaceExact(
  contracts,
  `    const coherent =\n      (preferTrustedSummaryAuthority && (candidate.kind === "summary_annual" || candidate.kind === "summary_monthly")) ||\n      matchesReferences.length > 0 ||\n      ((!(Number.isFinite(rowAnnual) && rowAnnual > 0)) && (!(Number.isFinite(weightedAnnual) && weightedAnnual > 0)));`,
  `    const propertyWideCandidate = ["summary_annual", "summary_monthly", "payload_total_annual", "computed_total_annual"].includes(candidate.kind);\n    const coherent =\n      (preferTrustedSummaryAuthority && (candidate.kind === "summary_annual" || candidate.kind === "summary_monthly")) ||\n      (propertyWidePartialSignal && propertyWideCandidate) ||\n      matchesReferences.length > 0 ||\n      ((!(Number.isFinite(rowAnnual) && rowAnnual > 0)) && (!(Number.isFinite(weightedAnnual) && weightedAnnual > 0)));`
);

replaceExact(
  contracts,
  `  const preferenceOrder = preferTrustedSummaryAuthority\n    ? new Map([\n        ["summary_annual", 0],\n        ["summary_monthly", 1],\n        ["row_derived_annual", 2],\n        ["weighted_avg_implied_annual", 3],\n        ["payload_total_annual", 4],\n        ["computed_total_annual", 5],\n      ])`,
  `  const preferPropertyWideAuthority = preferTrustedSummaryAuthority || propertyWidePartialSignal;\n  const preferenceOrder = preferPropertyWideAuthority\n    ? new Map([\n        ["summary_annual", 0],\n        ["summary_monthly", 1],\n        ["payload_total_annual", 2],\n        ["computed_total_annual", 3],\n        ["row_derived_annual", 4],\n        ["weighted_avg_implied_annual", 5],\n      ])`
);

// Keep the Phase 7 visual-authority fixture internally consistent with its
// canonical accepted rent-roll artifact. The previous overlay used a different
// summary total while inheriting only three diagnostic rows.
replaceAllExact(
  "tests/qa/generate-client-report-rent-roll-smoke.js",
  `        total_annual_in_place: 1000000,\n        total_annual_market: 1100800,`,
  `        total_annual_in_place: 1036800,\n        total_annual_market: 1137600,`,
  { min: 2 }
);

// ---------------------------------------------------------------------------
// 2. Shared Phase 8 customer-facing authority.
// ---------------------------------------------------------------------------
write("api/_lib/phase8-customer-facing-visual-authority.js", `const PHASE8_MARKER = "elite-customer-facing-authority-v1";

function normalizeMode(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[\\s-]+/g, "_");
}

function resolveLane(reportMode = "") {
  const mode = normalizeMode(reportMode);
  if (mode === "screening" || mode === "screening_v1" || mode === "screening_report") return "screening";
  if (mode === "v1_core" || mode === "underwriting" || mode === "underwriting_report" || mode === "full_underwriting" || mode.startsWith("full_underwriting_")) return "underwriting";
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
  return \\`$\${Math.round(n).toLocaleString("en-CA")}\\`;
}

function percent(value, decimals = 1) {
  const n = ratio(value);
  if (n === null) return null;
  return \\`\${(n * 100).toFixed(decimals)}%\\`;
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
  return \\`<tr><td>\${escapeHtml(label)}</td><td><strong>\${escapeHtml(value)}</strong></td></tr>\\`;
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
    ? \\`<div class="phase8-reconciliation-card card no-break"><p class="subsection-title">Source Reconciliation</p><table><tbody>\${metricRow("T12 Gross Potential Rent", money(m.gpr))}\${metricRow("Rent Roll Annual In-Place Rent", money(m.annualInPlace))}\${metricRow("Rent Roll less T12", money(m.annualInPlace - m.gpr))}\${metricRow("Variance", percent(m.reconciliationVariance, 2))}</tbody></table><p class="small">\${reconciliationMaterial ? "The income-scale variance is material and remains a diligence item. InvestorIQ does not infer the cause." : "The two core income scales are within the screening reconciliation tolerance."}</p></div>\\`
    : "";

  const priorities = [];
  if (reconciliationMaterial) priorities.push("Reconcile the rent roll income scale to the T12 before relying on variance-sensitive conclusions.");
  if (m.rentGapRatio !== null && m.rentGapRatio > 0.05) priorities.push("Validate documented market rents and the practical path from in-place rent to market rent.");
  if (m.expenseRatio !== null && m.expenseRatio >= 0.55) priorities.push("Review the largest operating-expense drivers and their controllability.");
  if (m.occupancy !== null && m.occupancy < 0.95) priorities.push("Review vacancy, turnover, and leasing drivers before deeper underwriting.");
  if (priorities.length === 0) priorities.push("Confirm the latest T12 and rent roll remain current before advancing to full underwriting.");
  const priorityHtml = priorities.slice(0, 4).map((item) => \\`<li>\${escapeHtml(item)}</li>\\`).join("");

  const t12Name = sourceTruthPackage?.core?.t12?.original_filename || "T12 operating statement";
  const rrName = sourceTruthPackage?.core?.rent_roll?.original_filename || "Rent roll";

  return \\`<section class="section page-break phase8-screening-evidence" data-iq-phase8-section="screening-operating-evidence"><div class="section-header"><span class="section-header-eyebrow">Decision Evidence</span><span class="section-header-title">Operating Evidence &amp; Diligence Priorities</span><span class="section-header-sub">Source-bound operating facts used to decide whether deeper underwriting is warranted</span></div><div class="grid-2-balanced"><div class="card no-break"><p class="subsection-title">T12 Operating Evidence</p><table><tbody>\${t12Rows}</tbody></table><p class="small">Source: \${escapeHtml(t12Name)}</p></div><div class="card no-break"><p class="subsection-title">Rent Roll Evidence</p><table><tbody>\${rrRows}</tbody></table><p class="small">Source: \${escapeHtml(rrName)}</p></div></div>\${reconciliationHtml}<div class="card no-break phase8-diligence-card"><p class="subsection-title">Diligence Priorities</p><ul>\${priorityHtml}</ul><p class="small">Screening identifies operating signals and evidence gaps. Financing, valuation, and return modeling remain outside this report unless separately authorized in the appropriate product.</p></div></section>\\`;
}

function injectScreeningEvidence(html = "", sourceTruthPackage = null) {
  const evidence = buildScreeningEvidenceSection(sourceTruthPackage);
  if (!evidence || String(html).includes('data-iq-phase8-section="screening-operating-evidence"')) return String(html || "");
  if (String(html).includes("<!-- END SECTION_0_5 -->")) {
    return String(html).replace("<!-- END SECTION_0_5 -->", \\`<!-- END SECTION_0_5 -->\\n\${evidence}\\`);
  }
  return String(html || "");
}

function releaseScreeningMethodologyPageBreak(html = "") {
  return String(html || "").replace(
    /<section class="section page-break">(\\s*<div class="section-header">[\\s\\S]*?<span[^>]*class="section-header-title">Methodology &amp; Data Transparency<\\/span>)/i,
    '<section class="section phase8-methodology-compact">$1'
  );
}

function sanitizeVisibleText(text = "", lane = null) {
  let out = String(text || "")
    .replace(/[\\u2013\\u2014]/g, " - ")
    .replace(/&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/gi, " - ")
    .replace(/\\s+-\\s+-\\s+/g, " - ")
    .replace(/\\bgoverned deterministic framework\\b/gi, "source-bound analysis framework")
    .replace(/\\bdeterministic calculation framework\\b/gi, "source-bound calculation framework")
    .replace(/\\bparser\\b/gi, "source processing")
    .replace(/\\bLLM\\b/gi, "automated analysis")
    .replace(/\\bAI\\b/g, "automated analysis")
    .replace(/\\bprompt\\b/gi, "instruction")
    .replace(/\\bworker\\b/gi, "processing service")
    .replace(/\\bruntime\\b/gi, "processing")
    .replace(/\\bdatabase\\b/gi, "system")
    .replace(/stack trace/gi, "technical detail");
  if (lane === "underwriting") {
    out = out.replace(/InvestorIQ Investment Committee Memorandum/gi, "InvestorIQ Underwriting Report");
  }
  return out.replace(/[ \\t]{2,}/g, " ");
}

function sanitizeVisibleMarkup(html = "", lane = null) {
  return String(html || "")
    .split(/(<style\\b[^>]*>[\\s\\S]*?<\\/style>|<script\\b[^>]*>[\\s\\S]*?<\\/script>|<[^>]+>)/gi)
    .map((part) => /^</.test(part) ? part : sanitizeVisibleText(part, lane))
    .join("");
}

function visibleText(html = "") {
  return String(html || "")
    .replace(/<style\\b[^>]*>[\\s\\S]*?<\\/style>/gi, " ")
    .replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\\s+/g, " ")
    .trim();
}

function assertCustomerSurface(html = "", lane = null, sourceTruthPackage = null) {
  const text = visibleText(html);
  const violations = [];
  if (/[\\u2013\\u2014]/.test(text) || /&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/i.test(text)) violations.push("customer_dash_punctuation");
  if (/\\b(?:AI|LLM|parser|prompt|worker|runtime|database)\\b|stack trace/i.test(text)) violations.push("internal_technical_language");
  if (lane === "screening" && /Capital Intelligence Memorandum/i.test(text)) violations.push("legacy_screening_identity");
  if (lane === "underwriting" && /InvestorIQ Investment Committee Memorandum/i.test(text)) violations.push("legacy_underwriting_identity");

  if (lane === "underwriting" && sourceTruthPackage?.source === "canonical_source_truth_package") {
    const m = canonicalCoreMetrics(sourceTruthPackage);
    const match = String(html).match(/Rent Roll Annual In-Place Rent<\\/td>\\s*<td[^>]*>\\s*(?:<strong>)?\\$([0-9,]+)/i);
    if (match && m.annualInPlace !== null) {
      const rendered = finite(match[1]);
      if (rendered !== null && Math.abs(rendered - m.annualInPlace) > Math.max(100, Math.abs(m.annualInPlace) * 0.02)) {
        violations.push("reconciliation_surface_not_canonical");
      }
    }
  }

  if (violations.length > 0) {
    const error = new Error(\\`PHASE8_CUSTOMER_SURFACE_AUTHORITY_FAILED:\${violations.join(",")}\\`);
    error.code = "REPORT_GENERATION_FAILED";
    error.context = { lane, violations };
    throw error;
  }
}

function addPhase8BodyMarker(html = "", lane = null) {
  if (!lane) return String(html || "");
  return String(html || "").replace(/<body\\b([^>]*)>/i, (_match, attrs = "") => {
    let next = String(attrs || "");
    const wanted = ["iq-phase8", \\`iq-phase8-\${lane}\\`];
    const classMatch = next.match(/\\bclass\\s*=\\s*(["'])([^"']*)\\1/i);
    if (classMatch) {
      const classes = [...new Set([...classMatch[2].split(/\\s+/).filter(Boolean), ...wanted])].join(" ");
      next = next.replace(classMatch[0], \\`class=\${classMatch[1]}\${classes}\${classMatch[1]}\\`);
    } else {
      next += \\` class="\${wanted.join(" ")}"\\`;
    }
    if (/\\bdata-iq-phase8\\s*=/i.test(next)) {
      next = next.replace(/\\bdata-iq-phase8\\s*=\\s*(["'])[^"']*\\1/i, \\`data-iq-phase8="\${PHASE8_MARKER}"\\`);
    } else {
      next += \\` data-iq-phase8="\${PHASE8_MARKER}"\\`;
    }
    return \\`<body\${next}>\\`;
  });
}

const PHASE8_STYLE = \\`<style id="investoriq-phase8-customer-facing-authority">
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
.iq-phase8-screening .phase8-methodology-compact { padding-top:12px; }
.iq-phase8-screening .phase8-methodology-compact .section-header { margin-bottom:10px; }
.iq-phase8-underwriting .subsection-title { letter-spacing:.085em !important; }
.iq-phase8-underwriting .section-header-sub { letter-spacing:0 !important; }
.iq-phase8-underwriting .institutional-eyebrow,.iq-phase8-underwriting .section-header-eyebrow { letter-spacing:.10em !important; }
.iq-phase8-underwriting #quality-manifest-title { margin-top:4px; }
@media print {
  .iq-phase8-screening .phase8-screening-evidence .card { break-inside:avoid; page-break-inside:avoid; }
  .iq-phase8-screening .phase8-methodology-compact { break-before:auto !important; page-break-before:auto !important; }
}
</style>\\`;

function injectStyle(html = "") {
  const source = String(html || "");
  if (source.includes('id="investoriq-phase8-customer-facing-authority"')) return source;
  return /<\\/head>/i.test(source) ? source.replace(/<\\/head>/i, \\`\${PHASE8_STYLE}\\n</head>\\`) : \\`\${PHASE8_STYLE}\${source}\\`;
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
\n`);

// ---------------------------------------------------------------------------
// 3. Wire Phase 8 into both final sealed customer lanes.
// ---------------------------------------------------------------------------
const screeningPipeline = "api/_lib/screening-report-pipeline.js";
replaceExact(
  screeningPipeline,
  `import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";`,
  `import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";\nimport { applyPhase8CustomerFacingVisualAuthority } from "./phase8-customer-facing-visual-authority.js";`
);
replaceExact(
  screeningPipeline,
  `  const decisionSupportHtml = applyPhase7DecisionSupport(presentationHtml, { reportMode });\n  return {\n    html: decisionSupportHtml,`,
  `  const decisionSupportHtml = applyPhase7DecisionSupport(presentationHtml, { reportMode });\n  const phase8Html = applyPhase8CustomerFacingVisualAuthority(decisionSupportHtml, {\n    reportMode,\n    sourceTruthPackage,\n  });\n  return {\n    html: phase8Html,`
);

const underwritingPolish = "api/_lib/full-underwriting-final-surgical-polish.js";
replaceExact(
  underwritingPolish,
  `import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";`,
  `import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";\nimport { applyPhase8CustomerFacingVisualAuthority } from "./phase8-customer-facing-visual-authority.js";`
);
replaceExact(
  underwritingPolish,
  `export function polishFullUnderwritingFinalHtml(html, { reportMode = null } = {}) {`,
  `export function polishFullUnderwritingFinalHtml(html, { reportMode = null, sourceTruthPackage = null } = {}) {`
);
replaceExact(
  underwritingPolish,
  `  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });\n  return decisionSupported\n    .split`,
  `  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });\n  const phase8Authorized = applyPhase8CustomerFacingVisualAuthority(decisionSupported, { reportMode, sourceTruthPackage });\n  return phase8Authorized\n    .split`
);

const orchestrator = "api/_lib/acquisition-memo-v2-orchestrator.js";
replaceExact(
  orchestrator,
  `    const baseHtml = polishFullUnderwritingFinalHtml(renderedHtml, {\n      reportMode: customerSurfaceModel?.reportMode || acquisitionMemoV2DocumentArgs?.reportMode || null,\n    });`,
  `    const baseHtml = polishFullUnderwritingFinalHtml(renderedHtml, {\n      reportMode: customerSurfaceModel?.reportMode || acquisitionMemoV2DocumentArgs?.reportMode || null,\n      sourceTruthPackage: acquisitionMemoV2DocumentArgs?.sourceTruthPackage || null,\n    });`
);

// ---------------------------------------------------------------------------
// 4. Focused Phase 8 regressions.
// ---------------------------------------------------------------------------
write("tests/qa/phase8-source-reconciliation-authority-smoke.js", `import assert from "node:assert/strict";
import { buildSourceReconciliationState, resolveCanonicalRentRollAnnualTotals } from "../../api/_lib/report-surface-contracts.js";

const computedRentRoll = {
  total_units: 48,
  total_annual_in_place: 1036800,
  total_annual_market: 1137600,
  units: [
    { unit: "101", status: "occupied", in_place_rent: 2100, market_rent: 2250 },
    { unit: "102", status: "occupied", in_place_rent: 2125, market_rent: 2275 },
    { unit: "201", status: "vacant", in_place_rent: 0, market_rent: 2300 },
  ],
};
const rentRollPayload = {
  total_units: 48,
  total_annual_in_place: 1036800,
  total_annual_market: 1137600,
};
const totals = resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
assert.equal(totals.in_place.value, 1036800);
assert.equal(totals.market.value, 1137600);
assert.notEqual(totals.in_place.value, 50700);
assert.match(totals.in_place.selected_reason, /payload_total_annual_selected|computed_total_annual_selected/);

const state = buildSourceReconciliationState({
  computedRentRoll,
  rentRollPayload,
  t12Payload: { gross_potential_rent: 1850000 },
});
assert.equal(state.rr_annual_in_place, 1036800);
assert.equal(state.t12_gpr, 1850000);
assert.equal(state.status, "source_reconciliation_required");
assert.ok(Math.abs(state.variance_pct - ((1036800 - 1850000) / 1850000)) < 1e-12);
console.log("phase8-source-reconciliation-authority-smoke: PASS");
`);

write("tests/qa/phase8-customer-facing-visual-authority-smoke.js", `import assert from "node:assert/strict";
import { applyPhase8CustomerFacingVisualAuthority, phase8CustomerFacingAuthorityMetadata } from "../../api/_lib/phase8-customer-facing-visual-authority.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  core: {
    t12: { original_filename: "T12.xlsx", accepted_facts: { gross_potential_rent: 1850000, effective_gross_income: 1100000, total_operating_expenses: 450000, net_operating_income: 650000 } },
    rent_roll: { original_filename: "Rent_Roll.xlsx", accepted_facts: { total_units: 48, occupied_units: 46, occupancy: 0.9583333333, total_in_place_annual: 1036800, total_market_annual: 1137600 } },
  },
};
const screeningInput = `<!DOCTYPE html><html><head></head><body class="iq-phase7 iq-phase7-screening"><section>Executive</section><!-- END SECTION_0_5 --><section class="section page-break"><div class="section-header"><span class="section-header-title">Methodology &amp; Data Transparency</span></div><p>governed deterministic framework &mdash; parser</p></section></body></html>`;
const screening = applyPhase8CustomerFacingVisualAuthority(screeningInput, { reportMode: "screening_v1", sourceTruthPackage });
assert.match(screening, /data-iq-phase8="elite-customer-facing-authority-v1"/);
assert.match(screening, /Operating Evidence &amp; Diligence Priorities/);
assert.match(screening, /Annual In-Place Rent[\\s\\S]{0,120}\\$1,036,800/);
assert.match(screening, /Source Reconciliation/);
assert.match(screening, /Rent Roll less T12/);
assert.match(screening, /phase8-methodology-compact/);
assert.match(screening, /iq-phase8-screening \.cover-wrap/);
const screeningVisible = screening.replace(/<style[\\s\\S]*?<\\/style>/gi, " ").replace(/<[^>]+>/g, " ");
assert.equal(/[\\u2013\\u2014]/.test(screeningVisible), false);
assert.equal(/&(?:ndash|mdash);/i.test(screeningVisible), false);
assert.equal(/\\bparser\\b/i.test(screeningVisible), false);
assert.equal(phase8CustomerFacingAuthorityMetadata("screening_v1").hardcodedPageCount, false);

const underwritingInput = `<!DOCTYPE html><html><head></head><body class="iq-phase7 iq-phase7-underwriting"><section>InvestorIQ Underwriting Report</section><table><tr><td>Rent Roll Annual In-Place Rent</td><td><strong>$1,036,800</strong></td></tr></table></body></html>`;
const underwriting = applyPhase8CustomerFacingVisualAuthority(underwritingInput, { reportMode: "v1_core", sourceTruthPackage });
assert.match(underwriting, /iq-phase8-underwriting/);
assert.equal(/Operating Evidence &amp; Diligence Priorities/.test(underwriting), false);
assert.doesNotThrow(() => applyPhase8CustomerFacingVisualAuthority(underwritingInput, { reportMode: "v1_core", sourceTruthPackage }));
const badUnderwriting = underwritingInput.replace("$1,036,800", "$50,700");
assert.throws(() => applyPhase8CustomerFacingVisualAuthority(badUnderwriting, { reportMode: "v1_core", sourceTruthPackage }), /reconciliation_surface_not_canonical/);
console.log("phase8-customer-facing-visual-authority-smoke: PASS");
`);

write("scripts/phase8-validate-visual-artifacts.js", `import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8-artifacts");
const screeningPath = path.join(dir, "phase7-screening-harbourstone.html");
const underwritingPath = path.join(dir, "phase7-underwriting-stonebridge.html");
for (const p of [screeningPath, underwritingPath]) if (!fs.existsSync(p)) throw new Error(\\`PHASE8_ARTIFACT_MISSING:\${p}\\`);
const screening = fs.readFileSync(screeningPath, "utf8");
const underwriting = fs.readFileSync(underwritingPath, "utf8");
const visible = (html) => String(html).replace(/<style[\\s\\S]*?<\\/style>/gi, " ").replace(/<script[\\s\\S]*?<\\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\\s+/g, " ").trim();

for (const [label, html] of [["screening", screening], ["underwriting", underwriting]]) {
  if (!/data-iq-phase8="elite-customer-facing-authority-v1"/i.test(html)) throw new Error(\\`PHASE8_MARKER_MISSING:\${label}\\`);
  const text = visible(html);
  if (/[\\u2013\\u2014]/.test(text) || /&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/i.test(text)) throw new Error(\\`PHASE8_CUSTOMER_DASH_FOUND:\${label}\\`);
  if (/\\b(?:AI|LLM|parser|prompt|worker|runtime|database)\\b|stack trace/i.test(text)) throw new Error(\\`PHASE8_INTERNAL_LANGUAGE_FOUND:\${label}\\`);
}
if (!/Operating Evidence &amp; Diligence Priorities/i.test(screening)) throw new Error("PHASE8_SCREENING_EVIDENCE_SECTION_MISSING");
if (!/Source Reconciliation/i.test(screening)) throw new Error("PHASE8_SCREENING_RECONCILIATION_MISSING");
if (!/Annual In-Place Rent[\\s\\S]{0,180}\\$1,036,800/i.test(screening)) throw new Error("PHASE8_SCREENING_CANONICAL_RENT_MISSING");
if (!/InvestorIQ Screening Report/i.test(visible(screening))) throw new Error("PHASE8_SCREENING_IDENTITY_MISSING");
if (/Capital Intelligence Memorandum/i.test(visible(screening))) throw new Error("PHASE8_LEGACY_SCREENING_IDENTITY_FOUND");
if (!/InvestorIQ Underwriting Report/i.test(visible(underwriting))) throw new Error("PHASE8_UNDERWRITING_IDENTITY_MISSING");
if (/Rent Roll Annual In-Place Rent[\\s\\S]{0,120}\\$50,700/i.test(underwriting)) throw new Error("PHASE8_UNDERWRITING_PARTIAL_ROWS_OVERRULED_TOTAL");
if (!/Rent Roll Annual In-Place Rent[\\s\\S]{0,160}\\$1,036,800/i.test(underwriting)) throw new Error("PHASE8_UNDERWRITING_RECONCILIATION_NOT_CANONICAL");
console.log("phase8-validate-visual-artifacts: PASS");
`);

write(".github/workflows/phase8-elite-customer-facing-certification.yml", `name: InvestorIQ Phase 8 Customer-Facing Certification

on:
  push:
    branches:
      - internal-phase8-elite-customer-facing-visual-authority-20260902
    paths:
      - 'api/_lib/report-surface-contracts.js'
      - 'api/_lib/phase8-customer-facing-visual-authority.js'
      - 'api/_lib/screening-report-pipeline.js'
      - 'api/_lib/full-underwriting-final-surgical-polish.js'
      - 'api/_lib/acquisition-memo-v2-orchestrator.js'
      - 'tests/qa/generate-client-report-rent-roll-smoke.js'
      - 'tests/qa/phase8-source-reconciliation-authority-smoke.js'
      - 'tests/qa/phase8-customer-facing-visual-authority-smoke.js'
      - 'scripts/phase8-validate-visual-artifacts.js'
      - '.github/workflows/phase8-elite-customer-facing-certification.yml'
  workflow_dispatch: {}

permissions:
  contents: read

concurrency:
  group: investoriq-phase8-customer-facing-${{ github.ref }}
  cancel-in-progress: true

jobs:
  certify:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - name: Install locked dependencies
        run: npm ci
      - name: Phase 8 source-reconciliation authority
        run: node tests/qa/phase8-source-reconciliation-authority-smoke.js
      - name: Phase 8 customer-facing authority
        run: node tests/qa/phase8-customer-facing-visual-authority-smoke.js
      - name: Phase 7 design authority regression
        run: node tests/qa/phase7-elite-report-design-contract-smoke.js
      - name: Phase 7 decision-support regression
        run: node tests/qa/phase7-decision-support-smoke.js
      - name: Screening sealed-lane regression
        run: node tests/qa/screening-report-sealed-lane-authority-smoke.js
      - name: Screening report regression
        run: node tests/qa/screening-report-smoke.js
      - name: Underwriting final-polish regression
        run: node tests/qa/full-underwriting-final-surgical-polish-smoke.js
      - name: Production build
        run: npm run build
      - name: Generate current-branch authoritative HTML artifacts
        env:
          PHASE7_ARTIFACT_DIR: phase8-artifacts
        run: node scripts/phase7-generate-visual-artifacts.js
      - name: Validate Phase 8 artifact authority
        env:
          PHASE8_ARTIFACT_DIR: phase8-artifacts
        run: node scripts/phase8-validate-visual-artifacts.js
      - name: Render authoritative PDFs in headless Chrome
        shell: bash
        run: |
          set -euo pipefail
          CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)"
          test -n "$CHROME"
          for html in phase8-artifacts/*.html; do
            pdf="${html%.html}.pdf"
            "$CHROME" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --no-pdf-header-footer --print-to-pdf="$pdf" "file://$(realpath "$html")"
            test -s "$pdf"
          done
          ls -lh phase8-artifacts
      - name: Upload Phase 8 visual certification artifacts
        uses: actions/upload-artifact@v4
        with:
          name: phase8-customer-facing-certification-${{ github.sha }}
          path: phase8-artifacts/
          if-no-files-found: error
          retention-days: 7
`);

console.log("phase8-bootstrap-repair: PATCHED");
