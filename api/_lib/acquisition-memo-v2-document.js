import { toCapRatio, toRateRatio } from "./report-number-helpers.js";

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

function normalizePercentFraction(value) {
  return toRateRatio(value);
}

function extractFirstMatchValue(text, patterns, transform = (value) => value) {
  const source = String(text || "");
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match || match.length < 2) continue;
    const value = transform(match[1], match);
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

function extractPercentFraction(text, patterns) {
  return extractFirstMatchValue(text, patterns, (value) => normalizePercentFraction(value));
}

function extractYears(text, patterns) {
  return extractFirstMatchValue(text, patterns, (value) => {
    const n = Number(String(value).replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  });
}

function extractDate(text, patterns) {
  return extractFirstMatchValue(text, patterns, (value) => String(value || "").trim());
}

function getBossSupportDocs(bossContract = null, sourcePackage = null) {
  const bossDocs = Array.isArray(bossContract?.sourceTruth?.supportDocs) ? bossContract.sourceTruth.supportDocs.filter(Boolean) : [];
  return bossDocs.length > 0 ? bossDocs : getSupportDocs(sourcePackage);
}

function getBossSupportDocByRole(bossContract = null, sourcePackage = null, role = "") {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) return null;
  const bossDocs = Array.isArray(bossContract?.sourceTruth?.supportDocs) ? bossContract.sourceTruth.supportDocs : [];
  for (const doc of bossDocs) {
    if (String(doc?.canonicalRole || "").trim().toLowerCase() === normalizedRole) {
      return doc || null;
    }
  }
  return getSupportDocByRole(sourcePackage, role);
}

function getBossSectionContract(bossContract = null, sectionKey = "") {
  return bossContract?.sections?.[sectionKey] || null;
}

function getCustomerSurfaceSection(customerSurfaceModel = null, sectionKey = "") {
  return customerSurfaceModel?.sections?.[sectionKey] || null;
}

function sectionHasSourceBackedFacts(sectionContract = null) {
  return Boolean(sectionContract?.factAvailability?.sourceBacked);
}

function sectionHasMissingRequiredFacts(sectionContract = null) {
  return Array.isArray(sectionContract?.factAvailability?.missing) && sectionContract.factAvailability.missing.length > 0;
}

function resolveValidGoingInCapRate({ coreMetrics = null, acquisitionMemoProjection = null, sourcePackage = null, bossContract = null } = {}) {
  const purchaseAssumptionsDoc = getBossSupportDocByRole(bossContract, sourcePackage, "purchase_assumptions");
  const candidates = [
    coreMetrics?.goingInCapRate,
    acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.going_in_cap_rate,
    acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.going_in_cap_rate,
    purchaseAssumptionsDoc?.extractedFacts?.going_in_cap_rate,
  ];
  for (const candidate of candidates) {
    const normalized = toCapRatio(candidate);
    if (Number.isFinite(normalized) && normalized > 0 && normalized <= 0.5) return normalized;
  }
  return null;
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

function formatAssetIdentityForSurface({ customerSurfaceModel = null, sourcePackage = null, coreMetrics = null } = {}) {
  const unitCount = Number.isFinite(Number(customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units))
    ? Number(customerSurfaceModel.sourceBackedFacts.unitMix.total_units)
    : Number.isFinite(Number(coreMetrics?.units))
      ? Number(coreMetrics.units)
      : Number.isFinite(Number(sourcePackage?.coreRentRoll?.extractedFacts?.total_units))
        ? Number(sourcePackage.coreRentRoll.extractedFacts.total_units)
        : null;
  const assetClass = String(
    customerSurfaceModel?.identity?.assetClass ||
      sourcePackage?.propertyProfile?.assetClass ||
      sourcePackage?.propertyProfile?.asset_class ||
      coreMetrics?.assetClass ||
      ""
  ).trim();
  if (Number.isFinite(unitCount) && unitCount > 0 && assetClass) return `${Math.round(unitCount)}-Unit ${assetClass}`;
  if (assetClass) return assetClass;
  if (Number.isFinite(unitCount) && unitCount > 0) return `${Math.round(unitCount)}-Unit`;
  return "Property Identity";
}

function formatDisplayDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value || "");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function getSupportDocByRole(sourcePackage = null, role = "") {
  if (!(sourcePackage?.supportDocs instanceof Map)) return null;
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) return null;
  for (const doc of sourcePackage.supportDocs.values()) {
    if (String(doc?.canonicalRole || "").trim().toLowerCase() === normalizedRole) {
      return doc || null;
    }
  }
  return null;
}

function renderSection(title, bodyHtml, { id = "", pageBreakBefore = false } = {}) {
  const attrs = [
    `class="section${pageBreakBefore ? " section-break" : ""}"`,
    id ? `aria-labelledby="${escapeHtml(id)}"` : "",
  ].filter(Boolean).join(" ");
  return `<section ${attrs}><div class="section-header"><span${id ? ` id="${escapeHtml(id)}"` : ""} class="section-header-title">${escapeHtml(title)}</span></div><div class="card no-break">${bodyHtml}</div></section>`;
}

function renderSectionCollapseHtml() {
  return `<p class="body-copy">This section was omitted because the uploaded support context did not provide display-ready detail. Core report outputs remain based on the uploaded T12 and Rent Roll.</p>`;
}

function renderSafely(sectionName, rendererFn, { pageBreakBefore = true, fallbackHtml = "", bossSection = null } = {}) {
  if (bossSection?.status === "collapsed") {
    return fallbackHtml || renderSection(sectionName, renderSectionCollapseHtml(), { pageBreakBefore });
  }
  try {
    const rendered = rendererFn();
    if (typeof rendered === "string" && rendered.trim()) return rendered;
    if (bossSection && (sectionHasSourceBackedFacts(bossSection) || bossSection?.status === "required")) {
      return fallbackHtml || renderSection(sectionName, renderSectionCollapseHtml(), { pageBreakBefore });
    }
    return typeof rendered === "string" ? rendered : fallbackHtml;
  } catch (err) {
    console.warn("[investoriq] acquisition memo v2 section collapsed", {
      section: sectionName,
      message: err?.message || String(err || ""),
    });
    return fallbackHtml || renderSection(sectionName, renderSectionCollapseHtml(), { pageBreakBefore });
  }
}

function buildMinimalAcquisitionMemoV2Html({
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
  const generatedLabel = formatDisplayDate(reportMeta?.generatedAt || reportMeta?.generated_at || "");
  const units = Number.isFinite(Number(coreMetrics?.units))
    ? Number(coreMetrics.units)
    : Number.isFinite(Number(sourcePackage?.coreRentRoll?.extractedFacts?.total_units))
    ? Number(sourcePackage.coreRentRoll.extractedFacts.total_units)
    : null;
  const annualInPlace = Number(coreMetrics?.annualInPlaceRent);
  const annualMarket = Number(coreMetrics?.annualMarketRent);
  const annualUpside = Number.isFinite(annualInPlace) && Number.isFinite(annualMarket) ? annualMarket - annualInPlace : null;
  const purchasePrice = Number(coreMetrics?.purchasePrice);
  const noi = Number(coreMetrics?.noi);
  const goingInCapRate = resolveValidGoingInCapRate({ coreMetrics, acquisitionMemoProjection, sourcePackage });
  const fallbackRows = [
    Number.isFinite(units) && units > 0 ? `<tr><td>Units</td><td style="font-weight:600;">${Math.round(units)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.occupancy)) ? `<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>` : "",
    Number.isFinite(annualInPlace) ? `<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(annualInPlace)}</td></tr>` : "",
    Number.isFinite(annualMarket) ? `<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatMoney(annualMarket)}</td></tr>` : "",
    Number.isFinite(annualUpside) ? `<tr><td>Annual Rent Upside</td><td style="font-weight:600;">${formatMoney(annualUpside)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.expenseRatio)) ? `<tr><td>Expense Ratio</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.expenseRatio)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.noiMargin)) ? `<tr><td>NOI Margin</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.noiMargin)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.egi)) ? `<tr><td>EGI</td><td style="font-weight:600;">${formatMoney(coreMetrics.egi)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.opEx)) ? `<tr><td>Operating Expenses</td><td style="font-weight:600;">${formatMoney(coreMetrics.opEx)}</td></tr>` : "",
    Number.isFinite(noi) ? `<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(noi)}</td></tr>` : "",
    Number.isFinite(purchasePrice) ? `<tr><td>Purchase Price</td><td style="font-weight:600;">${formatMoney(purchasePrice)}</td></tr>` : "",
    Number.isFinite(goingInCapRate) ? `<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercentDisplay(goingInCapRate)}</td></tr>` : "",
  ].filter(Boolean).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(`InvestorIQ Capital Intelligence Memorandum - ${propertyName}`)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #102033; }
    .report { max-width: 900px; margin: 0 auto; }
    .section { margin-bottom: 16px; }
    .section-header { border-bottom: 1px solid #d7dde5; margin-bottom: 12px; padding-bottom: 8px; }
    .section-header-title { font-size: 18px; font-weight: 600; }
    .card { border: 1px solid #d7dde5; padding: 12px 14px; background: #fff; }
    .body-copy { margin: 0 0 10px 0; line-height: 1.5; }
    .detail-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .detail-table td { border-bottom: 1px solid #e5e7eb; padding: 6px 8px; vertical-align: top; }
    .detail-table td:first-child { width: 44%; color: #5b6472; }
    .detail-table td:last-child { font-weight: 600; }
    .report-footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #d7dde5; font-size: 11px; color: #5b6472; }
  </style>
</head>
<body>
  <div class="report">
    <div class="section">
      <div class="section-header"><span class="section-header-title">InvestorIQ</span></div>
      <div class="card">
        <div class="body-copy">Institutional Real Estate Analysis</div>
        <div class="body-copy">${escapeHtml(propertyName)}</div>
        <div class="body-copy">ACQUISITION MEMO</div>
        <div class="body-copy">CONFIDENTIAL - INVESTORIQ TECHNOLOGIES INC.</div>
        <div class="body-copy">${escapeHtml(propertyAddress || propertyTitle || generatedLabel || "")}</div>
      </div>
    </div>
    <div class="section">
      <div class="section-header"><span class="section-header-title">Key Metrics Snapshot</span></div>
      <div class="card">
        <table class="detail-table"><tbody>${fallbackRows || `<tr><td>Core facts</td><td style="font-weight:600;">Available in source documents</td></tr>`}</tbody></table>
      </div>
    </div>
    <div class="section">
      <div class="section-header"><span class="section-header-title">Methodology &amp; Data Transparency</span></div>
      <div class="card">
        <p class="body-copy">InvestorIQ does not assume or gap-fill missing data.</p>
        <p class="body-copy">Document-Backed Acquisition Memo Outputs are built from verified source documents, deterministic operating calculations, and explicit source treatment.</p>
        <p class="body-copy">Methodology Notes: unsupported assumptions are omitted; lender-readiness disclosure is limited to the documents provided; data limitations and missing inputs remain visible to the reader.</p>
      </div>
    </div>
    ${renderedAcquisitionMemo?.documentTreatmentSummaryHtml ? `
    <div class="section">
      <div class="section-header"><span class="section-header-title">Source Context / Support Document Treatment</span></div>
      <div class="card">${stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo.documentTreatmentSummaryHtml)}</div>
    </div>` : ""}
  </div>
</body>
</html>`;
}

