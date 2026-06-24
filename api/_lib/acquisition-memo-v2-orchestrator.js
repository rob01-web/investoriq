import {
  assessAcquisitionMemoBossCompliance,
  enforceAcquisitionMemoBossContractOnHtml,
  validateAcquisitionMemoBossContract,
} from "./acquisition-memo-boss-contract.js";
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "./acquisition-memo-v2-customer-surface-model.js";
import {
  applyAcquisitionMemoV2BossRepairPlan,
  buildAcquisitionMemoV2BossRepairPlan,
  repairAcquisitionMemoV2HtmlForRepairPlan,
} from "./acquisition-memo-v2-boss-repair.js";
import { buildAcquisitionMemoV2FinalDeliveryDecision } from "./acquisition-memo-v2-final-decision.js";
import { renderCompleteAcquisitionMemoV2Html } from "./acquisition-memo-v2-document.js";

function stripHtmlForExcerpt(html = "") {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptAround(text = "", needle = "") {
  const source = String(text || "");
  const normalizedSource = source.toLowerCase();
  const normalizedNeedle = String(needle || "").toLowerCase();
  const index = normalizedNeedle ? normalizedSource.indexOf(normalizedNeedle) : -1;
  if (index < 0) return null;
  const start = Math.max(0, index - 90);
  const end = Math.min(source.length, index + normalizedNeedle.length + 90);
  return source.slice(start, end).trim();
}

function keywordsForViolation(violation = {}) {
  const code = String(violation?.code || "").toUpperCase();
  const section = String(violation?.section || violation?.path || "").toLowerCase();
  if (code.includes("RENOVATION")) return ["renovation ROI", "payback", "NOI impact", "value impact", "implementation modeling"];
  if (code.includes("CURRENT_DEBT") || section.includes("currentdebt")) return ["current debt", "DSCR", "refinance", "refi"];
  if (code.includes("FORBIDDEN")) return ["DSCR", "refinance", "refi", "DCF", "waterfall", "equity return", "deal score", "final recommendation", "BUY", "SELL", "HOLD", "loan approval", "lender commitment"];
  if (code.includes("INTERNAL")) return ["Boss Contract", "CustomerSurfaceModel", "Source Authority", "canonical source package", "V2 projection", "stack trace"];
  return [violation?.message, violation?.section, violation?.path].filter(Boolean);
}

function buildViolationExcerpts(html = "", violations = []) {
  const text = stripHtmlForExcerpt(html);
  return (Array.isArray(violations) ? violations : []).map((violation) => {
    const keywords = keywordsForViolation(violation);
    const excerpt = keywords.map((keyword) => excerptAround(text, keyword)).find(Boolean) || null;
    return {
      code: violation?.code || null,
      section: violation?.section || violation?.path || null,
      excerpt,
    };
  });
}

function buildFinalComplianceDiagnostics({
  finalization = null,
  bossContractValidation = null,
  customerSurfaceModelValidation = null,
  repairPlan = null,
  repairAttempted = false,
  repairedHtmlRevalidated = false,
} = {}) {
  const finalHtml = String(finalization?.html || "");
  return {
    finalBossComplianceOk: Boolean(finalization?.compliance?.ok),
    finalBossViolations: Array.isArray(finalization?.compliance?.violations) ? finalization.compliance.violations : [],
    bossContractValidationResult: bossContractValidation || finalization?.bossCompliance?.validation || null,
    customerSurfaceModelValidation: customerSurfaceModelValidation || finalization?.customerSurfaceModelValidation || null,
    customerSurfaceHtmlValidation: finalization?.customerSurfaceHtmlValidation || null,
    repairPlan: repairPlan || null,
    repairAttempted: Boolean(repairAttempted),
    repairedHtmlRevalidated: Boolean(repairedHtmlRevalidated),
    finalHtmlLength: finalHtml.length,
    violationExcerpts: buildViolationExcerpts(finalHtml, finalization?.compliance?.violations || []),
  };
}

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
  const renderAndValidate = (customerSurfaceModel, bossContract = acquisitionMemoBossContract, htmlRepairPlan = null) => {
    const baseHtml = renderCompleteAcquisitionMemoV2Html({
      ...(acquisitionMemoV2DocumentArgs || {}),
      customerSurfaceModel,
      bossContract,
    });
    const enforcement = enforceAcquisitionMemoBossContractOnHtml(bossContract, baseHtml);
    const repairedHtml = repairAcquisitionMemoV2HtmlForRepairPlan(
      enforcement?.repairedHtml || baseHtml,
      htmlRepairPlan
    );
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
  const initialBossContractValidation = validateAcquisitionMemoBossContract(acquisitionMemoBossContract);
  const initialRepairPlan = buildAcquisitionMemoV2BossRepairPlan({
    customerSurfaceModelValidation: initialCustomerSurfaceModelValidation,
  });
  if (initialRepairPlan.coreFatal.length > 0) {
    const failedFinalization = {
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
    const finalComplianceDiagnostics = buildFinalComplianceDiagnostics({
      finalization: failedFinalization,
      bossContractValidation: initialBossContractValidation,
      customerSurfaceModelValidation: initialCustomerSurfaceModelValidation,
      repairPlan: initialRepairPlan,
    });
    const finalDeliveryDecision = buildAcquisitionMemoV2FinalDeliveryDecision({
      finalization: failedFinalization,
      coreGate: acquisitionMemoBossContract?.coreGate || null,
      repairPlan: initialRepairPlan,
      diagnostics: finalComplianceDiagnostics,
    });
    return {
      ...failedFinalization,
      finalComplianceDiagnostics,
      finalDeliveryDecision,
    };
  }

  let customerSurfaceModel = initialCustomerSurfaceModel;
  let bossContract = acquisitionMemoBossContract;
  let customerSurfaceModelValidation = initialCustomerSurfaceModelValidation;
  let repairAttempted = false;
  let repairedHtmlRevalidated = false;
  let lastRepairPlan = null;
  if (initialRepairPlan.shouldRetry) {
    customerSurfaceModel = applyAcquisitionMemoV2BossRepairPlan(customerSurfaceModel, initialRepairPlan);
    bossContract = applyAcquisitionMemoV2BossRepairPlan(bossContract, initialRepairPlan);
    customerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel);
    repairAttempted = true;
    lastRepairPlan = initialRepairPlan;
  }

  let finalization = renderAndValidate(customerSurfaceModel, bossContract);

  if (!finalization.compliance.ok) {
    const repairPlan = buildAcquisitionMemoV2BossRepairPlan({
      bossCompliance: finalization.bossCompliance,
      customerSurfaceHtmlValidation: finalization.customerSurfaceHtmlValidation,
    });
    if (repairPlan.coreFatal.length === 0 && repairPlan.shouldRetry) {
      repairAttempted = true;
      lastRepairPlan = repairPlan;
      const repairedCustomerSurfaceModel = applyAcquisitionMemoV2BossRepairPlan(customerSurfaceModel, repairPlan);
      const repairedBossContract = applyAcquisitionMemoV2BossRepairPlan(bossContract, repairPlan);
      const repairedCustomerSurfaceModelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(repairedCustomerSurfaceModel);
      if (repairedCustomerSurfaceModelValidation.ok || repairPlan.repairableSectionKeys.length > 0) {
        const retryFinalization = renderAndValidate(repairedCustomerSurfaceModel, repairedBossContract, repairPlan);
        repairedHtmlRevalidated = true;
        if (retryFinalization.compliance.ok) {
          const finalComplianceDiagnostics = buildFinalComplianceDiagnostics({
            finalization: retryFinalization,
            bossContractValidation: validateAcquisitionMemoBossContract(repairedBossContract),
            customerSurfaceModelValidation: repairedCustomerSurfaceModelValidation,
            repairPlan,
            repairAttempted: true,
            repairedHtmlRevalidated: true,
          });
          return {
            ...retryFinalization,
            customerSurfaceModelValidation: repairedCustomerSurfaceModelValidation,
            finalComplianceDiagnostics,
            finalDeliveryDecision: buildAcquisitionMemoV2FinalDeliveryDecision({
              finalization: {
                ...retryFinalization,
                customerSurfaceModelValidation: repairedCustomerSurfaceModelValidation,
              },
              coreGate: repairedBossContract?.coreGate || null,
              repairPlan,
              diagnostics: finalComplianceDiagnostics,
            }),
          };
        }
        finalization = {
          ...retryFinalization,
          customerSurfaceModelValidation: repairedCustomerSurfaceModelValidation,
        };
      }
    }
  }

  const finalRepairPlan = finalization.compliance?.ok
    ? lastRepairPlan
    : buildAcquisitionMemoV2BossRepairPlan({
        bossCompliance: finalization.bossCompliance,
        customerSurfaceHtmlValidation: finalization.customerSurfaceHtmlValidation,
      });
  const finalComplianceDiagnostics = buildFinalComplianceDiagnostics({
    finalization,
    bossContractValidation: validateAcquisitionMemoBossContract(bossContract),
    customerSurfaceModelValidation,
    repairPlan: finalRepairPlan,
    repairAttempted,
    repairedHtmlRevalidated,
  });
  return {
    ...finalization,
    customerSurfaceModelValidation,
    finalComplianceDiagnostics,
    finalDeliveryDecision: buildAcquisitionMemoV2FinalDeliveryDecision({
      finalization: {
        ...finalization,
        customerSurfaceModelValidation,
      },
      coreGate: bossContract?.coreGate || null,
      repairPlan: finalRepairPlan,
      diagnostics: finalComplianceDiagnostics,
    }),
  };
}

export function finalizeAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs, acquisitionMemoBossContract) {
  return runAcquisitionMemoV2Orchestrator({
    acquisitionMemoV2DocumentArgs,
    acquisitionMemoBossContract,
  });
}
