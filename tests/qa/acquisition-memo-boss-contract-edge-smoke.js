import assert from "assert";
import fs from "fs";

import {
  buildAcquisitionMemoBossContract,
  validateAcquisitionMemoBossContract,
} from "../../api/_lib/acquisition-memo-boss-contract.js";

function buildCoreDocs() {
  return {
    coreT12: {
      fileId: "t12-file",
      originalFilename: "T12_Stonebridge_Lofts_Attack_Test_8.xlsx",
      role: "core_t12",
      canonicalLabel: "Core Quantitative Source - Trailing 12-Month Income Statement",
      sourceKind: "core_t12",
      extractedFacts: {
        income_lines: [{ label: "Effective Gross Income", amount: 1500000 }],
        expense_lines: [
          { label: "Property Taxes", amount: 185000 },
          { label: "Insurance", amount: 72000 },
        ],
        effective_gross_income: 1500000,
        total_operating_expenses: 555000,
        net_operating_income: 945000,
        gross_potential_rent: 1718400,
      },
    },
    coreRentRoll: {
      fileId: "rent-roll-file",
      originalFilename: "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx",
      role: "core_rent_roll",
      canonicalLabel: "Core Quantitative Source - Rent Roll",
      sourceKind: "core_rent_roll",
      extractedFacts: {
        total_units: 64,
        occupancy: 0.9375,
        unit_mix: [
          { label: "1BR", count: 32, current_rent: 1850, market_rent: 2050 },
          { label: "2BR", count: 32, current_rent: 1881, market_rent: 2425 },
        ],
        units: [{ label: "1BR" }],
        annual_in_place_rent: 1432800,
        annual_market_rent: 1718400,
      },
    },
  };
}

function buildProjectionVariants() {
  return {
    supportDocProjection: {
      purchaseAssumptions: {
        fileId: "assumptions-file",
        originalFilename: "Stonebridge_Assumptions.pdf",
        canonicalRole: "purchase_assumptions",
        roleLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
        extractedFacts: {
          purchase_price: 13500000,
          noi_basis: 945000,
          going_in_cap_rate: 0.07,
          proposed_loan_amount: 9450000,
          ltv: 0.7,
          interest_rate: 0.0595,
          amortization_years: 30,
          lender_fee_percent: 0.0085,
        },
      },
      currentDebtContext: {
        fileId: "current-debt-file",
        originalFilename: "Current_Debt_Stonebridge.pdf",
        canonicalRole: "current_debt_context",
        roleLabel: "Existing Debt Context - Current Mortgage / Debt Statement",
        extractedFacts: {
          current_outstanding_balance: 6800000,
          interest_rate: 0.0485,
          amortization_remaining_years: 24,
          monthly_payment: 39250,
          maturity_date: "2029-11-01",
        },
      },
      allSupportDocs: [],
    },
    proposedFinancingContext: {
      extractedFacts: {
        purchase_price: 13500000,
        noi_basis: 945000,
        going_in_cap_rate: 0.07,
        proposed_loan_amount: 9450000,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
      },
    },
    currentDebtContext: {
      extractedFacts: {
        current_outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amortization_remaining_years: 24,
        monthly_payment: 39250,
        maturity_date: "2029-11-01",
      },
    },
    financingReadinessSignals: {
      hasPurchaseAssumptions: true,
      hasCurrentDebtContext: true,
      hasStructuredRenovation: true,
      hasAppraisalContext: true,
      hasMarketSurveyContext: true,
      hasEnvironmentalContext: true,
    },
    lenderDiligenceChecklist: [],
  };
}

