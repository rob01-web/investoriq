import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildCanonicalSourceTruthPackage,
  constrainCanonicalSourcePackageToSourceTruth,
} from "../../api/_lib/source-truth-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import {
  buildAcquisitionMemoBossContract,
  validateAcquisitionMemoBossContract,
} from "../../api/_lib/acquisition-memo-boss-contract.js";
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
} from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import {
  renderAcquisitionMemo,
  renderCompleteAcquisitionMemoV2Html,
} from "../../api/_lib/acquisition-memo-v2-document.js";
import { formatCurrency } from "../../api/_lib/report-formatting-helpers.js";

const disclosure = "InvestorIQ has not reconciled this variance and does not infer the cause.";
const artifacts = [
  {
    id: "p0a-t12-artifact",
    type: "t12_parsed",
    payload: {
      file_id: "p0a-t12-file",
      source_original_filename: "Stonebridge_T12.xlsx",
      gross_potential_rent: 1612800,
      effective_gross_income: 1500000,
      total_operating_expenses: 555000,
      net_operating_income: 945000,
      income_lines: [{ label: "Gross Potential Rent", amount: 1612800 }],
      expense_lines: [{ label: "Operating Expenses", amount: 555000 }],
      core_t12_validation: { ok: true, failures: [] },
    },
  },
  {
    id: "p0a-rent-roll-artifact",
    type: "rent_roll_parsed",
    payload: {
      file_id: "p0a-rent-roll-file",
      source_original_filename: "Stonebridge_Rent_Roll.xlsx",
      total_units: 64,
      occupied_units: 60,
      occupancy: 0.9375,
      annual_in_place_rent: 1432800,
      annual_market_rent: 1718400,
      unit_mix: [
        { label: "1BR", count: 32, in_place_rent: 1850, market_rent: 2050 },
        { label: "2BR", count: 32, in_place_rent: 1881.25, market_rent: 2425 },
      ],
      units: Array.from({ length: 64 }, (_, index) => ({
        unit: String(index + 1),
        status: index < 60 ? "Occupied" : "Vacant",
        in_place_rent: index < 32 ? 1850 : 1881.25,
        market_rent: index < 32 ? 2050 : 2425,
      })),
    },
  },
];

const sourceTruth = buildCanonicalSourceTruthPackage({
  jobId: "p0a-financial-truth",
  propertyName: "Stonebridge",
  artifacts,
});
assert.equal(sourceTruth.core_publishable, true);
assert.equal(sourceTruth.source_reconciliation_state.status, "source_reconciliation_required");
assert.equal(sourceTruth.source_reconciliation_state.t12_gpr, 1612800);
assert.equal(sourceTruth.source_reconciliation_state.rr_annual_in_place, 1432800);
assert.equal(sourceTruth.source_reconciliation_state.difference_amount, -180000);
assert.equal(sourceTruth.source_reconciliation_state.absolute_difference_amount, 180000);
assert.ok(Math.abs(sourceTruth.source_reconciliation_state.variance_pct - (-180000 / 1612800)) < 1e-12);
assert.equal(sourceTruth.source_reconciliation_state.source_reconciliation_disclosure, disclosure);

const canonicalSourcePackage = constrainCanonicalSourcePackageToSourceTruth(null, sourceTruth);
assert.deepEqual(canonicalSourcePackage.sourceTruthAuthority.source_reconciliation_state, sourceTruth.source_reconciliation_state);
assert.deepEqual(canonicalSourcePackage.sourceTruthAuthority.disclosures, sourceTruth.disclosures);

const projection = buildAcquisitionMemoProjection(canonicalSourcePackage);
assert.equal(projection.sourceReconciliation.sourceBacked, true);
assert.equal(projection.sourceReconciliation.state.difference_amount, -180000);
assert.equal(projection.sourceReconciliation.state.source_reconciliation_disclosure, disclosure);

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
  visibleClassification: "Review - Source Reconciliation Disclosure",
  propertyName: "Stonebridge",
  generatedAt: "2026-07-15T00:00:00.000Z",
};
const propertyProfile = { propertyName: "Stonebridge", assetClass: "Multifamily" };
const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage,
  sourceTruthPackage: sourceTruth,
  acquisitionMemoProjection: projection,
  coreMetrics,
  t12Payload: artifacts[0].payload,
  reportMeta,
  propertyProfile,
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoBossContract(bossContract).ok, true);
assert.equal(bossContract.sourceTruth.sourceReconciliation.sourceBacked, true);
assert.equal(bossContract.sourceTruth.sourceReconciliation.state.difference_amount, -180000);
assert.equal(bossContract.sections.primaryConstraintReviewDisclosure.status, "required");
assert.equal(bossContract.sections.primaryConstraintReviewDisclosure.factAvailability.sourceBacked, true);

const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage,
  acquisitionMemoProjection: projection,
  bossContract,
  coreMetrics,
  propertyProfile,
  reportMeta,
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel).ok, true);
assert.equal(customerSurfaceModel.identity.reportType, "underwriting");
assert.equal(customerSurfaceModel.identity.reportTier, 2);
assert.equal(customerSurfaceModel.sourceTruth.sourceReconciliation.sourceBacked, true);
assert.equal(customerSurfaceModel.sourceTruth.sourceReconciliation.state.difference_amount, -180000);

const finalHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: projection,
  renderedAcquisitionMemo: renderAcquisitionMemo(projection),
  sourcePackage: canonicalSourcePackage,
  coreMetrics,
  reportMeta,
  propertyProfile,
  bossContract,
  customerSurfaceModel,
});
assert.match(finalHtml, /Primary Constraint \/ Source Reconciliation/i);
assert.match(finalHtml, /T12 Gross Potential Rent<\/td><td style="font-weight:600;">\$1,612,800<\/td>/i);
assert.match(finalHtml, /Rent Roll Annual In-Place Rent<\/td><td style="font-weight:600;">\$1,432,800<\/td>/i);
assert.match(finalHtml, /Rent Roll less T12<\/td><td style="font-weight:600;">\(\$180,000\)<\/td>/i);
assert.match(finalHtml, /Variance<\/td><td style="font-weight:600;">-11\.16%<\/td>/i);
assert.match(finalHtml, new RegExp(disclosure.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
assert.match(finalHtml, /Break-Even Occupancy<\/td><td style="font-weight:600;">34\.4%<\/td>/i);
assert.equal(/Review \/ Source Reconciliation Disclosure/i.test(finalHtml), false);
assert.equal(/Implied Value Sensitivity at Stabilization|\$5,712,000|\$4,760,000|\$4,080,000/i.test(finalHtml), false);
assert.equal(/[\u2013\u2014]|&(?:ndash|mdash);/i.test(finalHtml), false);
assert.equal(formatCurrency(-180000), "($180,000)");
assert.equal(formatCurrency(-0), "$0");

const acquisitionRendererSource = readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const screeningRendererSource = readFileSync("api/_lib/screening-report-renderer.js", "utf8");
const generatorSource = readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
for (const source of [acquisitionRendererSource, screeningRendererSource, generatorSource]) {
  assert.equal(/annualGap\s*\/\s*\(cap|impliedLift\s*=\s*annualGap|Implied Value Sensitivity at Stabilization/i.test(source), false);
}

console.log("P0-A financial truth egress smoke PASS");
