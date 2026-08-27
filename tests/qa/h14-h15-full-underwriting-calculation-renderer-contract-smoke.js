import assert from "node:assert/strict";

import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";
import {
  buildReportQualityManifestCandidate,
  validateReportQualityManifest,
} from "../../api/_lib/report-quality-manifest.js";
import {
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";

function visibleText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function calcByKey(candidate, calculationKey) {
  const calculation = candidate.calculations.find((entry) => entry.calculationKey === calculationKey);
  assert.ok(calculation, `missing manifest calculation ${calculationKey}`);
  return calculation;
}

function sectionByKey(candidate, sectionKey) {
  const section = candidate.sections.find((entry) => entry.sectionKey === sectionKey);
  assert.ok(section, `missing manifest section ${sectionKey}`);
  return section;
}

function provenanceTokens(value) {
  return (Array.isArray(value) ? value : [value])
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") return entry.sourceIdentityKey || entry.fileId || entry.artifactId || null;
      return null;
    })
    .filter(Boolean);
}

const fixture = buildInstitutionalGate10ReportFixture("h14-h15-full-underwriting-calculation-renderer-contract");
const baseArgs = {
  acquisitionMemoProjection: fixture.acquisitionMemoProjection,
  renderedAcquisitionMemo: fixture.renderedAcquisitionMemo,
  sourcePackage: fixture.sourcePackage,
  sourceTruthPackage: fixture.sourceTruthPackage,
  t12Payload: fixture.sourceTruthPackage.core.t12.accepted_facts,
  coreMetrics: fixture.coreMetrics,
  reportMeta: fixture.reportMeta,
  propertyProfile: fixture.propertyProfile,
  bossContract: fixture.bossContract,
  customerSurfaceModel: fixture.customerSurfaceModel,
  financialIntelligence: fixture.financialIntelligence,
};

const htmlRuns = [
  renderCompleteAcquisitionMemoV2Html(baseArgs),
  renderCompleteAcquisitionMemoV2Html(baseArgs),
  renderCompleteAcquisitionMemoV2Html(baseArgs),
];
assert.equal(new Set(htmlRuns).size, 1);
assert.equal(htmlRuns[0], fixture.html);

const htmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(fixture.html, fixture.customerSurfaceModel);
assert.equal(htmlValidation.ok, true, JSON.stringify(htmlValidation.issues, null, 2));
assert.match(visibleText(fixture.html), /Debt Capacity and Coverage/i);
assert.match(fixture.html, /Debt Service and Coverage/);
assert.match(fixture.html, /Source Register &amp; Document Treatment/);
assert.match(fixture.html, /Methodology &amp; Data Transparency/);
assert.match(fixture.html, /Lender Diligence Checklist/);
assert.match(fixture.html, /Data Coverage &amp; Source Limitations/);
assert.match(visibleText(fixture.html), /Annual Debt Service/);
assert.match(visibleText(fixture.html), /DSCR/);
assert.match(visibleText(fixture.html), /Debt Yield/);
assert.match(visibleText(fixture.html), /LTV 70\.0%/);
assert.match(visibleText(fixture.html), /Mortgage Constant/);
assert.match(visibleText(fixture.html), /Break-Even Occupancy/);
assert.match(visibleText(fixture.html), /Current Debt-Inclusive Break-Even Monthly Rent per Unit/);
assert.match(visibleText(fixture.html), /Proposed Acquisition Debt-Inclusive Break-Even Monthly Rent per Unit/);
assert.match(visibleText(fixture.html), /Annual Rent Upside \$285,600/);
assert.match(visibleText(fixture.html), /Going-In Cap Rate 7\.0%/);
assert.match(visibleText(fixture.html), /Implied value at going-in cap rate \$13,500,000/);

