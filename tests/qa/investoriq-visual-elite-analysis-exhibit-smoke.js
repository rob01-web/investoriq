import assert from "node:assert/strict";
import {
  INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS,
  renderVisualEliteOperatingEarningsBridge,
} from "../../api/_lib/investoriq-visual-elite-exhibits.js";

const receipt = (value) => ({ displayReady: true, value });
const html = renderVisualEliteOperatingEarningsBridge({
  egi: receipt(1500000),
  operatingExpenses: receipt(555000),
  noi: receipt(945000),
  noiMargin: receipt(0.63),
  noiIdentityReconciles: true,
});

assert.ok(html.includes('data-iq-visual-elite-exhibit="t12-earnings-bridge-v1"'));
assert.ok(html.includes("$1,500,000"));
assert.ok(html.includes("$555,000"));
assert.ok(html.includes("$945,000"));
assert.ok(html.includes("63.0% of EGI"));
assert.ok(html.includes("investoriq-visual-elite-analysis-v1"));
assert.ok(html.includes("<svg"));
assert.ok(html.includes("viewBox=\"0 0 720 202\""));

assert.equal(renderVisualEliteOperatingEarningsBridge({
  egi: receipt(1500000),
  operatingExpenses: receipt(555000),
  noi: receipt(945000),
  noiIdentityReconciles: false,
}), "");

assert.equal(renderVisualEliteOperatingEarningsBridge({
  egi: receipt(1500000),
  operatingExpenses: receipt(555000),
  noi: receipt(1000000),
  noiIdentityReconciles: true,
}), "");

assert.ok(INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS.includes('[data-iq-elite="debt-intelligence-v1"]'));
assert.ok(INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS.includes('[data-iq-elite="transaction-diligence-v1"]'));
assert.ok(INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS.includes('[data-iq-section="eliteValuationReconciliation"]'));
assert.ok(INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS.includes("phase8b-screening-evidence-page"));
assert.ok(INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS.includes("display:table-header-group"));
assert.ok(!INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS.includes("max-page"));
assert.ok(!INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS.includes("page-count"));

console.log("InvestorIQ Visual ELITE analysis exhibit smoke: PASS");
