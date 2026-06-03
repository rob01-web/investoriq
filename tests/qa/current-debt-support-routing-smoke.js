import assert from "node:assert/strict";
import {
  inferSupportingDocTypeFromText,
  resolveLoanTermCurrentDebtPromotion,
} from "../../api/parse/parse-doc.js";
import {
  buildAcquisitionAssumptionState,
  buildCurrentDebtAssessmentState,
} from "../../api/_lib/report-surface-contracts.js";

// Explicit non-acquisition current debt evidence should be routed for loan-term parsing.
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Supporting Loan Summary",
      "Outstanding loan balance: $8,750,000",
      "Interest rate: 5.25%",
      "Amortization: 30 years",
      "Loan-to-value: 70%",
      "Existing debt support provided for current operations.",
    ].join("\n")
  ),
  "loan_term_sheet"
);
const nonAcquisitionPromotion = resolveLoanTermCurrentDebtPromotion({
  rawText: [
    "Supporting Loan Summary",
    "Outstanding loan balance: $8,750,000",
    "Interest rate: 5.25%",
    "Amortization: 30 years",
    "Loan-to-value: 70%",
    "Existing debt support provided for current operations.",
  ].join("\n"),
  outstandingBalance: 8750000,
  purchasePrice: null,
  derivedAcquisitionLoanAmount: null,
  ltv: 70,
});
assert.equal(nonAcquisitionPromotion.explicitCurrentDebtProof, true);
assert.equal(nonAcquisitionPromotion.hasAcquisitionOrProposedSignals, false);
assert.equal(nonAcquisitionPromotion.shouldExposeCurrentDebtAliases, true);

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
assert.equal(explicitCurrentDebtSupportState.current_debt_dscr_status, "computed");
assert.equal(explicitCurrentDebtSupportState.has_true_current_debt_balance, true);
assert.equal(explicitCurrentDebtSupportState.current_debt_limitation_reason_code, null);

const explicitCurrentDebtAssumptionState = buildAcquisitionAssumptionState({
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
assert.equal(explicitCurrentDebtAssumptionState.acquisition_support_status, "validated_supported");
assert.equal(explicitCurrentDebtAssumptionState.current_debt_separated, true);

// Appraisal context is valuation-only and must not promote current debt aliases.
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Appraisal Summary",
      "As-is Value: $12,000,000",
      "Cap Rate: 5.75%",
      "Valuation context only.",
    ].join("\n")
  ),
  "appraisal"
);
const appraisalPromotion = resolveLoanTermCurrentDebtPromotion({
  rawText: [
    "Appraisal Summary",
    "As-is Value: $12,000,000",
    "Cap Rate: 5.75%",
    "Valuation context only.",
  ].join("\n"),
  outstandingBalance: null,
  purchasePrice: null,
  derivedAcquisitionLoanAmount: null,
  ltv: null,
});
assert.equal(appraisalPromotion.explicitCurrentDebtProof, false);
assert.equal(appraisalPromotion.hasAcquisitionOrProposedSignals, false);
assert.equal(appraisalPromotion.shouldExposeCurrentDebtAliases, false);

// Acquisition/proposed-only financing must remain acquisition support, not current debt.
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Indicative acquisition financing term sheet",
      "Purchase price: $12,500,000",
      "Proposed loan amount: $8,750,000",
      "Proposed LTV: 70%",
      "Not a financing commitment",
    ].join("\n")
  ),
  "loan_term_sheet"
);
const acquisitionPromotion = resolveLoanTermCurrentDebtPromotion({
  rawText: [
    "Indicative acquisition financing term sheet",
    "Purchase price: $12,500,000",
    "Proposed loan amount: $8,750,000",
    "Proposed LTV: 70%",
    "Not a financing commitment",
  ].join("\n"),
  outstandingBalance: 8750000,
  purchasePrice: 12500000,
  derivedAcquisitionLoanAmount: 8750000,
  ltv: 70,
});
assert.equal(acquisitionPromotion.explicitCurrentDebtProof, false);
assert.equal(acquisitionPromotion.hasAcquisitionOrProposedSignals, true);
assert.equal(acquisitionPromotion.shouldExposeCurrentDebtAliases, false);

const appraisalPlusAcquisitionPromotion = resolveLoanTermCurrentDebtPromotion({
  rawText: [
    "Indicative acquisition financing term sheet",
    "Purchase price: $12,500,000",
    "Proposed loan amount: $8,750,000",
    "Proposed LTV: 70%",
    "Appraisal Summary",
    "As-is Value: $12,000,000",
  ].join("\n"),
  outstandingBalance: 8750000,
  purchasePrice: 12500000,
  derivedAcquisitionLoanAmount: 8750000,
  ltv: 70,
});
assert.equal(appraisalPlusAcquisitionPromotion.explicitCurrentDebtProof, false);
assert.equal(appraisalPlusAcquisitionPromotion.hasAcquisitionOrProposedSignals, true);
assert.equal(appraisalPlusAcquisitionPromotion.shouldExposeCurrentDebtAliases, false);

// Ambiguous financing language without explicit current debt evidence must fail safe.
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Loan terms review",
      "Interest rate discussed",
      "Amortization discussed",
      "Payment structure discussed",
      "No balance figure is provided.",
    ].join("\n")
  ),
  "supporting_documents_unclassified"
);

// Generic support without debt semantics remains unclassified.
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Broker context note",
      "General market commentary and sponsor notes.",
      "No quantified debt terms included.",
    ].join("\n")
  ),
  "supporting_documents_unclassified"
);

// Environmental context must not route as debt.
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Phase I environmental review",
      "Environmental due diligence context only.",
      "No quantified financing terms included.",
    ].join("\n")
  ),
  "supporting_documents_unclassified"
);

console.log("current-debt-support-routing smoke PASS");
