import fs from "node:fs";

const target = "api/_lib/full-underwriting-chapter1-elite-contract.js";
let source = fs.readFileSync(target, "utf8");

const before = `  const currentAnnualDebtService = metricFromCalculationReceipt(
    financialIntelligence,
    "currentDebtAnnualDebtService",
    "currentAnnualDebtService",
    "Current Annual Debt Service",
    "currency_per_year"
  );
  const proposedAnnualDebtService = metricFromCalculationReceipt(
    financialIntelligence,
    "proposedFinancingAnnualDebtService",
    "proposedAnnualDebtService",
    "Proposed Annual Debt Service",
    "currency_per_year"
  );
  const currentDebtDscr = metricFromCalculationReceipt(
    financialIntelligence,
    "currentDebtDscr",
    "currentDebtDscr",
    "Current Debt DSCR",
    "ratio_x"
  );
  const proposedFinancingDscr = metricFromCalculationReceipt(
    financialIntelligence,
    "proposedFinancingDscr",
    "proposedFinancingDscr",
    "Proposed Financing DSCR",
    "ratio_x"
  );`;

const after = `  let currentAnnualDebtService = metricFromCalculationReceipt(
    financialIntelligence,
    "currentDebtAnnualDebtService",
    "currentAnnualDebtService",
    "Current Annual Debt Service",
    "currency_per_year"
  );
  let proposedAnnualDebtService = metricFromCalculationReceipt(
    financialIntelligence,
    "proposedFinancingAnnualDebtService",
    "proposedAnnualDebtService",
    "Proposed Annual Debt Service",
    "currency_per_year"
  );
  let currentDebtDscr = metricFromCalculationReceipt(
    financialIntelligence,
    "currentDebtDscr",
    "currentDebtDscr",
    "Current Debt DSCR",
    "ratio_x"
  );
  let proposedFinancingDscr = metricFromCalculationReceipt(
    financialIntelligence,
    "proposedFinancingDscr",
    "proposedFinancingDscr",
    "Proposed Financing DSCR",
    "ratio_x"
  );

  // The canonical financial-intelligence receipt remains first authority. When
  // the exact report-generation path does not carry that optional receipt into
  // Chapter 1, reconstruct only the same deterministic debt math from accepted
  // source facts. No debt assumption is introduced here.
  const acceptedCurrentMonthlyPayment = firstFinite(currentDebt?.accepted_facts?.monthly_payment);
  if (
    currentAnnualDebtService.displayReady !== true &&
    acceptedCurrentMonthlyPayment !== null &&
    acceptedCurrentMonthlyPayment > 0
  ) {
    currentAnnualDebtService = derivedMetric({
      key: "currentAnnualDebtService",
      label: "Current Annual Debt Service",
      value: acceptedCurrentMonthlyPayment * 12,
      units: "currency_per_year",
      formula: "accepted_current_monthly_payment_times_12",
      inputs: { monthlyPayment: acceptedCurrentMonthlyPayment },
      provenance: ["sourceTruthPackage.support.accepted.current_debt_context.accepted_facts.monthly_payment"],
    });
  }

  const acceptedProposedInterestRateRaw = firstFinite(purchase?.accepted_facts?.interest_rate);
  const acceptedProposedInterestRate = acceptedProposedInterestRateRaw !== null
    ? normalizeRatio(acceptedProposedInterestRateRaw)
    : null;
  const acceptedProposedAmortizationYears = firstFinite(purchase?.accepted_facts?.amortization_years);
  if (
    proposedAnnualDebtService.displayReady !== true &&
    proposedLoanAmount.displayReady === true &&
    proposedLoanAmount.value > 0 &&
    acceptedProposedInterestRate !== null &&
    acceptedProposedInterestRate >= 0 &&
    acceptedProposedAmortizationYears !== null &&
    acceptedProposedAmortizationYears > 0
  ) {
    const periodicRate = acceptedProposedInterestRate / 12;
    const totalPeriods = Math.round(acceptedProposedAmortizationYears * 12);
    const monthlyDebtService = periodicRate === 0
      ? proposedLoanAmount.value / totalPeriods
      : proposedLoanAmount.value * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
    proposedAnnualDebtService = derivedMetric({
      key: "proposedAnnualDebtService",
      label: "Proposed Annual Debt Service",
      value: monthlyDebtService * 12,
      units: "currency_per_year",
      formula: periodicRate === 0
        ? "principal_divided_by_total_periods_times_12"
        : "principal_times_periodic_rate_divided_by_one_minus_one_plus_periodic_rate_to_negative_total_periods_times_12",
      inputs: {
        principal: proposedLoanAmount.value,
        annualInterestRate: acceptedProposedInterestRate,
        amortizationYears: acceptedProposedAmortizationYears,
        periodicRate,
        totalPeriods,
      },
      provenance: [
        proposedLoanAmount.authorityPath,
        "sourceTruthPackage.support.accepted.purchase_assumptions.accepted_facts.interest_rate",
        "sourceTruthPackage.support.accepted.purchase_assumptions.accepted_facts.amortization_years",
      ].filter(Boolean),
    });
  }

  if (
    currentDebtDscr.displayReady !== true &&
    noi.displayReady === true &&
    currentAnnualDebtService.displayReady === true &&
    currentAnnualDebtService.value > 0
  ) {
    currentDebtDscr = derivedMetric({
      key: "currentDebtDscr",
      label: "Current Debt DSCR",
      value: noi.value / currentAnnualDebtService.value,
      units: "ratio_x",
      formula: "accepted_noi_divided_by_current_debt_service",
      inputs: { noi: noi.value, annualDebtService: currentAnnualDebtService.value },
      provenance: [noi.authorityPath, currentAnnualDebtService.authorityPath].filter(Boolean),
    });
  }

  if (
    proposedFinancingDscr.displayReady !== true &&
    noi.displayReady === true &&
    proposedAnnualDebtService.displayReady === true &&
    proposedAnnualDebtService.value > 0
  ) {
    proposedFinancingDscr = derivedMetric({
      key: "proposedFinancingDscr",
      label: "Proposed Financing DSCR",
      value: noi.value / proposedAnnualDebtService.value,
      units: "ratio_x",
      formula: "accepted_noi_divided_by_proposed_debt_service",
      inputs: { noi: noi.value, annualDebtService: proposedAnnualDebtService.value },
      provenance: [noi.authorityPath, proposedAnnualDebtService.authorityPath].filter(Boolean),
    });
  }`;

if (!source.includes(before)) {
  throw new Error("PHASE8A_SLICE_C_DSCR_FALLBACK_SOURCE_MISSING");
}

source = source.replace(before, after);
fs.writeFileSync(target, source, "utf8");
console.log("phase8a-slice-c-source-bound-dscr-fallback-patch: PATCHED");