const debtCapacitySection = fixture.customerSurfaceModel.sections.debtCapacityAndCoverage;
assert.equal(debtCapacitySection.status, "required");
assert.equal(debtCapacitySection.factAvailability.sectionDisplayReady, true);
assert.equal(debtCapacitySection.visibleLabel, "Debt Capacity and Coverage");
assert.equal(fixture.customerSurfaceModel.sections.proposedFinancingContext.facts.ltv, 0.7);
assert.equal(fixture.customerSurfaceModel.sections.debtServiceCoverage.facts.currentDebt.annualDebtService, 471000);
assert.equal(fixture.customerSurfaceModel.sections.debtServiceCoverage.facts.currentDebt.dscr, 2.01);
assert.equal(fixture.customerSurfaceModel.sections.debtServiceCoverage.facts.proposedFinancing.annualDebtService, 676249.2);
assert.equal(fixture.customerSurfaceModel.sections.debtServiceCoverage.facts.proposedFinancing.dscr, 1.4);

const proposedDebtYield = debtCapacitySection.facts.proposedDebtYield;
assert.equal(proposedDebtYield.label, "Proposed Acquisition Debt Yield");
assert.equal(proposedDebtYield.formula, "accepted_t12_net_operating_income_divided_by_accepted_proposed_loan_amount");
assert.equal(proposedDebtYield.numerator, 945000);
assert.equal(proposedDebtYield.denominator, 9450000);
assert.equal(proposedDebtYield.result, proposedDebtYield.numerator / proposedDebtYield.denominator);
assert.equal(proposedDebtYield.sourceFamily, "T12 / purchase assumptions");
assert.ok(proposedDebtYield.inputProvenance.includes("core:file:t12-file"));
assert.ok(proposedDebtYield.inputProvenance.some((value) => /purchase-file$/i.test(String(value))));
assert.deepEqual(proposedDebtYield.inputProvenance, ["core:file:t12-file", "fileId:purchase-file"]);

const proposedMortgageConstant = debtCapacitySection.facts.proposedMortgageConstant;
assert.equal(proposedMortgageConstant.label, "Proposed Acquisition Mortgage Constant");
assert.equal(proposedMortgageConstant.formula, "accepted_annual_debt_service_divided_by_accepted_proposed_loan_amount");
assert.equal(proposedMortgageConstant.denominator, 9450000);
assert.equal(
  proposedMortgageConstant.result,
  proposedMortgageConstant.numerator / proposedMortgageConstant.denominator,
);
assert.ok(proposedMortgageConstant.inputProvenance.some((value) => /purchase-file$/i.test(String(value))));
assert.deepEqual(proposedMortgageConstant.inputProvenance, ["fileId:purchase-file"]);

const currentDebtInclusiveBreakEvenOccupancy = debtCapacitySection.facts.currentDebtInclusiveBreakEvenOccupancy;
assert.equal(currentDebtInclusiveBreakEvenOccupancy.formula, "accepted_t12_total_operating_expenses_plus_accepted_current_annual_debt_service_divided_by_accepted_t12_gross_potential_rent");
assert.equal(currentDebtInclusiveBreakEvenOccupancy.denominator, 1612800);
assert.equal(
  currentDebtInclusiveBreakEvenOccupancy.result,
  currentDebtInclusiveBreakEvenOccupancy.numerator / currentDebtInclusiveBreakEvenOccupancy.denominator,
);
assert.ok(currentDebtInclusiveBreakEvenOccupancy.inputProvenance.includes("core:file:t12-file"));
assert.ok(currentDebtInclusiveBreakEvenOccupancy.inputProvenance.some((value) => /current-debt-file$/i.test(String(value))));
assert.deepEqual(currentDebtInclusiveBreakEvenOccupancy.inputProvenance, ["core:file:t12-file", "fileId:current-debt-file"]);

const proposedDebtInclusiveBreakEvenMonthlyRentPerUnit = debtCapacitySection.facts.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit;
assert.equal(proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.formula, "accepted_t12_total_operating_expenses_plus_accepted_proposed_annual_debt_service_divided_by_accepted_total_units_divided_by_12");
assert.equal(proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.denominator, 64 * 12);
assert.equal(
  proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.result,
  proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.numerator / proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.denominator,
);
assert.deepEqual(
  proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.inputProvenance,
  ["core:file:t12-file", "fileId:purchase-file", "core:file:rent-roll-file"],
);

