import {
  escapeHtml,
  formatCurrency,
  formatPercent1,
  formatMultiple,
  formatInterestRatePercent,
  formatYears,
  formatCapPercentExact,
  replaceAll,
} from "./report-formatting-helpers.js";
import {
  buildSourceReconciliationRenderState,
  buildSourceReconciliationNarrativeProminencePolicy,
  resolveCanonicalRentRollAnnualTotals,
} from "./report-surface-contracts.js";
import {
  stripMarkedSection,
  stripT12DetailSubsection,
  stripEmptyHeadingBlocks,
  stripChartBlockByAlt,
} from "./report-html-helpers.js";

const DATA_NOT_AVAILABLE = "Not assessed";

const coerceNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[$,]/g, "").replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

function resolveOccupancyNoteValue(computedRentRoll = null, rentRollPayload = null) {
  return coerceNumber(
    computedRentRoll?.occupancy ??
      computedRentRoll?.occupancy_rate ??
      rentRollPayload?.occupancy ??
      rentRollPayload?.occupancy_rate ??
      rentRollPayload?.totals?.occupancy
  );
}

function deriveOccFromRentRollUnits(rentRollPayload) {
  const units = Array.isArray(rentRollPayload?.units) ? rentRollPayload.units : [];
  if (!units.length) return null;
  const occupied = units.filter((row) => {
    const status = String(row?.status || row?.occupancy_status || row?.state || "").trim().toLowerCase();
    return status ? /occupied|leased|tenanted/.test(status) : false;
  }).length;
  const total = units.length;
  return total > 0 ? occupied / total : null;
}

function resolveCanonicalT12GprValue(t12Payload = null) {
  return coerceNumber(
    t12Payload?.gross_potential_rent ??
      t12Payload?.gross_potential_income ??
      t12Payload?.gross_potential_rental_income ??
      t12Payload?.gpr ??
      t12Payload?.annual_gross_potential_rent
  );
}

export function buildT12PerUnitRows(t12EgiValue = null, t12TotalExpensesValue = null, t12NoiValue = null, rrUnits = null, formatCurrencyFn = formatCurrency) {
  const unitCount = Number.isFinite(Number(rrUnits)) ? Number(rrUnits) : null;
  const divisor = Math.max(1, Number(unitCount) || 1);
  const rows = [];
  if (Number.isFinite(t12EgiValue)) {
    rows.push(`<tr><td>EGI / Unit</td><td>${formatCurrencyFn(t12EgiValue / divisor)}</td></tr>`);
  }
  if (Number.isFinite(t12TotalExpensesValue)) {
    rows.push(`<tr><td>OpEx / Unit</td><td>${formatCurrencyFn(t12TotalExpensesValue / divisor)}</td></tr>`);
  }
  if (Number.isFinite(t12NoiValue)) {
    rows.push(`<tr><td>NOI / Unit</td><td>${formatCurrencyFn(t12NoiValue / divisor)}</td></tr>`);
  }
  return rows.join("");
}

function isEligiblePositiveIncomeDriver(row) {
  const label = String(row?.label || "").trim();
  const amount = coerceNumber(row?.amount);
  if (!label || !Number.isFinite(amount) || amount <= 0) return false;
  return !/\b(?:Effective Gross Income|EGI|Gross Potential Rent|GPR|Total Income|Net Operating Income|NOI|subtotal|total|vacancy|loss|concession|bad debt|collection loss)\b/i.test(label);
}

function isEligiblePositiveExpenseDriver(row) {
  const label = String(row?.label || "").trim();
  const amount = coerceNumber(row?.amount);
  if (!label || !Number.isFinite(amount) || amount <= 0) return false;
  return !/\b(?:Total Operating Expenses|Total Expenses|subtotal|total|Effective Gross Income|EGI|Gross Potential Rent|GPR|NOI)\b/i.test(label);
}

function buildScreeningUnitMixRows(unitMix = [], totalUnits = null, formatValue = formatCurrency) {
  const rows = Array.isArray(unitMix) ? unitMix : [];
  const total = Number(totalUnits);
  return rows
    .map((row) => {
      const unitType = String(row?.unit_type ?? row?.name ?? row?.label ?? "").trim();
      if (!unitType) return "";
      const unitCount = Number(row?.unit_count ?? row?.count);
      const share = Number.isFinite(unitCount) && Number.isFinite(total) && total > 0
        ? `${((unitCount / total) * 100).toFixed(1)}%`
        : "";
      const inPlace = coerceNumber(row?.avg_in_place_rent ?? row?.in_place_rent);
      const market = coerceNumber(row?.avg_market_rent ?? row?.market_rent);
      const avgSqft = coerceNumber(row?.avg_sqft);
      return `<tr><td>${escapeHtml(unitType)}</td><td>${Number.isFinite(unitCount) ? unitCount : ""}</td><td>${share}</td><td>${Number.isFinite(inPlace) ? formatValue(inPlace) : ""}</td><td>${Number.isFinite(market) ? formatValue(market) : ""}</td><td>${Number.isFinite(avgSqft) ? avgSqft.toLocaleString("en-CA", { maximumFractionDigits: 0 }) : ""}</td></tr>`;
    })
    .filter(Boolean)
    .join("");
}

