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

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatPercentDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(1)}%`;
}

function getSupportDocs(sourcePackage = null) {
  const supportDocs = sourcePackage?.supportDocs instanceof Map ? Array.from(sourcePackage.supportDocs.values()) : [];
  const roleOrder = new Map([
    ["purchase_assumptions", 0],
    ["current_debt_context", 1],
    ["structured_renovation_capex_plan", 2],
    ["appraisal_context", 3],
    ["market_survey_context", 4],
    ["environmental_context", 5],
    ["other_support", 99],
  ]);
  return supportDocs
    .filter((doc) => doc && typeof doc === "object")
    .sort((a, b) => {
      const aRank = roleOrder.get(String(a?.canonicalRole || "").trim()) ?? 50;
      const bRank = roleOrder.get(String(b?.canonicalRole || "").trim()) ?? 50;
      if (aRank !== bRank) return aRank - bRank;
      return String(a?.originalFilename || a?.canonicalLabel || a?.roleLabel || "").localeCompare(String(b?.originalFilename || b?.canonicalLabel || b?.roleLabel || ""));
    });
}

function renderSection(title, bodyHtml, { id = "", pageBreakBefore = false } = {}) {
  const attrs = [
    `class="section${pageBreakBefore ? " section-break" : ""}"`,
    id ? `aria-labelledby="${escapeHtml(id)}"` : "",
  ].filter(Boolean).join(" ");
  return `<section ${attrs}><div class="section-header"><span${id ? ` id="${escapeHtml(id)}"` : ""} class="section-header-title">${escapeHtml(title)}</span></div><div class="card no-break">${bodyHtml}</div></section>`;
}

function renderMetaLine(label, value) {
  if (!value) return "";
  return `<div class="meta-line"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${escapeHtml(value)}</span></div>`;
}

function renderSourceDocRows(sourcePackage = null) {
  const rows = [];
  const t12 = sourcePackage?.coreT12 || null;
  const rentRoll = sourcePackage?.coreRentRoll || null;
  if (t12?.originalFilename) {
    rows.push(`<tr><td>Trailing 12-Month Income Statement</td><td style="font-weight:600;">${escapeHtml(t12.originalFilename)}</td><td>${escapeHtml(t12.roleLabel || t12.canonicalLabel || "Core Quantitative Source")}</td></tr>`);
  }
  if (rentRoll?.originalFilename) {
    rows.push(`<tr><td>Rent Roll</td><td style="font-weight:600;">${escapeHtml(rentRoll.originalFilename)}</td><td>${escapeHtml(rentRoll.roleLabel || rentRoll.canonicalLabel || "Core Quantitative Source")}</td></tr>`);
  }
  return rows;
}

function renderSupportDocRows(sourcePackage = null) {
  return getSupportDocs(sourcePackage).map((doc) => {
    const filename = doc?.originalFilename || doc?.roleLabel || doc?.canonicalLabel || doc?.canonicalRole || "Support Document";
    return `<tr><td>${escapeHtml(filename)}</td><td style="font-weight:600;">${escapeHtml(doc?.canonicalLabel || doc?.roleLabel || doc?.canonicalRole || "Other Support Document")}</td><td>${escapeHtml(doc?.treatment || "")}</td><td>${escapeHtml(doc?.use || "")}</td></tr>`;
  });
}

function renderReadinessBodyHtml({ renderedAcquisitionMemo = null, acquisitionMemoProjection = null } = {}) {
  const signals = acquisitionMemoProjection?.financingReadinessSignals || {};
  const summaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.financingReadinessSummaryHtml || "").trim();
  return summaryHtml
    ? `<div class="readiness-summary">${summaryHtml}</div>`
    : `<p class="body-copy">Shown for lender discussion and acquisition diligence support only.</p>`;
}

function renderReadinessSection({ renderedAcquisitionMemo = null, acquisitionMemoProjection = null } = {}) {
  const signals = acquisitionMemoProjection?.financingReadinessSignals || {};
  const currentDebtContextValue = Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No";
  const rows = [
    `<tr><td>Current debt context uploaded</td><td style="font-weight:600;">${currentDebtContextValue}</td></tr>`,
    `<tr><td>Purchase assumptions provided</td><td style="font-weight:600;">${Boolean(signals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Structured renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(signals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Appraisal context</td><td style="font-weight:600;">${Boolean(signals?.hasAppraisalContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Market survey context</td><td style="font-weight:600;">${Boolean(signals?.hasMarketSurveyContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Environmental / Phase I ESA context</td><td style="font-weight:600;">${Boolean(signals?.hasEnvironmentalContext) ? "Yes" : "No"}</td></tr>`,
  ];
  return renderSection(
    "Preliminary Financing Readiness Summary",
    `${renderReadinessBodyHtml({ renderedAcquisitionMemo, acquisitionMemoProjection })}<div class="subsection-block"><p class="subsection-title">Lender Diligence Checklist</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table></div>`,
    { id: "prelim-readiness-title", pageBreakBefore: true }
  );
}

function renderDocumentTreatmentSection(renderedAcquisitionMemo = null, sourcePackage = null) {
  const tableHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.documentTreatmentSummaryHtml || "").trim();
  if (!tableHtml) return "";
  const supportDocRows = renderSupportDocRows(sourcePackage);
  const docRowsHtml = supportDocRows.length
    ? `<div class="subsection-block"><p class="subsection-title">Support Document Treatment</p><table class="detail-table"><tbody>${supportDocRows.join("")}</tbody></table></div>`
    : "";
  return renderSection(
    "Source Context / Support Document Treatment",
    `<p class="subsection-title">Document Treatment Summary</p>${tableHtml}${docRowsHtml}`,
    { id: "document-treatment-title", pageBreakBefore: true }
  );
}

function renderSummarySection({ sourcePackage = null, renderedAcquisitionMemo = null, acquisitionMemoProjection = null } = {}) {
  const supportDocCount = getSupportDocs(sourcePackage).length;
  const t12Name = sourcePackage?.coreT12?.originalFilename || "Not present";
  const rentRollName = sourcePackage?.coreRentRoll?.originalFilename || "Not present";
  const rows = [
    `<tr><td>Core T12</td><td style="font-weight:600;">${escapeHtml(t12Name)}</td></tr>`,
    `<tr><td>Core Rent Roll</td><td style="font-weight:600;">${escapeHtml(rentRollName)}</td></tr>`,
    `<tr><td>Support docs classified</td><td style="font-weight:600;">${supportDocCount > 0 ? String(supportDocCount) : "0"}</td></tr>`,
    `<tr><td>Current debt context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
  ];
  const renderedCoreSourceSummary = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  return renderSection(
    "Acquisition Memo Summary",
    `<p class="body-copy">Document-driven Acquisition Memo V2 summary built from the canonical source package, the V2 projection, and the source-authority render. The document owner keeps fact authority in the V2 path and avoids legacy row or marker patching.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>${renderedCoreSourceSummary ? `<div class="subsection-block"><p class="subsection-title">Core Quantitative Sources</p>${renderedCoreSourceSummary}</div>` : ""}`,
    { id: "acq-summary-title", pageBreakBefore: false }
  );
}

function renderMetricsSnapshotSection(coreMetrics = null) {
  const rows = [];
  if (Number.isFinite(Number(coreMetrics?.occupancy))) rows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.annualInPlaceRent))) rows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualInPlaceRent)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.annualMarketRent))) rows.push(`<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualMarketRent)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.egi))) rows.push(`<tr><td>EGI</td><td style="font-weight:600;">${formatMoney(coreMetrics.egi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.opEx))) rows.push(`<tr><td>Operating Expenses</td><td style="font-weight:600;">${formatMoney(coreMetrics.opEx)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noi))) rows.push(`<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(coreMetrics.noi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.expenseRatio))) rows.push(`<tr><td>Expense Ratio</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.expenseRatio)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noiMargin))) rows.push(`<tr><td>NOI Margin</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.noiMargin)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.breakEvenOccupancy))) rows.push(`<tr><td>Break-Even Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.breakEvenOccupancy)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.purchasePrice))) rows.push(`<tr><td>Purchase Price</td><td style="font-weight:600;">${formatMoney(coreMetrics.purchasePrice)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.goingInCapRate))) rows.push(`<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.goingInCapRate)}</td></tr>`);
  return renderSection(
    "Key Metrics Snapshot",
    rows.length ? `<table class="detail-table"><tbody>${rows.join("")}</tbody></table>` : `<p class="body-copy">No core metrics were available for snapshot rendering.</p>`,
    { id: "key-metrics-title", pageBreakBefore: true }
  );
}

