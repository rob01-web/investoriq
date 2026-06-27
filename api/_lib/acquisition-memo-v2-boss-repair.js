import { escapeHtml, replaceAll } from "./report-formatting-helpers.js";
import { stripEmptyHeadingBlocks, stripMarkedSection } from "./report-html-helpers.js";
import {
  buildSourceReconciliationRenderState,
  sanitizeFinalCustomerHtml,
} from "./report-surface-contracts.js";

const OPTIONAL_SECTION_KEYS = new Set([
  "acquisitionRequestContext",
  "currentDebtContext",
  "proposedFinancingContext",
  "appraisalContext",
  "renovationContext",
  "marketSurveyContext",
  "environmentalContext",
  "documentTreatment",
  "dataCoverageSourceLimitations",
  "methodologyDataTransparency",
]);

const REPAIRABLE_BOSS_CODES = new Map([
  ["ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED", "acquisitionRequestContext"],
  ["CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED", "currentDebtContext"],
  ["PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED", "proposedFinancingContext"],
  ["DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED", "documentTreatment"],
  ["UNSUPPORTED_RENOVATION_MODELING_SURFACE", "renovationContext"],
  ["UNSUPPORTED_APPRAISAL_MARKET_SURVEY_QUANT_RELIANCE", "appraisalContext"],
  ["PURCHASE_ASSUMPTIONS_FALSE_MISSING", "acquisitionRequestContext"],
  ["CURRENT_DEBT_FALSE_MISSING", "currentDebtContext"],
  ["ACCEPTED_PURCHASE_ASSUMPTIONS_LOST", "acquisitionRequestContext"],
  ["ACCEPTED_CURRENT_DEBT_LOST", "currentDebtContext"],
  ["HTML_PURCHASE_ASSUMPTIONS_FALSE_MISSING", "acquisitionRequestContext"],
  ["HTML_CURRENT_DEBT_FALSE_MISSING", "currentDebtContext"],
  ["HTML_LENDER_FEE_MISSING", "acquisitionRequestContext"],
  ["HTML_PROPOSED_LOAN_MISSING", "acquisitionRequestContext"],
  ["HTML_PROPOSED_LTV_MISSING", "acquisitionRequestContext"],
  ["HTML_PROPOSED_RATE_MISSING", "acquisitionRequestContext"],
  ["HTML_PROPOSED_AMORTIZATION_MISSING", "acquisitionRequestContext"],
]);

const REPAIRABLE_PATH_TO_SECTIONS = [
  ["model.supportSourcesByRole.purchase_assumptions", ["acquisitionRequestContext", "proposedFinancingContext"]],
  ["model.supportSourcesByRole.current_debt_context", ["currentDebtContext"]],
  ["model.sections.acquisitionRequestContext", ["acquisitionRequestContext", "proposedFinancingContext"]],
  ["model.sections.currentDebtContext", ["currentDebtContext"]],
  ["model.sections.proposedFinancingContext", ["proposedFinancingContext"]],
  ["html.acquisitionRequestContext", ["acquisitionRequestContext", "proposedFinancingContext"]],
  ["html.currentDebtContext", ["currentDebtContext"]],
  ["html.proposedFinancingContext", ["proposedFinancingContext"]],
  ["html.appraisalContext", ["appraisalContext"]],
  ["html.renovationContext", ["renovationContext"]],
  ["html.marketSurveyContext", ["marketSurveyContext"]],
  ["html.environmentalContext", ["environmentalContext"]],
  ["html.documentTreatment", ["documentTreatment"]],
  ["html.dataCoverage", ["dataCoverageSourceLimitations"]],
  ["html.methodology", ["methodologyDataTransparency"]],
];

const REPAIRABLE_INTERNAL_LANGUAGE_PATTERNS = [
  /<!--[\s\S]*?(?:IQ_SOURCE_AUTHORITY|Boss Contract|CustomerSurfaceModel|Source Authority|V2 Canonical Package|canonical source package|V2 projection|semantic_doc_role|parser|stack trace)[\s\S]*?-->/gi,
  /\bBoss Contract\b/gi,
  /\bCustomerSurfaceModel\b/gi,
  /\bSource Authority\b/gi,
  /\bV2 Canonical Package\b/gi,
  /\bcanonical source package\b/gi,
  /\bV2 projection\b/gi,
  /\bassertion code names\b/gi,
  /\bstack trace\b/gi,
];

