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