const modelMetrics = fixture.customerSurfaceModel.financialTruth;
assert.equal(modelMetrics.breakEvenOccupancy.label, "Break-Even Occupancy");
assert.equal(modelMetrics.breakEvenOccupancy.formula, "total_operating_expenses / gross_potential_rent");
assert.equal(modelMetrics.breakEvenOccupancy.numerator, 555000);
assert.equal(modelMetrics.breakEvenOccupancy.denominator, 1612800);
assert.equal(modelMetrics.breakEvenOccupancy.result, 555000 / 1612800);
assert.equal(modelMetrics.breakEvenOccupancy.displayReady, true);

assert.equal(modelMetrics.proposedDebtYield.numerator, 945000);
assert.equal(modelMetrics.proposedDebtYield.denominator, 9450000);
assert.equal(modelMetrics.proposedDebtYield.result, 0.1);
assert.equal(modelMetrics.proposedDebtYield.units, "ratio");
assert.deepEqual(modelMetrics.proposedDebtYield.provenance, ["core:file:t12-file", "fileId:purchase-file"]);

assert.equal(modelMetrics.proposedMortgageConstant.numerator, 676249.2);
assert.equal(modelMetrics.proposedMortgageConstant.denominator, 9450000);
assert.equal(modelMetrics.proposedMortgageConstant.result, 676249.2 / 9450000);
assert.equal(modelMetrics.proposedMortgageConstant.units, "ratio");
assert.deepEqual(modelMetrics.proposedMortgageConstant.provenance, ["fileId:purchase-file"]);

assert.equal(modelMetrics.currentDebtInclusiveBreakEvenOccupancy.numerator, 1026000);
assert.equal(modelMetrics.currentDebtInclusiveBreakEvenOccupancy.denominator, 1612800);
assert.equal(modelMetrics.currentDebtInclusiveBreakEvenOccupancy.result, 1026000 / 1612800);
assert.equal(modelMetrics.currentDebtInclusiveBreakEvenOccupancy.units, "ratio");
assert.deepEqual(modelMetrics.currentDebtInclusiveBreakEvenOccupancy.provenance, ["core:file:t12-file", "fileId:current-debt-file"]);

assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenOccupancy.numerator, 1231249.2);
assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenOccupancy.denominator, 1612800);
assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenOccupancy.result, 1231249.2 / 1612800);
assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenOccupancy.units, "ratio");
assert.deepEqual(modelMetrics.proposedDebtInclusiveBreakEvenOccupancy.provenance, ["core:file:t12-file", "fileId:purchase-file"]);

assert.equal(modelMetrics.currentDebtInclusiveBreakEvenMonthlyRentPerUnit.numerator, 1026000);
assert.equal(modelMetrics.currentDebtInclusiveBreakEvenMonthlyRentPerUnit.denominator, 768);
assert.equal(modelMetrics.currentDebtInclusiveBreakEvenMonthlyRentPerUnit.result, 1335.9375);
assert.equal(modelMetrics.currentDebtInclusiveBreakEvenMonthlyRentPerUnit.units, "currency_per_unit_per_month");
assert.deepEqual(modelMetrics.currentDebtInclusiveBreakEvenMonthlyRentPerUnit.provenance, ["core:file:t12-file", "fileId:current-debt-file", "core:file:rent-roll-file"]);

assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.numerator, 1231249.2);
assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.denominator, 768);
assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.result, 1603.1890624999999);
assert.equal(modelMetrics.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.units, "currency_per_unit_per_month");
assert.deepEqual(modelMetrics.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.provenance, ["core:file:t12-file", "fileId:purchase-file", "core:file:rent-roll-file"]);

