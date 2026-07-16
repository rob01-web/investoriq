import { buildCanonicalDebtServiceInputContract } from './debt-service-input-contract.js';
import { buildDeterministicDebtServiceCalculation } from './deterministic-debt-service-calculation.js';
import { buildDeterministicDscrAnalysis } from './deterministic-dscr-analysis.js';
import { buildCanonicalReportAnalysisContext } from './report-analysis-context.js';
import { buildDeterministicDebtRiskAnalysis } from './deterministic-debt-risk-analysis.js';
import { buildCanonicalCoreReconciliationInputContract } from './core-reconciliation-input-contract.js';
import { buildDeterministicCoreReconciliationAnalysis } from './deterministic-core-reconciliation-analysis.js';
import { buildCanonicalCapitalPlanInputContract } from './capital-plan-input-contract.js';
import { buildDeterministicCapitalPlanAnalysis } from './deterministic-capital-plan-analysis.js';

const RECEIPT_SOURCE = 'canonical_institutional_financial_intelligence';
const RECEIPT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function finite(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function unique(values) {
  return [...new Set(array(values).filter(Boolean).map((value) => String(value)))];
}

function provenanceFrom(...values) {
  return values.flatMap((value) => array(value)).filter(Boolean);
}

function calculationReceipt({
  calculationKey,
  label,
  result,
  units,
  formula,
  formulaVersion,
  requiredInputs = [],
  inputs = {},
  inputProvenance = [],
  eligible = false,
  collapseReason = null,
  qualification = null,
}) {
  const numericResult = finite(result);
  const calculationEligible = eligible === true && numericResult !== null;
  return {
    calculationKey,
    label,
    formula,
    formulaVersion,
    requiredInputs: unique(requiredInputs),
    inputProvenance: provenanceFrom(inputProvenance),
    units,
    inputs,
    result: calculationEligible ? numericResult : null,
    eligible: calculationEligible,
    sectionDisplayReady: calculationEligible,
    collapseReason: calculationEligible ? null : collapseReason || 'CANONICAL_INPUT_BUNDLE_NOT_ELIGIBLE',
    qualification,
    authority: {
      source: RECEIPT_SOURCE,
      authorityCreating: false,
      receiptOnly: true,
    },
  };
}

function debtServiceReceipt(roleKey, calculation) {
  const label = roleKey === 'currentDebt' ? 'Current Debt' : 'Proposed Acquisition Financing';
  const requiredInputsByMethod = {
    source_stated_monthly_payment: ['monthly_payment'],
    deterministic_amortization_model: roleKey === 'currentDebt'
      ? ['current_outstanding_balance', 'interest_rate', 'amortization_remaining_years']
      : ['proposed_loan_amount', 'interest_rate', 'amortization_years'],
  };
  return calculationReceipt({
    calculationKey: `${roleKey}AnnualDebtService`,
    label: `${label} Annual Debt Service`,
    result: calculation?.annualDebtService,
    units: 'currency_per_year',
    formula: calculation?.methodology?.formula || calculation?.methodology?.annualizationFormula || null,
    formulaVersion: `canonical_deterministic_debt_service_calculation_v${calculation?.calculationVersion || 1}`,
    requiredInputs: requiredInputsByMethod[calculation?.selectedMethod] || [],
    inputs: {
      monthlyDebtService: finite(calculation?.monthlyDebtService),
      annualDebtService: finite(calculation?.annualDebtService),
      selectedMethod: calculation?.selectedMethod || null,
    },
    inputProvenance: calculation?.inputReceipts || [],
    eligible: calculation?.calculationStatus === 'calculated',
    collapseReason: calculation?.reasonCode || null,
    qualification: calculation?.qualificationRequired === true
      ? 'Modeled level-payment debt service based on accepted source terms.'
      : 'Annualized from the accepted source-stated monthly payment.',
  });
}

function dscrReceipt(roleKey, analysis) {
  const label = roleKey === 'currentDebt' ? 'Current Debt DSCR' : 'Proposed Acquisition DSCR';
  return calculationReceipt({
    calculationKey: `${roleKey}Dscr`,
    label,
    result: analysis?.ratio,
    units: 'ratio_x',
    formula: analysis?.methodology?.formula || 'accepted_annual_noi_divided_by_deterministic_annual_debt_service',
    formulaVersion: 'canonical_deterministic_dscr_analysis_v1',
    requiredInputs: ['accepted_t12_net_operating_income', 'canonical_annual_debt_service'],
    inputs: {
      annualNetOperatingIncome: finite(analysis?.annualNetOperatingIncome),
      annualDebtService: finite(analysis?.annualDebtService),
    },
    inputProvenance: provenanceFrom(
      analysis?.numeratorReceipt ? [analysis.numeratorReceipt] : [],
      analysis?.denominatorReceipt?.inputReceipts
    ),
    eligible: analysis?.calculationStatus === 'calculated' && analysis?.sourceBound === true,
    collapseReason: analysis?.reasonCode || null,
    qualification: analysis?.qualificationRequired === true
      ? 'Coverage uses modeled level-payment debt service based on accepted source terms.'
      : 'Coverage uses annualized source-stated debt service.',
  });
}

function reconciliationReceipts(analysis) {
  const result = analysis?.reconciliation || {};
  const calculated = result.calculationStatus === 'calculated' && result.sourceBound === true;
  const provenance = result.inputReceipts || [];
  return [
    calculationReceipt({
      calculationKey: 'coreRentDifference',
      label: 'Rent Roll less T12 Gross Potential Rent',
      result: result.differenceAmount,
      units: 'currency_per_year',
      formula: result?.methodology?.differenceFormula || 'rent_roll_annual_in_place_rent_minus_t12_gross_potential_rent',
      formulaVersion: 'canonical_deterministic_core_reconciliation_analysis_v1',
      requiredInputs: ['accepted_rent_roll_annual_in_place_rent', 'accepted_t12_gross_potential_rent'],
      inputs: {
        rentRollAnnualInPlaceRent: finite(result.rentRollAnnualInPlaceRent),
        t12GrossPotentialRent: finite(result.t12GrossPotentialRent),
      },
      inputProvenance: provenance,
      eligible: calculated,
      collapseReason: result.reasonCode || null,
    }),
    calculationReceipt({
      calculationKey: 'coreRentVarianceToT12Gpr',
      label: 'Rent Roll Variance to T12 Gross Potential Rent',
      result: result.varianceRatioToT12Gpr,
      units: 'ratio',
      formula: result?.methodology?.varianceFormula || 'difference_amount_divided_by_t12_gross_potential_rent',
      formulaVersion: 'canonical_deterministic_core_reconciliation_analysis_v1',
      requiredInputs: ['accepted_rent_roll_annual_in_place_rent', 'accepted_t12_gross_potential_rent'],
      inputs: {
        differenceAmount: finite(result.differenceAmount),
        t12GrossPotentialRent: finite(result.t12GrossPotentialRent),
      },
      inputProvenance: provenance,
      eligible: calculated,
      collapseReason: result.reasonCode || null,
    }),
    calculationReceipt({
      calculationKey: 'coreRentDifferencePerUnitMonthly',
      label: 'Rent Roll Difference per Unit per Month',
      result: result.perUnitMonthlyDifference,
      units: 'currency_per_unit_per_month',
      formula: result?.methodology?.perUnitMonthlyFormula || 'difference_amount_divided_by_total_units_divided_by_12',
      formulaVersion: 'canonical_deterministic_core_reconciliation_analysis_v1',
      requiredInputs: ['difference_amount', 'accepted_total_units'],
      inputs: {
        differenceAmount: finite(result.differenceAmount),
      },
      inputProvenance: provenance,
      eligible: calculated && finite(result.perUnitMonthlyDifference) !== null,
      collapseReason: calculated ? 'ACCEPTED_TOTAL_UNITS_NOT_AVAILABLE' : result.reasonCode || null,
    }),
  ];
}

function capitalReceipts(analysis, inputContract) {
  const capital = analysis?.analysis || {};
  const receipts = [];
  for (const [index, plan] of array(capital.capitalPlans).entries()) {
    const comparison = plan?.reserveComparison || {};
    receipts.push(calculationReceipt({
      calculationKey: `capitalPlan${index + 1}ReserveLessRequirement`,
      label: `Capital Plan ${index + 1} Reserve less Stated Requirement`,
      result: comparison.reserveLessRequirementAmount,
      units: 'currency',
      formula: 'accepted_capital_reserve_balance_minus_accepted_stated_capital_requirement',
      formulaVersion: 'canonical_deterministic_capital_plan_analysis_v1',
      requiredInputs: ['accepted_capital_reserve_balance', 'accepted_stated_capital_requirement'],
      inputs: {
        reserveBalance: finite(comparison.reserveBalance),
        statedRequirementAmount: finite(comparison.statedRequirementAmount),
      },
      inputProvenance: plan?.acceptedProvenanceFields || [],
      eligible: comparison.calculationStatus === 'calculated',
      collapseReason: comparison.calculationStatus === 'calculated' ? null : 'CAPITAL_RESERVE_COMPARISON_INPUTS_INCOMPLETE',
    }));
  }
  const reserve = capital?.reserve || {};
  receipts.push(calculationReceipt({
    calculationKey: 'annualReserveContributionPerUnit',
    label: 'Annual Reserve Contribution per Unit',
    result: reserve.contributionPerUnitAnnual,
    units: 'currency_per_unit_per_year',
    formula: 'accepted_annual_reserve_contribution_divided_by_accepted_total_units',
    formulaVersion: 'canonical_deterministic_capital_plan_analysis_v1',
    requiredInputs: ['accepted_annual_reserve_contribution', 'accepted_total_units'],
    inputs: {
      annualReserveContribution: finite(reserve.annualReserveContribution),
      totalUnits: finite(reserve.totalUnits),
    },
    inputProvenance: provenanceFrom(
      inputContract?.consolidatedFacts?.annual_reserve_contribution?.provenance,
      inputContract?.coreInputs?.totalUnits?.provenance
        ? [inputContract.coreInputs.totalUnits.provenance]
        : []
    ),
    eligible: finite(reserve.contributionPerUnitAnnual) !== null,
    collapseReason: 'CAPITAL_RESERVE_CONTRIBUTION_INPUTS_INCOMPLETE',
  }));
  return receipts;
}

function section({
  key,
  displayReady,
  sourcePresent,
  roleAccepted,
  factAccepted,
  facts,
  availableFacts,
  requiredFacts,
  reasonCode,
}) {
  return {
    key,
    status: displayReady ? 'required' : 'collapsed',
    displayReady: Boolean(displayReady),
    sourcePresent: Boolean(sourcePresent),
    roleAccepted: Boolean(roleAccepted),
    factAccepted: Boolean(factAccepted),
    sourceBacked: Boolean(displayReady),
    facts,
    requiredFacts: unique(requiredFacts),
    availableFacts: unique(availableFacts),
    missingFacts: unique(requiredFacts).filter((fact) => !unique(availableFacts).includes(fact)),
    collapseReason: displayReady ? null : reasonCode || 'CANONICAL_INPUT_BUNDLE_NOT_ELIGIBLE',
    reportPublicationBlocker: false,
  };
}

function buildCustomerSections({
  debtContract,
  debtService,
  dscr,
  debtRisk,
  reconciliationContract,
  reconciliation,
  capitalContract,
  capitalPlan,
}) {
  const debtSourcePresent = debtContract?.currentDebt?.sourcePresent === true ||
    debtContract?.proposedFinancing?.sourcePresent === true;
  const debtRoleAccepted = debtContract?.currentDebt?.roleAccepted === true ||
    debtContract?.proposedFinancing?.roleAccepted === true;
  const debtFactAccepted = debtContract?.currentDebt?.factAccepted === true ||
    debtContract?.proposedFinancing?.factAccepted === true;
  const coverageRoles = ['currentDebt', 'proposedFinancing'].filter(
    (roleKey) => dscr?.[roleKey]?.calculationStatus === 'calculated'
  );
  const debtCoverageFacts = Object.fromEntries(coverageRoles.map((roleKey) => [roleKey, {
    monthlyDebtService: finite(debtService?.[roleKey]?.monthlyDebtService),
    annualDebtService: finite(debtService?.[roleKey]?.annualDebtService),
    dscr: finite(dscr?.[roleKey]?.displayRatio),
    selectedMethod: debtService?.[roleKey]?.selectedMethod || null,
    modeledDebtService: debtService?.[roleKey]?.modeledDebtService === true,
    qualification: dscr?.[roleKey]?.qualificationRequired === true
      ? 'Coverage uses modeled level-payment debt service based on accepted source terms.'
      : 'Coverage uses annualized source-stated debt service.',
  }]));
  const debtRiskAvailable = [
    debtRisk?.maturity?.currentDebt?.analysisStatus === 'assessed' ? 'current_debt_maturity' : null,
    debtRisk?.maturity?.proposedFinancing?.analysisStatus === 'assessed' ? 'proposed_financing_maturity' : null,
    debtRisk?.rateStructure?.currentDebt?.analysisStatus === 'assessed' ? 'current_debt_rate_structure' : null,
    debtRisk?.rateStructure?.proposedFinancing?.analysisStatus === 'assessed' ? 'proposed_financing_rate_structure' : null,
    debtRisk?.lenderFee?.calculationStatus === 'calculated' ? 'lender_fee_dollars' : null,
  ].filter(Boolean);
  const reconciliationResult = reconciliation?.reconciliation || {};
  const reconciliationReady = reconciliationResult.calculationStatus === 'calculated' && reconciliationResult.sourceBound === true;
  const reconciliationFacts = reconciliationContract?.facts || {};
  const reconciliationSourcePresent = reconciliationFacts?.t12GrossPotentialRent?.sourcePresent === true &&
    reconciliationFacts?.rentRollAnnualInPlaceRent?.sourcePresent === true;
  const reconciliationRolesAccepted = reconciliationFacts?.t12GrossPotentialRent?.roleAccepted === true &&
    reconciliationFacts?.rentRollAnnualInPlaceRent?.roleAccepted === true;
  const reconciliationFactsAccepted = reconciliationFacts?.t12GrossPotentialRent?.factAccepted === true &&
    reconciliationFacts?.rentRollAnnualInPlaceRent?.factAccepted === true;
  const capital = capitalPlan?.analysis || {};
  const capitalAvailable = [
    ...array(capital.capitalPlans).flatMap((plan, index) => [
      finite(plan?.planAmount) !== null ? `capital_plan_${index + 1}_amount` : null,
      plan?.timing?.timingStatus === 'source_timing_available' ? `capital_plan_${index + 1}_timing` : null,
      plan?.reserveComparison?.calculationStatus === 'calculated' ? `capital_plan_${index + 1}_reserve_comparison` : null,
    ]),
    finite(capital?.reserve?.reserveBalance) !== null ? 'capital_reserve_balance' : null,
    finite(capital?.reserve?.annualReserveContribution) !== null ? 'annual_reserve_contribution' : null,
    capital?.deferredMaintenance?.sourceStatus && capital.deferredMaintenance.sourceStatus !== 'not_established'
      ? 'deferred_maintenance_status'
      : null,
    finite(capital?.deferredMaintenance?.amount) !== null ? 'deferred_maintenance_amount' : null,
  ].filter(Boolean);

  return {
    debtServiceCoverage: section({
      key: 'debtServiceCoverage',
      displayReady: coverageRoles.length > 0,
      sourcePresent: debtSourcePresent,
      roleAccepted: debtRoleAccepted,
      factAccepted: debtFactAccepted,
      facts: debtCoverageFacts,
      requiredFacts: coverageRoles.flatMap((roleKey) => [`${roleKey}_annual_debt_service`, `${roleKey}_dscr`]),
      availableFacts: coverageRoles.flatMap((roleKey) => [`${roleKey}_annual_debt_service`, `${roleKey}_dscr`]),
      reasonCode: 'CANONICAL_DSCR_INPUT_BUNDLE_NOT_ELIGIBLE',
    }),
    debtTermAnalysis: section({
      key: 'debtTermAnalysis',
      displayReady: debtRiskAvailable.length > 0,
      sourcePresent: debtSourcePresent,
      roleAccepted: debtRoleAccepted,
      factAccepted: debtFactAccepted,
      facts: {
        maturity: debtRisk?.maturity || {},
        rateStructure: debtRisk?.rateStructure || {},
        lenderFee: debtRisk?.lenderFee || {},
        refinancingReadiness: debtRisk?.refinancingReadiness || {},
      },
      requiredFacts: debtRiskAvailable,
      availableFacts: debtRiskAvailable,
      reasonCode: 'CANONICAL_DEBT_TERM_FACTS_NOT_ELIGIBLE',
    }),
    coreReconciliation: section({
      key: 'coreReconciliation',
      displayReady: reconciliationReady,
      sourcePresent: reconciliationSourcePresent,
      roleAccepted: reconciliationRolesAccepted,
      factAccepted: reconciliationFactsAccepted,
      facts: reconciliationResult,
      requiredFacts: ['t12_gross_potential_rent', 'rent_roll_annual_in_place_rent', 'difference_amount', 'variance_ratio'],
      availableFacts: reconciliationReady
        ? ['t12_gross_potential_rent', 'rent_roll_annual_in_place_rent', 'difference_amount', 'variance_ratio']
        : [],
      reasonCode: reconciliationResult.reasonCode || 'CANONICAL_CORE_RECONCILIATION_INPUTS_NOT_ELIGIBLE',
    }),
    capitalPlanAnalysis: section({
      key: 'capitalPlanAnalysis',
      displayReady: capitalAvailable.length > 0,
      sourcePresent: capitalContract?.eligibility?.sourcePresent === true,
      roleAccepted: Number(capitalContract?.eligibility?.acceptedPrimarySourceCount) > 0,
      factAccepted: capitalAvailable.length > 0,
      facts: capital,
      requiredFacts: capitalAvailable,
      availableFacts: capitalAvailable,
      reasonCode: capital.reasonCode || 'CANONICAL_CAPITAL_PLAN_INPUTS_NOT_ELIGIBLE',
    }),
  };
}

export function isCanonicalInstitutionalFinancialIntelligence(value) {
  const requiredSectionKeys = [
    'debtServiceCoverage',
    'debtTermAnalysis',
    'coreReconciliation',
    'capitalPlanAnalysis',
  ];
  const sectionsValid = requiredSectionKeys.every((sectionKey) => {
    const sectionValue = value?.customerSections?.[sectionKey];
    return Boolean(
      sectionValue &&
      sectionValue.key === sectionKey &&
      ['required', 'collapsed'].includes(sectionValue.status) &&
      typeof sectionValue.displayReady === 'boolean' &&
      typeof sectionValue.sourcePresent === 'boolean' &&
      typeof sectionValue.roleAccepted === 'boolean' &&
      typeof sectionValue.factAccepted === 'boolean' &&
      typeof sectionValue.sourceBacked === 'boolean' &&
      sectionValue.reportPublicationBlocker === false &&
      Array.isArray(sectionValue.requiredFacts) &&
      Array.isArray(sectionValue.availableFacts) &&
      Array.isArray(sectionValue.missingFacts) &&
      (sectionValue.displayReady !== true || (
        sectionValue.roleAccepted === true &&
        sectionValue.factAccepted === true &&
        sectionValue.sourceBacked === true
      ))
    );
  });
  const calculationsValid = Array.isArray(value?.calculationReceipts) &&
    value.calculationReceipts.every((receipt) => Boolean(
      receipt &&
      typeof receipt.calculationKey === 'string' &&
      receipt.calculationKey.length > 0 &&
      typeof receipt.eligible === 'boolean' &&
      typeof receipt.sectionDisplayReady === 'boolean' &&
      Array.isArray(receipt.requiredInputs) &&
      Array.isArray(receipt.inputProvenance) &&
      receipt.inputs &&
      typeof receipt.inputs === 'object' &&
      receipt.authority?.source === RECEIPT_SOURCE &&
      receipt.authority?.authorityCreating === false &&
      receipt.authority?.receiptOnly === true &&
      (receipt.eligible !== true || (
        finite(receipt.result) !== null &&
        typeof receipt.formula === 'string' &&
        receipt.formula.length > 0 &&
        typeof receipt.formulaVersion === 'string' &&
        receipt.formulaVersion.length > 0 &&
        receipt.requiredInputs.length > 0 &&
        receipt.inputProvenance.length > 0
      ))
    ));
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === RECEIPT_SOURCE &&
    value.receiptVersion === RECEIPT_VERSION &&
    value.sourceTruthReceipt?.source === 'canonical_source_truth_package' &&
    value.policy?.authorityCreating === false &&
    value.policy?.sourceTruthMutationAllowed === false &&
    value.policy?.downstreamConsumeOnly === true &&
    value.policy?.deterministicMathOnly === true &&
    value.policy?.missingNumericValuesRemainNull === true &&
    value.policy?.optionalAnalysisFailureMayBlockValidatedCorePublication === false &&
    value.policy?.thresholdInferenceAllowed === false &&
    value.policy?.scenarioInferenceAllowed === false &&
    value.policy?.legacyUnderwritingReuseAllowed === false &&
    value.contracts &&
    typeof value.contracts === 'object' &&
    value.analyses &&
    typeof value.analyses === 'object' &&
    sectionsValid &&
    calculationsValid &&
    value.reportPublicationBlocker === false
  );
}

