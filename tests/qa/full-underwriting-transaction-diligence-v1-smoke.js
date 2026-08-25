import assert from "node:assert/strict";
import {
  FULL_UNDERWRITING_TRANSACTION_DILIGENCE_VERSION,
  buildFullUnderwritingTransactionDiligenceV1,
} from "../../api/_lib/full-underwriting-transaction-diligence-v1.js";

let checks = 0;
function ok(value, message) { assert.ok(value, message); checks += 1; }
function eq(actual, expected, message) { assert.equal(actual, expected, message); checks += 1; }
function match(value, regex, message) { assert.match(String(value), regex, message); checks += 1; }

function s({ facts = {}, required = [], available = Object.keys(facts), missing = [], sourceBacked = true, sourcePresent = true, filename = "source.pdf" } = {}) {
  return {
    status: sourceBacked ? "required" : "collapsed",
    facts,
    factAvailability: { required, available, missing, sourceBacked, sourcePresent },
    sourceDoc: sourcePresent ? { originalFilename: filename } : null,
  };
}

function fullModel() {
  return {
    identity: { propertyName: "Elite 06 Property", reportType: "underwriting" },
    sections: {
      acquisitionRequestContext: s({
        facts: { purchase_price: 10000000, going_in_cap_rate: 0.065, proposed_loan_amount: 7000000, ltv: 0.7 },
        required: ["purchase_price", "proposed_loan_amount"],
        filename: "Purchase_Assumptions.pdf",
      }),
      proposedFinancingContext: s({
        facts: { proposed_loan_amount: 7000000, ltv: 0.7, interest_rate: 0.0575, amortization_years: 30, lender_fee_percent: 0.01 },
        required: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"],
        filename: "Purchase_Assumptions.pdf",
      }),
      currentDebtContext: s({
        facts: { current_outstanding_balance: 5200000, interest_rate: 0.046, amortization_remaining_years: 22, monthly_payment: 31500, maturity_date: "2030-06-01" },
        required: ["current_outstanding_balance", "interest_rate", "amortization_remaining_years", "monthly_payment", "maturity_date"],
        filename: "Current_Debt.pdf",
      }),
      appraisalContext: s({
        facts: { appraisal_value: 10800000, stabilized_noi: 720000, stabilized_cap_rate: 0.0667 },
        filename: "Appraisal.pdf",
      }),
      marketSurveyContext: s({
        facts: { market_rent_ranges: [{ unit_type: "1BR", low_monthly_rent: 1800, high_monthly_rent: 2000 }] },
        filename: "Market_Survey.pdf",
      }),
      environmentalContext: s({
        facts: { phase_i_status: "No recognized environmental conditions identified in summary" },
        filename: "Phase_I.pdf",
      }),
      renovationContext: s({
        facts: { total_renovation_budget: 850000, capital_plan_duration_months: 18 },
        filename: "CapEx_Plan.pdf",
      }),
    },
  };
}

const contract = buildFullUnderwritingTransactionDiligenceV1({ customerSurfaceModel: fullModel() });
eq(contract.version, FULL_UNDERWRITING_TRANSACTION_DILIGENCE_VERSION);
eq(contract.source, "full_underwriting_transaction_diligence");
eq(contract.authority.authorityCreating, false);
eq(contract.authority.sourceTruthMutationAllowed, false);
eq(contract.authority.publicationAuthority, false);
eq(contract.authority.deliveryAuthority, false);
eq(contract.authority.revisionAuthority, false);
eq(contract.authority.scenarioAuthority, false);
eq(contract.authority.investmentRecommendationAllowed, false);
eq(contract.authority.optionalDiligenceMayBlockCorePublication, false);
eq(contract.authority.downstreamConsumeOnly, true);
eq(contract.identity.propertyName, "Elite 06 Property");
eq(contract.identity.reportType, "underwriting");

