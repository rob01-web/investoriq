import assert from "assert";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docractor-key";
process.env.QA_REVIEW_ENABLED ||= "false";
process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY ||= "true";

const { default: generateClientReport } = await import("../../api/generate-client-report.js");
const { buildCanonicalSourcePackage } = await import("../../api/_lib/canonical-source-package.js");
const { buildAcquisitionMemoProjection } = await import("../../api/_lib/acquisition-memo-projection.js");
const {
  buildAcquisitionMemoBossContract,
  enforceAcquisitionMemoBossContractOnHtml,
  validateAcquisitionMemoRenderAgainstBossContract,
  validateAcquisitionMemoBossContract,
} = await import("../../api/_lib/acquisition-memo-boss-contract.js");

function buildRetest13SourcePackage() {
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

  const parsedArtifacts = [
    {
      fileId: "t12-file",
      semantic_doc_role: "t12",
      payload: {
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
          units: [
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
          ],
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
        document_text_extracted:
          "Purchase assumptions / proposed acquisition financing\n" +
          "Purchase Price $13,500,000\n" +
          "NOI Basis $945,000\n" +
          "Going-In Cap Reference 7.00%\n" +
          "Proposed Acquisition Loan $9,450,000\n" +
          "LTV 70.0%\n" +
          "Interest Rate 5.95%\n" +
          "Amortization 30 years\n" +
          "Lender Fee 0.85%",
      },
    },
    {
      fileId: "current-debt-file",
      original_filename: "Current_Debt_Stonebridge.pdf",
      semantic_doc_role: "current_debt",
      debt_basis: "current_debt",
      payload: {
        document_text_extracted:
          "Existing Current Debt Statement\n" +
          "Current Outstanding Balance $6,800,000\n" +
          "Interest Rate 4.85%\n" +
          "Amortization Remaining 24 years\n" +
          "Monthly Payment $39,250\n" +
          "Maturity Date 2029-11-01",
      },
    },
    {
      fileId: "reno-file",
      original_filename: "Stonebridge_Reno_Plan.pdf",
      semantic_doc_role: "renovation_plan",
      payload: { document_text_extracted: "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000" },
    },
    {
      fileId: "appraisal-file",
      original_filename: "Stonebridge_Appraisal_Summary.pdf",
      semantic_doc_role: "appraisal",
      payload: { document_text_extracted: "Appraisal Summary / Valuation Context" },
    },
    {
      fileId: "survey-file",
      original_filename: "Stonebridge_Market_Survey.pdf",
      semantic_doc_role: "market_survey",
      payload: { document_text_extracted: "Market Rent Survey Context" },
    },
    {
      fileId: "phase-file",
      original_filename: "Stonebridge_Phase_I_ESA.pdf",
      semantic_doc_role: "phase_i_esa",
      payload: { document_text_extracted: "Phase I ESA / Environmental Due Diligence Context" },
    },
  ];

  return buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);
}

function makeHandlerResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return payload;
    },
  };
}

const sourcePackage = buildRetest13SourcePackage();
const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
const coreMetrics = {
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
};
const reportMeta = {
  propertyName: "Stonebridge Lofts",
  generatedAt: "2026-06-20T00:00:00.000Z",
  reportType: "underwriting",
  reportMode: "v1_core",
  reportTier: 2,
};
const propertyProfile = {
  propertyName: "Stonebridge Lofts",
  propertyAddress: "123 Main St",
  propertyTitle: "Stonebridge Lofts",
  assetClass: "Multifamily",
};

const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: sourcePackage,
  acquisitionMemoProjection,
  coreMetrics,
  propertyProfile,
  reportMeta,
  reportMode: "v1_core",
});

assert.equal(validateAcquisitionMemoBossContract(bossContract).ok, true);
assert.equal(bossContract.contractVersion, "acq_memo_boss_contract_v1");
assert.equal(bossContract.coreGate.publishAllowed, true);
assert.equal(bossContract.sections.unitMix.status, "required");
assert.equal(bossContract.sections.unitMix.factAvailability.sourceBacked, true);
assert.equal(bossContract.sections.currentDebtContext.factAvailability.sourceBacked, true);
assert.equal(bossContract.sections.proposedFinancingContext.factAvailability.sourceBacked, true);

