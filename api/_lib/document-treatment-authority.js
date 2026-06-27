import {
  formatCurrency,
  formatPercent1,
  formatPercentExactDisplay,
  formatInterestRatePercent,
  formatCapPercentExact,
  escapeHtml,
} from "./report-formatting-helpers.js";
import { toCapRatio } from "./report-number-helpers.js";
import {
  dedupeRenovationMetricRows,
  formatRenovationMetricValue,
  normalizeRenovationMetricKind,
} from "./report-surface-contracts.js";
import {
  buildAcquisitionMemoV2SupportDocAuthorityRows,
} from "./acquisition-memo-v2-role-reconciler.js";
import {
  buildSupportDocTaxonomyState,
  resolveCanonicalSupportDocAuthority,
} from "./support-doc-taxonomy.js";

const DATA_NOT_AVAILABLE = "Not assessed";

const coerceNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[$,%]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const firstFinite = (...values) => {
  for (const value of values) {
    const parsed = coerceNumber(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

export function isValidAnnualPropertyTaxValue(value) {
  const annualTax = coerceNumber(value);
  if (!Number.isFinite(annualTax) || annualTax <= 0) return false;
  if (annualTax >= 1900 && annualTax <= 2100) return false;
  if (annualTax < 1000) return false;
  return true;
}

export function buildHistoricalCapexDisplayCopy({
  hasForwardLookingRenovationInputs = false,
  renovationDisplayMode = null,
} = {}) {
  const normalizedRenovationDisplayMode =
    renovationDisplayMode === "forward_looking_modelable" ||
    renovationDisplayMode === "forward_looking_with_rent_lift" ||
    renovationDisplayMode === "budget_only_no_roi" ||
    renovationDisplayMode === "historical_only"
      ? renovationDisplayMode
      : "historical_only";
  const historicalCapitalItemsDisclaimer =
    "Historical capital items are displayed for context only. InvestorIQ does not model renovation ROI, rent lift, payback, or implementation schedule without document-supported forward-looking assumptions.";
  const budgetOnlyDisclaimer =
    "Budget and scope items are displayed from the uploaded renovation budget. InvestorIQ does not model renovation ROI, rent lift, payback, phasing, cost recovery, or implementation schedule because those assumptions were not provided.";
  if (normalizedRenovationDisplayMode === "budget_only_no_roi") {
    return {
      display_mode: normalizedRenovationDisplayMode,
      section_title: "Renovation Budget Summary",
      budget_card_title: "Renovation Budget Items",
      show_execution_card: false,
      budget_note: budgetOnlyDisclaimer,
      execution_note: budgetOnlyDisclaimer,
      interpretation: budgetOnlyDisclaimer,
      historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
    };
  }
  if (normalizedRenovationDisplayMode === "forward_looking_modelable") {
    return {
      display_mode: normalizedRenovationDisplayMode,
      section_title: "Document-Supported Renovation Assumptions",
      budget_card_title: "Renovation Budget Items",
      show_execution_card: true,
      budget_note: DATA_NOT_AVAILABLE,
      execution_note: DATA_NOT_AVAILABLE,
      interpretation: DATA_NOT_AVAILABLE,
      historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
    };
  }
  if (normalizedRenovationDisplayMode === "forward_looking_with_rent_lift") {
    return {
      display_mode: normalizedRenovationDisplayMode,
      section_title: "Document-Stated Renovation Assumptions",
      budget_card_title: "Renovation Budget Items",
      show_execution_card: true,
      budget_note:
        "Document-stated renovation rent-lift assumptions are displayed by row for source transparency only. Gross annual rent-lift potential is shown only where unit count and expected monthly rent lift are explicitly provided and is not converted into NOI, ROI, payback, valuation, or refinance outputs.",
      execution_note:
        "ROI, payback, and cost recovery are not modeled unless those assumptions are explicitly document-supported.",
      interpretation:
        "Document-stated rent-lift assumptions are shown for transparency only. This is not an NOI, ROI, payback, valuation, or refinance model.",
      historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
    };
  }
  return {
    display_mode: normalizedRenovationDisplayMode,
    section_title: "Historical Capital Expenditure Summary",
    budget_card_title: "Historical Capital Items",
    show_execution_card: false,
    budget_note: "Historical capital items are displayed for context only.",
    execution_note: historicalCapitalItemsDisclaimer,
    interpretation: historicalCapitalItemsDisclaimer,
    historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
  };
}

export function resolveRenovationDisplayMode({
  financials = null,
  renovationPayload = null,
  documentSources = [],
  hasForwardLookingRenovationInputs = false,
} = {}) {
  const hasMeaningfulText = (value) =>
    typeof value === "string" && value.trim().length > 0 && value.trim() !== DATA_NOT_AVAILABLE;
  const hasPositive = (value) => {
    const parsed = coerceNumber(value);
    return Number.isFinite(parsed) && parsed > 0;
  };
  const hasStructuredRows = (rows) =>
    Array.isArray(rows) &&
    rows.some((row) => {
      if (!row || typeof row !== "object") return false;
      const amount = coerceNumber(
        row.estimated_cost ?? row.amount ?? row.cost ?? row.value ?? row.total ?? row.budget
      );
      return Number.isFinite(amount) && amount > 0;
    });
  const hasRowLevelRentLift = (rows) =>
    Array.isArray(rows) &&
    rows.some((row) => {
      if (!row || typeof row !== "object") return false;
      const rowRentLift = coerceNumber(row.expected_monthly_rent_lift ?? row.rent_lift);
      return Number.isFinite(rowRentLift) && rowRentLift > 0;
    });
  const hasBudgetEvidence = Boolean(
    hasPositive(renovationPayload?.total_budget) ||
      hasPositive(renovationPayload?.total_capex) ||
      hasPositive(renovationPayload?.renovation_budget) ||
      hasStructuredRows(renovationPayload?.budget_rows) ||
      hasStructuredRows(renovationPayload?.execution_rows)
  );
  const hasForwardLookingSignals = Boolean(
    hasForwardLookingRenovationInputs ||
      [
        renovationPayload?.timing_or_phasing,
        renovationPayload?.rent_lift,
        renovationPayload?.roi,
        renovationPayload?.payback_period,
      ].some((value) => hasMeaningfulText(value))
  );
  const hasDocumentedRentLift = Boolean(
    hasMeaningfulText(renovationPayload?.rent_lift) ||
      hasRowLevelRentLift(renovationPayload?.budget_rows)
  );
  const historicalSignalsText = [
    renovationPayload?.interpretation,
    renovationPayload?.budget_note,
    renovationPayload?.execution_note,
    Array.isArray(documentSources)
      ? documentSources
          .map((row) =>
            [
              row?.semantic_doc_role,
              row?.semantic_doc_display_label,
              row?.display_doc_type,
              row?.doc_type,
              row?.parse_status,
              row?.parse_error,
              row?.original_filename,
            ]
              .map((value) => String(value || "").trim())
              .join(" ")
          )
          .join(" ")
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const hasHistoricalOnlySignals = /historical|past repairs?|prior work|completed items?|completed work|historical capex/i.test(
    historicalSignalsText
  );
  if (hasBudgetEvidence) {
    if (hasHistoricalOnlySignals && !hasForwardLookingSignals) return "historical_only";
    if (hasDocumentedRentLift && !hasMeaningfulText(renovationPayload?.roi)) {
      return "forward_looking_with_rent_lift";
    }
    return hasForwardLookingSignals ? "forward_looking_modelable" : "budget_only_no_roi";
  }
  if (hasHistoricalOnlySignals) return "historical_only";
  return null;
}

export function buildFrameworkSensitivityDisplayCopy() {
  return {
    scenario_section_title: "Scenario Analysis & Five-Year Outlook - Framework Sensitivity",
    dcf_section_title: "DCF Framework Sensitivity",
    dcf_summary_title: "DCF Framework Sensitivity Summary (Base Case)",
    dcf_value_label: "Framework-Indicated Present Value (Sum of PVs)",
    dcf_framework_note:
      "This is a framework sensitivity, not an appraisal, and does not rely on unsupported appraisal or market survey files.",
  };
}

function summarizeRenovationBudgetRows(rows, formatValue) {
  const visibleColumns = {
    category: false,
    scope: false,
    cost: false,
    unitType: false,
    unitCount: false,
    costPerUnit: false,
    expectedMonthlyRentLift: false,
    phaseTiming: false,
    grossAnnualRentLiftPotential: false,
    percent: false,
    objective: false,
  };
  const normalizedRows = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== "object") continue;
    const category = String(row.category ?? row.item ?? row.label ?? "").trim();
    const scope = String(row.scope_of_work ?? row.scope ?? "").trim();
    const costValue = coerceNumber(row.estimated_cost ?? row.amount ?? row.cost ?? row.value);
    const cost = Number.isFinite(costValue) ? formatValue(costValue) : "";
    const unitType = String(row.unit_type ?? "").trim();
    const unitCountValue = coerceNumber(row.unit_count);
    const unitCount = Number.isFinite(unitCountValue) ? String(Math.round(unitCountValue)) : "";
    const costPerUnitValue = coerceNumber(row.cost_per_unit);
    const costPerUnit = Number.isFinite(costPerUnitValue) ? formatValue(costPerUnitValue) : "";
    const expectedMonthlyRentLiftValue = coerceNumber(row.expected_monthly_rent_lift ?? row.rent_lift);
    const expectedMonthlyRentLift = Number.isFinite(expectedMonthlyRentLiftValue)
      ? formatValue(expectedMonthlyRentLiftValue)
      : "";
    const phaseTiming = String(row.phase_timing ?? row.timing_or_phasing ?? "").trim();
    const grossAnnualRentLiftPotentialValue =
      Number.isFinite(expectedMonthlyRentLiftValue) && Number.isFinite(unitCountValue)
        ? expectedMonthlyRentLiftValue * 12 * unitCountValue
        : null;
    const grossAnnualRentLiftPotential = Number.isFinite(grossAnnualRentLiftPotentialValue)
      ? formatValue(grossAnnualRentLiftPotentialValue)
      : "";
    const pctRawValue = coerceNumber(row.percent_of_budget ?? row.percent ?? row.percentage);
    const pct = Number.isFinite(pctRawValue) ? formatPercent1(pctRawValue) : "";
    const objective = String(row.primary_objective ?? row.objective ?? row.note ?? "").trim();
    if (
      !category &&
      !scope &&
      !cost &&
      !unitType &&
      !unitCount &&
      !costPerUnit &&
      !expectedMonthlyRentLift &&
      !phaseTiming &&
      !grossAnnualRentLiftPotential &&
      !pct &&
      !objective
    ) continue;
    visibleColumns.category ||= Boolean(category);
    visibleColumns.scope ||= Boolean(scope);
    visibleColumns.cost ||= Boolean(cost);
    visibleColumns.unitType ||= Boolean(unitType);
    visibleColumns.unitCount ||= Boolean(unitCount);
    visibleColumns.costPerUnit ||= Boolean(costPerUnit);
    visibleColumns.expectedMonthlyRentLift ||= Boolean(expectedMonthlyRentLift);
    visibleColumns.phaseTiming ||= Boolean(phaseTiming);
    visibleColumns.grossAnnualRentLiftPotential ||= Boolean(grossAnnualRentLiftPotential);
    visibleColumns.percent ||= Boolean(pct);
    visibleColumns.objective ||= Boolean(objective);
    normalizedRows.push({
      category,
      scope,
      cost,
      unitType,
      unitCount,
      costPerUnit,
      expectedMonthlyRentLift,
      phaseTiming,
      grossAnnualRentLiftPotential,
      percent: pct,
      objective,
    });
  }
  return { visibleColumns, rows: normalizedRows };
}

export function buildRenovationBudgetRows(rows, formatValue, columnVisibility = null) {
  const summary = summarizeRenovationBudgetRows(rows, formatValue);
  const visibleColumns = columnVisibility || summary.visibleColumns;
  const columns = [
    { key: "category", label: "Category" },
    { key: "scope", label: "Scope of Work" },
    { key: "unitType", label: "Unit Type" },
    { key: "unitCount", label: "Unit Count" },
    { key: "costPerUnit", label: "Cost per Unit" },
    { key: "expectedMonthlyRentLift", label: "Expected Monthly Rent Lift (Document-Stated Assumption)" },
    { key: "phaseTiming", label: "Phase Timing / Phasing" },
    { key: "grossAnnualRentLiftPotential", label: "Gross Annual Rent-Lift Potential (Document-Stated Assumption)" },
    { key: "cost", label: "Estimated Cost" },
    { key: "percent", label: "Percent of Budget" },
    { key: "objective", label: "Primary Objective" },
  ].filter((column) => visibleColumns[column.key]);
  if (!columns.length || !summary.rows.length) return "";
  return summary.rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key] ?? "")}</td>`).join("")}</tr>`)
    .join("");
}

