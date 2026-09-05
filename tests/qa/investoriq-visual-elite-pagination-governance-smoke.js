import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INVESTORIQ_PUBLICATION_PARITY_CSS } from "../../api/_lib/investoriq-publication-parity-css.js";
import { INVESTORIQ_VISUAL_ELITE_CSS } from "../../api/_lib/investoriq-visual-elite-css.js";
import { INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS } from "../../api/_lib/investoriq-visual-elite-exhibits.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const operatingRenderer = fs.readFileSync(path.resolve(here, "../../api/_lib/full-underwriting-operating-intelligence-renderer.js"), "utf8");
const css = `${INVESTORIQ_PUBLICATION_PARITY_CSS}\n${INVESTORIQ_VISUAL_ELITE_CSS}\n${INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS}`;

assert.ok(operatingRenderer.includes("Accepted Expense Lines"));
assert.ok(!/\.slice\(0,\s*6\)/.test(operatingRenderer), "accepted expense rows must not be capped at six");
assert.ok(operatingRenderer.includes('class="card ${keepTogether ? "no-break" : "allow-break"}'), "long operating sections must retain flow authority");

assert.ok(css.includes("display:table-header-group"), "continuing tables must repeat headers");
assert.ok(css.includes("break-inside:avoid"), "table rows and bounded exhibits need split protection");
assert.ok(css.includes("break-after:avoid-page"), "section headings need orphan protection");
assert.ok(css.includes("bookmark-level:1"), "PDF section navigation must remain enabled");
assert.ok(css.includes("phase8b-source-register"), "source register styling must remain in publication authority");
assert.ok(css.includes("overflow-wrap:anywhere"), "long source text needs wrapping support");
assert.ok(!css.includes(".sheet{"), "prototype fixed sheets must never become production pagination authority");
assert.ok(!css.includes("max-page"));
assert.ok(!css.includes("hard-page-cap"));
assert.ok(!css.includes("page-count-limit"));

const fixedLetterHeightMatches = [...css.matchAll(/height:\s*10\.5in/gi)].length;
assert.ok(fixedLetterHeightMatches >= 1, "the cover may retain fixed Letter height");
assert.ok(css.includes(".cover-wrap"), "fixed height must remain cover-oriented");

console.log("InvestorIQ Visual ELITE pagination and governance smoke: PASS");
