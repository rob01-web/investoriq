import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const documentPath = path.join(repoRoot, "api/_lib/acquisition-memo-v2-document.js");
const text = fs.readFileSync(documentPath, "utf8");

let checks = 0;
function match(regex, message) { checks += 1; assert.match(text, regex, message); }
function check(condition, message) { checks += 1; assert.ok(condition, message); }

match(/buildFullUnderwritingScenarioEngineV1/);
match(/renderFullUnderwritingScenarioEngineV1Html/);
match(/let eliteScenarioEngineContract = null;/);
match(/let eliteScenarioEngineHtml = "";/);
match(/sourceTruthPackage,\s*operatingIntelligence: eliteOperatingIntelligenceContract,\s*customerSurfaceModel,\s*propertyProfile,\s*reportMeta,/s);
match(/ELITE Scenario Engine v1 surface fallback/);
match(/data-iq-chapter="scenario-underwriting-drivers"/);
match(/Scenario &amp; Underwriting Drivers/);
match(/\$\{eliteScenarioEngineHtml\}/);

const operatingIndex = text.indexOf('data-iq-chapter="operating-performance"');
const scenarioIndex = text.indexOf('data-iq-chapter="scenario-underwriting-drivers"');
const transactionIndex = text.indexOf('data-iq-chapter="transaction-context"');
check(operatingIndex >= 0 && scenarioIndex > operatingIndex && transactionIndex > scenarioIndex, "scenario chapter order invalid");

const scenarioBuildStart = text.indexOf("buildFullUnderwritingScenarioEngineV1({");
const scenarioBuildEnd = scenarioBuildStart >= 0 ? text.indexOf("});", scenarioBuildStart) : -1;
const scenarioBuild = scenarioBuildStart >= 0 && scenarioBuildEnd > scenarioBuildStart
  ? text.slice(scenarioBuildStart, scenarioBuildEnd + 3)
  : "";
check(Boolean(scenarioBuild), "scenario build call missing");
for (const forbidden of ["t12Payload", "rentRollPayload", "mortgagePayload", "acquisitionTermsPayload", "loanTermSheetTermsPayload", "renderedAcquisitionMemo"]) {
  checks += 1;
  assert.doesNotMatch(scenarioBuild, new RegExp(forbidden), `raw/legacy input leaked into scenario engine: ${forbidden}`);
}

console.log(`PASS full-underwriting-scenario-document-wiring-smoke (${checks}/${checks})`);