export function buildRenovationBudgetCardHtml(rows, formatValue, note = DATA_NOT_AVAILABLE, columnVisibility = null, title = "Renovation Budget Items") {
  const summary = summarizeRenovationBudgetRows(rows, formatValue);
  const visibleColumns = columnVisibility || summary.visibleColumns;
  const columns = [
    { key: "category", label: "Category" },
    { key: "scope", label: "Scope of Work" },
    { key: "unitType", label: "Unit Type" },
    { key: "unitCount", label: "Unit Count" },
    { key: "costPerUnit", label: "Cost per Unit" },
    { key: "expectedMonthlyRentLift", label: "Expected Monthly Rent Lift (Document-Stated Assumption)" },
    { key: "phaseTiming", label: "Phase Timing / Phasing" },
    { key: "grossAnnualRentLiftPotential", label: "Gross Annual Rent-Lift Potential (Document-Stated Assumption)" },
    { key: "cost", label: "Estimated Cost" },
    { key: "percent", label: "Percent of Budget" },
    { key: "objective", label: "Primary Objective" },
  ].filter((column) => visibleColumns[column.key]);
  if (!columns.length || !summary.rows.length) return "";
  const rowsHtml = buildRenovationBudgetRows(rows, formatValue, visibleColumns);
  return `<div class="no-break"><p class="subsection-title">${escapeHtml(title)}</p><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table><p class="small" style="margin-top:8px;"><strong>InvestorIQ:</strong> ${escapeHtml(note)}</p></div>`;
}

