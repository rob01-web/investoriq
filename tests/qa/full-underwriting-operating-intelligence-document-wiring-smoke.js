import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../../api/_lib/acquisition-memo-v2-document.js", import.meta.url), "utf8");
assert.match(source, /buildFullUnderwritingOperatingIntelligenceContract/);
assert.match(source, /renderFullUnderwritingOperatingIntelligenceHtml/);
assert.match(source, /let eliteOperatingIntelligenceContract = null;/);
assert.match(source, /let eliteOperatingIntelligenceHtml = "";/);
assert.match(source, /sourceTruthPackage,[\s\S]*customerSurfaceModel,[\s\S]*coreMetrics,[\s\S]*propertyProfile,[\s\S]*reportMeta/);
assert.match(source, /\$\{eliteOperatingIntelligenceHtml\}[\s\S]*\$\{operatingVisualsSection\}/);
assert.match(source, /\$\{unitMixSection\}/);
assert.match(source, /Operating Statement \/ TTM Summary/);
assert.match(source, /\$\{marketSurveyContextSection\}/);
assert.match(source, /\$\{valueSensitivitySection\}/);
assert.doesNotMatch(source, /full-underwriting-operating-intelligence[^\n]*(worker|publication|delivery|revision)/i);
console.log("PASS full-underwriting-operating-intelligence-document-wiring-smoke (11/11)");
