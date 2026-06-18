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
  const normalized = Object.is(n, -0) ? 0 : n;
  return `$${normalized.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
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

function renderMetricsSnapshotSection(coreMetrics = null, sourcePackage = null) {
  const rows = [];
  const units = Number.isFinite(Number(coreMetrics?.units))
    ? Number(coreMetrics.units)
    : Number.isFinite(Number(sourcePackage?.coreRentRoll?.extractedFacts?.total_units))
    ? Number(sourcePackage.coreRentRoll.extractedFacts.total_units)
    : null;
  const annualInPlace = Number(coreMetrics?.annualInPlaceRent);
  const annualMarket = Number(coreMetrics?.annualMarketRent);
  const annualUpside = Number.isFinite(annualInPlace) && Number.isFinite(annualMarket) ? annualMarket - annualInPlace : null;
  const rentGapPct = Number.isFinite(annualUpside) && Number.isFinite(annualInPlace) && annualInPlace > 0 ? annualUpside / annualInPlace : null;
  const purchasePrice = Number(coreMetrics?.purchasePrice);
  const noi = Number(coreMetrics?.noi);
  const pricePerUnit = Number.isFinite(purchasePrice) && Number.isFinite(units) && units > 0 ? purchasePrice / units : null;
  const noiPerUnit = Number.isFinite(noi) && Number.isFinite(units) && units > 0 ? noi / units : null;
  if (Number.isFinite(units) && units > 0) rows.push(`<tr><td>Units</td><td style="font-weight:600;">${Math.round(units)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.occupancy))) rows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.annualInPlaceRent))) rows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualInPlaceRent)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.annualMarketRent))) rows.push(`<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualMarketRent)}</td></tr>`);
  if (Number.isFinite(annualUpside)) rows.push(`<tr><td>Annual Rent Upside</td><td style="font-weight:600;">${formatMoney(annualUpside)}</td></tr>`);
  if (Number.isFinite(rentGapPct)) rows.push(`<tr><td>Rent Gap %</td><td style="font-weight:600;">${formatPercentDisplay(rentGapPct)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.egi))) rows.push(`<tr><td>EGI</td><td style="font-weight:600;">${formatMoney(coreMetrics.egi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.opEx))) rows.push(`<tr><td>Operating Expenses</td><td style="font-weight:600;">${formatMoney(coreMetrics.opEx)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noi))) rows.push(`<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(coreMetrics.noi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.expenseRatio))) rows.push(`<tr><td>Expense Ratio</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.expenseRatio)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noiMargin))) rows.push(`<tr><td>NOI Margin</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.noiMargin)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.breakEvenOccupancy))) rows.push(`<tr><td>Break-Even Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.breakEvenOccupancy)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.purchasePrice))) rows.push(`<tr><td>Purchase Price</td><td style="font-weight:600;">${formatMoney(coreMetrics.purchasePrice)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.goingInCapRate))) rows.push(`<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.goingInCapRate)}</td></tr>`);
  if (Number.isFinite(pricePerUnit)) rows.push(`<tr><td>Price per Unit</td><td style="font-weight:600;">${formatMoney(pricePerUnit)}</td></tr>`);
  if (Number.isFinite(noiPerUnit)) rows.push(`<tr><td>NOI per Unit</td><td style="font-weight:600;">${formatMoney(noiPerUnit)}</td></tr>`);
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
  const rentGapPct = Number.isFinite(annualRentUpside) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent)) && Number(coreMetrics.annualInPlaceRent) > 0
    ? annualRentUpside / Number(coreMetrics.annualInPlaceRent)
    : null;
  const capRate = toCapRatio(coreMetrics?.goingInCapRate);
  const impliedValue = Number.isFinite(Number(coreMetrics?.noi)) && Number.isFinite(capRate) && capRate > 0
    ? Number(coreMetrics.noi) / capRate
    : null;
  const valueDelta = Number.isFinite(impliedValue) && Number.isFinite(Number(coreMetrics?.purchasePrice))
    ? impliedValue - Number(coreMetrics.purchasePrice)
    : null;
  const normalizedValueDelta = Number.isFinite(valueDelta) && Math.abs(valueDelta) < 0.5 ? 0 : valueDelta;
  const rows = [
    `<tr><td>Annual rent upside</td><td style="font-weight:600;">${Number.isFinite(annualRentUpside) ? formatMoney(annualRentUpside) : "Not available"}</td></tr>`,
    `<tr><td>Rent gap %</td><td style="font-weight:600;">${Number.isFinite(rentGapPct) ? formatPercentDisplay(rentGapPct) : "Not available"}</td></tr>`,
    `<tr><td>Implied value at going-in cap rate</td><td style="font-weight:600;">${Number.isFinite(impliedValue) ? formatMoney(impliedValue) : "Not available"}</td></tr>`,
    `<tr><td>Value delta vs purchase price</td><td style="font-weight:600;">${Number.isFinite(normalizedValueDelta) ? formatMoney(normalizedValueDelta) : "Not available"}</td></tr>`,
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
  const metricsSection = renderMetricsSnapshotSection(coreMetrics, sourcePackage);
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
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    @page { size: Letter; margin: 36px 36px 48px 36px; }
    @page :first { margin: 0; }
    :root {
      --cover-bg: #0F2318;
      --gold: #C9A84C;
      --gold-dark: #9A7A2C;
      --white: #FFFFFF;
      --paper-warm: #FAFAF8;
      --ink: #0C0C0C;
      --ink-2: #363636;
      --ink-3: #606060;
      --ink-4: #9A9A9A;
      --hairline: #E8E5DF;
      --hairline-mid: #D0CCC4;
      --row-alt: #FAFAF8;
      --font-display: 'Cormorant Garamond', Georgia, serif;
      --font-body: 'DM Sans', system-ui, sans-serif;
      --font-mono: 'DM Mono', 'Courier New', monospace;
    }
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; background:var(--white); color:var(--ink); font-family:var(--font-body); font-size:11px; line-height:1.5; }
    body { margin:0; padding:0; background:var(--white); color:var(--ink); }
    .report { width:100%; padding:0.5in 0.55in 0.52in 0.55in; box-sizing:border-box; background:var(--white); }
    .cover { background:var(--cover-bg); color:var(--white); page-break-after:always; page-break-inside:avoid; margin:0; padding:1.6in 0.52in 0.72in 0.92in; width:100%; min-height:10.5in; position:relative; overflow:hidden; }
    .cover-shell { position:relative; z-index:1; }
    .cover-brand { font-family:var(--font-mono); font-size:6pt; letter-spacing:0.22em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:8pt; }
    .cover-kicker { font-family:var(--font-mono); font-size:7pt; letter-spacing:0.16em; text-transform:uppercase; color:var(--gold); margin-bottom:12pt; }
    .cover-title { font-family:var(--font-display); font-size:38pt; font-weight:600; line-height:1; letter-spacing:-0.02em; margin:0 0 0.1in 0; color:var(--white); }
    .cover-subtitle { font-family:var(--font-body); font-size:9pt; font-weight:300; color:rgba(255,255,255,0.35); letter-spacing:0.07em; margin:0 0 0.52in 0; }
    .cover-meta { font-family:var(--font-body); font-size:8pt; color:rgba(255,255,255,0.3); margin:0 0 4pt 0; }
    .cover-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px 14px; margin-top:16pt; }
    .cover-grid div { border-top:1px solid rgba(201,168,76,0.3); padding-top:8pt; }
    .cover-grid span { display:block; font-family:var(--font-mono); font-size:6pt; text-transform:uppercase; letter-spacing:0.16em; color:rgba(255,255,255,0.45); margin-bottom:3pt; }
    .cover-grid strong { font-family:var(--font-display); font-size:13pt; font-weight:500; color:var(--white); }
    .cover-sources { margin-top:16pt; }
    .meta-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 18px; margin-top:14px; }
    .summary-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:12px; }
    .summary-strip div { border:1px solid var(--hairline); padding:10px 12px; background:var(--paper-warm); }
    .summary-strip span { display:block; font-family:var(--font-mono); font-size:6.5pt; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-4); margin-bottom:4px; }
    .summary-strip strong { font-family:var(--font-display); font-size:16pt; font-weight:500; color:var(--ink); }
    .section { margin-bottom:16px; }
    .section-break { break-before:page; page-break-before:always; }
    .section-header { border-bottom:1px solid var(--hairline); margin-bottom:12px; padding-bottom:8px; position:relative; }
    .section-header::after { content:''; position:absolute; left:0; bottom:-1px; width:0.28in; height:1.5px; background:var(--gold); opacity:0.8; }
    .section-header-title { font-family:var(--font-display); font-size:18pt; font-weight:500; letter-spacing:-0.025em; color:var(--ink); line-height:1.05; }
    .card { background:var(--white); border:none; border-top:1px solid var(--hairline); padding:10px 0; }
    .no-break { break-inside:avoid; page-break-inside:avoid; }
    .body-copy { margin:0 0 12px 0; color:var(--ink-3); font-size:10px; line-height:1.6; }
    .subsection-block + .subsection-block { margin-top:14px; }
    .subsection-title { margin:0 0 8px 0; font-family:var(--font-body); font-size:8px; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-4); font-weight:600; }
    .detail-table { width:100%; border-collapse:collapse; font-size:10.5px; table-layout:fixed; }
    .detail-table td { border-bottom:1px solid var(--hairline); padding:6px 8px; vertical-align:top; line-height:1.35; }
    .detail-table tr:first-child td { border-top:none; }
    .detail-table td:first-child { width:44%; color:var(--ink-3); }
    .detail-table td:last-child { font-weight:600; color:var(--ink); }
    .readiness-summary { margin-bottom:10px; font-size:10.5px; line-height:1.6; color:var(--ink-3); }
    .source-table { width:100%; border-collapse:collapse; font-size:10.5px; table-layout:fixed; margin-top:8px; }
    .source-table th { font-family:var(--font-body); font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--ink-3); border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline-mid); padding:0 8px 6px; text-align:left; background:var(--white); }
    .source-table td { border-bottom:1px solid var(--hairline); padding:6px 8px; vertical-align:top; }
    .source-table tr:nth-child(even) td { background:var(--row-alt); }
    .footer-note { margin-top:16px; color:var(--ink-4); font-size:10px; font-style:italic; }
    .report-footer { margin-top:18px; text-align:center; color:var(--ink-4); font-family:var(--font-mono); font-size:6pt; letter-spacing:0.12em; text-transform:uppercase; padding-top:10px; border-top:1px solid var(--hairline); }
    .meta-line { display:flex; justify-content:space-between; border-bottom:1px solid var(--hairline); padding:5px 0; font-size:10.5px; }
    .meta-label { color:var(--ink-3); }
    .meta-value { font-weight:600; color:var(--ink); text-align:right; }
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
    ${metricsSection}
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
