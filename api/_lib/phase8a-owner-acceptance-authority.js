import { INVESTORIQ_PHASE8A_PUBLICATION_CSS } from "./investoriq-publication-design-system.js";

const PHASE8A_MARKER = "owner-acceptance-recovery-v1";

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

function acceptedFacts(sourceTruthPackage, key) {
  const facts = sourceTruthPackage?.core?.[key]?.accepted_facts;
  return facts && typeof facts === "object" && !Array.isArray(facts) ? facts : {};
}

function escapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPercent(value, digits = 1) {
  const n = ratio(value);
  return n === null ? null : `${(n * 100).toFixed(digits)}%`;
}

function formatMoney(value) {
  const n = finite(value);
  if (n === null) return "Not available";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function canonicalScreeningMetrics(sourceTruthPackage = null) {
  const t12 = acceptedFacts(sourceTruthPackage, "t12");
  const rr = acceptedFacts(sourceTruthPackage, "rent_roll");
  const totals = rr?.totals && typeof rr.totals === "object" ? rr.totals : {};
  const gpr = firstFinite(t12.gross_potential_rent, t12.gross_scheduled_rent);
  const egi = firstFinite(t12.effective_gross_income, t12.gross_income);
  const opex = firstFinite(t12.total_operating_expenses, t12.operating_expenses);
  const noi = firstFinite(t12.net_operating_income, t12.noi);
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
  const expenseRatio = egi && opex !== null ? opex / egi : null;
  const noiMargin = egi && noi !== null ? noi / egi : null;
  const breakEvenOccupancy = gpr && opex !== null ? opex / gpr : null;
  const reconciliationVariance = gpr && annualInPlace !== null ? (annualInPlace - gpr) / gpr : null;
  const rentGapRatio = annualInPlace && annualMarket !== null ? (annualMarket - annualInPlace) / annualInPlace : null;
  return {
    t12,
    rr,
    gpr,
    egi,
    opex,
    noi,
    units,
    occupied,
    occupancy,
    annualInPlace,
    annualMarket,
    expenseRatio,
    noiMargin,
    breakEvenOccupancy,
    reconciliationVariance,
    rentGapRatio,
    hasT12: Object.keys(t12).length > 0,
    hasRentRoll: Object.keys(rr).length > 0,
  };
}

function buildScreeningDisposition(sourceTruthPackage = null) {
  const m = canonicalScreeningMetrics(sourceTruthPackage);
  const hardRisks = [];
  const cautions = [];

  if (m.expenseRatio !== null && m.expenseRatio >= 0.65) hardRisks.push(`expense ratio is ${formatPercent(m.expenseRatio)}`);
  if (m.noiMargin !== null && m.noiMargin <= 0.30) hardRisks.push(`NOI margin is ${formatPercent(m.noiMargin)}`);
  if (m.breakEvenOccupancy !== null && m.breakEvenOccupancy >= 0.95) hardRisks.push(`operating break-even occupancy is ${formatPercent(m.breakEvenOccupancy)}`);

  if (m.expenseRatio !== null && m.expenseRatio >= 0.55 && m.expenseRatio < 0.65) cautions.push(`expense ratio is ${formatPercent(m.expenseRatio)}`);
  if (m.noiMargin !== null && m.noiMargin <= 0.40 && m.noiMargin > 0.30) cautions.push(`NOI margin is ${formatPercent(m.noiMargin)}`);
  if (m.breakEvenOccupancy !== null && m.breakEvenOccupancy >= 0.85 && m.breakEvenOccupancy < 0.95) cautions.push(`operating break-even occupancy is ${formatPercent(m.breakEvenOccupancy)}`);

  const reconciliationMaterial =
    m.hasT12 &&
    m.hasRentRoll &&
    m.reconciliationVariance !== null &&
    Math.abs(m.reconciliationVariance) >= 0.05;
  const incompleteCorePair = !m.hasT12 || !m.hasRentRoll;

  let disposition = "ADVANCE";
  let reason = "Core operating metrics are within Screening thresholds.";
  let nextStep = "Proceed to full Underwriting if the property remains a shortlist candidate.";

  if (hardRisks.length > 0) {
    disposition = "DO NOT ADVANCE";
    reason = `A hard operating risk threshold is triggered: ${hardRisks[0]}.`;
    nextStep = "Resolve or re-underwrite the operating issue before spending additional diligence capital.";
  } else if (reconciliationMaterial) {
    disposition = "HOLD";
    reason = `T12 Gross Potential Rent and annual in-place Rent Roll income differ by ${formatPercent(Math.abs(m.reconciliationVariance), 1)}.`;
    nextStep = "Reconcile the two core income bases before full Underwriting.";
  } else if (incompleteCorePair) {
    disposition = "INSUFFICIENT EVIDENCE";
    reason = "Only one core operating source is available for this Screening.";
    nextStep = `Obtain the missing ${m.hasT12 ? "Rent Roll" : "T12 operating statement"} before full Underwriting.`;
  } else if (cautions.length > 0) {
    disposition = "HOLD";
    reason = `A caution threshold requires review: ${cautions[0]}.`;
    nextStep = "Confirm the operating issue and its durability before full Underwriting.";
  }

  const operatingStrength = hardRisks.length > 0 ? "Weak" : cautions.length > 0 ? "Caution" : "Strong";
  const rentPosition = m.rentGapRatio === null
    ? "Not available"
    : m.rentGapRatio > 0
      ? `${formatPercent(m.rentGapRatio)} documented upside`
      : "No positive documented gap";
  const sourceConsistency = incompleteCorePair
    ? "Single core source"
    : reconciliationMaterial
      ? `${formatPercent(Math.abs(m.reconciliationVariance), 1)} material variance`
      : "Core sources aligned";
  const cushion = m.occupancy !== null && m.breakEvenOccupancy !== null
    ? `${((m.occupancy - m.breakEvenOccupancy) * 100).toFixed(1)} pp above break-even`
    : "Not available";
  const diligenceBurden = hardRisks.length > 0 || reconciliationMaterial || incompleteCorePair || cautions.length > 0
    ? "Elevated"
    : "Standard";

  return {
    ...m,
    disposition,
    reason,
    nextStep,
    operatingStrength,
    rentPosition,
    sourceConsistency,
    operatingCushion: cushion,
    diligenceBurden,
    reconciliationMaterial,
  };
}

// Phase 8B consumes the accepted Phase 8A screening decision model as
// presentation input. Exporting the existing model prevents the publication
// layer from recreating or reinterpreting analytical authority.
export function getPhase8AScreeningDecisionModel(sourceTruthPackage = null) {
  const decision = buildScreeningDisposition(sourceTruthPackage);
  return Object.freeze({
    ...decision,
    operatingProfile: screeningOperatingProfile(decision),
    readiness: screeningReadinessLabel(decision),
  });
}

function dispositionTone(disposition = "") {
  if (disposition === "ADVANCE") return "advance";
  if (disposition === "DO NOT ADVANCE") return "stop";
  if (disposition === "INSUFFICIENT EVIDENCE") return "insufficient";
  return "hold";
}

function comparisonCell(label, value) {
  return `<div class="phase8a-axis"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "Not available")}</strong></div>`;
}

function screeningOperatingProfile(d = {}) {
  if (!d.hasT12 || !d.hasRentRoll) return "INSUFFICIENT EVIDENCE";
  if (
    (d.expenseRatio !== null && d.expenseRatio >= 0.65) ||
    (d.noiMargin !== null && d.noiMargin <= 0.30) ||
    (d.breakEvenOccupancy !== null && d.breakEvenOccupancy >= 0.95)
  ) return "OPERATING PRESSURE";
  if (
    d.rentGapRatio !== null && d.rentGapRatio >= 0.05 &&
    d.noiMargin !== null && d.noiMargin >= 0.45 &&
    d.occupancy !== null && d.occupancy >= 0.90
  ) return "LIGHT VALUE-ADD CANDIDATE";
  return "STABILIZED";
}

function screeningReadinessLabel(d = {}) {
  if (d.disposition === "ADVANCE") return "ADVANCE";
  if (d.disposition === "DO NOT ADVANCE") return "DO NOT ADVANCE";
  if (d.disposition === "INSUFFICIENT EVIDENCE") return "INSUFFICIENT EVIDENCE";
  return "HOLD";
}

function screeningSnapshotCell(label, value) {
  return `<td><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "Not available")}</strong></td>`;
}

function screeningPanel(label, items = []) {
  const valid = items.filter(Boolean);
  if (!valid.length) return "";
  return `<div class="phase8a-screening-action-panel"><p>${escapeHtml(label)}</p><ul>${valid.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
}

function injectScreeningDisposition(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8a-screening-disposition="true"')) return source;
  const d = buildScreeningDisposition(sourceTruthPackage);
  const tone = dispositionTone(d.disposition);
  const operatingProfile = screeningOperatingProfile(d);
  const readiness = screeningReadinessLabel(d);
  const grossRentDifference = d.annualMarket !== null && d.annualInPlace !== null
    ? d.annualMarket - d.annualInPlace
    : null;
  const cushion = d.occupancy !== null && d.breakEvenOccupancy !== null
    ? `${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)} pp above break-even`
    : "Not available";
  const sourceVariance = d.reconciliationVariance !== null
    ? formatPercent(d.reconciliationVariance, 1)
    : "Not available";

  const whyItMayWork = [
    d.occupancy !== null ? `Occupancy is ${formatPercent(d.occupancy)}.` : null,
    d.noiMargin !== null ? `NOI margin is ${formatPercent(d.noiMargin)}.` : null,
    grossRentDifference !== null && grossRentDifference > 0
      ? `Rent Roll market rent exceeds in-place rent by ${formatMoney(grossRentDifference)} annually.`
      : null,
  ];
  const killOrHold = [
    d.reconciliationMaterial ? `T12 and Rent Roll income bases differ by ${formatPercent(Math.abs(d.reconciliationVariance), 1)}.` : null,
    d.expenseRatio !== null && d.expenseRatio >= 0.55 ? `Expense ratio is ${formatPercent(d.expenseRatio)}.` : null,
    !d.hasT12 || !d.hasRentRoll ? "A core operating source is missing." : null,
  ];

  let next = source.replace(
    /(<div class="cover-verdict-value[^>]*>)[\s\S]*?(<\/div>)/i,
    `$1${escapeHtml(d.disposition)}$2<div class="phase8a-cover-reason">${escapeHtml(d.nextStep)}</div>`
  );

  const rows = [
    [
      screeningSnapshotCell("Units", d.units !== null ? Math.round(d.units).toLocaleString("en-US") : "Not available"),
      screeningSnapshotCell("Occupancy", formatPercent(d.occupancy)),
      screeningSnapshotCell("T12 NOI", formatMoney(d.noi)),
    ],
    [
      screeningSnapshotCell("NOI Margin", formatPercent(d.noiMargin)),
      screeningSnapshotCell("Expense Ratio", formatPercent(d.expenseRatio)),
      screeningSnapshotCell("Break-Even Occupancy", formatPercent(d.breakEvenOccupancy)),
    ],
    [
      screeningSnapshotCell("Annual In-Place Rent", formatMoney(d.annualInPlace)),
      screeningSnapshotCell("Annual Market Rent", formatMoney(d.annualMarket)),
      screeningSnapshotCell("Gross Rent Gap", grossRentDifference !== null ? `${formatMoney(grossRentDifference)} / ${formatPercent(d.rentGapRatio)}` : "Not available"),
    ],
    [
      screeningSnapshotCell("T12 Gross Potential Rent", formatMoney(d.gpr)),
      screeningSnapshotCell("Rent Roll Annual In-Place", formatMoney(d.annualInPlace)),
      screeningSnapshotCell("Rent Roll vs T12 Variance", sourceVariance),
    ],
  ].map((cells) => `<tr>${cells.join("")}</tr>`).join("");

  const profileRows = [
    ["Operating Strength", d.operatingStrength],
    ["Rent Position", d.rentPosition],
    ["Source Consistency", d.sourceConsistency],
    ["Operating Cushion", cushion],
    ["Diligence Burden", d.diligenceBurden],
    ["Underwriting Readiness", readiness],
  ].map(([label, value]) => `<div class="phase8a-screening-profile-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "Not available")}</strong></div>`).join("");

  const newVerdict = `<div class="verdict-block phase8a-screening-snapshot" data-iq-phase8a-screening-disposition="true" data-iq-disposition="${tone}">
    <div class="phase8a-screening-decision-band">
      <div class="phase8a-screening-decision-main"><span>Screening Decision Snapshot</span><strong>${escapeHtml(d.disposition)}</strong><p>${escapeHtml(d.reason)}</p></div>
      <div class="phase8a-screening-decision-side"><span>Operating Profile</span><strong>${escapeHtml(operatingProfile)}</strong><span>Next Action</span><b>${escapeHtml(d.nextStep)}</b></div>
    </div>
    <table class="phase8a-screening-snapshot-table"><tbody>${rows}</tbody></table>
    <div class="phase8a-screening-profile-strip">${profileRows}</div>
    <div class="phase8a-screening-actions">
      ${screeningPanel("Why It May Work", whyItMayWork)}
      ${screeningPanel("What Can Kill or Hold It", killOrHold.length ? killOrHold : [d.reason])}
      ${screeningPanel("Next Action", [d.nextStep])}
    </div>
  </div>`;

  next = next.replace(
    /<div class="verdict-block">[\s\S]*?<div class="verdict-rationale">[\s\S]*?<\/div>\s*<\/div>/i,
    newVerdict
  );

  next = next
    .replace(/Decision Status:\s*Metrics Aligned/gi, "Operating Threshold Status: Metrics Aligned")
    .replace(/Review\s*-\s*Source Reconciliation Disclosure/gi, "Hold: Reconciliation Required")
    .replace(/Classification is capped by source reconciliation disclosure pending reconciliation of rent roll and T12 evidence\./gi, "The Screening disposition remains on hold until the T12 and Rent Roll income bases are reconciled.");

  return next;
}

