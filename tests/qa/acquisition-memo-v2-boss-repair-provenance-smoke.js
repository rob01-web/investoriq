import assert from "assert";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";

const { applyAcquisitionMemoV2BossRepairPlan } = await import("../../api/_lib/acquisition-memo-v2-boss-repair.js");

const sourceModel = {
  sections: {
    unitMix: {
      status: "required",
      factAvailability: {
        required: ["alpha", "beta"],
        available: ["alpha"],
        missing: ["beta"],
        sourceBacked: true,
      },
    },
  },
};

const repairPlan = { repairableSectionKeys: ["unitMix"] };
const repairedModel = applyAcquisitionMemoV2BossRepairPlan(sourceModel, repairPlan);

assert.equal(repairedModel.sections.unitMix.status, "required");
assert.equal(repairedModel.sections.unitMix.factAvailability.sourceBacked, true);
assert.deepEqual(repairedModel.sections.unitMix.factAvailability.required, ["alpha", "beta"]);
assert.deepEqual(repairedModel.sections.unitMix.factAvailability.available, ["alpha"]);
assert.deepEqual(repairedModel.sections.unitMix.factAvailability.missing, ["beta"]);

console.log("acquisition-memo-v2 boss-repair provenance smoke PASS");
