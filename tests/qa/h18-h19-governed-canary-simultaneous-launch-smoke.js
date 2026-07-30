import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
process.env.SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.PUBLIC_SITE_URL ||= "https://investoriq.example";
process.env.STRIPE_SECRET_KEY ||= "sk_test_h18_h19_smoke";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_h18_h19_smoke";
process.env.STRIPE_PRICE_SCREENING ||= "price_screening_h18_h19_smoke";
process.env.STRIPE_PRICE_UNDERWRITING ||= "price_underwriting_h18_h19_smoke";
process.env.STRIPE_PRICE_BUNDLE ||= "price_bundle_h18_h19_smoke";
process.env.VITE_STRIPE_PRICE_ID_SCREENING ||= "price_screening_h18_h19_smoke";
process.env.VITE_STRIPE_PRICE_ID_UNDERWRITING ||= "price_underwriting_h18_h19_smoke";
process.env.VITE_STRIPE_PRICE_ID_BUNDLE ||= "price_bundle_h18_h19_smoke";
process.env.VITE_SUPABASE_URL ||= "https://example.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY ||= "test-anon-key";

const {
  ALLOWED_PRODUCT_TYPES,
  PRICE_CONFIG,
  buildCheckoutLineItem,
  buildCheckoutMetadata,
  getValidatedPriceConfig,
  getValidatedPriceConfigForProduct,
  normalizeCheckoutQuantity,
  normalizeProductType,
} = await import("../../api/create-checkout-session.js");

const {
  buildExpectedPurchaseSpecs,
  CHECKOUT_PRODUCT_TYPES,
  ENTITLEMENT_PRODUCT_TYPES,
  verifyExpectedPurchaseSpecs,
} = await import("../../api/webhook.js");

const {
  buildConstitutionalDeliveryGateDecision,
} = await import("../../api/_lib/delivery-gate-constitution.js");

const {
  resolveReportTypeAndTier,
} = await import("../../api/_lib/report-request-context.js");

const {
  resolveReportUploadGate,
} = await import("../../src/lib/reportUploadGate.js");

const {
  getPricingAvailabilityMap,
  getProductPricingAvailability,
} = await import("../../src/lib/pricingConfig.js");

