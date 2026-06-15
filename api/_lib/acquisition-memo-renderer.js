/**
 * Dumb renderer. Consumes the projection only.
 * Must not make any document-role or authority decisions.
 * Must not have fallback classification logic.
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<table><tbody><tr><td colspan="4">No support documents provided.</td></tr></tbody></table>';
  }

  const body = rows
    .map((row) => {
      const filename = escapeHtml(row?.originalFilename || "");
      const label = escapeHtml(row?.roleLabel || "");
      const treatment = escapeHtml(row?.treatment || "");
      const use = escapeHtml(row?.use || "");
      return `<tr><td>${filename}</td><td>${label}</td><td>${treatment}</td><td>${use}</td></tr>`;
    })
    .join("");

  return `<table><thead><tr><th>Filename</th><th>Document Role</th><th>Treatment</th><th>Use</th></tr></thead><tbody>${body}</tbody></table>`;
}

function renderCoreSourceSummary(coreSourceSummary) {
  const t12 = coreSourceSummary?.t12;
  const rentRoll = coreSourceSummary?.rentRoll;
  const t12Line = t12
    ? `T12 confirmed as core quantitative source: ${escapeHtml(t12.originalFilename || "")}`
    : "No T12 provided — income/expense modeling requires T12 upload.";
  const rentRollLine = rentRoll
    ? `Rent Roll confirmed as core quantitative source: ${escapeHtml(rentRoll.originalFilename || "")}`
    : "No Rent Roll provided — occupancy and rent modeling requires Rent Roll upload.";
  return `<div><p>${t12Line}</p><p>${rentRollLine}</p></div>`;
}

function renderFinancingReadinessSummary(signals) {
  const lines = [
    signals?.hasPurchaseAssumptions
      ? "Purchase assumptions received."
      : "No purchase assumptions uploaded — proposed acquisition financing terms not available.",
    signals?.hasCurrentDebtContext
      ? "Existing debt context received."
      : "No existing debt context uploaded — current mortgage/debt terms not available.",
    signals?.hasStructuredRenovation
      ? "Structured renovation / CapEx plan received."
      : "No renovation plan uploaded.",
    signals?.hasAppraisalContext ? "Appraisal context received." : "No appraisal uploaded.",
    signals?.hasMarketSurveyContext ? "Market survey context received." : "No market survey uploaded.",
    signals?.hasEnvironmentalContext ? "Environmental / Phase I ESA context received." : "No Phase I ESA uploaded.",
  ];
  return `<div>${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;
}

export function renderAcquisitionMemo(acquisitionMemoProjection) {
  const documentTreatmentSummaryHtml = renderTable(acquisitionMemoProjection?.documentTreatmentRows);
  const coreSourceSummaryHtml = renderCoreSourceSummary(acquisitionMemoProjection?.coreSourceSummary);
  const financingReadinessSummaryHtml = renderFinancingReadinessSummary(acquisitionMemoProjection?.financingReadinessSignals);
  const sourceAuthorityDiagnosticHtml = `<!-- IQ_SOURCE_AUTHORITY: ${JSON.stringify({
    authorityVersion: acquisitionMemoProjection?.authorityVersion || "v2",
    competingDecisionMakersEliminated: Boolean(acquisitionMemoProjection?.sourceAuthorityDiagnostic?.competingDecisionMakersEliminated),
    classifiedBy: acquisitionMemoProjection?.sourceAuthorityDiagnostic?.classifiedBy || "buildCanonicalSourcePackage",
    projectedBy: acquisitionMemoProjection?.sourceAuthorityDiagnostic?.projectedBy || "buildAcquisitionMemoProjection",
    renderedBy: "renderAcquisitionMemo",
  })} -->`;

  return {
    documentTreatmentSummaryHtml,
    coreSourceSummaryHtml,
    financingReadinessSummaryHtml,
    sourceAuthorityDiagnosticHtml,
    authorityVersion: "v2",
  };
}