const manifestRunSummaries = [
  fixture.customerSurfaceModel,
  structuredClone(fixture.customerSurfaceModel),
  structuredClone(fixture.customerSurfaceModel),
].map((customerSurfaceModel) => {
  const manifestCandidate = buildReportQualityManifestCandidate({
    jobId: "h14-h15-full-underwriting-calculation-renderer-contract",
    userId: "h14-h15-user",
    reportId: "h14-h15-report",
    reportFamily: "acquisition_memo",
    reportType: fixture.reportMeta.reportType,
    reportMode: fixture.reportMeta.reportMode,
    propertyName: fixture.reportMeta.propertyName,
    generatedAt: fixture.reportMeta.generatedAt,
    sourceTruthPackage: fixture.sourceTruthPackage,
    customerSurfaceModel,
    customerSurfaceModelValidation: { ok: htmlValidation.ok, issues: htmlValidation.issues },
    customerSurfaceHtmlValidation: htmlValidation,
    bossCompliance: { ok: true, status: "pass", violations: [] },
    deliveryDecision: {
      source: "canonical_delivery_decision",
      delivery_gate_status: "deliverable",
      customer_delivery_allowed: true,
      hold_delivery: false,
      reason_code: "DELIVERY_ALLOWED",
    },
  });
  const manifestValidation = validateReportQualityManifest(manifestCandidate);
  assert.equal(manifestValidation.ok, true, JSON.stringify(manifestValidation.issues, null, 2));
  return {
    calculations: manifestCandidate.calculations.map((receipt) => ({
      key: receipt.calculationKey,
      result: receipt.result,
      units: receipt.units,
      eligible: receipt.eligible,
    })),
  };
});
assert.deepEqual(manifestRunSummaries[0], manifestRunSummaries[1]);
assert.deepEqual(manifestRunSummaries[1], manifestRunSummaries[2]);

const manifestCandidate = buildReportQualityManifestCandidate({
  jobId: "h14-h15-full-underwriting-calculation-renderer-contract",
  userId: "h14-h15-user",
  reportId: "h14-h15-report",
  reportFamily: "acquisition_memo",
  reportType: fixture.reportMeta.reportType,
  reportMode: fixture.reportMeta.reportMode,
  propertyName: fixture.reportMeta.propertyName,
  generatedAt: fixture.reportMeta.generatedAt,
  sourceTruthPackage: fixture.sourceTruthPackage,
  customerSurfaceModel: fixture.customerSurfaceModel,
  customerSurfaceModelValidation: { ok: htmlValidation.ok, issues: htmlValidation.issues },
  customerSurfaceHtmlValidation: htmlValidation,
  bossCompliance: { ok: true, status: "pass", violations: [] },
  deliveryDecision: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "deliverable",
    customer_delivery_allowed: true,
    hold_delivery: false,
    reason_code: "DELIVERY_ALLOWED",
  },
});
const manifestValidation = validateReportQualityManifest(manifestCandidate);
assert.equal(manifestValidation.ok, true, JSON.stringify(manifestValidation.issues, null, 2));

const manifestDebtSection = manifestCandidate.sections.find((section) => section.sectionKey === "debtCapacityAndCoverage");
assert.equal(manifestDebtSection.outcome, "rendered");
assert.equal(manifestDebtSection.acceptedFacts.proposedDebtYield.result, proposedDebtYield.result);
assert.equal(manifestDebtSection.acceptedFacts.proposedMortgageConstant.result, proposedMortgageConstant.result);
assert.equal(sectionByKey(manifestCandidate, "debtServiceCoverage").outcome, "rendered");
assert.equal(sectionByKey(manifestCandidate, "proposedFinancingContext").acceptedFacts.ltv, 0.7);
assert.equal(sectionByKey(manifestCandidate, "rentUpsideValueSensitivity").outcome, "rendered");
assert.equal(sectionByKey(manifestCandidate, "rentUpsideValueSensitivity").sectionDisplayReady, true);
assert.equal(sectionByKey(manifestCandidate, "rentUpsideValueSensitivity").acceptedFacts.annual_rent_upside, undefined);
assert.equal(sectionByKey(manifestCandidate, "capRateValueIndication").outcome, "rendered");
assert.equal(sectionByKey(manifestCandidate, "capRateValueIndication").acceptedFacts.going_in_cap_rate, 0.07);
assert.ok(Math.abs(sectionByKey(manifestCandidate, "capRateValueIndication").acceptedFacts.implied_value_at_going_in_cap_rate - 13500000) < 1e-6);

