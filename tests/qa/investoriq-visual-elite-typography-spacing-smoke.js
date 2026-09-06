import assert from "node:assert/strict";
import fs from "node:fs";
import { INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS } from "../../api/_lib/investoriq-visual-elite-typography-css.js";
import { applyPhase8BCrossProductPublicationAuthority } from "../../api/_lib/phase8b-cross-product-publication-authority.js";

const authority = fs.readFileSync("api/_lib/phase8b-cross-product-publication-authority.js", "utf8");
const css = INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS;

assert.match(css, /font-variant-numeric:proportional-nums !important;/, "Customer-facing typography must override global tabular numerals.");
assert.match(css, /font-feature-settings:"kern" 1, "pnum" 1 !important;/, "Customer-facing typography must enable kerning and proportional numerals.");
assert.match(css, /\.iq-phase8b table,[\s\S]*?font-variant-numeric:tabular-nums !important;/, "Technical tables must retain tabular numerals.");
assert.match(css, /phase8a-investment-snapshot-table tr:first-child td strong[\s\S]*?letter-spacing:-\.022em !important;/, "Large underwriting KPI values must use tighter tracking.");
assert.match(css, /phase8a-investment-decision-band span[\s\S]*?letter-spacing:\.045em !important;/, "Decision labels must not retain excessive tracking.");
assert.match(css, /data-iq-elite-section="keyMetricsSnapshot"[\s\S]*?data-iq-elite-operating="noi-margin-analysis"[\s\S]*?data-iq-elite-scenario-section="operating-expense-stress"[\s\S]*?break-inside:avoid-page !important;/, "Confirmed short Prince sections must remain atomic with their headings.");
assert.match(authority, /INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS/, "Phase 8B authority must import shared typography normalization.");

const sample = '<html><head></head><body><div class="report-container"><section class="section"><div class="section-header"><span class="section-header-title">Key Metrics Snapshot</span></div><div class="card allow-break"><strong>$13,500,000</strong></div></section></div></body></html>';
const out = applyPhase8BCrossProductPublicationAuthority(sample, { lane: "underwriting" });
assert.ok(out.includes(INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS), "Typography normalization must be injected into the final customer publication CSS.");

console.log("investoriq-visual-elite-typography-spacing-smoke: PASS");