const handlerRequest = {
  headers: {
    "x-admin-run-key": process.env.ADMIN_RUN_KEY,
  },
  body: {
    userId: "user_boss_contract_handler_smoke",
    report_type: "underwriting",
    property_name: "Stonebridge Lofts",
    __test_enable_acq_memo_v2_source_authority: true,
    __test_return_final_html: true,
    __test_acq_memo_v2_source_package: sourcePackage,
    __test_acq_memo_v2_render_context: { goingInCapRate: 7 },
    __test_payloads: {
      t12Payload: {
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
        { originalFilename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx", semantic_doc_role: "t12", payload: { document_text_extracted: "Trailing 12-Month Income Statement" } },
        { originalFilename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx", semantic_doc_role: "rent_roll", payload: { document_text_extracted: "Rent Roll" } },
        { originalFilename: "Stonebridge_Assumptions.pdf", semantic_doc_role: "purchase_assumptions", debt_basis: "proposed_acquisition", payload: { document_text_extracted: "Purchase Assumptions / Proposed Acquisition Financing" } },
        { originalFilename: "Current_Debt_Stonebridge.pdf", semantic_doc_role: "current_debt", debt_basis: "current_debt", payload: { document_text_extracted: "Existing Current Debt Statement" } },
        { originalFilename: "Stonebridge_Reno_Plan.pdf", semantic_doc_role: "renovation_plan", payload: { document_text_extracted: "Structured Renovation / CapEx Plan" } },
        { originalFilename: "Stonebridge_Appraisal_Summary.pdf", semantic_doc_role: "appraisal", payload: { document_text_extracted: "Appraisal Summary / Valuation Context" } },
        { originalFilename: "Stonebridge_Market_Survey.pdf", semantic_doc_role: "market_survey", payload: { document_text_extracted: "Market Rent Survey Context" } },
        { originalFilename: "Stonebridge_Phase_I_ESA.pdf", semantic_doc_role: "phase_i_esa", payload: { document_text_extracted: "Phase I ESA / Environmental Due Diligence Context" } },
      ],
      coverageArtifacts: [
        { type: "t12_parsed", payload: { effective_gross_income: 1500000, total_operating_expenses: 555000, net_operating_income: 945000, expense_lines: [ { label: "Property Taxes", amount: 185000 }, { label: "Insurance", amount: 72000 }, { label: "Repairs & Maintenance", amount: 104000 }, { label: "Utilities", amount: 86000 }, { label: "Property Management", amount: 60000 }, { label: "Payroll / Admin", amount: 28000 } ] } },
        { type: "rent_roll_parsed", payload: { total_units: 64, occupancy: 0.9375, unit_mix: [ { label: "1BR", count: 32, current_rent: 1850, market_rent: 2050 }, { label: "2BR", count: 32, current_rent: 1881, market_rent: 2425 } ], annual_in_place_rent: 1432800, annual_market_rent: 1718400 } },
      ],
    },
  },
};

const handlerResponse = makeHandlerResponse();
await generateClientReport(handlerRequest, handlerResponse);
assert.equal(handlerResponse.statusCode, 200);
assert.equal(handlerResponse.body?.success, true);
assert.equal(handlerResponse.body?.report_mode, "v1_core");

const finalHtml = String(handlerResponse.body?.final_html || "");
const renderValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, finalHtml);
assert.equal(renderValidation.ok, true);
assert.equal(renderValidation.violations.length, 0);

assert.match(finalHtml, /<!DOCTYPE html>/i);
assert.match(finalHtml, /<body/i);
assert.match(finalHtml, /<\/body>/i);
assert.match(finalHtml, /<\/html>/i);
assert.match(finalHtml, /InvestorIQ/i);
assert.match(finalHtml, /Acquisition Memo/i);

assert.match(finalHtml, /<td>1BR<\/td>/i);
assert.match(finalHtml, /<td>2BR<\/td>/i);
assert.match(finalHtml, /<td>Current Outstanding Balance<\/td><td style="font-weight:600;">\$6,800,000<\/td>/i);
assert.match(finalHtml, /<td>Proposed Acquisition Loan<\/td><td style="font-weight:600;">\$9,450,000<\/td>/i);
assert.match(finalHtml, /<td>Property Taxes<\/td><td style="font-weight:600;">\$185,000<\/td>/i);
assert.equal(/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(finalHtml), false);
assert.equal(/<td style="font-weight:600;">-<\/td>/i.test(finalHtml), false);
assert.equal(/<td[^>]*>\s*Going-In Cap Rate\s*<\/td>\s*<td[^>]*>\s*0\.0%\s*<\/td>/i.test(finalHtml), false);
assert.equal(/Current Debt Maturity Not available/i.test(finalHtml), false);
assert.equal(/Maturity Date Not available/i.test(finalHtml), false);
assert.equal(/DSCR|refi|DCF|waterfall|equity return|deal score|final recommendation|\bBUY\b|\bSELL\b|\bHOLD\b|loan approval|lender commitment/i.test(finalHtml), false);
assert.equal(/\b(V2 Canonical Package|Source Authority|Boss Contract|canonical source package|V2 projection|report shell stays presentation-only)\b/i.test(finalHtml), false);
assert.equal(/ReferenceError|TypeError|is not defined|stack trace/i.test(finalHtml), false);

const previousNodeEnv = process.env.NODE_ENV;
const previousTestHooks = process.env.INVESTORIQ_ENABLE_TEST_HOOKS;
try {
  process.env.NODE_ENV = "production";
  delete process.env.INVESTORIQ_ENABLE_TEST_HOOKS;
  const unauthorizedResponse = makeHandlerResponse();
  await generateClientReport({
    headers: { "x-admin-run-key": process.env.ADMIN_RUN_KEY },
    body: {
      userId: "user_boss_contract_handler_smoke",
      report_type: "underwriting",
      property_name: "Stonebridge Lofts",
      __test_return_final_html: true,
      __test_acq_memo_v2_source_package: sourcePackage,
    },
  }, unauthorizedResponse);
  assert.equal(unauthorizedResponse.statusCode, 403);
  assert.match(String(unauthorizedResponse.body?.error || ""), /test-only request fields/i);
} finally {
  process.env.NODE_ENV = previousNodeEnv;
  process.env.INVESTORIQ_ENABLE_TEST_HOOKS = previousTestHooks;
}

const badHtml = `
<!DOCTYPE html>
<html><body>
<p>No parsed unit mix rows were available from the canonical rent roll evidence.</p>
<table><tbody>
<tr><td>5.0%</td><td style="font-weight:600;">$18,900,000</td><td style="font-weight:600;">-</td></tr>
</tbody></table>
<p>Current Debt Maturity Not available</p>
<p>DSCR</p>
</body></html>`;
const badValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, badHtml);
assert.equal(badValidation.ok, false);
assert.ok(badValidation.violations.some((item) => item.code === "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT"));
assert.ok(badValidation.violations.some((item) => item.code === "NO_PER_UNIT_DASH_WITH_UNITS"));
assert.ok(badValidation.violations.some((item) => item.code === "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED"));
assert.ok(badValidation.violations.some((item) => item.code === "NO_FORBIDDEN_SURFACES"));

const repaired = enforceAcquisitionMemoBossContractOnHtml(bossContract, badHtml);
assert.equal(typeof repaired.repairedHtml, "string");
assert.equal(/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(repaired.repairedHtml), false);
assert.equal(/Current Debt Maturity Not available/i.test(repaired.repairedHtml), false);
assert.equal(/DSCR/i.test(repaired.repairedHtml), false);

console.log("acquisition-memo-v2-boss-contract-handler-smoke: ok");