function renderOperatingSnapshotSection({ sourcePackage = null, coreMetrics = null } = {}) {
  const rentRollSnippet = sourcePackage?.coreRentRoll?.sourceEvidence?.textSnippet || "";
  const t12Snippet = sourcePackage?.coreT12?.sourceEvidence?.textSnippet || "";
  const rows = [
    `<tr><td>Core T12 source</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreT12?.originalFilename || "Not present")}</td></tr>`,
    `<tr><td>Core Rent Roll source</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td></tr>`,
    `<tr><td>Occupancy</td><td style="font-weight:600;">${Number.isFinite(Number(coreMetrics?.occupancy)) ? formatPercentDisplay(coreMetrics.occupancy) : "Not available"}</td></tr>`,
    `<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${Number.isFinite(Number(coreMetrics?.annualInPlaceRent)) ? formatMoney(coreMetrics.annualInPlaceRent) : "Not available"}</td></tr>`,
    `<tr><td>Annual Market Rent</td><td style="font-weight:600;">${Number.isFinite(Number(coreMetrics?.annualMarketRent)) ? formatMoney(coreMetrics.annualMarketRent) : "Not available"}</td></tr>`,
  ];
  const snippets = [t12Snippet, rentRollSnippet].filter(Boolean).map((snippet) => `<p class="body-copy">${escapeHtml(snippet.slice(0, 420))}</p>`).join("");
  return renderSection(
    "Operating Snapshot",
    `<table class="detail-table"><tbody>${rows.join("")}</tbody></table>${snippets ? `<div class="subsection-block"><p class="subsection-title">Source Excerpts</p>${snippets}</div>` : ""}`,
    { id: "operating-snapshot-title", pageBreakBefore: true }
  );
}

