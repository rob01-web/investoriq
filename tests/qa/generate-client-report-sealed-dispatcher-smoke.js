import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const handlerSource = fs.readFileSync("api/_lib/generate-client-report-handler.js", "utf8");
const screeningRendererSource = fs.readFileSync("api/_lib/screening-report-renderer.js", "utf8");

assert.equal(reportSource.trim(), 'import handler from "./_lib/generate-client-report-handler.js";\n\nexport default handler;');
assert.match(handlerSource, /import implHandler from "\.\/generate-client-report-impl\.js";/);
assert.match(handlerSource, /export default async function handler\(req, res\) \{\s*return implHandler\(req, res\);\s*\}/s);
assert.equal(reportSource.includes("__test__"), false);
assert.equal(reportSource.includes("runScreeningReportPipeline"), false);
assert.equal(reportSource.includes("runAcquisitionMemoV2Pipeline"), false);
assert.equal(reportSource.includes("assertSealedOutputImmutable"), false);

const sealedOutputTerms = [
  "sealedLane: \"screening_lane\"",
  "sealedLane: \"acquisition_memo_v2_lane\"",
];
for (const term of sealedOutputTerms) {
  const path = term.includes("screening")
    ? "api/_lib/screening-report-pipeline.js"
    : "api/_lib/acquisition-memo-v2-pipeline.js";
  assert.equal(fs.readFileSync(path, "utf8").includes(term), true, `Missing ${term} in ${path}`);
}

assert.match(screeningRendererSource, /export function resolveScreeningClassificationConsumerLabel/);
assert.match(screeningRendererSource, /export function sanitizeScreeningRankedDriversHtml/);

console.log("generate-client-report-sealed-dispatcher-smoke: ok");
