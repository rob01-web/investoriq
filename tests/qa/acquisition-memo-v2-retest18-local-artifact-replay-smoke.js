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
const { renderAcquisitionMemo } = await import("../../api/_lib/acquisition-memo-renderer.js");
const {
  buildAcquisitionMemoBossContract,
  enforceAcquisitionMemoBossContractOnHtml,
  validateAcquisitionMemoBossContract,
  validateAcquisitionMemoRenderAgainstBossContract,
} = await import("../../api/_lib/acquisition-memo-boss-contract.js");
const {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} = await import("../../api/_lib/acquisition-memo-v2-customer-surface-model.js");
const { runAcquisitionMemoV2Orchestrator } = await import("../../api/_lib/acquisition-memo-v2-orchestrator.js");
const { buildAcquisitionMemoV2BossRepairPlan, applyAcquisitionMemoV2BossRepairPlan } = await import("../../api/_lib/acquisition-memo-v2-boss-repair.js");
const { reconcileAcquisitionMemoV2SupportDocRole } = await import("../../api/_lib/acquisition-memo-v2-role-reconciler.js");

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

function buildReplayFixture({
  currentDebtPartial = false,
  purchaseAssumptionsPartial = false,
  omitT12 = false,
  omitRentRoll = false,
  swapSupportRoles = true,
  includeAcceptedTruth = false,
} = {}) {
  const uploadedFiles = [
    { fileId: "t12-file", originalFilename: "Replay_T12_Conflict.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "rent-roll-file", originalFilename: "Replay_Rent_Roll_Conflict.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { fileId: "assumptions-file", originalFilename: "Replay_Purchase_Assumptions.pdf", mimeType: "application/pdf" },
    { fileId: "debt-file", originalFilename: "Replay_Current_Debt.pdf", mimeType: "application/pdf" },
    { fileId: "reno-file", originalFilename: "Replay_Reno_Plan.pdf", mimeType: "application/pdf" },
    { fileId: "appraisal-file", originalFilename: "Replay_Appraisal_Summary.pdf", mimeType: "application/pdf" },
    { fileId: "survey-file", originalFilename: "Replay_Market_Survey.pdf", mimeType: "application/pdf" },
    { fileId: "phase-file", originalFilename: "Replay_Phase_I_ESA.pdf", mimeType: "application/pdf" },
  ];

  const parsedArtifacts = [];

  if (!omitT12) {
    parsedArtifacts.push({
      fileId: "t12-file",
      semantic_doc_role: "t12",
      payload: {
        t12_parsed: {
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
        },
      },
    });
  }

  if (!omitRentRoll) {
    parsedArtifacts.push({
      fileId: "rent-roll-file",
      semantic_doc_role: "rent_roll",
      payload: {
        rent_roll_parsed: {
          total_units: 12,
          occupancy: 0.9166666667,
          unit_mix: [
            { label: "1BR", count: 6, current_rent: 1450, market_rent: 1600 },
            { label: "2BR", count: 6, current_rent: 1750, market_rent: 1950 },
          ],
          units: [
            { label: "1BR", unit_number: "1-101", current_rent: 1450, market_rent: 1600 },
            { label: "2BR", unit_number: "2-101", current_rent: 1750, market_rent: 1950 },
          ],
          annual_in_place_rent: 280800,
          annual_market_rent: 336000,
        },
      },
    });
  }

  const purchaseAssumptionsText =
    "Purchase assumptions / proposed acquisition financing\n" +
    "Purchase Price $4,200,000\n" +
    "NOI Basis $188,800\n" +
    "Going-In Cap Reference 7.00%\n" +
    "Proposed Acquisition Loan $2,940,000\n" +
    "LTV 70.0%\n" +
    "Interest Rate 5.95%\n" +
    "Amortization 30 years" +
    (purchaseAssumptionsPartial ? "" : "\nLender Fee 0.85%");

  const currentDebtText =
    "Existing Current Debt Statement\n" +
    "Current Outstanding Balance $2,150,000\n" +
    "Interest Rate 4.85%" +
    (currentDebtPartial ? "" : "\nAmortization Remaining 24 years\nMonthly Payment $12,450\nMaturity Date 2030-11-01");

  parsedArtifacts.push({
    fileId: "assumptions-file",
    semantic_doc_role: swapSupportRoles ? "current_debt" : "purchase_assumptions",
    debt_basis: swapSupportRoles ? "current_debt" : "acquisition_financing_assumption",
    payload: {
      document_text_extracted: purchaseAssumptionsText,
      ...(includeAcceptedTruth
        ? {
            semantic_doc_display_label: swapSupportRoles
              ? "Existing Current Debt Statement / Current Mortgage / Debt Statement"
              : "Purchase Assumptions / Proposed Acquisition Financing Context",
            acceptedSemanticDocRole: "purchase_assumptions",
            acceptedDebtBasis: "acquisition_financing_assumption",
            acceptedSemanticDocDisplayLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
          }
        : {}),
    },
  });

  parsedArtifacts.push({
    fileId: "debt-file",
    semantic_doc_role: swapSupportRoles ? "purchase_assumptions" : "current_debt",
    debt_basis: swapSupportRoles ? "acquisition_financing_assumption" : "current_debt_context",
    payload: {
      document_text_extracted: currentDebtText,
      current_debt_parsed: {
        current_outstanding_balance: 2150000,
        interest_rate: 0.0485,
        amortization_remaining_years: currentDebtPartial ? null : 24,
        monthly_payment: currentDebtPartial ? null : 12450,
        maturity_date: currentDebtPartial ? null : "2030-11-01",
      },
      ...(includeAcceptedTruth
        ? {
            semantic_doc_display_label: swapSupportRoles
              ? "Purchase Assumptions / Proposed Acquisition Financing Context"
              : "Existing Current Debt Statement / Current Mortgage / Debt Statement",
            acceptedSemanticDocRole: "current_debt_context",
            acceptedDebtBasis: "current_debt_context",
            acceptedSemanticDocDisplayLabel: "Existing Current Debt Statement / Current Mortgage / Debt Statement",
          }
        : {}),
    },
  });

  parsedArtifacts.push({
    fileId: "reno-file",
    semantic_doc_role: "renovation_plan",
    payload: {
      document_text_extracted: "Renovation plan is not underwriting-critical for this local replay wall.",
    },
  });

  parsedArtifacts.push({
    fileId: "appraisal-file",
    semantic_doc_role: "appraisal",
    payload: {
      document_text_extracted: "Appraisal context is present for local replay proof only.",
    },
  });

  parsedArtifacts.push({
    fileId: "survey-file",
    semantic_doc_role: "market_survey",
    payload: {
      document_text_extracted: "Market survey context is present for local replay proof only.",
    },
  });

  parsedArtifacts.push({
    fileId: "phase-file",
    semantic_doc_role: "phase_i_esa",
    payload: {
      document_text_extracted: "Phase I ESA context is present for local replay proof only.",
    },
  });

  return { uploadedFiles, parsedArtifacts };
}

function buildReplayPropertyFixture() {
  return {
    propertyName: "Replay Property",
    uploadedFiles: [
      { fileId: "t12-file", originalFilename: "Replay_T12.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      { fileId: "rent-roll-file", originalFilename: "Replay_Rent_Roll.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      { fileId: "assumptions-file", originalFilename: "Replay_Purchase_Assumptions.pdf", mimeType: "application/pdf" },
      { fileId: "current-debt-file", originalFilename: "Replay_Current_Debt.pdf", mimeType: "application/pdf" },
      { fileId: "reno-file", originalFilename: "Replay_Reno_Plan.pdf", mimeType: "application/pdf" },
      { fileId: "appraisal-file", originalFilename: "Replay_Appraisal_Summary.pdf", mimeType: "application/pdf" },
      { fileId: "survey-file", originalFilename: "Replay_Market_Survey.pdf", mimeType: "application/pdf" },
      { fileId: "phase-file", originalFilename: "Replay_Phase_I_ESA.pdf", mimeType: "application/pdf" },
    ],
    parsedArtifacts: [
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
        original_filename: "Replay_Purchase_Assumptions.pdf",
        semantic_doc_role: "purchase_assumptions",
        debt_basis: "acquisition_financing_assumption",
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
        original_filename: "Replay_Current_Debt.pdf",
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
          current_debt_parsed: {
            current_outstanding_balance: 6800000,
            interest_rate: 0.0485,
            amortization_remaining_years: 24,
            monthly_payment: 39250,
            maturity_date: "2029-11-01",
          },
        },
      },
      {
        fileId: "reno-file",
        original_filename: "Replay_Reno_Plan.pdf",
        semantic_doc_role: "renovation_plan",
        payload: { document_text_extracted: "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000" },
      },
      {
        fileId: "appraisal-file",
        original_filename: "Replay_Appraisal_Summary.pdf",
        semantic_doc_role: "appraisal",
        payload: { document_text_extracted: "Appraisal Summary / Valuation Context" },
      },
      {
        fileId: "survey-file",
        original_filename: "Replay_Market_Survey.pdf",
        semantic_doc_role: "market_survey",
        payload: { document_text_extracted: "Market Rent Survey Context" },
      },
      {
        fileId: "phase-file",
        original_filename: "Replay_Phase_I_ESA.pdf",
        semantic_doc_role: "phase_i_esa",
        payload: { document_text_extracted: "Phase I ESA / Environmental Due Diligence Context" },
      },
    ],
  };
}

