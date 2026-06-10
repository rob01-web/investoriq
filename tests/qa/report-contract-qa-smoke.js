import assert from "node:assert/strict";
import { buildReportContractQa } from "../../api/_lib/report-contract-qa.js";
import { buildQaActionPlan } from "../../api/_lib/qa-action-plan.js";
import {
  buildAcquisitionAssumptionState,
  buildCurrentDebtAssessmentState,
  sanitizeFinalCustomerHtml,
} from "../../api/_lib/report-surface-contracts.js";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const baseArtifacts = [
  {
    type: "t12_parsed",
    payload: {
      effective_gross_income: 1000000,
      total_operating_expenses: 400000,
      net_operating_income: 600000,
    },
  },
  {
    type: "rent_roll_parsed",
    payload: {
      total_units: 10,
      occupancy: 1,
    },
  },
];

const baseCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true, unit_count: 10, occupancy: 1 },
  },
};

const honestLumpSum = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Income & Expense Summary (Lump-Sum T12)</h2>",
    "<p>No line-item detail available. Effective Gross Income (TTM): $1,000,000.</p>",
    "<p>No line-item expense detail available. Total Operating Expenses (TTM): $400,000.</p>",
  ].join("\n"),
});
assert.equal(honestLumpSum.violations.length, 0);
assert.equal(honestLumpSum.customer_delivery_ready, true);

const acquisitionMemoLaunchHtml = [
  "<h2>Executive Summary</h2>",
  "<p>ACQUISITION MEMO</p>",
  "<h3>Acquisition Memo Summary</h3>",
  "<table><tr><td>Occupancy</td><td>100.0%</td></tr><tr><td>Annual In-Place Rent</td><td>$1,200,000</td></tr><tr><td>Annual Market Rent</td><td>$1,350,000</td></tr><tr><td>Purchase Price</td><td>$10,640,000</td></tr></table>",
  "<h3>Operating Snapshot</h3>",
  "<table><tr><td>Units</td><td>48</td></tr><tr><td>Effective Gross Income</td><td>$1,500,000</td></tr><tr><td>Operating Expenses</td><td>$600,000</td></tr><tr><td>NOI</td><td>$900,000</td></tr><tr><td>Expense Ratio</td><td>40.0%</td></tr><tr><td>NOI Margin</td><td>60.0%</td></tr></table>",
  "<h3>Rent Positioning Summary</h3>",
  "<table><tr><td>Annual In-Place Rent</td><td>$1,200,000</td></tr><tr><td>Annual Market Rent</td><td>$1,350,000</td></tr><tr><td>Annual Gross Rent Upside</td><td>$150,000</td></tr><tr><td>Rent Gap %</td><td>12.5%</td></tr><tr><td>Total Units</td><td>48</td></tr><tr><td>Occupied Units</td><td>48</td></tr><tr><td>Vacant Units</td><td>0</td></tr><tr><td>Occupancy</td><td>100.0%</td></tr></table>",
  "<h3>Rent Upside / Value Sensitivity</h3>",
  "<table><tr><td>Annual In-Place Rent</td><td>$1,200,000</td></tr><tr><td>Annual Market Rent</td><td>$1,350,000</td></tr><tr><td>Annual Gross Rent Upside</td><td>$150,000</td></tr></table>",
  "<h3>Cap-Rate Value Indication</h3>",
  "<table><tr><td>Cap Rate</td><td>Implied Value</td><td>Per Unit</td></tr><tr><td>5.0%</td><td>$18,000,000</td><td>$375,000</td></tr></table>",
  "<h3>Source Context / Support Document Treatment</h3>",
  "<p>Modeled core inputs: T12 and Rent Roll. Corroborating support: property tax if validated. Context only / not modeled: market survey, broker email, appraisal summary, environmental, zoning, and CapEx notes.</p>",
  "<h3>Document Treatment Summary</h3>",
  "<p>Structured T12, rent roll, and supporting documents are listed where available.</p>",
  "<h3>Data Coverage &amp; Source Limitations</h3>",
  "<p>Unsupported or unstructured uploads remain excluded from modeled outputs. Optional support documents remain qualitative unless validated.</p>",
].join("\n");
const acquisitionMemoLaunchQa = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: acquisitionMemoLaunchHtml,
});
assert.equal(acquisitionMemoLaunchQa.violations.length, 0);
assert.match(acquisitionMemoLaunchHtml, /Acquisition Memo Summary/);
assert.match(acquisitionMemoLaunchHtml, /Operating Snapshot/);
assert.match(acquisitionMemoLaunchHtml, /Rent Positioning Summary/);
assert.match(acquisitionMemoLaunchHtml, /Rent Upside \/ Value Sensitivity/);
assert.match(acquisitionMemoLaunchHtml, /Cap-Rate Value Indication/);
assert.match(acquisitionMemoLaunchHtml, /Source Context \/ Support Document Treatment/);
assert.match(acquisitionMemoLaunchHtml, /Data Coverage &amp; Source Limitations/);
assert.equal(/<table>\s*<\/table>/.test(acquisitionMemoLaunchHtml), false);
assert.equal(
  /Current Debt DSCR|Debt Coverage Constraint|refinance capacity|refinance proceeds|Capital Risk Profile|Review - Debt Coverage Constraint/i.test(acquisitionMemoLaunchHtml),
  false
);

const sanitizedHtml = sanitizeFinalCustomerHtml(
  "<p>Current\uFFFEdebt DSCR \u200b / Not assessed / Current debt balance not provided</p>"
);
assert.equal(sanitizedHtml.includes("\uFFFE"), false);
assert.equal(sanitizedHtml.includes("\u200b"), false);
assert.equal(
  buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: baseArtifacts,
    sourceReportCoverageQa: baseCoverage,
    html: sanitizedHtml,
  }).violations.some((v) => v.code === "RENDERED_MOJIBAKE_LEAK"),
  false
);

const rentRollContradiction = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Rent Roll Summary</h2>",
    "<table>",
    "<tr><td>Total Units</td><td>48</td></tr>",
    "<tr><td>Weighted Avg Market Rent</td><td>$1,888/month</td></tr>",
    "<tr><td>Annual Market Rent (Total)</td><td>$21,744,000</td></tr>",
    "<tr><td>Weighted Avg In-Place Rent</td><td>$1,700/month</td></tr>",
    "<tr><td>Annual In-Place Rent (Total)</td><td>$979,200</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  rentRollContradiction.violations.some((v) => v.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"),
  true
);
const rentRollContradictionViolation = rentRollContradiction.violations.find(
  (v) => v.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"
);
assert.equal(rentRollContradictionViolation.evidence.total_units, 48);
assert.equal(rentRollContradictionViolation.evidence.annual_market_rent_total, 21744000);
assert.equal(rentRollContradictionViolation.evidence.weighted_avg_market_rent, 1888);
assert.equal(rentRollContradictionViolation.evidence.implied_avg_market_rent, 37750);
assert.equal(rentRollContradictionViolation.evidence.annual_in_place_rent_total, 979200);
assert.equal(rentRollContradictionViolation.evidence.weighted_avg_in_place_rent, 1700);
assert.equal(rentRollContradictionViolation.evidence.implied_avg_in_place_rent, 1700);

const rentRollContradictionPlan = buildQaActionPlan({
  reportContractQa: rentRollContradiction,
  sourceReportCoverageQa: baseCoverage,
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
  reportType: "underwriting",
  reportTier: 2,
});
const rentRollAction = rentRollContradictionPlan.prioritized_actions.find(
  (action) => action.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"
);
assert.equal(rentRollAction.action_type, "render_gating_fix_required");
assert.equal(rentRollAction.owner_area, "rent_roll_normalizer");
assert.equal(rentRollAction.blocks_customer_delivery, false);

const rentRollConsistent = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Rent Roll Summary</h2>",
    "<table>",
    "<tr><td>Total Units</td><td>48</td></tr>",
    "<tr><td>Weighted Avg Market Rent</td><td>$1,888/month</td></tr>",
    "<tr><td>Annual Market Rent (Total)</td><td>$1,087,488</td></tr>",
    "<tr><td>Weighted Avg In-Place Rent</td><td>$1,700/month</td></tr>",
    "<tr><td>Annual In-Place Rent (Total)</td><td>$979,200</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  rentRollConsistent.violations.some((v) => v.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"),
  false
);

const canonicalRentRollInPlaceAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 24,
        total_in_place_annual: 1200000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Annual In-Place Rent (Total) $1,200,000</p>",
});
assert.equal(
  canonicalRentRollInPlaceAligned.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  false
);

const canonicalRentRollInPlaceDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 24,
        total_in_place_annual: 1200000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Annual In-Place Rent (Total) $900,000</p>",
});
assert.equal(
  canonicalRentRollInPlaceDrift.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  true
);

const canonicalRentRollMarketAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 24,
        total_market_annual: 1500000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Annual Market Rent (Total) $1,500,000</p>",
});
assert.equal(
  canonicalRentRollMarketAligned.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  false
);

const canonicalRentRollMarketDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 24,
        total_market_annual: 1500000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Annual Market Rent (100% Occupancy) $1,200,000</p>",
});
assert.equal(
  canonicalRentRollMarketDrift.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  true
);

const canonicalRentRollBothAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 24,
        total_in_place_annual: 1200000,
        total_market_annual: 1500000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Annual In-Place Rent (Total) $1,200,000</p>",
    "<p>Annual Market Rent (Total) $1,500,000</p>",
  ].join("\n"),
});
assert.equal(
  canonicalRentRollBothAligned.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  false
);

const canonicalRentRollInPlaceAlignedMarketDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 24,
        total_in_place_annual: 1200000,
        total_market_annual: 1500000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Annual In-Place Rent (Total) $1,200,000</p>",
    "<p>Annual Market Rent (Total) $1,200,000</p>",
  ].join("\n"),
});
assert.equal(
  canonicalRentRollInPlaceAlignedMarketDrift.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  true
);

const canonicalRentRollTotalsMissing = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 24,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Annual In-Place Rent (Total) $1,200,000</p>",
    "<p>Annual Market Rent (Total) $1,500,000</p>",
  ].join("\n"),
});
assert.equal(
  canonicalRentRollTotalsMissing.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  false
);

const canonicalRentRollPartialUntrustedNoViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        is_partial_sample: true,
        total_in_place_annual: 1200000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Annual In-Place Rent (Total) $900,000</p>",
});
assert.equal(
  canonicalRentRollPartialUntrustedNoViolation.violations.some((v) => v.code === "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT"),
  false
);

const canonicalOccupancyAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: 0.95,
      },
    },
  },
  html: "<p>Occupancy: 95.0%</p>",
});
assert.equal(
  canonicalOccupancyAligned.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  false
);

const canonicalOccupancyDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: 0.95,
      },
    },
  },
  html: "<p>Occupancy: 92.0%</p>",
});
assert.equal(
  canonicalOccupancyDrift.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  true
);

const canonicalOccupancyMultiAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: 0.95,
      },
    },
  },
  html: [
    "<p>Occupancy: 95.0%</p>",
    "<p>Current Occupancy: 95.0%</p>",
    "<p>Physical Occupancy: 95.0%</p>",
  ].join("\n"),
});
assert.equal(
  canonicalOccupancyMultiAligned.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  false
);

const canonicalOccupancyOneSectionDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: 0.95,
      },
    },
  },
  html: [
    "<p>Occupancy: 95.0%</p>",
    "<p>Physical Occupancy: 92.0%</p>",
  ].join("\n"),
});
assert.equal(
  canonicalOccupancyOneSectionDrift.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  true
);

const canonicalOccupancyBreakEvenIgnored = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: 0.95,
      },
    },
  },
  html: "<p>Break-even Occupancy: 70.0%</p>",
});
assert.equal(
  canonicalOccupancyBreakEvenIgnored.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  false
);

const canonicalOccupancyBufferIgnored = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: 0.95,
      },
    },
  },
  html: "<p>Occupancy Buffer: 25.0%</p>",
});
assert.equal(
  canonicalOccupancyBufferIgnored.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  false
);

const canonicalOccupancyMissingNoViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 10,
      },
    },
  ],
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: null,
      },
    },
  },
  html: "<p>Occupancy: 92.0%</p>",
});
assert.equal(
  canonicalOccupancyMissingNoViolation.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  false
);

const canonicalOccupancyPartialUntrustedNoViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    baseArtifacts[0],
    {
      type: "rent_roll_parsed",
      payload: {
        is_partial_sample: true,
        occupancy: 0.95,
      },
    },
  ],
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      rent_roll_parsed: {
        ...baseCoverage.artifact_inventory.rent_roll_parsed,
        occupancy: 0.95,
      },
    },
  },
  html: "<p>Occupancy: 92.0%</p>",
});
assert.equal(
  canonicalOccupancyPartialUntrustedNoViolation.violations.some((v) => v.code === "OCCUPANCY_CANONICAL_VALUE_DRIFT"),
  false
);

const sourceReconciliationCoverage = {
  ...baseCoverage,
  source_reconciliation_state: {
    status: "source_reconciliation_required",
    rr_annual_in_place: 1962456,
    t12_gpr: 1850000,
    variance_pct: 0.06078702702702703,
    has_material_variance: true,
    customer_delivery_impact: "disclose_only",
    public_outreach_impact: "block_until_review",
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
};
const sourceReconciliationMatch = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sourceReconciliationCoverage,
  html: [
    "<h2>Operating Profile</h2>",
    "<table>",
    "<tr><td>Rent Roll vs T12 GPR Variance</td><td>+6.1%</td></tr>",
    "</table>",
    "<p>Rent roll annualized rent is +6.1% vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.</p>",
  ].join("\n"),
});
assert.equal(
  sourceReconciliationMatch.violations.some((v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"),
  false
);

const sourceReconciliationMismatch = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sourceReconciliationCoverage,
  html: [
    "<h2>Operating Profile</h2>",
    "<table>",
    "<tr><td>Rent Roll vs T12 GPR Variance</td><td>-48.0%</td></tr>",
    "</table>",
    "<p>Rent roll annualized rent is -48.0% vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.</p>",
  ].join("\n"),
});
assert.equal(
  sourceReconciliationMismatch.violations.some((v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"),
  true
);
const sourceReconciliationMismatchViolation = sourceReconciliationMismatch.violations.find(
  (v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"
);
assert.equal(sourceReconciliationMismatchViolation.blocks_customer_delivery, false);
assert.equal(sourceReconciliationMismatchViolation.customer_delivery_impact, "disclose_only");
assert.equal(sourceReconciliationMismatchViolation.evidence.canonical_variance_pct, 0.06078702702702703);
assert.equal(
  sourceReconciliationMismatchViolation.evidence.rendered_values.some((entry) => entry.value === -48.0),
  true
);

const sourceReconciliationBlockingCoverage = {
  ...baseCoverage,
  source_reconciliation_state: {
    status: "source_reconciliation_required",
    rr_annual_in_place: 1962456,
    t12_gpr: 1850000,
    variance_pct: 0.06078702702702703,
    has_material_variance: true,
    publishability_bucket: "admin_review_required",
    customer_delivery_impact: "block",
    public_outreach_impact: "block_until_review",
  },
};
const sourceReconciliationMismatchBlocking = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sourceReconciliationBlockingCoverage,
  html: [
    "<h2>Operating Profile</h2>",
    "<table>",
    "<tr><td>Rent Roll vs T12 GPR Variance</td><td>-48.0%</td></tr>",
    "</table>",
    "<p>Rent roll annualized rent is -48.0% vs T12 GPR.</p>",
  ].join("\n"),
});
const sourceReconciliationMismatchBlockingViolation = sourceReconciliationMismatchBlocking.violations.find(
  (v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"
);
assert.equal(sourceReconciliationMismatchBlockingViolation.blocks_customer_delivery, false);
assert.equal(sourceReconciliationMismatchBlockingViolation.customer_delivery_impact, "block");

const cleanCoreCoverageState = {
  ...baseCoverage,
  authority_provenance: {
    coverage_authoritative: true,
    section_eligibility_authoritative: true,
    sufficiency_authoritative: true,
  },
  core_input_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
  },
  source_reconciliation_state: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    source_reconciliation_disclosure: null,
  },
};
const dataCoverageOptionalLimitationHeadlineDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: cleanCoreCoverageState,
  html: [
    "<h2>Data Coverage &amp; Underwriting Scope</h2>",
    "<p>CORE INPUTS EXTRACTED - SOURCE LIMITATIONS DISCLOSURE</p>",
    "<p>Optional underwriting sections are source-constrained where supporting inputs were not verified.</p>",
  ].join("\n"),
});
assert.equal(
  dataCoverageOptionalLimitationHeadlineDrift.violations.some((v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"),
  true
);
const dataCoverageOptionalLimitationHeadlineDriftViolation = dataCoverageOptionalLimitationHeadlineDrift.violations.find(
  (v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"
);
assert.equal(dataCoverageOptionalLimitationHeadlineDriftViolation.severity, "high");
assert.equal(dataCoverageOptionalLimitationHeadlineDriftViolation.blocks_customer_delivery, false);
assert.equal(dataCoverageOptionalLimitationHeadlineDriftViolation.category, "data_coverage_taxonomy_contract");

const dataCoverageReconciliationHeadlineAllowed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    core_input_sufficiency_state: {
      publishability_bucket: "disclose_only_publishable",
    },
    source_reconciliation_state: {
      status: "source_reconciliation_required",
      publishability_bucket: "disclose_only_publishable",
      source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
    },
  },
  html: [
    "<h2>Data Coverage &amp; Underwriting Scope</h2>",
    "<p>CORE INPUTS EXTRACTED - SOURCE RECONCILIATION DISCLOSURE</p>",
  ].join("\n"),
});
assert.equal(
  dataCoverageReconciliationHeadlineAllowed.violations.some((v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"),
  false
);

const badIncomeTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><tr><td>Effective Gross Income</td><td>$1,000,000</td></tr>",
    "<tr><td>Vacancy Loss</td><td>-$50,000</td></tr>",
    "<tr><td>Other Income</td><td>$0</td></tr></table>",
  ].join("\n"),
});
assert.equal(badIncomeTable.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_CONTRACT"), true);

const headerOnlyIncomeTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody></tbody></table>",
  ].join("\n"),
});
assert.equal(headerOnlyIncomeTable.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_EMPTY_TABLE"), true);

const scopedIncomeTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><tr><td>Parking Income</td><td>$27,000</td></tr>",
    "<tr><td>Laundry Income</td><td>$18,400</td></tr></table>",
    "<h2>Operating Profile</h2>",
    "<p>Vacancy allowance is reflected elsewhere in the report.</p>",
  ].join("\n"),
});
assert.equal(scopedIncomeTable.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_CONTRACT"), false);

const headerOnlyRenovationBudgetTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Renovation Budget Breakdown</h2>",
    "<table><thead><tr><th>Category</th><th>Scope of Work</th><th>Estimated Cost</th><th>Percent of Budget</th><th>Primary Objective</th></tr></thead><tbody></tbody></table>",
    "<h2>Cost Per Unit and Execution Phasing</h2>",
    "<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody></tbody></table>",
  ].join("\n"),
});
assert.equal(
  headerOnlyRenovationBudgetTable.violations.some((v) => v.code === "RENOVATION_BUDGET_EMPTY_TABLE"),
  true
);
assert.equal(
  headerOnlyRenovationBudgetTable.violations.some((v) => v.code === "RENOVATION_EXECUTION_EMPTY_TABLE"),
  true
);

const acquisitionArtifacts = [
  ...baseArtifacts,
  {
    type: "loan_term_sheet_parsed",
    payload: {
      purchase_price: 10000000,
      derived_acquisition_loan_amount: 7000000,
      debt_basis: "acquisition_financing_assumption",
      interest_rate: 0.06,
      amort_years: 25,
    },
  },
];
const acquisitionCoverage = {
  ...baseCoverage,
  artifact_inventory: {
    ...baseCoverage.artifact_inventory,
    loan_term_sheet_parsed: {
      present: true,
      has_purchase_price: true,
      has_derived_acquisition_debt: true,
      has_balance: false,
      has_rate: true,
      has_amortization: true,
    },
  },
};
const cleanAcquisition = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<table><tr><td>Derived Acquisition Loan Amount</td><td>$7,000,000</td></tr>",
    "<tr><td>Proposed Acquisition DSCR</td><td>1.20x</td></tr></table>",
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(cleanAcquisition.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);

const acquisitionWithRiskRegisterLimitation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>Current Debt DSCR</td><td>Current outstanding debt balance not provided</td><td>NOT ASSESSED</td></tr></table>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(acquisitionWithRiskRegisterLimitation.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);
assert.equal(acquisitionWithRiskRegisterLimitation.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);

