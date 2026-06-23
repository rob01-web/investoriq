import assert from "assert";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import { buildAcquisitionMemoBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  summarizeAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";

function buildFixture() {
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
            { label: "1BR", unit_number: "1-1", current_rent: 1850, market_rent: 2050 },
            { label: "2BR", unit_number: "2-1", current_rent: 1881, market_rent: 2425 },
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
    { fileId: "reno-file", original_filename: "Stonebridge_Reno_Plan.pdf", semantic_doc_role: "renovation_plan", payload: { document_text_extracted: "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000" } },
    { fileId: "appraisal-file", original_filename: "Stonebridge_Appraisal_Summary.pdf", semantic_doc_role: "appraisal", payload: { document_text_extracted: "Appraisal Summary / Valuation Context" } },
    { fileId: "survey-file", original_filename: "Stonebridge_Market_Survey.pdf", semantic_doc_role: "market_survey", payload: { document_text_extracted: "Market Rent Survey Context" } },
    { fileId: "phase-file", original_filename: "Stonebridge_Phase_I_ESA.pdf", semantic_doc_role: "phase_i_esa", payload: { document_text_extracted: "Phase I ESA / Environmental Due Diligence Context" } },
  ];

  return { uploadedFiles, parsedArtifacts };
}

function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture));
}

