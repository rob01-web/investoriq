import assert from "assert";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docractor-key";
process.env.QA_REVIEW_ENABLED ||= "false";

const generateClientReport = (await import("../../api/generate-client-report.js")).default;
const { buildCanonicalSourcePackage } = await import("../../api/_lib/canonical-source-package.js");
const { buildAcquisitionMemoProjection } = await import("../../api/_lib/acquisition-memo-projection.js");
const { renderAcquisitionMemo } = await import("../../api/_lib/acquisition-memo-renderer.js");
const { renderCompleteAcquisitionMemoV2Html } = await import("../../api/_lib/acquisition-memo-v2-document.js");

function buildStructuredCoreSourcePackage() {
  const uploadedFiles = [
    { fileId: "t12-file", originalFilename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "rent-roll-file", originalFilename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "assumptions-file", originalFilename: "Stonebridge_Assumptions.pdf", mimeType: "application/pdf" },
    { fileId: "current-debt-file", originalFilename: "Current_Debt_Stonebridge.pdf", mimeType: "application/pdf" },
    { fileId: "reno-file", originalFilename: "Stonebridge_Reno_Plan.pdf", mimeType: "application/pdf" },
    { fileId: "appraisal-file", originalFilename: "Stonebridge_Appraisal_Summary.pdf", mimeType: "application/pdf" },
    { fileId: "survey-file", originalFilename: "Stonebridge_Market_Survey.pdf", mimeType: "application/pdf" },
    { fileId: "phase-file", originalFilename: "Stonebridge_Phase_I_ESA.pdf", mimeType: "application/pdf" },
  ];

  const structuredUnits = [
    ...Array.from({ length: 32 }, (_, index) => ({
      label: "1BR",
      unit_number: `1-${index + 1}`,
      current_rent: 1850,
      market_rent: 2050,
    })),
    ...Array.from({ length: 32 }, (_, index) => ({
      label: "2BR",
      unit_number: `2-${index + 1}`,
      current_rent: 1881,
      market_rent: 2425,
    })),
  ];

  const parsedArtifacts = [
    {
      fileId: "t12-file",
      semantic_doc_role: "t12",
      payload: {
        t12_parsed: {
          income_lines: [
            { label: "Effective Gross Income", amount: 1500000 },
          ],
          expense_lines: [
            { label: "Property Taxes", amount: 185000 },
            { label: "Insurance", amount: 72000 },
            { label: "Repairs & Maintenance", amount: 104000 },
            { label: "Utilities", amount: 86000 },
            { label: "Property Management", amount: 60000 },
            { label: "Payroll / Admin", amount: 28000 },
          ],
          effective_gross_income: 1500000,
          total_operating_expenses: 555000,
          net_operating_income: 945000,
          gross_potential_rent: 1718400,
        },
      },
    },
    {
      fileId: "rent-roll-file",
      semantic_doc_role: "rent_roll",
      payload: {
        rent_roll_parsed: {
          total_units: 64,
          occupancy: 0.9375,
          unit_mix: [
            { label: "1BR", count: 32, current_rent: 1850, market_rent: 2050 },
            { label: "2BR", count: 32, current_rent: 1881, market_rent: 2425 },
          ],
          units: structuredUnits,
          annual_in_place_rent: 1432800,
          annual_market_rent: 1718400,
        },
      },
    },
    {
      fileId: "assumptions-file",
      original_filename: "Stonebridge_Assumptions.pdf",
      semantic_doc_role: "purchase_assumptions",
      debt_basis: "proposed_acquisition",
      payload: {
        document_text_extracted: "Purchase assumptions / proposed acquisition financing\nPurchase Price $13,500,000\nNOI Basis $945,000\nGoing-In Cap Reference 7.00%\nProposed Acquisition Loan $9,450,000\nLTV 70.0%\nRate 5.95%\nAmortization 30 years\nFee 0.85%",
      },
    },
    {
      fileId: "current-debt-file",
      original_filename: "Current_Debt_Stonebridge.pdf",
      semantic_doc_role: "current_debt",
      debt_basis: "current_debt",
      payload: {
        document_text_extracted: "Existing Current Debt Statement\nCurrent Outstanding Balance $6,800,000\nInterest Rate 4.85%\nAmortization Remaining 24 years\nMonthly Payment $39,250\nMaturity Date 2029-11-01",
      },
    },
    {
      fileId: "reno-file",
      original_filename: "Stonebridge_Reno_Plan.pdf",
      semantic_doc_role: "renovation_plan",
      payload: {
        document_text_extracted: "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000",
      },
    },
    {
      fileId: "appraisal-file",
      original_filename: "Stonebridge_Appraisal_Summary.pdf",
      semantic_doc_role: "appraisal",
      payload: {
        document_text_extracted: "Appraisal Summary / Valuation Context",
      },
    },
    {
      fileId: "survey-file",
      original_filename: "Stonebridge_Market_Survey.pdf",
      semantic_doc_role: "market_survey",
      payload: {
        document_text_extracted: "Market Rent Survey Context",
      },
    },
    {
      fileId: "phase-file",
      original_filename: "Stonebridge_Phase_I_ESA.pdf",
      semantic_doc_role: "phase_i_esa",
      payload: {
        document_text_extracted: "Phase I ESA / Environmental Due Diligence Context",
      },
    },
  ];

  return buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);
}

function makeClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeHandlerResponse() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return body;
    },
  };
}

const baseSourcePackage = buildStructuredCoreSourcePackage();
const baseProjection = buildAcquisitionMemoProjection(baseSourcePackage);
const baseRenderedAcquisitionMemo = renderAcquisitionMemo(baseProjection);

assert.doesNotThrow(() => renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: baseProjection,
  renderedAcquisitionMemo: baseRenderedAcquisitionMemo,
  sourcePackage: baseSourcePackage,
  coreMetrics: {
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    annualRentUpside: 285600,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 0.37,
    purchasePrice: 13500000,
    goingInCapRate: 7,
  },
  reportMeta: { propertyName: "Stonebridge", generatedAt: "2026-06-20T00:00:00.000Z" },
  propertyProfile: { propertyName: "Stonebridge", propertyAddress: "123 Main St" },
}));

const malformedCurrentDebtProjection = makeClone(baseProjection);
malformedCurrentDebtProjection.currentDebtContext = {
  extractedFacts: {
    current_outstanding_balance: 6800000,
    interest_rate: 4.85,
    amortization_remaining_years: 24,
    monthly_payment: 39250,
    maturity_date: "2029-11-01",
  },
};
malformedCurrentDebtProjection.supportDocProjection = {
  ...(malformedCurrentDebtProjection.supportDocProjection || {}),
  currentDebtContext: malformedCurrentDebtProjection.currentDebtContext,
};

const malformedCurrentDebtHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: malformedCurrentDebtProjection,
  renderedAcquisitionMemo: baseRenderedAcquisitionMemo,
  sourcePackage: baseSourcePackage,
  coreMetrics: {
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    annualRentUpside: 285600,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 0.37,
    purchasePrice: 13500000,
    goingInCapRate: 0,
  },
  reportMeta: { propertyName: "Stonebridge", generatedAt: "2026-06-20T00:00:00.000Z" },
  propertyProfile: { propertyName: "Stonebridge", propertyAddress: "123 Main St" },
});

assert.match(malformedCurrentDebtHtml, /Current Outstanding Balance[\s\S]{0,80}\$6,800,000/i);
assert.match(malformedCurrentDebtHtml, /Interest Rate[\s\S]{0,40}4\.85%/i);
assert.match(malformedCurrentDebtHtml, /Amortization Remaining[\s\S]{0,40}24 years/i);
assert.match(malformedCurrentDebtHtml, /Monthly Payment[\s\S]{0,40}\$39,250/i);
assert.match(malformedCurrentDebtHtml, /Maturity Date[\s\S]{0,40}2029-11-01/i);
assert.equal(malformedCurrentDebtHtml.includes('Going-In Cap Rate</td><td style="font-weight:600;">0.0%</td>'), false);
assert.match(malformedCurrentDebtHtml, /Going-In Cap Rate[\s\S]{0,80}7\.0%/i);
assert.match(malformedCurrentDebtHtml, /Implied value at going-in cap rate[\s\S]{0,80}\$13,500,000/i);
assert.equal(malformedCurrentDebtHtml.includes('Implied value at going-in cap rate</td><td style="font-weight:600;">Not available</td>'), false);

const malformedProposedFinancingProjection = makeClone(baseProjection);
malformedProposedFinancingProjection.proposedFinancingContext = {
  extractedFacts: {},
};
const missingProposedFinancingHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: malformedProposedFinancingProjection,
  renderedAcquisitionMemo: { ...baseRenderedAcquisitionMemo, documentTreatmentSummaryHtml: "<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY --><table><tbody><tr><td>x</td></tr></tbody></table><!-- END DOCUMENT_TREATMENT_SUMMARY -->" },
  sourcePackage: baseSourcePackage,
  coreMetrics: {
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    annualRentUpside: 285600,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 0.37,
    purchasePrice: 13500000,
    goingInCapRate: 7,
  },
  reportMeta: { propertyName: "Stonebridge", generatedAt: "2026-06-20T00:00:00.000Z" },
  propertyProfile: { propertyName: "Stonebridge", propertyAddress: "123 Main St" },
});