function buildScreeningDecisionProfile(sourceTruthPackage = null) {
  const d = buildScreeningDisposition(sourceTruthPackage);
  const strengths = [];
  if (d.occupancy !== null) strengths.push(`Occupancy is ${formatPercent(d.occupancy)}.`);
  if (d.noiMargin !== null) strengths.push(`NOI margin is ${formatPercent(d.noiMargin)}.`);
  if (d.occupancy !== null && d.breakEvenOccupancy !== null) strengths.push(`Operating occupancy cushion is ${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)} percentage points.`);
  if (d.rentGapRatio !== null && d.rentGapRatio > 0) strengths.push(`Rent Roll market rent is ${formatPercent(d.rentGapRatio)} above in-place rent.`);
  const conditions = [];
  if (d.reconciliationMaterial) conditions.push("Reconcile the T12 and Rent Roll income bases.");
  if (d.rentGapRatio !== null && d.rentGapRatio > 0) conditions.push("Validate the documented path from in-place rent to market rent.");
  conditions.push("Confirm the T12 and Rent Roll remain current before full Underwriting.");
  return `<div class="card no-break phase8a-screening-profile" data-iq-phase8a-screening-profile="true"><p class="subsection-title">Screening Decision Profile</p><div class="phase8a-profile-grid"><div><p class="phase8a-profile-label">Why the property remains competitive</p><ul>${strengths.slice(0,4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div><div><p class="phase8a-profile-label">Why the disposition is ${escapeHtml(d.disposition)}</p><p>${escapeHtml(d.reason)}</p><p class="phase8a-profile-label">Conditions to advance</p><ul>${conditions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></div></div>`;
}