function buildVariantFixture({
  propertyName,
  propertyAddress,
  assetClass,
  t12ExpenseLines,
  unitMixRows,
  currentDebt,
  purchaseAssumptions,
  includeCurrentDebt = true,
  includePurchaseAssumptions = true,
  includeAppraisal = true,
  includeRenovation = true,
  includeMarketSurvey = true,
  includeEnvironmental = true,
} = {}) {
  const fixture = cloneFixture(buildFixture());
  const name = propertyName || "Harbor Ridge";
  const address = propertyAddress || "456 Oak Ave";
  const className = assetClass || "Multifamily";
  const unitRows = Array.isArray(unitMixRows) && unitMixRows.length > 0
    ? unitMixRows
    : [
        { label: "Studio", count: 12, current_rent: 1425, market_rent: 1575, avg_sqft: 510 },
        { label: "3BR", count: 8, current_rent: 2195, market_rent: 2495, avg_sqft: 1080 },
      ];
  const expenseRows = Array.isArray(t12ExpenseLines) && t12ExpenseLines.length > 0
    ? t12ExpenseLines
    : [
        { label: "Payroll / Admin", amount: 18000 },
        { label: "Repairs", amount: 54000 },
      ];
  const currentDebtValues = currentDebt || {
    balance: 5400000,
    rate: 0.0525,
    amortizationYears: 21,
    monthlyPayment: 28750,
    maturityDate: "2030-08-01",
  };
  const purchaseValues = purchaseAssumptions || {
    purchasePrice: 18250000,
    noiBasis: 1195000,
    goingInCapRate: 0.065,
    proposedLoanAmount: 12125000,
    ltv: 0.665,
    interestRate: 0.0575,
    amortizationYears: 28,
    lenderFeePercent: 0.01,
  };

  fixture.uploadedFiles = fixture.uploadedFiles.map((file) => {
    const next = { ...file };
    if (next.fileId === "t12-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_T12.xlsx`;
    if (next.fileId === "rent-roll-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_Rent_Roll.xlsx`;
    if (next.fileId === "assumptions-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_Assumptions.pdf`;
    if (next.fileId === "current-debt-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_Current_Debt.pdf`;
    if (next.fileId === "reno-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_Reno_Plan.pdf`;
    if (next.fileId === "appraisal-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_Appraisal.pdf`;
    if (next.fileId === "survey-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_Market_Survey.pdf`;
    if (next.fileId === "phase-file") next.originalFilename = `${name.replace(/\s+/g, "_")}_Phase_I_ESA.pdf`;
    return next;
  });
  fixture.parsedArtifacts = fixture.parsedArtifacts.map((artifact) => {
    const next = { ...artifact, payload: cloneFixture(artifact.payload) };
    if (artifact.fileId === "t12-file") {
      next.payload.t12_parsed.income_lines = [{ label: "Effective Gross Income", amount: 1234000 }];
      next.payload.t12_parsed.expense_lines = expenseRows;
      next.payload.t12_parsed.effective_gross_income = 1234000;
      next.payload.t12_parsed.total_operating_expenses = 612000;
      next.payload.t12_parsed.net_operating_income = 622000;
      next.payload.t12_parsed.gross_potential_rent = 1488000;
    }
    if (artifact.fileId === "rent-roll-file") {
      next.payload.rent_roll_parsed.total_units = 20;
      next.payload.rent_roll_parsed.occupancy = 0.9;
      next.payload.rent_roll_parsed.unit_mix = unitRows;
      next.payload.rent_roll_parsed.units = unitRows.flatMap((row, rowIndex) =>
        Array.from({ length: Math.max(1, Number(row.count || 1)) }, (_, index) => ({
          label: row.label,
          unit_number: `${row.label}-${rowIndex + 1}-${index + 1}`,
          current_rent: row.current_rent,
          market_rent: row.market_rent,
        }))
      );
      next.payload.rent_roll_parsed.annual_in_place_rent = 240000;
      next.payload.rent_roll_parsed.annual_market_rent = 264000;
    }
    if (artifact.fileId === "assumptions-file") {
      next.payload.document_text_extracted = `Purchase assumptions / proposed acquisition financing\nPurchase Price $${purchaseValues.purchasePrice.toLocaleString("en-US")}\nNOI Basis $${purchaseValues.noiBasis.toLocaleString("en-US")}\nGoing-In Cap Reference ${String((purchaseValues.goingInCapRate * 100).toFixed(2))}%\nProposed Acquisition Loan $${purchaseValues.proposedLoanAmount.toLocaleString("en-US")}\nLTV ${(purchaseValues.ltv * 100).toFixed(1)}%\nInterest Rate ${(purchaseValues.interestRate * 100).toFixed(2)}%\nAmortization ${Math.round(purchaseValues.amortizationYears)} years\nLender Fee ${(purchaseValues.lenderFeePercent * 100).toFixed(2)}%`;
    }
    if (artifact.fileId === "current-debt-file") {
      next.payload.document_text_extracted = `Existing Current Debt Statement\nCurrent Outstanding Balance $${currentDebtValues.balance.toLocaleString("en-US")}\nInterest Rate ${(currentDebtValues.rate * 100).toFixed(2)}%\nAmortization Remaining ${Math.round(currentDebtValues.amortizationYears)} years\nMonthly Payment $${currentDebtValues.monthlyPayment.toLocaleString("en-US")}\nMaturity Date ${currentDebtValues.maturityDate}`;
      next.payload.current_debt_parsed = {
        current_outstanding_balance: currentDebtValues.balance,
        interest_rate: currentDebtValues.rate,
        amortization_remaining_years: currentDebtValues.amortizationYears,
        monthly_payment: currentDebtValues.monthlyPayment,
        maturity_date: currentDebtValues.maturityDate,
      };
    }
    if (artifact.fileId === "reno-file") {
      next.payload.document_text_extracted = "Structured Renovation / CapEx Plan\nTotal Renovation Budget $1,280,000";
    }
    if (artifact.fileId === "appraisal-file") {
      next.payload.document_text_extracted = "Appraisal Summary / Valuation Context\nStabilized Cap Rate 6.25%\nStabilized NOI $622,000";
      next.payload.appraisal_parsed = {
        appraisal_value: 12000000,
        stabilized_cap_rate: 0.0625,
        stabilized_noi: 622000,
      };
    }
    if (artifact.fileId === "survey-file") {
      next.payload.document_text_extracted = "Market Rent Survey Context\nMarket Rent $1,875";
    }
    if (artifact.fileId === "phase-file") {
      next.payload.document_text_extracted = "Phase I ESA / Environmental Due Diligence Context";
    }
    return next;
  });

  if (!includeCurrentDebt) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "current-debt-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "current-debt-file");
  }
  if (!includePurchaseAssumptions) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "assumptions-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "assumptions-file");
  }
  if (!includeAppraisal) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "appraisal-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "appraisal-file");
  }
  if (!includeRenovation) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "reno-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "reno-file");
  }
  if (!includeMarketSurvey) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "survey-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "survey-file");
  }
  if (!includeEnvironmental) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "phase-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "phase-file");
  }

  return fixture;
}

function buildCoreMissingFixture({ includeT12 = true, includeRentRoll = true } = {}) {
  const fixture = cloneFixture(buildFixture());
  if (!includeT12) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "t12-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "t12-file");
  }
  if (!includeRentRoll) {
    fixture.uploadedFiles = fixture.uploadedFiles.filter((file) => file.fileId !== "rent-roll-file");
    fixture.parsedArtifacts = fixture.parsedArtifacts.filter((artifact) => artifact.fileId !== "rent-roll-file");
  }
  return fixture;
}

