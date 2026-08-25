import {
  applySectionDisposition,
  DETAILED_LINEAGE_PLACEMENTS,
  SECTION_CLASSIFICATIONS,
  SECTION_DISPOSITIONS,
} from "./section-disposition-contract.js";

export const FULL_UNDERWRITING_TRANSACTION_DILIGENCE_VERSION =
  "full_underwriting_transaction_diligence_v1";

const STATUS = Object.freeze({
  DOCUMENTED: "documented",
  DOCUMENTED_WITH_LIMITATIONS: "documented_with_limitations",
  RECEIVED_NOT_DISPLAY_READY: "received_not_display_ready",
  NOT_PROVIDED: "not_provided",
});

const EVIDENCE = Object.freeze({
  SOURCE_BACKED: "source_backed",
  DETERMINISTIC_CALCULATED: "deterministic_calculated",
  THIRD_PARTY_CONTEXT: "third_party_context",
  MISSING_UNSUPPORTED: "missing_unsupported",
});

const ROLE_SPECS = Object.freeze([
  {
    key: "purchase_assumptions",
    label: "Purchase Assumptions / Proposed Financing",
    sectionKeys: ["acquisitionRequestContext", "proposedFinancingContext"],
    contextOnly: false,
    treatment: "Transaction assumptions; not existing debt",
    customerSourceLabel: "Purchase assumptions / proposed financing support",
  },
  {
    key: "current_debt_context",
    label: "Existing Debt Context",
    sectionKeys: ["currentDebtContext"],
    contextOnly: false,
    treatment: "Existing debt context only; not proposed financing",
    customerSourceLabel: "Existing debt support",
  },
  {
    key: "appraisal_context",
    label: "Appraisal / Valuation Context",
    sectionKeys: ["appraisalContext"],
    contextOnly: true,
    treatment: "Third-party valuation context; does not replace InvestorIQ valuation",
    customerSourceLabel: "Third-party appraisal support",
  },
  {
    key: "market_survey_context",
    label: "Market Rent Survey Context",
    sectionKeys: ["marketSurveyContext"],
    contextOnly: true,
    treatment: "Third-party market context; does not replace Rent Roll evidence",
    customerSourceLabel: "Third-party market survey support",
  },
  {
    key: "environmental_context",
    label: "Environmental / Phase I ESA Context",
    sectionKeys: ["environmentalContext"],
    contextOnly: true,
    treatment: "Third-party diligence context; no condition inference beyond the document",
    customerSourceLabel: "Environmental / Phase I ESA support",
  },
  {
    key: "renovation_context",
    label: "Renovation / CapEx Context",
    sectionKeys: ["renovationContext"],
    contextOnly: true,
    treatment: "Capital-plan context; no NOI, ROI, or value uplift inference",
    customerSourceLabel: "Renovation / CapEx support",
  },
]);

const FORBIDDEN_RECOMMENDATION_PATTERN = /\b(?:BUY|SELL|HOLD|FINAL RECOMMENDATION|INVESTMENT RECOMMENDATION)\b/i;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value) {
  const s = String(value ?? "").trim();
  return s || null;
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function section(model, key) {
  return isObject(model?.sections?.[key]) ? model.sections[key] : null;
}

function sectionSourcePresent(sectionValue) {
  return Boolean(
    sectionValue?.factAvailability?.sourcePresent === true ||
      sectionValue?.sourceDoc
  );
}

function sectionSourceBacked(sectionValue) {
  return sectionValue?.factAvailability?.sourceBacked === true;
}

function sectionAvailableFacts(sectionValue) {
  return unique(arr(sectionValue?.factAvailability?.available).map(String));
}

function sectionMissingFacts(sectionValue) {
  return unique(arr(sectionValue?.factAvailability?.missing).map(String));
}

function mergeFactKeys(sections, field) {
  return unique(
    sections.flatMap((sectionValue) =>
      field === "available"
        ? sectionAvailableFacts(sectionValue)
        : sectionMissingFacts(sectionValue)
    )
  );
}

function buildCoverageEntry(model, spec) {
  const sections = spec.sectionKeys.map((key) => section(model, key)).filter(Boolean);
  const present = sections.some(sectionSourcePresent);
  const backed = sections.some(sectionSourceBacked);
  const missingFacts = mergeFactKeys(sections, "missing");
  const availableFacts = mergeFactKeys(sections, "available");
  let status = STATUS.NOT_PROVIDED;
  if (backed && missingFacts.length === 0) status = STATUS.DOCUMENTED;
  else if (backed) status = STATUS.DOCUMENTED_WITH_LIMITATIONS;
  else if (present) status = STATUS.RECEIVED_NOT_DISPLAY_READY;

  return {
    key: spec.key,
    label: spec.label,
    status,
    sourcePresent: present,
    sourceBacked: backed,
    contextOnly: Boolean(spec.contextOnly),
    evidenceClass:
      status === STATUS.NOT_PROVIDED
        ? EVIDENCE.MISSING_UNSUPPORTED
        : spec.contextOnly
          ? EVIDENCE.THIRD_PARTY_CONTEXT
          : backed
            ? EVIDENCE.SOURCE_BACKED
            : EVIDENCE.MISSING_UNSUPPORTED,
    treatment: spec.treatment,
    sourceLabel: present ? text(spec.customerSourceLabel || spec.label) : null,
    availableFacts,
    missingFacts,
    sectionKeys: [...spec.sectionKeys],
  };
}

function sourceBackedFact(sectionValue, ...keys) {
  if (!sectionSourceBacked(sectionValue)) return null;
  const facts = isObject(sectionValue?.facts) ? sectionValue.facts : {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(facts, key)) {
      const value = facts[key];
      if (value !== null && value !== undefined && value !== "") return value;
    }
  }
  return null;
}

