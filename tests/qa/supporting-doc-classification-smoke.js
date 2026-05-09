import assert from "node:assert/strict";
import { inferSupportingDocTypeFromText } from "../../api/parse/parse-doc.js";

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Existing mortgage statement",
      "Current outstanding principal balance $2,450,000",
      "Monthly payment $16,800",
      "Existing lender: ABC Bank",
      "Maturity date 2028-06-01",
    ].join("\n")
  ),
  "mortgage_statement"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Indicative acquisition financing term sheet",
      "Borrower to be determined by Purchaser",
      "Loan amount at purchase price $3,500,000",
      "Proposed LTV 65%",
      "Not a financing commitment",
      "Exit cap 6.25%",
    ].join("\n")
  ),
  "loan_term_sheet"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Property Tax Notice",
      "2025 Municipal Property Taxes $38,400",
      "Roll Number 1234-567-890",
      "Installments due June and September",
    ].join("\n")
  ),
  "property_tax"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Historical Capital Expenditure Summary",
      "Roof Replacement 2018-09-15 $45,000",
      "Boiler Replacement 2020-02-10 $32,000",
      "CapEx items only. No rent lift, ROI, payback, or forward-looking renovation plan provided.",
    ].join("\n")
  ),
  "renovation"
);

assert.equal(
  inferSupportingDocTypeFromText(
    [
      "UNSUPPORTED Market Survey",
      "UNSUPPORTED Appraisal Summary",
      "Phase I ESA environmental report excerpt",
      "This is background support only.",
    ].join("\n")
  ),
  "supporting_documents_unclassified"
);

console.log("supporting-doc-classification smoke PASS");