function renderMetaLine(label, value) {
  if (!value) return "";
  return `<div class="meta-line"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${escapeHtml(value)}</span></div>`;
}

function getSourceEvidenceText(source) {
  return String(source?.sourceEvidence?.textSnippet || source?.sourceEvidence?.text || source?.source_text || source?.text || source?.document_text_extracted || source?.payload?.text || source?.payload?.document_text_extracted || "");
}

function extractCurrencyFromText(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (!match || !match[1]) continue;
    const parsed = Number(String(match[1]).replace(/[$,\s]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseUnitMixRowsFromText(text) {
  const source = String(text || "");
  const rows = [];
  const patterns = [
    {
      label: "1BR",
      regex: /1BR[^0-9]{0,40}([0-9]{1,3})[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i,
    },
    {
      label: "2BR",
      regex: /2BR[^0-9]{0,40}([0-9]{1,3})[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i,
    },
  ];
  for (const { label, regex } of patterns) {
    const match = source.match(regex);
    if (!match) continue;
    const count = Number(match[1]);
    const inPlace = Number(String(match[2]).replace(/[$,\s]/g, ""));
    const market = Number(String(match[3]).replace(/[$,\s]/g, ""));
    const gap = Number(String(match[4]).replace(/[$,\s]/g, ""));
    rows.push({
      label,
      count: Number.isFinite(count) ? count : null,
      inPlace: Number.isFinite(inPlace) ? inPlace : null,
      market: Number.isFinite(market) ? market : null,
      gap: Number.isFinite(gap) ? gap : null,
    });
  }
  return rows;
}

function parseT12LineItemsFromText(text) {
  const source = String(text || "");
  const itemPatterns = [
    ["Property Taxes", /property taxes[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i],
    ["Insurance", /insurance[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i],
    ["Repairs & Maintenance", /repairs?\s*&?\s*maintenance[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i],
    ["Utilities", /utilities[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i],
    ["Property Management", /property management[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i],
    ["Payroll / Admin", /payroll\s*\/\s*admin[^$0-9]{0,30}\$?\s*([0-9][0-9,]*)/i],
  ];
  const rows = [];
  for (const [label, regex] of itemPatterns) {
    const amount = extractCurrencyFromText(source, [regex]);
    if (Number.isFinite(amount)) rows.push({ label, amount });
  }
  return rows;
}

function toFiniteNumber(value) {
  const normalized = String(value ?? "").replace(/[$,\s]/g, "").trim();
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeStructuredUnitMixRow(row) {
  if (!row || typeof row !== "object") return null;
  const rawLabel = String(
    row.label ??
      row.unit_label ??
      row.unitLabel ??
      row.unit_type ??
      row.unitType ??
      row.type ??
      row.bedroom_type ??
      row.bedroomType ??
      row.bedrooms ??
      row.bedroom_count ??
      ""
  ).trim();
  const label = rawLabel
    ? /^\d+$/.test(rawLabel)
      ? `${rawLabel}BR`
      : rawLabel
    : "";
  const count = toFiniteNumber(row.count ?? row.unit_count ?? row.units ?? row.quantity);
  const inPlace = toFiniteNumber(
    row.current_rent ??
      row.currentRent ??
      row.in_place_rent ??
      row.inPlaceRent ??
      row.inplace_rent ??
      row.inPlace ??
      row.rent
  );
  const market = toFiniteNumber(row.market_rent ?? row.marketRent ?? row.market_rent_monthly ?? row.marketRentMonthly ?? row.market);
  const gap = toFiniteNumber(row.gap ?? row.rent_gap ?? row.monthly_rent_gap ?? row.monthlyRentGap);
  if (!label && !Number.isFinite(count) && !Number.isFinite(inPlace) && !Number.isFinite(market) && !Number.isFinite(gap)) return null;
  const normalizedGap = Number.isFinite(gap) ? gap : Number.isFinite(inPlace) && Number.isFinite(market) ? market - inPlace : null;
  return {
    label: label || "Unit Mix",
    count: Number.isFinite(count) ? count : null,
    inPlace: Number.isFinite(inPlace) ? inPlace : null,
    market: Number.isFinite(market) ? market : null,
    gap: Number.isFinite(normalizedGap) ? normalizedGap : null,
  };
}

function deriveStructuredUnitMixRowsFromUnits(units) {
  const groups = new Map();
  for (const unit of Array.isArray(units) ? units : []) {
    if (!unit || typeof unit !== "object") continue;
    const rawLabel = String(
      unit.label ??
        unit.unit_label ??
        unit.unitLabel ??
        unit.unit_type ??
        unit.unitType ??
        unit.type ??
        unit.bedroom_type ??
        unit.bedroomType ??
        unit.bedrooms ??
        unit.bedroom_count ??
        ""
    ).trim();
    const label = rawLabel
      ? /^\d+$/.test(rawLabel)
        ? `${rawLabel}BR`
        : rawLabel
      : "";
    const key = label || String(unit.unit_number ?? unit.unitNumber ?? unit.id ?? groups.size);
    const group = groups.get(key) || { label: label || "Unit Mix", count: 0, inPlace: null, market: null, gap: null };
    group.count += 1;
    const inPlace = toFiniteNumber(
      unit.current_rent ??
        unit.currentRent ??
        unit.in_place_rent ??
        unit.inPlaceRent ??
        unit.inplace_rent ??
        unit.rent
    );
    const market = toFiniteNumber(unit.market_rent ?? unit.marketRent ?? unit.market_rent_monthly ?? unit.marketRentMonthly);
    const gap = toFiniteNumber(unit.gap ?? unit.rent_gap ?? unit.monthly_rent_gap ?? unit.monthlyRentGap);
    if (!Number.isFinite(group.inPlace) && Number.isFinite(inPlace)) group.inPlace = inPlace;
    if (!Number.isFinite(group.market) && Number.isFinite(market)) group.market = market;
    if (!Number.isFinite(group.gap) && Number.isFinite(gap)) group.gap = gap;
    groups.set(key, group);
  }
  return Array.from(groups.values()).map((group) => {
    const normalizedGap = Number.isFinite(group.gap) ? group.gap : Number.isFinite(group.inPlace) && Number.isFinite(group.market) ? group.market - group.inPlace : null;
    return {
      label: group.label,
      count: Number.isFinite(group.count) ? group.count : null,
      inPlace: Number.isFinite(group.inPlace) ? group.inPlace : null,
      market: Number.isFinite(group.market) ? group.market : null,
      gap: Number.isFinite(normalizedGap) ? normalizedGap : null,
    };
  });
}

function normalizeStructuredT12LineItem(row) {
  if (!row || typeof row !== "object") return null;
  const label = String(row.label ?? row.line_label ?? row.lineLabel ?? row.name ?? row.description ?? row.category ?? "").trim();
  const amount = toFiniteNumber(row.amount ?? row.value ?? row.total ?? row.annual_amount ?? row.annualAmount ?? row.monthly_amount ?? row.monthlyAmount);
  if (!label || !Number.isFinite(amount)) return null;
  return { label, amount };
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

function renderBrandCoverSection({ propertyName, propertyAddress, propertyTitle, reportMeta, sourcePackage, coreMetrics, customerSurfaceModel = null }) {
  const modelIdentity = customerSurfaceModel?.identity || {};
  const supportDocCount = Number.isFinite(Number(customerSurfaceModel?.supportSourceCounts?.uniqueUploadedFileCount))
    ? Number(customerSurfaceModel.supportSourceCounts.uniqueUploadedFileCount)
    : getSupportDocs(sourcePackage).length;
  const assetIdentity = formatAssetIdentityForSurface({ customerSurfaceModel, sourcePackage, coreMetrics });
  const assetClass = String(modelIdentity?.assetClass || "").trim() || assetIdentity;
  const generatedLabel = formatDisplayDate(reportMeta?.generatedAt || reportMeta?.generated_at || "");
  const coverUnits = Number.isFinite(Number(customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units))
    ? Math.round(Number(customerSurfaceModel.sourceBackedFacts.unitMix.total_units))
    : Number.isFinite(Number(coreMetrics?.units))
    ? Math.round(Number(coreMetrics.units))
    : Number.isFinite(Number(sourcePackage?.coreRentRoll?.extractedFacts?.total_units))
    ? Math.round(Number(sourcePackage.coreRentRoll.extractedFacts.total_units))
    : "";
  const coverNoi = Number.isFinite(Number(customerSurfaceModel?.valueSemantics?.wholePropertyValue?.noi))
    ? formatMoney(customerSurfaceModel.valueSemantics.wholePropertyValue.noi)
    : Number.isFinite(Number(coreMetrics?.noi))
      ? formatMoney(coreMetrics.noi)
      : "";
  const coverExpenseRatio = Number.isFinite(Number(coreMetrics?.expenseRatio)) ? formatPercentDisplay(coreMetrics.expenseRatio) : "";
  const coverNoiMargin = Number.isFinite(Number(coreMetrics?.noiMargin)) ? formatPercentDisplay(coreMetrics.noiMargin) : "";
  return `<div class="cover-wrap">
    <table class="cover-table" width="100%">
      <tr>
        <td class="cover-cell">
          <div class="cover-brand-name">INVESTORIQ</div>
          <div class="cover-brand-sub">Institutional Real Estate Analysis</div>
          <div class="cover-prop-name">${escapeHtml(propertyName || "Acquisition Memo")}</div>
          <div class="cover-prop-sub">ACQUISITION MEMO</div>
          <div class="cover-verdict-value">CONFIDENTIAL - INVESTORIQ TECHNOLOGIES INC.</div>
          <div class="cover-disclosure">Review / Source Reconciliation Disclosure</div>
          <hr class="cover-divider" />
          <div class="cover-metric-strip">
            <div class="cover-metric-row">${escapeHtml([assetIdentity || (coverUnits ? `${coverUnits} Units` : "Property Identity"), coverNoi ? `NOI ${coverNoi}` : "", coverExpenseRatio ? `Expense Ratio ${coverExpenseRatio}` : "", coverNoiMargin ? `NOI Margin ${coverNoiMargin}` : ""].filter(Boolean).join(" \u00a0\u00a0|\u00a0\u00a0 "))}</div>
          </div>
          <div class="cover-grid">
            <div><span>Asset Class</span><strong>${escapeHtml(assetIdentity)}</strong></div>
            <div><span>Report Tier</span><strong>${escapeHtml(reportMeta?.reportTier === 2 ? "Acquisition Memo" : "Screening")}</strong></div>
            <div><span>Documents</span><strong>${escapeHtml(`${supportDocCount + (sourcePackage?.coreT12 ? 1 : 0) + (sourcePackage?.coreRentRoll ? 1 : 0)} uploaded files`)}</strong></div>
          </div>
          <div class="cover-footer-row">
            <span class="cover-footer-text">Confidential &mdash; InvestorIQ Technologies Inc.</span>
            <span class="cover-footer-text">${escapeHtml(generatedLabel || propertyAddress || propertyTitle || "")}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>`;
}

function renderExecutiveSummarySection({ sourcePackage = null, acquisitionMemoProjection = null, coreMetrics = null, customerSurfaceModel = null } = {}) {
  const coreT12 = customerSurfaceModel?.coreSources?.coreT12 || null;
  const coreRentRoll = customerSurfaceModel?.coreSources?.coreRentRoll || null;
  const assetIdentity = formatAssetIdentityForSurface({ customerSurfaceModel, sourcePackage, coreMetrics });
  const rows = [
    `<tr><td>Asset Identity</td><td style="font-weight:600;">${escapeHtml(assetIdentity)}</td></tr>`,
    `<tr><td>ACQUISITION MEMO</td><td style="font-weight:600;">${escapeHtml("InvestorIQ")}</td></tr>`,
    `<tr><td>Core T12</td><td style="font-weight:600;">${escapeHtml(coreT12?.filename || sourcePackage?.coreT12?.originalFilename || "Not present")}</td></tr>`,
    `<tr><td>Core Rent Roll</td><td style="font-weight:600;">${escapeHtml(coreRentRoll?.filename || sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td></tr>`,
    `<tr><td>Current debt context</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasCurrentDebtContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
  ];
  const occupancy = Number.isFinite(Number(coreMetrics?.occupancy)) ? formatPercentDisplay(coreMetrics.occupancy) : "Not available";
  const noi = Number.isFinite(Number(coreMetrics?.noi)) ? formatMoney(coreMetrics.noi) : "Not available";
  const annualUpside = Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))
    ? formatMoney(Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent))
    : "Not available";
  return `<div class="card no-break">
    <p class="subsection-title">Executive Summary</p>
    <p class="body-copy">Review / Source Reconciliation Disclosure. Deal overview, operating profile, and primary risk drivers.</p>
    <table class="detail-table"><tbody>${rows.join("")}</tbody></table>
    <div class="summary-strip">
      <div><span>Occupancy</span><strong>${escapeHtml(occupancy)}</strong></div>
      <div><span>NOI</span><strong>${escapeHtml(noi)}</strong></div>
      <div><span>Annual Rent Upside</span><strong>${escapeHtml(annualUpside)}</strong></div>
    </div>
  </div>`;
}

function renderKeyUpsideDriversSection({ sourcePackage = null, coreMetrics = null, acquisitionMemoProjection = null } = {}) {
  const drivers = [];
  if (Number.isFinite(Number(coreMetrics?.occupancy))) drivers.push(`Occupancy ${formatPercentDisplay(coreMetrics.occupancy)} anchored by the canonical Rent Roll.`);
  if (Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))) {
    drivers.push(`Annual rent gap of ${formatMoney(Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent))} supports value sensitivity.`);
  }
  if (Number.isFinite(Number(coreMetrics?.noi))) drivers.push(`NOI of ${formatMoney(coreMetrics.noi)} drives cap-rate value indication.`);
  if (Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext)) drivers.push(`Current debt context is uploaded and retained as contextual support.`);
  if (Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions)) drivers.push(`Purchase assumptions are separated from existing debt and treated as acquisition context.`);
  const t12Name = sourcePackage?.coreT12?.originalFilename || "Not present";
  const rentRollName = sourcePackage?.coreRentRoll?.originalFilename || "Not present";
  if (drivers.length === 0) return "";
  return `<div class="card no-break"><p class="subsection-title">Key Upside Drivers</p><ul style="margin:0;padding-left:18px;">${drivers.map((driver) => `<li style="margin-bottom:4px;">${escapeHtml(driver)}</li>`).join("")}</ul><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Primary quantitative anchors: ${escapeHtml(t12Name)} and ${escapeHtml(rentRollName)}.</p></div>`;
}

function renderPrimaryConstraintSection({ sourcePackage = null, acquisitionMemoProjection = null } = {}) {
  const currentDebt = Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext);
  const purchaseAssumptions = Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions);
  const wording = currentDebt && purchaseAssumptions
    ? "Review - Source Reconciliation Disclosure: current debt is retained as contextual support while purchase assumptions remain separate acquisition context."
    : "Review - Source Reconciliation Disclosure: core quantitative inputs are accepted as provided; support documents remain source-transparent and non-overriding.";
  return `<div class="card no-break"><p class="subsection-title">Primary Constraint / Review Disclosure</p><p class="body-copy">${escapeHtml(wording)}</p></div>`;
}

function renderSupportDocRows(sourcePackage = null) {
  return getSupportDocs(sourcePackage).map((doc) => {
    const filename = doc?.originalFilename || doc?.roleLabel || doc?.canonicalLabel || doc?.canonicalRole || "Support Document";
    return `<tr><td>${escapeHtml(filename)}</td><td style="font-weight:600;">${escapeHtml(doc?.canonicalLabel || doc?.roleLabel || doc?.canonicalRole || "Other Support Document")}</td><td>${escapeHtml(doc?.treatment || "")}</td><td>${escapeHtml(doc?.use || "")}</td></tr>`;
  });
}

function renderUploadedFilesSection({ sourcePackage = null } = {}) {
  const rows = [
    sourcePackage?.coreT12?.originalFilename
      ? `<tr><td>${escapeHtml(sourcePackage.coreT12.originalFilename)}</td><td style="font-weight:600;">Core T12</td><td>Primary quantitative input</td></tr>`
      : "",
    sourcePackage?.coreRentRoll?.originalFilename
      ? `<tr><td>${escapeHtml(sourcePackage.coreRentRoll.originalFilename)}</td><td style="font-weight:600;">Core Rent Roll</td><td>Primary quantitative input</td></tr>`
      : "",
    ...getSupportDocs(sourcePackage).map((doc) => `<tr><td>${escapeHtml(doc?.originalFilename || "Support Document")}</td><td style="font-weight:600;">${escapeHtml(doc?.canonicalLabel || doc?.roleLabel || "Other Support Document")}</td><td>${escapeHtml(doc?.treatment || "")}</td></tr>`),
  ].filter(Boolean).join("");
  return renderSection("Uploaded Files / Source Context", `<table class="detail-table"><tbody>${rows}</tbody></table>`, { pageBreakBefore: false });
}

function renderReadinessBodyHtml({ renderedAcquisitionMemo = null, acquisitionMemoProjection = null } = {}) {
  const signals = acquisitionMemoProjection?.financingReadinessSignals || {};
  const summaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.financingReadinessSummaryHtml || "").trim();
  return summaryHtml
    ? `<div class="readiness-summary">${summaryHtml}</div>`
    : `<p class="body-copy">Shown for lender discussion and acquisition diligence support only.</p>`;
}

function renderReadinessSection({ renderedAcquisitionMemo = null, acquisitionMemoProjection = null, customerSurfaceModel = null } = {}) {
  const signals = customerSurfaceModel?.diagnostics || acquisitionMemoProjection?.financingReadinessSignals || {};
  const rows = [
    `<tr><td>Current debt context uploaded</td><td style="font-weight:600;">${Boolean(signals?.hasCurrentDebtContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions provided</td><td style="font-weight:600;">${Boolean(signals?.hasPurchaseAssumptions ?? acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Structured renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(signals?.hasStructuredRenovation ?? acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Appraisal context</td><td style="font-weight:600;">${Boolean(signals?.hasAppraisalContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasAppraisalContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Market survey context</td><td style="font-weight:600;">${Boolean(signals?.hasMarketSurveyContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasMarketSurveyContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Environmental / Phase I ESA context</td><td style="font-weight:600;">${Boolean(signals?.hasEnvironmentalContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasEnvironmentalContext) ? "Yes" : "No"}</td></tr>`,
  ];
  return renderSection(
    "Preliminary Financing Readiness Summary",
    `${renderReadinessBodyHtml({ renderedAcquisitionMemo, acquisitionMemoProjection })}<div class="subsection-block"><p class="subsection-title">Lender Diligence Checklist</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table></div>`,
    { id: "prelim-readiness-title", pageBreakBefore: true }
  );
}

function renderAcquisitionRequestContextSection({
  acquisitionMemoProjection = null,
  sourcePackage = null,
  acquisitionTermsPayload = null,
  loanTermSheetTermsPayload = null,
  coreMetrics = null,
  bossContract = null,
  customerSurfaceModel = null,
} = {}) {
  const modelSection = getCustomerSurfaceSection(customerSurfaceModel, "acquisitionRequestContext");
  const sectionContract = modelSection || getBossSectionContract(bossContract, "acquisitionRequestContext");
  if (modelSection?.status === "collapsed") {
    return renderSection("Acquisition Request Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  if (sectionHasSourceBackedFacts(sectionContract) && sectionHasMissingRequiredFacts(sectionContract)) {
    return renderSection("Acquisition Request Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  const purchaseAssumptionsDoc = modelSection?.sourceDoc || getBossSupportDocByRole(bossContract, sourcePackage, "purchase_assumptions");
  const acquisitionFacts = modelSection?.facts || {};
  const purchasePrice = toFiniteNumber(acquisitionFacts?.purchase_price ?? coreMetrics?.purchasePrice ?? acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.purchase_price ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.purchase_price ?? purchaseAssumptionsDoc?.extractedFacts?.purchase_price ?? acquisitionTermsPayload?.purchase_price ?? acquisitionTermsPayload?.purchasePrice ?? NaN);
  const noiBasis = toFiniteNumber(acquisitionFacts?.noi_basis ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.noi_basis ?? coreMetrics?.noi ?? purchaseAssumptionsDoc?.extractedFacts?.noi_basis ?? acquisitionTermsPayload?.noi_basis ?? acquisitionTermsPayload?.noi ?? NaN);
  const goingInCapRate = resolveValidGoingInCapRate({ coreMetrics, acquisitionMemoProjection, sourcePackage, bossContract });
  const proposedLoan = toFiniteNumber(acquisitionFacts?.proposed_loan_amount ?? acquisitionFacts?.loan_amount ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.proposed_loan_amount ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.loan_amount ?? acquisitionTermsPayload?.proposed_loan_amount ?? acquisitionTermsPayload?.loan_amount ?? acquisitionTermsPayload?.stated_acquisition_loan_amount ?? acquisitionTermsPayload?.proposed_acquisition_loan_amount ?? NaN);
  const ltv = normalizePercentFraction(acquisitionFacts?.ltv ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.ltv ?? acquisitionTermsPayload?.ltv ?? acquisitionTermsPayload?.loan_to_value ?? acquisitionTermsPayload?.loanToValue);
  const interestRate = normalizePercentFraction(acquisitionFacts?.interest_rate ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.interest_rate ?? acquisitionTermsPayload?.interest_rate ?? acquisitionTermsPayload?.interestRate ?? acquisitionTermsPayload?.rate);
  const amortization = toFiniteNumber(acquisitionFacts?.amortization_years ?? acquisitionFacts?.amortization_remaining_years ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.amortization_years ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.amortization_remaining_years ?? acquisitionTermsPayload?.amortization_years ?? acquisitionTermsPayload?.amortizationYears ?? NaN);
  const lenderFee = normalizePercentFraction(acquisitionFacts?.lender_fee_percent ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.lender_fee_percent ?? acquisitionTermsPayload?.lender_fee_percent ?? acquisitionTermsPayload?.lenderFeePercent ?? acquisitionTermsPayload?.origination_fee_percent);
  const interestRateDisplay = Number.isFinite(interestRate) ? `${(interestRate * 100).toFixed(2)}%` : null;
  const lenderFeeDisplay = Number.isFinite(lenderFee) ? `${(lenderFee * 100).toFixed(2)}%` : null;
  const rows = [
    Number.isFinite(purchasePrice) ? `<tr><td>Purchase Price</td><td style="font-weight:600;">${formatMoney(purchasePrice)}</td></tr>` : "",
    Number.isFinite(noiBasis) ? `<tr><td>NOI Basis</td><td style="font-weight:600;">${formatMoney(noiBasis)}</td></tr>` : "",
    Number.isFinite(goingInCapRate) ? `<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercentDisplay(goingInCapRate)}</td></tr>` : "",
    Number.isFinite(proposedLoan) ? `<tr><td>Proposed Acquisition Loan</td><td style="font-weight:600;">${formatMoney(proposedLoan)}</td></tr>` : "",
    Number.isFinite(ltv) ? `<tr><td>Proposed LTV</td><td style="font-weight:600;">${formatPercentDisplay(ltv)}</td></tr>` : "",
    interestRateDisplay ? `<tr><td>Proposed Rate</td><td style="font-weight:600;">${interestRateDisplay}</td></tr>` : "",
    Number.isFinite(amortization) ? `<tr><td>Proposed Amortization</td><td style="font-weight:600;">${Math.round(amortization)} years</td></tr>` : "",
    lenderFeeDisplay ? `<tr><td>Lender / Origination Fee</td><td style="font-weight:600;">${lenderFeeDisplay}</td></tr>` : "",
  ].filter(Boolean).join("");
  if (!rows) return renderSection("Acquisition Request Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  return renderSection("Acquisition Request Context", `<table class="detail-table"><tbody>${rows}</tbody></table>`, { pageBreakBefore: true });
}

function renderOperatingSupportSection({ coreMetrics = null } = {}) {
  const rows = [
    Number.isFinite(Number(coreMetrics?.annualInPlaceRent)) ? `<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualInPlaceRent)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.annualMarketRent)) ? `<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualMarketRent)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent)) ? `<tr><td>Annual Gross Rent Upside</td><td style="font-weight:600;">${formatMoney(Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent))}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.occupancy)) ? `<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.expenseRatio)) ? `<tr><td>Expense Ratio</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.expenseRatio)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.noiMargin)) ? `<tr><td>NOI Margin</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.noiMargin)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.breakEvenOccupancy)) ? `<tr><td>Break-Even Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.breakEvenOccupancy)}</td></tr>` : "",
  ].filter(Boolean).join("");
  if (!rows) return "";
  return renderSection("Operating Support", `<table class="detail-table"><tbody>${rows}</tbody></table>`, { pageBreakBefore: true });
}

function renderRentValueSupportSection({ coreMetrics = null } = {}) {
  const annualMarket = Number(coreMetrics?.annualMarketRent);
  const annualInPlace = Number(coreMetrics?.annualInPlaceRent);
  const annualUpside = Number.isFinite(annualMarket) && Number.isFinite(annualInPlace) ? annualMarket - annualInPlace : null;
  const rentGapPct = Number.isFinite(annualUpside) && Number.isFinite(annualInPlace) && annualInPlace > 0 ? annualUpside / annualInPlace : null;
  const capRates = [5.0, 6.0, 7.0];
  const capRows = Number.isFinite(annualUpside) && annualUpside > 0
    ? capRates.map((cap) => `<tr><td>${cap.toFixed(1)}% cap rate</td><td style="font-weight:600;">${formatMoney(annualUpside / (cap / 100))}</td></tr>`).join("")
    : "";
  if (!capRows) return "";
  return renderSection(
    "Rent / Value Support",
    `<p class="body-copy">Annual Gross Rent Upside and implied value sensitivity at stabilization are anchored to the verified rent gap and standardized cap-rate assumptions.</p><table class="detail-table"><tbody><tr><td>Annual Gross Rent Upside</td><td style="font-weight:600;">${formatMoney(annualUpside)}</td></tr><tr><td>Rent Gap %</td><td style="font-weight:600;">${formatPercentDisplay(rentGapPct)}</td></tr></tbody></table><div class="subsection-block"><p class="subsection-title">Implied Value Sensitivity at Stabilization</p><table class="detail-table"><tbody>${capRows}</tbody></table></div>`,
    { pageBreakBefore: true }
  );
}

function renderDebtFinancingContextSection({
  acquisitionMemoProjection = null,
  sourcePackage = null,
  loanTermSheetTermsPayload = null,
  mortgagePayload = null,
  bossContract = null,
  customerSurfaceModel = null,
} = {}) {
  const modelSection = getCustomerSurfaceSection(customerSurfaceModel, "currentDebtContext");
  const currentDebtSection = modelSection || getBossSectionContract(bossContract, "currentDebtContext");
  if (modelSection?.status === "collapsed") {
    return renderSection("Debt / Financing Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  if (sectionHasSourceBackedFacts(currentDebtSection) && sectionHasMissingRequiredFacts(currentDebtSection)) {
    return renderSection("Debt / Financing Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  const currentDebt = modelSection?.sourceDoc
    || bossContract?.sourceTruth?.supportDocs?.find?.((doc) => String(doc?.canonicalRole || "").trim().toLowerCase() === "current_debt_context")
    || getBossSupportDocByRole(bossContract, sourcePackage, "current_debt_context")
    || acquisitionMemoProjection?.currentDebtContext
    || acquisitionMemoProjection?.supportDocProjection?.currentDebtContext
    || null;
  const facts = currentDebt?.extractedFacts || {};
  const currentDebtText = getSourceEvidenceText(currentDebt);
  const outstandingBalance = Number.isFinite(toFiniteNumber(facts?.current_outstanding_balance))
    ? toFiniteNumber(facts.current_outstanding_balance)
    : Number.isFinite(toFiniteNumber(facts?.outstanding_balance))
    ? toFiniteNumber(facts.outstanding_balance)
    : Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.current_outstanding_balance))
    ? toFiniteNumber(loanTermSheetTermsPayload.current_outstanding_balance)
    : Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.outstanding_balance))
    ? toFiniteNumber(loanTermSheetTermsPayload.outstanding_balance)
    : Number.isFinite(toFiniteNumber(mortgagePayload?.current_outstanding_balance))
    ? toFiniteNumber(mortgagePayload.current_outstanding_balance)
    : Number.isFinite(toFiniteNumber(mortgagePayload?.outstanding_balance))
    ? toFiniteNumber(mortgagePayload.outstanding_balance)
    : extractCurrencyFromText(currentDebtText, [
        /\bcurrent outstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        /\bcurrent debt balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        /\boutstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        /\bprincipal balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      ]);
  const currentDebtRate = normalizePercentFraction(facts?.interest_rate) ?? extractPercentFraction(currentDebtText, [
    /\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bnote rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    /\bcoupon rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
  ]) ?? normalizePercentFraction(loanTermSheetTermsPayload?.interest_rate ?? loanTermSheetTermsPayload?.rate ?? mortgagePayload?.interest_rate ?? mortgagePayload?.rate);
  const currentDebtRateDisplay = Number.isFinite(currentDebtRate) ? `${(currentDebtRate * 100).toFixed(2)}%` : null;
  const currentDebtAmortYears = Number.isFinite(toFiniteNumber(facts?.amortization_remaining_years))
    ? toFiniteNumber(facts.amortization_remaining_years)
    : Number.isFinite(toFiniteNumber(facts?.amortization_years))
    ? toFiniteNumber(facts.amortization_years)
    : Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.amortization_remaining_years))
    ? toFiniteNumber(loanTermSheetTermsPayload.amortization_remaining_years)
    : Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.amortization_years))
    ? toFiniteNumber(loanTermSheetTermsPayload.amortization_years)
    : Number.isFinite(toFiniteNumber(mortgagePayload?.amortization_remaining_years))
    ? toFiniteNumber(mortgagePayload.amortization_remaining_years)
    : Number.isFinite(toFiniteNumber(mortgagePayload?.amort_years))
    ? toFiniteNumber(mortgagePayload.amort_years)
    : extractYears(currentDebtText, [
        /\bamortization remaining[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
        /\bamortization remaining years[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
        /\bamortization[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      ]);
  const currentDebtMonthlyPayment = Number.isFinite(toFiniteNumber(facts?.monthly_payment))
    ? toFiniteNumber(facts.monthly_payment)
    : Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.monthly_payment))
    ? toFiniteNumber(loanTermSheetTermsPayload.monthly_payment)
    : Number.isFinite(toFiniteNumber(mortgagePayload?.monthly_payment))
    ? toFiniteNumber(mortgagePayload.monthly_payment)
    : extractCurrencyFromText(currentDebtText, [
        /\bmonthly payment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        /\bmonthly debt service[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        /\bpayment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      ]);
  const maturityDate = String(facts?.maturity_date || facts?.maturityDate || extractDate(currentDebtText, [
    /\bmaturity date[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    /\bmatures?[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  ]) || loanTermSheetTermsPayload?.maturity_date || loanTermSheetTermsPayload?.maturityDate || "").trim();
  const rows = [
    Number.isFinite(outstandingBalance) ? `<tr><td>Current Outstanding Balance</td><td style="font-weight:600;">${formatMoney(outstandingBalance)}</td></tr>` : "",
    currentDebtRateDisplay ? `<tr><td>Interest Rate</td><td style="font-weight:600;">${currentDebtRateDisplay}</td></tr>` : "",
    Number.isFinite(currentDebtAmortYears) ? `<tr><td>Amortization Remaining</td><td style="font-weight:600;">${Math.round(currentDebtAmortYears)} years</td></tr>` : "",
    Number.isFinite(currentDebtMonthlyPayment) ? `<tr><td>Monthly Payment</td><td style="font-weight:600;">${formatMoney(currentDebtMonthlyPayment)}</td></tr>` : "",
    (currentDebt?.sourceEvidence?.filename || maturityDate) ? `<tr><td>Maturity Date</td><td style="font-weight:600;">${escapeHtml(maturityDate || "Not available")}</td></tr>` : "",
  ].filter(Boolean).join("");
  if (!rows) return renderSection("Debt / Financing Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  return renderSection("Debt / Financing Context", `<table class="detail-table"><tbody>${rows}</tbody></table>`, { pageBreakBefore: true });
}

function renderDocumentTreatmentSection(renderedAcquisitionMemo = null, sourcePackage = null, bossContract = null, customerSurfaceModel = null) {
  const bossDocs = Array.isArray(customerSurfaceModel?.supportSources) && customerSurfaceModel.supportSources.length
    ? customerSurfaceModel.supportSources
    : getBossSupportDocs(bossContract, sourcePackage);
  const tableHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.documentTreatmentSummaryHtml || "").trim();
  const supportRows = Array.isArray(bossDocs) && bossDocs.length
    ? bossDocs.map((doc) => `<tr><td>${escapeHtml(doc?.originalFilename || doc?.roleLabel || doc?.canonicalLabel || doc?.canonicalRole || "Support Document")}</td><td style="font-weight:600;">${escapeHtml(doc?.canonicalLabel || doc?.roleLabel || doc?.canonicalRole || "Other Support Document")}</td><td>${escapeHtml(doc?.treatment || "")}</td><td>${escapeHtml(doc?.use || "")}</td></tr>`).join("")
    : "";
  const tableBody = tableHtml || (supportRows ? `<table class="detail-table"><tbody>${supportRows}</tbody></table>` : "");
  if (!tableBody) return "";
  return renderSection(
    "Source Context / Support Document Treatment",
    `<p class="body-copy">Uploaded files are listed for auditability. Support documents are retained as source context and are not used to override modeled outputs.</p><p class="subsection-title">Document Treatment Summary</p>${tableBody}`,
    { id: "document-treatment-title", pageBreakBefore: true }
  );
}

function renderSummarySection({ sourcePackage = null, renderedAcquisitionMemo = null, acquisitionMemoProjection = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const supportDocCount = Number.isFinite(Number(customerSurfaceModel?.supportSourceCounts?.uniqueUploadedFileCount))
    ? Number(customerSurfaceModel.supportSourceCounts.uniqueUploadedFileCount)
    : getBossSupportDocs(bossContract, sourcePackage).length;
  const t12Name = customerSurfaceModel?.coreSources?.coreT12?.filename || bossContract?.sourceTruth?.coreT12?.originalFilename || sourcePackage?.coreT12?.originalFilename || "Not present";
  const rentRollName = customerSurfaceModel?.coreSources?.coreRentRoll?.filename || bossContract?.sourceTruth?.coreRentRoll?.originalFilename || sourcePackage?.coreRentRoll?.originalFilename || "Not present";
  const rows = [
    `<tr><td>Core T12</td><td style="font-weight:600;">${escapeHtml(t12Name)}</td></tr>`,
    `<tr><td>Core Rent Roll</td><td style="font-weight:600;">${escapeHtml(rentRollName)}</td></tr>`,
    `<tr><td>Support docs classified</td><td style="font-weight:600;">${supportDocCount > 0 ? String(supportDocCount) : "0"}</td></tr>`,
    `<tr><td>Current debt context</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasCurrentDebtContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasPurchaseAssumptions ?? acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
  ];
  const renderedCoreSourceSummary = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  return renderSection(
    "Acquisition Memo Summary",
    `<p class="body-copy">Source-bound operating and acquisition context.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>${renderedCoreSourceSummary ? `<div class="subsection-block"><p class="subsection-title">Core Quantitative Sources</p>${renderedCoreSourceSummary}</div>` : ""}`,
    { id: "acq-summary-title", pageBreakBefore: false }
  );
}

function renderAcquisitionMemoSummarySection({ sourcePackage = null, acquisitionMemoProjection = null, coreMetrics = null, renderedAcquisitionMemo = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const supportDocs = Array.isArray(customerSurfaceModel?.supportSources) && customerSurfaceModel.supportSources.length
    ? customerSurfaceModel.supportSources
    : getBossSupportDocs(bossContract, sourcePackage);
  const assetIdentity = formatAssetIdentityForSurface({ customerSurfaceModel, sourcePackage, coreMetrics });
  const sourceRows = [
    `<tr><td>Core T12</td><td style="font-weight:600;">${escapeHtml(customerSurfaceModel?.coreSources?.coreT12?.filename || bossContract?.sourceTruth?.coreT12?.originalFilename || sourcePackage?.coreT12?.originalFilename || "Not present")}</td><td>${escapeHtml(customerSurfaceModel?.coreSources?.coreT12?.visibleLabel || bossContract?.sourceTruth?.coreT12?.roleLabel || sourcePackage?.coreT12?.roleLabel || sourcePackage?.coreT12?.canonicalLabel || "")}</td></tr>`,
    `<tr><td>Core Rent Roll</td><td style="font-weight:600;">${escapeHtml(customerSurfaceModel?.coreSources?.coreRentRoll?.filename || bossContract?.sourceTruth?.coreRentRoll?.originalFilename || sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td><td>${escapeHtml(customerSurfaceModel?.coreSources?.coreRentRoll?.visibleLabel || bossContract?.sourceTruth?.coreRentRoll?.roleLabel || sourcePackage?.coreRentRoll?.roleLabel || sourcePackage?.coreRentRoll?.canonicalLabel || "")}</td></tr>`,
    `<tr><td>Classified support documents</td><td style="font-weight:600;">${supportDocs.length}</td><td>Included in source treatment schedule</td></tr>`,
  ];
  const renderedCoreSourceSummary = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  const rows = [
    `<tr><td>Asset Identity</td><td style="font-weight:600;">${escapeHtml(assetIdentity)}</td></tr>`,
    `<tr><td>ACQUISITION MEMO</td><td style="font-weight:600;">${escapeHtml("InvestorIQ")}</td></tr>`,
    Number.isFinite(Number(coreMetrics?.occupancy)) ? `<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.noi)) ? `<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(coreMetrics.noi)}</td></tr>` : "",
    Boolean(customerSurfaceModel?.diagnostics?.hasCurrentDebtContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? `<tr><td>Current debt context</td><td style="font-weight:600;">Yes</td></tr>` : "",
  ].filter(Boolean).join("");
  return renderSection(
    "Acquisition Memo Summary",
    `<p class="body-copy">Review / Source Reconciliation Disclosure. Source-bound operating and acquisition context.</p><table class="detail-table"><tbody>${rows}</tbody></table><div class="subsection-block"><p class="subsection-title">Source Context / Uploaded Files</p><table class="detail-table data-coverage-table data-coverage-table-3col"><tbody>${sourceRows.join("")}</tbody></table></div>${renderedCoreSourceSummary ? `<div class="subsection-block"><p class="subsection-title">Core Quantitative Sources</p><div class="data-coverage-source-summary">${renderedCoreSourceSummary}</div></div>` : ""}`,
    { pageBreakBefore: false }
  );
}

function renderOperatingStatementSection({ sourcePackage = null, t12Payload = null, coreMetrics = null, acquisitionMemoProjection = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const rows = [];
  const sectionContract = getCustomerSurfaceSection(customerSurfaceModel, "operatingStatementTTMSummary") || getBossSectionContract(bossContract, "operatingStatementTTMSummary");
  if (sectionContract?.status === "collapsed") {
    return renderSection("Operating Statement / TTM Summary", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  if (sectionHasSourceBackedFacts(sectionContract) && sectionHasMissingRequiredFacts(sectionContract)) {
    return renderSection("Operating Statement / TTM Summary", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  const t12Source = customerSurfaceModel?.coreSources?.coreT12 || bossContract?.sourceTruth?.coreT12 || sourcePackage?.coreT12 || null;
  const rentRollSource = customerSurfaceModel?.coreSources?.coreRentRoll || bossContract?.sourceTruth?.coreRentRoll || sourcePackage?.coreRentRoll || null;
  const t12Name = t12Source?.filename || t12Source?.originalFilename || "Not present";
  const rentRollName = rentRollSource?.filename || rentRollSource?.originalFilename || "Not present";
  const t12Snippet = getSourceEvidenceText(t12Source) || String(t12Payload?.document_text_extracted || t12Payload?.source_text || t12Payload?.text || "");
  const t12Facts = {
    ...(t12Payload && typeof t12Payload === "object" ? t12Payload : {}),
    ...(customerSurfaceModel?.sourceBackedFacts?.operatingStatementTTMSummary || {}),
    ...(t12Source?.extractedFacts || {}),
  };
  const structuredT12LineItems = [
    ...(Array.isArray(t12Facts?.income_lines) ? t12Facts.income_lines : []),
    ...(Array.isArray(t12Facts?.expense_lines) ? t12Facts.expense_lines : []),
  ].map(normalizeStructuredT12LineItem).filter(Boolean);
  const t12LineItems = structuredT12LineItems.length ? structuredT12LineItems : parseT12LineItemsFromText(t12Snippet);
  if (Number.isFinite(Number(coreMetrics?.annualInPlaceRent))) rows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualInPlaceRent)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.annualMarketRent))) rows.push(`<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatMoney(coreMetrics.annualMarketRent)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.egi))) rows.push(`<tr><td>Effective Gross Income</td><td style="font-weight:600;">${formatMoney(coreMetrics.egi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.opEx))) rows.push(`<tr><td>Operating Expenses</td><td style="font-weight:600;">${formatMoney(coreMetrics.opEx)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noi))) rows.push(`<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(coreMetrics.noi)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.occupancy))) rows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.egi)) && Number.isFinite(Number(coreMetrics?.units)) && Number(coreMetrics?.units) > 0) rows.push(`<tr><td>EGI per Unit</td><td style="font-weight:600;">${formatMoney(coreMetrics.egi / coreMetrics.units)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.opEx)) && Number.isFinite(Number(coreMetrics?.units)) && Number(coreMetrics?.units) > 0) rows.push(`<tr><td>OpEx per Unit</td><td style="font-weight:600;">${formatMoney(coreMetrics.opEx / coreMetrics.units)}</td></tr>`);
  if (Number.isFinite(Number(coreMetrics?.noi)) && Number.isFinite(Number(coreMetrics?.units)) && Number(coreMetrics?.units) > 0) rows.push(`<tr><td>NOI per Unit</td><td style="font-weight:600;">${formatMoney(coreMetrics.noi / coreMetrics.units)}</td></tr>`);
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
    ${t12LineItems.length ? `<div class="subsection-block"><p class="subsection-title">T12 Income & Expense Line Items</p><table class="detail-table"><tbody>${t12LineItems.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td style="font-weight:600;">${formatMoney(item.amount)}</td></tr>`).join("")}</tbody></table></div>` : ""}
    ${t12Snippet ? `<div class="subsection-block"><p class="subsection-title">TTM Source Excerpt</p><p class="body-copy">${escapeHtml(t12Snippet.slice(0, 420))}</p></div>` : ""}
    ${occupancyNote ? `<p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">${escapeHtml(occupancyNote)}</p>` : ""}
  </div>`;
}

function renderCapRateValueSection({ acquisitionMemoProjection = null, sourcePackage = null, coreMetrics = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const noiBasis = Number(acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.noi_basis ?? acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.noi_basis ?? coreMetrics?.noi ?? NaN);
  const capRates = [5.0, 6.0, 7.0];
  const units = Number(coreMetrics?.units ?? customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units ?? bossContract?.reportContext?.coreMetrics?.units ?? bossContract?.sourceTruth?.coreRentRoll?.extractedFacts?.total_units ?? sourcePackage?.coreRentRoll?.extractedFacts?.total_units ?? sourcePackage?.coreRentRoll?.extractedFacts?.units?.length ?? NaN);
  const rows = capRates.map((cap) => {
    const value = Number.isFinite(noiBasis) ? noiBasis / (cap / 100) : NaN;
    const perUnit = Number.isFinite(value) && Number.isFinite(units) && units > 0 ? value / units : null;
    const perUnitDisplay = Number.isFinite(perUnit)
      ? (Math.abs(cap - 7.0) < 0.0001 ? formatMoney(Math.floor(perUnit)) : formatMoney(perUnit))
      : "-";
    return `<tr><td>${cap.toFixed(1)}%</td><td style="font-weight:600;">${formatCapRateValue(noiBasis, cap)}</td><td style="font-weight:600;">${perUnitDisplay}</td></tr>`;
  }).join("");
  const headlineValue = formatCapRateValue(noiBasis, 7.0);
  return `<div class="card no-break">
    <p class="subsection-title">Cap-Rate Value Indication</p>
    <p class="body-copy">Document-derived NOI basis is capitalized at stable cap-rate assumptions. The display is deterministic and source-basis driven.</p>
    <table class="detail-table"><thead><tr><th>Cap Rate</th><th>Implied Value</th><th>Per Unit</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">7.0% cap value: ${escapeHtml(headlineValue || "Not available")}</p>
  </div>`;
}

function renderMetricsSnapshotSection(coreMetrics = null, sourcePackage = null, bossContract = null, customerSurfaceModel = null) {
  const rows = [];
  const units = Number.isFinite(Number(coreMetrics?.units))
    ? Number(coreMetrics.units)
    : Number.isFinite(Number(customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units))
    ? Number(customerSurfaceModel.sourceBackedFacts.unitMix.total_units)
    : Number.isFinite(Number(bossContract?.sourceTruth?.coreRentRoll?.extractedFacts?.total_units))
    ? Number(bossContract.sourceTruth.coreRentRoll.extractedFacts.total_units)
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
  const goingInCapRate = resolveValidGoingInCapRate({ coreMetrics, sourcePackage, bossContract });
  if (Number.isFinite(goingInCapRate)) rows.push(`<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercentDisplay(goingInCapRate)}</td></tr>`);
  if (Number.isFinite(pricePerUnit)) rows.push(`<tr><td>Price per Unit</td><td style="font-weight:600;">${formatMoney(pricePerUnit)}</td></tr>`);
  if (Number.isFinite(noiPerUnit)) rows.push(`<tr><td>NOI per Unit</td><td style="font-weight:600;">${formatMoney(noiPerUnit)}</td></tr>`);
  return renderSection(
    "Key Metrics Snapshot",
    rows.length ? `<table class="detail-table"><tbody>${rows.join("")}</tbody></table>` : `<p class="body-copy">No core metrics were available for snapshot rendering.</p>`,
    { id: "key-metrics-title", pageBreakBefore: true }
  );
}

function renderOperatingSnapshotSection({ sourcePackage = null, coreMetrics = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const rentRollSnippet = customerSurfaceModel?.coreSources?.coreRentRoll?.sourceEvidence?.textSnippet || bossContract?.sourceTruth?.coreRentRoll?.sourceEvidence?.textSnippet || sourcePackage?.coreRentRoll?.sourceEvidence?.textSnippet || "";
  const t12Snippet = customerSurfaceModel?.coreSources?.coreT12?.sourceEvidence?.textSnippet || bossContract?.sourceTruth?.coreT12?.sourceEvidence?.textSnippet || sourcePackage?.coreT12?.sourceEvidence?.textSnippet || "";
  const rows = [
    `<tr><td>Core T12 source</td><td style="font-weight:600;">${escapeHtml(customerSurfaceModel?.coreSources?.coreT12?.filename || bossContract?.sourceTruth?.coreT12?.originalFilename || sourcePackage?.coreT12?.originalFilename || "Not present")}</td></tr>`,
    `<tr><td>Core Rent Roll source</td><td style="font-weight:600;">${escapeHtml(customerSurfaceModel?.coreSources?.coreRentRoll?.filename || bossContract?.sourceTruth?.coreRentRoll?.originalFilename || sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td></tr>`,
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

function renderUnitMixSection({ sourcePackage = null, coreMetrics = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const rentRollSource = customerSurfaceModel?.coreSources?.coreRentRoll || bossContract?.sourceTruth?.coreRentRoll || sourcePackage?.coreRentRoll || null;
  const rentRollSnippet = rentRollSource?.sourceEvidence?.textSnippet || "";
  const rentRollFacts = rentRollSource?.extractedFacts || {};
  const structuredUnitMixRows = [
    ...(Array.isArray(rentRollFacts?.unit_mix) ? rentRollFacts.unit_mix : []),
  ].map(normalizeStructuredUnitMixRow).filter(Boolean);
  const structuredUnitRows = structuredUnitMixRows.length ? structuredUnitMixRows : deriveStructuredUnitMixRowsFromUnits(rentRollFacts?.units);
  const unitMixRows = structuredUnitRows.length ? structuredUnitRows : parseUnitMixRowsFromText(rentRollSnippet);
  const unitMixSection = getCustomerSurfaceSection(customerSurfaceModel, "unitMix") || getBossSectionContract(bossContract, "unitMix");
  if (unitMixSection?.status === "collapsed") {
    return renderSection(
      "Unit Mix and Rent Positioning",
      renderSectionCollapseHtml(),
      { id: "unit-mix-title", pageBreakBefore: true }
    );
  }
  if (unitMixSection?.status === "collapsed") {
    return renderSection(
      "Unit Mix and Rent Positioning",
      renderSectionCollapseHtml(),
      { id: "unit-mix-title", pageBreakBefore: true }
    );
  }
  const annualInPlace = Number(coreMetrics?.annualInPlaceRent);
  const annualMarket = Number(coreMetrics?.annualMarketRent);
  const annualUpside = Number.isFinite(annualInPlace) && Number.isFinite(annualMarket) ? annualMarket - annualInPlace : null;
  const rentGapPct = Number.isFinite(annualUpside) && Number.isFinite(annualInPlace) && annualInPlace > 0 ? annualUpside / annualInPlace : null;
  const tableRows = unitMixRows.length
    ? unitMixRows.map((row) => {
        const gapDisplay = Number.isFinite(row.gap) ? formatMoney(row.gap) : "Not available";
        return `<tr><td>${escapeHtml(row.label)}</td><td style="font-weight:600;">${Number.isFinite(row.count) ? Math.round(row.count) : "—"}</td><td style="font-weight:600;">${Number.isFinite(row.inPlace) ? formatMoney(row.inPlace) : "Not available"}</td><td style="font-weight:600;">${Number.isFinite(row.market) ? formatMoney(row.market) : "Not available"}</td><td style="font-weight:600;">${gapDisplay}</td></tr>`;
      }).join("")
    : (sectionHasSourceBackedFacts(unitMixSection)
      ? `<tr><td colspan="5" style="font-weight:600;">${renderSectionCollapseHtml()}</td></tr>`
      : `<tr><td colspan="5" style="font-weight:600;">No parsed unit mix rows were available from the canonical rent roll evidence.</td></tr>`);
  return renderSection(
    "Unit Mix and Rent Positioning",
    `<div class="grid-2-balanced">
      <div class="no-break">
        <table class="unit-mix-table">
          <thead>
            <tr>
              <th>Unit Type</th>
              <th>Count</th>
              <th>Avg In-Place Rent</th>
              <th>Documented Market Rent</th>
              <th>Monthly Rent Gap</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div class="no-break">
        <p class="subsection-title">Rent Positioning Summary</p>
        <table class="detail-table"><tbody>
          <tr><td>Rent positioning anchor</td><td style="font-weight:600;">${Number.isFinite(annualInPlace) && Number.isFinite(annualMarket) ? `${formatMoney(annualInPlace)} vs ${formatMoney(annualMarket)}` : "Not available"}</td></tr>
          <tr><td>Annual Gross Rent Upside</td><td style="font-weight:600;">${Number.isFinite(annualUpside) ? formatMoney(annualUpside) : "Not available"}</td></tr>
          <tr><td>Rent Gap %</td><td style="font-weight:600;">${Number.isFinite(rentGapPct) ? formatPercentDisplay(rentGapPct) : "Not available"}</td></tr>
          <tr><td>Occupancy basis</td><td style="font-weight:600;">${Number.isFinite(Number(coreMetrics?.occupancy)) ? formatPercentDisplay(coreMetrics.occupancy) : "Not available"}</td></tr>
          <tr><td>Core rent roll evidence</td><td style="font-weight:600;">${escapeHtml(sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td></tr>
        </tbody></table>
        ${rentRollSnippet ? `<div class="subsection-block"><p class="subsection-title">Rent Roll Snippet</p><p class="body-copy">${escapeHtml(rentRollSnippet.slice(0, 420))}</p></div>` : ""}
      </div>
    </div>`,
    { id: "unit-mix-title", pageBreakBefore: true }
  );
}

function renderValueSensitivitySection({ sourcePackage = null, acquisitionMemoProjection = null, coreMetrics = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const annualRentUpside = Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))
    ? Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent)
    : null;
  const rentGapPct = Number.isFinite(annualRentUpside) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent)) && Number(coreMetrics.annualInPlaceRent) > 0
    ? annualRentUpside / Number(coreMetrics.annualInPlaceRent)
    : null;
  const capRate = Number.isFinite(Number(customerSurfaceModel?.valueSemantics?.wholePropertyValue?.goingInCapRate))
    ? Number(customerSurfaceModel.valueSemantics.wholePropertyValue.goingInCapRate)
    : resolveValidGoingInCapRate({ coreMetrics, acquisitionMemoProjection, sourcePackage, bossContract });
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
    `<p class="body-copy">Value sensitivity is shown from the verified rent gap and the document-backed cap-rate frame. No additional transaction narrative is introduced.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>`,
    { id: "value-sensitivity-title", pageBreakBefore: true }
  );
}

function renderDataCoverageSection({ sourcePackage = null, renderedAcquisitionMemo = null, acquisitionMemoProjection = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const supportDocs = Array.isArray(customerSurfaceModel?.supportSources) && customerSurfaceModel.supportSources.length
    ? customerSurfaceModel.supportSources
    : getBossSupportDocs(bossContract, sourcePackage);
  const rows = [
    `<tr><td>Core T12</td><td style="font-weight:600;">${escapeHtml(customerSurfaceModel?.coreSources?.coreT12?.filename || bossContract?.sourceTruth?.coreT12?.originalFilename || sourcePackage?.coreT12?.originalFilename || "Not present")}</td><td>${escapeHtml(customerSurfaceModel?.coreSources?.coreT12?.visibleLabel || bossContract?.sourceTruth?.coreT12?.roleLabel || sourcePackage?.coreT12?.roleLabel || sourcePackage?.coreT12?.canonicalLabel || "")}</td></tr>`,
    `<tr><td>Core Rent Roll</td><td style="font-weight:600;">${escapeHtml(customerSurfaceModel?.coreSources?.coreRentRoll?.filename || bossContract?.sourceTruth?.coreRentRoll?.originalFilename || sourcePackage?.coreRentRoll?.originalFilename || "Not present")}</td><td>${escapeHtml(customerSurfaceModel?.coreSources?.coreRentRoll?.visibleLabel || bossContract?.sourceTruth?.coreRentRoll?.roleLabel || sourcePackage?.coreRentRoll?.roleLabel || sourcePackage?.coreRentRoll?.canonicalLabel || "")}</td></tr>`,
    `<tr><td>Classified support documents</td><td style="font-weight:600;">${supportDocs.length}</td><td>Included in source treatment schedule</td></tr>`,
  ];
  const sourceSummaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  const stateRows = [
    `<tr><td>Current debt context</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasCurrentDebtContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasPurchaseAssumptions ?? acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Structured renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasStructuredRenovation ?? acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Appraisal context</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasAppraisalContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasAppraisalContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Market survey context</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasMarketSurveyContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasMarketSurveyContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Environmental / Phase I ESA context</td><td style="font-weight:600;">${Boolean(customerSurfaceModel?.diagnostics?.hasEnvironmentalContext ?? acquisitionMemoProjection?.financingReadinessSignals?.hasEnvironmentalContext) ? "Yes" : "No"}</td></tr>`,
  ];
  return renderSection(
    "Data Coverage & Source Limitations",
    `<table class="detail-table data-coverage-table data-coverage-table-3col"><tbody>${rows.join("")}</tbody></table><div class="subsection-block"><p class="subsection-title">Source Reliability Snapshot</p><table class="detail-table data-coverage-table data-coverage-table-2col"><tbody>${stateRows.join("")}</tbody></table></div>${sourceSummaryHtml ? `<div class="subsection-block"><p class="subsection-title">Core Source Summary</p><div class="data-coverage-source-summary">${sourceSummaryHtml}</div></div>` : ""}`,
    { id: "data-coverage-title", pageBreakBefore: true }
  );
}

function renderMethodologySection() {
  return renderSection(
    "Methodology & Data Transparency",
    `<p class="body-copy">InvestorIQ does not assume or gap-fill missing data.</p><p class="body-copy">Document-Backed Acquisition Memo Outputs are built from verified source documents, deterministic operating calculations, and explicit source treatment.</p><p class="body-copy">Methodology Notes: unsupported assumptions are omitted; lender-readiness disclosure is limited to the documents provided; data limitations and missing inputs remain visible to the reader.</p><p class="body-copy">Data Limitations &amp; Missing Inputs: the report is intended for institutional review alongside the source documents and support-document treatment schedule.</p>`,
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
    ? `<table class="detail-table data-coverage-table data-coverage-table-3col"><tbody>${coreSourceRows.join("")}</tbody></table>`
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
  t12Payload = null,
  acquisitionTermsPayload = null,
  loanTermSheetTermsPayload = null,
  mortgagePayload = null,
  coreMetrics = null,
  reportMeta = null,
  propertyProfile = null,
  bossContract = null,
  customerSurfaceModel = null,
} = {}) {
  try {
    const surfaceIdentity = customerSurfaceModel?.identity || {};
    const propertyName = surfaceIdentity?.propertyName || propertyProfile?.propertyName || propertyProfile?.property_name || reportMeta?.propertyName || reportMeta?.property_name || sourcePackage?.propertyName || "Acquisition Memo";
    const propertyAddress = surfaceIdentity?.propertyAddress || propertyProfile?.propertyAddress || propertyProfile?.property_address || reportMeta?.propertyAddress || reportMeta?.property_address || "";
    const propertyTitle = surfaceIdentity?.propertyTitle || propertyProfile?.propertyTitle || propertyProfile?.property_title || reportMeta?.propertyTitle || reportMeta?.property_title || "";
    const generatedLabel = formatDisplayDate(reportMeta?.generatedAt || reportMeta?.generated_at || "");
    const coverSection = renderBrandCoverSection({ propertyName, propertyAddress, propertyTitle, reportMeta, sourcePackage, coreMetrics, customerSurfaceModel });
    const headerStrip = `<div class="header-strip">
      <div class="header-top">
        <div>
          <div class="brand-mark">INVESTORIQ</div>
          <div class="tagline">Institutional Grade Property Intelligence</div>
        </div>
        <div style="text-align:center; font-family:var(--font-body); font-size:7.5pt; font-weight:300; color:var(--ink-3);">${escapeHtml([propertyName, propertyAddress || propertyTitle].filter(Boolean).join(" | "))}</div>
        <div style="text-align:right; font-family:var(--font-mono); font-size:6.5pt; font-weight:400; color:var(--ink-4); letter-spacing:0.08em;">${escapeHtml(generatedLabel || "")}</div>
      </div>
    </div>`;
    const bossSections = bossContract?.sections || {};
    const executiveSummarySection = renderSafely("Executive Summary", () => renderExecutiveSummarySection({ sourcePackage, acquisitionMemoProjection, coreMetrics, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.executiveSummary });
    const metricsSection = renderSafely("Key Metrics Snapshot", () => renderMetricsSnapshotSection(coreMetrics, sourcePackage, bossContract, customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.keyMetricsSnapshot });
    const keyUpsideDriversSection = renderSafely("Key Upside Drivers", () => renderKeyUpsideDriversSection({ sourcePackage, coreMetrics, acquisitionMemoProjection }), { pageBreakBefore: true, bossSection: bossSections.keyUpsideDrivers });
    const primaryConstraintSection = renderSafely("Primary Constraint / Review Disclosure", () => renderPrimaryConstraintSection({ sourcePackage, acquisitionMemoProjection }), { pageBreakBefore: true, bossSection: bossSections.primaryConstraintReviewDisclosure });
    const acquisitionMemoSummarySection = renderSafely("Acquisition Memo Summary", () => renderAcquisitionMemoSummarySection({ sourcePackage, acquisitionMemoProjection, coreMetrics, renderedAcquisitionMemo, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.acquisitionMemoSummary });
    const operatingSection = renderSafely("Operating Snapshot", () => renderOperatingSnapshotSection({ sourcePackage, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.operatingSnapshot });
    const unitMixSection = renderSafely("Unit Mix and Rent Positioning", () => renderUnitMixSection({ sourcePackage, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.unitMix });
    const valueSensitivitySection = renderSafely("Rent Upside / Value Sensitivity", () => renderValueSensitivitySection({ sourcePackage, acquisitionMemoProjection, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.rentUpsideValueSensitivity });
    const capRateValueSection = renderSafely("Cap-Rate Value Indication", () => renderCapRateValueSection({ acquisitionMemoProjection, sourcePackage, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.capRateValueIndication });
    const readinessSection = renderSafely("Preliminary Financing Readiness Summary", () => renderReadinessSection({ renderedAcquisitionMemo, acquisitionMemoProjection, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.preliminaryFinancingReadinessSummary });
    const acquisitionRequestContextSection = renderSafely("Acquisition Request Context", () => renderAcquisitionRequestContextSection({ acquisitionMemoProjection, sourcePackage, acquisitionTermsPayload, loanTermSheetTermsPayload, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.acquisitionRequestContext });
    const operatingSupportSection = renderSafely("Operating Support", () => renderOperatingSupportSection({ coreMetrics }), { pageBreakBefore: true, bossSection: bossSections.operatingSupport });
    const rentValueSupportSection = renderSafely("Rent / Value Support", () => renderRentValueSupportSection({ coreMetrics }), { pageBreakBefore: true, bossSection: bossSections.rentValueSupport });
    const debtFinancingContextSection = renderSafely("Debt / Financing Context", () => renderDebtFinancingContextSection({ acquisitionMemoProjection, sourcePackage, loanTermSheetTermsPayload, mortgagePayload, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.debtFinancingContext });
    const operatingStatementSection = renderSafely("Operating Statement / TTM Summary", () => renderOperatingStatementSection({ sourcePackage, t12Payload, coreMetrics, acquisitionMemoProjection, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.operatingStatementTTMSummary });
    const dataCoverageSection = renderSafely("Data Coverage & Source Limitations", () => renderDataCoverageSection({ sourcePackage, renderedAcquisitionMemo, acquisitionMemoProjection, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.dataCoverageSourceLimitations });
    const treatmentSection = renderSafely("Source Context / Support Document Treatment", () => renderDocumentTreatmentSection(renderedAcquisitionMemo, sourcePackage, bossContract, customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.sourceContextSupportDocumentTreatment });
    const methodologySection = renderSafely("Methodology & Data Transparency", () => renderMethodologySection(), { pageBreakBefore: true });
    const footerSection = `<div class="report-footer"><div class="report-footer-inner"><span>InvestorIQ Capital Intelligence Memorandum | Confidential</span><span>&copy; InvestorIQ Technologies Inc.</span></div></div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(`InvestorIQ Capital Intelligence Memorandum - ${propertyName}`)}</title>
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
    body { margin:0; padding:0; background:var(--white); color:var(--ink); font-family:var(--font-body); font-size:11px; line-height:1.5; }
    .report-container { width:100%; padding:0.5in 0.55in 0.52in 0.55in; box-sizing:border-box; background:var(--white); }
    .cover-wrap { page-break-after:always; page-break-inside:avoid; margin:0; padding:0; width:100%; height:10.5in; overflow:hidden; position:relative; background:var(--cover-bg); }
    .cover-wrap::before { content:''; position:absolute; top:0; bottom:0; left:0.6in; width:1px; background:linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.45) 12%, rgba(201,168,76,0.45) 88%, transparent 100%); }
    .cover-wrap::after { content:''; position:absolute; top:0.6in; right:0.52in; width:1in; height:1in; border-top:1px solid rgba(201,168,76,0.1); border-right:1px solid rgba(201,168,76,0.1); }
    .cover-table { width:100%; border-collapse:collapse; height:100%; table-layout:fixed; }
    .cover-cell { background:var(--cover-bg); padding:1.6in 0.52in 0.72in 0.92in; vertical-align:top; width:100%; height:100%; overflow:hidden; position:relative; }
    .cover-brand-name { position:absolute; top:0.2in; left:0.52in; font-family:var(--font-display); font-size:13pt; font-weight:600; color:var(--gold); letter-spacing:0.02em; white-space:nowrap; hyphens:none; text-transform:uppercase; margin:0; }
    .cover-brand-sub { position:absolute; top:0.24in; right:0.52in; font-family:var(--font-mono); font-size:6pt; font-weight:400; color:rgba(201,168,76,0.28); letter-spacing:0.2em; white-space:nowrap; hyphens:none; text-transform:uppercase; margin:0; }
    .cover-prop-name { font-family:var(--font-display); font-size:38pt; font-weight:600; color:var(--white); line-height:1; letter-spacing:-0.02em; max-width:100%; white-space:normal; overflow-wrap:break-word; word-break:normal; hyphens:none; margin:0 0 0.1in 0; }
    .cover-prop-sub { font-family:var(--font-body); font-size:9pt; font-weight:300; color:rgba(255,255,255,0.35); letter-spacing:0.07em; margin:0 0 0.52in 0; }
    .cover-divider { border:none; width:0.52in; height:1.5px; background:var(--gold); opacity:0.65; margin:0 0 0.18in 0; }
    .cover-verdict-value { font-family:var(--font-display); font-size:22pt; font-weight:500; color:var(--gold); text-transform:none; letter-spacing:-0.01em; margin:0 0 0.22in 0; line-height:1.05; }
    .cover-disclosure { font-family:var(--font-mono); font-size:6.5pt; color:rgba(255,255,255,0.42); letter-spacing:0.14em; text-transform:uppercase; margin:0 0 0.12in 0; }
    .cover-metric-strip { margin:0 0 0.22in 0; padding:0 0 0.18in 0; border-bottom:1px solid rgba(201,168,76,0.15); }
    .cover-metric-row { color:rgba(255,255,255,0.52); font-family:var(--font-body); font-size:8pt; font-weight:300; letter-spacing:0.02em; text-align:left; line-height:1.7; }
    .cover-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px 14px; margin-top:16pt; }
    .cover-grid div { border-top:1px solid rgba(201,168,76,0.3); padding-top:8pt; }
    .cover-grid span { display:block; font-family:var(--font-mono); font-size:6pt; text-transform:uppercase; letter-spacing:0.16em; color:rgba(255,255,255,0.45); margin-bottom:3pt; }
    .cover-grid strong { font-family:var(--font-display); font-size:13pt; font-weight:500; color:var(--white); }
    .cover-footer-row { display:flex; justify-content:space-between; align-items:center; position:absolute; bottom:0; left:0; right:0; height:0.46in; padding:0 0.52in; background:rgba(0,0,0,0.2); border-top:1px solid rgba(201,168,76,0.07); }
    .cover-footer-text { font-family:var(--font-mono); font-size:6pt; color:rgba(255,255,255,0.12); letter-spacing:0.12em; text-transform:uppercase; }
    .cover-footer-row .cover-footer-text:last-child { color:rgba(201,168,76,0.25); letter-spacing:0.14em; }
    .header-strip { position:relative; border-top:none; border-bottom:1px solid var(--hairline); padding:0 0 0.12in 0; margin:-0.5in -0.55in 0.38in -0.55in; background:var(--white); }
    .header-strip::before { content:''; position:absolute; top:0; left:0; right:0; height:1.5px; background:var(--gold); opacity:0.55; }
    .header-top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0.12in 0.55in 0 0.55in; }
    .brand-mark { font-family:var(--font-display); font-size:8pt; font-weight:600; color:var(--ink); letter-spacing:0.04em; text-transform:uppercase; white-space:nowrap; hyphens:none; }
    .tagline { font-size:10px; text-transform:uppercase; letter-spacing:0.18em; color:var(--ink-4); margin-top:6px; }
    .section { margin-top:18px; padding:24px 0; background:var(--white); }
    .section-break { break-before:page; page-break-before:always; }
    .section-header { position:relative; margin-top:0; margin-bottom:0.38in; padding-bottom:0.14in; border-bottom:1px solid var(--hairline); }
    .section-header::after { content:''; position:absolute; left:0; bottom:-1px; width:0.28in; height:1.5px; background:var(--gold); opacity:0.8; }
    .section-header-title { display:block; font-family:var(--font-display); font-size:18pt; font-weight:500; letter-spacing:-0.025em; color:var(--ink); line-height:1.05; word-break:keep-all; overflow-wrap:normal; hyphens:none; margin-bottom:4pt; }
    .card { background:var(--white); border:1px solid var(--border-soft, var(--hairline)); border-top:1px solid var(--hairline); padding:12px 14px; }
    .no-break { break-inside:avoid; page-break-inside:avoid; }
    .body-copy { margin:3px 0 8px 0; color:var(--ink-3); font-size:10px; line-height:1.6; }
    .subsection-block + .subsection-block { margin-top:14px; }
    .subsection-title { margin:0 0 8px 0; font-family:var(--font-body); font-size:8px; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-4); font-weight:600; }
    .detail-table { width:100%; border-collapse:collapse; font-size:10.5px; table-layout:fixed; }
    .detail-table td { border-bottom:1px solid var(--hairline); padding:6px 8px; vertical-align:top; line-height:1.35; }
    .detail-table tr:first-child td { border-top:none; }
    .detail-table td:first-child { width:44%; color:var(--ink-3); }
    .detail-table td:last-child { font-weight:600; color:var(--ink); }
    .data-coverage-table { width:100%; table-layout:fixed; }
    .data-coverage-table td { white-space:normal; overflow-wrap:anywhere; word-break:break-word; hyphens:auto; }
    .data-coverage-table-3col td:nth-child(1) { width:26%; }
    .data-coverage-table-3col td:nth-child(2) { width:39%; }
    .data-coverage-table-3col td:nth-child(3) { width:35%; }
    .data-coverage-table-2col td:nth-child(1) { width:74%; }
    .data-coverage-table-2col td:nth-child(2) { width:26%; text-align:right; }
    .data-coverage-source-summary { margin-top:2px; }
    .unit-mix-table { width:100%; border-collapse:collapse; font-size:10px; table-layout:fixed; }
    .unit-mix-table th { font-family:var(--font-body); font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--ink-3); border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline-mid); padding:0 8px 6px; text-align:left; background:var(--white); }
    .unit-mix-table td { border-bottom:1px solid var(--hairline); padding:6px 8px; vertical-align:top; }
    .unit-mix-table tr:nth-child(even) td { background:var(--row-alt); }
    .summary-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:12px; }
    .summary-strip div { border:1px solid var(--hairline); padding:10px 12px; background:var(--paper-warm); }
    .summary-strip span { display:block; font-family:var(--font-mono); font-size:6.5pt; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-4); margin-bottom:4px; }
    .summary-strip strong { font-family:var(--font-display); font-size:16pt; font-weight:500; color:var(--ink); }
    .readiness-summary { margin-bottom:10px; font-size:10.5px; line-height:1.6; color:var(--ink-3); }
    .source-table { width:100%; border-collapse:collapse; font-size:10.5px; table-layout:fixed; margin-top:8px; }
    .source-table th { font-family:var(--font-body); font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--ink-3); border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline-mid); padding:0 8px 6px; text-align:left; background:var(--white); }
    .source-table td { border-bottom:1px solid var(--hairline); padding:6px 8px; vertical-align:top; }
    .source-table tr:nth-child(even) td { background:var(--row-alt); }
    .grid-2-balanced { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
    .footer-note { margin-top:16px; color:var(--ink-4); font-size:10px; font-style:italic; }
    .report-footer { margin-top:18px; padding-top:10px; border-top:1px solid var(--hairline); }
    .report-footer-inner { width:100%; display:flex; justify-content:space-between; gap:12px; align-items:center; }
    .report-footer-inner span:first-child { font-family:var(--font-mono); font-size:6pt; color:var(--ink-4); letter-spacing:0.1em; text-transform:uppercase; }
    .report-footer-inner span:last-child { font-family:var(--font-body); font-size:6.5pt; color:var(--ink-4); letter-spacing:0.02em; }
    .meta-line { display:flex; justify-content:space-between; border-bottom:1px solid var(--hairline); padding:5px 0; font-size:10.5px; }
    .meta-label { color:var(--ink-3); }
    .meta-value { font-weight:600; color:var(--ink); text-align:right; }
  </style>
</head>
<body>
    ${coverSection}
    <div class="report-container">
    ${headerStrip}
    <section class="section">
      <div class="section-header"><span class="section-header-title">Executive Summary</span></div>
      ${executiveSummarySection}
    </section>
    ${metricsSection}
    ${keyUpsideDriversSection ? `<section class="section section-break"><div class="section-header"><span class="section-header-title">Key Upside Drivers</span></div>${keyUpsideDriversSection}</section>` : ""}
    ${primaryConstraintSection ? `<section class="section section-break"><div class="section-header"><span class="section-header-title">Primary Constraint / Review Disclosure</span></div>${primaryConstraintSection}</section>` : ""}
    ${acquisitionMemoSummarySection}
    ${operatingSection}
    ${unitMixSection}
    ${valueSensitivitySection}
    ${capRateValueSection}
    ${readinessSection}
    ${acquisitionRequestContextSection}
    ${operatingSupportSection}
    ${rentValueSupportSection}
    ${debtFinancingContextSection}
    ${operatingStatementSection}
    ${dataCoverageSection}
    ${treatmentSection}
    ${methodologySection}
    ${footerSection}
  </div>
</body>
</html>`;
  } catch (err) {
    console.warn("[investoriq] acquisition memo v2 render fallback", {
      message: err?.message || String(err || ""),
    });
    return buildMinimalAcquisitionMemoV2Html({
      acquisitionMemoProjection,
      renderedAcquisitionMemo,
      sourcePackage,
      coreMetrics,
      reportMeta,
      propertyProfile,
    });
  }
}

export function buildAcquisitionMemoV2DocumentTreatmentSummaryHtml({
  renderedAcquisitionMemo = null,
  sourcePackage = null,
  bossContract = null,
  customerSurfaceModel = null,
} = {}) {
  return renderDocumentTreatmentSection(renderedAcquisitionMemo, sourcePackage, bossContract, customerSurfaceModel);
}

export function buildAcquisitionMemoV2PreliminaryFinancingReadinessSummaryHtml({
  renderedAcquisitionMemo = null,
  acquisitionMemoProjection = null,
  acquisitionMemoV2Projection = null,
  customerSurfaceModel = null,
} = {}) {
  return renderReadinessSection({
    renderedAcquisitionMemo,
    acquisitionMemoProjection: acquisitionMemoV2Projection || acquisitionMemoProjection,
    customerSurfaceModel,
  });
}

export function buildAcquisitionMemoV2AcquisitionFinancingAssumptionsHtml({
  acquisitionMemoProjection = null,
  acquisitionMemoV2Projection = null,
  sourcePackage = null,
  acquisitionTermsPayload = null,
  loanTermSheetTermsPayload = null,
  coreMetrics = null,
  bossContract = null,
  customerSurfaceModel = null,
} = {}) {
  return renderAcquisitionRequestContextSection({
    acquisitionMemoProjection: acquisitionMemoV2Projection || acquisitionMemoProjection,
    sourcePackage,
    acquisitionTermsPayload,
    loanTermSheetTermsPayload,
    coreMetrics,
    bossContract,
    customerSurfaceModel,
  });
}

export function buildAcquisitionMemoV2AcquisitionFinancingReadinessHtml({
  acquisitionMemoProjection = null,
  acquisitionMemoV2Projection = null,
  sourcePackage = null,
  loanTermSheetTermsPayload = null,
  mortgagePayload = null,
  bossContract = null,
  customerSurfaceModel = null,
} = {}) {
  return renderDebtFinancingContextSection({
    acquisitionMemoProjection: acquisitionMemoV2Projection || acquisitionMemoProjection,
    sourcePackage,
    loanTermSheetTermsPayload,
    mortgagePayload,
    bossContract,
    customerSurfaceModel,
  });
}
