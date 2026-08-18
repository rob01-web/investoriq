import assert from "assert/strict";

import { buildCanonicalSourcePackage } from "../../api/_lib/legacy-source-package-fixture.js";
import { reconcileAcquisitionMemoV2SupportDocRole } from "../../api/_lib/acquisition-memo-v2-role-reconciler.js";

function buildCurrentDebtSourcePackage() {
  return buildCanonicalSourcePackage(
    [{ fileId: "current-debt-file", originalFilename: "Current_Debt_Statement.pdf", mimeType: "application/pdf" }],
    [
      {
        fileId: "current-debt-file",
        semantic_doc_role: "purchase_assumptions",
        debt_basis: "proposed_acquisition",
        payload: {
          text: [
            "Existing Current Debt Statement",
            "This is an existing/current debt context document.",
            "Current Outstanding Balance $1,000,000",
            "Interest Rate 5.00%",
            "Amortization Remaining 25 years",
            "Monthly Payment $5,850",
            "Maturity Date 2030-01-01",
            "This is separate from proposed acquisition financing.",
          ].join("\n"),
        },
      },
    ]
  );
}

function buildPurchaseAssumptionsSourcePackage() {
  return buildCanonicalSourcePackage(
    [{ fileId: "purchase-file", originalFilename: "Proposed_Acquisition_Financing.pdf", mimeType: "application/pdf" }],
    [
      {
        fileId: "purchase-file",
        semantic_doc_role: "purchase_assumptions",
        debt_basis: "proposed_acquisition",
        payload: {
          text: [
            "Purchase Assumptions / Proposed Acquisition Financing",
            "Purchase Price $2,000,000",
            "NOI Basis $1,200,000",
            "Going-In Cap Reference 6.00%",
            "Proposed Loan Amount $1,400,000",
            "LTV 70%",
            "Interest Rate 5.75%",
            "Amortization 30 years",
          ].join("\n"),
        },
      },
    ]
  );
}

function buildAppraisalSourcePackage() {
  return buildCanonicalSourcePackage(
    [{ fileId: "appraisal-file", originalFilename: "Appraisal_Context.pdf", mimeType: "application/pdf" }],
    [{ fileId: "appraisal-file", semantic_doc_role: "appraisal", payload: { text: "Appraisal Summary / Valuation Context. This document does not create current debt evidence." } }]
  );
}

const pollutedCurrentDebtArtifact = {
  fileId: "current-debt-file",
  original_filename: "Current_Debt_Statement.pdf",
  semantic_doc_role: "purchase_assumptions",
  debt_basis: "proposed_acquisition",
  payload: {
    text: [
      "Existing Current Debt Statement",
      "This is an existing/current debt context document.",
      "Current Outstanding Balance $1,000,000",
      "Interest Rate 5.00%",
      "Amortization Remaining 25 years",
      "Monthly Payment $5,850",
      "Maturity Date 2030-01-01",
      "This is separate from proposed acquisition financing.",
    ].join("\n"),
  },
};

const reconciledCurrentDebt = reconcileAcquisitionMemoV2SupportDocRole({
  file: pollutedCurrentDebtArtifact,
  artifacts: [pollutedCurrentDebtArtifact],
  acceptedTruth: {
    semanticDocRole: "purchase_assumptions",
    debtBasis: "proposed_acquisition",
    semanticDocDisplayLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
  },
});

assert.equal(reconciledCurrentDebt.canonicalRole, "current_debt_context");
assert.equal(reconciledCurrentDebt.canonicalLabel, "Existing Debt Context / Current Mortgage / Debt Statement");
assert.equal(reconciledCurrentDebt.acceptedSemanticDocRole, "current_debt_context");
assert.equal(reconciledCurrentDebt.acceptedSourceTruth.hasCurrentDebt, true);
assert.equal(reconciledCurrentDebt.acceptedSourceTruth.hasPurchaseAssumptions, false);

const currentDebtSource = buildCurrentDebtSourcePackage().supportDocs.get("current-debt-file");
const purchaseSource = buildPurchaseAssumptionsSourcePackage().supportDocs.get("purchase-file");
const appraisalSource = buildAppraisalSourcePackage().supportDocs.get("appraisal-file");

assert.equal(currentDebtSource?.canonicalRole, "current_debt_context");
assert.match(String(currentDebtSource?.document_role_label || currentDebtSource?.canonicalLabel || ""), /current mortgage|debt statement/i);
assert.equal(currentDebtSource?.extractedFacts?.current_outstanding_balance, 1000000);
assert.equal(currentDebtSource?.extractedFacts?.interest_rate, 0.05);
assert.equal(currentDebtSource?.extractedFacts?.amortization_remaining_years, 25);
assert.equal(currentDebtSource?.extractedFacts?.monthly_payment, 5850);
assert.equal(currentDebtSource?.extractedFacts?.maturity_date, "2030-01-01");
assert.equal(currentDebtSource?.canonicalRole === "purchase_assumptions", false);

assert.equal(purchaseSource?.canonicalRole, "purchase_assumptions");
assert.equal(purchaseSource?.canonicalRole === "current_debt_context", false);

assert.equal(appraisalSource?.canonicalRole === "current_debt_context", false);

console.log("acquisition-memo current debt role reconciliation smoke PASS");