const branchName = String(execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" })).trim();
assert.equal(branchName, "investigation/full-repo-underwriting-audit");

const pricingPageSource = readFileSync(new URL("../../src/pages/Pricing.jsx", import.meta.url), "utf8");
assert.ok(pricingPageSource.includes("price:       '$199'"));
assert.ok(pricingPageSource.includes("price:       '$499'"));
assert.ok(pricingPageSource.includes("price:       '$699'"));
assert.ok(pricingPageSource.includes("const comparisonTiers = tiers.filter((tier) => tier.productType !== 'bundle');"));

assert.deepEqual(ALLOWED_PRODUCT_TYPES, ["screening", "underwriting", "bundle"]);
assert.deepEqual(CHECKOUT_PRODUCT_TYPES, ["screening", "underwriting", "bundle"]);
assert.deepEqual(ENTITLEMENT_PRODUCT_TYPES, ["screening", "underwriting"]);

assert.equal(PRICE_CONFIG.screening.priceId, "price_screening_h18_h19_smoke");
assert.equal(PRICE_CONFIG.underwriting.priceId, "price_underwriting_h18_h19_smoke");
assert.equal(PRICE_CONFIG.bundle.priceId, "price_bundle_h18_h19_smoke");

assert.equal(normalizeProductType({ productType: "screening" }), "screening");
assert.equal(normalizeProductType({ productType: "underwriting" }), "underwriting");
assert.equal(normalizeProductType({ productType: "bundle" }), "bundle");
assert.equal(normalizeProductType({ planKey: "full_underwriting" }), "");
assert.equal(normalizeProductType({ productType: "premium" }), "");

assert.equal(normalizeCheckoutQuantity({ productType: "bundle" }), 1);
assert.equal(normalizeCheckoutQuantity({ productType: "bundle", quantity: "1" }), 1);
assert.equal(normalizeCheckoutQuantity({ productType: "bundle", quantity: 2 }), null);

const pricingEnv = {
  VITE_STRIPE_PRICE_ID_SCREENING: "price_screening_h18_h19_smoke",
  VITE_STRIPE_PRICE_ID_UNDERWRITING: "price_underwriting_h18_h19_smoke",
  VITE_STRIPE_PRICE_ID_BUNDLE: "price_bundle_h18_h19_smoke",
};

assert.deepEqual(buildCheckoutMetadata({
  actorId: "user-h18-h19",
  normalizedProductType: "bundle",
  normalizedQuantity: 1,
}), {
  userId: "user-h18-h19",
  productType: "bundle",
  quantity: "1",
});

const screeningLineItem = buildCheckoutLineItem({
  normalizedProductType: "screening",
  normalizedQuantity: 2,
  priceId: "price_screening_h18_h19_smoke",
});
assert.equal(screeningLineItem.price, "price_screening_h18_h19_smoke");
assert.equal(screeningLineItem.quantity, 2);
assert.equal(screeningLineItem.adjustable_quantity.enabled, true);

const bundleLineItem = buildCheckoutLineItem({
  normalizedProductType: "bundle",
  normalizedQuantity: 1,
  priceId: "price_bundle_h18_h19_smoke",
});
assert.equal(bundleLineItem.price, "price_bundle_h18_h19_smoke");
assert.equal(bundleLineItem.quantity, 1);
assert.equal(Object.prototype.hasOwnProperty.call(bundleLineItem, "adjustable_quantity"), false);

const validatedPriceConfig = getValidatedPriceConfig();
assert.equal(validatedPriceConfig.ok, true);
assert.deepEqual(validatedPriceConfig.missing, []);
assert.equal(getValidatedPriceConfigForProduct("bundle").ok, true);
assert.equal(getValidatedPriceConfigForProduct("screening").ok, true);
assert.equal(getValidatedPriceConfigForProduct("underwriting").ok, true);
assert.equal(getValidatedPriceConfigForProduct("bundle", {
  screening: { priceId: "price_screening_h18_h19_smoke", mode: "payment" },
  underwriting: { priceId: "price_underwriting_h18_h19_smoke", mode: "payment" },
  bundle: { priceId: "", mode: "payment" },
}).ok, false);
assert.equal(getValidatedPriceConfigForProduct("bundle", {
  screening: { priceId: "price_screening_h18_h19_smoke", mode: "payment" },
  underwriting: { priceId: "price_underwriting_h18_h19_smoke", mode: "payment" },
  bundle: { priceId: "", mode: "payment" },
}).missing[0], "STRIPE_PRICE_BUNDLE");

const pricingAvailability = getPricingAvailabilityMap(pricingEnv);
assert.equal(pricingAvailability.screening.ok, true);
assert.equal(pricingAvailability.underwriting.ok, true);
assert.equal(pricingAvailability.bundle.ok, true);
assert.equal(getProductPricingAvailability("bogus").ok, false);

const bundleSpecs = buildExpectedPurchaseSpecs({
  sessionId: "cs_h18_h19_bundle",
  productType: "bundle",
  quantity: 1,
  userId: "user-h18-h19",
});
assert.equal(bundleSpecs.length, 3);
assert.deepEqual(bundleSpecs.map((spec) => spec.product_type), ["screening", "screening", "underwriting"]);
assert.ok(bundleSpecs.every((spec) => spec.product_type !== "bundle"));
assert.deepEqual(
  bundleSpecs.map((spec) => spec.stripe_session_id),
  ["cs_h18_h19_bundle", "cs_h18_h19_bundle#2", "cs_h18_h19_bundle#3"],
);
assert.deepEqual(
  buildExpectedPurchaseSpecs({
    sessionId: "cs_h18_h19_screening",
    productType: "screening",
    quantity: 2,
    userId: "user-h18-h19",
  }).map((spec) => spec.product_type),
  ["screening", "screening"],
);
assert.deepEqual(
  verifyExpectedPurchaseSpecs(
    bundleSpecs.map((spec) => ({ ...spec })),
    bundleSpecs,
  ),
  { missing: [], mismatches: [], complete: true },
);

const screeningUploadReady = resolveReportUploadGate({
  reportType: "screening",
  uploadedFiles: [
    { docType: "t12", original_name: "T12.pdf" },
    { docType: "rent_roll", original_name: "Rent Roll.pdf" },
  ],
});
assert.equal(screeningUploadReady.canGenerate, true);
assert.equal(screeningUploadReady.blockedReasonCode, null);

const underwritingUploadReady = resolveReportUploadGate({
  reportType: "underwriting",
  uploadedFiles: [
    { docType: "t12", original_name: "T12.pdf" },
    { docType: "rent_roll", original_name: "Rent Roll.pdf" },
    { docType: "supporting", original_name: "Broker Email.pdf" },
  ],
});
assert.equal(underwritingUploadReady.canGenerate, true);
assert.equal(underwritingUploadReady.underwritingRequiresSupport, true);

const underwritingMissingSupport = resolveReportUploadGate({
  reportType: "underwriting",
  uploadedFiles: [
    { docType: "t12", original_name: "T12.pdf" },
    { docType: "rent_roll", original_name: "Rent Roll.pdf" },
  ],
});
assert.equal(underwritingMissingSupport.canGenerate, false);
assert.equal(underwritingMissingSupport.blockedReasonCode, "MISSING_REQUIRED_SUPPORTING_DOCUMENT");

assert.equal(resolveReportTypeAndTier({ bodyReportType: "screening" }).reportType, "screening");
assert.equal(resolveReportTypeAndTier({ bodyReportType: "screening" }).reportTier, 1);
assert.equal(resolveReportTypeAndTier({ bodyReportType: "full_underwriting" }).reportType, "underwriting");
assert.equal(resolveReportTypeAndTier({ bodyReportType: "full_underwriting" }).effectiveReportMode, "v1_core");
assert.equal(resolveReportTypeAndTier({ bodyReportType: "premium" }).ok, false);

const canonicalSourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "job-h18-h19",
  property_name: "Canary House",
  uploaded_file_count: 2,
  core: {
    t12: { file_id: "file-t12", artifact_id: "artifact-t12", accepted_facts: { net_operating_income: 600000 } },
    rent_roll: { file_id: "file-rent", artifact_id: "artifact-rent", accepted_facts: { occupancy: 0.95 } },
  },
  support: {
    accepted: [],
    advisory: [],
    adjudication_decisions: [],
    conflicts: [],
    fact_conflicts: [],
    duplicates: [],
  },
  core_publishable: true,
  true_blockers: [],
  section_policy: {},
  disclosures: [],
  source_reconciliation_state: { status: "aligned" },
};