const acquisitionWithScorecardNotAssessed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    "<h2>Deal Scorecard</h2>",
    "<table><tr><td>Current Debt DSCR</td><td>Not assessed</td><td>0/10</td><td>Current debt balance not provided</td></tr></table>",
  ].join("\n"),
});
assert.equal(acquisitionWithScorecardNotAssessed.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"), false);
assert.equal(acquisitionWithScorecardNotAssessed.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);
assert.equal(acquisitionWithScorecardNotAssessed.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"), false);

for (const safeLimitationRow of [
  "<p>Current Debt DSCR / Not assessed / No current debt document provided / 0/10</p>",
  "<p>Current Debt DSCR / Not assessed / Current debt terms were not fully provided / 0/10</p>",
  "<p>Current Debt DSCR / Not assessed / Current debt service not assessed / 0/10</p>",
]) {
  const safeLimitationReport = buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: acquisitionArtifacts,
    sourceReportCoverageQa: acquisitionCoverage,
    html: [
      "<h2>Deal Scorecard</h2>",
      safeLimitationRow,
      "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    ].join("\n"),
  });
  assert.equal(safeLimitationReport.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"), false);
}

const contaminatedAcquisition = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current outstanding debt balance equals derived acquisition debt.</p>",
    "<p>Current Debt DSCR: 1.20x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
  ].join("\n"),
});
assert.equal(contaminatedAcquisition.violations.length > 0, true);
assert.equal(contaminatedAcquisition.customer_delivery_ready, true);
const canonicalSeparatedNoisyArtifactsCleanRender = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...acquisitionArtifacts,
    {
      type: "mortgage_statement_parsed",
      payload: {
        outstanding_balance: 2500000,
        interest_rate: 0.065,
        amort_years: 30,
      },
    },
  ],
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_assessed: false,
      has_true_current_debt_balance: false,
      has_proposed_acquisition_financing: true,
      current_debt_limitation_reason_code: "acquisition_only_not_current_debt",
      acquisition_only_exclusion: true,
    },
    acquisition_assumption_state: {
      has_proposed_acquisition_financing: true,
      current_debt_separated: true,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<table><tr><td>Derived Acquisition Loan Amount</td><td>$7,000,000</td></tr>",
    "<tr><td>Proposed Acquisition DSCR</td><td>1.20x</td></tr></table>",
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
  ].join("\n"),
});
assert.equal(canonicalSeparatedNoisyArtifactsCleanRender.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);
const canonicalSeparatedRenderContamination = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_assessed: false,
      has_true_current_debt_balance: false,
      has_proposed_acquisition_financing: true,
      current_debt_limitation_reason_code: "acquisition_only_not_current_debt",
      acquisition_only_exclusion: true,
    },
    acquisition_assumption_state: {
      has_proposed_acquisition_financing: true,
      current_debt_separated: true,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Current Debt DSCR: 1.20x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
  ].join("\n"),
});
assert.equal(canonicalSeparatedRenderContamination.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), true);
const supportDocTreatmentLeak = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "environmental_report.pdf", semantic_doc_role: "environmental" },
    ],
  },
  html: "<p>environmental_report.pdf - Structured property tax input</p>",
});
const supportDocTreatmentViolation = supportDocTreatmentLeak.violations.find(
  (v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"
);
assert.equal(Boolean(supportDocTreatmentViolation), true);
assert.equal(supportDocTreatmentViolation.severity, "high");
assert.equal(supportDocTreatmentViolation.blocks_customer_delivery, false);
const supportDocTreatmentClean = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Document Treatment Summary</h2>",
    "<table><tbody><tr><td>Environmental_and_Zoning_Context.pdf</td><td>Environmental and zoning support documents were reviewed for qualitative context and are not treated as structured property-tax inputs.</td></tr></tbody></table>",
  ].join("\n"),
});
assert.equal(supportDocTreatmentClean.violations.some((v) => v.code === "SUPPORT_DOC_TREATMENT_LABEL_CONTRACT"), false);

const supportDocCanonicalEnvironmentalDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "environmental_report.pdf", semantic_doc_role: "environmental" },
    ],
  },
  html: "<p>environmental_report.pdf - Structured property tax input</p>",
});
assert.equal(
  supportDocCanonicalEnvironmentalDrift.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  true
);

const supportDocCanonicalZoningDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "zoning_letter.pdf", semantic_doc_role: "zoning" },
    ],
  },
  html: "<p>zoning_letter.pdf - Property tax support</p>",
});
assert.equal(
  supportDocCanonicalZoningDrift.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  true
);

const supportDocCanonicalMarketSurveyDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "market_survey.pdf", semantic_doc_role: "market_survey" },
    ],
  },
  html: "<p>market_survey.pdf - Modeled property tax input</p>",
});
assert.equal(
  supportDocCanonicalMarketSurveyDrift.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  true
);

const supportDocCanonicalUnmodeledDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "background_support.pdf", semantic_doc_role: "unmodeled_support" },
    ],
  },
  html: "<p>background_support.pdf - Structured input used as underwriting input</p>",
});
assert.equal(
  supportDocCanonicalUnmodeledDrift.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  true
);

const supportDocCanonicalPropertyTaxAllowed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "property_tax_bill.pdf", semantic_doc_role: "property_tax" },
    ],
  },
  html: "<p>property_tax_bill.pdf - Property tax support</p>",
});
assert.equal(
  supportDocCanonicalPropertyTaxAllowed.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  false
);

const supportDocCanonicalEnvironmentalQualitativeAllowed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "environmental_report.pdf", semantic_doc_role: "environmental" },
    ],
  },
  html: "<p>environmental_report.pdf - Qualitative support; not used in modeled outputs</p>",
});
assert.equal(
  supportDocCanonicalEnvironmentalQualitativeAllowed.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  false
);

const supportDocNoCanonicalExistingLeakStillFires = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
    },
    support_documents: [
      { original_filename: "environmental_report.pdf", semantic_doc_role: "environmental" },
    ],
  },
  html: "<p>environmental_report.pdf - Structured property tax input</p>",
});
assert.equal(
  supportDocNoCanonicalExistingLeakStillFires.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  true
);

const supportDocNoCanonicalNeutralNoNewViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Uploaded supporting documents were reviewed for qualitative context.</p>",
});
assert.equal(
  supportDocNoCanonicalNeutralNoNewViolation.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  false
);

const acquisitionWithCurrentDscrValue = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Current Debt DSCR: 1.20x</p>",
  ].join("\n"),
});
assert.equal(acquisitionWithCurrentDscrValue.violations.length > 0, true);
const acquisitionPurchasePriceMismatchRendered = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.0085,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,130,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionPurchasePriceMismatchRendered.violations.some((v) =>
    ["ACQUISITION_PURCHASE_PRICE_LOAN_AMOUNT_MISMATCH_RENDERED", "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"].includes(v.code)
  ),
  true
);

const acquisitionLenderFeeOmittedRendered = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.0085,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionLenderFeeOmittedRendered.violations.some((v) => v.code === "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"),
  true
);
const acquisitionLenderFeeRenderedClean = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.0085,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr><tr><td>Lender Fee</td><td>0.85%</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionLenderFeeRenderedClean.violations.some((v) => v.code === "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"),
  false
);
const canonicalLenderFeeArtifactDiffRenderedCanonicalFee = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.02,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    acquisition_assumption_state: {
      purchase_price: 2840000,
      stated_acquisition_loan_amount: 2130000,
      lender_fee_percent: 0.0085,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr><tr><td>Lender Fee</td><td>0.85%</td></tr></table>",
  ].join("\n"),
});
assert.equal(canonicalLenderFeeArtifactDiffRenderedCanonicalFee.violations.some((v) => v.code === "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"), false);
assert.equal(canonicalLenderFeeArtifactDiffRenderedCanonicalFee.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), false);
const canonicalLenderFeeOmittedRendered = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.02,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    acquisition_assumption_state: {
      purchase_price: 2840000,
      stated_acquisition_loan_amount: 2130000,
      lender_fee_percent: 0.0085,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(canonicalLenderFeeOmittedRendered.violations.some((v) => v.code === "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"), true);
const canonicalStateNoLenderFeeNoOmissionViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.0085,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    acquisition_assumption_state: {
      purchase_price: 2840000,
      stated_acquisition_loan_amount: 2130000,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(canonicalStateNoLenderFeeNoOmissionViolation.violations.some((v) => v.code === "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"), false);

const acquisitionClosingCostZeroRendered = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        debt_basis: "acquisition_financing_assumption",
        closing_cost_notes: "Fees 1% lender fee + legal/appraisal costs",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Closing Costs</td><td>0.0%</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionClosingCostZeroRendered.violations.some((v) => v.code === "ACQUISITION_CLOSING_COSTS_ZERO_RENDERED_WITH_UNQUANTIFIED_NOTES"),
  true
);
const canonicalStateNoClosingFieldsNoClosingZeroViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        debt_basis: "acquisition_financing_assumption",
        closing_cost_notes: "Fees 1% lender fee + legal/appraisal costs",
      },
    },
  ],
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    acquisition_assumption_state: {
      purchase_price: 2840000,
      stated_acquisition_loan_amount: 2130000,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Closing Costs</td><td>0.0%</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  canonicalStateNoClosingFieldsNoClosingZeroViolation.violations.some((v) => v.code === "ACQUISITION_CLOSING_COSTS_ZERO_RENDERED_WITH_UNQUANTIFIED_NOTES"),
  false
);
const acquisitionClosingCostRenderedClean = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        debt_basis: "acquisition_financing_assumption",
        closing_cost_notes: "Legal and appraisal fees expected.",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Closing Costs</td><td>2.0%</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionClosingCostRenderedClean.violations.some((v) => v.code === "ACQUISITION_CLOSING_COSTS_ZERO_RENDERED_WITH_UNQUANTIFIED_NOTES"),
  false
);