function metricReceipt({
  key,
  label,
  value,
  units,
  evidenceClass = EVIDENCE.SOURCE_BACKED,
  authorityPath,
  qualification = null,
  formula = null,
  inputs = null,
} = {}) {
  const normalized = units === "text" ? text(value) : finite(value);
  return {
    key,
    label,
    value: normalized,
    units,
    evidenceClass,
    displayReady: normalized !== null,
    authorityPath: authorityPath || null,
    qualification,
    formula,
    inputs: inputs || null,
  };
}

function buildTransactionMetrics(model) {
  const acquisition = section(model, "acquisitionRequestContext");
  const proposed = section(model, "proposedFinancingContext");
  const currentDebt = section(model, "currentDebtContext");

  const purchasePrice = finite(sourceBackedFact(acquisition, "purchase_price"));
  const goingInCapRate = finite(sourceBackedFact(acquisition, "going_in_cap_rate"));
  const proposedLoan = finite(
    sourceBackedFact(proposed, "proposed_loan_amount", "loan_amount") ??
      sourceBackedFact(acquisition, "proposed_loan_amount", "loan_amount")
  );
  const statedLtv = finite(
    sourceBackedFact(proposed, "ltv") ?? sourceBackedFact(acquisition, "ltv")
  );
  const proposedInterestRate = finite(sourceBackedFact(proposed, "interest_rate"));
  const proposedAmortizationYears = finite(sourceBackedFact(proposed, "amortization_years"));
  const proposedLenderFeePercent = finite(sourceBackedFact(proposed, "lender_fee_percent"));
  const currentDebtBalance = finite(sourceBackedFact(currentDebt, "current_outstanding_balance"));
  const currentDebtMaturity = text(sourceBackedFact(currentDebt, "maturity_date"));

  const proposedEquityRequirement =
    purchasePrice !== null && proposedLoan !== null ? purchasePrice - proposedLoan : null;
  const amountDerivedLtv =
    purchasePrice !== null && purchasePrice !== 0 && proposedLoan !== null
      ? proposedLoan / purchasePrice
      : null;
  const statedVsAmountLtvDifference =
    statedLtv !== null && amountDerivedLtv !== null ? statedLtv - amountDerivedLtv : null;

  return {
    purchasePrice: metricReceipt({
      key: "purchase_price",
      label: "Purchase Price",
      value: purchasePrice,
      units: "currency",
      authorityPath: "sections.acquisitionRequestContext.facts.purchase_price",
      qualification: "Purchase-assumption context; not an operating fact.",
    }),
    goingInCapRate: metricReceipt({
      key: "going_in_cap_rate",
      label: "Going-In Cap Rate",
      value: goingInCapRate,
      units: "ratio",
      authorityPath: "sections.acquisitionRequestContext.facts.going_in_cap_rate",
      qualification: "Transaction assumption only; valuation analysis remains separate.",
    }),
    proposedLoanAmount: metricReceipt({
      key: "proposed_loan_amount",
      label: "Proposed Loan Amount",
      value: proposedLoan,
      units: "currency",
      authorityPath: "sections.proposedFinancingContext.facts.proposed_loan_amount",
      qualification: "Proposed acquisition financing; not current debt.",
    }),
    statedLtv: metricReceipt({
      key: "stated_ltv",
      label: "Stated Proposed LTV",
      value: statedLtv,
      units: "ratio",
      authorityPath: "sections.proposedFinancingContext.facts.ltv",
      qualification: "Proposed acquisition financing term.",
    }),
    proposedInterestRate: metricReceipt({
      key: "proposed_interest_rate",
      label: "Proposed Interest Rate",
      value: proposedInterestRate,
      units: "ratio",
      authorityPath: "sections.proposedFinancingContext.facts.interest_rate",
      qualification: "Proposed acquisition financing term.",
    }),
    proposedAmortizationYears: metricReceipt({
      key: "proposed_amortization_years",
      label: "Proposed Amortization",
      value: proposedAmortizationYears,
      units: "years",
      authorityPath: "sections.proposedFinancingContext.facts.amortization_years",
      qualification: "Proposed acquisition financing term.",
    }),
    proposedLenderFeePercent: metricReceipt({
      key: "proposed_lender_fee_percent",
      label: "Proposed Lender Fee",
      value: proposedLenderFeePercent,
      units: "ratio",
      authorityPath: "sections.proposedFinancingContext.facts.lender_fee_percent",
      qualification: "Proposed acquisition financing term.",
    }),
    proposedEquityRequirement: metricReceipt({
      key: "proposed_equity_requirement",
      label: "Purchase Price less Proposed Loan",
      value: proposedEquityRequirement,
      units: "currency",
      evidenceClass: EVIDENCE.DETERMINISTIC_CALCULATED,
      authorityPath: "deterministic.transaction.purchase_price_less_proposed_loan",
      qualification:
        "Arithmetic difference only; excludes closing costs, fees, reserves, CapEx funding, and other equity uses.",
      formula: "purchase_price - proposed_loan_amount",
      inputs: { purchasePrice, proposedLoanAmount: proposedLoan },
    }),
    amountDerivedLtv: metricReceipt({
      key: "amount_derived_ltv",
      label: "Proposed Loan ÷ Purchase Price",
      value: amountDerivedLtv,
      units: "ratio",
      evidenceClass: EVIDENCE.DETERMINISTIC_CALCULATED,
      authorityPath: "deterministic.transaction.proposed_loan_over_purchase_price",
      qualification: "Arithmetic leverage reference; does not replace the stated financing term.",
      formula: "proposed_loan_amount / purchase_price",
      inputs: { purchasePrice, proposedLoanAmount: proposedLoan },
    }),
    statedVsAmountLtvDifference: metricReceipt({
      key: "stated_vs_amount_ltv_difference",
      label: "Stated LTV less Amount-Derived LTV",
      value: statedVsAmountLtvDifference,
      units: "ratio",
      evidenceClass: EVIDENCE.DETERMINISTIC_CALCULATED,
      authorityPath: "deterministic.transaction.stated_ltv_less_amount_derived_ltv",
      qualification: "Shown as a reconciliation difference only; no materiality threshold is inferred.",
      formula: "stated_ltv - (proposed_loan_amount / purchase_price)",
      inputs: { statedLtv, amountDerivedLtv },
    }),
    currentDebtBalance: metricReceipt({
      key: "current_debt_balance",
      label: "Current Debt Balance",
      value: currentDebtBalance,
      units: "currency",
      authorityPath: "sections.currentDebtContext.facts.current_outstanding_balance",
      qualification: "Existing debt context only; not proposed financing.",
    }),
    currentDebtMaturity: metricReceipt({
      key: "current_debt_maturity",
      label: "Current Debt Maturity",
      value: currentDebtMaturity,
      units: "text",
      authorityPath: "sections.currentDebtContext.facts.maturity_date",
      qualification: "Existing debt context only.",
    }),
  };
}

