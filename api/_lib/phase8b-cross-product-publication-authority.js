import {
  INVESTORIQ_PUBLICATION_DESIGN_SYSTEM_VERSION,
  renderPublicationCover,
  renderPublicationDecisionBand,
  renderPublicationEvidenceMap,
  renderPublicationMetricMatrix,
  renderPublicationObservationGrid,
  renderPublicationReconciliationAlert,
  renderPublicationSection,
  renderPublicationThreePanelStrip,
} from "./investoriq-publication-design-system.js";
import { getPhase8AScreeningDecisionModel } from "./phase8a-owner-acceptance-authority.js";

const PHASE8B_MARKER = "cross-product-publication-system-v1";

function visibleValue(html = "", pattern, fallback = "") {
  const match = String(html || "").match(pattern);
  return String(match?.[1] || fallback)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function coreEvidenceCount(sourceTruthPackage = null) {
  return [sourceTruthPackage?.core?.t12, sourceTruthPackage?.core?.rent_roll]
    .filter((source) => source?.accepted_facts && Object.keys(source.accepted_facts).length > 0)
    .length;
}

function formatPercent(value, digits = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? `${(n * 100).toFixed(digits)}%` : "Not available";
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Not available";
  const absolute = Math.abs(Math.round(n)).toLocaleString("en-US");
  return n < 0 ? `($${absolute})` : `$${absolute}`;
}

function escapeText(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildScreeningDecisionPage(sourceTruthPackage = null) {
  const d = getPhase8AScreeningDecisionModel(sourceTruthPackage);
  const grossRentDifference = Number.isFinite(d.annualMarket) && Number.isFinite(d.annualInPlace)
    ? d.annualMarket - d.annualInPlace
    : null;
  const sourceVariance = Number.isFinite(d.reconciliationVariance)
    ? formatPercent(d.reconciliationVariance)
    : "Not available";
  const screeningThesis = [
    Number.isFinite(d.occupancy) ? `Occupancy is ${formatPercent(d.occupancy)}.` : null,
    Number.isFinite(d.noiMargin) ? `NOI margin is ${formatPercent(d.noiMargin)}.` : null,
    grossRentDifference > 0 ? `Documented market rent exceeds in-place rent by ${formatMoney(grossRentDifference)} annually.` : null,
  ].filter(Boolean);
  const stopConditions = [
    d.reconciliationMaterial ? `The T12 and Rent Roll income bases differ by ${formatPercent(Math.abs(d.reconciliationVariance))}.` : null,
    d.expenseRatio >= 0.55 ? `Expense ratio is ${formatPercent(d.expenseRatio)}.` : null,
    !d.hasT12 || !d.hasRentRoll ? "A core operating source is missing." : null,
  ].filter(Boolean);
  const advanceConditions = [
    d.reconciliationMaterial ? "Reconcile the T12 and Rent Roll income bases." : null,
    d.rentGapRatio > 0 ? "Validate the documented path from in-place rent to market rent." : null,
    "Confirm both core operating sources remain current.",
  ].filter(Boolean);
  const operatingCushion = Number.isFinite(d.occupancy) && Number.isFinite(d.breakEvenOccupancy)
    ? `${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)} pp above break-even`
    : "Not available";

  const decisionBand = renderPublicationDecisionBand({
    className: "phase8b-screening-decision-band",
    columns: [
      { label: "Current Decision State", value: d.disposition, detail: d.reason },
      { label: "Operating Profile", value: d.operatingProfile, detail: d.sourceConsistency },
      { label: "Next Review Gate", value: d.reconciliationMaterial ? "SOURCE RECONCILIATION" : d.readiness, detail: d.nextStep },
    ],
  });
  const metricMatrix = renderPublicationMetricMatrix({
    className: "phase8b-screening-metric-matrix",
    rows: [
      [
        { label: "Units", value: Number.isFinite(d.units) ? Math.round(d.units).toLocaleString("en-US") : "Not available" },
        { label: "Occupancy", value: formatPercent(d.occupancy) },
        { label: "T12 NOI", value: formatMoney(d.noi) },
      ],
      [
        { label: "NOI Margin", value: formatPercent(d.noiMargin) },
        { label: "Expense Ratio", value: formatPercent(d.expenseRatio) },
        { label: "Break-Even Occupancy", value: formatPercent(d.breakEvenOccupancy) },
      ],
      [
        { label: "Annual In-Place Rent", value: formatMoney(d.annualInPlace) },
        { label: "Annual Market Rent", value: formatMoney(d.annualMarket) },
        { label: "Gross Rent Gap", value: grossRentDifference === null ? "Not available" : `${formatMoney(grossRentDifference)} / ${formatPercent(d.rentGapRatio)}` },
      ],
      [
        { label: "T12 Gross Potential Rent", value: formatMoney(d.gpr) },
        { label: "Rent Roll Annual In-Place", value: formatMoney(d.annualInPlace) },
        { label: "Rent Roll vs T12 Variance", value: sourceVariance },
      ],
    ],
  });
  const panels = renderPublicationThreePanelStrip({
    className: "phase8b-screening-decision-panels",
    panels: [
      { title: "Screening Thesis", items: screeningThesis },
      { title: "What Can Stop Advancement", items: stopConditions.length ? stopConditions : [d.reason] },
      { title: "What Must Be True to Advance", items: advanceConditions },
    ],
  });
  const profile = `<div class="phase8b-screening-profile-strip">${[
    ["Operating Strength", d.operatingStrength],
    ["Rent Position", d.rentPosition],
    ["Source Consistency", d.sourceConsistency],
    ["Operating Cushion", operatingCushion],
    ["Diligence Burden", d.diligenceBurden],
    ["Underwriting Readiness", d.readiness],
  ].map(([label, value]) => `<div><span>${escapeText(label)}</span><strong>${escapeText(value)}</strong></div>`).join("")}</div>`;
  return renderPublicationSection({
    title: "Screening Decision Snapshot",
    sectionKey: "screeningDecisionSnapshot",
    disposition: d.disposition.toLowerCase().replace(/\s+/g, "-"),
    bodyHtml: `${decisionBand}${metricMatrix}${profile}${panels}<p class="phase8b-screening-boundary">Screening determines whether operating facts and source consistency support deeper review. Missing facts are not estimated.</p>`,
    legacySectionLabel: "Executive Summary",
    bodyClass: "phase8b-screening-decision-page",
  });
}

function renderScreeningCover(html = "", sourceTruthPackage = null) {
  const decision = getPhase8AScreeningDecisionModel(sourceTruthPackage);
  const propertyName = visibleValue(html, /<div class="cover-prop-name">([\s\S]*?)<\/div>/i, "InvestorIQ Property");
  const preparedLabel = visibleValue(html, /<div class="cover-footer-row">[\s\S]*?<span class="cover-footer-text">[\s\S]*?<\/span>\s*<span class="cover-footer-text">([\s\S]*?)<\/span>/i, "Prepared for current review");
  const sourceCount = coreEvidenceCount(sourceTruthPackage);
  const units = decision.units === null ? "Unit count not available" : `${Math.round(decision.units).toLocaleString("en-US")} Units`;
  const cover = renderPublicationCover({
    propertyName,
    reportTitle: "InvestorIQ Screening Report",
    classification: decision.disposition,
    profileLabel: "Operating Profile",
    profileValue: `${decision.operatingProfile} | Multifamily | ${units}`,
    evidenceBasis: `${sourceCount} core operating ${sourceCount === 1 ? "source" : "sources"}`,
    preparedLabel,
    footerRight: "Document-Backed Property Screening",
  });
  return `<!-- COVER PAGE -->\n${cover}\n<!-- END COVER PAGE -->`;
}

function replaceScreeningCover(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8b-slice="cover"')) return source;
  const replacement = renderScreeningCover(source, sourceTruthPackage);
  return source.replace(/<!-- COVER PAGE -->[\s\S]*?<!-- END COVER PAGE -->/i, `${replacement}\n<div data-iq-phase8b-slice="cover"></div>`);
}

function replaceScreeningDecisionPage(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8b-slice="decision"')) return source;
  const page = buildScreeningDecisionPage(sourceTruthPackage);
  return source.replace(
    /<!-- BEGIN SECTION_0_5 -->[\s\S]*?<!-- END SECTION_0_5 -->/i,
    `<!-- BEGIN SECTION_0_5 -->\n${page}\n<div data-iq-phase8b-slice="decision"></div>\n<!-- END SECTION_0_5 -->`
  );
}

function buildScreeningEvidencePages(sourceTruthPackage = null) {
  const d = getPhase8AScreeningDecisionModel(sourceTruthPackage);
  const grossRentDifference = Number.isFinite(d.annualMarket) && Number.isFinite(d.annualInPlace)
    ? d.annualMarket - d.annualInPlace
    : null;
  const operatingCushion = Number.isFinite(d.occupancy) && Number.isFinite(d.breakEvenOccupancy)
    ? `${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)} pp`
    : "Not available";
  const evidenceMap = renderPublicationEvidenceMap({
    intro: "Where this Screening supports each operating decision question.",
    rows: [
      { domain: "Operating Strength", coverage: "Presented", sections: "Key Metrics Snapshot; Screening Observations" },
      { domain: "Rent Position", coverage: "Presented", sections: "Key Metrics Snapshot; Screening Observations" },
      { domain: "Source Consistency", coverage: d.reconciliationMaterial ? "Reconciliation Required" : "Presented", sections: "Source Reconciliation; Diligence Priorities" },
      { domain: "Operating Cushion", coverage: "Presented", sections: "Key Metrics Snapshot" },
      { domain: "Diligence Burden", coverage: d.diligenceBurden, sections: "Screening Observations; Diligence Priorities" },
    ],
    note: "This map organizes facts already presented in the report. It does not add assumptions or fill missing evidence.",
  });
  const keyMetrics = renderPublicationMetricMatrix({
    className: "phase8b-evidence-metric-matrix",
    rows: [
      [
        { label: "Gross Potential Rent", value: formatMoney(d.gpr), note: "T12" },
        { label: "Effective Gross Income", value: formatMoney(d.egi), note: "T12" },
        { label: "Operating Expenses", value: formatMoney(d.opex), note: "T12" },
      ],
      [
        { label: "Net Operating Income", value: formatMoney(d.noi), note: "T12" },
        { label: "Expense Ratio", value: formatPercent(d.expenseRatio), note: "Calculated from T12" },
        { label: "NOI Margin", value: formatPercent(d.noiMargin), note: "Calculated from T12" },
      ],
      [
        { label: "Units", value: Number.isFinite(d.units) ? Math.round(d.units).toLocaleString("en-US") : "Not available", note: "Rent Roll" },
        { label: "Occupied Units", value: Number.isFinite(d.occupied) ? Math.round(d.occupied).toLocaleString("en-US") : "Not available", note: "Rent Roll" },
        { label: "Occupancy", value: formatPercent(d.occupancy), note: "Rent Roll" },
      ],
      [
        { label: "Annual In-Place Rent", value: formatMoney(d.annualInPlace), note: "Rent Roll" },
        { label: "Annual Market Rent", value: formatMoney(d.annualMarket), note: "Rent Roll" },
        { label: "Gross Rent Gap", value: grossRentDifference === null ? "Not available" : `${formatMoney(grossRentDifference)} / ${formatPercent(d.rentGapRatio)}`, note: "Calculated from Rent Roll" },
      ],
    ],
  });
  const evidencePage = renderPublicationSection({
    title: "Decision Evidence & Key Metrics",
    sectionKey: "screeningDecisionEvidence",
    disposition: "include",
    bodyHtml: `${evidenceMap}<div class="phase8b-key-metrics"><p class="subsection-title">Key Metrics Snapshot</p>${keyMetrics}<p class="small">Core sources: ${escapeText(sourceTruthPackage?.core?.t12?.original_filename || "T12 operating statement")} and ${escapeText(sourceTruthPackage?.core?.rent_roll?.original_filename || "Rent Roll")}.</p></div>`,
    bodyClass: "phase8b-screening-evidence-page",
  });

  const observations = renderPublicationObservationGrid({
    groups: [
      { label: "Operating Signals", items: [
        { code: "OCCUPANCY_SIGNAL", statement: `Occupancy is ${formatPercent(d.occupancy)} across ${Number.isFinite(d.units) ? Math.round(d.units) : "the reported"} units.` },
        { code: "MARGIN_SIGNAL", statement: `NOI margin is ${formatPercent(d.noiMargin)} and expense ratio is ${formatPercent(d.expenseRatio)}.` },
        { code: "CUSHION_SIGNAL", statement: `Occupancy is ${operatingCushion} above operating break-even occupancy.` },
      ] },
      { label: "Rent Position Signals", items: [
        { code: "RENT_GAP_SIGNAL", statement: `Documented market rent exceeds in-place rent by ${formatMoney(grossRentDifference)} annually, or ${formatPercent(d.rentGapRatio)}.` },
        { code: "RENT_SCOPE_SIGNAL", statement: "The reported rent gap remains a gross operating signal until the practical capture path is validated." },
      ] },
      { label: "Constraint Signals", items: [
        { code: "RECONCILIATION_SIGNAL", statement: d.reason, qualification: "InvestorIQ does not infer the cause or force the sources to agree." },
      ] },
      { label: "Evidence Status", items: [
        { code: "T12_STATUS", statement: `${sourceTruthPackage?.core?.t12?.original_filename || "T12 operating statement"} supports the current operating results.` },
        { code: "RENT_ROLL_STATUS", statement: `${sourceTruthPackage?.core?.rent_roll?.original_filename || "Rent Roll"} supports unit, occupancy, and rent-position facts.` },
      ] },
    ],
  });
  const reconciliation = renderPublicationReconciliationAlert({
    disclosure: d.reconciliationMaterial
      ? `The two core income bases differ by ${formatPercent(Math.abs(d.reconciliationVariance))}. The Screening remains on hold until the difference is reconciled.`
      : "The two core income bases are within the current Screening tolerance.",
    metrics: [
      { label: "T12 Gross Potential Rent", value: formatMoney(d.gpr) },
      { label: "Rent Roll Annual In-Place", value: formatMoney(d.annualInPlace) },
      { label: "Difference", value: grossRentDifference === null || !Number.isFinite(d.gpr) ? "Not available" : formatMoney(d.annualInPlace - d.gpr) },
      { label: "Variance", value: formatPercent(d.reconciliationVariance, 2) },
    ],
  });
  const diligenceItems = [
    d.reconciliationMaterial ? "Reconcile the Rent Roll income scale to the T12 and document the cause of the difference." : null,
    d.rentGapRatio > 0 ? "Validate documented market rents and the practical path from in-place rent to market rent." : null,
    "Confirm the T12 and Rent Roll remain current before the next review decision.",
  ].filter(Boolean);
  const observationsPage = renderPublicationSection({
    title: "Screening Observations & Diligence Priorities",
    sectionKey: "screeningObservations",
    disposition: d.disposition.toLowerCase().replace(/\s+/g, "-"),
    bodyHtml: `${observations}<div class="phase8b-reconciliation-block">${reconciliation}</div><div class="phase8b-diligence-priorities"><p class="subsection-title">Diligence Priorities</p><ol>${diligenceItems.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ol></div>`,
    bodyClass: "phase8b-screening-observations-page",
  });
  return `${evidencePage}\n${observationsPage}`;
}

function replaceScreeningEvidencePages(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8b-slice="evidence-observations"')) return source;
  const pages = buildScreeningEvidencePages(sourceTruthPackage);
  return source.replace(
    /<section class="section page-break phase8-screening-evidence"[\s\S]*?<\/section>/i,
    `${pages}\n<div data-iq-phase8b-slice="evidence-observations"></div>`
  );
}

function buildScreeningGovernancePage(sourceTruthPackage = null) {
  const d = getPhase8AScreeningDecisionModel(sourceTruthPackage);
  const t12Name = sourceTruthPackage?.core?.t12?.original_filename || "T12 operating statement not provided";
  const rentRollName = sourceTruthPackage?.core?.rent_roll?.original_filename || "Rent Roll not provided";
  const limitation = d.reconciliationMaterial
    ? `The T12 and Rent Roll income bases differ by ${formatPercent(Math.abs(d.reconciliationVariance))}. InvestorIQ does not infer the cause or force the sources to agree.`
    : "No material core-source reconciliation issue is identified by the current Screening rules.";
  const qualityManifest = renderPublicationMetricMatrix({
    className: "phase8b-quality-manifest",
    rows: [
      [
        { label: "Report Scope", value: "Operating Screening" },
        { label: "Decision State", value: d.disposition },
        { label: "Core Sources", value: `${coreEvidenceCount(sourceTruthPackage)} of 2` },
      ],
      [
        { label: "Missing Facts Estimated", value: "No" },
        { label: "Source Difference Disclosed", value: d.reconciliationMaterial ? "Yes" : "Not required" },
        { label: "Next Review Gate", value: d.reconciliationMaterial ? "Reconcile Sources" : d.readiness },
      ],
    ],
  });
  const body = `<div class="phase8b-governance-grid">
    <div class="card no-break"><p class="subsection-title">Data Coverage</p><p>Two core operating sources support this Screening: the T12 operating statement and Rent Roll. The report uses stated facts and arithmetic derived from those facts.</p></div>
    <div class="card no-break"><p class="subsection-title">Current Source Limitation</p><p>${escapeText(limitation)}</p></div>
  </div>
  <div class="phase8b-source-register"><p class="subsection-title">Source Register &amp; Document Treatment</p><table><thead><tr><th>Source</th><th>Role in Screening</th><th>Treatment</th></tr></thead><tbody>
    <tr><td><strong>${escapeText(t12Name)}</strong></td><td>Current operating results</td><td>Presented as the source for income, operating expenses, and NOI facts.</td></tr>
    <tr><td><strong>${escapeText(rentRollName)}</strong></td><td>Unit and rent position</td><td>Presented as the source for unit, occupancy, in-place rent, and market rent facts.</td></tr>
  </tbody></table></div>
  <div class="phase8b-methodology"><p class="subsection-title">Methodology &amp; Data Transparency</p><ul>
    <li>Missing operating facts are not estimated.</li>
    <li>Calculated fields use only the two listed core sources.</li>
    <li>Gross rent upside is not treated as NOI without a supported conversion basis.</li>
    <li>Material source differences remain visible and unresolved until supported evidence explains them.</li>
  </ul></div>
  <div class="phase8b-quality"><p class="subsection-title">Report Quality Manifest</p>${qualityManifest}</div>
  <div class="phase8b-report-use"><p class="subsection-title">How to Use This Report</p><p>Compare the decision state, operating strength, rent position, source consistency, operating cushion, and diligence burden across shortlisted properties. Advance to deeper review only after material evidence gaps have been considered.</p></div>`;
  return renderPublicationSection({
    title: "Data Coverage & Source Limitations",
    sectionKey: "screeningGovernance",
    disposition: "include",
    bodyHtml: body,
    legacySectionLabel: "Methodology & Data Transparency",
    bodyClass: "phase8b-screening-governance-page",
  });
}

function replaceScreeningGovernancePage(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8b-slice="governance"')) return source;
  const page = buildScreeningGovernancePage(sourceTruthPackage);
  return source.replace(
    /<!--\s*BEGIN SECTION_12\s*-->[\s\S]*?<!--\s*END SECTION_12\s*-->/i,
    `<!-- BEGIN SECTION_12 -->\n${page}\n<div data-iq-phase8b-slice="governance"></div>\n<!-- END SECTION_12 -->`
  );
}

function addAuthorityMarker(html = "", lane = null) {
  return String(html || "").replace(/<body\b([^>]*)>/i, (_match, attrs = "") => {
    let next = String(attrs || "");
    if (!/\biq-phase8b\b/.test(next)) {
      const classMatch = next.match(/\bclass\s*=\s*(["'])([^"']*)\1/i);
      if (classMatch) {
        next = next.replace(classMatch[0], `class=${classMatch[1]}${classMatch[2]} iq-phase8b iq-phase8b-${lane}${classMatch[1]}`);
      } else {
        next += ` class="iq-phase8b iq-phase8b-${lane}"`;
      }
    }
    next += ` data-iq-phase8b="${PHASE8B_MARKER}" data-iq-publication-system="${INVESTORIQ_PUBLICATION_DESIGN_SYSTEM_VERSION}"`;
    return `<body${next}>`;
  });
}

const PHASE8B_STYLE = `<style id="investoriq-phase8b-cross-product-publication-authority">
.iq-phase8b-screening .cover-classification { max-width:5.8in; margin-top:.62in; padding:.12in .16in; border-left:3px solid var(--iq8a-forest); background:rgba(23,63,43,.045); }
.iq-phase8b-screening .cover-classification span { display:block; margin-bottom:4pt; color:#7a817c; font-family:var(--font-mono); font-size:6.5pt; font-weight:600; letter-spacing:.14em; text-transform:uppercase; }
.iq-phase8b-screening .cover-classification strong { display:block; color:var(--iq8a-ink); font-family:var(--font-body); font-size:14pt; font-weight:600; line-height:1.25; }
.iq-phase8b-screening .cover-meta-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.22in; position:absolute; left:.82in; right:.68in; bottom:.88in; padding-top:.16in; border-top:1px solid var(--hairline-mid); }
.iq-phase8b-screening .cover-meta-grid span { display:block; margin-bottom:4pt; color:#7a817c; font-family:var(--font-mono); font-size:6pt; font-weight:600; letter-spacing:.14em; text-transform:uppercase; }
.iq-phase8b-screening .cover-meta-grid strong { display:block; color:var(--iq8a-ink); font-family:var(--font-body); font-size:10pt; font-weight:600; line-height:1.3; }
.iq-phase8b-screening section[data-iq-elite-section="screeningDecisionSnapshot"] { page:iq-decision; break-after:page; page-break-after:always; }
.iq-phase8b-screening .phase8b-screening-decision-page { padding:0 !important; border-top:0 !important; }
.iq-phase8b-screening .phase8b-screening-decision-band { display:grid; grid-template-columns:1.45fr .82fr 1.02fr; gap:0; margin:0 0 11px; background:var(--iq8a-forest-deep); color:#fff; }
.iq-phase8b-screening .phase8b-screening-decision-band > div { min-width:0; padding:12px 14px; }
.iq-phase8b-screening .phase8b-screening-decision-band > div + div { border-left:1px solid rgba(255,255,255,.2); }
.iq-phase8b-screening .phase8b-screening-decision-band span { display:block; color:#d6c484; font-size:5.9pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.iq-phase8b-screening .phase8b-screening-decision-band strong { display:block; margin-top:3px; color:#fff; font-family:var(--font-display); font-size:15pt; line-height:1.04; }
.iq-phase8b-screening .phase8b-screening-decision-band p { margin:4px 0 0; color:#eef1ef; font-size:6.5pt; line-height:1.28; }
.iq-phase8b-screening .phase8b-screening-metric-matrix { margin:0; table-layout:fixed; border-top:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .phase8b-screening-metric-matrix td { width:33.333%; padding:7px 8px 7px 0; background:#fff !important; border-bottom:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .phase8b-screening-metric-matrix td span { display:block; color:#767f79; font-size:5.5pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase; }
.iq-phase8b-screening .phase8b-screening-metric-matrix td strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-display); font-size:10.7pt; line-height:1.05; }
.iq-phase8b-screening .phase8b-screening-profile-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 12px; margin-top:9px; }
.iq-phase8b-screening .phase8b-screening-profile-strip > div { padding:4px 0; border-bottom:1px solid #ece9e1; }
.iq-phase8b-screening .phase8b-screening-profile-strip span { display:block; color:#7a817c; font-size:5.5pt; font-weight:700; letter-spacing:.075em; text-transform:uppercase; }
.iq-phase8b-screening .phase8b-screening-profile-strip strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-size:7.2pt; line-height:1.22; }
.iq-phase8b-screening .phase8b-screening-decision-panels { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:10px; }
.iq-phase8b-screening .phase8b-screening-decision-panels .phase8a-exec-panel { padding-top:7px; border-top:2px solid var(--iq8a-forest); }
.iq-phase8b-screening .phase8b-screening-decision-panels ul { margin:0; padding-left:15px; }
.iq-phase8b-screening .phase8b-screening-decision-panels li { margin-bottom:3px; font-size:6.8pt; line-height:1.28; }
.iq-phase8b-screening .phase8b-screening-boundary { margin:8px 0 0; padding-top:6px; border-top:1px solid #ece9e1; color:#737b76; font-size:6pt; line-height:1.3; }
.iq-phase8b-screening section[data-iq-elite-section="screeningDecisionEvidence"],
.iq-phase8b-screening section[data-iq-elite-section="screeningObservations"] { break-before:page; page-break-before:always; break-after:page; page-break-after:always; }
.iq-phase8b-screening .phase8b-screening-evidence-page,
.iq-phase8b-screening .phase8b-screening-observations-page { padding-top:0 !important; border-top:0 !important; }
.iq-phase8b-screening .phase8b-screening-evidence-page .phase7-evidence-conviction-matrix { margin:0 0 12px !important; padding:10px 12px !important; border:1px solid var(--iq8a-rule) !important; border-top:2px solid var(--iq8a-forest) !important; background:#fff !important; }
.iq-phase8b-screening .phase7-evidence-conviction-matrix table { table-layout:fixed; margin-top:5px; }
.iq-phase8b-screening .phase7-evidence-conviction-matrix th,
.iq-phase8b-screening .phase7-evidence-conviction-matrix td { padding:5px 6px; font-size:6.2pt; line-height:1.3; vertical-align:top; }
.iq-phase8b-screening .phase7-evidence-conviction-matrix th:nth-child(1),
.iq-phase8b-screening .phase7-evidence-conviction-matrix td:nth-child(1) { width:23%; font-weight:600; }
.iq-phase8b-screening .phase7-evidence-conviction-matrix th:nth-child(2),
.iq-phase8b-screening .phase7-evidence-conviction-matrix td:nth-child(2) { width:20%; text-align:center; }
.iq-phase8b-screening .phase8b-key-metrics { margin-top:11px; }
.iq-phase8b-screening .phase8b-evidence-metric-matrix { table-layout:fixed; margin:0; border-top:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .phase8b-evidence-metric-matrix td { width:33.333%; padding:6px 7px 6px 0; background:#fff !important; border-bottom:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .phase8b-evidence-metric-matrix td span { display:block; color:#767f79; font-size:5.5pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase; }
.iq-phase8b-screening .phase8b-evidence-metric-matrix td strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-display); font-size:10.5pt; line-height:1.05; }
.iq-phase8b-screening .phase8b-evidence-metric-matrix td em { display:block; margin-top:2px; color:#7a817c; font-size:5.3pt; font-style:normal; }
.iq-phase8b-screening .iq-ic-signal-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px 18px; }
.iq-phase8b-screening .iq-ic-signal-panel { break-inside:avoid; page-break-inside:avoid; }
.iq-phase8b-screening .iq-ic-signal-list { margin:0; padding-left:16px; }
.iq-phase8b-screening .iq-ic-signal-list li { margin-bottom:4px; color:var(--ink-2); font-size:7.4pt; line-height:1.35; }
.iq-phase8b-screening .iq-ic-signal-qualification { margin-top:2px; color:var(--ink-4); font-size:6.3pt; font-style:italic; }
.iq-phase8b-screening .phase8b-reconciliation-block { margin-top:12px; padding:10px 12px; border-left:3px solid var(--iq8a-gold); background:#fbfaf6; }
.iq-phase8b-screening .iq-ic-reconciliation-callout { margin:0 0 7px; }
.iq-phase8b-screening .iq-callout-title { margin:0 0 3px; color:var(--iq8a-forest-deep); font-size:8pt; font-weight:700; text-transform:uppercase; letter-spacing:.07em; }
.iq-phase8b-screening .iq-callout-copy { margin:0; font-size:7.4pt; line-height:1.35; }
.iq-phase8b-screening .iq-ic-reconciliation-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); margin-top:7px; }
.iq-phase8b-screening .iq-ic-reconciliation-metric { padding:4px 8px; border-left:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .iq-ic-reconciliation-metric:first-child { border-left:0; padding-left:0; }
.iq-phase8b-screening .iq-ic-secondary-label { display:block; color:#767f79; font-size:5.3pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
.iq-phase8b-screening .iq-ic-secondary-value { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-mono); font-size:7.2pt; }
.iq-phase8b-screening .phase8b-diligence-priorities { margin-top:12px; padding-top:8px; border-top:2px solid var(--iq8a-forest); }
.iq-phase8b-screening .phase8b-diligence-priorities ol { margin:0; padding-left:18px; }
.iq-phase8b-screening .phase8b-diligence-priorities li { margin-bottom:5px; font-size:7.5pt; line-height:1.35; }
.iq-phase8b-screening section[data-iq-elite-section="screeningGovernance"] { break-before:page; page-break-before:always; }
.iq-phase8b-screening .phase8b-screening-governance-page { padding-top:0 !important; border-top:0 !important; }
.iq-phase8b-screening .phase8b-governance-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.iq-phase8b-screening .phase8b-governance-grid .card { padding:8px 10px; border:1px solid var(--iq8a-rule); border-top:2px solid var(--iq8a-forest); }
.iq-phase8b-screening .phase8b-governance-grid p { margin:0; font-size:7.5pt; line-height:1.38; }
.iq-phase8b-screening .phase8b-source-register,
.iq-phase8b-screening .phase8b-methodology,
.iq-phase8b-screening .phase8b-quality,
.iq-phase8b-screening .phase8b-report-use { margin-top:12px; padding-top:8px; border-top:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .phase8b-source-register table { margin:0; table-layout:fixed; }
.iq-phase8b-screening .phase8b-source-register th,
.iq-phase8b-screening .phase8b-source-register td { padding:6px 7px; font-size:6.5pt; line-height:1.3; vertical-align:top; }
.iq-phase8b-screening .phase8b-source-register th:nth-child(1),
.iq-phase8b-screening .phase8b-source-register td:nth-child(1) { width:30%; }
.iq-phase8b-screening .phase8b-source-register th:nth-child(2),
.iq-phase8b-screening .phase8b-source-register td:nth-child(2) { width:24%; }
.iq-phase8b-screening .phase8b-methodology ul { display:grid; grid-template-columns:1fr 1fr; gap:5px 20px; margin:0; padding-left:16px; }
.iq-phase8b-screening .phase8b-methodology li { font-size:6.8pt; line-height:1.32; }
.iq-phase8b-screening .phase8b-quality-manifest { margin:0; table-layout:fixed; border-top:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .phase8b-quality-manifest td { width:33.333%; padding:6px 7px 6px 0; background:#fff !important; border-bottom:1px solid var(--iq8a-rule); }
.iq-phase8b-screening .phase8b-quality-manifest span { display:block; color:#767f79; font-size:5.3pt; font-weight:700; letter-spacing:.065em; text-transform:uppercase; }
.iq-phase8b-screening .phase8b-quality-manifest strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-display); font-size:9.2pt; line-height:1.08; }
.iq-phase8b-screening .phase8b-report-use p { margin:0; font-size:7.2pt; line-height:1.4; }
@media print {
  .iq-phase8b-screening section[data-iq-elite-section="screeningDecisionSnapshot"] { break-before:auto !important; page-break-before:auto !important; }
}
</style>`;

function injectStyle(html = "") {
  const source = String(html || "");
  if (source.includes('id="investoriq-phase8b-cross-product-publication-authority"')) return source;
  return /<\/head>/i.test(source) ? source.replace(/<\/head>/i, `${PHASE8B_STYLE}\n</head>`) : `${PHASE8B_STYLE}${source}`;
}

export function applyPhase8BCrossProductPublicationAuthority(html, { lane = null, sourceTruthPackage = null } = {}) {
  let source = String(html || "");
  if (!source || !["screening", "underwriting"].includes(lane)) return source;
  if (lane === "screening") {
    source = replaceScreeningCover(source, sourceTruthPackage);
    source = replaceScreeningDecisionPage(source, sourceTruthPackage);
    source = replaceScreeningEvidencePages(source, sourceTruthPackage);
    source = replaceScreeningGovernancePage(source, sourceTruthPackage);
  }
  return injectStyle(addAuthorityMarker(source, lane));
}

export function phase8BCrossProductPublicationMetadata() {
  return Object.freeze({
    marker: PHASE8B_MARKER,
    publicationSystem: INVESTORIQ_PUBLICATION_DESIGN_SYSTEM_VERSION,
    canonicalVisualAuthority: "underwriting",
    sourceTruthMutationAllowed: false,
    screeningSemanticExpansionAllowed: false,
    completedSlices: Object.freeze(["8B-A", "8B-B", "8B-C", "8B-D", "8B-E"]),
  });
}
