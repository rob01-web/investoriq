import assert from "node:assert/strict";
import fs from "node:fs";

const screening = fs.readFileSync("api/_lib/phase8b-cross-product-publication-authority.js", "utf8");
const underwriting = fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-renderer.js", "utf8");
const designSystem = fs.readFileSync("api/_lib/investoriq-publication-design-system.js", "utf8");
const visualCss = fs.readFileSync("api/_lib/investoriq-visual-elite-css.js", "utf8");

assert.match(
  screening,
  /title:\s*"Screening Decision Snapshot"[\s\S]*?legacySectionLabel:\s*"Executive Summary",\s*allowBreak:\s*true,\s*bodyClass:\s*"phase8b-screening-decision-page"/,
  "Screening decision summary must allow page flow instead of wrapping the entire summary in no-break."
);

assert.match(
  underwriting,
  /title:\s*"Investment Decision Snapshot"[\s\S]*?legacySectionLabel:\s*"Executive Summary",\s*allowBreak:\s*true,\s*bodyClass:\s*"iq-ic-summary-card phase8a-executive-summary"/,
  "Underwriting decision summary must allow page flow instead of wrapping the entire summary in no-break."
);

assert.match(
  designSystem,
  /const bodyClasses = \["card", allowBreak \? "allow-break" : "no-break", bodyClass\]/,
  "Publication primitive must continue to make no-break the explicit default for bounded sections."
);

assert.match(
  visualCss,
  /\.iq-phase8b \.phase8b-screening-decision-band,[\s\S]*?break-inside:avoid-page !important;[\s\S]*?page-break-inside:avoid !important;/,
  "The bounded decision-status band itself must remain protected from an internal page split."
);

assert.match(
  visualCss,
  /\.iq-phase8b table thead \{ display:table-header-group !important; \}/,
  "Long decision tables must preserve repeated table headers when they flow."
);

console.log("investoriq-visual-elite-decision-pagination-smoke: PASS");

assert.match(visualCss, /\.cover-meta-grid \{[\s\S]*?display:table !important;[\s\S]*?table-layout:fixed !important;/,
  "Cover metadata must use a Prince-safe table layout instead of CSS Grid.");
assert.match(visualCss, /\.phase8b-screening-decision-band,[\s\S]*?display:table !important;[\s\S]*?caption-side:top !important;/,
  "Decision status band must use a Prince-safe table/caption layout.");
assert.match(visualCss, /\.phase8b-screening-profile-strip \{[^}]*display:flex !important;[^}]*flex-wrap:wrap !important;/,
  "Screening profile matrix must use Prince-safe wrapping flex layout.");
assert.match(visualCss, /\.phase8b-screening-decision-panels,[\s\S]*?\.phase8a-exec-columns \{[^}]*display:table !important;[^}]*table-layout:fixed !important;/,
  "Decision panels must use Prince-safe table layout.");
assert.doesNotMatch(visualCss, /\.phase8b-screening-decision-panels,[\s\S]{0,220}?display:grid !important;/,
  "Decision panels must not regress to CSS Grid in the Prince-critical opening.");
console.log("investoriq-visual-elite-prince-parity: PASS");

assert.match(
  visualCss,
  /\.iq-phase8b \.section-header \{[\s\S]*?break-after:avoid-page !important;[\s\S]*?page-break-after:avoid !important;/,
  "Major section headings must remain attached to the first meaningful content block in Prince pagination."
);
console.log("investoriq-visual-elite-orphan-heading: PASS");

assert.match(
  visualCss,
  /\.iq-phase8b \.section > \.card \{[\s\S]*?break-before:avoid-page !important;[\s\S]*?page-break-before:avoid !important;/,
  "Section body must not begin on a new Prince page immediately after its own heading."
);
console.log("investoriq-visual-elite-section-body-keep: PASS");
