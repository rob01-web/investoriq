import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const stonebridgeAuthorityPath = path.join(root, "tests", "qa", "fixtures", "stonebridge-retest21-source-authority.json");
const stonebridgeSourceDir = path.join(root, "tests", "investoriq_validation_fixtures_UPLOADABLE", "Final Attack Test 8");

const stonebridgeAuthority = JSON.parse(fs.readFileSync(stonebridgeAuthorityPath, "utf8"));

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sourceFile(filename) {
  const filePath = path.join(stonebridgeSourceDir, filename);
  if (!fs.existsSync(filePath)) throw new Error(`PHASE8_STONEBRIDGE_SOURCE_FILE_MISSING:${filename}`);
  return {
    filename,
    repository_path: path.relative(root, filePath),
    sha256: sha256(filePath),
    bytes: fs.statSync(filePath).size,
  };
}

function makeResponse() {
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

function expandRentRollUnits(payload = {}) {
  return (Array.isArray(payload.unit_groups) ? payload.unit_groups : []).flatMap((group, groupIndex) =>
    Array.from({ length: Number(group.count || 0) }, (_, index) => ({
      unit: `${groupIndex + 1}-${String(index + 1).padStart(2, "0")}`,
      unit_number: `${groupIndex + 1}-${String(index + 1).padStart(2, "0")}`,
      unit_type: group.unit_type,
      label: group.unit_type,
      status: String(group.status || "").toLowerCase(),
      sqft: group.sqft,
      in_place_rent: group.in_place_rent,
      current_rent: group.in_place_rent,
      market_rent: group.market_rent,
    }))
  );
}

const harbourstoneT12 = Object.freeze({
  effective_gross_income: 1100000,
  total_operating_expenses: 450000,
  net_operating_income: 650000,
  gross_potential_rent: 1850000,
  gross_scheduled_rent: 1850000,
});

const harbourstoneRentRoll = Object.freeze({
  total_units: 48,
  occupied_units: 46,
  vacant_units: 2,
  occupancy: 0.9583333333,
  total_in_place_annual: 1036800,
  total_market_annual: 1137600,
  annual_in_place_rent: 1036800,
  annual_market_rent: 1137600,
  units: Object.freeze([
    Object.freeze({ unit: "101", status: "occupied", in_place_rent: 2100, market_rent: 2250, beds: 1, sqft: 720 }),
    Object.freeze({ unit: "102", status: "occupied", in_place_rent: 2125, market_rent: 2275, beds: 1, sqft: 735 }),
    Object.freeze({ unit: "201", status: "vacant", in_place_rent: 0, market_rent: 2300, beds: 2, sqft: 980 }),
  ]),
});

function buildHarbourstoneScreeningRequest() {
  const t12File = {
    id: "full-render-t12-file",
    original_filename: "Full_Render_T12.xlsx",
    doc_type: "t12",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parse_status: "parsed",
  };
  const rentRollFile = {
    id: "full-render-rent-roll-file",
    original_filename: "Full_Render_Rent_Roll.xlsx",
    doc_type: "rent_roll",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parse_status: "parsed",
  };
  const coverageArtifacts = [
    {
      id: "full-render-t12-artifact",
      file_id: t12File.id,
      type: "t12_parsed",
      payload: {
        file_id: t12File.id,
        source_file_id: t12File.id,
        original_filename: t12File.original_filename,
        source_original_filename: t12File.original_filename,
        t12_parsed: {
          ...harbourstoneT12,
          validated: true,
          core_t12_validation: { ok: true, failures: [] },
        },
      },
    },
    {
      id: "full-render-rent-roll-artifact",
      file_id: rentRollFile.id,
      type: "rent_roll_parsed",
      payload: {
        file_id: rentRollFile.id,
        source_file_id: rentRollFile.id,
        original_filename: rentRollFile.original_filename,
        source_original_filename: rentRollFile.original_filename,
        rent_roll_parsed: {
          ...harbourstoneRentRoll,
          validated: true,
          parser_diagnostics: { validation_reasons: [] },
        },
      },
    },
  ];

  return {
    headers: { "x-admin-run-key": process.env.ADMIN_RUN_KEY },
    body: {
      userId: "phase8_certification_screening_harbourstone",
      report_type: "screening",
      property_name: "Harbourstone",
      __test_return_final_html: true,
      __test_payloads: {
        t12Payload: { ...harbourstoneT12 },
        rentRollPayload: {
          ...harbourstoneRentRoll,
          totals: {
            summary_row_detected: true,
            total_units: 48,
            occupied_units: 46,
            vacant_units: 2,
            occupancy: 0.9583333333,
            in_place_rent_annual: 1036800,
            market_rent_annual: 1137600,
          },
        },
        computedRentRoll: {
          ...harbourstoneRentRoll,
          total_annual_market: 1137600,
          avg_in_place_rent: 1800,
          avg_market_rent: 1980,
          rent_to_market_gap: 0.0961538462,
        },
        documentSources: [t12File, rentRollFile],
        coverageArtifacts,
      },
    },
  };
}

function buildStonebridgeUnderwritingRequest() {
  const t12 = structuredClone(stonebridgeAuthority.artifacts.t12.payload);
  const sourceRentRoll = structuredClone(stonebridgeAuthority.artifacts.rent_roll.payload);
  const units = expandRentRollUnits(sourceRentRoll);
  const rentRoll = {
    ...sourceRentRoll,
    occupied_units: 60,
    vacant_units: 4,
    total_in_place_annual: 1432800,
    total_market_annual: 1718400,
    annual_in_place_rent: 1432800,
    annual_market_rent: 1718400,
    units,
  };
  delete rentRoll.unit_groups;

  const files = [
    { id: t12.file_id, original_filename: t12.original_filename, doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: sourceRentRoll.file_id, original_filename: sourceRentRoll.original_filename, doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "stonebridge-assumptions-file", original_filename: "Stonebridge_Assumptions.pdf", doc_type: "loan_term_sheet", semantic_doc_role: "purchase_assumptions", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "stonebridge-current-debt-file", original_filename: "Current_Debt_Stonebridge.pdf", doc_type: "supporting_document", semantic_doc_role: "current_mortgage_statement", mime_type: "application/pdf", parse_status: "parsed" },
    { id: stonebridgeAuthority.artifacts.misclassified_renovation.file_id, original_filename: "Stonebridge_Reno_Plan.pdf", doc_type: "supporting_document", semantic_doc_role: "renovation", mime_type: "application/pdf", parse_status: "parsed_with_warnings" },
    { id: "stonebridge-appraisal-file", original_filename: "Stonebridge_Appraisal_Summary.pdf", doc_type: "appraisal", semantic_doc_role: "appraisal", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "stonebridge-market-survey-file", original_filename: "Stonebridge_Market_Survey.pdf", doc_type: "supporting_document", semantic_doc_role: "market_survey", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "stonebridge-phase-i-file", original_filename: "Stonebridge_Phase_I_ESA.pdf", doc_type: "supporting_document", semantic_doc_role: "phase_i_esa", mime_type: "application/pdf", parse_status: "parsed" },
  ];

  const assumptionsText = `Stonebridge Lofts - Purchase Assumptions / Proposed Acquisition Financing
Document Role
This document is intended to represent purchase assumptions and proposed acquisition financing only. It is not a current mortgage statement and does not represent existing debt.
Acquisition Context
Asking / Purchase Price $13,500,000
NOI Basis $945,000
Going-In Cap Reference 7.00%
Proposed Acquisition Loan $9,450,000
Proposed LTV 70.0%
Proposed Interest Rate 5.95%
Proposed Amortization 30 years
Lender / Origination Fee 0.85%
Limitations
These are proposed acquisition financing assumptions for lender discussion only.
Do not treat the proposed acquisition loan as current outstanding debt.
Do not use this document to produce current debt DSCR, refinance capacity, DCF, waterfall, equity return, or a final recommendation.`;
  const currentDebtText = `Stonebridge Lofts - Existing Current Debt Statement
Document Role
This is an existing/current debt context document. It is separate from proposed acquisition financing.
Current Debt Terms
Current Outstanding Balance $6,800,000
Interest Rate 4.85%
Amortization Remaining 24 years
Monthly Payment $39,250
Maturity Date 2029-11-01
Limitations
Display as current/existing debt context only in launch-mode Acquisition Memo unless the current product doctrine explicitly supports additional debt calculations.
Keep this document separate from Stonebridge_Assumptions.pdf proposed acquisition financing.
Do not produce refinance capacity, DCF, waterfall, equity return, or final recommendation from this document.`;
  const renovationText = stonebridgeAuthority.artifacts.misclassified_renovation.text;
  const renovationBudgetRows = [
    {
      category: "1BR Interiors",
      unit_count: 20,
      cost_per_unit: 18500,
      expected_monthly_rent_lift: 225,
      phase_timing: "Months 1-18",
      evidence: ["1BR Interiors 20 units X $18,500/unit; expected rent lift $225/month; Months 1-18"],
    },
    {
      category: "2BR Interiors",
      unit_count: 18,
      cost_per_unit: 24000,
      expected_monthly_rent_lift: 325,
      phase_timing: "Months 1-24",
      evidence: ["2BR Interiors 18 units X $24,000/unit; expected rent lift $325/month; Months 1-24"],
    },
    {
      category: "Common Area Refresh",
      stated_amount: 210000,
      evidence: ["Common Area Refresh $210,000"],
    },
    {
      category: "Exterior / Security",
      stated_amount: 115000,
      evidence: ["Exterior / Security $115,000"],
    },
    {
      category: "Contingency",
      stated_amount: 153000,
      evidence: ["Contingency $153,000"],
    },
  ];
  const appraisalText = `Stonebridge Lofts - Appraisal Summary / Valuation Context
Document Role
This appraisal-style summary is provided as valuation context only. It should not override the purchase assumptions, T12 NOI, or rent roll market rent.
Valuation Summary
Appraised Value $14,200,000
Stabilized NOI $1,050,000
Stabilized Cap Rate 7.40%
Market Value Conclusion $14,200,000
Limitations
The appraised value is not the purchase price.
The stabilized NOI is not T12 NOI.
The stabilized cap rate is not a verified exit cap for launch-mode Acquisition Memo outputs.
Do not use this source to override core T12 or Rent Roll values.`;
  const marketText = `Stonebridge Lofts - Market Rent Survey Context
Document Role
This survey provides market rent context only. It should not override the rent roll market rents.
Market Rent Survey
1BR Market Rent Range $2,100 - $2,250
2BR Market Rent Range $2,500 - $2,700
Broker Opinion Market rents could exceed current rent roll assumptions
Limitations
Context only; not a modeled rent-roll override.
Do not use survey rents to inflate Annual Market Rent or Rent Gap.
The rent roll remains the source of record for in-place and market rent fields in launch-mode reporting.`;
  const phaseIText = `Stonebridge Lofts - Phase I ESA Summary
Document Role
Environmental due diligence context only. Not a financial modeling input.
Summary
Recognized Environmental Conditions None identified in this summary
Scope Phase I Environmental Site Assessment summary
Reliance For environmental context only
Limitations
Context only / not modeled.
Do not treat as property tax support.
Do not treat as quantitative input for NOI, value, debt, rent, or expense calculations.`;

  const coverageArtifacts = [
    {
      id: stonebridgeAuthority.artifacts.t12.artifact_id,
      file_id: t12.file_id,
      type: "t12_parsed",
      payload: {
        ...t12,
        source_file_id: t12.file_id,
        source_original_filename: t12.original_filename,
        t12_parsed: { ...t12, validated: true },
      },
    },
    {
      id: stonebridgeAuthority.artifacts.rent_roll.artifact_id,
      file_id: sourceRentRoll.file_id,
      type: "rent_roll_parsed",
      payload: {
        ...rentRoll,
        source_file_id: sourceRentRoll.file_id,
        source_original_filename: sourceRentRoll.original_filename,
        rent_roll_parsed: { ...rentRoll, validated: true },
      },
    },
    {
      id: "stonebridge-assumptions-artifact",
      file_id: "stonebridge-assumptions-file",
      type: "loan_term_sheet_parsed",
      payload: {
        file_id: "stonebridge-assumptions-file",
        source_file_id: "stonebridge-assumptions-file",
        original_filename: "Stonebridge_Assumptions.pdf",
        source_original_filename: "Stonebridge_Assumptions.pdf",
        semantic_doc_role: "purchase_assumptions",
        semantic_doc_display_label: "purchase_assumptions",
        validated: true,
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 13500000,
        noi_basis: 945000,
        going_in_cap_rate: 0.07,
        proposed_loan_amount: 9450000,
        ltv: 0.70,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
        source_text: assumptionsText,
        accepted_fields: ["purchase_price", "noi_basis", "going_in_cap_rate", "proposed_loan_amount", "ltv", "interest_rate", "amortization_years", "lender_fee_percent"],
      },
    },
    {
      id: "stonebridge-current-debt-artifact",
      file_id: "stonebridge-current-debt-file",
      type: "mortgage_statement_parsed",
      payload: {
        file_id: "stonebridge-current-debt-file",
        source_file_id: "stonebridge-current-debt-file",
        original_filename: "Current_Debt_Stonebridge.pdf",
        source_original_filename: "Current_Debt_Stonebridge.pdf",
        semantic_doc_role: "current_debt_context",
        validated: true,
        debt_basis: "current_debt_context",
        current_outstanding_balance: 6800000,
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amortization_remaining_years: 24,
        amortization_years: 24,
        monthly_payment: 39250,
        maturity_date: "2029-11-01",
        source_text: currentDebtText,
      },
    },
    {
      id: "stonebridge-renovation-artifact",
      file_id: stonebridgeAuthority.artifacts.misclassified_renovation.file_id,
      type: "renovation_parsed",
      payload: {
        file_id: stonebridgeAuthority.artifacts.misclassified_renovation.file_id,
        source_file_id: stonebridgeAuthority.artifacts.misclassified_renovation.file_id,
        original_filename: "Stonebridge_Reno_Plan.pdf",
        source_original_filename: "Stonebridge_Reno_Plan.pdf",
        semantic_doc_role: "renovation_budget",
        validated: true,
        total_budget: 1280000,
        budget_rows: renovationBudgetRows,
        source_text: renovationText,
      },
    },
    {
      id: "stonebridge-appraisal-artifact",
      file_id: "stonebridge-appraisal-file",
      type: "appraisal_parsed",
      payload: {
        file_id: "stonebridge-appraisal-file",
        source_file_id: "stonebridge-appraisal-file",
        original_filename: "Stonebridge_Appraisal_Summary.pdf",
        source_original_filename: "Stonebridge_Appraisal_Summary.pdf",
        semantic_doc_role: "appraisal",
        validated: true,
        appraised_value: 14200000,
        stabilized_noi: 1050000,
        cap_rate: 0.074,
        source_text: appraisalText,
      },
    },
    ...[
      ["stonebridge-assumptions-file", "Stonebridge_Assumptions.pdf", assumptionsText],
      ["stonebridge-current-debt-file", "Current_Debt_Stonebridge.pdf", currentDebtText],
      [stonebridgeAuthority.artifacts.misclassified_renovation.file_id, "Stonebridge_Reno_Plan.pdf", renovationText],
      ["stonebridge-appraisal-file", "Stonebridge_Appraisal_Summary.pdf", appraisalText],
      ["stonebridge-market-survey-file", "Stonebridge_Market_Survey.pdf", marketText],
      ["stonebridge-phase-i-file", "Stonebridge_Phase_I_ESA.pdf", phaseIText],
    ].map(([fileId, filename, text]) => ({
      id: `${fileId}-text-artifact`,
      file_id: fileId,
      type: "document_text_extracted",
      payload: {
        file_id: fileId,
        source_file_id: fileId,
        original_filename: filename,
        source_original_filename: filename,
        source_text: text,
        document_text_extracted: text,
      },
    })),
  ];

  return {
    headers: { "x-admin-run-key": process.env.ADMIN_RUN_KEY },
    body: {
      userId: "phase8_certification_underwriting_stonebridge",
      report_type: "underwriting",
      property_name: stonebridgeAuthority.source_export.property_name,
      __test_return_final_html: true,
      __test_acq_memo_v2_render_context: { goingInCapRate: 7 },
      __test_payloads: {
        t12Payload: { ...t12 },
        rentRollPayload: { ...rentRoll },
        computedRentRoll: {
          ...rentRoll,
          total_annual_market: 1718400,
          avg_in_place_rent: 1990,
          avg_market_rent: 2237.5,
          rent_to_market_gap: 0.1660918775,
        },
        acquisitionTermsPayload: {
          debt_basis: "acquisition_financing_assumption",
          purchase_price: 13500000,
          going_in_cap_rate: 0.07,
          noi_basis: 945000,
          proposed_loan_amount: 9450000,
          ltv: 0.70,
          interest_rate: 0.0595,
          amortization_years: 30,
          lender_fee_percent: 0.0085,
          source_text: assumptionsText,
        },
        loanTermSheetTermsPayload: {
          debt_basis: "current_debt_context",
          current_outstanding_balance: 6800000,
          outstanding_balance: 6800000,
          interest_rate: 0.0485,
          amortization_years: 24,
          monthly_payment: 39250,
          maturity_date: "2029-11-01",
          source_text: currentDebtText,
        },
        mortgagePayload: {
          outstanding_balance: 6800000,
          current_outstanding_balance: 6800000,
          interest_rate: 0.0485,
          amort_years: 24,
          monthly_payment: 39250,
          maturity_date: "2029-11-01",
        },
        documentSources: files,
        coverageArtifacts,
      },
    },
  };
}

export function buildPhase8CertificationRequests() {
  return {
    screening: buildHarbourstoneScreeningRequest(),
    underwriting: buildStonebridgeUnderwritingRequest(),
  };
}

export function buildPhase8CertificationSourceProvenance() {
  const sourceFilenames = [
    "T12_Stonebridge_Lofts_Attack_Test_8.xlsx",
    "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx",
    "Stonebridge_Assumptions.pdf",
    "Current_Debt_Stonebridge.pdf",
    "Stonebridge_Reno_Plan.pdf",
    "Stonebridge_Appraisal_Summary.pdf",
    "Stonebridge_Market_Survey.pdf",
    "Stonebridge_Phase_I_ESA.pdf",
    "FINAL_ATTACK_TEST_8_expected_result.txt",
  ];
  return {
    canonical_source_truth_fixture: {
      repository_path: path.relative(root, stonebridgeAuthorityPath),
      sha256: sha256(stonebridgeAuthorityPath),
      bytes: fs.statSync(stonebridgeAuthorityPath).size,
      source_export_job_id: stonebridgeAuthority.source_export.job_id,
      property_name: stonebridgeAuthority.source_export.property_name,
    },
    source_files: sourceFilenames.map(sourceFile),
  };
}

export async function renderPhase8CertificationArtifacts(generateClientReport, requests = buildPhase8CertificationRequests()) {
  const rendered = {};
  for (const [report, request] of Object.entries(requests)) {
    const response = makeResponse();
    await generateClientReport(request, response);
    if (response.statusCode !== 200 || response.body?.success !== true) {
      throw new Error(`PHASE8_SOURCE_BOUND_RENDER_FAILED:${report}:${response.statusCode}:${response.body?.error || "unknown"}`);
    }
    const html = String(response.body?.final_html || "");
    if (!/<!DOCTYPE html>/i.test(html)) throw new Error(`PHASE8_SOURCE_BOUND_RENDER_INCOMPLETE:${report}`);
    rendered[report] = {
      html,
      response: {
        status_code: response.statusCode,
        report_mode: response.body?.report_mode || null,
        customer_surface_model_validation_ok: response.body?.customer_surface_model_validation?.ok ?? null,
        customer_surface_html_validation_ok: response.body?.customer_surface_html_validation?.ok ?? null,
      },
    };
  }
  return rendered;
}