function replaceScreeningDecisionTail(html = "", sourceTruthPackage = null) {
  let source = String(html || "");
  const profile = buildScreeningDecisionProfile(sourceTruthPackage);
  source = source.replace(/<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Operating Summary<\/p>[\s\S]*?<\/div>/i, profile);
  source = source.replace(/<div class="card no-break phase7-evidence-conviction-matrix"([\s\S]*?)<p class="subsection-title">Evidence Conviction Matrix<\/p>[\s\S]*?<\/div>/i, '<div class="card no-break phase8a-evidence-coverage" data-iq-legacy-label="Evidence Conviction Matrix"><p class="subsection-title">Evidence Coverage</p><p>Core operating facts and the material T12 / Rent Roll reconciliation issue are presented in this Screening. Detailed source treatment appears on the methodology page.</p></div>');
  source = source.replace(/<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Framework Note<\/p>[\s\S]*?<\/div>/i, '<div class="card no-break phase8a-screening-scope" style="margin-top:6px;"><p class="subsection-title">Screening Scope</p><p>Screening evaluates operating strength, rent position, source consistency, and diligence burden. Debt, valuation, and return analysis belong in Full Underwriting.</p></div>');
  source = source.replace(/\b48-Unit Multifamily\b/gi, "48 Unit Multifamily");
  source = source.replace(/Source-bound operating facts used to decide whether deeper underwriting is warranted/gi, "Core operating facts used to decide whether deeper underwriting is warranted");
  source = source.replace(/Screening identifies operating signals and evidence gaps. Financing, valuation, and return modeling remain outside this report unless separately authorized in the appropriate product./gi, "Screening stops at operating triage. Financing, valuation, and return analysis belong in Full Underwriting.");
  return source;
}