function buildOpenItems(model, coverage, metrics) {
  const items = [];
  const acquisition = section(model, "acquisitionRequestContext");
  const proposed = section(model, "proposedFinancingContext");
  const currentDebt = section(model, "currentDebtContext");

  if (!metrics.purchasePrice.displayReady) {
    items.push({
      code: "PURCHASE_PRICE_NOT_ESTABLISHED",
      label: "Purchase price is not established in display-ready purchase assumptions.",
      evidenceClass: EVIDENCE.MISSING_UNSUPPORTED,
    });
  }

  const proposedCoverage = coverage.find((entry) => entry.key === "purchase_assumptions");
  const proposedMissing = unique([
    ...sectionMissingFacts(acquisition),
    ...sectionMissingFacts(proposed),
  ]);
  if (proposedCoverage?.sourcePresent && proposedMissing.length > 0) {
    items.push({
      code: "PROPOSED_FINANCING_FACTS_INCOMPLETE",
      label: `Purchase / proposed-financing support is missing display-ready facts: ${proposedMissing.join(", ")}.`,
      evidenceClass: EVIDENCE.MISSING_UNSUPPORTED,
    });
  }

  if (sectionSourcePresent(currentDebt) && sectionMissingFacts(currentDebt).length > 0) {
    items.push({
      code: "CURRENT_DEBT_FACTS_INCOMPLETE",
      label: `Existing-debt support is missing display-ready facts: ${sectionMissingFacts(currentDebt).join(", ")}.`,
      evidenceClass: EVIDENCE.MISSING_UNSUPPORTED,
    });
  }

  const ltvDiff = metrics.statedVsAmountLtvDifference.value;
  if (ltvDiff !== null && Math.abs(ltvDiff) > 1e-9) {
    items.push({
      code: "PROPOSED_LTV_RECONCILIATION_OPEN",
      label:
        "The stated proposed LTV and proposed-loan ÷ purchase-price calculation are not identical; confirm which leverage term governs.",
      evidenceClass: EVIDENCE.DETERMINISTIC_CALCULATED,
    });
  }

  for (const entry of coverage) {
    if (entry.status === STATUS.RECEIVED_NOT_DISPLAY_READY) {
      items.push({
        code: `RECEIVED_NOT_DISPLAY_READY_${entry.key.toUpperCase()}`,
        label: `${entry.label} was received, but the governed facts are not display-ready for quantitative or conclusive use.`,
        evidenceClass: EVIDENCE.MISSING_UNSUPPORTED,
      });
    }
  }

  return items;
}