function summarizeRenovationExecutionRows(rows, formatValue) {
  const normalizedRows = [];
  for (const row of dedupeRenovationMetricRows(Array.isArray(rows) ? rows : [])) {
    if (!row || typeof row !== "object") continue;
    const metricKind = normalizeRenovationMetricKind(row);
    const metricSource = String(row.metric ?? row.label ?? row.item ?? row.category ?? "").trim();
    const metric =
      metricKind === "unit_count"
        ? "Unit Count (unit turns scope)"
        : metricKind === "per_unit_cost"
        ? "Per Unit Cost (unit turns scope)"
        : metricSource;
    const valueSource =
      row.value ??
      row.amount ??
      row.estimated_cost ??
      row.scope_of_work ??
      row.percent_of_budget ??
      row.percent ??
      row.percentage ??
      "";
    const value = formatRenovationMetricValue({
      metricKind,
      value: valueSource,
      formatCurrency: formatValue,
      formatPercent: formatPercent1,
    });
    if (!metric || !value) continue;
    normalizedRows.push({ metric, value });
  }
  return normalizedRows;
}

export function buildRenovationExecutionRows(rows, formatValue) {
  return summarizeRenovationExecutionRows(rows, formatValue)
    .map((row) => `<tr><td>${escapeHtml(row.metric)}</td><td>${row.value}</td></tr>`)
    .join("");
}

