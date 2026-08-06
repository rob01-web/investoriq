import assert from "assert/strict";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
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

function buildValidatedCoreTestPayload(testPayloads = {}, { includeT12Artifact = true, includeRentRollArtifact = true } = {}) {
  const t12Payload = testPayloads?.t12Payload || {};
  const rentRollPayload = testPayloads?.rentRollPayload || {
    total_units: 64,
    occupancy: 0.9375,
    annual_in_place_rent: 1432800,
    unit_mix: [
      { label: "1BR", count: 32, current_rent: 1850, market_rent: 2050 },
      { label: "2BR", count: 32, current_rent: 1881, market_rent: 2425 },
    ],
  };
  const existingDocumentSources = Array.isArray(testPayloads?.documentSources) ? testPayloads.documentSources : [];
  const existingCoverageArtifacts = Array.isArray(testPayloads?.coverageArtifacts) ? testPayloads.coverageArtifacts : [];
  const documentSources = [
    {
      id: "t12-file",
      original_filename: "Handler_Fixture_T12.xlsx",
      doc_type: "t12",
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      parse_status: "parsed",
      parse_error: null,
    },
    {
      id: "rent-roll-file",
      original_filename: "Handler_Fixture_Rent_Roll.xlsx",
      doc_type: "rent_roll",
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      parse_status: "parsed",
      parse_error: null,
    },
    ...existingDocumentSources.filter((source) => !["t12-file", "rent-roll-file"].includes(source?.id || source?.file_id)),
  ];
  const coverageArtifacts = [...existingCoverageArtifacts];
  if (includeT12Artifact) {
    coverageArtifacts.push({
      id: "artifact-t12",
      file_id: "t12-file",
      type: "t12_parsed",
      payload: {
        source_file_id: "t12-file",
        source_original_filename: "Handler_Fixture_T12.xlsx",
        t12_parsed: {
          effective_gross_income: t12Payload.effective_gross_income,
          total_operating_expenses: t12Payload.total_operating_expenses,
          net_operating_income: t12Payload.net_operating_income,
        },
      },
    });
  }
  if (includeRentRollArtifact) {
    coverageArtifacts.push({
      id: "artifact-rent-roll",
      file_id: "rent-roll-file",
      type: "rent_roll_parsed",
      payload: {
        source_file_id: "rent-roll-file",
        source_original_filename: "Handler_Fixture_Rent_Roll.xlsx",
        rent_roll_parsed: {
          total_units: rentRollPayload.total_units,
          annual_in_place_rent: rentRollPayload.annual_in_place_rent,
          occupancy: rentRollPayload.occupancy,
          unit_mix: rentRollPayload.unit_mix,
        },
      },
    });
  }
  const sourceByRole = (role) => documentSources.find((source) => source?.semantic_doc_role === role) || null;
  const supportArtifact = (file, type, payload) => {
    if (!file || coverageArtifacts.some((artifact) => artifact?.file_id === file.file_id && artifact?.type === type)) return;
    coverageArtifacts.push({
      id: `artifact-${file.file_id}-${type}`,
      file_id: file.file_id,
      original_filename: file.original_filename,
      type,
      payload: {
        source_file_id: file.file_id,
        source_original_filename: file.original_filename,
        ...payload,
      },
    });
  };
  const propertyTaxFile = testPayloads?.propertyTaxPayload?.source_file_id
    ? documentSources.find((source) => source?.file_id === testPayloads.propertyTaxPayload.source_file_id)
    : sourceByRole("property_tax");
  if (propertyTaxFile && Number.isFinite(Number(testPayloads?.propertyTaxPayload?.annual_tax))) {
    supportArtifact(propertyTaxFile, "property_tax_parsed", {
      validated: true,
      annual_tax: testPayloads.propertyTaxPayload.annual_tax,
    });
  }
  const loanTerms = testPayloads?.loanTermSheetTermsPayload;
  if (loanTerms && typeof loanTerms === "object") {
    const currentDebtFile = sourceByRole("current_mortgage_statement") || sourceByRole("current_debt");
    const purchaseAssumptionsFile = sourceByRole("purchase_assumptions");
    const supportFile = currentDebtFile || purchaseAssumptionsFile;
    const supportType = currentDebtFile ? "mortgage_statement_parsed" : "loan_term_sheet_parsed";
    if (supportFile) {
      supportArtifact(supportFile, supportType, {
        validated: true,
        ...loanTerms,
      });
    }
  }
  const supportSourceText = (source) => {
    if (source?.semantic_doc_role === "property_tax" && testPayloads?.propertyTaxPayload) {
      return `Property tax bill annual property tax $${Number(testPayloads.propertyTaxPayload.annual_tax).toLocaleString("en-US")}`;
    }
    if (source?.semantic_doc_role === "purchase_assumptions" && loanTerms) {
      return loanTerms.source_text || [
        "Purchase assumptions / proposed acquisition financing",
        Number.isFinite(Number(loanTerms.purchase_price)) ? `Purchase Price $${Number(loanTerms.purchase_price).toLocaleString("en-US")}` : "",
        Number.isFinite(Number(loanTerms.proposed_loan_amount ?? loanTerms.loan_amount))
          ? `Proposed Acquisition Loan $${Number(loanTerms.proposed_loan_amount ?? loanTerms.loan_amount).toLocaleString("en-US")}`
          : "",
        Number.isFinite(Number(loanTerms.going_in_cap_rate)) ? `Going-In Cap Reference ${loanTerms.going_in_cap_rate}%` : "",
        Number.isFinite(Number(loanTerms.interest_rate)) ? `Interest Rate ${loanTerms.interest_rate}%` : "",
        Number.isFinite(Number(loanTerms.amortization_years)) ? `Amortization ${loanTerms.amortization_years} years` : "",
      ].filter(Boolean).join("\n");
    }
    if (["current_mortgage_statement", "current_debt"].includes(source?.semantic_doc_role) && loanTerms) {
      return [
        "Existing Current Debt Statement",
        Number.isFinite(Number(loanTerms.current_outstanding_balance)) ? `Current Outstanding Balance $${Number(loanTerms.current_outstanding_balance).toLocaleString("en-US")}` : "",
        Number.isFinite(Number(loanTerms.interest_rate)) ? `Interest Rate ${loanTerms.interest_rate}%` : "",
        Number.isFinite(Number(loanTerms.amortization_years)) ? `Amortization Remaining ${loanTerms.amortization_years} years` : "",
        Number.isFinite(Number(loanTerms.monthly_payment)) ? `Monthly Payment $${Number(loanTerms.monthly_payment).toLocaleString("en-US")}` : "",
      ].filter(Boolean).join("\n");
    }
    if (source?.semantic_doc_role === "environmental_phase_i_esa") return "Phase I Environmental Site Assessment";
    if (source?.semantic_doc_role === "zoning_compliance") return "Zoning compliance memo";
    if (source?.semantic_doc_role === "supporting_documents_unclassified") return "Supporting document context";
    return "Source document text";
  };
  for (const source of documentSources) {
    if (!source?.file_id || ["t12-file", "rent-roll-file"].includes(source.file_id)) continue;
    if (coverageArtifacts.some((artifact) => artifact?.file_id === source.file_id && artifact?.type === "document_text_extracted")) continue;
    supportArtifact(source, "document_text_extracted", { text: supportSourceText(source) });
  }
  return {
    ...testPayloads,
    rentRollPayload,
    documentSources,
    coverageArtifacts,
  };
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
      __test_payloads: buildValidatedCoreTestPayload(testPayloads),
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

assert.match(fullPathHtml, /InvestorIQ Underwriting Report/i);
assert.match(fullPathHtml, /Operating Statement \/ TTM Summary/i);
assert.match(fullPathHtml, /Revenue \/ Expense \/ NOI Bridge/i);
assert.match(fullPathHtml, /Effective Gross Income<\/td><td style="font-weight:600;">\$1,100,000<\/td>/i);
assert.match(fullPathHtml, /Less: Total Operating Expenses<\/td><td style="font-weight:600;">\$420,000<\/td>/i);
assert.match(fullPathHtml, /Equals: Net Operating Income<\/td><td style="font-weight:600;">\$680,000<\/td>/i);

// Invariant 1: refi/debt not-assessed gate through full assembled HTML.
assert.match(
  fullPathHtml,
  /Current debt context<\/td><td style="font-weight:600;">Not provided<\/td>/i
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
  /Acquisition Request Context/i
);
assert.equal(/<th>Input<\/th><th>Document-Derived Value<\/th>/i.test(fullPathHtml), false);
assert.equal(/Purchase Price[\s\S]{0,80}\$2,100,000/i.test(fullPathHtml), false);
assert.equal(/Stated Acquisition Loan Amount[\s\S]{0,80}\$840,000/i.test(fullPathHtml), false);
assert.equal(/Derived Acquisition Loan Amount[\s\S]{0,120}\$/i.test(fullPathHtml), false);
assert.equal(/Lender Fee[\s\S]{0,80}0\.0%/i.test(fullPathHtml), false);
assert.equal(/Closing Costs[\s\S]{0,80}0\.0%/i.test(fullPathHtml), false);
assert.match(fullPathHtml, /Current debt context<\/td><td style="font-weight:600;">Not provided<\/td>/i);

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
assert.match(fullPathHtml, /Bound_Tax_Document\.pdf[\s\S]{0,260}Property Tax Support/i);
assert.match(
  fullPathHtml,
  /purchase_assumptions_source\.txt[\s\S]{0,260}Source-Present Support Document \/ Not Authority-Accepted/i
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
  /Current_Debt_Terms_Source\.txt[\s\S]{0,260}(Debt Context|Source-Present Support Document)/i
);
assert.equal(
  /Current_Debt_Terms_Source\.txt[\s\S]{0,260}Acquisition assumptions context only; used only for displayed purchase\/cap-rate context and not used to override T12, Rent Roll, or current debt\./i.test(
    debtBoundTreatmentHtml
  ),
  false
);
assert.match(
  debtBoundTreatmentHtml,
  /Purchase_Assumptions_Context\.txt/i
);
assert.equal(/refinance stability was not assessed/i.test(debtBoundTreatmentHtml), false);

const goingInCapOnlyHtml = await renderUnderwritingHtml(
  {
    t12Payload: {
      effective_gross_income: 1320000,
      total_operating_expenses: 470000,
      net_operating_income: 850000,
    },
    loanTermSheetTermsPayload: {
      semantic_doc_role: "purchase_assumptions",
      purchase_price: 2100000,
      going_in_cap_rate: 5.75,
      interest_rate: 5.9,
      amortization_years: 30,
    },
    documentSources: [
      {
        file_id: "purchase-assumptions-only-file",
        original_filename: "Purchase_Assumptions_Only.txt",
        doc_type: "loan_term_sheet",
        parse_status: "parsed",
        uploaded_at: "2026-05-27T23:21:00.000Z",
        semantic_doc_role: "purchase_assumptions",
      },
    ],
  },
  {
    financials: {
      refi_cap_rate_base: 5.75,
    },
  }
);
assert.equal(/document-derived exit cap/i.test(goingInCapOnlyHtml), false);
assert.match(
  goingInCapOnlyHtml,
  /Cap-Rate Value Indication|going-in cap rate/i
);

const invalidCoreResponse = buildMockRes();
await generateClientReportHandler(
  {
    headers: {
      "x-admin-run-key": process.env.ADMIN_RUN_KEY,
    },
    body: {
      userId: "synthetic-invalid-core-fixture",
      property_name: "Synthetic Asset",
      property_address: "100 Example Avenue",
      report_type: "underwriting",
      __test_return_final_html: true,
      __test_payloads: buildValidatedCoreTestPayload(
        {
          t12Payload: {
            effective_gross_income: 1100000,
            total_operating_expenses: 420000,
            net_operating_income: 680000,
          },
        },
        { includeRentRollArtifact: false }
      ),
    },
  },
  invalidCoreResponse
);
assert.equal(invalidCoreResponse.statusCode, 500);
assert.equal(invalidCoreResponse.body?.error, "ACQUISITION_MEMO_SOURCE_TRUTH_NOT_PUBLISHABLE");
assert.ok(invalidCoreResponse.body?.diagnostics?.true_blockers?.includes("CORE_RENT_ROLL_NOT_VALIDATED"));
assert.equal(invalidCoreResponse.body?.final_html, undefined);

console.log("full-underwriting-gates-full-render smoke PASS");
