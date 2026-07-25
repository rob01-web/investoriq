import assert from 'node:assert/strict';

import { buildInstitutionalGate10ReportFixture } from './fixtures/institutional-gate-10-report.js';
import {
  buildCanonicalReportIdentityReceipt,
} from '../../api/_lib/report-identity-authority.js';
import {
  buildCanonicalInstitutionalFinancialIntelligence,
} from '../../api/_lib/institutional-financial-intelligence.js';
import {
  buildCanonicalInstitutionalUnderwritingScenarioPolicyContract,
} from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import {
  buildCanonicalInstitutionalUnderwritingInputContract,
} from '../../api/_lib/institutional-underwriting-input-contract.js';
import {
  buildDeterministicSourceCaseUnderwritingAnalysis,
} from '../../api/_lib/deterministic-source-case-underwriting-analysis.js';
import {
  buildDeterministicAcquisitionValuationAnalysis,
} from '../../api/_lib/deterministic-acquisition-valuation-analysis.js';
import {
  buildDeterministicAcquisitionCapitalStructureAnalysis,
} from '../../api/_lib/deterministic-acquisition-capital-structure-analysis.js';
import {
  buildPremiumAcquisitionUnderwritingV1ValidatedModel,
} from '../../api/_lib/premium-acquisition-underwriting-v1-validated-model.js';
import {
  renderPremiumAcquisitionUnderwritingV1Expansion,
} from '../../api/_lib/premium-acquisition-underwriting-v1-renderer.js';
import {
  observePremiumAcquisitionUnderwritingV1Quality,
} from '../../api/_lib/premium-acquisition-underwriting-v1-quality-observer.js';
import {
  renderCompleteAcquisitionMemoV2Html,
} from '../../api/_lib/acquisition-memo-v2-document.js';
import {
  runAcquisitionMemoV2Orchestrator,
} from '../../api/_lib/acquisition-memo-v2-orchestrator.js';

const PREMIUM_SURFACE = 'premium_acquisition_underwriting_v1';

function canonicalSourceTruth(jobId) {
  const sourceTruth = structuredClone(
    buildInstitutionalGate10ReportFixture(jobId).sourceTruthPackage,
  );
  for (const entry of sourceTruth.support.accepted) {
    entry.artifact_id ||= `${entry.file_id}-artifact`;
    entry.fact_conflicts = [];
    entry.authority_decision.fileId = entry.file_id;
  }
  const appraisal = sourceTruth.support.accepted.find(
    (entry) => entry.canonical_role === 'appraisal_context',
  );
  appraisal.accepted_facts = {
    appraised_value: appraisal.accepted_facts.appraisal_value,
    appraisal_noi: appraisal.accepted_facts.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_facts.stabilized_cap_rate,
  };
  appraisal.accepted_fact_evidence = {
    appraised_value: appraisal.accepted_fact_evidence.appraisal_value,
    appraisal_noi: appraisal.accepted_fact_evidence.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_fact_evidence.stabilized_cap_rate,
  };
  appraisal.authority_decision.acceptedFacts = appraisal.accepted_facts;
  appraisal.authority_decision.acceptedFactEvidence = appraisal.accepted_fact_evidence;
  sourceTruth.core.rent_roll.accepted_facts.unit_mix = [
    {
      label: '1BR',
      count: 32,
      current_rent: 1850,
      market_rent: 2050,
      avg_sqft: 720,
      occupied_count: 30,
      vacant_count: 2,
    },
    {
      label: '2BR',
      count: 32,
      current_rent: 1881.25,
      market_rent: 2425,
      avg_sqft: 940,
    },
  ];
  sourceTruth.support.adjudication_decisions = sourceTruth.support.accepted.map(
    (entry) => entry.authority_decision,
  );
  return sourceTruth;
}

function premiumModel(jobId) {
  const sourceTruthPackage = canonicalSourceTruth(jobId);
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-25',
  });
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
  });
  return buildPremiumAcquisitionUnderwritingV1ValidatedModel({
    sourceTruthPackage,
    reportIdentityReceipt: buildCanonicalReportIdentityReceipt({
      reportMode: 'v1_core',
      reportType: 'underwriting',
    }),
    financialIntelligence,
    underwritingInputContract,
    sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({
      underwritingInputContract,
    }),
    valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({
      underwritingInputContract,
    }),
    capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({
      underwritingInputContract,
    }),
  });
}