const { uploadedFiles, parsedArtifacts } = buildFixture();
const canonicalSourcePackage = buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts);
const acquisitionMemoProjection = buildAcquisitionMemoProjection(canonicalSourcePackage);

const supportDocsArray = Array.from(canonicalSourcePackage.supportDocs.values());
const mixedCanonicalSourcePackage = {
  ...canonicalSourcePackage,
  supportDocs: Object.fromEntries(supportDocsArray.map((doc) => [doc.fileId || doc.originalFilename, doc])),
};
const mixedProjection = {
  ...acquisitionMemoProjection,
  supportDocProjection: {
    ...acquisitionMemoProjection.supportDocProjection,
    allSupportDocs: [...supportDocsArray, supportDocsArray[0]],
  },
};

const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: mixedCanonicalSourcePackage,
  acquisitionMemoProjection: mixedProjection,
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

const model = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: mixedCanonicalSourcePackage,
  acquisitionMemoProjection: mixedProjection,
  bossContract,
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

const validation = validateAcquisitionMemoV2CustomerSurfaceModel(model);
assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));

const summary = summarizeAcquisitionMemoV2CustomerSurfaceModel(model);
assert.equal(summary.modelVersion, "acq_memo_v2_customer_surface_model_v1");
assert.equal(summary.supportDocCount, summary.uniqueSupportDocCount);
assert.equal(model.supportSources.length, summary.uniqueSupportDocCount);
assert.equal(model.supportSourceCounts.rawInputCount > summary.uniqueSupportDocCount, true);
assert.equal(summary.coreSourceCount, 2);
assert.ok(summary.supportRoles.includes("purchase_assumptions"));
assert.ok(summary.supportRoles.includes("current_debt_context"));
assert.equal(new Set(model.supportSources.map((doc) => doc.fileId || doc.originalFilename)).size, summary.uniqueSupportDocCount);

assert.equal(model.identity.propertyName, "Stonebridge Lofts");
assert.equal(model.identity.assetClass, "Multifamily");
assert.ok(
  [
    "Stable",
    "Sensitized",
    "Fragile",
    "Review / Source Reconciliation Disclosure",
    "Review / Insufficient Core Support",
    "Review / Debt Coverage Constraint",
  ].includes(model.identity.visibleClassification)
);
assert.match(model.identity.reportTitle, /Stonebridge Lofts/i);

assert.equal(model.sections.acquisitionRequestContext.sourceRole, "purchase_assumptions");
assert.equal(model.sections.currentDebtContext.sourceRole, "current_debt_context");
assert.equal(model.sections.proposedFinancingContext.sourceRole, "purchase_assumptions");
assert.equal(model.sections.currentDebtContext.facts.current_outstanding_balance, 6800000);
assert.ok(Math.abs(model.sections.currentDebtContext.facts.interest_rate - 0.0485) < 1e-9);
assert.equal(model.sections.acquisitionRequestContext.facts.proposed_loan_amount, 9450000);
assert.equal(model.sections.acquisitionRequestContext.facts.ltv, 0.7);
assert.equal(model.sections.appraisalContext.visibleLabel, "Appraisal / Valuation Context");
assert.equal(model.sections.renovationContext.visibleLabel, "Structured Renovation / CapEx Plan");
assert.match(model.sections.marketSurveyContext.visibleLabel, /Market.*Survey Context/i);
assert.match(model.sections.environmentalContext.visibleLabel, /Environmental.*Phase I ESA Context/i);
assert.equal(model.sections.documentTreatment.visibleLabel, "Source Context / Support Document Treatment");

