import "./phase8-apply-repair-v2.mjs";
import fs from "node:fs";

const rel = "tests/qa/generate-client-report-rent-roll-smoke.js";
const source = fs.readFileSync(rel, "utf8");
const before = [
  'assert.match(handlerSource, /import implHandler from "\\.\\/generate-client-report-impl\\.js";/);',
  'assert.match(handlerSource, /export default async function handler\\(req, res\\) \\{\\s+return implHandler\\(req, res\\);\\s+\\}/s);',
].join("\n");
const after = [
  'assert.equal(/import implHandler from "\\.\\/generate-client-report-impl\\.js";/.test(handlerSource), false);',
  'assert.match(handlerSource, /const loadImplHandler = async \\(\\) => \\(await import\\("\\.\\/generate-client-report-impl\\.js"\\)\\)\\.default;/);',
  'assert.match(handlerSource, /export default async function handler\\(req, res\\) \\{[\\s\\S]*const implHandler = await loadImplHandler\\(\\);[\\s\\S]*return implHandler\\(req, res\\);[\\s\\S]*\\}/s);',
].join("\n");
const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`PHASE8_RENDER_HANDLER_ASSERTION_SEAM_MISMATCH:expected=1:actual=${count}`);
}
fs.writeFileSync(rel, source.replace(before, after), "utf8");
console.log("phase8-apply-repair-v3: PATCHED");
