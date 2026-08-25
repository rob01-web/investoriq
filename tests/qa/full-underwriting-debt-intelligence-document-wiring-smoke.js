import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
let passed = 0;
function check(condition, message) { assert.ok(condition, message); passed += 1; }

check(source.includes('buildFullUnderwritingDebtIntelligenceV1'), "engine import/wiring present");
check(source.includes('renderFullUnderwritingDebtIntelligenceV1Html'), "renderer import/wiring present");
check(source.includes('let eliteDebtIntelligenceContract = null;'), "debt contract build present");
check(source.includes('let eliteDebtIntelligenceHtml = "";'), "debt HTML build present");
check(source.includes('customerSurfaceModel,'), "customer surface model passed");
check(source.includes('reportMeta,'), "report meta passed");
check(source.includes('propertyProfile,'), "property profile passed");
check(source.includes('[investoriq] ELITE Debt Intelligence v1 surface fallback'), "non-blocking fallback present");
check(source.includes('${eliteDebtIntelligenceHtml}'), "debt HTML composed");

const debtChapter = source.indexOf('data-iq-chapter="debt-capital-structure"');
const elite = source.indexOf('${eliteDebtIntelligenceHtml}', debtChapter);
const debtContext = source.indexOf('${debtFinancingContextSection}', debtChapter);
const debtCoverage = source.indexOf('${debtServiceCoverageSection}', debtChapter);
check(debtChapter >= 0, "debt chapter present");
check(elite > debtChapter, "ELITE-07 renders inside debt chapter");
check(debtContext > elite, "legacy debt context remains after ELITE-07 summary");
check(debtCoverage > elite, "legacy debt coverage remains after ELITE-07 summary");
check((source.match(/eliteDebtIntelligenceHtml/g) || []).length >= 3, "debt HTML variable used in build and composition");
check(!source.includes('currentDebtRateShockAllowed: true'), "document wiring cannot authorize current debt shock");

console.log(`PASS full-underwriting-debt-intelligence-document-wiring-smoke (${passed}/${passed})`);
