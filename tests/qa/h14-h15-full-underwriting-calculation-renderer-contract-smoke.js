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

const fixture = buildInstitutionalGate10ReportFixture("h14-h15-full-underwriting-calculation-renderer-contract");
const baseArgs = {
  acquisitionMemoProjection: fixture.acquisitionMemoProjection,
  renderedAcquisitionMemo: fixture.renderedAcquisitionMemo,
  sourcePackage: fixture.sourcePackage,
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

const debtCapacitySection = fixture.customerSurfaceModel.sections.debtCapacityAndCoverage;
assert.equal(debtCapacitySection.status, "required");
assert.equal(debtCapacitySection.factAvailability.sectionDisplayReady, true);
assert.equal(debtCapacitySection.visibleLabel, "Debt Capacity and Coverage");

const proposedDebtYield = debtCapacitySection.facts.proposedDebtYield;
assert.equal(proposedDebtYield.label, "Proposed Acquisition Debt Yield");
assert.equal(proposedDebtYield.formula, "accepted_t12_net_operating_income_divided_by_accepted_proposed_loan_amount");
assert.equal(proposedDebtYield.numerator, 945000);
assert.equal(proposedDebtYield.denominator, 9450000);
assert.equal(proposedDebtYield.result, proposedDebtYield.numerator / proposedDebtYield.denominator);
assert.equal(proposedDebtYield.sourceFamily, "T12 / purchase assumptions");
assert.ok(proposedDebtYield.inputProvenance.includes("core:file:t12-file"));
assert.ok(proposedDebtYield.inputProvenance.some((value) => /purchase-file$/i.test(String(value))));

const proposedMortgageConstant = debtCapacitySection.facts.proposedMortgageConstant;
assert.equal(proposedMortgageConstant.label, "Proposed Acquisition Mortgage Constant");
assert.equal(proposedMortgageConstant.formula, "accepted_annual_debt_service_divided_by_accepted_proposed_loan_amount");
assert.equal(proposedMortgageConstant.denominator, 9450000);
assert.equal(
  proposedMortgageConstant.result,
  proposedMortgageConstant.numerator / proposedMortgageConstant.denominator,
);
assert.ok(proposedMortgageConstant.inputProvenance.some((value) => /purchase-file$/i.test(String(value))));

const currentDebtInclusiveBreakEvenOccupancy = debtCapacitySection.facts.currentDebtInclusiveBreakEvenOccupancy;
assert.equal(currentDebtInclusiveBreakEvenOccupancy.formula, "accepted_t12_total_operating_expenses_plus_accepted_current_annual_debt_service_divided_by_accepted_t12_gross_potential_rent");
assert.equal(currentDebtInclusiveBreakEvenOccupancy.denominator, 1612800);
assert.equal(
  currentDebtInclusiveBreakEvenOccupancy.result,
  currentDebtInclusiveBreakEvenOccupancy.numerator / currentDebtInclusiveBreakEvenOccupancy.denominator,
);
assert.ok(currentDebtInclusiveBreakEvenOccupancy.inputProvenance.includes("core:file:t12-file"));
assert.ok(currentDebtInclusiveBreakEvenOccupancy.inputProvenance.some((value) => /current-debt-file$/i.test(String(value))));

const proposedDebtInclusiveBreakEvenMonthlyRentPerUnit = debtCapacitySection.facts.proposedDebtInclusiveBreakEvenMonthlyRentPerUnit;
assert.equal(proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.formula, "accepted_t12_total_operating_expenses_plus_accepted_proposed_annual_debt_service_divided_by_accepted_total_units_divided_by_12");
assert.equal(proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.denominator, 64 * 12);
assert.equal(
  proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.result,
  proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.numerator / proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.denominator,
);

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

const manifestProposedDebtYield = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedDebtYield");
assert.equal(manifestProposedDebtYield.result, proposedDebtYield.result);
assert.equal(manifestProposedDebtYield.units, "ratio");
assert.ok(manifestProposedDebtYield.inputProvenance.includes("core:file:t12-file"));
assert.ok(manifestProposedDebtYield.inputProvenance.some((value) => /purchase-file$/i.test(String(value))));

const manifestCurrentDebtBreakEven = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "currentDebtInclusiveBreakEvenOccupancy");
assert.equal(manifestCurrentDebtBreakEven.result, currentDebtInclusiveBreakEvenOccupancy.result);
assert.equal(manifestCurrentDebtBreakEven.units, "ratio");
assert.ok(manifestCurrentDebtBreakEven.inputProvenance.includes("core:file:t12-file"));
assert.ok(manifestCurrentDebtBreakEven.inputProvenance.some((value) => /current-debt-file$/i.test(String(value))));

const manifestMonthlyRent = manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "proposedDebtInclusiveBreakEvenMonthlyRentPerUnit");
assert.equal(manifestMonthlyRent.result, proposedDebtInclusiveBreakEvenMonthlyRentPerUnit.result);
assert.equal(manifestMonthlyRent.units, "currency_per_unit_per_month");
assert.ok(manifestMonthlyRent.inputProvenance.includes("core:file:t12-file"));
assert.ok(manifestMonthlyRent.inputProvenance.some((value) => /rent-roll-file$/i.test(String(value))));

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

console.log("h14-h15-full-underwriting-calculation-renderer-contract smoke PASS");
