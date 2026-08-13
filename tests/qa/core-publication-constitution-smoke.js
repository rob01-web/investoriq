import assert from "node:assert/strict";

import {
  buildCorePublicationConstitution,
  buildCoreTruthSufficiencyScore,
} from "../../api/_lib/core-publication-constitution.js";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";

function buildPackage({ t12, rentRoll }) {
  return buildCanonicalSourceTruthPackage({
    jobId: "constitution-smoke-job",
    propertyName: "Constitution Smoke",
    artifacts: [
      { id: "constitution-t12", type: "t12_parsed", payload: structuredClone(t12) },
      { id: "constitution-rent-roll", type: "rent_roll_parsed", payload: structuredClone(rentRoll) },
    ],
  });
}

const strongT12 = {
  file_id: "t12-strong",
  original_filename: "T12_Strong.xlsx",
  effective_gross_income: 1000000,
  total_operating_expenses: 400000,
  net_operating_income: 600000,
  gross_potential_rent: 1040000,
  income_lines: [{ label: "Rent", amount: 1000000 }],
  expense_lines: [{ label: "Opex", amount: 400000 }],
  core_t12_validation: { ok: true, failures: [] },
};

const strongRentRoll = {
  file_id: "rr-strong",
  original_filename: "RentRoll_Strong.xlsx",
  total_units: 10,
  annual_in_place_rent: 240000,
  occupancy: 0.9,
  units: [
    { unit: "1", status: "Occupied", in_place_rent: 2000, market_rent: 2200, lease_start: "2025-01-01" },
    { unit: "2", status: "Occupied", in_place_rent: 2000, market_rent: 2200, lease_end: "2025-12-31" },
    { unit: "3", status: "Vacant", in_place_rent: 0, market_rent: 2200, square_feet: 700 },
    { unit: "4", status: "Occupied", in_place_rent: 2000, market_rent: 2200, square_feet: 710 },
  ],
  unit_mix: [{ unit_type: "1BR", count: 10, current_rent: 2000, market_rent: 2200 }],
  totals: { summary_row_detected: false },
};

const strongPackage = buildPackage({ t12: strongT12, rentRoll: strongRentRoll });
const strongConstitution = strongPackage.core_publication_constitution;
assert.equal(strongConstitution.minimum_truth_set.t12.satisfied, true);
assert.equal(strongConstitution.minimum_truth_set.rent_roll.satisfied, true);
assert.equal(strongConstitution.minimum_truth_set.satisfied, true);
assert.equal(strongConstitution.t12_truth_set.field_receipts.every((receipt) => receipt.present && receipt.usable), true);
assert.equal(strongConstitution.rent_roll_truth_set.field_receipts.every((receipt) => receipt.present && receipt.usable), true);
assert.equal(strongConstitution.ctss.band, "80-100");

const t12MissingEgiPackage = buildPackage({
  t12: {
    ...strongT12,
    effective_gross_income: undefined,
  },
  rentRoll: strongRentRoll,
});
assert.equal(t12MissingEgiPackage.core_publication_constitution.minimum_truth_set.t12.satisfied, false);
assert.equal(
  t12MissingEgiPackage.core_publication_constitution.minimum_truth_set.t12.field_receipts.find((receipt) => receipt.field_name === "effective_gross_income")?.missing,
  true,
);

const t12MissingExpensePackage = buildPackage({
  t12: {
    ...strongT12,
    total_operating_expenses: undefined,
  },
  rentRoll: strongRentRoll,
});
assert.equal(t12MissingExpensePackage.core_publication_constitution.minimum_truth_set.t12.satisfied, false);
assert.equal(
  t12MissingExpensePackage.core_publication_constitution.minimum_truth_set.t12.field_receipts.find((receipt) => receipt.field_name === "total_operating_expenses")?.missing,
  true,
);

const t12MissingNoiPackage = buildPackage({
  t12: {
    ...strongT12,
    net_operating_income: undefined,
  },
  rentRoll: strongRentRoll,
});
assert.equal(t12MissingNoiPackage.core_publication_constitution.minimum_truth_set.t12.satisfied, false);
assert.equal(
  t12MissingNoiPackage.core_publication_constitution.minimum_truth_set.t12.field_receipts.find((receipt) => receipt.field_name === "net_operating_income")?.missing,
  true,
);

