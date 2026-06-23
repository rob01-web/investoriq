import {
  assessAcquisitionMemoBossCompliance,
  enforceAcquisitionMemoBossContractOnHtml,
} from "./acquisition-memo-boss-contract.js";
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "./acquisition-memo-v2-customer-surface-model.js";
import { renderCompleteAcquisitionMemoV2Html } from "./acquisition-memo-v2-document.js";

export function runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs,
  acquisitionMemoBossContract,
} = {}) {
  const customerSurfaceModel =
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

  const customerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel);
  if (!customerSurfaceModelValidation.ok) {
    return {
      html: "",
      compliance: {
        ok: false,
        violations: customerSurfaceModelValidation.issues.map((issue) => ({
          code: issue.code,
          severity: issue.severity || "critical",
          section: issue.path || "customerSurfaceModel",
          message: issue.message,
        })),
      },
      customerSurfaceModel,
      customerSurfaceModelValidation,
      customerSurfaceHtmlValidation: { ok: false, issues: [] },
    };
  }

  const baseHtml = renderCompleteAcquisitionMemoV2Html({
    ...(acquisitionMemoV2DocumentArgs || {}),
    customerSurfaceModel,
  });

  const enforcement = enforceAcquisitionMemoBossContractOnHtml(acquisitionMemoBossContract, baseHtml);
  const repairedHtml = enforcement?.repairedHtml || baseHtml;
  const bossCompliance = assessAcquisitionMemoBossCompliance(
    acquisitionMemoBossContract,
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
    customerSurfaceModelValidation,
    customerSurfaceHtmlValidation,
    enforcement,
  };
}

export function finalizeAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs, acquisitionMemoBossContract) {
  return runAcquisitionMemoV2Orchestrator({
    acquisitionMemoV2DocumentArgs,
    acquisitionMemoBossContract,
  });
}
