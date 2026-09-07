import assert from "node:assert/strict";
import fs from "node:fs";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

const wrapperSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document-base.js", "utf8");
const designSystemSource = fs.readFileSync("api/_lib/investoriq-publication-design-system.js", "utf8");
const cssSource = fs.readFileSync("api/_lib/investoriq-publication-base-css-base.js", "utf8");

assert.match(wrapperSource, /from "\.\/acquisition-memo-v2-document-base\.js"/i);
assert.match(documentSource, /renderPublicationCover\(\{/i, "Underwriting document must delegate cover composition to shared publication authority");
assert.match(designSystemSource, /data-iq-cover-system="elite-10b1-light-institutional-v1"/i);
assert.doesNotMatch(designSystemSource, /cover-kicker|>Full Underwriting</i);

const fixtureHtml = buildInstitutionalGate10ReportFixture("elite-10b1-final-cover-discipline").html;
const fixtureCoverHtml = fixtureHtml.match(/<div class="cover-wrap"[\s\S]*?<\/table>\s*<\/div>/i)?.[0] || "";
assert.ok(fixtureCoverHtml, "rendered cover fixture");
assert.match(fixtureCoverHtml, /data-iq-cover-system="elite-10b1-light-institutional-v1"/i);
assert.match(fixtureCoverHtml, /class="cover-prop-name"/i);
assert.match(fixtureCoverHtml, /class="cover-address">100 Main Street<\/div>/i);
assert.doesNotMatch(fixtureCoverHtml, /class="cover-address">[^<]*Institutional Gate 10 Property/i);
assert.match(fixtureCoverHtml, /class="cover-prop-sub">Underwriting Report<\/div>/i);
assert.match(fixtureCoverHtml, /class="cover-classification"/i);
assert.match(fixtureCoverHtml, /Review Classification/i);
assert.match(fixtureCoverHtml, /class="cover-meta-grid"/i);
assert.match(fixtureCoverHtml, /Evidence Basis/i);
assert.match(fixtureCoverHtml, /Confidential \| InvestorIQ Technologies Inc\./i);
assert.match(fixtureCoverHtml, /Document-Backed Property Underwriting/i);
assert.doesNotMatch(fixtureCoverHtml, /cover-kicker|>Full Underwriting</i);
assert.doesNotMatch(fixtureCoverHtml, /cover-metric-strip|cover-metric-row|cover-grid/i);
assert.doesNotMatch(fixtureCoverHtml, /[—–]/);
assert.equal((fixtureCoverHtml.match(/Confidential/gi) || []).length, 1);

const coverRule = cssSource.match(/\.cover-wrap\s*\{([^}]*)\}/i)?.[1] || "";
const coverCellRule = cssSource.match(/\.cover-cell\s*\{([^}]*)\}/i)?.[1] || "";
const coverPropertyRule = cssSource.match(/\.cover-prop-name\s*\{([^}]*)\}/i)?.[1] || "";
const rootRule = cssSource.match(/:root\s*\{([^}]*)\}/i)?.[1] || "";

assert.match(rootRule, /--cover-bg\s*:\s*#FFFFFF/i);
assert.match(rootRule, /--cover-canvas\s*:\s*#FFFFFF/i);
assert.doesNotMatch(rootRule, /--cover-(?:bg|canvas)\s*:\s*#F5F2EA/i);
assert.match(coverRule, /height\s*:\s*10\.5in/i);
assert.match(coverRule, /overflow\s*:\s*hidden/i);
assert.match(coverRule, /background\s*:\s*var\(--cover-canvas\)/i);
assert.match(coverCellRule, /background\s*:\s*var\(--cover-canvas\)/i);
assert.doesNotMatch(`${coverRule}\n${coverCellRule}`, /background\s*:\s*var\(--forest(?:-deep)?\)/i);
assert.match(cssSource, /\.cover-wrap::before\s*\{[^}]*width\s*:\s*0\.18in[^}]*background\s*:\s*var\(--forest-deep\)/i);
assert.match(cssSource, /\.cover-wrap::after\s*\{[^}]*left\s*:\s*0\.82in[^}]*height\s*:\s*3px[^}]*background\s*:\s*var\(--gold\)/i);
assert.match(coverPropertyRule, /color\s*:\s*var\(--charcoal\)/i);
assert.doesNotMatch(coverPropertyRule, /color\s*:\s*var\(--white\)/i);

assert.equal((designSystemSource.match(/class="cover-prop-name"/gi) || []).length, 1);
assert.doesNotMatch(`${documentSource}\n${designSystemSource}\n${cssSource}`, /(?:target|expected|universal)[_-]?page[_-]?count\s*[:=]\s*\d+/i);

console.log("full-underwriting-elite10b1-cover-system-smoke: PASS");
