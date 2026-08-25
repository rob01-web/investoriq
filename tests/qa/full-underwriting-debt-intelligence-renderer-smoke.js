import assert from "node:assert/strict";
import { buildFullUnderwritingDebtIntelligenceV1 } from "../../api/_lib/full-underwriting-debt-intelligence-v1.js";
import { renderFullUnderwritingDebtIntelligenceV1Html } from "../../api/_lib/full-underwriting-debt-intelligence-renderer.js";

let passed = 0;
function check(condition, message) { assert.ok(condition, message); passed += 1; }
function eq(actual, expected, message) { assert.equal(actual, expected, message); passed += 1; }

const model = {
  identity: { propertyName: "Debt Renderer Property", reportType: "underwriting" },
  sections: {
    operatingStatementTTMSummary: { factAvailability: { sourceBacked: true }, facts: { net_operating_income: 945000 } },
    unitMix: { factAvailability: { sourceBacked: true }, facts: { occupancy: 0.9375, total_units: 64 } },
    currentDebtContext: { factAvailability: { sourceBacked: true }, facts: { current_outstanding_balance: 6800000, interest_rate: 0.0485, amortization_remaining_years: 24, maturity_date: "2029-11-01" } },
    proposedFinancingContext: { factAvailability: { sourceBacked: true }, facts: { proposed_loan_amount: 9450000, ltv: 0.70, interest_rate: 0.0595, amortization_years: 30, lender_fee_percent: 0.0085 } },
    debtServiceCoverage: { factAvailability: { sourceBacked: true, sectionDisplayReady: true }, facts: { currentDebt: { annualDebtService: 471000, monthlyDebtService: 39250, dscr: 2.0063694268 }, proposedFinancing: { annualDebtService: 676249.2382089655, monthlyDebtService: 56354.10318408046, dscr: 1.3974137738074446 } } },
    debtTermAnalysis: { factAvailability: { sourceBacked: true, sectionDisplayReady: true }, facts: { lenderFee: { calculationStatus: "calculated", lenderFeeDollars: 80325 }, maturity: { currentDebt: { analysisStatus: "assessed", asOfDate: "2026-07-17", daysToMaturity: 1203, maturityPosition: "future" } }, refinancingReadiness: { assessmentStatus: "limited", assessmentState: "current_maturity_identified_refinancing_terms_not_available", refinancingModelEligible: false, proposedAcquisitionFinancingTreatedAsRefinancing: false } } },
    debtCapacityAndCoverage: { factAvailability: { sourceBacked: true, sectionDisplayReady: true }, facts: {
      proposedDebtYield: { result: 0.10 }, proposedMortgageConstant: { result: 0.0715607659 },
      currentDebtInclusiveBreakEvenOccupancy: { result: 0.6361607143 }, proposedDebtInclusiveBreakEvenOccupancy: { result: 0.763418634 },
      currentDebtInclusiveBreakEvenMonthlyRentPerUnit: { result: 1335.9375 }, proposedDebtInclusiveBreakEvenMonthlyRentPerUnit: { result: 1603.188 },
    } },
  },
};

const contract = buildFullUnderwritingDebtIntelligenceV1({ customerSurfaceModel: model });
const html = renderFullUnderwritingDebtIntelligenceV1Html(contract);

