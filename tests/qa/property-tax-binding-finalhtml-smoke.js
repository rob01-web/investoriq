import assert from "assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const {
  buildDocumentTreatmentSummaryHtml,
} = await import("../../api/_lib/document-treatment-authority.js");

const documentSources = [
  {
    id: "bound-tax-doc",
    original_filename: "Bound_Tax_Document.pdf",
    doc_type: "property_tax",
    display_doc_type: "Property Tax",
    semantic_doc_role: "property_tax",
    semantic_doc_display_label: "property_tax",
    parse_status: "parsed",
  },
  {
    id: "unbound-tax-like-doc",
    original_filename: "Tax_Context_Note.pdf",
    doc_type: "supporting",
    display_doc_type: "Support",
    semantic_doc_role: "supporting_documents_unclassified",
    semantic_doc_display_label: "supporting",
    parse_status: "parsed",
  },
  {
    id: "phase-i-doc",
    original_filename: "Phase_I_Environmental.pdf",
    doc_type: "supporting",
    display_doc_type: "Environmental",
    semantic_doc_role: "environmental",
    semantic_doc_display_label: "environmental",
    parse_status: "parsed",
  },
  {
    id: "zoning-doc",
    original_filename: "Zoning_Compliance_Memo.pdf",
    doc_type: "supporting",
    display_doc_type: "Zoning",
    semantic_doc_role: "zoning",
    semantic_doc_display_label: "zoning",
    parse_status: "parsed",
  },
];

const propertyTaxPayload = {
  annual_tax: 28400,
  source_file_id: "bound-tax-doc",
  original_filename: "Bound_Tax_Document.pdf",
};

const treatmentHtml = buildDocumentTreatmentSummaryHtml({
  documentSources,
  propertyTaxPayload,
});

const finalHtml = `
<section class="section">
  <div class="section-header">Data Coverage / Document Treatment</div>
  ${treatmentHtml}
</section>
`;

assert.match(finalHtml, /Bound_Tax_Document\.pdf[\s\S]{0,260}Structured property tax input/i);
assert.equal(
  /Tax_Context_Note\.pdf[\s\S]{0,260}Structured property tax input/i.test(finalHtml),
  false
);
assert.equal(
  /Phase_I_Environmental\.pdf[\s\S]{0,260}Structured property tax input/i.test(finalHtml),
  false
);
assert.equal(
  /Zoning_Compliance_Memo\.pdf[\s\S]{0,260}Structured property tax input/i.test(finalHtml),
  false
);
assert.equal(
  /Phase_I_Environmental\.pdf[\s\S]{0,260}(Modeled|Structured)[\s\S]{0,120}property tax/i.test(finalHtml),
  false
);
assert.equal(
  /Zoning_Compliance_Memo\.pdf[\s\S]{0,260}(Modeled|Structured)[\s\S]{0,120}property tax/i.test(finalHtml),
  false
);
assert.match(finalHtml, /Environmental due-diligence context only; not used quantitatively\./i);
assert.match(finalHtml, /Zoning\/compliance context only; not used quantitatively\./i);

console.log("property-tax-binding-finalhtml smoke PASS");