function buildCoreMetrics({ units = 12, occupancy = 0.9166666667, annualInPlaceRent = 280800, annualMarketRent = 336000, annualRentUpside = 55200, egi = 312000, opEx = 123200, noi = 188800, purchasePrice = 4200000, goingInCapRate = 7 } = {}) {
  return {
    occupancy,
    annualInPlaceRent,
    annualMarketRent,
    annualRentUpside,
    egi,
    opEx,
    noi,
    expenseRatio: opEx / egi,
    noiMargin: noi / egi,
    breakEvenOccupancy: 0.37,
    purchasePrice,
    goingInCapRate,
    units,
    totalUnits: units,
  };
}

function buildReplayRequestBody(fixture) {
  const t12Artifact = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "t12-file");
  const rentRollArtifact = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "rent-roll-file");
  const currentDebtArtifact = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "debt-file" || artifact.fileId === "current-debt-file");
  const purchaseAssumptionsArtifact = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "assumptions-file");
  const isReplayProperty = String(fixture.propertyName || "").trim().toLowerCase() === "replay property";
  const t12Parsed = t12Artifact?.payload?.t12_parsed || {};
  const rentRollParsed = rentRollArtifact?.payload?.rent_roll_parsed || {};
  const currentDebtParsed = currentDebtArtifact?.payload?.current_debt_parsed || {};
  const propertyName = fixture.propertyName || (isReplayProperty ? "Replay Property" : "Harbor View Apartments");
  const propertyAddress = isReplayProperty ? "123 Replay Road" : "123 Harbor Road";
  const propertyTaxFilename = isReplayProperty ? "Replay_Property_Tax_Support.pdf" : "Harbor_View_Property_Tax.pdf";
  const t12Filename = t12Artifact?.originalFilename || (isReplayProperty ? "Replay_T12.xlsx" : "Replay_T12_Conflict.xlsx");
  const rentRollFilename = rentRollArtifact?.originalFilename || (isReplayProperty ? "Replay_Rent_Roll.xlsx" : "Replay_Rent_Roll_Conflict.xlsx");
  const assumptionsFilename = purchaseAssumptionsArtifact?.originalFilename || (isReplayProperty ? "Replay_Purchase_Assumptions.pdf" : "Harbor_View_Assumptions.pdf");
  const debtFilename = currentDebtArtifact?.originalFilename || (isReplayProperty ? "Replay_Current_Debt.pdf" : "Current_Debt_Harbor_View.pdf");
  const renovationFilename = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "reno-file")?.originalFilename || (isReplayProperty ? "Replay_Reno_Plan.pdf" : "Harbor_View_Reno_Plan.pdf");
  const appraisalFilename = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "appraisal-file")?.originalFilename || (isReplayProperty ? "Replay_Appraisal_Summary.pdf" : "Harbor_View_Appraisal_Summary.pdf");
  const marketSurveyFilename = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "survey-file")?.originalFilename || (isReplayProperty ? "Replay_Market_Survey.pdf" : "Harbor_View_Market_Survey.pdf");
  const phaseFilename = fixture.parsedArtifacts.find((artifact) => artifact.fileId === "phase-file")?.originalFilename || (isReplayProperty ? "Replay_Phase_I_ESA.pdf" : "Harbor_View_Phase_I_ESA.pdf");
  const computedRentRoll = isReplayProperty
    ? {
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
      }
    : {
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
  const t12Payload = isReplayProperty
    ? {
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
      }
    : {
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
  const rentRollPayload = isReplayProperty
    ? {
        total_units: 64,
        occupied_units: 60,
        vacant_units: 4,
        occupancy: 0.9375,
        annual_in_place_rent: 1432800,
        annual_market_rent: 1718400,
      }
    : {
        total_units: 12,
        occupied_units: 11,
        vacant_units: 1,
        occupancy: 0.9166666667,
        annual_in_place_rent: 280800,
        annual_market_rent: 336000,
      };
  const acquisitionTermsPayload = isReplayProperty
    ? {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 13500000,
        going_in_cap_rate: 0.07,
        noi_basis: 945000,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
        source_text: purchaseAssumptionsArtifact?.payload?.document_text_extracted || "",
      }
    : {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 4200000,
        going_in_cap_rate: 0.07,
        noi_basis: 188800,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: fixture.purchaseAssumptionsPartial ? null : 0.0085,
        source_text: purchaseAssumptionsArtifact?.payload?.document_text_extracted || "",
      };
  const loanTermSheetTermsPayload = isReplayProperty
    ? {
        debt_basis: "current_debt_context",
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amortization_years: 24,
        monthly_payment: 39250,
        maturity_date: "2029-11-01",
        source_text: currentDebtArtifact?.payload?.document_text_extracted || "",
      }
    : {
        debt_basis: "current_debt_context",
        outstanding_balance: 2150000,
        interest_rate: 0.0485,
        amortization_years: fixture.currentDebtPartial ? null : 24,
        monthly_payment: fixture.currentDebtPartial ? null : 12450,
        maturity_date: fixture.currentDebtPartial ? null : "2030-11-01",
        source_text: currentDebtArtifact?.payload?.document_text_extracted || "",
      };
  const mortgagePayload = isReplayProperty
    ? {
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amort_years: 24,
        monthly_payment: 39250,
        ltv: 0.7,
      }
    : {
        outstanding_balance: 2150000,
        interest_rate: 0.0485,
        amort_years: fixture.currentDebtPartial ? null : 24,
        monthly_payment: fixture.currentDebtPartial ? null : 12450,
        maturity_date: fixture.currentDebtPartial ? null : "2030-11-01",
        ltv: 0.7,
      };

  return {
    userId: "user_retest18_local_artifact_replay",
    report_type: "underwriting",
    property_name: propertyName,
    __test_enable_acq_memo_v2_source_authority: true,
    __test_return_final_html: true,
    __test_payloads: {
      computedRentRoll,
      t12Payload,
      rentRollPayload,
      acquisitionTermsPayload,
      loanTermSheetTermsPayload,
      mortgagePayload,
      propertyTaxPayload: {
        annual_tax: isReplayProperty ? 185000 : 40800,
        original_filename: propertyTaxFilename,
      },
      documentSources: fixture.uploadedFiles.map((file) => ({
        id: file.fileId,
        original_filename: file.originalFilename,
        doc_type: String(file.fileId || "").includes("t12")
          ? "t12"
          : String(file.fileId || "").includes("rent-roll")
          ? "rent_roll"
          : String(file.fileId || "").includes("assumptions")
          ? "purchase_assumptions"
          : String(file.fileId || "").includes("debt")
          ? "current_debt"
          : String(file.fileId || "").includes("reno")
          ? "renovation_plan"
          : String(file.fileId || "").includes("appraisal")
          ? "appraisal"
          : String(file.fileId || "").includes("survey")
          ? "market_survey"
          : String(file.fileId || "").includes("phase")
          ? "phase_i_esa"
          : "support_doc",
        mime_type: file.mimeType,
        parse_status: "parsed",
        parse_error: null,
      })),
      coverageArtifacts: fixture.parsedArtifacts.map((artifact, index) => {
        const artifactId = artifact.fileId === "t12-file"
          ? "artifact-t12-file"
          : artifact.fileId === "rent-roll-file"
          ? "artifact-rent-roll-file"
          : artifact.fileId === "assumptions-file"
          ? "artifact-assumptions-file"
          : artifact.fileId === "debt-file" || artifact.fileId === "current-debt-file"
          ? "artifact-debt-file"
          : artifact.fileId === "reno-file"
          ? "artifact-reno-file"
          : artifact.fileId === "appraisal-file"
          ? "artifact-appraisal-file"
          : artifact.fileId === "survey-file"
          ? "artifact-survey-file"
          : "artifact-phase-file";
        const payload = structuredClone(artifact.payload || {});
        payload.source_file_id = artifact.fileId;
        const sourceOriginalFilename = fixture.uploadedFiles.find((file) => file.fileId === artifact.fileId)?.originalFilename || null;
        if (sourceOriginalFilename) payload.source_original_filename = sourceOriginalFilename;
        if (artifact.fileId === "assumptions-file") {
          payload.semantic_doc_role = "purchase_assumptions";
          payload.semantic_doc_display_label = isReplayProperty
            ? "Purchase Assumptions / Proposed Acquisition Financing Context"
            : "Purchase Assumptions / Proposed Acquisition Financing Context";
          payload.debt_basis = "acquisition_financing_assumption";
          if (fixture.includeAcceptedTruth) {
            payload.acceptedSemanticDocRole = "purchase_assumptions";
            payload.acceptedDebtBasis = "acquisition_financing_assumption";
            payload.acceptedSemanticDocDisplayLabel = "Purchase Assumptions / Proposed Acquisition Financing Context";
            payload.hasPurchaseAssumptions = true;
          }
        }
        if (artifact.fileId === "debt-file") {
          payload.semantic_doc_role = "current_debt";
          payload.semantic_doc_display_label = "Existing Current Debt Statement / Current Mortgage / Debt Statement";
          payload.debt_basis = "current_debt_context";
          payload.current_debt_parsed = structuredClone(currentDebtParsed);
          if (fixture.includeAcceptedTruth) {
            payload.acceptedSemanticDocRole = "current_debt_context";
            payload.acceptedDebtBasis = "current_debt_context";
            payload.acceptedSemanticDocDisplayLabel = "Existing Current Debt Statement / Current Mortgage / Debt Statement";
            payload.hasCurrentDebt = true;
          }
        }
        return {
        id: artifactId,
        file_id: artifact.fileId,
        type: artifact.fileId === "t12-file"
          ? "t12_parsed"
          : artifact.fileId === "rent-roll-file"
          ? "rent_roll_parsed"
          : artifact.fileId === "current-debt-file"
          ? "document_text_extracted"
          : "document_text_extracted",
          created_at: `2026-06-24T00:0${index}:00.000Z`,
          payload,
        };
      }),
    },
  };
}

function buildModelInputs({ propertyName = "Harbor View Apartments", propertyAddress = "123 Harbor Road", assetClass = "Multifamily", generatedAt = "2026-06-24T00:00:00.000Z" } = {}) {
  const isReplayProperty = propertyName === "Replay Property";
  return {
    coreMetrics: buildCoreMetrics({
      units: isReplayProperty ? 64 : 12,
      occupancy: isReplayProperty ? 0.9375 : 0.9166666667,
      annualInPlaceRent: isReplayProperty ? 1432800 : 280800,
      annualMarketRent: isReplayProperty ? 1718400 : 336000,
      annualRentUpside: isReplayProperty ? 285600 : 55200,
      egi: isReplayProperty ? 1500000 : 312000,
      opEx: isReplayProperty ? 555000 : 123200,
      noi: isReplayProperty ? 945000 : 188800,
      purchasePrice: isReplayProperty ? 13500000 : 4200000,
      goingInCapRate: 7,
    }),
    propertyProfile: {
      propertyName,
      propertyAddress,
      propertyTitle: propertyName,
      assetClass,
    },
    reportMeta: {
      propertyName,
      generatedAt,
      reportType: "underwriting",
      reportMode: "v1_core",
      reportTier: 2,
      propertyTitle: propertyName,
    },
    reportMode: "v1_core",
  };
}

function buildReplayDocumentArgs(requestBody, authorities) {
  return {
    sourcePackage: authorities.sourcePackage,
    acquisitionMemoProjection: authorities.acquisitionMemoProjection,
    customerSurfaceModel: authorities.customerSurfaceModel,
    bossContract: authorities.bossContract,
    renderedAcquisitionMemo: renderAcquisitionMemo(authorities.acquisitionMemoProjection),
    coreMetrics: authorities.modelInputs.coreMetrics,
    propertyProfile: authorities.modelInputs.propertyProfile,
    reportMeta: authorities.modelInputs.reportMeta,
    reportMode: authorities.modelInputs.reportMode,
    t12Payload: structuredClone(requestBody.__test_payloads.t12Payload),
    acquisitionTermsPayload: structuredClone(requestBody.__test_payloads.acquisitionTermsPayload),
    loanTermSheetTermsPayload: structuredClone(requestBody.__test_payloads.loanTermSheetTermsPayload),
    mortgagePayload: structuredClone(requestBody.__test_payloads.mortgagePayload),
  };
}

async function buildLocalAuthorities(requestBody, modelInputs = null) {
  const sourcePackage = buildCanonicalSourcePackage(
    structuredClone(requestBody.__test_payloads.documentSources),
    structuredClone(requestBody.__test_payloads.coverageArtifacts)
  );
  const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
  const normalizedModelInputs = modelInputs || buildModelInputs({
    propertyName: String(requestBody.property_name || "").trim() || "Harbor View Apartments",
    propertyAddress: String(requestBody.property_address || "123 Harbor Road").trim(),
    propertyTitle: String(requestBody.property_title || requestBody.property_name || "").trim() || String(requestBody.property_name || "").trim() || "Harbor View Apartments",
    assetClass: String(requestBody.asset_class || "Multifamily").trim() || "Multifamily",
    generatedAt: "2026-06-24T00:00:00.000Z",
  });
  const bossContract = buildAcquisitionMemoBossContract({
    canonicalSourcePackage: sourcePackage,
    acquisitionMemoProjection,
    t12Payload: structuredClone(requestBody.__test_payloads.t12Payload),
    ...normalizedModelInputs,
  });
  const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
    canonicalSourcePackage: sourcePackage,
    acquisitionMemoProjection,
    bossContract,
    ...normalizedModelInputs,
  });
  return { sourcePackage, acquisitionMemoProjection, bossContract, customerSurfaceModel, modelInputs: normalizedModelInputs };
}

