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
