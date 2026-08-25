import assert from "node:assert/strict";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";
import { validateAcquisitionMemoRenderAgainstBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import { validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel } from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";

function visibleText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const fixture = buildInstitutionalGate10ReportFixture("elite-09-quality-manifest-institutional");
const { html, bossContract, customerSurfaceModel } = fixture;
const text = visibleText(html);

assert.equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, html).ok, true);
const customerValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, customerSurfaceModel);
assert.equal(customerValidation.ok, true, JSON.stringify(customerValidation.issues, null, 2));

assert.equal((html.match(/data-iq-section="quality-manifest"/g) || []).length, 1, "Quality Manifest must render exactly once");
assert.match(text, /Quality Manifest/);
assert.match(text, /Report Identity/);
assert.match(text, /Evidence Treatment/);
assert.match(text, /Coverage & Reconciliation/);
assert.match(text, /Scenario & Calculation Basis/);
assert.match(text, /Certification & Traceability/);
assert.match(text, /Final PDF certification, revision identity, publication receipt/i);

const sourceAppendixIndex = html.indexOf('data-iq-chapter="source-appendix"');
const methodologyIndex = html.indexOf("Methodology &amp; Data Transparency", sourceAppendixIndex);
const qualityManifestIndex = html.indexOf('data-iq-section="quality-manifest"', sourceAppendixIndex);
assert.ok(sourceAppendixIndex >= 0, "Source Appendix must remain present");
assert.ok(methodologyIndex > sourceAppendixIndex, "Methodology must remain in Source Appendix");
assert.ok(qualityManifestIndex > methodologyIndex, "Quality Manifest must follow Methodology");

assert.doesNotMatch(text, /[–—]/, "Quality Manifest customer surface must use publication-safe punctuation");

for (const internalPhrase of [
  /canonical source truth/i,
  /canonical rent roll/i,
  /canonical_source_truth_package/i,
  /source-backed/i,
  /source_backed/i,
  /fact bundle/i,
  /parser/i,
  /authority object/i,
  /dual_source_core/i,
  /t12_minimum_core/i,
  /rent_roll_minimum_core/i,
  /stack trace/i,
  /REPORT_[A-Z0-9_]+/,
]) {
  assert.doesNotMatch(text, internalPhrase);
}

console.log("full-underwriting-quality-manifest-institutional-regression: PASS");