function buildScreeningExecVerdictExpansion({
  computedRentRoll = null,
  rentRollPayload = null,
  screeningVisibleClassificationForConsumers = "",
  expenseRatioR = null,
  noiMarginR = null,
  breakEvenOccR = null,
  sourceReconciliationNarrativePolicy = null,
  hasSourceReconciliationVariance = false,
  screeningExplanation = "",
} = {}) {
  const rrOccNow = coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload));
  const rrInPlace = coerceNumber(computedRentRoll?.total_in_place_annual ?? computedRentRoll?.annual_in_place_rent);
  const rrMarket = coerceNumber(computedRentRoll?.total_market_annual ?? computedRentRoll?.annual_market_rent);
  const rrUpsidePct = coerceNumber(computedRentRoll?.rent_to_market_gap) ??
    (Number.isFinite(rrInPlace) && Number.isFinite(rrMarket) && rrInPlace > 0 ? (rrMarket - rrInPlace) / rrInPlace : null);
  const erPctStr = Number.isFinite(expenseRatioR) ? `${(expenseRatioR * 100).toFixed(1)}%` : null;
  const nmPctStr = Number.isFinite(noiMarginR) ? `${(noiMarginR * 100).toFixed(1)}%` : null;
  const parts = [];
  if (Number.isFinite(rrOccNow)) parts.push(`The property is ${formatPercent1(rrOccNow)} occupied`);
  if (Number.isFinite(rrUpsidePct) && rrUpsidePct > 0) parts.push(`carries reported rent-to-market upside of ${formatPercent1(rrUpsidePct)}`);
  let thesisText = parts.length > 0 ? `${parts.join(" and ")}. ` : "";
  if (screeningVisibleClassificationForConsumers === "Sensitized" && erPctStr && nmPctStr) {
    thesisText += `NOI margin compression to ${nmPctStr}, primarily attributable to a ${erPctStr} expense ratio, supports a Sensitized classification. Operating improvement sensitivity is tied to expense-ratio reduction and the observed rent-to-market gap.`;
  } else if (screeningVisibleClassificationForConsumers === "Fragile" && erPctStr) {
    thesisText += `An expense ratio of ${erPctStr} and compressed margins classify the profile as Fragile. Material operational improvement is required.`;
  } else if (screeningVisibleClassificationForConsumers === "Stable") {
    thesisText += "Operating results remain stable based on uploaded operating data.";
  } else if (screeningExplanation) {
    thesisText += screeningExplanation;
  }
  const frameworkNote =
    sourceReconciliationNarrativePolicy?.data_coverage_required === true && hasSourceReconciliationVariance
      ? "Source reconciliation disclosure remains active. Variance-sensitive conclusions should be treated as constrained until T12 and rent roll evidence reconcile."
      : "Signals are derived deterministically from uploaded operating evidence only. No financing, debt sizing, or return projection modules are included.";
  const frameworkCard = `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Framework Note</p><p style="font-size:11px;line-height:1.6;color:#374151;margin:0 0 6px 0;">${escapeHtml(frameworkNote)}</p><p class="small" style="color:#64748b;font-style:italic;">Advanced financing and return-projection modules are outside the Screening Report scope.</p></div>`;
  const thesisCard = thesisText
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Operating Summary</p><p style="font-size:11px;line-height:1.6;color:#374151;margin:0 0 6px 0;">${escapeHtml(thesisText)}</p><p class="small" style="color:#64748b;font-style:italic;">All statements derive from reported metrics and standardized classification thresholds. No forward-looking projections.</p></div>`
    : "";
  return `${frameworkCard}${thesisCard}`;
}

function buildScreeningExecClassificationRationale({
  reportMode = "screening_v1",
  screeningVisibleClassificationForConsumers = "",
  expenseRatioR = null,
  noiMarginR = null,
  breakEvenOccR = null,
  screeningExplanation = "",
  screeningClass = "",
} = {}) {
  if (reportMode !== "screening_v1") return "";
  const erStr = Number.isFinite(expenseRatioR) ? formatPercent1(expenseRatioR) : null;
  const nmStr = Number.isFinite(noiMarginR) ? formatPercent1(noiMarginR) : null;
  const beoStr = Number.isFinite(breakEvenOccR) ? formatPercent1(breakEvenOccR) : null;
  if (screeningVisibleClassificationForConsumers === "Stable") {
    const parts = [];
    if (erStr) parts.push(`expense ratio of ${erStr}`);
    if (nmStr) parts.push(`NOI margin of ${nmStr}`);
    if (beoStr) parts.push(`break-even occupancy of ${beoStr}`);
    return parts.length > 0
      ? `Classified STABLE: ${parts.join(", ")} are within institutional operating thresholds.`
      : "Classified STABLE: operating metrics remain within defined screening thresholds.";
  }
  if (screeningVisibleClassificationForConsumers === "Sensitized") {
    const breaches = [];
    if (Number.isFinite(expenseRatioR) && expenseRatioR > 0.55 && erStr) breaches.push(`elevated operating expense burden (${erStr}) breaches the sensitized threshold`);
    if (Number.isFinite(noiMarginR) && noiMarginR < 0.45 && nmStr) breaches.push(`compressed NOI margin (${nmStr}) breaches the sensitized threshold`);
    if (Number.isFinite(breakEvenOccR) && breakEvenOccR > 0.75 && beoStr) breaches.push(`break-even occupancy of ${beoStr} exceeds the 75.0% sensitized threshold`);
    return breaches.length > 0
      ? `Operating profile classified as SENSITIZED: ${breaches.join("; ")}.`
      : `Operating profile classified as SENSITIZED: ${screeningExplanation}`;
  }
  if (screeningVisibleClassificationForConsumers === "Fragile") {
    const breaches = [];
    if (Number.isFinite(expenseRatioR) && expenseRatioR > 0.65 && erStr) breaches.push(`expense ratio of ${erStr} breaches the 65.0% fragile threshold`);
    if (Number.isFinite(noiMarginR) && noiMarginR < 0.35 && nmStr) breaches.push(`NOI margin of ${nmStr} is critically compressed`);
    if (Number.isFinite(breakEvenOccR) && breakEvenOccR > 0.85 && beoStr) breaches.push(`break-even occupancy of ${beoStr} breaches the 85.0% fragile threshold`);
    return breaches.length > 0
      ? `Classified FRAGILE: ${breaches.join("; ")}.`
      : `Classified FRAGILE: ${screeningExplanation}`;
  }
  if (screeningVisibleClassificationForConsumers === "Review - Source Reconciliation Disclosure") {
    return "Classification is capped by source reconciliation disclosure pending reconciliation of rent roll and T12 evidence.";
  }
  if (screeningVisibleClassificationForConsumers === "Review - Insufficient Core Support") {
    return "Classification is capped by insufficient core support. Required core operating evidence remains incomplete.";
  }
  if (screeningClass === "Insufficient Data") {
    return "Insufficient operating data to determine classification.";
  }
  return "";
}

function buildScreeningUpsidePathwayHtml({
  computedRentRoll = null,
  rentRollPayload = null,
  formatCurrency,
  rrUnits = null,
} = {}) {
  const totalUnits = Number.isFinite(Number(rrUnits))
    ? Number(rrUnits)
    : coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units);
  const annualTotals = resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
  const annualInPlace = coerceNumber(annualTotals?.in_place?.value ?? computedRentRoll?.total_annual_in_place);
  const annualMarket = coerceNumber(annualTotals?.market?.value ?? computedRentRoll?.total_annual_market);
  if (!Number.isFinite(annualInPlace) || annualInPlace <= 0 || !Number.isFinite(annualMarket) || annualMarket <= annualInPlace) {
    return "";
  }
  const annualGap = annualMarket - annualInPlace;
  const capRates = [5.0, 6.0, 7.0];
  const capRows = capRates.map((cap) => {
    const impliedLift = annualGap / (cap / 100);
    return `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">${cap.toFixed(1)}% cap rate</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">${formatCurrency(impliedLift)}</td></tr>`;
  }).join("");
  const unitLabel = Number.isFinite(totalUnits) && totalUnits > 0 ? `${totalUnits.toLocaleString("en-CA")} units` : "current unit mix";
  return `<div class="no-break" style="margin-top:20px;border-top:1px solid #E5E7EB;padding-top:16px;"><p class="subsection-title" style="margin-bottom:8px;">Rent Upside Pathway: Mark-to-Market Analysis</p><div class="grid-2"><div><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Annual In-Place Rent</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(annualInPlace)}</td></tr><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Annual Market Rent</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(annualMarket)}</td></tr><tr style="background:#FEFCE8;font-weight:700;"><td style="padding:4px 8px;border:1px solid #E5E7EB;color:#B8860B;">Annual Gross Rent Upside</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;color:#B8860B;">${formatCurrency(annualGap)}</td></tr></tbody></table><p class="small" style="margin-top:6px;">Source-bound summary for ${escapeHtml(unitLabel)} only. No debt sizing, refinance, or return recommendation is implied.</p></div><div><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Implied Value Sensitivity at Stabilization</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${capRows}</tbody></table><p class="small" style="margin-top:6px;">Implied value sensitivity reflects annual rent gap capitalized at the selected cap-rate assumption and remains conditional on market-rent capture and occupancy.</p></div></div></div>`;
}

export function resolveScreeningClassificationConsumerLabel({
  canonicalVisibleLabel = "",
  localVisibleLabel = "",
  screeningClass = "",
} = {}) {
  const approvedLabels = new Set([
    "Stable",
    "Sensitized",
    "Fragile",
    "Review - Source Reconciliation Disclosure",
    "Review - Insufficient Core Support",
    "Review - Debt Coverage Constraint",
  ]);
  const canonical = String(canonicalVisibleLabel || "").trim();
  if (approvedLabels.has(canonical)) return canonical;
  const local = String(localVisibleLabel || "").trim();
  if (approvedLabels.has(local)) return local;
  const screening = String(screeningClass || "").trim();
  if (approvedLabels.has(screening)) return screening;
  return "";
}

export function sanitizeScreeningRankedDriversHtml(html) {
  if (typeof html !== "string") return html;
  const sectionPattern = /<!-- BEGIN EXEC_RANKED_DRIVERS -->([\s\S]*?)<!-- END EXEC_RANKED_DRIVERS -->/g;
  return html.replace(sectionPattern, (_full, body) => {
    if (typeof body !== "string" || !body.trim()) return "";
    let nextBody = body.replace(/<li>([\s\S]*?)<\/li>/gi, (row, inner) => {
      const plain = String(inner || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!plain) return "";
      if (
        /^\d+\.\s*:\s*\(trigger:\s*\)$/i.test(plain) ||
        /^:\s*\(trigger:\s*\)$/i.test(plain) ||
        /^\(trigger:\s*\)$/i.test(plain) ||
        /^:$/i.test(plain)
      ) {
        return "";
      }
      return row;
    });
    nextBody = nextBody.replace(/<ol>\s*<\/ol>/gi, "");
    const hasValidRow = /<li>[\s\S]*?<\/li>/i.test(nextBody);
    return hasValidRow ? `<!-- BEGIN EXEC_RANKED_DRIVERS -->${nextBody}<!-- END EXEC_RANKED_DRIVERS -->` : "";
  });
}

export function buildScreeningRefiSufficiencyTable({
  financials,
  t12Payload,
  currentDebtAssessmentState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
} = {}) {
  const f = financials && typeof financials === "object" ? financials : {};
  const rows = [
    {
      label: "NOI (base)",
      present: Number.isFinite(coerceNumber(t12Payload?.net_operating_income)),
      value: Number.isFinite(coerceNumber(t12Payload?.net_operating_income))
        ? formatCurrency(coerceNumber(t12Payload?.net_operating_income))
        : " - ",
    },
  ];
  const rowsHtml = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td>${row.present ? "Present" : "Missing"}</td><td>${row.value}</td></tr>`
    )
    .join("");
  const title =
    currentDebtAssessmentState?.has_true_current_debt_balance === true ||
    String(loanTermSheetTermsPayload?.debt_basis || "").toLowerCase().includes("acquisition")
      ? "Advanced financing sufficiency not produced due to insufficient inputs."
      : "Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided.";
  return `<p>${title}</p><table><thead><tr><th>Input</th><th>Status</th><th>Provided Value</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="small">This sufficiency check verifies whether required inputs are present in uploaded documents. Missing required inputs prevent advanced financing analysis.</p>`;
}

export function buildFinancingEnvelopeGrid(noi, units, { formatCurrency, escapeHtml } = {}) {
  if (!Number.isFinite(noi) || noi <= 0) return "";
  if (typeof formatCurrency !== "function" || typeof escapeHtml !== "function") return "";
  const dscrTargets = [
    { label: "1.10x (CMHC / Insured)", value: 1.10 },
    { label: "1.25x (Conventional)", value: 1.25 },
    { label: "1.35x (Conservative)", value: 1.35 },
  ];
  const rateScenarios = [5.5, 6.5, 7.5];
  const n = 25 * 12;
  function maxLoanAtRate(annualRatePct, dscrTarget) {
    const monthlyDS = noi / dscrTarget / 12;
    const r = annualRatePct / 100 / 12;
    return monthlyDS * (1 - Math.pow(1 + r, -n)) / r;
  }
  const headerCells = rateScenarios.map((r) => `<th>${r.toFixed(2)}% Rate</th>`).join("");
  const bodyRows = dscrTargets
    .map(({ label, value }) => {
      const cells = rateScenarios
        .map((r) => `<td>${formatCurrency(maxLoanAtRate(r, value))}</td>`)
        .join("");
      return `<tr><td><strong>${escapeHtml(label)}</strong></td>${cells}</tr>`;
    })
    .join("");
  const unitsNote = Number.isFinite(units) && units > 0 ? `, ${units} units` : "";
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Maximum Financing Envelope (Standardized Framework)</p><p class="small" style="margin-bottom:8px;">Maximum supportable loan principal at each DSCR threshold and interest rate. Anchor: reported NOI of <strong>${formatCurrency(noi)}</strong>${escapeHtml(unitsNote)}. Uses standardized 25-year amortization input.</p><div class="base-case-financing"><strong>Base Case Supportable Loan (6.50% Rate, 1.25x DSCR):</strong> ${formatCurrency(maxLoanAtRate(6.5, 1.25))}</div><table><thead><tr><th>DSCR Threshold</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><div class="financing-interpretation">At 6.50% interest and 1.25x DSCR, the reported NOI supports the principal shown above. Financing capacity declines as interest rates increase or DSCR requirements tighten. Grid reflects standardized framework thresholds only.</div><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Interest rates and DSCR thresholds are standardized framework inputs, not document-sourced. Grid shows maximum financing supportable by the reported NOI at each scenario.</p></div>`;
}