const manifestProposedDebtYield = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedDebtYield");
assert.equal(manifestProposedDebtYield.result, proposedDebtYield.result);
assert.equal(manifestProposedDebtYield.units, "ratio");
assert.equal(manifestProposedDebtYield.label, "Proposed Acquisition Debt Yield");
assert.equal(manifestProposedDebtYield.formula, "accepted_t12_net_operating_income_divided_by_accepted_proposed_loan_amount");
assert.equal(manifestProposedDebtYield.inputs.numerator, 945000);
assert.equal(manifestProposedDebtYield.inputs.denominator, 9450000);
assert.deepEqual(manifestProposedDebtYield.inputProvenance, ["core:file:t12-file", "fileId:purchase-file", "core:file:rent-roll-file"]);

const manifestCurrentDebtBreakEven = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "currentDebtInclusiveBreakEvenOccupancy");
assert.equal(manifestCurrentDebtBreakEven.result, currentDebtInclusiveBreakEvenOccupancy.result);
assert.equal(manifestCurrentDebtBreakEven.units, "ratio");
assert.equal(manifestCurrentDebtBreakEven.label, "Current Debt-Inclusive Operating Break-Even Ratio");
assert.equal(manifestCurrentDebtBreakEven.formula, "accepted_t12_total_operating_expenses_plus_accepted_current_annual_debt_service_divided_by_accepted_t12_gross_potential_rent");
assert.equal(manifestCurrentDebtBreakEven.inputs.numerator, 1026000);
assert.equal(manifestCurrentDebtBreakEven.inputs.denominator, 1612800);
assert.deepEqual(provenanceTokens(manifestCurrentDebtBreakEven.inputProvenance), ["core:file:t12-file", "fileId:current-debt-file", "core:file:rent-roll-file"]);

const manifestMonthlyRent = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedDebtInclusiveBreakEvenMonthlyRentPerUnit");
assert.equal(manifestMonthlyRent.result, proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.result);
assert.equal(manifestMonthlyRent.units, "currency_per_unit_per_month");
assert.equal(manifestMonthlyRent.label, "Proposed Acquisition Debt-Inclusive Break-Even Monthly Rent per Unit");
assert.equal(manifestMonthlyRent.formula, "accepted_t12_total_operating_expenses_plus_accepted_proposed_annual_debt_service_divided_by_accepted_total_units_divided_by_12");
assert.equal(manifestMonthlyRent.inputs.numerator, 1231249.2);
assert.equal(manifestMonthlyRent.inputs.denominator, 768);
assert.deepEqual(provenanceTokens(manifestMonthlyRent.inputProvenance), ["core:file:t12-file", "fileId:purchase-file", "core:file:rent-roll-file"]);

const manifestCurrentDebtService = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "currentDebtAnnualDebtService");
assert.equal(manifestCurrentDebtService.result, 471000);
assert.equal(manifestCurrentDebtService.units, "currency_per_year");
assert.equal(manifestCurrentDebtService.formula, "accepted_monthly_payment_times_12");
assert.equal(manifestCurrentDebtService.inputs.monthlyDebtService, 39250);
assert.equal(manifestCurrentDebtService.inputs.annualDebtService, 471000);
assert.deepEqual(provenanceTokens(manifestCurrentDebtService.inputProvenance), ["file:current-debt-file"]);

const manifestProposedDebtService = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedFinancingAnnualDebtService");
assert.equal(manifestProposedDebtService.result, 676249.2);
assert.equal(manifestProposedDebtService.units, "currency_per_year");
assert.equal(manifestProposedDebtService.formula, "principal_times_periodic_rate_divided_by_one_minus_one_plus_periodic_rate_to_negative_total_periods");
assert.equal(manifestProposedDebtService.inputs.monthlyDebtService, 56354.1);
assert.equal(manifestProposedDebtService.inputs.annualDebtService, 676249.2);
assert.deepEqual(provenanceTokens(manifestProposedDebtService.inputProvenance), ["file:purchase-file", "file:purchase-file", "file:purchase-file"]);

