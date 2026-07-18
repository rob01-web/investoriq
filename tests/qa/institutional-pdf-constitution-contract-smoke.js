import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildCanonicalInstitutionalPdfConstitution,
  INSTITUTIONAL_PDF_CONSTITUTION,
  isCanonicalInstitutionalPdfConstitution,
} from '../../api/_lib/institutional-pdf-constitution.js';

const constitution = buildCanonicalInstitutionalPdfConstitution({
  pageCount: 19,
  hardcodedCapRates: [0.05, 0.06, 0.07],
  optionalPresentationFailureMayFailCustomerReport: true,
});

assert.equal(isCanonicalInstitutionalPdfConstitution(constitution), true);
assert.deepEqual(constitution, INSTITUTIONAL_PDF_CONSTITUTION);
assert.equal(Object.isFrozen(constitution), true);
assert.equal(Object.isFrozen(constitution.certification), true);
assert.equal(constitution.authority.sourceAuthorityCreating, false);
assert.equal(constitution.authority.sourceTruthMutationAllowed, false);
assert.equal(constitution.authority.financialFactCreating, false);
assert.equal(constitution.authority.scenarioCreating, false);
assert.equal(constitution.composition.universalPageCountRequired, null);
assert.equal(constitution.composition.pageCountHardcoded, false);
assert.equal(constitution.composition.contentDrivenPaginationRequired, true);
assert.equal(constitution.charts.exactCanonicalValueRequired, true);
assert.equal(constitution.charts.approvedScenarioPolicyRequiredForScenarioSeries, true);
assert.equal(constitution.charts.hardcodedFinancialSeriesAllowed, false);
assert.equal(constitution.charts.inferredBenchmarkAllowed, false);
assert.equal(constitution.pagination.majorSectionBreaksOnly, true);
assert.equal(constitution.pagination.optionalSurfaceMayOwnForcedPage, false);
assert.equal(constitution.repair.optionalPresentationFailureMayFailCustomerReport, false);
assert.equal(constitution.repair.unresolvedRequiredSurfaceFailureClass, 'internal_system_failure');
assert.equal(constitution.repair.customerDocumentFailure, false);
assert.equal(constitution.certification.pageByPageRequired, true);
assert.deepEqual(constitution.certification.pageReceiptRequiredFields, [
  'pageNumber',
  'sectionIds',
  'headings',
  'tables',
  'charts',
  'displayedNumbers',
  'geometry',
  'defects',
  'status',
]);
assert.equal(constitution.publication.testWatermarkExcludedFromInstitutionalScoring, true);
assert.equal(constitution.publication.testModeExternalPublicationAllowed, false);
assert.equal(constitution.publication.strictInstitutionalCertificationRecordedSeparatelyFromDelivery, true);
assert.equal(constitution.publication.nonblockingQualityIncidentMayPublish, true);
assert.equal(constitution.publication.unsafeArtifactMayPublish, false);
assert.equal(constitution.publication.optionalSectionIssueMayBlockValidatedCorePublication, false);

for (const mutate of [
  (value) => { value.composition.universalPageCountRequired = 10; },
  (value) => { value.charts.hardcodedFinancialSeriesAllowed = true; },
  (value) => { value.repair.numericValueMutationAllowed = true; },
  (value) => { value.repair.optionalPresentationFailureMayFailCustomerReport = true; },
  (value) => { value.certification.pageByPageRequired = false; },
  (value) => { value.publication.testModeExternalPublicationAllowed = true; },
]) {
  const tampered = structuredClone(constitution);
  mutate(tampered);
  assert.equal(isCanonicalInstitutionalPdfConstitution(tampered), false);
}

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-pdf-constitution.js', import.meta.url),
  'utf8'
);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('delivery-gate'), false);

console.log('institutional-pdf-constitution-contract-smoke: PASS');