const jobId = 'premium-renderer-integration-job';
const baseFixture = buildInstitutionalGate10ReportFixture(jobId);
const model = premiumModel(jobId);
const baseArgs = {
  acquisitionMemoProjection: baseFixture.acquisitionMemoProjection,
  renderedAcquisitionMemo: baseFixture.renderedAcquisitionMemo,
  sourcePackage: baseFixture.sourcePackage,
  t12Payload: baseFixture.sourceTruthPackage.core.t12.accepted_facts,
  coreMetrics: baseFixture.coreMetrics,
  reportMeta: baseFixture.reportMeta,
  propertyProfile: baseFixture.propertyProfile,
  bossContract: baseFixture.bossContract,
  customerSurfaceModel: baseFixture.customerSurfaceModel,
  financialIntelligence: baseFixture.financialIntelligence,
};

const baseHtml = renderCompleteAcquisitionMemoV2Html(baseArgs);
assert.equal(baseHtml, baseFixture.html);

const disabledHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel: model,
  premiumUnderwritingCapabilityEnabled: false,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(disabledHtml, baseHtml);

const capabilityOnlyHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel: model,
  premiumUnderwritingCapabilityEnabled: true,
  reportSurfaceVersion: 'acquisition_underwriting_base_v1',
});
assert.equal(capabilityOnlyHtml, baseHtml);

const surfaceOnlyHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel: model,
  premiumUnderwritingCapabilityEnabled: false,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(surfaceOnlyHtml, baseHtml);

const forgedModel = structuredClone(model);
forgedModel.validation.ok = false;
const invalidModelHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel: forgedModel,
  premiumUnderwritingCapabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(invalidModelHtml, baseHtml);

const premiumRender = renderPremiumAcquisitionUnderwritingV1Expansion({
  premiumUnderwritingModel: model,
  premiumUnderwritingCapabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(premiumRender.status, 'rendered');
assert.ok(premiumRender.renderedSectionCount >= 7);
assert.match(premiumRender.html, /BEGIN PREMIUM_ACQUISITION_UNDERWRITING_V1/);
assert.match(premiumRender.html, /Premium Operating Intelligence/);
assert.match(premiumRender.html, /Premium Debt and Valuation Analysis/);
assert.match(premiumRender.html, /Premium Evidence and Methods/);
assert.match(premiumRender.html, /Proposed Acquisition Debt Yield/);
assert.match(premiumRender.html, />10\.0%</);
assert.match(premiumRender.html, /Current Debt DSCR/);
assert.match(premiumRender.html, />2\.01x</);
assert.match(premiumRender.html, /Minimum Purchase-Price Equity Before Transaction Costs/);
assert.match(premiumRender.html, /\$4,050,000/);
assert.match(premiumRender.html, /Current-Debt Debt-Inclusive Operating Break-Even Ratio/);
assert.match(premiumRender.html, /63\.62%/);
assert.doesNotMatch(
  premiumRender.html,
  /current debt service (?:is )?not assessed|no current debt document provided|current debt terms were not fully provided/i,
);
assert.doesNotMatch(premiumRender.html, /NaN|Infinity/);
assert.doesNotMatch(premiumRender.html, /\bBUY\b|\bSELL\b/);
assert.deepEqual(
  [
    /\brefinance\b/i,
    /\brefi\b/i,
    /\bDCF\b/i,
    /\bwaterfall\b/i,
    /\bequity return\b/i,
    /\bdeal score\b/i,
    /\bfinal recommendation\b/i,
    /\bHOLD\b/i,
    /\bloan approval\b/i,
    /\blender commitment\b/i,
  ].filter((pattern) => pattern.test(premiumRender.html)).map((pattern) => pattern.source),
  [],
);

const premiumHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel: model,
  premiumUnderwritingCapabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.ok(premiumHtml.length > baseHtml.length);
assert.match(premiumHtml, /data-iq-premium-underwriting-v1="true"/);
assert.ok(
  premiumHtml.indexOf('Premium Operating Intelligence') <
    premiumHtml.indexOf('data-iq-chapter="source-appendix"'),
);

const strippedPremiumHtml = premiumHtml.replace(
  /    <!-- BEGIN PREMIUM_ACQUISITION_UNDERWRITING_V1 -->[\s\S]*?<!-- END PREMIUM_ACQUISITION_UNDERWRITING_V1 -->\r?\n/,
  '',
);
assert.equal(strippedPremiumHtml, baseHtml);

const baseOrchestrator = runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs: baseArgs,
  acquisitionMemoBossContract: baseFixture.bossContract,
});
const premiumOrchestrator = runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs: {
    ...baseArgs,
    premiumUnderwritingModel: model,
    premiumUnderwritingCapabilityEnabled: true,
    reportSurfaceVersion: PREMIUM_SURFACE,
  },
  acquisitionMemoBossContract: baseFixture.bossContract,
});
assert.equal(
  premiumOrchestrator.compliance.ok,
  true,
  JSON.stringify(premiumOrchestrator.compliance.violations, null, 2),
);
assert.equal(
  premiumOrchestrator.finalDeliveryDecision.final_delivery_status,
  baseOrchestrator.finalDeliveryDecision.final_delivery_status,
);
assert.equal(
  premiumOrchestrator.finalDeliveryDecision.customer_delivery_ready,
  baseOrchestrator.finalDeliveryDecision.customer_delivery_ready,
);
assert.equal(
  premiumOrchestrator.finalDeliveryDecision.report_publishable,
  baseOrchestrator.finalDeliveryDecision.report_publishable,
);