assert.equal(model.supportSourcesByRole.purchase_assumptions.canonicalRole, "purchase_assumptions");
assert.equal(model.supportSourcesByRole.current_debt_context.canonicalRole, "current_debt_context");
assert.equal(model.supportSourcesByRole.appraisal_context.canonicalRole, "appraisal_context");
assert.equal(model.supportSourcesByRole.structured_renovation_capex_plan.canonicalRole, "structured_renovation_capex_plan");
assert.equal(model.supportSourcesByRole.market_survey_context.canonicalRole, "market_survey_context");
assert.equal(model.supportSourcesByRole.environmental_context.canonicalRole, "environmental_context");

assert.equal(model.supportSourcesByRole.purchase_assumptions.visibleLabel.toLowerCase().includes("current debt"), false);
assert.equal(model.supportSourcesByRole.current_debt_context.visibleLabel.toLowerCase().includes("purchase assumptions"), false);
assert.equal(model.supportSourcesByRole.current_debt_context.visibleLabel.toLowerCase().includes("proposed acquisition"), false);
assert.match(model.supportSourcesByRole.appraisal_context.visibleLabel, /Appraisal/i);

assert.equal(model.valueSemantics.wholePropertyValue.purchasePrice, 13500000);
assert.equal(model.valueSemantics.wholePropertyValue.goingInCapRate, 0.07);
assert.equal(Math.round(model.valueSemantics.wholePropertyValue.impliedValueAtGoingInCapRate || 0), 13500000);
assert.equal(Math.round(model.valueSemantics.rentUpsideValue.annualRentUpside || 0), 285600);

const syntheticHtml = `
  <html><body>
    <h1>Stonebridge Lofts Acquisition Memo</h1>
    <div>${model.coreSources.coreT12.visibleLabel}</div>
    <div>${model.coreSources.coreRentRoll.visibleLabel}</div>
    <div>${model.sections.acquisitionRequestContext.visibleLabel}</div>
    <div>${model.sections.currentDebtContext.visibleLabel}</div>
    <div>${model.sections.appraisalContext.visibleLabel}</div>
    <div>${model.sections.renovationContext.visibleLabel}</div>
    <div>${model.sections.marketSurveyContext.visibleLabel}</div>
    <div>${model.sections.environmentalContext.visibleLabel}</div>
    <div>Current Outstanding Balance $6,800,000</div>
    <div>Interest Rate 4.85%</div>
    <div>Amortization Remaining 24 years</div>
    <div>Monthly Payment $39,250</div>
    <div>Maturity Date 2029-11-01</div>
    <div>Proposed Acquisition Loan $9,450,000</div>
    <div>Proposed LTV 70.0%</div>
    <div>Proposed Rate 5.95%</div>
    <div>Proposed Amortization 30 years</div>
    <div>Lender / Origination Fee 0.85%</div>
    <div>1BR 32 $1,850 $2,050 $200</div>
    <div>2BR 32 $1,881 $2,425 $544</div>
    <div>Property Taxes $185,000</div>
    <div>Insurance $72,000</div>
    <div>Repairs &amp; Maintenance $104,000</div>
    <div>Utilities $86,000</div>
    <div>Property Management $60,000</div>
    <div>Payroll / Admin $28,000</div>
    <div>Operating Statement / TTM Summary</div>
    <div>Data Coverage / Source Limitations</div>
    <div>Methodology / Data Transparency</div>
  </body></html>
`;

const htmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(syntheticHtml, model);
assert.equal(htmlValidation.ok, true, JSON.stringify(htmlValidation.issues, null, 2));

const genericFixture = buildVariantFixture({
  propertyName: "Harbor Ridge",
  propertyAddress: "456 Oak Ave",
  assetClass: "Apartment",
  currentDebt: {
    balance: 5400000,
    rate: 0.0525,
    amortizationYears: 21,
    monthlyPayment: 28750,
    maturityDate: "2030-08-01",
  },
  purchaseAssumptions: {
    purchasePrice: 18250000,
    noiBasis: 1234000,
    goingInCapRate: 0.065,
    proposedLoanAmount: 12125000,
    ltv: 0.665,
    interestRate: 0.0575,
    amortizationYears: 28,
    lenderFeePercent: 0.01,
  },
  unitMixRows: [
    { label: "Studio", count: 12, current_rent: 1425, market_rent: 1575, avg_sqft: 510 },
    { label: "3BR", count: 8, current_rent: 2195, market_rent: 2495, avg_sqft: 1080 },
  ],
  t12ExpenseLines: [
    { label: "Insurance", amount: 42000 },
    { label: "Repairs", amount: 54000 },
  ],
});

const genericSourcePackage = buildCanonicalSourcePackage(genericFixture.uploadedFiles, genericFixture.parsedArtifacts);
const genericProjection = buildAcquisitionMemoProjection(genericSourcePackage);
const genericBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: genericSourcePackage,
  acquisitionMemoProjection: genericProjection,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Harbor Ridge",
    propertyAddress: "456 Oak Ave",
    propertyTitle: "Harbor Ridge",
    assetClass: "Apartment",
  },
  reportMeta: {
    propertyName: "Harbor Ridge",
    generatedAt: "2026-06-21T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
const genericModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: genericSourcePackage,
  acquisitionMemoProjection: genericProjection,
  bossContract: genericBossContract,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Harbor Ridge",
    propertyAddress: "456 Oak Ave",
    propertyTitle: "Harbor Ridge",
    assetClass: "Apartment",
  },
  reportMeta: {
    propertyName: "Harbor Ridge",
    generatedAt: "2026-06-21T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});

assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(genericModel).ok, true);
assert.equal(genericModel.identity.propertyName, "Harbor Ridge");
assert.notEqual(genericModel.identity.visibleClassification, "Apartment");
assert.ok(
  [
    "Stable",
    "Sensitized",
    "Fragile",
    "Review / Source Reconciliation Disclosure",
    "Review / Insufficient Core Support",
    "Review / Debt Coverage Constraint",
  ].includes(genericModel.identity.visibleClassification)
);
assert.equal(genericModel.sections.currentDebtContext.facts.current_outstanding_balance, 5400000);
assert.ok(Math.abs(genericModel.sections.currentDebtContext.facts.interest_rate - 0.0525) < 1e-9);
assert.equal(genericModel.sections.acquisitionRequestContext.facts.proposed_loan_amount, 12125000);
assert.equal(genericModel.sections.acquisitionRequestContext.facts.ltv, 0.665);
assert.match(genericModel.sections.unitMix.facts.unit_mix[0].label, /Studio/i);
assert.match(genericModel.sections.unitMix.facts.unit_mix[1].label, /3BR/i);
assert.equal(genericModel.sections.operatingStatementTTMSummary.facts.expense_lines[0].amount, 42000);
assert.equal(genericModel.sections.operatingStatementTTMSummary.facts.expense_lines[1].amount, 54000);

