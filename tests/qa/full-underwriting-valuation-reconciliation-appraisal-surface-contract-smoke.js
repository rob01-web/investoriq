import assert from "node:assert/strict";
import { buildFullUnderwritingValuationReconciliationV1 } from "../../api/_lib/full-underwriting-valuation-reconciliation-v1.js";
import { renderFullUnderwritingValuationReconciliation } from "../../api/_lib/full-underwriting-valuation-reconciliation-renderer.js";
import { validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel } from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";

let assertions = 0;
function check(condition, message) {
  assertions += 1;
  assert.ok(condition, message);
}

const appraisalDoc = {
  canonicalRole: "appraisal_context",
  canonicalLabel: "Appraisal / Valuation Context",
  originalFilename: "Institutional_Appraisal.pdf",
  extractedFacts: {
    appraisal_value: 14200000,
    stabilized_noi: 1050000,
    stabilized_cap_rate: 0.074,
  },
};

const sourcePackage = {
  coreT12: { extractedFacts: { noi: 945000 } },
  coreRentRoll: { extractedFacts: { total_units: 100 } },
  supportDocs: [appraisalDoc],
};

const customerSurfaceModel = {
  sections: {
    appraisalContext: {
      status: "required_if_source_present",
      visibleLabel: "Appraisal / Valuation Context",
      factAvailability: {
        sourceBacked: true,
        sourcePresent: true,
        required: [],
        available: ["appraisal_value", "stabilized_noi", "stabilized_cap_rate"],
        missing: [],
      },
      facts: {
        appraisal_value: 14200000,
        stabilized_noi: 1050000,
        stabilized_cap_rate: 0.074,
      },
      sourceDoc: appraisalDoc,
    },
    acquisitionRequestContext: {
      status: "required_if_source_present",
      factAvailability: { sourceBacked: true, required: [], available: ["going_in_cap_rate"], missing: [] },
      facts: { going_in_cap_rate: 0.07 },
    },
  },
  valueSemantics: {
    wholePropertyValue: {
      noi: 945000,
      goingInCapRate: 0.07,
    },
  },
  sourceBackedFacts: { unitMix: { total_units: 100 } },
};

const baseline = structuredClone(customerSurfaceModel);
const model = buildFullUnderwritingValuationReconciliationV1({
  sourcePackage,
  coreMetrics: { noi: 945000, goingInCapRate: 0.07, units: 100 },
  customerSurfaceModel,
  scenarioAnalysis: {
    capRateSensitivity: {
      rows: [
        { scenarioCapRate: 0.065 },
        { scenarioCapRate: 0.07 },
        { scenarioCapRate: 0.075 },
      ],
    },
  },
});
const html = renderFullUnderwritingValuationReconciliation(model);

check(model.appraisalComparison?.supported === true, "appraisal comparison supported");
check(model.appraisalComparison?.visibleLabel === "Appraisal / Valuation Context", "canonical appraisal visible label carried forward");
check(html.includes("Appraisal / Valuation Context"), "canonical appraisal label remains in upgraded HTML");
check(html.includes("$14,200,000"), "appraisal value remains visible");
check(html.includes("$1,050,000"), "stabilized NOI remains visible");
check(html.includes("7.4%"), "canonical appraisal cap-rate display remains visible");
check(!html.includes("7.40%"), "ELITE-08 does not drift appraisal cap display away from customer-surface contract");
check(JSON.stringify(customerSurfaceModel) === JSON.stringify(baseline), "ELITE-08 does not mutate customer surface provenance");

const surfaceValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, customerSurfaceModel);
const appraisalIssues = (Array.isArray(surfaceValidation?.issues) ? surfaceValidation.issues : []).filter((issue) => {
  const code = String(issue?.code || "").toUpperCase();
  const path = String(issue?.path || "").toLowerCase();
  return code.includes("APPRAISAL") || path.includes("appraisal");
});
check(appraisalIssues.length === 0, `no appraisal customer-surface validation issues: ${JSON.stringify(appraisalIssues)}`);

console.log(`PASS full-underwriting-valuation-reconciliation-appraisal-surface-contract-smoke (${assertions}/${assertions})`);