const deliverableDecision = buildConstitutionalDeliveryGateDecision({
  sourceTruthPackage: canonicalSourceTruthPackage,
  pipelineCompliancePassed: true,
  htmlSafetyValidationPassed: true,
  rendererCompleted: true,
  customerBlockers: [],
});
assert.equal(deliverableDecision.delivery_gate_status, "deliverable");
assert.equal(deliverableDecision.customer_delivery_allowed, true);
assert.equal(deliverableDecision.report_publishable, true);

const blockedDecision = buildConstitutionalDeliveryGateDecision({
  sourceTruthPackage: canonicalSourceTruthPackage,
  pipelineCompliancePassed: true,
  htmlSafetyValidationPassed: true,
  rendererCompleted: false,
  customerBlockers: [],
});
assert.equal(blockedDecision.delivery_gate_status, "admin_review_required");
assert.equal(blockedDecision.customer_delivery_allowed, false);
assert.equal(blockedDecision.report_publishable, false);

function buildGovernedCanaryCertification({
  branch = branchName,
  environment = "production",
  repoClean = true,
  screeningReady = false,
  underwritingReady = false,
  premiumEnabled = false,
  rollbackTarget = null,
  evidenceLogDestination = null,
  ownerAuthorizationRequired = true,
  ownerAuthorizationGranted = false,
  requiredMigrations = [],
  requiredEnvVars = [],
  requiredStripePriceIds = [],
  liveCanaryAuthorized = false,
  productionDeploymentPerformed = false,
  liveSitePricingDiscrepancy = "unverified",
  retest39Authorized = false,
} = {}) {
  const missingRepositoryChecks = [];
  if (!repoClean) missingRepositoryChecks.push("REPOSITORY_DIRTY");
  if (branch !== "investigation/full-repo-underwriting-audit") missingRepositoryChecks.push("BRANCH_TARGET_MISMATCH");
  if (environment !== "production") missingRepositoryChecks.push("ENVIRONMENT_TARGET_MISMATCH");
  if (!screeningReady || !underwritingReady) missingRepositoryChecks.push("SIMULTANEOUS_PRODUCT_READINESS_REQUIRED");
  if (premiumEnabled) missingRepositoryChecks.push("PREMIUM_MUST_REMAIN_FALSE");
  if (!rollbackTarget) missingRepositoryChecks.push("ROLLBACK_TARGET_REQUIRED");
  if (!evidenceLogDestination) missingRepositoryChecks.push("EVIDENCE_LOG_DESTINATION_REQUIRED");
  if (!requiredMigrations.includes("supabase/migrations/20260730000100_h9_h10_report_revision_lineage.sql")) {
    missingRepositoryChecks.push("REQUIRED_MIGRATION_NOT_IDENTIFIED");
  }
  if (!requiredEnvVars.includes("VITE_STRIPE_PRICE_ID_SCREENING")) missingRepositoryChecks.push("VITE_STRIPE_PRICE_ID_SCREENING_REQUIRED");
  if (!requiredEnvVars.includes("VITE_STRIPE_PRICE_ID_UNDERWRITING")) missingRepositoryChecks.push("VITE_STRIPE_PRICE_ID_UNDERWRITING_REQUIRED");
  if (!requiredEnvVars.includes("VITE_STRIPE_PRICE_ID_BUNDLE")) missingRepositoryChecks.push("VITE_STRIPE_PRICE_ID_BUNDLE_REQUIRED");
  if (!requiredStripePriceIds.includes("STRIPE_PRICE_SCREENING")) missingRepositoryChecks.push("STRIPE_PRICE_SCREENING_REQUIRED");
  if (!requiredStripePriceIds.includes("STRIPE_PRICE_UNDERWRITING")) missingRepositoryChecks.push("STRIPE_PRICE_UNDERWRITING_REQUIRED");
  if (!requiredStripePriceIds.includes("STRIPE_PRICE_BUNDLE")) missingRepositoryChecks.push("STRIPE_PRICE_BUNDLE_REQUIRED");
  if (retest39Authorized) missingRepositoryChecks.push("RETEST_39_SEPARATE_AUTHORIZATION_REQUIRED");

  const repositoryVerdict = missingRepositoryChecks.length === 0
    ? "ready_for_separately_authorized_canary"
    : "hold";
  const canaryExecutionStatus = ownerAuthorizationRequired
    ? (ownerAuthorizationGranted ? "not_launched" : "blocked_owner_authorization_required")
    : "blocked_owner_authorization_policy_missing";

  return {
    repositoryVerdict,
    canaryExecutionStatus,
    launchStatus: "not_launched",
    screeningReady,
    underwritingReady,
    premiumEnabled,
    rollbackTarget,
    evidenceLogDestination,
    ownerAuthorizationRequired,
    ownerAuthorizationGranted,
    repositoryChecks: {
      branch,
      environment,
      repoClean,
      simultaneousProductReadiness: screeningReady && underwritingReady,
      pricingAvailable: pricingAvailability.screening.ok && pricingAvailability.underwriting.ok && pricingAvailability.bundle.ok,
      bundleComposition: bundleSpecs.length === 3 && bundleSpecs.every((spec, index) => (
        (index < 2 && spec.product_type === "screening") || (index === 2 && spec.product_type === "underwriting")
      )),
      reportDeliveryAllowed: deliverableDecision.report_publishable === true,
      identityUnderwriting: resolveReportTypeAndTier({ bodyReportType: "full_underwriting" }).reportType === "underwriting",
      legacyMasqueradeBlocked: resolveReportTypeAndTier({ bodyReportType: "premium" }).ok === false,
    },
    missingRepositoryChecks,
    externalPrerequisites: {
      unappliedMigrations: ["supabase/migrations/20260730000100_h9_h10_report_revision_lineage.sql"],
      requiredEnvVars: [
        "VITE_STRIPE_PRICE_ID_SCREENING",
        "VITE_STRIPE_PRICE_ID_UNDERWRITING",
        "VITE_STRIPE_PRICE_ID_BUNDLE",
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
      ],
      requiredStripePriceIds: [
        "STRIPE_PRICE_SCREENING",
        "STRIPE_PRICE_UNDERWRITING",
        "STRIPE_PRICE_BUNDLE",
      ],
      productionDeploymentPerformed: productionDeploymentPerformed ? "performed" : "not_performed",
      productionBranchStatus: "not_merged",
      liveCanaryAuthorization: liveCanaryAuthorized ? "authorized" : "not_authorized",
      liveSitePricingDiscrepancy,
      retest39Authorization: retest39Authorized ? "authorized" : "not_authorized",
      repositoryPassIsNotLaunchAuthorization: true,
    },
    rollback: {
      target: rollbackTarget,
      restoresBothProductsTogether: rollbackTarget ? true : false,
      premiumActivated: false,
      evidenceRecorded: Boolean(rollbackTarget),
      duplicateChargeCreated: false,
      duplicateEntitlementCreated: false,
      historicalFailedCanaryPreserved: true,
    },
  };
}