function buildScreeningMethodology(sourceTruthPackage = null) {
  const d = buildScreeningDisposition(sourceTruthPackage);
  const t12Name = sourceTruthPackage?.core?.t12?.original_filename || "T12 operating statement not provided";
  const rrName = sourceTruthPackage?.core?.rent_roll?.original_filename || "Rent Roll not provided";
  const limitation = d.reconciliationMaterial
    ? `The T12 and Rent Roll income bases differ by ${formatPercent(Math.abs(d.reconciliationVariance), 1)}. InvestorIQ does not infer the cause or force the sources to agree.`
    : "No material core-source reconciliation issue is identified by the current Screening rules.";

  return `<!-- BEGIN SECTION_12 -->
<section class="section page-break phase8a-methodology" data-iq-phase8a-methodology="true">
  <div class="section-header">
    <span class="section-header-title">Methodology &amp; Data Transparency</span>
    <span class="section-header-sub">How this Screening uses the documents provided</span>
  </div>
  <p class="phase8a-methodology-intro">This Screening Report is designed for shortlist triage. It uses the uploaded core operating documents and arithmetic derived from those documents. Missing facts are not estimated.</p>
  <div class="grid-2-balanced phase8a-methodology-grid">
    <div class="card no-break">
      <p class="subsection-title">Core Sources</p>
      <table><tbody>
        <tr><td>T12 Operating Statement</td><td><strong>${escapeHtml(t12Name)}</strong></td></tr>
        <tr><td>Rent Roll</td><td><strong>${escapeHtml(rrName)}</strong></td></tr>
      </tbody></table>
    </div>
    <div class="card no-break">
      <p class="subsection-title">Analytical Boundaries</p>
      <ul class="phase8a-method-list">
        <li>No missing operating facts are gap-filled.</li>
        <li>Screening does not model debt, valuation, IRR, or equity returns.</li>
        <li>Gross rent upside is not treated as NOI without a supported conversion basis.</li>
      </ul>
    </div>
  </div>
  <div class="card no-break phase8a-limitations-card">
    <p class="subsection-title">Current Data Limitation</p>
    <p>${escapeHtml(limitation)}</p>
  </div>
  <div class="card no-break phase8a-use-card">
    <p class="subsection-title">How to Use This Report</p>
    <p>Compare the disposition, operating strength, rent position, source consistency, operating cushion, and diligence burden across shortlisted properties. Full Underwriting is the next step only after the Screening disposition and material evidence gaps have been considered.</p>
  </div>
</section>
<!-- END SECTION_12 -->`;
}

