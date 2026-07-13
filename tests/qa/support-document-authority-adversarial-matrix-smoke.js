import assert from "assert";

import { adjudicateSupportDocumentAuthority } from "../../api/_lib/support-document-authority-adjudicator.js";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";

const completeAcquisition = [
  "Purchase Assumptions / Proposed Acquisition Financing",
  "Purchase Price $13,500,000",
  "NOI Basis $945,000",
  "Going-In Cap Rate 7.00%",
  "Proposed Loan Amount $9,450,000",
  "LTV 70%",
  "Interest Rate 5.95%",
  "Amortization 30 years",
  "Lender Fee 0.85%",
].join("\n");

const completeCurrentDebt = [
  "Existing Current Debt Statement",
  "Current Outstanding Balance $6,800,000",
  "Interest Rate 4.85%",
  "Amortization Remaining 24 years",
  "Monthly Payment $39,250",
  "Maturity Date 2029-11-01",
].join("\n");

function decision(name, sourceText, { filename = `${name}.pdf`, parserType = "document_text_extracted", parserRole = null } = {}) {
  const fileId = `file-${name}`;
  const artifacts = [{
    id: `artifact-${name}`,
    type: "document_text_extracted",
    payload: { file_id: fileId, original_filename: filename, text: sourceText },
  }];
  if (parserType !== "document_text_extracted" || parserRole) {
    artifacts.push({
      id: `parser-${name}`,
      type: parserType,
      payload: { file_id: fileId, original_filename: filename, semantic_doc_role: parserRole },
    });
  }
  return adjudicateSupportDocumentAuthority({ file: { file_id: fileId, original_filename: filename }, artifacts });
}

