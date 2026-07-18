import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildApprovedPdfSurfaceManifest,
  FINAL_PDF_PUBLICATION_QUALITY_CONTRACT,
} from "../../api/_lib/final-pdf-publication-quality-boss.js";
import {
  INSTITUTIONAL_PDF_CONSTITUTION,
  isCanonicalInstitutionalPdfConstitution,
} from "../../api/_lib/institutional-pdf-constitution.js";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

const fixture = buildInstitutionalGate10ReportFixture("gate-10f-elite-certification");
const manifest = buildApprovedPdfSurfaceManifest({
  approvedHtml: fixture.html,
  sourceReconciliation: fixture.sourceTruthPackage.source_reconciliation_state,
  deterministicContractQaSeal: {
    ok: true,
    source_reconciliation: { required: true },
  },
  financialIntelligence: fixture.financialIntelligence,
});

assert.equal(isCanonicalInstitutionalPdfConstitution(INSTITUTIONAL_PDF_CONSTITUTION), true);
assert.equal(Object.isFrozen(INSTITUTIONAL_PDF_CONSTITUTION), true);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.authority.sourceTruthMutationAllowed, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.authority.financialFactCreating, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.authority.screeningBehaviorChanged, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.authority.deliveryGateChanged, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.authority.corePublicationThresholdChanged, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.composition.pageCountHardcoded, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.composition.contentDrivenPaginationRequired, true);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.repair.customerDocumentFailure, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.publication.optionalSectionIssueMayBlockValidatedCorePublication, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.publication.nonblockingQualityIncidentMayPublish, true);
assert.equal(FINAL_PDF_PUBLICATION_QUALITY_CONTRACT.strictCertificationRecordedSeparatelyFromDelivery, true);

assert.equal(FINAL_PDF_PUBLICATION_QUALITY_CONTRACT.scope, "institutional_page_by_page_certification");
assert.equal(FINAL_PDF_PUBLICATION_QUALITY_CONTRACT.pageByPageCertificationRequired, true);
assert.equal(FINAL_PDF_PUBLICATION_QUALITY_CONTRACT.pageCountHardcoded, false);
assert.equal(manifest.chapters.length, 6);
assert.ok(manifest.tables.length > 0);
assert.equal(manifest.charts.length, 4);
assert.ok(manifest.displayedNumbers.length > 0);
assert.ok(manifest.tables.every((table) => table.columnCount > 0 && table.cells.length >= table.columnCount));
assert.ok(manifest.charts.every((chart) =>
  chart.id === chart.receipt && chart.values.length > 0 && chart.sourcePaths.length > 0 && chart.displayedNumbers.length > 0
));
assert.deepEqual(manifest.chapters.map((chapter) => chapter.id), [
  "committee-overview",
  "operating-performance",
  "acquisition-context",
  "debt-capital-structure",
  "financial-analysis",
  "source-appendix",
]);

const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const bossSource = fs.readFileSync("api/_lib/final-pdf-publication-quality-boss.js", "utf8");
const generatorSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const combinedProductionSource = `${documentSource}\n${bossSource}`;

assert.doesNotMatch(combinedProductionSource, /Stonebridge|RETEST\s*30|Final Attack Test/i);
assert.doesNotMatch(documentSource, /\[\s*0\.05\s*,\s*0\.06\s*,\s*0\.07\s*\]/);
assert.doesNotMatch(combinedProductionSource, /(?:target|expected|universal)[_-]?page[_-]?count\s*[:=]\s*\d+/i);
assert.doesNotMatch(bossSource, /scope:\s*["']rendering_survival_only["']/i);
assert.match(documentSource, /data-iq-composition="content-driven-v1"/i);
assert.match(documentSource, /data-iq-visual-system="institutional-v1"/i);
assert.match(bossSource, /institutional_page_by_page_certification/i);
assert.match(bossSource, /PDF_CONSTITUTION_TAMPERING_REJECTED/);
assert.match(bossSource, /docraptor_test_watermark/);

const renderIndex = generatorSource.indexOf("pdfResponse = await axios.post(");
const bossIndex = generatorSource.indexOf("finalPdfPublicationQualityBossResult = await inspectFinalPdfPublicationQuality({");
const uploadIndex = generatorSource.indexOf(".upload(validatedStoragePath, pdfResponse.data, {");
assert.ok(renderIndex >= 0 && bossIndex > renderIndex && uploadIndex > bossIndex);

const visibleText = fixture.html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
assert.doesNotMatch(visibleText, /customer_document_failure|internal_system_failure|sourceAuthority|publishAllowed|delivery_gate|repair_plan/i);
assert.doesNotMatch(visibleText, /\bBUY\b|\bSELL\b/i);
assert.doesNotMatch(visibleText, /5\.0%[\s\S]{0,120}6\.0%[\s\S]{0,120}7\.0%/i);

console.log("Gate 10F ELITE institutional PDF certification smoke PASS");
