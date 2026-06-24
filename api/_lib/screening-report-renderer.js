import {
  escapeHtml,
  formatCurrency,
  formatPercent1,
  formatMultiple,
  formatInterestRatePercent,
  formatYears,
  formatCapPercentExact,
} from "./report-formatting-helpers.js";
import {
  buildSourceReconciliationRenderState,
  buildSourceReconciliationNarrativeProminencePolicy,
  resolveCanonicalRentRollAnnualTotals,
} from "./report-surface-contracts.js";

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
