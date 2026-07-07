import assert from "assert";
import fs from "fs";
import { execFileSync } from "child_process";
import path from "path";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";

const orchestratorPath = path.join(process.cwd(), "api/_lib/acquisition-memo-v2-orchestrator.js");
const orchestratorSource = fs.readFileSync(orchestratorPath, "utf8");

assert.match(orchestratorSource, /if \(initialRepairPlan\.shouldRetry\)/);
assert.match(orchestratorSource, /buildRepairProvenanceRegressionViolations\(\{/);
assert.match(orchestratorSource, /initialCustomerSurfaceModel/);
assert.match(orchestratorSource, /acquisitionMemoBossContract/);
assert.match(orchestratorSource, /renderAndValidate\(repairedCustomerSurfaceModel, repairedBossContract, repairPlan\)/);

const childScript = String.raw`
import fs from "fs/promises";
import path from "path";
import vm from "vm";
import { pathToFileURL, fileURLToPath } from "url";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";

const repoRoot = process.cwd();
const orchestratorPath = path.join(repoRoot, "api/_lib/acquisition-memo-v2-orchestrator.js");
let orchestratorSource = await fs.readFile(orchestratorPath, "utf8");

orchestratorSource = orchestratorSource.replace(
  "  const renderAndValidate = (customerSurfaceModel, bossContract = acquisitionMemoBossContract, htmlRepairPlan = null) => {\n",
  "  const renderAndValidate = (customerSurfaceModel, bossContract = acquisitionMemoBossContract, htmlRepairPlan = null) => {\n    globalThis.__renderAndValidateCalls = (globalThis.__renderAndValidateCalls || 0) + 1;\n    if (globalThis.__renderAndValidateCalls === 1 && globalThis.__forceLaterRepairInitialFailure) {\n      const syntheticViolations = globalThis.__forcedLaterRepairInitialViolations || [];\n      return {\n        html: \"<section><h2 class=\\\"section-header-title\\\">Synthetic Later Retry</h2></section>\",\n        compliance: { ok: false, violations: syntheticViolations },\n        bossCompliance: { ok: false, violations: syntheticViolations, fatal_core: [], collapseable_surface: syntheticViolations, advisory_only: [] },\n        customerSurfaceModel,\n        customerSurfaceHtmlValidation: { ok: false, issues: syntheticViolations.map((violation) => ({ code: violation.code, severity: violation.severity || \"critical\", path: violation.section || \"synthetic\", message: violation.message || \"forced failure\" })) },\n        enforcement: { validation: { violations: syntheticViolations }, repairedHtml: \"<section><h2 class=\\\"section-header-title\\\">Synthetic Later Retry</h2></section>\" },\n      };\n    }\n    if (globalThis.__renderAndValidateCalls === 2 && globalThis.__forceLaterRepairSuccess) {\n      return {\n        html: \"<section><h2 class=\\\"section-header-title\\\">Synthetic Later Retry Success</h2></section>\",\n        compliance: { ok: true, violations: [] },\n        bossCompliance: { ok: true, violations: [], fatal_core: [], collapseable_surface: [], advisory_only: [] },\n        customerSurfaceModel,\n        customerSurfaceHtmlValidation: { ok: true, issues: [] },\n        enforcement: { validation: { violations: [] }, repairedHtml: \"<section><h2 class=\\\"section-header-title\\\">Synthetic Later Retry Success</h2></section>\" },\n      };\n    }\n",
);
orchestratorSource = orchestratorSource.replace(
  "      const repairedCustomerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(repairedCustomerSurfaceModel);\n",
  "      let repairedCustomerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(repairedCustomerSurfaceModel);\n      if (globalThis.__forceLaterRepairModelValidationFailure) {\n        repairedCustomerSurfaceModelValidation = { ...repairedCustomerSurfaceModelValidation, ok: false };\n      }\n"
);
orchestratorSource = orchestratorSource.replace(
  "    const repairPlan = buildAcquisitionMemoV2BossRepairPlan({\n      bossCompliance: finalization.bossCompliance,\n      customerSurfaceHtmlValidation: finalization.customerSurfaceHtmlValidation,\n    });\n",
  "    let repairPlan = buildAcquisitionMemoV2BossRepairPlan({\n      bossCompliance: finalization.bossCompliance,\n      customerSurfaceHtmlValidation: finalization.customerSurfaceHtmlValidation,\n    });\n    if (globalThis.__forceLaterRepairShouldRetry) {\n      repairPlan = { ...repairPlan, shouldRetry: true, coreFatal: [] };\n    }\n"
);
orchestratorSource = orchestratorSource.replace(
  "        const provenanceRegressionViolations = buildRepairProvenanceRegressionViolations({\n",
  "        const provenanceRegressionViolations = globalThis.__forcedLaterRepairProvenanceRegressionViolations || buildRepairProvenanceRegressionViolations({\n"
);
orchestratorSource = orchestratorSource.replace(
  "        if (retryFinalization.compliance.ok && provenanceRegressionViolations.length === 0) {\n",
  "        globalThis.__retryFinalizationComplianceOk = retryFinalization.compliance.ok;\n        if (retryFinalization.compliance.ok && provenanceRegressionViolations.length === 0) {\n"
);

const moduleCache = new Map();
async function loadAsSynthetic(specifier, referrerPath) {
  let resolved;
  if (specifier.startsWith("node:")) {
    resolved = specifier;
  } else if (specifier.startsWith("file:")) {
    resolved = fileURLToPath(specifier);
  } else if (specifier.startsWith(".") || specifier.startsWith("/")) {
    resolved = path.resolve(path.dirname(referrerPath), specifier);
  } else {
    resolved = specifier;
  }

  if (moduleCache.has(resolved)) return moduleCache.get(resolved);

  const ns = specifier.startsWith("node:")
    ? await import(specifier)
    : (!specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("file:"))
      ? await import(specifier)
      : await import(pathToFileURL(resolved).href);

  const exportNames = Object.keys(ns);
  const synthetic = new vm.SyntheticModule(exportNames, function () {
    for (const name of exportNames) this.setExport(name, ns[name]);
  }, { identifier: specifier.startsWith("node:") || (!specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("file:")) ? specifier : pathToFileURL(resolved).href });
  moduleCache.set(resolved, synthetic);
  return synthetic;
}

const orchestratorModule = new vm.SourceTextModule(orchestratorSource, {
  identifier: pathToFileURL(orchestratorPath).href,
  initializeImportMeta(meta) {
    meta.url = pathToFileURL(orchestratorPath).href;
  },
});

await orchestratorModule.link(async (specifier, referencingModule) => {
  const refPath = referencingModule.identifier.startsWith("file:") ? fileURLToPath(referencingModule.identifier) : orchestratorPath;
  return loadAsSynthetic(specifier, refPath);
});
await orchestratorModule.evaluate();
const { runAcquisitionMemoV2Orchestrator } = orchestratorModule.namespace;

const { buildCanonicalSourcePackage } = await import("./api/_lib/canonical-source-package.js");
const { buildAcquisitionMemoProjection } = await import("./api/_lib/acquisition-memo-projection.js");
const { buildAcquisitionMemoBossContract } = await import("./api/_lib/acquisition-memo-boss-contract.js");

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
      unit_number: "1-" + (index + 1),
      current_rent: 1850,
      market_rent: 2050,
    })),
    ...Array.from({ length: 32 }, (_, index) => ({
      label: "2BR",
      unit_number: "2-" + (index + 1),
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

const sourcePackage = buildStructuredCoreSourcePackage();
const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: sourcePackage,
  acquisitionMemoProjection,
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
globalThis.__forceLaterRepairInitialFailure = true;
globalThis.__forceLaterRepairSuccess = true;
globalThis.__forceLaterRepairShouldRetry = true;
globalThis.__forcedLaterRepairInitialViolations = [
  {
    code: "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
    severity: "critical",
    section: "unitMix",
    message: "forced initial retry trigger",
  },
];
globalThis.__forcedLaterRepairProvenanceRegressionViolations = [
  {
    code: "REPAIR_PROVENANCE_REGRESSION",
    severity: "critical",
    section: "customerSurfaceModel.unitMix",
    message: "forced later retry regression",
  },
];
globalThis.__renderAndValidateCalls = 0;

const result = await runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs: {
    sourcePackage,
    acquisitionMemoProjection,
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
  },
  acquisitionMemoBossContract: bossContract,
});

console.log(JSON.stringify({
  renderAndValidateCalls: globalThis.__renderAndValidateCalls,
  retryFinalizationComplianceOk: Boolean(globalThis.__retryFinalizationComplianceOk),
  complianceOk: Boolean(result?.compliance?.ok),
  violationCodes: Array.isArray(result?.compliance?.violations) ? result.compliance.violations.map((violation) => violation.code) : [],
  deliveryStatus: result?.finalDeliveryDecision?.final_delivery_status || null,
}));
`;

const output = execFileSync(
  process.execPath,
  ["--experimental-vm-modules", "--input-type=module", "-e", childScript],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
).trim();

const probe = JSON.parse(output);
assert.ok(probe.renderAndValidateCalls >= 2, output);
assert.equal(probe.retryFinalizationComplianceOk, true, output);
assert.equal(probe.complianceOk, false, output);
assert.ok(probe.violationCodes.includes("REPAIR_PROVENANCE_REGRESSION"), output);
assert.equal(probe.deliveryStatus, "blocked", output);

console.log("acquisition-memo-v2 orchestrator later-repair provenance smoke PASS");
