import assert from "node:assert/strict";

import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";
import {
  buildCanonicalReportIdentityReceipt,
} from "../../api/_lib/report-identity-authority.js";
import { resolveReportTypeAndTier } from "../../api/_lib/report-request-context.js";
import {
  buildDeterministicReportContractQaSeal,
} from "../../api/_lib/deterministic-report-contract-qa-seal.js";
import {
  buildReportQualityManifestCandidate,
  validateReportQualityManifest,
} from "../../api/_lib/report-quality-manifest.js";
import {
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";

const deliverableDecision = {
  source: "canonical_delivery_decision",
  delivery_gate_status: "deliverable",
  customer_delivery_allowed: true,
  hold_delivery: false,
  reason_code: "DELIVERY_ALLOWED",
};

const jobId = "h12-h13-full-underwriting-identity-source-binding";
const fixture = buildInstitutionalGate10ReportFixture(jobId);
const canonicalIdentityReceipt = buildCanonicalReportIdentityReceipt({
  reportMode: fixture.reportMeta.reportMode,
  reportType: fixture.reportMeta.reportType,
});
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

const underwritingResolution = resolveReportTypeAndTier({ bodyReportType: "underwriting" });
assert.equal(underwritingResolution.ok, true);
assert.equal(underwritingResolution.reportType, "underwriting");
assert.equal(underwritingResolution.reportTier, 2);
assert.equal(underwritingResolution.effectiveReportMode, "v1_core");

const screeningResolution = resolveReportTypeAndTier({ bodyReportType: "screening" });
assert.equal(screeningResolution.ok, true);
assert.equal(screeningResolution.reportType, "screening");
assert.equal(screeningResolution.reportTier, 1);
assert.equal(screeningResolution.effectiveReportMode, "screening_v1");

const legacyAliasResolution = resolveReportTypeAndTier({ bodyReportType: "acquisition_memo" });
assert.equal(legacyAliasResolution.ok, false);
assert.equal(legacyAliasResolution.explicitUnknown, true);

assert.equal(canonicalIdentityReceipt.reportFamily, "full_underwriting");
assert.equal(canonicalIdentityReceipt.reportMode, "v1_core");
assert.equal(canonicalIdentityReceipt.reportType, "underwriting");
assert.equal(canonicalIdentityReceipt.reportTier, 2);

assert.equal(fixture.reportMeta.reportType, "underwriting");
assert.equal(fixture.reportMeta.reportMode, "v1_core");
assert.equal(fixture.reportMeta.reportTier, 2);
assert.equal(fixture.customerSurfaceModel.reportMode, "v1_core");
assert.equal(fixture.customerSurfaceModel.identity.reportType, "underwriting");
assert.equal(fixture.customerSurfaceModel.identity.reportTier, 2);
assert.equal(fixture.customerSurfaceModel.sourceTruth.accepted.purchaseAssumptionsPresent, true);
assert.equal(fixture.customerSurfaceModel.sourceTruth.accepted.currentDebtPresent, true);
assert.equal(fixture.customerSurfaceModel.sourceTruth.coreT12.extractedFacts.net_operating_income, 945000);
assert.equal(fixture.customerSurfaceModel.sourceTruth.coreRentRoll.extractedFacts.total_units, 64);
assert.equal(fixture.customerSurfaceModel.sourceBackedFacts.acquisitionRequestContext.purchase_price, 13500000);
assert.equal(fixture.customerSurfaceModel.sourceBackedFacts.currentDebtContext.current_outstanding_balance, 6800000);
assert.equal(fixture.customerSurfaceModel.sourceBackedFacts.unitMix.total_units, 64);
assert.equal(fixture.customerSurfaceModel.sourceBackedFacts.capRateValueIndication.going_in_cap_rate, 0.07);
assert.equal(fixture.customerSurfaceModel.financialTruth.breakEvenOccupancy.numerator, 555000);
assert.equal(fixture.customerSurfaceModel.financialTruth.breakEvenOccupancy.denominator, 1612800);
assert.equal(fixture.customerSurfaceModel.financialTruth.breakEvenOccupancy.result, 555000 / 1612800);
assert.equal(fixture.customerSurfaceModel.financialTruth.breakEvenOccupancy.displayReady, true);

const htmlRuns = [
  renderCompleteAcquisitionMemoV2Html(baseArgs),
  renderCompleteAcquisitionMemoV2Html(baseArgs),
  renderCompleteAcquisitionMemoV2Html(baseArgs),
];
assert.equal(new Set(htmlRuns).size, 1);
const html = htmlRuns[0];
assert.equal(html, fixture.html);


const htmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, fixture.customerSurfaceModel);
assert.equal(htmlValidation.ok, true, JSON.stringify(htmlValidation.issues, null, 2));

