import assert from 'node:assert/strict';

import {
  renderCompleteAcquisitionMemoV2Html,
} from '../../api/_lib/acquisition-memo-v2-document.js';
import {
  runAcquisitionMemoV2Orchestrator,
} from '../../api/_lib/acquisition-memo-v2-orchestrator.js';
import {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from '../../api/_lib/premium-acquisition-underwriting-v1-model.js';
import {
  resolvePremiumAcquisitionUnderwritingV1JobSurface,
} from '../../api/_lib/premium-acquisition-underwriting-v1-job-surface-authority.js';
import {
  baseArgs,
  baseFixture,
  baseHtml,
  baseOrchestrator,
  premiumHtml,
  premiumUnderwritingModel,
} from './premium-acquisition-underwriting-v1-renderer-integration-smoke.js';

const resolvedAt = '2026-07-25T12:00:00.000Z';
const fixtureBefore = JSON.stringify(baseFixture);
const modelBefore = JSON.stringify(premiumUnderwritingModel);

const baseReceipt = resolvePremiumAcquisitionUnderwritingV1JobSurface({
  jobId: premiumUnderwritingModel.jobId,
  reportType: 'underwriting',
  capabilityEnabled: false,
  resolvedAt,
});
const baseReceiptHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel,
  premiumUnderwritingCapabilityEnabled:
    baseReceipt.capabilityEnabledAtResolution,
  reportSurfaceVersion: baseReceipt.reportSurfaceVersion,
});
assert.equal(baseReceiptHtml, baseHtml);
assert.doesNotMatch(
  baseReceiptHtml,
  /BEGIN PREMIUM_ACQUISITION_UNDERWRITING_V1/,
);

const disabledPremiumRequest =
  resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: `${premiumUnderwritingModel.jobId}-disabled-request`,
    reportType: 'underwriting',
    requestedSurfaceVersion:
      PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
    capabilityEnabled: false,
    resolvedAt,
  });
assert.equal(disabledPremiumRequest.valid, false);
const disabledRequestHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel,
  premiumUnderwritingCapabilityEnabled:
    disabledPremiumRequest.capabilityEnabledAtResolution,
  reportSurfaceVersion: disabledPremiumRequest.reportSurfaceVersion,
});
assert.equal(disabledRequestHtml, baseHtml);

const baseReceiptOrchestrator = runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs: {
    ...baseArgs,
    premiumUnderwritingModel,
    premiumUnderwritingCapabilityEnabled:
      baseReceipt.capabilityEnabledAtResolution,
    reportSurfaceVersion: baseReceipt.reportSurfaceVersion,
  },
  acquisitionMemoBossContract: baseFixture.bossContract,
});
assert.equal(
  baseReceiptOrchestrator.finalDeliveryDecision.final_delivery_status,
  baseOrchestrator.finalDeliveryDecision.final_delivery_status,
);
assert.equal(
  baseReceiptOrchestrator.finalDeliveryDecision.customer_delivery_ready,
  baseOrchestrator.finalDeliveryDecision.customer_delivery_ready,
);
assert.equal(
  baseReceiptOrchestrator.finalDeliveryDecision.report_publishable,
  baseOrchestrator.finalDeliveryDecision.report_publishable,
);

const premiumReceipt = resolvePremiumAcquisitionUnderwritingV1JobSurface({
  jobId: premiumUnderwritingModel.jobId,
  reportType: 'underwriting',
  requestedSurfaceVersion:
    PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  capabilityEnabled: true,
  resolvedAt,
});
assert.equal(premiumReceipt.valid, true);
assert.equal(premiumReceipt.premiumSurfaceAssigned, true);
assert.equal(premiumReceipt.assignmentScope, 'internal_test_only');
assert.equal(premiumReceipt.externalPremiumPromiseEstablished, false);
assert.equal(premiumReceipt.externalPublicationAllowed, false);
const premiumReceiptHtml = renderCompleteAcquisitionMemoV2Html({
  ...baseArgs,
  premiumUnderwritingModel,
  premiumUnderwritingCapabilityEnabled:
    premiumReceipt.capabilityEnabledAtResolution,
  reportSurfaceVersion: premiumReceipt.reportSurfaceVersion,
});
assert.equal(premiumReceiptHtml, premiumHtml);
assert.match(
  premiumReceiptHtml,
  /BEGIN PREMIUM_ACQUISITION_UNDERWRITING_V1/,
);

const premiumReceiptOrchestrator = runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs: {
    ...baseArgs,
    premiumUnderwritingModel,
    premiumUnderwritingCapabilityEnabled:
      premiumReceipt.capabilityEnabledAtResolution,
    reportSurfaceVersion: premiumReceipt.reportSurfaceVersion,
  },
  acquisitionMemoBossContract: baseFixture.bossContract,
});
assert.equal(
  premiumReceiptOrchestrator.finalDeliveryDecision.final_delivery_status,
  baseOrchestrator.finalDeliveryDecision.final_delivery_status,
);
assert.equal(
  premiumReceiptOrchestrator.finalDeliveryDecision.customer_delivery_ready,
  baseOrchestrator.finalDeliveryDecision.customer_delivery_ready,
);
assert.equal(
  premiumReceiptOrchestrator.finalDeliveryDecision.report_publishable,
  baseOrchestrator.finalDeliveryDecision.report_publishable,
);
assert.equal(
  premiumReceiptOrchestrator.compliance.ok,
  true,
  JSON.stringify(premiumReceiptOrchestrator.compliance.violations, null, 2),
);

assert.equal(premiumReceipt.authority.deliveryAuthority, false);
assert.equal(premiumReceipt.authority.publicationAuthority, false);
assert.equal(premiumReceipt.authority.manifestAuthority, false);
assert.equal(premiumReceipt.authority.workerAuthority, false);
assert.equal(JSON.stringify(baseFixture), fixtureBefore);
assert.equal(JSON.stringify(premiumUnderwritingModel), modelBefore);

console.log(
  'premium-acquisition-underwriting-v1 job-surface-integration smoke passed',
);