const genericHtml = `
  <html><body>
    <h1>Harbor Ridge Acquisition Memo</h1>
    <div>${genericModel.coreSources.coreT12.visibleLabel}</div>
    <div>${genericModel.coreSources.coreRentRoll.visibleLabel}</div>
    <div>${genericModel.sections.acquisitionRequestContext.visibleLabel}</div>
    <div>${genericModel.sections.currentDebtContext.visibleLabel}</div>
    <div>${genericModel.sections.appraisalContext.visibleLabel}</div>
    <div>${genericModel.sections.renovationContext.visibleLabel}</div>
    <div>${genericModel.sections.marketSurveyContext.visibleLabel}</div>
    <div>${genericModel.sections.environmentalContext.visibleLabel}</div>
    <div>Current Outstanding Balance $5,400,000</div>
    <div>Interest Rate 5.25%</div>
    <div>Amortization Remaining 21 years</div>
    <div>Monthly Payment $28,750</div>
    <div>Maturity Date 2030-08-01</div>
    <div>Proposed Acquisition Loan $12,125,000</div>
    <div>Proposed LTV 66.5%</div>
    <div>Proposed Rate 5.75%</div>
    <div>Proposed Amortization 28 years</div>
    <div>Lender / Origination Fee 1.0%</div>
    <div>Studio 12 $1,425 $1,575 $150</div>
    <div>3BR 8 $2,195 $2,495 $300</div>
    <div>Insurance $42,000</div>
    <div>Repairs $54,000</div>
  </body></html>
`;
assert.equal(validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(genericHtml, genericModel).ok, true);

const hardcodeMismatchHtml = syntheticHtml.replace(/Stonebridge Lofts/g, "Legacy Property");
const hardcodeMismatchValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(hardcodeMismatchHtml, genericModel);
assert.equal(hardcodeMismatchValidation.ok, false);
assert.ok(hardcodeMismatchValidation.issues.some((issue) => issue.code === "HTML_CURRENT_DEBT_BALANCE_MISSING" || issue.code === "HTML_PROPOSED_LOAN_MISSING"));

const collapseFixture = buildVariantFixture({
  propertyName: "Cinder House",
  propertyAddress: "789 Pine Rd",
  assetClass: "Office",
  includeCurrentDebt: false,
  includePurchaseAssumptions: false,
  includeAppraisal: false,
  includeRenovation: false,
  includeMarketSurvey: false,
  includeEnvironmental: false,
});
const collapseSourcePackage = buildCanonicalSourcePackage(collapseFixture.uploadedFiles, collapseFixture.parsedArtifacts);
const collapseProjection = buildAcquisitionMemoProjection(collapseSourcePackage);
const collapseBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: collapseSourcePackage,
  acquisitionMemoProjection: collapseProjection,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Cinder House",
    propertyAddress: "789 Pine Rd",
    propertyTitle: "Cinder House",
    assetClass: "Office",
  },
  reportMeta: {
    propertyName: "Cinder House",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
const collapseModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: collapseSourcePackage,
  acquisitionMemoProjection: collapseProjection,
  bossContract: collapseBossContract,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Cinder House",
    propertyAddress: "789 Pine Rd",
    propertyTitle: "Cinder House",
    assetClass: "Office",
  },
  reportMeta: {
    propertyName: "Cinder House",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(collapseModel).ok, true);
assert.equal(collapseModel.sections.currentDebtContext.factAvailability.sourceBacked, false);
assert.equal(collapseModel.sections.currentDebtContext.status, "collapsed");
assert.equal(collapseModel.sections.acquisitionRequestContext.factAvailability.sourceBacked, false);
assert.equal(collapseModel.sections.acquisitionRequestContext.status, "collapsed");

const partialCurrentDebtFixture = buildVariantFixture({
  propertyName: "Partial Current Debt",
  propertyAddress: "222 Partial St",
  assetClass: "Multifamily",
});
const partialCurrentDebtIndex = partialCurrentDebtFixture.parsedArtifacts.findIndex((artifact) => artifact.fileId === "current-debt-file");
partialCurrentDebtFixture.parsedArtifacts[partialCurrentDebtIndex].payload.document_text_extracted =
  "Existing Current Debt Statement\n" +
  "Current Outstanding Balance $5,400,000";
