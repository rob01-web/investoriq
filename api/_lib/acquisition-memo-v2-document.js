function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripDocumentTreatmentSummaryMarkers(html) {
  return String(html || "")
    .replace(/<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->/gi, "")
    .replace(/<!-- END DOCUMENT_TREATMENT_SUMMARY -->/gi, "");
}

function renderMetaLine(label, value) {
  if (!value) return "";
  return `<div class="meta-line"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${escapeHtml(value)}</span></div>`;
}

function renderSourceTableRows(sourcePackage = null) {
  const rows = [];
  const t12 = sourcePackage?.coreT12 || null;
  const rentRoll = sourcePackage?.coreRentRoll || null;
  if (t12?.originalFilename) {
    rows.push(`<tr><td>Trailing 12-Month Income Statement</td><td style="font-weight:600;">${escapeHtml(t12.originalFilename)}</td></tr>`);
  }
  if (rentRoll?.originalFilename) {
    rows.push(`<tr><td>Rent Roll</td><td style="font-weight:600;">${escapeHtml(rentRoll.originalFilename)}</td></tr>`);
  }
  return rows;
}

function renderReadinessSection({ renderedAcquisitionMemo = null, acquisitionMemoProjection = null } = {}) {
  const signals = acquisitionMemoProjection?.financingReadinessSignals || {};
  const currentDebtContextValue = Boolean(signals?.hasCurrentDebtContext) ? "Yes" : "No";
  const summaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.financingReadinessSummaryHtml || "").trim();
  const summaryBlock = summaryHtml
    ? `<div class="readiness-summary">${summaryHtml}</div>`
    : `<p class="body-copy">Shown for lender discussion and acquisition diligence support only.</p>`;
  const rows = [
    `<tr><td>Current debt context uploaded</td><td style="font-weight:600;">${currentDebtContextValue}</td></tr>`,
    `<tr><td>Purchase assumptions provided</td><td style="font-weight:600;">${Boolean(signals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Structured renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(signals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Appraisal context</td><td style="font-weight:600;">${Boolean(signals?.hasAppraisalContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Market survey context</td><td style="font-weight:600;">${Boolean(signals?.hasMarketSurveyContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Environmental / Phase I ESA context</td><td style="font-weight:600;">${Boolean(signals?.hasEnvironmentalContext) ? "Yes" : "No"}</td></tr>`,
  ];
  return `<section class="section page-break" aria-labelledby="prelim-readiness-title"><div class="section-header"><span id="prelim-readiness-title" class="section-header-title">Preliminary Financing Readiness Summary</span></div><div class="card no-break">${summaryBlock}<div class="subsection-block"><p class="subsection-title">Lender Diligence Checklist</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table></div></div></section>`;
}

function renderDocumentTreatmentSection(renderedAcquisitionMemo = null) {
  const tableHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.documentTreatmentSummaryHtml || "").trim();
  if (!tableHtml) return "";
  return `<section class="section page-break" aria-labelledby="document-treatment-title"><div class="section-header"><span id="document-treatment-title" class="section-header-title">Source Context / Support Document Treatment</span></div><div class="card no-break"><p class="subsection-title">Document Treatment Summary</p>${tableHtml}</div></section>`;
}

