import { INVESTORIQ_PUBLICATION_BASE_CSS } from "./investoriq-publication-base-css.js";
import { publicationDate, publicationMoney } from "./publication-format.js";
import { toCapRatio, toRateRatio } from "./report-number-helpers.js";
import { buildDocumentTreatmentSummaryHtml } from "./document-treatment-authority.js";
import { formatInterestRatePercent } from "./report-formatting-helpers.js";
import { ACQUISITION_FINANCING_DISPLAY_LABELS } from "./acquisition-financing-display-contract.js";
import { UNDERWRITING_REPORT_IDENTITY } from "./report-identity-authority.js";
import { buildFullUnderwritingChapter1EliteContract } from "./full-underwriting-chapter1-elite-contract.js";
import { renderFullUnderwritingChapter1EliteHtml, executiveDecisionState } from "./full-underwriting-chapter1-elite-renderer.js";
import { buildFullUnderwritingOperatingIntelligenceContract } from "./full-underwriting-operating-intelligence-contract.js";
import { renderFullUnderwritingOperatingIntelligenceHtml } from "./full-underwriting-operating-intelligence-renderer.js";
import { buildFullUnderwritingScenarioEngineV1 } from "./full-underwriting-scenario-engine-v1.js";
import { renderFullUnderwritingScenarioEngineV1Html } from "./full-underwriting-scenario-renderer.js";
import { buildFullUnderwritingDriverAnalysisV1 } from "./full-underwriting-driver-analysis-v1.js";
import { renderFullUnderwritingDriverAnalysisV1Html } from "./full-underwriting-driver-analysis-renderer.js";
import { buildFullUnderwritingTransactionDiligenceV1 } from "./full-underwriting-transaction-diligence-v1.js";
import { renderFullUnderwritingTransactionDiligenceV1Html } from "./full-underwriting-transaction-diligence-renderer.js";
import { buildFullUnderwritingDebtIntelligenceV1 } from "./full-underwriting-debt-intelligence-v1.js";
import { renderFullUnderwritingDebtIntelligenceV1Html } from "./full-underwriting-debt-intelligence-renderer.js";

