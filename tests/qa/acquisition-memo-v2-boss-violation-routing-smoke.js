import assert from "assert";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";

const { buildCanonicalSourcePackage } = await import("../../api/_lib/canonical-source-package.js");
const { buildAcquisitionMemoProjection } = await import("../../api/_lib/acquisition-memo-projection.js");
const { renderAcquisitionMemo } = await import("../../api/_lib/acquisition-memo-renderer.js");
const { renderCompleteAcquisitionMemoV2Html } = await import("../../api/_lib/acquisition-memo-v2-document.js");
const {
  assessAcquisitionMemoBossCompliance,
  buildAcquisitionMemoBossContract,
  collapseAcquisitionMemoBossViolationsHtml,
  enforceAcquisitionMemoBossContractOnHtml,
  routeAcquisitionMemoBossViolations,
  validateAcquisitionMemoBossContract,
  validateAcquisitionMemoRenderAgainstBossContract,
} = await import("../../api/_lib/acquisition-memo-boss-contract.js");

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

const sourcePackage = buildStructuredCoreSourcePackage();
const projection = buildAcquisitionMemoProjection(sourcePackage);
const renderedMemo = renderAcquisitionMemo(projection);
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
    propertyName: "Stonebridge Lofts",
    propertyAddress: "123 Main St",
    propertyTitle: "Stonebridge Lofts",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Stonebridge Lofts",
    generatedAt: "2026-06-20T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});

assert.equal(validateAcquisitionMemoBossContract(bossContract).ok, true);

const baseHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: projection,
  renderedAcquisitionMemo: renderedMemo,
  sourcePackage,
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
  reportMeta: { propertyName: "Stonebridge Lofts", generatedAt: "2026-06-20T00:00:00.000Z" },
  propertyProfile: { propertyName: "Stonebridge Lofts", propertyAddress: "123 Main St" },
  t12Payload: { ...sourcePackage.coreT12?.extractedFacts },
});

assert.equal(assessAcquisitionMemoBossCompliance(bossContract, baseHtml).ok, true);

const renovationInjectedHtml = baseHtml.replace(
  /(<span class="section-header-title">Key Upside Drivers<\/span>[\s\S]*?<div class="card no-break">)/i,
  "$1<div>Renovation ROI payback NOI impact value impact refi impact implementation modeling</div>"
);
const renovationValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, renovationInjectedHtml);
const renovationRouting = routeAcquisitionMemoBossViolations(bossContract, renovationValidation, renovationInjectedHtml);
assert.equal(renovationRouting.collapseable_surface.some((violation) => violation.code === "UNSUPPORTED_RENOVATION_MODELING_SURFACE"), true);
const renovationEnforcement = enforceAcquisitionMemoBossContractOnHtml(bossContract, renovationInjectedHtml);
assert.equal(renovationEnforcement.ok, true);
assert.equal(/Renovation ROI|payback|NOI impact|value impact|refi impact|implementation modeling/i.test(renovationEnforcement.repairedHtml), false);
assert.equal(assessAcquisitionMemoBossCompliance(bossContract, renovationEnforcement.repairedHtml).ok, true);

const debtAmbiguousHtml = baseHtml.replace(
  /(<span class="section-header-title">Debt \/ Financing Context<\/span>[\s\S]*?<div class="card no-break">)/i,
  "$1<div>Current Debt Maturity Not available Maturity Date Not available</div>"
);
const debtValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, debtAmbiguousHtml);
const debtRouting = routeAcquisitionMemoBossViolations(bossContract, debtValidation, debtAmbiguousHtml);
assert.equal(debtRouting.collapseable_surface.some((violation) => violation.code === "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED"), true);
const debtEnforcement = enforceAcquisitionMemoBossContractOnHtml(bossContract, debtAmbiguousHtml);
assert.equal(debtEnforcement.ok, true);
assert.equal(/Current Debt Maturity Not available|Maturity Date Not available/i.test(debtEnforcement.repairedHtml), false);
assert.equal(assessAcquisitionMemoBossCompliance(bossContract, debtEnforcement.repairedHtml).ok, true);

