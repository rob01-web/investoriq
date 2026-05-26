import assert from "assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const { __test__: generatorTest } = await import("../../api/generate-client-report.js");

const nonAssessedCurrentDebtState = {
  current_debt_dscr_status: "not_assessed",
  has_true_current_debt_balance: false,
  current_debt_limitation_reason_code: "no_current_outstanding_balance",
};

const rawDebtLikeMortgagePayload = {
  outstanding_balance: 1450000,
  interest_rate: 0.064,
  amort_years: 30,
  monthly_payment: 9200,
};

const refiFinancials = {
  refi_ltv_max: 0.75,
  refi_dscr_min: 1.25,
  refi_interest_rate: 0.064,
  refi_amort_years: 30,
  refi_cap_rate_base: 0.055,
  stress_noi_shocks: [-0.05],
  stress_cap_rate_bps: [0],
  stress_rate_bps: [0],
};

const t12Payload = {
  net_operating_income: 640000,
};

const refiDebtRenderState = generatorTest.buildRefiDebtRenderState({
  currentDebtAssessmentState: nonAssessedCurrentDebtState,
  mortgagePayload: rawDebtLikeMortgagePayload,
  loanTermSheetTermsPayload: null,
  financials: refiFinancials,
  t12Payload,
});
assert.equal(refiDebtRenderState.allowDebtMath, false);

const screeningRefiSufficiencyHtml = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: refiFinancials,
  t12Payload,
  currentDebtAssessmentState: nonAssessedCurrentDebtState,
  mortgagePayload: rawDebtLikeMortgagePayload,
  loanTermSheetTermsPayload: null,
});
const screeningRefiBlockHtml =
  screeningRefiSufficiencyHtml +
  (refiDebtRenderState.allowDebtMath
    ? generatorTest.buildFinancingEnvelopeGrid(640000, 42)
    : "");

const notAssessedDisclosureCopy =
  "Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided.";

const finalHtml = `
<section>
  <p class="subsection-title">DSCR Sensitivity &amp; Coverage Threshold Analysis</p>
  ${screeningRefiBlockHtml}
  <p class="small">${notAssessedDisclosureCopy}</p>
</section>
<section>
  <p class="subsection-title">Refinance Stress Test &amp; Binding Constraint Analysis</p>
  <p>${notAssessedDisclosureCopy}</p>
</section>
<section>
  <p class="subsection-title">Deal Scorecard</p>
  <table><tbody>
    <tr><td>Expense Ratio</td><td>36.9%</td><td>10/10</td></tr>
  </tbody></table>
</section>
`;

assert.match(finalHtml, /Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided\./i);
assert.equal(/Maximum Financing Envelope|Base Case Supportable Loan/i.test(finalHtml), false);
assert.equal(/Current loan balance|Interest rate|Amortization \(years\)|Refinance cap rate/i.test(finalHtml), false);
assert.equal(/Refinance Proceeds \/ Debt Balance|Stressed Proceeds \/ Debt Balance|Refinance Stability Classification:\s*(Stable|Sensitized|Fragile|Refinance Shortfall Under Stress)/i.test(finalHtml), false);
assert.equal(/<th>Input<\/th><th>Status<\/th><th>Provided Value<\/th>|<th>DSCR Threshold<\/th>/i.test(finalHtml), false);
assert.equal(/Current Debt DSCR|DSCR \(Current Debt\)/i.test(finalHtml), false);

console.log("refi-gate-not-assessed-finalhtml smoke PASS");