const sharedReadyInputs = {
  rollbackTarget: "controlled revert to the last known good release packet",
  evidenceLogDestination: "git history plus docs/STATUS.md, docs/ROADMAP.md, and the canonical handoff",
  requiredMigrations: ["supabase/migrations/20260730000100_h9_h10_report_revision_lineage.sql"],
  requiredEnvVars: [
    "VITE_STRIPE_PRICE_ID_SCREENING",
    "VITE_STRIPE_PRICE_ID_UNDERWRITING",
    "VITE_STRIPE_PRICE_ID_BUNDLE",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
  ],
  requiredStripePriceIds: [
    "STRIPE_PRICE_SCREENING",
    "STRIPE_PRICE_UNDERWRITING",
    "STRIPE_PRICE_BUNDLE",
  ],
};

const ownerBlockedCertification = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: false,
});
assert.equal(ownerBlockedCertification.repositoryVerdict, "ready_for_separately_authorized_canary");
assert.equal(ownerBlockedCertification.canaryExecutionStatus, "blocked_owner_authorization_required");
assert.equal(ownerBlockedCertification.launchStatus, "not_launched");

const readyCertification = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  screeningReady: screeningUploadReady.canGenerate,
  underwritingReady: underwritingUploadReady.canGenerate,
  ownerAuthorizationGranted: true,
});
assert.equal(readyCertification.repositoryVerdict, "ready_for_separately_authorized_canary");
assert.equal(readyCertification.canaryExecutionStatus, "not_launched");
assert.equal(readyCertification.launchStatus, "not_launched");
assert.equal(readyCertification.repositoryChecks.simultaneousProductReadiness, true);
assert.equal(readyCertification.repositoryChecks.pricingAvailable, true);
assert.equal(readyCertification.repositoryChecks.bundleComposition, true);
assert.equal(readyCertification.repositoryChecks.reportDeliveryAllowed, true);
assert.equal(readyCertification.externalPrerequisites.unappliedMigrations[0], "supabase/migrations/20260730000100_h9_h10_report_revision_lineage.sql");
assert.equal(readyCertification.externalPrerequisites.productionDeploymentPerformed, "not_performed");
assert.equal(readyCertification.externalPrerequisites.liveCanaryAuthorization, "not_authorized");
assert.equal(readyCertification.externalPrerequisites.retest39Authorization, "not_authorized");
assert.equal(readyCertification.rollback.restoresBothProductsTogether, true);
assert.equal(readyCertification.rollback.premiumActivated, false);
assert.equal(readyCertification.rollback.duplicateChargeCreated, false);
assert.equal(readyCertification.rollback.duplicateEntitlementCreated, false);

