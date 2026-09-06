import assert from "node:assert/strict";
import fs from "node:fs";
import { INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS } from "../../api/_lib/investoriq-visual-elite-typography-css.js";

const renderer = fs.readFileSync("api/_lib/full-underwriting-operating-intelligence-renderer.js", "utf8");
const css = INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS;

assert.match(renderer, /iq-ve-noi-heading-bridge-lock no-break/, "NOI heading and earnings bridge must share a bounded structural wrapper.");
assert.match(renderer, /iq-ve-noi-supporting-metrics/, "NOI supporting metrics must live outside the bounded bridge wrapper.");
assert.match(renderer, /card allow-break iq-ve-noi-supporting-metrics/, "NOI evidence table must remain free to paginate naturally.");
assert.doesNotMatch(css, /section\[data-iq-elite-operating="noi-margin-analysis"\][^{]*\{[\s\S]*?break-inside:avoid-page !important;/,
  "The whole NOI section must not be atomic.");
assert.match(css, /\.iq-phase8b \.iq-ve-noi-heading-bridge-lock \{[\s\S]*?break-inside:avoid-page !important;/,
  "The bounded NOI lead must remain atomic in paged output.");

console.log("investoriq-visual-elite-noi-page-balance-smoke: PASS");
