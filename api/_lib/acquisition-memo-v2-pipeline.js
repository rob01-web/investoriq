import { finalizeAcquisitionMemoV2Html } from "./acquisition-memo-v2-orchestrator.js";

export async function runAcquisitionMemoV2Pipeline({
  acquisitionMemoV2DocumentArgs = null,
  acquisitionMemoBossContract = null,
} = {}) {
  const finalization = await Promise.resolve(
    finalizeAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs, acquisitionMemoBossContract)
  );
  return {
    ...finalization,
    sealedLane: "acquisition_memo_v2_lane",
    acquisitionMemoV2OwnsFinalHtml: true,
  };
}
