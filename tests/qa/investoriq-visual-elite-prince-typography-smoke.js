import assert from "node:assert/strict";
import fs from "node:fs";
const visualCss = fs.readFileSync("api/_lib/investoriq-visual-elite-css.js", "utf8");
const parityCss = fs.readFileSync("api/_lib/investoriq-publication-parity-css.js", "utf8");
const baseCss = fs.readFileSync("api/_lib/investoriq-publication-base-css.js", "utf8");
assert.match(baseCss, /font-variant-numeric:tabular-nums/,
  "Regression fixture must continue to prove the upstream broad tabular-numeric source exists.");
assert.match(visualCss, /\.iq-phase8b \*[^{]*\{[^}]*font-variant-numeric:normal !important;/,
  "Visual ELITE must reset numeric OpenType features for all proportional publication descendants.");
assert.match(visualCss, /\.iq-phase8b table \{[^}]*font-variant-numeric:normal !important;/,
  "Whole tables must not inherit Prince tabular-space substitution.");
assert.ok(parityCss.includes("INVESTORIQ_VISUAL_ELITE_CSS"),
  "Shared parity CSS must continue to append the Visual ELITE override layer.");
assert.match(visualCss, /\.iq-phase8b \.section \{[\s\S]*?break-inside:avoid-page !important;[\s\S]*?page-break-inside:avoid !important;/,
  "Short publication sections must remain atomic when they fit on one page.");
console.log("investoriq-visual-elite-prince-typography-smoke: PASS");
