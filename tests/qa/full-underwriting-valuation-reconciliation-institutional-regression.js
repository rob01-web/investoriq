import assert from "node:assert/strict";
import { buildFullUnderwritingValuationReconciliationV1 } from "../../api/_lib/full-underwriting-valuation-reconciliation-v1.js";
import { renderFullUnderwritingValuationReconciliation } from "../../api/_lib/full-underwriting-valuation-reconciliation-renderer.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";

let assertions = 0;
function check(condition, message) {
  assertions += 1;
  assert.ok(condition, message);
}

const sourcePackage = {
  coreT12: {
    originalFilename: "Institutional_T12.xlsx",
    extractedFacts: {
      noi: 600000,
      gross_potential_rent: 1500000,
      effective_gross_income: 1250000,
      operating_expenses: 650000,
    },
  },
  coreRentRoll: {
    originalFilename: "Institutional_Rent_Roll.xlsx",
    extractedFacts: {
      total_units: 100,
      occupied_units: 95,
      occupancy: 0.95,
    },
  },
  supportDocs: [
    {
      originalFilename: "Institutional_Purchase_Assumptions.pdf",
      canonicalRole: "purchase_assumptions",
      canonicalLabel: "Purchase Assumptions",
      extractedFacts: {
        purchase_price: 9500000,
        going_in_cap_rate: 0.06,
      },
    },
    {
      originalFilename: "Institutional_Appraisal.pdf",
      canonicalRole: "appraisal_context",
      canonicalLabel: "Appraisal Context",
      extractedFacts: {
        appraisal_value: 10250000,
        stabilized_noi: 625000,
        stabilized_cap_rate: 0.061,
      },
    },
  ],
};

const coreMetrics = {
  units: 100,
  occupancy: 0.95,
  egi: 1250000,
  opEx: 650000,
  noi: 600000,
  goingInCapRate: 0.06,
  purchasePrice: 9500000,
};

const customerSurfaceModel = {
  identity: { assetClass: "Multifamily" },
  valueSemantics: {
    wholePropertyValue: {
      noi: 600000,
      goingInCapRate: 0.06,
      purchasePrice: 9500000,
    },
  },
  sourceBackedFacts: {
    unitMix: { total_units: 100 },
  },
  sections: {
    acquisitionRequestContext: {
      status: "required",
      disposition: "include",
      factAvailability: { sourceBacked: true, sectionDisplayReady: true, missing: [] },
      facts: { purchase_price: 9500000, going_in_cap_rate: 0.06, noi_basis: 600000 },
      sourceDoc: sourcePackage.supportDocs[0],
    },
    appraisalContext: {
      status: "required",
      disposition: "include",
      visibleLabel: "Appraisal / Valuation Context",
      factAvailability: { sourceBacked: true, sectionDisplayReady: true, missing: [] },
      facts: { appraisal_value: 10250000, stabilized_noi: 625000, stabilized_cap_rate: 0.061 },
      sourceDoc: sourcePackage.supportDocs[1],
    },
    coreReconciliation: {
      status: "required",
      disposition: "include",
      visibleLabel: "Core Source Reconciliation",
      factAvailability: { sourceBacked: true, sectionDisplayReady: true, missing: [] },
      facts: {
        t12GrossPotentialRent: 1500000,
        rentRollAnnualInPlaceRent: 1470000,
        differenceAmount: -30000,
        varianceRatioToT12Gpr: -0.02,
        perUnitMonthlyDifference: -25,
      },
    },
  },
};

const scenarioAnalysis = {
  capRateSensitivity: {
    rows: [
      { scenarioCapRate: 0.055 },
      { scenarioCapRate: 0.06 },
      { scenarioCapRate: 0.065 },
    ],
  },
};

const model = buildFullUnderwritingValuationReconciliationV1({
  sourcePackage,
  coreMetrics,
  customerSurfaceModel,
  scenarioAnalysis,
});
const sectionHtml = renderFullUnderwritingValuationReconciliation(model);

check(model.disposition === "full", "institutional valuation model is full");
check(sectionHtml.includes("Valuation Position &amp; Reconciliation") || sectionHtml.includes("Valuation Position & Reconciliation"), "institutional title rendered");
check(sectionHtml.includes("$10,000,000"), "deterministic implied value rendered");
check(sectionHtml.includes("$9,500,000"), "purchase price rendered");
check(sectionHtml.includes("$10,250,000"), "appraisal value rendered");
check(sectionHtml.includes("Cap-Rate Value Sensitivity"), "cap-rate sensitivity rendered");
check(!/\bgoverned\b/i.test(sectionHtml.replace(/<[^>]+>/g, " ")), "customer-visible governed engineering language absent");
check(sectionHtml.includes("Reconciliation Interpretation"), "institutional interpretation rendered");
check(sectionHtml.includes("Core Evidence Reconciliation Impact"), "core evidence reconciliation impact rendered");
check(sectionHtml.includes('data-iq-evidence-class="scenario"'), "scenario rows remain explicitly scenario-classed");
check(sectionHtml.includes('data-iq-evidence-class="third_party_context"'), "appraisal remains third-party context");
check(!/\bBUY\b|\bSELL\b|\bHOLD\b/.test(sectionHtml), "no recommendation surface");
check(!/\brefinance\b|\brefi\b/i.test(sectionHtml), "no prohibited debt wording");

const bossContract = {
  reportContext: { coreMetrics },
  sourceTruth: {
    coreT12: sourcePackage.coreT12,
    coreRentRoll: sourcePackage.coreRentRoll,
    supportDocs: sourcePackage.supportDocs,
  },
  sections: {},
};

const fullHtml = renderCompleteAcquisitionMemoV2Html({
  sourcePackage,
  coreMetrics,
  customerSurfaceModel,
  bossContract,
  acquisitionMemoProjection: {
    acquisitionContext: { extractedFacts: { purchase_price: 9500000, going_in_cap_rate: 0.06, noi_basis: 600000 } },
    proposedFinancingContext: { extractedFacts: {} },
  },
  reportMeta: {
    propertyName: "Institutional Fixture Property",
    propertyAddress: "100 Institutional Way",
    reportType: "full_underwriting",
  },
  propertyProfile: { assetClass: "Multifamily" },
});

check(typeof fullHtml === "string" && fullHtml.length > 0, "full report rendered");
check(fullHtml.includes('data-iq-chapter="valuation-reconciliation"'), "valuation chapter preserved in full report");
check(fullHtml.includes('data-iq-section="eliteValuationReconciliation"'), "ELITE-08 wired into full institutional report");
check(fullHtml.includes("Accepted-Basis Value Indication"), "accepted valuation basis appears in full report");
check(fullHtml.includes("Purchase Price Reconciliation"), "purchase reconciliation appears in full report");
check(fullHtml.includes("Appraisal Reconciliation"), "appraisal reconciliation appears in full report");
check(fullHtml.includes("Core Source Reconciliation") || fullHtml.includes("Appraisal / Valuation Context"), "existing Chapter 6 context remains available");
check(!/\bIRR\b/i.test(fullHtml), "full report has no IRR surface from ELITE-08");
check(!/\bMOIC\b/i.test(fullHtml), "full report has no MOIC surface from ELITE-08");

console.log(`PASS full-underwriting-valuation-reconciliation-institutional-regression (${assertions}/${assertions})`);
