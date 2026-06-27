import assert from "assert/strict";
import fs from "fs";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const {
  buildDocumentTreatmentSummaryHtml,
} = await import("../../api/_lib/document-treatment-authority.js");
const { inferSupportingDocTypeFromText } = await import("../../api/parse/parse-doc.js");

const parseDocSource = fs.readFileSync("api/parse/parse-doc.js", "utf8");
const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");

// 1) Filename/slot are hints only; not authoritative modeled truth.
const filenameOnlyRentRollHtml = buildDocumentTreatmentSummaryHtml({
  documentSources: [{ original_filename: "Rent Roll.xlsx" }],
});
assert.equal(/Structured rent roll input/i.test(filenameOnlyRentRollHtml), false);
assert.equal(
  /<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]{0,220}Rent Roll\.xlsx/i.test(filenameOnlyRentRollHtml),
  false
);
assert.match(filenameOnlyRentRollHtml, /Displayed \/ Limited Use|Listed but Not Quantitatively Modeled/i);

const filenameOnlyT12Html = buildDocumentTreatmentSummaryHtml({
  documentSources: [{ original_filename: "T12.pdf" }],
});
assert.equal(/Structured operating input/i.test(filenameOnlyT12Html), false);
assert.equal(
  /<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]{0,220}T12\.pdf/i.test(filenameOnlyT12Html),
  false
);

// 2) Safe content-based rescue path exists in parser/worker contracts.
assert.match(parseDocSource, /detectRequiredFinancialDocTypeFromText/);
assert.match(parseDocSource, /if \(\['rent_roll', 't12'\]\.includes\(String\(declaredDocType \|\| ''\)\.toLowerCase\(\)\) && !isTabularInput\)/);
assert.match(parseDocSource, /if \(oppositeRescue\?\.ok && oppositeRescue\?\.opposite_doc_type === 't12' && oppositeRescue\?\.payload\)/);
assert.match(parseDocSource, /\.update\(\{ parse_status: 'parsed', parse_error: null, doc_type: 't12' \}\)/);
assert.match(parseDocSource, /\.update\(\{ parse_status: 'parsed', parse_error: null, doc_type: 'rent_roll' \}\)/);
assert.match(workerSource, /missingStructuredArtifacts\.push\('rent_roll'\)/);
assert.match(workerSource, /missingStructuredArtifacts\.push\('t12_or_operating_statement'\)/);

// 3) Unsafe rescue must fail closed / remain limited-use.
const marketSurveyHtml = buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "market_rent_survey_context_only.txt",
      doc_type: "rent_roll",
      parse_status: "parsed_with_warnings",
      parse_error: "unsupported_file_type_for_structured_parsing",
    },
  ],
});
assert.match(marketSurveyHtml, /Market survey \/ rent context only; not used to override rent roll\./i);
assert.equal(/Structured rent roll input/i.test(marketSurveyHtml), false);

const brokerContextHtml = buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Broker_Email_Context.msg",
      doc_type: "supporting_documents_unclassified",
      parse_status: "parsed_with_warnings",
      parse_error: "doc_type_unclassified",
    },
  ],
});
assert.equal(/Structured operating input|Structured rent roll input/i.test(brokerContextHtml), false);

const environmentalNotTaxHtml = buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Phase_I_Environmental.pdf",
      doc_type: "supporting_documents_unclassified",
      semantic_doc_role: "property_tax",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: { annual_tax: 21000, source_file_id: "tax-doc-1" },
});
assert.match(environmentalNotTaxHtml, /Environmental due-diligence context only; not used quantitatively\./i);
assert.equal(/Structured property tax input/i.test(environmentalNotTaxHtml), false);

// 4) Validation authority signals exist and remain deterministic.
assert.match(parseDocSource, /validateCoreT12Payload/);
assert.match(parseDocSource, /invalid_core_t12_values/);
assert.match(parseDocSource, /insufficient_t12_text_coverage/);
assert.match(parseDocSource, /unsupported_file_type_for_structured_parsing/);
assert.match(parseDocSource, /has_minimum_t12_coverage/);
assert.equal(/classified from the uploaded file names/i.test(parseDocSource), false);

// 4b) Loan term semantics guard: acquisition/proposed must not become current debt aliases without explicit proof.
assert.match(parseDocSource, /explicitCurrentDebtProof/);
assert.match(parseDocSource, /hasAcquisitionOrProposedSignals/);
assert.match(parseDocSource, /shouldExposeCurrentDebtAliases/);
assert.match(parseDocSource, /current_outstanding_balance:\s*shouldExposeCurrentDebtAliases\s*\?\s*outstanding_balance\s*:\s*null/);
assert.match(parseDocSource, /current_loan_balance:\s*shouldExposeCurrentDebtAliases\s*\?\s*outstanding_balance\s*:\s*null/);
assert.match(parseDocSource, /debt_basis:\s*normalizedDebtBasis/);
assert.match(parseDocSource, /outstanding_balance_not_promoted_without_explicit_current_debt_proof/);
assert.match(parseDocSource, /acquisition_or_proposed_financing_not_current_debt/);
assert.match(parseDocSource, /supporting_doc_financing_route_ambiguous/);

// 4c) Supporting-doc financing classifier behavior is conservative on generic/mixed financing text.
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Loan Terms Summary",
      "Term sheet excerpt",
      "Rate 5.25%",
      "Amortization 30 years",
      "Estimated amount $2,500,000",
    ].join("\n")
  ),
  "supporting_documents_unclassified"
);
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Current Mortgage Statement",
      "Current outstanding principal balance: $2,100,000",
      "Current monthly debt service: $13,625",
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
    ].join("\n")
  ),
  "loan_term_sheet"
);
assert.equal(
  inferSupportingDocTypeFromText(
    [
      "Acquisition financing overview",
      "Purchase price $3,500,000 and proposed LTV 65%",
      "Current balance references are preliminary and not certified",
      "Loan terms provided for context only",
    ].join("\n")
  ),
  "supporting_documents_unclassified"
);

// 5/6) Customer-copy regression guards.
const combinedSource = `${parseDocSource}\n${workerSource}`;
assert.equal(/BUY|SELL|HOLD recommendation/i.test(combinedSource), false);
assert.equal(/classified from the uploaded file names/i.test(combinedSource), false);
assert.equal(/upload more documents|upload replacement documents|\bresume\b/i.test(combinedSource), false);

console.log("core-doc-routing-rescue smoke PASS");
