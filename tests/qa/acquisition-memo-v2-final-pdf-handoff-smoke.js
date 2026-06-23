import assert from "assert";
import { readFileSync } from "fs";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docractor-key";
process.env.QA_REVIEW_ENABLED ||= "false";
process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY ||= "true";

const { default: generateClientReport } = await import("../../api/generate-client-report.js");
const {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} = await import("../../api/_lib/acquisition-memo-v2-customer-surface-model.js");

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

function buildNormalPathPayload() {
  return {
    userId: "user_acq_memo_v2_normal_path_local_smoke",
    report_type: "underwriting",
    property_name: "Stonebridge Lofts",
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
              effective_gross_income: 1500000,
              total_operating_expenses: 555000,
              net_operating_income: 945000,
              gross_potential_rent: 1718400,
              expense_lines: [
                { label: "Property Taxes", amount: 185000 },
                { label: "Insurance", amount: 72000 },
                { label: "Repairs & Maintenance", amount: 104000 },
                { label: "Utilities", amount: 86000 },
                { label: "Property Management", amount: 60000 },
                { label: "Payroll / Admin", amount: 28000 },
              ],
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
            semantic_doc_role: "purchase_assumptions",
            semantic_doc_display_label: "Purchase Assumptions / Proposed Acquisition Financing Context",
            debt_basis: "acquisition_financing_assumption",
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
  };
}

function buildScenarioInputs(requestBody, overrides = {}) {
  const unitCount = Number.isFinite(Number(overrides.unitCount)) ? Number(overrides.unitCount) : 64;
  const occupancy = overrides.occupancy ?? 0.9375;
  const annualInPlaceRent = overrides.annualInPlaceRent ?? 1432800;
  const annualMarketRent = overrides.annualMarketRent ?? 1718400;
  const annualRentUpside = overrides.annualRentUpside ?? 285600;
  const egi = overrides.egi ?? 1500000;
  const opEx = overrides.opEx ?? 555000;
  const noi = overrides.noi ?? 945000;
  const expenseRatio = overrides.expenseRatio ?? 0.37;
  const noiMargin = overrides.noiMargin ?? 0.63;
  const breakEvenOccupancy = overrides.breakEvenOccupancy ?? 0.37;
  const purchasePrice = overrides.purchasePrice ?? 13500000;
  const goingInCapRate = overrides.goingInCapRate ?? 7;
  const propertyName = overrides.propertyName ?? requestBody.property_name ?? "Acquisition Memo";
  const propertyAddress = overrides.propertyAddress ?? "123 Main St";
  const assetClass = overrides.assetClass ?? "Multifamily";
  return {
    coreMetrics: {
      units: unitCount,
      occupancy,
      annualInPlaceRent,
      annualMarketRent,
      annualRentUpside,
      egi,
      opEx,
      noi,
      expenseRatio,
      noiMargin,
      breakEvenOccupancy,
      purchasePrice,
      goingInCapRate,
    },
    propertyProfile: {
      propertyName,
      propertyAddress,
      propertyTitle: propertyName,
      assetClass,
    },
    reportMeta: {
      propertyName,
      generatedAt: "2026-06-20T00:00:00.000Z",
      reportType: "underwriting",
      reportMode: "v1_core",
      reportTier: 2,
    },
  };
}