function renderUnitMixSection({ sourcePackage = null, coreMetrics = null } = {}) {
  const rentRollSnippet = sourcePackage?.coreRentRoll?.sourceEvidence?.textSnippet || "";
  const rows = [
    `<tr><td>Rent positioning anchor</td><td style="font-weight:600;">${Number.isFinite(Number(coreMetrics?.annualInPlaceRent)) && Number.isFinite(Number(coreMetrics?.annualMarketRent)) ? `${formatMoney(coreMetrics.annualInPlaceRent)} vs ${formatMoney(coreMetrics.annualMarketRent)}` : "Not available"}</td></tr>`,
    `<tr><td>Occupancy basis</td><td style="font-weight:600;">${Number.isFinite(Number(coreMetrics?.occupancy)) ? formatPercentDisplay(coreMetrics.occupancy) : "Not available"}</td></tr>`,
    `<tr><td>Core rent roll evidence</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td></tr>`,
  ];
  return renderSection(
    "Unit Mix / Rent Positioning",
    `<p class="body-copy">Rent positioning is anchored to the canonical rent roll and the in-place versus market rent spread. Unit-level detail remains source-driven and is not re-authored here.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>${rentRollSnippet ? `<div class="subsection-block"><p class="subsection-title">Rent Roll Snippet</p><p class="body-copy">${escapeHtml(rentRollSnippet.slice(0, 420))}</p></div>` : ""}`,
    { id: "unit-mix-title", pageBreakBefore: true }
  );
}

