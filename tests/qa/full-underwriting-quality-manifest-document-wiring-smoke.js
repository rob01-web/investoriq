import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const documentSource = fs.readFileSync(path.join(repoRoot, "api/_lib/acquisition-memo-v2-document.js"), "utf8");

assert.match(documentSource, /buildFullUnderwritingQualityManifestV1/);
assert.match(documentSource, /renderFullUnderwritingQualityManifestV1Html/);
assert.match(documentSource, /scenarioEngine:\s*eliteScenarioEngineContract/);
assert.match(documentSource, /reportIdentity:\s*UNDERWRITING_REPORT_IDENTITY/);
assert.match(documentSource, /data-iq-chapter="source-appendix"/);
assert.match(documentSource, /\$\{qualityManifestSection\}/);

const sourceAppendixIndex = documentSource.indexOf('data-iq-chapter="source-appendix"');
const methodologyIndex = documentSource.indexOf('${methodologySection}', sourceAppendixIndex);
const qualityManifestIndex = documentSource.indexOf('${qualityManifestSection}', sourceAppendixIndex);
assert.ok(sourceAppendixIndex >= 0, "Source Appendix must exist");
assert.ok(methodologyIndex > sourceAppendixIndex, "Methodology must remain in the Source Appendix");
assert.ok(qualityManifestIndex > methodologyIndex, "Quality Manifest must follow Methodology in the Source Appendix");

assert.doesNotMatch(documentSource, /qualityManifestSection\s*=\s*JSON\.stringify/);
assert.doesNotMatch(documentSource, /report_quality_manifest_candidate[^\n]*qualityManifestSection/);

console.log("full-underwriting-quality-manifest-document-wiring-smoke: PASS");