function buildGenericFinalHandoffPayload() {
  const payload = structuredClone(buildNormalPathPayload());
  payload.property_name = "Harbor View Apartments";
  payload.__test_payloads.documentSources = payload.__test_payloads.documentSources.map((doc) => {
    const next = structuredClone(doc);
    if (next.id === "t12-file") next.original_filename = "T12_Harbor_View_Attack_Test_1.xlsx";
    if (next.id === "rent-roll-file") next.original_filename = "Rent_Roll_Harbor_View_Attack_Test_1.xlsx";
    if (next.id === "assumptions-file") next.original_filename = "Harbor_View_Assumptions.pdf";
    if (next.id === "current-debt-file") next.original_filename = "Current_Debt_Harbor_View.pdf";
    if (next.id === "reno-file") next.original_filename = "Harbor_View_Reno_Plan.pdf";
    if (next.id === "appraisal-file") next.original_filename = "Harbor_View_Appraisal_Summary.pdf";
    if (next.id === "survey-file") next.original_filename = "Harbor_View_Market_Survey.pdf";
    if (next.id === "phase-file") next.original_filename = "Harbor_View_Phase_I_ESA.pdf";
    return next;
  });
  payload.__test_payloads.t12Payload = {
    income_lines: [{ label: "Effective Gross Income", amount: 312000 }],
    expense_lines: [
      { label: "Property Taxes", amount: 40800 },
      { label: "Insurance", amount: 16800 },
      { label: "Repairs & Maintenance", amount: 24000 },
      { label: "Utilities", amount: 20000 },
      { label: "Property Management", amount: 14400 },
      { label: "Payroll / Admin", amount: 7200 },
    ],
    effective_gross_income: 312000,
    total_operating_expenses: 123200,
    net_operating_income: 188800,
    gross_potential_rent: 336000,
  };
  payload.__test_payloads.rentRollPayload = {
    total_units: 12,
    occupied_units: 11,
    vacant_units: 1,
    occupancy: 0.9166666667,
    annual_in_place_rent: 280800,
    annual_market_rent: 336000,
  };
  payload.__test_payloads.computedRentRoll = {
    total_units: 12,
    occupied_units: 11,
    vacant_units: 1,
    occupancy: 0.9166666667,
    avg_in_place_rent: 23400,
    avg_market_rent: 28000,
    total_in_place_annual: 280800,
    total_market_annual: 336000,
    rent_to_market_gap: 0.1965811966,
    unit_mix: [
      { unit_type: "1BR", count: 6, current_rent: 1450, market_rent: 1600, avg_sqft: 720 },
      { unit_type: "2BR", count: 6, current_rent: 1750, market_rent: 1950, avg_sqft: 940 },
    ],
  };
  payload.__test_payloads.acquisitionTermsPayload = {
    debt_basis: "acquisition_financing_assumption",
    purchase_price: 4200000,
    going_in_cap_rate: 0.07,
    noi_basis: 188800,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
    source_text: "Purchase assumptions / acquisition context for lender discussion only.",
  };
  payload.__test_payloads.loanTermSheetTermsPayload = {
    debt_basis: "current_debt_context",
    outstanding_balance: 2150000,
    interest_rate: 0.0485,
    amortization_years: 24,
    monthly_payment: 12450,
    maturity_date: "2030-11-01",
    source_text: "Current debt support for lender discussion only.",
  };
  payload.__test_payloads.mortgagePayload = {
    outstanding_balance: 2150000,
    interest_rate: 0.0485,
    amort_years: 24,
    monthly_payment: 12450,
    ltv: 0.7,
  };
  payload.__test_payloads.propertyTaxPayload = {
    annual_tax: 40800,
    original_filename: "Property_Tax_Support.pdf",
  };
  payload.__test_payloads.coverageArtifacts = payload.__test_payloads.coverageArtifacts.map((artifact) => {
    const next = structuredClone(artifact);
    if (next.id === "artifact-t12-file") {
      next.file_id = "t12-file";
      next.payload.source_original_filename = "T12_Harbor_View_Attack_Test_1.xlsx";
      next.payload.t12_parsed = {
        effective_gross_income: 312000,
        total_operating_expenses: 123200,
        net_operating_income: 188800,
        gross_potential_rent: 336000,
        expense_lines: [
          { label: "Property Taxes", amount: 40800 },
          { label: "Insurance", amount: 16800 },
          { label: "Repairs & Maintenance", amount: 24000 },
          { label: "Utilities", amount: 20000 },
          { label: "Property Management", amount: 14400 },
          { label: "Payroll / Admin", amount: 7200 },
        ],
      };
    }
    if (next.id === "artifact-rent-roll-file") {
      next.file_id = "rent-roll-file";
      next.payload.source_original_filename = "Rent_Roll_Harbor_View_Attack_Test_1.xlsx";
      next.payload.rent_roll_parsed = {
        total_units: 12,
        occupancy: 0.9166666667,
        unit_mix: [
          { label: "1BR", count: 6, current_rent: 1450, market_rent: 1600 },
          { label: "2BR", count: 6, current_rent: 1750, market_rent: 1950 },
        ],
        annual_in_place_rent: 280800,
        annual_market_rent: 336000,
      };
    }
    if (next.id === "artifact-assumptions-file") {
      next.file_id = "assumptions-file";
      next.payload.source_original_filename = "Harbor_View_Assumptions.pdf";
      next.payload.document_text_extracted =
        "Purchase assumptions / proposed acquisition financing\nPurchase Price $4,200,000\nNOI Basis $188,800\nGoing-In Cap Reference 7.00%\nProposed Acquisition Loan $2,940,000\nLTV 70.0%\nInterest Rate 5.95%\nAmortization 30 years\nLender Fee 0.85%";
    }
    if (next.id === "artifact-current-debt-file") {
      next.file_id = "current-debt-file";
      next.payload.source_original_filename = "Current_Debt_Harbor_View.pdf";
      next.payload.document_text_extracted =
        "Existing Current Debt Statement\nCurrent Outstanding Balance $2,150,000\nInterest Rate 4.85%\nAmortization Remaining 24 years\nMonthly Payment $12,450\nMaturity Date 2030-11-01";
      next.payload.current_debt_parsed = {
        current_outstanding_balance: 2150000,
        interest_rate: 4.85,
        amortization_remaining_years: 24,
        monthly_payment: 12450,
        maturity_date: "2030-11-01",
      };
    }
    return next;
  });
  return payload;
}

