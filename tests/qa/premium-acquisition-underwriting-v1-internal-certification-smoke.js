import assert from 'node:assert/strict';

import {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_INTERNAL_CERTIFICATION_CONTRACT,
  certifyPremiumAcquisitionUnderwritingV1InternalTest,
} from '../../api/_lib/premium-acquisition-underwriting-v1-internal-certification.js';
import {
  completeObservation,
  premiumUnderwritingModel,
} from './premium-acquisition-underwriting-v1-renderer-integration-smoke.js';
import {
  premiumPdfBoss,
} from './premium-acquisition-underwriting-v1-pdf-composition-smoke.js';

const modelBefore = JSON.stringify(premiumUnderwritingModel);
const observationBefore = JSON.stringify(completeObservation);
const pdfBossBefore = JSON.stringify(premiumPdfBoss);

const certified = certifyPremiumAcquisitionUnderwritingV1InternalTest({
  premiumUnderwritingModel,
  qualityObservation: completeObservation,
  pdfPublicationQualityBoss: premiumPdfBoss,
});

assert.equal(certified.status, 'internal_test_certified');
assert.equal(certified.internalTestCertified, true);
assert.equal(certified.premiumUnderwritingCertified, false);
assert.equal(certified.externalPremiumCertified, false);
assert.equal(certified.externalPublicationAllowed, false);
assert.equal(certified.coreDeliveryEligibilityChanged, false);
assert.equal(certified.reportPublicationBlocker, false);
assert.equal(certified.customerDocumentFailure, false);
assert.equal(certified.issues.length, 0);
assert.equal(certified.evidence.validatedModel.validationStatus,
  'valid_disconnected_expansion_model');
assert.equal(certified.evidence.qualityObservation.status, 'observed_complete');
assert.equal(certified.evidence.pdfPublicationQualityBoss.status, 'certified');
assert.equal(certified.evidence.pdfPublicationQualityBoss.publicationTarget,
  'internal_test');
assert.ok(certified.evidence.pdfPublicationQualityBoss.pageCount > 1);
assert.equal(Object.isFrozen(certified), true);
assert.equal(Object.isFrozen(certified.authority), true);
assert.deepEqual(certified.authority, {
  sourceAuthority: false,
  deliveryAuthority: false,
  publicationAuthority: false,
  manifestAuthority: false,
  workerAuthority: false,
  billingAuthority: false,
  remedyAuthority: false,
  externalEnforcementAuthority: false,
});

assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_INTERNAL_CERTIFICATION_CONTRACT
    .internalTestOnly,
  true,
);
assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_INTERNAL_CERTIFICATION_CONTRACT
    .externalPublicationAllowed,
  false,
);
assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_INTERNAL_CERTIFICATION_CONTRACT
    .manifestAuthority,
  false,
);

const gapObservation = structuredClone(completeObservation);
gapObservation.status = 'observed_gaps';
gapObservation.observedComplete = false;
gapObservation.issues = [{
  code: 'PREMIUM_CALCULATION_MISSING',
  severity: 'advisory',
}];
const completenessFailure =
  certifyPremiumAcquisitionUnderwritingV1InternalTest({
    premiumUnderwritingModel,
    qualityObservation: gapObservation,
    pdfPublicationQualityBoss: premiumPdfBoss,
  });
assert.equal(completenessFailure.status, 'internal_test_not_certified');
assert.equal(completenessFailure.internalTestCertified, false);
assert.equal(
  completenessFailure.issues.some(
    (issue) => issue.code ===
      'PREMIUM_INTERNAL_COMPLETENESS_NOT_OBSERVED',
  ),
  true,
);
assert.equal(completenessFailure.reportPublicationBlocker, false);
assert.equal(completenessFailure.authority.publicationAuthority, false);

const incidentPdfBoss = structuredClone(premiumPdfBoss);
incidentPdfBoss.ok = false;
incidentPdfBoss.status = 'publishable_with_quality_incident';
incidentPdfBoss.strict_institutional_certified = false;
incidentPdfBoss.quality_incident_codes = ['PDF_ORPHANED_HEADINGS'];
incidentPdfBoss.issues = [{
  code: 'PDF_ORPHANED_HEADINGS',
  blocks_customer_delivery: false,
}];
const pdfFailure = certifyPremiumAcquisitionUnderwritingV1InternalTest({
  premiumUnderwritingModel,
  qualityObservation: completeObservation,
  pdfPublicationQualityBoss: incidentPdfBoss,
});
assert.equal(pdfFailure.status, 'internal_test_not_certified');
assert.equal(pdfFailure.internalTestCertified, false);
assert.equal(
  pdfFailure.issues.some(
    (issue) => issue.code === 'PREMIUM_INTERNAL_PDF_NOT_CERTIFIED',
  ),
  true,
);
assert.equal(pdfFailure.externalPublicationAllowed, false);
assert.equal(pdfFailure.reportPublicationBlocker, false);

const externalTargetPdfBoss = structuredClone(premiumPdfBoss);
externalTargetPdfBoss.publication_target = 'external_publication';
const targetFailure = certifyPremiumAcquisitionUnderwritingV1InternalTest({
  premiumUnderwritingModel,
  qualityObservation: completeObservation,
  pdfPublicationQualityBoss: externalTargetPdfBoss,
});
assert.equal(targetFailure.internalTestCertified, false);
assert.equal(
  targetFailure.issues.some(
    (issue) => issue.code === 'PREMIUM_INTERNAL_PDF_NOT_CERTIFIED',
  ),
  true,
);

const invalidModel = structuredClone(premiumUnderwritingModel);
invalidModel.identity.canonicalTitle = 'Acquisition Memo';
invalidModel.validation.ok = false;
const modelFailure = certifyPremiumAcquisitionUnderwritingV1InternalTest({
  premiumUnderwritingModel: invalidModel,
  qualityObservation: completeObservation,
  pdfPublicationQualityBoss: premiumPdfBoss,
});
assert.equal(modelFailure.internalTestCertified, false);
assert.equal(
  modelFailure.issues.some(
    (issue) => issue.code === 'PREMIUM_INTERNAL_MODEL_NOT_VALIDATED',
  ),
  true,
);

for (const receipt of [
  completenessFailure,
  pdfFailure,
  targetFailure,
  modelFailure,
]) {
  assert.equal(receipt.premiumUnderwritingCertified, false);
  assert.equal(receipt.externalPremiumCertified, false);
  assert.equal(receipt.externalPublicationAllowed, false);
  assert.equal(receipt.coreDeliveryEligibilityChanged, false);
  assert.equal(receipt.reportPublicationBlocker, false);
  assert.equal(receipt.authority.deliveryAuthority, false);
  assert.equal(receipt.authority.publicationAuthority, false);
  assert.equal(receipt.authority.manifestAuthority, false);
  assert.equal(receipt.customerDocumentFailure, false);
}

assert.equal(JSON.stringify(premiumUnderwritingModel), modelBefore);
assert.equal(JSON.stringify(completeObservation), observationBefore);
assert.equal(JSON.stringify(premiumPdfBoss), pdfBossBefore);

console.log('premium-acquisition-underwriting-v1 internal-certification smoke passed');
