import assert from "assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";
process.env.ADMIN_RUN_KEY = process.env.ADMIN_RUN_KEY || "test-admin-key";

const { default: generateClientReportHandler } = await import("../../api/generate-client-report.js");

function buildMockRes() {
  const out = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return out;
}

async function renderUnderwritingHtml(testPayloads, options = {}) {
  const financialsOverride = options?.financials || {};
  const req = {
    headers: {
      "x-admin-run-key": process.env.ADMIN_RUN_KEY,
    },
    body: {
      userId: "synthetic-user",
      property_name: "Synthetic Asset",
      property_address: "100 Example Avenue",
      report_type: "underwriting",
      sections: {},
      financials: {
        refi_ltv_max: 0.75,
        refi_dscr_min: 1.25,
        refi_interest_rate: 0.064,
        refi_amort_years: 30,
        refi_cap_rate_base: 0.055,
        ...financialsOverride,
      },
      __test_return_final_html: true,
      __test_payloads: testPayloads,
    },
  };
  const res = buildMockRes();
  await generateClientReportHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body?.final_html, "string");
  return res.body.final_html;
}

const fullPathHtml = await renderUnderwritingHtml({
  t12Payload: {
    effective_gross_income: 1100000,
    total_operating_expenses: 420000,
    net_operating_income: 680000,
  },
  mortgagePayload: {
    interest_rate: 0.064,
    amort_years: 30,
    monthly_payment: 9200,
  },
  loanTermSheetTermsPayload: {
    debt_basis: "acquisition_financing_assumption",
    purchase_price: 2100000,
    loan_amount: 840000,
    ltv: 0.75,
    interest_rate: 0.061,
    amortization_years: 30,
    source_text: "Loan Amount (at $2,100,000 purchase price) $840,000. 1% lender fee. legal/appraisal costs noted.",
    closing_cost_notes: "legal/appraisal costs noted",
  },
  propertyTaxPayload: {
    annual_tax: 42750,
    source_file_id: "bound-tax-file",
    original_filename: "Bound_Tax_Document.pdf",
  },
  documentSources: [
    {
      file_id: "bound-tax-file",
      original_filename: "Bound_Tax_Document.pdf",
      doc_type: "property_tax",
      parse_status: "parsed",
      uploaded_at: "2026-05-27T21:10:00.000Z",
      semantic_doc_role: "property_tax",
    },
    {
      file_id: "unbound-tax-file",
      original_filename: "Tax_Context_Note.pdf",
      doc_type: "supporting_document",
      parse_status: "parsed",
      uploaded_at: "2026-05-27T21:11:00.000Z",
      semantic_doc_role: "supporting_documents_unclassified",
    },
    {
      file_id: "phase-i-file",
      original_filename: "Phase_I_Environmental.pdf",
      doc_type: "supporting_document",
      parse_status: "parsed",
      uploaded_at: "2026-05-27T21:12:00.000Z",
      semantic_doc_role: "environmental_phase_i_esa",
    },
    {
      file_id: "zoning-file",
      original_filename: "Zoning_Compliance_Memo.pdf",
      doc_type: "supporting_document",
      parse_status: "parsed",
      uploaded_at: "2026-05-27T21:13:00.000Z",
      semantic_doc_role: "zoning_compliance",
    },
    {
      file_id: "purchase-assumptions-file",
      original_filename: "purchase_assumptions_source.txt",
      doc_type: "loan_term_sheet",
      parse_status: "parsed",
      uploaded_at: "2026-05-27T21:14:00.000Z",
      semantic_doc_role: "purchase_assumptions",
    },
  ],
});

// Invariant 1: refi/debt not-assessed gate through full assembled HTML.
assert.match(
  fullPathHtml,
  /Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided\./i
);
assert.equal(/Maximum Financing Envelope|Base Case Supportable Loan/i.test(fullPathHtml), false);
assert.equal(/Current Debt DSCR|DSCR \(Current Debt\)/i.test(fullPathHtml), false);
assert.equal(/Refinance Proceeds \/ Debt Balance|Stressed Proceeds \/ Debt Balance/i.test(fullPathHtml), false);
assert.equal(
  /<td>\s*Current loan balance\s*<\/td>|<td>\s*Amortization \(years\)\s*<\/td>|<td>\s*Refinance cap rate\s*<\/td>/i.test(
    fullPathHtml
  ),
  false
);