const REPAIRABLE_ADVANCED_SURFACE_PATTERNS = [
  /\bDSCR\b/gi,
  /\brefinance\b/gi,
  /\brefi\b/gi,
  /\bDCF\b/gi,
  /\bwaterfall\b/gi,
  /\bequity return\b/gi,
  /\bdeal score\b/gi,
  /\bloan approval\b/gi,
  /\brenovation ROI\b/gi,
  /\bpayback analysis\b/gi,
  /\bNOI impact\b/gi,
  /\bvalue impact\b/gi,
  /\bimplementation modeling\b/gi,
];

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  if (Array.isArray(value)) return value.map((item) => clone(item));
  if (isPlainObject(value)) {
    const cloned = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      cloned[key] = clone(nestedValue);
    }
    return cloned;
  }
  return value;
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function extractSectionKeyFromPath(path = "") {
  const normalizedPath = String(path || "").trim();
  for (const [pathFragment, sectionKeys] of REPAIRABLE_PATH_TO_SECTIONS) {
    if (normalizedPath.includes(pathFragment)) return Array.isArray(sectionKeys) ? sectionKeys.slice() : [sectionKeys];
  }
  for (const key of OPTIONAL_SECTION_KEYS) {
    if (normalizedPath.includes(key)) return key;
  }
  return null;
}

function extractRepairableSectionsFromViolation(violation = {}) {
  const path = String(violation?.path || violation?.section || "").trim();
  const code = String(violation?.code || "").trim();
  const sectionKeyFromPath = extractSectionKeyFromPath(path);
  if (sectionKeyFromPath) return Array.isArray(sectionKeyFromPath) ? sectionKeyFromPath : [sectionKeyFromPath];
  const sectionKeyFromCode = REPAIRABLE_BOSS_CODES.get(code) || null;
  if (sectionKeyFromCode) return Array.isArray(sectionKeyFromCode) ? sectionKeyFromCode : [sectionKeyFromCode];
  return [];
}

function isForbiddenSurfaceViolation(violation = {}) {
  const path = normalizeText(violation?.path || violation?.section || "");
  const code = normalizeText(violation?.code || "");
  return Boolean(
    path.includes("html.forbiddensurfaces") ||
      path.includes("html.internal") ||
      code === "no_forbidden_surfaces" ||
      code === "html_forbidden_surfaces_present" ||
      code.includes("forbidden")
  );
}

function isCoreFatalPath(path = "", code = "") {
  const normalizedPath = normalizeText(path);
  const normalizedCode = normalizeText(code);
  return Boolean(
    normalizedPath.includes("model.coresources.coret12") ||
      normalizedPath.includes("model.coresources.corerentroll") ||
      normalizedPath.includes("html.unitmix") ||
      normalizedPath.includes("html.capratevalueindication") ||
      normalizedPath.includes("html.operatingstatementttmsummary") ||
      normalizedPath.includes("html.internal") ||
      normalizedCode === "model_core_t12_missing" ||
      normalizedCode === "model_core_rent_roll_missing" ||
      normalizedCode === "section_required_fact_missing" ||
      normalizedCode === "section_missing_facts_without_collapse"
  );
}

export function buildAcquisitionMemoV2BossRepairPlan({
  bossCompliance = null,
  customerSurfaceModelValidation = null,
  customerSurfaceHtmlValidation = null,
} = {}) {
  const violations = [
    ...(Array.isArray(customerSurfaceModelValidation?.issues) ? customerSurfaceModelValidation.issues : []),
    ...(Array.isArray(customerSurfaceHtmlValidation?.issues) ? customerSurfaceHtmlValidation.issues : []),
    ...(Array.isArray(bossCompliance?.violations) ? bossCompliance.violations : []),
  ];

  const coreFatal = [];
  const repairableOptionalSupport = [];
  const forbiddenSurface = [];
  const advisoryOnly = [];
  const repairableSectionKeys = new Set();

  for (const violation of violations) {
    const code = String(violation?.code || "").trim();
    const path = String(violation?.path || violation?.section || "").trim();
    const severity = String(violation?.severity || "").trim().toLowerCase();

    if (severity === "advisory" || severity === "warning") {
      advisoryOnly.push(violation);
      continue;
    }

    if (isForbiddenSurfaceViolation(violation)) {
      forbiddenSurface.push(violation);
      continue;
    }

    if (isCoreFatalPath(path, code)) {
      coreFatal.push(violation);
      continue;
    }

    const sectionKeys = extractRepairableSectionsFromViolation(violation);
    if (sectionKeys.length > 0) {
      repairableOptionalSupport.push(violation);
      for (const sectionKey of sectionKeys) repairableSectionKeys.add(sectionKey);
      continue;
    }

    coreFatal.push(violation);
  }

  return {
    shouldRetry: coreFatal.length === 0 && (repairableOptionalSupport.length > 0 || forbiddenSurface.length > 0),
    coreFatal,
    repairableOptionalSupport,
    forbiddenSurface,
    advisoryOnly,
    repairableSectionKeys: Array.from(repairableSectionKeys),
  };
}