function buildContract({ supportDocsShape = "map", includeCurrentDebt = true, includeT12 = true, includeRentRoll = true, invalidStatus = null, overrideSection = null, supportDocsProjectionShape = "array" } = {}) {
  const coreDocs = buildCoreDocs();
  const canonicalSourcePackage = {
    coreT12: includeT12 ? coreDocs.coreT12 : null,
    coreRentRoll: includeRentRoll ? coreDocs.coreRentRoll : null,
  };

  const supportDocsArray = [
    {
      fileId: "assumptions-file",
      originalFilename: "Stonebridge_Assumptions.pdf",
      canonicalRole: "purchase_assumptions",
      roleLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
      treatment: "Acquisition context received",
      use: "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.",
      sourceKind: "support_doc",
      extractedFacts: buildProjectionVariants().supportDocProjection.purchaseAssumptions.extractedFacts,
    },
  ];
  if (includeCurrentDebt) {
    supportDocsArray.push({
      fileId: "current-debt-file",
      originalFilename: "Current_Debt_Stonebridge.pdf",
      canonicalRole: "current_debt_context",
      roleLabel: "Existing Debt Context - Current Mortgage / Debt Statement",
      treatment: "Debt support received / contextual",
      use: "Uploaded existing/current debt context only; not proposed acquisition financing.",
      sourceKind: "support_doc",
      extractedFacts: buildProjectionVariants().supportDocProjection.currentDebtContext.extractedFacts,
    });
  }

  if (supportDocsShape === "map") {
    canonicalSourcePackage.supportDocs = new Map(supportDocsArray.map((doc) => [doc.fileId, doc]));
  } else if (supportDocsShape === "array") {
    canonicalSourcePackage.supportDocs = supportDocsArray;
  } else {
    canonicalSourcePackage.supportDocs = {
      assumptions: supportDocsArray[0],
      ...(includeCurrentDebt ? { currentDebt: supportDocsArray[1] } : {}),
    };
  }

  const projection = buildProjectionVariants();
  if (supportDocsProjectionShape === "map") {
    projection.supportDocProjection.allSupportDocs = new Map(supportDocsArray.map((doc) => [doc.fileId, doc]));
  } else if (supportDocsProjectionShape === "object") {
    projection.supportDocProjection.allSupportDocs = {
      assumptions: supportDocsArray[0],
      ...(includeCurrentDebt ? { currentDebt: supportDocsArray[1] } : {}),
    };
  } else {
    projection.supportDocProjection.allSupportDocs = supportDocsArray;
  }
  if (!includeCurrentDebt) {
    projection.supportDocProjection.currentDebtContext = null;
    projection.currentDebtContext = null;
    projection.financingReadinessSignals.hasCurrentDebtContext = false;
  }
  if (!includeRentRoll) {
    projection.supportDocProjection.hasCoreRentRoll = false;
  }

  const contract = buildAcquisitionMemoBossContract({
    canonicalSourcePackage,
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
    propertyProfile: { propertyName: "Stonebridge Lofts" },
    reportMeta: { propertyName: "Stonebridge Lofts" },
    reportMode: "v1_core",
  });

  if (invalidStatus) {
    contract.sections.unitMix.status = invalidStatus;
  }
  if (overrideSection) {
    contract.sections[overrideSection.key] = {
      ...contract.sections[overrideSection.key],
      ...overrideSection.value,
    };
  }

  return contract;
}