const acquisitionPurchasePriceMismatchRenderedClean = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionPurchasePriceMismatchRenderedClean.violations.some((v) => v.code === "ACQUISITION_PURCHASE_PRICE_LOAN_AMOUNT_MISMATCH_RENDERED"),
  false
);
const canonicalAcquisitionValuesOverrideArtifactBaseline = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 3200000,
        stated_acquisition_loan_amount: 2600000,
        derived_acquisition_loan_amount: 2500000,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    acquisition_assumption_state: {
      purchase_price: 2840000,
      stated_acquisition_loan_amount: 2130000,
      derived_acquisition_loan_amount: 2000000,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr><tr><td>Derived Acquisition Loan Amount</td><td>$2,000,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  canonicalAcquisitionValuesOverrideArtifactBaseline.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"),
  false
);
assert.equal(
  canonicalAcquisitionValuesOverrideArtifactBaseline.violations.some((v) => v.code === "ACQUISITION_PURCHASE_PRICE_LOAN_AMOUNT_MISMATCH_RENDERED"),
  false
);
const canonicalAcquisitionPurchasePriceDriftViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 3200000,
        stated_acquisition_loan_amount: 2600000,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: {
    ...acquisitionCoverage,
    acquisition_assumption_state: {
      purchase_price: 2840000,
      stated_acquisition_loan_amount: 2130000,
    },
  },
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,600,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  canonicalAcquisitionPurchasePriceDriftViolation.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"),
  true
);

const acquisitionCanonicalPurchasePriceAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Purchase Price $2,840,000</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalPurchasePriceAligned.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), false);

const acquisitionCanonicalPurchasePriceDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Purchase Price $2,130,000</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalPurchasePriceDrift.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), true);

const acquisitionCanonicalStatedLoanAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        stated_acquisition_loan_amount: 2130000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Stated Acquisition Loan Amount $2,130,000</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalStatedLoanAligned.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), false);

const acquisitionCanonicalStatedLoanDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        stated_acquisition_loan_amount: 2130000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Stated Acquisition Loan Amount $1,900,000</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalStatedLoanDrift.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), true);

const acquisitionCanonicalDerivedLoanAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        derived_acquisition_loan_amount: 7000000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalDerivedLoanAligned.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), false);

const acquisitionCanonicalDerivedLoanDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        derived_acquisition_loan_amount: 7000000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived Acquisition Loan Amount $6,500,000</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalDerivedLoanDrift.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), true);

const acquisitionCanonicalLenderFeeAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        lender_fee_percent: 0.0085,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Lender Fee 0.85%</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalLenderFeeAligned.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), false);

const acquisitionCanonicalLenderFeeDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        lender_fee_percent: 0.0085,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Lender Fee 1.25%</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalLenderFeeDrift.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), true);

const acquisitionCanonicalIgnoreCurrentDebtSection = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        derived_acquisition_loan_amount: 7000000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Derived Acquisition Loan Amount $6,500,000</p>",
    "<p>Purchase Price $2,130,000</p>",
  ].join("\n"),
});
assert.equal(acquisitionCanonicalIgnoreCurrentDebtSection.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), false);

const acquisitionCanonicalNoSectionNoViolation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        derived_acquisition_loan_amount: 7000000,
        lender_fee_percent: 0.0085,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: "<p>Acquisition assumptions reviewed.</p>",
});
assert.equal(acquisitionCanonicalNoSectionNoViolation.violations.some((v) => v.code === "ACQUISITION_CANONICAL_VALUE_DRIFT"), false);

const acquisitionWithRefiClassification = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
  ].join("\n"),
});
assert.equal(acquisitionWithRefiClassification.violations.length > 0, true);

const acquisitionWithCurrentRefiHeadings = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<h3>DSCR Sensitivity & Coverage Threshold Analysis</h3>",
    "<h3>Refinance Stress Test & Binding Constraint Analysis</h3>",
  ].join("\n"),
});
assert.equal(acquisitionWithCurrentRefiHeadings.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);

const currentDebtArtifacts = [
  ...baseArtifacts,
  {
    type: "mortgage_statement_parsed",
    payload: {
      outstanding_balance: 6000000,
      interest_rate: 0.055,
      amort_years: 25,
    },
  },
];
const currentDebtCoverage = {
  ...baseCoverage,
  artifact_inventory: {
    ...baseCoverage.artifact_inventory,
    mortgage_statement_parsed: {
      present: true,
      has_balance: true,
      has_rate: true,
      has_amortization: true,
    },
  },
};
const currentDebtReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h3>DSCR Sensitivity & Coverage Threshold Analysis</h3>",
    "<p>Current Debt DSCR: 1.30x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
  ].join("\n"),
});
assert.equal(currentDebtReport.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);
assert.equal(currentDebtReport.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);

const explicitCurrentDebtSupportState = buildCurrentDebtAssessmentState({
  loanTermSheetTermsPayload: {
    outstanding_balance: 8750000,
    interest_rate: 0.0525,
    amort_years: 30,
    debt_basis: "current_debt_support",
    semantic_doc_role: "loan_term_sheet",
    purchase_price: 10640000,
    ltv: 0.7,
    derived_acquisition_loan_amount: 7450000,
  },
  t12Noi: 611800,
});
const explicitCurrentDebtSupportAssumptionState = buildAcquisitionAssumptionState({
  loanTermSheetTermsPayload: {
    outstanding_balance: 8750000,
    interest_rate: 0.0525,
    amort_years: 30,
    debt_basis: "current_debt_support",
    semantic_doc_role: "loan_term_sheet",
    purchase_price: 10640000,
    ltv: 0.7,
    derived_acquisition_loan_amount: 7450000,
  },
  currentDebtState: explicitCurrentDebtSupportState,
});
const explicitCurrentDebtSupportReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        outstanding_balance: 8750000,
        interest_rate: 0.0525,
        amort_years: 30,
        debt_basis: "current_debt_support",
        semantic_doc_role: "loan_term_sheet",
        purchase_price: 10640000,
        ltv: 0.7,
        derived_acquisition_loan_amount: 7450000,
      },
    },
  ],
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: explicitCurrentDebtSupportState,
    acquisition_assumption_state: explicitCurrentDebtSupportAssumptionState,
  },
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR: 1.31x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
    "<p>Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
  ].join("\n"),
});
assert.equal(
  explicitCurrentDebtSupportReport.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT"),
  false
);
assert.equal(
  explicitCurrentDebtSupportReport.violations.some((v) => v.code === "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT"),
  false
);

const paymentOnlyMortgageArtifacts = [
  ...baseArtifacts,
  {
    type: "mortgage_statement_parsed",
    payload: {
      monthly_payment: 13625,
      annual_debt_service: 163500,
      interest_rate: 0.0425,
      amort_years: 23,
      lender_name: "ABC Bank",
    },
  },
];
const paymentOnlyMortgageCoverage = {
  ...baseCoverage,
  artifact_inventory: {
    ...baseCoverage.artifact_inventory,
    mortgage_statement_parsed: {
      present: true,
      has_balance: false,
      has_payment: true,
      has_rate: true,
      has_amortization: true,
    },
  },
};
const paymentOnlyMortgageReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: paymentOnlyMortgageArtifacts,
  sourceReportCoverageQa: paymentOnlyMortgageCoverage,
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR / Not assessed / Current debt balance not provided / 0/10</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(paymentOnlyMortgageReport.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"), false);
assert.equal(paymentOnlyMortgageReport.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"), false);
assert.equal(paymentOnlyMortgageReport.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);

const mojibakeLeakReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<p>Current\uFFFEdebt DSCR / Not assessed / Current debt balance not provided / 0/10</p>",
  ].join("\n"),
});
assert.equal(mojibakeLeakReport.violations.some((v) => v.code === "RENDERED_MOJIBAKE_LEAK"), true);

const currentDebtDscrMismatch = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...currentDebtArtifacts,
    {
      type: "mortgage_statement_parsed",
      payload: {
        outstanding_balance: 6000000,
        monthly_payment: 13625,
        interest_rate: 0.055,
        amort_years: 25,
      },
    },
  ],
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<p>DSCR (Computed): 7.10x</p>",
    "<p>DSCR (T12 NOI): 7.10x</p>",
    "<h3>Current Debt Coverage / Constraint Sensitivity</h3>",
    "<table><tr><td>Base</td><td>7.10x</td></tr></table>",
    "<h2>Deal Scorecard</h2>",
    "<p>DSCR (Current Debt): 8.10x</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>DSCR (Current Debt)</td><td>8.10x</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrMismatch.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH"),
  true
);

const currentDebtDscrAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...currentDebtArtifacts,
    {
      type: "mortgage_statement_parsed",
      payload: {
        outstanding_balance: 6000000,
        monthly_payment: 13625,
        interest_rate: 0.055,
        amort_years: 25,
      },
    },
  ],
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<p>DSCR (Computed): 7.10x</p>",
    "<p>DSCR (T12 NOI): 7.10x</p>",
    "<h3>Current Debt Coverage / Constraint Sensitivity</h3>",
    "<table><tr><td>Base</td><td>7.10x</td></tr></table>",
    "<h2>Deal Scorecard</h2>",
    "<p>DSCR (Current Debt): 7.10x</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>DSCR (Current Debt)</td><td>7.10x</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrAligned.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH"),
  false
);
const canonicalCurrentDebtDscrCoverage = {
  ...baseCoverage,
  authority_provenance: {
    coverage_authoritative: true,
    current_debt_state_authoritative: true,
    current_debt_state_source: "canonical_input",
  },
  current_debt_state_source: "canonical_input",
  current_debt_state: {
    current_debt_dscr_status: "computed",
    current_debt_dscr: 1.23,
  },
};
const canonicalCurrentDebtDscrSingleAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: canonicalCurrentDebtDscrCoverage,
  html: "<p>Current Debt DSCR: 1.23x</p>",
});
assert.equal(
  canonicalCurrentDebtDscrSingleAligned.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"),
  false
);
assert.equal(
  canonicalCurrentDebtDscrSingleAligned.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"),
  false
);
assert.equal(
  canonicalCurrentDebtDscrSingleAligned.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"),
  false
);
const canonicalComputedWithMissingDebtArtifacts = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.23,
      current_debt_assessed: true,
      has_true_current_debt_balance: true,
      current_debt_limitation_reason_code: null,
      refi_basis_eligible: true,
    },
  },
  html: "<p>Current Debt DSCR: 1.23x</p>",
});
assert.equal(
  canonicalComputedWithMissingDebtArtifacts.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"),
  false
);
assert.equal(
  canonicalComputedWithMissingDebtArtifacts.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"),
  false
);
const canonicalCurrentDebtDscrSingleDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: canonicalCurrentDebtDscrCoverage,
  html: "<p>Current Debt DSCR: 1.31x</p>",
});
assert.equal(
  canonicalCurrentDebtDscrSingleDrift.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"),
  true
);
const canonicalCurrentDebtFromUnderwritingState = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    underwritingState: {
      core: {
        currentDebt: {
          assessmentState: {
            current_debt_dscr_status: "computed",
            current_debt_dscr: 1.23,
            current_debt_assessed: true,
            has_true_current_debt_balance: true,
            refi_basis_eligible: true,
          },
        },
      },
    },
  },
  html: "<p>Current Debt DSCR: 1.23x</p>",
});
assert.equal(
  canonicalCurrentDebtFromUnderwritingState.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"),
  false
);
const canonicalCurrentDebtDscrMultiAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: canonicalCurrentDebtDscrCoverage,
  html: [
    "<p>DSCR (Computed): 1.23x</p>",
    "<h3>Current Debt Coverage / Constraint Sensitivity</h3>",
    "<table><tr><td>Base</td><td>1.23x</td></tr></table>",
    "<h2>Deal Scorecard</h2>",
    "<p>DSCR (Current Debt): 1.23x</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>DSCR (Current Debt)</td><td>1.23x</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  canonicalCurrentDebtDscrMultiAligned.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"),
  false
);
const canonicalCurrentDebtDscrMultiDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: canonicalCurrentDebtDscrCoverage,
  html: [
    "<p>DSCR (Computed): 1.23x</p>",
    "<h3>Current Debt Coverage / Constraint Sensitivity</h3>",
    "<table><tr><td>Base</td><td>1.23x</td></tr></table>",
    "<h2>Deal Scorecard</h2>",
    "<p>DSCR (Current Debt): 1.31x</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>DSCR (Current Debt)</td><td>1.23x</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  canonicalCurrentDebtDscrMultiDrift.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"),
  true
);
const canonicalCurrentDebtNotAssessedNoDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_dscr: null,
      current_debt_limitation_reason_code: "no_true_current_debt_source",
    },
  },
  html: "<p>Current Debt DSCR: Not assessed - current debt balance not provided</p>",
});
assert.equal(
  canonicalCurrentDebtNotAssessedNoDrift.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"),
  false
);
assert.equal(
  canonicalCurrentDebtNotAssessedNoDrift.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT"),
  false
);
const canonicalCurrentDebtNotAssessedNumericDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_dscr: null,
      current_debt_assessed: false,
      has_true_current_debt_balance: false,
      current_debt_limitation_reason_code: "no_true_current_debt_source",
      refi_basis_eligible: false,
    },
  },
  html: "<p>Current Debt DSCR: 1.20x</p>",
});
assert.equal(
  canonicalCurrentDebtNotAssessedNumericDrift.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT"),
  true
);
assert.equal(
  canonicalCurrentDebtNotAssessedNumericDrift.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"),
  false
);
assert.equal(
  canonicalCurrentDebtNotAssessedNumericDrift.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"),
  false
);
const canonicalCurrentDebtNotAssessedRefiMathDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_dscr: null,
      current_debt_assessed: false,
      has_true_current_debt_balance: false,
      current_debt_limitation_reason_code: "no_true_current_debt_source",
      refi_basis_eligible: false,
    },
  },
  html: "<h3>Full Refinance Sufficiency</h3><p>Refinance Proceeds / Debt Balance: 1.10x</p>",
});
assert.equal(
  canonicalCurrentDebtNotAssessedRefiMathDrift.violations.some((v) => v.code === "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT"),
  true
);
const proposedAcquisitionDscrNoDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: canonicalCurrentDebtDscrCoverage,
  html: "<p>Proposed Acquisition DSCR: 1.31x</p>",
});
assert.equal(
  proposedAcquisitionDscrNoDrift.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"),
  false
);
const proposedAcquisitionContextSafe = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_dscr: null,
      current_debt_assessed: false,
      has_true_current_debt_balance: false,
      current_debt_limitation_reason_code: "acquisition_only_not_current_debt",
      acquisition_only_exclusion: true,
      refi_basis_eligible: false,
    },
  },
  html: "<p>Proposed acquisition financing was identified but is not current outstanding debt; current debt and refinance coverage were not assessed.</p>",
});
assert.equal(
  proposedAcquisitionContextSafe.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT"),
  false
);
assert.equal(
  proposedAcquisitionContextSafe.violations.some((v) => v.code === "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT"),
  false
);
assert.equal(
  proposedAcquisitionContextSafe.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"),
  false
);
assert.equal(
  proposedAcquisitionContextSafe.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"),
  false
);
const proposedAcquisitionContamination = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_dscr: null,
      current_debt_assessed: false,
      has_true_current_debt_balance: false,
      current_debt_limitation_reason_code: "acquisition_only_not_current_debt",
      acquisition_only_exclusion: true,
      refi_basis_eligible: false,
    },
  },
  html: "<p>Proposed Acquisition DSCR: 1.20x</p><p>Current Debt DSCR: 1.20x</p>",
});
assert.equal(
  proposedAcquisitionContamination.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT"),
  true
);
const canonicalAbsentDebtUnsupportedFallback = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Current Debt DSCR: 1.20x</p>",
});
assert.equal(
  canonicalAbsentDebtUnsupportedFallback.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"),
  true
);

const currentDebtDscrScorecardComputed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>DSCR (Current Debt)</td><td>7.10x</td><td>1.25-1.35x</td><td>7/10</td></tr>",
    "</table>",
    "<p>Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.</p>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrScorecardComputed.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);
assert.equal(
  currentDebtDscrScorecardComputed.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"),
  false
);
assert.equal(
  currentDebtDscrScorecardComputed.violations.some((v) => v.code === "CURRENT_DEBT_COMPUTED_STALE_LIMITATION_COPY"),
  true
);

const currentDebtDscrScorecardFalsePositiveGuard = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Executive Summary</h2>",
    "<p>Current Debt DSCR / Not assessed / Current debt balance not provided / 0/10</p>",
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>DSCR (Current Debt)</td><td>7.10x</td><td>1.25-1.35x</td><td>7/10</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrScorecardFalsePositiveGuard.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);
const staleScorecardPlaceholder = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>Current Debt DSCR</td><td>Not assessed</td><td>current debt balance not provided</td><td>0/10</td></tr>",
    "</table>",
  ].join("\n"),
});
const staleScorecardPlaceholderViolation = staleScorecardPlaceholder.violations.find(
  (v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"
);
assert.equal(Boolean(staleScorecardPlaceholderViolation), true);
assert.equal(staleScorecardPlaceholderViolation.blocks_customer_delivery, false);
assert.equal(staleScorecardPlaceholderViolation.customer_delivery_impact, "disclose_only");

const validComputedDscrScorecardRow = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>Current Debt DSCR</td><td>7.10x</td><td>Above 1.35x</td><td>10/10</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  validComputedDscrScorecardRow.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);

const weakButComputedDscrScorecardRow = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>Current Debt DSCR</td><td>1.06x</td><td>Below 1.25x</td><td>0/10</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  weakButComputedDscrScorecardRow.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);

const screeningLeak = buildReportContractQa({
  reportType: "screening",
  reportTier: 1,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<h2>Discounted Cash Flow</h2><h2>Debt Structure</h2><h2>Deal Scorecard</h2>",
});
assert.equal(screeningLeak.violations.some((v) => v.code === "SCREENING_UNDERWRITING_SECTION_LEAK"), true);

const buyLanguage = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>BUY this property based on the report.</p>",
});
assert.equal(buyLanguage.contract_status, "block");
assert.equal(buyLanguage.customer_delivery_ready, false);
const buyPlan = buildQaActionPlan({
  reportContractQa: buyLanguage,
  reportQaFlags: [],
  sourceReportCoverageQa: baseCoverage,
  renderedReportQa: { findings: [] },
});
assert.equal(buyPlan.customer_delivery_ready, false);
assert.equal(buyPlan.prioritized_actions[0].source_artifact, "report_contract_qa");

const cleanLimitation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Uploaded renovation support was identified, but no verified forward-looking renovation budget, rent-lift plan, ROI, payback analysis, or implementation schedule was extracted.</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(cleanLimitation.customer_delivery_ready, true);
assert.equal(cleanLimitation.violations.length, 0);

const expenseSensitivityAfterDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody><tr><td>Property Taxes</td><td>$120,000</td></tr><tr><td>Insurance</td><td>$60,000</td></tr></tbody></table>",
    "<h2>Expense Ratio Sensitivity</h2>",
    "<table><tr><td>60%</td><td>Implied NOI</td></tr></table>",
  ].join("\n"),
});
assert.equal(expenseSensitivityAfterDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_CONTRACT"), false);

const populatedExpenseDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Top </p>",
    "<h2>Top Expense Drivers</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody><tr><td>Property Taxes</td><td>$120,000</td></tr><tr><td>Insurance</td><td>$60,000</td></tr></tbody></table>",
  ].join("\n"),
});
assert.equal(populatedExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), false);
assert.equal(populatedExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_CONTRACT"), false);

const populatedExpenseDriversNoTbody = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><tr><td>Property Taxes</td><td>$120,000</td></tr><tr><td>Insurance</td><td>$60,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(populatedExpenseDriversNoTbody.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), false);

const placeholderExpenseDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><tbody><tr><td>No expense drivers</td><td>N/A</td></tr></tbody></table>",
  ].join("\n"),
});
assert.equal(placeholderExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), true);

const headerOnlyExpenseDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody></tbody></table>",
  ].join("\n"),
});
assert.equal(headerOnlyExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), true);

const neighboringTopText = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody><tr><td>Management Fees</td><td>$20,000</td></tr></tbody></table>",
    "<p>Top </p>",
    "<h2>Expense Ratio Sensitivity</h2>",
    "<table><tr><td>60%</td><td>Implied NOI</td></tr></table>",
  ].join("\n"),
});
assert.equal(neighboringTopText.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), false);
assert.equal(neighboringTopText.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_EMPTY_TABLE"), false);

const validDscrPressure = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Primary Pressure Point: DSCR of 1.06x constrains refinance capacity below standard lender coverage thresholds.</p><p>Expense Ratio 41.0%</p>",
});
assert.equal(validDscrPressure.violations.some((v) => v.code === "PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT"), false);

const stableExpensePressure = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Primary Pressure Point: Expense Ratio 41.0%</p>",
});
assert.equal(stableExpensePressure.violations.some((v) => v.code === "PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT"), true);

const strongDscrPressure = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Primary Pressure Point: DSCR of 1.40x</p>",
});
assert.equal(strongDscrPressure.violations.some((v) => v.code === "PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT"), true);

