// Canonical current Full Underwriting pipeline authority.
//
// Historical Acquisition Memo V2 modules remain reusable implementation details
// until they are safely renamed/re-homed. They do not define product identity,
// launch authority, delivery authority, or publication authority.
import { runAcquisitionMemoV2Pipeline } from "./acquisition-memo-v2-pipeline.js";

export async function runFullUnderwritingPipeline(args = {}) {
  return runAcquisitionMemoV2Pipeline(args);
}

export const FULL_UNDERWRITING_PIPELINE_AUTHORITY = Object.freeze({
  product: "full_underwriting",
  reportFamily: "full_underwriting",
  implementationAdapter: "historical_acquisition_memo_v2_components",
  historicalImplementationHasConstitutionalAuthority: false,
});