export function buildScreeningDataCoverageSummary({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  financials,
  effectiveReportMode,
  supportingUnderwritingDocsUsed = false,
  hasUploadedFiles = false,
  documentSources = [],
  currentDebtAssessmentState = null,
  sourceReconciliationState = null,
  sectionEligibility = null,
  dataCoverageState = null,
  optionalSectionState = null,
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
  const canonicalGpr = resolveCanonicalT12GprValue(t12Payload);
  const t12Checks = [
    { label: "gross_potential_rent", present: Number.isFinite(canonicalGpr) },
    { label: "effective_gross_income", present: Number.isFinite(coerceNumber(t12Payload?.effective_gross_income)) },
    { label: "total_operating_expenses", present: Number.isFinite(coerceNumber(t12Payload?.total_operating_expenses)) },
    { label: "net_operating_income", present: Number.isFinite(coerceNumber(t12Payload?.net_operating_income)) },
  ];
  const t12PresentCount = t12Checks.filter((entry) => entry.present).length;
  const t12CoveragePct = ((t12PresentCount / t12Checks.length) * 100).toLocaleString("en-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const t12Missing = t12Checks.filter((entry) => !entry.present).map((entry) => entry.label);
  const rentRollRows = Array.isArray(rentRollPayload?.units) && rentRollPayload.units.length > 0
    ? rentRollPayload.units
    : Array.isArray(computedRentRoll?.unit_mix)
      ? computedRentRoll.unit_mix
      : Array.isArray(rentRollPayload?.unit_mix)
        ? rentRollPayload.unit_mix
        : [];
  const totalUnitsPresent = Number.isFinite(coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units));
  const isPartialRentRollSample = computedRentRoll?.is_partial_sample === true || rentRollPayload?.is_partial_sample === true;
  const rrOccPresent = Number.isFinite(coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload))) ||
    (!isPartialRentRollSample && Number.isFinite(deriveOccFromRentRollUnits(rentRollPayload)));
  const inPlacePresent =
    Number.isFinite(coerceNumber(computedRentRoll?.total_in_place_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.in_place_rent_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.in_place_rent_monthly)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.current_rent_monthly)) ||
    (Array.isArray(rentRollRows) ? rentRollRows.some((row) => Number.isFinite(coerceNumber(row?.in_place_rent ?? row?.current_rent))) : false);
  const marketPresent =
    Number.isFinite(coerceNumber(computedRentRoll?.total_market_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.market_rent_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.market_rent_monthly)) ||
    (Array.isArray(rentRollRows) ? rentRollRows.some((row) => Number.isFinite(coerceNumber(row?.market_rent))) : false);
  const rentRollChecks = [
    { label: "total_units", present: totalUnitsPresent },
    { label: "in_place_rent", present: inPlacePresent },
    { label: "market_rent", present: marketPresent },
    { label: "Occupancy / unit status (occupied/vacant) or occupied/total summary", present: rrOccPresent },
  ];
  const rrPresentCount = rentRollChecks.filter((entry) => entry.present).length;
  const rrCoveragePct = ((rrPresentCount / rentRollChecks.length) * 100).toLocaleString("en-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rrMissing = rentRollChecks.filter((entry) => !entry.present).map((entry) => entry.label);
  const missingInputs = [...t12Missing, ...rrMissing];
  const suggestionHtml = [
    t12Missing.length > 0 ? "Trailing-12 Operating Statement (T12) with EGI, OpEx, NOI" : null,
    (rrMissing.includes("in_place_rent") || rrMissing.includes("market_rent")) ? "Current Rent Roll with in-place & market rents" : null,
    !rrOccPresent ? "Rent Roll with unit status (occupied/vacant) or occupied/total summary" : null,
  ]
    .filter(Boolean)
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join("");
  const nextBestUploadsHtml = suggestionHtml ? `<p class="subsection-title" style="margin-top:6px;">Next Best Document Uploads</p><ul>${suggestionHtml}</ul>` : "";
  const allPresent = missingInputs.length === 0;
  const sourceReconciliationRequired = Boolean(buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState).data_coverage_required);
  const sourceConstrainedSectionCount = Number(dataCoverageState?.sectionConstrainedCount ?? sectionEligibility?.source_constrained_section_count ?? 0);
  const explicitScreeningSourceLimitedDisclosure = sectionEligibility?.source_limited_disclosure_required === true || sectionEligibility?.screening_source_limited_disclosure_required === true;
  const explicitUnderwritingSourceLimitedDisclosure = sectionEligibility?.source_limited_disclosure_required === true;
  const sourceLimitedDisclosureRequired = effectiveReportMode === "screening_v1"
    ? explicitScreeningSourceLimitedDisclosure || (sourceConstrainedSectionCount > 0 && !allPresent)
    : explicitUnderwritingSourceLimitedDisclosure;
  const suppressVerifiedCoverageCopy = sourceReconciliationRequired || sourceLimitedDisclosureRequired;
  const reconciliationCoverageHeadline = sourceReconciliationRequired
    ? "CORE INPUTS EXTRACTED - SOURCE RECONCILIATION DISCLOSURE"
    : sourceLimitedDisclosureRequired
      ? "CORE INPUTS EXTRACTED - SOURCE LIMITATIONS DISCLOSURE"
      : null;
  const disclosureCoverageBody = sourceReconciliationRequired
    ? "Required T12 and rent roll fields were extracted, but rent roll and T12 remain materially unreconciled. Review the Source Reconciliation disclosure before relying on variance-sensitive conclusions."
    : "Required core fields were extracted, but one or more underwriting sections remain source-constrained based on uploaded support documents.";
  const fieldCompletenessClarification = sourceReconciliationRequired
    ? `<p style="margin:8px 0 0 0;color:#374151;font-size:11px;">Field extraction completeness does not imply cross-source reconciliation. The T12 and rent roll fields were extracted, but the income scale variance remains unresolved.</p>`
    : "";
  const coverageTableHtml = `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Dataset</th><th style="text-align:center;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Fields Present</th><th style="text-align:center;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Coverage</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Missing</th></tr></thead><tbody><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">T12 Operating Statement</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${t12PresentCount}/${t12Checks.length}</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;color:#1e293b;">${t12CoveragePct}%</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(t12Missing.join(", ") || "None")}</td></tr><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Rent Roll</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${rrPresentCount}/${rentRollChecks.length}</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;color:#1e293b;">${rrCoveragePct}%</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(rrMissing.join(", ") || "None")}</td></tr></tbody></table>`;
  const sourceReliabilityRows = [
    `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">T12 Operating Statement</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Core quantitative source</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">EGI, OpEx, and NOI</td></tr>`,
    `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Rent Roll</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Core quantitative source</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Units, occupancy, in-place rent, and market rent</td></tr>`,
    effectiveReportMode === "v1_core"
      ? `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Support documents</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Context only unless validated</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Corroborating support, not an override for modeled core inputs</td></tr>`
      : `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Unsupported inputs</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Omitted</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Missing or unsupported items are not inferred</td></tr>`,
  ].join("");
  const sourceReliabilityFooter = effectiveReportMode === "screening_v1"
    ? "Advanced financing and return-projection modules are outside the Screening Report scope."
    : "Advanced financing and return-projection modules remain deferred unless explicitly supported by the report family and verified source basis.";
  const sourceReliabilityHtml = `<div style="margin-top:10px;"><p class="subsection-title">Data Coverage / Source Reliability</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Source</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Treatment</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Use</th></tr></thead><tbody>${sourceReliabilityRows}</tbody></table><p class="small" style="margin:6px 0 0 0;color:#64748b;">${escapeHtml(sourceReliabilityFooter)}</p></div>`;
  if (allPresent) {
    if (effectiveReportMode === "screening_v1") {
      return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">${suppressVerifiedCoverageCopy ? reconciliationCoverageHeadline : "CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Fully Verified"}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(suppressVerifiedCoverageCopy ? disclosureCoverageBody : "All required screening inputs were fully extracted from uploaded documents.")}</p>${coverageTableHtml}${sourceReliabilityHtml}${fieldCompletenessClarification}</div>`;
    }
    if (effectiveReportMode === "v1_core") {
      const memoCoverageCopy = sourceReconciliationRequired
        ? "T12 and Rent Roll core fields were extracted, but they remain materially unreconciled. Review the Source Context / Support Document Treatment section before relying on variance-sensitive conclusions."
        : "Core operating inputs (T12 and Rent Roll) were fully verified. Optional support documents are listed for context and auditability only unless explicitly validated for quantitative use.";
      const optionalSupportCopy = "Optional or support documents remain qualitative/context-only unless they are explicitly validated and bound to a modeled input.";
      const sectionEligibilityCopy = (
        Number(optionalSectionState?.renovationEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.appraisalEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.marketSurveyEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.environmentalEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.zoningEligibility?.source_constrained ? 1 : 0)
      ) > 0 || sourceConstrainedSectionCount > 0
        ? "Optional underwriting sections are source-constrained where supporting inputs were not verified."
        : "";
      return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">${suppressVerifiedCoverageCopy ? reconciliationCoverageHeadline : "CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified"}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(suppressVerifiedCoverageCopy ? disclosureCoverageBody : memoCoverageCopy)}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(optionalSupportCopy)}</p>${sectionEligibilityCopy ? `<p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(sectionEligibilityCopy)}</p>` : ""}${coverageTableHtml}${sourceReliabilityHtml}${fieldCompletenessClarification}</div>`;
    }
    const currentDebtCoverageCopy = "Structured T12, rent roll, and supporting documents are listed where available. Unsupported or unstructured uploads remain excluded from modeled outputs.";
    const reconciliationCopy = sourceReconciliationState?.source_reconciliation_disclosure;
    const sectionEligibilityCopy = (
      Number(optionalSectionState?.renovationEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.appraisalEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.marketSurveyEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.environmentalEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.zoningEligibility?.source_constrained ? 1 : 0)
    ) > 0 || sourceConstrainedSectionCount > 0
      ? "Optional underwriting sections are source-constrained where supporting inputs were not verified."
      : "";
    const treatmentSummaryHtml = `<div><p class="small">Document Treatment Summary is owned by the Screening lane.</p></div>`;
    return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">${suppressVerifiedCoverageCopy ? reconciliationCoverageHeadline : "CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified"}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(suppressVerifiedCoverageCopy ? disclosureCoverageBody : currentDebtCoverageCopy)}</p>${reconciliationCopy ? `<p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(reconciliationCopy)}</p>` : ""}${sectionEligibilityCopy ? `<p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(sectionEligibilityCopy)}</p>` : ""}<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${treatmentSummaryHtml}<!-- END DOCUMENT_TREATMENT_SUMMARY -->${coverageTableHtml}${fieldCompletenessClarification}</div>${hasUploadedFiles ? `<p class="small" style="margin-top:8px;">Uploaded files are listed separately; only structured inputs are used quantitatively.</p>` : ""}`;
  }
  return `<p>Coverage is measured deterministically from uploaded T12 and rent roll inputs only.</p>${coverageTableHtml}${sourceReliabilityHtml}${nextBestUploadsHtml}<p class="small">Sections not supported by minimum verified source coverage were intentionally withheld from analysis.</p>`;
}

