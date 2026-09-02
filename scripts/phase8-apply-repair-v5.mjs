import "./phase8-apply-repair-v4.mjs";
import fs from "node:fs";

const rel = "tests/qa/generate-client-report-rent-roll-smoke.js";
const source = fs.readFileSync(rel, "utf8");
const before = '  assert.match(fullRenderHtml, /Rent Position \\/ Whole-Property Value Context/i);';
const after = [
  '  assert.match(fullRenderHtml, /Valuation Position & Reconciliation/i);',
  '  assert.match(fullRenderHtml, /Accepted-Basis Value Indication/i);',
].join("\n");
const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`PHASE8_VALUATION_SECTION_ASSERTION_SEAM_MISMATCH:expected=1:actual=${count}`);
}
fs.writeFileSync(rel, source.replace(before, after), "utf8");
console.log("phase8-apply-repair-v5: PATCHED");