const rentRollDerivedPackage = buildPackage({
  t12: strongT12,
  rentRoll: {
    file_id: "rr-derived",
    original_filename: "RentRoll_Derived.xlsx",
    total_units: 4,
    units: [
      { unit: "1", status: "Occupied", in_place_rent: 2000 },
      { unit: "2", status: "Occupied", in_place_rent: 2000 },
      { unit: "3", status: "Vacant", in_place_rent: 0 },
      { unit: "4", status: "Occupied", in_place_rent: 2000 },
    ],
  },
});
assert.equal(rentRollDerivedPackage.core_publication_constitution.minimum_truth_set.rent_roll.satisfied, true);
assert.equal(
  rentRollDerivedPackage.core_publication_constitution.minimum_truth_set.rent_roll.field_receipts.find((receipt) => receipt.field_name === "annual_in_place_rent")?.source_path,
  "canonical_deterministic_derivation",
);

const rentRollMissingTotalUnitsPackage = buildPackage({
  t12: strongT12,
  rentRoll: {
    file_id: "rr-missing-units",
    original_filename: "RentRoll_MissingUnits.xlsx",
    annual_in_place_rent: 240000,
  },
});
assert.equal(rentRollMissingTotalUnitsPackage.core_publication_constitution.minimum_truth_set.rent_roll.satisfied, false);
assert.equal(
  rentRollMissingTotalUnitsPackage.core_publication_constitution.minimum_truth_set.rent_roll.missing_fields.includes("total_units"),
  true,
);

function buildBandScore({
  t12AcceptedFacts,
  t12Evidence,
  t12Bucket = "section_constrained_publishable",
  rentRollAcceptedFacts,
  rentRollEvidence,
  rentRollBucket = "section_constrained_publishable",
  reconciliationBucket = "section_constrained_publishable",
} = {}) {
  const sourceTruthPackage = {
    core: {
      t12: {
        accepted_facts: structuredClone(t12AcceptedFacts),
      },
      rent_roll: {
        accepted_facts: structuredClone(rentRollAcceptedFacts),
      },
    },
  };
  return buildCoreTruthSufficiencyScore({
    sourceTruthPackage,
    t12State: {
      status: "validated",
      publishability_bucket: t12Bucket,
      evidence: structuredClone(t12Evidence),
    },
    rentRollState: {
      status: "validated",
      publishability_bucket: rentRollBucket,
      evidence: structuredClone(rentRollEvidence),
    },
    sourceReconciliationState: {
      publishability_bucket: reconciliationBucket,
    },
  });
}

const sufficientScore = buildBandScore({
  t12AcceptedFacts: {
    effective_gross_income: 1000000,
    total_operating_expenses: 400000,
    net_operating_income: 600000,
  },
  t12Evidence: {
    reconciles: true,
  },
  t12Bucket: "core_sufficient_publishable",
  rentRollAcceptedFacts: {
    total_units: 4,
    annual_in_place_rent: 96000,
  },
  rentRollEvidence: {
    has_unit_mix_or_derivable_rows: true,
    unit_row_count: 0,
    occupancy: null,
    optional_detail_present: false,
    summary_row_detected: false,
    has_market_rent: false,
    has_lease_dates: false,
    has_square_footage: false,
  },
  rentRollBucket: "core_sufficient_publishable",
  reconciliationBucket: "core_sufficient_publishable",
});
assert.equal(sufficientScore.band, "60-79");

const thinScore = buildBandScore({
  t12AcceptedFacts: {
    effective_gross_income: 1000000,
    total_operating_expenses: 400000,
    net_operating_income: 600000,
  },
  t12Evidence: {
    reconciles: true,
  },
  rentRollAcceptedFacts: {
    total_units: 4,
    annual_in_place_rent: 96000,
  },
  rentRollEvidence: {
    has_unit_mix_or_derivable_rows: true,
    unit_row_count: 0,
    occupancy: null,
    optional_detail_present: false,
    summary_row_detected: false,
    has_market_rent: false,
    has_lease_dates: false,
    has_square_footage: false,
  },
});
assert.equal(thinScore.band, "40-59");

const insufficientScore = buildBandScore({
  t12AcceptedFacts: {
    total_operating_expenses: 400000,
    net_operating_income: 600000,
  },
  t12Evidence: {},
  rentRollAcceptedFacts: {
    annual_in_place_rent: 240000,
  },
  rentRollEvidence: {},
});
assert.equal(insufficientScore.band, "0-39");

assert.equal(strongConstitution.core_publishable, true);

console.log("Core publication constitution smoke PASS");
