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

  const renderFacts = (row) => {
    const facts = row?.extractedFacts && typeof row.extractedFacts === "object" ? row.extractedFacts : {};
    const parts = [];
    if (Number.isFinite(facts.purchase_price)) parts.push(`Purchase Price: $${Number(facts.purchase_price).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(facts.noi_basis)) parts.push(`NOI Basis: $${Number(facts.noi_basis).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(facts.going_in_cap_rate)) parts.push(`Going-In Cap Rate: ${(Number(facts.going_in_cap_rate) * 100).toFixed(1)}%`);
    if (Number.isFinite(facts.proposed_loan_amount)) parts.push(`Proposed Loan Amount: $${Number(facts.proposed_loan_amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(facts.ltv)) parts.push(`LTV: ${(Number(facts.ltv) * 100).toFixed(0)}%`);
    if (Number.isFinite(facts.interest_rate)) parts.push(`Interest Rate: ${(Number(facts.interest_rate) * 100).toFixed(2)}%`);
    if (Number.isFinite(facts.amortization_years)) parts.push(`Amortization: ${Number(facts.amortization_years).toFixed(0)} years`);
    if (Number.isFinite(facts.lender_fee_percent)) parts.push(`Lender Fee: ${(Number(facts.lender_fee_percent) * 100).toFixed(2)}%`);
    if (Number.isFinite(facts.current_outstanding_balance)) parts.push(`Current Outstanding Balance: $${Number(facts.current_outstanding_balance).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(facts.amortization_remaining_years)) parts.push(`Amortization Remaining: ${Number(facts.amortization_remaining_years).toFixed(0)} years`);
    if (Number.isFinite(facts.monthly_payment)) parts.push(`Monthly Payment: $${Number(facts.monthly_payment).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (facts.maturity_date) parts.push(`Maturity Date: ${facts.maturity_date}`);
    if (Number.isFinite(facts.total_renovation_budget)) parts.push(`Total Renovation Budget: $${Number(facts.total_renovation_budget).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (facts.has_rent_lift) parts.push("Rent Lift: Yes");
    if (facts.has_phasing) parts.push("Phasing: Yes");
    if (Number.isFinite(facts.appraisal_value)) parts.push(`Appraisal Value: $${Number(facts.appraisal_value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    return parts.length > 0 ? `<div style="margin-top:4px;color:#374151;font-size:11px;line-height:1.45;">${parts.map((part) => `<div>${escapeHtml(part)}</div>`).join("")}</div>` : "";
  };

  const body = rows
    .map((row) => {
      const filename = escapeHtml(row?.originalFilename || "");
      const label = escapeHtml(row?.roleLabel || "");
      const treatment = escapeHtml(row?.treatment || "");
      const use = escapeHtml(row?.use || "");
      const factsHtml = renderFacts(row);
      return `<tr><td>${filename}</td><td>${label}</td><td>${treatment}</td><td>${use}${factsHtml}</td></tr>`;
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
  const documentTreatmentSummaryHtml = `<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${renderTable(acquisitionMemoProjection?.documentTreatmentRows)}<!-- END DOCUMENT_TREATMENT_SUMMARY -->`;
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