function assertFinalHtmlContracts(finalHtml) {
  assert.match(finalHtml, /<td>1BR<\/td>/i);
  assert.match(finalHtml, /<td>2BR<\/td>/i);
  assert.match(finalHtml, /<td>Current Outstanding Balance<\/td><td style="font-weight:600;">\$6,800,000<\/td>/i);
  assert.match(finalHtml, /<td>(?:Current debt rate|Interest Rate)<\/td><td style="font-weight:600;">4\.85%<\/td>/i);
  assert.match(finalHtml, /<td>Amortization Remaining<\/td><td style="font-weight:600;">24 years<\/td>/i);
  assert.match(finalHtml, /<td>Monthly Payment<\/td><td style="font-weight:600;">\$39,250<\/td>/i);
  assert.match(finalHtml, /<td>Maturity Date<\/td><td style="font-weight:600;">2029-11-01<\/td>/i);
  assert.match(finalHtml, /<td>Proposed Acquisition Loan<\/td><td style="font-weight:600;">\$9,450,000<\/td>/i);
  assert.match(finalHtml, /<td>Proposed LTV<\/td><td style="font-weight:600;">70\.0%<\/td>/i);
  assert.match(finalHtml, /<td>Proposed Rate<\/td><td style="font-weight:600;">5\.95%<\/td>/i);
  assert.match(finalHtml, /<td>Proposed Amortization<\/td><td style="font-weight:600;">30 years<\/td>/i);
  assert.match(finalHtml, /<td>Lender \/ Origination Fee<\/td><td style="font-weight:600;">0\.85%<\/td>/i);
  assert.match(finalHtml, /<td>Property Taxes<\/td><td style="font-weight:600;">\$185,000<\/td>/i);
  assert.equal(/<td style="font-weight:600;">-<\/td>/i.test(finalHtml), false);
  assert.equal(/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(finalHtml), false);
  assert.equal(/DSCR|refi|refinance|DCF|waterfall|equity return|deal score|final recommendation|\bBUY\b|\bSELL\b|\bHOLD\b|loan approval|lender commitment/i.test(finalHtml), false);
  assert.equal(/\b(Boss Contract|CustomerSurfaceModel|Source Authority|V2 projection|stack trace)\b/i.test(finalHtml), false);
}