const scenarios = [
  {
    name: "affirmative_acquisition_financing_complete",
    result: decision("affirmative-acquisition", completeAcquisition),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "affirmative_current_debt_complete",
    result: decision("affirmative-current", completeCurrentDebt),
    role: "current_debt_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "negated_acquisition_reference",
    result: decision("negated-acquisition", "Document note: this is not proposed acquisition financing and does not contain purchase assumptions."),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "negated_current_debt_reference",
    result: decision("negated-current", "Document note: this is not current debt and does not contain a current mortgage statement."),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "appraisal_references_purchase_price",
    result: decision("appraisal-reference", "Appraisal Summary / Valuation Context\nAppraised Value $14,200,000\nPurchase Price $13,500,000 is shown only as a transaction reference."),
    role: "appraisal_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "current_debt_references_proposed_financing",
    result: decision("current-reference", `${completeCurrentDebt}\nKeep separate from proposed acquisition financing.`),
    role: "current_debt_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "discharged_historical_debt",
    result: decision("historical-debt", "Discharged Mortgage / Historical Debt\nFormer mortgage balance $4,200,000. Paid off in full."),
    role: "historical_debt_context", roleAccepted: true, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "illustrative_non_binding_financing",
    result: decision("illustrative-financing", `${completeAcquisition}\nIllustrative and non-binding; not a loan commitment.`),
    role: "purchase_assumptions", roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "incomplete_financing_bundle",
    result: decision("incomplete-financing", "Purchase Assumptions / Proposed Acquisition Financing\nPurchase Price $13,500,000"),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
  {
    name: "mixed_current_and_proposed_debt",
    result: decision("mixed-financing", `${completeAcquisition}\n${completeCurrentDebt}`),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "filename_text_disagreement",
    result: decision("filename-disagreement", completeAcquisition, { filename: "Current_Debt.pdf" }),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "artifact_type_text_disagreement",
    result: decision("artifact-disagreement", completeAcquisition, { parserType: "appraisal_parsed", parserRole: "appraisal" }),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "ocr_split_labels_and_punctuation_loss",
    result: decision("ocr-split", completeAcquisition.replace("Purchase Price", "Purchase\nPrice").replace("Proposed Loan Amount", "Proposed\nLoan Amount").replace("LTV", "L . T . V")),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "missing_not_ocr_creates_mixed_evidence",
    result: decision("ocr-missing-not", `${completeAcquisition}\nExisting Current Debt Statement\nCurrent Outstanding Balance $6,800,000\nMonthly Payment $39,250\nMaturity Date 2029-11-01`),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "handwritten_or_stamped_superseded_overlay",
    result: decision("stamped-overlay", `${completeAcquisition}\nSTAMP: SUPERSEDED`),
    role: "purchase_assumptions", roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: true,
  },
  {
    name: "environmental_reference_does_not_cross_promote",
    result: decision("environmental-reference", "Phase I ESA / Environmental Due Diligence\nNo recognized environmental condition. Purchase price is referenced only for file identification."),
    role: "environmental_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "market_survey_references_appraisal_and_financing",
    result: decision("market-reference", "Market Rent Survey\nRent comparables support market context. Appraised value and purchase price appear only in the transaction notes."),
    role: "market_survey_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "renovation_references_debt_and_market_rent",
    result: decision("renovation-reference", "Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000\nCurrent mortgage and market rent are referenced only as constraints."),
    role: "renovation_capex_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "property_tax_support_bundle",
    result: decision("property-tax", "Property Tax Bill\nAnnual Tax $185,000\nAssessment roll 2026."),
    role: "property_tax_support", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "rotated_reading_order_with_labels_preserved",
    result: decision("rotated-order", completeAcquisition.split("\n").reverse().join("\n")),
    role: "purchase_assumptions", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "appraisal_text_overrides_purchase_parser_candidate",
    result: decision("appraisal-parser-disagreement", "Appraisal Report\nAppraised Value $14,200,000", { parserType: "loan_term_sheet_parsed", parserRole: "purchase_assumptions" }),
    role: "appraisal_context", roleAccepted: true, sourcePresent: true, sourceBacked: true, ambiguity: false,
  },
  {
    name: "optional_support_unreadable",
    result: adjudicateSupportDocumentAuthority({ file: { file_id: "unreadable-file", original_filename: "Unreadable.pdf" }, artifacts: [] }),
    role: null, roleAccepted: false, sourcePresent: true, sourceBacked: false, ambiguity: false,
  },
];

for (const scenario of scenarios) {
  assert.equal(scenario.result.canonicalRole, scenario.role, `${scenario.name}: canonical role`);
  assert.equal(scenario.result.roleAccepted, scenario.roleAccepted, `${scenario.name}: role accepted`);
  assert.equal(scenario.result.sourcePresent, scenario.sourcePresent, `${scenario.name}: source present`);
  assert.equal(scenario.result.sourceBacked, scenario.sourceBacked, `${scenario.name}: source backed`);
  assert.equal(scenario.result.ambiguity.present, scenario.ambiguity, `${scenario.name}: ambiguity`);
}

function packageForTexts(entries) {
  const uploadedFiles = entries.map((entry) => ({ id: entry.id, original_filename: entry.filename, parse_status: "parsed" }));
  const artifacts = entries.map((entry) => ({
    id: `artifact-${entry.id}`,
    type: "document_text_extracted",
    payload: { file_id: entry.id, original_filename: entry.filename, text: entry.text },
  }));
  return buildCanonicalSourceTruthPackage({ jobId: "adversarial-support-matrix", propertyName: "Matrix Property", uploadedFiles, artifacts });
}

const duplicatePackage = packageForTexts([
  { id: "duplicate-a", filename: "Terms A.pdf", text: completeAcquisition },
  { id: "duplicate-b", filename: "Terms Copy.pdf", text: completeAcquisition },
]);
assert.equal(duplicatePackage.support.accepted.length, 1);
assert.equal(duplicatePackage.support.advisory.some((entry) => entry.status === "duplicate"), true);
assert.equal(duplicatePackage.true_blockers.some((entry) => /support/i.test(entry)), false);

const conflictingPackage = packageForTexts([
  { id: "conflict-a", filename: "Terms A.pdf", text: completeAcquisition },
  { id: "conflict-b", filename: "Terms B.pdf", text: completeAcquisition.replace("$13,500,000", "$14,000,000") },
]);
assert.equal(conflictingPackage.support.accepted.some((entry) => entry.canonical_role === "purchase_assumptions"), false);
assert.equal(conflictingPackage.support.advisory.filter((entry) => entry.status === "conflicting").length, 2);
assert.equal(conflictingPackage.true_blockers.some((entry) => /support/i.test(entry)), false);

console.log(`support-document authority adversarial matrix PASS (${scenarios.length + 2} scenarios)`);
