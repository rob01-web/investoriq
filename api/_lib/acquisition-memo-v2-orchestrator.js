import {
  assessAcquisitionMemoBossCompliance,
  enforceAcquisitionMemoBossContractOnHtml,
} from "./acquisition-memo-boss-contract.js";
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "./acquisition-memo-v2-customer-surface-model.js";
import {
  applyAcquisitionMemoV2BossRepairPlan,
  buildAcquisitionMemoV2BossRepairPlan,
} from "./acquisition-memo-v2-boss-repair.js";
import { renderCompleteAcquisitionMemoV2Html } from "./acquisition-memo-v2-document.js";

export function runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs,
  acquisitionMemoBossContract,
} = {}) {
  const initialCustomerSurfaceModel =
    acquisitionMemoV2DocumentArgs?.customerSurfaceModel ||
    buildAcquisitionMemoV2CustomerSurfaceModel({
      canonicalSourcePackage: acquisitionMemoV2DocumentArgs?.sourcePackage || null,
      acquisitionMemoProjection: acquisitionMemoV2DocumentArgs?.acquisitionMemoProjection || null,
      bossContract: acquisitionMemoBossContract || acquisitionMemoV2DocumentArgs?.bossContract || null,
      coreMetrics: acquisitionMemoV2DocumentArgs?.coreMetrics || null,
      propertyProfile: acquisitionMemoV2DocumentArgs?.propertyProfile || null,
      reportMeta: acquisitionMemoV2DocumentArgs?.reportMeta || null,
      reportMode: acquisitionMemoV2DocumentArgs?.reportMode || null,
    });
  const renderAndValidate = (customerSurfaceModel, bossContract = acquisitionMemoBossContract) => {
    const baseHtml = renderCompleteAcquisitionMemoV2Html({
      ...(acquisitionMemoV2DocumentArgs || {}),
      customerSurfaceModel,
      bossContract,
    });
    const enforcement = enforceAcquisitionMemoBossContractOnHtml(bossContract, baseHtml);
    const repairedHtml = enforcement?.repairedHtml || baseHtml;
    const bossCompliance = assessAcquisitionMemoBossCompliance(
      bossContract,
      repairedHtml,
      enforcement?.validation || null
    );
    const customerSurfaceHtmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(
      repairedHtml,
      customerSurfaceModel
    );
    const compliance = {
      ok: Boolean(bossCompliance?.ok && customerSurfaceHtmlValidation?.ok),
      violations: [
        ...(Array.isArray(bossCompliance?.violations) ? bossCompliance.violations : []),
        ...(Array.isArray(customerSurfaceHtmlValidation?.issues)
          ? customerSurfaceHtmlValidation.issues.map((issue) => ({
              code: issue.code,
              severity: issue.severity || "critical",
              section: issue.path || "customerSurfaceModel",
              message: issue.message,
            }))
          : []),
      ],
    };
    return {
      html: repairedHtml,
      compliance,
      bossCompliance,
      customerSurfaceModel,
      customerSurfaceHtmlValidation,
      enforcement,
    };
  };

  const initialCustomerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(initialCustomerSurfaceModel);
  const initialRepairPlan = buildAcquisitionMemoV2BossRepairPlan({
    customerSurfaceModelValidation: initialCustomerSurfaceModelValidation,
  });
  if (initialRepairPlan.coreFatal.length > 0) {
    return {
      html: "",
      compliance: {
        ok: false,
        violations: initialCustomerSurfaceModelValidation.issues.map((issue) => ({
          code: issue.code,
          severity: issue.severity || "critical",
          section: issue.path || "customerSurfaceModel",
          message: issue.message,
        })),
      },
      customerSurfaceModel: initialCustomerSurfaceModel,
      customerSurfaceModelValidation: initialCustomerSurfaceModelValidation,
      customerSurfaceHtmlValidation: { ok: false, issues: [] },
    };
  }

  let customerSurfaceModel = initialCustomerSurfaceModel;
  let bossContract = acquisitionMemoBossContract;
  let customerSurfaceModelValidation = initialCustomerSurfaceModelValidation;
  if (initialRepairPlan.shouldRetry) {
    customerSurfaceModel = applyAcquisitionMemoV2BossRepairPlan(customerSurfaceModel, initialRepairPlan);
    bossContract = applyAcquisitionMemoV2BossRepairPlan(bossContract, initialRepairPlan);
    customerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel);
  }

  let finalization = renderAndValidate(customerSurfaceModel, bossContract);

  if (!finalization.compliance.ok) {
    const repairPlan = buildAcquisitionMemoV2BossRepairPlan({
      bossCompliance: finalization.bossCompliance,
      customerSurfaceHtmlValidation: finalization.customerSurfaceHtmlValidation,
    });
    if (repairPlan.coreFatal.length === 0 && repairPlan.shouldRetry) {
      const repairedCustomerSurfaceModel = applyAcquisitionMemoV2BossRepairPlan(customerSurfaceModel, repairPlan);
      const repairedBossContract = applyAcquisitionMemoV2BossRepairPlan(bossContract, repairPlan);
      const repairedCustomerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(repairedCustomerSurfaceModel);
      if (repairedCustomerSurfaceModelValidation.ok || repairPlan.repairableSectionKeys.length > 0) {
        const retryFinalization = renderAndValidate(repairedCustomerSurfaceModel, repairedBossContract);
        if (retryFinalization.compliance.ok) {
          return {
            ...retryFinalization,
            customerSurfaceModelValidation: repairedCustomerSurfaceModelValidation,
          };
        }
        finalization = {
          ...retryFinalization,
          customerSurfaceModelValidation: repairedCustomerSurfaceModelValidation,
        };
      }
    }
  }

  return {
    ...finalization,
    customerSurfaceModelValidation,
  };
}

export function finalizeAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs, acquisitionMemoBossContract) {
  return runAcquisitionMemoV2Orchestrator({
    acquisitionMemoV2DocumentArgs,
    acquisitionMemoBossContract,
  });
}
