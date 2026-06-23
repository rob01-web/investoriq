import {
  assessAcquisitionMemoBossCompliance,
  enforceAcquisitionMemoBossContractOnHtml,
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
  const compliance = assessAcquisitionMemoBossCompliance(
    acquisitionMemoBossContract,
    repairedHtml,
    enforcement?.validation || null
  );

  return {
    html: repairedHtml,
    compliance,
    enforcement,
  };
}

export function finalizeAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs, acquisitionMemoBossContract) {
  return runAcquisitionMemoV2Orchestrator({
    acquisitionMemoV2DocumentArgs,
    acquisitionMemoBossContract,
  });
}
