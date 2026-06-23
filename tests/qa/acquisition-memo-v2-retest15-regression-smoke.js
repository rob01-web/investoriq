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
  validateAcquisitionMemoBossContract,
  validateAcquisitionMemoRenderAgainstBossContract,
} = await import("../../api/_lib/acquisition-memo-boss-contract.js");

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

function buildRetest15Payload() {
  return {
    userId: "user_acq_memo_v2_retest15_regression_smoke",
    report_type: "underwriting",
    property_name: "Generation failed - Final Attack Test 8 RETEST 15",
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
        { id: "t12-file", original_filename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed", parse_error: null },
        { id: "rent-roll-file", original_filename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed", parse_error: null },
        { id: "assumptions-file", original_filename: "Stonebridge_Assumptions.pdf", doc_type: "purchase_assumptions", mime_type: "application/pdf", parse_status: "parsed", parse_error: null },
        { id: "current-debt-file", original_filename: "Current_Debt_Stonebridge.pdf", doc_type: "current_debt", mime_type: "application/pdf", parse_status: "parsed", parse_error: null },
        { id: "reno-file", original_filename: "Stonebridge_Reno_Plan.pdf", doc_type: "renovation_plan", mime_type: "application/pdf", parse_status: "parsed", parse_error: null },
        { id: "appraisal-file", original_filename: "Stonebridge_Appraisal_Summary.pdf", doc_type: "appraisal", mime_type: "application/pdf", parse_status: "parsed", parse_error: null },
        { id: "survey-file", original_filename: "Stonebridge_Market_Survey.pdf", doc_type: "market_survey", mime_type: "application/pdf", parse_status: "parsed", parse_error: null },
        { id: "phase-file", original_filename: "Stonebridge_Phase_I_ESA.pdf", doc_type: "phase_i_esa", mime_type: "application/pdf", parse_status: "parsed", parse_error: null },
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
  };
}

function makeLocalBossContract(requestBody) {
  const sourcePackage = buildCanonicalSourcePackage(
    structuredClone(requestBody.__test_payloads.documentSources),
    structuredClone(requestBody.__test_payloads.coverageArtifacts)
  );
  const projection = buildAcquisitionMemoProjection(sourcePackage);
  const bossContract = buildAcquisitionMemoBossContract({
    canonicalSourcePackage: sourcePackage,
    acquisitionMemoProjection: projection,
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
    propertyProfile: {
      propertyName: "Final Attack Test 8 RETEST 15",
      propertyAddress: "123 Main St",
      propertyTitle: "Final Attack Test 8 RETEST 15",
      assetClass: "Multifamily",
    },
    reportMeta: {
      propertyName: "Final Attack Test 8 RETEST 15",
      generatedAt: "2026-06-20T00:00:00.000Z",
      reportType: "underwriting",
      reportMode: "v1_core",
      reportTier: 2,
    },
    reportMode: "v1_core",
  });
  return { sourcePackage, projection, bossContract };
}

const requestBody = buildRetest15Payload();
const handlerResponse = makeHandlerResponse();
await generateClientReport(
  {
    headers: {
      "x-admin-run-key": process.env.ADMIN_RUN_KEY,
    },
    body: requestBody,
  },
  handlerResponse
);

assert.equal(handlerResponse.statusCode, 200);
assert.equal(handlerResponse.body?.success, true);
assert.equal(handlerResponse.body?.report_mode, "v1_core");

const { bossContract } = makeLocalBossContract(requestBody);
assert.equal(validateAcquisitionMemoBossContract(bossContract).ok, true);

const finalHtml = String(handlerResponse.body?.final_html || "");
const normalizedFinalText = finalHtml
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const finalValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, finalHtml);
if (!finalValidation.ok) {
  assert.fail(
    JSON.stringify(
      {
        currentDebtSection: bossContract.sections?.currentDebtContext?.factAvailability || null,
        unitMixSection: bossContract.sections?.unitMix?.factAvailability || null,
        acquisitionRequestSection: bossContract.sections?.acquisitionRequestContext?.factAvailability || null,
        sourceTruthRoles: Array.isArray(bossContract.sourceTruth?.supportDocs)
          ? bossContract.sourceTruth.supportDocs.map((doc) => ({
              role: doc?.canonicalRole || null,
              filename: doc?.originalFilename || null,
              facts: doc?.extractedFacts || null,
            }))
          : null,
        violations: finalValidation.violations,
        routing: finalValidation.routing,
        currentDebtRendered: /Current Outstanding Balance[\s\S]{0,80}\$6,800,000/i.test(finalHtml),
        currentDebtCollapseNote: /Current debt evidence was not display-ready/i.test(finalHtml),
        htmlLength: finalHtml.length,
      },
      null,
      2
    )
  );
}

assert.ok(finalHtml.length > 30000);
assert.match(finalHtml, /Executive Summary/i);
assert.match(finalHtml, /Key Metrics Snapshot/i);
assert.match(finalHtml, /Unit Mix and Rent Positioning/i);
assert.match(finalHtml, /Cap-Rate Value Indication/i);
assert.match(finalHtml, /Operating Statement \/ TTM Summary/i);
assert.match(finalHtml, /Debt \/ Financing Context/i);
assert.match(finalHtml, /Source Context \/ Support Document Treatment/i);
assert.match(normalizedFinalText, /Methodology & Data Transparency/i);
assert.match(finalHtml, /Current Outstanding Balance[\s\S]{0,80}\$6,800,000/i);
assert.match(finalHtml, /Interest Rate[\s\S]{0,40}4\.85%/i);
assert.match(finalHtml, /Amortization Remaining[\s\S]{0,40}24 years/i);
assert.match(finalHtml, /Monthly Payment[\s\S]{0,40}\$39,250/i);
assert.match(finalHtml, /Maturity Date[\s\S]{0,40}2029-11-01/i);
assert.match(finalHtml, /Property Taxes[\s\S]{0,40}\$185,000/i);
assert.match(finalHtml, /1BR/i);
assert.match(finalHtml, /2BR/i);
assert.equal(/Generation failed\s*-\s*/i.test(finalHtml), false);
assert.equal(/Current debt evidence was not display-ready/i.test(finalHtml), false);
assert.equal(/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(finalHtml), false);
assert.equal(/<td style="font-weight:600;">-<\/td>/i.test(finalHtml), false);
assert.equal(/DSCR|refi|refinance|DCF|waterfall|equity return|deal score|final recommendation|\bBUY\b|\bSELL\b|\bHOLD\b|loan approval|lender commitment/i.test(finalHtml), false);

console.log("acquisition-memo-v2 retest15 regression smoke PASS");