export function buildCanonicalInstitutionalFinancialIntelligence({
  sourceTruthPackage,
  asOfDate,
} = {}) {
  const debtServiceInputContract = buildCanonicalDebtServiceInputContract({ sourceTruthPackage });
  const debtServiceCalculation = buildDeterministicDebtServiceCalculation({ debtServiceInputContract });
  const dscrAnalysis = buildDeterministicDscrAnalysis({ debtServiceInputContract });
  const analysisContext = buildCanonicalReportAnalysisContext({
    jobId: sourceTruthPackage?.job_id || null,
    asOfDate,
  });
  const debtRiskAnalysis = buildDeterministicDebtRiskAnalysis({
    debtServiceInputContract,
    analysisContext,
  });
  const reconciliationInputContract = buildCanonicalCoreReconciliationInputContract({ sourceTruthPackage });
  const coreReconciliationAnalysis = buildDeterministicCoreReconciliationAnalysis({ reconciliationInputContract });
  const capitalPlanInputContract = buildCanonicalCapitalPlanInputContract({ sourceTruthPackage });
  const capitalPlanAnalysis = buildDeterministicCapitalPlanAnalysis({ capitalPlanInputContract });
  const customerSections = buildCustomerSections({
    debtContract: debtServiceInputContract,
    debtService: debtServiceCalculation,
    dscr: dscrAnalysis,
    debtRisk: debtRiskAnalysis,
    reconciliationContract: reconciliationInputContract,
    reconciliation: coreReconciliationAnalysis,
    capitalContract: capitalPlanInputContract,
    capitalPlan: capitalPlanAnalysis,
  });
  const rawCalculationReceipts = [
    debtServiceReceipt('currentDebt', debtServiceCalculation.currentDebt),
    debtServiceReceipt('proposedFinancing', debtServiceCalculation.proposedFinancing),
    dscrReceipt('currentDebt', dscrAnalysis.currentDebt),
    dscrReceipt('proposedFinancing', dscrAnalysis.proposedFinancing),
    calculationReceipt({
      calculationKey: 'proposedLenderFeeDollars',
      label: 'Proposed Lender Fee',
      result: debtRiskAnalysis?.lenderFee?.lenderFeeDollars,
      units: 'currency',
      formula: 'accepted_proposed_loan_amount_times_accepted_lender_fee_rate',
      formulaVersion: 'canonical_deterministic_debt_risk_analysis_v1',
      requiredInputs: ['accepted_proposed_loan_amount', 'accepted_lender_fee_rate'],
      inputs: {
        proposedLoanAmount: finite(debtRiskAnalysis?.lenderFee?.proposedLoanAmount),
        lenderFeeRate: finite(debtRiskAnalysis?.lenderFee?.lenderFeeRate),
      },
      inputProvenance: debtRiskAnalysis?.lenderFee?.inputReceipts || [],
      eligible: debtRiskAnalysis?.lenderFee?.calculationStatus === 'calculated',
      collapseReason: debtRiskAnalysis?.lenderFee?.reasonCode || null,
    }),
    ...reconciliationReceipts(coreReconciliationAnalysis),
    ...capitalReceipts(capitalPlanAnalysis, capitalPlanInputContract),
  ];
  const calculationSectionKey = (calculationKey) => {
    if (/DebtService$|Dscr$/.test(calculationKey)) return 'debtServiceCoverage';
    if (calculationKey === 'proposedLenderFeeDollars') return 'debtTermAnalysis';
    if (calculationKey.startsWith('coreRent')) return 'coreReconciliation';
    return 'capitalPlanAnalysis';
  };
  const calculationReceipts = rawCalculationReceipts.map((receipt) => ({
    ...receipt,
    sectionDisplayReady: receipt.eligible === true &&
      customerSections?.[calculationSectionKey(receipt.calculationKey)]?.displayReady === true,
  }));

  return deepFreeze({
    source: RECEIPT_SOURCE,
    receiptVersion: RECEIPT_VERSION,
    sourceTruthReceipt: {
      source: sourceTruthPackage?.source || null,
      schemaVersion: sourceTruthPackage?.schema_version || null,
      jobId: sourceTruthPackage?.job_id || null,
      corePublishable: sourceTruthPackage?.core_publishable === true,
    },
    analysisContext,
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      downstreamConsumeOnly: true,
      deterministicMathOnly: true,
      missingNumericValuesRemainNull: true,
      optionalAnalysisFailureMayBlockValidatedCorePublication: false,
      thresholdInferenceAllowed: false,
      scenarioInferenceAllowed: false,
      legacyUnderwritingReuseAllowed: false,
    },
    contracts: {
      debtServiceInput: debtServiceInputContract,
      coreReconciliationInput: reconciliationInputContract,
      capitalPlanInput: capitalPlanInputContract,
    },
    analyses: {
      debtService: debtServiceCalculation,
      dscr: dscrAnalysis,
      debtRisk: debtRiskAnalysis,
      coreReconciliation: coreReconciliationAnalysis,
      capitalPlan: capitalPlanAnalysis,
    },
    customerSections,
    calculationReceipts,
    coverage: {
      displayReadySectionCount: Object.values(customerSections).filter((sectionValue) => sectionValue.displayReady).length,
      totalSectionCount: Object.keys(customerSections).length,
      eligibleCalculationCount: calculationReceipts.filter((receipt) => receipt.eligible).length,
      totalCalculationCount: calculationReceipts.length,
    },
    reportPublicationBlocker: false,
  });
}

export const INSTITUTIONAL_FINANCIAL_INTELLIGENCE_CONTRACT = deepFreeze({
  source: RECEIPT_SOURCE,
  receiptVersion: RECEIPT_VERSION,
  authorityCreating: false,
  downstreamConsumeOnly: true,
  legacyUnderwritingReuseAllowed: false,
});