const collapseableForbiddenHtml = baseHtml.replace(
  /(<span class="section-header-title">Debt \/ Financing Context<\/span>[\s\S]*?<div class="card no-break">)/i,
  "$1<div>DSCR refi refinance DCF waterfall equity return deal score loan approval</div>"
);
const collapseableForbiddenValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, collapseableForbiddenHtml);
const collapseableForbiddenRouting = routeAcquisitionMemoBossViolations(bossContract, collapseableForbiddenValidation, collapseableForbiddenHtml);
assert.equal(collapseableForbiddenRouting.collapseable_surface.some((violation) => violation.code === "NO_FORBIDDEN_SURFACES"), true);
const collapseableForbiddenEnforcement = enforceAcquisitionMemoBossContractOnHtml(bossContract, collapseableForbiddenHtml);
assert.equal(collapseableForbiddenEnforcement.ok, true);
assert.equal(/DSCR|refi|refinance|DCF|waterfall|equity return|deal score|loan approval/i.test(collapseableForbiddenEnforcement.repairedHtml), false);

const advisoryRouting = routeAcquisitionMemoBossViolations(
  bossContract,
  {
    violations: [
      {
        code: "QA_ONLY_NOTE",
        severity: "advisory",
        section: "global",
        description: "QA only note",
      },
    ],
  },
  baseHtml
);
assert.equal(advisoryRouting.advisory_only.length, 1);
assert.equal(advisoryRouting.decision, "publish");
assert.equal(assessAcquisitionMemoBossCompliance(bossContract, baseHtml, { violations: advisoryRouting.advisory_only }).ok, true);

const hardFatalHtml = baseHtml.replace(
  /(<span class="section-header-title">Primary Constraint \/ Review Disclosure<\/span>[\s\S]*?<div class="card no-break">)/i,
  "$1<div>Final Recommendation BUY SELL HOLD lender commitment</div>"
);
const hardFatalValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, hardFatalHtml);
const hardFatalRouting = routeAcquisitionMemoBossViolations(bossContract, hardFatalValidation, hardFatalHtml);
assert.equal(hardFatalRouting.fatal_core.length > 0, true);
assert.equal(hardFatalRouting.decision, "fail");
assert.equal(enforceAcquisitionMemoBossContractOnHtml(bossContract, hardFatalHtml).ok, false);

const missingCoreT12Contract = JSON.parse(JSON.stringify(bossContract));
missingCoreT12Contract.coreGate.t12Valid = false;
missingCoreT12Contract.coreGate.publishAllowed = false;
missingCoreT12Contract.coreGate.fatalReasons = ["core_t12_unusable"];
const missingCoreT12Routing = routeAcquisitionMemoBossViolations(missingCoreT12Contract, { violations: [] }, baseHtml);
assert.equal(missingCoreT12Routing.fatal_core.some((violation) => String(violation.code || "").includes("core_t12_unusable")), true);
assert.equal(missingCoreT12Routing.decision, "fail");
assert.equal(assessAcquisitionMemoBossCompliance(missingCoreT12Contract, baseHtml).ok, false);

const missingCoreRentRollContract = JSON.parse(JSON.stringify(bossContract));
missingCoreRentRollContract.coreGate.rentRollValid = false;
missingCoreRentRollContract.coreGate.publishAllowed = false;
missingCoreRentRollContract.coreGate.fatalReasons = ["core_rent_roll_unusable"];
const missingCoreRentRollRouting = routeAcquisitionMemoBossViolations(missingCoreRentRollContract, { violations: [] }, baseHtml);
assert.equal(missingCoreRentRollRouting.fatal_core.some((violation) => String(violation.code || "").includes("core_rent_roll_unusable")), true);
assert.equal(missingCoreRentRollRouting.decision, "fail");
assert.equal(assessAcquisitionMemoBossCompliance(missingCoreRentRollContract, baseHtml).ok, false);

console.log("acquisition-memo-v2 boss-violation-routing smoke PASS");
