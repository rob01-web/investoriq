import assert from "assert";

import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "../../api/_lib/acquisition-memo-projection.js";
import {
  buildAcquisitionMemoBossContract,
  enforceAcquisitionMemoBossContractOnHtml,
  validateAcquisitionMemoRenderAgainstBossContract,
  validateAcquisitionMemoBossContract,
} from "../../api/_lib/acquisition-memo-boss-contract.js";
import { renderAcquisitionMemo, renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";

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

  const rentRollUnits = [
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
          units: rentRollUnits,
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

const sourcePackage = buildRetest13SourcePackage();
const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
const renderedAcquisitionMemo = renderAcquisitionMemo(acquisitionMemoProjection);
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

const finalHtml = renderCompleteAcquisitionMemoV2Html({
  bossContract,
  acquisitionMemoProjection,
  renderedAcquisitionMemo,
  sourcePackage,
  coreMetrics,
  reportMeta,
  propertyProfile,
});

assert.equal(typeof finalHtml, "string");
assert.match(finalHtml, /<!DOCTYPE html>/i);
assert.match(finalHtml, /<body/i);
assert.match(finalHtml, /<\/body>/i);
assert.match(finalHtml, /<\/html>/i);

assert.match(finalHtml, /INVESTORIQ/i);
assert.match(finalHtml, /ACQUISITION MEMO/i);
assert.match(finalHtml, /64-Unit Multifamily/i);
assert.match(finalHtml, /Executive Summary/i);
assert.match(finalHtml, /Acquisition Memo Summary/i);
assert.match(finalHtml, /Operating Snapshot/i);
assert.match(finalHtml, /Unit Mix and Rent Positioning/i);
assert.match(finalHtml, /Rent Upside \/ Value Sensitivity/i);
assert.match(finalHtml, /Cap-Rate Value Indication/i);
assert.match(finalHtml, /Preliminary Financing Readiness Summary/i);
assert.match(finalHtml, /Debt \/ Financing Context/i);
assert.match(finalHtml, /Operating Statement \/ TTM Summary/i);
assert.match(finalHtml, /Data Coverage &amp; Source Limitations/i);
assert.match(finalHtml, /Source Context \/ Support Document Treatment/i);
assert.match(finalHtml, /Methodology &amp; Data Transparency/i);

assert.match(finalHtml, /<td>Units<\/td><td style="font-weight:600;">64<\/td>/i);
assert.match(finalHtml, /<td>Occupancy<\/td><td style="font-weight:600;">93\.8%<\/td>/i);
assert.match(finalHtml, /<td>Annual In-Place Rent<\/td><td style="font-weight:600;">\$1,432,800<\/td>/i);
assert.match(finalHtml, /<td>Annual Market Rent<\/td><td style="font-weight:600;">\$1,718,400<\/td>/i);
assert.match(finalHtml, /<td>Annual Rent Upside<\/td><td style="font-weight:600;">\$285,600<\/td>/i);
assert.match(finalHtml, /<td>Rent Gap %<\/td><td style="font-weight:600;">19\.9%<\/td>/i);
assert.match(finalHtml, /<td>EGI<\/td><td style="font-weight:600;">\$1,500,000<\/td>/i);
assert.match(finalHtml, /<td>Operating Expenses<\/td><td style="font-weight:600;">\$555,000<\/td>/i);
assert.match(finalHtml, /<td>NOI<\/td><td style="font-weight:600;">\$945,000<\/td>/i);
assert.match(finalHtml, /<td>Expense Ratio<\/td><td style="font-weight:600;">37\.0%<\/td>/i);
assert.match(finalHtml, /<td>NOI Margin<\/td><td style="font-weight:600;">63\.0%<\/td>/i);
assert.match(finalHtml, /<td>Break-Even Occupancy<\/td><td style="font-weight:600;">37\.0%<\/td>/i);
assert.match(finalHtml, /<td>Purchase Price<\/td><td style="font-weight:600;">\$13,500,000<\/td>/i);
assert.match(finalHtml, /<td>Going-In Cap Rate<\/td><td style="font-weight:600;">7\.0%<\/td>/i);
assert.match(finalHtml, /<tr><td>5\.0%<\/td><td style="font-weight:600;">\$18,900,000<\/td><td style="font-weight:600;">\$295,313<\/td><\/tr>/i);
assert.match(finalHtml, /<tr><td>6\.0%<\/td><td style="font-weight:600;">\$15,750,000<\/td><td style="font-weight:600;">\$246,094<\/td><\/tr>/i);
assert.match(finalHtml, /<tr><td>7\.0%<\/td><td style="font-weight:600;">\$13,500,000<\/td><td style="font-weight:600;">\$210,937<\/td><\/tr>/i);

assert.match(finalHtml, /1BR/i);
assert.match(finalHtml, /2BR/i);
assert.match(finalHtml, /\$1,850/i);
assert.match(finalHtml, /\$2,050/i);
assert.match(finalHtml, /\$200/i);
assert.match(finalHtml, /\$1,881/i);
assert.match(finalHtml, /\$2,425/i);
assert.match(finalHtml, /\$544/i);

assert.match(finalHtml, /<td>Current Outstanding Balance<\/td><td style="font-weight:600;">\$6,800,000<\/td>/i);
assert.match(finalHtml, /<td>Interest Rate<\/td><td style="font-weight:600;">4\.85%<\/td>/i);
assert.match(finalHtml, /<td>Amortization Remaining<\/td><td style="font-weight:600;">24 years<\/td>/i);
assert.match(finalHtml, /<td>Monthly Payment<\/td><td style="font-weight:600;">\$39,250<\/td>/i);
assert.match(finalHtml, /<td>Maturity Date<\/td><td style="font-weight:600;">2029-11-01<\/td>/i);

assert.match(finalHtml, /<td>Proposed Acquisition Loan<\/td><td style="font-weight:600;">\$9,450,000<\/td>/i);
assert.match(finalHtml, /<td>Proposed LTV<\/td><td style="font-weight:600;">70\.0%<\/td>/i);
assert.match(finalHtml, /<td>Proposed Rate<\/td><td style="font-weight:600;">5\.95%<\/td>/i);
assert.match(finalHtml, /<td>Proposed Amortization<\/td><td style="font-weight:600;">30 years<\/td>/i);
assert.match(finalHtml, /<td>Lender \/ Origination Fee<\/td><td style="font-weight:600;">0\.85%<\/td>/i);

assert.match(finalHtml, /<td>Property Taxes<\/td><td style="font-weight:600;">\$185,000<\/td>/i);
assert.match(finalHtml, /<td>Insurance<\/td><td style="font-weight:600;">\$72,000<\/td>/i);
assert.match(finalHtml, /<td>Repairs &amp; Maintenance<\/td><td style="font-weight:600;">\$104,000<\/td>/i);
assert.match(finalHtml, /<td>Utilities<\/td><td style="font-weight:600;">\$86,000<\/td>/i);
assert.match(finalHtml, /<td>Property Management<\/td><td style="font-weight:600;">\$60,000<\/td>/i);
assert.match(finalHtml, /<td>Payroll \/ Admin<\/td><td style="font-weight:600;">\$28,000<\/td>/i);

assert.equal(/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(finalHtml), false);
assert.equal(/Going-In Cap Rate[^<]*0\.0%/i.test(finalHtml), false);
assert.equal(/Implied value at going-in cap rate[^<]*Not available/i.test(finalHtml), false);
assert.equal(/Current Debt Maturity Not available/i.test(finalHtml), false);
assert.equal(/Maturity Date Not available/i.test(finalHtml), false);
assert.equal(/-\s*<\/td>/i.test(finalHtml), false);

assert.equal(/DSCR|refinance|refi|DCF|waterfall|equity return|deal score|final recommendation|\bBUY\b|\bSELL\b|\bHOLD\b|loan approval|lender commitment/i.test(finalHtml), false);
assert.equal(/\b(v2|authorityVersion|canonical source package|source authority|renderSafely|ReferenceError|TypeError|is not defined)\b/i.test(finalHtml), false);

const renderValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, finalHtml);
assert.equal(renderValidation.ok, true);
assert.equal(renderValidation.violations.length, 0);

const badHtml = `
<!DOCTYPE html>
<html><body>
<p>No parsed unit mix rows were available from the canonical rent roll evidence.</p>
<table><tbody>
<tr><td>5.0%</td><td style="font-weight:600;">$18,900,000</td><td style="font-weight:600;">-</td></tr>
</tbody></table>
<p>Current Debt Maturity Not available</p>
<p>Proposed Acquisition Financing Context</p>
<p>DSCR</p>
</body></html>`;
const badValidation = validateAcquisitionMemoRenderAgainstBossContract(bossContract, badHtml);
assert.equal(badValidation.ok, false);
assert.ok(badValidation.violations.some((item) => item.code === "UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT"));
assert.ok(badValidation.violations.some((item) => item.code === "NO_PER_UNIT_DASH_WITH_UNITS"));
assert.ok(badValidation.violations.some((item) => item.code === "CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED"));
assert.ok(badValidation.violations.some((item) => item.code === "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"));
assert.ok(badValidation.violations.some((item) => item.code === "NO_FORBIDDEN_SURFACES"));

const repaired = enforceAcquisitionMemoBossContractOnHtml(bossContract, badHtml);
assert.equal(typeof repaired.repairedHtml, "string");
assert.equal(/No parsed unit mix rows were available from the canonical rent roll evidence\./i.test(repaired.repairedHtml), false);
assert.equal(/Current Debt Maturity Not available/i.test(repaired.repairedHtml), false);
assert.equal(/DSCR/i.test(repaired.repairedHtml), false);

console.log("acquisition-memo-v2-boss-contract-render-smoke: ok");
