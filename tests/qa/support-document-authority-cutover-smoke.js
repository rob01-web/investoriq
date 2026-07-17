import assert from "node:assert/strict";
import { buildCanonicalSourceTruthPackage, constrainCanonicalSourcePackageToSourceTruth } from "../../api/_lib/source-truth-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import { buildAcquisitionMemoBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import { buildAcquisitionMemoV2CustomerSurfaceModel } from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";
import { buildCanonicalInstitutionalFinancialIntelligence } from "../../api/_lib/institutional-financial-intelligence.js";
import { buildCanonicalInstitutionalUnderwritingScenarioPolicyContract } from "../../api/_lib/institutional-underwriting-scenario-policy-contract.js";
import { buildCanonicalInstitutionalUnderwritingInputContract } from "../../api/_lib/institutional-underwriting-input-contract.js";
import { buildDeterministicSourceCaseUnderwritingAnalysis } from "../../api/_lib/deterministic-source-case-underwriting-analysis.js";
import { buildDeterministicAcquisitionValuationAnalysis } from "../../api/_lib/deterministic-acquisition-valuation-analysis.js";
import { buildDeterministicAcquisitionCapitalStructureAnalysis } from "../../api/_lib/deterministic-acquisition-capital-structure-analysis.js";
import { buildCanonicalInstitutionalUnderwritingReturnReadinessContract } from "../../api/_lib/institutional-underwriting-return-readiness-contract.js";

const fileId = "assumptions-file";
const sourceText = [
  "Purchase assumptions / proposed acquisition financing",
  "Purchase Price $13,500,000",
  "NOI Basis $945,000",
  "Going-In Cap Rate 7.00%",
  "Proposed Acquisition Loan $9,450,000",
  "LTV 70%",
  "Interest Rate 5.95%",
  "Amortization 30 years",
  "Lender Fee 0.85%",
  "Closing Costs 2.00%",
  "This is not a current mortgage statement.",
].join("\n");

const artifacts = [
  {
    id: "t12-artifact",
    file_id: "t12-file",
    original_filename: "Operating_Statement.xlsx",
    type: "t12_parsed",
    payload: {
      validated: true,
      effective_gross_income: 1500000,
      total_operating_expenses: 555000,
      net_operating_income: 945000,
      gross_potential_rent: 1718400,
      income_lines: [{ label: "Effective Gross Income", amount: 1500000 }],
      expense_lines: [{ label: "Operating Expenses", amount: 555000 }],
    },
  },
  {
    id: "rent-roll-artifact",
    file_id: "rent-roll-file",
    original_filename: "Rent_Roll.xlsx",
    type: "rent_roll_parsed",
    payload: {
      validated: true,
      total_units: 64,
      occupancy: 0.9375,
      annual_in_place_rent: 1432800,
      annual_market_rent: 1718400,
      unit_mix: [{ label: "1BR", count: 64, current_rent: 1865, market_rent: 2237.5 }],
    },
  },
  {
    id: "text-artifact",
    file_id: fileId,
    original_filename: "Generic_Assumptions.pdf",
    type: "document_text_extracted",
    payload: { file_id: fileId, document_text_extracted: sourceText },
  },
  {
    id: "candidate-artifact",
    file_id: fileId,
    original_filename: "Generic_Assumptions.pdf",
    type: "mortgage_statement_parsed",
    payload: {
      file_id: fileId,
      validated: true,
      semantic_doc_role: "current_debt_context",
      candidate_only: true,
      candidate_facts: {
        purchase_price: 13500000,
        noi_basis: 945000,
        going_in_cap_rate: 7,
        proposed_loan_amount: 9450000,
        ltv: 70,
        interest_rate: 5.95,
        amortization_years: 30,
        lender_fee_percent: 0.85,
      },
    },
  },
];

const sourceTruth = buildCanonicalSourceTruthPackage({ jobId: "gate-5f-cutover", artifacts });
assert.equal(sourceTruth.support.accepted.length, 1);
assert.equal(sourceTruth.support.accepted[0].canonical_role, "purchase_assumptions");
assert.equal(sourceTruth.support.accepted[0].accepted_facts.purchase_price, 13500000);
assert.equal(sourceTruth.support.accepted[0].accepted_facts.proposed_loan_amount, 9450000);
assert.equal(sourceTruth.support.accepted[0].accepted_facts.closing_costs_percent, undefined);
assert.equal(sourceTruth.support.accepted[0].accepted_return_input_facts.closing_costs_percent, 0.02);
assert.equal(sourceTruth.support.accepted[0].authority_decision.roleAccepted, true);
assert.equal(sourceTruth.support.accepted[0].authority_decision.returnInputSourceBacked, true);
assert.equal(sourceTruth.support.accepted[0].authority_decision.sectionEligibility.proposedFinancing, true);

