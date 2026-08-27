import assert from "node:assert/strict";
import fs from "node:fs";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const coverFunction = documentSource.match(
  /function renderBrandCoverSection\([\s\S]*?\n\}\n\nfunction renderExecutiveSummarySection/,
)?.[0] || "";
const coverRule = documentSource.match(/\.cover-wrap\s*\{([^}]*)\}/i)?.[1] || "";
const coverCellRule = documentSource.match(/\.cover-cell\s*\{([^}]*)\}/i)?.[1] || "";
const coverPropertyRule = documentSource.match(/\.cover-prop-name\s*\{([^}]*)\}/i)?.[1] || "";
const rootRule = documentSource.match(/:root\s*\{([^}]*)\}/i)?.[1] || "";

assert.match(coverFunction, /data-iq-cover-system="elite-10b1-light-institutional-v1"/i);
assert.doesNotMatch(coverFunction, /cover-kicker|Full Underwriting/i);
assert.match(coverFunction, /class="cover-prop-name"/i);
assert.match(coverFunction, /class="cover-address"/i);
assert.match(coverFunction, /normalizedPropertyName/i);
assert.match(coverFunction, /\.filter\(\(value\) => value\.toLowerCase\(\) !== normalizedPropertyName\)/i);
assert.match(coverFunction, /class="cover-prop-sub">\$\{escapeHtml\(UNDERWRITING_REPORT_IDENTITY\.canonicalTitle\)\}/i);
assert.match(coverFunction, /class="cover-classification"/i);
assert.match(coverFunction, /Review Classification/i);
assert.match(coverFunction, /class="cover-meta-grid"/i);
assert.match(coverFunction, /Evidence Basis/i);
assert.match(coverFunction, /Confidential \| InvestorIQ Technologies Inc\./i);
assert.match(coverFunction, /Document-Backed Property Underwriting/i);

assert.doesNotMatch(coverFunction, /cover-metric-strip|cover-metric-row|cover-grid/i);
assert.doesNotMatch(coverFunction, /coverNoi|coverExpenseRatio|coverNoiMargin/i);
assert.doesNotMatch(coverFunction, /[—–]/);
assert.equal((coverFunction.match(/Confidential/gi) || []).length, 1);
const fixtureHtml = buildInstitutionalGate10ReportFixture("elite-10b1-fix2-final-cover-discipline").html;
const fixtureCoverHtml = fixtureHtml.match(/<div class="cover-wrap"[\s\S]*?<\/table>\s*<\/div>/i)?.[0] || "";
assert.ok(fixtureCoverHtml, "rendered cover fixture");
assert.match(fixtureCoverHtml, /class="cover-address">100 Main Street<\/div>/i);
assert.doesNotMatch(fixtureCoverHtml, /class="cover-address">[^<]*Institutional Gate 10 Property/i);
assert.doesNotMatch(fixtureCoverHtml, /cover-kicker|>Full Underwriting</i);

assert.match(rootRule, /--cover-bg\s*:\s*#FFFFFF/i);
assert.match(rootRule, /--cover-canvas\s*:\s*#FFFFFF/i);
assert.doesNotMatch(rootRule, /--cover-(?:bg|canvas)\s*:\s*#F5F2EA/i);

assert.match(coverRule, /height\s*:\s*10\.5in/i);
assert.match(coverRule, /overflow\s*:\s*hidden/i);
assert.match(coverRule, /background\s*:\s*var\(--cover-canvas\)/i);
assert.match(coverCellRule, /background\s*:\s*var\(--cover-canvas\)/i);
assert.doesNotMatch(`${coverRule}\n${coverCellRule}`, /background\s*:\s*var\(--forest(?:-deep)?\)/i);
assert.match(documentSource, /\.cover-wrap::before\s*\{[^}]*width\s*:\s*0\.18in[^}]*background\s*:\s*var\(--forest-deep\)/i);
assert.match(documentSource, /\.cover-wrap::after\s*\{[^}]*left\s*:\s*0\.82in[^}]*height\s*:\s*3px[^}]*background\s*:\s*var\(--gold\)/i);
assert.match(coverPropertyRule, /color\s*:\s*var\(--charcoal\)/i);
assert.doesNotMatch(coverPropertyRule, /color\s*:\s*var\(--white\)/i);

assert.equal((documentSource.match(/class="cover-prop-name"/gi) || []).length, 1);
assert.doesNotMatch(documentSource, /(?:target|expected|universal)[_-]?page[_-]?count\s*[:=]\s*\d+/i);

console.log("full-underwriting-elite10b1-cover-system-smoke: PASS");
