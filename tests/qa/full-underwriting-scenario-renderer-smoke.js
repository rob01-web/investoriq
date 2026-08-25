import assert from "node:assert/strict";
import { buildFullUnderwritingScenarioEngineV1 } from "../../api/_lib/full-underwriting-scenario-engine-v1.js";
import { renderFullUnderwritingScenarioEngineV1Html } from "../../api/_lib/full-underwriting-scenario-renderer.js";

function metric(key, value, units, evidenceClass = "source_backed") {
  return { key, label: key, value, units, evidenceClass, displayReady: value !== null, authorityPath: `operating.${key}`, provenance: [`source:${key}`] };
}

const contract = buildFullUnderwritingScenarioEngineV1({
  sourceTruthPackage: {
    source: "canonical_source_truth_package",
    schema_version: 1,
    job_id: "elite-04-renderer",
    property_name: "ELITE Scenario Property",
    core_publishable: true,
    core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  },
  operatingIntelligence: {
    version: "full_underwriting_operating_intelligence_v1",
    authority: { sourceTruthMutationAllowed: false, scenarioAllowed: false },
    sourceTruthReceipt: { source: "canonical_source_truth_package", coreSourceMode: "dual_source_core" },
    identity: { propertyName: "ELITE Scenario Property" },
    metrics: {
      units: metric("units", 64, "count"),
      occupancy: metric("occupancy", 0.9375, "ratio"),
      egi: metric("egi", 1_500_000, "currency"),
      operatingExpenses: metric("operatingExpenses", 555_000, "currency"),
      noi: metric("noi", 945_000, "currency"),
      noiMargin: metric("noiMargin", 0.63, "ratio", "deterministic_calculated"),
    },
  },
  customerSurfaceModel: {
    sections: {
      acquisitionRequestContext: {
        factAvailability: { sourceBacked: true },
        facts: { going_in_cap_rate: 0.07, purchase_price: 13_500_000 },
        sourceDoc: { acceptedProvenance: { acceptedSourceIdentityKey: "file:purchase-file" } },
      },
    },
  },
});

const html = renderFullUnderwritingScenarioEngineV1Html(contract);
let checks = 0;
function match(regex, message) { checks += 1; assert.match(html, regex, message); }
function noMatch(regex, message) { checks += 1; assert.doesNotMatch(html, regex, message); }

match(/Scenario Basis/i);
match(/Occupancy Stress/i);
match(/Operating Expense Stress/i);
match(/Cap Rate \/ Value Sensitivity/i);
match(/Occupancy × Expense NOI Matrix/i);
match(/Scenario Analysis - Not Source Evidence/i);
match(/data-iq-evidence-class="scenario"/i);
match(/88\.8%/i, "5pp occupancy stress should render");
match(/83\.8%/i, "10pp occupancy stress should render");
match(/\$865,000/i, "occupancy-stress NOI should render");
match(/\$917,250/i, "expense-stress NOI should render");
match(/7\.50%/i, "50bps cap stress should render");
match(/8\.00%/i, "100bps cap stress should render");
match(/\$12,600,000/i, "50bps implied value should render");
match(/\$11,812,500/i, "100bps implied value should render");
match(/downside sensitivity/i);
match(/not forecasts?/i);
match(/rent stress/i);
match(/interest rate stress/i);
match(/Not shown without a separately authorized complete cash-flow and equity basis/i);
noMatch(/>BUY</i);
noMatch(/>SELL</i);
noMatch(/>HOLD</i);
noMatch(/probability of/i);
noMatch(/expected return/i);

console.log(`PASS full-underwriting-scenario-renderer-smoke (${checks}/${checks})`);