// Invariant 2: acquisition triangle unsafe path collapses and avoids contradictory full-table rows.
assert.match(
  fullPathHtml,
  /Acquisition financing inputs were not safe to render as a full debt sizing table\./i
);
assert.equal(/<th>Input<\/th><th>Document-Derived Value<\/th>/i.test(fullPathHtml), false);
assert.equal(/Purchase Price[\s\S]{0,80}\$2,100,000/i.test(fullPathHtml), false);
assert.equal(/Stated Acquisition Loan Amount[\s\S]{0,80}\$840,000/i.test(fullPathHtml), false);
assert.equal(/Derived Acquisition Loan Amount[\s\S]{0,120}\$/i.test(fullPathHtml), false);
assert.equal(/Lender Fee[\s\S]{0,80}0\.0%/i.test(fullPathHtml), false);
assert.equal(/Closing Costs[\s\S]{0,80}0\.0%/i.test(fullPathHtml), false);
assert.match(fullPathHtml, /not current outstanding debt/i);

// Invariant 3: property-tax source binding/document treatment through full assembled HTML.
assert.match(fullPathHtml, /Bound_Tax_Document\.pdf/i);
assert.match(fullPathHtml, /Tax_Context_Note\.pdf/i);
assert.match(fullPathHtml, /Phase_I_Environmental\.pdf/i);
assert.match(fullPathHtml, /Zoning_Compliance_Memo\.pdf/i);
assert.equal(
  /Tax_Context_Note\.pdf[\s\S]{0,260}Structured property tax input/i.test(fullPathHtml),
  false
);
assert.equal(
  /Phase_I_Environmental\.pdf[\s\S]{0,260}Structured property tax input/i.test(fullPathHtml),
  false
);
assert.equal(
  /Zoning_Compliance_Memo\.pdf[\s\S]{0,260}Structured property tax input/i.test(fullPathHtml),
  false
);
assert.match(fullPathHtml, /Bound_Tax_Document\.pdf[\s\S]{0,260}Structured property tax input/i);
assert.match(
  fullPathHtml,
  /purchase_assumptions_source\.txt[\s\S]{0,260}Acquisition assumptions context only; used only for displayed purchase\/cap-rate context and not used to override T12, Rent Roll, or current debt\./i
);
assert.equal(
  /<p class=\"subsection-title\">Listed but Not Quantitatively Modeled<\/p>[\s\S]{0,700}purchase_assumptions_source\.txt/i.test(
    fullPathHtml
  ),
  false
);

const debtBoundTreatmentHtml = await renderUnderwritingHtml({
  t12Payload: {
    effective_gross_income: 1400000,
    total_operating_expenses: 500000,
    net_operating_income: 900000,
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    semantic_doc_role: "current_mortgage_statement",
    source_original_filename: "Current_Debt_Terms_Source.txt",
    current_outstanding_balance: 8750000,
    interest_rate: 5.25,
    amortization_years: 30,
    monthly_payment: 70800,
  },
  propertyTaxPayload: {
    annual_tax: 42750,
    source_file_id: "bound-tax-file",
    original_filename: "Bound_Tax_Document.pdf",
  },
  documentSources: [
    {
      file_id: "current-debt-file",
      original_filename: "Current_Debt_Terms_Source.txt",
      doc_type: "loan_term_sheet",
      parse_status: "parsed",
      uploaded_at: "2026-05-27T22:10:00.000Z",
      semantic_doc_role: "loan_term_sheet",
    },
    {
      file_id: "purchase-assumptions-file",
      original_filename: "Purchase_Assumptions_Context.txt",
      doc_type: "loan_term_sheet",
      parse_status: "parsed",
      uploaded_at: "2026-05-27T22:11:00.000Z",
      semantic_doc_role: "purchase_assumptions",
    },
  ],
});

assert.match(
  debtBoundTreatmentHtml,
  /Current_Debt_Terms_Source\.txt[\s\S]{0,260}Structured current debt input/i
);
assert.equal(
  /Current_Debt_Terms_Source\.txt[\s\S]{0,260}Acquisition assumptions context only; used only for displayed purchase\/cap-rate context and not used to override T12, Rent Roll, or current debt\./i.test(
    debtBoundTreatmentHtml
  ),
  false
);
assert.match(
  debtBoundTreatmentHtml,
  /Purchase_Assumptions_Context\.txt[\s\S]{0,260}Acquisition assumptions context only; used only for displayed purchase\/cap-rate context and not used to override T12, Rent Roll, or current debt\./i
);
assert.equal(/refinance stability was not assessed/i.test(debtBoundTreatmentHtml), false);

console.log("full-underwriting-gates-full-render smoke PASS");