const sectionEligibilityNoCurrentDebt = {
  ...baseCoverage,
  current_debt_state: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "no_true_current_debt_source",
  },
  section_eligibility: {
    sections: {
      debt_structure: {
        source_constrained: true,
        omission_reason_code: "no_true_current_debt_source",
      },
      renovation_strategy: {
        source_constrained: true,
      },
    },
  },
};
const sectionEligibilityCurrentDebtDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sectionEligibilityNoCurrentDebt,
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<table><tr><td>Current Debt DSCR</td><td>1.23x</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  sectionEligibilityCurrentDebtDrift.violations.some((v) => v.code === "SECTION_ELIGIBILITY_CURRENT_DEBT_RENDER_DRIFT"),
  true
);

const sectionEligibilityCurrentDebtClean = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sectionEligibilityNoCurrentDebt,
  html: [
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance.</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(
  sectionEligibilityCurrentDebtClean.violations.some((v) => v.code === "SECTION_ELIGIBILITY_CURRENT_DEBT_RENDER_DRIFT"),
  false
);

const sectionEligibilityRefiDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sectionEligibilityNoCurrentDebt,
  html: "<p>Refinance Stability Classification: Stable</p>",
});
assert.equal(
  sectionEligibilityRefiDrift.violations.some((v) => v.code === "SECTION_ELIGIBILITY_REFI_RENDER_DRIFT"),
  true
);

const sectionEligibilityRefiClean = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sectionEligibilityNoCurrentDebt,
  html: "<p>Refinance Stability Classification not produced due to insufficient refinance inputs.</p>",
});
assert.equal(
  sectionEligibilityRefiClean.violations.some((v) => v.code === "SECTION_ELIGIBILITY_REFI_RENDER_DRIFT"),
  false
);

const sectionEligibilityRenovationDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sectionEligibilityNoCurrentDebt,
  html: [
    "<h2>Renovation Strategy</h2>",
    "<p>Renovation ROI: 18.0%</p>",
    "<p>Payback analysis: 4.2 years</p>",
    "<p>NOI impact: +$120,000</p>",
  ].join("\n"),
});
assert.equal(
  sectionEligibilityRenovationDrift.violations.some((v) => v.code === "SECTION_ELIGIBILITY_RENOVATION_RENDER_DRIFT"),
  true
);

const sectionEligibilityRenovationClean = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sectionEligibilityNoCurrentDebt,
  html: [
    "<h2>Renovation Notes</h2>",
    "<p>Historical renovation observations were reviewed for context only.</p>",
    "<p>No renovation return, rent lift, ROI, or payback analysis is modeled.</p>",
  ].join("\n"),
});
assert.equal(
  sectionEligibilityRenovationClean.violations.some((v) => v.code === "SECTION_ELIGIBILITY_RENOVATION_RENDER_DRIFT"),
  false
);

const canonicalDebtConstraintStableDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.1,
    },
    display_verdict_state: {
      label: "Review - Debt Coverage Constraint",
      cap_reason_code: "debt_coverage_constraint",
    },
  },
  html: "<p>Capital Risk Profile: Stable</p>",
});
assert.equal(canonicalDebtConstraintStableDrift.violations.some((v) => v.code === "VERDICT_CAP_RENDER_DRIFT"), true);

const canonicalDebtConstraintAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    display_verdict_state: {
      label: "Review - Debt Coverage Constraint",
      cap_reason_code: "debt_coverage_constraint",
    },
  },
  html: "<p>Review - Debt Coverage Constraint</p>",
});
assert.equal(canonicalDebtConstraintAligned.violations.some((v) => v.code === "VERDICT_CAP_RENDER_DRIFT"), false);
assert.equal(canonicalDebtConstraintAligned.violations.some((v) => v.code === "VERDICT_CAP_EXPLANATION_CONTRADICTION"), false);

const canonicalSourceReconciliationStableDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      source_reconciliation_state_authoritative: true,
    },
    source_reconciliation_state: {
      status: "source_reconciliation_required",
      publishability_bucket: "disclose_only_publishable",
    },
  },
  html: "<p>Refinance Stability Classification: Stable</p>",
});
assert.equal(canonicalSourceReconciliationStableDrift.violations.some((v) => v.code === "VERDICT_CAP_RENDER_DRIFT"), true);

const canonicalSourceReconciliationAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      source_reconciliation_state_authoritative: true,
    },
    source_reconciliation_state: {
      status: "source_reconciliation_required",
      publishability_bucket: "disclose_only_publishable",
    },
  },
  html: "<p>Review - Source Reconciliation Disclosure</p>",
});
assert.equal(canonicalSourceReconciliationAligned.violations.some((v) => v.code === "VERDICT_CAP_RENDER_DRIFT"), false);
assert.equal(canonicalSourceReconciliationAligned.violations.some((v) => v.code === "VERDICT_CAP_EXPLANATION_CONTRADICTION"), false);

const visibleClassificationConflict = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    display_verdict_state: {
      label: "Review - Insufficient Core Support",
      cap_reason_code: "insufficient_core_support",
    },
  },
  html: [
    "<p>Review - Insufficient Core Support</p>",
    "<p>Review - Debt Coverage Constraint</p>",
  ].join("\n"),
});
assert.equal(visibleClassificationConflict.violations.some((v) => v.code === "VISIBLE_CLASSIFICATION_CONFLICT"), true);

const visibleClassificationAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    display_verdict_state: {
      label: "Review - Debt Coverage Constraint",
      cap_reason_code: "debt_coverage_constraint",
    },
  },
  html: [
    "<p>Review - Debt Coverage Constraint</p>",
    "<p>Review - Debt Coverage Constraint</p>",
  ].join("\n"),
});
assert.equal(visibleClassificationAligned.violations.some((v) => v.code === "VISIBLE_CLASSIFICATION_CONFLICT"), false);

const visibleClassificationDebtCapContradiction = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.06,
    },
    display_verdict_state: {
      label: "Review - Debt Coverage Constraint",
      cap_reason_code: "debt_coverage_constraint",
    },
  },
  html: [
    "<p>Review - Debt Coverage Constraint</p>",
    "<p>Within Underwriting Parameters</p>",
  ].join("\n"),
});
assert.equal(
  visibleClassificationDebtCapContradiction.violations.some((v) => v.code === "VERDICT_CAP_RENDER_DRIFT"),
  true
);

const unsupportedDebtConstrainedLanguage = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 2840000,
        derived_acquisition_loan_amount: 2130000,
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance.</p>",
    "<p>Current Debt DSCR: 1.06x</p>",
    "<p>Primary Constraint: Current Debt DSCR of 1.06x constrains refinance capacity below standard lender coverage thresholds.</p>",
  ].join("\n"),
});
assert.equal(
  unsupportedDebtConstrainedLanguage.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"),
  true
);

const duplicatedDocumentTreatmentCategories = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    '<p class="subsection-title">Modeled Inputs</p>',
    '<ul><li>same_file.pdf - Structured operating input</li></ul>',
    '<p class="subsection-title">Displayed / Limited Use</p>',
    '<ul><li>context_only.pdf - Context only</li></ul>',
    '<p class="subsection-title">Listed but Not Quantitatively Modeled</p>',
    '<ul><li>same_file.pdf - Listed for auditability only</li></ul>',
  ].join("\n"),
});
assert.equal(
  duplicatedDocumentTreatmentCategories.violations.some(
    (v) => v.code === "DOCUMENT_TREATMENT_DUPLICATE_CATEGORY_CONFLICT"
  ),
  true
);

const marketSurveyAsRentRollSupportDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "market_rent_survey_context.txt", semantic_doc_role: "market_survey" },
    ],
  },
  html: "<p>Market survey support (market_rent_survey_context.txt) - Structured input used as underwriting input.</p>",
});
assert.equal(
  marketSurveyAsRentRollSupportDrift.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  true
);

const coreCoverageHeadlineConflict = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      section_eligibility_authoritative: false,
      sufficiency_authoritative: true,
    },
    core_input_sufficiency_state: {
      publishability_bucket: "core_sufficient_publishable",
    },
    source_reconciliation_state: {
      status: "aligned",
    },
  },
  html: [
    "<p>CORE INPUT COVERAGE CONFIRMED</p>",
    "<p>CORE INPUTS EXTRACTED - SOURCE LIMITATIONS DISCLOSURE</p>",
    "<p>Only optional support documents were constrained.</p>",
  ].join("\n"),
});
assert.equal(
  coreCoverageHeadlineConflict.violations.some((v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"),
  true
);

const readinessAliasDistributionMetadata = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  qaFixRouting: {
    distribution_ready: true,
    distribution_blockers: ["DOCRAPTOR_NOT_PRODUCTION_MODE"],
    distribution_impact: "block_until_review",
    production_pdf_ready: true,
    production_pdf_config_issues: ["ACQUISITION_FINANCING_FIELD_LIMITED"],
    production_pdf_config_issue: "block_until_review",
  },
  html: "<p>Clean baseline body.</p>",
});
assert.equal(
  readinessAliasDistributionMetadata.report_quality_ready,
  true
);
assert.equal(readinessAliasDistributionMetadata.contract_status, "pass");
assert.equal(readinessAliasDistributionMetadata.report_quality_status, "pass");
assert.equal(readinessAliasDistributionMetadata.distribution_status, "review");
assert.equal(readinessAliasDistributionMetadata.distribution_ready, false);
assert.equal(
  readinessAliasDistributionMetadata.distribution_readiness_issues.some((issue) => issue.code === "DISTRIBUTION_CONFIG_ISSUE"),
  true
);
assert.equal(
  readinessAliasDistributionMetadata.distribution_readiness_issues.some((issue) => issue.code === "PRODUCTION_PDF_CONFIG_ISSUE"),
  true
);
const readinessAliasDistributionMetadataSerialized = JSON.stringify(readinessAliasDistributionMetadata);
assert.equal(readinessAliasDistributionMetadataSerialized.includes("public_sample_ready"), false);
assert.equal(readinessAliasDistributionMetadataSerialized.includes("high_value_outreach_ready"), false);
assert.equal(readinessAliasDistributionMetadataSerialized.includes("blocks_public_sample"), false);
assert.equal(readinessAliasDistributionMetadataSerialized.includes("blocks_high_value_outreach"), false);