function renderValueSensitivitySection({ coreMetrics = null } = {}) {
  const annualRentUpside = Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))
    ? Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent)
    : null;
  const capRate = Number(coreMetrics?.goingInCapRate);
  const impliedValue = Number.isFinite(Number(coreMetrics?.noi)) && Number.isFinite(capRate) && capRate > 0
    ? Number(coreMetrics.noi) / capRate
    : null;
  const valueDelta = Number.isFinite(impliedValue) && Number.isFinite(Number(coreMetrics?.purchasePrice))
    ? impliedValue - Number(coreMetrics.purchasePrice)
    : null;
  const rows = [
    `<tr><td>Annual rent upside</td><td style="font-weight:600;">${Number.isFinite(annualRentUpside) ? formatMoney(annualRentUpside) : "Not available"}</td></tr>`,
    `<tr><td>Implied value at going-in cap rate</td><td style="font-weight:600;">${Number.isFinite(impliedValue) ? formatMoney(impliedValue) : "Not available"}</td></tr>`,
    `<tr><td>Value delta vs purchase price</td><td style="font-weight:600;">${Number.isFinite(valueDelta) ? formatMoney(valueDelta) : "Not available"}</td></tr>`,
  ];
  return renderSection(
    "Rent Upside / Value Sensitivity",
    `<p class="body-copy">Value sensitivity is shown only from the canonical V2 inputs and the projection-safe cap-rate frame. No additional transaction narrative is introduced.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>`,
    { id: "value-sensitivity-title", pageBreakBefore: true }
  );
}

function renderDataCoverageSection({ sourcePackage = null, renderedAcquisitionMemo = null, acquisitionMemoProjection = null } = {}) {
  const supportDocs = getSupportDocs(sourcePackage);
  const rows = [
    `<tr><td>Core T12</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreT12?.originalFilename || "Not present")}</td><td>${escapeHtml(sourcePackage?.coreT12?.roleLabel || sourcePackage?.coreT12?.canonicalLabel || "")}</td></tr>`,
    `<tr><td>Core Rent Roll</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td><td>${escapeHtml(sourcePackage?.coreRentRoll?.roleLabel || sourcePackage?.coreRentRoll?.canonicalLabel || "")}</td></tr>`,
    `<tr><td>Support docs classified</td><td style="font-weight:600;">${supportDocs.length}</td><td>${escapeHtml(sourcePackage?.authorityVersion || "v2")}</td></tr>`,
  ];
  const sourceSummaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  const treatmentSummaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.financingReadinessSummaryHtml || "").trim();
  const stateRows = [
    `<tr><td>Current debt context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Structured renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Appraisal context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasAppraisalContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Market survey context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasMarketSurveyContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Environmental / Phase I ESA context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasEnvironmentalContext) ? "Yes" : "No"}</td></tr>`,
  ];
  const supportDocsRows = supportDocs
    .map((doc) => `<tr><td>${escapeHtml(doc?.originalFilename || doc?.canonicalLabel || doc?.roleLabel || "Support Document")}</td><td style="font-weight:600;">${escapeHtml(doc?.canonicalLabel || doc?.roleLabel || doc?.canonicalRole || "Other Support Document")}</td><td>${escapeHtml(doc?.treatment || "")}</td><td>${escapeHtml(doc?.use || "")}</td></tr>`)
    .join("");
  return renderSection(
    "Data Coverage / Source Reliability",
    `<table class="detail-table"><tbody>${rows.join("")}</tbody></table><div class="subsection-block"><p class="subsection-title">Support-Doc Reliability Snapshot</p><table class="detail-table"><tbody>${stateRows.join("")}</tbody></table></div>${sourceSummaryHtml ? `<div class="subsection-block"><p class="subsection-title">Core Source Summary</p>${sourceSummaryHtml}</div>` : ""}${treatmentSummaryHtml ? `<div class="subsection-block"><p class="subsection-title">Financing Readiness Detail</p>${treatmentSummaryHtml}</div>` : ""}${supportDocsRows ? `<div class="subsection-block"><p class="subsection-title">Support Document Registry</p><table class="detail-table"><tbody>${supportDocsRows}</tbody></table></div>` : ""}`,
    { id: "data-coverage-title", pageBreakBefore: true }
  );
}

function renderMethodologySection() {
  return renderSection(
    "Methodology / Limitations",
    `<p class="body-copy">Acquisition Memo V2 is document-driven, fail-closed, and source-authority bound. The V2 body is rendered directly from the canonical source package and V2 projection so the report does not depend on legacy marker replacement, row mutation, or append-after-HTML fallback behavior.</p><p class="body-copy">The memo is limited to operating context, support-document treatment, and lender-readiness disclosure. It does not add advanced underwriting outputs beyond the source-backed memo shell.</p>`,
    { id: "methodology-title", pageBreakBefore: true }
  );
}