export function applyAcquisitionMemoV2BossRepairPlan(customerSurfaceModel, repairPlan = null) {
  if (!isPlainObject(customerSurfaceModel) || !repairPlan) return customerSurfaceModel;
  const repaired = clone(customerSurfaceModel);
  const sectionKeys = Array.isArray(repairPlan.repairableSectionKeys) ? repairPlan.repairableSectionKeys : [];

  for (const sectionKey of sectionKeys) {
    const section = repaired?.sections?.[sectionKey];
    if (!isPlainObject(section)) continue;
    section.status = "collapsed";
    section.factAvailability = {
      required: Array.isArray(section.factAvailability?.required) ? clone(section.factAvailability.required) : [],
      available: [],
      missing: [],
      sourceBacked: false,
    };
  }

  return repaired;
}

export function repairAcquisitionMemoV2HtmlForRepairPlan(html, repairPlan = null) {
  if (typeof html !== "string" || !repairPlan) return html;
  const hasRepairableHtmlIssue =
    Array.isArray(repairPlan.forbiddenSurface) && repairPlan.forbiddenSurface.length > 0;
  if (!hasRepairableHtmlIssue) return html;

  let repaired = html;
  for (const pattern of REPAIRABLE_INTERNAL_LANGUAGE_PATTERNS) {
    repaired = repaired.replace(pattern, "");
  }
  for (const pattern of REPAIRABLE_ADVANCED_SURFACE_PATTERNS) {
    repaired = repaired.replace(pattern, "");
  }
  return repaired;
}