export function renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection = null,
  renderedAcquisitionMemo = null,
  sourcePackage = null,
  coreMetrics = null,
  reportMeta = null,
  propertyProfile = null,
} = {}) {
  const propertyName = propertyProfile?.propertyName || propertyProfile?.property_name || reportMeta?.propertyName || reportMeta?.property_name || sourcePackage?.propertyName || "Acquisition Memo V2";
  const propertyAddress = propertyProfile?.propertyAddress || propertyProfile?.property_address || reportMeta?.propertyAddress || reportMeta?.property_address || "";
  const propertyTitle = propertyProfile?.propertyTitle || propertyProfile?.property_title || reportMeta?.propertyTitle || reportMeta?.property_title || "";
  const reportType = reportMeta?.reportType || reportMeta?.report_type || "Acquisition Memo";
  const reportMode = reportMeta?.reportMode || reportMeta?.report_mode || "v1_core";
  const generatedLabel = reportMeta?.generatedAt || reportMeta?.generated_at || "";
  const sourceRows = renderSourceTableRows(sourcePackage);
  const readinessSection = renderReadinessSection({ renderedAcquisitionMemo, acquisitionMemoProjection });
  const treatmentSection = renderDocumentTreatmentSection(renderedAcquisitionMemo);
  const coreMetricsRows = [];
  if (Number.isFinite(Number(coreMetrics?.occupancy))) coreMetricsRows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${Number(coreMetrics.occupancy).toFixed(1)}%</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.annualInPlaceRent))) coreMetricsRows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">$${Number(coreMetrics.annualInPlaceRent).toLocaleString("en-US", { maximumFractionDigits: 0 })}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noi))) coreMetricsRows.push(`<tr><td>NOI</td><td style="font-weight:600;">$${Number(coreMetrics.noi).toLocaleString("en-US", { maximumFractionDigits: 0 })}</td></tr>`);

  const sourceAuthorityDiagnosticHtml = renderedAcquisitionMemo?.sourceAuthorityDiagnosticHtml || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(`${propertyName} - Acquisition Memo V2`)}</title>
  <style>
    :root { --ink:#102033; --muted:#5b6472; --border:#d7dde5; --bg:#f7f8fb; --panel:#ffffff; --accent:#b8860b; }
    html, body { margin:0; padding:0; background:var(--bg); color:var(--ink); font-family: Arial, Helvetica, sans-serif; font-size:12px; line-height:1.5; }
    body { padding:24px; }
    .report { max-width: 980px; margin: 0 auto; }
    .header { background:linear-gradient(180deg,#ffffff 0%,#fdfdfd 100%); border:1px solid var(--border); border-radius:14px; padding:20px 22px; margin-bottom:16px; }
    .eyebrow { text-transform:uppercase; letter-spacing:.14em; font-size:10px; color:var(--muted); margin:0 0 8px 0; }
    .title { font-size:28px; font-weight:700; margin:0 0 4px 0; }
    .subtitle { font-size:14px; color:var(--muted); margin:0; }
    .meta-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 18px; margin-top:14px; }
    .meta-line { display:flex; justify-content:space-between; gap:12px; border-top:1px solid rgba(215,221,229,.7); padding-top:8px; }
    .meta-label { color:var(--muted); }
    .meta-value { font-weight:600; text-align:right; }
    .section { margin-bottom:16px; }
    .section-header { border-bottom:1px solid var(--border); margin-bottom:12px; padding-bottom:8px; }
    .section-header-title { font-size:18px; font-weight:700; }
    .card { background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:18px 18px 16px; box-shadow:0 1px 1px rgba(16,32,51,.03); }
    .no-break { break-inside:avoid; page-break-inside:avoid; }
    .body-copy { margin:0 0 12px 0; color:var(--muted); }
    .subsection-block + .subsection-block { margin-top:14px; }
    .subsection-title { margin:0 0 8px 0; font-size:11px; text-transform:uppercase; letter-spacing:.12em; color:#6b7280; }
    .detail-table { width:100%; border-collapse:collapse; font-size:12px; }
    .detail-table td { border-top:1px solid var(--border); padding:7px 8px; vertical-align:top; }
    .detail-table tr:first-child td { border-top:none; }
    .detail-table td:first-child { width:68%; }
    .readiness-summary { margin-bottom:10px; }
    .source-table { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
    .source-table td { border-top:1px solid var(--border); padding:7px 8px; vertical-align:top; }
    .source-table tr:first-child td { border-top:none; }
    .source-table td:first-child { width:55%; }
    .footer-note { margin-top:16px; color:var(--muted); font-size:11px; }
  </style>
</head>
<body>
  <main class="report">
    <section class="header">
      <p class="eyebrow">${escapeHtml(reportType)}${reportMode ? ` | ${escapeHtml(reportMode)}` : ""}</p>
      <h1 class="title">${escapeHtml(propertyName)}</h1>
      ${propertyTitle ? `<p class="subtitle">${escapeHtml(propertyTitle)}</p>` : ""}
      ${propertyAddress ? `<p class="subtitle">${escapeHtml(propertyAddress)}</p>` : ""}
      <div class="meta-grid">
        ${renderMetaLine("Generated", generatedLabel)}
        ${renderMetaLine("Report Type", reportType)}
        ${renderMetaLine("Report Mode", reportMode)}
      </div>
      ${coreMetricsRows.length ? `<div class="subsection-block" style="margin-top:14px;"><p class="subsection-title">Core Metrics</p><table class="detail-table"><tbody>${coreMetricsRows.join("")}</tbody></table></div>` : ""}
      ${sourceRows.length ? `<div class="subsection-block"><p class="subsection-title">Core Quantitative Sources</p><table class="source-table"><tbody>${sourceRows.join("")}</tbody></table></div>` : ""}
    </section>
    ${readinessSection}
    ${treatmentSection}
    ${sourceAuthorityDiagnosticHtml ? `<div class="footer-note">${sourceAuthorityDiagnosticHtml}</div>` : ""}
  </main>
</body>
</html>`;
}
