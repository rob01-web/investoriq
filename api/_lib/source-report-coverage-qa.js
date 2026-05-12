const COVERAGE_QA_VERSION = "2026.05.05.1";

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function hasPositive(value) {
  const n = asNumber(value);
  return Number.isFinite(n) && n > 0;
}

function validOccupancy(value) {
  const n = asNumber(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

function deriveRentRollInventoryOccupancy(rentRoll) {
  const totals = rentRoll?.totals && typeof rentRoll.totals === "object" ? rentRoll.totals : null;
  const totalsOccupancy = validOccupancy(totals?.occupancy);
  if (Number.isFinite(totalsOccupancy)) return totalsOccupancy;

  const occupiedUnits = asNumber(totals?.occupied_units);
  const totalUnits = asNumber(totals?.total_units);
  if (Number.isFinite(occupiedUnits) && Number.isFinite(totalUnits) && totalUnits > 0) {
    const derivedOccupancy = validOccupancy(occupiedUnits / totalUnits);
    if (Number.isFinite(derivedOccupancy)) return derivedOccupancy;
  }

  const unitRows = Array.isArray(rentRoll?.units) ? rentRoll.units : [];
  if (unitRows.length > 0) {
    const occupiedFromRows = unitRows.reduce((count, row) => {
      const statusText = String(row?.status ?? row?.lease_status ?? row?.unit_status ?? "").toLowerCase();
      if (/\bvacan(?:t|cy)\b/.test(statusText)) return count;
      const rent = asNumber(
        row?.current_rent ??
          row?.in_place_rent ??
          row?.rent ??
          row?.monthly_rent ??
          row?.actual_rent
      );
      return Number.isFinite(rent) && rent > 0 ? count + 1 : count;
    }, 0);
    const rowOccupancy = validOccupancy(occupiedFromRows / unitRows.length);
    if (Number.isFinite(rowOccupancy)) return rowOccupancy;
  }

  return (
    validOccupancy(rentRoll?.occupancy) ??
    validOccupancy(rentRoll?.occupancy_rate) ??
    validOccupancy(rentRoll?.physical_occupancy) ??
    null
  );
}

function latestArtifact(artifacts, type) {
  return (artifacts || []).find((row) => row?.type === type) || null;
}

function artifactPresent(artifacts, type) {
  return Boolean(latestArtifact(artifacts, type));
}

function normalizeFile(row) {
  return {
    id: row?.id || null,
    original_filename: String(row?.original_filename || ""),
    doc_type: String(row?.doc_type || ""),
    mime_type: String(row?.mime_type || ""),
    parse_status: String(row?.parse_status || ""),
    parse_error: row?.parse_error || null,
  };
}

function fileMatches(file, pattern) {
  const text = `${file.original_filename} ${file.doc_type}`.toLowerCase();
  return pattern.test(text);
}

function findFiles(files, pattern) {
  return files.filter((file) => fileMatches(file, pattern));
}

function buildRenderedSections(html) {
  const text = typeof html === "string" ? html : "";
  const has = (pattern) => pattern.test(text);
  const sections = {
    has_refi_stability_section: has(/Refinance Stress Test|SECTION_7_REFI_STABILITY/i),
    has_debt_section: has(/Debt Structure|Current Debt Coverage|SECTION_7_DEBT/i),
    has_operating_statement_section: has(/Operating Statement|Income Reconstruction|T12/i),
    has_scenario_section: has(/Scenario|Stress Summary|SECTION_3_SCENARIO/i),
    has_risk_section: has(/Risk Matrix|Risk Register|SECTION_5_RISK/i),
    has_renovation_section: has(/Renovation Strategy|Capital Plan|SECTION_6_RENOVATION/i),
    has_deal_score_section: has(/Deal Scorecard|SECTION_8_DEAL_SCORE/i),
    has_dcf_section: has(/Discounted Cash Flow|SECTION_9_DCF|Intrinsic Value/i),
    has_advanced_modeling_section: has(/Advanced Modeling|SECTION_10_ADV_MODEL/i),
    has_methodology_section: has(/Methodology|Data Transparency|SECTION_12/i),
  };
  const section_count = Object.values(sections).filter(Boolean).length;
  return { ...sections, section_count };
}

function findRenderedSignals(html) {
  const text = typeof html === "string" ? html : "";
  const signalPatterns = [
    ["no_line_item_detail", /No line-item detail available/i],
    ["lump_sum_t12", /Lump-Sum T12/i],
    ["no_structured_capex_modeling", /no structured CapEx modeling/i],
    ["renovation_not_converted", /not converted into verified structured renovation inputs/i],
    ["dscr_current_debt_not_assessed", /Current Debt DSCR|Current debt service is not assessed/i],
    ["debt_sizing_balance_not_provided", /current outstanding debt balance not provided/i],
    ["refinance_stability_not_produced", /Refinance Stability Classification not produced/i],
    ["acquisition_financing_assumptions", /Proposed Acquisition Debt Sizing|Acquisition Financing Assumptions|Derived Acquisition Loan Amount|Proposed Acquisition DSCR|Derived from uploaded purchase assumptions/i],
  ];
  return signalPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([code]) => code);
}

function buildArtifactInventory(artifacts) {
  const t12 = latestArtifact(artifacts, "t12_parsed")?.payload || null;
  const rentRoll = latestArtifact(artifacts, "rent_roll_parsed")?.payload || null;
  const loan = latestArtifact(artifacts, "loan_term_sheet_parsed")?.payload || null;
  const mortgage = latestArtifact(artifacts, "mortgage_statement_parsed")?.payload || null;
  const renovation = latestArtifact(artifacts, "renovation_parsed")?.payload || null;
  const appraisal = latestArtifact(artifacts, "appraisal_parsed")?.payload || null;
  const propertyTax = latestArtifact(artifacts, "property_tax_parsed")?.payload || null;

  return {
    rent_roll_parsed: {
      present: Boolean(rentRoll),
      unit_count: rentRoll?.unit_count ?? rentRoll?.total_units ?? rentRoll?.totalUnits ?? null,
      occupancy: deriveRentRollInventoryOccupancy(rentRoll),
      method: rentRoll?.method || null,
    },
    t12_parsed: {
      present: Boolean(t12),
      has_core_totals:
        hasPositive(t12?.effective_gross_income) ||
        hasPositive(t12?.total_operating_expenses) ||
        hasPositive(t12?.net_operating_income),
      income_line_count: Array.isArray(t12?.income_lines) ? t12.income_lines.length : 0,
      expense_line_count: Array.isArray(t12?.expense_lines) ? t12.expense_lines.length : 0,
      method: t12?.method || null,
    },
    loan_term_sheet_parsed: {
      present: Boolean(loan),
      has_balance: hasPositive(loan?.loan_amount) || hasPositive(loan?.outstanding_balance),
      has_derived_acquisition_debt: hasPositive(loan?.derived_acquisition_loan_amount),
      has_purchase_price: hasPositive(loan?.purchase_price),
      has_payment: hasPositive(loan?.monthly_payment) || hasPositive(loan?.annual_debt_service),
      has_rate: hasPositive(loan?.interest_rate),
      has_amortization: hasPositive(loan?.amort_years),
    },
    mortgage_statement_parsed: {
      present: Boolean(mortgage),
      has_balance: hasPositive(mortgage?.outstanding_balance),
      has_payment: hasPositive(mortgage?.monthly_payment) || hasPositive(mortgage?.annual_debt_service),
      has_rate: hasPositive(mortgage?.interest_rate),
      has_amortization: hasPositive(mortgage?.amort_years),
    },
    renovation_parsed: {
      present: Boolean(renovation),
      has_capex_amount: hasPositive(renovation?.total_capex) || hasPositive(renovation?.renovation_budget),
      has_scope:
        Array.isArray(renovation?.scope_items) && renovation.scope_items.length > 0,
    },
    appraisal_parsed: {
      present: Boolean(appraisal),
      has_cap_rate: hasPositive(appraisal?.cap_rate),
    },
    property_tax_parsed: {
      present: Boolean(propertyTax),
      has_annual_tax: hasPositive(propertyTax?.annual_tax),
    },
  };
}

function addFlag(flags, flag) {
  flags.push(flag);
}

function summarize(flags) {
  const severityRank = { low: 1, medium: 2, high: 3 };
  const severity = flags.reduce((max, flag) => (
    severityRank[flag.severity] > severityRank[max] ? flag.severity : max
  ), "low");
  const hasHigh = flags.some((flag) => flag.severity === "high");
  const hasMedium = flags.some((flag) => flag.severity === "medium");
  return {
    qa_status: hasHigh ? "review" : hasMedium ? "warn" : "pass",
    severity: flags.length ? severity : "low",
    routing_summary: Array.from(new Set(flags.map((flag) => flag.routing))),
  };
}

export function buildSourceReportCoverageQa({
  jobId = null,
  userId = null,
  propertyName = null,
  reportType = null,
  reportTier = null,
  html = "",
  uploadedFiles = [],
  artifacts = [],
} = {}) {
  const files = uploadedFiles.map(normalizeFile);
  const artifactInventory = buildArtifactInventory(artifacts);
  const renderedSections = buildRenderedSections(html);
  const renderedTextSignals = findRenderedSignals(html);
  const flags = [];
  const normalizedReportType = String(reportType || "").toLowerCase();
  const numericReportTier = Number(reportTier);
  const isFullUnderwriting = normalizedReportType === "underwriting" || numericReportTier === 2;
  const htmlText = typeof html === "string" ? html : "";

  const t12 = artifactInventory.t12_parsed;
  const rentRoll = artifactInventory.rent_roll_parsed;
  const hasCoreOperatingMetrics =
    t12.present &&
    t12.has_core_totals &&
    hasPositive(rentRoll.unit_count);
  if (
    isFullUnderwriting &&
    hasCoreOperatingMetrics &&
    /(?:Operating Profile|Capital Risk Profile|CAPITAL RISK\s*PROFILE|SCREENING\s*SIGNAL)[\s\S]{0,160}Insufficient Data/i.test(htmlText)
  ) {
    addFlag(flags, {
      code: "CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL",
      severity: "high",
      category: "rendered_output_consistency",
      message: "Rendered Full Underwriting classification says Insufficient Data even though core operating metrics are present.",
      evidence: {
        t12_has_core_totals: t12.has_core_totals,
        unit_count: rentRoll.unit_count,
        rendered_text_signals: ["insufficient_data_classification"],
      },
      routing: "render_gating_gap",
    });
  }
  const hasUsefulT12LineItems = t12.income_line_count >= 3 || t12.expense_line_count >= 3;
  if (
    t12.present &&
    t12.has_core_totals &&
    !hasUsefulT12LineItems &&
    /No line-item detail available|Lump-Sum T12|reported totals/i.test(htmlText)
  ) {
    addFlag(flags, {
      code: "T12_LINE_ITEM_DETAIL_MISSING",
      severity: "medium",
      category: "source_to_report_coverage",
      message: "T12 totals are present, but line-item income and expense detail did not reach the rendered report.",
      evidence: {
        income_line_count: t12.income_line_count,
        expense_line_count: t12.expense_line_count,
        has_core_totals: t12.has_core_totals,
        rendered_text_signals: renderedTextSignals.filter((signal) =>
          ["no_line_item_detail", "lump_sum_t12"].includes(signal)
        ),
      },
      routing: "parser_gap",
    });
  }

  const renovationFiles = findFiles(files, /(renov|capex|cap ex|capital|budget)/i);
  if (
    renovationFiles.length > 0 &&
    !artifactInventory.renovation_parsed.present &&
    /Uploaded Renovation|CapEx Document|no structured CapEx modeling|not converted into verified structured renovation inputs/i.test(htmlText)
  ) {
    addFlag(flags, {
      code: "RENOVATION_DOC_NOT_STRUCTURED",
      severity: "medium",
      category: "source_to_report_coverage",
      message: "Renovation or CapEx support appears uploaded, but no structured renovation artifact reached the report.",
      evidence: {
        filenames: renovationFiles.map((file) => file.original_filename),
        renovation_artifact_present: artifactInventory.renovation_parsed.present,
        rendered_text_signals: renderedTextSignals.filter((signal) =>
          ["no_structured_capex_modeling", "renovation_not_converted"].includes(signal)
        ),
      },
      routing: "artifact_gap",
    });
  }

  const debtFiles = findFiles(files, /(purchase|assumption|financ|loan|debt|term|cmhc|ltv|amort|rate|mortgage)/i);
  const loan = artifactInventory.loan_term_sheet_parsed;
  const mortgage = artifactInventory.mortgage_statement_parsed;
  const hasAcquisitionFinancingAssumptions =
    loan.has_derived_acquisition_debt &&
    loan.has_purchase_price &&
    loan.has_rate &&
    loan.has_amortization &&
    renderedTextSignals.includes("acquisition_financing_assumptions");
  const acquisitionFinancingCoverage = {
    required_inputs_present:
      loan.has_derived_acquisition_debt &&
      loan.has_purchase_price &&
      loan.has_rate &&
      loan.has_amortization,
    rendered: hasAcquisitionFinancingAssumptions,
    current_debt_assessed: false,
  };
  const hasDebtSizing =
    loan.has_balance ||
    loan.has_payment ||
    mortgage.has_balance ||
    mortgage.has_payment;
  if (
    isFullUnderwriting &&
    debtFiles.length > 0 &&
    !hasDebtSizing &&
    !hasAcquisitionFinancingAssumptions &&
    /Current Debt DSCR|current debt service|current outstanding debt balance not provided|Debt terms incomplete/i.test(htmlText)
  ) {
    addFlag(flags, {
      code: "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
      severity: "high",
      category: "source_to_report_coverage",
      message: "Debt, financing, or purchase-support documents appear uploaded, but usable debt sizing did not reach the report.",
      evidence: {
        filenames: debtFiles.map((file) => file.original_filename),
        loan_term_sheet: loan,
        mortgage_statement: mortgage,
        acquisition_financing: acquisitionFinancingCoverage,
        rendered_text_signals: renderedTextSignals.filter((signal) =>
          ["dscr_current_debt_not_assessed", "debt_sizing_balance_not_provided", "refinance_stability_not_produced"].includes(signal)
        ),
      },
      routing: "artifact_gap",
    });
  }

  const keyUnderwritingSections = [
    "has_operating_statement_section",
    "has_scenario_section",
    "has_risk_section",
    "has_debt_section",
    "has_deal_score_section",
    "has_dcf_section",
    "has_advanced_modeling_section",
  ];
  const presentUnderwritingSections = keyUnderwritingSections.filter((key) => renderedSections[key]).length;
  const missingKeySections = keyUnderwritingSections.filter((key) => !renderedSections[key]);
  const supportPackageLooksBroad =
    files.length >= 4 ||
    renovationFiles.length > 0 ||
    debtFiles.length > 0 ||
    artifactPresent(artifacts, "appraisal_parsed") ||
    artifactPresent(artifacts, "property_tax_parsed");
  const minimumUnderwritingSectionCountMet = !isFullUnderwriting || presentUnderwritingSections >= 5;
  if (
    isFullUnderwriting &&
    supportPackageLooksBroad &&
    (presentUnderwritingSections < 5 || !renderedSections.has_debt_section || !renderedSections.has_deal_score_section)
  ) {
    addFlag(flags, {
      code: "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
      severity: "high",
      category: "tier_depth",
      message: "The rendered underwriting report appears constrained relative to the uploaded support package and report tier.",
      evidence: {
        uploaded_file_count: files.length,
        present_underwriting_sections: presentUnderwritingSections,
        missing_key_sections: missingKeySections,
        rendered_section_count: renderedSections.section_count,
        rendered_text_signals: renderedTextSignals,
      },
      routing: "admin_review_required",
    });
  }

  const materialSupportFiles = files.filter((file) =>
    fileMatches(file, /(renov|capex|cap ex|capital|budget|purchase|assumption|financ|loan|debt|term|cmhc|ltv|amort|rate|mortgage|appraisal|tax)/i)
  );
  const materialIssueCodes = flags
    .filter((flag) => ["parser_gap", "artifact_gap", "admin_review_required", "render_gating_gap"].includes(flag.routing))
    .map((flag) => flag.code);
  const onlyT12LineItemIssue =
    materialIssueCodes.length > 0 &&
    materialIssueCodes.every((code) => code === "T12_LINE_ITEM_DETAIL_MISSING");
  const supportPackageUsedExceptT12LineItems =
    acquisitionFinancingCoverage.rendered &&
    artifactInventory.renovation_parsed.present &&
    minimumUnderwritingSectionCountMet &&
    onlyT12LineItemIssue;
  if (
    isFullUnderwriting &&
    materialSupportFiles.length >= 2 &&
    supportPackageLooksBroad &&
    !supportPackageUsedExceptT12LineItems &&
    (presentUnderwritingSections < 6 || flags.some((flag) => flag.routing === "artifact_gap" || flag.routing === "parser_gap"))
  ) {
    addFlag(flags, {
      code: "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
      severity: "high",
      category: "source_to_report_coverage",
      message: "Multiple material support documents appear uploaded, but the rendered underwriting output remains constrained or omits expected depth.",
      evidence: {
        material_support_filenames: materialSupportFiles.map((file) => file.original_filename),
        acquisition_financing: acquisitionFinancingCoverage,
        present_underwriting_sections: presentUnderwritingSections,
        rendered_section_count: renderedSections.section_count,
        rendered_text_signals: renderedTextSignals,
      },
      routing: "admin_review_required",
    });
  }

  if (flags.some((flag) => flag.severity === "medium" || flag.severity === "high")) {
    addFlag(flags, {
      code: "PUBLIC_SAMPLE_NOT_READY",
      severity: "medium",
      category: "sample_readiness",
      message: "Coverage findings should be resolved or reviewed before using this output as a public or outreach sample.",
      evidence: {
        related_flags: flags.map((flag) => flag.code),
      },
      routing: "public_sample_blocker",
    });
  }

  const summary = summarize(flags);
  return {
    event: "source_report_coverage_qa",
    advisory_only: true,
    no_public_surface: true,
    report_type: reportType || null,
    report_tier: reportTier ?? null,
    job_id: jobId,
    user_id: userId,
    property_name: propertyName || null,
    uploaded_files: files,
    artifact_inventory: artifactInventory,
    rendered_sections: renderedSections,
    rendered_text_signals: renderedTextSignals,
    deterministic_flags: flags,
    expected_depth: {
      full_underwriting: isFullUnderwriting,
      support_package_looks_broad: supportPackageLooksBroad,
      present_underwriting_sections: presentUnderwritingSections,
      minimum_underwriting_section_count_met: minimumUnderwritingSectionCountMet,
    },
    qa_status: summary.qa_status,
    severity: summary.severity,
    routing_summary: summary.routing_summary,
    version: COVERAGE_QA_VERSION,
    timestamp: new Date().toISOString(),
  };
}

export const __test__ = {
  buildRenderedSections,
  findRenderedSignals,
  buildArtifactInventory,
};