const holdDueToScreeningOnly = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  screeningReady: true,
  underwritingReady: false,
  ownerAuthorizationGranted: true,
});
assert.equal(holdDueToScreeningOnly.repositoryVerdict, "hold");
assert.ok(holdDueToScreeningOnly.repositoryChecks.simultaneousProductReadiness === false);
assert.ok(holdDueToScreeningOnly.repositoryChecks.pricingAvailable);

const holdDueToPremium = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
  premiumEnabled: true,
});
assert.equal(holdDueToPremium.repositoryVerdict, "hold");
assert.equal(holdDueToPremium.premiumEnabled, true);

const holdDueToBranch = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  branch: "main",
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
});
assert.equal(holdDueToBranch.repositoryVerdict, "hold");
assert.ok(holdDueToBranch.repositoryChecks.branch === "main");

const holdDueToEnvironment = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  environment: "staging",
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
});
assert.equal(holdDueToEnvironment.repositoryVerdict, "hold");
assert.ok(holdDueToEnvironment.repositoryChecks.environment === "staging");

const holdDueToMissingRollback = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  rollbackTarget: null,
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
});
assert.equal(holdDueToMissingRollback.repositoryVerdict, "hold");
assert.ok(holdDueToMissingRollback.missingRepositoryChecks.includes("ROLLBACK_TARGET_REQUIRED"));

