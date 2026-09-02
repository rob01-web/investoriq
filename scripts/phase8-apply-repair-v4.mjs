import "./phase8-apply-repair-v3.mjs";
import fs from "node:fs";

const rel = "tests/qa/generate-client-report-rent-roll-smoke.js";
const source = fs.readFileSync(rel, "utf8");
const before = 'assert.match(reportSource, /pdf_artifact_mode:\\s*reportDownloadArtifactMode/);';
const after = 'assert.match(reportSource, /pdf_artifact_mode:\\s*finalPdfPublicationContract\\.artifactMode/);';
const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`PHASE8_PDF_ARTIFACT_MODE_ASSERTION_SEAM_MISMATCH:expected=1:actual=${count}`);
}
fs.writeFileSync(rel, source.replace(before, after), "utf8");
console.log("phase8-apply-repair-v4: PATCHED");