function buildInvestorQuestions(coverage, metrics) {
  const questions = [];
  const byKey = Object.fromEntries(coverage.map((entry) => [entry.key, entry]));

  if (!metrics.purchasePrice.displayReady) {
    questions.push("What purchase price should be used for the acquisition underwriting review?");
  }
  if (
    !metrics.proposedLoanAmount.displayReady ||
    !metrics.statedLtv.displayReady ||
    !metrics.proposedInterestRate.displayReady ||
    !metrics.proposedAmortizationYears.displayReady
  ) {
    questions.push(
      "Which proposed acquisition financing terms are confirmed, including loan amount, LTV, interest rate, and amortization?"
    );
  }
  if (byKey.current_debt_context?.status === STATUS.NOT_PROVIDED) {
    questions.push(
      "Is existing debt context available for the property, if applicable to the transaction review?"
    );
  }
  if (byKey.appraisal_context?.status === STATUS.NOT_PROVIDED) {
    questions.push("Is third-party appraisal or valuation support available for review?");
  }
  if (byKey.market_survey_context?.status === STATUS.NOT_PROVIDED) {
    questions.push("Is a current market-rent survey available to contextualize the Rent Roll?");
  }
  if (byKey.environmental_context?.status === STATUS.NOT_PROVIDED) {
    questions.push("Has environmental / Phase I ESA diligence been provided for this review?");
  }
  if (byKey.renovation_context?.status === STATUS.NOT_PROVIDED) {
    questions.push("Is a property-condition, renovation, or CapEx plan available for diligence review?");
  }

  return unique(questions);
}

