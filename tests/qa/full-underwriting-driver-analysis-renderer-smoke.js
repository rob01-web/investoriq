import assert from "node:assert/strict";
import { buildFullUnderwritingScenarioEngineV1 } from "../../api/_lib/full-underwriting-scenario-engine-v1.js";
import { buildFullUnderwritingDriverAnalysisV1 } from "../../api/_lib/full-underwriting-driver-analysis-v1.js";
import { renderFullUnderwritingDriverAnalysisV1Html } from "../../api/_lib/full-underwriting-driver-analysis-renderer.js";

let passed = 0;
function check(condition, message) {
  assert.ok(condition, message);
  passed += 1;
}
function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  passed += 1;
}

function metric(key, value, units, evidenceClass = "source_backed") {
  return { key, value, units, evidenceClass, displayReady: true, authorityPath: `metrics.${key}`, provenance: [`core.${key}`] };
}

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "elite-05-renderer",
  property_name: "Renderer Property",
  core_publishable: true,
  core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
};
const operatingIntelligence = {
  version: "full_underwriting_operating_intelligence_v1",
  authority: { sourceTruthMutationAllowed: false, scenarioAllowed: false },
  sourceTruthReceipt: { source: "canonical_source_truth_package", coreSourceMode: "dual_source_core" },
  identity: { propertyName: "Renderer Property" },
  metrics: {
    units: metric("units", 100, "count"),
    occupancy: metric("occupancy", 0.95, "ratio"),
    egi: metric("egi", 1500000, "currency"),
    operatingExpenses: metric("operatingExpenses", 600000, "currency"),
    noi: metric("noi", 900000, "currency", "deterministic_calculated"),
    noiMargin: metric("noiMargin", 0.60, "ratio", "deterministic_calculated"),
  },
};
const customerSurfaceModel = {
  sections: {
    acquisitionRequestContext: {
      factAvailability: { sourceBacked: true },
      facts: { purchase_price: 13000000, going_in_cap_rate: 0.07 },
    },
  },
};
const scenarioEngine = buildFullUnderwritingScenarioEngineV1({ sourceTruthPackage, operatingIntelligence, customerSurfaceModel });
const contract = buildFullUnderwritingDriverAnalysisV1({ scenarioEngine });
const html = renderFullUnderwritingDriverAnalysisV1Html(contract);

check(html.length > 500, "renderer returns substantive HTML");
check(html.includes("Sensitivity Reference"), "driver heading");
check(html.includes("Sensitivity Interpretation"), "interpretation heading");
check(html.includes("Sensitivity Families Outside This Driver Matrix"), "scope heading");
check(html.includes('data-iq-driver-table="v2"'), "driver table marker");
check(html.includes('data-iq-driver-key="occupancy"'), "occupancy row");
check(html.includes('data-iq-driver-key="operatingExpenses"'), "expense row");
check(html.includes('data-iq-driver-key="capRate"'), "cap rate row");
check((html.match(/data-iq-evidence-class="scenario"/g) || []).length >= 4, "scenario evidence attributes");
check(html.includes("Relative Movement Within Target"), "relative movement column");
check(html.includes("Driver &amp; Base"), "combined driver/base column");
check(html.includes("Occupancy stress"), "occupancy basis visible");
check(html.includes("Base $600,000"), "currency driver base includes its dollar sign");
check(!/\bgoverned\b/i.test(html.replace(/<[^>]+>/g, " ")), "customer-visible governed engineering language absent");
check(html.includes("Compound Downside Context"), "compound context rendered");
check(html.includes("conditional tests"), "conditional-test caveat rendered");
check(html.includes("not probabilities"), "probability caveat rendered");
check(html.includes("Interest Rate"), "interest-rate scope row rendered");
check(html.includes("Proposed-financing interest-rate sensitivity is presented in Debt Capacity &amp; Coverage when accepted proposed financing terms support it"), "interest-rate cross-reference is accurate and conditional");
check(html.includes("it is outside this driver matrix"), "driver-matrix boundary stated");
check(html.includes("Outside this matrix does not mean absent from the report"), "cross-section scope explained");
check(html.includes("Debt Amount"), "debt amount scope row rendered");
check(html.includes("debt-service capacity are addressed in Debt Capacity &amp; Coverage when supported"), "debt scope cross-reference rendered");
check(html.includes("Major CapEx"), "capex scope row rendered");
check(html.includes("Tax Expense"), "tax scope row rendered");
check(!/interest-rate stress family is available/i.test(html), "stale interest-rate deferred copy absent");
check(!/deferred to the .*debt/i.test(html), "stale future debt-upgrade wording absent");
check(!/source-backed/i.test(html.replace(/data-iq-[^=]+="[^"]*"/g, "")), "internal source-backed phrase absent from visible HTML");
check(!/high risk|moderate risk|low risk/i.test(html), "no inferred risk labels");
check(!/\bBUY\b|\bSELL\b|\bHOLD\b/.test(html), "no recommendation language");
check(!/IRR|MOIC/.test(html), "no prohibited return metrics");

const invalid = JSON.parse(JSON.stringify(contract));
invalid.authority.investmentRecommendationAllowed = true;
let renderError = null;
try {
  renderFullUnderwritingDriverAnalysisV1Html(invalid);
} catch (err) {
  renderError = err;
}
check(Boolean(renderError), "invalid contract rejected by renderer");
check(String(renderError?.message || "").startsWith("ELITE_DRIVER_ANALYSIS_CONTRACT_INVALID:"), "renderer error prefix");

equal(typeof html, "string", "HTML is a string");
console.log(`PASS full-underwriting-driver-analysis-renderer-smoke (${passed}/${passed})`);