partialCurrentDebtFixture.parsedArtifacts[partialCurrentDebtIndex].payload.current_debt_parsed = {
  current_outstanding_balance: 5400000,
};
const partialCurrentDebtSourcePackage = buildCanonicalSourcePackage(partialCurrentDebtFixture.uploadedFiles, partialCurrentDebtFixture.parsedArtifacts);
const partialCurrentDebtProjection = buildAcquisitionMemoProjection(partialCurrentDebtSourcePackage);
const partialCurrentDebtBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: partialCurrentDebtSourcePackage,
  acquisitionMemoProjection: partialCurrentDebtProjection,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Partial Current Debt",
    propertyAddress: "222 Partial St",
    propertyTitle: "Partial Current Debt",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Partial Current Debt",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
const partialCurrentDebtModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: partialCurrentDebtSourcePackage,
  acquisitionMemoProjection: partialCurrentDebtProjection,
  bossContract: partialCurrentDebtBossContract,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Partial Current Debt",
    propertyAddress: "222 Partial St",
    propertyTitle: "Partial Current Debt",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Partial Current Debt",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(partialCurrentDebtModel).ok, true);
assert.equal(partialCurrentDebtModel.sections.currentDebtContext.status, "collapsed");
assert.equal(partialCurrentDebtModel.sections.currentDebtContext.factAvailability.sourceBacked, false);

const partialPurchaseFixture = buildVariantFixture({
  propertyName: "Partial Purchase Assumptions",
  propertyAddress: "333 Partial Ave",
  assetClass: "Multifamily",
});
const partialPurchaseIndex = partialPurchaseFixture.parsedArtifacts.findIndex((artifact) => artifact.fileId === "assumptions-file");
partialPurchaseFixture.parsedArtifacts[partialPurchaseIndex].payload.document_text_extracted =
  "Purchase assumptions / proposed acquisition financing\n" +
  "Purchase Price $18,250,000\n" +
  "NOI Basis $1,234,000";
const partialPurchaseSourcePackage = buildCanonicalSourcePackage(partialPurchaseFixture.uploadedFiles, partialPurchaseFixture.parsedArtifacts);
const partialPurchaseProjection = buildAcquisitionMemoProjection(partialPurchaseSourcePackage);
const partialPurchaseBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: partialPurchaseSourcePackage,
  acquisitionMemoProjection: partialPurchaseProjection,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Partial Purchase Assumptions",
    propertyAddress: "333 Partial Ave",
    propertyTitle: "Partial Purchase Assumptions",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Partial Purchase Assumptions",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
const partialPurchaseModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: partialPurchaseSourcePackage,
  acquisitionMemoProjection: partialPurchaseProjection,
  bossContract: partialPurchaseBossContract,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Partial Purchase Assumptions",
    propertyAddress: "333 Partial Ave",
    propertyTitle: "Partial Purchase Assumptions",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Partial Purchase Assumptions",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(partialPurchaseModel).ok, true);
assert.equal(partialPurchaseModel.sections.acquisitionRequestContext.status, "collapsed");
assert.equal(partialPurchaseModel.sections.proposedFinancingContext.status, "collapsed");

const missingT12Fixture = buildCoreMissingFixture({ includeT12: false, includeRentRoll: true });
const missingT12SourcePackage = buildCanonicalSourcePackage(missingT12Fixture.uploadedFiles, missingT12Fixture.parsedArtifacts);
const missingT12Projection = buildAcquisitionMemoProjection(missingT12SourcePackage);
const missingT12BossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: missingT12SourcePackage,
  acquisitionMemoProjection: missingT12Projection,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: null,
    opEx: null,
    noi: null,
    expenseRatio: null,
    noiMargin: null,
    breakEvenOccupancy: null,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Missing T12",
    propertyAddress: "444 Missing Ave",
    propertyTitle: "Missing T12",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Missing T12",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: missingT12SourcePackage,
  acquisitionMemoProjection: missingT12Projection,
  bossContract: missingT12BossContract,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: null,
    opEx: null,
    noi: null,
    expenseRatio: null,
    noiMargin: null,
    breakEvenOccupancy: null,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Missing T12",
    propertyAddress: "444 Missing Ave",
    propertyTitle: "Missing T12",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Missing T12",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
})).ok, false);