async function runReplayScenario() {
  const publishFixture = buildReplayPropertyFixture();
  const publishRequestBody = buildReplayRequestBody(publishFixture);
  const publishAuthorities = await buildLocalAuthorities(publishRequestBody, buildModelInputs({
    propertyName: publishRequestBody.property_name,
    propertyAddress: "123 Main St",
    assetClass: "Multifamily",
    generatedAt: "2026-06-20T00:00:00.000Z",
  }));
  const publishOrchestratorResult = await runAcquisitionMemoV2Orchestrator({
    acquisitionMemoV2DocumentArgs: buildReplayDocumentArgs(publishRequestBody, publishAuthorities),
    acquisitionMemoBossContract: publishAuthorities.bossContract,
  });

  const publishBossValidation = validateAcquisitionMemoBossContract(publishAuthorities.bossContract);
  const publishModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(publishAuthorities.customerSurfaceModel);
  assert.equal(publishBossValidation.ok, true, JSON.stringify(publishBossValidation, null, 2));
  assert.equal(publishModelValidation.ok, true, JSON.stringify(publishModelValidation, null, 2));

  const publishHtml = String(publishOrchestratorResult?.html || "");
  assert.equal(Boolean(publishHtml), true, JSON.stringify(publishOrchestratorResult || {}, null, 2));
  assert.equal(publishOrchestratorResult?.compliance?.ok, true, JSON.stringify(publishOrchestratorResult || {}, null, 2));
  assert.equal(validateAcquisitionMemoRenderAgainstBossContract(publishAuthorities.bossContract, publishHtml).ok, true, JSON.stringify(publishOrchestratorResult || {}, null, 2));
  assert.equal(validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(publishHtml, publishAuthorities.customerSurfaceModel).ok, true, JSON.stringify(publishOrchestratorResult || {}, null, 2));
  assertFinalHtmlContracts(publishHtml);

  const conflictFixture = buildReplayFixture({ includeAcceptedTruth: true });
  const conflictRequestBody = buildReplayRequestBody(conflictFixture);
  const conflictAuthorities = await buildLocalAuthorities(conflictRequestBody, buildModelInputs({
    propertyName: conflictRequestBody.property_name,
    propertyAddress: "123 Harbor Road",
    assetClass: "Multifamily",
    generatedAt: "2026-06-24T00:00:00.000Z",
  }));
  const conflictCurrentDebtReconciliation = reconcileAcquisitionMemoV2SupportDocRole({
    file: conflictFixture.parsedArtifacts.find((artifact) => artifact.fileId === "debt-file"),
    artifacts: conflictFixture.parsedArtifacts,
    acceptedTruth: {
      semanticDocRole: "current_debt_context",
      debtBasis: "current_debt_context",
      semanticDocDisplayLabel: "Existing Current Debt Statement / Current Mortgage / Debt Statement",
    },
  });
  const conflictPurchaseAssumptionsReconciliation = reconcileAcquisitionMemoV2SupportDocRole({
    file: conflictFixture.parsedArtifacts.find((artifact) => artifact.fileId === "assumptions-file"),
    artifacts: conflictFixture.parsedArtifacts,
    acceptedTruth: {
      semanticDocRole: "purchase_assumptions",
      debtBasis: "acquisition_financing_assumption",
      semanticDocDisplayLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
    },
  });

  assert.equal(conflictCurrentDebtReconciliation.canonicalRole, "current_debt_context");
  assert.equal(conflictPurchaseAssumptionsReconciliation.canonicalRole, "purchase_assumptions");
  assert.equal(conflictAuthorities.sourcePackage.supportDocs.get("debt-file")?.canonicalRole, "current_debt_context");
  assert.equal(conflictAuthorities.sourcePackage.supportDocs.get("assumptions-file")?.canonicalRole, "purchase_assumptions");
  assert.equal(conflictAuthorities.acquisitionMemoProjection.supportDocProjection.currentDebtContext?.canonicalRole, "current_debt_context");
  assert.equal(conflictAuthorities.acquisitionMemoProjection.supportDocProjection.purchaseAssumptions?.canonicalRole, "purchase_assumptions");
  assert.equal(conflictAuthorities.customerSurfaceModel.sourceTruth.accepted.currentDebtPresent, true);
  assert.equal(conflictAuthorities.customerSurfaceModel.sourceTruth.accepted.purchaseAssumptionsPresent, true);

  const collapseableForbiddenEnforcement = enforceAcquisitionMemoBossContractOnHtml(
    publishAuthorities.bossContract,
    `${publishHtml}\n<div>DSCR refinance DCF waterfall equity return deal score loan approval</div>`
  );
  assert.equal(collapseableForbiddenEnforcement.ok, true, JSON.stringify(collapseableForbiddenEnforcement, null, 2));
  assert.equal(/DSCR|refinance|DCF|waterfall|equity return|deal score|loan approval/i.test(collapseableForbiddenEnforcement.repairedHtml || ""), false);

  const hardForbiddenEnforcement = enforceAcquisitionMemoBossContractOnHtml(
    publishAuthorities.bossContract,
    `${publishHtml}\n<div>final recommendation BUY SELL HOLD lender commitment</div>`
  );
  assert.equal(hardForbiddenEnforcement.ok, false, JSON.stringify(hardForbiddenEnforcement, null, 2));
  assert.equal(
    validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(publishHtml, publishAuthorities.customerSurfaceModel).ok,
    true
  );

  const coreFatalT12Fixture = buildReplayFixture({ omitT12: true });
  const coreFatalT12Request = buildReplayRequestBody(coreFatalT12Fixture);
  coreFatalT12Request.__test_payloads.documentSources = coreFatalT12Request.__test_payloads.documentSources.filter((doc) => doc.id !== "t12-file");
  coreFatalT12Request.__test_payloads.coverageArtifacts = coreFatalT12Request.__test_payloads.coverageArtifacts.filter((artifact) => artifact.file_id !== "t12-file");
  const coreFatalT12Response = makeHandlerResponse();
  await generateClientReport({ headers: { "x-admin-run-key": process.env.ADMIN_RUN_KEY }, body: coreFatalT12Request }, coreFatalT12Response);
  assert.notEqual(coreFatalT12Response.statusCode, 200);
  assert.equal(coreFatalT12Response.body?.success, false);

  const coreFatalRentRollFixture = buildReplayFixture({ omitRentRoll: true });
  const coreFatalRentRollRequest = buildReplayRequestBody(coreFatalRentRollFixture);
  coreFatalRentRollRequest.__test_payloads.documentSources = coreFatalRentRollRequest.__test_payloads.documentSources.filter((doc) => doc.id !== "rent-roll-file");
  coreFatalRentRollRequest.__test_payloads.coverageArtifacts = coreFatalRentRollRequest.__test_payloads.coverageArtifacts.filter((artifact) => artifact.file_id !== "rent-roll-file");
  const coreFatalRentRollResponse = makeHandlerResponse();
  await generateClientReport({ headers: { "x-admin-run-key": process.env.ADMIN_RUN_KEY }, body: coreFatalRentRollRequest }, coreFatalRentRollResponse);
  assert.notEqual(coreFatalRentRollResponse.statusCode, 200);
  assert.equal(coreFatalRentRollResponse.body?.success, false);

  console.log("acquisition-memo-v2 retest18 local artifact replay smoke PASS");
}

await runReplayScenario();
