import assert from "node:assert/strict";

import {
  buildDeterministicReportContractQaSeal,
  DETERMINISTIC_REPORT_CONTRACT,
} from "../../api/_lib/deterministic-report-contract-qa-seal.js";
import { buildAcquisitionMemoV2FinalDeliveryDecision } from "../../api/_lib/acquisition-memo-v2-final-decision.js";
import { buildReportContractQa } from "../../api/_lib/report-contract-qa.js";
import { runScreeningReportPipeline } from "../../api/_lib/screening-report-pipeline.js";
import {
  buildScreeningDataCoverageSummary,
  buildScreeningNoiStabilityHtml,
} from "../../api/_lib/screening-report-renderer.js";

const disclosure = "InvestorIQ has not reconciled this variance and does not infer the cause.";
const reconciliationState = {
  status: "source_reconciliation_required",
  publishability_bucket: "disclose_only_publishable",
  customer_delivery_impact: "disclose_only",
  t12_gpr: 1612800,
  rr_annual_in_place: 1432800,
  difference_amount: -180000,
  variance_pct: -180000 / 1612800,
  source_reconciliation_disclosure: disclosure,
};
const breakEven = {
  label: DETERMINISTIC_REPORT_CONTRACT.breakEvenLabel,
  formula: DETERMINISTIC_REPORT_CONTRACT.breakEvenFormula,
  numerator: 555000,
  denominator: 1612800,
  result: 555000 / 1612800,
  upstreamResult: 555000 / 1612800,
};
const identity = {
  reportMode: "v1_core",
  reportType: "underwriting",
  reportTier: 2,
};
const validAcquisitionHtml = `
  <html><body>
    <h1>Acquisition Memo</h1>
    <table>
      <tr><td>T12 Gross Potential Rent</td><td>$1,612,800</td></tr>
      <tr><td>Rent Roll Annual In-Place Rent</td><td>$1,432,800</td></tr>
      <tr><td>Rent Roll less T12</td><td>($180,000)</td></tr>
      <tr><td>Variance</td><td>-11.16%</td></tr>
      <tr><td>Break-Even Occupancy</td><td>34.4%</td></tr>
      <tr><td>Current debt context</td><td>Source-backed fact bundle complete</td></tr>
    </table>
    <p>${disclosure}</p>
    <p>The gross rent difference is not capitalized or treated as NOI.</p>
  </body></html>`;

const validSeal = buildDeterministicReportContractQaSeal({
  html: validAcquisitionHtml,
  reportIdentity: identity,
  sourceReconciliation: { state: reconciliationState, sourceBacked: true },
  breakEven,
  supportSections: {
    currentDebtContext: {
      facts: {
        current_outstanding_balance: 6800000,
        interest_rate: 0.0485,
        maturity_date: "2029-11-01",
      },
      factAvailability: {
        sourceBacked: true,
        required: ["current_outstanding_balance", "interest_rate", "maturity_date"],
      },
    },
  },
});
assert.equal(validSeal.ok, true);
assert.equal(validSeal.source_reconciliation.publishability, "disclose_only_publishable");
assert.equal(validSeal.customer_document_failure, false);

const expectFailure = (html, code, overrides = {}) => {
  const result = buildDeterministicReportContractQaSeal({
    html,
    reportIdentity: identity,
    sourceReconciliation: { state: reconciliationState, sourceBacked: true },
    breakEven,
    ...overrides,
  });
  assert.equal(result.ok, false, `${code} must fail the deterministic seal`);
  assert.ok(result.issues.some((issue) => issue.code === code), `${code} missing from ${result.issues.map((issue) => issue.code).join(", ")}`);
  assert.equal(result.failure_class, "internal_render_contract_failure");
  assert.equal(result.customer_document_failure, false);
  return result;
};

expectFailure(
  validAcquisitionHtml.replace(/<tr><td>T12 Gross Potential Rent[\s\S]*?<\/tr>/i, ""),
  "REQUIRED_RECONCILIATION_RENDERED_VALUES_MISSING"
);
expectFailure(
  validAcquisitionHtml.replace("-11.16%", "-48.00%"),
  "RENDERED_RECONCILIATION_VARIANCE_MISMATCH"
);
expectFailure(
  validAcquisitionHtml.replace("34.4%", "37.0%"),
  "BREAK_EVEN_RENDERED_RESULT_MISMATCH"
);
expectFailure(
  validAcquisitionHtml,
  "BREAK_EVEN_UPSTREAM_RESULT_MISMATCH",
  { breakEven: { ...breakEven, upstreamResult: 0.37 } }
);
expectFailure(
  `${validAcquisitionHtml}<p>Implied Incremental Value</p>`,
  "UNAUTHORIZED_GROSS_RENT_CAPITALIZATION"
);
expectFailure(
  validAcquisitionHtml.replace("Acquisition Memo", "Preliminary Investment Screening Memorandum"),
  "ACQUISITION_VISIBLE_IDENTITY_MISMATCH"
);
expectFailure(
  validAcquisitionHtml.replace("Source-backed fact bundle complete", "Yes"),
  "MANDATORY_SUPPORT_FACTS_REPRESENTED_BY_PRESENCE_ONLY"
);
expectFailure(
  validAcquisitionHtml,
  "SOURCE_BACKED_SUPPORT_FACT_BUNDLE_INCOMPLETE",
  {
    supportSections: {
      acquisitionRequestContext: {
        facts: { purchase_price: 13500000 },
        factAvailability: {
          sourceBacked: true,
          required: ["purchase_price", "proposed_loan_amount"],
        },
      },
    },
  }
);
expectFailure(
  validAcquisitionHtml.replace("Acquisition Memo", "Acquisition Memo — Confidential"),
  "CUSTOMER_VISIBLE_PROHIBITED_PUNCTUATION"
);
expectFailure(
  validAcquisitionHtml,
  "CANONICAL_QA_DISAGREEMENT",
  { upstreamSeal: { ok: false, issues: [{ code: "UPSTREAM_CONTRACT_FAILURE" }] } }
);