eq(contract.transactionMetrics.purchasePrice.value, 10000000);
eq(contract.transactionMetrics.goingInCapRate.value, 0.065);
eq(contract.transactionMetrics.proposedLoanAmount.value, 7000000);
eq(contract.transactionMetrics.statedLtv.value, 0.7);
eq(contract.transactionMetrics.proposedInterestRate.value, 0.0575);
eq(contract.transactionMetrics.proposedAmortizationYears.value, 30);
eq(contract.transactionMetrics.proposedLenderFeePercent.value, 0.01);
eq(contract.transactionMetrics.proposedEquityRequirement.value, 3000000);
eq(contract.transactionMetrics.proposedEquityRequirement.evidenceClass, "deterministic_calculated");
eq(contract.transactionMetrics.proposedEquityRequirement.formula, "purchase_price - proposed_loan_amount");
eq(contract.transactionMetrics.amountDerivedLtv.value, 0.7);
eq(contract.transactionMetrics.statedVsAmountLtvDifference.value, 0);
eq(contract.transactionMetrics.currentDebtBalance.value, 5200000);
eq(contract.transactionMetrics.currentDebtMaturity.value, "2030-06-01");

eq(contract.diligenceCoverage.length, 6);
eq(contract.coverageSummary.totalAreas, 6);
eq(contract.coverageSummary.documented, 6);
eq(contract.coverageSummary.documentedWithLimitations, 0);
eq(contract.coverageSummary.receivedNotDisplayReady, 0);
eq(contract.coverageSummary.notProvided, 0);

for (const entry of contract.diligenceCoverage) {
  eq(entry.status, "documented");
  eq(entry.sourcePresent, true);
}
const appraisalCoverage = contract.diligenceCoverage.find((x) => x.key === "appraisal_context");
eq(appraisalCoverage.contextOnly, true);
eq(appraisalCoverage.evidenceClass, "third_party_context");
match(appraisalCoverage.treatment, /does not replace InvestorIQ valuation/i);
const purchaseCoverage = contract.diligenceCoverage.find((x) => x.key === "purchase_assumptions");
eq(purchaseCoverage.contextOnly, false);
eq(purchaseCoverage.evidenceClass, "source_backed");
match(purchaseCoverage.treatment, /not existing debt/i);
eq(purchaseCoverage.sourceLabel, "Purchase assumptions / proposed financing support");
assert.doesNotMatch(contract.diligenceCoverage.map((entry) => entry.sourceLabel || "").join(" "), /\.(?:pdf|xlsx?|csv)\b/i);
checks += 1;

eq(contract.thirdPartyContext.appraisal.appraisalValue, 10800000);
eq(contract.thirdPartyContext.appraisal.stabilizedNoi, 720000);
eq(contract.thirdPartyContext.appraisal.stabilizedCapRate, 0.0667);
eq(contract.thirdPartyContext.marketSurvey.rangeCount, 1);
match(contract.thirdPartyContext.environmental.phaseIStatus, /No recognized/i);
eq(contract.thirdPartyContext.renovation.totalRenovationBudget, 850000);
eq(contract.thirdPartyContext.renovation.durationMonths, 18);

eq(contract.openDiligenceItems.length, 0);
eq(contract.investorQuestions.length, 0);
eq(contract.sectionDispositions.transactionSnapshot.disposition, "include");
eq(contract.sectionDispositions.diligenceCoverage.disposition, "include");
eq(contract.sectionDispositions.openDiligenceItems.disposition, "omit");
eq(contract.sectionDispositions.investorQuestions.disposition, "omit");
eq(contract.provenance.rawParserAccess, false);
eq(contract.provenance.filenameHeuristicsUsedForFacts, false);
eq(contract.provenance.filenamePresentationPolicy, "source_register_only");
eq(contract.provenance.supportDocumentOverrideAllowed, false);
eq(contract.provenance.quantitativeFactsRequireSourceBackedSection, true);
eq(contract.provenance.deterministicCalculations.length, 3);
match(contract.governingDisclosures.join(" "), /does not by itself block publication/i);
match(contract.governingDisclosures.join(" "), /do not override the accepted T12 or Rent Roll/i);
eq(Object.isFrozen(contract), true);
eq(Object.isFrozen(contract.transactionMetrics), true);
eq(Object.isFrozen(contract.diligenceCoverage), true);