check(html.length > 1500, "substantive renderer output");
check(html.includes('data-iq-elite="debt-intelligence-v1"'), "ELITE-07 marker");
check(html.includes("Debt Intelligence"), "heading");
check(html.includes('data-iq-elite07-surface="coverage-headroom"'), "coverage surface");
check(html.includes('data-iq-elite07-surface="proposed-rate-sensitivity"'), "rate sensitivity surface");
check(html.includes('data-iq-elite07-surface="maturity-context"'), "maturity surface");
check(html.includes('data-iq-elite07-surface="capacity-interpretation"'), "capacity surface");
check(html.includes("Debt Service and Coverage"), "coverage heading");
check(html.includes("Proposed Rate / DSCR Sensitivity"), "rate heading");
check(html.includes("Debt Term and Maturity Analysis"), "maturity heading");
check(html.includes("Debt Capacity and Coverage"), "capacity heading");
check(html.includes("Scenario Analysis - Not Source Evidence"), "scenario badge");
check((html.match(/data-iq-evidence-class="scenario"/g) || []).length >= 4, "scenario labels retained");
check(html.includes('data-iq-elite07-rate-stress="50"'), "+50 bps row");
check(html.includes('data-iq-elite07-rate-stress="100"'), "+100 bps row");
check(html.includes('data-iq-elite07-rate-stress="200"'), "+200 bps row");
check(html.includes("6.45%"), "+50 stressed rate rendered");
check(html.includes("6.95%"), "+100 stressed rate rendered");
check(html.includes("7.95%"), "+200 stressed rate rendered");
check(html.includes("1.26x"), "+100 DSCR rendered");
check(html.includes("1,203 days"), "maturity days rendered");
check(html.includes("Scheduled after the analysis date"), "maturity status uses institutional customer language");
check(html.includes("Amortization Remaining"), "current amortization remains visible after legacy suppression");
check(html.includes("Monthly Payment"), "current monthly debt service remains visible after legacy suppression");
check(html.includes("Proposed Monthly Debt Service"), "proposed monthly debt service remains visible after legacy suppression");
check(html.includes("Current Debt Annual Debt Service</td><td>$471,000"), "current annual debt service retains its canonical label-value contract");
check(html.includes("Proposed Acquisition Financing Annual Debt Service</td><td>$676,249"), "proposed annual debt service retains its canonical label-value contract");
check(html.includes("Proposed Acquisition Financing DSCR</td><td>1.40x"), "proposed DSCR retains its canonical label-value contract");
check(html.includes("Proposed LTV</td><td>70.0%"), "proposed LTV uses canonical customer-surface precision");
check(html.includes("Lender / Origination Fee"), "proposed lender fee remains visible after legacy suppression");
check(html.includes("Proposed Lender Fee</td><td>$80,325"), "proposed lender fee dollars remain visible after legacy suppression");
check(html.includes("10.0%"), "debt yield rendered at customer-surface precision");
check(html.includes("7.2%"), "mortgage constant rendered at customer-surface precision");
check(html.includes("63.6%"), "current debt-inclusive occupancy rendered at customer-surface precision");
check(html.includes("not a lender covenant"), "1.00x caveat");
check(html.includes("not a forecast"), "scenario caveat");
check(html.includes("does not establish lender covenants"), "debt boundary visible");
check(!/[—–]/.test(html), "prohibited punctuation normalized");
check(!/high risk|moderate risk|low risk/i.test(html), "no inferred risk grades");
check(!/Investment Recommendation|Final Recommendation|\bBUY\b|\bSELL\b|\bHOLD\b/i.test(html), "no recommendation authority");
check(!/\brefinance\b|\brefi\b/i.test(html), "no forbidden refinance/refi surface");
check(!/\bBreak[- ]Even Occupancy\b/i.test(html), "ELITE-07 does not collide with canonical Break-Even Occupancy label");
check(html.includes("Debt-Inclusive Occupancy Coverage Point"), "debt-inclusive occupancy uses distinct coverage-point label");
check(!/\.pdf|\.xlsx|\.csv/i.test(html), "no filenames");
check(!/customerSurfaceModel|canonical_source_truth_package|raw parser|sourceBacked/i.test(html.replace(/data-iq-[^=]+="[^"]*"/g, "")), "no internal authority leakage");
check(!/\bgoverned\b/i.test(html.replace(/<[^>]+>/g, " ")), "customer-visible governed engineering language absent");

const invalid = structuredClone(contract);
invalid.authority.lenderCovenantInferenceAllowed = true;
assert.throws(() => renderFullUnderwritingDebtIntelligenceV1Html(invalid), /ELITE_DEBT_INTELLIGENCE_CONTRACT_INVALID/); passed += 1;
eq(typeof html, "string", "HTML string");

console.log(`PASS full-underwriting-debt-intelligence-renderer-smoke (${passed}/${passed})`);
