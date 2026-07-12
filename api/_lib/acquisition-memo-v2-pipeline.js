import { finalizeAcquisitionMemoV2Html } from "./acquisition-memo-v2-orchestrator.js";
import { isCanonicalSourceTruthPackage } from "./source-truth-package.js";

export async function runAcquisitionMemoV2Pipeline({
  acquisitionMemoV2DocumentArgs = null,
  acquisitionMemoBossContract = null,
} = {}) {
  const sourceTruthPackage = acquisitionMemoV2DocumentArgs?.sourceTruthPackage || null;
  if (
    acquisitionMemoV2DocumentArgs?.sourceTruthRequired === true &&
    !isCanonicalSourceTruthPackage(sourceTruthPackage)
  ) {
    const error = new Error("CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED");
    error.code = "REPORT_GENERATION_FAILED";
    error.context = { lane: "acquisition_memo_v2", stage: "source_truth_authority" };
    throw error;
  }
  if (
    acquisitionMemoV2DocumentArgs?.sourceTruthRequired === true &&
    sourceTruthPackage?.core_publishable !== true
  ) {
    const error = new Error("ACQUISITION_MEMO_SOURCE_TRUTH_NOT_PUBLISHABLE");
    error.code = "REPORT_GENERATION_FAILED";
    error.context = {
      lane: "acquisition_memo_v2",
      stage: "source_truth_authority",
      true_blockers: sourceTruthPackage?.true_blockers || [],
    };
    throw error;
  }
  const finalization = await Promise.resolve(
    finalizeAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs, acquisitionMemoBossContract)
  );
  return {
    ...finalization,
    sealedCustomerOutput: true,
    sealedLane: "acquisition_memo_v2_lane",
    acquisitionMemoV2OwnsFinalHtml: true,
    sourceTruthPackage,
  };
}
