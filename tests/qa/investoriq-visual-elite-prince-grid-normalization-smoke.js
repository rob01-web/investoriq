import assert from "node:assert/strict";
import { INVESTORIQ_VISUAL_ELITE_PRINCE_LAYOUT_CSS } from "../../api/_lib/investoriq-visual-elite-prince-layout-css.js";
import { INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS } from "../../api/_lib/investoriq-visual-elite-typography-css.js";

const css = INVESTORIQ_VISUAL_ELITE_PRINCE_LAYOUT_CSS;

assert.match(css, /\.iq-phase8b \.iq-ic-metric-grid \{[\s\S]*?display:flex !important;[\s\S]*?flex-wrap:wrap !important;/,
  "Key Metrics must use Prince-safe wrapping flex instead of CSS Grid.");
assert.match(css, /\.iq-phase8b \.iq-ic-secondary-grid \{[\s\S]*?display:flex !important;/,
  "Secondary metric rows must use Prince-safe flex.");
assert.match(css, /\.iq-phase8b \.iq-ic-reconciliation-grid,[\s\S]*?display:flex !important;/,
  "Source reconciliation metrics must remain horizontal in Prince.");
assert.match(css, /\.iq-phase8b \.summary-strip \{[\s\S]*?display:flex !important;/,
  "Operating and diligence summary strips must not fall back to stacked CSS Grid in Prince.");
assert.match(css, /data-iq-elite-operating[^}]*summary-strip > div[\s\S]*?width:25% !important;/,
  "Operating summary strips must preserve four compact columns.");
assert.match(css, /data-iq-elite06-surface=\"diligence-coverage\"[^}]*summary-strip > div[\s\S]*?width:33\.333% !important;/,
  "Diligence coverage must preserve three compact columns.");
assert.match(css, /\.iq-phase8b \.grid-2-balanced \{[\s\S]*?display:flex !important;/,
  "Balanced debt and support columns must use Prince-safe flex.");
assert.match(css, /\.iq-phase8b \.evidence-chart-row \{[\s\S]*?display:flex !important;/,
  "Evidence chart rows must preserve label/bar/value composition without CSS Grid.");
assert.match(css, /\.iq-phase8b \.methodology-compact-grid \{[\s\S]*?display:flex !important;/,
  "Methodology compact grids must be Prince-safe.");
assert.ok(INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS.includes(INVESTORIQ_VISUAL_ELITE_PRINCE_LAYOUT_CSS),
  "The final injected typography authority must append Prince-safe layout normalization last.");
assert.doesNotMatch(css, /display:grid !important;/,
  "Prince-safe normalization must not introduce a new CSS Grid dependency.");

console.log("investoriq-visual-elite-prince-grid-normalization-smoke: PASS");
