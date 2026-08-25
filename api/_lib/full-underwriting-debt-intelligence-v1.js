import {
  applySectionDisposition,
  SECTION_CLASSIFICATIONS,
  SECTION_DISPOSITIONS,
} from "./section-disposition-contract.js";

export const FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION =
  "full_underwriting_debt_intelligence_v1";
export const FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION =
  "full_underwriting_debt_sensitivity_policy_v1";

export const FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES = Object.freeze({
  SOURCE_BACKED: "source_backed",
  DETERMINISTIC_CALCULATED: "deterministic_calculated",
  SCENARIO: "scenario",
  MISSING_UNSUPPORTED: "missing_unsupported",
});

export const FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_V1 = Object.freeze({
  version: FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
  proposedRateStressBasisPoints: Object.freeze([50, 100, 200]),
  rules: Object.freeze({
    downstreamConsumeOnly: true,
    sourceTruthMutationAllowed: false,
    publicationAuthorityAllowed: false,
    deliveryAuthorityAllowed: false,
    revisionAuthorityAllowed: false,
    scenarioOutputsAreEvidence: false,
    scenarioOutputsMayOverrideAcceptedFacts: false,
    thresholdInferenceAllowed: false,
    lenderCovenantInferenceAllowed: false,
    riskGradeInferenceAllowed: false,
    investmentRecommendationAllowed: false,
    refinancingModelAllowed: false,
    currentDebtRateShockAllowed: false,
    proposedRateShockRequiresAcceptedLoanRateAndAmortization: true,
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim() || null;
}

function section(model, key) {
  return isObject(model?.sections?.[key]) ? model.sections[key] : null;
}

function sectionSourceBacked(sectionValue) {
  return Boolean(
    sectionValue?.factAvailability?.sourceBacked === true ||
      sectionValue?.sourceBacked === true
  );
}

function sourceFact(sectionValue, key) {
  if (!sectionSourceBacked(sectionValue)) return null;
  const value = sectionValue?.facts?.[key];
  return value === null || value === undefined || value === "" ? null : value;
}

function metricReceipt({
  key,
  label,
  value,
  units,
  evidenceClass,
  authorityPath = null,
  formula = null,
  inputs = null,
  qualification = null,
} = {}) {
  const normalized = units === "text" || units === "date" ? text(value) : finite(value);
  return {
    key,
    label,
    value: normalized,
    units,
    evidenceClass,
    sourceBacked: evidenceClass === FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED,
    deterministic: evidenceClass === FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
    scenario: evidenceClass === FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SCENARIO,
    displayReady: normalized !== null,
    authorityPath,
    formula,
    inputs: inputs || null,
    qualification,
  };
}

function resultValue(receipt) {
  const direct = receipt?.result;
  if (direct !== null && direct !== undefined && direct !== "") return direct;
  return receipt;
}

function debtCapacityMetric(model, key) {
  const capacitySection = section(model, "debtCapacityAndCoverage");
  if (!sectionSourceBacked(capacitySection)) return null;
  const receipt = capacitySection?.facts?.[key];
  const value = resultValue(receipt);
  if (value === null || value === undefined || value === "") return null;
  return value;
}

function debtCoverageRole(model, roleKey) {
  const coverageSection = section(model, "debtServiceCoverage");
  if (!sectionSourceBacked(coverageSection)) return null;
  return coverageSection?.facts?.[roleKey] || null;
}

function paymentFromTerms(principal, annualRate, amortizationYears) {
  const p = finite(principal);
  const rate = finite(annualRate);
  const years = finite(amortizationYears);
  if (p === null || p <= 0 || rate === null || rate < 0 || years === null || years <= 0) return null;
  const months = Math.round(years * 12);
  if (!Number.isFinite(months) || months <= 0) return null;
  if (Math.abs(rate) <= 1e-12) return p / months;
  const monthlyRate = rate / 12;
  const denominator = 1 - Math.pow(1 + monthlyRate, -months);
  if (!Number.isFinite(denominator) || Math.abs(denominator) <= 1e-12) return null;
  const payment = (p * monthlyRate) / denominator;
  return Number.isFinite(payment) ? payment : null;
}

function round(value, decimals = 10) {
  const n = finite(value);
  if (n === null) return null;
  const factor = 10 ** decimals;
  const result = Math.round((n + Number.EPSILON) * factor) / factor;
  return Object.is(result, -0) ? 0 : result;
}

function buildBaseProfiles(model) {
  const currentContext = section(model, "currentDebtContext");
  const proposedContext = section(model, "proposedFinancingContext");
  const acquisitionContext = section(model, "acquisitionRequestContext");
  const currentCoverage = debtCoverageRole(model, "currentDebt");
  const proposedCoverage = debtCoverageRole(model, "proposedFinancing");

  const currentBalance = finite(sourceFact(currentContext, "current_outstanding_balance"));
  const currentRate = finite(sourceFact(currentContext, "interest_rate"));
  const currentAmortization = finite(sourceFact(currentContext, "amortization_remaining_years"));
  const currentMaturity = text(sourceFact(currentContext, "maturity_date"));
  const currentMonthlyDebtService = finite(currentCoverage?.monthlyDebtService);
  const currentAnnualDebtService = finite(currentCoverage?.annualDebtService);
  const currentDscr = finite(currentCoverage?.dscr);

  const proposedLoanAmount = finite(
    sourceFact(proposedContext, "proposed_loan_amount") ??
      sourceFact(acquisitionContext, "proposed_loan_amount")
  );
  const proposedLtv = finite(
    sourceFact(proposedContext, "ltv") ?? sourceFact(acquisitionContext, "ltv")
  );
  const proposedRate = finite(sourceFact(proposedContext, "interest_rate"));
  const proposedAmortization = finite(sourceFact(proposedContext, "amortization_years"));
  const proposedFee = finite(sourceFact(proposedContext, "lender_fee_percent"));
  const debtTerm = section(model, "debtTermAnalysis");
  const proposedLenderFeeDollars = finite(debtTerm?.facts?.lenderFee?.lenderFeeDollars);
  const proposedMonthlyDebtService = finite(proposedCoverage?.monthlyDebtService);
  const proposedAnnualDebtService = finite(proposedCoverage?.annualDebtService);
  const proposedDscr = finite(proposedCoverage?.dscr);

  const operatingSection = section(model, "operatingStatementTTMSummary");
  const unitMixSection = section(model, "unitMix");
  const noi = finite(sourceFact(operatingSection, "net_operating_income"));
  const occupancy = finite(sourceFact(unitMixSection, "occupancy"));

  const currentCushion = noi !== null && currentAnnualDebtService !== null ? noi - currentAnnualDebtService : null;
  const proposedCushion = noi !== null && proposedAnnualDebtService !== null ? noi - proposedAnnualDebtService : null;

  return {
    noi: metricReceipt({
      key: "accepted_noi",
      label: "Accepted NOI",
      value: noi,
      units: "currency",
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED,
      authorityPath: "sections.operatingStatementTTMSummary.facts.net_operating_income",
    }),
    occupancy: metricReceipt({
      key: "accepted_occupancy",
      label: "Accepted Occupancy",
      value: occupancy,
      units: "ratio",
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED,
      authorityPath: "sections.unitMix.facts.occupancy",
    }),
    currentDebt: {
      displayReady: [currentBalance, currentRate, currentAnnualDebtService, currentDscr, currentMaturity].some((v) => v !== null),
      balance: metricReceipt({ key: "current_balance", label: "Current Outstanding Balance", value: currentBalance, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.currentDebtContext.facts.current_outstanding_balance" }),
      rate: metricReceipt({ key: "current_rate", label: "Current Interest Rate", value: currentRate, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.currentDebtContext.facts.interest_rate" }),
      amortizationRemainingYears: metricReceipt({ key: "current_amortization_remaining", label: "Amortization Remaining", value: currentAmortization, units: "years", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.currentDebtContext.facts.amortization_remaining_years" }),
      maturityDate: metricReceipt({ key: "current_maturity", label: "Current Debt Maturity", value: currentMaturity, units: "date", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.currentDebtContext.facts.maturity_date" }),
      monthlyDebtService: metricReceipt({ key: "current_monthly_debt_service", label: "Monthly Payment", value: currentMonthlyDebtService, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtServiceCoverage.facts.currentDebt.monthlyDebtService" }),
      annualDebtService: metricReceipt({ key: "current_annual_debt_service", label: "Current Debt Annual Debt Service", value: currentAnnualDebtService, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtServiceCoverage.facts.currentDebt.annualDebtService" }),
      dscr: metricReceipt({ key: "current_dscr", label: "Current Debt DSCR", value: currentDscr, units: "multiple", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtServiceCoverage.facts.currentDebt.dscr" }),
      noiCushionToOneX: metricReceipt({ key: "current_noi_cushion", label: "NOI Cushion above 1.00x DSCR", value: currentCushion, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, formula: "accepted_noi_minus_current_annual_debt_service", inputs: { noi, currentAnnualDebtService }, qualification: "Mathematical 1.00x coverage reference only; not a lender covenant." }),
    },
    proposedFinancing: {
      displayReady: [proposedLoanAmount, proposedRate, proposedAnnualDebtService, proposedDscr].some((v) => v !== null),
      loanAmount: metricReceipt({ key: "proposed_loan_amount", label: "Proposed Loan Amount", value: proposedLoanAmount, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.proposedFinancingContext.facts.proposed_loan_amount" }),
      ltv: metricReceipt({ key: "proposed_ltv", label: "Proposed LTV", value: proposedLtv, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.proposedFinancingContext.facts.ltv" }),
      rate: metricReceipt({ key: "proposed_rate", label: "Proposed Interest Rate", value: proposedRate, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.proposedFinancingContext.facts.interest_rate" }),
      amortizationYears: metricReceipt({ key: "proposed_amortization", label: "Proposed Amortization", value: proposedAmortization, units: "years", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.proposedFinancingContext.facts.amortization_years" }),
      lenderFeePercent: metricReceipt({ key: "proposed_lender_fee", label: "Lender / Origination Fee", value: proposedFee, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.proposedFinancingContext.facts.lender_fee_percent" }),
      lenderFeeDollars: metricReceipt({ key: "proposed_lender_fee_dollars", label: "Proposed Lender Fee", value: proposedLenderFeeDollars, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtTermAnalysis.facts.lenderFee.lenderFeeDollars" }),
      monthlyDebtService: metricReceipt({ key: "proposed_monthly_debt_service", label: "Proposed Monthly Debt Service", value: proposedMonthlyDebtService, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtServiceCoverage.facts.proposedFinancing.monthlyDebtService" }),
      annualDebtService: metricReceipt({ key: "proposed_annual_debt_service", label: "Proposed Acquisition Financing Annual Debt Service", value: proposedAnnualDebtService, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtServiceCoverage.facts.proposedFinancing.annualDebtService" }),
      dscr: metricReceipt({ key: "proposed_dscr", label: "Proposed Acquisition Financing DSCR", value: proposedDscr, units: "multiple", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtServiceCoverage.facts.proposedFinancing.dscr" }),
      noiCushionToOneX: metricReceipt({ key: "proposed_noi_cushion", label: "NOI Cushion above 1.00x DSCR", value: proposedCushion, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, formula: "accepted_noi_minus_proposed_annual_debt_service", inputs: { noi, proposedAnnualDebtService }, qualification: "Mathematical 1.00x coverage reference only; not a lender covenant." }),
    },
  };
}

function buildRateSensitivity(baseProfiles) {
  const p = finite(baseProfiles?.proposedFinancing?.loanAmount?.value);
  const baseRate = finite(baseProfiles?.proposedFinancing?.rate?.value);
  const years = finite(baseProfiles?.proposedFinancing?.amortizationYears?.value);
  const noi = finite(baseProfiles?.noi?.value);
  const baseAnnualDebtService = finite(baseProfiles?.proposedFinancing?.annualDebtService?.value);
  const baseDscr = finite(baseProfiles?.proposedFinancing?.dscr?.value);

  const eligible = p !== null && p > 0 && baseRate !== null && baseRate >= 0 && years !== null && years > 0 && noi !== null && noi > 0;
  if (!eligible) {
    return {
      displayReady: false,
      policyVersion: FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SCENARIO,
      rows: [],
      reason: "Accepted proposed loan amount, interest rate, amortization, and NOI are required for rate sensitivity.",
    };
  }

  const rows = FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_V1.proposedRateStressBasisPoints.map((bps) => {
    const scenarioRate = baseRate + bps / 10000;
    const monthlyDebtService = paymentFromTerms(p, scenarioRate, years);
    const annualDebtService = monthlyDebtService === null ? null : monthlyDebtService * 12;
    const dscr = annualDebtService && annualDebtService > 0 ? noi / annualDebtService : null;
    const cushion = annualDebtService === null ? null : noi - annualDebtService;
    return {
      key: `proposed_rate_plus_${bps}bps`,
      label: `Proposed Rate +${bps} bps`,
      scenario: true,
      sourceBacked: false,
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SCENARIO,
      scenarioInputs: {
        baseRate,
        rateStressBasisPoints: bps,
        scenarioRate,
        loanAmount: p,
        amortizationYears: years,
      },
      outputs: {
        monthlyDebtService: round(monthlyDebtService, 6),
        annualDebtService: round(annualDebtService, 6),
        dscr: round(dscr, 8),
        dscrDeltaVsBase: baseDscr === null || dscr === null ? null : round(dscr - baseDscr, 8),
        annualDebtServiceDeltaVsBase:
          baseAnnualDebtService === null || annualDebtService === null
            ? null
            : round(annualDebtService - baseAnnualDebtService, 6),
        noiCushionToOneX: round(cushion, 6),
        debtServiceShareOfNoi: annualDebtService === null ? null : round(annualDebtService / noi, 8),
      },
      formula: "level_payment_amortization_at_hypothetical_proposed_rate_then_accepted_noi_divided_by_scenario_annual_debt_service",
      qualification: "Hypothetical proposed-financing rate sensitivity only. This is not a forecast, lender quote, covenant test, or future debt replacement model.",
    };
  });

  return {
    displayReady: rows.length > 0,
    policyVersion: FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
    evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SCENARIO,
    base: {
      rate: baseRate,
      annualDebtService: baseAnnualDebtService,
      dscr: baseDscr,
      noi,
    },
    rows,
    reason: null,
  };
}

function buildMaturityContext(model, reportMeta) {
  const debtTermSection = section(model, "debtTermAnalysis");
  const debtTerm = sectionSourceBacked(debtTermSection) ? (debtTermSection?.facts || {}) : {};
  const current = debtTerm?.maturity?.currentDebt || null;
  const currentContext = section(model, "currentDebtContext");
  const acceptedMaturity = text(sourceFact(currentContext, "maturity_date"));
  const analyzed = current?.analysisStatus === "assessed";
  const daysToMaturity = finite(current?.daysToMaturity);
  const maturityPosition = text(current?.maturityPosition);
  const asOfDate = text(current?.asOfDate || reportMeta?.generatedAt || reportMeta?.generated_at);

  return {
    displayReady: Boolean(analyzed && acceptedMaturity && daysToMaturity !== null && maturityPosition),
    maturityDate: metricReceipt({ key: "maturity_date", label: "Maturity Date", value: acceptedMaturity, units: "date", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SOURCE_BACKED, authorityPath: "sections.currentDebtContext.facts.maturity_date" }),
    asOfDate: metricReceipt({ key: "analysis_as_of_date", label: "Analysis As Of", value: asOfDate, units: "date", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtTermAnalysis.facts.maturity.currentDebt.asOfDate" }),
    daysToMaturity: metricReceipt({ key: "days_to_maturity", label: "Days to Maturity", value: daysToMaturity, units: "days", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtTermAnalysis.facts.maturity.currentDebt.daysToMaturity", formula: "accepted_maturity_date_minus_canonical_report_as_of_date" }),
    maturityPosition: metricReceipt({ key: "maturity_position", label: "Maturity Position", value: maturityPosition, units: "text", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtTermAnalysis.facts.maturity.currentDebt.maturityPosition" }),
    refinancingReadiness: {
      assessmentStatus: text(debtTerm?.refinancingReadiness?.assessmentStatus),
      assessmentState: text(debtTerm?.refinancingReadiness?.assessmentState),
      refinancingModelEligible: debtTerm?.refinancingReadiness?.refinancingModelEligible === true,
      proposedAcquisitionFinancingTreatedAsRefinancing:
        debtTerm?.refinancingReadiness?.proposedAcquisitionFinancingTreatedAsRefinancing === true,
    },
    qualification: "Maturity timing is deterministic date context only. ELITE-07 does not infer future financing replacement terms, proceeds, or probability.",
  };
}

function buildCapacityInterpretation(model, baseProfiles, rateSensitivity) {
  const debtYield = finite(debtCapacityMetric(model, "proposedDebtYield"));
  const mortgageConstant = finite(debtCapacityMetric(model, "proposedMortgageConstant"));
  const proposedBreakEven = finite(debtCapacityMetric(model, "proposedDebtInclusiveBreakEvenOccupancy"));
  const currentBreakEven = finite(debtCapacityMetric(model, "currentDebtInclusiveBreakEvenOccupancy"));
  const proposedBreakEvenMonthlyRent = finite(debtCapacityMetric(model, "proposedDebtInclusiveBreakEvenMonthlyRentPerUnit"));
  const currentBreakEvenMonthlyRent = finite(debtCapacityMetric(model, "currentDebtInclusiveBreakEvenMonthlyRentPerUnit"));
  const governedCapacityResult = text(debtCapacityMetric(model, "debtCapacityResult"));
  const governedBindingConstraint = text(debtCapacityMetric(model, "bindingConstraint"));

  const proposedDscr = finite(baseProfiles?.proposedFinancing?.dscr?.value);
  const currentDscr = finite(baseProfiles?.currentDebt?.dscr?.value);
  const proposedAds = finite(baseProfiles?.proposedFinancing?.annualDebtService?.value);
  const currentAds = finite(baseProfiles?.currentDebt?.annualDebtService?.value);
  const noi = finite(baseProfiles?.noi?.value);
  const occupancy = finite(baseProfiles?.occupancy?.value);

  const observations = [];
  if (proposedDscr !== null && currentDscr !== null) {
    const delta = proposedDscr - currentDscr;
    observations.push({
      key: "coverage_comparison",
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
      text:
        delta < -1e-9
          ? `Proposed financing produces ${Math.abs(delta).toFixed(2)}x less DSCR than current debt on the accepted NOI basis.`
          : delta > 1e-9
            ? `Proposed financing produces ${Math.abs(delta).toFixed(2)}x more DSCR than current debt on the accepted NOI basis.`
            : "Current and proposed financing produce the same DSCR on the accepted NOI basis.",
    });
  }
  if (proposedAds !== null && currentAds !== null) {
    const delta = proposedAds - currentAds;
    observations.push({
      key: "debt_service_comparison",
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
      text: `Proposed annual debt service is ${delta >= 0 ? "higher" : "lower"} than current annual debt service by $${Math.abs(Math.round(delta)).toLocaleString("en-US")}.`,
    });
  }
  if (noi !== null && proposedAds !== null && noi > 0) {
    observations.push({
      key: "proposed_debt_service_share",
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
      text: `At accepted proposed terms, annual debt service equals ${((proposedAds / noi) * 100).toFixed(1)}% of accepted NOI.`,
    });
  }
  if (occupancy !== null && proposedBreakEven !== null) {
    const spread = occupancy - proposedBreakEven;
    observations.push({
      key: "occupancy_vs_debt_break_even",
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
      text: `Accepted occupancy is ${(Math.abs(spread) * 100).toFixed(1)} percentage points ${spread >= 0 ? "above" : "below"} proposed debt-inclusive occupancy coverage point.`,
    });
  }
  const plus100 = rateSensitivity?.rows?.find((row) => row?.scenarioInputs?.rateStressBasisPoints === 100);
  if (plus100?.outputs?.dscr !== null && plus100?.outputs?.dscr !== undefined && proposedDscr !== null) {
    const delta = Number(plus100.outputs.dscr) - proposedDscr;
    observations.push({
      key: "rate_100bps_dscr_change",
      evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SCENARIO,
      text: `Under the versioned +100 bps proposed-rate sensitivity, modeled DSCR changes by ${delta.toFixed(2)}x versus accepted proposed terms.`,
    });
  }

  const metrics = {
    proposedDebtYield: metricReceipt({ key: "proposed_debt_yield", label: "Proposed Debt Yield", value: debtYield, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.proposedDebtYield.result" }),
    proposedMortgageConstant: metricReceipt({ key: "proposed_mortgage_constant", label: "Proposed Mortgage Constant", value: mortgageConstant, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.proposedMortgageConstant.result" }),
    currentDebtInclusiveBreakEvenOccupancy: metricReceipt({ key: "current_debt_break_even_occupancy", label: "Current Debt-Inclusive Occupancy Coverage Point", value: currentBreakEven, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.currentDebtInclusiveBreakEvenOccupancy.result" }),
    proposedDebtInclusiveBreakEvenOccupancy: metricReceipt({ key: "proposed_debt_break_even_occupancy", label: "Proposed Debt-Inclusive Occupancy Coverage Point", value: proposedBreakEven, units: "ratio", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.proposedDebtInclusiveBreakEvenOccupancy.result" }),
    currentDebtInclusiveBreakEvenMonthlyRentPerUnit: metricReceipt({ key: "current_debt_break_even_monthly_rent", label: "Current Debt-Inclusive Break-Even Monthly Rent / Unit", value: currentBreakEvenMonthlyRent, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.currentDebtInclusiveBreakEvenMonthlyRentPerUnit.result" }),
    proposedDebtInclusiveBreakEvenMonthlyRentPerUnit: metricReceipt({ key: "proposed_debt_break_even_monthly_rent", label: "Proposed Debt-Inclusive Break-Even Monthly Rent / Unit", value: proposedBreakEvenMonthlyRent, units: "currency", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.result" }),
    governedCapacityResult: metricReceipt({ key: "governed_capacity_result", label: "Governed Debt Capacity Result", value: governedCapacityResult, units: "text", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.debtCapacityResult.result" }),
    governedBindingConstraint: metricReceipt({ key: "governed_binding_constraint", label: "Governed Binding Constraint", value: governedBindingConstraint, units: "text", evidenceClass: FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED, authorityPath: "sections.debtCapacityAndCoverage.facts.bindingConstraint.result" }),
  };

  return {
    displayReady: Object.values(metrics).some((metric) => metric.displayReady) || observations.length > 0,
    metrics,
    observations,
    qualification: "Debt-capacity interpretation uses governed lender-style deterministic metrics only. No lender covenant or underwriting threshold is inferred.",
  };
}

function disposition({ sectionKey, displayReady, reason, surviving = [] }) {
  return applySectionDisposition({
    sectionKey,
    classification: SECTION_CLASSIFICATIONS.ANALYTICAL,
    requestedDisposition: displayReady ? SECTION_DISPOSITIONS.INCLUDE : SECTION_DISPOSITIONS.COLLAPSE,
    minimumSurvivingFactKeys: surviving,
    missingFactOrLimitationReason: displayReady ? null : reason,
    compactRendererEligible: true,
    collapseReason: displayReady ? null : reason,
    manifestDisclosure: displayReady
      ? `${sectionKey}: governed debt intelligence included without creating lender or recommendation authority.`
      : `${sectionKey}: collapsed because the required governed debt inputs were unavailable.`,
    certificationExpectation: "debt_intelligence_must_remain_downstream_deterministic_and_scenario_labeled",
  });
}

export function buildFullUnderwritingDebtIntelligenceV1({
  customerSurfaceModel,
  reportMeta = null,
  propertyProfile = null,
} = {}) {
  if (!isObject(customerSurfaceModel) || !isObject(customerSurfaceModel.sections)) {
    throw new Error("ELITE_DEBT_CUSTOMER_SURFACE_MODEL_REQUIRED");
  }

  const baseProfiles = buildBaseProfiles(customerSurfaceModel);
  const proposedRateSensitivity = buildRateSensitivity(baseProfiles);
  const maturityContext = buildMaturityContext(customerSurfaceModel, reportMeta);
  const capacityInterpretation = buildCapacityInterpretation(
    customerSurfaceModel,
    baseProfiles,
    proposedRateSensitivity
  );

  const baseCoverageReady = baseProfiles.currentDebt.displayReady || baseProfiles.proposedFinancing.displayReady;
  const chapterDisplayReady = Boolean(
    baseCoverageReady ||
      proposedRateSensitivity.displayReady ||
      maturityContext.displayReady ||
      capacityInterpretation.displayReady
  );

  const contract = {
    version: FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
    policyVersion: FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
    authority: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      publicationAuthorityAllowed: false,
      deliveryAuthorityAllowed: false,
      revisionAuthorityAllowed: false,
      scenarioOutputsAreEvidence: false,
      thresholdInferenceAllowed: false,
      lenderCovenantInferenceAllowed: false,
      riskGradeInferenceAllowed: false,
      investmentRecommendationAllowed: false,
      refinancingModelAllowed: false,
      currentDebtRateShockAllowed: false,
    },
    identity: {
      propertyName: text(
        customerSurfaceModel?.identity?.propertyName ||
          propertyProfile?.propertyName ||
          propertyProfile?.property_name ||
          reportMeta?.propertyName ||
          reportMeta?.property_name
      ),
      reportType: text(customerSurfaceModel?.identity?.reportType || reportMeta?.reportType),
    },
    baseProfiles,
    proposedRateSensitivity,
    maturityContext,
    capacityInterpretation,
    sectionDispositions: {
      coverageHeadroom: disposition({
        sectionKey: "elite07_coverage_headroom",
        displayReady: baseCoverageReady,
        reason: "No governed current or proposed debt coverage profile is display-ready.",
        surviving: ["currentDebt", "proposedFinancing"],
      }),
      proposedRateSensitivity: disposition({
        sectionKey: "elite07_proposed_rate_sensitivity",
        displayReady: proposedRateSensitivity.displayReady,
        reason: proposedRateSensitivity.reason,
        surviving: ["accepted proposed loan amount", "accepted proposed rate", "accepted amortization", "accepted NOI"],
      }),
      maturityContext: disposition({
        sectionKey: "elite07_maturity_context",
        displayReady: maturityContext.displayReady,
        reason: "A deterministic accepted current-debt maturity date is not available.",
        surviving: ["accepted current debt maturity", "canonical report as-of date"],
      }),
      capacityInterpretation: disposition({
        sectionKey: "elite07_debt_capacity_interpretation",
        displayReady: capacityInterpretation.displayReady,
        reason: "No governed debt-capacity metrics are display-ready.",
        surviving: ["debt yield", "mortgage constant", "DSCR", "debt-inclusive break-even"],
      }),
    },
    availability: {
      chapterDisplayReady,
      baseCoverageReady,
      proposedRateSensitivityReady: proposedRateSensitivity.displayReady,
      maturityContextReady: maturityContext.displayReady,
      capacityInterpretationReady: capacityInterpretation.displayReady,
    },
    boundaries: {
      currentDebtIsNotProposedFinancing: true,
      proposedFinancingIsNotCurrentDebt: true,
      proposedRateStressIsScenarioOnly: true,
      currentDebtRateStressDeferred: true,
      refinanceTermsNotInferred: true,
      noLenderCovenantInference: true,
      noCreditDecision: true,
      noInvestmentRecommendation: true,
      noRiskGrade: true,
    },
  };

  const validation = validateFullUnderwritingDebtIntelligenceV1(contract);
  if (!validation.ok) {
    throw new Error(`ELITE_DEBT_CONTRACT_INVALID:${validation.issues.join("|")}`);
  }
  return deepFreeze(contract);
}

export function validateFullUnderwritingDebtIntelligenceV1(contract = null) {
  const issues = [];
  if (!isObject(contract)) return { ok: false, issues: ["contract_not_object"] };
  if (contract.version !== FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION) issues.push("version_mismatch");
  if (contract.policyVersion !== FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION) issues.push("policy_version_mismatch");

  const authority = contract.authority || {};
  for (const key of [
    "authorityCreating",
    "sourceTruthMutationAllowed",
    "publicationAuthorityAllowed",
    "deliveryAuthorityAllowed",
    "revisionAuthorityAllowed",
    "scenarioOutputsAreEvidence",
    "thresholdInferenceAllowed",
    "lenderCovenantInferenceAllowed",
    "riskGradeInferenceAllowed",
    "investmentRecommendationAllowed",
    "refinancingModelAllowed",
    "currentDebtRateShockAllowed",
  ]) {
    if (authority[key] !== false) issues.push(`authority_${key}_must_be_false`);
  }

  const rows = Array.isArray(contract?.proposedRateSensitivity?.rows)
    ? contract.proposedRateSensitivity.rows
    : [];
  for (const row of rows) {
    if (row?.scenario !== true) issues.push("rate_row_must_be_scenario");
    if (row?.sourceBacked !== false) issues.push("rate_row_must_not_be_source_backed");
    if (row?.evidenceClass !== FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES.SCENARIO) issues.push("rate_row_evidence_class_invalid");
    if (!FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_V1.proposedRateStressBasisPoints.includes(row?.scenarioInputs?.rateStressBasisPoints)) issues.push("rate_row_stress_not_policy_authorized");
    if (finite(row?.scenarioInputs?.scenarioRate) === null) issues.push("rate_row_scenario_rate_missing");
    if (finite(row?.outputs?.annualDebtService) === null) issues.push("rate_row_annual_debt_service_missing");
    if (finite(row?.outputs?.dscr) === null) issues.push("rate_row_dscr_missing");
  }

  if (contract?.boundaries?.proposedRateStressIsScenarioOnly !== true) issues.push("scenario_boundary_missing");
  if (contract?.boundaries?.currentDebtRateStressDeferred !== true) issues.push("current_debt_rate_stress_boundary_missing");
  if (contract?.boundaries?.refinanceTermsNotInferred !== true) issues.push("refinance_boundary_missing");
  if (contract?.boundaries?.noLenderCovenantInference !== true) issues.push("covenant_boundary_missing");
  if (contract?.boundaries?.noInvestmentRecommendation !== true) issues.push("recommendation_boundary_missing");
  if (contract?.boundaries?.noRiskGrade !== true) issues.push("risk_grade_boundary_missing");

  const dispositions = contract.sectionDispositions || {};
  for (const key of ["coverageHeadroom", "proposedRateSensitivity", "maturityContext", "capacityInterpretation"]) {
    const dispositionValue = dispositions?.[key]?.disposition;
    if (!["include", "include_qualified", "compact", "collapse", "omit"].includes(dispositionValue)) {
      issues.push(`disposition_${key}_invalid`);
    }
  }

  return { ok: issues.length === 0, issues };
}

export default {
  FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_V1,
  FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES,
  buildFullUnderwritingDebtIntelligenceV1,
  validateFullUnderwritingDebtIntelligenceV1,
};