const finalDecision = buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization: {
    compliance: { ok: false, violations: [{
      code: "REQUIRED_RECONCILIATION_RENDERED_VALUES_MISSING",
      category: "internal_render_contract_failure",
      classification: "internal_render_contract_failure",
    }] },
    bossCompliance: { ok: true, fatal_core: [] },
    customerSurfaceModelValidation: { ok: true },
    customerSurfaceHtmlValidation: { ok: true, issues: [] },
    deterministicContractQaSeal: { ok: false },
  },
  coreGate: { publishAllowed: true, fatalReasons: [] },
});
assert.equal(finalDecision.customer_publish_eligible, false);
assert.equal(finalDecision.fatalCategory, "internal_render_contract_failure");
assert.equal(finalDecision.classifications.trueCoreFatal, false);
assert.equal(finalDecision.classifications.internalRenderContractFailure, true);

const screeningT12 = {
  gross_potential_rent: 1612800,
  effective_gross_income: 1500000,
  total_operating_expenses: 555000,
  net_operating_income: 945000,
};
const screeningRentRoll = {
  total_units: 64,
  occupied_units: 60,
  occupancy: 0.9375,
  total_in_place_annual: 1432800,
  total_market_annual: 1718400,
  unit_mix: [{ label: "1BR", count: 64, current_rent: 1865, market_rent: 2238 }],
};
const screeningCoverageHtml = buildScreeningDataCoverageSummary({
  t12Payload: screeningT12,
  computedRentRoll: screeningRentRoll,
  rentRollPayload: screeningRentRoll,
  effectiveReportMode: "screening_v1",
  sourceReconciliationState: reconciliationState,
});
const screeningNoiHtml = buildScreeningNoiStabilityHtml({
  t12Payload: screeningT12,
  computedRentRoll: screeningRentRoll,
  rentRollPayload: screeningRentRoll,
  sourceReconciliationState: reconciliationState,
});
const screeningHtml = `<html><body><h1>Preliminary Investment Screening Memorandum</h1>${screeningCoverageHtml}${screeningNoiHtml}</body></html>`;
const screeningSeal = buildDeterministicReportContractQaSeal({
  html: screeningHtml,
  reportIdentity: { reportMode: "screening_v1", reportType: "screening", reportTier: 1 },
  sourceReconciliation: reconciliationState,
  breakEven,
});
assert.equal(screeningSeal.ok, true, JSON.stringify(screeningSeal.issues));
assert.match(screeningHtml, /T12 Gross Potential Rent[\s\S]*?\$1,612,800/i);
assert.match(screeningHtml, /Break-Even Occupancy[\s\S]*?34\.4%/i);
assert.equal(/Break-Even Occupancy[\s\S]{0,80}37\.0%/i.test(screeningHtml), false);

const reportContractQa = buildReportContractQa({
  reportType: "screening",
  reportTier: 1,
  html: screeningHtml,
  artifacts: [{ type: "t12_parsed", payload: screeningT12 }],
  sourceReportCoverageQa: { source_reconciliation_state: reconciliationState },
});
assert.equal(reportContractQa.deterministic_contract_qa_seal.ok, true);
assert.equal(reportContractQa.deterministic_contract_qa_seal.canonical_qa_agreement, true);

const sealedScreening = runScreeningReportPipeline({
  finalHtml: screeningHtml,
  sourceTruthRequired: false,
  deterministicContractQaSeal: screeningSeal,
});
assert.equal(sealedScreening.sealedLane, "screening_lane");
assert.equal(sealedScreening.deterministicContractQaSeal.ok, true);
assert.throws(
  () => runScreeningReportPipeline({
    finalHtml: screeningHtml,
    sourceTruthRequired: false,
    deterministicContractQaSeal: { ok: false, issues: [{ code: "BAD_RENDER" }] },
  }),
  (error) => error?.code === "REPORT_GENERATION_FAILED" && error?.context?.failure_class === "internal_render_contract_failure"
);

console.log("P0-B deterministic contract QA seal smoke PASS");
