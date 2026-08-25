import assert from "node:assert/strict";
import { buildFullUnderwritingTransactionDiligenceV1 } from "../../api/_lib/full-underwriting-transaction-diligence-v1.js";
import { renderFullUnderwritingTransactionDiligenceV1Html } from "../../api/_lib/full-underwriting-transaction-diligence-renderer.js";

let checks = 0;
function ok(v, m) { assert.ok(v, m); checks += 1; }
function match(v, r, m) { assert.match(String(v), r, m); checks += 1; }
function noMatch(v, r, m) { assert.doesNotMatch(String(v), r, m); checks += 1; }
function eq(a,b,m) { assert.equal(a,b,m); checks += 1; }

function s(facts, filename) {
  return { facts, factAvailability: { required: Object.keys(facts), available: Object.keys(facts), missing: [], sourceBacked: true, sourcePresent: true }, sourceDoc: { originalFilename: filename } };
}
const model = {
  identity: { propertyName: "Renderer Property", reportType: "underwriting" },
  sections: {
    acquisitionRequestContext: s({ purchase_price: 12000000, going_in_cap_rate: 0.06, proposed_loan_amount: 7800000, ltv: 0.65 }, "Purchase.pdf"),
    proposedFinancingContext: s({ proposed_loan_amount: 7800000, ltv: 0.65, interest_rate: 0.055, amortization_years: 30, lender_fee_percent: 0.01 }, "Purchase.pdf"),
    currentDebtContext: s({ current_outstanding_balance: 5000000, maturity_date: "2029-12-01" }, "Debt.pdf"),
    appraisalContext: s({ appraisal_value: 12500000, stabilized_noi: 800000, stabilized_cap_rate: 0.064 }, "Appraisal.pdf"),
    marketSurveyContext: s({ market_rent_ranges: [{ unit_type: "2BR", low_monthly_rent: 2000, high_monthly_rent: 2300 }] }, "Market.pdf"),
    environmentalContext: s({ phase_i_status: "No RECs identified in summary" }, "PhaseI.pdf"),
    renovationContext: s({ total_renovation_budget: 600000, capital_plan_duration_months: 12 }, "CapEx.pdf"),
  },
};
const contract = buildFullUnderwritingTransactionDiligenceV1({ customerSurfaceModel: model });
const html = renderFullUnderwritingTransactionDiligenceV1Html(contract);
match(html, /Transaction &amp; Diligence Intelligence/);
match(html, /Transaction Snapshot/);
match(html, /Diligence Coverage/);
match(html, /Third-Party \/ Support Context/);
match(html, /\$12,000,000/);
match(html, /\$7,800,000/);
match(html, /65\.00%/);
match(html, /5\.50%/);
match(html, /30 years/);
match(html, /\$4,200,000/);
match(html, /\$5,000,000/);
match(html, /2029-12-01/);
match(html, /Third-party appraisal support/);
match(html, /Third-party market survey support/);
match(html, /Environmental \/ Phase I ESA support/);
match(html, /Renovation \/ CapEx support/);
noMatch(html, /(?:Purchase|Debt|Appraisal|Market|PhaseI|CapEx)\.pdf/i);
match(html, /Third-party valuation context/i);
match(html, /does not replace Rent Roll evidence/i);
match(html, /does not by itself invalidate otherwise sufficient core underwriting/i);
noMatch(html, /\bBUY\b|\bSELL\b|\bHOLD\b|IRR|MOIC/i);
noMatch(html, /customerSurfaceModel|canonical_source_truth_package|raw parser/i);
eq(renderFullUnderwritingTransactionDiligenceV1Html(null), "");

const partial = structuredClone(model);
partial.sections.environmentalContext = { facts: {}, factAvailability: { required: [], available: [], missing: [], sourceBacked: false, sourcePresent: false }, sourceDoc: null };
const partialHtml = renderFullUnderwritingTransactionDiligenceV1Html(buildFullUnderwritingTransactionDiligenceV1({ customerSurfaceModel: partial }));
match(partialHtml, /Key Investor Questions/);
match(partialHtml, /environmental \/ Phase I ESA diligence/i);
match(partialHtml, /Not provided/);

console.log(`PASS full-underwriting-transaction-diligence-renderer-smoke (${checks}/${checks})`);