function buildContextFacts(model) {
  const appraisal = section(model, "appraisalContext");
  const market = section(model, "marketSurveyContext");
  const environmental = section(model, "environmentalContext");
  const renovation = section(model, "renovationContext");

  const appraisalValue = finite(sourceBackedFact(appraisal, "appraisal_value"));
  const appraisalCap = finite(sourceBackedFact(appraisal, "stabilized_cap_rate"));
  const appraisalNoi = finite(sourceBackedFact(appraisal, "stabilized_noi"));
  const marketRanges = sectionSourceBacked(market) && Array.isArray(market?.facts?.market_rent_ranges)
    ? market.facts.market_rent_ranges
    : [];
  const phaseIStatus = text(sourceBackedFact(environmental, "phase_i_status"));
  const renovationBudget = finite(sourceBackedFact(renovation, "total_renovation_budget"));
  const renovationDuration = finite(sourceBackedFact(renovation, "capital_plan_duration_months"));

  return {
    appraisal: {
      appraisalValue,
      stabilizedNoi: appraisalNoi,
      stabilizedCapRate: appraisalCap,
      displayReady: appraisalValue !== null || appraisalNoi !== null || appraisalCap !== null,
      evidenceClass: EVIDENCE.THIRD_PARTY_CONTEXT,
      qualification: "Third-party appraisal context only; it does not replace InvestorIQ operating or valuation authority.",
    },
    marketSurvey: {
      rangeCount: marketRanges.length,
      displayReady: marketRanges.length > 0,
      evidenceClass: EVIDENCE.THIRD_PARTY_CONTEXT,
      qualification: "Third-party market context only; it does not replace Rent Roll evidence.",
    },
    environmental: {
      phaseIStatus,
      displayReady: phaseIStatus !== null,
      evidenceClass: EVIDENCE.THIRD_PARTY_CONTEXT,
      qualification: "Document context only; no environmental conclusion is inferred beyond the provided status.",
    },
    renovation: {
      totalRenovationBudget: renovationBudget,
      durationMonths: renovationDuration,
      displayReady: renovationBudget !== null || renovationDuration !== null,
      evidenceClass: EVIDENCE.THIRD_PARTY_CONTEXT,
      qualification: "Capital-plan context only; no NOI, ROI, or value uplift is inferred.",
    },
  };
}

function buildDispositions({ coverage, openItems, investorQuestions, metrics }) {
  const transactionMetricCount = Object.values(metrics).filter((receipt) => receipt?.displayReady).length;
  const coveredCount = coverage.filter((entry) => entry.status !== STATUS.NOT_PROVIDED).length;
  return {
    transactionSnapshot: applySectionDisposition({
      sectionKey: "transactionDiligence.transactionSnapshot",
      classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
      requestedDisposition:
        transactionMetricCount > 0
          ? SECTION_DISPOSITIONS.INCLUDE
          : SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
      minimumSurvivingFactKeys: Object.values(metrics)
        .filter((receipt) => receipt?.displayReady)
        .map((receipt) => receipt.key),
      missingFactOrLimitationReason:
        transactionMetricCount > 0 ? null : "No display-ready transaction terms were established.",
      detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
    }),
    diligenceCoverage: applySectionDisposition({
      sectionKey: "transactionDiligence.diligenceCoverage",
      classification: SECTION_CLASSIFICATIONS.SUPPLEMENTARY,
      requestedDisposition:
        coveredCount > 0 ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
      minimumSurvivingFactKeys: coverage.map((entry) => entry.key),
      missingFactOrLimitationReason:
        coveredCount > 0 ? null : "No optional diligence sources were established for this review.",
      detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
    }),
    openDiligenceItems: applySectionDisposition({
      sectionKey: "transactionDiligence.openDiligenceItems",
      classification: SECTION_CLASSIFICATIONS.OPTIONAL,
      requestedDisposition:
        openItems.length > 0 ? SECTION_DISPOSITIONS.INCLUDE_QUALIFIED : SECTION_DISPOSITIONS.OMIT,
      minimumSurvivingFactKeys: openItems.map((item) => item.code),
      missingFactOrLimitationReason: openItems.length > 0 ? "Open diligence items remain." : null,
      detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
    }),
    investorQuestions: applySectionDisposition({
      sectionKey: "transactionDiligence.investorQuestions",
      classification: SECTION_CLASSIFICATIONS.OPTIONAL,
      requestedDisposition:
        investorQuestions.length > 0 ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.OMIT,
      minimumSurvivingFactKeys: investorQuestions.map((_, index) => `question_${index + 1}`),
      detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
    }),
  };
}