const manifestCurrentDscr = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "currentDebtDscr");
assert.equal(manifestCurrentDscr.result, 2.006369);
assert.equal(manifestCurrentDscr.units, "ratio_x");
assert.equal(manifestCurrentDscr.formula, "accepted_annual_noi_divided_by_deterministic_annual_debt_service");
assert.equal(manifestCurrentDscr.inputs.annualNetOperatingIncome, 945000);
assert.equal(manifestCurrentDscr.inputs.annualDebtService, 471000);
assert.deepEqual(provenanceTokens(manifestCurrentDscr.inputProvenance), ["file:t12-file", "file:current-debt-file"]);

const manifestProposedDscr = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedFinancingDscr");
assert.equal(manifestProposedDscr.result, 1.397414);
assert.equal(manifestProposedDscr.units, "ratio_x");
assert.equal(manifestProposedDscr.formula, "accepted_annual_noi_divided_by_deterministic_annual_debt_service");
assert.equal(manifestProposedDscr.inputs.annualNetOperatingIncome, 945000);
assert.equal(manifestProposedDscr.inputs.annualDebtService, 676249.2);
assert.deepEqual(provenanceTokens(manifestProposedDscr.inputProvenance), ["file:t12-file", "file:purchase-file", "file:purchase-file", "file:purchase-file"]);

const manifestBreakEven = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "breakEvenOccupancy");
assert.equal(manifestBreakEven.result, modelMetrics.breakEvenOccupancy.result);
assert.equal(manifestBreakEven.units, "ratio");
assert.equal(manifestBreakEven.formula, "total_operating_expenses / gross_potential_rent");
assert.equal(manifestBreakEven.inputs.numerator, 555000);
assert.equal(manifestBreakEven.inputs.denominator, 1612800);
assert.deepEqual(manifestBreakEven.inputProvenance, ["core:file:t12-file", "core:file:rent-roll-file"]);

const manifestDebtYield = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedDebtYield");
assert.equal(manifestDebtYield.result, modelMetrics.proposedDebtYield.result);
assert.equal(manifestDebtYield.units, "ratio");
assert.equal(manifestDebtYield.formula, "accepted_t12_net_operating_income_divided_by_accepted_proposed_loan_amount");
assert.equal(manifestDebtYield.inputs.numerator, 945000);
assert.equal(manifestDebtYield.inputs.denominator, 9450000);
assert.deepEqual(manifestDebtYield.inputProvenance, ["core:file:t12-file", "fileId:purchase-file", "core:file:rent-roll-file"]);

const manifestMortgageConstant = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedMortgageConstant");
assert.equal(manifestMortgageConstant.result, modelMetrics.proposedMortgageConstant.result);
assert.equal(manifestMortgageConstant.units, "ratio");
assert.equal(manifestMortgageConstant.formula, "accepted_annual_debt_service_divided_by_accepted_proposed_loan_amount");
assert.equal(manifestMortgageConstant.inputs.numerator, 676249.2);
assert.equal(manifestMortgageConstant.inputs.denominator, 9450000);
assert.deepEqual(manifestMortgageConstant.inputProvenance, ["fileId:purchase-file", "core:file:t12-file", "core:file:rent-roll-file"]);

const manifestCurrentDebtInclusiveBreakEvenOccupancy = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "currentDebtInclusiveBreakEvenOccupancy");
assert.equal(manifestCurrentDebtInclusiveBreakEvenOccupancy.result, modelMetrics.currentDebtInclusiveBreakEvenOccupancy.result);
assert.equal(manifestCurrentDebtInclusiveBreakEvenOccupancy.units, "ratio");
assert.equal(manifestCurrentDebtInclusiveBreakEvenOccupancy.formula, "accepted_t12_total_operating_expenses_plus_accepted_current_annual_debt_service_divided_by_accepted_t12_gross_potential_rent");
assert.equal(manifestCurrentDebtInclusiveBreakEvenOccupancy.inputs.numerator, 1026000);
assert.equal(manifestCurrentDebtInclusiveBreakEvenOccupancy.inputs.denominator, 1612800);
assert.deepEqual(provenanceTokens(manifestCurrentDebtInclusiveBreakEvenOccupancy.inputProvenance), ["core:file:t12-file", "fileId:current-debt-file", "core:file:rent-roll-file"]);