async function buildLocalBossContract(requestBody, overrides = {}) {
  const { buildCanonicalSourcePackage } = await import("../../api/_lib/canonical-source-package.js");
  const { buildAcquisitionMemoProjection } = await import("../../api/_lib/acquisition-memo-projection.js");
  const { buildAcquisitionMemoBossContract } = await import("../../api/_lib/acquisition-memo-boss-contract.js");
  const sourcePackage = buildCanonicalSourcePackage(
    structuredClone(requestBody.__test_payloads.documentSources),
    structuredClone(requestBody.__test_payloads.coverageArtifacts)
  );
  const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
  const scenario = buildScenarioInputs(requestBody, overrides);
  return buildAcquisitionMemoBossContract({
    canonicalSourcePackage: sourcePackage,
    acquisitionMemoProjection,
    t12Payload: structuredClone(requestBody.__test_payloads.t12Payload),
    coreMetrics: scenario.coreMetrics,
    propertyProfile: scenario.propertyProfile,
    reportMeta: scenario.reportMeta,
    reportMode: "v1_core",
  });
}

async function buildLocalCustomerSurfaceModel(requestBody, localBossContract, overrides = {}) {
  const { buildCanonicalSourcePackage } = await import("../../api/_lib/canonical-source-package.js");
  const { buildAcquisitionMemoProjection } = await import("../../api/_lib/acquisition-memo-projection.js");
  const sourcePackage = buildCanonicalSourcePackage(
    structuredClone(requestBody.__test_payloads.documentSources),
    structuredClone(requestBody.__test_payloads.coverageArtifacts)
  );
  const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
  const scenario = buildScenarioInputs(requestBody, overrides);
  return buildAcquisitionMemoV2CustomerSurfaceModel({
    canonicalSourcePackage: sourcePackage,
    acquisitionMemoProjection,
    bossContract: localBossContract,
    coreMetrics: scenario.coreMetrics,
    propertyProfile: scenario.propertyProfile,
    reportMeta: scenario.reportMeta,
    reportMode: "v1_core",
  });
}