const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
  sourceTruthPackage: sourceTruth,
  asOfDate: "2026-07-17",
});
const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
  sourceTruthPackage: sourceTruth,
  financialIntelligence,
  scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
});
const gate5Analyses = {
  sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({ underwritingInputContract }),
  valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({ underwritingInputContract }),
  capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({ underwritingInputContract }),
};
const returnReadiness = buildCanonicalInstitutionalUnderwritingReturnReadinessContract(gate5Analyses);
assert.equal(returnReadiness.acceptedReferences.closingCostsPercent.value, 0.02);
assert.equal(returnReadiness.requiredAuthority.closingCosts.value, null);
assert.equal(returnReadiness.readiness.acquisitionUses.calculationEligible, false);
assert.equal(returnReadiness.returnOutputs.totalAcquisitionUses.value, null);

const canonical = constrainCanonicalSourcePackageToSourceTruth(null, sourceTruth);
const acceptedDoc = canonical.supportDocs.get(fileId);
assert.equal(acceptedDoc.canonicalRole, "purchase_assumptions");
assert.equal(acceptedDoc.acceptedPurchaseAssumptionsTruth, true);
assert.equal(acceptedDoc.extractedFacts.lender_fee_percent, 0.0085);
assert.equal(acceptedDoc.extractedFacts.closing_costs_percent, undefined);

const projection = buildAcquisitionMemoProjection(canonical);
const coreMetrics = {
  units: 64,
  occupancy: 0.9375,
  annualInPlaceRent: 1432800,
  annualMarketRent: 1718400,
  egi: 1500000,
  opEx: 555000,
  noi: 945000,
  expenseRatio: 0.37,
  noiMargin: 0.63,
  breakEvenOccupancy: 0.37,
  purchasePrice: 13500000,
  goingInCapRate: 0.07,
};
const boss = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: canonical,
  sourceTruthPackage: sourceTruth,
  acquisitionMemoProjection: projection,
  coreMetrics,
  propertyProfile: { propertyName: "Generic Property", assetClass: "Multifamily" },
  reportMeta: { reportType: "underwriting", reportTier: 2 },
  reportMode: "v1_core",
});
assert.equal(boss.sections.acquisitionRequestContext.factAvailability.sourceBacked, true);
assert.equal(boss.sections.proposedFinancingContext.factAvailability.sourceBacked, true);
const customerModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: canonical,
  acquisitionMemoProjection: projection,
  bossContract: boss,
  coreMetrics,
  propertyProfile: { propertyName: "Generic Property", assetClass: "Multifamily" },
  reportMeta: { reportType: "underwriting", reportTier: 2 },
  reportMode: "v1_core",
});
const html = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: projection,
  sourcePackage: canonical,
  coreMetrics,
  propertyProfile: { propertyName: "Generic Property", assetClass: "Multifamily" },
  reportMeta: { reportType: "underwriting", reportTier: 2 },
  bossContract: boss,
  customerSurfaceModel: customerModel,
});
assert.match(html, /Purchase Price<\/td><td style="font-weight:600;">\$13,500,000/i);
assert.match(html, /Proposed Loan Amount<\/td><td style="font-weight:600;">\$9,450,000/i);
assert.match(html, /LTV<\/td><td style="font-weight:600;">70\.0%/i);
assert.match(html, /Interest Rate<\/td><td style="font-weight:600;">5\.95%/i);
assert.match(html, /Amortization<\/td><td style="font-weight:600;">30 years/i);
assert.match(html, /Lender \/ Origination Fee<\/td><td style="font-weight:600;">0\.85%/i);
assert.equal(/Closing Costs<\/td><td[^>]*>2\.00%/i.test(html), false);
assert.equal(/<tr><td>Purchase Price<\/td><td style="font-weight:600;">\$0<\/td>/i.test(html), false);

console.log("support-document authority cutover smoke PASS");
