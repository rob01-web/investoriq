import {
  enforceAcquisitionMemoBossContractOnHtml,
  validateAcquisitionMemoRenderAgainstBossContract,
} from "./acquisition-memo-boss-contract.js";
import { renderCompleteAcquisitionMemoV2Html } from "./acquisition-memo-v2-document.js";

export function runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs,
  acquisitionMemoBossContract,
} = {}) {
  const baseHtml = renderCompleteAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs || {});
  if (!acquisitionMemoBossContract) {
    return {
      html: baseHtml,
      compliance: { ok: true, violations: [] },
    };
  }

  const enforcement = enforceAcquisitionMemoBossContractOnHtml(
    acquisitionMemoBossContract,
    baseHtml
  );
  const repairedHtml = enforcement?.repairedHtml || baseHtml;
  const validation = validateAcquisitionMemoRenderAgainstBossContract(
    acquisitionMemoBossContract,
    repairedHtml
  );

  return {
    html: repairedHtml,
    compliance: validation?.ok
      ? { ok: true, violations: [] }
      : validation || { ok: false, violations: [] },
  };
}

export function finalizeAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs, acquisitionMemoBossContract) {
  return runAcquisitionMemoV2Orchestrator({
    acquisitionMemoV2DocumentArgs,
    acquisitionMemoBossContract,
  });
}