const manifestProposedDebtInclusiveBreakEvenOccupancy = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedDebtInclusiveBreakEvenOccupancy");
assert.equal(manifestProposedDebtInclusiveBreakEvenOccupancy.result, modelMetrics.proposedDebtInclusiveBreakEvenOccupancy.result);
assert.equal(manifestProposedDebtInclusiveBreakEvenOccupancy.units, "ratio");
assert.equal(manifestProposedDebtInclusiveBreakEvenOccupancy.formula, "accepted_t12_total_operating_expenses_plus_accepted_proposed_annual_debt_service_divided_by_accepted_t12_gross_potential_rent");
assert.equal(manifestProposedDebtInclusiveBreakEvenOccupancy.inputs.numerator, 1231249.2);
assert.equal(manifestProposedDebtInclusiveBreakEvenOccupancy.inputs.denominator, 1612800);
assert.deepEqual(provenanceTokens(manifestProposedDebtInclusiveBreakEvenOccupancy.inputProvenance), ["core:file:t12-file", "fileId:purchase-file", "core:file:rent-roll-file"]);

const manifestCurrentDebtInclusiveMonthlyRent = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "currentDebtInclusiveBreakEvenMonthlyRentPerUnit");
assert.equal(manifestCurrentDebtInclusiveMonthlyRent.result, modelMetrics.currentDebtInclusiveBreakEvenMonthlyRentPerUnit.result);
assert.equal(manifestCurrentDebtInclusiveMonthlyRent.units, "currency_per_unit_per_month");
assert.equal(manifestCurrentDebtInclusiveMonthlyRent.formula, "accepted_t12_total_operating_expenses_plus_accepted_current_annual_debt_service_divided_by_accepted_total_units_divided_by_12");
assert.equal(manifestCurrentDebtInclusiveMonthlyRent.inputs.numerator, 1026000);
assert.equal(manifestCurrentDebtInclusiveMonthlyRent.inputs.denominator, 768);
assert.deepEqual(provenanceTokens(manifestCurrentDebtInclusiveMonthlyRent.inputProvenance), ["core:file:t12-file", "fileId:current-debt-file", "core:file:rent-roll-file"]);

const manifestProposedDebtInclusiveMonthlyRent = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedDebtInclusiveBreakEvenMonthlyRentPerUnit");
assert.equal(manifestProposedDebtInclusiveMonthlyRent.result, modelMetrics.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.result);
assert.equal(manifestProposedDebtInclusiveMonthlyRent.units, "currency_per_unit_per_month");
assert.equal(manifestProposedDebtInclusiveMonthlyRent.formula, "accepted_t12_total_operating_expenses_plus_accepted_proposed_annual_debt_service_divided_by_accepted_total_units_divided_by_12");
assert.equal(manifestProposedDebtInclusiveMonthlyRent.inputs.numerator, 1231249.2);
assert.equal(manifestProposedDebtInclusiveMonthlyRent.inputs.denominator, 768);
assert.deepEqual(provenanceTokens(manifestProposedDebtInclusiveMonthlyRent.inputProvenance), ["core:file:t12-file", "fileId:purchase-file", "core:file:rent-roll-file"]);

const manifestLtvSection = sectionByKey(manifestCandidate, "proposedFinancingContext");
assert.equal(manifestLtvSection.outcome, "rendered");
assert.equal(manifestLtvSection.acceptedFacts.ltv, 0.7);
assert.deepEqual(manifestLtvSection.sourceIdentityKeys, ["support:file:purchase-file"]);

