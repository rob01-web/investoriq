import assert from "node:assert/strict";
import { INVESTORIQ_PUBLICATION_PARITY_CSS } from "../../api/_lib/investoriq-publication-parity-css.js";
import { INVESTORIQ_VISUAL_ELITE_CSS, INVESTORIQ_VISUAL_ELITE_CSS_VERSION } from "../../api/_lib/investoriq-visual-elite-css.js";

const css = String(INVESTORIQ_VISUAL_ELITE_CSS || "");
const parity = String(INVESTORIQ_PUBLICATION_PARITY_CSS || "");

assert.equal(INVESTORIQ_VISUAL_ELITE_CSS_VERSION, "investoriq-visual-elite-shell-v1");
assert.ok(parity.includes(css));
assert.ok(css.includes("background:var(--iq-ve-forest) !important"));
assert.ok(css.includes("font-size:52pt !important"));
assert.match(css, /\.cover-meta-grid \{[\s\S]*?display:table !important;[\s\S]*?table-layout:fixed !important;/);
assert.match(css, /\.cover-meta-grid > div \{[\s\S]*?width:33\.333% !important;/);
assert.ok(css.includes("font-family:var(--font-display) !important"));
assert.ok(css.includes("font-family:var(--font-mono) !important"));
assert.ok(css.includes("display:table-header-group"));
assert.ok(css.includes("break-inside:avoid"));
assert.ok(css.includes(".iq-phase8b .section-header-title"));
assert.ok(css.includes(".iq-phase8b table td"));
assert.ok(css.includes(".iq-phase8b .cover-wrap"));
assert.ok(!css.includes(".sheet{"));
assert.ok(!css.includes("max-page"));
assert.ok(!css.includes("page-count"));
assert.ok(!css.includes("nth-page"));

console.log("InvestorIQ Visual ELITE shared shell smoke: PASS");
