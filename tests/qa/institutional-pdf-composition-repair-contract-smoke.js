import assert from 'node:assert/strict';
import { buildInstitutionalPdfRepairPlan } from '../../api/_lib/institutional-pdf-repair-plan.js';
import { buildInstitutionalGate10ReportFixture } from './fixtures/institutional-gate-10-report.js';

const fixture = buildInstitutionalGate10ReportFixture('gate-10d-composition');
const { html } = fixture;

assert.match(html, /data-iq-composition="content-driven-v1"/i);
assert.match(html, /\.institutional-chapter\s*\+\s*\.institutional-chapter\s*\{[^}]*break-before\s*:\s*page/i);
assert.match(html, /\.section-break\s*\{[^}]*break-before\s*:\s*auto/i);
assert.doesNotMatch(html, /\.section-break\s*\{[^}]*page-break-before\s*:\s*always/i);
assert.match(html, /@top-left\s*\{[^}]*string\(report-property\)/i);
assert.match(html, /@top-right\s*\{[^}]*string\(report-chapter\)/i);
assert.match(html, /Page " counter\(page\) " of " counter\(pages\)/i);
assert.match(html, /thead\s*\{\s*display\s*:\s*table-header-group/i);
assert.match(html, /orphans\s*:\s*3/i);
assert.match(html, /widows\s*:\s*3/i);
assert.match(html, /source-register-table[\s\S]{0,420}(?:overflow-wrap\s*:\s*(?:break-word|normal)|word-break\s*:\s*normal)/i);
assert.doesNotMatch(html, /target-page-count|expected-page-count|page-count\s*:\s*\d+/i);

const plan = buildInstitutionalPdfRepairPlan({
  artifactId: 'artifact-10d',
  defects: [
    { code: 'OPTIONAL_CHART_OVERFLOW', category: 'chart', surfaceId: 'annual-rent-position', pageNumber: 4, optional: true },
    { code: 'HEADING_ORPHAN', category: 'heading', surfaceId: 'operating-statement', pageNumber: 5 },
    { code: 'TABLE_ROW_SPLIT', category: 'table', surfaceId: 'source-register', pageNumber: 9 },
  ],
});
assert.equal(plan.source, 'canonical_institutional_pdf_repair_plan');
assert.equal(plan.customerDocumentFailure, false);
assert.equal(plan.publicationDisposition, 'rerender_required');
assert.deepEqual(plan.actions.map((action) => action.action), [
  'collapse_optional_surface',
  'recompose_and_rerender',
  'recompose_and_rerender',
]);
assert.equal(plan.authorityProtection.valuesMayChange, false);
assert.equal(plan.authorityProtection.sourcesMayChange, false);
assert.equal(plan.authorityProtection.disclosuresMayChange, false);

const internalRepair = buildInstitutionalPdfRepairPlan({
  artifactId: 'artifact-required-loss',
  defects: [
    { code: 'DISPLAYED_NUMBER_MISMATCH', category: 'number', surfaceId: 'noi', pageNumber: 3, required: true },
    { code: 'REQUIRED_TABLE_MISSING', category: 'table', surfaceId: 'operating-statement', pageNumber: 6, required: true },
  ],
});
assert.equal(internalRepair.publicationDisposition, 'hold_for_internal_repair');
assert.equal(internalRepair.customerDocumentFailure, false);
assert.ok(internalRepair.actions.every((action) => action.action === 'internal_system_repair'));
assert.doesNotMatch(JSON.stringify(internalRepair), /customer_document_failure|document_unusable|core_fatal/i);

const tampered = buildInstitutionalPdfRepairPlan({
  artifactId: 'artifact-tampered',
  defects: [{ code: 'OPTIONAL_CHART_OVERFLOW', category: 'chart', optional: true }],
  authorityProtection: { valuesMayChange: true, sourcesMayChange: true },
  publicationDisposition: 'publish',
});
assert.equal(tampered.authorityProtection.valuesMayChange, false);
assert.equal(tampered.authorityProtection.sourcesMayChange, false);
assert.equal(tampered.publicationDisposition, 'rerender_required');

console.log('institutional-pdf-composition-repair-contract-smoke: PASS');