function normalizeFinalVisibleText(html) {
  return String(html || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertNormalizedVisibleTextContains({ finalHtml, normalizedText, pattern, label }) {
  if (pattern.test(normalizedText)) {
    return;
  }

  const htmlText = String(finalHtml || "");
  const lowerHtml = htmlText.toLowerCase();
  const taxesIndex = lowerHtml.indexOf("property taxes");
  const amountIndex = htmlText.indexOf("$185,000");
  const makeSnippet = (index) => {
    if (index < 0) {
      return "";
    }
    const start = Math.max(0, index - 40);
    const end = Math.min(htmlText.length, index + 100);
    return htmlText.slice(start, end);
  };

  assert.fail(JSON.stringify({
    label,
    hasLiteralPropertyTaxes: htmlText.includes("Property Taxes"),
    hasCaseInsensitivePropertyTaxes: /Property Taxes/i.test(htmlText),
    hasNormalizedPropertyTaxes: /Property\s+Taxes/i.test(normalizedText),
    has185000: htmlText.includes("$185,000"),
    firstTaxesIndex: taxesIndex,
    first185000Index: amountIndex,
    taxesSnippet: makeSnippet(taxesIndex),
    amountSnippet: makeSnippet(amountIndex),
    finalHtmlLength: htmlText.length,
  }, null, 2));
}

function assertFinalHandoffIsCurrent(fileSource) {
  const harnessStart = fileSource.indexOf("if (isFullRenderHarness) {");
  const harnessFinalize = fileSource.indexOf("const finalHarnessBossCompliance = acquisitionMemoV2Finalization || await runAcquisitionMemoV2Pipeline({", harnessStart);
  const harnessReturn = fileSource.indexOf("return res.status(200).json({", harnessFinalize);
  const docRaptorStart = fileSource.indexOf("// 9. Send to DocRaptor (STILL IN TEST MODE)", harnessReturn);
  const pdfFinalize = fileSource.indexOf("const finalBossCompliance = acquisitionMemoV2Finalization ||", docRaptorStart);
  assert.ok(harnessStart >= 0, "missing full render harness block");
  assert.ok(harnessFinalize >= 0, "missing harness boss compliance finalize");
  assert.ok(harnessReturn >= 0, "missing harness return");
  assert.ok(docRaptorStart >= 0, "missing docraptor block");
  assert.ok(pdfFinalize >= 0, "missing pdf boss compliance finalize");
  assert.ok(harnessFinalize < harnessReturn, "final harness boss compliance must happen before harness return");
  assert.ok(harnessReturn < docRaptorStart, "harness return must happen before DocRaptor handoff");
  assert.ok(docRaptorStart < pdfFinalize, "pdf boss compliance must happen after DocRaptor block begins");
}

const requestBody = buildNormalPathPayload();

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

const reportSource = readFileSync(new URL("../../api/generate-client-report.js", import.meta.url), "utf8");
assertFinalHandoffIsCurrent(reportSource);

assert.equal(handlerResponse.statusCode, 200);
const finalPdfHandoffHtml = String(handlerResponse.body?.final_html || "");
const localBossContract = await buildLocalBossContract(requestBody);
const localCustomerSurfaceModel = await buildLocalCustomerSurfaceModel(requestBody, localBossContract);
const {
  validateAcquisitionMemoBossContract,
  validateAcquisitionMemoRenderAgainstBossContract,
} = await import("../../api/_lib/acquisition-memo-boss-contract.js");
const localBossValidation = validateAcquisitionMemoBossContract(localBossContract);
const localBossRenderValidation = validateAcquisitionMemoRenderAgainstBossContract(localBossContract, finalPdfHandoffHtml);
const localCustomerSurfaceValidation = validateAcquisitionMemoV2CustomerSurfaceModel(localCustomerSurfaceModel);
const localCustomerSurfaceHtmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(finalPdfHandoffHtml, localCustomerSurfaceModel);
const normalizedFinalVisibleText = normalizeFinalVisibleText(finalPdfHandoffHtml);
const localBossT12Requirements = localBossContract?.sections?.operatingStatementTTMSummary || {};
const finalHandoffDiagnostics = {
  handler_boss_compliance: handlerResponse.body?.boss_compliance,
  handler_render_validation: handlerResponse.body?.render_validation,
  handler_final_harness_boss_compliance: handlerResponse.body?.final_harness_boss_compliance,
  handler_finalizer_boss_compliance: handlerResponse.body?.finalizer_boss_compliance,
  handler_customer_surface_model_validation: handlerResponse.body?.customer_surface_model_validation,
  handler_customer_surface_html_validation: handlerResponse.body?.customer_surface_html_validation,
  local_boss_validation: localBossValidation,
  local_render_validation: localBossRenderValidation,
  local_customer_surface_validation: localCustomerSurfaceValidation,
  local_customer_surface_html_validation: localCustomerSurfaceHtmlValidation,
  local_requires_t12_expense_lines: localBossT12Requirements?.factAvailability?.sourceBacked === true
    && Array.isArray(localBossT12Requirements?.factAvailability?.required)
    && localBossT12Requirements.factAvailability.required.includes("expense_lines"),
  local_t12_assertions: Array.isArray(localBossT12Requirements?.postRenderAssertions)
    ? localBossT12Requirements.postRenderAssertions
    : [],
  local_t12_required_fact_count: Array.isArray(localBossT12Requirements?.factAvailability?.required)
    ? localBossT12Requirements.factAvailability.required.length
    : 0,
  local_source_package_has_t12_expense_lines: Array.isArray(localBossContract?.sourceTruth?.coreT12?.expenseLines)
    ? localBossContract.sourceTruth.coreT12.expenseLines.length > 0
    : Boolean(localBossContract?.sourceTruth?.coreT12?.expenseLines),
  final_html_proof: {
    has_literal_property_taxes: finalPdfHandoffHtml.includes("Property Taxes"),
    has_literal_amount: finalPdfHandoffHtml.includes("$185,000"),
    has_normalized_property_taxes: /Property\s+Taxes/i.test(normalizedFinalVisibleText),
    has_normalized_amount: /\$185,000/i.test(normalizedFinalVisibleText),
    final_html_length: finalPdfHandoffHtml.length,
  },
};
assert.equal(handlerResponse.body?.success, true, JSON.stringify({
  statusCode: handlerResponse.statusCode,
  success: handlerResponse.body?.success,
  error: handlerResponse.body?.error,
  qa_status: handlerResponse.body?.qa_status,
  delivery_gate_status: handlerResponse.body?.delivery_gate_status,
  render_validation: handlerResponse.body?.render_validation,
  boss_validation: handlerResponse.body?.boss_compliance,
  final_handoff_diagnostics: finalHandoffDiagnostics,
}, null, 2));
assert.equal(handlerResponse.body?.report_mode, "v1_core");
assert.equal(handlerResponse.body?.customer_surface_model_validation?.ok, true);
assert.equal(handlerResponse.body?.customer_surface_html_validation?.ok, true);
assert.equal(localCustomerSurfaceValidation.ok, true);
assert.equal(localCustomerSurfaceModel.sourceTruth.accepted.purchaseAssumptionsPresent, true);
assert.equal(localCustomerSurfaceModel.sourceTruth.accepted.currentDebtPresent, true);
assert.equal("__test_acq_memo_v2_source_package" in requestBody, false);
assert.equal("__test_acq_memo_v2_render_context" in requestBody, false);
if (!localBossRenderValidation.ok) {
  assert.fail(JSON.stringify(finalHandoffDiagnostics, null, 2));
}
assert.equal(localBossValidation.ok, true);
assert.equal(localBossRenderValidation.ok, true);
assert.equal(localCustomerSurfaceHtmlValidation.ok, true);

assert.equal(finalPdfHandoffHtml.includes("1BR"), true);
assert.equal(finalPdfHandoffHtml.includes("2BR"), true);
assert.equal(finalPdfHandoffHtml.includes("Current Outstanding Balance"), true);
assert.equal(finalPdfHandoffHtml.includes("$6,800,000"), true);
assert.equal(finalPdfHandoffHtml.includes("4.85%"), true);
assert.equal(finalPdfHandoffHtml.includes("Amortization Remaining"), true);
assert.equal(finalPdfHandoffHtml.includes("24 years"), true);
assert.equal(finalPdfHandoffHtml.includes("Monthly Payment"), true);
assert.equal(finalPdfHandoffHtml.includes("$39,250"), true);
assert.equal(finalPdfHandoffHtml.includes("Maturity Date"), true);
assert.equal(finalPdfHandoffHtml.includes("2029-11-01"), true);
assert.equal(finalPdfHandoffHtml.includes("Proposed Acquisition Loan"), true);
assert.equal(finalPdfHandoffHtml.includes("$9,450,000"), true);
assert.equal(finalPdfHandoffHtml.includes("Proposed LTV"), true);
assert.equal(finalPdfHandoffHtml.includes("70.0%"), true);
assert.equal(finalPdfHandoffHtml.includes("Proposed Rate"), true);
assert.equal(finalPdfHandoffHtml.includes("5.95%"), true);
assert.equal(finalPdfHandoffHtml.includes("Proposed Amortization"), true);
assert.equal(finalPdfHandoffHtml.includes("30 years"), true);
assert.equal(finalPdfHandoffHtml.includes("Lender / Origination Fee"), true);
assert.equal(finalPdfHandoffHtml.includes("0.85%"), true);
assert.equal(finalPdfHandoffHtml.includes("Purchase Assumptions / Proposed Acquisition Financing Context"), true);
assert.equal(/No purchase assumptions uploaded|Purchase assumptions provided\s+No/i.test(finalPdfHandoffHtml), false);
assertNormalizedVisibleTextContains({
  finalHtml: finalPdfHandoffHtml,
  normalizedText: normalizedFinalVisibleText,
  pattern: /Property\s+Taxes/i,
  label: "Property Taxes",
});
assertNormalizedVisibleTextContains({
  finalHtml: finalPdfHandoffHtml,
  normalizedText: normalizedFinalVisibleText,
  pattern: /\$185,000/i,
  label: "$185,000",
});
assert.equal(finalPdfHandoffHtml.includes("T12_Stonebridge_Lofts_Attack_Test_8.xlsx"), true);
assert.equal(finalPdfHandoffHtml.includes("Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx"), true);

assert.equal(/DSCR|refi|refinance|DCF|waterfall|equity return|deal score|final recommendation|\bBUY\b|\bSELL\b|\bHOLD\b|loan approval|lender commitment/i.test(finalPdfHandoffHtml), false);
assert.equal(/\b(Boss Contract|V2 Canonical Package|Source Authority|canonical source package|V2 projection|assertion code names|stack trace)\b/i.test(finalPdfHandoffHtml), false);
assert.equal(/<td style="font-weight:600;">-<\/td>/i.test(finalPdfHandoffHtml), false);
assert.equal(/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(finalPdfHandoffHtml), false);
assert.equal(/Document Treatment Summary[\s\S]*Document Treatment Summary/i.test(finalPdfHandoffHtml), false);
assert.equal(/Data Not Available/i.test(finalPdfHandoffHtml), false);
assert.equal(/{{[^}]+}}/.test(finalPdfHandoffHtml), false);
assert.equal(/BEGIN SECTION|END SECTION/i.test(finalPdfHandoffHtml), false);
assert.equal(/\bV2\b/i.test(finalPdfHandoffHtml), false);

const genericRequestBody = buildGenericFinalHandoffPayload();
const genericHandlerResponse = makeHandlerResponse();
await generateClientReport(
  {
    headers: {
      "x-admin-run-key": process.env.ADMIN_RUN_KEY,
    },
    body: genericRequestBody,
  },
  genericHandlerResponse
);

assert.equal(genericHandlerResponse.statusCode, 200);
const genericFinalPdfHandoffHtml = String(genericHandlerResponse.body?.final_html || "");
const genericLocalBossContract = await buildLocalBossContract(genericRequestBody, {
  propertyName: "Harbor View Apartments",
  propertyAddress: "456 Oak Ave",
  assetClass: "Apartment",
  unitCount: 12,
  occupancy: 0.9166666667,
  annualInPlaceRent: 280800,
  annualMarketRent: 336000,
  annualRentUpside: 55200,
  egi: 312000,
  opEx: 123200,
  noi: 188800,
  expenseRatio: 0.3948717948717949,
  noiMargin: 0.6051282051282051,
  breakEvenOccupancy: 0.3948717948717949,
  purchasePrice: 4200000,
  goingInCapRate: 7,
});
const genericLocalCustomerSurfaceModel = await buildLocalCustomerSurfaceModel(genericRequestBody, genericLocalBossContract, {
  propertyName: "Harbor View Apartments",
  propertyAddress: "456 Oak Ave",
  assetClass: "Apartment",
  unitCount: 12,
  occupancy: 0.9166666667,
  annualInPlaceRent: 280800,
  annualMarketRent: 336000,
  annualRentUpside: 55200,
  egi: 312000,
  opEx: 123200,
  noi: 188800,
  expenseRatio: 0.3948717948717949,
  noiMargin: 0.6051282051282051,
  breakEvenOccupancy: 0.3948717948717949,
  purchasePrice: 4200000,
  goingInCapRate: 7,
});
const genericBossValidation = validateAcquisitionMemoBossContract(genericLocalBossContract);
const genericBossRenderValidation = validateAcquisitionMemoRenderAgainstBossContract(genericLocalBossContract, genericFinalPdfHandoffHtml);
const genericCustomerSurfaceValidation = validateAcquisitionMemoV2CustomerSurfaceModel(genericLocalCustomerSurfaceModel);
const genericCustomerSurfaceHtmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(genericFinalPdfHandoffHtml, genericLocalCustomerSurfaceModel);
assert.equal(genericHandlerResponse.body?.success, true, JSON.stringify({
  statusCode: genericHandlerResponse.statusCode,
  success: genericHandlerResponse.body?.success,
  error: genericHandlerResponse.body?.error,
  qa_status: genericHandlerResponse.body?.qa_status,
  delivery_gate_status: genericHandlerResponse.body?.delivery_gate_status,
  render_validation: genericHandlerResponse.body?.render_validation,
  boss_validation: genericHandlerResponse.body?.boss_compliance,
  generic_boss_validation: genericBossValidation,
  generic_render_validation: genericBossRenderValidation,
  generic_customer_surface_validation: genericCustomerSurfaceValidation,
  generic_customer_surface_html_validation: genericCustomerSurfaceHtmlValidation,
}, null, 2));
assert.equal(genericHandlerResponse.body?.report_mode, "v1_core");
assert.equal(genericHandlerResponse.body?.customer_surface_model_validation?.ok, true);
assert.equal(genericHandlerResponse.body?.customer_surface_html_validation?.ok, true);
assert.equal(genericBossValidation.ok, true);
assert.equal(genericBossRenderValidation.ok, true);
assert.equal(genericCustomerSurfaceValidation.ok, true);
assert.equal(genericCustomerSurfaceHtmlValidation.ok, true);
assert.equal(genericFinalPdfHandoffHtml.includes("64-Unit Multifamily"), false);
assert.equal(/64-Unit|64 Unit|64-unit/i.test(genericFinalPdfHandoffHtml), false);
assert.equal(/Stonebridge/i.test(genericFinalPdfHandoffHtml), false);
const genericCoverIdentity = (genericFinalPdfHandoffHtml.match(/<div><span>Asset Class<\/span><strong>(.*?)<\/strong><\/div>/i) || [null, ""])[1];
const genericSummaryIdentity = (genericFinalPdfHandoffHtml.match(/<tr><td>Asset Identity<\/td><td style="font-weight:600;">(.*?)<\/td><\/tr>/i) || [null, ""])[1];
assert.ok(genericCoverIdentity, "generic cover identity must be present");
assert.ok(genericSummaryIdentity, "generic summary identity must be present");
assert.equal(genericCoverIdentity, genericSummaryIdentity);
assert.equal(/64-Unit Multifamily/i.test(genericCoverIdentity), false);
assert.equal(/\b(Boss Contract|V2 Canonical Package|Source Authority|canonical source package|V2 projection|assertion code names|stack trace)\b/i.test(genericFinalPdfHandoffHtml), false);
const tamperedMissingFactHtml = genericFinalPdfHandoffHtml.replace("Property Taxes", "Property Tax");
assert.equal(validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(tamperedMissingFactHtml, genericLocalCustomerSurfaceModel).ok, false);
assert.equal(validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(`${genericFinalPdfHandoffHtml}\nDSCR`, genericLocalCustomerSurfaceModel).ok, false);
assert.equal(validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(`${genericFinalPdfHandoffHtml}\nBoss Contract`, genericLocalCustomerSurfaceModel).ok, false);

console.log("acquisition-memo-v2-final-pdf-handoff-smoke: ok");
