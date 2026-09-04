export const INVESTORIQ_PUBLICATION_DESIGN_SYSTEM_VERSION = "investoriq-publication-system-v1";

// Presentation-only authority. Callers must resolve all facts, labels, and
// eligibility before passing display-ready content into these primitives.

function escapePublicationHtml(value) {
  return String(value ?? "")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderPublicationSection({
  title,
  sectionKey,
  disposition,
  bodyHtml,
  legacySectionLabel = null,
  allowBreak = false,
  bodyClass = "",
} = {}) {
  if (!bodyHtml) return "";
  const bodyClasses = ["card", allowBreak ? "allow-break" : "no-break", bodyClass].filter(Boolean).join(" ");
  return `<section class="section" data-iq-elite-section="${escapePublicationHtml(sectionKey)}" data-iq-disposition="${escapePublicationHtml(disposition || "include")}"${legacySectionLabel ? ` data-iq-boss-section="${escapePublicationHtml(legacySectionLabel)}"` : ""}>
    <div class="section-header"><span class="section-header-title">${escapePublicationHtml(title)}</span></div>
    <div class="${bodyClasses}">${bodyHtml}</div>
  </section>`;
}

export function renderPublicationCover({
  propertyName,
  fallbackTitle = "InvestorIQ Report",
  location = "",
  reportTitle,
  classification,
  profileLabel,
  profileValue,
  evidenceBasis,
  preparedLabel,
  footerLeft = "Confidential | InvestorIQ Technologies Inc.",
  footerRight,
} = {}) {
  return `<div class="cover-wrap" data-iq-cover-system="elite-10b1-light-institutional-v1">
    <table class="cover-table" width="100%">
      <tr>
        <td class="cover-cell">
          <div class="cover-brand-name">INVESTORIQ</div>
          <div class="cover-brand-sub">Institutional Real Estate Analysis</div>

          <div class="cover-prop-name">${escapePublicationHtml(propertyName || fallbackTitle)}</div>
          ${location ? `<div class="cover-address">${escapePublicationHtml(location)}</div>` : ""}
          <hr class="cover-divider" />
          <div class="cover-prop-sub">${escapePublicationHtml(reportTitle)}</div>
          <div class="cover-classification">
            <span>Review Classification</span>
            <strong>${escapePublicationHtml(classification)}</strong>
          </div>
          <div class="cover-meta-grid">
            <div><span>${escapePublicationHtml(profileLabel)}</span><strong>${escapePublicationHtml(profileValue)}</strong></div>
            <div><span>Evidence Basis</span><strong>${escapePublicationHtml(evidenceBasis)}</strong></div>
            <div><span>Prepared</span><strong>${escapePublicationHtml(preparedLabel)}</strong></div>
          </div>
          <div class="cover-footer-row">
            <span class="cover-footer-text">${escapePublicationHtml(footerLeft)}</span>
            <span class="cover-footer-text">${escapePublicationHtml(footerRight)}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>`;
}

export function renderPublicationDecisionBand({ columns = [], className = "phase8a-investment-decision-band" } = {}) {
  const rendered = (Array.isArray(columns) ? columns : []).map((column) => {
    const detail = column?.detail ? `<p>${escapePublicationHtml(column.detail)}</p>` : "";
    return `<div><span>${escapePublicationHtml(column?.label)}</span><strong>${escapePublicationHtml(column?.value || "Not available")}</strong>${detail}</div>`;
  });
  if (!rendered.length) return "";
  return `<div class="${escapePublicationHtml(className)}">
        ${rendered.join("\n        ")}
      </div>`;
}

export function renderPublicationMetricMatrix({ rows = [], className = "phase8a-investment-snapshot-table" } = {}) {
  const renderedRows = (Array.isArray(rows) ? rows : []).map((row) => {
    const cells = (Array.isArray(row) ? row : []).map((cell) => `<td><span>${escapePublicationHtml(cell?.label)}</span><strong>${escapePublicationHtml(cell?.value || "Not available")}</strong>${cell?.note ? `<em>${escapePublicationHtml(cell.note)}</em>` : ""}</td>`);
    return `<tr>${cells.join("")}</tr>`;
  });
  if (!renderedRows.length) return "";
  return `<table class="${escapePublicationHtml(className)}"><tbody>${renderedRows.join("")}</tbody></table>`;
}

export function renderPublicationThreePanelStrip({ panels = [], className = "phase8a-exec-columns" } = {}) {
  const rendered = (Array.isArray(panels) ? panels : []).map((panel) => {
    const items = (Array.isArray(panel?.items) ? panel.items : []).filter(Boolean);
    if (!items.length) return "";
    return `<div class="phase8a-exec-panel"><p class="subsection-title">${escapePublicationHtml(panel?.title)}</p><ul>${items.map((item) => `<li>${escapePublicationHtml(item)}</li>`).join("")}</ul></div>`;
  }).filter(Boolean);
  if (!rendered.length) return "";
  return `<div class="${escapePublicationHtml(className)}">${rendered.join("")}</div>`;
}

export function renderPublicationObservationGrid({ groups = [] } = {}) {
  const rendered = (Array.isArray(groups) ? groups : []).map((group) => {
    const items = (Array.isArray(group?.items) ? group.items : []).filter((item) => item?.statement);
    if (!items.length) return "";
    const list = items.map((item) => {
      const qualification = item?.qualification
        ? `<div class="small iq-ic-signal-qualification">${escapePublicationHtml(item.qualification)}</div>`
        : "";
      return `<li data-iq-elite-signal="${escapePublicationHtml(item?.code || "")}">${escapePublicationHtml(item.statement)}${qualification}</li>`;
    }).join("");
    return `<div class="iq-ic-signal-panel"><p class="subsection-title">${escapePublicationHtml(group?.label)}</p><ul class="iq-ic-signal-list">${list}</ul></div>`;
  }).filter(Boolean);
  return rendered.length ? `<div class="iq-ic-signal-grid">${rendered.join("")}</div>` : "";
}

export function renderPublicationEvidenceMap({ intro = "", rows = [], note = "" } = {}) {
  const rowHtml = (Array.isArray(rows) ? rows : []).map((row) => `<tr><td>${escapePublicationHtml(row?.domain)}</td><td>${escapePublicationHtml(row?.coverage)}</td><td>${escapePublicationHtml(row?.sections)}</td></tr>`).join("");
  if (!rowHtml) return "";
  return `<div class="card no-break phase7-evidence-conviction-matrix"><p class="subsection-title">Decision Evidence Map</p>${intro ? `<p class="small">${escapePublicationHtml(intro)}</p>` : ""}<table><thead><tr><th>Decision Domain</th><th>Coverage</th><th>Report Sections</th></tr></thead><tbody>${rowHtml}</tbody></table>${note ? `<p class="small">${escapePublicationHtml(note)}</p>` : ""}</div>`;
}

export function renderPublicationReconciliationAlert({
  title = "Source Reconciliation Required",
  disclosure = "",
  metrics = [],
} = {}) {
  const metricHtml = (Array.isArray(metrics) ? metrics : []).map((metric) => `<div class="iq-ic-reconciliation-metric">
      <span class="iq-ic-secondary-label">${escapePublicationHtml(metric?.label)}</span>
      <strong class="iq-ic-secondary-value">${escapePublicationHtml(metric?.value || "Not available")}</strong>
    </div>`).join("");
  return `<div class="iq-callout iq-ic-reconciliation-callout" data-iq-tone="constraint">
        <p class="iq-callout-title">${escapePublicationHtml(title)}</p>
        <p class="iq-callout-copy">${escapePublicationHtml(disclosure)}</p>
      </div><div class="iq-ic-reconciliation-grid">${metricHtml}</div>`;
}

export const INVESTORIQ_UNDERWRITING_OPENING_CSS = `    [data-iq-elite10b2="investment-committee-opening-v1"] .section { padding-bottom:var(--space-5); }
    .iq-ic-summary-card { padding-top:0 !important; }
    .iq-ic-summary-lead { border-top:0; padding:0 0 var(--space-2); }
    .iq-ic-asset-statement { margin:0 0 2px 0; font-family:var(--font-display); font-size:21pt; font-weight:600; line-height:1.08; letter-spacing:-0.02em; color:var(--charcoal); }
    .iq-ic-asset-descriptor { margin:0 0 var(--space-2) 0; font-family:var(--font-mono); font-size:7pt; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-4); }
    .iq-ic-summary-copy { max-width:6.25in; margin-bottom:0; }
    .iq-ic-primary-constraint { margin-top:var(--space-3); margin-bottom:0; }
    .iq-ic-callout-follow { margin-top:var(--space-1); }
    .iq-ic-focus-block { margin-top:var(--space-3); }
    .iq-ic-focus-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--space-4); }
    .iq-ic-focus-item { border-top:0; padding-top:0; color:var(--ink-2); font-size:10.1px; line-height:1.42; break-inside:avoid-page; page-break-inside:avoid; }
    .iq-ic-metrics-card { padding-top:0 !important; }
    .iq-ic-metric-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-top:var(--rule-strong); border-bottom:var(--rule-standard); margin-bottom:var(--space-3); break-inside:avoid-page; page-break-inside:avoid; }
    .iq-ic-metric { min-height:0.82in; padding:var(--space-3) var(--space-3) var(--space-3) 0; }
    .iq-ic-metric:nth-child(3n+2), .iq-ic-metric:nth-child(3n+3) { border-left:var(--rule-soft); padding-left:var(--space-3); }
    .iq-ic-metric:nth-child(n+4) { border-top:var(--rule-soft); }
    .iq-ic-metric-label { display:block; min-height:20px; font-family:var(--font-mono); font-size:6.5pt; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-4); line-height:1.35; }
    .iq-ic-metric-value { display:block; margin-top:4px; font-family:var(--font-display); font-size:17pt; font-weight:600; color:var(--ink); line-height:1.08; font-variant-numeric:tabular-nums; }
    .iq-ic-secondary-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); border-top:var(--rule-soft); border-bottom:var(--rule-soft); break-inside:avoid-page; page-break-inside:avoid; }
    .iq-ic-secondary-metric { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:var(--space-2); align-items:baseline; padding:5px 8px; border-bottom:var(--rule-soft); min-width:0; }
    .iq-ic-secondary-metric:nth-child(odd) { border-right:var(--rule-soft); }
    .iq-ic-secondary-metric:nth-last-child(-n+2) { border-bottom:none; }
    .iq-ic-secondary-label { min-width:0; color:var(--ink-3); font-size:8.5px; line-height:1.35; }
    .iq-ic-secondary-value { color:var(--ink); font-family:var(--font-mono); font-size:8.5px; font-weight:600; text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
    .iq-ic-lineage-note { margin-top:var(--space-2); }
    .iq-ic-observations-card, .iq-ic-risks-card, .iq-ic-questions-card, .iq-ic-reconciliation-card { padding-top:0 !important; }
    .iq-ic-signal-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--space-3) var(--space-4); }
    .iq-ic-signal-panel { border-top:0; padding-top:0; break-inside:avoid-page; page-break-inside:avoid; }
    .iq-ic-signal-list { margin:0; padding-left:16px; }
    .iq-ic-signal-list li { margin-bottom:var(--space-1); color:var(--ink-2); line-height:1.42; }
    .iq-ic-signal-list li:last-child { margin-bottom:0; }
    .iq-ic-signal-qualification { margin-top:2px; color:var(--ink-4); font-style:italic; }
    .iq-ic-risk-list { border-top:var(--rule-standard); }
    .iq-ic-risk-item { padding:var(--space-3) 0; border-bottom:var(--rule-soft); break-inside:avoid-page; page-break-inside:avoid; }
    .iq-ic-risk-item:last-child { border-bottom:none; }
    .iq-ic-risk-item .body-copy:last-child { margin-bottom:0; }
    .iq-ic-question-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--space-3); }
    .iq-ic-question-item { border-top:var(--rule-standard); padding-top:var(--space-2); break-inside:avoid-page; page-break-inside:avoid; }
    .iq-ic-question-copy { margin-top:0; margin-bottom:var(--space-1); color:var(--ink-2); }
    .iq-ic-question-why { margin:0; color:var(--ink-4); }
    .iq-ic-reconciliation-callout { margin-top:0; margin-bottom:var(--space-2); }
    .iq-ic-reconciliation-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); border-top:0; border-bottom:0; break-inside:avoid-page; page-break-inside:avoid; }
    .iq-ic-reconciliation-metric { padding:var(--space-2); border-left:var(--rule-soft); min-width:0; }
    .iq-ic-reconciliation-metric:first-child { border-left:none; }
    .iq-ic-reconciliation-metric .iq-ic-secondary-label { display:block; min-height:24px; }
    .iq-ic-reconciliation-metric .iq-ic-secondary-value { display:block; margin-top:3px; text-align:left; font-size:9px; }`;

export const INVESTORIQ_PHASE8A_PUBLICATION_CSS = `/* Underwriting executive decision page. */
.iq-phase8a-underwriting .phase8a-executive-summary { padding:0 !important; border-top:0 !important; }
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

.iq-phase8a-underwriting .phase8a-investment-decision-band { display:grid; grid-template-columns:1.45fr .8fr .9fr; gap:0; margin:0 0 11px; background:var(--iq8a-forest-deep); color:#fff; }
.iq-phase8a-underwriting .phase8a-investment-decision-band > div { min-width:0; padding:12px 14px; }
.iq-phase8a-underwriting .phase8a-investment-decision-band > div + div { border-left:1px solid rgba(255,255,255,.2); }
.iq-phase8a-underwriting .phase8a-investment-decision-band span { display:block; color:#d6c484; font-size:5.9pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.iq-phase8a-underwriting .phase8a-investment-decision-band strong { display:block; margin-top:3px; color:#fff; font-family:var(--font-display); font-size:16pt; line-height:1.02; }
.iq-phase8a-underwriting .phase8a-investment-decision-band p { margin:4px 0 0; color:#eef1ef; font-size:6.7pt; line-height:1.28; }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table { margin:0; table-layout:fixed; border-top:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td { width:25%; padding:6px 7px 6px 0; background:#fff !important; border-bottom:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td span { display:block; color:#767f79; font-size:5.5pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase; }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-display); font-size:10.7pt; line-height:1.05; }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td em { display:block; margin-top:2px; color:#7a817c; font-size:5.4pt; font-style:normal; line-height:1.2; }
.iq-phase8a-underwriting .phase8a-exec-columns { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:10px; }
.iq-phase8a-underwriting .phase8a-exec-panel { padding-top:7px; border-top:2px solid var(--iq8a-forest); }
.iq-phase8a-underwriting .phase8a-exec-panel li { margin-bottom:3px; font-size:6.7pt; line-height:1.28; }
.iq-phase8a-underwriting .phase8a-exec-boundary { margin-top:6px; font-size:5.7pt; line-height:1.25; }

/* Final owner-acceptance editorial treatment for the decision evidence map. */
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix { margin-top:10px !important; padding:10px 12px !important; border:1px solid var(--iq8a-rule) !important; border-top:2px solid var(--iq8a-forest) !important; background:#fff !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix .subsection-title { margin-bottom:3px !important; font-size:10pt !important; color:var(--iq8a-ink) !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix > p.small { margin:0 0 6px !important; color:#6e7771 !important; font-size:5.9pt !important; line-height:1.3 !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix table { width:100% !important; table-layout:fixed !important; margin-top:5px !important; border-collapse:collapse !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th { padding:5px 6px !important; color:#68716b !important; font-size:5.5pt !important; letter-spacing:.065em !important; text-transform:uppercase !important; vertical-align:bottom !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td { padding:5px 6px !important; font-size:5.9pt !important; line-height:1.32 !important; vertical-align:top !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th:nth-child(1),
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td:nth-child(1) { width:21% !important; font-weight:600 !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th:nth-child(2),
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td:nth-child(2) { width:11% !important; text-align:center !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th:nth-child(3),
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td:nth-child(3) { width:68% !important; }
.iq-phase8a-underwriting .phase7-evidence-conviction-matrix tbody tr:nth-child(even) td { background:#fbfaf7 !important; }

/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */
.iq-phase8a-underwriting .cover-classification { border-left-color:var(--iq8a-forest) !important; background:rgba(23,63,43,.045) !important; }
.iq-phase8a-underwriting .cover-classification strong,
.iq-phase8a-underwriting .cover-meta-grid strong { color:var(--iq8a-ink) !important; }`;

export function publicationDesignSystemMetadata() {
  return Object.freeze({
    version: INVESTORIQ_PUBLICATION_DESIGN_SYSTEM_VERSION,
    canonicalVisualAuthority: "underwriting",
    sourceTruthMutationAllowed: false,
    analyticalAuthorityCreating: false,
    screeningSemanticExpansionAllowed: false,
    extractedPrimitives: Object.freeze([
      "PublicationCover",
      "PublicationSection",
      "DecisionBand",
      "MetricMatrix",
      "ThreePanelDecisionStrip",
      "EvidenceMapTable",
      "ObservationGrid",
      "ReconciliationAlert",
      "InstitutionalOpeningStyles",
      "Phase8AOwnerAcceptanceStyles",
    ]),
  });
}
