import assert from "node:assert/strict";
import fs from "node:fs";

const path = "api/_lib/acquisition-memo-v2-document.js";
const text = fs.readFileSync(path, "utf8");
let checks = 0;
function one(regex, label) {
  const matches = text.match(regex) || [];
  assert.equal(matches.length, 1, `${label}: expected exactly 1 occurrence, got ${matches.length}`);
  checks += 1;
}
function has(regex, label) {
  assert.match(text, regex, label);
  checks += 1;
}

one(/import \{ buildFullUnderwritingTransactionDiligenceV1 \} from "\.\/full-underwriting-transaction-diligence-v1\.js";/g, "ELITE-06 builder import");
one(/import \{ renderFullUnderwritingTransactionDiligenceV1Html \} from "\.\/full-underwriting-transaction-diligence-renderer\.js";/g, "ELITE-06 renderer import");
one(/let eliteTransactionDiligenceContract = null;/g, "ELITE-06 contract variable");
one(/let eliteTransactionDiligenceHtml = "";/g, "ELITE-06 html variable");
one(/buildFullUnderwritingTransactionDiligenceV1\(\{/g, "ELITE-06 build call");
one(/renderFullUnderwritingTransactionDiligenceV1Html\(eliteTransactionDiligenceContract\)/g, "ELITE-06 render call");
one(/ELITE Transaction & Diligence v1 surface fallback/g, "ELITE-06 fallback");
one(/\$\{eliteTransactionDiligenceHtml\}/g, "ELITE-06 chapter contribution");

const chapterStart = text.indexOf('data-iq-chapter="transaction-context"');
assert.ok(chapterStart >= 0, "Transaction Context chapter missing");
checks += 1;
const eliteIndex = text.indexOf("${eliteTransactionDiligenceHtml}", chapterStart);
const acquisitionIndex = text.indexOf("${acquisitionRequestContextSection}", chapterStart);
assert.ok(eliteIndex > chapterStart && eliteIndex < acquisitionIndex, "ELITE-06 must render before detailed acquisition context");
checks += 1;

has(/customerSurfaceModel,\s*\n\s*propertyProfile,\s*\n\s*reportMeta,/m, "ELITE-06 governed inputs");
assert.doesNotMatch(text.slice(text.indexOf("let eliteTransactionDiligenceContract"), text.indexOf("const unitMixSection")), /t12Payload|mortgagePayload|loanTermSheetTermsPayload|documentSources|raw/i, "ELITE-06 build must not consume raw payload lanes");
checks += 1;

assert.match(text, /data-iq-chapter="scenario-underwriting-drivers"/, "ELITE-05 scenario/driver chapter must remain");
checks += 1;
assert.match(text, /\$\{readinessSection\}/, "Existing readiness detail must remain");
checks += 1;
assert.match(text, /\$\{environmentalContextSection\}/, "Existing environmental detail must remain");
checks += 1;

console.log(`PASS full-underwriting-transaction-diligence-document-wiring-smoke (${checks}/${checks})`);