export function buildRenovationExecutionCardHtml(rows, formatValue, note = DATA_NOT_AVAILABLE) {
  const rowsHtml = summarizeRenovationExecutionRows(rows, formatValue)
    .map((row) => `<tr><td>${escapeHtml(row.metric)}</td><td>${row.value}</td></tr>`)
    .join("");
  if (!rowsHtml) {
    return note && note !== DATA_NOT_AVAILABLE
      ? `<div style="margin-top:18px; page-break-before: avoid; break-before: avoid;"><p class="small" style="margin-top:8px;"><strong>InvestorIQ:</strong> ${escapeHtml(note)}</p></div>`
      : "";
  }
  return `<div style="margin-top:18px; page-break-before: avoid; break-before: avoid;"><p class="subsection-title">Execution and Unit-Cost Inputs (Document-Stated)</p><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="small" style="margin-top:8px;"><strong>InvestorIQ:</strong> ${escapeHtml(note)}</p></div>`;
}

export function buildCanonicalSupportDocAuthorityRows(args = {}) {
  return buildAcquisitionMemoV2SupportDocAuthorityRows(args);
}

function buildAuthorityRows(args = {}) {
  if (Array.isArray(args.supportDocAuthorityRows) && args.supportDocAuthorityRows.length) {
    return args.supportDocAuthorityRows;
  }
  return buildCanonicalSupportDocAuthorityRows(args);
}

