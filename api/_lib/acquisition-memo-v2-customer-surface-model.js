import { formatInterestRatePercent } from "./report-formatting-helpers.js";
import { isCanonicalInstitutionalFinancialIntelligence } from "./institutional-financial-intelligence.js";
import { UNDERWRITING_REPORT_IDENTITY } from "./report-identity-authority.js";
import { applyDispositionsToCustomerSurfaceSections } from "./section-disposition-runtime.js";

const MODEL_VERSION = "acq_memo_v2_customer_surface_model_v1";

const ALLOWED_SECTION_STATUSES = new Set([
  "required",
  "optional",
  "required_if_source_present",
  "collapsed",
]);

const APPROVED_VISIBLE_CLASSIFICATIONS = new Set([
  "Stable",
  "Sensitized",
  "Fragile",
  "Review - Source Reconciliation Disclosure",
  "Review - Insufficient Core Support",
  "Review - Debt Coverage Constraint",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Map);
}

function toArrayLike(value) {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return Array.from(value.values());
  if (isPlainObject(value)) return Object.values(value);
  return [];
}

function clone(value) {
  if (Array.isArray(value)) return value.map((item) => clone(item));
  if (value instanceof Map) return new Map(Array.from(value.entries()).map(([key, item]) => [key, clone(item)]));
  if (isPlainObject(value)) {
    const cloned = {};
    for (const [key, nestedValue] of Object.entries(value)) cloned[key] = clone(nestedValue);
    return cloned;
  }
  return value;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function governedMetricDisplayReady(value) {
  if (value === null || value === undefined || value === "") return false;
  if (Number.isFinite(Number(value))) return true;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

function normalizeCapRatio(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n > 1) return n / 100;
  return n;
}

function normalizeSurfaceText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isApprovedVisibleClassification(value) {
  return APPROVED_VISIBLE_CLASSIFICATIONS.has(String(value ?? "").trim());
}

function formatMoneyForSurface(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function formatPercentForSurface(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  const rounded = Math.round(pct * 100) / 100;
  const text = Number.isInteger(rounded) ? rounded.toFixed(1) : rounded.toFixed(2);
  return `${text.replace(/\.00$/, ".0").replace(/(\.\d)0$/, "$1")}%`;
}

function formatYearsForSurface(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `${Math.round(n)} years`;
}

function formatPercentDisplayForSurface(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(1)}%`;
}

function expectedSurfaceValuesFromModel(model) {
  const currentDebtFacts = model?.sections?.currentDebtContext?.facts || {};
  const acquisitionFacts = model?.sections?.acquisitionRequestContext?.facts || {};
  const unitMixFacts = model?.sections?.unitMix?.facts || {};
  const t12Facts = model?.sections?.operatingStatementTTMSummary?.facts || {};
  const appFacts = model?.sections?.appraisalContext?.facts || {};
  const renovationFacts = model?.sections?.renovationContext?.facts || {};
  const marketSurveyFacts = model?.sections?.marketSurveyContext?.facts || {};
  const environmentalFacts = model?.sections?.environmentalContext?.facts || {};
  const debtCapacityFacts = model?.sections?.debtCapacityAndCoverage?.facts || {};
  return {
    title: String(model?.identity?.reportTitle || model?.identity?.propertyName || "").trim(),
    coreT12Label: String(model?.coreSources?.coreT12?.visibleLabel || "").trim(),
    coreRentRollLabel: String(model?.coreSources?.coreRentRoll?.visibleLabel || "").trim(),
    acquisitionRequestLabel: String(model?.sections?.acquisitionRequestContext?.visibleLabel || "").trim(),
    currentDebtLabel: String(model?.sections?.currentDebtContext?.visibleLabel || "").trim(),
    proposedFinancingLabel: String(model?.sections?.proposedFinancingContext?.visibleLabel || "").trim(),
    appraisalLabel: String(model?.sections?.appraisalContext?.visibleLabel || "").trim(),
    renovationLabel: String(model?.sections?.renovationContext?.visibleLabel || "").trim(),
    marketSurveyLabel: String(model?.sections?.marketSurveyContext?.visibleLabel || "").trim(),
    environmentalLabel: String(model?.sections?.environmentalContext?.visibleLabel || "").trim(),
    debtCapacityLabel: String(model?.sections?.debtCapacityAndCoverage?.visibleLabel || "").trim(),
    currentDebt: {
      balance: formatMoneyForSurface(currentDebtFacts.current_outstanding_balance),
      rate: formatInterestRatePercent(currentDebtFacts.interest_rate),
      amortization: formatYearsForSurface(currentDebtFacts.amortization_remaining_years),
      payment: formatMoneyForSurface(currentDebtFacts.monthly_payment),
      maturityDate: String(currentDebtFacts.maturity_date || "").trim(),
    },
    proposedFinancing: {
      loan: formatMoneyForSurface(acquisitionFacts.proposed_loan_amount),
      ltv: formatPercentForSurface(acquisitionFacts.ltv),
      rate: formatInterestRatePercent(acquisitionFacts.interest_rate),
      amortization: formatYearsForSurface(acquisitionFacts.amortization_years),
      lenderFee: formatInterestRatePercent(acquisitionFacts.lender_fee_percent),
    },
    unitMixRows: Array.isArray(unitMixFacts.unit_mix)
      ? unitMixFacts.unit_mix.map((row) => ({
          label: String(row?.label || row?.unit_type || row?.name || "").trim(),
          count: Number.isFinite(Number(row?.count)) ? String(Math.round(Number(row.count))) : "",
          currentRent: formatMoneyForSurface(row?.current_rent),
          marketRent: formatMoneyForSurface(row?.market_rent),
          spread: Number.isFinite(Number(row?.current_rent)) && Number.isFinite(Number(row?.market_rent)) ? formatMoneyForSurface(Number(row.market_rent) - Number(row.current_rent)) : "",
        }))
      : [],
    t12ExpenseLines: Array.isArray(t12Facts.expense_lines)
      ? t12Facts.expense_lines.map((row) => ({
          label: String(row?.label || row?.name || "").trim(),
          amount: formatMoneyForSurface(row?.amount),
        }))
      : [],
    appraisal: {
      appraisalValue: formatMoneyForSurface(appFacts.appraisal_value),
      stabilizedCapRate: formatPercentForSurface(appFacts.stabilized_cap_rate),
      stabilizedNOI: formatMoneyForSurface(appFacts.stabilized_noi),
    },
    renovation: {
      totalBudget: formatMoneyForSurface(renovationFacts.total_renovation_budget),
      planRows: Array.isArray(renovationFacts.renovation_plan_rows)
        ? renovationFacts.renovation_plan_rows.map((row) => ({
            category: String(row?.category || "").trim(),
            unitCount: row?.unit_count !== null && row?.unit_count !== undefined && Number.isFinite(Number(row.unit_count)) ? String(Math.round(Number(row.unit_count))) : "",
            costPerUnit: formatMoneyForSurface(row?.cost_per_unit),
            statedAmount: formatMoneyForSurface(row?.stated_amount),
            rentLift: formatMoneyForSurface(row?.expected_monthly_rent_lift),
            timing: row?.start_month !== null && row?.start_month !== undefined && row?.end_month !== null && row?.end_month !== undefined && Number.isFinite(Number(row.start_month)) && Number.isFinite(Number(row.end_month))
              ? `Months ${Math.round(Number(row.start_month))}-${Math.round(Number(row.end_month))}`
              : "",
          }))
        : [],
    },
    marketSurvey: {
      ranges: Array.isArray(marketSurveyFacts.market_rent_ranges)
        ? marketSurveyFacts.market_rent_ranges.map((row) => ({
            unitType: String(row?.unit_type || "").trim(),
            low: formatMoneyForSurface(row?.low_monthly_rent),
            high: formatMoneyForSurface(row?.high_monthly_rent),
          }))
        : [],
    },
    environmental: {
      status: String(environmentalFacts.phase_i_status || "").trim() === "none_identified_in_summary"
        ? "None identified in this summary"
        : String(environmentalFacts.phase_i_status || "").trim().replace(/_/g, " "),
    },
    debtCapacity: {
      proposedDebtYield: formatPercentDisplayForSurface(debtCapacityFacts.proposedDebtYield?.result),
      proposedMortgageConstant: formatPercentDisplayForSurface(debtCapacityFacts.proposedMortgageConstant?.result),
      currentDebtInclusiveBreakEvenOccupancy: formatPercentDisplayForSurface(debtCapacityFacts.currentDebtInclusiveBreakEvenOccupancy?.result),
      proposedDebtInclusiveBreakEvenOccupancy: formatPercentDisplayForSurface(debtCapacityFacts.proposedDebtInclusiveBreakEvenOccupancy?.result),
      currentDebtInclusiveBreakEvenMonthlyRentPerUnit: formatMoneyForSurface(debtCapacityFacts.currentDebtInclusiveBreakEvenMonthlyRentPerUnit?.result),
      proposedDebtInclusiveBreakEvenMonthlyRentPerUnit: formatMoneyForSurface(debtCapacityFacts.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit?.result),
    },
  };
}

function uniqueSupportDocKey(doc) {
  const fileId = String(doc?.fileId || doc?.file_id || doc?.id || doc?.payload?.source_file_id || "").trim();
  const originalFilename = String(doc?.originalFilename || doc?.original_filename || doc?.payload?.source_original_filename || "").trim();
  if (fileId) return `fileId:${normalizeText(fileId)}`;
  if (originalFilename) return `filename:${normalizeText(originalFilename)}`;
  return `role:${normalizeText(doc?.canonicalRole || doc?.role || doc?.visibleLabel || "")}`;
}

function supportDocIdentityKeys(doc) {
  const keys = [];
  const fileId = String(doc?.fileId || "").trim();
  const originalFilename = String(doc?.originalFilename || "").trim();
  if (fileId) keys.push(`fileId:${normalizeText(fileId)}`);
  if (originalFilename) keys.push(`filename:${normalizeText(originalFilename)}`);
  if (keys.length === 0) keys.push(uniqueSupportDocKey(doc));
  return keys;
}

function normalizeCustomerSurfaceSupportRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  switch (normalized) {
    case "current_debt":
    case "current_mortgage_statement":
    case "current_debt_terms":
    case "mortgage_statement":
      return "current_debt_context";
    case "appraisal":
    case "appraisal_valuation_context":
      return "appraisal_context";
    case "renovation_capex_context":
      return "structured_renovation_capex_plan";
    case "environmental_due_diligence_context":
      return "environmental_context";
    default:
      return normalized;
  }
}

function normalizeCustomerPunctuation(value) {
  return String(value || "")
    .replace(/&(?:mdash|ndash);|&#(?:8211|8212);|&#x(?:2013|2014);|[\u2013\u2014]/gi, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSupportDoc(doc, sourceKind = "support_doc") {
  const source = isPlainObject(doc) ? doc : null;
  if (!source) return null;
  const acceptedProvenance = isPlainObject(source.acceptedProvenance)
    ? source.acceptedProvenance
    : isPlainObject(source.accepted_provenance)
      ? source.accepted_provenance
      : null;

  const extractedFacts = clone(
    source.extractedFacts ||
      source.extracted_facts ||
      source.payload?.extractedFacts ||
      source.payload?.extracted_facts ||
      {}
  );
  const sourceEvidence = clone(
    source.sourceEvidence ||
      source.source_evidence ||
      source.payload?.sourceEvidence ||
      source.payload?.source_evidence ||
      {}
  );
  const acceptedSemanticDocRole = String(
    source.acceptedSemanticDocRole ||
      source.accepted_semantic_doc_role ||
      acceptedProvenance?.acceptedSemanticDocRole ||
      acceptedProvenance?.accepted_semantic_doc_role ||
      source.payload?.acceptedSemanticDocRole ||
      source.payload?.accepted_semantic_doc_role ||
      ""
  ).trim().toLowerCase();
  const acceptedDebtBasis = String(
    source.acceptedDebtBasis ||
      source.accepted_debt_basis ||
      acceptedProvenance?.acceptedDebtBasis ||
      acceptedProvenance?.accepted_debt_basis ||
      source.payload?.acceptedDebtBasis ||
      source.payload?.accepted_debt_basis ||
      ""
  ).trim().toLowerCase();
  const acceptedSemanticDocDisplayLabel = String(
    source.acceptedSemanticDocDisplayLabel ||
      source.accepted_semantic_doc_display_label ||
      source.semantic_doc_display_label ||
      source.payload?.acceptedSemanticDocDisplayLabel ||
      source.payload?.accepted_semantic_doc_display_label ||
      source.payload?.semantic_doc_display_label ||
      ""
  ).trim();
  const acceptedRoleIsPurchaseAssumptions = acceptedSemanticDocRole === "purchase_assumptions";
  const acceptedRoleIsCurrentDebt =
    acceptedSemanticDocRole === "current_debt" ||
    acceptedSemanticDocRole === "current_debt_context" ||
    acceptedSemanticDocRole === "current_mortgage_statement" ||
    acceptedSemanticDocRole === "current_debt_terms" ||
    acceptedSemanticDocRole === "mortgage_statement";
  const normalizedAcceptedSemanticDocRole = acceptedRoleIsCurrentDebt
    ? "current_debt_context"
    : acceptedSemanticDocRole;
  const acceptedBasisIsPurchaseAssumptions = acceptedDebtBasis === "acquisition_financing_assumption";
  const acceptedBasisIsCurrentDebt =
    acceptedDebtBasis === "current_debt" ||
    acceptedDebtBasis === "current_debt_context";
  const explicitAcceptedPurchaseTruth =
    source.acceptedPurchaseAssumptionsTruth === true ||
    source.accepted_purchase_assumptions_truth === true;
  const explicitAcceptedCurrentDebtTruth =
    source.acceptedCurrentDebtTruth === true ||
    source.accepted_current_debt_truth === true;
  const purchaseBasisCompatible = !acceptedDebtBasis || acceptedBasisIsPurchaseAssumptions;
  const currentDebtBasisCompatible = !acceptedDebtBasis || acceptedBasisIsCurrentDebt;
  let acceptedPurchaseAssumptionsTruth = false;
  let acceptedCurrentDebtTruth = false;
  if (acceptedRoleIsPurchaseAssumptions) {
    acceptedPurchaseAssumptionsTruth = purchaseBasisCompatible;
  } else if (acceptedRoleIsCurrentDebt) {
    acceptedCurrentDebtTruth = currentDebtBasisCompatible;
  } else if (acceptedSemanticDocRole) {
    acceptedPurchaseAssumptionsTruth = false;
    acceptedCurrentDebtTruth = false;
  } else if (acceptedBasisIsPurchaseAssumptions) {
    acceptedPurchaseAssumptionsTruth = true;
  } else if (acceptedBasisIsCurrentDebt) {
    acceptedCurrentDebtTruth = true;
  } else if (explicitAcceptedPurchaseTruth && !explicitAcceptedCurrentDebtTruth) {
    acceptedPurchaseAssumptionsTruth = true;
  } else if (explicitAcceptedCurrentDebtTruth && !explicitAcceptedPurchaseTruth) {
    acceptedCurrentDebtTruth = true;
  }
  const canonicalRole = normalizeCustomerSurfaceSupportRole(
    normalizedAcceptedSemanticDocRole ||
      source.canonicalRole ||
      source.role ||
      source.semantic_doc_role ||
      source.doc_type ||
      source.sourceRole ||
      ""
  );
  const originalFilename = String(
    source.originalFilename ||
      source.original_filename ||
      source.payload?.source_original_filename ||
      source.payload?.sourceOriginalFilename ||
      source.filename ||
      ""
  ).trim();
  const fileId = String(
    source.fileId ||
      source.file_id ||
      source.id ||
      source.uploadedFileId ||
      source.uploaded_file_id ||
      source.payload?.source_file_id ||
      source.payload?.sourceFileId ||
      source.payload?.source_fileId ||
      ""
  ).trim();

  return {
    fileId,
    originalFilename,
    canonicalRole,
    roleLabel: normalizeCustomerPunctuation(source.roleLabel || source.role_label || source.canonicalLabel || source.canonical_label || ""),
    canonicalLabel: normalizeCustomerPunctuation(source.canonicalLabel || source.canonical_label || source.roleLabel || source.role_label || ""),
    treatment: normalizeCustomerPunctuation(source.treatment || source.documentTreatment || source.document_treatment || ""),
    use: normalizeCustomerPunctuation(source.use || source.documentUse || source.document_use || ""),
    sourceKind: String(source.sourceKind || source.kind || sourceKind || "support_doc").trim(),
    authorityBasis: String(source.authorityBasis || source.authority_basis || "").trim(),
    allowedUses: Array.isArray(source.allowedUses) ? source.allowedUses.slice() : Array.isArray(source.allowed_uses) ? source.allowed_uses.slice() : [],
    forbiddenUses: Array.isArray(source.forbiddenUses) ? source.forbiddenUses.slice() : Array.isArray(source.forbidden_uses) ? source.forbidden_uses.slice() : [],
    extractedFacts,
    sourceEvidence,
    visibleLabel: normalizeCustomerPunctuation(source.visibleLabel || source.roleLabel || source.canonicalLabel || source.canonicalRole || originalFilename || ""),
    acceptedSemanticDocRole: acceptedSemanticDocRole || null,
    acceptedDebtBasis: acceptedDebtBasis || null,
    acceptedSemanticDocDisplayLabel: normalizeCustomerPunctuation(acceptedSemanticDocDisplayLabel) || null,
    acceptedPurchaseAssumptionsTruth,
    acceptedCurrentDebtTruth,
  };
}

function acceptedAuthorityStrength(doc) {
  return (
    (doc?.acceptedSemanticDocRole ? 4 : 0) +
    (doc?.acceptedDebtBasis ? 2 : 0) +
    (doc?.acceptedPurchaseAssumptionsTruth === true ? 1 : 0) +
    (doc?.acceptedCurrentDebtTruth === true ? 1 : 0)
  );
}

function normalizedAcceptedAuthorityFamily(doc) {
  if (doc?.acceptedPurchaseAssumptionsTruth === true) return "purchase_assumptions";
  if (doc?.acceptedCurrentDebtTruth === true) return "current_debt_context";
  if (doc?.acceptedSemanticDocRole === "purchase_assumptions") return "purchase_assumptions";
  if (doc?.acceptedSemanticDocRole === "current_debt_context") return "current_debt_context";
  if (doc?.acceptedDebtBasis === "acquisition_financing_assumption") return "purchase_assumptions";
  if (doc?.acceptedDebtBasis === "current_debt" || doc?.acceptedDebtBasis === "current_debt_context") {
    return "current_debt_context";
  }
  if (doc?.acceptedSemanticDocRole) return `accepted_role:${doc.acceptedSemanticDocRole}`;
  return "";
}

function acceptedAuthoritySignature(doc) {
  return [
    normalizedAcceptedAuthorityFamily(doc),
    String(doc?.acceptedSemanticDocRole || ""),
    String(doc?.acceptedDebtBasis || ""),
    doc?.acceptedPurchaseAssumptionsTruth === true ? "1" : "0",
    doc?.acceptedCurrentDebtTruth === true ? "1" : "0",
  ].join("|");
}

function compareAcceptedAuthorityPriority(leftDoc, rightDoc) {
  const strengthDelta = acceptedAuthorityStrength(rightDoc) - acceptedAuthorityStrength(leftDoc);
  if (strengthDelta !== 0) return strengthDelta;
  const leftSignature = acceptedAuthoritySignature(leftDoc);
  const rightSignature = acceptedAuthoritySignature(rightDoc);
  if (leftSignature < rightSignature) return -1;
  if (leftSignature > rightSignature) return 1;
  return 0;
}

function resolveMergedExtractedFacts(existingDoc, incomingDoc) {
  const stableExtractedFactsSignature = (facts) => {
    const normalizeForSignature = (value) => {
      if (value === undefined) return { type: "undefined" };
      if (value === null) return { type: "null" };
      if (Array.isArray(value)) return { type: "array", value: value.map((item) => normalizeForSignature(item)) };
      if (isPlainObject(value)) {
        return {
          type: "object",
          value: Object.keys(value)
            .sort()
            .map((key) => [key, normalizeForSignature(value[key])]),
        };
      }
      if (typeof value === "string") return { type: "string", value };
      if (typeof value === "number") return { type: "number", value };
      if (typeof value === "boolean") return { type: "boolean", value };
      return { type: typeof value, value: String(value) };
    };
    return JSON.stringify(normalizeForSignature(isPlainObject(facts) ? facts : {}));
  };
  const stableIdentitySignature = (doc) =>
    JSON.stringify({
      fileId: String(doc?.fileId || "").trim(),
      originalFilename: String(doc?.originalFilename || "").trim(),
      canonicalRole: String(doc?.canonicalRole || "").trim(),
    });
  const docsByPriority = [existingDoc, incomingDoc].sort((leftDoc, rightDoc) => {
    const priority = compareAcceptedAuthorityPriority(leftDoc, rightDoc);
    if (priority !== 0) return priority;
    const leftSignature = stableExtractedFactsSignature(leftDoc?.extractedFacts);
    const rightSignature = stableExtractedFactsSignature(rightDoc?.extractedFacts);
    if (leftSignature < rightSignature) return -1;
    if (leftSignature > rightSignature) return 1;
    const leftIdentitySignature = stableIdentitySignature(leftDoc);
    const rightIdentitySignature = stableIdentitySignature(rightDoc);
    if (leftIdentitySignature < rightIdentitySignature) return -1;
    if (leftIdentitySignature > rightIdentitySignature) return 1;
    return 0;
  });
  const primaryFacts = isPlainObject(docsByPriority[0]?.extractedFacts) ? docsByPriority[0].extractedFacts : {};
  const secondaryFacts = isPlainObject(docsByPriority[1]?.extractedFacts) ? docsByPriority[1].extractedFacts : {};
  const primaryFamily = normalizedAcceptedAuthorityFamily(docsByPriority[0]);
  const secondaryFamily = normalizedAcceptedAuthorityFamily(docsByPriority[1]);
  const mergedFacts = clone(primaryFacts);

  if ((primaryFamily || secondaryFamily) && primaryFamily !== secondaryFamily) return mergedFacts;

  const isMissingFactValue = (value) => {
    if (value == null) return true;
    if (typeof value === "string") return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (isPlainObject(value)) return Object.keys(value).length === 0;
    return false;
  };

  for (const [key, secondaryValue] of Object.entries(secondaryFacts)) {
    if (!isMissingFactValue(mergedFacts[key])) continue;
    if (isMissingFactValue(secondaryValue)) continue;
    mergedFacts[key] = clone(secondaryValue);
  }

  return mergedFacts;
}

function resolveMergedExtractedFactsFromGroup(docs) {
  const stableExtractedFactsSignature = (facts) => {
    const normalizeForSignature = (value) => {
      if (value === undefined) return { type: "undefined" };
      if (value === null) return { type: "null" };
      if (Array.isArray(value)) return { type: "array", value: value.map((item) => normalizeForSignature(item)) };
      if (isPlainObject(value)) {
        return {
          type: "object",
          value: Object.keys(value)
            .sort()
            .map((key) => [key, normalizeForSignature(value[key])]),
        };
      }
      if (typeof value === "string") return { type: "string", value };
      if (typeof value === "number") return { type: "number", value };
      if (typeof value === "boolean") return { type: "boolean", value };
      return { type: typeof value, value: String(value) };
    };
    return JSON.stringify(normalizeForSignature(isPlainObject(facts) ? facts : {}));
  };
  const stableIdentitySignature = (doc) =>
    JSON.stringify({
      fileId: String(doc?.fileId || "").trim(),
      originalFilename: String(doc?.originalFilename || "").trim(),
      canonicalRole: String(doc?.canonicalRole || "").trim(),
    });
  const isMissingFactValue = (value) => {
    if (value == null) return true;
    if (typeof value === "string") return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (isPlainObject(value)) return Object.keys(value).length === 0;
    return false;
  };
  const validDocs = (Array.isArray(docs) ? docs : []).filter((doc) => isPlainObject(doc));
  if (validDocs.length === 0) return {};
  const docsByPriority = validDocs.slice().sort((leftDoc, rightDoc) => {
    const priority = compareAcceptedAuthorityPriority(leftDoc, rightDoc);
    if (priority !== 0) return priority;
    const leftSignature = stableExtractedFactsSignature(leftDoc?.extractedFacts);
    const rightSignature = stableExtractedFactsSignature(rightDoc?.extractedFacts);
    if (leftSignature < rightSignature) return -1;
    if (leftSignature > rightSignature) return 1;
    const leftIdentitySignature = stableIdentitySignature(leftDoc);
    const rightIdentitySignature = stableIdentitySignature(rightDoc);
    if (leftIdentitySignature < rightIdentitySignature) return -1;
    if (leftIdentitySignature > rightIdentitySignature) return 1;
    return 0;
  });
  const primaryDoc = docsByPriority[0];
  const primaryFacts = isPlainObject(primaryDoc?.extractedFacts) ? primaryDoc.extractedFacts : {};
  const primaryFamily = normalizedAcceptedAuthorityFamily(primaryDoc);
  const mergedFacts = clone(primaryFacts);

  for (const secondaryDoc of docsByPriority.slice(1)) {
    const secondaryFamily = normalizedAcceptedAuthorityFamily(secondaryDoc);
    const familyCompatible = primaryFamily
      ? secondaryFamily === primaryFamily
      : secondaryFamily === "";
    if (!familyCompatible) continue;
    const secondaryFacts = isPlainObject(secondaryDoc?.extractedFacts) ? secondaryDoc.extractedFacts : {};
    for (const [key, secondaryValue] of Object.entries(secondaryFacts)) {
      if (!isMissingFactValue(mergedFacts[key])) continue;
      if (isMissingFactValue(secondaryValue)) continue;
      mergedFacts[key] = clone(secondaryValue);
    }
  }

  return mergedFacts;
}

function resolveMergedAcceptedAuthority(existingDoc, incomingDoc) {
  const docsByPriority = [existingDoc, incomingDoc].sort(compareAcceptedAuthorityPriority);
  const primaryDoc = docsByPriority[0];
  const secondaryDoc = docsByPriority[1];
  const primaryFamily = normalizedAcceptedAuthorityFamily(primaryDoc);
  const secondaryFamily = normalizedAcceptedAuthorityFamily(secondaryDoc);
  const familiesAreCompatible =
    (primaryFamily === "" && secondaryFamily === "") ||
    (primaryFamily === "" && secondaryFamily !== "") ||
    (primaryFamily !== "" && secondaryFamily === "") ||
    primaryFamily === secondaryFamily;

  if (!familiesAreCompatible) {
    const primaryRoleFamily = normalizedAcceptedAuthorityFamily({
      acceptedSemanticDocRole: primaryDoc?.acceptedSemanticDocRole || null,
    });
    const primaryBasisFamily = normalizedAcceptedAuthorityFamily({
      acceptedDebtBasis: primaryDoc?.acceptedDebtBasis || null,
    });
    return {
      acceptedSemanticDocRole: primaryDoc?.acceptedSemanticDocRole || null,
      acceptedDebtBasis:
        !primaryDoc?.acceptedDebtBasis || !primaryRoleFamily || primaryRoleFamily === primaryBasisFamily
          ? primaryDoc.acceptedDebtBasis
          : null,
      acceptedSemanticDocDisplayLabel: primaryDoc?.acceptedSemanticDocDisplayLabel || null,
      acceptedPurchaseAssumptionsTruth:
        primaryRoleFamily === "purchase_assumptions" && primaryDoc?.acceptedPurchaseAssumptionsTruth === true,
      acceptedCurrentDebtTruth:
        primaryRoleFamily === "current_debt_context" && primaryDoc?.acceptedCurrentDebtTruth === true,
    };
  }

  return {
    acceptedSemanticDocRole: primaryDoc?.acceptedSemanticDocRole || secondaryDoc?.acceptedSemanticDocRole || null,
    acceptedDebtBasis: primaryDoc?.acceptedDebtBasis || secondaryDoc?.acceptedDebtBasis || null,
    acceptedSemanticDocDisplayLabel:
      primaryDoc?.acceptedSemanticDocDisplayLabel || secondaryDoc?.acceptedSemanticDocDisplayLabel || null,
    acceptedPurchaseAssumptionsTruth:
      primaryDoc?.acceptedPurchaseAssumptionsTruth === true || secondaryDoc?.acceptedPurchaseAssumptionsTruth === true,
    acceptedCurrentDebtTruth:
      primaryDoc?.acceptedCurrentDebtTruth === true || secondaryDoc?.acceptedCurrentDebtTruth === true,
  };
}

function mergeDuplicateNormalizedSupportDoc(existingDoc, incomingDoc) {
  const resolvedExtractedFacts = resolveMergedExtractedFacts(existingDoc, incomingDoc);
  const resolvedAcceptedAuthority = resolveMergedAcceptedAuthority(existingDoc, incomingDoc);
  return (
    normalizeSupportDoc({
      ...existingDoc,
      fileId: existingDoc?.fileId || incomingDoc?.fileId || "",
      originalFilename: existingDoc?.originalFilename || incomingDoc?.originalFilename || "",
      extractedFacts: resolvedExtractedFacts,
      acceptedSemanticDocRole: resolvedAcceptedAuthority.acceptedSemanticDocRole,
      acceptedDebtBasis: resolvedAcceptedAuthority.acceptedDebtBasis,
      acceptedSemanticDocDisplayLabel: resolvedAcceptedAuthority.acceptedSemanticDocDisplayLabel,
      acceptedPurchaseAssumptionsTruth: resolvedAcceptedAuthority.acceptedPurchaseAssumptionsTruth,
      acceptedCurrentDebtTruth: resolvedAcceptedAuthority.acceptedCurrentDebtTruth,
    }) || existingDoc
  );
}

function collectSupportDocs(canonicalSourcePackage, acquisitionMemoProjection, bossContract) {
  const candidates = [
    toArrayLike(canonicalSourcePackage?.supportDocs),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.allSupportDocs),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.otherSupportDocs),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.purchaseAssumptions),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.currentDebtContext),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.structuredRenovation),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.appraisalContext),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.marketSurveyContext),
    toArrayLike(acquisitionMemoProjection?.supportDocProjection?.environmentalContext),
    toArrayLike(bossContract?.sourceTruth?.supportDocs),
  ];

  const seen = new Map();
  const grouped = [];

  for (const bucket of candidates) {
    for (const doc of bucket) {
      const normalizedDoc = normalizeSupportDoc(doc);
      if (!normalizedDoc) continue;
      // A role-only projection is an aggregate view, not another uploaded
      // source. Customer surfaces count and render physical documents only.
      if (!normalizedDoc.fileId && !normalizedDoc.originalFilename) continue;
      const keys = supportDocIdentityKeys(normalizedDoc);
      const matchedIndexes = Array.from(new Set(keys.filter((key) => seen.has(key)).map((key) => seen.get(key)))).sort((a, b) => a - b);
      if (matchedIndexes.length > 0) {
        const index = matchedIndexes[0];
        for (const absorbedIndex of matchedIndexes.slice(1)) {
          if (!grouped[absorbedIndex]) continue;
          grouped[index].docs.push(...grouped[absorbedIndex].docs);
          grouped[index].mergedDoc = mergeDuplicateNormalizedSupportDoc(grouped[index].mergedDoc, grouped[absorbedIndex].mergedDoc);
          for (const [aliasKey, aliasIndex] of seen.entries()) {
            if (aliasIndex === absorbedIndex) seen.set(aliasKey, index);
          }
          grouped[absorbedIndex] = null;
        }
        const existingKeys = supportDocIdentityKeys(grouped[index].mergedDoc);
        const mergedDoc = mergeDuplicateNormalizedSupportDoc(grouped[index].mergedDoc, normalizedDoc);
        grouped[index].mergedDoc = mergedDoc;
        grouped[index].docs.push(normalizedDoc);
        for (const key of new Set([...existingKeys, ...keys, ...supportDocIdentityKeys(mergedDoc)])) seen.set(key, index);
        continue;
      }
      const index = grouped.push({ mergedDoc: normalizedDoc, docs: [normalizedDoc] }) - 1;
      for (const key of keys) seen.set(key, index);
    }
  }

  return grouped
    .filter(Boolean)
    .map(({ mergedDoc, docs }) =>
      normalizeSupportDoc({
        ...mergedDoc,
        extractedFacts: resolveMergedExtractedFactsFromGroup(docs),
      }) || mergedDoc
    );
}

function findSupportDocByRole(supportDocs, role) {
  const normalizedRole = normalizeText(role);
  if (!normalizedRole) return null;
  return (Array.isArray(supportDocs) ? supportDocs : []).find((doc) => normalizeText(doc?.canonicalRole || doc?.role || doc?.sourceRole) === normalizedRole) || null;
}

function buildCoreSourceSnapshot(coreDoc, fallbackRole, fallbackLabel) {
  const source = isPlainObject(coreDoc) ? coreDoc : null;
  if (!source) return null;
  const extractedFacts = clone(
    source.extractedFacts ||
      source.extracted_facts ||
      source.payload?.extractedFacts ||
      source.payload?.extracted_facts ||
      {}
  );
  const fileId = String(source.fileId || source.file_id || source.id || "").trim();
  const artifactId = String(source.artifactId || source.artifact_id || "").trim();
  return {
    fileId,
    originalFilename: String(source.originalFilename || source.original_filename || source.payload?.source_original_filename || "").trim(),
    canonicalRole: String(source.canonicalRole || source.role || fallbackRole || "").trim(),
    canonicalLabel: normalizeCustomerPunctuation(source.canonicalLabel || source.canonical_label || fallbackLabel || ""),
    sourceKind: String(source.sourceKind || fallbackRole || "").trim(),
    extractedFacts,
    visibleLabel: normalizeCustomerPunctuation(source.visibleLabel || source.roleLabel || source.canonicalLabel || fallbackLabel || fallbackRole || ""),
    sourceIdentityKey: fileId
      ? `core:file:${normalizeText(fileId)}`
      : artifactId
        ? `core:artifact:${normalizeText(artifactId)}`
        : null,
  };
}

function normalizeSectionContract(sectionContract = null, sectionKey = "") {
  const sourceBindings = Array.isArray(sectionContract?.sourceBindings) ? clone(sectionContract.sourceBindings) : [];
  const requiredFacts = Array.isArray(sectionContract?.requiredFacts) ? clone(sectionContract.requiredFacts) : [];
  const collapseInstructions = Array.isArray(sectionContract?.collapseInstructions) ? clone(sectionContract.collapseInstructions) : [];
  const forbiddenFallbackText = Array.isArray(sectionContract?.forbiddenFallbackText) ? clone(sectionContract.forbiddenFallbackText) : [];
  const renderRequirements = Array.isArray(sectionContract?.renderRequirements) ? clone(sectionContract.renderRequirements) : [];
  const postRenderAssertions = Array.isArray(sectionContract?.postRenderAssertions) ? clone(sectionContract.postRenderAssertions) : [];
  const factAvailability = isPlainObject(sectionContract?.factAvailability)
    ? clone(sectionContract.factAvailability)
    : { required: [], available: [], missing: [], sourceBacked: false };
  const status = String(sectionContract?.status || "collapsed").trim();

  return {
    key: sectionKey,
    status,
    sourceBindings,
    requiredFacts,
    collapseInstructions,
    forbiddenFallbackText,
    renderRequirements,
    postRenderAssertions,
    factAvailability,
  };
}

function buildSectionMap(bossContract = null) {
  const sections = bossContract?.sections || {};
  const requiredKeys = [
    "acquisitionRequestContext",
    "currentDebtContext",
    "proposedFinancingContext",
    "appraisalContext",
    "renovationContext",
    "marketSurveyContext",
    "environmentalContext",
    "unitMix",
    "capRateValueIndication",
    "operatingStatementTTMSummary",
    "documentTreatment",
    "dataCoverageSourceLimitations",
    "methodologyDataTransparency",
    "debtServiceCoverage",
    "debtTermAnalysis",
    "coreReconciliation",
    "capitalPlanAnalysis",
  ];
  const sectionMap = {};
  for (const key of Object.keys(sections)) {
    sectionMap[key] = normalizeSectionContract(sections[key], key);
  }
  for (const key of requiredKeys) {
    if (!sectionMap[key]) sectionMap[key] = normalizeSectionContract(null, key);
  }
  return sectionMap;
}

function buildSectionRoleModel(section, supportDocsByRole, coreSources, valueSemantics) {
  const key = section?.key || "";
  if (key === "acquisitionRequestContext") {
    const purchaseAssumptions = supportDocsByRole.purchase_assumptions || null;
    const proposed = purchaseAssumptions?.extractedFacts || {};
    const purchaseAssumptionsSourcePresent = Boolean(section?.factAvailability?.sourcePresent || purchaseAssumptions?.acceptedPurchaseAssumptionsTruth);
    const purchaseAssumptionsSourceBacked = section?.factAvailability?.sourceBacked === true && [
      normalizeMoney(proposed.purchase_price),
      normalizeMoney(proposed.noi_basis),
      normalizeCapRatio(proposed.going_in_cap_rate),
      normalizeMoney(proposed.proposed_loan_amount),
      normalizeCapRatio(proposed.ltv),
      normalizeCapRatio(proposed.interest_rate),
      normalizeMoney(proposed.amortization_years),
      normalizeCapRatio(proposed.lender_fee_percent),
    ].every((value) => value !== null);
    if (!purchaseAssumptions || !purchaseAssumptionsSourceBacked) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: "purchase_assumptions",
        visibleLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
        facts: {
          purchase_price: null,
          noi_basis: null,
          going_in_cap_rate: null,
          proposed_loan_amount: null,
          ltv: null,
          interest_rate: null,
          amortization_years: null,
          lender_fee_percent: null,
        },
        factAvailability: {
          required: ["purchase_price", "proposed_loan_amount"],
          available: [],
          missing: ["purchase_price", "proposed_loan_amount"],
          sourceBacked: false,
          sourcePresent: purchaseAssumptionsSourcePresent,
        },
        boundaries: {
          purchaseAssumptionsRemainPurchaseAssumptions: true,
          currentDebtCannotBeInferred: true,
        },
        sourceDoc: purchaseAssumptions,
      };
    }
    return {
      ...section,
      sourceRole: "purchase_assumptions",
      visibleLabel: purchaseAssumptions?.visibleLabel || purchaseAssumptions?.roleLabel || "Purchase Assumptions / Proposed Acquisition Financing Context",
      facts: {
        purchase_price: normalizeMoney(proposed.purchase_price),
        noi_basis: normalizeMoney(proposed.noi_basis),
        going_in_cap_rate: normalizeCapRatio(proposed.going_in_cap_rate),
        proposed_loan_amount: normalizeMoney(proposed.proposed_loan_amount),
        ltv: normalizeCapRatio(proposed.ltv),
        interest_rate: normalizeCapRatio(proposed.interest_rate),
        amortization_years: normalizeMoney(proposed.amortization_years),
        lender_fee_percent: normalizeCapRatio(proposed.lender_fee_percent),
      },
      boundaries: {
        purchaseAssumptionsRemainPurchaseAssumptions: true,
        currentDebtCannotBeInferred: true,
      },
      factAvailability: {
        required: ["purchase_price", "proposed_loan_amount"],
        available: Object.entries({
          purchase_price: proposed.purchase_price,
          noi_basis: proposed.noi_basis,
          going_in_cap_rate: proposed.going_in_cap_rate,
          proposed_loan_amount: proposed.proposed_loan_amount,
          ltv: proposed.ltv,
          interest_rate: proposed.interest_rate,
          amortization_years: proposed.amortization_years,
          lender_fee_percent: proposed.lender_fee_percent,
        })
          .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)))
          .map(([keyName]) => keyName),
        missing: ["purchase_price", "proposed_loan_amount"].filter(
          (factName) =>
            !Object.entries({
              purchase_price: proposed.purchase_price,
              noi_basis: proposed.noi_basis,
              going_in_cap_rate: proposed.going_in_cap_rate,
              proposed_loan_amount: proposed.proposed_loan_amount,
              ltv: proposed.ltv,
              interest_rate: proposed.interest_rate,
              amortization_years: proposed.amortization_years,
              lender_fee_percent: proposed.lender_fee_percent,
            })
              .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)))
              .map(([keyName]) => keyName)
              .includes(factName)
        ),
        sourceBacked: purchaseAssumptionsSourceBacked,
        sourcePresent: purchaseAssumptionsSourcePresent,
      },
      sourceDoc: purchaseAssumptions,
    };
  }

  if (key === "currentDebtContext") {
    const currentDebt = supportDocsByRole.current_debt_context || null;
    const currentDebtFacts = currentDebt?.extractedFacts || {};
    const currentDebtSourcePresent = Boolean(section?.factAvailability?.sourcePresent || currentDebt?.acceptedCurrentDebtTruth);
    const currentDebtSourceBacked = section?.factAvailability?.sourceBacked === true && [
      normalizeMoney(currentDebtFacts.current_outstanding_balance),
      normalizeCapRatio(currentDebtFacts.interest_rate),
      normalizeMoney(currentDebtFacts.amortization_remaining_years),
      normalizeMoney(currentDebtFacts.monthly_payment),
      String(currentDebtFacts.maturity_date || "").trim() || null,
    ].every((value) => value !== null);
    if (!currentDebt || !currentDebtSourceBacked) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: "current_debt_context",
        visibleLabel: "Existing Debt Context / Current Mortgage / Debt Statement",
        facts: {
          current_outstanding_balance: null,
          interest_rate: null,
          amortization_remaining_years: null,
          monthly_payment: null,
          maturity_date: null,
        },
        factAvailability: {
          required: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"],
          available: [],
          missing: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"],
          sourceBacked: false,
          sourcePresent: currentDebtSourcePresent,
        },
        boundaries: {
          currentDebtIsNotPurchaseAssumptions: true,
          currentDebtIsNotProposedFinancing: true,
        },
        sourceDoc: currentDebt,
      };
    }
    return {
      ...section,
      sourceRole: "current_debt_context",
      visibleLabel: currentDebt?.visibleLabel || currentDebt?.roleLabel || "Existing Debt Context / Current Mortgage / Debt Statement",
      facts: {
        current_outstanding_balance: normalizeMoney(currentDebtFacts.current_outstanding_balance),
        interest_rate: normalizeCapRatio(currentDebtFacts.interest_rate),
        amortization_remaining_years: normalizeMoney(currentDebtFacts.amortization_remaining_years),
        monthly_payment: normalizeMoney(currentDebtFacts.monthly_payment),
        maturity_date: String(currentDebtFacts.maturity_date || "").trim() || null,
      },
      boundaries: {
        currentDebtIsNotPurchaseAssumptions: true,
        currentDebtIsNotProposedFinancing: true,
      },
      factAvailability: {
        required: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"],
        available: Object.entries({
          current_outstanding_balance: currentDebtFacts.current_outstanding_balance,
          interest_rate: currentDebtFacts.interest_rate,
          amortization_remaining_years: currentDebtFacts.amortization_remaining_years,
          monthly_payment: currentDebtFacts.monthly_payment,
          maturity_date: currentDebtFacts.maturity_date,
        })
          .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)) || String(value || "").trim().length > 0)
          .map(([keyName]) => keyName),
        missing: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"].filter(
          (factName) =>
            !Object.entries({
              current_outstanding_balance: currentDebtFacts.current_outstanding_balance,
              interest_rate: currentDebtFacts.interest_rate,
              amortization_remaining_years: currentDebtFacts.amortization_remaining_years,
              monthly_payment: currentDebtFacts.monthly_payment,
              maturity_date: currentDebtFacts.maturity_date,
            })
              .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)) || String(value || "").trim().length > 0)
              .map(([keyName]) => keyName)
              .includes(factName)
        ),
        sourceBacked: currentDebtSourceBacked,
        sourcePresent: currentDebtSourcePresent,
      },
      sourceDoc: currentDebt,
    };
  }

  if (key === "proposedFinancingContext") {
    const purchaseAssumptions = supportDocsByRole.purchase_assumptions || null;
    const proposed = purchaseAssumptions?.extractedFacts || {};
    const purchaseAssumptionsSourcePresent = Boolean(section?.factAvailability?.sourcePresent || purchaseAssumptions?.acceptedPurchaseAssumptionsTruth);
    const purchaseAssumptionsSourceBacked = section?.factAvailability?.sourceBacked === true && [
      normalizeMoney(proposed.proposed_loan_amount),
      normalizeCapRatio(proposed.ltv),
      normalizeCapRatio(proposed.interest_rate),
      normalizeMoney(proposed.amortization_years),
      normalizeCapRatio(proposed.lender_fee_percent),
    ].every((value) => value !== null);
    if (!purchaseAssumptions || !purchaseAssumptionsSourceBacked) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: "purchase_assumptions",
        visibleLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
        facts: {
          proposed_loan_amount: null,
          ltv: null,
          interest_rate: null,
          amortization_years: null,
          lender_fee_percent: null,
        },
        factAvailability: {
          required: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"],
          available: [],
          missing: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"],
          sourceBacked: false,
          sourcePresent: purchaseAssumptionsSourcePresent,
        },
        boundaries: {
          proposedFinancingIsNotCurrentDebt: true,
        },
        sourceDoc: purchaseAssumptions,
      };
    }
    return {
      ...section,
      sourceRole: "purchase_assumptions",
      visibleLabel: purchaseAssumptions?.visibleLabel || purchaseAssumptions?.roleLabel || "Purchase Assumptions / Proposed Acquisition Financing Context",
      facts: {
        proposed_loan_amount: normalizeMoney(proposed.proposed_loan_amount),
        ltv: normalizeCapRatio(proposed.ltv),
        interest_rate: normalizeCapRatio(proposed.interest_rate),
        amortization_years: normalizeMoney(proposed.amortization_years),
        lender_fee_percent: normalizeCapRatio(proposed.lender_fee_percent),
      },
      boundaries: {
        proposedFinancingIsNotCurrentDebt: true,
      },
      factAvailability: {
        required: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"],
        available: Object.entries({
          proposed_loan_amount: proposed.proposed_loan_amount,
          ltv: proposed.ltv,
          interest_rate: proposed.interest_rate,
          amortization_years: proposed.amortization_years,
          lender_fee_percent: proposed.lender_fee_percent,
        })
          .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)))
          .map(([keyName]) => keyName),
        missing: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"].filter(
          (factName) =>
            !Object.entries({
              proposed_loan_amount: proposed.proposed_loan_amount,
              ltv: proposed.ltv,
              interest_rate: proposed.interest_rate,
              amortization_years: proposed.amortization_years,
              lender_fee_percent: proposed.lender_fee_percent,
            })
              .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)))
              .map(([keyName]) => keyName)
              .includes(factName)
        ),
        sourceBacked: purchaseAssumptionsSourceBacked,
        sourcePresent: purchaseAssumptionsSourcePresent,
      },
      sourceDoc: purchaseAssumptions,
    };
  }

  if (key === "appraisalContext") {
    const appraisal = supportDocsByRole.appraisal_context || null;
    const facts = appraisal?.extractedFacts || {};
    const normalizedFacts = {
      appraisal_value: normalizeMoney(facts.appraisal_value),
      stabilized_cap_rate: normalizeCapRatio(facts.stabilized_cap_rate),
      stabilized_noi: normalizeMoney(facts.stabilized_noi),
    };
    const availableFacts = Object.entries(normalizedFacts)
      .filter(([, value]) => value !== null)
      .map(([keyName]) => keyName);
    const requiredFacts = Array.isArray(section?.requiredFacts) ? section.requiredFacts : [];
    const hasSourceBackedFacts =
      availableFacts.length > 0 && section?.factAvailability?.sourceBacked === true;
    if (!appraisal || !hasSourceBackedFacts) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: "appraisal_context",
        visibleLabel: "Appraisal / Valuation Context",
        facts: {
          appraisal_value: null,
          stabilized_cap_rate: null,
          stabilized_noi: null,
        },
        factAvailability: {
          required: requiredFacts,
          available: [],
          missing: requiredFacts,
          sourceBacked: false,
          sourcePresent: Boolean(section?.factAvailability?.sourcePresent || appraisal),
        },
        boundaries: {
          appraisalIsContextOnly: true,
          stabilizedCapRateIsNotInterestRate: true,
          stabilizedNOIIsNotT12NOI: true,
        },
        sourceDoc: appraisal,
      };
    }
    return {
      ...section,
      sourceRole: "appraisal_context",
      visibleLabel: appraisal?.visibleLabel || appraisal?.roleLabel || "Appraisal / Valuation Context",
      facts: normalizedFacts,
      boundaries: {
        appraisalIsContextOnly: true,
        stabilizedCapRateIsNotInterestRate: true,
        stabilizedNOIIsNotT12NOI: true,
      },
      factAvailability: {
        required: requiredFacts,
        available: availableFacts,
        missing: requiredFacts.filter((factName) => !availableFacts.includes(factName)),
        sourceBacked: hasSourceBackedFacts,
        sourcePresent: Boolean(section?.factAvailability?.sourcePresent || appraisal),
      },
      sourceDoc: appraisal,
    };
  }

  if (key === "renovationContext") {
    const renovation = supportDocsByRole.renovation_capex_context || supportDocsByRole.structured_renovation_capex_plan || supportDocsByRole.renovation_capex_budget_context || null;
    const facts = renovation?.extractedFacts || {};
    const renovationPlanRows = toArrayLike(facts.renovation_plan_rows).map((row) => ({
      category: String(row?.category || "").trim(),
      unit_type: String(row?.unit_type || "").trim() || null,
      unit_count: normalizeMoney(row?.unit_count),
      cost_per_unit: normalizeMoney(row?.cost_per_unit),
      stated_amount: normalizeMoney(row?.stated_amount),
      expected_monthly_rent_lift: normalizeMoney(row?.expected_monthly_rent_lift),
      start_month: normalizeMoney(row?.start_month),
      end_month: normalizeMoney(row?.end_month),
    })).filter((row) => row.category && Object.entries(row).some(([field, value]) => field !== "category" && value !== null && value !== ""));
    const normalizedFacts = {
      total_renovation_budget: normalizeMoney(facts.total_renovation_budget),
      capital_plan_start_month: normalizeMoney(facts.capital_plan_start_month),
      capital_plan_end_month: normalizeMoney(facts.capital_plan_end_month),
      capital_plan_duration_months: normalizeMoney(facts.capital_plan_duration_months),
      renovation_plan_rows: renovationPlanRows,
    };
    const availableFacts = Object.entries(normalizedFacts)
      .filter(([, value]) => Array.isArray(value) ? value.length > 0 : value !== null)
      .map(([keyName]) => keyName);
    const requiredFacts = Array.isArray(section?.requiredFacts) ? section.requiredFacts : [];
    const hasSourceBackedFacts = availableFacts.length > 0 && section?.factAvailability?.sourceBacked === true;
    if (!renovation || !hasSourceBackedFacts) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: renovation?.canonicalRole || "structured_renovation_capex_plan",
        visibleLabel: "Structured Renovation / CapEx Plan",
        facts: {
          total_renovation_budget: null,
          capital_plan_start_month: null,
          capital_plan_end_month: null,
          capital_plan_duration_months: null,
          renovation_plan_rows: [],
        },
        factAvailability: {
          required: requiredFacts,
          available: [],
          missing: requiredFacts,
          sourceBacked: false,
          sourcePresent: Boolean(section?.factAvailability?.sourcePresent || renovation),
        },
        boundaries: {
          renovationIsContextOnly: true,
          noRoiOrPaybackModeling: true,
        },
        sourceDoc: renovation,
      };
    }
    return {
      ...section,
      sourceRole: renovation?.canonicalRole || "structured_renovation_capex_plan",
      visibleLabel: renovation?.visibleLabel || renovation?.roleLabel || "Structured Renovation / CapEx Plan",
      facts: normalizedFacts,
      boundaries: {
        renovationIsContextOnly: true,
        noRoiOrPaybackModeling: true,
      },
      factAvailability: {
        required: requiredFacts,
        available: availableFacts,
        missing: requiredFacts.filter((factName) => !availableFacts.includes(factName)),
        sourceBacked: hasSourceBackedFacts,
        sourcePresent: Boolean(section?.factAvailability?.sourcePresent || renovation),
      },
      sourceDoc: renovation,
    };
  }

  if (key === "marketSurveyContext") {
    const marketSurvey = supportDocsByRole.market_survey_context || null;
    const facts = marketSurvey?.extractedFacts || {};
    const marketRentRanges = toArrayLike(facts.market_rent_ranges).map((row) => ({
      unit_type: String(row?.unit_type || "").trim(),
      low_monthly_rent: normalizeMoney(row?.low_monthly_rent),
      high_monthly_rent: normalizeMoney(row?.high_monthly_rent),
    })).filter((row) => row.unit_type && row.low_monthly_rent !== null && row.high_monthly_rent !== null);
    const requiredFacts = Array.isArray(section?.requiredFacts) ? section.requiredFacts : [];
    const availableFacts = marketRentRanges.length > 0 ? ["market_rent_ranges"] : [];
    const hasSourceBackedFacts = availableFacts.length > 0 && section?.factAvailability?.sourceBacked === true;
    if (!marketSurvey || !hasSourceBackedFacts) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: "market_survey_context",
        visibleLabel: "Market Survey Context",
        facts: {
          market_rent_ranges: [],
        },
        factAvailability: {
          required: requiredFacts,
          available: [],
          missing: requiredFacts,
          sourceBacked: false,
          sourcePresent: Boolean(section?.factAvailability?.sourcePresent || marketSurvey),
        },
        boundaries: {
          marketSurveyIsContextOnly: true,
          noMarketSurveyOverride: true,
        },
        sourceDoc: marketSurvey,
      };
    }
    return {
      ...section,
      sourceRole: "market_survey_context",
      visibleLabel: marketSurvey?.visibleLabel || marketSurvey?.roleLabel || "Market Survey Context",
      facts: {
        market_rent_ranges: marketRentRanges,
      },
      boundaries: {
        marketSurveyIsContextOnly: true,
        noMarketSurveyOverride: true,
      },
      factAvailability: {
        required: requiredFacts,
        available: availableFacts,
        missing: requiredFacts.filter((factName) => !availableFacts.includes(factName)),
        sourceBacked: hasSourceBackedFacts,
        sourcePresent: Boolean(section?.factAvailability?.sourcePresent || marketSurvey),
      },
      sourceDoc: marketSurvey,
    };
  }

  if (key === "environmentalContext") {
    const environmental = supportDocsByRole.environmental_context || null;
    const facts = environmental?.extractedFacts || {};
    const phaseIStatus = String(facts.phase_i_status || "").trim();
    const requiredFacts = Array.isArray(section?.requiredFacts) ? section.requiredFacts : [];
    const availableFacts = phaseIStatus ? ["phase_i_status"] : [];
    const hasSourceBackedFacts = availableFacts.length > 0 && section?.factAvailability?.sourceBacked === true;
    if (!environmental || !hasSourceBackedFacts) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: "environmental_context",
        visibleLabel: "Environmental / Phase I ESA Context",
        facts: {
          phase_i_status: null,
        },
        factAvailability: {
          required: requiredFacts,
          available: [],
          missing: requiredFacts,
          sourceBacked: false,
          sourcePresent: Boolean(section?.factAvailability?.sourcePresent || environmental),
        },
        boundaries: {
          environmentalIsContextOnly: true,
        },
        sourceDoc: environmental,
      };
    }
    return {
      ...section,
      sourceRole: "environmental_context",
      visibleLabel: environmental?.visibleLabel || environmental?.roleLabel || "Environmental / Phase I ESA Context",
      facts: {
        phase_i_status: phaseIStatus || null,
      },
      boundaries: {
        environmentalIsContextOnly: true,
      },
      factAvailability: {
        required: requiredFacts,
        available: availableFacts,
        missing: requiredFacts.filter((factName) => !availableFacts.includes(factName)),
        sourceBacked: hasSourceBackedFacts,
        sourcePresent: Boolean(section?.factAvailability?.sourcePresent || environmental),
      },
      sourceDoc: environmental,
    };
  }

  if (key === "unitMix") {
    const rentRoll = coreSources.coreRentRoll;
    const facts = rentRoll?.extractedFacts || {};
    const sourceBacked = Boolean(rentRoll);
    const availableFacts = Object.entries({
      total_units: facts.total_units,
      occupancy: facts.occupancy,
      unit_mix: facts.unit_mix,
      units: facts.units,
      annual_in_place_rent: facts.annual_in_place_rent,
      annual_market_rent: facts.annual_market_rent,
    })
      .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)) || Array.isArray(value))
      .map(([keyName]) => keyName);
    return {
      ...section,
      sourceRole: "core_rent_roll",
      visibleLabel: rentRoll?.visibleLabel || rentRoll?.canonicalLabel || "Core Quantitative Source / Rent Roll",
      facts: {
        total_units: normalizeMoney(facts.total_units),
        occupancy: normalizeCapRatio(facts.occupancy),
        unit_mix: clone(facts.unit_mix || []),
        units: clone(facts.units || []),
        annual_in_place_rent: normalizeMoney(facts.annual_in_place_rent),
        annual_market_rent: normalizeMoney(facts.annual_market_rent),
      },
      boundaries: {
        noFalseMissingRowsTextWhenStructuredUnitMixExists: true,
      },
      factAvailability: {
        required: ["unit_mix", "total_units"],
        available: availableFacts,
        missing: ["unit_mix", "total_units"].filter((factName) => !availableFacts.includes(factName)),
        sourceBacked,
      },
      sourceDoc: rentRoll,
    };
  }

  if (key === "capRateValueIndication") {
    const rentRoll = coreSources.coreRentRoll;
    const facts = rentRoll?.extractedFacts || {};
    const sourceBacked = Boolean(rentRoll);
    const availableFacts = Object.entries({
      total_units: facts.total_units,
      going_in_cap_rate: valueSemantics?.wholePropertyValue?.goingInCapRate,
      implied_value_at_going_in_cap_rate: valueSemantics?.wholePropertyValue?.impliedValueAtGoingInCapRate,
    })
      .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)))
      .map(([keyName]) => keyName);
    return {
      ...section,
      sourceRole: "core_rent_roll",
      visibleLabel: rentRoll?.visibleLabel || rentRoll?.canonicalLabel || "Core Quantitative Source / Rent Roll",
      facts: {
        total_units: normalizeMoney(facts.total_units),
        going_in_cap_rate: normalizeCapRatio(valueSemantics?.wholePropertyValue?.goingInCapRate),
        implied_value_at_going_in_cap_rate: normalizeMoney(valueSemantics?.wholePropertyValue?.impliedValueAtGoingInCapRate),
      },
      boundaries: {
        perUnitValuesRequiredWhenUnitsExist: true,
      },
      factAvailability: {
        required: ["total_units", "going_in_cap_rate"],
        available: availableFacts,
        missing: ["total_units", "going_in_cap_rate"].filter((factName) => !availableFacts.includes(factName)),
        sourceBacked,
      },
      sourceDoc: rentRoll,
    };
  }

  if (key === "operatingStatementTTMSummary") {
    const t12 = coreSources.coreT12;
    const facts = t12?.extractedFacts || {};
    const sourceBacked = Boolean(t12);
    const availableFacts = Object.entries({
      income_lines: facts.income_lines,
      expense_lines: facts.expense_lines,
      effective_gross_income: facts.effective_gross_income,
      total_operating_expenses: facts.total_operating_expenses,
      net_operating_income: facts.net_operating_income,
      gross_potential_rent: facts.gross_potential_rent,
    })
      .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Array.isArray(value))
      .map(([keyName]) => keyName);
    return {
      ...section,
      sourceRole: "core_t12",
      visibleLabel: t12?.visibleLabel || t12?.canonicalLabel || "Core Quantitative Source / Trailing 12-Month Income Statement",
      facts: {
        income_lines: clone(facts.income_lines || []),
        expense_lines: clone(facts.expense_lines || []),
        effective_gross_income: normalizeMoney(facts.effective_gross_income),
        total_operating_expenses: normalizeMoney(facts.total_operating_expenses),
        net_operating_income: normalizeMoney(facts.net_operating_income),
        gross_potential_rent: normalizeMoney(facts.gross_potential_rent),
      },
      boundaries: {
        lineItemsMustRenderWhenPresent: true,
      },
      factAvailability: {
        required: ["effective_gross_income", "total_operating_expenses", "net_operating_income"],
        available: availableFacts,
        missing: ["effective_gross_income", "total_operating_expenses", "net_operating_income"].filter((factName) => !availableFacts.includes(factName)),
        sourceBacked,
      },
      sourceDoc: t12,
    };
  }

  if (key === "documentTreatment") {
    return {
      ...section,
      sourceRole: "canonical_source_package",
      visibleLabel: "Source Context / Support Document Treatment",
      facts: {
        support_doc_count: Array.isArray(supportDocsByRole.__all) ? supportDocsByRole.__all.length : 0,
      },
      boundaries: {
        coreSourcesMustRemainCoreSources: true,
      },
    };
  }

  if (key === "dataCoverageSourceLimitations") {
    return {
      ...section,
      sourceRole: "canonical_source_package",
      visibleLabel: "Data Coverage / Source Limitations",
      facts: {
        core_source_count: 2,
        support_doc_count: Array.isArray(supportDocsByRole.__all) ? supportDocsByRole.__all.length : 0,
      },
    };
  }

  if (key === "methodologyDataTransparency") {
    return {
      ...section,
      sourceRole: "canonical_source_package",
      visibleLabel: "Methodology / Data Transparency",
      facts: {
        method: "Document-backed, source-transparent, fail-closed",
      },
    };
  }

  return section;
}

function buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage = null,
  acquisitionMemoProjection = null,
  bossContract = null,
  financialIntelligence = null,
  coreMetrics = null,
  propertyProfile = null,
  reportMeta = null,
  reportMode = null,
} = {}) {
  const canonicalFinancialIntelligence =
    financialIntelligence ||
    acquisitionMemoProjection?.financialIntelligence ||
    bossContract?.financialIntelligence ||
    null;
  if (canonicalFinancialIntelligence && !isCanonicalInstitutionalFinancialIntelligence(canonicalFinancialIntelligence)) {
    throw new Error("CANONICAL_INSTITUTIONAL_FINANCIAL_INTELLIGENCE_REQUIRED_FOR_CUSTOMER_SURFACE_MODEL");
  }
  const supportSources = collectSupportDocs(canonicalSourcePackage, acquisitionMemoProjection, bossContract);
  const supportSourcesByRole = {
    __all: supportSources,
  };
  for (const doc of supportSources) {
    if (!doc?.canonicalRole) continue;
    if (!supportSourcesByRole[doc.canonicalRole]) {
      supportSourcesByRole[doc.canonicalRole] = {
        ...doc,
        sourceIdentityKey: supportDocIdentityKeys(doc)[0] || null,
      };
    }
  }

  const coreT12 = buildCoreSourceSnapshot(
    bossContract?.sourceTruth?.coreT12 || canonicalSourcePackage?.coreT12 || null,
    "core_t12",
    "Core Quantitative Source / Trailing 12-Month Income Statement"
  );
  const coreRentRoll = buildCoreSourceSnapshot(
    bossContract?.sourceTruth?.coreRentRoll || canonicalSourcePackage?.coreRentRoll || null,
    "core_rent_roll",
    "Core Quantitative Source / Rent Roll"
  );
  const coreSources = {
    coreT12,
    coreRentRoll,
  };

  const propertyName = String(propertyProfile?.propertyName || propertyProfile?.property_name || reportMeta?.propertyName || reportMeta?.property_name || "").trim();
  const assetClass = String(propertyProfile?.assetClass || propertyProfile?.asset_class || "").trim();
  const visibleClassification = String(
    reportMeta?.visibleClassification ||
      propertyProfile?.visibleClassification ||
      bossContract?.visibleClassification ||
      "Review - Source Reconciliation Disclosure"
  ).trim();
  const reportTitle = String(reportMeta?.reportTitle || reportMeta?.report_title || `${propertyName || UNDERWRITING_REPORT_IDENTITY.canonicalTitle}`.trim()).trim();

  const units = normalizeMoney(coreMetrics?.units ?? coreRentRoll?.extractedFacts?.total_units);
  const occupancy = normalizeCapRatio(coreMetrics?.occupancy ?? coreRentRoll?.extractedFacts?.occupancy);
  const annualInPlaceRent = normalizeMoney(coreMetrics?.annualInPlaceRent ?? coreRentRoll?.extractedFacts?.annual_in_place_rent);
  const annualMarketRent = normalizeMoney(coreMetrics?.annualMarketRent ?? coreRentRoll?.extractedFacts?.annual_market_rent);
  const annualRentUpside = normalizeMoney(coreMetrics?.annualRentUpside ?? (Number.isFinite(annualInPlaceRent) && Number.isFinite(annualMarketRent) ? annualMarketRent - annualInPlaceRent : null));
  const egi = normalizeMoney(coreMetrics?.egi ?? coreT12?.extractedFacts?.effective_gross_income);
  const opEx = normalizeMoney(coreMetrics?.opEx ?? coreT12?.extractedFacts?.total_operating_expenses);
  const noi = normalizeMoney(coreMetrics?.noi ?? coreT12?.extractedFacts?.net_operating_income);
  const expenseRatio = normalizeCapRatio(coreMetrics?.expenseRatio);
  const noiMargin = normalizeCapRatio(coreMetrics?.noiMargin);
  const providedBreakEvenOccupancy = normalizeCapRatio(coreMetrics?.breakEvenOccupancy);
  const grossPotentialRent = normalizeMoney(coreT12?.extractedFacts?.gross_potential_rent);
  const breakEvenOccupancy = Number.isFinite(opEx) && Number.isFinite(grossPotentialRent) && grossPotentialRent > 0
    ? opEx / grossPotentialRent
    : null;
  const purchasePrice = normalizeMoney(coreMetrics?.purchasePrice ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.purchase_price);
  const goingInCapRate = normalizeCapRatio(coreMetrics?.goingInCapRate ?? acquisitionMemoProjection?.proposedFinancingContext?.extractedFacts?.going_in_cap_rate);
  const impliedValueAtGoingInCapRate = Number.isFinite(noi) && Number.isFinite(goingInCapRate) && goingInCapRate > 0 ? noi / goingInCapRate : null;
  const wholePropertyValueDelta = Number.isFinite(impliedValueAtGoingInCapRate) && Number.isFinite(purchasePrice) ? impliedValueAtGoingInCapRate - purchasePrice : null;

  const valueSemantics = {
    wholePropertyValue: {
      purchasePrice,
      noi,
      goingInCapRate,
      impliedValueAtGoingInCapRate,
      valueDeltaVsPurchasePrice: wholePropertyValueDelta,
    },
    rentUpsideValue: {
      annualInPlaceRent,
      annualMarketRent,
      annualRentUpside,
      rentGapPct: Number.isFinite(annualInPlaceRent) && Number.isFinite(annualRentUpside) && annualInPlaceRent > 0 ? annualRentUpside / annualInPlaceRent : null,
    },
    appraisal: {
      stabilizedCapRateLabel: "Appraisal / Valuation Context",
      stabilizedNOILabel: "Stabilized valuation context only",
      interestRateLabel: "Current debt interest rate is separate from appraisal cap rate",
    },
  };

  const currentDebtSourceKey = supportSourcesByRole.current_debt_context?.sourceIdentityKey || null;
  const purchaseAssumptionsSourceKey = supportSourcesByRole.purchase_assumptions?.sourceIdentityKey || null;
  const proposedLoanAmount = normalizeMoney(
    coreMetrics?.proposedLoanAmount ??
      supportSourcesByRole.purchase_assumptions?.extractedFacts?.proposed_loan_amount
  );
  const currentAnnualDebtService = normalizeMoney(
    canonicalFinancialIntelligence?.analyses?.debtService?.currentDebt?.annualDebtService ??
      canonicalFinancialIntelligence?.customerSections?.debtServiceCoverage?.facts?.currentDebt?.annualDebtService
  );
  const proposedAnnualDebtService = normalizeMoney(
    canonicalFinancialIntelligence?.analyses?.debtService?.proposedFinancing?.annualDebtService ??
      canonicalFinancialIntelligence?.customerSections?.debtServiceCoverage?.facts?.proposedFinancing?.annualDebtService
  );
  const debtYield = Number.isFinite(noi) && noi > 0 && Number.isFinite(proposedLoanAmount) && proposedLoanAmount > 0
    ? noi / proposedLoanAmount
    : null;
  const mortgageConstant = Number.isFinite(proposedAnnualDebtService) && proposedAnnualDebtService > 0 &&
    Number.isFinite(proposedLoanAmount) && proposedLoanAmount > 0
    ? proposedAnnualDebtService / proposedLoanAmount
    : null;
  const currentDebtInclusiveOperatingBreakEvenOccupancy = Number.isFinite(opEx) && Number.isFinite(currentAnnualDebtService) && currentAnnualDebtService > 0 &&
    Number.isFinite(grossPotentialRent) && grossPotentialRent > 0
    ? (opEx + currentAnnualDebtService) / grossPotentialRent
    : null;
  const proposedDebtInclusiveOperatingBreakEvenOccupancy = Number.isFinite(opEx) && Number.isFinite(proposedAnnualDebtService) && proposedAnnualDebtService > 0 &&
    Number.isFinite(grossPotentialRent) && grossPotentialRent > 0
    ? (opEx + proposedAnnualDebtService) / grossPotentialRent
    : null;
  const currentDebtInclusiveBreakEvenMonthlyRentPerUnit = Number.isFinite(opEx) && Number.isFinite(currentAnnualDebtService) && currentAnnualDebtService > 0 &&
    Number.isFinite(units) && units > 0
    ? (opEx + currentAnnualDebtService) / units / 12
    : null;
  const proposedDebtInclusiveBreakEvenMonthlyRentPerUnit = Number.isFinite(opEx) && Number.isFinite(proposedAnnualDebtService) && proposedAnnualDebtService > 0 &&
    Number.isFinite(units) && units > 0
    ? (opEx + proposedAnnualDebtService) / units / 12
    : null;
  const sectionMap = buildSectionMap(bossContract);
  const sections = {};
  for (const [key, section] of Object.entries(sectionMap)) {
    sections[key] = buildSectionRoleModel(section, supportSourcesByRole, coreSources, valueSemantics);
    const financialSection = canonicalFinancialIntelligence?.customerSections?.[key] || null;
    if (financialSection) {
      sections[key] = {
        ...sections[key],
        status: financialSection.displayReady === true ? "required" : "collapsed",
        facts: clone(financialSection.facts || {}),
        factAvailability: {
          ...(sections[key]?.factAvailability || {}),
          required: clone(financialSection.requiredFacts || []),
          available: clone(financialSection.availableFacts || []),
          missing: clone(financialSection.missingFacts || []),
          sourcePresent: financialSection.sourcePresent === true,
          roleAccepted: financialSection.roleAccepted === true,
          factAccepted: financialSection.factAccepted === true,
          sourceBacked: financialSection.sourceBacked === true,
          sectionDisplayReady: financialSection.displayReady === true,
        },
      };
    }
  }
  const existingDebtCapacityFacts = sections.debtCapacityAndCoverage?.facts || {};
  const proposedDscr = normalizeMoney(
    sections.debtServiceCoverage?.facts?.proposedFinancing?.dscr ??
      canonicalFinancialIntelligence?.customerSections?.debtServiceCoverage?.facts?.proposedFinancing?.dscr
  );
  const proposedLtv = normalizeCapRatio(
    sections.proposedFinancingContext?.facts?.ltv ??
      sections.acquisitionRequestContext?.facts?.ltv ??
      supportSourcesByRole.purchase_assumptions?.extractedFacts?.ltv
  );
  const governedDebtCapacityResult =
    existingDebtCapacityFacts?.debtCapacityResult?.result ??
    existingDebtCapacityFacts?.debtCapacityResult ??
    null;
  const governedBindingConstraint =
    existingDebtCapacityFacts?.bindingConstraint?.result ??
    existingDebtCapacityFacts?.bindingConstraint ??
    null;
  const breakEvenMetricCount = [
    currentDebtInclusiveOperatingBreakEvenOccupancy,
    proposedDebtInclusiveOperatingBreakEvenOccupancy,
    currentDebtInclusiveBreakEvenMonthlyRentPerUnit,
    proposedDebtInclusiveBreakEvenMonthlyRentPerUnit,
  ].filter(Number.isFinite).length;
  const debtCapacityTruth = {
    proposedDebtYield: {
      label: "Proposed Acquisition Debt Yield",
      formula: "accepted_t12_net_operating_income_divided_by_accepted_proposed_loan_amount",
      numeratorFact: "net_operating_income",
      denominatorFact: "proposed_loan_amount",
      numerator: noi,
      denominator: proposedLoanAmount,
      result: debtYield,
      displayReady: Number.isFinite(debtYield),
      units: "ratio",
      sourceFamily: "T12 / purchase assumptions",
      inputProvenance: [coreSources.coreT12?.sourceIdentityKey, purchaseAssumptionsSourceKey].filter(Boolean),
      numeratorProvenance: coreSources.coreT12?.sourceIdentityKey ? [coreSources.coreT12.sourceIdentityKey] : [],
      denominatorProvenance: purchaseAssumptionsSourceKey ? [purchaseAssumptionsSourceKey] : [],
    },
    proposedMortgageConstant: {
      label: "Proposed Acquisition Mortgage Constant",
      formula: "accepted_annual_debt_service_divided_by_accepted_proposed_loan_amount",
      numeratorFact: "annual_debt_service",
      denominatorFact: "proposed_loan_amount",
      numerator: proposedAnnualDebtService,
      denominator: proposedLoanAmount,
      result: mortgageConstant,
      displayReady: Number.isFinite(mortgageConstant),
      units: "ratio",
      sourceFamily: "proposed financing / debt service",
      inputProvenance: [purchaseAssumptionsSourceKey].filter(Boolean),
      numeratorProvenance: purchaseAssumptionsSourceKey ? [purchaseAssumptionsSourceKey] : [],
      denominatorProvenance: purchaseAssumptionsSourceKey ? [purchaseAssumptionsSourceKey] : [],
    },
    dscr: {
      label: "Proposed Acquisition DSCR",
      formula: "accepted_noi_divided_by_accepted_proposed_annual_debt_service",
      numeratorFact: "net_operating_income",
      denominatorFact: "proposed_annual_debt_service",
      numerator: noi,
      denominator: proposedAnnualDebtService,
      result: proposedDscr,
      displayReady: Number.isFinite(proposedDscr),
      units: "multiple",
      sourceFamily: "T12 / proposed financing",
      inputProvenance: [coreSources.coreT12?.sourceIdentityKey, purchaseAssumptionsSourceKey].filter(Boolean),
      numeratorProvenance: coreSources.coreT12?.sourceIdentityKey ? [coreSources.coreT12.sourceIdentityKey] : [],
      denominatorProvenance: purchaseAssumptionsSourceKey ? [purchaseAssumptionsSourceKey] : [],
    },
    ltv: {
      label: "Proposed Acquisition LTV",
      formula: "accepted_proposed_loan_amount_divided_by_accepted_purchase_price",
      numeratorFact: "proposed_loan_amount",
      denominatorFact: "purchase_price",
      numerator: proposedLoanAmount,
      denominator: purchasePrice,
      result: proposedLtv,
      displayReady: Number.isFinite(proposedLtv),
      units: "ratio",
      sourceFamily: "purchase assumptions",
      inputProvenance: [purchaseAssumptionsSourceKey].filter(Boolean),
      numeratorProvenance: purchaseAssumptionsSourceKey ? [purchaseAssumptionsSourceKey] : [],
      denominatorProvenance: purchaseAssumptionsSourceKey ? [purchaseAssumptionsSourceKey] : [],
    },
    debtCapacityResult: {
      label: "Debt Capacity Result",
      formula: "governed_debt_capacity_result_from_financial_intelligence",
      numeratorFact: null,
      denominatorFact: null,
      numerator: null,
      denominator: null,
      result: governedDebtCapacityResult,
      displayReady: governedMetricDisplayReady(governedDebtCapacityResult),
      units: "text",
      sourceFamily: "financial intelligence",
      inputProvenance: [],
      numeratorProvenance: [],
      denominatorProvenance: [],
    },
    bindingConstraint: {
      label: "Binding Constraint",
      formula: "governed_binding_constraint_from_financial_intelligence",
      numeratorFact: null,
      denominatorFact: null,
      numerator: null,
      denominator: null,
      result: governedBindingConstraint,
      displayReady: governedMetricDisplayReady(governedBindingConstraint),
      units: "text",
      sourceFamily: "financial intelligence",
      inputProvenance: [],
      numeratorProvenance: [],
      denominatorProvenance: [],
    },
    breakEvenMetrics: {
      label: "Debt-Inclusive Break-Even Metrics",
      formula: "governed_break_even_metric_group",
      numeratorFact: null,
      denominatorFact: null,
      numerator: null,
      denominator: null,
      result: breakEvenMetricCount > 0 ? `${breakEvenMetricCount} governed break-even metrics available` : null,
      displayReady: breakEvenMetricCount > 0,
      units: "text",
      sourceFamily: "T12 / Rent Roll / debt context",
      inputProvenance: [coreSources.coreT12?.sourceIdentityKey, coreSources.coreRentRoll?.sourceIdentityKey, currentDebtSourceKey, purchaseAssumptionsSourceKey].filter(Boolean),
      numeratorProvenance: [],
      denominatorProvenance: [],
    },
    currentDebtInclusiveBreakEvenOccupancy: {
      label: "Current Debt-Inclusive Operating Break-Even Ratio",
      formula: "accepted_t12_total_operating_expenses_plus_accepted_current_annual_debt_service_divided_by_accepted_t12_gross_potential_rent",
      numeratorFact: "total_operating_expenses_plus_current_annual_debt_service",
      denominatorFact: "gross_potential_rent",
      numerator: Number.isFinite(opEx) && Number.isFinite(currentAnnualDebtService) ? opEx + currentAnnualDebtService : null,
      denominator: grossPotentialRent,
      result: currentDebtInclusiveOperatingBreakEvenOccupancy,
      displayReady: Number.isFinite(currentDebtInclusiveOperatingBreakEvenOccupancy),
      units: "ratio",
      sourceFamily: "T12 / current debt",
      inputProvenance: [coreSources.coreT12?.sourceIdentityKey, currentDebtSourceKey].filter(Boolean),
      numeratorProvenance: [coreSources.coreT12?.sourceIdentityKey, currentDebtSourceKey].filter(Boolean),
      denominatorProvenance: coreSources.coreT12?.sourceIdentityKey ? [coreSources.coreT12.sourceIdentityKey] : [],
    },
    proposedDebtInclusiveBreakEvenOccupancy: {
      label: "Proposed Acquisition Debt-Inclusive Operating Break-Even Ratio",
      formula: "accepted_t12_total_operating_expenses_plus_accepted_proposed_annual_debt_service_divided_by_accepted_t12_gross_potential_rent",
      numeratorFact: "total_operating_expenses_plus_proposed_annual_debt_service",
      denominatorFact: "gross_potential_rent",
      numerator: Number.isFinite(opEx) && Number.isFinite(proposedAnnualDebtService) ? opEx + proposedAnnualDebtService : null,
      denominator: grossPotentialRent,
      result: proposedDebtInclusiveOperatingBreakEvenOccupancy,
      displayReady: Number.isFinite(proposedDebtInclusiveOperatingBreakEvenOccupancy),
      units: "ratio",
      sourceFamily: "T12 / proposed financing",
      inputProvenance: [coreSources.coreT12?.sourceIdentityKey, purchaseAssumptionsSourceKey].filter(Boolean),
      numeratorProvenance: [coreSources.coreT12?.sourceIdentityKey, purchaseAssumptionsSourceKey].filter(Boolean),
      denominatorProvenance: coreSources.coreT12?.sourceIdentityKey ? [coreSources.coreT12.sourceIdentityKey] : [],
    },
    currentDebtInclusiveBreakEvenMonthlyRentPerUnit: {
      label: "Current Debt-Inclusive Break-Even Monthly Rent per Unit",
      formula: "accepted_t12_total_operating_expenses_plus_accepted_current_annual_debt_service_divided_by_accepted_total_units_divided_by_12",
      numeratorFact: "total_operating_expenses_plus_current_annual_debt_service",
      denominatorFact: "total_units_times_12",
      numerator: Number.isFinite(opEx) && Number.isFinite(currentAnnualDebtService) ? opEx + currentAnnualDebtService : null,
      denominator: Number.isFinite(units) && units > 0 ? units * 12 : null,
      result: currentDebtInclusiveBreakEvenMonthlyRentPerUnit,
      displayReady: Number.isFinite(currentDebtInclusiveBreakEvenMonthlyRentPerUnit),
      units: "currency_per_unit_per_month",
      sourceFamily: "T12 / current debt / rent roll",
      inputProvenance: [coreSources.coreT12?.sourceIdentityKey, currentDebtSourceKey, coreSources.coreRentRoll?.sourceIdentityKey].filter(Boolean),
      numeratorProvenance: [coreSources.coreT12?.sourceIdentityKey, currentDebtSourceKey].filter(Boolean),
      denominatorProvenance: coreSources.coreRentRoll?.sourceIdentityKey ? [coreSources.coreRentRoll.sourceIdentityKey] : [],
    },
    proposedDebtInclusiveBreakEvenMonthlyRentPerUnit: {
      label: "Proposed Acquisition Debt-Inclusive Break-Even Monthly Rent per Unit",
      formula: "accepted_t12_total_operating_expenses_plus_accepted_proposed_annual_debt_service_divided_by_accepted_total_units_divided_by_12",
      numeratorFact: "total_operating_expenses_plus_proposed_annual_debt_service",
      denominatorFact: "total_units_times_12",
      numerator: Number.isFinite(opEx) && Number.isFinite(proposedAnnualDebtService) ? opEx + proposedAnnualDebtService : null,
      denominator: Number.isFinite(units) && units > 0 ? units * 12 : null,
      result: proposedDebtInclusiveBreakEvenMonthlyRentPerUnit,
      displayReady: Number.isFinite(proposedDebtInclusiveBreakEvenMonthlyRentPerUnit),
      units: "currency_per_unit_per_month",
      sourceFamily: "T12 / proposed financing / rent roll",
      inputProvenance: [coreSources.coreT12?.sourceIdentityKey, purchaseAssumptionsSourceKey, coreSources.coreRentRoll?.sourceIdentityKey].filter(Boolean),
      numeratorProvenance: [coreSources.coreT12?.sourceIdentityKey, purchaseAssumptionsSourceKey].filter(Boolean),
      denominatorProvenance: coreSources.coreRentRoll?.sourceIdentityKey ? [coreSources.coreRentRoll.sourceIdentityKey] : [],
    },
  };
  const debtCapacityAvailableFacts = Object.entries(debtCapacityTruth)
    .filter(([, receipt]) => receipt?.displayReady === true && governedMetricDisplayReady(receipt?.result))
    .map(([keyName]) => keyName);
  sections.debtCapacityAndCoverage = {
    key: "debtCapacityAndCoverage",
    status: debtCapacityAvailableFacts.length > 0 ? "required" : "collapsed",
    displayReady: debtCapacityAvailableFacts.length > 0,
    sourcePresent: Boolean(supportSourcesByRole.purchase_assumptions || supportSourcesByRole.current_debt_context),
    roleAccepted: Boolean(supportSourcesByRole.purchase_assumptions || supportSourcesByRole.current_debt_context),
    factAccepted: debtCapacityAvailableFacts.length > 0,
    sourceBacked: debtCapacityAvailableFacts.length > 0,
    facts: debtCapacityTruth,
    requiredFacts: Object.keys(debtCapacityTruth),
    availableFacts: debtCapacityAvailableFacts,
    missingFacts: Object.keys(debtCapacityTruth).filter((factName) => !debtCapacityAvailableFacts.includes(factName)),
    sourceRole: "canonical_source_package",
    visibleLabel: "Debt Capacity and Coverage",
    boundaries: {
      deterministicMathOnly: true,
      noUnsupportedScenarioInference: true,
    },
    factAvailability: {
      required: Object.keys(debtCapacityTruth),
      available: debtCapacityAvailableFacts,
      missing: Object.keys(debtCapacityTruth).filter((factName) => !debtCapacityAvailableFacts.includes(factName)),
      sourceBacked: debtCapacityAvailableFacts.length > 0,
      sourcePresent: Boolean(supportSourcesByRole.purchase_assumptions || supportSourcesByRole.current_debt_context),
      roleAccepted: Boolean(supportSourcesByRole.purchase_assumptions || supportSourcesByRole.current_debt_context),
      factAccepted: debtCapacityAvailableFacts.length > 0,
      sectionDisplayReady: debtCapacityAvailableFacts.length > 0,
    },
    sourceDoc: supportSourcesByRole.purchase_assumptions || supportSourcesByRole.current_debt_context || null,
  };
  const acceptedSourceTruth = {
    purchaseAssumptionsPresent: supportSources.some((doc) => Boolean(doc?.acceptedPurchaseAssumptionsTruth)),
    currentDebtPresent: supportSources.some((doc) => Boolean(doc?.acceptedCurrentDebtTruth)),
  };
  const sourceReconciliationState = clone(
    bossContract?.sourceTruth?.sourceReconciliation?.state ||
      acquisitionMemoProjection?.sourceReconciliation?.state ||
      null
  );
  const sourceReconciliationDisclosures = clone(
    bossContract?.sourceTruth?.sourceReconciliation?.disclosures ||
      acquisitionMemoProjection?.sourceReconciliation?.disclosures ||
      []
  );
  const sourceReconciliation = {
    state: sourceReconciliationState,
    disclosures: Array.isArray(sourceReconciliationDisclosures) ? sourceReconciliationDisclosures : [],
    sourceBacked: Boolean(
      (bossContract?.sourceTruth?.sourceReconciliation?.sourceBacked === true || acquisitionMemoProjection?.sourceReconciliation?.sourceBacked === true) &&
      Number.isFinite(normalizeMoney(sourceReconciliationState?.t12_gpr)) &&
      Number.isFinite(normalizeMoney(sourceReconciliationState?.rr_annual_in_place)) &&
      Number.isFinite(normalizeMoney(sourceReconciliationState?.difference_amount)) &&
      Number.isFinite(normalizeCapRatio(sourceReconciliationState?.variance_pct)) &&
      String(sourceReconciliationState?.source_reconciliation_disclosure || "").trim().length > 0
    ),
  };
  const dispositionRuntime = applyDispositionsToCustomerSurfaceSections(sections);
  const governedSections = dispositionRuntime.sections;

  return {
    modelVersion: MODEL_VERSION,
    reportMode: reportMode || bossContract?.reportMode || reportMeta?.reportMode || null,
    identity: {
      propertyName,
      propertyAddress: String(propertyProfile?.propertyAddress || propertyProfile?.property_address || reportMeta?.propertyAddress || reportMeta?.property_address || "").trim(),
      propertyTitle: String(propertyProfile?.propertyTitle || propertyProfile?.property_title || reportMeta?.propertyTitle || reportMeta?.property_title || propertyName || "").trim(),
      assetClass,
      visibleClassification,
      reportTitle,
      reportType: String(reportMeta?.reportType || reportMeta?.report_type || "").trim(),
      reportTier: reportMeta?.reportTier ?? reportMeta?.report_tier ?? null,
    },
    coreSources,
    supportSources,
    supportSourceCounts: {
      rawInputCount: toArrayLike(canonicalSourcePackage?.supportDocs).length + toArrayLike(acquisitionMemoProjection?.supportDocProjection?.allSupportDocs).length + toArrayLike(bossContract?.sourceTruth?.supportDocs).length,
      uniqueUploadedFileCount: supportSources.length,
    },
    sourceTruth: {
      accepted: acceptedSourceTruth,
      coreT12: coreT12,
      coreRentRoll: coreRentRoll,
      sourceReconciliation,
    },
    supportSourcesByRole,
    sections: governedSections,
    sectionStatuses: Object.fromEntries(Object.entries(governedSections).map(([key, value]) => [key, value.status])),
    sectionDispositionContractVersion: dispositionRuntime.contractVersion,
    sectionDispositionReceipts: dispositionRuntime.dispositionReceipts,
    qualityManifest: {
      sectionDispositionEntries: dispositionRuntime.qualityManifestEntries,
    },
    sourceBackedFacts: {
      acquisitionRequestContext: governedSections.acquisitionRequestContext?.facts || {},
      currentDebtContext: governedSections.currentDebtContext?.facts || {},
      proposedFinancingContext: governedSections.proposedFinancingContext?.facts || {},
      appraisalContext: governedSections.appraisalContext?.facts || {},
      renovationContext: governedSections.renovationContext?.facts || {},
      marketSurveyContext: governedSections.marketSurveyContext?.facts || {},
      environmentalContext: governedSections.environmentalContext?.facts || {},
      unitMix: governedSections.unitMix?.facts || {},
      capRateValueIndication: governedSections.capRateValueIndication?.facts || {},
      operatingStatementTTMSummary: governedSections.operatingStatementTTMSummary?.facts || {},
      dataCoverageSourceLimitations: governedSections.dataCoverageSourceLimitations?.facts || {},
      documentTreatment: governedSections.documentTreatment?.facts || {},
      debtServiceCoverage: governedSections.debtServiceCoverage?.facts || {},
      debtTermAnalysis: governedSections.debtTermAnalysis?.facts || {},
      coreReconciliation: governedSections.coreReconciliation?.facts || {},
      capitalPlanAnalysis: governedSections.capitalPlanAnalysis?.facts || {},
      debtCapacityAndCoverage: governedSections.debtCapacityAndCoverage?.facts || {},
    },
    financialIntelligence: clone(canonicalFinancialIntelligence),
    valueSemantics,
    financialTruth: {
      breakEvenOccupancy: {
        label: "Break-Even Occupancy",
        formula: "total_operating_expenses / gross_potential_rent",
        numeratorFact: "total_operating_expenses",
        denominatorFact: "gross_potential_rent",
        numerator: opEx,
        denominator: grossPotentialRent,
        result: breakEvenOccupancy,
        upstreamResult: providedBreakEvenOccupancy,
        displayReady: Number.isFinite(breakEvenOccupancy),
      },
      ...Object.fromEntries(
        Object.entries(debtCapacityTruth).map(([key, receipt]) => [
          key,
          {
            label: receipt.label,
            formula: receipt.formula,
            numeratorFact: receipt.numeratorFact,
            denominatorFact: receipt.denominatorFact,
            numerator: receipt.numerator,
            denominator: receipt.denominator,
            result: receipt.result,
            displayReady: receipt.displayReady,
            units: receipt.units,
            sourceFamily: receipt.sourceFamily,
            provenance: receipt.inputProvenance,
            numeratorProvenance: receipt.numeratorProvenance,
            denominatorProvenance: receipt.denominatorProvenance,
          },
        ])
      ),
    },
    diagnostics: {
      coreGatePublishAllowed: Boolean(bossContract?.coreGate?.publishAllowed),
      supportDocCount: supportSources.length,
      hasPurchaseAssumptions: Boolean(supportSourcesByRole.purchase_assumptions) || Boolean(acceptedSourceTruth.purchaseAssumptionsPresent),
      hasCurrentDebtContext: Boolean(supportSourcesByRole.current_debt_context) || Boolean(acceptedSourceTruth.currentDebtPresent),
      hasAppraisalContext: Boolean(supportSourcesByRole.appraisal_context),
      hasRenovationContext: Boolean(supportSourcesByRole.structured_renovation_capex_plan),
      hasMarketSurveyContext: Boolean(supportSourcesByRole.market_survey_context),
      hasEnvironmentalContext: Boolean(supportSourcesByRole.environmental_context),
    },
  };
}

function validateAcquisitionMemoV2CustomerSurfaceModel(model) {
  const issues = [];
  const pushIssue = (code, message, severity = "critical", path = "model") => {
    issues.push({ code, message, severity, path });
  };

  if (!isPlainObject(model)) {
    pushIssue("MODEL_NOT_OBJECT", "Customer surface model must be an object.");
    return { ok: false, issues };
  }

  if (model.modelVersion !== MODEL_VERSION) {
    pushIssue("MODEL_VERSION_MISMATCH", `Expected ${MODEL_VERSION}.`, "critical", "model.modelVersion");
  }

  if (!isPlainObject(model.identity)) {
    pushIssue("MODEL_IDENTITY_MISSING", "identity is required.", "critical", "model.identity");
  } else if (!isApprovedVisibleClassification(model.identity.visibleClassification)) {
    pushIssue(
      "VISIBLE_CLASSIFICATION_INVALID",
      "visibleClassification must be one of the approved customer-facing classifications.",
      "critical",
      "model.identity.visibleClassification"
    );
  }

  if (!isPlainObject(model.coreSources)) {
    pushIssue("MODEL_CORE_SOURCES_MISSING", "coreSources is required.", "critical", "model.coreSources");
  }

  const reconciliationState = model.sourceTruth?.sourceReconciliation?.state || null;
  if (["source_reconciliation_required", "parser_suspected"].includes(String(reconciliationState?.status || "").trim())) {
    const reconciliationFactsComplete = [
      reconciliationState?.t12_gpr,
      reconciliationState?.rr_annual_in_place,
      reconciliationState?.difference_amount,
      reconciliationState?.variance_pct,
    ].every((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)));
    if (!reconciliationFactsComplete || !String(reconciliationState?.source_reconciliation_disclosure || "").trim()) {
      pushIssue(
        "SOURCE_RECONCILIATION_FACTS_LOST",
        "Canonical source reconciliation facts and disclosure must reach the customer surface model.",
        "critical",
        "model.sourceTruth.sourceReconciliation"
      );
    }
    if (model.sourceTruth?.sourceReconciliation?.sourceBacked !== true) {
      pushIssue(
        "SOURCE_RECONCILIATION_NOT_SOURCE_BACKED",
        "Required source reconciliation must remain source-backed through the customer surface model.",
        "critical",
        "model.sourceTruth.sourceReconciliation.sourceBacked"
      );
    }
  }

  if (!Array.isArray(model.supportSources)) {
    pushIssue("MODEL_SUPPORT_SOURCES_MISSING", "supportSources must be an array.", "critical", "model.supportSources");
  }

  if (
    model.financialIntelligence != null &&
    !isCanonicalInstitutionalFinancialIntelligence(model.financialIntelligence)
  ) {
    pushIssue(
      "MODEL_FINANCIAL_INTELLIGENCE_RECEIPT_INVALID",
      "Institutional financial intelligence must remain the canonical consume-only receipt.",
      "critical",
      "model.financialIntelligence"
    );
  }

  const coreT12 = model.coreSources?.coreT12 || null;
  const coreRentRoll = model.coreSources?.coreRentRoll || null;
  if (!coreT12) pushIssue("MODEL_CORE_T12_MISSING", "coreSources.coreT12 is required.", "fatal_core", "model.coreSources.coreT12");
  if (!coreRentRoll) pushIssue("MODEL_CORE_RENT_ROLL_MISSING", "coreSources.coreRentRoll is required.", "fatal_core", "model.coreSources.coreRentRoll");

  const supportSources = Array.isArray(model.supportSources) ? model.supportSources : [];
  const seenSupportDocKeys = new Set();
  for (const doc of supportSources) {
    const key = uniqueSupportDocKey(doc);
    if (seenSupportDocKeys.has(key)) {
      pushIssue("MODEL_SUPPORT_SOURCE_DUPLICATE", "supportSources must be deduped by uploaded file identity.", "critical", "model.supportSources");
      break;
    }
    seenSupportDocKeys.add(key);
  }

  if (!isPlainObject(model.sections)) {
    pushIssue("MODEL_SECTIONS_MISSING", "sections is required.", "critical", "model.sections");
  } else {
    const sectionExpectation = {
      acquisitionRequestContext: { mustHaveFacts: ["purchase_price", "proposed_loan_amount"] },
      currentDebtContext: { mustHaveFacts: ["current_outstanding_balance", "interest_rate", "maturity_date"] },
      proposedFinancingContext: { mustHaveFacts: ["proposed_loan_amount", "ltv", "interest_rate"] },
      appraisalContext: { mustHaveFacts: ["appraisal_value", "stabilized_cap_rate", "stabilized_noi"] },
      renovationContext: { mustHaveFacts: ["total_renovation_budget"] },
      marketSurveyContext: { mustHaveFacts: ["market_rent_ranges"] },
      environmentalContext: { mustHaveFacts: ["phase_i_status"] },
      unitMix: { mustHaveFacts: ["unit_mix", "units"] },
      capRateValueIndication: { mustHaveFacts: ["total_units", "going_in_cap_rate"] },
      operatingStatementTTMSummary: { mustHaveFacts: ["expense_lines", "net_operating_income"] },
      documentTreatment: { mustHaveFacts: ["support_doc_count"] },
      dataCoverageSourceLimitations: { mustHaveFacts: ["core_source_count"] },
      methodologyDataTransparency: { mustHaveFacts: ["method"] },
      debtServiceCoverage: { mustHaveFacts: [] },
      debtTermAnalysis: { mustHaveFacts: [] },
      coreReconciliation: { mustHaveFacts: [] },
      capitalPlanAnalysis: { mustHaveFacts: [] },
    };

    for (const [sectionKey, expectation] of Object.entries(sectionExpectation)) {
      const section = model.sections[sectionKey];
      if (!isPlainObject(section)) {
        pushIssue("SECTION_MISSING", `${sectionKey} is required.`, sectionKey === "unitMix" || sectionKey === "capRateValueIndication" || sectionKey === "operatingStatementTTMSummary" ? "fatal_core" : "critical", `model.sections.${sectionKey}`);
        continue;
      }
      if (!ALLOWED_SECTION_STATUSES.has(section.status)) {
        pushIssue("SECTION_STATUS_INVALID", `${sectionKey} has invalid status ${section.status}.`, "critical", `model.sections.${sectionKey}.status`);
      }
      const shouldRender = Boolean(section.factAvailability?.sourceBacked) || section.status === "required" || section.status === "required_if_source_present";
      const isCoreSection = sectionKey === "unitMix" || sectionKey === "capRateValueIndication" || sectionKey === "operatingStatementTTMSummary";
      const isAuthorityContextSection = ["appraisalContext", "renovationContext", "marketSurveyContext", "environmentalContext"].includes(sectionKey);
      if (shouldRender && (isCoreSection || isAuthorityContextSection) && (!Array.isArray(section.sourceBindings) || section.sourceBindings.length === 0)) {
        pushIssue("SECTION_SOURCE_BINDINGS_EMPTY", `${sectionKey} requires source bindings.`, "critical", `model.sections.${sectionKey}.sourceBindings`);
      }
      if (shouldRender && isCoreSection && !Array.isArray(section.postRenderAssertions)) {
        pushIssue("SECTION_ASSERTIONS_MISSING", `${sectionKey} requires post-render assertions.`, "critical", `model.sections.${sectionKey}.postRenderAssertions`);
      }
      for (const factName of expectation.mustHaveFacts) {
        if (shouldRender && isCoreSection && !(factName in (section.facts || {}))) {
          pushIssue("SECTION_REQUIRED_FACT_MISSING", `${sectionKey} must expose ${factName}.`, "fatal_core", `model.sections.${sectionKey}.facts.${factName}`);
        }
      }
      for (const factName of Array.isArray(section.requiredFacts) ? section.requiredFacts : []) {
        if (shouldRender && isAuthorityContextSection && !(factName in (section.facts || {}))) {
          pushIssue("SECTION_ACCEPTED_FACT_MISSING", `${sectionKey} lost accepted fact ${factName}.`, "critical", `model.sections.${sectionKey}.facts.${factName}`);
        }
      }
      if (shouldRender && isCoreSection && !section.factAvailability?.sourceBacked) {
        pushIssue("SECTION_NOT_SOURCE_BACKED", `${sectionKey} must be source-backed.`, "critical", `model.sections.${sectionKey}.factAvailability.sourceBacked`);
      }
      if (section.status === "required" && isAuthorityContextSection && !section.factAvailability?.sourceBacked) {
        pushIssue("SECTION_ACCEPTED_AUTHORITY_LOST", `${sectionKey} cannot be required without canonical source authority.`, "critical", `model.sections.${sectionKey}.factAvailability.sourceBacked`);
      }
    }

    if (isCanonicalInstitutionalFinancialIntelligence(model.financialIntelligence)) {
      for (const [sectionKey, receiptSection] of Object.entries(model.financialIntelligence.customerSections || {})) {
        const modelSection = model.sections?.[sectionKey] || null;
        if (
          receiptSection?.displayReady === true &&
          (modelSection?.status !== "required" || modelSection?.factAvailability?.sourceBacked !== true)
        ) {
          pushIssue(
            "MODEL_FINANCIAL_INTELLIGENCE_TRUTH_LOST",
            `${sectionKey} lost a display-ready canonical financial-intelligence receipt.`,
            "critical",
            `model.sections.${sectionKey}`
          );
        }
        if (
          receiptSection?.displayReady !== true &&
          modelSection?.factAvailability?.sourceBacked === true
        ) {
          pushIssue(
            "MODEL_FINANCIAL_INTELLIGENCE_FALSE_COMPLETENESS",
            `${sectionKey} cannot become source-backed when its canonical receipt is not display-ready.`,
            "critical",
            `model.sections.${sectionKey}.factAvailability.sourceBacked`
          );
        }
      }
    }
  }

  const supportSourcesByRole = model.supportSourcesByRole || {};
  const purchaseAssumptions = supportSourcesByRole.purchase_assumptions || null;
  const currentDebt = supportSourcesByRole.current_debt_context || null;
  const appraisal = supportSourcesByRole.appraisal_context || null;
  const renovation = supportSourcesByRole.renovation_capex_context || supportSourcesByRole.structured_renovation_capex_plan || supportSourcesByRole.renovation_capex_budget_context || null;
  const marketSurvey = supportSourcesByRole.market_survey_context || null;
  const environmental = supportSourcesByRole.environmental_context || null;
  const acceptedSourceTruth = model.sourceTruth?.accepted || {};

  if (purchaseAssumptions) {
    const label = normalizeText(purchaseAssumptions.visibleLabel || purchaseAssumptions.roleLabel || purchaseAssumptions.canonicalLabel);
    if (!label.includes("purchase") || label.includes("current debt")) {
      pushIssue("PURCHASE_ASSUMPTIONS_ROLE_MUTATED", "Purchase assumptions role must remain purchase/proposed acquisition context.", "critical", "model.supportSourcesByRole.purchase_assumptions");
    }
  }

  if (currentDebt) {
    const label = normalizeText(currentDebt.visibleLabel || currentDebt.roleLabel || currentDebt.canonicalLabel);
    if (!label.includes("current debt") && !label.includes("mortgage") && !label.includes("debt statement")) {
      pushIssue("CURRENT_DEBT_ROLE_MUTATED", "Current debt role must remain current debt context.", "critical", "model.supportSourcesByRole.current_debt_context");
    }
    if (label.includes("purchase assumptions") || label.includes("proposed acquisition")) {
      pushIssue("CURRENT_DEBT_ROLE_CONTAMINATED", "Current debt must not be relabeled as purchase assumptions or proposed acquisition.", "critical", "model.supportSourcesByRole.current_debt_context");
    }
  }

  const acceptedPurchaseAssumptionsPresent = Boolean(
    acceptedSourceTruth?.purchaseAssumptionsPresent === true ||
    supportSources.some((doc) => Boolean(doc?.acceptedPurchaseAssumptionsTruth))
  );
  const acceptedCurrentDebtPresent = Boolean(
    acceptedSourceTruth?.currentDebtPresent === true ||
    supportSources.some((doc) => Boolean(doc?.acceptedCurrentDebtTruth))
  );
  if (acceptedPurchaseAssumptionsPresent && !purchaseAssumptions) {
    pushIssue("ACCEPTED_PURCHASE_ASSUMPTIONS_LOST", "Accepted purchase assumptions truth must reach the model.", "fatal_core", "model.sourceTruth.accepted.purchaseAssumptionsPresent");
  }
  if (acceptedCurrentDebtPresent && !currentDebt) {
    pushIssue("ACCEPTED_CURRENT_DEBT_LOST", "Accepted current debt truth must reach the model.", "fatal_core", "model.sourceTruth.accepted.currentDebtPresent");
  }

  if (appraisal) {
    const label = normalizeText(appraisal.visibleLabel || appraisal.roleLabel || appraisal.canonicalLabel);
    if (!label.includes("appraisal") && !label.includes("valuation")) {
      pushIssue("APPRAISAL_ROLE_MUTATED", "Appraisal role must remain appraisal / valuation context.", "critical", "model.supportSourcesByRole.appraisal_context");
    }
    if (label.includes("current debt") || label.includes("purchase assumptions")) {
      pushIssue("APPRAISAL_ROLE_CONTAMINATED", "Appraisal context must not become debt or purchase assumptions context.", "critical", "model.supportSourcesByRole.appraisal_context");
    }
  }

  if (renovation) {
    const label = normalizeText(renovation.visibleLabel || renovation.roleLabel || renovation.canonicalLabel);
    if (!label.includes("renovation") && !label.includes("capex")) {
      pushIssue("RENOVATION_ROLE_MUTATED", "Renovation role must remain renovation / CapEx context.", "critical", "model.supportSourcesByRole.structured_renovation_capex_plan");
    }
  }

  if (marketSurvey) {
    const label = normalizeText(marketSurvey.visibleLabel || marketSurvey.roleLabel || marketSurvey.canonicalLabel);
    if (!label.includes("market survey") && !label.includes("market rent survey")) {
      pushIssue("MARKET_SURVEY_ROLE_MUTATED", "Market survey role must remain market survey context.", "critical", "model.supportSourcesByRole.market_survey_context");
    }
  }

  if (environmental) {
    const label = normalizeText(environmental.visibleLabel || environmental.roleLabel || environmental.canonicalLabel);
    if (!label.includes("environmental") && !label.includes("phase i")) {
      pushIssue("ENVIRONMENTAL_ROLE_MUTATED", "Environmental role must remain environmental / Phase I ESA context.", "critical", "model.supportSourcesByRole.environmental_context");
    }
  }

  if (model.valueSemantics?.appraisal) {
    const appraisalLabels = model.valueSemantics.appraisal;
    if (normalizeText(appraisalLabels.stabilizedCapRateLabel).includes("interest rate")) {
      pushIssue("APPRAISAL_CAP_RATE_CONFLATION", "Appraisal stabilized cap rate must not be labeled as interest rate.", "critical", "model.valueSemantics.appraisal.stabilizedCapRateLabel");
    }
    if (normalizeText(appraisalLabels.stabilizedNOILabel).includes("t12")) {
      pushIssue("APPRAISAL_NOI_CONFLATION", "Appraisal stabilized NOI must not be labeled as T12 NOI.", "critical", "model.valueSemantics.appraisal.stabilizedNOILabel");
    }
  }

  if (model.supportSourceCounts && Number.isFinite(Number(model.supportSourceCounts.uniqueUploadedFileCount))) {
    const uniqueCount = Number(model.supportSourceCounts.uniqueUploadedFileCount);
    if (uniqueCount !== supportSources.length) {
      pushIssue("SUPPORT_DOC_DEDUP_MISMATCH", "supportSources must be deduped from unique uploaded file identity.", "critical", "model.supportSourceCounts.uniqueUploadedFileCount");
    }
  }

  if (purchaseAssumptions && !supportSourcesByRole.purchase_assumptions) {
    pushIssue("PURCHASE_ASSUMPTIONS_FALSE_MISSING", "Model cannot claim purchase assumptions are missing when they exist.", "critical", "model.supportSourcesByRole.purchase_assumptions");
  }

  if (currentDebt && !supportSourcesByRole.current_debt_context) {
    pushIssue("CURRENT_DEBT_FALSE_MISSING", "Model cannot claim current debt is not display-ready when it exists.", "critical", "model.supportSourcesByRole.current_debt_context");
  }

  return { ok: issues.length === 0, issues };
}

function normalizeHtmlText(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&(?:mdash|ndash);|&#(?:8211|8212);|&#x(?:2013|2014);/gi, " - ")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function containsText(haystack, needle) {
  return normalizeText(haystack).includes(normalizeText(needle));
}

function normalizeCoreSourceLabelForComparison(value) {
  return normalizeText(value).replace(/\bcore quantitative source\s*[-:/]\s*/g, "core quantitative source ");
}

function containsCoreSourceLabel(haystack, needle) {
  return normalizeCoreSourceLabelForComparison(haystack).includes(
    normalizeCoreSourceLabelForComparison(needle)
  );
}

function validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, model) {
  const issues = [];
  const normalizedHtml = normalizeHtmlText(html);
  const htmlText = normalizeText(normalizedHtml);
  const pushIssue = (code, message, severity = "critical", path = "html") => {
    issues.push({ code, message, severity, path });
  };

  if (!isPlainObject(model)) {
    pushIssue("MODEL_NOT_OBJECT", "Customer surface model is required.");
    return { ok: false, issues, normalizedHtml };
  }

  if (model.identity?.reportTitle && !containsText(htmlText, model.identity.reportTitle)) {
    pushIssue("HTML_REPORT_TITLE_MISSING", "Report title is missing from customer HTML.", "critical", "html.title");
  }

  const expected = expectedSurfaceValuesFromModel(model);
  const canonicalFinancialIntelligence = isCanonicalInstitutionalFinancialIntelligence(model?.financialIntelligence)
    ? model.financialIntelligence
    : null;
  const dscrAuthorized = canonicalFinancialIntelligence?.customerSections?.debtServiceCoverage?.displayReady === true;
  const acceptedPurchaseAssumptionsPresent = Boolean(model?.sourceTruth?.accepted?.purchaseAssumptionsPresent);
  const acceptedCurrentDebtPresent = Boolean(model?.sourceTruth?.accepted?.currentDebtPresent);
  if (acceptedPurchaseAssumptionsPresent && /no purchase assumptions uploaded|purchase assumptions provided\s+no/i.test(htmlText)) {
    pushIssue("HTML_PURCHASE_ASSUMPTIONS_FALSE_MISSING", "Accepted purchase assumptions truth cannot be rendered as missing.", "critical", "html.purchaseAssumptions");
  }
  if (
    acceptedCurrentDebtPresent &&
    /no (?:verified )?current debt(?: document| context)?|current debt maturity\s+(?:is\s+)?not available|current debt (?:document|context|balance|terms|service)\s+(?:is\s+)?not available/i.test(htmlText)
  ) {
    pushIssue("HTML_CURRENT_DEBT_FALSE_MISSING", "Accepted current debt truth cannot be rendered as missing.", "critical", "html.currentDebtContext");
  }
  const labelChecks = [
    {
      label: expected.coreT12Label,
      codeSuffix: "core_t12_label",
      shouldValidate: true,
    },
    {
      label: expected.coreRentRollLabel,
      codeSuffix: "core_rent_roll_label",
      shouldValidate: true,
    },
    {
      label: expected.acquisitionRequestLabel,
      codeSuffix: "acquisition_request_label",
      shouldValidate: Boolean(model.sections?.acquisitionRequestContext?.factAvailability?.sourceBacked) || model.sections?.acquisitionRequestContext?.status === "required" || model.sections?.acquisitionRequestContext?.status === "required_if_source_present",
    },
    {
      label: expected.currentDebtLabel,
      codeSuffix: "current_debt_label",
      shouldValidate: Boolean(model.sections?.currentDebtContext?.factAvailability?.sourceBacked) || model.sections?.currentDebtContext?.status === "required" || model.sections?.currentDebtContext?.status === "required_if_source_present",
    },
    {
      label: expected.proposedFinancingLabel,
      codeSuffix: "proposed_financing_label",
      shouldValidate: Boolean(model.sections?.proposedFinancingContext?.factAvailability?.sourceBacked) || model.sections?.proposedFinancingContext?.status === "required" || model.sections?.proposedFinancingContext?.status === "required_if_source_present",
    },
    {
      label: expected.appraisalLabel,
      codeSuffix: "appraisal_label",
      shouldValidate: Boolean(model.sections?.appraisalContext?.factAvailability?.sourceBacked) || model.sections?.appraisalContext?.status === "required" || model.sections?.appraisalContext?.status === "required_if_source_present",
    },
    {
      label: expected.renovationLabel,
      codeSuffix: "renovation_label",
      shouldValidate: Boolean(model.sections?.renovationContext?.factAvailability?.sourceBacked) || model.sections?.renovationContext?.status === "required" || model.sections?.renovationContext?.status === "required_if_source_present",
    },
    {
      label: expected.marketSurveyLabel,
      codeSuffix: "market_survey_label",
      shouldValidate: Boolean(model.sections?.marketSurveyContext?.factAvailability?.sourceBacked) || model.sections?.marketSurveyContext?.status === "required" || model.sections?.marketSurveyContext?.status === "required_if_source_present",
    },
    {
      label: expected.environmentalLabel,
      codeSuffix: "environmental_label",
      shouldValidate: Boolean(model.sections?.environmentalContext?.factAvailability?.sourceBacked) || model.sections?.environmentalContext?.status === "required" || model.sections?.environmentalContext?.status === "required_if_source_present",
    },
    {
      label: expected.debtCapacityLabel,
      codeSuffix: "debt_capacity_label",
      shouldValidate: model.sections?.debtCapacityAndCoverage?.factAvailability?.sectionDisplayReady === true,
    },
  ];

  for (const { label, codeSuffix, shouldValidate } of labelChecks) {
    const isCoreSourceLabel = codeSuffix === "core_t12_label" || codeSuffix === "core_rent_roll_label";
  const labelPresent = isCoreSourceLabel
    ? containsCoreSourceLabel(htmlText, label)
    : containsText(htmlText, label);
  if (shouldValidate && label && !labelPresent) {
      pushIssue(`HTML_${codeSuffix.toUpperCase()}_MISSING`, `${label} is missing from customer HTML.`, "critical", `html.${codeSuffix}`);
    }
  }

  const currentDebtFacts = model.sections?.currentDebtContext?.facts || {};
  const currentDebtShouldValidate = Boolean(model.sections?.currentDebtContext?.factAvailability?.sourceBacked) || model.sections?.currentDebtContext?.status === "required" || model.sections?.currentDebtContext?.status === "required_if_source_present";
  if (currentDebtShouldValidate && expected.currentDebt.balance && !containsText(htmlText, expected.currentDebt.balance)) {
    pushIssue("HTML_CURRENT_DEBT_BALANCE_MISSING", "Current debt balance is missing from customer HTML.", "critical", "html.currentDebtContext");
  }
  if (currentDebtShouldValidate && expected.currentDebt.rate && !containsText(htmlText, expected.currentDebt.rate)) {
    pushIssue("HTML_CURRENT_DEBT_RATE_MISSING", "Current debt rate is missing from customer HTML.", "critical", "html.currentDebtContext");
  }
  if (currentDebtShouldValidate && expected.currentDebt.amortization && !containsText(htmlText, expected.currentDebt.amortization)) {
    pushIssue("HTML_CURRENT_DEBT_AMORTIZATION_MISSING", "Current debt amortization is missing from customer HTML.", "critical", "html.currentDebtContext");
  }
  if (currentDebtShouldValidate && expected.currentDebt.payment && !containsText(htmlText, expected.currentDebt.payment)) {
    pushIssue("HTML_CURRENT_DEBT_PAYMENT_MISSING", "Current debt monthly payment is missing from customer HTML.", "critical", "html.currentDebtContext");
  }
  if (currentDebtShouldValidate && expected.currentDebt.maturityDate && !containsText(htmlText, expected.currentDebt.maturityDate)) {
    pushIssue("HTML_CURRENT_DEBT_MATURITY_MISSING", "Current debt maturity date is missing from customer HTML.", "critical", "html.currentDebtContext");
  }

  const acquisitionFacts = model.sections?.acquisitionRequestContext?.facts || {};
  const acquisitionShouldValidate = Boolean(model.sections?.acquisitionRequestContext?.factAvailability?.sourceBacked) || model.sections?.acquisitionRequestContext?.status === "required" || model.sections?.acquisitionRequestContext?.status === "required_if_source_present";
  if (acquisitionShouldValidate && expected.proposedFinancing.loan && !containsText(htmlText, expected.proposedFinancing.loan)) {
    pushIssue("HTML_PROPOSED_LOAN_MISSING", "Proposed acquisition loan is missing from customer HTML.", "critical", "html.acquisitionRequestContext");
  }
  if (acquisitionShouldValidate && expected.proposedFinancing.ltv && !containsText(htmlText, expected.proposedFinancing.ltv)) {
    pushIssue("HTML_PROPOSED_LTV_MISSING", "Proposed LTV is missing from customer HTML.", "critical", "html.acquisitionRequestContext");
  }
  if (acquisitionShouldValidate && expected.proposedFinancing.rate && !containsText(htmlText, expected.proposedFinancing.rate)) {
    pushIssue("HTML_PROPOSED_RATE_MISSING", "Proposed rate is missing from customer HTML.", "critical", "html.acquisitionRequestContext");
  }
  if (acquisitionShouldValidate && expected.proposedFinancing.amortization && !containsText(htmlText, expected.proposedFinancing.amortization)) {
    pushIssue("HTML_PROPOSED_AMORTIZATION_MISSING", "Proposed amortization is missing from customer HTML.", "critical", "html.acquisitionRequestContext");
  }
  if (acquisitionShouldValidate && expected.proposedFinancing.lenderFee && !containsText(htmlText, expected.proposedFinancing.lenderFee)) {
    pushIssue("HTML_LENDER_FEE_MISSING", "Lender fee is missing from customer HTML.", "critical", "html.acquisitionRequestContext");
  }

  const unitMixFacts = model.sections?.unitMix?.facts || {};
  const unitMixShouldValidate = Boolean(model.sections?.unitMix?.factAvailability?.sourceBacked) || model.sections?.unitMix?.status === "required" || model.sections?.unitMix?.status === "required_if_source_present";
  if (unitMixShouldValidate && Array.isArray(expected.unitMixRows) && expected.unitMixRows.length > 0) {
    for (const row of expected.unitMixRows) {
      const rowLabel = String(row?.label || "").trim();
      if (rowLabel && !containsText(htmlText, rowLabel)) {
        pushIssue("HTML_UNIT_MIX_LABEL_MISSING", `${rowLabel} is missing from customer HTML.`, "critical", "html.unitMix");
      }
      if (row?.count && !containsText(htmlText, row.count)) {
        pushIssue("HTML_UNIT_MIX_COUNT_MISSING", `${row.count} is missing from customer HTML.`, "critical", "html.unitMix");
      }
      if (row?.currentRent && !containsText(htmlText, row.currentRent)) {
        pushIssue("HTML_UNIT_MIX_CURRENT_RENT_MISSING", `${row.currentRent} is missing from customer HTML.`, "critical", "html.unitMix");
      }
      if (row?.marketRent && !containsText(htmlText, row.marketRent)) {
        pushIssue("HTML_UNIT_MIX_MARKET_RENT_MISSING", `${row.marketRent} is missing from customer HTML.`, "critical", "html.unitMix");
      }
      if (row?.spread && !containsText(htmlText, row.spread)) {
        pushIssue("HTML_UNIT_MIX_SPREAD_MISSING", `${row.spread} is missing from customer HTML.`, "critical", "html.unitMix");
      }
    }
  }

  const t12Facts = model.sections?.operatingStatementTTMSummary?.facts || {};
  const t12ShouldValidate = Boolean(model.sections?.operatingStatementTTMSummary?.factAvailability?.sourceBacked) || model.sections?.operatingStatementTTMSummary?.status === "required" || model.sections?.operatingStatementTTMSummary?.status === "required_if_source_present";
  if (t12ShouldValidate && Array.isArray(expected.t12ExpenseLines) && expected.t12ExpenseLines.length > 0) {
    for (const line of expected.t12ExpenseLines) {
      const label = String(line?.label || "").trim();
      const amount = String(line?.amount || "").trim();
      if (label && !containsText(htmlText, label)) {
        pushIssue("HTML_T12_EXPENSE_LABEL_MISSING", `${label} is missing from customer HTML.`, "critical", "html.operatingStatementTTMSummary");
      }
      if (amount && !containsText(htmlText, amount)) {
        pushIssue("HTML_T12_EXPENSE_AMOUNT_MISSING", `${amount} is missing from customer HTML.`, "critical", "html.operatingStatementTTMSummary");
      }
    }
  }

  const appraisalShouldValidate = model.sections?.appraisalContext?.factAvailability?.sourceBacked === true;
  for (const [field, value] of Object.entries(expected.appraisal || {})) {
    if (appraisalShouldValidate && value && !containsText(htmlText, value)) {
      pushIssue("HTML_APPRAISAL_FACT_MISSING", `${field} is missing from customer HTML.`, "critical", `html.appraisalContext.${field}`);
    }
  }

  const renovationShouldValidate = model.sections?.renovationContext?.factAvailability?.sourceBacked === true;
  if (renovationShouldValidate && expected.renovation?.totalBudget && !containsText(htmlText, expected.renovation.totalBudget)) {
    pushIssue("HTML_RENOVATION_TOTAL_MISSING", "Accepted renovation total is missing from customer HTML.", "critical", "html.renovationContext.totalBudget");
  }
  if (renovationShouldValidate) {
    for (const row of expected.renovation?.planRows || []) {
      for (const [field, value] of Object.entries(row)) {
        if (value && !containsText(htmlText, value)) {
          pushIssue("HTML_RENOVATION_ROW_FACT_MISSING", `${field} is missing from customer HTML.`, "critical", `html.renovationContext.${field}`);
        }
      }
    }
  }

  const marketSurveyShouldValidate = model.sections?.marketSurveyContext?.factAvailability?.sourceBacked === true;
  if (marketSurveyShouldValidate) {
    for (const range of expected.marketSurvey?.ranges || []) {
      for (const [field, value] of Object.entries(range)) {
        if (value && !containsText(htmlText, value)) {
          pushIssue("HTML_MARKET_RANGE_FACT_MISSING", `${field} is missing from customer HTML.`, "critical", `html.marketSurveyContext.${field}`);
        }
      }
    }
  }

  const environmentalShouldValidate = model.sections?.environmentalContext?.factAvailability?.sourceBacked === true;
  if (environmentalShouldValidate && expected.environmental?.status && !containsText(htmlText, expected.environmental.status)) {
    pushIssue("HTML_ENVIRONMENTAL_STATUS_MISSING", "Accepted Phase I status is missing from customer HTML.", "critical", "html.environmentalContext.phase_i_status");
  }

  const debtCapacityShouldValidate = model.sections?.debtCapacityAndCoverage?.factAvailability?.sectionDisplayReady === true;
  if (debtCapacityShouldValidate) {
    for (const [field, value] of Object.entries(expected.debtCapacity || {})) {
      if (value && !containsText(htmlText, value)) {
        pushIssue("HTML_DEBT_CAPACITY_FACT_MISSING", `${field} is missing from customer HTML.`, "critical", `html.debtCapacity.${field}`);
      }
    }
  }

  if (containsText(htmlText, "No parsed unit mix rows were available from the canonical rent roll evidence.")) {
    pushIssue("HTML_FALSE_UNIT_MIX_FALLBACK", "False missing unit mix fallback must not appear when structured unit mix exists.", "critical", "html.unitMix");
  }


  const financialHeadings = {
    debtServiceCoverage: "Debt Service and Coverage",
    debtTermAnalysis: "Debt Term and Maturity Analysis",
    coreReconciliation: "Core Source Reconciliation",
    capitalPlanAnalysis: "Capital Plan and Reserve Position",
  };
  for (const [sectionKey, heading] of Object.entries(financialHeadings)) {
    if (
      canonicalFinancialIntelligence?.customerSections?.[sectionKey]?.displayReady === true &&
      !containsText(htmlText, heading)
    ) {
      pushIssue(
        "HTML_FINANCIAL_INTELLIGENCE_SECTION_MISSING",
        `${heading} is missing from customer HTML.`,
        "critical",
        `html.${sectionKey}`
      );
    }
  }
  if (dscrAuthorized) {
    for (const [roleKey, roleFacts] of Object.entries(model?.sections?.debtServiceCoverage?.facts || {})) {
      const roleLabel = roleKey === "currentDebt" ? "Current Debt DSCR" : "Proposed Acquisition DSCR";
      const ratio = normalizeMoney(roleFacts?.dscr);
      if (Number.isFinite(ratio) && !containsText(htmlText, `${ratio.toFixed(2)}x`)) {
        pushIssue(
          "HTML_CANONICAL_DSCR_VALUE_MISSING",
          `${roleLabel} is missing its canonical value.`,
          "critical",
          `html.debtServiceCoverage.${roleKey}`
        );
      }
    }
  }

  if (
    containsText(htmlText, "Boss Contract") ||
    containsText(htmlText, "V2 Canonical Package") ||
    containsText(htmlText, "Source Authority") ||
    containsText(htmlText, "canonical source package") ||
    containsText(htmlText, "V2 projection") ||
    containsText(htmlText, "assertion code names") ||
    containsText(htmlText, "stack trace")
  ) {
    pushIssue("HTML_INTERNAL_LANGUAGE_LEAK", "Internal implementation language must not appear in customer HTML.", "critical", "html.internal");
  }

  if (
    (!dscrAuthorized && containsText(htmlText, "DSCR")) ||
    containsText(htmlText, "refi") ||
    containsText(htmlText, "refinance") ||
    containsText(htmlText, "DCF") ||
    containsText(htmlText, "waterfall") ||
    containsText(htmlText, "equity return") ||
    containsText(htmlText, "deal score") ||
    containsText(htmlText, "final recommendation") ||
    /\bBUY\b/i.test(normalizedHtml) ||
    /\bSELL\b/i.test(normalizedHtml) ||
    /\bHOLD\b/i.test(normalizedHtml.replace(/\bLIGHT VALUE-ADD HOLD\b/gi, "")) ||
    containsText(htmlText, "loan approval") ||
    containsText(htmlText, "lender commitment")
  ) {
    pushIssue("HTML_FORBIDDEN_SURFACES_PRESENT", "Forbidden underwriting surfaces must not appear in customer HTML.", "fatal_core", "html.forbiddenSurfaces");
  }

  return { ok: issues.length === 0, issues, normalizedHtml };
}

function summarizeAcquisitionMemoV2CustomerSurfaceModel(model) {
  const supportSources = Array.isArray(model?.supportSources) ? model.supportSources : [];
  const sections = isPlainObject(model?.sections) ? model.sections : {};
  const requiredSections = Object.values(sections).filter((section) => section?.status === "required").length;
  return {
    modelVersion: model?.modelVersion || null,
    reportMode: model?.reportMode || null,
    propertyName: model?.identity?.propertyName || null,
    reportTitle: model?.identity?.reportTitle || null,
    coreSourceCount: Number(Boolean(model?.coreSources?.coreT12)) + Number(Boolean(model?.coreSources?.coreRentRoll)),
    supportDocCount: supportSources.length,
    uniqueSupportDocCount: model?.supportSourceCounts?.uniqueUploadedFileCount ?? supportSources.length,
    requiredSectionCount: requiredSections,
    supportRoles: Array.from(new Set(supportSources.map((doc) => doc?.canonicalRole).filter(Boolean))).sort(),
    sectionStatuses: clone(model?.sectionStatuses || {}),
  };
}

export {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
  summarizeAcquisitionMemoV2CustomerSurfaceModel,
};