assert.doesNotThrow(() => missingProposedFinancingHtml);
assert.match(missingProposedFinancingHtml, /<!DOCTYPE html>/i);
assert.match(missingProposedFinancingHtml, /InvestorIQ/i);

const nullRenderedMemoHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: baseProjection,
  renderedAcquisitionMemo: null,
  sourcePackage: baseSourcePackage,
  coreMetrics: {
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    annualRentUpside: 285600,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 0.37,
    purchasePrice: 13500000,
    goingInCapRate: 7,
  },
  reportMeta: { propertyName: "Stonebridge", generatedAt: "2026-06-20T00:00:00.000Z" },
  propertyProfile: { propertyName: "Stonebridge", propertyAddress: "123 Main St" },
});

assert.match(nullRenderedMemoHtml, /<!DOCTYPE html>/i);
assert.match(nullRenderedMemoHtml, /InvestorIQ/i);
assert.match(nullRenderedMemoHtml, /Acquisition Memo/i);

const handlerRequest = {
  headers: {
    "x-admin-run-key": process.env.ADMIN_RUN_KEY,
  },
  body: {
    userId: "user_publish_or_collapse_smoke",
    report_type: "underwriting",
    property_name: "Stonebridge",
    __test_enable_acq_memo_v2_source_authority: true,
    __test_return_final_html: true,
    __test_payloads: {
      computedRentRoll: {
        total_units: 64,
        occupied_units: 60,
        vacant_units: 4,
        occupancy: 0.9375,
        avg_in_place_rent: 22695,
        avg_market_rent: 26850,
        total_in_place_annual: 1432800,
        total_market_annual: 1718400,
        rent_to_market_gap: 0.1994459833795014,
        unit_mix: [
          { unit_type: "1BR", count: 32, current_rent: 1850, market_rent: 2050, avg_sqft: 720 },
          { unit_type: "2BR", count: 32, current_rent: 1881, market_rent: 2425, avg_sqft: 940 },
        ],
      },
      t12Payload: {
        income_lines: [{ label: "Effective Gross Income", amount: 1500000 }],
        expense_lines: [
          { label: "Property Taxes", amount: 185000 },
          { label: "Insurance", amount: 72000 },
          { label: "Repairs & Maintenance", amount: 104000 },
          { label: "Utilities", amount: 86000 },
          { label: "Property Management", amount: 60000 },
          { label: "Payroll / Admin", amount: 28000 },
        ],
        effective_gross_income: 1500000,
        total_operating_expenses: 555000,
        net_operating_income: 945000,
        gross_potential_rent: 1718400,
      },
      rentRollPayload: {
        total_units: 64,
        occupied_units: 60,
        vacant_units: 4,
        occupancy: 0.9375,
        annual_in_place_rent: 1432800,
        annual_market_rent: 1718400,
      },
      acquisitionTermsPayload: {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 13500000,
        going_in_cap_rate: 0.07,
        noi_basis: 945000,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
        source_text: "Purchase assumptions / acquisition context for lender discussion only.",
      },
      loanTermSheetTermsPayload: {
        debt_basis: "current_debt_context",
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amortization_years: 24,
        monthly_payment: 39250,
        maturity_date: "2029-11-01",
        source_text: "Current debt support for lender discussion only.",
      },
      mortgagePayload: {
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amort_years: 24,
        monthly_payment: 39250,
        ltv: 0.7,
      },
      propertyTaxPayload: {
        annual_tax: 185000,
        original_filename: "Property_Tax_Support.pdf",
      },
      documentSources: [
        {
          id: "t12-file",
          original_filename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx",
          doc_type: "t12",
          mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          parse_status: "parsed",
          parse_error: null,
        },
        {
          id: "rent-roll-file",
          original_filename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx",
          doc_type: "rent_roll",
          mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          parse_status: "parsed",
          parse_error: null,
        },
        {
          id: "assumptions-file",
          original_filename: "Stonebridge_Assumptions.pdf",
          doc_type: "purchase_assumptions",
          mime_type: "application/pdf",
          parse_status: "parsed",
          parse_error: null,
        },
        {
          id: "current-debt-file",
          original_filename: "Current_Debt_Stonebridge.pdf",
          doc_type: "current_debt",
          mime_type: "application/pdf",
          parse_status: "parsed",
          parse_error: null,
        },
        {
          id: "reno-file",
          original_filename: "Stonebridge_Reno_Plan.pdf",
          doc_type: "renovation_plan",
          mime_type: "application/pdf",
          parse_status: "parsed",
          parse_error: null,
        },
        {
          id: "appraisal-file",
          original_filename: "Stonebridge_Appraisal_Summary.pdf",
          doc_type: "appraisal",
          mime_type: "application/pdf",
          parse_status: "parsed",
          parse_error: null,
        },
        {
          id: "survey-file",
          original_filename: "Stonebridge_Market_Survey.pdf",
          doc_type: "market_survey",
          mime_type: "application/pdf",
          parse_status: "parsed",
          parse_error: null,
        },
        {
          id: "phase-file",
          original_filename: "Stonebridge_Phase_I_ESA.pdf",
          doc_type: "phase_i_esa",
          mime_type: "application/pdf",
          parse_status: "parsed",
          parse_error: null,
        },
      ],
      coverageArtifacts: [
        {
          id: "artifact-t12-file",
          file_id: "t12-file",
          type: "t12_parsed",
          created_at: "2026-06-20T00:00:00.000Z",
          payload: {
            source_file_id: "t12-file",
            source_original_filename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx",
            t12_parsed: {
              income_lines: [{ label: "Effective Gross Income", amount: 1500000 }],
              expense_lines: [
                { label: "Property Taxes", amount: 185000 },
                { label: "Insurance", amount: 72000 },
                { label: "Repairs & Maintenance", amount: 104000 },
                { label: "Utilities", amount: 86000 },
                { label: "Property Management", amount: 60000 },
                { label: "Payroll / Admin", amount: 28000 },
              ],
              effective_gross_income: 1500000,
              total_operating_expenses: 555000,
              net_operating_income: 945000,
              gross_potential_rent: 1718400,
            },
          },
        },
        {
          id: "artifact-rent-roll-file",
          file_id: "rent-roll-file",
          type: "rent_roll_parsed",
          created_at: "2026-06-20T00:01:00.000Z",
          payload: {
            source_file_id: "rent-roll-file",
            source_original_filename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx",
            rent_roll_parsed: {
              total_units: 64,
              occupancy: 0.9375,
              unit_mix: [
                { label: "1BR", count: 32, current_rent: 1850, market_rent: 2050 },
                { label: "2BR", count: 32, current_rent: 1881, market_rent: 2425 },
              ],
              annual_in_place_rent: 1432800,
              annual_market_rent: 1718400,
            },
          },
        },
        {
          id: "artifact-assumptions-file",
          file_id: "assumptions-file",
          type: "document_text_extracted",
          created_at: "2026-06-20T00:02:00.000Z",
          payload: {
            source_file_id: "assumptions-file",
            source_original_filename: "Stonebridge_Assumptions.pdf",
            document_text_extracted:
              "Purchase assumptions / proposed acquisition financing\nPurchase Price $13,500,000\nNOI Basis $945,000\nGoing-In Cap Reference 7.00%\nProposed Acquisition Loan $9,450,000\nLTV 70.0%\nInterest Rate 5.95%\nAmortization 30 years\nLender Fee 0.85%",
          },
        },
        {
          id: "artifact-current-debt-file",
          file_id: "current-debt-file",
          type: "document_text_extracted",
          created_at: "2026-06-20T00:03:00.000Z",
          payload: {
            source_file_id: "current-debt-file",
            source_original_filename: "Current_Debt_Stonebridge.pdf",
            document_text_extracted:
              "Existing Current Debt Statement\nCurrent Outstanding Balance $6,800,000\nInterest Rate 4.85%\nAmortization Remaining 24 years\nMonthly Payment $39,250\nMaturity Date 2029-11-01",
            current_debt_parsed: {
              current_outstanding_balance: 6800000,
              interest_rate: 4.85,
              amortization_remaining_years: 24,
              monthly_payment: 39250,
              maturity_date: "2029-11-01",
            },
          },
        },
      ],
    },
  },
};

const handlerResponse = makeHandlerResponse();
await generateClientReport(handlerRequest, handlerResponse);
assert.equal(handlerResponse.statusCode, 200);
assert.equal(handlerResponse.payload?.success, true);
const handlerFinalHtml = String(handlerResponse.payload?.final_html || "");
assert.match(handlerFinalHtml, /<!DOCTYPE html>/i);
assert.match(handlerFinalHtml, /<body/i);
assert.match(handlerFinalHtml, /<\/body>/i);
assert.match(handlerFinalHtml, /<\/html>/i);
assert.match(handlerFinalHtml, /InvestorIQ/i);
assert.match(handlerFinalHtml, /Acquisition Memo/i);
assert.equal(/ReferenceError:|TypeError:|is not defined|\bNaN\b|\bInfinity\b|stack trace/i.test(handlerFinalHtml), false);
assert.equal(/DSCR|refi|DCF|waterfall|equity return|deal score|final recommendation|BUY|SELL|HOLD|loan approval|lender commitment/i.test(handlerFinalHtml), false);

console.log("acquisition-memo-v2 publish-or-collapse smoke PASS");