function replaceScreeningMethodology(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8a-methodology="true"')) return source;
  if (!/<!--\s*BEGIN SECTION_12\s*-->/i.test(source) || !/<!--\s*END SECTION_12\s*-->/i.test(source)) return source;
  return source.replace(
    /<!--\s*BEGIN SECTION_12\s*-->[\s\S]*?<!--\s*END SECTION_12\s*-->/i,
    buildScreeningMethodology(sourceTruthPackage)
  );
}

function humanizeUnderwritingCopy(html = "") {
  return String(html || "")
    .replace(/Document-backed committee framing using verified source facts and deterministic calculations\. Scenario assumptions are not introduced on this surface\./gi, "Investment committee summary based on the documents provided. Scenario cases are shown separately from source facts.")
    .replace(/Metrics reflect verified source facts and deterministic calculations\. Detailed lineage is retained in the report quality record\./gi, "Key metrics are drawn from the documents provided and report calculations.")
    .replace(/transparent hypothetical perturbation/gi, "hypothetical stress case")
    .replace(/transparent perturbations/gi, "stress cases")
    .replace(/defined sensitivity framework/gi, "current sensitivity set")
    .replace(/evidence surfaces/gi, "report sections")
    .replace(/Deterministic calculated/gi, "Calculated from report inputs")
    .replace(/Accepted evidence/gi, "Source document")
    .replace(/accepted T12 NOI/gi, "T12 NOI")
    .replace(/accepted Rent Roll/gi, "Rent Roll")
    .replace(/accepted purchase price/gi, "purchase price")
    .replace(/accepted going-in cap rate/gi, "going-in cap rate")
    .replace(/accepted proposed terms/gi, "proposed terms")
    .replace(/accepted occupancy/gi, "current occupancy")
    .replace(/Accepted occupancy/gi, "Current occupancy")
    .replace(/a 11\.16%/gi, "an 11.16%")
    .replace(/produces\s+([0-9.]+x)\s+less DSCR than current debt/gi, "produces DSCR that is $1 lower than current debt")
    .replace(/\b64-Unit\b/gi, "64 Unit")
    .replace(/\b48-Unit\b/gi, "48 Unit")
    .replace(/(<div class="cover-prop-sub">)\s*Underwriting Report\s*(<\/div>)/i, "$1Investment Committee Memorandum$2")
    .replace(/Evidence Conviction Matrix/gi, "Decision Evidence Map")
    .replace(/Decision evidence already presented in this report, organized by decision domain\./gi, "Where the report supports each core committee question.")
    .replace(/<th>report sections<\/th>/gi, "<th>Report Sections</th>")
    .replace(/This matrix organizes existing report evidence only\. It does not independently score source quality, infer missing evidence, or create new underwriting assumptions\./gi, "This map points to existing report sections only. It does not score source quality, fill evidence gaps, or add underwriting assumptions.");
}

