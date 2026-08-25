import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const documentPath = path.resolve(repoRoot, "api/_lib/acquisition-memo-v2-document.js");
assert.equal(fs.existsSync(documentPath), true, `missing document renderer: ${documentPath}`);
const source = fs.readFileSync(documentPath, "utf8");
let checks = 0;

assert.match(source, /import \{ buildFullUnderwritingChapter1EliteContract \} from "\.\/full-underwriting-chapter1-elite-contract\.js";/);
assert.match(source, /import \{ renderFullUnderwritingChapter1EliteHtml \} from "\.\/full-underwriting-chapter1-elite-renderer\.js";/);
checks += 1;

assert.match(source, /sourcePackage = null,\s*sourceTruthPackage = null,\s*t12Payload = null,/);
checks += 1;

assert.match(source, /if \(sourceTruthPackage\) \{\s*try \{\s*eliteChapter1Contract = buildFullUnderwritingChapter1EliteContract\(\{/s);
assert.match(source, /sourceTruthPackage,\s*customerSurfaceModel,\s*financialIntelligence,\s*coreMetrics,\s*propertyProfile,\s*reportMeta,/s);
checks += 1;

assert.match(source, /eliteChapter1Html = renderFullUnderwritingChapter1EliteHtml\(eliteChapter1Contract\);/);
checks += 1;

assert.match(source, /catch \(eliteChapter1Error\) \{\s*console\.warn\("\[investoriq\] ELITE Chapter 1 surface fallback"/s);
checks += 1;

assert.match(source, /const executiveSummarySection = eliteChapter1Html \? "" : renderSafely/);
assert.match(source, /const metricsSection = eliteChapter1Html \? "" : renderSafely/);
assert.match(source, /const keyUpsideDriversSection = eliteChapter1Html \? "" : renderSafely/);
assert.match(source, /const primaryConstraintSection = eliteChapter1Html \? "" : renderSafely/);
checks += 1;

assert.match(source, /const legacyCommitteeOverviewHtml = `/);
assert.match(source, /const committeeOverviewHtml = eliteChapter1Html \|\| legacyCommitteeOverviewHtml;/);
checks += 1;

assert.match(source, /data-iq-chapter="committee-overview"[\s\S]*?Investment Committee Overview[\s\S]*?\$\{committeeOverviewHtml\}/);
checks += 1;

assert.equal(checks, 8);
console.log("PASS full-underwriting-chapter1-elite-document-wiring-smoke (8/8)");