function assertNoRecommendationLeak(contract) {
  const visible = [
    ...contract.openDiligenceItems.map((item) => item.label),
    ...contract.investorQuestions,
    ...contract.diligenceCoverage.map((entry) => `${entry.label} ${entry.treatment}`),
  ].join(" ");
  if (FORBIDDEN_RECOMMENDATION_PATTERN.test(visible)) {
    throw new Error("ELITE_TRANSACTION_DILIGENCE_FORBIDDEN_RECOMMENDATION_LANGUAGE");
  }
}

export function buildFullUnderwritingTransactionDiligenceV1({
  customerSurfaceModel,
  propertyProfile = null,
  reportMeta = null,
} = {}) {
  if (!isObject(customerSurfaceModel) || !isObject(customerSurfaceModel.sections)) {
    throw new Error("GOVERNED_CUSTOMER_SURFACE_MODEL_REQUIRED_FOR_ELITE_TRANSACTION_DILIGENCE");
  }

  const diligenceCoverage = ROLE_SPECS.map((spec) => buildCoverageEntry(customerSurfaceModel, spec));
  const metrics = buildTransactionMetrics(customerSurfaceModel);
  const openDiligenceItems = buildOpenItems(customerSurfaceModel, diligenceCoverage, metrics);
  const investorQuestions = buildInvestorQuestions(diligenceCoverage, metrics);
  const contextFacts = buildContextFacts(customerSurfaceModel);
  const coverageSummary = {
    totalAreas: diligenceCoverage.length,
    documented: diligenceCoverage.filter((entry) => entry.status === STATUS.DOCUMENTED).length,
    documentedWithLimitations: diligenceCoverage.filter(
      (entry) => entry.status === STATUS.DOCUMENTED_WITH_LIMITATIONS
    ).length,
    receivedNotDisplayReady: diligenceCoverage.filter(
      (entry) => entry.status === STATUS.RECEIVED_NOT_DISPLAY_READY
    ).length,
    notProvided: diligenceCoverage.filter((entry) => entry.status === STATUS.NOT_PROVIDED).length,
  };

  const contract = {
    version: FULL_UNDERWRITING_TRANSACTION_DILIGENCE_VERSION,
    source: "full_underwriting_transaction_diligence",
    authority: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      publicationAuthority: false,
      deliveryAuthority: false,
      revisionAuthority: false,
      scenarioAuthority: false,
      investmentRecommendationAllowed: false,
      optionalDiligenceMayBlockCorePublication: false,
      downstreamConsumeOnly: true,
    },
    identity: {
      propertyName: text(
        customerSurfaceModel?.identity?.propertyName ||
          propertyProfile?.propertyName ||
          propertyProfile?.property_name ||
          reportMeta?.propertyName ||
          reportMeta?.property_name
      ),
      reportType: text(
        customerSurfaceModel?.identity?.reportType || reportMeta?.reportType || reportMeta?.report_type
      ),
    },
    transactionMetrics: metrics,
    diligenceCoverage,
    coverageSummary,
    openDiligenceItems,
    investorQuestions,
    thirdPartyContext: contextFacts,
    governingDisclosures: [
      "Transaction and diligence intelligence consumes governed report facts only; it does not create or alter source truth.",
      "Appraisal, market, environmental, and renovation materials remain third-party or support context and do not override the accepted T12 or Rent Roll.",
      "Missing or incomplete optional diligence limits only the dependent diligence analysis and does not by itself block publication of otherwise valid core underwriting.",
    ],
    sectionDispositions: null,
    provenance: {
      inputAuthority: "governed_customer_surface_model",
      quantitativeFactsRequireSourceBackedSection: true,
      deterministicCalculations: [
        "purchase_price - proposed_loan_amount",
        "proposed_loan_amount / purchase_price",
        "stated_ltv - amount_derived_ltv",
      ],
      rawParserAccess: false,
      filenameHeuristicsUsedForFacts: false,
      filenamePresentationPolicy: "source_register_only",
      supportDocumentOverrideAllowed: false,
    },
  };

  contract.sectionDispositions = buildDispositions({
    coverage: diligenceCoverage,
    openItems: openDiligenceItems,
    investorQuestions,
    metrics,
  });
  assertNoRecommendationLeak(contract);
  return deepFreeze(contract);
}

export default {
  FULL_UNDERWRITING_TRANSACTION_DILIGENCE_VERSION,
  buildFullUnderwritingTransactionDiligenceV1,
};