function addAuthorityMarker(html = "", lane = null) {
  return String(html || "").replace(/<body\b([^>]*)>/i, (_match, attrs = "") => {
    let next = String(attrs || "");
    if (!/\biq-phase8a\b/.test(next)) {
      const classMatch = next.match(/\bclass\s*=\s*(["'])([^"']*)\1/i);
      if (classMatch) {
        next = next.replace(classMatch[0], `class=${classMatch[1]}${classMatch[2]} iq-phase8a iq-phase8a-${lane}${classMatch[1]}`);
      } else {
        next += ` class="iq-phase8a iq-phase8a-${lane}"`;
      }
    }
    next += ` data-iq-phase8a="${PHASE8A_MARKER}"`;
    return `<body${next}>`;
  });
}

const PHASE8A_STYLE = `<style id="investoriq-phase8a-owner-acceptance-authority">
.iq-phase8a { --iq8a-forest:#173f2b; --iq8a-forest-deep:#0f2318; --iq8a-gold:#c9a84c; --iq8a-ink:#161a18; --iq8a-muted:#647067; --iq8a-paper:#faf9f5; --iq8a-rule:#dfdcd3; }

/* Shared white-first cover authority. This intentionally overrides the legacy Phase 7 cover cascade. */
.iq-phase8a .cover-wrap,
.iq-phase8a .cover-cell { background:#fff !important; color:var(--iq8a-ink) !important; }
.iq-phase8a .cover-wrap { border-top:0 !important; }
.iq-phase8a .cover-wrap::before { content:"" !important; position:absolute !important; top:0 !important; bottom:0 !important; left:0 !important; width:.18in !important; background:var(--iq8a-forest-deep) !important; border:0 !important; }
.iq-phase8a .cover-wrap::after { content:"" !important; position:absolute !important; top:0 !important; left:.82in !important; right:auto !important; width:1.05in !important; height:3px !important; background:var(--iq8a-gold) !important; border:0 !important; opacity:1 !important; }
.iq-phase8a .cover-cell { padding:1.42in .68in .82in .82in !important; }
.iq-phase8a .cover-brand-name { top:.34in !important; left:.82in !important; color:var(--iq8a-forest-deep) !important; letter-spacing:.025em !important; }
.iq-phase8a .cover-brand-sub { top:.41in !important; right:.68in !important; color:#7a817c !important; letter-spacing:.16em !important; }
.iq-phase8a .cover-report-type { color:var(--iq8a-forest) !important; }
.iq-phase8a .cover-prop-name { color:var(--iq8a-ink) !important; max-width:6.25in !important; line-height:1.04 !important; }
.iq-phase8a .cover-prop-sub,
.iq-phase8a .cover-address { color:#626b65 !important; }
.iq-phase8a .cover-divider { width:.68in !important; height:1.5px !important; background:var(--iq8a-gold) !important; opacity:.9 !important; }
.iq-phase8a .cover-verdict-value { color:var(--iq8a-forest-deep) !important; font-size:20pt !important; }
.iq-phase8a .cover-metric-strip { border-bottom:1px solid var(--iq8a-rule) !important; }
.iq-phase8a .cover-metric-row { color:#59635d !important; }
.iq-phase8a .cover-footer-row { left:.18in !important; background:#fff !important; border-top:1px solid var(--iq8a-rule) !important; }
.iq-phase8a .cover-footer-text,
.iq-phase8a .cover-footer-row .cover-footer-text:last-child { color:#7a817c !important; }
.iq-phase8a-screening .cover-cell > div:not([class]) > div > span:first-child { color:#7a817c !important; }
.iq-phase8a-screening .cover-cell > div:not([class]) > div > span:last-child,
.iq-phase8a-screening .cover-cell > div:not([class]) > div > div:last-child { color:var(--iq8a-ink) !important; }
.iq-phase8a-screening .phase8a-cover-reason { max-width:5.5in; margin:-.08in 0 .25in 0; color:#59635d; font-size:9pt; line-height:1.45; }

/* Screening triage authority. */
.iq-phase8a-screening .phase8a-screening-disposition { border-left:4px solid var(--iq8a-gold); padding:16px 18px; background:linear-gradient(135deg,#fff 0%,var(--iq8a-paper) 100%); }
.iq-phase8a-screening .phase8a-screening-disposition[data-iq-disposition="advance"] { border-left-color:#315d46; }
.iq-phase8a-screening .phase8a-screening-disposition[data-iq-disposition="stop"] { border-left-color:#84453f; }
.iq-phase8a-screening .phase8a-screening-disposition .verdict-classification { color:var(--iq8a-forest-deep); font-size:23pt; line-height:1; margin-bottom:8px; }
.iq-phase8a-screening .phase8a-axis-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:14px; }
.iq-phase8a-screening .phase8a-axis { min-width:0; border-top:1px solid var(--iq8a-rule); padding:8px 4px 2px 0; }
.iq-phase8a-screening .phase8a-axis span { display:block; color:#7a817c; font-size:6.5pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; margin-bottom:3px; }
.iq-phase8a-screening .phase8a-axis strong { display:block; color:var(--iq8a-ink); font-size:9pt; line-height:1.3; }
.iq-phase8a-screening .phase8a-methodology-intro { max-width:6.5in; font-size:10.5pt; line-height:1.55; margin-bottom:14px; }
.iq-phase8a-screening .phase8a-methodology-grid { margin-bottom:10px; }
.iq-phase8a-screening .phase8a-method-list { margin:0; padding-left:16px; }
.iq-phase8a-screening .phase8a-method-list li { margin-bottom:6px; }
.iq-phase8a-screening .phase8a-limitations-card,
.iq-phase8a-screening .phase8a-use-card { margin-top:10px; }

.iq-phase8a-screening .phase8a-screening-profile { margin-top:10px; padding:12px 14px; border-top:2px solid var(--iq8a-forest); }
.iq-phase8a-screening .phase8a-profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.iq-phase8a-screening .phase8a-profile-label { margin:0 0 5px; color:#6f7872; font-size:6.5pt; font-weight:700; letter-spacing:.09em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-profile-grid ul { margin:0; padding-left:16px; }
.iq-phase8a-screening .phase8a-profile-grid li { margin-bottom:5px; }
.iq-phase8a-screening .phase8a-evidence-coverage { margin-top:10px; padding:10px 12px; }

/* Phase 8A decision-first editorial cockpit and Prince paged-media authority. */
.iq-phase8a-screening .phase8a-screening-snapshot { margin:0; padding:0; border:0; background:#fff; }
.iq-phase8a-screening .phase8a-screening-decision-band { display:grid; grid-template-columns:1.7fr .9fr; gap:18px; margin:0 0 12px; padding:14px 16px; background:var(--iq8a-forest-deep); color:#fff; }
.iq-phase8a-screening .phase8a-screening-decision-main span,
.iq-phase8a-screening .phase8a-screening-decision-side span { display:block; color:#d6c484; font-size:6.4pt; font-weight:700; letter-spacing:.11em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-decision-main strong { display:block; margin:3px 0 5px; color:#fff; font-family:var(--font-display); font-size:24pt; line-height:1; }
.iq-phase8a-screening .phase8a-screening-decision-main p { margin:0; color:#edf1ee; font-size:8pt; line-height:1.35; }
.iq-phase8a-screening .phase8a-screening-decision-side { padding-left:14px; border-left:1px solid rgba(255,255,255,.22); }
.iq-phase8a-screening .phase8a-screening-decision-side strong { display:block; margin:3px 0 10px; color:#fff; font-size:10pt; line-height:1.2; }
.iq-phase8a-screening .phase8a-screening-decision-side b { display:block; margin-top:3px; color:#fff; font-size:7.5pt; line-height:1.3; font-weight:500; }
.iq-phase8a-screening .phase8a-screening-snapshot-table { margin:0; table-layout:fixed; border-top:1px solid var(--iq8a-rule); }
.iq-phase8a-screening .phase8a-screening-snapshot-table td { width:33.333%; padding:7px 8px 7px 0; border-bottom:1px solid var(--iq8a-rule); background:#fff !important; }
.iq-phase8a-screening .phase8a-screening-snapshot-table td span { display:block; color:#777f79; font-size:5.8pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-snapshot-table td strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-display); font-size:12pt; line-height:1.05; }
.iq-phase8a-screening .phase8a-screening-profile-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 12px; margin-top:10px; }
.iq-phase8a-screening .phase8a-screening-profile-item { padding:5px 0; border-bottom:1px solid #ece9e1; }
.iq-phase8a-screening .phase8a-screening-profile-item span { display:block; color:#7a817c; font-size:5.7pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-profile-item strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-size:7.5pt; line-height:1.25; }
.iq-phase8a-screening .phase8a-screening-actions { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:11px; }
.iq-phase8a-screening .phase8a-screening-action-panel { padding-top:7px; border-top:2px solid var(--iq8a-forest); }
.iq-phase8a-screening .phase8a-screening-action-panel p { margin:0 0 4px; color:#69716c; font-size:6pt; font-weight:700; letter-spacing:.09em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-action-panel ul { margin:0; padding-left:14px; }
.iq-phase8a-screening .phase8a-screening-action-panel li { margin-bottom:3px; font-size:7pt; line-height:1.3; }
.iq-phase8a-screening .phase8a-screening-snapshot[data-iq-disposition="insufficient"] .phase8a-screening-decision-band { background:#4c5350; }

@page iq-body {
  size: Letter;
  margin: .46in .52in .56in .52in;
  @top-left { content: "INVESTORIQ"; font-family:'DM Sans',sans-serif; font-size:6pt; font-weight:700; letter-spacing:.08em; color:#173f2b; }
  @top-right { content: string(iq-section, first); font-family:'DM Sans',sans-serif; font-size:6pt; color:#737b76; }
  @bottom-left { content: string(iq-property, first); font-family:'DM Sans',sans-serif; font-size:5.8pt; color:#8a8f8b; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family:'DM Mono',monospace; font-size:5.8pt; color:#8a8f8b; }
}
@page iq-decision {
  size: Letter;
  margin: .40in .52in .54in .52in;
  @top-left { content: "INVESTORIQ  |  DECISION SNAPSHOT"; font-family:'DM Sans',sans-serif; font-size:6pt; font-weight:700; letter-spacing:.07em; color:#173f2b; }
  @top-right { content: string(iq-property, first); font-family:'DM Sans',sans-serif; font-size:6pt; color:#737b76; }
  @bottom-left { content: "DECISION FIRST. FACTS BEFORE PROSE."; font-family:'DM Sans',sans-serif; font-size:5.6pt; color:#8a8f8b; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family:'DM Mono',monospace; font-size:5.8pt; color:#8a8f8b; }
}
.iq-phase8a .cover-prop-name { string-set: iq-property content(); }
.iq-phase8a .section { page: iq-body; }
.iq-phase8a .section-header-title { string-set: iq-section content(); -prince-bookmark-level:1; -prince-bookmark-label:content(); }
.iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] { page:iq-decision; break-before:page; break-after:page; }
.iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] .phase7-evidence-conviction-matrix { break-before:page; page-break-before:always; }
.iq-phase8a table thead { display:table-header-group; }
.iq-phase8a table tfoot { display:table-footer-group; }
.iq-phase8a table tr { break-inside:avoid; page-break-inside:avoid; }
.iq-phase8a p, .iq-phase8a li { widows:2; orphans:2; }
.iq-phase8a .section-header, .iq-phase8a .subsection-title { break-after:avoid-page; page-break-after:avoid; }

${INVESTORIQ_PHASE8A_PUBLICATION_CSS}

@media print {
  /* Keep named-page changes on the same logical content box. Without these
     assignments Chromium/Prince can strand a wrapper, chapter heading, or
     trailing appendix block on an otherwise empty page. */
  .iq-phase8a-screening .report-container { page:iq-body; }

  .iq-phase8a-underwriting .header-strip { display:none !important; }
  .iq-phase8a-underwriting .institutional-chapter { page:iq-body; }
  .iq-phase8a-underwriting .institutional-chapter[data-iq-chapter="committee-overview"] { page:iq-decision; }
  .iq-phase8a-underwriting .institutional-chapter[data-iq-chapter="committee-overview"] > div > section.section { page:iq-decision; }
  .iq-phase8a-underwriting .report-footer { display:none !important; }

  /* The cover already supplies the page boundary. Keep the committee heading
     with the decision snapshot, and let the post-snapshot committee sections
     use available space instead of forcing another named-page break. */
  .iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] {
    break-before:auto !important;
    page-break-before:auto !important;
    break-after:auto !important;
    page-break-after:auto !important;
  }

  /* Phase 7 protected these driver blocks as indivisible. Phase 8A uses
     tighter editorial tables, so allow them to flow instead of leaving
     half-empty pages for a small boundary note. */
  .iq-phase8a-underwriting section[data-iq-elite-driver-section="underwriting-driver-analysis"],
  .iq-phase8a-underwriting [data-iq-elite-driver-boundaries="true"] {
    break-inside:auto !important;
    page-break-inside:auto !important;
  }

  .iq-phase8a-screening .phase8a-axis { break-inside:avoid; page-break-inside:avoid; }
  .iq-phase8a-screening .phase8a-methodology .card { break-inside:avoid; page-break-inside:avoid; }
}
</style>`;

function injectStyle(html = "") {
  const source = String(html || "");
  if (source.includes('id="investoriq-phase8a-owner-acceptance-authority"')) return source;
  return /<\/head>/i.test(source)
    ? source.replace(/<\/head>/i, `${PHASE8A_STYLE}\n</head>`)
    : `${PHASE8A_STYLE}${source}`;
}

export function applyPhase8AOwnerAcceptanceAuthority(html, { lane = null, sourceTruthPackage = null } = {}) {
  let source = String(html || "");
  if (!source || !["screening", "underwriting"].includes(lane)) return source;
  if (lane === "screening") {
    source = injectScreeningDisposition(source, sourceTruthPackage);
    source = replaceScreeningDecisionTail(source, sourceTruthPackage);
    source = replaceScreeningMethodology(source, sourceTruthPackage);
  } else {
    source = humanizeUnderwritingCopy(source);
  }
  source = addAuthorityMarker(source, lane);
  source = injectStyle(source);
  return source;
}

export function phase8AOwnerAcceptanceMetadata() {
  return {
    marker: PHASE8A_MARKER,
    sharedWhiteFirstCover: true,
    screeningDispositionValues: ["ADVANCE", "HOLD", "DO NOT ADVANCE", "INSUFFICIENT EVIDENCE"],
    opaqueCompositeScore: false,
    sourceTruthMutationAllowed: false,
    hardcodedPageCount: false,
  };
}
