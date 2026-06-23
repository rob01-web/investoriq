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
  "Review / Source Reconciliation Disclosure",
  "Review / Insufficient Core Support",
  "Review / Debt Coverage Constraint",
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
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCapRatio(value) {
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
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function formatPercentForSurface(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  const rounded = Math.round(pct * 100) / 100;
  const text = Number.isInteger(rounded) ? rounded.toFixed(1) : rounded.toFixed(2);
  return `${text.replace(/\.00$/, ".0").replace(/(\.\d)0$/, "$1")}%`;
}

function formatYearsForSurface(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `${Math.round(n)} years`;
}

function expectedSurfaceValuesFromModel(model) {
  const currentDebtFacts = model?.sections?.currentDebtContext?.facts || {};
  const acquisitionFacts = model?.sections?.acquisitionRequestContext?.facts || {};
  const unitMixFacts = model?.sections?.unitMix?.facts || {};
  const t12Facts = model?.sections?.operatingStatementTTMSummary?.facts || {};
  const appFacts = model?.sections?.appraisalContext?.facts || {};
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
    currentDebt: {
      balance: formatMoneyForSurface(currentDebtFacts.current_outstanding_balance),
      rate: formatPercentForSurface(currentDebtFacts.interest_rate),
      amortization: formatYearsForSurface(currentDebtFacts.amortization_remaining_years),
      payment: formatMoneyForSurface(currentDebtFacts.monthly_payment),
      maturityDate: String(currentDebtFacts.maturity_date || "").trim(),
    },
    proposedFinancing: {
      loan: formatMoneyForSurface(acquisitionFacts.proposed_loan_amount),
      ltv: formatPercentForSurface(acquisitionFacts.ltv),
      rate: formatPercentForSurface(acquisitionFacts.interest_rate),
      amortization: formatYearsForSurface(acquisitionFacts.amortization_years),
      lenderFee: formatPercentForSurface(acquisitionFacts.lender_fee_percent),
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
  };
}

function uniqueSupportDocKey(doc) {
  const fileId = String(doc?.fileId || doc?.file_id || doc?.id || doc?.payload?.source_file_id || "").trim();
  const originalFilename = String(doc?.originalFilename || doc?.original_filename || doc?.payload?.source_original_filename || "").trim();
  if (fileId) return `fileId:${normalizeText(fileId)}`;
  if (originalFilename) return `filename:${normalizeText(originalFilename)}`;
  return `role:${normalizeText(doc?.canonicalRole || doc?.role || doc?.visibleLabel || "")}`;
}

function normalizeSupportDoc(doc, sourceKind = "support_doc") {
  const source = isPlainObject(doc) ? doc : null;
  if (!source) return null;

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
  const canonicalRole = String(
    source.canonicalRole ||
      source.role ||
      source.semantic_doc_role ||
      source.doc_type ||
      source.sourceRole ||
      ""
  ).trim();
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
    roleLabel: String(source.roleLabel || source.role_label || source.canonicalLabel || source.canonical_label || "").trim(),
    canonicalLabel: String(source.canonicalLabel || source.canonical_label || source.roleLabel || source.role_label || "").trim(),
    treatment: String(source.treatment || source.documentTreatment || source.document_treatment || "").trim(),
    use: String(source.use || source.documentUse || source.document_use || "").trim(),
    sourceKind: String(source.sourceKind || source.kind || sourceKind || "support_doc").trim(),
    authorityBasis: String(source.authorityBasis || source.authority_basis || "").trim(),
    allowedUses: Array.isArray(source.allowedUses) ? source.allowedUses.slice() : Array.isArray(source.allowed_uses) ? source.allowed_uses.slice() : [],
    forbiddenUses: Array.isArray(source.forbiddenUses) ? source.forbiddenUses.slice() : Array.isArray(source.forbidden_uses) ? source.forbidden_uses.slice() : [],
    extractedFacts,
    sourceEvidence,
    visibleLabel: String(source.visibleLabel || source.roleLabel || source.canonicalLabel || source.canonicalRole || originalFilename || "").trim(),
  };
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

  const seen = new Set();
  const normalized = [];

  for (const bucket of candidates) {
    for (const doc of bucket) {
      const normalizedDoc = normalizeSupportDoc(doc);
      if (!normalizedDoc) continue;
      const keys = [];
      const fileId = String(normalizedDoc.fileId || "").trim();
      const originalFilename = String(normalizedDoc.originalFilename || "").trim();
      if (fileId) keys.push(`fileId:${normalizeText(fileId)}`);
      if (originalFilename) keys.push(`filename:${normalizeText(originalFilename)}`);
      if (keys.length === 0) keys.push(uniqueSupportDocKey(normalizedDoc));
      if (keys.some((key) => seen.has(key))) continue;
      for (const key of keys) seen.add(key);
      normalized.push(normalizedDoc);
    }
  }

  return normalized;
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
  return {
    fileId: String(source.fileId || source.file_id || source.id || "").trim(),
    originalFilename: String(source.originalFilename || source.original_filename || source.payload?.source_original_filename || "").trim(),
    canonicalRole: String(source.canonicalRole || source.role || fallbackRole || "").trim(),
    canonicalLabel: String(source.canonicalLabel || source.canonical_label || fallbackLabel || "").trim(),
    sourceKind: String(source.sourceKind || fallbackRole || "").trim(),
    extractedFacts,
    visibleLabel: String(source.visibleLabel || source.roleLabel || source.canonicalLabel || fallbackLabel || fallbackRole || "").trim(),
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
    const hasSourceBackedFacts =
      Number.isFinite(normalizeMoney(proposed.purchase_price)) &&
      Number.isFinite(normalizeMoney(proposed.proposed_loan_amount));
    if (!purchaseAssumptions || !hasSourceBackedFacts) {
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
        missing: Object.entries({
          purchase_price: proposed.purchase_price,
          noi_basis: proposed.noi_basis,
          going_in_cap_rate: proposed.going_in_cap_rate,
          proposed_loan_amount: proposed.proposed_loan_amount,
          ltv: proposed.ltv,
          interest_rate: proposed.interest_rate,
          amortization_years: proposed.amortization_years,
          lender_fee_percent: proposed.lender_fee_percent,
        })
          .filter(([, value]) => !(Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value))))
          .map(([keyName]) => keyName),
        sourceBacked: true,
      },
      sourceDoc: purchaseAssumptions,
    };
  }

  if (key === "currentDebtContext") {
    const currentDebt = supportDocsByRole.current_debt_context || null;
    const currentDebtFacts = currentDebt?.extractedFacts || {};
    const hasPositiveEvidence =
      Number.isFinite(normalizeMoney(currentDebtFacts.current_outstanding_balance)) &&
      Number.isFinite(normalizeCapRatio(currentDebtFacts.interest_rate)) &&
      Number.isFinite(normalizeMoney(currentDebtFacts.amortization_remaining_years)) &&
      Number.isFinite(normalizeMoney(currentDebtFacts.monthly_payment)) &&
      String(currentDebtFacts.maturity_date || "").trim().length > 0;
    if (!currentDebt || !hasPositiveEvidence) {
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
        missing: Object.entries({
          current_outstanding_balance: currentDebtFacts.current_outstanding_balance,
          interest_rate: currentDebtFacts.interest_rate,
          amortization_remaining_years: currentDebtFacts.amortization_remaining_years,
          monthly_payment: currentDebtFacts.monthly_payment,
          maturity_date: currentDebtFacts.maturity_date,
        })
          .filter(([, value]) => !(Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)) || String(value || "").trim().length > 0))
          .map(([keyName]) => keyName),
        sourceBacked: true,
      },
      sourceDoc: currentDebt,
    };
  }

  if (key === "proposedFinancingContext") {
    const purchaseAssumptions = supportDocsByRole.purchase_assumptions || null;
    const proposed = purchaseAssumptions?.extractedFacts || {};
    const hasSourceBackedFacts =
      Number.isFinite(normalizeMoney(proposed.proposed_loan_amount)) &&
      Number.isFinite(normalizeCapRatio(proposed.ltv)) &&
      Number.isFinite(normalizeCapRatio(proposed.interest_rate)) &&
      Number.isFinite(normalizeMoney(proposed.amortization_years)) &&
      Number.isFinite(normalizeCapRatio(proposed.lender_fee_percent));
    if (!purchaseAssumptions || !hasSourceBackedFacts) {
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
        missing: Object.entries({
          proposed_loan_amount: proposed.proposed_loan_amount,
          ltv: proposed.ltv,
          interest_rate: proposed.interest_rate,
          amortization_years: proposed.amortization_years,
          lender_fee_percent: proposed.lender_fee_percent,
        })
          .filter(([, value]) => !(Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value))))
          .map(([keyName]) => keyName),
        sourceBacked: true,
      },
      sourceDoc: purchaseAssumptions,
    };
  }

  if (key === "appraisalContext") {
    const appraisal = supportDocsByRole.appraisal_context || null;
    const facts = appraisal?.extractedFacts || {};
    const hasSourceBackedFacts =
      Number.isFinite(normalizeMoney(facts.appraisal_value)) ||
      Number.isFinite(normalizeCapRatio(facts.stabilized_cap_rate)) ||
      Number.isFinite(normalizeMoney(facts.stabilized_noi));
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
          required: ["appraisal_value", "stabilized_cap_rate", "stabilized_noi"],
          available: [],
          missing: ["appraisal_value", "stabilized_cap_rate", "stabilized_noi"],
          sourceBacked: false,
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
      facts: {
        appraisal_value: normalizeMoney(facts.appraisal_value),
        stabilized_cap_rate: normalizeCapRatio(facts.stabilized_cap_rate),
        stabilized_noi: normalizeMoney(facts.stabilized_noi),
      },
      boundaries: {
        appraisalIsContextOnly: true,
        stabilizedCapRateIsNotInterestRate: true,
        stabilizedNOIIsNotT12NOI: true,
      },
      factAvailability: {
        required: ["appraisal_value", "stabilized_cap_rate", "stabilized_noi"],
        available: Object.entries({
          appraisal_value: facts.appraisal_value,
          stabilized_cap_rate: facts.stabilized_cap_rate,
          stabilized_noi: facts.stabilized_noi,
        })
          .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value)))
          .map(([keyName]) => keyName),
        missing: Object.entries({
          appraisal_value: facts.appraisal_value,
          stabilized_cap_rate: facts.stabilized_cap_rate,
          stabilized_noi: facts.stabilized_noi,
        })
          .filter(([, value]) => !(Number.isFinite(normalizeMoney(value)) || Number.isFinite(normalizeCapRatio(value))))
          .map(([keyName]) => keyName),
        sourceBacked: true,
      },
      sourceDoc: appraisal,
    };
  }

  if (key === "renovationContext") {
    const renovation = supportDocsByRole.structured_renovation_capex_plan || supportDocsByRole.renovation_capex_budget_context || null;
    const facts = renovation?.extractedFacts || {};
    const hasSourceBackedFacts =
      Number.isFinite(normalizeMoney(facts.total_renovation_budget)) ||
      Number.isFinite(normalizeMoney(facts.rent_lift));
    if (!renovation || !hasSourceBackedFacts) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: renovation?.canonicalRole || "structured_renovation_capex_plan",
        visibleLabel: "Structured Renovation / CapEx Plan",
        facts: {
          total_renovation_budget: null,
          rent_lift: null,
        },
        factAvailability: {
          required: ["total_renovation_budget"],
          available: [],
          missing: ["total_renovation_budget"],
          sourceBacked: false,
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
      facts: {
        total_renovation_budget: normalizeMoney(facts.total_renovation_budget),
        rent_lift: normalizeMoney(facts.rent_lift),
      },
      boundaries: {
        renovationIsContextOnly: true,
        noRoiOrPaybackModeling: true,
      },
      factAvailability: {
        required: ["total_renovation_budget"],
        available: Object.entries({
          total_renovation_budget: facts.total_renovation_budget,
          rent_lift: facts.rent_lift,
        })
          .filter(([, value]) => Number.isFinite(normalizeMoney(value)))
          .map(([keyName]) => keyName),
        missing: Object.entries({
          total_renovation_budget: facts.total_renovation_budget,
          rent_lift: facts.rent_lift,
        })
          .filter(([, value]) => !Number.isFinite(normalizeMoney(value)))
          .map(([keyName]) => keyName),
        sourceBacked: true,
      },
      sourceDoc: renovation,
    };
  }

  if (key === "marketSurveyContext") {
    const marketSurvey = supportDocsByRole.market_survey_context || null;
    const facts = marketSurvey?.extractedFacts || {};
    const hasSourceBackedFacts =
      Number.isFinite(normalizeMoney(facts.market_rent)) ||
      Array.isArray(facts.rent_comp);
    if (!marketSurvey || !hasSourceBackedFacts) {
      return {
        ...section,
        status: "collapsed",
        sourceRole: "market_survey_context",
        visibleLabel: "Market Survey Context",
        facts: {
          market_rent: null,
          rent_comp: [],
        },
        factAvailability: {
          required: [],
          available: [],
          missing: [],
          sourceBacked: false,
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
        market_rent: normalizeMoney(facts.market_rent),
        rent_comp: clone(facts.rent_comp || []),
      },
      boundaries: {
        marketSurveyIsContextOnly: true,
        noMarketSurveyOverride: true,
      },
      factAvailability: {
        required: [],
        available: Object.entries({
          market_rent: facts.market_rent,
          rent_comp: facts.rent_comp,
        })
          .filter(([, value]) => Number.isFinite(normalizeMoney(value)) || Array.isArray(value))
          .map(([keyName]) => keyName),
        missing: [],
        sourceBacked: true,
      },
      sourceDoc: marketSurvey,
    };
  }

  if (key === "environmentalContext") {
    const environmental = supportDocsByRole.environmental_context || null;
    const facts = environmental?.extractedFacts || {};
    const hasSourceBackedFacts = String(facts.phase_i_status || facts.esa_status || "").trim().length > 0;
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
          required: [],
          available: [],
          missing: [],
          sourceBacked: false,
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
        phase_i_status: String(facts.phase_i_status || facts.esa_status || "").trim() || null,
      },
      boundaries: {
        environmentalIsContextOnly: true,
      },
      factAvailability: {
        required: [],
        available: Object.entries({
          phase_i_status: facts.phase_i_status || facts.esa_status,
        })
          .filter(([, value]) => String(value || "").trim().length > 0)
          .map(([keyName]) => keyName),
        missing: [],
        sourceBacked: true,
      },
      sourceDoc: environmental,
    };
  }

  if (key === "unitMix") {
    const rentRoll = coreSources.coreRentRoll;
    const facts = rentRoll?.extractedFacts || {};
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
      sourceDoc: rentRoll,
    };
  }

  if (key === "capRateValueIndication") {
    const rentRoll = coreSources.coreRentRoll;
    const facts = rentRoll?.extractedFacts || {};
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
      sourceDoc: rentRoll,
    };
  }

  if (key === "operatingStatementTTMSummary") {
    const t12 = coreSources.coreT12;
    const facts = t12?.extractedFacts || {};
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
  coreMetrics = null,
  propertyProfile = null,
  reportMeta = null,
  reportMode = null,
} = {}) {
  const supportSources = collectSupportDocs(canonicalSourcePackage, acquisitionMemoProjection, bossContract);
  const supportSourcesByRole = {
    __all: supportSources,
  };
  for (const doc of supportSources) {
    if (!doc?.canonicalRole) continue;
    if (!supportSourcesByRole[doc.canonicalRole]) supportSourcesByRole[doc.canonicalRole] = doc;
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
      "Review / Source Reconciliation Disclosure"
  ).trim();
  const reportTitle = String(reportMeta?.reportTitle || reportMeta?.report_title || `${propertyName || "Acquisition Memo"}`.trim()).trim();

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
  const breakEvenOccupancy = normalizeCapRatio(coreMetrics?.breakEvenOccupancy);
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

  const sectionMap = buildSectionMap(bossContract);
  const sections = {};
  for (const [key, section] of Object.entries(sectionMap)) {
    sections[key] = buildSectionRoleModel(section, supportSourcesByRole, coreSources, valueSemantics);
  }

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
    supportSourcesByRole,
    sections,
    sectionStatuses: Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, value.status])),
    sourceBackedFacts: {
      acquisitionRequestContext: sections.acquisitionRequestContext?.facts || {},
      currentDebtContext: sections.currentDebtContext?.facts || {},
      proposedFinancingContext: sections.proposedFinancingContext?.facts || {},
      appraisalContext: sections.appraisalContext?.facts || {},
      renovationContext: sections.renovationContext?.facts || {},
      marketSurveyContext: sections.marketSurveyContext?.facts || {},
      environmentalContext: sections.environmentalContext?.facts || {},
      unitMix: sections.unitMix?.facts || {},
      capRateValueIndication: sections.capRateValueIndication?.facts || {},
      operatingStatementTTMSummary: sections.operatingStatementTTMSummary?.facts || {},
      dataCoverageSourceLimitations: sections.dataCoverageSourceLimitations?.facts || {},
      documentTreatment: sections.documentTreatment?.facts || {},
    },
    valueSemantics,
    diagnostics: {
      coreGatePublishAllowed: Boolean(bossContract?.coreGate?.publishAllowed),
      supportDocCount: supportSources.length,
      hasPurchaseAssumptions: Boolean(supportSourcesByRole.purchase_assumptions),
      hasCurrentDebtContext: Boolean(supportSourcesByRole.current_debt_context),
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

  if (!Array.isArray(model.supportSources)) {
    pushIssue("MODEL_SUPPORT_SOURCES_MISSING", "supportSources must be an array.", "critical", "model.supportSources");
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
      marketSurveyContext: { mustHaveFacts: [] },
      environmentalContext: { mustHaveFacts: [] },
      unitMix: { mustHaveFacts: ["unit_mix", "units"] },
      capRateValueIndication: { mustHaveFacts: ["total_units", "going_in_cap_rate"] },
      operatingStatementTTMSummary: { mustHaveFacts: ["expense_lines", "net_operating_income"] },
      documentTreatment: { mustHaveFacts: ["support_doc_count"] },
      dataCoverageSourceLimitations: { mustHaveFacts: ["core_source_count"] },
      methodologyDataTransparency: { mustHaveFacts: ["method"] },
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
      if (shouldRender && isCoreSection && (!Array.isArray(section.sourceBindings) || section.sourceBindings.length === 0)) {
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
      if (shouldRender && isCoreSection && !section.factAvailability?.sourceBacked) {
        pushIssue("SECTION_NOT_SOURCE_BACKED", `${sectionKey} must be source-backed.`, "critical", `model.sections.${sectionKey}.factAvailability.sourceBacked`);
      }
      if (shouldRender && isCoreSection && Array.isArray(section.factAvailability?.missing) && section.factAvailability.missing.length > 0) {
        pushIssue("SECTION_MISSING_FACTS_WITHOUT_COLLAPSE", `${sectionKey} cannot be source-backed with missing facts.`, "fatal_core", `model.sections.${sectionKey}.factAvailability.missing`);
      }
    }
  }

  const supportSourcesByRole = model.supportSourcesByRole || {};
  const purchaseAssumptions = supportSourcesByRole.purchase_assumptions || null;
  const currentDebt = supportSourcesByRole.current_debt_context || null;
  const appraisal = supportSourcesByRole.appraisal_context || null;
  const renovation = supportSourcesByRole.structured_renovation_capex_plan || supportSourcesByRole.renovation_capex_budget_context || null;
  const marketSurvey = supportSourcesByRole.market_survey_context || null;
  const environmental = supportSourcesByRole.environmental_context || null;

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
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function containsText(haystack, needle) {
  return normalizeText(haystack).includes(normalizeText(needle));
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
  ];

  for (const { label, codeSuffix, shouldValidate } of labelChecks) {
    if (shouldValidate && label && !containsText(htmlText, label)) {
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

  if (containsText(htmlText, "No parsed unit mix rows were available from the canonical rent roll evidence.")) {
    pushIssue("HTML_FALSE_UNIT_MIX_FALLBACK", "False missing unit mix fallback must not appear when structured unit mix exists.", "critical", "html.unitMix");
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
    containsText(htmlText, "DSCR") ||
    containsText(htmlText, "refi") ||
    containsText(htmlText, "refinance") ||
    containsText(htmlText, "DCF") ||
    containsText(htmlText, "waterfall") ||
    containsText(htmlText, "equity return") ||
    containsText(htmlText, "deal score") ||
    containsText(htmlText, "final recommendation") ||
    containsText(htmlText, "BUY") ||
    containsText(htmlText, "SELL") ||
    containsText(htmlText, "HOLD") ||
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