const partial = fullModel();
partial.sections.proposedFinancingContext = s({
  facts: { proposed_loan_amount: 6900000, ltv: 0.7 },
  required: ["proposed_loan_amount", "ltv", "interest_rate", "amortization_years"],
  available: ["proposed_loan_amount", "ltv"],
  missing: ["interest_rate", "amortization_years"],
  sourceBacked: true,
  sourcePresent: true,
  filename: "Partial_Terms.pdf",
});
partial.sections.currentDebtContext = s({
  facts: {}, required: ["current_outstanding_balance"], available: [], missing: ["current_outstanding_balance"], sourceBacked: false, sourcePresent: true, filename: "Unreadable_Debt.pdf"
});
partial.sections.appraisalContext = s({ facts: {}, sourceBacked: false, sourcePresent: false });
partial.sections.marketSurveyContext = s({ facts: {}, sourceBacked: false, sourcePresent: false });
partial.sections.environmentalContext = s({ facts: {}, sourceBacked: false, sourcePresent: false });
partial.sections.renovationContext = s({ facts: {}, sourceBacked: false, sourcePresent: false });
const partialContract = buildFullUnderwritingTransactionDiligenceV1({ customerSurfaceModel: partial });
eq(partialContract.coverageSummary.documented, 0);
eq(partialContract.coverageSummary.documentedWithLimitations, 1);
eq(partialContract.coverageSummary.receivedNotDisplayReady, 1);
eq(partialContract.coverageSummary.notProvided, 4);
ok(partialContract.openDiligenceItems.some((x) => x.code === "PROPOSED_FINANCING_FACTS_INCOMPLETE"));
ok(partialContract.openDiligenceItems.some((x) => x.code === "CURRENT_DEBT_FACTS_INCOMPLETE"));
ok(partialContract.openDiligenceItems.some((x) => x.code === "PROPOSED_LTV_RECONCILIATION_OPEN"));
ok(partialContract.investorQuestions.some((q) => /current market-rent survey/i.test(q)));
ok(partialContract.investorQuestions.some((q) => /environmental/i.test(q)));
ok(partialContract.investorQuestions.some((q) => /CapEx plan/i.test(q)));
eq(partialContract.transactionMetrics.currentDebtBalance.value, null);
eq(partialContract.transactionMetrics.currentDebtMaturity.value, null);
eq(partialContract.sectionDispositions.openDiligenceItems.disposition, "include_qualified");
eq(partialContract.sectionDispositions.investorQuestions.disposition, "include");

const falseFacts = fullModel();
falseFacts.sections.appraisalContext = s({
  facts: { appraisal_value: 99999999 },
  sourceBacked: false,
  sourcePresent: true,
  available: ["appraisal_value"],
  missing: [],
  filename: "Unaccepted_Appraisal.pdf",
});
const falseFactsContract = buildFullUnderwritingTransactionDiligenceV1({ customerSurfaceModel: falseFacts });
eq(falseFactsContract.thirdPartyContext.appraisal.appraisalValue, null);
eq(falseFactsContract.thirdPartyContext.appraisal.displayReady, false);
eq(falseFactsContract.diligenceCoverage.find((x) => x.key === "appraisal_context").status, "received_not_display_ready");

assert.throws(
  () => buildFullUnderwritingTransactionDiligenceV1({ customerSurfaceModel: null }),
  /GOVERNED_CUSTOMER_SURFACE_MODEL_REQUIRED/
);
checks += 1;

const visible = JSON.stringify({ open: partialContract.openDiligenceItems, questions: partialContract.investorQuestions });
assert.doesNotMatch(visible, /\bBUY\b|\bSELL\b|\bHOLD\b|IRR|MOIC/i);
checks += 1;

console.log(`PASS full-underwriting-transaction-diligence-v1-smoke (${checks}/${checks})`);