export function applyAcquisitionMemoV2SourceReconciliationRenderGuard(
  html,
  sourceReconciliationState = null
) {
  const inputHtml = String(html || "");
  const renderState = buildSourceReconciliationRenderState({ sourceReconciliationState });
  const canonicalDisplay = renderState?.variance_display || null;
  const disclosure =
    renderState?.source_reconciliation_disclosure ||
    "InvestorIQ has not reconciled this variance and does not infer the cause.";
  const staleVarianceRegex = /-48\.0%/g;
  const snippetPatterns = [
    /Rent Roll vs T12 GPR Variance[^<\n]{0,160}/gi,
    /Rent roll annualized rent is[^<\n]{0,220}/gi,
    /Source reconciliation variance of[^<\n]{0,220}/gi,
  ];
  const displayPatterns = [
    /<tr[^>]*>\s*<td>\s*Rent Roll vs T12 GPR Variance\s*<\/td>\s*<td>\s*([+\-]?\d+(?:\.\d+)?)%\s*<\/td>\s*<\/tr>/gi,
    /Rent roll annualized rent is\s*([+\-]?\d+(?:\.\d+)?)%\s*vs\s*T12 GPR/gi,
    /Source reconciliation variance of\s*([+\-]?\d+(?:\.\d+)?)%\s*between rent roll and T12 gross potential rent requires review\./gi,
    /<li>\s*Rent Roll vs T12 GPR\s*([+\-]?\d+(?:\.\d+)?)%\s*<\/li>/gi,
  ];
  const extractSnippets = (text) =>
    snippetPatterns.flatMap((pattern) => Array.from(text.matchAll(pattern), (match) => match[0])).slice(0, 10);
  const extractVarianceDisplays = (text) =>
    displayPatterns
      .flatMap((pattern) =>
        Array.from(text.matchAll(pattern), (match) => {
          const display = match[1];
          const numericDisplay = Number(display);
          return Number.isFinite(numericDisplay)
            ? `${numericDisplay >= 0 ? "+" : "-"}${Math.abs(numericDisplay).toFixed(1)}%`
            : null;
        }).filter(Boolean)
      )
      .slice(0, 10);
  const matchedSnippetsBefore = extractSnippets(inputHtml);
  const matchedDisplaysBefore = extractVarianceDisplays(inputHtml);
  const staleMinus48CountBefore = (inputHtml.match(staleVarianceRegex) || []).length;

  let outputHtml = inputHtml;
  const normalizeOrRemove = (pattern, replacement) => {
    outputHtml = outputHtml.replace(pattern, replacement);
  };

  if (renderState?.renderable && canonicalDisplay) {
    normalizeOrRemove(
      /<tr><td>Rent Roll vs T12 GPR Variance<\/td><td>[^<]*<\/td><\/tr>/gi,
      `<tr><td>Rent Roll vs T12 GPR Variance</td><td>${escapeHtml(canonicalDisplay)}</td></tr>`
    );
    normalizeOrRemove(
      /Rent Roll vs T12 GPR Variance\s*[+\-]?\d+(?:\.\d+)?%/gi,
      `Rent Roll vs T12 GPR Variance ${escapeHtml(canonicalDisplay)}`
    );
    normalizeOrRemove(
      /Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR\.\s*InvestorIQ has not reconciled this variance and does not infer the cause\./gi,
      `Rent roll annualized rent is ${escapeHtml(canonicalDisplay)} vs T12 GPR. ${escapeHtml(disclosure)}`
    );
    normalizeOrRemove(
      /Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR/gi,
      `Rent roll annualized rent is ${escapeHtml(canonicalDisplay)} vs T12 GPR`
    );
    normalizeOrRemove(
      /<li>\s*Rent Roll vs T12 GPR\s*[+\-]?\d+(?:\.\d+)?%\s*<\/li>/gi,
      `<li>Rent Roll vs T12 GPR ${escapeHtml(canonicalDisplay)}</li>`
    );
    normalizeOrRemove(
      /Source reconciliation variance of\s*[+\-]?\d+(?:\.\d+)?%\s*between rent roll and T12 gross potential rent requires review\./gi,
      `Source reconciliation variance of ${escapeHtml(canonicalDisplay)} between rent roll and T12 gross potential rent requires review.`
    );
  } else {
    normalizeOrRemove(/<tr><td>Rent Roll vs T12 GPR Variance<\/td><td>[^<]*<\/td><\/tr>/gi, "");
    normalizeOrRemove(/Rent Roll vs T12 GPR Variance\s*[+\-]?\d+(?:\.\d+)?%/gi, "");
    normalizeOrRemove(
      /Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR\.\s*InvestorIQ has not reconciled this variance and does not infer the cause\./gi,
      ""
    );
    normalizeOrRemove(/Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR/gi, "");
    normalizeOrRemove(/<li>\s*Rent Roll vs T12 GPR\s*[+\-]?\d+(?:\.\d+)?%\s*<\/li>/gi, "");
    normalizeOrRemove(
      /Source reconciliation variance of\s*[+\-]?\d+(?:\.\d+)?%\s*between rent roll and T12 gross potential rent requires review\./gi,
      ""
    );
  }

  let matchedSnippetsAfter = extractSnippets(outputHtml);
  let matchedDisplaysAfter = extractVarianceDisplays(outputHtml);
  let staleMinus48CountAfter = (outputHtml.match(staleVarianceRegex) || []).length;
  let changed = outputHtml !== inputHtml;
  const renderableDisplay = canonicalDisplay && renderState?.renderable;
  let displayMismatchAfter = renderableDisplay
    ? matchedDisplaysAfter.some((display) => display !== canonicalDisplay) ||
      (matchedDisplaysAfter.length === 0 &&
        (/Rent Roll vs T12 GPR Variance/i.test(outputHtml) ||
          /Rent roll annualized rent is/i.test(outputHtml) ||
          /Source reconciliation variance of/i.test(outputHtml)))
    : matchedDisplaysAfter.length > 0;
  if (displayMismatchAfter) {
    const fallbackHtml = outputHtml
      .replace(staleVarianceRegex, "")
      .replace(/<tr[^>]*>\s*<td>\s*Rent Roll vs T12 GPR Variance\s*<\/td>\s*<td>[\s\S]*?<\/td>\s*<\/tr>/gi, "")
      .replace(/Rent Roll vs T12 GPR Variance[^<\n]{0,160}/gi, "")
      .replace(/Rent roll annualized rent is[^<\n]{0,220}/gi, "")
      .replace(/Source reconciliation variance of[^<\n]{0,220}/gi, "");
    const fallbackMatchedSnippets = extractSnippets(fallbackHtml);
    const fallbackMatchedDisplays = extractVarianceDisplays(fallbackHtml);
    const fallbackStaleMinus48Count = (fallbackHtml.match(staleVarianceRegex) || []).length;
    const fallbackMismatch = renderableDisplay
      ? fallbackMatchedDisplays.some((display) => display !== canonicalDisplay) ||
        (fallbackMatchedDisplays.length === 0 &&
          (/Rent Roll vs T12 GPR Variance/i.test(fallbackHtml) ||
            /Rent roll annualized rent is/i.test(fallbackHtml) ||
            /Source reconciliation variance of/i.test(fallbackHtml)))
      : fallbackMatchedDisplays.length > 0;
    outputHtml = fallbackHtml;
    matchedSnippetsAfter = fallbackMatchedSnippets;
    matchedDisplaysAfter = fallbackMatchedDisplays;
    staleMinus48CountAfter = fallbackStaleMinus48Count;
    changed = outputHtml !== inputHtml;
    displayMismatchAfter = fallbackMismatch;
    if (displayMismatchAfter) {
      console.error("[investoriq] source_reconciliation_final_guard_postcheck_failed", {
        canonical_display: canonicalDisplay,
        renderable: Boolean(renderState?.renderable),
        matched_displays_before: matchedDisplaysBefore,
        matched_displays_after: matchedDisplaysAfter,
        matched_snippets_before: matchedSnippetsBefore,
        matched_snippets_after: matchedSnippetsAfter,
        stale_minus_48_count_before: staleMinus48CountBefore,
        stale_minus_48_count_after: staleMinus48CountAfter,
        replaced_or_suppressed: changed,
      });
    }
  }
  if (changed) {
    console.warn("[investoriq] source_reconciliation_final_guard", {
      canonical_display: canonicalDisplay,
      renderable: Boolean(renderState?.renderable),
      matched_displays_before: matchedDisplaysBefore,
      matched_displays_after: matchedDisplaysAfter,
      matched_snippets_before: matchedSnippetsBefore,
      matched_snippets_after: matchedSnippetsAfter,
      stale_minus_48_count_before: staleMinus48CountBefore,
      stale_minus_48_count_after: staleMinus48CountAfter,
      replaced_or_suppressed: true,
    });
  }
  return {
    html: outputHtml,
    render_state: renderState,
    matched_snippets_before: matchedSnippetsBefore,
    matched_snippets_after: matchedSnippetsAfter,
    matched_displays_before: matchedDisplaysBefore,
    matched_displays_after: matchedDisplaysAfter,
    stale_minus_48_count_before: staleMinus48CountBefore,
    stale_minus_48_count_after: staleMinus48CountAfter,
    replaced_or_suppressed: changed,
  };
}