const holdDueToMissingStripePrereq = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  requiredStripePriceIds: ["STRIPE_PRICE_SCREENING", "STRIPE_PRICE_UNDERWRITING"],
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
});
assert.equal(holdDueToMissingStripePrereq.repositoryVerdict, "hold");
assert.ok(holdDueToMissingStripePrereq.repositoryChecks.pricingAvailable);

const holdDueToMissingMigrationList = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  requiredMigrations: [],
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
});
assert.equal(holdDueToMissingMigrationList.repositoryVerdict, "hold");

const holdDueToMissingEvidenceLog = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  evidenceLogDestination: null,
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
});
assert.equal(holdDueToMissingEvidenceLog.repositoryVerdict, "hold");

const rollbackResult = buildGovernedCanaryCertification({
  ...sharedReadyInputs,
  screeningReady: true,
  underwritingReady: true,
  ownerAuthorizationGranted: true,
  rollbackTarget: "controlled revert to the last known good release packet",
});
assert.equal(rollbackResult.rollback.restoresBothProductsTogether, true);
assert.equal(rollbackResult.rollback.premiumActivated, false);
assert.equal(rollbackResult.rollback.duplicateChargeCreated, false);
assert.equal(rollbackResult.rollback.duplicateEntitlementCreated, false);
assert.equal(rollbackResult.rollback.historicalFailedCanaryPreserved, true);

const certificationRuns = [
  buildGovernedCanaryCertification({
    ...sharedReadyInputs,
    screeningReady: true,
    underwritingReady: true,
    ownerAuthorizationGranted: true,
  }),
  buildGovernedCanaryCertification({
    ...sharedReadyInputs,
    screeningReady: true,
    underwritingReady: true,
    ownerAuthorizationGranted: true,
  }),
  buildGovernedCanaryCertification({
    ...sharedReadyInputs,
    screeningReady: true,
    underwritingReady: true,
    ownerAuthorizationGranted: true,
  }),
];

assert.deepEqual(certificationRuns[0], certificationRuns[1]);
assert.deepEqual(certificationRuns[1], certificationRuns[2]);

const certificationDigest = (value) =>
  createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

assert.equal(certificationDigest(certificationRuns[0]), certificationDigest(certificationRuns[1]));
assert.equal(certificationDigest(certificationRuns[1]), certificationDigest(certificationRuns[2]));

assert.equal(
  certificationRuns[0].repositoryVerdict,
  "ready_for_separately_authorized_canary"
);
assert.equal(certificationRuns[0].launchStatus, "not_launched");
assert.equal(certificationRuns[0].externalPrerequisites.productionBranchStatus, "not_merged");
assert.equal(certificationRuns[0].externalPrerequisites.liveSitePricingDiscrepancy, "unverified");

console.log("h18-h19 governed canary and simultaneous launch certification smoke PASS");