export function buildScreeningIncomeForensicsHtml({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
  sourceReconciliationState = null,
} = {}) {
  const toRows = (collection) => {
    if (!collection) return [];
    if (Array.isArray(collection)) {
      return collection
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const label = String(entry.line_item ?? entry.label ?? entry.name ?? entry.item ?? "").trim();
          const amount = coerceNumber(entry.amount ?? entry.value ?? entry.ttm ?? entry.total);
          if (!label || !Number.isFinite(amount)) return null;
          return { label, amount };
        })
        .filter(Boolean);
    }
    if (typeof collection === "object") {
      return Object.entries(collection)
        .map(([key, value]) => {
          if (value && typeof value === "object") {
            const label = String(value.line_item ?? value.label ?? value.name ?? key ?? "").trim();
            const amount = coerceNumber(value.amount ?? value.value ?? value.ttm ?? value.total);
            if (!label || !Number.isFinite(amount)) return null;
            return { label, amount };
          }
          const amount = coerceNumber(value);
          const label = String(key ?? "").trim();
          if (!label || !Number.isFinite(amount)) return null;
          return { label, amount };
        })
        .filter(Boolean);
    }
    return [];
  };
  const incomeLinesRaw = Array.isArray(t12Payload?.income_lines) ? t12Payload.income_lines : t12Payload?.income_breakdown ? t12Payload.income_breakdown : Array.isArray(t12Payload?.line_items) ? t12Payload.line_items.filter((entry) => String(entry?.category ?? "").trim().toLowerCase() === "income") : [];
  const expenseLinesRaw = Array.isArray(t12Payload?.expense_lines) ? t12Payload.expense_lines : Array.isArray(t12Payload?.expense_breakdown) ? t12Payload.expense_breakdown : t12Payload?.expense_breakdown && typeof t12Payload.expense_breakdown === "object" ? Object.entries(t12Payload.expense_breakdown).map(([label, amount]) => ({ label, amount })) : Array.isArray(t12Payload?.line_items) ? t12Payload.line_items.filter((entry) => String(entry?.category ?? "").trim().toLowerCase() === "expense") : [];
  const incomeLines = toRows(incomeLinesRaw).filter(isEligiblePositiveIncomeDriver).sort((a, b) => b.amount - a.amount).slice(0, 3);
  const expenseLines = toRows(expenseLinesRaw).filter(isEligiblePositiveExpenseDriver).sort((a, b) => b.amount - a.amount).slice(0, 3);
  const canonicalAnnualTotals = resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
  const annualInPlace = coerceNumber(canonicalAnnualTotals?.in_place?.value);
  const annualMarket = coerceNumber(canonicalAnnualTotals?.market?.value);
  const upsideCard = Number.isFinite(annualInPlace) && Number.isFinite(annualMarket) && annualMarket > annualInPlace && annualInPlace > 0
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Revenue Upside Quantification</p><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr><tr><td>Annual Market Rent (100% Occupancy)</td><td>${formatCurrency(annualMarket)}</td></tr><tr><td>Gross Rent Upside</td><td>${formatCurrency(annualMarket - annualInPlace)} (${(((annualMarket - annualInPlace) / annualInPlace) * 100).toFixed(1)}%)</td></tr></tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">All values document derived from uploaded rent roll. Market rents as stated in document.</p></div>`
    : "";
  if (incomeLines.length === 0 && expenseLines.length === 0) {
    const egi = coerceNumber(t12Payload?.effective_gross_income);
    const opex = coerceNumber(t12Payload?.total_operating_expenses);
    const noi = coerceNumber(t12Payload?.net_operating_income);
    const summaryRows = [[ "Effective Gross Income (TTM)", egi ], [ "Total Operating Expenses (TTM)", opex ], [ "Net Operating Income (TTM)", noi ]].filter(([, v]) => Number.isFinite(v)).map(([label, v]) => `<tr><td>${label}</td><td>${formatCurrency(v)}</td></tr>`).join("");
    if (!summaryRows) return "";
    return `<div class="card no-break"><p class="subsection-title">Income &amp; Expense Summary (Lump-Sum T12)</p><table><thead><tr><th>Line Item</th><th>Amount (TTM)</th></tr></thead><tbody>${summaryRows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">No line-item detail available for this T12 format. All values are reported totals.</p></div>${upsideCard}`;
  }
  const egi = coerceNumber(t12Payload?.effective_gross_income);
  const opex = coerceNumber(t12Payload?.total_operating_expenses);
  const incomeRowsHtml = incomeLines.map((row) => {
    const share = Number.isFinite(egi) && egi > 0 ? ` (${formatPercent1(row.amount / egi)})` : "";
    return `<tr><td>${escapeHtml(row.label)}</td><td>${formatCurrency(row.amount)}${escapeHtml(share)}</td></tr>`;
  }).join("");
  const expenseRowsHtml = expenseLines.map((row) => {
    const share = Number.isFinite(opex) && opex > 0 ? ` (${formatPercent1(row.amount / opex)})` : "";
    return `<tr><td>${escapeHtml(row.label)}</td><td>${formatCurrency(row.amount)}${escapeHtml(share)}</td></tr>`;
  }).join("");
  const topIncomeLineConcentration = Number.isFinite(egi) && egi > 0 && incomeLines.length > 0 && Number.isFinite(incomeLines[0]?.amount)
    ? incomeLines[0].amount / egi
    : null;
  const concentrationExceedsEgi = Number.isFinite(topIncomeLineConcentration) && topIncomeLineConcentration > 1;
  const concentrationLineHtml = Number.isFinite(topIncomeLineConcentration)
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Top Income Line Compared with EGI</p><div style="font-size:11px;line-height:1.6;color:#374151;">${escapeHtml(formatPercent1(topIncomeLineConcentration))}${concentrationExceedsEgi ? ` <span style="color:#6b7280;">(EGI is net of vacancy / credit-loss offsets)</span>` : ""}</div><div class="note">Largest eligible income line compared with Effective Gross Income after vacancy / credit-loss offsets.${concentrationExceedsEgi ? " Gross rental income may exceed EGI where vacancy, credit loss, or concessions reduce effective gross income." : ""}</div></div>`
    : "";
  let marketPremiumPct = null;
  const avgInPlace = coerceNumber(computedRentRoll?.avg_in_place_rent ?? rentRollPayload?.avg_in_place_rent);
  const avgMarket = coerceNumber(computedRentRoll?.avg_market_rent ?? rentRollPayload?.avg_market_rent);
  const explicitRentGap = coerceNumber(computedRentRoll?.rent_to_market_gap);
  if (Number.isFinite(explicitRentGap)) {
    marketPremiumPct = explicitRentGap * 100;
  } else if (Number.isFinite(avgInPlace) && Number.isFinite(avgMarket) && avgInPlace > 0) {
    marketPremiumPct = ((avgMarket - avgInPlace) / avgInPlace) * 100;
  }
  const marketRentPremiumRatio = Number.isFinite(marketPremiumPct) ? marketPremiumPct / 100 : NaN;
  const sourceReconciliationRenderState = buildSourceReconciliationRenderState({ sourceReconciliationState });
  const rrVsGprPct = sourceReconciliationRenderState?.variance_pct ?? null;
  const rrVsGprDisplay = sourceReconciliationRenderState?.variance_display ?? null;
  const bullets = [];
  if (Number.isFinite(topIncomeLineConcentration) && topIncomeLineConcentration >= 0.85) bullets.push(`Top income line concentration is ${formatPercent1(topIncomeLineConcentration)} of EGI${topIncomeLineConcentration > 1 ? " (EGI net of vacancy / credit-loss offsets)" : ""} (concentration flag).`);
  const otherIncome = incomeLines.find((row) => /other/i.test(row.label));
  if (otherIncome && Number.isFinite(egi) && egi > 0 && Number.isFinite(otherIncome.amount / egi) && otherIncome.amount / egi >= 0.05) {
    bullets.push(`Other income represents ${formatPercent1(otherIncome.amount / egi)} of EGI (verify sustainability and recurring nature).`);
  }
  const largestExpense = expenseLines[0];
  if (largestExpense && Number.isFinite(opex) && opex > 0 && Number.isFinite(largestExpense.amount / opex) && largestExpense.amount / opex >= 0.2) {
    bullets.push(`Largest operating expense line item is ${largestExpense.label} at ${formatPercent1(largestExpense.amount / opex)} of OpEx (concentration flag).`);
  }
  if (Number.isFinite(marketRentPremiumRatio) && marketRentPremiumRatio >= 0.10) bullets.push(`In-place rents trail market by approximately ${formatPercent1(marketRentPremiumRatio)} (observed rent gap).`);
  if (sourceReconciliationRenderState?.renderable && Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05) bullets.push(`Rent Roll vs T12 GPR variance: ${rrVsGprDisplay}. See Data Coverage.`);
  const bulletsHtml = [...new Set(bullets)].slice(0, 3).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const bulletsCard = bulletsHtml ? `<div class="card no-break" style="margin-top:6px;"><ul>${bulletsHtml}</ul></div>` : "";
  const incomeCard = incomeRowsHtml ? `<div class="card no-break"><p class="subsection-title">Top Positive Income Lines Compared with EGI</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${incomeRowsHtml}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:6px;">Line-item comparisons use EGI as denominator; EGI is net of vacancy / credit-loss offsets.</p></div>` : "";
  const expenseCard = expenseRowsHtml ? `<div class="card no-break"><p class="subsection-title">Top Expense Drivers (share of OpEx)</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${expenseRowsHtml}</tbody></table></div>` : "";
  const driverCards = incomeCard && expenseCard ? `<div class="grid-2-balanced">${incomeCard}${expenseCard}</div>` : incomeCard || expenseCard;
  return `${driverCards}${concentrationLineHtml}${bulletsCard}`;
}