function classifyDocumentTreatmentRow(row = {}, { propertyTaxPayload = null, canonicalSupportDocMap = null } = {}) {
  const filename = row?.original_filename || row?.originalFilename || row?.file_name || row?.filename || "Support Document";
  const environmentalSignalsText = [
    filename,
    row?.source_text,
    row?.raw_text,
    row?.notes,
    row?.semantic_doc_role_reason,
    row?.semantic_doc_display_label,
    row?.display_doc_type,
    row?.doc_type,
  ]
    .filter(Boolean)
    .join(" ");
  const canonicalFromMap =
    canonicalSupportDocMap instanceof Map
      ? canonicalSupportDocMap.get(filename) || canonicalSupportDocMap.get(row?.id) || null
      : null;
  const canonical =
    canonicalFromMap ||
    resolveCanonicalSupportDocAuthority({
      originalFilename: filename,
      rawText: [row?.source_text, row?.raw_text, row?.notes, row?.semantic_doc_role_reason].filter(Boolean).join(" "),
      payload: row,
    });
  const taxonomy = buildSupportDocTaxonomyState({
    declaredDocType: row?.doc_type || null,
    detectedDocType: row?.display_doc_type || null,
    originalFilename: filename,
    rawText: [row?.source_text, row?.raw_text, row?.notes, row?.semantic_doc_role_reason].filter(Boolean).join(" "),
    payload: row,
  });
  const boundPropertyTax =
    canonical?.role === "property_tax" &&
    isValidAnnualPropertyTaxValue(propertyTaxPayload?.annual_tax) &&
    (
      String(propertyTaxPayload?.source_file_id || "").trim() === String(row?.id || row?.file_id || row?.source_file_id || "").trim() ||
      String(propertyTaxPayload?.original_filename || "").trim().toLowerCase() === String(filename).trim().toLowerCase()
    );
  if (boundPropertyTax) {
    return {
      filename,
      displayLabel: "Structured property tax input",
      treatment: "Core quantitative source",
      use: "Used for annual property tax only; does not override T12 or other modeled inputs.",
      category: "Modeled Inputs",
    };
  }
  const canonicalRole = String(row?.canonical_support_doc_role || canonical?.role || "").trim().toLowerCase();
  const taxonomyRole = String(taxonomy?.semantic_doc_role || "").trim().toLowerCase();
  const rowSemanticRole = String(row?.semantic_doc_role || "").trim().toLowerCase();
  const historicalOnlyOverride =
    taxonomyRole === "historical_capex_only" ||
    canonicalRole === "historical_capex_only" ||
    rowSemanticRole === "historical_capex_only";
  const role = String(
    historicalOnlyOverride
      ? "historical_capex_only"
      : canonicalRole || rowSemanticRole || taxonomyRole || ""
  )
    .trim()
    .toLowerCase();
  if (role === "purchase_assumptions" || role === "proposed_acquisition_financing") {
    return {
      filename,
      displayLabel: "Purchase Assumptions / Acquisition Context",
      treatment: "Acquisition context / document-derived acquisition context",
      use: "Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth.",
      category: "Displayed / Limited Use",
    };
  }
  if (role === "current_debt_context" || role === "current_mortgage_statement" || role === "current_debt_terms") {
    return {
      filename,
      displayLabel: "Debt Support Received / Contextual",
      treatment: "Debt support received / contextual or deferred",
      use: "Uploaded existing/current debt context only; not proposed acquisition financing.",
      category: "Displayed / Limited Use",
    };
  }
  if (role === "structured_renovation_capex_plan" || role === "structured_renovation") {
    return {
      filename,
      displayLabel: "Structured Renovation / CapEx Plan",
      treatment: "Structured renovation / CapEx context",
      use: "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled.",
      category: "Displayed / Limited Use",
    };
  }
  if (role === "historical_capex_only") {
    return {
      filename,
      displayLabel: "Historical Capital Items",
      treatment: "Context only",
      use: "Historical capital items are displayed for context only.",
      category: "Displayed / Limited Use",
    };
  }
  if (role === "renovation_capex_budget_context" || role === "renovation_budget") {
    return {
      filename,
      displayLabel: "Renovation / CapEx Budget Context",
      treatment: "Budget/scope only",
      use: "Document-stated renovation budget/scope is acknowledged; rent lift, ROI, payback, and phasing are not modeled unless provided.",
      category: "Displayed / Limited Use",
    };
  }
  if (role === "property_tax") {
    return {
      filename,
      displayLabel: "Property Tax Support",
      treatment: "Corroborating support",
      use: "Uploaded support document - not used quantitatively.",
      category: "Displayed / Limited Use",
    };
  }
  if (role.includes("market")) {
    return {
      filename,
      displayLabel: "Market Rent Context",
      treatment: "Context only",
      use: "Market survey / rent context only; not used to override rent roll.",
      category: "Listed but Not Quantitatively Modeled",
    };
  }
  if (
    role.includes("environmental") ||
    role.includes("esa") ||
    /phase\s*i|phase\s*1|phase i esa|phase 1 esa|environmental|environment|esa/i.test(environmentalSignalsText)
  ) {
    return {
      filename,
      displayLabel: "Environmental Due Diligence Context",
      treatment: "Context only",
      use: "Environmental due-diligence context only; not used quantitatively.",
      category: "Listed but Not Quantitatively Modeled",
    };
  }
  if (role.includes("appraisal")) {
    return {
      filename,
      displayLabel: "Appraisal Context",
      treatment: "Context only",
      use: "Appraisal context only unless structured appraised value is verified; not used quantitatively.",
      category: "Listed but Not Quantitatively Modeled",
    };
  }
  return {
    filename,
    displayLabel: "Other Support Document",
    treatment: "Context only",
    use: "Listed for auditability only; not used quantitatively.",
    category: "Listed but Not Quantitatively Modeled",
  };
}