export function applyAcquisitionMemoV2SectionHealRenderGuards(
  html,
  {
    effectiveReportMode = null,
    reportType = null,
    currentDebtAssessmentState = null,
    mortgagePayload = null,
    loanTermSheetTermsPayload = null,
    financials = null,
    t12Payload = null,
    sourceReconciliationState = null,
    deps = {},
  } = {}
) {
  const {
    buildRefiDebtRenderState = null,
    currentDebtNotAssessedCopy = null,
    coerceNumber = Number,
  } = deps;
  let outputHtml = String(html || "");
  const acquisitionFinancingReadinessInputsUsable =
    String(effectiveReportMode || "").trim().toLowerCase() === "v1_core" &&
    (currentDebtAssessmentState?.has_proposed_acquisition_financing === true ||
      String(loanTermSheetTermsPayload?.debt_basis || "").toLowerCase().includes("acquisition") ||
      String(loanTermSheetTermsPayload?.semantic_doc_role || "").trim().toLowerCase() === "purchase_assumptions" ||
      (Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.purchase_price)) &&
        (Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.stated_acquisition_loan_amount)) ||
          Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.loan_amount)) ||
          Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.derived_acquisition_loan_amount)) ||
          Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.ltv))) &&
        Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.interest_rate)) &&
        Number.isFinite(
          coerceNumber(
            loanTermSheetTermsPayload?.amortization_years ?? loanTermSheetTermsPayload?.amort_years
          )
        ) &&
        Number.isFinite(coerceNumber(t12Payload?.net_operating_income))));
  const currentDebtNeedsHeal = Boolean(
    buildRefiDebtRenderState?.({
      currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
      financials,
      t12Payload,
    })?.allowDebtMath !== true
  );
  if (effectiveReportMode === "screening_v1") {
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_REFI_STABILITY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT_TABLES");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_8_DEAL_SCORE");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_9_DCF");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_ADV_MODEL");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_11_FINAL_RECS");
    outputHtml = stripMarkedSection(outputHtml, "EXEC_DSCR_CARD");
  } else if (effectiveReportMode === "v1_core") {
    outputHtml = stripMarkedSection(outputHtml, "SECTION_3_SCENARIO");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_3");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_5_RISK");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_6_RENOVATION");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_REFI_STABILITY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT_TABLES");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_8_DEAL_SCORE");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_9_DCF");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_9_DCF_TABLE");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_ADV_MODEL");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_DCF_SUMMARY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_COMPARABLE_CONTEXT");
    outputHtml = stripMarkedSection(outputHtml, "RELATIVE_POSITIONING");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_11_FINAL_RECS");
    outputHtml = stripMarkedSection(outputHtml, "EXEC_DSCR_CARD");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_DEAL_SCORE_RADAR");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_DEAL_SCORE_BAR");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_EXPENSE_RATIO");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_EQUITY_COMPONENTS");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_BREAKEVEN");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_RISK_RADAR");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_RENOVATION");
    if (!acquisitionFinancingReadinessInputsUsable) {
      outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT");
    }
  }
  if (effectiveReportMode === "v1_core" || String(reportType || "").trim().length > 0) {
    outputHtml = stripMarkedSection(outputHtml, "SECTION_S6_RENOVATION");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_S6_REFI_DATA_SUFFICIENCY");
  }
  if (currentDebtNeedsHeal && typeof currentDebtNotAssessedCopy === "function") {
    const currentDebtNotAssessedRenderCopy = currentDebtNotAssessedCopy({
      currentDebtState: currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Noi: coerceNumber(t12Payload?.net_operating_income),
    });
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_REFI_STABILITY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT_TABLES");
    outputHtml = stripMarkedSection(outputHtml, "EXEC_DSCR_CARD");
    outputHtml = outputHtml.replace(
      /<p class="subsection-title">DSCR Sensitivity &amp; Coverage Threshold Analysis<\/p>[\s\S]*?<p class="small" style="margin-top:8px;">[\s\S]*?<\/p>/i,
      `<p class="small">${escapeHtml(currentDebtNotAssessedRenderCopy.explanation)}</p>`
    );
    outputHtml = outputHtml.replace(
      /<p class="subsection-title">Refinance Stress Test &amp; Binding Constraint Analysis<\/p>[\s\S]*?<p>\s*\{\{DEBT_REFI_CONSIDERATIONS\}\}\s*<\/p>/i,
      ""
    );
    outputHtml = outputHtml.replace(
      /<p class="subsection-title">Current Debt Coverage &amp; Constraint Sensitivity<\/p>[\s\S]*?\{\{REFI_SENSITIVITY_MATRIX_BLOCK\}\}/i,
      ""
    );
    outputHtml = replaceAll(outputHtml, "{{DEBT_DSCR_NOTE}}", currentDebtNotAssessedRenderCopy.explanation);
    outputHtml = replaceAll(outputHtml, "{{DEBT_REFI_CONSIDERATIONS}}", currentDebtNotAssessedRenderCopy.explanation);
    outputHtml = replaceAll(outputHtml, "{{REFI_SENSITIVITY_MATRIX_BLOCK}}", "");
    outputHtml = outputHtml.replace(
      /<tr[^>]*>\s*<td[^>]*>\s*Current Debt DSCR\s*<\/td>[\s\S]*?<\/tr>/gi,
      ""
    );
    outputHtml = outputHtml.replace(
      /<div[^>]*>\s*<p class="subsection-title">Maximum Financing Envelope \(Standardized Framework\)<\/p>[\s\S]*?<\/div>/gi,
      ""
    );
  }
  if (sourceReconciliationState) {
    outputHtml = applyAcquisitionMemoV2SourceReconciliationRenderGuard(
      outputHtml,
      sourceReconciliationState
    ).html;
  }
  outputHtml = stripEmptyHeadingBlocks(outputHtml);
  return sanitizeFinalCustomerHtml(outputHtml);
}