const disabledObservation = observePremiumAcquisitionUnderwritingV1Quality({
  premiumUnderwritingModel: model,
  renderedHtml: baseHtml,
  premiumUnderwritingCapabilityEnabled: false,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(disabledObservation.status, 'not_applicable');
assert.equal(disabledObservation.issues.length, 0);
assert.equal(disabledObservation.premiumCertified, false);
assert.equal(disabledObservation.coreDeliveryEligibilityChanged, false);

const completeObservation = observePremiumAcquisitionUnderwritingV1Quality({
  premiumUnderwritingModel: model,
  renderedHtml: premiumHtml,
  premiumUnderwritingCapabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(completeObservation.status, 'observed_complete');
assert.equal(completeObservation.observedComplete, true);
assert.equal(completeObservation.issues.length, 0);
assert.equal(completeObservation.premiumCertified, false);
assert.equal(completeObservation.certificationStage, 'observe_only');
assert.equal(completeObservation.deliveryAuthority, false);
assert.equal(completeObservation.publicationAuthority, false);
assert.equal(completeObservation.reportPublicationBlocker, false);

const missingCalculationHtml = premiumHtml.replace(
  'data-iq-premium-calculation="proposedAcquisitionDebtYield"',
  'data-iq-removed-calculation="proposedAcquisitionDebtYield"',
);
const gapObservation = observePremiumAcquisitionUnderwritingV1Quality({
  premiumUnderwritingModel: model,
  renderedHtml: missingCalculationHtml,
  premiumUnderwritingCapabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(gapObservation.status, 'observed_gaps');
assert.equal(gapObservation.observedComplete, false);
assert.equal(
  gapObservation.issues.some(
    (issue) =>
      issue.code === 'PREMIUM_CALCULATION_MISSING' &&
      issue.evidence.calculationKey === 'proposedAcquisitionDebtYield',
  ),
  true,
);
assert.equal(
  gapObservation.issues.every(
    (issue) =>
      issue.severity === 'advisory' &&
      issue.coreDeliveryBlocker === false &&
      issue.premiumPublicationBlocker === false,
  ),
  true,
);
assert.equal(gapObservation.coreDeliveryEligibilityChanged, false);
assert.equal(gapObservation.reportPublicationBlocker, false);

const hiddenDowngradeObservation = observePremiumAcquisitionUnderwritingV1Quality({
  premiumUnderwritingModel: model,
  renderedHtml: baseHtml,
  premiumUnderwritingCapabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_SURFACE,
});
assert.equal(
  hiddenDowngradeObservation.issues.some(
    (issue) => issue.code === 'PREMIUM_RENDER_MARKER_MISSING',
  ),
  true,
);
assert.equal(hiddenDowngradeObservation.premiumCertified, false);
assert.equal(hiddenDowngradeObservation.coreDeliveryEligibilityChanged, false);

console.log('premium-acquisition-underwriting-v1 renderer-integration smoke passed');
