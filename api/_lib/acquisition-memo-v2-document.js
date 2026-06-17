import { toCapRatio } from "./report-number-helpers.js";

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

function formatCapRateValue(noiBasis, capRatePct) {
  const capRatio = toCapRatio(capRatePct);
  const noi = Number(noiBasis);
  if (!Number.isFinite(noi) || !Number.isFinite(capRatio) || capRatio <= 0) return "";
  return formatMoney(noi / capRatio);
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

function renderBrandCoverSection({ propertyName, propertyAddress, propertyTitle, reportMeta, sourcePackage }) {
  const sourceRows = renderSourceDocRows(sourcePackage);
  const assetClass = Number.isFinite(Number(sourcePackage?.coreRentRoll?.extractedFacts?.total_units))
    ? `Multifamily | ${Math.round(Number(sourcePackage.coreRentRoll.extractedFacts.total_units))} Units`
    : "Multifamily";
  const badge = reportMeta?.reportTier === 2 ? "Tier II Launch Memo" : "Launch Memo";
  return `<section class="cover">
    <div class="cover-shell">
      <div class="cover-brand">INVESTORIQ CONFIDENTIAL</div>
      <div class="cover-kicker">${escapeHtml(badge)}</div>
      <h1 class="cover-title">Acquisition Memo</h1>
      <p class="cover-subtitle">${escapeHtml(propertyName || "Property")}</p>
      ${propertyTitle ? `<p class="cover-meta">${escapeHtml(propertyTitle)}</p>` : ""}
      ${propertyAddress ? `<p class="cover-meta">${escapeHtml(propertyAddress)}</p>` : ""}
      <div class="cover-grid">
        <div><span>Asset Class</span><strong>${escapeHtml(assetClass)}</strong></div>
        <div><span>Source Authority</span><strong>V2 Canonical Package</strong></div>
        <div><span>Memo Status</span><strong>Confidential / Customer Facing</strong></div>
      </div>
      ${sourceRows.length ? `<div class="cover-sources"><p class="subsection-title">Core Quantitative Sources</p><table class="source-table"><tbody>${sourceRows.join("")}</tbody></table></div>` : ""}
    </div>
  </section>`;
}

function renderExecutiveSummarySection({ sourcePackage = null, acquisitionMemoProjection = null, coreMetrics = null } = {}) {
  const supportDocCount = getSupportDocs(sourcePackage).length;
  const rows = [
    `<tr><td>Source authority version</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.authorityVersion || "v2")}</td></tr>`,
    `<tr><td>Core T12</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreT12?.originalFilename || "Not present")}</td></tr>`,
    `<tr><td>Core Rent Roll</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td></tr>`,
    `<tr><td>Support docs classified</td><td style="font-weight:600;">${supportDocCount}</td></tr>`,
    `<tr><td>Current debt context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
  ];
  const occupancy = Number.isFinite(Number(coreMetrics?.occupancy)) ? formatPercentDisplay(coreMetrics.occupancy) : "Not available";
  const noi = Number.isFinite(Number(coreMetrics?.noi)) ? formatMoney(coreMetrics.noi) : "Not available";
  const annualUpside = Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))
    ? formatMoney(Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent))
    : "Not available";
  return `<div class="card no-break">
    <p class="subsection-title">Executive Summary</p>
    <p class="body-copy">InvestorIQ Acquisition Memo. This memo is document-driven and source-authority bound: the canonical source package determines document roles, the V2 projection determines readiness and checklist state, and the report shell stays presentation-only.</p>
    <table class="detail-table"><tbody>${rows.join("")}</tbody></table>
    <div class="summary-strip">
      <div><span>Occupancy</span><strong>${escapeHtml(occupancy)}</strong></div>
      <div><span>NOI</span><strong>${escapeHtml(noi)}</strong></div>
      <div><span>Annual Rent Upside</span><strong>${escapeHtml(annualUpside)}</strong></div>
    </div>
  </div>`;
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
  return renderSection(
    "Source Context / Support Document Treatment",
    `<p class="body-copy">Support documents are treated through the canonical source package and V2 projection. The customer-visible treatment table stays inside the memo body.</p><p class="subsection-title">Document Treatment Summary</p>${tableHtml}`,
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
    `<p class="body-copy">This memo is document-driven and source-authority bound. The canonical source package identifies document roles, the V2 projection carries readiness state, and the presentation layer remains deterministic.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>${renderedCoreSourceSummary ? `<div class="subsection-block"><p class="subsection-title">Core Quantitative Sources</p>${renderedCoreSourceSummary}</div>` : ""}`,
    { id: "acq-summary-title", pageBreakBefore: false }
  );
}

function renderOperatingStatementSection({ sourcePackage = null, coreMetrics = null, acquisitionMemoProjection = null } = {}) {
  const rows = [];
  const t12Name = sourcePackage?.coreT12?.originalFilename || "Not present";
  const rentRollName = sourcePackage?.coreRentRoll?.originalFilename || "Not present";
  if (Number.isFinite(Number(coreMetrics?.annualInPlaceRent))) rows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualInPlaceRent)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.annualMarketRent))) rows.push(`<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualMarketRent)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.egi))) rows.push(`<tr><td>Effective Gross Income</td><td style="font-weight:600;">${formatMoney(coreMetrics.egi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.opEx))) rows.push(`<tr><td>Operating Expenses</td><td style="font-weight:600;">${formatMoney(coreMetrics.opEx)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noi))) rows.push(`<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(coreMetrics.noi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.occupancy))) rows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>`);
  const t12Snippet = sourcePackage?.coreT12?.sourceEvidence?.textSnippet || "";
  const occupancyNote = Number.isFinite(Number(coreMetrics?.breakEvenOccupancy)) && Number.isFinite(Number(coreMetrics?.occupancy))
    ? `Break-even occupancy is ${formatPercentDisplay(coreMetrics.breakEvenOccupancy)} versus current occupancy of ${formatPercentDisplay(coreMetrics.occupancy)}.`
    : "";
  return `<div class="card no-break">
    <p class="subsection-title">Operating Statement / TTM Summary</p>
    <table class="detail-table"><tbody>
      <tr><td>Core T12 source</td><td style="font-weight:600;">${escapeHtml(t12Name)}</td></tr>
      <tr><td>Core Rent Roll source</td><td style="font-weight:600;">${escapeHtml(rentRollName)}</td></tr>
      ${rows.join("")}
    </tbody></table>
    ${t12Snippet ? `<div class="subsection-block"><p class="subsection-title">TTM Source Excerpt</p><p class="body-copy">${escapeHtml(t12Snippet.slice(0, 420))}</p></div>` : ""}
    ${occupancyNote ? `<p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">${escapeHtml(occupancyNote)}</p>` : ""}
  </div>`;
}

function renderCapRateValueSection({ acquisitionMemoProjection = null, coreMetrics = null } = {}) {
  const noiBasis = Number(acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.noi_basis ?? acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.noi_basis ?? coreMetrics?.noi ?? NaN);
  const capRates = [5.0, 6.0, 7.0];
  const rows = capRates.map((cap) => `<tr><td>${cap.toFixed(1)}% cap rate</td><td style="font-weight:600;">${formatCapRateValue(noiBasis, cap)}</td></tr>`).join("");
  const headlineValue = formatCapRateValue(noiBasis, 7.0);
  return `<div class="card no-break">
    <p class="subsection-title">Cap-Rate Value Indication</p>
    <p class="body-copy">Document-derived NOI basis is capitalized at stable cap-rate assumptions. The display is deterministic and source-basis driven.</p>
    <table class="detail-table"><tbody>${rows}</tbody></table>
    <p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">7.0% cap value: ${escapeHtml(headlineValue || "Not available")}</p>
  </div>`;
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
    "Unit Mix and Rent Positioning",
    `<p class="body-copy">Rent positioning is anchored to the canonical rent roll and the in-place versus market rent spread. Unit-level detail remains source-driven and is not re-authored here.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>${rentRollSnippet ? `<div class="subsection-block"><p class="subsection-title">Rent Roll Snippet</p><p class="body-copy">${escapeHtml(rentRollSnippet.slice(0, 420))}</p></div>` : ""}`,
    { id: "unit-mix-title", pageBreakBefore: true }
  );
}

function renderValueSensitivitySection({ coreMetrics = null } = {}) {
  const annualRentUpside = Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))
    ? Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent)
    : null;
  const capRate = toCapRatio(coreMetrics?.goingInCapRate);
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
  const stateRows = [
    `<tr><td>Current debt context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Structured renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Appraisal context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasAppraisalContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Market survey context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasMarketSurveyContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Environmental / Phase I ESA context</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasEnvironmentalContext) ? "Yes" : "No"}</td></tr>`,
  ];
  return renderSection(
    "Data Coverage & Source Limitations",
    `<table class="detail-table"><tbody>${rows.join("")}</tbody></table><div class="subsection-block"><p class="subsection-title">Source Reliability Snapshot</p><table class="detail-table"><tbody>${stateRows.join("")}</tbody></table></div>${sourceSummaryHtml ? `<div class="subsection-block"><p class="subsection-title">Core Source Summary</p>${sourceSummaryHtml}</div>` : ""}`,
    { id: "data-coverage-title", pageBreakBefore: true }
  );
}

function renderMethodologySection() {
  return renderSection(
    "Methodology & Data Transparency",
    `<p class="body-copy">Acquisition Memo is document-driven, fail-closed, and source-authority bound. The body is rendered directly from the canonical source package and projection so the report does not depend on legacy marker replacement, row mutation, or append-after-HTML fallback behavior.</p><p class="body-copy">The memo is limited to operating context, support-document treatment, and lender-readiness disclosure. It does not add advanced underwriting outputs beyond the source-backed memo shell.</p>`,
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
  const propertyName = propertyProfile?.propertyName || propertyProfile?.property_name || reportMeta?.propertyName || reportMeta?.property_name || sourcePackage?.propertyName || "Acquisition Memo";
  const propertyAddress = propertyProfile?.propertyAddress || propertyProfile?.property_address || reportMeta?.propertyAddress || reportMeta?.property_address || "";
  const propertyTitle = propertyProfile?.propertyTitle || propertyProfile?.property_title || reportMeta?.propertyTitle || reportMeta?.property_title || "";
  const generatedLabel = reportMeta?.generatedAt || reportMeta?.generated_at || "";
  const reportTierLabel = reportMeta?.reportTier === 2 ? "Tier II" : "Tier I";
  const coverSection = renderBrandCoverSection({ propertyName, propertyAddress, propertyTitle, reportMeta, sourcePackage });
  const executiveSummarySection = renderExecutiveSummarySection({ sourcePackage, acquisitionMemoProjection, coreMetrics });
  const summarySection = renderSummarySection({ sourcePackage, renderedAcquisitionMemo, acquisitionMemoProjection });
  const operatingStatementSection = renderOperatingStatementSection({ sourcePackage, coreMetrics, acquisitionMemoProjection });
  const operatingSection = renderOperatingSnapshotSection({ sourcePackage, coreMetrics });
  const unitMixSection = renderUnitMixSection({ sourcePackage, coreMetrics });
  const valueSensitivitySection = renderValueSensitivitySection({ coreMetrics });
  const capRateValueSection = renderCapRateValueSection({ acquisitionMemoProjection, coreMetrics });
  const readinessSection = renderReadinessSection({ renderedAcquisitionMemo, acquisitionMemoProjection });
  const dataCoverageSection = renderDataCoverageSection({ sourcePackage, renderedAcquisitionMemo, acquisitionMemoProjection });
  const treatmentSection = renderDocumentTreatmentSection(renderedAcquisitionMemo, sourcePackage);
  const methodologySection = renderMethodologySection();
  const footerSection = `<div class="report-footer">InvestorIQ Confidential | ${escapeHtml(reportTierLabel)} | Acquisition Memo | Source-backed presentation only.${generatedLabel ? ` | Generated ${escapeHtml(generatedLabel)}` : ""}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(`${propertyName} - InvestorIQ Acquisition Memo`)}</title>
  <style>
    :root { --ink:#102033; --muted:#5b6472; --border:#d7dde5; --bg:#f7f8fb; --panel:#ffffff; --accent:#b8860b; }
    html, body { margin:0; padding:0; background:var(--bg); color:var(--ink); font-family: Arial, Helvetica, sans-serif; font-size:12px; line-height:1.5; }
    body { padding:22px 24px 28px; }
    .report { max-width: 920px; margin: 0 auto; }
    .cover { background: linear-gradient(180deg, #16263b 0%, #0f1d31 100%); color:#F8FAFC; border-radius:18px; padding:24px 26px 20px; margin-bottom:14px; box-shadow:0 8px 20px rgba(15,23,42,.12); }
    .cover-shell { border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:18px 18px 16px; background:rgba(255,255,255,.03); }
    .cover-brand { font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:#E2E8F0; margin-bottom:6px; }
    .cover-kicker { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#D6B35A; margin-bottom:8px; }
    .cover-title { font-size:30px; line-height:1.1; margin:0 0 6px 0; font-weight:800; }
    .cover-subtitle { font-size:14px; margin:0 0 4px 0; color:#E5E7EB; }
    .cover-meta { font-size:12px; margin:0 0 4px 0; color:#CBD5E1; }
    .cover-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px 14px; margin-top:16px; }
    .cover-grid div { border-top:1px solid rgba(255,255,255,.16); padding-top:8px; }
    .cover-grid span { display:block; font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:#C7D2FE; margin-bottom:2px; }
    .cover-grid strong { font-size:12px; color:#fff; }
    .cover-sources { margin-top:16px; }
    .meta-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 18px; margin-top:14px; }
    .summary-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:12px; }
    .summary-strip div { border:1px solid var(--border); border-radius:12px; padding:10px 12px; background:#FBFCFE; }
    .summary-strip span { display:block; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin-bottom:4px; }
    .summary-strip strong { font-size:14px; color:var(--ink); }
    .section { margin-bottom:16px; }
    .section-break { break-before: page; page-break-before: always; }
    .section-header { border-bottom:1px solid var(--border); margin-bottom:12px; padding-bottom:8px; }
    .section-header-title { font-size:18px; font-weight:700; }
    .card { background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:16px 16px 14px; box-shadow:0 1px 1px rgba(16,32,51,.03); }
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
    .report-footer { margin-top:18px; text-align:center; color:var(--muted); font-size:10px; letter-spacing:.08em; text-transform:uppercase; padding-top:10px; border-top:1px solid var(--border); }
  </style>
</head>
<body>
  <main class="report">
    ${coverSection}
    <section class="section">
      <div class="section-header"><span class="section-header-title">Executive Summary</span></div>
      ${executiveSummarySection}
    </section>
    ${summarySection}
    ${operatingSection}
    ${unitMixSection}
    ${valueSensitivitySection}
    ${capRateValueSection}
    ${readinessSection}
    ${operatingStatementSection}
    ${dataCoverageSection}
    ${treatmentSection}
    ${methodologySection}
    ${footerSection}
  </main>
</body>
</html>`;
}