const canonicalDeliveryWinsOverRouting = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    delivery_gate_decision: {
      deliveryDecisionState: {
        delivery_gate_status: "admin_review_required",
        customer_delivery_allowed: false,
        hold_delivery: true,
        distribution_ready: false,
      },
    },
  },
  qaFixRouting: {
    customer_delivery_ready: true,
    customer_publish_eligible: true,
    distribution_ready: true,
  },
  deliveryGateDecision: {
    delivery_gate_status: "deliverable",
    customer_delivery_ready: true,
    customer_publish_eligible: true,
  },
  html: "<p>Clean baseline body.</p>",
});
assert.equal(canonicalDeliveryWinsOverRouting.customer_delivery_ready, false);
assert.equal(
  canonicalDeliveryWinsOverRouting.violations.some((v) => v.code === "CANONICAL_DELIVERY_ALIAS_CONFLICT"),
  true
);
assert.equal(
  canonicalDeliveryWinsOverRouting.violations.some((v) => v.code === "CANONICAL_DELIVERY_GATE_STATUS_CONFLICT"),
  true
);

const canonicalDeliveryHoldConflict = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    delivery_gate_decision: {
      deliveryDecisionState: {
        delivery_gate_status: "user_needs_documents",
        customer_delivery_allowed: false,
        hold_delivery: true,
        distribution_ready: false,
      },
      hold_delivery: false,
    },
  },
  deliveryGateDecision: {
    hold_delivery: false,
  },
  html: "<p>Clean baseline body.</p>",
});
assert.equal(
  canonicalDeliveryHoldConflict.violations.some((v) => v.code === "CANONICAL_DELIVERY_HOLD_ALIAS_CONFLICT"),
  true
);

const legacyReadinessFallbackNoCanonical = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  qaFixRouting: {
    distribution_ready: true,
    distribution_blockers: ["DOCRAPTOR_NOT_PRODUCTION_MODE"],
    distribution_impact: "block_until_review",
  },
  html: "<p>Clean baseline body.</p>",
});
assert.equal(
  legacyReadinessFallbackNoCanonical.report_quality_ready,
  true
);
assert.equal(legacyReadinessFallbackNoCanonical.report_quality_status, "pass");
assert.equal(legacyReadinessFallbackNoCanonical.distribution_status, "review");
assert.equal(legacyReadinessFallbackNoCanonical.distribution_ready, false);
assert.equal(
  legacyReadinessFallbackNoCanonical.distribution_readiness_issues.some((issue) => issue.code === "DISTRIBUTION_CONFIG_ISSUE"),
  true
);

const refiNotAssessedContradiction = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Refinance stability was not assessed because required refinance inputs were incomplete.</p>",
    "<p>Debt Structure Summary</p>",
    "<p>Current Debt DSCR: 1.06x</p>",
  ].join("\n"),
});
assert.equal(
  refiNotAssessedContradiction.violations.some(
    (v) => v.code === "REFI_NOT_ASSESSED_COPY_CONTRADICTS_CURRENT_DEBT_RENDER"
  ),
  true
);

const refiNotAssessedNoDebtAllowed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      has_true_current_debt_balance: false,
    },
  },
  html: "<p>Refinance stability was not assessed because verified debt inputs were unavailable.</p>",
});
assert.equal(
  refiNotAssessedNoDebtAllowed.violations.some(
    (v) => v.code === "REFI_NOT_ASSESSED_COPY_CONTRADICTS_CURRENT_DEBT_RENDER"
  ),
  false
);

const dcfExitCapOverclaim = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Exit cap: 5.75% (document-derived exit cap)</p>",
    "<p>Going-in cap reference only; not a verified exit cap.</p>",
  ].join("\n"),
});
assert.equal(
  dcfExitCapOverclaim.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  true
);

const dcfRefiAssumptionSafe = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Exit cap: 5.75% (refinance/underwriting cap assumption (not a verified exit cap))</p>",
});
assert.equal(
  dcfRefiAssumptionSafe.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  false
);

const dcfGoingInReferenceSafe = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Exit cap: 5.75% (document-stated going-in cap reference (sensitivity anchor only; not a verified exit cap))</p>",
});
assert.equal(
  dcfGoingInReferenceSafe.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  false
);

const dcfFrameworkAssumptionSafe = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Exit cap: 5.75% (standardized framework assumption)</p>",
});
assert.equal(
  dcfFrameworkAssumptionSafe.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  false
);

const dcfVerifiedExitCapOverclaim = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Exit cap: 5.75% (verified exit cap)</p>",
    "<p>Framework sensitivity, not an appraisal.</p>",
  ].join("\n"),
});
assert.equal(
  dcfVerifiedExitCapOverclaim.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  true
);

const propertyTaxStructuredBindingContradiction = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    property_tax_binding_state: {
      hasReliableBinding: true,
      allows_multiple_bound_sources: false,
    },
  },
  html: [
    '<p class="subsection-title">Modeled Inputs</p>',
    '<ul><li>Phase_I_Environmental.pdf - Structured property tax input</li></ul>',
  ].join("\n"),
});
assert.equal(
  propertyTaxStructuredBindingContradiction.violations.some(
    (v) => v.code === "PROPERTY_TAX_STRUCTURED_INPUT_BINDING_CONTRADICTION"
  ),
  true
);

const propertyTaxMismatchNonBlocking = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 1000000,
        total_operating_expenses: 400000,
        net_operating_income: 600000,
        expense_lines: [
          { label: "Property Taxes", amount: 36000 },
        ],
      },
    },
    {
      type: "property_tax_parsed",
      payload: {
        annual_tax: 42000,
      },
    },
  ],
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Property tax support listed for auditability only.</p>",
});
assert.equal(
  propertyTaxMismatchNonBlocking.violations.some((v) => v.code === "PROPERTY_TAX_T12_MISMATCH"),
  false
);

const currentDebtDocumentTreatmentContradiction = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    '<p class="subsection-title">Modeled Inputs</p>',
    '<ul><li>loan_terms_packet.pdf - Structured current debt input</li></ul>',
    '<p class="subsection-title">Displayed / Limited Use</p>',
    '<ul><li>loan_terms_packet.pdf - Acquisition assumptions context only; used only for displayed purchase/cap-rate context and not used to override T12, Rent Roll, or current debt.</li></ul>',
  ].join("\n"),
});
assert.equal(
  currentDebtDocumentTreatmentContradiction.violations.some(
    (v) => v.code === "CURRENT_DEBT_DOCUMENT_TREATMENT_CONTRADICTION"
  ),
  true
);

const canonicalCleanNoisyLimitationPhrases = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    core_input_sufficiency_state: { publishability_bucket: "core_sufficient_publishable" },
    source_reconciliation_state: { status: "aligned" },
    section_eligibility: { sections: {} },
  },
  html: [
    "<h2>Data Coverage & Underwriting Scope</h2>",
    "<p>Source limitation phrase appears in historical note context only.</p>",
    "<p>Legacy wording reference for archive comparison.</p>",
  ].join("\n"),
});
assert.equal(
  canonicalCleanNoisyLimitationPhrases.violations.some((v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"),
  false
);

const canonicalConstrainedCleanCopyMissingLimitation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      section_eligibility_authoritative: true,
      sufficiency_authoritative: true,
    },
    core_input_sufficiency_state: { publishability_bucket: "disclose_only_publishable" },
    source_reconciliation_state: { status: "source_reconciliation_required" },
    section_eligibility: {
      sections: {
        debt_structure: { source_constrained: true, omitted: true, rendered: false },
      },
    },
  },
  html: [
    "<h2>Data Coverage & Underwriting Scope</h2>",
    "<p>All inputs are complete and fully aligned.</p>",
  ].join("\n"),
});
assert.equal(
  canonicalConstrainedCleanCopyMissingLimitation.violations.some((v) => v.code === "DATA_COVERAGE_CANONICAL_LIMITATION_MISSING"),
  true
);

const canonicalDebtOmittedButRenderedHeading = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      section_eligibility_authoritative: true,
      sufficiency_authoritative: false,
    },
    section_eligibility: {
      sections: {
        debt_structure: { source_constrained: true, omitted: true, rendered: false },
      },
    },
  },
  html: "<h2>Debt Structure & Financing</h2><p>Heading rendered despite canonical omit.</p>",
});
assert.equal(
  canonicalDebtOmittedButRenderedHeading.violations.some((v) => v.code === "SECTION_ELIGIBILITY_DEBT_HEADING_CONFORMANCE_DRIFT"),
  true
);

const canonicalDebtRenderedMissingHeading = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      section_eligibility_authoritative: true,
      sufficiency_authoritative: false,
    },
    section_eligibility: {
      sections: {
        debt_structure: { source_constrained: false, omitted: false, rendered: true, eligible: true },
      },
    },
  },
  html: "<h2>Operating Profile</h2><p>Debt heading intentionally missing for conformance test.</p>",
});
assert.equal(
  canonicalDebtRenderedMissingHeading.violations.some((v) => v.code === "SECTION_ELIGIBILITY_DEBT_HEADING_MISSING"),
  true
);

const canonicalAbsentLegacyFallbackStillActive = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: null,
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR: 1.35x</p>",
    "<p>No current debt document provided.</p>",
  ].join("\n"),
});
assert.equal(
  canonicalAbsentLegacyFallbackStillActive.violations.some(
    (v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED" || v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"
  ),
  true
);

const fallbackDerivedCurrentDebtStateNotCanonicalAuthority = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: false,
      current_debt_state_authoritative: false,
    },
    legacy_compatibility: {
      current_debt_state_source: "fallback_reconstructed",
      legacy_fallback_active: true,
    },
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.42,
      has_true_current_debt_balance: true,
    },
  },
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR: 1.10x</p>",
    "<p>DSCR (T12 NOI) 1.10x</p>",
  ].join("\n"),
});
assert.equal(
  fallbackDerivedCurrentDebtStateNotCanonicalAuthority.violations.some(
    (v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"
  ),
  false
);

const unprovenancedCurrentDebtStateNotCanonicalAuthority = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.42,
      has_true_current_debt_balance: true,
    },
  },
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR: 1.10x</p>",
    "<p>DSCR (T12 NOI) 1.10x</p>",
  ].join("\n"),
});
assert.equal(
  unprovenancedCurrentDebtStateNotCanonicalAuthority.violations.some(
    (v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"
  ),
  false
);
const renderedContractCurrentDebtStateNotCanonicalAuthority = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    rendered_contract: {
      current_debt_state: {
        current_debt_dscr_status: "computed",
        current_debt_dscr: 1.42,
        has_true_current_debt_balance: true,
      },
    },
  },
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR: 1.10x</p>",
    "<p>DSCR (T12 NOI) 1.10x</p>",
  ].join("\n"),
});
assert.equal(
  renderedContractCurrentDebtStateNotCanonicalAuthority.violations.some(
    (v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"
  ),
  false
);

const canonicalInputCurrentDebtStateTriggersCanonicalDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.42,
      has_true_current_debt_balance: true,
    },
  },
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR: 1.10x</p>",
    "<p>DSCR (T12 NOI) 1.10x</p>",
  ].join("\n"),
});
assert.equal(
  canonicalInputCurrentDebtStateTriggersCanonicalDrift.violations.some(
    (v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"
  ),
  true
);

const authoritativeCurrentDebtStateTriggersCanonicalDrift = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: false,
      current_debt_state_authoritative: true,
      current_debt_state_source: "canonical_input",
    },
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.42,
      has_true_current_debt_balance: true,
    },
  },
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR: 1.10x</p>",
    "<p>DSCR (T12 NOI) 1.10x</p>",
  ].join("\n"),
});
assert.equal(
  authoritativeCurrentDebtStateTriggersCanonicalDrift.violations.some(
    (v) => v.code === "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT"
  ),
  true
);