const missingRentRollFixture = buildCoreMissingFixture({ includeT12: true, includeRentRoll: false });
const missingRentRollSourcePackage = buildCanonicalSourcePackage(missingRentRollFixture.uploadedFiles, missingRentRollFixture.parsedArtifacts);
const missingRentRollProjection = buildAcquisitionMemoProjection(missingRentRollSourcePackage);
const missingRentRollBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: missingRentRollSourcePackage,
  acquisitionMemoProjection: missingRentRollProjection,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Missing Rent Roll",
    propertyAddress: "555 Missing Ave",
    propertyTitle: "Missing Rent Roll",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Missing Rent Roll",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: missingRentRollSourcePackage,
  acquisitionMemoProjection: missingRentRollProjection,
  bossContract: missingRentRollBossContract,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Missing Rent Roll",
    propertyAddress: "555 Missing Ave",
    propertyTitle: "Missing Rent Roll",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Missing Rent Roll",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
})).ok, false);

const negatedPurchaseFixture = buildVariantFixture({
  propertyName: "Lakeside Commons",
  propertyAddress: "111 Lake Dr",
  assetClass: "Multifamily",
  includeCurrentDebt: false,
});
const negatedAssumptionIndex = negatedPurchaseFixture.parsedArtifacts.findIndex((artifact) => artifact.fileId === "assumptions-file");
negatedPurchaseFixture.parsedArtifacts[negatedAssumptionIndex].payload.document_text_extracted =
  "Purchase assumptions / proposed acquisition financing only\n" +
  "This document is not current debt\n" +
  "Do not treat as current outstanding debt\n" +
  "Purchase Price $18,250,000\n" +
  "NOI Basis $1,234,000\n" +
  "Going-In Cap Reference 6.50%\n" +
  "Proposed Acquisition Loan $12,125,000\n" +
  "LTV 66.5%\n" +
  "Interest Rate 5.75%\n" +
  "Amortization 28 years\n" +
  "Lender Fee 1.00%";
const negatedSourcePackage = buildCanonicalSourcePackage(negatedPurchaseFixture.uploadedFiles, negatedPurchaseFixture.parsedArtifacts);
const negatedProjection = buildAcquisitionMemoProjection(negatedSourcePackage);
const negatedBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: negatedSourcePackage,
  acquisitionMemoProjection: negatedProjection,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Lakeside Commons",
    propertyAddress: "111 Lake Dr",
    propertyTitle: "Lakeside Commons",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Lakeside Commons",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
const negatedModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: negatedSourcePackage,
  acquisitionMemoProjection: negatedProjection,
  bossContract: negatedBossContract,
  coreMetrics: {
    units: 20,
    occupancy: 0.9,
    annualInPlaceRent: 240000,
    annualMarketRent: 264000,
    annualRentUpside: 24000,
    egi: 1234000,
    opEx: 612000,
    noi: 622000,
    expenseRatio: 0.4959,
    noiMargin: 0.5041,
    breakEvenOccupancy: 0.4959,
    purchasePrice: 18250000,
    goingInCapRate: 0.065,
  },
  propertyProfile: {
    propertyName: "Lakeside Commons",
    propertyAddress: "111 Lake Dr",
    propertyTitle: "Lakeside Commons",
    assetClass: "Multifamily",
  },
  reportMeta: {
    propertyName: "Lakeside Commons",
    generatedAt: "2026-06-22T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  },
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(negatedModel).ok, true);
assert.equal(negatedModel.supportSourcesByRole.purchase_assumptions.canonicalRole, "purchase_assumptions");
assert.equal(negatedModel.supportSourcesByRole.current_debt_context, undefined);
assert.equal(negatedModel.sections.currentDebtContext.factAvailability.sourceBacked, false);
assert.equal(negatedModel.sections.currentDebtContext.status, "collapsed");

console.log("acquisition-memo-v2-customer-surface-model smoke PASS");