import { buildFullUnderwritingValuationReconciliationV1 } from "./full-underwriting-valuation-reconciliation-v1.js";
import { renderFullUnderwritingValuationReconciliation } from "./full-underwriting-valuation-reconciliation-renderer.js";
import { buildFullUnderwritingQualityManifestV1 } from "./full-underwriting-quality-manifest-v1.js";
import { renderFullUnderwritingQualityManifestV1Html } from "./full-underwriting-quality-manifest-renderer.js";
import {
  INVESTORIQ_UNDERWRITING_OPENING_CSS,
  renderPublicationCover,
} from "./investoriq-publication-design-system.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&(?:mdash|ndash);|&#(?:8211|8212);|&#x(?:2013|2014);/gi, " - ")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeFullUnderwritingCustomerText(value) {
  return String(value ?? "")
    .replace(/(\d)\s*(?:&ndash;|&#8211;|&#x2013;|\u2013)\s*(\d)/gi, "$1-$2")
    .replace(/\s*(?:&mdash;|&#8212;|&#x2014;|\u2014)\s*/gi, "; ")
    .replace(/\s*(?:&ndash;|&#8211;|&#x2013;|\u2013)\s*/gi, "; ")
    .replace(/\bgoverned\b/gi, "defined")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/;\s*;/g, ";")
    .replace(/\s{2,}/g, " ");
}

function sanitizeFullUnderwritingCustomerHtml(html) {
  const sanitizeMarkupText = (markup) => String(markup || "")
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith("<") ? part : sanitizeFullUnderwritingCustomerText(part)))
    .join("");
  return String(html || "")
    .split(/(<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>)/gi)
    .map((part) => (/^<(?:style|script)\b/i.test(part) ? part : sanitizeMarkupText(part)))
    .join("");
}

function softWrapFilename(value) {
  return escapeHtml(value)
    .replace(/_/g, "_<wbr>")
    .replace(/\//g, "/<wbr>");
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

function getSourceReconciliationForSurface(customerSurfaceModel = null, bossContract = null, acquisitionMemoProjection = null) {
  return customerSurfaceModel?.sourceTruth?.sourceReconciliation ||
    bossContract?.sourceTruth?.sourceReconciliation ||
    acquisitionMemoProjection?.sourceReconciliation ||
    null;
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

function formatMoney(value, decimals = 0) {
  if (value === null || value === undefined || value === "") return "";
  return publicationMoney(value, decimals);
}

function formatPercentDisplay(value, digits = 1) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(digits)}%`;
}

function formatReconciliationVariance(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

function formatAssetIdentityForSurface({ customerSurfaceModel = null, sourcePackage = null, coreMetrics = null, propertyProfile = null } = {}) {
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
      propertyProfile?.assetClass ||
      propertyProfile?.asset_class ||
      coreMetrics?.assetClass ||
      ""
  ).trim();
  if (Number.isFinite(unitCount) && unitCount > 0 && assetClass) return `${Math.round(unitCount)} Unit ${assetClass}`;
  if (assetClass) return assetClass;
  if (Number.isFinite(unitCount) && unitCount > 0) return `${Math.round(unitCount)} Unit`;
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

export function buildAcquisitionMemoSummaryCard({
  units = null,
  occupancy = null,
  annualInPlace = null,
  annualMarket = null,
  annualUpsideRatio = null,
  purchasePrice = null,
  goingInCapRate = null,
  noi = null,
  formatCurrency,
  formatPercent1,
} = {}) {
  const rows = [];
  if (Number.isFinite(units) && units > 0) rows.push(`<tr><td>Units</td><td>${Math.round(units)}</td></tr>`);
  if (Number.isFinite(occupancy)) rows.push(`<tr><td>Occupancy</td><td>${formatPercent1(occupancy)}</td></tr>`);
  if (Number.isFinite(annualInPlace)) rows.push(`<tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr>`);
  if (Number.isFinite(annualMarket)) rows.push(`<tr><td>Annual Market Rent</td><td>${formatCurrency(annualMarket)}</td></tr>`);
  if (Number.isFinite(annualUpsideRatio)) rows.push(`<tr><td>Annual Rent Upside</td><td>${formatPercent1(annualUpsideRatio)}</td></tr>`);
  if (Number.isFinite(purchasePrice)) rows.push(`<tr><td>Purchase Price</td><td>${formatCurrency(purchasePrice)}</td></tr>`);
  if (Number.isFinite(goingInCapRate)) rows.push(`<tr><td>Going-In Cap Rate</td><td>${formatPercent1(goingInCapRate)}</td></tr>`);
  if (Number.isFinite(noi)) rows.push(`<tr><td>NOI Basis</td><td>${formatCurrency(noi)}</td></tr>`);
  if (!rows.length) return "";
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Underwriting Summary</p><table><tbody>${rows.join("")}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Source-bound underwriting summary using verified operating metrics and transaction context. Additional modeling remains deferred unless explicitly supported by the report family and verified source basis.</p></div>`;
}

export function buildOperatingSnapshotCard({
  units = null,
  occupancy = null,
  annualInPlace = null,
  egi = null,
  operatingExpenses = null,
  noi = null,
  expenseRatio = null,
  noiMargin = null,
  breakEvenOccupancy = null,
  formatCurrency,
  formatPercent1,
} = {}) {
  const rows = [];
  if (Number.isFinite(units) && units > 0) rows.push(`<tr><td>Units</td><td>${Math.round(units)}</td></tr>`);
  if (Number.isFinite(occupancy)) rows.push(`<tr><td>Occupancy</td><td>${formatPercent1(occupancy)}</td></tr>`);
  if (Number.isFinite(annualInPlace)) rows.push(`<tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr>`);
  if (Number.isFinite(egi)) rows.push(`<tr><td>Effective Gross Income</td><td>${formatCurrency(egi)}</td></tr>`);
  if (Number.isFinite(operatingExpenses)) rows.push(`<tr><td>Operating Expenses</td><td>${formatCurrency(operatingExpenses)}</td></tr>`);
  if (Number.isFinite(noi)) rows.push(`<tr><td>NOI</td><td>${formatCurrency(noi)}</td></tr>`);
  if (Number.isFinite(expenseRatio)) rows.push(`<tr><td>Expense Ratio</td><td>${formatPercent1(expenseRatio)}</td></tr>`);
  if (Number.isFinite(noiMargin)) rows.push(`<tr><td>NOI Margin</td><td>${formatPercent1(noiMargin)}</td></tr>`);
  if (Number.isFinite(breakEvenOccupancy)) rows.push(`<tr><td>Break-Even Occupancy</td><td>${formatPercent1(breakEvenOccupancy)}</td></tr>`);
  if (!rows.length) return "";
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Operating Snapshot</p><table><tbody>${rows.join("")}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Snapshot is built from verified operating inputs only. No forward projection assumptions are introduced.</p></div>`;
}

export function buildRentUpsideValueSensitivityCard({
  annualInPlace = null,
  annualMarket = null,
  formatCurrency,
} = {}) {
  if (!Number.isFinite(annualInPlace) || annualInPlace <= 0 || !Number.isFinite(annualMarket) || annualMarket <= annualInPlace) return "";
  const annualGap = annualMarket - annualInPlace;
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Documented Rent Position</p><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr><tr><td>Annual Market Rent</td><td>${formatCurrency(annualMarket)}</td></tr><tr style="background:#FEFCE8;font-weight:700;"><td style="color:#B8860B;">Annual Gross Rent Difference</td><td style="color:#B8860B;">${formatCurrency(annualGap)}</td></tr></tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">The gross rent difference is not capitalized or treated as NOI without an authorized NOI conversion basis.</p></div>`;
}

export function buildLaunchSourceContextBlock({
  reportMode = null,
  documentSources = [],
  currentDebtAssessmentState = null,
  canonicalAcquisitionState = null,
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  hasForwardLookingRenovationInputs = false,
  renovationDisplayMode = null,
  renovationPayload = null,
  propertyTaxPayload = null,
  propertyTaxBindingState = null,
  documentQuantitativeUsageMap = null,
  supportDocAuthorityRows = null,
  canonicalSupportDocMap = null,
  renderedDocumentTreatmentRowsOut = null,
} = {}) {
  const intro = `<p class="small" style="margin:0 0 10px 0;color:#374151;line-height:1.6;">Modeled core inputs are limited to T12 and Rent Roll. Corroborating support includes validated property tax support when annual tax evidence aligns with the T12 tax line. Market survey, broker email, appraisal summary, Phase I ESA / environmental, zoning / compliance, and CapEx / renovation notes remain context-only unless explicitly validated for quantitative use. Acquisition context is limited to verified purchase assumptions and document-derived cap-rate reference where supported.</p>`;
  const treatment = buildDocumentTreatmentSummaryHtml({
    reportMode,
    documentSources,
    currentDebtAssessmentState,
    canonicalAcquisitionState,
    loanTermSheetTermsPayload,
    acquisitionTermsPayload,
    hasForwardLookingRenovationInputs,
    renovationDisplayMode,
    renovationPayload,
    propertyTaxPayload,
    propertyTaxBindingState,
    documentQuantitativeUsageMap,
    supportDocAuthorityRows,
    canonicalSupportDocMap,
    renderedDocumentTreatmentRowsOut,
  });
  const excludedDeferredHtml = `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Excluded / Deferred Analysis</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">Advanced financing and return-projection modules remain deferred unless explicitly supported by the report family and verified source basis.</p></div>`;
  return `${intro}<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${treatment}<!-- END DOCUMENT_TREATMENT_SUMMARY -->${excludedDeferredHtml}`;
}

export function buildCapRateValueTable(noi, units, documentDerivedCapRate = null, { formatCurrency, formatCapPercentExact } = {}) {
  if (!Number.isFinite(noi) || noi <= 0) return "";
  if (typeof formatCurrency !== "function" || typeof formatCapPercentExact !== "function") return "";
  const docCapRate = toCapRatio(documentDerivedCapRate);
  if (!Number.isFinite(docCapRate) || docCapRate <= 0 || docCapRate > 0.5) return "";
  const value = noi / docCapRate;
  const perUnit = Number.isFinite(units) && units > 0 ? value / units : null;
  const row = `<tr data-iq-cap-rate-row="accepted" data-iq-cap-rate="${docCapRate}"><td>${formatCapPercentExact(docCapRate)}</td><td>${formatCurrency(value)}</td><td>${perUnit !== null ? formatCurrency(perUnit) : "Not available"}</td></tr>`;
  return `<div class="card no-break"><p class="subsection-title">Cap Rate Value Indication</p><table><thead><tr><th>Accepted Cap Rate</th><th>Implied Value</th><th>Per Unit</th></tr></thead><tbody>${row}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Calculated from reported NOI of ${formatCurrency(noi)} and the accepted cap rate only. No additional scenario rates are introduced.</p></div>`;
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

function renderSection(title, bodyHtml, { id = "", pageBreakBefore = false, allowBreak = false } = {}) {
  const attrs = [
    `class="section${pageBreakBefore ? " section-break" : ""}"`,
    id ? `aria-labelledby="${escapeHtml(id)}"` : "",
  ].filter(Boolean).join(" ");
  return `<section ${attrs}><div class="section-header"><span${id ? ` id="${escapeHtml(id)}"` : ""} class="section-header-title">${escapeHtml(title)}</span></div><div class="card ${allowBreak ? "allow-break" : "no-break"}">${bodyHtml}</div></section>`;
}

function distinctSurfaceLabels(...values) {
  const seen = new Set();
  return values.map((value) => String(value || "").trim()).filter((value) => {
    if (!value) return false;
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderSectionCollapseHtml() {
  return `<p class="body-copy">This section was omitted because the uploaded support context did not provide display-ready detail. Core report outputs remain based on the uploaded T12 and Rent Roll.</p>`;
}

function renderSafely(sectionName, rendererFn, { pageBreakBefore = true, fallbackHtml = "", bossSection = null, omitWhenCollapsed = false } = {}) {
  if (bossSection?.status === "collapsed") {
    if (omitWhenCollapsed) return "";
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
  const propertyName = propertyProfile?.propertyName || propertyProfile?.property_name || reportMeta?.propertyName || reportMeta?.property_name || sourcePackage?.propertyName || UNDERWRITING_REPORT_IDENTITY.canonicalTitle;
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
    Number.isFinite(goingInCapRate) ? `<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercentDisplay(goingInCapRate, 2)}</td></tr>` : "",
  ].filter(Boolean).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(`${UNDERWRITING_REPORT_IDENTITY.fullTitle} - ${propertyName}`)}</title>
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
        <div class="body-copy">${escapeHtml(UNDERWRITING_REPORT_IDENTITY.canonicalTitle.toUpperCase())}</div>
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
        <p class="body-copy">Document-backed underwriting outputs are built from verified source documents, deterministic operating calculations, and explicit source treatment.</p>
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
      row.beds ??
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
        unit.beds ??
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

const PROPERTY_TAX_LINE_LABELS = new Set([
  "property taxes",
  "property tax",
  "real estate taxes",
  "real estate tax",
]);

function normalizePropertyTaxLineLabel(value) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAcceptedPropertyTaxEvidence(value) {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return String(value).trim().length > 0;
}

function resolvePropertyTaxAnalysisFacts(customerSurfaceModel = null) {
  const operatingSection = customerSurfaceModel?.sections?.operatingStatementTTMSummary;
  if (!operatingSection || operatingSection.status === "collapsed" || operatingSection.factAvailability?.sourceBacked !== true) return null;

  const expenseLines = operatingSection.facts?.expense_lines;
  if (!Array.isArray(expenseLines)) return null;
  const qualifyingLines = expenseLines.filter((line) => PROPERTY_TAX_LINE_LABELS.has(normalizePropertyTaxLineLabel(line?.label)));
  if (qualifyingLines.length !== 1) return null;
  const reportedT12Expense = toFiniteNumber(qualifyingLines[0]?.amount);
  if (!Number.isFinite(reportedT12Expense)) return null;

  const propertyTaxSupport = customerSurfaceModel?.supportSourcesByRole?.property_tax_support;
  if (!propertyTaxSupport || propertyTaxSupport.authorityBasis !== "canonical_source_truth_package") return null;
  const uploadedAnnualTax = toFiniteNumber(propertyTaxSupport.extractedFacts?.annual_tax);
  if (!Number.isFinite(uploadedAnnualTax) || uploadedAnnualTax <= 0) return null;
  if (!hasAcceptedPropertyTaxEvidence(propertyTaxSupport.sourceEvidence?.annual_tax)) return null;

  const variance = uploadedAnnualTax - reportedT12Expense;
  return {
    reportedT12Expense,
    uploadedAnnualTax,
    variance: Object.is(variance, -0) ? 0 : variance,
  };
}

function renderPropertyTaxAnalysisSection(customerSurfaceModel = null) {
  const facts = resolvePropertyTaxAnalysisFacts(customerSurfaceModel);
  if (!facts) return "";
  return `<div class="subsection-block" data-iq-subsection="property-tax-analysis">
    <p class="subsection-title">Property Tax Analysis</p>
    <table class="detail-table"><tbody>
      <tr><td>Reported T12 Property-Tax Expense</td><td style="font-weight:600;">${formatMoney(facts.reportedT12Expense)}</td></tr>
      <tr><td>Uploaded Property-Tax Support</td><td style="font-weight:600;">${formatMoney(facts.uploadedAnnualTax)}</td></tr>
      <tr><td>Variance: Uploaded Support less Reported T12</td><td style="font-weight:600;">${formatMoney(facts.variance)}</td></tr>
    </tbody></table>
  </div>`;
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

function renderBrandCoverSection({ decisionClassification = null, propertyName, propertyAddress, propertyTitle, reportMeta, sourcePackage, coreMetrics, propertyProfile = null, customerSurfaceModel = null }) {
  const modelIdentity = customerSurfaceModel?.identity || {};
  const supportDocCount = Number.isFinite(Number(customerSurfaceModel?.supportSourceCounts?.uniqueUploadedFileCount))
    ? Number(customerSurfaceModel.supportSourceCounts.uniqueUploadedFileCount)
    : getSupportDocs(sourcePackage).length;
  const assetIdentity = formatAssetIdentityForSurface({ customerSurfaceModel, sourcePackage, coreMetrics, propertyProfile });
  const assetClass = String(modelIdentity?.assetClass || "").trim();
  const generatedLabel = formatDisplayDate(reportMeta?.generatedAt || reportMeta?.generated_at || "");
  const coverUnits = Number.isFinite(Number(customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units))
    ? Math.round(Number(customerSurfaceModel.sourceBackedFacts.unitMix.total_units))
    : Number.isFinite(Number(coreMetrics?.units))
    ? Math.round(Number(coreMetrics.units))
    : Number.isFinite(Number(sourcePackage?.coreRentRoll?.extractedFacts?.total_units))
    ? Math.round(Number(sourcePackage.coreRentRoll.extractedFacts.total_units))
    : "";
  const propertyProfileLabel = assetClass ? "Asset Class" : coverUnits ? "Property Scale" : "Property Profile";
  const propertyProfileValue = assetClass || (coverUnits ? `${coverUnits} Units` : assetIdentity || "Not stated");
  const uploadedFileCount = supportDocCount + (sourcePackage?.coreT12 ? 1 : 0) + (sourcePackage?.coreRentRoll ? 1 : 0);
  const normalizedPropertyName = String(propertyName || "").trim().toLowerCase();
  const coverLocation = distinctSurfaceLabels(propertyAddress, propertyTitle)
    .filter((value) => value.toLowerCase() !== normalizedPropertyName)
    .join(" | ");
  const visibleClassification = decisionClassification || customerSurfaceModel?.identity?.visibleClassification || "Acquisition Underwriting Review";
  return renderPublicationCover({
    propertyName,
    fallbackTitle: UNDERWRITING_REPORT_IDENTITY.canonicalTitle,
    location: coverLocation,
    reportTitle: UNDERWRITING_REPORT_IDENTITY.canonicalTitle,
    classification: visibleClassification,
    profileLabel: propertyProfileLabel,
    profileValue: propertyProfileValue,
    evidenceBasis: `${(sourcePackage?.coreT12 ? 1 : 0) + (sourcePackage?.coreRentRoll ? 1 : 0)} core sources + ${supportDocCount} supporting`,
    preparedLabel: publicationDate(reportMeta?.generatedAt || reportMeta?.generated_at),
    footerRight: "Document-Backed Property Underwriting",
  });
}

function renderExecutiveSummarySection({ sourcePackage = null, acquisitionMemoProjection = null, coreMetrics = null, customerSurfaceModel = null } = {}) {
  const assetIdentity = formatAssetIdentityForSurface({ customerSurfaceModel, sourcePackage, coreMetrics });
  const rows = [
    `<tr><td>Property Profile</td><td style="font-weight:600;">${escapeHtml(assetIdentity)}</td></tr>`,
    `<tr><td>Operating Statement Evidence</td><td style="font-weight:600;">${sourcePackage?.coreT12 ? "Accepted for analysis" : "Not provided"}</td></tr>`,
    `<tr><td>Rent Roll Evidence</td><td style="font-weight:600;">${sourcePackage?.coreRentRoll ? "Accepted for analysis" : "Not provided"}</td></tr>`,
    `<tr><td>Current debt context</td><td style="font-weight:600;">${escapeHtml(supportFactBundleStatus(customerSurfaceModel, "currentDebtContext", acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext === true))}</td></tr>`,
  ];
  const occupancy = Number.isFinite(Number(coreMetrics?.occupancy)) ? formatPercentDisplay(coreMetrics.occupancy) : "Not available";
  const noi = Number.isFinite(Number(coreMetrics?.noi)) ? formatMoney(coreMetrics.noi) : "Not available";
  const annualUpside = Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))
    ? formatMoney(Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent))
    : "Not available";
  return `<div class="card no-break">
    <p class="subsection-title">Executive Summary</p>
    <p class="body-copy">Document-supported acquisition overview, operating profile, and primary review considerations.</p>
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
  if (Number.isFinite(Number(coreMetrics?.occupancy))) drivers.push(`Occupancy of ${formatPercentDisplay(coreMetrics.occupancy)} is stated from the accepted Rent Roll.`);
  if (Number.isFinite(Number(coreMetrics?.annualMarketRent)) && Number.isFinite(Number(coreMetrics?.annualInPlaceRent))) {
    drivers.push(`Annual gross rent difference of ${formatMoney(Number(coreMetrics.annualMarketRent) - Number(coreMetrics.annualInPlaceRent))} is documented; no NOI or value conversion is assumed.`);
  }
  if (Number.isFinite(Number(coreMetrics?.noi))) drivers.push(`NOI of ${formatMoney(coreMetrics.noi)} drives cap-rate value indication.`);
  if (Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext)) drivers.push(`Current debt context is uploaded and retained as contextual support.`);
  if (Boolean(acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions)) drivers.push(`Purchase assumptions are separated from existing debt and treated as acquisition context.`);
  if (drivers.length === 0) return "";
  return `<div class="card no-break"><p class="subsection-title">Underwriting Observations</p><ul style="margin:0;padding-left:18px;">${drivers.map((driver) => `<li style="margin-bottom:4px;">${escapeHtml(driver)}</li>`).join("")}</ul><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Quantitative observations are limited to the accepted T12, Rent Roll, and applicable support documents.</p></div>`;
}

function renderPrimaryConstraintSection({ acquisitionMemoProjection = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const reconciliation = getSourceReconciliationForSurface(customerSurfaceModel, bossContract, acquisitionMemoProjection);
  const state = reconciliation?.state || null;
  if (!["source_reconciliation_required", "parser_suspected"].includes(String(state?.status || "").trim())) return "";
  if (reconciliation?.sourceBacked !== true) return "";
  const rows = [
    `<tr><td>T12 Gross Potential Rent</td><td style="font-weight:600;">${formatMoney(state.t12_gpr)}</td></tr>`,
    `<tr><td>Rent Roll Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(state.rr_annual_in_place)}</td></tr>`,
    `<tr><td>Rent Roll less T12</td><td style="font-weight:600;">${formatMoney(state.difference_amount)}</td></tr>`,
    `<tr><td>Variance</td><td style="font-weight:600;">${formatReconciliationVariance(state.variance_pct)}</td></tr>`,
  ];
  return `<div class="card no-break"><p class="subsection-title">Primary Constraint / Source Reconciliation</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table><p class="body-copy">${escapeHtml(state.source_reconciliation_disclosure)}</p></div>`;
}

function renderEvidenceBarChart({ chartKey, title, series = [], sourcePaths = [], valueFormatter = formatMoney, supplementalHtml = "" } = {}) {
  const acceptedSeries = series
    .map((item) => ({
      label: String(item?.label || "").trim(),
      value: Number(item?.value),
      sourcePath: String(item?.sourcePath || "").trim(),
    }))
    .filter((item) => item.label && Number.isFinite(item.value) && item.value >= 0 && item.sourcePath);
  if (!chartKey || !title || acceptedSeries.length === 0) return "";
  const maxValue = Math.max(...acceptedSeries.map((item) => Math.abs(item.value)));
  if (!Number.isFinite(maxValue) || maxValue <= 0) return "";
  const receiptPaths = [...new Set([...sourcePaths, ...acceptedSeries.map((item) => item.sourcePath)].filter(Boolean))];
  const rows = acceptedSeries.map((item, index) => {
    const geometryPercent = Math.max(0, Math.min(100, (Math.abs(item.value) / maxValue) * 100));
    return `<div class="evidence-chart-row" data-iq-value="${item.value}" data-iq-source-path="${escapeHtml(item.sourcePath)}">
      <div class="evidence-chart-label">${escapeHtml(item.label)}</div>
      <div class="evidence-chart-track"><div class="evidence-chart-bar evidence-chart-bar-${(index % 3) + 1}" style="width:${geometryPercent.toFixed(4)}%;"></div></div>
      <div class="evidence-chart-value">${escapeHtml(valueFormatter(item.value))}</div>
    </div>`;
  }).join("");
  return `<div class="evidence-chart no-break" data-iq-chart="${escapeHtml(chartKey)}" data-iq-chart-receipt="${escapeHtml(chartKey)}" data-iq-source-paths="${escapeHtml(receiptPaths.join("|"))}">
    <p class="subsection-title">${escapeHtml(title)}</p>
    <div class="evidence-chart-plot">${rows}</div>
    ${supplementalHtml}
  </div>`;
}

function renderInstitutionalOperatingVisuals({ coreMetrics = null, sourcePackage = null, customerSurfaceModel = null } = {}) {
  const charts = [];
  const egi = Number(coreMetrics?.egi);
  const opEx = Number(coreMetrics?.opEx);
  const noi = Number(coreMetrics?.noi);
  const incomeChart = renderEvidenceBarChart({
    chartKey: "operating-income-composition",
    title: "Operating Income Composition",
    series: [
      { label: "Effective Gross Income", value: egi, sourcePath: "core.t12.accepted_facts.effective_gross_income" },
      { label: "Operating Expenses", value: opEx, sourcePath: "core.t12.accepted_facts.total_operating_expenses" },
      { label: "Net Operating Income", value: noi, sourcePath: "core.t12.accepted_facts.net_operating_income" },
    ],
  });
  if (incomeChart) charts.push(incomeChart);

  const annualInPlace = Number(coreMetrics?.annualInPlaceRent);
  const annualMarket = Number(coreMetrics?.annualMarketRent);
  const rentChart = renderEvidenceBarChart({
    chartKey: "annual-rent-position",
    title: "Annual Rent Position",
    series: [
      { label: "Annual In-Place Rent", value: annualInPlace, sourcePath: "core.rent_roll.accepted_facts.annual_in_place_rent" },
      { label: "Annual Market Rent", value: annualMarket, sourcePath: "core.rent_roll.accepted_facts.annual_market_rent" },
    ],
  });
  if (rentChart) charts.push(rentChart);

  const rentRollFacts = customerSurfaceModel?.sourceBackedFacts?.unitMix || sourcePackage?.coreRentRoll?.extractedFacts || {};
  const unitMixRows = (Array.isArray(rentRollFacts?.unit_mix) ? rentRollFacts.unit_mix : [])
    .map(normalizeStructuredUnitMixRow)
    .filter(Boolean);
  const unitSeries = unitMixRows.flatMap((row, index) => [
    Number.isFinite(row.inPlace) ? { label: `${row.label} In-Place`, value: row.inPlace, sourcePath: `core.rent_roll.accepted_facts.unit_mix.${index}.current_rent` } : null,
    Number.isFinite(row.market) ? { label: `${row.label} Market`, value: row.market, sourcePath: `core.rent_roll.accepted_facts.unit_mix.${index}.market_rent` } : null,
  ].filter(Boolean));
  const unitChart = renderEvidenceBarChart({
    chartKey: "unit-rent-position",
    title: "Unit Rent Position",
    series: unitSeries,
    valueFormatter: (value) => formatMoney(value, 2),
  });
  if (unitChart) charts.push(unitChart);
  if (charts.length === 0) return "";
  return `<section class="section institutional-visual-section"><div class="section-header"><span class="section-header-title">Operating Evidence Visuals</span></div><div class="institutional-visual-grid">${charts.join("")}</div></section>`;
}

function renderInstitutionalDebtVisuals(customerSurfaceModel = null) {
  const section = customerSurfaceModel?.sections?.debtServiceCoverage || null;
  if (section?.status !== "required" || section?.factAvailability?.sourceBacked !== true) return "";
  const current = section?.facts?.currentDebt || null;
  const proposed = section?.facts?.proposedFinancing || null;
  const supplemental = [
    Number.isFinite(Number(current?.dscr)) ? `<div class="evidence-chart-stat" data-iq-value="${Number(current.dscr)}" data-iq-source-path="customerSections.debtServiceCoverage.facts.currentDebt.dscr"><span>Current Debt DSCR</span><strong>${Number(current.dscr).toFixed(2)}x</strong></div>` : "",
    Number.isFinite(Number(proposed?.dscr)) ? `<div class="evidence-chart-stat" data-iq-value="${Number(proposed.dscr)}" data-iq-source-path="customerSections.debtServiceCoverage.facts.proposedFinancing.dscr"><span>Proposed Financing DSCR</span><strong>${Number(proposed.dscr).toFixed(2)}x</strong></div>` : "",
  ].filter(Boolean).join("");
  const chart = renderEvidenceBarChart({
    chartKey: "debt-service-and-coverage",
    title: "Annual Debt Service & Coverage",
    series: [
      { label: "Current Debt Service", value: current?.annualDebtService, sourcePath: "customerSections.debtServiceCoverage.facts.currentDebt.annualDebtService" },
      { label: "Proposed Debt Service", value: proposed?.annualDebtService, sourcePath: "customerSections.debtServiceCoverage.facts.proposedFinancing.annualDebtService" },
    ],
    sourcePaths: [
      "customerSections.debtServiceCoverage.facts.currentDebt",
      "customerSections.debtServiceCoverage.facts.proposedFinancing",
    ],
    supplementalHtml: supplemental ? `<div class="evidence-chart-stats">${supplemental}</div>` : "",
  });
  if (!chart) return "";
  return `<section class="section institutional-visual-section"><div class="section-header"><span class="section-header-title">Debt Service &amp; Coverage Visual</span></div>${chart}</section>`;
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

function renderReadinessBodyHtml({ renderedAcquisitionMemo = null, acquisitionMemoProjection = null, customerSurfaceModel = null } = {}) {
  if (customerSurfaceModel) {
    return `<p class="body-copy">Document coverage reflects the files and usable facts provided for this review. Source presence does not by itself establish diligence sufficiency.</p>`;
  }
  const signals = acquisitionMemoProjection?.financingReadinessSignals || {};
  const summaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.financingReadinessSummaryHtml || "").trim();
  return summaryHtml
    ? `<div class="readiness-summary">${summaryHtml}</div>`
    : `<p class="body-copy">Shown for lender discussion and acquisition diligence support only.</p>`;
}

function supportFactBundleStatus(customerSurfaceModel = null, sectionKey = "", fallbackSourcePresent = false) {
  const section = customerSurfaceModel?.sections?.[sectionKey] || null;
  const availability = section?.factAvailability || null;
  const required = Array.isArray(availability?.required) ? availability.required : [];
  const missing = Array.isArray(availability?.missing) ? availability.missing : [];
  if (availability?.sourceBacked === true && missing.length === 0) {
    return required.length > 0 ? "Source facts available" : "Source received as context";
  }
  if (availability?.sourcePresent === true || section?.sourceDoc) {
    return required.length > 0
      ? "Source received; dependent analysis limited"
      : "Source received as context";
  }
  if (!section && fallbackSourcePresent === true) {
    return "Source received; detail limited";
  }
  return "Not provided";
}

function renderReadinessSection({ renderedAcquisitionMemo = null, acquisitionMemoProjection = null, customerSurfaceModel = null } = {}) {
  const items = [
    ["Current debt context", supportFactBundleStatus(customerSurfaceModel, "currentDebtContext", acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext === true)],
    ["Purchase assumptions", supportFactBundleStatus(customerSurfaceModel, "acquisitionRequestContext", acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions === true)],
    ["Structured renovation / CapEx plan", supportFactBundleStatus(customerSurfaceModel, "renovationContext", acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation === true)],
    ["Appraisal context", supportFactBundleStatus(customerSurfaceModel, "appraisalContext", acquisitionMemoProjection?.financingReadinessSignals?.hasAppraisalContext === true)],
    ["Market survey context", supportFactBundleStatus(customerSurfaceModel, "marketSurveyContext", acquisitionMemoProjection?.financingReadinessSignals?.hasMarketSurveyContext === true)],
    ["Environmental / Phase I ESA context", supportFactBundleStatus(customerSurfaceModel, "environmentalContext", acquisitionMemoProjection?.financingReadinessSignals?.hasEnvironmentalContext === true)],
  ];
  const pairedRows = [];
  for (let index = 0; index < items.length; index += 2) {
    const left = items[index];
    const right = items[index + 1] || ["", ""];
    pairedRows.push(`<tr><td>${escapeHtml(left[0])}</td><td>${escapeHtml(left[1])}</td><td>${escapeHtml(right[0])}</td><td>${escapeHtml(right[1])}</td></tr>`);
  }
  return renderSection(
    "Preliminary Financing Readiness Summary",
    `${renderReadinessBodyHtml({ renderedAcquisitionMemo, acquisitionMemoProjection, customerSurfaceModel })}<div class="subsection-block"><p class="subsection-title">Lender Diligence Checklist</p><table class="detail-table readiness-pair-table"><tbody>${pairedRows.join("")}</tbody></table></div>`,
    { id: "prelim-readiness-title", pageBreakBefore: true, allowBreak: true }
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
  const proposedModelSection = getCustomerSurfaceSection(customerSurfaceModel, "proposedFinancingContext");
  const sectionContract = modelSection || getBossSectionContract(bossContract, "acquisitionRequestContext");
  const proposedSectionContract = proposedModelSection || getBossSectionContract(bossContract, "proposedFinancingContext");
  const canonicalMode = bossContract?.coreGate?.sourceTruthPackageValid === true;
  const acquisitionSourceBacked = modelSection?.factAvailability?.sourceBacked === true;
  const proposedFinancingSourceBacked = proposedModelSection?.factAvailability?.sourceBacked === true;
  if (canonicalMode && !acquisitionSourceBacked && !proposedFinancingSourceBacked) {
    return renderSection("Acquisition Request Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  if (modelSection?.status === "collapsed" && proposedModelSection?.status === "collapsed") {
    return renderSection("Acquisition Request Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  if (
    sectionHasSourceBackedFacts(sectionContract) &&
    sectionHasMissingRequiredFacts(sectionContract) &&
    !(sectionHasSourceBackedFacts(proposedSectionContract) && !sectionHasMissingRequiredFacts(proposedSectionContract))
  ) {
    return renderSection("Acquisition Request Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  const purchaseAssumptionsDoc = modelSection?.sourceDoc || getBossSupportDocByRole(bossContract, sourcePackage, "purchase_assumptions");
  const acquisitionFacts = {
    ...(acquisitionSourceBacked && modelSection?.facts ? modelSection.facts : {}),
    ...(proposedFinancingSourceBacked && proposedModelSection?.facts ? proposedModelSection.facts : {}),
  };
  const purchasePrice = toFiniteNumber(canonicalMode ? acquisitionFacts?.purchase_price : acquisitionFacts?.purchase_price ?? coreMetrics?.purchasePrice ?? acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.purchase_price ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.purchase_price ?? purchaseAssumptionsDoc?.extractedFacts?.purchase_price ?? acquisitionTermsPayload?.purchase_price ?? acquisitionTermsPayload?.purchasePrice ?? NaN);
  const noiBasis = toFiniteNumber(canonicalMode ? acquisitionFacts?.noi_basis : acquisitionFacts?.noi_basis ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.noi_basis ?? coreMetrics?.noi ?? purchaseAssumptionsDoc?.extractedFacts?.noi_basis ?? acquisitionTermsPayload?.noi_basis ?? acquisitionTermsPayload?.noi ?? NaN);
  const goingInCapRate = resolveValidGoingInCapRate({ coreMetrics, acquisitionMemoProjection, sourcePackage, bossContract });
  const proposedLoan = toFiniteNumber(canonicalMode ? acquisitionFacts?.proposed_loan_amount : acquisitionFacts?.proposed_loan_amount ?? acquisitionFacts?.loan_amount ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.proposed_loan_amount ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.loan_amount ?? acquisitionTermsPayload?.proposed_loan_amount ?? acquisitionTermsPayload?.loan_amount ?? acquisitionTermsPayload?.stated_acquisition_loan_amount ?? acquisitionTermsPayload?.proposed_acquisition_loan_amount ?? NaN);
  const ltv = normalizePercentFraction(canonicalMode ? acquisitionFacts?.ltv : acquisitionFacts?.ltv ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.ltv ?? acquisitionTermsPayload?.ltv ?? acquisitionTermsPayload?.loan_to_value ?? acquisitionTermsPayload?.loanToValue);
  const interestRate = normalizePercentFraction(canonicalMode ? acquisitionFacts?.interest_rate : acquisitionFacts?.interest_rate ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.interest_rate ?? acquisitionTermsPayload?.interest_rate ?? acquisitionTermsPayload?.interestRate ?? acquisitionTermsPayload?.rate);
  const amortization = toFiniteNumber(canonicalMode ? acquisitionFacts?.amortization_years : acquisitionFacts?.amortization_years ?? acquisitionFacts?.amortization_remaining_years ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.amortization_years ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.amortization_remaining_years ?? acquisitionTermsPayload?.amortization_years ?? acquisitionTermsPayload?.amortizationYears ?? NaN);
  const lenderFee = normalizePercentFraction(canonicalMode ? acquisitionFacts?.lender_fee_percent : acquisitionFacts?.lender_fee_percent ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.lender_fee_percent ?? acquisitionTermsPayload?.lender_fee_percent ?? acquisitionTermsPayload?.lenderFeePercent ?? acquisitionTermsPayload?.origination_fee_percent);
  const interestRateDisplay = Number.isFinite(interestRate) ? formatInterestRatePercent(interestRate) : null;
  const lenderFeeDisplay = Number.isFinite(lenderFee) ? formatInterestRatePercent(lenderFee) : null;
  const rows = [
    Number.isFinite(purchasePrice) ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.purchasePrice}</td><td style="font-weight:600;">${formatMoney(purchasePrice)}</td></tr>` : "",
    Number.isFinite(noiBasis) ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.noiBasis}</td><td style="font-weight:600;">${formatMoney(noiBasis)}</td></tr>` : "",
    Number.isFinite(goingInCapRate) ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.goingInCapRate}</td><td style="font-weight:600;">${formatPercentDisplay(goingInCapRate, 2)}</td></tr>` : "",
    Number.isFinite(proposedLoan) ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.proposedLoanAmount}</td><td style="font-weight:600;">${formatMoney(proposedLoan)}</td></tr>` : "",
    Number.isFinite(ltv) ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.ltv}</td><td style="font-weight:600;">${formatPercentDisplay(ltv)}</td></tr>` : "",
    interestRateDisplay ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.interestRate}</td><td style="font-weight:600;">${interestRateDisplay}</td></tr>` : "",
    Number.isFinite(amortization) ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.amortization}</td><td style="font-weight:600;">${Math.round(amortization)} years</td></tr>` : "",
    lenderFeeDisplay ? `<tr><td>${ACQUISITION_FINANCING_DISPLAY_LABELS.lenderFee}</td><td style="font-weight:600;">${lenderFeeDisplay}</td></tr>` : "",
  ].filter(Boolean).join("");
  if (!rows) return renderSection("Acquisition Request Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  const acceptedContextLabels = [
    acquisitionSourceBacked ? modelSection?.visibleLabel : null,
    proposedFinancingSourceBacked ? proposedModelSection?.visibleLabel : null,
  ].map((value) => String(value || "").trim()).filter((value, index, values) => value && values.indexOf(value) === index);
  const acceptedContextLabelsHtml = acceptedContextLabels
    .map((label) => `<p class="subsection-title">${escapeHtml(label)}</p>`)
    .join("");
  return renderSection(
    "Acquisition Request Context",
    `${acceptedContextLabelsHtml}<table class="detail-table"><tbody>${rows}</tbody></table>`,
    { pageBreakBefore: true, allowBreak: true }
  );
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
  if (!Number.isFinite(annualUpside) || annualUpside <= 0) return "";
  return renderSection(
    "Rent Position Support",
    `<p class="body-copy">The documented annual gross rent difference is presented without an NOI conversion or capitalized value inference.</p><table class="detail-table"><tbody><tr><td>Annual Gross Rent Difference</td><td style="font-weight:600;">${formatMoney(annualUpside)}</td></tr><tr><td>Rent Difference %</td><td style="font-weight:600;">${formatPercentDisplay(rentGapPct)}</td></tr></tbody></table>`,
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
  const canonicalMode = bossContract?.coreGate?.sourceTruthPackageValid === true;
  if (canonicalMode && (!modelSection || modelSection?.factAvailability?.sourceBacked !== true)) {
    return renderSection("Debt / Financing Context", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
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
  const currentDebtText = canonicalMode ? "" : getSourceEvidenceText(currentDebt);
  const outstandingBalance = Number.isFinite(toFiniteNumber(facts?.current_outstanding_balance))
    ? toFiniteNumber(facts.current_outstanding_balance)
    : Number.isFinite(toFiniteNumber(facts?.outstanding_balance))
    ? toFiniteNumber(facts.outstanding_balance)
    : !canonicalMode && Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.current_outstanding_balance))
    ? toFiniteNumber(loanTermSheetTermsPayload.current_outstanding_balance)
    : !canonicalMode && Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.outstanding_balance))
    ? toFiniteNumber(loanTermSheetTermsPayload.outstanding_balance)
    : !canonicalMode && Number.isFinite(toFiniteNumber(mortgagePayload?.current_outstanding_balance))
    ? toFiniteNumber(mortgagePayload.current_outstanding_balance)
    : !canonicalMode && Number.isFinite(toFiniteNumber(mortgagePayload?.outstanding_balance))
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
  ]) ?? (canonicalMode ? null : normalizePercentFraction(loanTermSheetTermsPayload?.interest_rate ?? loanTermSheetTermsPayload?.rate ?? mortgagePayload?.interest_rate ?? mortgagePayload?.rate));
  const currentDebtRateDisplay = Number.isFinite(currentDebtRate) ? `${(currentDebtRate * 100).toFixed(2)}%` : null;
  const currentDebtAmortYears = Number.isFinite(toFiniteNumber(facts?.amortization_remaining_years))
    ? toFiniteNumber(facts.amortization_remaining_years)
    : Number.isFinite(toFiniteNumber(facts?.amortization_years))
    ? toFiniteNumber(facts.amortization_years)
    : !canonicalMode && Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.amortization_remaining_years))
    ? toFiniteNumber(loanTermSheetTermsPayload.amortization_remaining_years)
    : !canonicalMode && Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.amortization_years))
    ? toFiniteNumber(loanTermSheetTermsPayload.amortization_years)
    : !canonicalMode && Number.isFinite(toFiniteNumber(mortgagePayload?.amortization_remaining_years))
    ? toFiniteNumber(mortgagePayload.amortization_remaining_years)
    : !canonicalMode && Number.isFinite(toFiniteNumber(mortgagePayload?.amort_years))
    ? toFiniteNumber(mortgagePayload.amort_years)
    : extractYears(currentDebtText, [
        /\bamortization remaining[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
        /\bamortization remaining years[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
        /\bamortization[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      ]);
  const currentDebtMonthlyPayment = Number.isFinite(toFiniteNumber(facts?.monthly_payment))
    ? toFiniteNumber(facts.monthly_payment)
    : !canonicalMode && Number.isFinite(toFiniteNumber(loanTermSheetTermsPayload?.monthly_payment))
    ? toFiniteNumber(loanTermSheetTermsPayload.monthly_payment)
    : !canonicalMode && Number.isFinite(toFiniteNumber(mortgagePayload?.monthly_payment))
    ? toFiniteNumber(mortgagePayload.monthly_payment)
    : extractCurrencyFromText(currentDebtText, [
        /\bmonthly payment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        /\bmonthly debt service[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        /\bpayment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      ]);
  const maturityDate = String(facts?.maturity_date || facts?.maturityDate || extractDate(currentDebtText, [
    /\bmaturity date[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    /\bmatures?[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  ]) || (canonicalMode ? "" : loanTermSheetTermsPayload?.maturity_date || loanTermSheetTermsPayload?.maturityDate) || "").trim();
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

function renderDebtServiceCoverageSection(customerSurfaceModel = null) {
  const section = getCustomerSurfaceSection(customerSurfaceModel, "debtServiceCoverage");
  if (section?.factAvailability?.sectionDisplayReady !== true) return "";
  const rows = Object.entries(section?.facts || {}).map(([roleKey, facts]) => {
    const contextLabel = roleKey === "currentDebt" ? "Current Debt" : "Proposed Acquisition Financing";
    const monthlyDebtService = toFiniteNumber(facts?.monthlyDebtService);
    const annualDebtService = toFiniteNumber(facts?.annualDebtService);
    const dscr = toFiniteNumber(facts?.dscr);
    if (![monthlyDebtService, annualDebtService, dscr].every(Number.isFinite)) return "";
    const basis = facts?.modeledDebtService === true
      ? "Modeled level-payment debt service"
      : "Source-stated monthly payment, annualized";
    return `<tr><td>${escapeHtml(contextLabel)}</td><td>${formatMoney(monthlyDebtService)}</td><td>${formatMoney(annualDebtService)}</td><td>${dscr.toFixed(2)}x</td><td>${escapeHtml(basis)}</td></tr>`;
  }).filter(Boolean).join("");
  if (!rows) return "";
  const qualifications = Object.entries(section?.facts || {}).map(([roleKey, facts]) => {
    if (!String(facts?.qualification || "").trim()) return "";
    const contextLabel = roleKey === "currentDebt" ? "Current Debt" : "Proposed Acquisition Financing";
    return `<p class="footer-note"><strong>${escapeHtml(contextLabel)}:</strong> ${escapeHtml(facts.qualification)}</p>`;
  }).filter(Boolean).join("");
  return renderSection(
    "Debt Service and Coverage",
    `<table class="source-table"><thead><tr><th>Context</th><th>Monthly Debt Service</th><th>Annual Debt Service</th><th>DSCR</th><th>Basis</th></tr></thead><tbody>${rows}</tbody></table>${qualifications}<p class="footer-note">No lender covenant threshold or coverage tier is inferred.</p>`,
    { pageBreakBefore: true }
  );
}

function renderDebtTermAnalysisSection(customerSurfaceModel = null) {
  const section = getCustomerSurfaceSection(customerSurfaceModel, "debtTermAnalysis");
  if (section?.factAvailability?.sectionDisplayReady !== true) return "";
  const facts = section?.facts || {};
  const rows = [];
  const addRoleRows = (roleKey, roleLabel) => {
    const maturity = facts?.maturity?.[roleKey] || {};
    const rateStructure = facts?.rateStructure?.[roleKey] || {};
    if (maturity.analysisStatus === "assessed") {
      rows.push(`<tr><td>${escapeHtml(`${roleLabel} Maturity Date`)}</td><td>${escapeHtml(maturity.normalizedMaturityDate || maturity.maturityDate || "")}</td></tr>`);
      rows.push(`<tr><td>${escapeHtml(`${roleLabel} Days to Maturity`)}</td><td>${Number(maturity.daysToMaturity).toLocaleString("en-US")}</td></tr>`);
      rows.push(`<tr><td>${escapeHtml(`${roleLabel} Maturity Position`)}</td><td>${escapeHtml(String(maturity.maturityPosition || "").replace(/_/g, " "))}</td></tr>`);
    }
    if (rateStructure.analysisStatus === "assessed" && rateStructure.rateStructure) {
      rows.push(`<tr><td>${escapeHtml(`${roleLabel} Rate Structure`)}</td><td>${escapeHtml(String(rateStructure.rateStructure).replace(/^./, (value) => value.toUpperCase()))}</td></tr>`);
    }
  };
  addRoleRows("currentDebt", "Current Debt");
  addRoleRows("proposedFinancing", "Proposed Acquisition Financing");
  const lenderFee = facts?.lenderFee || {};
  if (lenderFee.calculationStatus === "calculated" && Number.isFinite(toFiniteNumber(lenderFee.lenderFeeDollars))) {
    rows.push(`<tr><td>Proposed Lender Fee</td><td>${formatMoney(lenderFee.lenderFeeDollars)}</td></tr>`);
  }
  if (!rows.length) return "";
  return renderSection(
    "Debt Term and Maturity Analysis",
    `<table class="detail-table"><tbody>${rows.join("")}</tbody></table><p class="footer-note">Contractual term positions are shown without an inferred risk tier or rate-shock scenario.</p>`,
    { pageBreakBefore: true }
  );
}

function renderDebtCapacityAndCoverageSection(customerSurfaceModel = null) {
  const section = getCustomerSurfaceSection(customerSurfaceModel, "debtCapacityAndCoverage");
  if (!section || section?.status === "collapsed" || section?.factAvailability?.sectionDisplayReady !== true) return "";
  const facts = section?.facts || {};
  const formatDebtCapacityResult = (receipt = {}, units = "") => {
    const result = receipt?.result;
    if (result === null || result === undefined || result === "" || typeof result === "object") return "";
    if (units === "multiple" && Number.isFinite(toFiniteNumber(result))) return `${toFiniteNumber(result).toFixed(2)}x`;
    if (units === "ratio" && Number.isFinite(toFiniteNumber(result))) return formatPercentDisplay(result);
    if (units === "currency_per_unit_per_month" && Number.isFinite(toFiniteNumber(result))) return formatMoney(result);
    if (Number.isFinite(toFiniteNumber(result))) return String(toFiniteNumber(result));
    if (typeof result === "string") {
      const normalized = result.trim();
      return normalized && normalized !== "[object Object]" ? normalized : "";
    }
    return "";
  };
  const scalar = (key, label, receipt, units) => {
    if (receipt?.displayReady !== true) return null;
    const resultDisplay = formatDebtCapacityResult(receipt, units);
    return resultDisplay ? { key, label, resultDisplay } : null;
  };
  const headlineMetrics = [
    scalar("proposedMortgageConstant", "Mortgage Constant", facts.proposedMortgageConstant, "ratio"),
    scalar("proposedDebtYield", "Debt Yield", facts.proposedDebtYield, "ratio"),
    scalar("dscr", "Proposed DSCR", facts.dscr, "multiple"),
    scalar("ltv", "Proposed LTV", facts.ltv, "ratio"),
  ].filter(Boolean);
  const breakEvenMetrics = [
    scalar("currentDebtInclusiveBreakEvenOccupancy", "Current Occupancy Coverage Point", facts.currentDebtInclusiveBreakEvenOccupancy, "ratio"),
    scalar("proposedDebtInclusiveBreakEvenOccupancy", "Proposed Occupancy Coverage Point", facts.proposedDebtInclusiveBreakEvenOccupancy, "ratio"),
    scalar("currentDebtInclusiveBreakEvenMonthlyRentPerUnit", "Current Break-Even Rent / Unit / Month", facts.currentDebtInclusiveBreakEvenMonthlyRentPerUnit, "currency_per_unit_per_month"),
    scalar("proposedDebtInclusiveBreakEvenMonthlyRentPerUnit", "Proposed Break-Even Rent / Unit / Month", facts.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit, "currency_per_unit_per_month"),
  ].filter(Boolean);
  if (!headlineMetrics.length && !breakEvenMetrics.length) return "";
  const headlineHtml = headlineMetrics.length
    ? `<div class="summary-strip debt-capacity-strip">${headlineMetrics.map((metric) => `<div data-iq-fact-key="${escapeHtml(metric.key)}"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.resultDisplay)}</strong></div>`).join("")}</div>`
    : "";
  const breakEvenRows = breakEvenMetrics.map((metric) => `<tr data-iq-fact-key="${escapeHtml(metric.key)}"><td>${escapeHtml(metric.label)}</td><td>${escapeHtml(metric.resultDisplay)}</td></tr>`).join("");
  const breakEvenHtml = breakEvenRows
    ? `<div class="subsection-block"><p class="subsection-title">Debt-Inclusive Break-Even</p><table class="detail-table debt-break-even-table"><tbody>${breakEvenRows}</tbody></table></div>`
    : "";
  const missing = Array.isArray(section?.missingFacts) && section.missingFacts.length
    ? `<p class="footer-note">Unsupported debt-capacity classifications are omitted rather than rendered as inferred conclusions.</p>`
    : "";
  return renderSection(
    section.visibleLabel || "Debt Capacity and Coverage",
    `${headlineHtml}${breakEvenHtml}<p class="footer-note">Deterministic lender metrics are shown only from accepted T12, Rent Roll, current debt, and purchase assumptions. Formula detail and source lineage are retained in the report quality record.</p>${missing}`,
    { pageBreakBefore: true }
  );
}

function renderCoreReconciliationAnalysisSection(customerSurfaceModel = null) {
  const section = getCustomerSurfaceSection(customerSurfaceModel, "coreReconciliation");
  if (section?.factAvailability?.sectionDisplayReady !== true) return "";
  const facts = section?.facts || {};
  const rows = [
    `<tr><td>T12 Gross Potential Rent</td><td>${formatMoney(facts.t12GrossPotentialRent)}</td></tr>`,
    `<tr><td>Rent Roll Annual In-Place Rent</td><td>${formatMoney(facts.rentRollAnnualInPlaceRent)}</td></tr>`,
    `<tr><td>Rent Roll less T12</td><td>${formatMoney(facts.differenceAmount)}</td></tr>`,
    `<tr><td>Variance to T12 Gross Potential Rent</td><td>${formatReconciliationVariance(facts.varianceRatioToT12Gpr)}</td></tr>`,
    Number.isFinite(toFiniteNumber(facts.perUnitMonthlyDifference))
      ? `<tr><td>Difference per Unit per Month</td><td>${formatMoney(facts.perUnitMonthlyDifference)}</td></tr>`
      : "",
  ].filter(Boolean).join("");
  return renderSection(
    "Core Source Reconciliation",
    `<table class="detail-table"><tbody>${rows}</tbody></table><p class="body-copy" style="margin-top:10px;">${escapeHtml(facts.sourceBoundExplanation || "")}</p>`,
    { pageBreakBefore: true }
  );
}

function renderCapitalPlanAnalysisSection(customerSurfaceModel = null) {
  const section = getCustomerSurfaceSection(customerSurfaceModel, "capitalPlanAnalysis");
  if (section?.factAvailability?.sectionDisplayReady !== true) return "";
  const facts = section?.facts || {};
  const rows = [];
  const rawPlans = Array.isArray(facts.capitalPlans) ? facts.capitalPlans : [];
  const renovationContextVisible = customerSurfaceModel?.sections?.renovationContext?.factAvailability?.sourceBacked === true;
  const displayPlans = renovationContextVisible
    ? rawPlans.filter((plan) => String(plan?.canonicalRole || "") !== "renovation_capex_context")
    : rawPlans;
  const uniquePlans = [];
  const seenPlanSignatures = new Set();
  for (const plan of displayPlans) {
    const schedule = plan?.timing?.relativeSchedule || {};
    const buckets = plan?.timing?.sourceLabeledBuckets || {};
    const signature = JSON.stringify([
      toFiniteNumber(plan?.planAmount),
      Number.isInteger(schedule.durationMonths) ? schedule.durationMonths : null,
      toFiniteNumber(buckets.immediate),
      toFiniteNumber(buckets.nearTerm),
      toFiniteNumber(buckets.longTerm),
      toFiniteNumber(plan?.reserveComparison?.reserveLessRequirementAmount),
      toFiniteNumber(plan?.reserveComparison?.reserveCoverageRatio),
    ]);
    if (seenPlanSignatures.has(signature)) continue;
    seenPlanSignatures.add(signature);
    uniquePlans.push(plan);
  }
  for (const [index, plan] of uniquePlans.entries()) {
    const label = uniquePlans.length === 1 ? "Capital Plan" : `Capital Plan ${index + 1}`;
    if (Number.isFinite(toFiniteNumber(plan?.planAmount))) rows.push(`<tr><td>${label} Amount</td><td>${formatMoney(plan.planAmount)}</td></tr>`);
    const schedule = plan?.timing?.relativeSchedule || {};
    if (Number.isInteger(schedule.durationMonths)) rows.push(`<tr><td>${label} Duration</td><td>${schedule.durationMonths} months</td></tr>`);
    const buckets = plan?.timing?.sourceLabeledBuckets || {};
    if (Number.isFinite(toFiniteNumber(buckets.immediate))) rows.push(`<tr><td>${label} Immediate Capital</td><td>${formatMoney(buckets.immediate)}</td></tr>`);
    if (Number.isFinite(toFiniteNumber(buckets.nearTerm))) rows.push(`<tr><td>${label} Near-Term Capital</td><td>${formatMoney(buckets.nearTerm)}</td></tr>`);
    if (Number.isFinite(toFiniteNumber(buckets.longTerm))) rows.push(`<tr><td>${label} Long-Term Capital</td><td>${formatMoney(buckets.longTerm)}</td></tr>`);
    const comparison = plan?.reserveComparison || {};
    if (comparison.calculationStatus === "calculated") {
      rows.push(`<tr><td>${label} Reserve less Requirement</td><td>${formatMoney(comparison.reserveLessRequirementAmount)}</td></tr>`);
      if (Number.isFinite(toFiniteNumber(comparison.reserveCoverageRatio))) rows.push(`<tr><td>${label} Reserve Coverage</td><td>${Number(comparison.reserveCoverageRatio).toFixed(2)}x</td></tr>`);
    }
  }
  const reserve = facts?.reserve || {};
  if (Number.isFinite(toFiniteNumber(reserve.reserveBalance))) rows.push(`<tr><td>Capital Reserve Balance</td><td>${formatMoney(reserve.reserveBalance)}</td></tr>`);
  if (Number.isFinite(toFiniteNumber(reserve.annualReserveContribution))) rows.push(`<tr><td>Annual Reserve Contribution</td><td>${formatMoney(reserve.annualReserveContribution)}</td></tr>`);
  if (Number.isFinite(toFiniteNumber(reserve.contributionPerUnitAnnual))) rows.push(`<tr><td>Annual Reserve Contribution per Unit</td><td>${formatMoney(reserve.contributionPerUnitAnnual)}</td></tr>`);
  const deferred = facts?.deferredMaintenance || {};
  if (deferred.sourceStatus && deferred.sourceStatus !== "not_established") rows.push(`<tr><td>Deferred Maintenance Status</td><td>${escapeHtml(String(deferred.sourceStatus).replace(/_/g, " "))}</td></tr>`);
  if (Number.isFinite(toFiniteNumber(deferred.amount))) rows.push(`<tr><td>Deferred Maintenance Amount</td><td>${formatMoney(deferred.amount)}</td></tr>`);
  if (!rows.length) return "";
  return renderSection(
    "Capital Plan and Reserve Position",
    `<table class="detail-table"><tbody>${rows.join("")}</tbody></table><p class="footer-note">Reserve adequacy and deferred-maintenance severity are not classified without an approved policy.</p>`,
    { pageBreakBefore: true }
  );
}

function renderAppraisalContextSection(customerSurfaceModel = null) {
  const section = customerSurfaceModel?.sections?.appraisalContext || null;
  if (section?.factAvailability?.sourceBacked !== true) return "";
  const facts = section?.facts || {};
  const rows = [
    Number.isFinite(toFiniteNumber(facts.appraisal_value))
      ? `<tr><td>Appraised Value</td><td>${formatMoney(facts.appraisal_value)}</td></tr>`
      : "",
    Number.isFinite(toFiniteNumber(facts.stabilized_noi))
      ? `<tr><td>Stabilized NOI</td><td>${formatMoney(facts.stabilized_noi)}</td></tr>`
      : "",
    Number.isFinite(toFiniteNumber(facts.stabilized_cap_rate))
      ? `<tr><td>Stabilized Cap Rate</td><td>${formatPercentDisplay(facts.stabilized_cap_rate)}</td></tr>`
      : "",
  ].filter(Boolean);
  if (!rows.length) return "";
  const wholePropertyValue = customerSurfaceModel?.valueSemantics?.wholePropertyValue || {};
  const appraisalValue = toFiniteNumber(facts.appraisal_value);
  const appraisalStabilizedNoi = toFiniteNumber(facts.stabilized_noi);
  const appraisalStabilizedCapRate = toFiniteNumber(facts.stabilized_cap_rate);
  const investorIqNoi = toFiniteNumber(wholePropertyValue.noi);
  const investorIqGoingInCapRate = toFiniteNumber(wholePropertyValue.goingInCapRate);
  const purchasePrice = toFiniteNumber(wholePropertyValue.purchasePrice);
  const investorIqImpliedValue = toFiniteNumber(wholePropertyValue.impliedValueAtGoingInCapRate);
  const units = toFiniteNumber(customerSurfaceModel?.sections?.unitMix?.facts?.total_units);
  const perUnitReady = Number.isFinite(units) && units > 0;
  const comparisonReady =
    Number.isFinite(appraisalValue) &&
    Number.isFinite(appraisalStabilizedNoi) &&
    Number.isFinite(appraisalStabilizedCapRate) &&
    appraisalStabilizedCapRate > 0 &&
    Number.isFinite(investorIqNoi) &&
    Number.isFinite(investorIqGoingInCapRate) &&
    investorIqGoingInCapRate > 0 &&
    Number.isFinite(purchasePrice) &&
    Number.isFinite(investorIqImpliedValue);
  const comparisonRows = comparisonReady
    ? [
        `<tr><td>InvestorIQ Deterministic T12-Based Indication</td><td></td></tr>`,
        `<tr><td>T12 NOI basis</td><td>${formatMoney(investorIqNoi)}</td></tr>`,
        `<tr><td>Accepted going-in cap rate</td><td>${formatPercentDisplay(investorIqGoingInCapRate)}</td></tr>`,
        `<tr><td>Implied whole-property value</td><td>${formatMoney(investorIqImpliedValue)}</td></tr>`,
        perUnitReady ? `<tr><td>Implied value per unit</td><td>${formatMoney(Math.round(investorIqImpliedValue) / units)}</td></tr>` : "",
        `<tr><td>Purchase-Assumption Context</td><td></td></tr>`,
        `<tr><td>Purchase price</td><td>${formatMoney(purchasePrice)}</td></tr>`,
        perUnitReady ? `<tr><td>Purchase price per unit</td><td>${formatMoney(purchasePrice / units)}</td></tr>` : "",
        `<tr><td>Uploaded Appraisal Context</td><td></td></tr>`,
        `<tr><td>Appraised value</td><td>${formatMoney(appraisalValue)}</td></tr>`,
        `<tr><td>Appraisal stabilized NOI</td><td>${formatMoney(appraisalStabilizedNoi)}</td></tr>`,
        `<tr><td>Appraisal stabilized cap rate</td><td>${formatPercentDisplay(appraisalStabilizedCapRate)}</td></tr>`,
        perUnitReady ? `<tr><td>Appraisal value per unit</td><td>${formatMoney(appraisalValue / units)}</td></tr>` : "",
      ].filter(Boolean).join("")
    : "";
  const deltaRows = comparisonReady
    ? [
        `<tr><td>InvestorIQ implied value less purchase price</td><td>${formatMoney(Math.round(investorIqImpliedValue - purchasePrice))}</td></tr>`,
        `<tr><td>Appraised value less purchase price</td><td>${formatMoney(Math.round(appraisalValue - purchasePrice))}</td></tr>`,
        `<tr><td>Appraised value less InvestorIQ implied value</td><td>${formatMoney(Math.round(appraisalValue - investorIqImpliedValue))}</td></tr>`,
      ].join("")
    : "";
  const valuationAppraisalComparison = comparisonReady
    ? `<div class="subsection-block" data-iq-subsection="valuation-appraisal-comparison">
        <p class="subsection-title">Valuation / Appraisal Comparison</p>
        <table class="detail-table"><tbody>${comparisonRows}</tbody></table>
        <div class="subsection-block"><p class="subsection-title">Comparison Differences</p><table class="detail-table"><tbody>${deltaRows}</tbody></table></div>
        <p class="footer-note">The InvestorIQ indication is calculated from accepted T12 NOI and accepted going-in cap rate. Purchase price is transaction context. Appraisal facts are uploaded third-party context. No authority replaces another.</p>
      </div>`
    : "";
  return renderSection(
    section.visibleLabel || "Appraisal / Valuation Context",
    `<table class="detail-table numeric-context-table"><tbody>${rows.join("")}</tbody></table>${valuationAppraisalComparison}<p class="footer-note">Appraisal facts are shown as document context only and do not override T12 NOI, purchase assumptions, or the report's deterministic valuation analysis.</p>`,
    { pageBreakBefore: false }
  );
}

function renderRenovationContextSection(customerSurfaceModel = null, { suppressSummary = false } = {}) {
  const section = customerSurfaceModel?.sections?.renovationContext || null;
  if (section?.factAvailability?.sourceBacked !== true) return "";
  const facts = section?.facts || {};
  const totalBudget = Number.isFinite(toFiniteNumber(facts.total_renovation_budget)) ? Number(facts.total_renovation_budget) : null;
  const durationMonths = Number.isFinite(toFiniteNumber(facts.capital_plan_duration_months)) ? Math.round(Number(facts.capital_plan_duration_months)) : null;
  const totalUnits = Number.isFinite(Number(customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units))
    ? Number(customerSurfaceModel.sourceBackedFacts.unitMix.total_units)
    : null;
  const planRows = Array.isArray(facts.renovation_plan_rows) ? facts.renovation_plan_rows : [];

  let plannedUnits = 0;
  let interiorCapital = 0;
  let annualGrossLift = 0;
  let otherStatedCapital = 0;
  const timedRows = [];
  for (const row of planRows) {
    const unitCount = toFiniteNumber(row?.unit_count);
    const costPerUnit = toFiniteNumber(row?.cost_per_unit);
    const monthlyLift = toFiniteNumber(row?.expected_monthly_rent_lift);
    const statedAmount = toFiniteNumber(row?.stated_amount);
    if (Number.isFinite(unitCount) && unitCount > 0 && Number.isFinite(costPerUnit) && costPerUnit >= 0) {
      plannedUnits += unitCount;
      interiorCapital += unitCount * costPerUnit;
      if (Number.isFinite(monthlyLift)) annualGrossLift += unitCount * monthlyLift * 12;
    } else if (Number.isFinite(statedAmount) && statedAmount >= 0) {
      otherStatedCapital += statedAmount;
    }
    const start = toFiniteNumber(row?.start_month);
    const end = toFiniteNumber(row?.end_month);
    if (Number.isFinite(unitCount) && unitCount > 0 && Number.isFinite(start) && Number.isFinite(end)) {
      timedRows.push({ label: String(row?.category || "Interior Program"), start: Math.round(start), end: Math.round(end) });
    }
  }

  const plannedShare = Number.isFinite(totalUnits) && totalUnits > 0 ? plannedUnits / totalUnits : null;
  const grossLiftOnBudget = Number.isFinite(totalBudget) && totalBudget > 0 && annualGrossLift > 0 ? annualGrossLift / totalBudget : null;
  const totalSimplePayback = Number.isFinite(totalBudget) && totalBudget > 0 && annualGrossLift > 0 ? totalBudget / annualGrossLift : null;
  const interiorSimplePayback = interiorCapital > 0 && annualGrossLift > 0 ? interiorCapital / annualGrossLift : null;

  const summaryRows = suppressSummary ? [] : [
    totalBudget !== null ? `<tr><td>Total Renovation Budget</td><td>${formatMoney(totalBudget)}</td></tr>` : "",
    durationMonths !== null ? `<tr><td>Stated Plan Duration</td><td>${durationMonths} months</td></tr>` : "",
  ].filter(Boolean);

  const detailRows = planRows.map((row) => {
    const unitCount = Number.isFinite(toFiniteNumber(row?.unit_count)) ? Math.round(Number(row.unit_count)).toLocaleString("en-US") : "Not stated";
    const costBasis = Number.isFinite(toFiniteNumber(row?.cost_per_unit))
      ? `${formatMoney(row.cost_per_unit)} / unit`
      : Number.isFinite(toFiniteNumber(row?.stated_amount))
        ? `${formatMoney(row.stated_amount)} stated`
        : "Not stated";
    const rentLift = Number.isFinite(toFiniteNumber(row?.expected_monthly_rent_lift))
      ? `${formatMoney(row.expected_monthly_rent_lift)} / month`
      : "Not stated";
    const timing = Number.isFinite(toFiniteNumber(row?.start_month)) && Number.isFinite(toFiniteNumber(row?.end_month))
      ? `Months ${Math.round(Number(row.start_month))}-${Math.round(Number(row.end_month))}`
      : "Not stated";
    return `<tr><td>${escapeHtml(row?.category || "Stated Scope")}</td><td>${escapeHtml(unitCount)}</td><td>${escapeHtml(costBasis)}</td><td>${escapeHtml(rentLift)}</td><td>${escapeHtml(timing)}</td></tr>`;
  }).join("");

  const synthesisRows = [
    plannedUnits > 0 ? `<tr><td>Interior Units in Stated Program</td><td>${Math.round(plannedUnits).toLocaleString("en-US")}${plannedShare !== null ? ` of ${Math.round(totalUnits).toLocaleString("en-US")} (${(plannedShare * 100).toFixed(1)}%)` : ""}</td></tr>` : "",
    interiorCapital > 0 ? `<tr><td>Interior Capital</td><td>${formatMoney(interiorCapital)}</td></tr>` : "",
    otherStatedCapital > 0 ? `<tr><td>Other Stated Capital</td><td>${formatMoney(otherStatedCapital)}</td></tr>` : "",
    annualGrossLift > 0 ? `<tr><td>Documented Annual Gross Rent Lift</td><td>${formatMoney(annualGrossLift)}</td></tr>` : "",
    grossLiftOnBudget !== null ? `<tr><td>Gross Rent Lift / Total Budget</td><td>${(grossLiftOnBudget * 100).toFixed(1)}%</td></tr>` : "",
    totalSimplePayback !== null ? `<tr><td>Simple Gross Payback on Total Budget</td><td>${totalSimplePayback.toFixed(2)} years</td></tr>` : "",
    interiorSimplePayback !== null ? `<tr><td>Interior-Only Simple Gross Payback</td><td>${interiorSimplePayback.toFixed(2)} years</td></tr>` : "",
  ].filter(Boolean).join("");

  const timelineRows = timedRows.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>Month ${row.start}</td><td>Month ${row.end}</td></tr>`).join("");
  const synthesis = synthesisRows
    ? `<div class="subsection-block phase8a-capital-synthesis" data-iq-phase8a-capital-synthesis="true"><p class="subsection-title">Capital Program Economics</p><table class="detail-table"><tbody>${synthesisRows}</tbody></table><p class="footer-note">Gross rent lift is document-based rent arithmetic, not NOI. Simple gross payback divides stated capital by documented gross annual rent lift and is not ROI, IRR, or a value-creation forecast.</p></div>`
    : "";
  const timeline = timelineRows
    ? `<div class="subsection-block"><p class="subsection-title">Stated Execution Window</p><table class="detail-table"><thead><tr><th>Program</th><th>Start</th><th>End</th></tr></thead><tbody>${timelineRows}</tbody></table></div>`
    : "";
  const detailTable = detailRows
    ? `<div class="subsection-block"><p class="subsection-title">Document-Stated Plan Detail</p><table class="detail-table renovation-plan-table"><thead><tr><th>Scope</th><th>Units</th><th>Cost Basis</th><th>Rent Lift</th><th>Timing</th></tr></thead><tbody>${detailRows}</tbody></table></div>`
    : "";
  if (!summaryRows.length && !detailRows && !synthesisRows) return "";
  const body = `${summaryRows.length ? `<table class="detail-table numeric-context-table"><tbody>${summaryRows.join("")}</tbody></table>` : ""}${synthesis}${timeline}${detailTable}`;
  if (suppressSummary) {
    return `<div class="subsection-block iq-renovation-detail" data-iq-section="renovationContext"><p class="subsection-title">Renovation / CapEx Context</p>${body}</div>`;
  }
  return renderSection(section.visibleLabel || "Renovation / CapEx Context", body, { pageBreakBefore: false, allowBreak: true });
}

function renderMarketSurveyContextSection(customerSurfaceModel = null) {
  const section = customerSurfaceModel?.sections?.marketSurveyContext || null;
  if (section?.factAvailability?.sourceBacked !== true) return "";
  const ranges = Array.isArray(section?.facts?.market_rent_ranges) ? section.facts.market_rent_ranges : [];
  const rows = ranges.map((row) => `<tr><td>${escapeHtml(row?.unit_type || "Unit Type")}</td><td>${formatMoney(row?.low_monthly_rent)}</td><td>${formatMoney(row?.high_monthly_rent)}</td></tr>`).join("");
  if (!rows) return "";

  const unitMixFacts = customerSurfaceModel?.sourceBackedFacts?.unitMix || {};
  const unitMixRows = (Array.isArray(unitMixFacts?.unit_mix) ? unitMixFacts.unit_mix : [])
    .map(normalizeStructuredUnitMixRow)
    .filter(Boolean);
  const comparisons = [];
  for (const range of ranges) {
    const label = String(range?.unit_type || "").trim().toLowerCase();
    const match = unitMixRows.find((row) => String(row?.label || "").trim().toLowerCase() === label);
    const market = Number(match?.market);
    const low = Number(range?.low_monthly_rent);
    const high = Number(range?.high_monthly_rent);
    if (!match || !Number.isFinite(market) || !Number.isFinite(low) || !Number.isFinite(high)) continue;
    let position = "Within survey range";
    if (market < low) position = `${formatMoney(low - market)} below survey low`;
    else if (market > high) position = `${formatMoney(market - high)} above survey high`;
    comparisons.push({ label: range.unit_type, market, low, high, position });
  }
  const comparisonRows = comparisons.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${formatMoney(row.market, 2)}</td><td>${formatMoney(row.low)} to ${formatMoney(row.high)}</td><td>${escapeHtml(row.position)}</td></tr>`).join("");
  const allBelow = comparisons.length > 0 && comparisons.every((row) => row.market < row.low);
  const comparisonHtml = comparisonRows
    ? `<div class="subsection-block" data-iq-phase8a-market-comparison="true"><p class="subsection-title">Rent Roll vs Market Survey</p><table class="detail-table"><thead><tr><th>Unit Type</th><th>Rent Roll Market</th><th>Survey Range</th><th>Position</th></tr></thead><tbody>${comparisonRows}</tbody></table><p class="footer-note">${allBelow ? "Rent Roll market rents are below the supplied survey floors for every matched unit type. The documented rent gap therefore does not depend on substituting the higher survey ranges." : "The comparison places Rent Roll market rents beside the supplied survey ranges without replacing either source."}</p></div>`
    : "";
  return renderSection(
    section.visibleLabel || "Market Rent Survey Context",
    `<table class="detail-table market-range-table"><thead><tr><th>Unit Type</th><th>Low Monthly Rent</th><th>High Monthly Rent</th></tr></thead><tbody>${rows}</tbody></table>${comparisonHtml}<p class="footer-note">Survey ranges are third-party context. Rent Roll rents remain the operating rent basis used elsewhere in this report.</p>`,
    { pageBreakBefore: false, allowBreak: true }
  );
}

function renderEnvironmentalContextSection(customerSurfaceModel = null) {
  const section = customerSurfaceModel?.sections?.environmentalContext || null;
  if (section?.factAvailability?.sourceBacked !== true) return "";
  const status = String(section?.facts?.phase_i_status || "").trim();
  if (!status) return "";
  const statusLabel = status === "none_identified_in_summary"
    ? "None identified in this summary"
    : status.replace(/_/g, " ");
  return renderSection(
    section.visibleLabel || "Environmental Due Diligence Context",
    `<table class="detail-table"><tbody><tr><td>Recognized Environmental Conditions</td><td>${escapeHtml(statusLabel)}</td></tr></tbody></table><p class="footer-note">This is the document-stated summary status only. No legal conclusion, remediation cost, or investment impact is inferred.</p>`,
    { pageBreakBefore: false, allowBreak: true }
  );
}

function renderDocumentTreatmentSection(renderedAcquisitionMemo = null, sourcePackage = null, bossContract = null, customerSurfaceModel = null) {
  const bossDocs = Array.isArray(customerSurfaceModel?.supportSources) && customerSurfaceModel.supportSources.length
    ? customerSurfaceModel.supportSources
    : getBossSupportDocs(bossContract, sourcePackage);
  const tableHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.documentTreatmentSummaryHtml || "").trim();
  const coreSources = [
    {
      source: customerSurfaceModel?.coreSources?.coreT12 || bossContract?.sourceTruth?.coreT12 || sourcePackage?.coreT12 || null,
      label: customerSurfaceModel?.coreSources?.coreT12?.visibleLabel || "Core Quantitative Source - Trailing 12-Month Income Statement",
      treatment: "Core Quantitative Source; accepted for operating analysis",
      use: "Operating statement and financial metrics",
    },
    {
      source: customerSurfaceModel?.coreSources?.coreRentRoll || bossContract?.sourceTruth?.coreRentRoll || sourcePackage?.coreRentRoll || null,
      label: customerSurfaceModel?.coreSources?.coreRentRoll?.visibleLabel || "Core Quantitative Source - Rent Roll",
      treatment: "Core Quantitative Source; accepted for rent analysis",
      use: "Unit mix, occupancy, and rent positioning",
    },
  ];
  const roleLabels = {
    purchase_assumptions: "Acquisition Assumptions",
    current_debt_context: "Current Debt Statement",
    renovation_capex_context: "Capital Plan",
    structured_renovation_capex_plan: "Capital Plan",
    property_condition_context: "Property Condition / Capital Plan",
    appraisal_context: "Appraisal Context",
    market_survey_context: "Market Survey Context",
    environmental_context: "Environmental Context",
  };
  const rows = [];
  const seenFilenames = new Set();
  for (const core of coreSources) {
    const filename = String(core.source?.filename || core.source?.originalFilename || "").trim();
    if (!filename || seenFilenames.has(filename)) continue;
    seenFilenames.add(filename);
    rows.push(`<tr><td class="source-filename">${softWrapFilename(filename)}</td><td style="font-weight:600;">${escapeHtml(core.label)}</td><td>${escapeHtml(core.treatment)}</td><td>${escapeHtml(core.use)}</td></tr>`);
  }
  for (const doc of Array.isArray(bossDocs) ? bossDocs : []) {
    const filename = String(doc?.filename || doc?.originalFilename || doc?.original_filename || "").trim();
    if (!filename || seenFilenames.has(filename)) continue;
    seenFilenames.add(filename);
    const role = String(doc?.canonicalRole || doc?.canonical_role || "").trim().toLowerCase();
    const facts = doc?.facts || doc?.extractedFacts || doc?.acceptedFacts || doc?.accepted_facts || null;
    const hasStatedFacts = facts && typeof facts === "object" && Object.keys(facts).length > 0;
    rows.push(`<tr><td class="source-filename">${softWrapFilename(filename)}</td><td style="font-weight:600;">${escapeHtml(doc?.visibleLabel || roleLabels[role] || doc?.roleLabel || "Support Document")}</td><td>${hasStatedFacts ? "Accepted for related analysis" : "Retained as context"}</td><td>${hasStatedFacts ? "Only stated values are used in the related section" : "Not used to change report values"}</td></tr>`);
  }
  const tableBody = rows.length
    ? `<table class="detail-table source-register-table"><thead><tr><th>Uploaded File</th><th>Document Role</th><th>Treatment</th><th>Report Use</th></tr></thead><tbody>${rows.join("")}</tbody></table>`
    : tableHtml;
  if (!tableBody) return "";
  return renderSection(
    "Source Register & Document Treatment",
    `<p class="body-copy">Each uploaded file is listed once for auditability. A supporting document affects only the section supported by values stated in that file.</p>${tableBody}`,
    { id: "document-treatment-title", pageBreakBefore: false, allowBreak: true }
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
    `<tr><td>Current debt context</td><td style="font-weight:600;">${escapeHtml(supportFactBundleStatus(customerSurfaceModel, "currentDebtContext", acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext === true))}</td></tr>`,
    `<tr><td>Purchase assumptions</td><td style="font-weight:600;">${escapeHtml(supportFactBundleStatus(customerSurfaceModel, "acquisitionRequestContext", acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions === true))}</td></tr>`,
    `<tr><td>Renovation / CapEx plan</td><td style="font-weight:600;">${escapeHtml(supportFactBundleStatus(customerSurfaceModel, "renovationContext", acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation === true))}</td></tr>`,
  ];
  const renderedCoreSourceSummary = customerSurfaceModel
    ? ""
    : stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  return renderSection(
    "Underwriting Summary",
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
  const renderedCoreSourceSummary = customerSurfaceModel
    ? ""
    : stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  const rows = [
    `<tr><td>Asset Identity</td><td style="font-weight:600;">${escapeHtml(assetIdentity)}</td></tr>`,
    `<tr><td>${escapeHtml(UNDERWRITING_REPORT_IDENTITY.canonicalTitle.toUpperCase())}</td><td style="font-weight:600;">${escapeHtml("InvestorIQ")}</td></tr>`,
    Number.isFinite(Number(coreMetrics?.occupancy)) ? `<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(coreMetrics.occupancy)}</td></tr>` : "",
    Number.isFinite(Number(coreMetrics?.noi)) ? `<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(coreMetrics.noi)}</td></tr>` : "",
    `<tr><td>Current debt context</td><td style="font-weight:600;">${escapeHtml(supportFactBundleStatus(customerSurfaceModel, "currentDebtContext", acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext === true))}</td></tr>`,
  ].filter(Boolean).join("");
  return renderSection(
    "Underwriting Summary",
    `<p class="body-copy">Source-bound operating and acquisition context.</p><table class="detail-table"><tbody>${rows}</tbody></table><div class="subsection-block"><p class="subsection-title">Source Context / Uploaded Files</p><table class="detail-table data-coverage-table data-coverage-table-3col"><tbody>${sourceRows.join("")}</tbody></table></div>${renderedCoreSourceSummary ? `<div class="subsection-block"><p class="subsection-title">Core Quantitative Sources</p><div class="data-coverage-source-summary">${renderedCoreSourceSummary}</div></div>` : ""}`,
    { pageBreakBefore: false }
  );
}

function renderOperatingStatementSection({ sourcePackage = null, t12Payload = null, coreMetrics = null, acquisitionMemoProjection = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const sectionContract = getCustomerSurfaceSection(customerSurfaceModel, "operatingStatementTTMSummary") || getBossSectionContract(bossContract, "operatingStatementTTMSummary");
  if (sectionContract?.status === "collapsed") {
    return renderSection("Operating Statement / TTM Summary", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  if (sectionHasSourceBackedFacts(sectionContract) && sectionHasMissingRequiredFacts(sectionContract)) {
    return renderSection("Operating Statement / TTM Summary", renderSectionCollapseHtml(), { pageBreakBefore: true });
  }
  const t12Source = customerSurfaceModel?.coreSources?.coreT12 || bossContract?.sourceTruth?.coreT12 || sourcePackage?.coreT12 || null;
  const rentRollSource = customerSurfaceModel?.coreSources?.coreRentRoll || bossContract?.sourceTruth?.coreRentRoll || sourcePackage?.coreRentRoll || null;
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
  const governedOperatingFacts = customerSurfaceModel?.sections?.operatingStatementTTMSummary?.facts || {};
  const governedOperatingFactAvailability = customerSurfaceModel?.sections?.operatingStatementTTMSummary?.factAvailability || null;
  const bridgeRequiredFacts = ["effective_gross_income", "total_operating_expenses", "net_operating_income"];
  const bridgeSectionEligible = Boolean(
    sectionContract &&
    sectionContract.status !== "collapsed" &&
    sectionContract.factAvailability?.sourceBacked === true &&
    !sectionHasMissingRequiredFacts(sectionContract) &&
    bridgeRequiredFacts.every((factName) => governedOperatingFactAvailability?.available?.includes(factName))
  );
  const bridgeEgi = toFiniteNumber(governedOperatingFacts.effective_gross_income);
  const bridgeOperatingExpenses = toFiniteNumber(governedOperatingFacts.total_operating_expenses);
  const bridgeNoi = toFiniteNumber(governedOperatingFacts.net_operating_income);
  const revenueExpenseNoiBridge = bridgeSectionEligible &&
    Number.isFinite(bridgeEgi) &&
    Number.isFinite(bridgeOperatingExpenses) &&
    Number.isFinite(bridgeNoi)
    ? `<div class="subsection-block" data-iq-subsection="revenue-expense-noi-bridge">
        <p class="subsection-title">Revenue / Expense / NOI Bridge</p>
        <table class="detail-table"><tbody>
          <tr><td>Effective Gross Income</td><td style="font-weight:600;">${formatMoney(bridgeEgi)}</td></tr>
          <tr><td>Less: Total Operating Expenses</td><td style="font-weight:600;">${formatMoney(bridgeOperatingExpenses)}</td></tr>
          <tr><td>Equals: Net Operating Income</td><td style="font-weight:600;">${formatMoney(bridgeNoi)}</td></tr>
        </tbody></table>
      </div>`
    : "";
  return `<div class="card allow-break">
    <table class="detail-table"><tbody>
      <tr><td>Operating Statement Evidence</td><td style="font-weight:600;">${t12Source ? "Accepted for analysis" : "Not provided"}</td></tr>
      <tr><td>Rent Roll Evidence</td><td style="font-weight:600;">${rentRollSource ? "Accepted for analysis" : "Not provided"}</td></tr>
    </tbody></table>
    ${t12LineItems.length ? `<div class="subsection-block"><p class="subsection-title">T12 Income & Expense Line Items</p><table class="detail-table"><tbody>${t12LineItems.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td style="font-weight:600;">${formatMoney(item.amount)}</td></tr>`).join("")}</tbody></table></div>` : ""}
    ${revenueExpenseNoiBridge}
    ${renderPropertyTaxAnalysisSection(customerSurfaceModel)}
    ${t12Snippet ? `<div class="subsection-block"><p class="subsection-title">TTM Source Excerpt</p><p class="body-copy">${escapeHtml(t12Snippet.slice(0, 420))}</p></div>` : ""}
  </div>`;
}

function renderCapRateValueSection({ acquisitionMemoProjection = null, sourcePackage = null, coreMetrics = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const noiBasis = Number(customerSurfaceModel?.valueSemantics?.wholePropertyValue?.noi ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.noi_basis ?? acquisitionMemoProjection?.acquisitionContext?.extractedFacts?.noi_basis ?? coreMetrics?.noi ?? NaN);
  const acceptedCapRate = Number.isFinite(Number(customerSurfaceModel?.valueSemantics?.wholePropertyValue?.goingInCapRate))
    ? Number(customerSurfaceModel.valueSemantics.wholePropertyValue.goingInCapRate)
    : resolveValidGoingInCapRate({ coreMetrics, acquisitionMemoProjection, sourcePackage, bossContract });
  const units = Number(coreMetrics?.units ?? customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units ?? bossContract?.reportContext?.coreMetrics?.units ?? bossContract?.sourceTruth?.coreRentRoll?.extractedFacts?.total_units ?? sourcePackage?.coreRentRoll?.extractedFacts?.total_units ?? sourcePackage?.coreRentRoll?.extractedFacts?.units?.length ?? NaN);
  if (!Number.isFinite(noiBasis) || noiBasis <= 0 || !Number.isFinite(acceptedCapRate) || acceptedCapRate <= 0) return "";
  const impliedValue = noiBasis / acceptedCapRate;
  const perUnit = Number.isFinite(units) && units > 0 ? impliedValue / units : null;
  const row = `<tr data-iq-cap-rate-row="accepted" data-iq-cap-rate="${acceptedCapRate}"><td>${formatPercentDisplay(acceptedCapRate)}</td><td style="font-weight:600;">${formatMoney(impliedValue)}</td><td style="font-weight:600;">${Number.isFinite(perUnit) ? formatMoney(Math.round(perUnit + 1e-7)) : "Not available"}</td></tr>`;
  return `<div class="card no-break">
    <p class="subsection-title">Cap-Rate Value Indication</p>
    <p class="body-copy">The accepted NOI basis is capitalized at the accepted going-in cap rate. No additional scenario rates are introduced.</p>
    <table class="detail-table"><thead><tr><th>Accepted Cap Rate</th><th>Implied Value</th><th>Per Unit</th></tr></thead><tbody>${row}</tbody></table>
    <p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Accepted-rate value indication: ${formatMoney(impliedValue)}</p>
  </div>`;
}

function renderMetricsSnapshotSection(coreMetrics = null, sourcePackage = null, bossContract = null, customerSurfaceModel = null) {
  const rows = [];
  const units =
    toFiniteNumber(coreMetrics?.units) ??
    toFiniteNumber(customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units) ??
    toFiniteNumber(bossContract?.sourceTruth?.coreRentRoll?.extractedFacts?.total_units) ??
    toFiniteNumber(sourcePackage?.coreRentRoll?.extractedFacts?.total_units);
  const occupancy = toFiniteNumber(coreMetrics?.occupancy);
  const annualInPlace = toFiniteNumber(coreMetrics?.annualInPlaceRent);
  const annualMarket = toFiniteNumber(coreMetrics?.annualMarketRent);
  const egi = toFiniteNumber(coreMetrics?.egi);
  const opEx = toFiniteNumber(coreMetrics?.opEx);
  const noi = toFiniteNumber(coreMetrics?.noi);
  const expenseRatio = toFiniteNumber(coreMetrics?.expenseRatio);
  const noiMargin = toFiniteNumber(coreMetrics?.noiMargin);
  const breakEvenOccupancy = toFiniteNumber(coreMetrics?.breakEvenOccupancy);
  const annualUpside = Number.isFinite(annualInPlace) && Number.isFinite(annualMarket) ? annualMarket - annualInPlace : null;
  const rentGapPct = Number.isFinite(annualUpside) && Number.isFinite(annualInPlace) && annualInPlace > 0 ? annualUpside / annualInPlace : null;
  const purchasePrice = toFiniteNumber(coreMetrics?.purchasePrice);
  const pricePerUnit = Number.isFinite(purchasePrice) && Number.isFinite(units) && units > 0 ? purchasePrice / units : null;
  const noiPerUnit = Number.isFinite(noi) && Number.isFinite(units) && units > 0 ? noi / units : null;
  if (Number.isFinite(units) && units > 0) rows.push(`<tr><td>Units</td><td style="font-weight:600;">${Math.round(units)}</td></tr>`);
  if (Number.isFinite(occupancy)) rows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(occupancy)}</td></tr>`);
  if (Number.isFinite(annualInPlace)) rows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatMoney(annualInPlace)}</td></tr>`);
  if (Number.isFinite(annualMarket)) rows.push(`<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatMoney(annualMarket)}</td></tr>`);
  if (Number.isFinite(annualUpside)) rows.push(`<tr><td>Annual Rent Upside</td><td style="font-weight:600;">${formatMoney(annualUpside)}</td></tr>`);
  if (Number.isFinite(rentGapPct)) rows.push(`<tr><td>Rent Gap %</td><td style="font-weight:600;">${formatPercentDisplay(rentGapPct)}</td></tr>`);
  if (Number.isFinite(egi)) rows.push(`<tr><td>EGI</td><td style="font-weight:600;">${formatMoney(egi)}</td></tr>`);
  if (Number.isFinite(opEx)) rows.push(`<tr><td>Operating Expenses</td><td style="font-weight:600;">${formatMoney(opEx)}</td></tr>`);
  if (Number.isFinite(noi)) rows.push(`<tr><td>NOI</td><td style="font-weight:600;">${formatMoney(noi)}</td></tr>`);
  if (Number.isFinite(expenseRatio)) rows.push(`<tr><td>Expense Ratio</td><td style="font-weight:600;">${formatPercentDisplay(expenseRatio)}</td></tr>`);
  if (Number.isFinite(noiMargin)) rows.push(`<tr><td>NOI Margin</td><td style="font-weight:600;">${formatPercentDisplay(noiMargin)}</td></tr>`);
  if (Number.isFinite(breakEvenOccupancy)) rows.push(`<tr><td>Break-Even Occupancy</td><td style="font-weight:600;">${formatPercentDisplay(breakEvenOccupancy)}</td></tr>`);
  if (Number.isFinite(purchasePrice)) rows.push(`<tr><td>Purchase Price</td><td style="font-weight:600;">${formatMoney(purchasePrice)}</td></tr>`);
  const goingInCapRate = resolveValidGoingInCapRate({ coreMetrics, sourcePackage, bossContract });
  if (Number.isFinite(goingInCapRate)) rows.push(`<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercentDisplay(goingInCapRate, 2)}</td></tr>`);
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
        const gapDisplay = Number.isFinite(row.gap) ? formatMoney(row.gap, 2) : "Not available";
        return `<tr><td>${escapeHtml(row.label)}</td><td style="font-weight:600;">${Number.isFinite(row.count) ? Math.round(row.count) : "Not available"}</td><td style="font-weight:600;">${Number.isFinite(row.inPlace) ? formatMoney(row.inPlace, 2) : "Not available"}</td><td style="font-weight:600;">${Number.isFinite(row.market) ? formatMoney(row.market, 2) : "Not available"}</td><td style="font-weight:600;">${gapDisplay}</td></tr>`;
      }).join("")
    : (sectionHasSourceBackedFacts(unitMixSection)
      ? `<tr><td colspan="5" style="font-weight:600;">${renderSectionCollapseHtml()}</td></tr>`
      : `<tr><td colspan="5" style="font-weight:600;">Detailed unit mix rows were not available from the accepted Rent Roll.</td></tr>`);
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
          <tr><td>Rent Roll Evidence</td><td style="font-weight:600;">${rentRollSource ? "Accepted for analysis" : "Not provided"}</td></tr>
        </tbody></table>
        ${rentRollSnippet ? `<div class="subsection-block"><p class="subsection-title">Rent Roll Snippet</p><p class="body-copy">${escapeHtml(rentRollSnippet.slice(0, 420))}</p></div>` : ""}
      </div>
    </div>`,
    { id: "unit-mix-title", pageBreakBefore: true, allowBreak: true }
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
    `<tr><td>Annual gross rent difference</td><td style="font-weight:600;">${Number.isFinite(annualRentUpside) ? formatMoney(annualRentUpside) : "Not available"}</td></tr>`,
    `<tr><td>Rent difference %</td><td style="font-weight:600;">${Number.isFinite(rentGapPct) ? formatPercentDisplay(rentGapPct) : "Not available"}</td></tr>`,
    `<tr><td>Implied value at going-in cap rate</td><td style="font-weight:600;">${Number.isFinite(impliedValue) ? formatMoney(impliedValue) : "Not available"}</td></tr>`,
    `<tr><td>Value delta vs purchase price</td><td style="font-weight:600;">${Number.isFinite(normalizedValueDelta) ? formatMoney(normalizedValueDelta) : "Not available"}</td></tr>`,
  ];
  return renderSection(
    "Rent Position / Whole-Property Value Context",
    `<p class="body-copy">The rent difference is shown as gross rent evidence only. The whole-property value indication is calculated independently from T12 NOI and the document-backed going-in cap rate; the rent difference is not capitalized.</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table>`,
    { id: "value-sensitivity-title", pageBreakBefore: true, allowBreak: true }
  );
}

function renderDataCoverageSection({ sourcePackage = null, renderedAcquisitionMemo = null, acquisitionMemoProjection = null, bossContract = null, customerSurfaceModel = null } = {}) {
  const supportDocs = Array.isArray(customerSurfaceModel?.supportSources) && customerSurfaceModel.supportSources.length
    ? customerSurfaceModel.supportSources
    : getBossSupportDocs(bossContract, sourcePackage);
  const coreCards = [
    ["Operating Statement", sourcePackage?.coreT12 ? "Accepted" : "Not provided"],
    ["Rent Roll", sourcePackage?.coreRentRoll ? "Accepted" : "Not provided"],
    ["Supporting Documents", String(supportDocs.length)],
  ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  const sourceSummaryHtml = customerSurfaceModel
    ? ""
    : stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.coreSourceSummaryHtml || "").trim();
  const stateItems = [
    ["Current debt context", supportFactBundleStatus(customerSurfaceModel, "currentDebtContext", acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext === true)],
    ["Purchase assumptions", supportFactBundleStatus(customerSurfaceModel, "acquisitionRequestContext", acquisitionMemoProjection?.financingReadinessSignals?.hasPurchaseAssumptions === true)],
    ["Structured renovation / CapEx plan", supportFactBundleStatus(customerSurfaceModel, "renovationContext", acquisitionMemoProjection?.financingReadinessSignals?.hasStructuredRenovation === true)],
    ["Appraisal context", supportFactBundleStatus(customerSurfaceModel, "appraisalContext", acquisitionMemoProjection?.financingReadinessSignals?.hasAppraisalContext === true)],
    ["Market survey context", supportFactBundleStatus(customerSurfaceModel, "marketSurveyContext", acquisitionMemoProjection?.financingReadinessSignals?.hasMarketSurveyContext === true)],
    ["Environmental / Phase I ESA context", supportFactBundleStatus(customerSurfaceModel, "environmentalContext", acquisitionMemoProjection?.financingReadinessSignals?.hasEnvironmentalContext === true)],
  ];
  const stateRows = [];
  for (let index = 0; index < stateItems.length; index += 2) {
    const left = stateItems[index];
    const right = stateItems[index + 1] || ["", ""];
    stateRows.push(`<tr><td>${escapeHtml(left[0])}</td><td>${escapeHtml(left[1])}</td><td>${escapeHtml(right[0])}</td><td>${escapeHtml(right[1])}</td></tr>`);
  }
  const reconciliation = getSourceReconciliationForSurface(customerSurfaceModel, bossContract, acquisitionMemoProjection);
  const reconciliationState = reconciliation?.state || null;
  const reconciliationHtml = reconciliation?.sourceBacked === true && ["source_reconciliation_required", "parser_suspected"].includes(String(reconciliationState?.status || "").trim())
    ? `<div class="subsection-block"><p class="subsection-title">Source Reconciliation</p><div class="reconciliation-metric-grid"><div><span>T12 Gross Potential Rent</span><strong>${formatMoney(reconciliationState.t12_gpr)}</strong></div><div><span>Rent Roll Annual In-Place Rent</span><strong>${formatMoney(reconciliationState.rr_annual_in_place)}</strong></div><div><span>Rent Roll less T12</span><strong>${formatMoney(reconciliationState.difference_amount)}</strong></div><div><span>Variance</span><strong>${formatReconciliationVariance(reconciliationState.variance_pct)}</strong></div></div><p class="footer-note">${escapeHtml(reconciliationState.source_reconciliation_disclosure)}</p></div>`
    : "";
  return renderSection(
    "Data Coverage & Source Limitations",
    `<div class="summary-strip data-coverage-strip">${coreCards}</div>${reconciliationHtml}<div class="subsection-block"><p class="subsection-title">Source Reliability Snapshot</p><table class="detail-table readiness-pair-table"><tbody>${stateRows.join("")}</tbody></table></div>${sourceSummaryHtml ? `<div class="subsection-block"><p class="subsection-title">Core Source Summary</p><div class="data-coverage-source-summary">${sourceSummaryHtml}</div></div>` : ""}`,
    { id: "data-coverage-title", pageBreakBefore: true }
  );
}

function renderMethodologySection() {
  return `<div class="subsection-block methodology-compact" id="methodology-title" data-iq-section="methodology-data-transparency">
    <p class="subsection-title methodology-compact-title">Methodology &amp; Data Transparency</p>
    <div class="methodology-compact-grid">
      <p><strong>No gap-filling.</strong> Unsupported assumptions and missing inputs remain visible rather than being inferred.</p>
      <p><strong>Evidence-bound analysis.</strong> Outputs use verified source documents and deterministic calculations; supporting documents affect only dependent sections.</p>
      <p><strong>Review use.</strong> This report is intended for institutional review alongside the source documents and source-treatment register.</p>
    </div>
  </div>`;
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
  sourceTruthPackage = null,
  t12Payload = null,
  acquisitionTermsPayload = null,
  loanTermSheetTermsPayload = null,
  mortgagePayload = null,
  coreMetrics = null,
  reportMeta = null,
  propertyProfile = null,
  bossContract = null,
  customerSurfaceModel = null,
  financialIntelligence = null,
} = {}) {
  try {
    const hasCanonicalBreakEvenContract = Boolean(customerSurfaceModel?.financialTruth?.breakEvenOccupancy);
    const canonicalBreakEvenRaw = customerSurfaceModel?.financialTruth?.breakEvenOccupancy?.result;
    const canonicalBreakEvenOccupancy = canonicalBreakEvenRaw === null || canonicalBreakEvenRaw === undefined || canonicalBreakEvenRaw === ""
      ? null
      : Number(canonicalBreakEvenRaw);
    if (hasCanonicalBreakEvenContract) {
      coreMetrics = {
        ...(coreMetrics || {}),
        breakEvenOccupancy: Number.isFinite(canonicalBreakEvenOccupancy) ? canonicalBreakEvenOccupancy : null,
      };
    }
    const surfaceIdentity = customerSurfaceModel?.identity || {};
    const propertyName = surfaceIdentity?.propertyName || propertyProfile?.propertyName || propertyProfile?.property_name || reportMeta?.propertyName || reportMeta?.property_name || sourcePackage?.propertyName || UNDERWRITING_REPORT_IDENTITY.canonicalTitle;
    const propertyAddress = surfaceIdentity?.propertyAddress || propertyProfile?.propertyAddress || propertyProfile?.property_address || reportMeta?.propertyAddress || reportMeta?.property_address || "";
    const propertyTitle = surfaceIdentity?.propertyTitle || propertyProfile?.propertyTitle || propertyProfile?.property_title || reportMeta?.propertyTitle || reportMeta?.property_title || "";
    const generatedLabel = formatDisplayDate(reportMeta?.generatedAt || reportMeta?.generated_at || "");
    const runningIdentity = distinctSurfaceLabels(propertyName, propertyAddress, propertyTitle).join(" | ");
    const headerStrip = `<div class="header-strip">
      <div class="header-top">
        <div>
          <div class="brand-mark">INVESTORIQ</div>
          <div class="tagline">Document-Backed Property Underwriting</div>
        </div>
        <div class="report-running-property" style="text-align:center; font-family:var(--font-body); font-size:7.5pt; font-weight:300; color:var(--ink-3);">${escapeHtml(runningIdentity)}</div>
        <div style="text-align:right; font-family:var(--font-mono); font-size:6.5pt; font-weight:400; color:var(--ink-4); letter-spacing:0.08em;">${escapeHtml(generatedLabel || "")}</div>
      </div>
    </div>`;
    const bossSections = bossContract?.sections || {};
    let eliteChapter1Contract = null;
    let eliteChapter1Html = "";
    if (sourceTruthPackage) {
      try {
        eliteChapter1Contract = buildFullUnderwritingChapter1EliteContract({
          sourceTruthPackage,
          customerSurfaceModel,
          financialIntelligence,
          coreMetrics,
          propertyProfile,
          reportMeta,
        });
        eliteChapter1Html = renderFullUnderwritingChapter1EliteHtml(eliteChapter1Contract);
      } catch (eliteChapter1Error) {
        console.warn("[investoriq] ELITE Chapter 1 surface fallback", {
          message: eliteChapter1Error?.message || String(eliteChapter1Error || ""),
        });
      }
    }
    const coverSection = renderBrandCoverSection({ propertyName, propertyAddress, propertyTitle, reportMeta, sourcePackage, coreMetrics, propertyProfile, customerSurfaceModel,
      decisionClassification: eliteChapter1Contract ? executiveDecisionState(eliteChapter1Contract.executiveInvestmentSummary?.primaryConstraint) : null });
    const executiveSummarySection = eliteChapter1Html ? "" : renderSafely("Executive Summary", () => renderExecutiveSummarySection({ sourcePackage, acquisitionMemoProjection, coreMetrics, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.executiveSummary });
    const metricsSection = eliteChapter1Html ? "" : renderSafely("Key Metrics Snapshot", () => renderMetricsSnapshotSection(coreMetrics, sourcePackage, bossContract, customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.keyMetricsSnapshot });
    const keyUpsideDriversSection = eliteChapter1Html ? "" : renderSafely("Key Upside Drivers", () => renderKeyUpsideDriversSection({ sourcePackage, coreMetrics, acquisitionMemoProjection }), { pageBreakBefore: true, bossSection: bossSections.keyUpsideDrivers });
    const primaryConstraintSection = eliteChapter1Html ? "" : renderSafely("Primary Constraint / Review Disclosure", () => renderPrimaryConstraintSection({ acquisitionMemoProjection, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.primaryConstraintReviewDisclosure, omitWhenCollapsed: true });
    const legacyCommitteeOverviewHtml = `<section class="section">
        <div class="section-header"><span class="section-header-title">Executive Summary</span></div>
        ${executiveSummarySection}
      </section>
      ${metricsSection}
      ${keyUpsideDriversSection ? `<section class="section"><div class="section-header"><span class="section-header-title">Underwriting Observations</span></div>${keyUpsideDriversSection}</section>` : ""}
      ${primaryConstraintSection ? `<section class="section"><div class="section-header"><span class="section-header-title">Primary Constraint / Review Disclosure</span></div>${primaryConstraintSection}</section>` : ""}`;
    const committeeOverviewHtml = eliteChapter1Html || legacyCommitteeOverviewHtml;
    let eliteOperatingIntelligenceContract = null;
    let eliteOperatingIntelligenceHtml = "";
    if (sourceTruthPackage) {
      try {
        eliteOperatingIntelligenceContract = buildFullUnderwritingOperatingIntelligenceContract({
          sourceTruthPackage,
          customerSurfaceModel,
          coreMetrics,
          propertyProfile,
          reportMeta,
        });
        eliteOperatingIntelligenceHtml = renderFullUnderwritingOperatingIntelligenceHtml(eliteOperatingIntelligenceContract);
      } catch (eliteOperatingIntelligenceError) {
        console.warn("[investoriq] ELITE Operating Intelligence surface fallback", {
          message: eliteOperatingIntelligenceError?.message || String(eliteOperatingIntelligenceError || ""),
        });
      }
    }
    let eliteScenarioEngineContract = null;
    let eliteScenarioEngineHtml = "";
    if (sourceTruthPackage && eliteOperatingIntelligenceContract) {
      try {
        eliteScenarioEngineContract = buildFullUnderwritingScenarioEngineV1({
          sourceTruthPackage,
          operatingIntelligence: eliteOperatingIntelligenceContract,
          customerSurfaceModel,
          propertyProfile,
          reportMeta,
        });
        eliteScenarioEngineHtml = renderFullUnderwritingScenarioEngineV1Html(eliteScenarioEngineContract);
      } catch (eliteScenarioEngineError) {
        console.warn("[investoriq] ELITE Scenario Engine v1 surface fallback", {
          message: eliteScenarioEngineError?.message || String(eliteScenarioEngineError || ""),
        });
      }
    }
    let eliteDriverAnalysisContract = null;
    let eliteDriverAnalysisHtml = "";
    if (eliteScenarioEngineContract) {
      try {
        eliteDriverAnalysisContract = buildFullUnderwritingDriverAnalysisV1({
          scenarioEngine: eliteScenarioEngineContract,
          propertyProfile,
          reportMeta,
        });
        eliteDriverAnalysisHtml = renderFullUnderwritingDriverAnalysisV1Html(eliteDriverAnalysisContract);
      } catch (eliteDriverAnalysisError) {
        console.warn("[investoriq] ELITE Driver Analysis v1 surface fallback", {
          message: eliteDriverAnalysisError?.message || String(eliteDriverAnalysisError || ""),
        });
      }
    }
    let eliteTransactionDiligenceContract = null;
    let eliteTransactionDiligenceHtml = "";
    try {
      eliteTransactionDiligenceContract = buildFullUnderwritingTransactionDiligenceV1({
        customerSurfaceModel,
        propertyProfile,
        reportMeta,
      });
      eliteTransactionDiligenceHtml = renderFullUnderwritingTransactionDiligenceV1Html(eliteTransactionDiligenceContract);
    } catch (eliteTransactionDiligenceError) {
      console.warn("[investoriq] ELITE Transaction & Diligence v1 surface fallback", {
        message: eliteTransactionDiligenceError?.message || String(eliteTransactionDiligenceError || ""),
      });
    }
    let eliteDebtIntelligenceContract = null;
    let eliteDebtIntelligenceHtml = "";
    if (customerSurfaceModel) {
      try {
        eliteDebtIntelligenceContract = buildFullUnderwritingDebtIntelligenceV1({
          customerSurfaceModel,
          reportMeta,
          propertyProfile,
        });
        eliteDebtIntelligenceHtml = renderFullUnderwritingDebtIntelligenceV1Html(eliteDebtIntelligenceContract);
      } catch (eliteDebtIntelligenceError) {
        console.warn("[investoriq] ELITE Debt Intelligence v1 surface fallback", {
          message: eliteDebtIntelligenceError?.message || String(eliteDebtIntelligenceError || ""),
        });
      }
    }
    const unitMixSection = renderSafely("Unit Mix and Rent Positioning", () => renderUnitMixSection({ sourcePackage, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.unitMix });
    const legacyValueSensitivitySection = renderSafely("Rent Upside / Value Sensitivity", () => renderValueSensitivitySection({ sourcePackage, acquisitionMemoProjection, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.rentUpsideValueSensitivity });
    const capRateValueSection = renderSafely("Cap-Rate Value Indication", () => renderCapRateValueSection({ acquisitionMemoProjection, sourcePackage, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.capRateValueIndication });
    const eliteValuationReconciliationModel = buildFullUnderwritingValuationReconciliationV1({
      sourcePackage,
      coreMetrics,
      acquisitionMemoProjection,
      bossContract,
      customerSurfaceModel,
    });
    const eliteValuationReconciliationSection = renderFullUnderwritingValuationReconciliation(
      eliteValuationReconciliationModel,
      {
        reportCapRateSensitivityRendered:
          eliteScenarioEngineContract?.capRateValueSensitivity?.displayReady === true,
      }
    );
    const valueSensitivitySection = eliteValuationReconciliationSection ? "" : legacyValueSensitivitySection;
    const readinessSection = renderSafely("Preliminary Financing Readiness Summary", () => renderReadinessSection({ renderedAcquisitionMemo, acquisitionMemoProjection, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.preliminaryFinancingReadinessSummary });
    const acquisitionRequestSurfaceContract = bossSections.acquisitionRequestContext?.status !== "collapsed"
      ? bossSections.acquisitionRequestContext
      : bossSections.proposedFinancingContext;
    const acquisitionRequestContextSection = eliteTransactionDiligenceHtml
      ? ""
      : renderSafely("Acquisition Request Context", () => renderAcquisitionRequestContextSection({ acquisitionMemoProjection, sourcePackage, acquisitionTermsPayload, loanTermSheetTermsPayload, coreMetrics, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: acquisitionRequestSurfaceContract });
    const debtFinancingContextSection = eliteDebtIntelligenceHtml
      ? ""
      : renderSafely("Debt / Financing Context", () => renderDebtFinancingContextSection({ acquisitionMemoProjection, sourcePackage, loanTermSheetTermsPayload, mortgagePayload, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.debtFinancingContext });
    const debtServiceCoverageSection = !eliteDebtIntelligenceHtml && bossSections.debtServiceCoverage?.status === "required"
      ? renderSafely("Debt Service and Coverage", () => renderDebtServiceCoverageSection(customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.debtServiceCoverage })
      : "";
    const debtTermAnalysisSection = !eliteDebtIntelligenceHtml && bossSections.debtTermAnalysis?.status === "required"
      ? renderSafely("Debt Term and Maturity Analysis", () => renderDebtTermAnalysisSection(customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.debtTermAnalysis })
      : "";
    const debtCapacityAndCoverageSection = eliteDebtIntelligenceHtml
      ? ""
      : renderSafely("Debt Capacity and Coverage", () => renderDebtCapacityAndCoverageSection(customerSurfaceModel), { pageBreakBefore: true, bossSection: customerSurfaceModel?.sections?.debtCapacityAndCoverage || null });
    const coreReconciliationAnalysisSection = bossSections.coreReconciliation?.status === "required"
      ? renderSafely("Core Source Reconciliation", () => renderCoreReconciliationAnalysisSection(customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.coreReconciliation })
      : "";
    const capitalPlanAnalysisCandidate = bossSections.capitalPlanAnalysis?.status === "required"
      ? renderSafely("Capital Plan and Reserve Position", () => renderCapitalPlanAnalysisSection(customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.capitalPlanAnalysis })
      : "";
    const renovationContextSourceBacked =
      customerSurfaceModel?.sections?.renovationContext?.factAvailability?.sourceBacked === true;
    const capitalPlanAnalysisSection =
      renovationContextSourceBacked && /uploaded support context did not provide display-ready detail/i.test(capitalPlanAnalysisCandidate)
        ? renderSection(
            "Capital Plan and Reserve Position",
            `<p class="body-copy">Documented renovation and capital plan details are presented below. Reserve adequacy is not assessed because reserve balance and contribution inputs were not provided.</p>`,
            { pageBreakBefore: true }
          )
        : capitalPlanAnalysisCandidate;
    const appraisalContextSection = renderSafely("Appraisal / Valuation Context", () => renderAppraisalContextSection(customerSurfaceModel), { pageBreakBefore: false, bossSection: bossSections.appraisalContext, omitWhenCollapsed: true });
    const renovationContextSection = renderSafely("Renovation / CapEx Context", () => renderRenovationContextSection(customerSurfaceModel, { suppressSummary: Boolean(capitalPlanAnalysisSection) }), { pageBreakBefore: false, bossSection: bossSections.renovationContext, omitWhenCollapsed: true });
    const marketSurveyContextSection = renderSafely("Market Rent Survey Context", () => renderMarketSurveyContextSection(customerSurfaceModel), { pageBreakBefore: false, bossSection: bossSections.marketSurveyContext, omitWhenCollapsed: true });
    const environmentalContextSection = eliteTransactionDiligenceHtml
      ? ""
      : renderSafely("Environmental Due Diligence Context", () => renderEnvironmentalContextSection(customerSurfaceModel), { pageBreakBefore: false, bossSection: bossSections.environmentalContext, omitWhenCollapsed: true });
    const operatingStatementSection = renderSafely("Operating Statement / TTM Summary", () => renderOperatingStatementSection({ sourcePackage, t12Payload, coreMetrics, acquisitionMemoProjection, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.operatingStatementTTMSummary });
    const operatingVisualsSection = renderInstitutionalOperatingVisuals({ coreMetrics, sourcePackage, customerSurfaceModel });
    const debtVisualsSection = eliteDebtIntelligenceHtml ? "" : renderInstitutionalDebtVisuals(customerSurfaceModel);
    const dataCoverageSection = renderSafely("Data Coverage & Source Limitations", () => renderDataCoverageSection({ sourcePackage, renderedAcquisitionMemo, acquisitionMemoProjection, bossContract, customerSurfaceModel }), { pageBreakBefore: true, bossSection: bossSections.dataCoverageSourceLimitations });
    const treatmentSection = renderSafely("Source Context / Support Document Treatment", () => renderDocumentTreatmentSection(renderedAcquisitionMemo, sourcePackage, bossContract, customerSurfaceModel), { pageBreakBefore: true, bossSection: bossSections.sourceContextSupportDocumentTreatment });
    const methodologySection = renderSafely("Methodology & Data Transparency", () => renderMethodologySection(), { pageBreakBefore: true });
    let qualityManifestSection = "";
    if (sourceTruthPackage && customerSurfaceModel) {
      try {
        const qualityManifestContract = buildFullUnderwritingQualityManifestV1({
          sourceTruthPackage,
          customerSurfaceModel,
          financialIntelligence,
          scenarioEngine: eliteScenarioEngineContract,
          reportMeta,
          reportIdentity: UNDERWRITING_REPORT_IDENTITY,
          propertyProfile,
          replacementCoverage: {
            coreReconciliation:
              eliteChapter1Contract?.sourceReconciliationAlert?.displayReady === true,
            acquisitionRequestContext: Boolean(eliteTransactionDiligenceHtml),
            currentDebtContext: Boolean(eliteDebtIntelligenceHtml),
            debtServiceCoverage: Boolean(eliteDebtIntelligenceHtml),
            debtTermAnalysis: Boolean(eliteDebtIntelligenceHtml),
            debtCapacityAndCoverage: Boolean(eliteDebtIntelligenceHtml),
          },
        });
        qualityManifestSection = renderFullUnderwritingQualityManifestV1Html(qualityManifestContract);
      } catch (qualityManifestError) {
        console.warn("[investoriq] ELITE Quality Manifest surface fallback", {
          message: qualityManifestError?.message || String(qualityManifestError || ""),
        });
      }
    }
    const footerSection = `<div class="report-footer"><div class="report-footer-inner"><span>${escapeHtml(UNDERWRITING_REPORT_IDENTITY.fullTitle)} | Confidential</span><span>&copy; InvestorIQ Technologies Inc.</span></div></div>`;

    const fullUnderwritingCustomerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(`${UNDERWRITING_REPORT_IDENTITY.fullTitle} - ${propertyName}`)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>${INVESTORIQ_PUBLICATION_BASE_CSS}  </style>
</head>
<body data-iq-visual-system="institutional-v1" data-iq-design-system="elite-10a-global-v1" data-iq-composition="content-driven-v1">
    ${coverSection}
    <div class="report-container">
    ${headerStrip}
    <section class="institutional-chapter" data-iq-chapter="committee-overview">
      <div class="chapter-heading">Investment Committee Overview</div>
      ${committeeOverviewHtml}
    </section>
    <section class="institutional-chapter" data-iq-chapter="operating-performance">
      <div class="chapter-heading">Operating Performance</div>
      ${eliteOperatingIntelligenceHtml}
      ${operatingVisualsSection}
      ${unitMixSection}
      ${marketSurveyContextSection}
      ${operatingStatementSection ? `<section class="section"><div class="section-header"><span class="section-header-title">Operating Statement / TTM Summary</span></div>${operatingStatementSection}</section>` : ""}
      ${valueSensitivitySection}
    </section>
    ${eliteScenarioEngineHtml ? `<section class="institutional-chapter" data-iq-chapter="scenario-underwriting-drivers">
      <div class="chapter-heading">Scenario &amp; Underwriting Drivers</div>
      ${eliteScenarioEngineHtml}
      ${eliteDriverAnalysisHtml}
    </section>` : ""}
    <section class="institutional-chapter" data-iq-chapter="transaction-context">
      <div class="chapter-heading">Transaction Context</div>
      ${eliteTransactionDiligenceHtml}
      ${acquisitionRequestContextSection}
      ${readinessSection}
      ${environmentalContextSection}
    </section>
    <section class="institutional-chapter" data-iq-chapter="debt-capital-structure">
      <div class="chapter-heading">Debt &amp; Capital Structure</div>
      ${eliteDebtIntelligenceHtml}
      ${debtFinancingContextSection}
      ${debtServiceCoverageSection}
      ${debtVisualsSection}
      ${debtTermAnalysisSection}
      ${debtCapacityAndCoverageSection}
      <div class="iq-capital-plan-group">
      ${capitalPlanAnalysisSection}
      ${renovationContextSection}
      </div>
    </section>
    <section class="institutional-chapter" data-iq-chapter="valuation-reconciliation">
      <div class="chapter-heading">Valuation &amp; Reconciliation</div>
      ${eliteValuationReconciliationSection || (capRateValueSection ? `<section class="section"><div class="section-header"><span class="section-header-title">Cap-Rate Value Indication</span></div>${capRateValueSection}</section>` : "")}
      ${eliteValuationReconciliationModel?.appraisalComparison?.supported ? "" : appraisalContextSection}
      ${coreReconciliationAnalysisSection}
    </section>
    <section class="institutional-chapter" data-iq-chapter="source-appendix">
      <div class="chapter-heading">Source Appendix</div>
      ${dataCoverageSection}
      ${treatmentSection}
      ${methodologySection}
      ${qualityManifestSection}
    </section>
    ${footerSection}
  </div>
</body>
</html>`;
    return sanitizeFullUnderwritingCustomerHtml(fullUnderwritingCustomerHtml);
  } catch (err) {
    console.warn("[investoriq] full underwriting representation render fallback", {
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