export function buildScreeningExpenseStructureHtml({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
} = {}) {
  const egi = coerceNumber(t12Payload?.effective_gross_income);
  const opex = coerceNumber(t12Payload?.total_operating_expenses);
  const noi = coerceNumber(t12Payload?.net_operating_income);
  const units = coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units);
  const rows = [];
  if (Number.isFinite(egi) && Number.isFinite(opex) && egi > 0) rows.push(`<tr><td>Operating Expense Ratio</td><td>${formatPercent1(opex / egi)}</td></tr>`);
  if (Number.isFinite(opex) && Number.isFinite(units) && units > 0) rows.push(`<tr><td>Operating Expense per Unit</td><td>${formatCurrency(opex / units)}</td></tr>`);
  if (Number.isFinite(noi) && Number.isFinite(units) && units > 0) rows.push(`<tr><td>NOI per Unit</td><td>${formatCurrency(noi / units)}</td></tr>`);
  if (rows.length === 0) return "";
  const metricsCard = `<div class="card no-break"><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  const expenseRowsFromExpenseLines = Array.isArray(t12Payload?.expense_lines) ? t12Payload.expense_lines : [];
  const expenseRows = expenseRowsFromExpenseLines.map((entry) => ({
    label: String(entry?.line_item ?? entry?.label ?? entry?.name ?? entry?.item ?? "").trim(),
    amount: coerceNumber(entry?.amount_ttm ?? entry?.ttm_amount ?? entry?.annual_amount ?? entry?.annual ?? entry?.ytd ?? entry?.total_amount ?? entry?.amount ?? entry?.value ?? entry?.ttm ?? entry?.total),
  })).filter((row) => row.label && Number.isFinite(row.amount) && row.amount > 0);
  const expenseRatio = Number.isFinite(egi) && Number.isFinite(opex) && egi > 0 ? opex / egi : null;
  const flags = [];
  if (Number.isFinite(expenseRatio) && expenseRatio >= 0.60) flags.push("Operating expense ratio is sensitized (>= 55%) and elevated (> 60%).");
  if (expenseRows.length > 0 && expenseRows.some((r) => r.amount / expenseRows.reduce((s, x) => s + x.amount, 0) >= 0.30)) flags.push("Top expense line exceeds 30% of OpEx (concentration risk).");
  const expenseFlagsCard = flags.length ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Expense Flags (Deterministic)</p><ul>${flags.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></div>` : "";
  return `${metricsCard}${expenseFlagsCard}`;
}