const unsupportedAnalyses = ["rateSensitivity", "noiSensitivity", "capRateValueSensitivity", "rolloverConcentration", "expiryConcentration"];
for (const key of unsupportedAnalyses) {
  assert.equal(fixture.customerSurfaceModel.sections[key], undefined, `unexpected unsupported section ${key}`);
}
assert.doesNotMatch(visibleText(fixture.html), /rate sensitivity/i);
assert.doesNotMatch(visibleText(fixture.html), /noi sensitivity/i);
assert.doesNotMatch(visibleText(fixture.html), /cap rate sensitivity/i);
assert.doesNotMatch(visibleText(fixture.html), /rollover concentration/i);
assert.doesNotMatch(visibleText(fixture.html), /expiry concentration/i);

const collapsedDebtCapacityModel = structuredClone(fixture.customerSurfaceModel);
collapsedDebtCapacityModel.sections.debtCapacityAndCoverage = {
  ...collapsedDebtCapacityModel.sections.debtCapacityAndCoverage,
  status: "collapsed",
  displayReady: false,
  factAvailability: {
    ...collapsedDebtCapacityModel.sections.debtCapacityAndCoverage.factAvailability,
    sectionDisplayReady: false,
    sourceBacked: false,
  },
};
const collapsedHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  customerSurfaceModel: collapsedDebtCapacityModel,
});
assert.match(visibleText(collapsedHtml), /section was omitted because the uploaded support context did not provide display-ready detail/i);
assert.doesNotMatch(visibleText(collapsedHtml), /Proposed Acquisition Debt Yield/i);

const invalidDenominatorModel = structuredClone(fixture.customerSurfaceModel);
invalidDenominatorModel.financialTruth.breakEvenOccupancy = {
  ...invalidDenominatorModel.financialTruth.breakEvenOccupancy,
  denominator: 0,
  result: null,
  displayReady: false,
};
const invalidDenominatorCandidate = buildReportQualityManifestCandidate({
  jobId: "h14-h15-full-underwriting-calculation-renderer-contract-invalid-denominator",
  userId: "h14-h15-user",
  reportId: "h14-h15-report-invalid-denominator",
  reportFamily: "acquisition_memo",
  reportType: fixture.reportMeta.reportType,
  reportMode: fixture.reportMeta.reportMode,
  propertyName: fixture.reportMeta.propertyName,
  generatedAt: fixture.reportMeta.generatedAt,
  sourceTruthPackage: fixture.sourceTruthPackage,
  customerSurfaceModel: invalidDenominatorModel,
  customerSurfaceModelValidation: { ok: true, issues: [] },
  customerSurfaceHtmlValidation: { ok: true, issues: [] },
  bossCompliance: { ok: true, status: "pass", violations: [] },
  deliveryDecision: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "deliverable",
    customer_delivery_allowed: true,
    hold_delivery: false,
    reason_code: "DELIVERY_ALLOWED",
  },
});
const invalidDenominatorValidation = validateReportQualityManifest(invalidDenominatorCandidate);
assert.equal(invalidDenominatorValidation.ok, true);
assert.equal(calcByKey(invalidDenominatorCandidate, "breakEvenOccupancy").eligible, false);
assert.equal(calcByKey(invalidDenominatorCandidate, "breakEvenOccupancy").result, null);

assert.doesNotMatch(visibleText(fixture.html), /\bBUY\b/);
assert.doesNotMatch(visibleText(fixture.html), /\bSELL\b/);
assert.doesNotMatch(visibleText(fixture.html), /\bHOLD\b\s*(?:recommendation|signal|rating)\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\binvestment recommendation\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\blender approval\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\bcommitment claim\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\bIRR\b/);
assert.doesNotMatch(visibleText(fixture.html), /\bequity multiple\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\bexit projection\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\bappraisal certification\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\blegal certification\b/i);
assert.doesNotMatch(visibleText(fixture.html), /\benvironmental certification\b/i);

console.log("h14-h15-full-underwriting-calculation-renderer-contract smoke PASS");