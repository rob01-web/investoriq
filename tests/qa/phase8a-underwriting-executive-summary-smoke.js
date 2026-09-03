import assert from "node:assert/strict";
import {
  FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION,
} from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";
import { renderFullUnderwritingChapter1EliteHtml } from "../../api/_lib/full-underwriting-chapter1-elite-renderer.js";

const receipt = (key, label, value, units) => ({
  key,
  label,
  value,
  units,
  displayReady: true,
  evidenceClass: "source_backed",
});

const contract = {
  version: FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION,
  identity: {
    propertyName: "Stonebridge Lofts",
    assetIdentity: "64 Unit Multifamily",
  },
  metrics: {
    purchasePrice: receipt("purchasePrice", "Purchase Price", 13500000, "currency"),
    noi: receipt("noi", "Net Operating Income", 945000, "currency_per_year"),
    occupancy: receipt("occupancy", "Occupancy", 0.9375, "ratio"),
    noiMargin: receipt("noiMargin", "NOI Margin", 0.63, "ratio"),
    goingInCapRate: receipt("goingInCapRate", "Going-In Cap Rate", 0.07, "ratio"),
    proposedLoanAmount: receipt("proposedLoanAmount", "Proposed Loan Amount", 9450000, "currency"),
    proposedFinancingDscr: receipt("proposedFinancingDscr", "Proposed Financing DSCR", 1.3974, "ratio_x"),
    currentDebtDscr: receipt("currentDebtDscr", "Current Debt DSCR", 2.0064, "ratio_x"),
    annualGrossRentDifference: receipt("annualGrossRentDifference", "Annual Gross Rent Difference", 285600, "currency_per_year"),
  },
  executiveInvestmentSummary: {
    disposition: "include",
    assetStatement: "64 Unit Multifamily",
    primaryConstraint: {
      code: "PRIMARY_SOURCE_RECONCILIATION_REQUIRED",
      title: "Source reconciliation required",
      statement: "T12 Gross Potential Rent and Rent Roll annual in-place rent are not aligned on the source reconciliation basis.",
      investorImpact: "The variance can affect operating interpretation.",
    },
    unresolvedDiligence: [
      { code: "Q1", question: "What explains the difference between T12 Gross Potential Rent and Rent Roll annual in-place rent?" },
      { code: "Q2", question: "What evidence supports achievability of the documented market-rent level?" },
    ],
  },
  sectionDispositions: {
    executiveInvestmentSummary: { disposition: "include" },
  },
};

const html = renderFullUnderwritingChapter1EliteHtml(contract);
assert.match(html, /Current Decision State/);
assert.match(html, /RECONCILIATION REQUIRED/);
assert.match(html, /Investment Thesis/);
assert.match(html, /What Must Be True/);
assert.match(html, /\$13,500,000/);
assert.match(html, /\$945,000/);
assert.match(html, /93\.8%/);
assert.match(html, /7\.0%/);
assert.match(html, /\$9,450,000/);
assert.match(html, /1\.40x/);
assert.match(html, /\$285,600 of annual gross rent difference/);
assert.match(html, /tightens DSCR from 2\.01x currently to 1\.40x, a 0\.61x reduction in coverage/);
assert.match(html, /T12 and Rent Roll income bases must be reconciled/);
assert.match(html, /modeled DSCR at the stated terms is 1\.40x/);
assert.doesNotMatch(html, /Document-backed committee framing using verified source facts and deterministic calculations/);
assert.doesNotMatch(html, /\bBUY\b|\bSELL\b|\bHOLD\b/);
console.log("phase8a-underwriting-executive-summary-smoke: PASS");