export function renderAcquisitionMemo(acquisitionMemoProjection) {
  const documentTreatmentRows = Array.isArray(acquisitionMemoProjection?.documentTreatmentRows)
    ? acquisitionMemoProjection.documentTreatmentRows.filter((row) => row && typeof row === "object")
    : [];
  const documentTreatmentHtmlRows = documentTreatmentRows
    .map((row) => {
      const filename = row?.originalFilename || row?.original_filename || row?.fileId || "Support Document";
      const roleLabel = row?.canonicalLabel || row?.roleLabel || row?.canonicalRole || "Other Support Document";
      const treatment = row?.treatment || "";
      const use = row?.use || "";
      return `<tr><td>${escapeHtml(filename)}</td><td style="font-weight:600;">${escapeHtml(roleLabel)}</td><td>${escapeHtml(treatment)}</td><td>${escapeHtml(use)}</td></tr>`;
    })
    .join("");
  const documentTreatmentSummaryHtml = `<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY --><table class="detail-table"><tbody>${documentTreatmentHtmlRows}</tbody></table><!-- END DOCUMENT_TREATMENT_SUMMARY -->`;
  const coreSourceRows = renderSourceDocRows({
    coreT12: acquisitionMemoProjection?.coreSourceSummary?.t12 || null,
    coreRentRoll: acquisitionMemoProjection?.coreSourceSummary?.rentRoll || null,
  });
  const coreSourceSummaryHtml = coreSourceRows.length
    ? `<table class="detail-table"><tbody>${coreSourceRows.join("")}</tbody></table>`
    : "";
  const financingReadinessSummaryHtml = renderReadinessBodyHtml({
    acquisitionMemoProjection,
  });
  const sourceAuthorityDiagnosticHtml = `<!-- IQ_SOURCE_AUTHORITY: ${JSON.stringify({
    competingDecisionMakersEliminated: true,
    authorityVersion: "v2",
    classifiedBy: "buildCanonicalSourcePackage",
    projectedBy: "buildAcquisitionMemoProjection",
  })} -->`;

  return {
    documentTreatmentSummaryHtml,
    coreSourceSummaryHtml,
    financingReadinessSummaryHtml,
    sourceAuthorityDiagnosticHtml,
  };
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
  const sourceRows = renderSourceDocRows(sourcePackage);
  const summarySection = renderSummarySection({ sourcePackage, renderedAcquisitionMemo, acquisitionMemoProjection });
  const metricsSection = renderMetricsSnapshotSection(coreMetrics);
  const operatingSection = renderOperatingSnapshotSection({ sourcePackage, coreMetrics });
  const unitMixSection = renderUnitMixSection({ sourcePackage, coreMetrics });
  const valueSensitivitySection = renderValueSensitivitySection({ coreMetrics });
  const readinessSection = renderReadinessSection({ renderedAcquisitionMemo, acquisitionMemoProjection });
  const dataCoverageSection = renderDataCoverageSection({ sourcePackage, renderedAcquisitionMemo, acquisitionMemoProjection });
  const treatmentSection = renderDocumentTreatmentSection(renderedAcquisitionMemo, sourcePackage);
  const methodologySection = renderMethodologySection();
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
    .section-break { break-before: page; page-break-before: always; }
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
    .detail-table td:first-child { width:34%; }
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
      ${sourceRows.length ? `<div class="subsection-block" style="margin-top:14px;"><p class="subsection-title">Core Quantitative Sources</p><table class="source-table"><tbody>${sourceRows.map((row) => row).join("")}</tbody></table></div>` : ""}
    </section>
    ${summarySection}
    ${metricsSection}
    ${operatingSection}
    ${unitMixSection}
    ${valueSensitivitySection}
    ${readinessSection}
    ${dataCoverageSection}
    ${treatmentSection}
    ${methodologySection}
    ${sourceAuthorityDiagnosticHtml ? `<div class="footer-note">${sourceAuthorityDiagnosticHtml}</div>` : ""}
  </main>
</body>
</html>`;
}
