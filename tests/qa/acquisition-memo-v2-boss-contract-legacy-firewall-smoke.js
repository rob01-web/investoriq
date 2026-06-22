import assert from "assert";
import fs from "fs";

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
  validateAcquisitionMemoBossContract,
  validateAcquisitionMemoRenderAgainstBossContract,
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
assert.equal(bossContract.coreGate.publishAllowed, true);

const handlerResponse = makeHandlerResponse();
await generateClientReport(
  {
    headers: {
      "x-admin-run-key": process.env.ADMIN_RUN_KEY,
    },
    body: {
      userId: "user_boss_contract_legacy_firewall_smoke",
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
  },
  handlerResponse
);

assert.equal(handlerResponse.statusCode, 200);
assert.equal(handlerResponse.body?.success, true);
assert.equal(handlerResponse.body?.report_mode, "v1_core");

const finalHtml = String(handlerResponse.body?.final_html || "");
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, finalHtml).ok, true);

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

const hostileLateMutationHtml = finalHtml
  .replace(
    /<tr>\s*<td>1BR<\/td>[\s\S]*?<\/tr>/i,
    ""
  ) + "\n<p>DSCR</p>\n";
const hostileLateMutationCompliance = validateAcquisitionMemoRenderAgainstBossContract(bossContract, hostileLateMutationHtml);
assert.equal(hostileLateMutationCompliance.ok, false);
assert.ok(hostileLateMutationCompliance.violations.some((item) => item.code === "NO_FORBIDDEN_SURFACES"));

const hostileLateMutationRepaired = enforceAcquisitionMemoBossContractOnHtml(bossContract, hostileLateMutationHtml);
assert.equal(typeof hostileLateMutationRepaired.repairedHtml, "string");
assert.equal(/DSCR/i.test(hostileLateMutationRepaired.repairedHtml), false);
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, hostileLateMutationRepaired.repairedHtml).ok, true);

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const docHtmlAnchor = reportSource.indexOf("docHtml = sanitizeTypography(qaHtml);");
const finalGuardAnchor = reportSource.indexOf("const finalBossCompliance = acquisitionMemoV2Orchestrator?.runAcquisitionMemoV2Orchestrator({", docHtmlAnchor);
const pdfAnchor = reportSource.indexOf("pdfResponse = await axios.post(", finalGuardAnchor);
assert.ok(docHtmlAnchor >= 0, "Expected docHtml sanitization anchor not found");
assert.ok(finalGuardAnchor > docHtmlAnchor, "Expected final Boss compliance guard after docHtml sanitization");
assert.ok(pdfAnchor > finalGuardAnchor, "Expected PDF handoff after final Boss compliance guard");

const firewallSlice = reportSource.slice(finalGuardAnchor, pdfAnchor);
for (const forbidden of [
  "replaceMarkedSection(",
  "stripMarkedSection(",
  "stripThinSectionPages(",
  "sanitizeFinalCustomerHtml(",
]) {
  assert.equal(
    firewallSlice.includes(forbidden),
    false,
    `Forbidden legacy mutation ${JSON.stringify(forbidden)} found after final Boss compliance guard`
  );
}

console.log("acquisition-memo-v2-boss-contract-legacy-firewall-smoke: ok");
