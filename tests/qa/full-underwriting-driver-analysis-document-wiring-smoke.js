import assert from "node:assert/strict";
import fs from "node:fs";

const path = "api/_lib/acquisition-memo-v2-document.js";
const text = fs.readFileSync(path, "utf8");
let passed = 0;
function check(condition, message) {
  assert.ok(condition, message);
  passed += 1;
}
function exactlyOnce(pattern, message) {
  const matches = text.match(pattern) || [];
  assert.equal(matches.length, 1, `${message}: found ${matches.length}`);
  passed += 1;
}

exactlyOnce(/import \{ buildFullUnderwritingDriverAnalysisV1 \} from "\.\/full-underwriting-driver-analysis-v1\.js";/g, "driver builder import");
exactlyOnce(/import \{ renderFullUnderwritingDriverAnalysisV1Html \} from "\.\/full-underwriting-driver-analysis-renderer\.js";/g, "driver renderer import");
exactlyOnce(/let eliteDriverAnalysisContract = null;/g, "driver contract declaration");
exactlyOnce(/let eliteDriverAnalysisHtml = "";/g, "driver HTML declaration");
exactlyOnce(/buildFullUnderwritingDriverAnalysisV1\(\{/g, "driver contract build call");
exactlyOnce(/scenarioEngine: eliteScenarioEngineContract/g, "driver consumes ELITE-04 engine");
exactlyOnce(/renderFullUnderwritingDriverAnalysisV1Html\(eliteDriverAnalysisContract\)/g, "driver renderer call");
exactlyOnce(/\$\{eliteDriverAnalysisHtml\}/g, "driver chapter contribution");
check(text.indexOf("${eliteScenarioEngineHtml}") < text.indexOf("${eliteDriverAnalysisHtml}"), "driver analysis follows scenario engine in chapter");
check(text.indexOf("${eliteDriverAnalysisHtml}") < text.indexOf('data-iq-chapter="transaction-context"'), "driver analysis stays before transaction chapter");
check(text.includes('data-iq-chapter="scenario-underwriting-drivers"'), "scenario/driver chapter remains present");
check(!/full-underwriting-driver-analysis-v1[^\n]*admin-run-worker|admin-run-worker[^\n]*full-underwriting-driver-analysis-v1/i.test(text), "no worker coupling");
check(!/full-underwriting-driver-analysis-v1[^\n]*publication|publication[^\n]*full-underwriting-driver-analysis-v1/i.test(text), "no publication coupling");
check(!/full-underwriting-driver-analysis-v1[^\n]*delivery|delivery[^\n]*full-underwriting-driver-analysis-v1/i.test(text), "no delivery coupling");

console.log(`PASS full-underwriting-driver-analysis-document-wiring-smoke (${passed}/${passed})`);
