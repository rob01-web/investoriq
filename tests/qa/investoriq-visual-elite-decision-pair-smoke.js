import assert from "node:assert/strict";
import {
  INVESTORIQ_VISUAL_ELITE_CSS,
  INVESTORIQ_VISUAL_ELITE_DECISION_VERSION,
} from "../../api/_lib/investoriq-visual-elite-css.js";

const css = String(INVESTORIQ_VISUAL_ELITE_CSS || "");
assert.equal(INVESTORIQ_VISUAL_ELITE_DECISION_VERSION, "investoriq-visual-elite-decision-v1");
for (const selector of [
  ".phase8b-screening-decision-band",
  ".phase8a-investment-decision-band",
  ".phase8b-screening-metric-matrix",
  ".phase8a-investment-snapshot-table",
  ".phase8b-screening-decision-panels",
  ".phase8a-exec-columns",
]) assert.ok(css.includes(selector), `missing coordinated decision selector ${selector}`);
assert.ok(css.includes("border-left:3px solid var(--iq-ve-gold)"));
assert.ok(css.includes("background:var(--iq-ve-paper-alt)"));
assert.ok(css.includes("font-size:18pt"));
assert.ok(css.includes("tr:not(:first-child)"));
assert.ok(css.includes("break-inside:avoid-page"));
console.log("InvestorIQ Visual ELITE decision pair smoke: PASS");