export function buildDocumentTreatmentSummaryHtml(args = {}) {
  const rows = buildAuthorityRows(args);
  const classified = (Array.isArray(rows) ? rows : []).map((row) => classifyDocumentTreatmentRow(row, args));
  const sourceTreatmentCellStyle = "padding:4px 8px;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;";
  const sourceTreatmentRowsHtml = classified
    .map((entry) => `<tr><td style="${sourceTreatmentCellStyle}">${escapeHtml(entry.filename)}</td><td style="${sourceTreatmentCellStyle}">${escapeHtml(entry.displayLabel)}</td><td style="${sourceTreatmentCellStyle}">${escapeHtml(entry.treatment)}</td><td style="${sourceTreatmentCellStyle}">${escapeHtml(entry.use)}</td></tr>`)
    .join("");
  const section = (title, category, emptyCopy) => {
    const items = classified.filter((entry) => entry.category === category);
    if (!items.length) {
      return `<div style="margin-top:10px;"><div style="font-size:11px;font-weight:700;color:#1F3A5F;">${escapeHtml(title)}</div><p class="small" style="margin:6px 0 0 0;color:#64748b;">${escapeHtml(emptyCopy)}</p></div>`;
    }
    return `<div style="margin-top:10px;"><div style="font-size:11px;font-weight:700;color:#1F3A5F;">${escapeHtml(title)}</div><ul style="margin:6px 0 0 18px;padding:0;">${items.map((entry) => `<li data-treatment-source="canonical_support_doc_authority" style="margin:0 0 4px 0;">${escapeHtml(entry.filename)} <span style="color:#64748b;">- ${escapeHtml(entry.use)}</span></li>`).join("")}</ul></div>`;
  };
  return `<div class="card no-break" style="margin-top:10px;"><p class="subsection-title">Document Treatment Summary</p><p class="small" style="margin:0;color:#374151;">Uploaded files are listed for auditability. Only structured source inputs are used quantitatively. Unsupported or unclassified support files are not used to override modeled outputs.</p><div style="margin-top:10px;"><p class="subsection-title">Source Treatment / Quantitative Use</p><table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:28%;">Filename</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Document Role</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Treatment</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Use</th></tr></thead><tbody>${sourceTreatmentRowsHtml}</tbody></table></div>${section("Modeled Inputs", "Modeled Inputs", "No modeled inputs were classified from structured source metadata.")}${section("Displayed / Limited Use", "Displayed / Limited Use", "No limited-use historical capital items were classified from structured source metadata.")}${section("Listed but Not Quantitatively Modeled", "Listed but Not Quantitatively Modeled", "No additional unmodeled support files were identified.")}</div>`;
}

