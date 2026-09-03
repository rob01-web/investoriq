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
    disposition = "HOLD";
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

function dispositionTone(disposition = "") {
  if (disposition === "ADVANCE") return "advance";
  if (disposition === "DO NOT ADVANCE") return "stop";
  return "hold";
}

function comparisonCell(label, value) {
  return `<div class="phase8a-axis"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "Not available")}</strong></div>`;
}

function injectScreeningDisposition(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8a-screening-disposition="true"')) return source;
  const d = buildScreeningDisposition(sourceTruthPackage);
  const tone = dispositionTone(d.disposition);

  let next = source.replace(
    /(<div class="cover-verdict-value[^>]*>)[\s\S]*?(<\/div>)/i,
    `$1${escapeHtml(d.disposition)}$2<div class="phase8a-cover-reason">${escapeHtml(d.nextStep)}</div>`
  );

  const newVerdict = `<div class="verdict-block phase8a-screening-disposition" data-iq-phase8a-screening-disposition="true" data-iq-disposition="${tone}">
    <div class="verdict-label">Screening Disposition</div>
    <div class="verdict-classification">${escapeHtml(d.disposition)}</div>
    <div class="verdict-pressure"><strong>Primary reason:</strong> ${escapeHtml(d.reason)}</div>
    <div class="verdict-rationale"><strong>Next step:</strong> ${escapeHtml(d.nextStep)}</div>
    <div class="phase8a-axis-grid">
      ${comparisonCell("Operating Strength", d.operatingStrength)}
      ${comparisonCell("Rent Position", d.rentPosition)}
      ${comparisonCell("Source Consistency", d.sourceConsistency)}
      ${comparisonCell("Operating Cushion", d.operatingCushion)}
      ${comparisonCell("Diligence Burden", d.diligenceBurden)}
      ${comparisonCell("Underwriting Readiness", d.disposition)}
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
    .replace(/\b48-Unit\b/gi, "48 Unit");
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

/* Underwriting executive decision page. */
.iq-phase8a-underwriting .phase8a-executive-summary { padding:12px 14px !important; }
.iq-phase8a-underwriting .phase8a-exec-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-bottom:9px; border-bottom:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-exec-property { margin:0; font-family:var(--font-display); font-size:20pt; line-height:1; color:var(--iq8a-ink); }
.iq-phase8a-underwriting .phase8a-exec-asset { margin:4px 0 0; color:var(--iq8a-muted); font-size:8pt; }
.iq-phase8a-underwriting .phase8a-exec-state { max-width:2.45in; padding:7px 10px; border-left:3px solid var(--iq8a-gold); background:var(--iq8a-paper); }
.iq-phase8a-underwriting .phase8a-exec-state span { display:block; color:#7a817c; font-size:6.5pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:3px; }
.iq-phase8a-underwriting .phase8a-exec-state strong { display:block; color:var(--iq8a-forest-deep); font-size:10pt; line-height:1.25; }
.iq-phase8a-underwriting .phase8a-exec-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; margin:10px 0; }
.iq-phase8a-underwriting .phase8a-exec-metric { min-width:0; padding:7px 8px; border:1px solid var(--iq8a-rule); background:#fff; }
.iq-phase8a-underwriting .phase8a-exec-metric span { display:block; color:#7a817c; font-size:6pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; margin-bottom:2px; }
.iq-phase8a-underwriting .phase8a-exec-metric strong { display:block; color:var(--iq8a-ink); font-family:var(--font-display); font-size:13pt; line-height:1.1; }
.iq-phase8a-underwriting .phase8a-exec-gate { margin:9px 0; padding:8px 10px; border-left:3px solid var(--iq8a-gold); background:#fbfaf6; }
.iq-phase8a-underwriting .phase8a-exec-gate > span { display:block; color:#7a817c; font-size:6.5pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.iq-phase8a-underwriting .phase8a-exec-gate > strong { display:block; margin:2px 0 3px; color:var(--iq8a-ink); font-size:9pt; }
.iq-phase8a-underwriting .phase8a-exec-gate p { margin:2px 0; font-size:8pt; line-height:1.35; }
.iq-phase8a-underwriting .phase8a-exec-columns { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.iq-phase8a-underwriting .phase8a-exec-panel { min-width:0; padding-top:7px; border-top:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-exec-panel ul { margin:0; padding-left:15px; }
.iq-phase8a-underwriting .phase8a-exec-panel li { margin-bottom:4px; font-size:7.6pt; line-height:1.35; }
.iq-phase8a-underwriting .phase8a-exec-boundary { margin:7px 0 0; padding-top:6px; border-top:1px solid #ece9e1; color:#737b76; font-size:6.6pt; line-height:1.35; }

/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */
.iq-phase8a-underwriting .cover-classification { border-left-color:var(--iq8a-forest) !important; background:rgba(23,63,43,.045) !important; }
.iq-phase8a-underwriting .cover-classification strong,
.iq-phase8a-underwriting .cover-meta-grid strong { color:var(--iq8a-ink) !important; }

@media print {
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
    screeningDispositionValues: ["ADVANCE", "HOLD", "DO NOT ADVANCE"],
    opaqueCompositeScore: false,
    sourceTruthMutationAllowed: false,
    hardcodedPageCount: false,
  };
}
