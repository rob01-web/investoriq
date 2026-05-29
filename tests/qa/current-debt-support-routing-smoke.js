import assert from "node:assert/strict";
import {
  inferSupportingDocTypeFromText,
  resolveLoanTermCurrentDebtPromotion,
} from "../../api/parse/parse-doc.js";

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