export function buildPreliminaryFinancingReadinessSummaryHtml({
  reportMode = null,
  acquisitionMemoRenderContext = null,
  supportDocAuthorityRows = null,
  canonicalSupportDocMap = null,
  sourceReportCoverageQa = null,
  propertyTaxPayload = null,
  propertyTaxBindingState = null,
  formatCurrency: formatCurrencyArg = formatCurrency,
} = {}) {
  if (String(reportMode || "").toLowerCase() !== "v1_core") return "";
  const rows = buildAuthorityRows({ supportDocAuthorityRows, canonicalSupportDocMap });
  const purchase = rows.find((row) => /purchase_assumptions|proposed_acquisition_financing/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || "")));
  const currentDebt = rows.find((row) => /current_debt_context|current_mortgage/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || "")));
  const renovation = rows.find((row) => /renovation|capex/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || "")));
  const currentDebtRows = currentDebt
    ? [
        firstFinite(currentDebt?.outstanding_balance, currentDebt?.current_outstanding_balance, currentDebt?.current_loan_balance)
          ? `<tr><td>Outstanding Balance</td><td style="font-weight:600;">${formatCurrencyArg(firstFinite(currentDebt.outstanding_balance, currentDebt.current_outstanding_balance, currentDebt.current_loan_balance))}</td></tr>`
          : "",
        firstFinite(currentDebt?.interest_rate)
          ? `<tr><td>Interest Rate</td><td style="font-weight:600;">${formatInterestRatePercent(firstFinite(currentDebt.interest_rate))}</td></tr>`
          : "",
      ].filter(Boolean).join("")
    : "";
  const proposedComplete = Boolean(
    purchase &&
      firstFinite(purchase?.purchase_price, purchase?.acquisition_price) &&
      (firstFinite(purchase?.stated_acquisition_loan_amount, purchase?.loan_amount, purchase?.derived_acquisition_loan_amount) || firstFinite(purchase?.ltv)) &&
      firstFinite(purchase?.interest_rate) &&
      firstFinite(purchase?.amortization_years, purchase?.amort_years)
  );
  return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Preliminary Financing Readiness Summary</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody><tr><td>T12 verified</td><td style="font-weight:600;">${sourceReportCoverageQa?.artifact_inventory?.t12_parsed?.present === true && sourceReportCoverageQa?.artifact_inventory?.t12_parsed?.has_core_totals === true ? "Yes" : "No"}</td></tr><tr><td>Rent Roll verified</td><td style="font-weight:600;">${sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed?.present === true ? "Yes" : "No"}</td></tr><tr><td>Purchase assumptions provided</td><td style="font-weight:600;">${purchase ? "Yes" : "No"}</td></tr><tr><td>Current debt context uploaded</td><td style="font-weight:600;">${currentDebt ? "Yes" : "No"}</td></tr><tr><td>Property tax support</td><td style="font-weight:600;">${Boolean(propertyTaxBindingState?.hasValidatedAnnualTax || isValidAnnualPropertyTaxValue(propertyTaxPayload?.annual_tax)) ? "Yes" : "No"}</td></tr><tr><td>Proposed acquisition loan terms complete</td><td style="font-weight:600;">${proposedComplete ? "Yes" : "No"}</td></tr></tbody></table>${currentDebtRows ? `<div style="margin-top:10px;"><p class="subsection-title">Uploaded Existing Debt Context</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${currentDebtRows}</tbody></table></div>` : ""}${renovation ? `<p class="small" style="margin-top:8px;color:#64748b;">CapEx / renovation plan: Context only unless verified budget and rent-lift assumptions exist</p>` : ""}</div>`;
}

export function buildAcquisitionFinancingReadinessHtml({
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  currentDebtAssessmentState = null,
  reportMode = null,
} = {}) {
  const payload = loanTermSheetTermsPayload || {};
  const debtBasis = String(payload?.debt_basis || "").trim().toLowerCase();
  const purchasePrice = firstFinite(payload?.purchase_price, acquisitionTermsPayload?.purchase_price);
  const loanAmount = firstFinite(payload?.stated_acquisition_loan_amount, payload?.loan_amount, payload?.derived_acquisition_loan_amount);
  const ltv = firstFinite(payload?.ltv);
  const interestRate = firstFinite(payload?.interest_rate);
  const amortYears = firstFinite(payload?.amortization_years, payload?.amort_years);
  const lenderFee = firstFinite(payload?.lender_fee_percent, payload?.financing_fee_percent, payload?.origination_fee_percent);
  const sourceComplete =
    debtBasis !== "current_debt_context" &&
    Number.isFinite(purchasePrice) &&
    (Number.isFinite(loanAmount) || Number.isFinite(ltv)) &&
    Number.isFinite(interestRate) &&
    Number.isFinite(amortYears);
  if (!sourceComplete) {
    return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Proposed Acquisition Financing Context</p><table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:11px;"><tbody><tr><td colspan="2" style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">Proposed Acquisition Financing: Not source-complete / not modeled.</td></tr></tbody></table></div>`;
  }
  const rows = [
    ["Purchase Price", formatCurrency(purchasePrice)],
    ["Proposed Loan Amount", Number.isFinite(loanAmount) ? formatCurrency(loanAmount) : "Not assessed"],
    ["LTV", Number.isFinite(ltv) ? formatPercent1(ltv) : "Not assessed"],
    ["Interest Rate", formatInterestRatePercent(interestRate)],
    ["Amortization", `${Math.round(amortYears)} years`],
    Number.isFinite(lenderFee) ? ["Closing / Lender Fee", formatPercentExactDisplay(lenderFee)] : null,
  ].filter(Boolean);
  return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Proposed Acquisition Financing Context</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">This is source-bound proposed acquisition financing context only. It is not loan approval, lender commitment, credit decision, refinance sufficiency analysis, or debt-service underwriting.</p><table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:11px;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F8FAFC;color:#1e293b;border:1px solid #E5E7EB;">Input</th><th style="text-align:left;padding:4px 8px;background:#F8FAFC;color:#1e293b;border:1px solid #E5E7EB;">Value</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(label)}</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(value)}</td></tr>`).join("")}</tbody></table></div>`;
}

export function buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload = null,
  acquisitionTriangleValidationState = null,
  returnState = false,
} = {}) {
  if (returnState) {
    return {
      renderBehavior: acquisitionTriangleValidationState?.renderedBehavior || "collapse_to_disclosure",
      triangleValidationState: acquisitionTriangleValidationState || null,
    };
  }
  return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Acquisition Financing Assumptions</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">Acquisition financing inputs were not safe to render as a full debt sizing table.</p><p class="small" style="margin:8px 0 0 0;color:#64748b;">This section is limited to non-contradictory verified fields only.</p>${loanTermSheetTermsPayload?.closing_cost_notes ? `<p class="small" style="margin:8px 0 0 0;color:#64748b;">Closing Cost Notes: ${escapeHtml(String(loanTermSheetTermsPayload.closing_cost_notes).replace(/legal\/appraisal/gi, "Legal/appraisal"))}; not quantified.</p>` : ""}</div>`;
}
