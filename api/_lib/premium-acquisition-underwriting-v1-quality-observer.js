import {
  resolvePremiumAcquisitionUnderwritingV1Activation,
} from './premium-acquisition-underwriting-v1-model.js';
import {
  validatePremiumAcquisitionUnderwritingV1ValidatedModel,
} from './premium-acquisition-underwriting-v1-validated-model.js';
import {
  PREMIUM_RENDERED_SECTION_KEYS,
} from './premium-acquisition-underwriting-v1-renderer.js';

const OBSERVER_SOURCE = 'premium_acquisition_underwriting_v1_quality_observer';
const OBSERVER_VERSION = 1;

function text(value) {
  return String(value ?? '');
}

function escapeRegex(value) {
  return text(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function issue(code, path, message, evidence = {}) {
  return {
    code,
    severity: 'advisory',
    classification: 'internal_premium_quality_observation',
    customerDocumentFailure: false,
    coreDeliveryBlocker: false,
    premiumPublicationBlocker: false,
    path,
    message,
    evidence,
  };
}

function observePremiumAcquisitionUnderwritingV1Quality({
  premiumUnderwritingModel = null,
  renderedHtml = '',
  premiumUnderwritingCapabilityEnabled = false,
  reportSurfaceVersion = null,
} = {}) {
  const activation = resolvePremiumAcquisitionUnderwritingV1Activation({
    capabilityEnabled: premiumUnderwritingCapabilityEnabled,
    reportSurfaceVersion,
  });
  if (!activation.requested) {
    return Object.freeze({
      source: OBSERVER_SOURCE,
      observerVersion: OBSERVER_VERSION,
      mode: 'observe_only',
      status: 'not_applicable',
      activation,
      issues: Object.freeze([]),
      observedComplete: false,
      premiumCertified: false,
      coreDeliveryEligibilityChanged: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      reportPublicationBlocker: false,
    });
  }

  const issues = [];
  const validation = validatePremiumAcquisitionUnderwritingV1ValidatedModel(
    premiumUnderwritingModel,
  );
  if (!validation.ok || premiumUnderwritingModel?.validation?.ok !== true) {
    issues.push(issue(
      'PREMIUM_OBSERVER_MODEL_INVALID',
      'premiumUnderwritingModel',
      'The requested premium surface did not receive a valid premium expansion model.',
    ));
  }

  const html = text(renderedHtml);
  if (!html.includes('BEGIN PREMIUM_ACQUISITION_UNDERWRITING_V1')) {
    issues.push(issue(
      'PREMIUM_RENDER_MARKER_MISSING',
      'renderedHtml',
      'The requested premium surface is missing its guarded render marker.',
    ));
  }

  if (validation.ok) {
    for (const sectionKey of PREMIUM_RENDERED_SECTION_KEYS) {
      const section = premiumUnderwritingModel.sections?.[sectionKey];
      const expectedCalculations = Array.isArray(section?.calculations)
        ? section.calculations.filter((receipt) => (
            receipt?.status === 'calculated' &&
            receipt?.sourceBound === true &&
            Number.isFinite(receipt?.result)
          ))
        : [];
      const methodsExpected = sectionKey === 'methodsDefinitionsAndLimitations' &&
        section?.status === 'eligible' &&
        section?.customerSurfaceEligible === true;
      if (expectedCalculations.length === 0 && !methodsExpected) continue;

      const sectionPattern = new RegExp(
        `data-iq-premium-section=[\"']${escapeRegex(sectionKey)}[\"']`,
      );
      if (!sectionPattern.test(html)) {
        issues.push(issue(
          'PREMIUM_ELIGIBLE_SECTION_MISSING',
          `sections.${sectionKey}`,
          'A source-eligible premium analytical section is missing from rendered HTML.',
          { sectionKey, expectedCalculationCount: expectedCalculations.length },
        ));
        continue;
      }
      for (const receipt of expectedCalculations) {
        const calculationPattern = new RegExp(
          `data-iq-premium-calculation=[\"']${escapeRegex(receipt.calculationKey)}[\"']`,
        );
        if (!calculationPattern.test(html)) {
          issues.push(issue(
            'PREMIUM_CALCULATION_MISSING',
            `sections.${sectionKey}.calculations.${receipt.calculationKey}`,
            'A calculated source-bound premium receipt is missing from rendered HTML.',
            {
              sectionKey,
              calculationKey: receipt.calculationKey,
              result: receipt.result,
            },
          ));
        }
      }
    }
  }

  const frozenIssues = Object.freeze(issues.map(Object.freeze));
  return Object.freeze({
    source: OBSERVER_SOURCE,
    observerVersion: OBSERVER_VERSION,
    mode: 'observe_only',
    status: issues.length === 0 ? 'observed_complete' : 'observed_gaps',
    activation,
    validationStatus: validation.status,
    issues: frozenIssues,
    observedComplete: issues.length === 0,
    premiumCertified: false,
    certificationStage: 'observe_only',
    coreDeliveryEligibilityChanged: false,
    deliveryAuthority: false,
    publicationAuthority: false,
    reportPublicationBlocker: false,
  });
}

const PREMIUM_ACQUISITION_UNDERWRITING_V1_QUALITY_OBSERVER_CONTRACT = Object.freeze({
  source: OBSERVER_SOURCE,
  observerVersion: OBSERVER_VERSION,
  mode: 'observe_only',
  premiumCertified: false,
  coreDeliveryEligibilityChanged: false,
  deliveryAuthority: false,
  publicationAuthority: false,
});

export {
  OBSERVER_SOURCE,
  OBSERVER_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_QUALITY_OBSERVER_CONTRACT,
  observePremiumAcquisitionUnderwritingV1Quality,
};