function assertNoProviderHooks(sourceText) {
  assert.equal(/\b(openai|anthropic|azure|gpt|axios)\b/i.test(sourceText), false);
  assert.equal(/\bfetch\s*\(/i.test(sourceText), false);
  assert.equal(/\bnew\s+OpenAI\b/i.test(sourceText), false);
}

const bossContractSource = fs.readFileSync("api/_lib/acquisition-memo-boss-contract.js", "utf8");
assertNoProviderHooks(bossContractSource);

const happyContract = buildContract({ supportDocsShape: "map", supportDocsProjectionShape: "array" });
assert.equal(happyContract.coreGate.publishAllowed, true);
assert.equal(validateAcquisitionMemoBossContract(happyContract).ok, true);

const missingCurrentDebt = buildContract({ supportDocsShape: "array", includeCurrentDebt: false });
assert.equal(missingCurrentDebt.coreGate.publishAllowed, true);
assert.equal(missingCurrentDebt.sections.currentDebtContext.status, "collapsed");
assert.equal(missingCurrentDebt.sections.currentDebtContext.factAvailability.sourceBacked, false);
assert.ok(missingCurrentDebt.sections.currentDebtContext.factAvailability.missing.includes("current_outstanding_balance"));
assert.equal(validateAcquisitionMemoBossContract(missingCurrentDebt).ok, true);

const missingRentRoll = buildContract({ includeRentRoll: false });
assert.equal(missingRentRoll.coreGate.publishAllowed, false);
assert.equal(missingRentRoll.coreGate.fatalReasons.includes("core_rent_roll_unusable"), true);

const missingT12 = buildContract({ includeT12: false });
assert.equal(missingT12.coreGate.publishAllowed, false);
assert.equal(missingT12.coreGate.fatalReasons.includes("core_t12_unusable"), true);

assert.equal(happyContract.sections.unitMix.status, "required");
assert.equal(happyContract.sections.unitMix.factAvailability.sourceBacked, true);
assert.ok(happyContract.sections.unitMix.factAvailability.available.includes("unit_mix"));
assert.ok(happyContract.sections.unitMix.postRenderAssertions.some((item) => item.code === "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS"));
assert.ok(happyContract.sections.unitMix.postRenderAssertions.some((item) => item.code === "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT"));

assert.equal(happyContract.sections.operatingStatementTTMSummary.factAvailability.sourceBacked, true);
assert.ok(happyContract.sections.operatingStatementTTMSummary.factAvailability.available.includes("expense_lines"));
assert.ok(happyContract.sections.operatingStatementTTMSummary.postRenderAssertions.some((item) => item.code === "T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT"));

assert.ok(happyContract.sections.proposedFinancingContext.sourceBindings.every((binding) => binding.sourceRole === "purchase_assumptions"));
assert.ok(happyContract.sections.currentDebtContext.sourceBindings.every((binding) => binding.sourceRole === "current_debt_context"));
assert.equal(happyContract.sections.currentDebtContext.requiredFacts.includes("proposed_loan_amount"), false);
assert.equal(happyContract.sections.proposedFinancingContext.requiredFacts.includes("current_outstanding_balance"), false);

const mapShapeContract = buildContract({ supportDocsShape: "map", supportDocsProjectionShape: "map" });
const arrayShapeContract = buildContract({ supportDocsShape: "array", supportDocsProjectionShape: "array" });
const objectShapeContract = buildContract({ supportDocsShape: "object", supportDocsProjectionShape: "object" });
assert.deepStrictEqual(
  mapShapeContract.sourceTruth.supportDocs.map((doc) => doc.canonicalRole).sort(),
  arrayShapeContract.sourceTruth.supportDocs.map((doc) => doc.canonicalRole).sort()
);
assert.deepStrictEqual(
  arrayShapeContract.sourceTruth.supportDocs.map((doc) => doc.canonicalRole).sort(),
  objectShapeContract.sourceTruth.supportDocs.map((doc) => doc.canonicalRole).sort()
);
assert.equal(mapShapeContract.sections.documentTreatment.factAvailability.sourceBacked, true);
assert.equal(arrayShapeContract.sections.documentTreatment.factAvailability.sourceBacked, true);
assert.equal(objectShapeContract.sections.documentTreatment.factAvailability.sourceBacked, true);

const invalidStatusContract = buildContract({ invalidStatus: "bogus" });
assert.equal(validateAcquisitionMemoBossContract(invalidStatusContract).ok, false);
assert.ok(validateAcquisitionMemoBossContract(invalidStatusContract).issues.some((issue) => issue.code === "SECTION_STATUS_INVALID"));

const missingBindingsContract = buildContract({ overrideSection: { key: "currentDebtContext", value: { sourceBindings: [] } } });
assert.equal(validateAcquisitionMemoBossContract(missingBindingsContract).ok, false);
assert.ok(validateAcquisitionMemoBossContract(missingBindingsContract).issues.some((issue) => issue.code === "SECTION_SOURCE_BINDINGS_EMPTY"));

const missingAssertionContract = buildContract({ overrideSection: { key: "unitMix", value: { postRenderAssertions: [] } } });
assert.equal(validateAcquisitionMemoBossContract(missingAssertionContract).ok, false);
assert.ok(validateAcquisitionMemoBossContract(missingAssertionContract).issues.some((issue) => issue.code === "SECTION_ASSERTION_CODE_MISSING"));

const missingCollapseContract = buildContract({
  overrideSection: {
    key: "currentDebtContext",
    value: {
      factAvailability: {
        required: ["current_outstanding_balance"],
        available: [],
        missing: ["current_outstanding_balance"],
        sourceBacked: true,
      },
      collapseInstructions: [],
    },
  },
});
assert.equal(validateAcquisitionMemoBossContract(missingCollapseContract).ok, false);
assert.ok(validateAcquisitionMemoBossContract(missingCollapseContract).issues.some((issue) => issue.code === "SECTION_MISSING_FACTS_WITHOUT_COLLAPSE"));

const missingForbiddenContract = buildContract();
missingForbiddenContract.forbiddenSurfaces = missingForbiddenContract.forbiddenSurfaces.filter((value) => value !== "DSCR");
assert.equal(validateAcquisitionMemoBossContract(missingForbiddenContract).ok, false);
assert.ok(validateAcquisitionMemoBossContract(missingForbiddenContract).issues.some((issue) => issue.code === "FORBIDDEN_SURFACES_INCOMPLETE"));

console.log("acquisition-memo-boss-contract edge smoke PASS");
