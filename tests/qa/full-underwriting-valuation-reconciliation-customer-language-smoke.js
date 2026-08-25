import assert from "node:assert/strict";
import { buildFullUnderwritingValuationReconciliationV1 } from "../../api/_lib/full-underwriting-valuation-reconciliation-v1.js";
import { renderFullUnderwritingValuationReconciliation } from "../../api/_lib/full-underwriting-valuation-reconciliation-renderer.js";

function visibleText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const appraisalDoc = {
  canonicalRole: "appraisal_context",
  canonicalLabel: "Appraisal / Valuation Context",
  extractedFacts: {
    appraisal_value: 14200000,
    stabilized_noi: 1050000,
    stabilized_cap_rate: 0.074,
  },
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
      facts: appraisalDoc.extractedFacts,
      sourceDoc: appraisalDoc,
    },
    acquisitionRequestContext: {
      status: "required_if_source_present",
      factAvailability: { sourceBacked: true, required: [], available: ["purchase_price", "going_in_cap_rate"], missing: [] },
      facts: { purchase_price: 13500000, going_in_cap_rate: 0.07 },
    },
  },
  valueSemantics: {
    wholePropertyValue: {
      noi: 945000,
      goingInCapRate: 0.07,
      purchasePrice: 13500000,
    },
  },
  sourceBackedFacts: { unitMix: { total_units: 64 } },
};

const baseline = structuredClone(customerSurfaceModel);
const model = buildFullUnderwritingValuationReconciliationV1({
  sourcePackage: {
    coreT12: { extractedFacts: { noi: 945000 } },
    coreRentRoll: { extractedFacts: { total_units: 64 } },
    supportDocs: [appraisalDoc],
  },
  coreMetrics: { noi: 945000, goingInCapRate: 0.07, purchasePrice: 13500000, units: 64 },
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
const text = visibleText(html);

assert.match(html, /data-iq-evidence-class="source_backed"/i, "internal evidence class must remain source_backed");
assert.doesNotMatch(text, /source-backed/i, "customer-visible valuation text must not expose internal source-backed terminology");
assert.match(text, /Accepted evidence/i, "source-backed badge should use customer-facing Accepted evidence wording");
assert.match(text, /uploaded appraisal value/i, "appraisal interpretation should use customer-facing uploaded appraisal wording");
assert.match(text, /Appraisal \/ Valuation Context/i, "canonical appraisal visible label remains present");
assert.match(text, /7\.4%/, "canonical appraisal cap-rate display remains present");
assert.equal(JSON.stringify(customerSurfaceModel), JSON.stringify(baseline), "renderer/model path must not mutate customer-surface provenance");

console.log("PASS full-underwriting-valuation-reconciliation-customer-language-smoke (7/7)");