export function buildScreeningNoiStabilityHtml({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
  sourceReconciliationState = null,
} = {}) {
  const egi = coerceNumber(t12Payload?.effective_gross_income);
  const opex = coerceNumber(t12Payload?.total_operating_expenses);
  const noi = coerceNumber(t12Payload?.net_operating_income);
  const rows = [];
  if (Number.isFinite(egi) && Number.isFinite(noi) && egi > 0) rows.push(`<tr><td>NOI Margin</td><td>${formatPercent1(noi / egi)}</td></tr>`);
  if (Number.isFinite(egi) && Number.isFinite(opex) && egi > 0) rows.push(`<tr><td>Expense Sensitivity</td><td>${formatPercent1(1 - opex / egi)}</td></tr>`);
  if (Number.isFinite(opex) && Number.isFinite(egi) && egi > 0) rows.push(`<tr><td>Break-even Occupancy</td><td>${formatPercent1(opex / egi)}</td></tr>`);
  const sourceReconciliationRenderState = buildSourceReconciliationRenderState({ sourceReconciliationState });
  const rrVsGprDisplay = sourceReconciliationRenderState?.variance_display ?? null;
  if (sourceReconciliationRenderState?.renderable) rows.push(`<tr><td>Rent Roll vs T12 GPR Variance</td><td>${rrVsGprDisplay}</td></tr>`);
  if (rows.length === 0) return "";
  return `<div class="card no-break"><table><thead><tr><th>Indicator</th><th>Value</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

export function buildScreeningRentRollDistributionHtml({
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
} = {}) {
  const isPartialRentRollSample = computedRentRoll?.is_partial_sample === true || rentRollPayload?.is_partial_sample === true;
  const source = computedRentRoll && typeof computedRentRoll === "object" ? computedRentRoll : rentRollPayload && typeof rentRollPayload === "object" ? rentRollPayload : null;
  if (!source || isPartialRentRollSample) return "";
  const totalUnits = coerceNumber(source.total_units);
  const occupiedUnits = coerceNumber(source.occupied_units);
  let occupancy = coerceNumber(source.occupancy);
  if (!Number.isFinite(occupancy) && Number.isFinite(occupiedUnits) && Number.isFinite(totalUnits) && totalUnits > 0) occupancy = occupiedUnits / totalUnits;
  const canonicalAnnualTotals = resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
  let totalInPlaceAnnual = coerceNumber(canonicalAnnualTotals?.in_place?.value ?? source.total_in_place_annual);
  let totalMarketAnnual = coerceNumber(canonicalAnnualTotals?.market?.value ?? source.total_market_annual);
  const unitMix = Array.isArray(source.unit_mix) ? source.unit_mix : [];
  let weightedInPlace = null;
  let weightedMarket = null;
  if (unitMix.length > 0) {
    let sumCountInPlace = 0, sumRentInPlace = 0, sumCountMarket = 0, sumRentMarket = 0;
    unitMix.forEach((row) => {
      const count = coerceNumber(row?.count);
      if (!Number.isFinite(count) || count <= 0) return;
      const currentRent = coerceNumber(row?.current_rent);
      const marketRent = coerceNumber(row?.market_rent);
      if (Number.isFinite(currentRent)) { sumCountInPlace += count; sumRentInPlace += count * currentRent; }
      if (Number.isFinite(marketRent)) { sumCountMarket += count; sumRentMarket += count * marketRent; }
    });
    if (sumCountInPlace > 0) weightedInPlace = sumRentInPlace / sumCountInPlace;
    if (sumCountMarket > 0) weightedMarket = sumRentMarket / sumCountMarket;
  }
  if (!Number.isFinite(weightedInPlace) && Number.isFinite(totalInPlaceAnnual) && Number.isFinite(totalUnits) && totalUnits > 0) weightedInPlace = totalInPlaceAnnual / totalUnits / 12;
  if (!Number.isFinite(weightedMarket) && Number.isFinite(totalMarketAnnual) && Number.isFinite(totalUnits) && totalUnits > 0) weightedMarket = totalMarketAnnual / totalUnits / 12;
  const metricsRows = [];
  if (Number.isFinite(totalUnits)) metricsRows.push(`<tr><td>Total Units</td><td>${Math.round(totalUnits)}</td></tr>`);
  if (Number.isFinite(occupiedUnits)) metricsRows.push(`<tr><td>Occupied Units</td><td>${Math.round(occupiedUnits)}</td></tr>`);
  if (Number.isFinite(occupancy)) metricsRows.push(`<tr><td>Occupancy</td><td>${(occupancy * 100).toLocaleString("en-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td></tr>`);
  if (Number.isFinite(weightedInPlace)) metricsRows.push(`<tr><td>Weighted Avg In-Place Rent</td><td>${formatCurrency(weightedInPlace)}</td></tr>`);
  if (Number.isFinite(weightedMarket)) metricsRows.push(`<tr><td>Weighted Avg Market Rent</td><td>${formatCurrency(weightedMarket)}</td></tr>`);
  if (Number.isFinite(weightedInPlace) && Number.isFinite(weightedMarket) && weightedInPlace > 0) {
    const premiumPct = ((weightedMarket - weightedInPlace) / weightedInPlace) * 100;
    metricsRows.push(`<tr><td>Market Rent Gap (Avg)</td><td>${premiumPct.toLocaleString("en-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td></tr>`);
  }
  if (Number.isFinite(totalInPlaceAnnual)) metricsRows.push(`<tr><td>Annual In-Place Rent (Total)</td><td>${formatCurrency(totalInPlaceAnnual)}</td></tr>`);
  if (Number.isFinite(totalMarketAnnual)) metricsRows.push(`<tr><td>Annual Market Rent (Total)</td><td>${formatCurrency(totalMarketAnnual)}</td></tr>`);
  const metricsHtml = metricsRows.length > 0 ? `<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${metricsRows.join("")}</tbody></table>` : "";
  return `<div class="card no-break">${metricsHtml}</div>`;
}

export function buildScreeningCustomerOutput({
  finalHtml = "",
  reportMode = "screening_v1",
  screeningVisibleClassificationLabel = "",
  screeningClass = "",
  dealScoreState = null,
  t12Payload = null,
  computedRentRoll = null,
  rentRollPayload = null,
  formatCurrency,
  sourceReconciliationState = null,
  sourceReconciliationNarrativePolicy = null,
  currentDebtAssessmentState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  financials = null,
  sharedRefiDebtRenderState = null,
  primaryPressurePoint = "",
  whyLine = "",
  decisionContextHtml = "",
  miniSensitivityHtml = "",
  driver1 = null,
  driver2 = null,
  driver3 = null,
  execNoiText = DATA_NOT_AVAILABLE,
  execUnitsText = DATA_NOT_AVAILABLE,
  execOccupancyTokenText = DATA_NOT_AVAILABLE,
  execAnnualInPlaceTokenText = DATA_NOT_AVAILABLE,
  execEgiText = DATA_NOT_AVAILABLE,
  execOpexText = DATA_NOT_AVAILABLE,
  execOpexRatioText = DATA_NOT_AVAILABLE,
  execNoiMarginText = DATA_NOT_AVAILABLE,
  execBreakEvenText = DATA_NOT_AVAILABLE,
  execOccupancy = null,
  expenseRatioR = null,
  noiMarginR = null,
  breakEvenOccR = null,
  marketRentPremiumRatio = null,
  currentDebtDscrForDisplay = null,
  screeningHasSufficientData = true,
  hasSourceReconciliationVariance = false,
  sourceCoverageQa = null,
  documentSources = [],
  sourceCoverageQaResult = null,
  acquisitionMemoRenderContext = null,
  underwritingState = null,
  sectionEligibilityState = null,
  dataCoverageState = null,
  optionalSectionState = null,
  renovationReturnAssumptionsPresent = false,
  renovationDisplayMode = null,
  renovationPayload = null,
  propertyTaxPayload = null,
  propertyTaxBindingState = null,
  documentQuantitativeUsageMap = null,
  documentSourcesHtml = "",
  canRenderRefi = false,
  debtCapitalRowsHtml = "",
  refiCollapseGridHtml = "",
  dcfTableHtml = "",
  scenarioTableHtml = "",
  scenarioTrajectoryChartHtml = "",
  dealScoreRows = [],
  buildT12IncomeRows,
  buildT12ExpenseRows,
  buildT12PerUnitRows,
  rrUnits = null,
  t12EgiValue = null,
  t12TotalExpensesValue = null,
  t12NoiValue = null,
  t12ExpenseRatioValue = DATA_NOT_AVAILABLE,
  buildFinancingEnvelopeGrid,
  alignDealScorecardVisibleClassificationHtml,
  resolveCanonicalDataCoverageHeadlineState,
  buildDealScorecardState,
  buildScreeningRefiSufficiencyTable,
  sourceReconciliationCapActive = false,
  coreSupportInsufficient = false,
  debtCoverageConstraintActive = false,
  upsideHtml = "",
  risksHtml = "",
  screeningExplanation = "",
} = {}) {
  let html = String(finalHtml || "");

  const coverClassificationLabel =
    screeningVisibleClassificationLabel ||
    screeningClass ||
    "Stable";
  const screeningVisibleClassificationForConsumers = resolveScreeningClassificationConsumerLabel({
    canonicalVisibleLabel: coverClassificationLabel,
    localVisibleLabel: screeningVisibleClassificationLabel,
    screeningClass,
  });

  html = replaceAll(html, "{{OPERATING_PROFILE_CLASSIFICATION}}", coverClassificationLabel);
  const verdictCssClass = coverClassificationLabel === "Stable" ? "verdict-stable"
    : /^Review\b/i.test(coverClassificationLabel) ? "verdict-sensitized"
    : coverClassificationLabel === "High Risk" || coverClassificationLabel === "Fragile" ? "verdict-fragile"
    : coverClassificationLabel === "Constrained" ? "verdict-sensitized"
    : coverClassificationLabel === "Outside Parameters" ? "verdict-fragile"
    : "";
  html = replaceAll(html, "{{VERDICT_CSS_CLASS}}", verdictCssClass);
  html = replaceAll(html, "{{COVER_VERDICT_LABEL}}", reportMode === "screening_v1" ? "SCREENING<br/>SIGNAL" : "ACQUISITION<br/>MEMO");
  html = replaceAll(html, "{{EXEC_VERDICT_LABEL}}", reportMode === "screening_v1" ? "SCREENING SIGNAL" : "ACQUISITION MEMO");

  const coverNoi = execNoiText !== DATA_NOT_AVAILABLE ? execNoiText : "";
  const coverER = Number.isFinite(expenseRatioR) ? formatPercent1(expenseRatioR) : "";
  const coverNM = Number.isFinite(noiMarginR) ? formatPercent1(noiMarginR) : "";
  const coverUnits = execUnitsText !== DATA_NOT_AVAILABLE ? execUnitsText : "";
  if (coverUnits && coverNoi && coverER && coverNM) {
    html = replaceAll(html, "{{COVER_UNITS}}", coverUnits);
    html = replaceAll(html, "{{COVER_NOI}}", coverNoi);
    html = replaceAll(html, "{{COVER_EXPENSE_RATIO}}", coverER);
    html = replaceAll(html, "{{COVER_NOI_MARGIN}}", coverNM);
  } else {
    html = stripMarkedSection(html, "COVER_METRIC_STRIP");
  }

  {
    const snapRows = [];
    const coverSnapshotValueStyle = "color:#F9FAFB;font-size:11px;font-weight:600;";
    const _coverRrUnits = Number(computedRentRoll?.total_units);
    const unitCount = Number.isFinite(_coverRrUnits) && _coverRrUnits > 0 ? _coverRrUnits : null;
    if (unitCount) snapRows.push(`<div style="display:flex;gap:12px;padding:3px 0;"><span style="width:96px;color:#9CA3AF;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">Asset Class</span><span style="${coverSnapshotValueStyle}">Multifamily - ${unitCount} Units</span></div>`);
    const docCount = Array.isArray(documentSources) ? documentSources.length : 0;
    if (docCount > 0) snapRows.push(`<div style="display:flex;gap:12px;padding:3px 0;"><span style="width:96px;color:#9CA3AF;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">Documents</span><span style="${coverSnapshotValueStyle}">${docCount} uploaded file${docCount === 1 ? "" : "s"}</span></div>`);
    const modeLabel = reportMode === "screening_v1" ? "Preliminary Screening" : "Acquisition Memo";
    snapRows.push(`<div style="display:flex;gap:12px;padding:3px 0;"><span style="width:96px;color:#9CA3AF;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">Report Tier</span><div style="${coverSnapshotValueStyle}">${modeLabel}</div></div>`);
    const snapHtml = snapRows.length > 0 ? `<div style="margin-top:0;padding-top:0;">${snapRows.join("")}</div>` : "";
    html = replaceAll(html, "{{COVER_ASSET_SNAPSHOT}}", snapHtml);
  }

  const reportTypeLabel = reportMode === "screening_v1"
    ? "Preliminary Investment Screening Memorandum"
    : "Acquisition Memo";
  html = replaceAll(html, "{{REPORT_TYPE_LABEL}}", reportTypeLabel);
  html = replaceAll(html, "{{COVER_REPORT_TYPE_LABEL}}", reportTypeLabel);
  html = replaceAll(html, "{{PRIMARY_PRESSURE_POINT}}", primaryPressurePoint);

  if (whyLine || decisionContextHtml || miniSensitivityHtml || sourceReconciliationNarrativePolicy?.disclosure_label) {
    const reconciliationDisclosureLine =
      sourceReconciliationNarrativePolicy?.executive_summary_allowed &&
      !sourceReconciliationNarrativePolicy?.primary_pressure_point_allowed &&
      sourceReconciliationNarrativePolicy?.disclosure_label
        ? `<p class="exec-signal-line">${escapeHtml(sourceReconciliationNarrativePolicy.disclosure_label)}</p>`
        : "";
    const pressureLabel = String(primaryPressurePoint || "").startsWith("Primary Constraint:")
      ? "Primary Constraint"
      : "Primary Pressure Point";
    const pressureText = pressureLabel === "Primary Constraint"
      ? String(primaryPressurePoint || "").replace(/^Primary Constraint:\s*/i, "")
      : primaryPressurePoint;
    const pressureAnchor = `<div class="verdict-pressure">Primary Pressure Point &mdash; ${escapeHtml(primaryPressurePoint)}</div>`;
    const pressureReplacement = `<div class="verdict-pressure">${pressureLabel}: ${escapeHtml(pressureText)}</div>${
      whyLine ? `<p class="exec-signal-line">${escapeHtml(whyLine)}</p>` : ""
    }${reconciliationDisclosureLine}${decisionContextHtml}${miniSensitivityHtml}`;
    if (html.includes(pressureAnchor)) {
      html = html.replace(pressureAnchor, pressureReplacement);
    }
  }

  html = replaceAll(html, "{{DRIVER_1_LABEL}}", driver1?.label || "");
  html = replaceAll(html, "{{DRIVER_1_VALUE}}", driver1?.value || "");
  html = replaceAll(html, "{{DRIVER_1_TRIGGER}}", driver1?.trigger || "");
  html = replaceAll(html, "{{DRIVER_2_LABEL}}", driver2?.label || "");
  html = replaceAll(html, "{{DRIVER_2_VALUE}}", driver2?.value || "");
  html = replaceAll(html, "{{DRIVER_2_TRIGGER}}", driver2?.trigger || "");
  html = replaceAll(html, "{{DRIVER_3_LABEL}}", driver3?.label || "");
  html = replaceAll(html, "{{DRIVER_3_VALUE}}", driver3?.value || "");
  html = replaceAll(html, "{{DRIVER_3_TRIGGER}}", driver3?.trigger || "");
  if (reportMode === "screening_v1") {
    html = sanitizeScreeningRankedDriversHtml(html);
  }
  if (reportMode === "v1_core" || !driver1) {
    html = stripMarkedSection(html, "EXEC_RANKED_DRIVERS");
  }

  const screeningIncomeForensicsHtml = buildScreeningIncomeForensicsHtml({
    t12Payload,
    computedRentRoll,
    rentRollPayload,
    formatCurrency,
    sourceReconciliationState,
  });
  html = replaceAll(html, "{{SCREENING_INCOME_FORENSICS_BLOCK}}", screeningIncomeForensicsHtml);
  const screeningExpenseHtml = buildScreeningExpenseStructureHtml({
    t12Payload,
    computedRentRoll,
    rentRollPayload,
    formatCurrency,
  });
  const screeningNoiHtml = buildScreeningNoiStabilityHtml({
    t12Payload,
    computedRentRoll,
    rentRollPayload,
    formatCurrency,
    sourceReconciliationState,
  });
  html = replaceAll(html, "{{SCREENING_EXPENSE_STRUCTURE_BLOCK}}", screeningExpenseHtml);
  html = replaceAll(html, "{{SCREENING_NOI_STABILITY_BLOCK}}", screeningNoiHtml);
  const screeningRentRollHtml = buildScreeningRentRollDistributionHtml({
    computedRentRoll,
    rentRollPayload,
    formatCurrency,
  });
  html = replaceAll(html, "{{SCREENING_RENT_ROLL_BLOCK}}", screeningRentRollHtml);

  const screeningRefiSufficiencyHtml =
    reportMode === "screening_v1"
      ? ""
      : (() => {
          const sufficiencyHtml = buildScreeningRefiSufficiencyTable({
            financials,
            t12Payload,
            currentDebtAssessmentState,
            mortgagePayload,
            loanTermSheetTermsPayload,
          });
          const financingEnvelopeHtml = sharedRefiDebtRenderState?.allowDebtMath
            ? buildFinancingEnvelopeGrid(
                coerceNumber(t12Payload?.net_operating_income),
                Number.isFinite(rrUnits) && rrUnits > 0 ? rrUnits : Number(computedRentRoll?.total_units)
              )
            : "";
          return sufficiencyHtml + financingEnvelopeHtml;
        })();
  html = replaceAll(html, "{{SCREENING_REFI_DATA_SUFFICIENCY_BLOCK}}", screeningRefiSufficiencyHtml);

  let screeningCoverageHtml = "";
  const sectionEligibility = sectionEligibilityState || underwritingState?.core?.sections?.eligibilityState || null;
  const dataCoverage = dataCoverageState || underwritingState?.core?.dataCoverage || null;
  const optionalSection = optionalSectionState || underwritingState?.core?.optionalSections || null;
  screeningCoverageHtml = buildScreeningDataCoverageSummary({
    t12Payload,
    computedRentRoll,
    rentRollPayload,
    mortgagePayload,
    loanTermSheetTermsPayload,
    financials,
    effectiveReportMode: reportMode,
    supportingUnderwritingDocsUsed: Boolean(canRenderRefi || String(debtCapitalRowsHtml || "").trim().length > 0 || String(refiCollapseGridHtml || "").trim().length > 0 || String(dcfTableHtml || "").includes("(appraisal)") || String(scenarioTableHtml || "").includes("(appraisal)")),
    hasUploadedFiles: Array.isArray(documentSources) && documentSources.length > 0 && Boolean(documentSourcesHtml),
    documentSources,
    currentDebtAssessmentState,
    sourceReconciliationState,
    sectionEligibility,
    dataCoverageState: dataCoverage,
    optionalSectionState: optionalSection,
    hasForwardLookingRenovationInputs: renovationReturnAssumptionsPresent,
    renovationDisplayMode,
    renovationPayload,
    propertyTaxPayload,
    propertyTaxBindingState,
    documentQuantitativeUsageMap,
    supportDocAuthorityRows: acquisitionMemoRenderContext?.supportDocAuthorityRows || null,
    canonicalSupportDocMap: acquisitionMemoRenderContext?.canonicalSupportDocMap || null,
    renderedDocumentTreatmentRowsOut: [],
  });
  html = replaceAll(html, "{{SCREENING_DATA_COVERAGE_BLOCK}}", screeningCoverageHtml);

  html = replaceAll(html, "{{REPORT_MODE}}", reportMode);
  const t12IncomeLines = Array.isArray(t12Payload?.income_lines)
    ? t12Payload.income_lines
    : Array.isArray(t12Payload?.income_breakdown)
      ? t12Payload.income_breakdown
      : Array.isArray(t12Payload?.line_items)
        ? t12Payload.line_items.filter((entry) => String(entry?.category ?? "").trim().toLowerCase() === "income")
        : [];
  const t12ExpenseLines = Array.isArray(t12Payload?.expense_lines)
    ? t12Payload.expense_lines
    : Array.isArray(t12Payload?.expense_breakdown)
      ? t12Payload.expense_breakdown
      : Array.isArray(t12Payload?.line_items)
        ? t12Payload.line_items.filter((entry) => String(entry?.category ?? "").trim().toLowerCase() === "expense")
        : [];
  const normalizeT12LineRows = (collection = [], amountKeys = []) =>
    collection
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const label = String(entry.line_item ?? entry.label ?? entry.name ?? entry.item ?? "").trim();
        const amount = amountKeys
          .map((key) => coerceNumber(entry?.[key]))
          .find((value) => Number.isFinite(value));
        if (!label || !Number.isFinite(amount)) return null;
        return { label, amount };
      })
      .filter(Boolean);
  const t12IncomeRowsData = normalizeT12LineRows(t12IncomeLines, ["amount_ttm", "ttm_amount", "annual_amount", "annual", "ytd", "total_amount", "amount", "value", "ttm", "total"]);
  const t12ExpenseRowsData = normalizeT12LineRows(t12ExpenseLines, ["amount_ttm", "ttm_amount", "annual_amount", "annual", "ytd", "total_amount", "amount", "value", "ttm", "total"]);
  const localT12EgiValue = Number.isFinite(t12EgiValue) ? t12EgiValue : coerceNumber(t12Payload?.effective_gross_income ?? t12Payload?.egi ?? t12Payload?.gross_potential_rent);
  const localT12TotalExpensesValue = Number.isFinite(t12TotalExpensesValue) ? t12TotalExpensesValue : coerceNumber(t12Payload?.total_operating_expenses ?? t12Payload?.opex);
  const localT12NoiValue = Number.isFinite(t12NoiValue) ? t12NoiValue : coerceNumber(t12Payload?.net_operating_income ?? t12Payload?.noi);
  const t12IncomeRows = t12IncomeRowsData.length > 0
    ? t12IncomeRowsData.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${formatCurrency(row.amount)}</td></tr>`).join("")
    : Number.isFinite(localT12EgiValue)
      ? `<tr><td colspan="2" style="color:#64748b;font-style:italic;">No line-item detail available. Effective Gross Income (TTM): ${formatCurrency(localT12EgiValue)}.</td></tr>`
      : "";
  const t12ExpenseRows = t12ExpenseRowsData.length > 0
    ? t12ExpenseRowsData.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${formatCurrency(row.amount)}</td></tr>`).join("")
    : Number.isFinite(localT12TotalExpensesValue)
      ? `<tr><td colspan="2" style="color:#64748b;font-style:italic;">No line-item detail available. Total Operating Expenses (TTM): ${formatCurrency(localT12TotalExpensesValue)}.</td></tr>`
      : "";
  html = replaceAll(html, "{{T12_INCOME_ROWS}}", reportMode === "screening_v1" ? "" : (t12IncomeRows || ""));
  html = replaceAll(html, "{{T12_EXPENSE_ROWS}}", reportMode === "screening_v1" ? "" : (t12ExpenseRows || ""));
  if (!String(t12IncomeRows || "").trim()) {
    html = stripMarkedSection(html, "T12_INCOME_TABLE");
    html = stripT12DetailSubsection(html, "Income Reconstruction (TTM)");
  }
  if (!String(t12ExpenseRows || "").trim()) {
    html = stripMarkedSection(html, "T12_EXPENSE_TABLE");
    html = stripT12DetailSubsection(html, "Operating Expenses (TTM)");
  }
  html = stripEmptyHeadingBlocks(html);
  html = replaceAll(html, "{{T12_EGI}}", Number.isFinite(localT12EgiValue) ? formatCurrency(localT12EgiValue) : DATA_NOT_AVAILABLE);
  html = replaceAll(html, "{{T12_TOTAL_EXPENSES}}", Number.isFinite(localT12TotalExpensesValue) ? formatCurrency(localT12TotalExpensesValue) : DATA_NOT_AVAILABLE);
  html = replaceAll(html, "{{T12_NOI}}", Number.isFinite(localT12NoiValue) ? formatCurrency(localT12NoiValue) : DATA_NOT_AVAILABLE);
  html = replaceAll(html, "{{T12_EXPENSE_RATIO}}", t12ExpenseRatioValue);
  html = replaceAll(html, "{{T12_PER_UNIT_ROWS}}", buildT12PerUnitRows(localT12EgiValue, localT12TotalExpensesValue, localT12NoiValue, rrUnits));

  html = stripEmptyHeadingBlocks(html);
  html = stripChartBlockByAlt(html, "Deal Score Radar");
  html = stripChartBlockByAlt(html, "Deal Score Bar");

  if (reportMode === "screening_v1") {
    html = html.replace(/<p class="small" style="margin-top:8px;">\s*This report is a preliminary investment screening memorandum\. Full refinance, debt, and valuation modeling are provided in the Underwriting Report\.\s*<\/p>/i, "");
  }

  if (reportMode === "screening_v1") {
    const suppressUnitLevelRentLift = computedRentRoll?.is_partial_sample === true;
    const unitMix = suppressUnitLevelRentLift ? null : computedRentRoll?.unit_mix || rentRollPayload?.unit_mix;
    const totalUnits = computedRentRoll?.total_units ?? rentRollPayload?.total_units ?? rrUnits;
    const unitMixRows = suppressUnitLevelRentLift
      ? ""
      : buildScreeningUnitMixRows(unitMix, totalUnits, formatCurrency);
    const descriptorUnits = Number.isFinite(Number(rrUnits))
      ? Number(rrUnits)
      : coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units);
    const descriptorLine = Number.isFinite(descriptorUnits) && descriptorUnits > 0
      ? `${descriptorUnits}-Unit Multifamily`
      : "";
    const documentSourcesTableHtml = String(documentSourcesHtml || "").trim()
      ? documentSourcesHtml
      : Array.isArray(documentSources) && documentSources.length > 0
        ? '<p class="small">Document source transparency is required for this report scope. Structured source-treatment details were not available at render time.</p>'
        : "";
    const execVerdictExpansionHtml = buildScreeningExecVerdictExpansion({
      computedRentRoll,
      rentRollPayload,
      screeningVisibleClassificationForConsumers,
      expenseRatioR,
      noiMarginR,
      breakEvenOccR,
      sourceReconciliationNarrativePolicy,
      hasSourceReconciliationVariance,
      screeningExplanation,
    });
    const execClassificationRationale = buildScreeningExecClassificationRationale({
      reportMode,
      screeningVisibleClassificationForConsumers,
      expenseRatioR,
      noiMarginR,
      breakEvenOccR,
      screeningExplanation,
      screeningClass,
    });
    const unitValueAddUpsidePathwayHtml = buildScreeningUpsidePathwayHtml({
      computedRentRoll,
      rentRollPayload,
      formatCurrency,
      rrUnits,
    });

    html = replaceAll(html, "{{EXEC_VERDICT_EXPANSION}}", execVerdictExpansionHtml);
    html = replaceAll(html, "{{KEY_UPSIDE_DRIVERS_BULLETS}}", String(upsideHtml || ""));
    html = replaceAll(html, "{{KEY_RISKS_BULLETS}}", String(risksHtml || ""));
    html = replaceAll(html, "{{PRELIMINARY_FINANCING_READINESS_SUMMARY_BLOCK}}", "");
    html = stripMarkedSection(html, "SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY");
    if (!descriptorLine) {
      html = stripMarkedSection(html, "PROPERTY_DESCRIPTOR_LINE");
    } else {
      html = replaceAll(html, "{{PROPERTY_DESCRIPTOR_LINE}}", descriptorLine);
    }
    html = html.replace(/ - \s*,\s*/g, "");
    html = html.replace(/-\s*,\s*/g, "");
    html = html.replace(/\s*,\s*<\/h1>/g, "</h1>");
    html = replaceAll(html, "{{UNIT_MIX_ROWS}}", unitMixRows);
    html = replaceAll(html, "{{UNIT_VALUE_ADD_RIGHT_COLUMN}}", "");
    html = replaceAll(html, "{{UNIT_VALUE_ADD_UPSIDE_PATHWAY}}", unitValueAddUpsidePathwayHtml);
    html = replaceAll(html, "{{DOCUMENT_SOURCES_TABLE}}", documentSourcesTableHtml);
    html = replaceAll(html, "{{EXEC_CLASSIFICATION_RATIONALE}}", execClassificationRationale);
    html = html.replace(/^\s*\{\{EXEC_CLASSIFICATION_RATIONALE\}\}\s*$/gm, "");
    const leftoverTokens = html.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
    leftoverTokens.forEach((token) => {
      html = html.replaceAll(token, "");
    });
  }

  return {
    html,
    qaHtml: html,
    screeningVisibleClassificationForConsumers,
    screeningCoverageHtml,
  };
}