const canonicalSeal = buildDeterministicReportContractQaSeal({
  html,
  reportIdentity: canonicalIdentityReceipt,
  sourceReconciliation: fixture.customerSurfaceModel.sourceTruth.sourceReconciliation,
  breakEven: fixture.customerSurfaceModel.financialTruth.breakEvenOccupancy,
  supportSections: fixture.customerSurfaceModel.sections,
  financialIntelligence: fixture.customerSurfaceModel.financialIntelligence,
});
assert.equal(canonicalSeal.ok, true, JSON.stringify(canonicalSeal.issues, null, 2));
assert.equal(canonicalSeal.status, "pass");
assert.deepEqual(canonicalSeal.report_identity, canonicalIdentityReceipt);

const screeningSeal = buildDeterministicReportContractQaSeal({
  html,
  reportIdentity: {
    reportMode: "screening_v1",
    reportType: "screening",
    reportTier: 1,
  },
  sourceReconciliation: fixture.customerSurfaceModel.sourceTruth.sourceReconciliation,
  breakEven: fixture.customerSurfaceModel.financialTruth.breakEvenOccupancy,
  supportSections: fixture.customerSurfaceModel.sections,
  financialIntelligence: fixture.customerSurfaceModel.financialIntelligence,
});
assert.equal(screeningSeal.ok, false);
assert.ok(
  screeningSeal.issues.some((issue) => issue.code === "SCREENING_VISIBLE_IDENTITY_MISMATCH"),
  JSON.stringify(screeningSeal.issues, null, 2),
);

const manifestCandidate = buildReportQualityManifestCandidate({
  jobId,
  userId: "h12-h13-user",
  reportId: "h12-h13-report",
  reportFamily: "full_underwriting",
  reportType: fixture.reportMeta.reportType,
  reportMode: fixture.reportMeta.reportMode,
  propertyName: fixture.reportMeta.propertyName,
  generatedAt: fixture.reportMeta.generatedAt,
  sourceTruthPackage: fixture.sourceTruthPackage,
  customerSurfaceModel: fixture.customerSurfaceModel,
  customerSurfaceModelValidation: { ok: htmlValidation.ok, issues: htmlValidation.issues },
  customerSurfaceHtmlValidation: htmlValidation,
  deterministicContractQaSeal: canonicalSeal,
  bossCompliance: { ok: true, status: "pass", violations: [] },
  deliveryDecision: deliverableDecision,
});
assert.equal(validateReportQualityManifest(manifestCandidate).ok, true, JSON.stringify(validateReportQualityManifest(manifestCandidate).issues, null, 2));
assert.equal(manifestCandidate.report.reportFamily, "full_underwriting");
assert.equal(manifestCandidate.report.reportType, "underwriting");
assert.equal(manifestCandidate.report.reportMode, "v1_core");
assert.equal(manifestCandidate.receipts.sourceTruth.source, "canonical_source_truth_package");
assert.equal(manifestCandidate.receipts.customerSurfaceModel.validation.ok, true);
assert.equal(manifestCandidate.receipts.customerSurfaceModel.htmlValidation.ok, true);
assert.equal(manifestCandidate.receipts.deterministicContractQaSeal.ok, true);
assert.equal(manifestCandidate.receipts.deliveryGate.source, "canonical_delivery_decision");
assert.equal(manifestCandidate.sections.find((section) => section.sectionKey === "unitMix").acceptedFacts.occupancy, 0.9375);
assert.equal(manifestCandidate.sections.find((section) => section.sectionKey === "capRateValueIndication").acceptedFacts.implied_value_at_going_in_cap_rate, 13499999.999999998);
assert.equal(manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "breakEvenOccupancy").inputs.numerator, 555000);
assert.equal(manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "breakEvenOccupancy").inputs.denominator, 1612800);
assert.equal(manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "breakEvenOccupancy").result, 555000 / 1612800);
assert.deepEqual(
  [...manifestCandidate.calculations.find((calculation) => calculation.calculationKey === "breakEvenOccupancy").inputProvenance].sort(),
  ["core:file:rent-roll-file", "core:file:t12-file"],
);

console.log("h12-h13-full-underwriting-identity-source-binding smoke PASS");