const coverageObjectsOnlyDoNotCreateCanonicalCoverageAuthority = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    core_input_sufficiency_state: { publishability_bucket: "core_sufficient_publishable" },
    source_reconciliation_state: { status: "clear" },
    section_eligibility: { sections: {} },
  },
  html: "<h2>Data Coverage</h2><p>CORE INPUTS EXTRACTED - SOURCE LIMITATIONS DISCLOSURE</p>",
});
assert.equal(
  coverageObjectsOnlyDoNotCreateCanonicalCoverageAuthority.violations.some(
    (v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"
  ),
  false
);

const explicitCoverageAuthorityDoesCreateCanonicalCoverageAuthority = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      section_eligibility_authoritative: false,
      sufficiency_authoritative: false,
    },
    core_input_sufficiency_state: { publishability_bucket: "core_sufficient_publishable" },
    source_reconciliation_state: { status: "clear" },
    section_eligibility: { sections: {} },
  },
  html: "<h2>Data Coverage</h2><p>CORE INPUTS EXTRACTED - SOURCE LIMITATIONS DISCLOSURE</p>",
});
assert.equal(
  explicitCoverageAuthorityDoesCreateCanonicalCoverageAuthority.violations.some(
    (v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"
  ),
  true
);
const explicitCoverageSourceCanonicalInputCreatesCanonicalCoverageAuthority = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    coverage_state_source: "canonical_input",
    core_input_sufficiency_state: { publishability_bucket: "core_sufficient_publishable" },
    source_reconciliation_state: { status: "clear" },
    section_eligibility: { sections: {} },
  },
  html: "<h2>Data Coverage</h2><p>CORE INPUTS EXTRACTED - SOURCE LIMITATIONS DISCLOSURE</p>",
});
assert.equal(
  explicitCoverageSourceCanonicalInputCreatesCanonicalCoverageAuthority.violations.some(
    (v) => v.code === "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT"
  ),
  true
);

const underwritingNeutralMethodologyNoLeak = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h3>Document-Backed Underwriting Outputs</h3>",
    "<p>InvestorIQ underwriting outputs are document-backed and framework-constrained.</p>",
  ].join("\n"),
});
assert.equal(
  underwritingNeutralMethodologyNoLeak.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"),
  false
);

const acquisitionMemoAllowedSectionsNoLeak = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h3>Acquisition Memo Summary</h3>",
    "<h3>Operating Snapshot</h3>",
    "<h3>Unit Mix / Rent Positioning</h3>",
    "<h3>Rent Upside / Value Sensitivity</h3>",
    "<h3>Cap-Rate Value Indication</h3>",
    "<h3>Preliminary Financing Readiness Summary</h3>",
    "<h3>Proposed Acquisition Financing Context</h3>",
    "<h3>Source Context / Support Document Treatment</h3>",
    "<h3>Data Coverage / Source Reliability</h3>",
    "<h3>Methodology / Data Transparency</h3>",
  ].join("\n"),
});
assert.equal(
  acquisitionMemoAllowedSectionsNoLeak.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"),
  false
);

const acquisitionMemoProposedFinancingSeparationNoLeak = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    {
      type: "loan_term_sheet_parsed",
      payload: {
        semantic_doc_role: "purchase_assumptions",
        debt_basis: "proposed_acquisition_financing",
        purchase_price: 1250000,
        stated_acquisition_loan_amount: 937500,
        ltv: 0.75,
        interest_rate: 0.0585,
        amortization_years: 30,
        lender_fee_percent: 0.01,
      },
    },
  ],
  sourceReportCoverageQa: {
    ...baseCoverage,
    artifact_inventory: {
      ...baseCoverage.artifact_inventory,
      loan_term_sheet_parsed: {
        present: true,
        acquisition_support: {
          purchase_price: 1250000,
          derived_acquisition_loan_amount: 937500,
          debt_basis: "proposed_acquisition_financing",
          semantic_doc_role: "purchase_assumptions",
        },
      },
    },
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      has_true_current_debt_balance: false,
      current_debt_separated: true,
      current_debt_limitation_reason_code: "acquisition_only_not_current_debt",
    },
  },
  html: [
    "<h3>Acquisition Memo Summary</h3>",
    "<h3>Preliminary Financing Readiness Summary</h3>",
    "<h3>Proposed Acquisition Financing Context</h3>",
    "<p>Proposed Acquisition Financing: Source-complete inputs provided / available for future underwriting.</p>",
    "<table><tbody><tr><td>Purchase Price</td><td>$1,250,000</td></tr><tr><td>Proposed Loan Amount</td><td>$937,500</td></tr><tr><td>LTV</td><td>75.0%</td></tr><tr><td>Interest Rate</td><td>5.9%</td></tr><tr><td>Amortization</td><td>30 years</td></tr><tr><td>Closing / Lender Fee</td><td>1.0%</td></tr></tbody></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionMemoProposedFinancingSeparationNoLeak.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"),
  false
);
assert.equal(
  acquisitionMemoProposedFinancingSeparationNoLeak.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"),
  false
);

const underwritingScreeningLeakDetected = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h3>Document-Backed Screening Outputs</h3>",
    "<p>InvestorIQ screening outputs are document-backed and framework-constrained.</p>",
  ].join("\n"),
});
assert.equal(
  underwritingScreeningLeakDetected.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"),
  true
);
const underwritingScreeningLeakViolation = underwritingScreeningLeakDetected.violations.find(
  (v) => v.code === "REPORT_TYPE_SECTION_LEAK"
);
assert.equal(
  typeof underwritingScreeningLeakViolation?.evidence?.excerpt === "string" &&
    underwritingScreeningLeakViolation.evidence.excerpt.trim().length > 0,
  true
);

const screeningWordingNoFalseLeak = buildReportContractQa({
  reportType: "screening",
  reportTier: 1,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h3>Document-Backed Screening Outputs</h3>",
    "<p>InvestorIQ screening outputs are document-backed and framework-constrained.</p>",
  ].join("\n"),
});
assert.equal(
  screeningWordingNoFalseLeak.violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"),
  false
);
const explicitDisplayVerdictCapStillWinsWithoutProvenance = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    display_verdict_state: {
      cap_reason_code: "source_reconciliation_disclosure",
      label: "Review - Source Reconciliation Disclosure",
    },
  },
  html: "<h2>Executive Summary</h2><p>Within Underwriting Parameters</p>",
});
assert.equal(
  explicitDisplayVerdictCapStillWinsWithoutProvenance.violations.some(
    (v) => v.code === "VERDICT_CAP_RENDER_DRIFT"
  ),
  true
);
const unprovenancedDebtComputedDoesNotForceVerdictCap = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.1,
      has_true_current_debt_balance: true,
    },
  },
  html: "<h2>Executive Summary</h2><p>Within Underwriting Parameters</p>",
});
assert.equal(
  unprovenancedDebtComputedDoesNotForceVerdictCap.violations.some(
    (v) => v.code === "VERDICT_CAP_RENDER_DRIFT" || v.code === "VERDICT_CAP_EXPLANATION_CONTRADICTION"
  ),
  false
);
const provenancedDebtComputedDoesForceVerdictCap = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state_source: "canonical_input",
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.1,
      has_true_current_debt_balance: true,
    },
  },
  html: "<h2>Executive Summary</h2><p>Within Underwriting Parameters</p>",
});
assert.equal(
  provenancedDebtComputedDoesForceVerdictCap.violations.some(
    (v) => v.code === "VERDICT_CAP_RENDER_DRIFT"
  ),
  true
);
const unprovenancedDebtNotAssessedDoesNotForceVerdictCap = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_dscr: null,
      has_true_current_debt_balance: false,
    },
  },
  html: "<h2>Executive Summary</h2><p>Within Underwriting Parameters</p>",
});
assert.equal(
  unprovenancedDebtNotAssessedDoesNotForceVerdictCap.violations.some(
    (v) => v.code === "VERDICT_CAP_RENDER_DRIFT" || v.code === "VERDICT_CAP_EXPLANATION_CONTRADICTION"
  ),
  false
);
const provenancedDebtNotAssessedDoesForceVerdictCap = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      current_debt_state_authoritative: true,
      current_debt_state_source: "canonical_input",
    },
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      current_debt_dscr: null,
      has_true_current_debt_balance: false,
    },
  },
  html: "<h2>Executive Summary</h2><p>Within Underwriting Parameters</p>",
});
assert.equal(
  provenancedDebtNotAssessedDoesForceVerdictCap.violations.some(
    (v) => v.code === "VERDICT_CAP_RENDER_DRIFT"
  ),
  true
);
const unprovenancedCoreBucketDoesNotForceInsufficientCoreCap = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    core_input_sufficiency_state: { publishability_bucket: "user_needs_documents" },
  },
  html: "<h2>Executive Summary</h2><p>Within Underwriting Parameters</p>",
});
assert.equal(
  unprovenancedCoreBucketDoesNotForceInsufficientCoreCap.violations.some(
    (v) => v.code === "VERDICT_CAP_RENDER_DRIFT" || v.code === "VERDICT_CAP_EXPLANATION_CONTRADICTION"
  ),
  false
);
const provenancedCoreBucketDoesForceInsufficientCoreCap = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    authority_provenance: {
      coverage_authoritative: true,
      sufficiency_authoritative: true,
    },
    core_input_sufficiency_state: { publishability_bucket: "user_needs_documents" },
  },
  html: "<h2>Executive Summary</h2><p>Within Underwriting Parameters</p>",
});
assert.equal(
  provenancedCoreBucketDoesForceInsufficientCoreCap.violations.some(
    (v) => v.code === "VERDICT_CAP_RENDER_DRIFT"
  ),
  true
);

console.log("report-contract-qa smoke PASS");
