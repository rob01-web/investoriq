import fs from "node:fs";

// Phase 8 visual authority requires the Screening render fixture to carry the
// same canonical parsed core artifacts used by the sovereign source-truth package.
const file = "tests/qa/generate-client-report-rent-roll-smoke.js";
const source = fs.readFileSync(file, "utf8");
const before = `      computedRentRoll: {
        total_units: 48,
        occupied_units: 46,
        vacant_units: 2,
        occupancy: 0.9583333333,
        total_in_place_annual: 1036800,
        total_annual_market: 1137600,
        annual_in_place_rent: 1036800,
        annual_market_rent: 1137600,
        avg_in_place_rent: 1800,
        avg_market_rent: 1980,
        rent_to_market_gap: 0.0961538462,
      },
    },
  },
};
const screeningHarnessResponse = {`;
const after = `      computedRentRoll: {
        total_units: 48,
        occupied_units: 46,
        vacant_units: 2,
        occupancy: 0.9583333333,
        total_in_place_annual: 1036800,
        total_annual_market: 1137600,
        annual_in_place_rent: 1036800,
        annual_market_rent: 1137600,
        avg_in_place_rent: 1800,
        avg_market_rent: 1980,
        rent_to_market_gap: 0.0961538462,
      },
      coverageArtifacts: fullRenderCoverageArtifacts.filter((artifact) =>
        ["t12_parsed", "rent_roll_parsed"].includes(String(artifact?.type || ""))
      ),
    },
  },
};
const screeningHarnessResponse = {`;
const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`PHASE8_SCREENING_VISUAL_FIXTURE_SEAM_MISMATCH:expected=1:actual=${count}`);
}
fs.writeFileSync(file, source.replace(before, after), "utf8");
console.log("phase8-upgrade-screening-visual-fixture: PATCHED");
