import assert from "node:assert/strict";

import {
  buildCanonicalSourceTruthPackage,
  constrainCanonicalSourcePackageToSourceTruth,
} from "../../api/_lib/source-truth-package.js";
import { buildCanonicalInstitutionalFinancialIntelligence } from "../../api/_lib/institutional-financial-intelligence.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import { buildAcquisitionMemoBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import { buildAcquisitionMemoV2CustomerSurfaceModel } from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import {
  renderAcquisitionMemo,
  renderCompleteAcquisitionMemoV2Html,
} from "../../api/_lib/acquisition-memo-v2-document.js";
import { buildDeterministicReportContractQaSeal } from "../../api/_lib/deterministic-report-contract-qa-seal.js";

const canonicalDisclosure = "InvestorIQ has not reconciled this variance and does not infer the cause.";
const artifacts = [
  {
    id: "retest29-t12-artifact",
    type: "t12_parsed",
    payload: {
      file_id: "retest29-t12-file",
      source_original_filename: "Operating Statement.xlsx",
      validated: true,
      gross_potential_rent: 1612800,
      effective_gross_income: 1500000,
      total_operating_expenses: 555000,
      net_operating_income: 945000,
      income_lines: [{ label: "Effective Gross Income", amount: 1500000 }],
      expense_lines: [{ label: "Operating Expenses", amount: 555000 }],
      core_t12_validation: { ok: true, failures: [] },
    },
  },
  {
    id: "retest29-rent-roll-artifact",
    type: "rent_roll_parsed",
    payload: {
      file_id: "retest29-rent-roll-file",
      source_original_filename: "Rent Roll.xlsx",
      validated: true,
      total_units: 64,
      occupied_units: 60,
      occupancy: 0.9375,
      annual_in_place_rent: 1432800,
      annual_market_rent: 1718400,
      unit_mix: [{ label: "All Units", count: 64, in_place_rent: 1865.625, market_rent: 2237.5 }],
      units: Array.from({ length: 64 }, (_, index) => ({
        unit: String(index + 1),
        status: index < 60 ? "Occupied" : "Vacant",
        in_place_rent: 1865.625,
        market_rent: 2237.5,
      })),
    },
  },
];

const sourceTruthPackage = buildCanonicalSourceTruthPackage({
  jobId: "retest29-publish-or-collapse",
  propertyName: "Publish or Collapse Regression",
  artifacts,
});
assert.equal(sourceTruthPackage.core_publishable, true);
assert.deepEqual(sourceTruthPackage.true_blockers, []);
assert.equal(sourceTruthPackage.source_reconciliation_state.status, "source_reconciliation_required");
assert.equal(sourceTruthPackage.source_reconciliation_state.source_reconciliation_disclosure, canonicalDisclosure);

const canonicalSourcePackage = constrainCanonicalSourcePackageToSourceTruth(null, sourceTruthPackage);
const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
  sourceTruthPackage,
  asOfDate: "2026-07-17",
});
const financialIntelligenceExplanation =
  financialIntelligence.analyses.coreReconciliation.reconciliation.sourceBoundExplanation;
assert.notEqual(financialIntelligenceExplanation, canonicalDisclosure);

const acquisitionMemoProjection = buildAcquisitionMemoProjection(canonicalSourcePackage, {
  financialIntelligence,
});
assert.equal(
  acquisitionMemoProjection.sourceReconciliation.state.source_reconciliation_disclosure,
  canonicalDisclosure,
  "Financial Intelligence may explain accepted facts but may not replace canonical Source Truth disclosure authority."
);
assert.deepEqual(acquisitionMemoProjection.sourceReconciliation.disclosures, sourceTruthPackage.disclosures);

const coreMetrics = {
  units: 64,
  occupancy: 0.9375,
  annualInPlaceRent: 1432800,
  annualMarketRent: 1718400,
  egi: 1500000,
  opEx: 555000,
  noi: 945000,
  expenseRatio: 555000 / 1500000,
  noiMargin: 945000 / 1500000,
  breakEvenOccupancy: 555000 / 1612800,
};
const reportMeta = {
  reportType: "underwriting",
  reportMode: "v1_core",
  reportTier: 2,
  propertyName: "Publish or Collapse Regression",
  generatedAt: "2026-07-17T00:00:00.000Z",
};
const propertyProfile = {
  propertyName: "Publish or Collapse Regression",
  assetClass: "Multifamily",
};
const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage,
  sourceTruthPackage,
  acquisitionMemoProjection,
  financialIntelligence,
  coreMetrics,
  t12Payload: artifacts[0].payload,
  reportMeta,
  propertyProfile,
  reportMode: "v1_core",
});
assert.equal(
  bossContract.sourceTruth.sourceReconciliation.state.source_reconciliation_disclosure,
  canonicalDisclosure
);
assert.equal(bossContract.sections.primaryConstraintReviewDisclosure.status, "collapsed");

const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage,
  acquisitionMemoProjection,
  bossContract,
  financialIntelligence,
  coreMetrics,
  propertyProfile,
  reportMeta,
  reportMode: "v1_core",
});
const finalHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection,
  renderedAcquisitionMemo: renderAcquisitionMemo(acquisitionMemoProjection),
  sourcePackage: canonicalSourcePackage,
  coreMetrics,
  reportMeta,
  propertyProfile,
  bossContract,
  customerSurfaceModel,
  financialIntelligence,
});

assert.match(finalHtml, new RegExp(canonicalDisclosure.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
assert.doesNotMatch(finalHtml, /Primary Constraint \/ Review Disclosure/i);
assert.doesNotMatch(
  finalHtml,
  /<section class="section section-break">\s*<div class="section-header">[\s\S]{0,300}?Primary Constraint \/ Review Disclosure[\s\S]{0,500}?<section class="section section-break">/i,
  "The collapsed optional constraint must not create a nested forced page break."
);

const deterministicSeal = buildDeterministicReportContractQaSeal({
  html: finalHtml,
  reportIdentity: { reportMode: "v1_core", reportType: "underwriting", reportTier: 2 },
  sourceReconciliation: {
    state: sourceTruthPackage.source_reconciliation_state,
    disclosures: sourceTruthPackage.disclosures,
    sourceBacked: true,
  },
  breakEven: customerSurfaceModel.financialTruth.breakEvenOccupancy,
  supportSections: customerSurfaceModel.sections,
  financialIntelligence,
  grossRentCapitalizationAuthorized: false,
});
assert.equal(deterministicSeal.ok, true, JSON.stringify(deterministicSeal.issues, null, 2));
assert.equal(
  deterministicSeal.issues.some((issue) => issue.code === "REQUIRED_RECONCILIATION_DISCLOSURE_MISSING"),
  false
);

console.log("RETEST 29 publish-or-collapse regression smoke PASS");
