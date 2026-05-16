import assert from "node:assert/strict";
import {
  parseRentRollFromRowMatrices,
  parseT12FromRowMatrices,
  validateCoreT12Payload,
} from "../../api/parse/parse-doc.js";

const acceptedT12 = parseT12FromRowMatrices(
  [
    {
      rows: [
        ["Line Item", "TTM Amount"],
        ["Gross Rental Income", "1000000"],
        ["Other Income", "20000"],
        ["Total Operating Expenses", "400000"],
      ],
    },
  ],
  { includeDiagnostics: true }
);
assert.ok(acceptedT12.payload, "expected accepted T12 payload");
assert.equal(acceptedT12.payload.net_operating_income, 620000);
assert.equal(
  acceptedT12.diagnostics.derived_fields.includes("net_operating_income_derived_from_egi_minus_opex"),
  true
);

const rejectedT12 = parseT12FromRowMatrices(
  [
    {
      rows: [
        ["Line Item", "Amount"],
        ["Rent", "1000"],
        ["Repairs", "200"],
      ],
    },
  ],
  { includeDiagnostics: true }
);
assert.ok(rejectedT12.payload, "expected legacy T12 payload shell to remain present");
assert.equal(rejectedT12.payload.effective_gross_income, null);
assert.equal(rejectedT12.payload.total_operating_expenses, null);
assert.equal(rejectedT12.payload.net_operating_income, null);
assert.equal(rejectedT12.diagnostics.validation_reasons.includes("insufficient_t12_coverage"), true);

const percentRejectedT12 = parseT12FromRowMatrices(
  [
    {
      rows: [
        ["Line Item", "TTM Amount"],
        ["Gross Rental Income", "95%"],
        ["Total Operating Expenses", "400000"],
      ],
    },
  ],
  { includeDiagnostics: true }
);
assert.equal(percentRejectedT12.diagnostics.validation_reasons.includes("percent_column_rejected"), true);

const implausibleValueT12 = parseT12FromRowMatrices(
  [
    {
      rows: [
        ["Line Item", "TTM Amount"],
        ["Gross Rental Income", "1500000000"],
        ["Total Operating Expenses", "400000"],
      ],
    },
  ],
  { includeDiagnostics: true }
);
assert.equal(implausibleValueT12.diagnostics.validation_reasons.includes("implausible_numeric_value"), true);

const invalidCoreT12 = validateCoreT12Payload(
  {
    effective_gross_income: 940000,
    total_operating_expenses: 400000,
    net_operating_income: 700000,
  },
  "diagnostics_regression",
  { includeDiagnostics: true }
);
assert.equal(invalidCoreT12.ok, false);
assert.equal(invalidCoreT12.validation_reasons.includes("core_t12_equation_mismatch"), true);

const acceptedRentRoll = parseRentRollFromRowMatrices(
  [
    {
      rows: [
        ["Unit", "Unit Type", "Current Rent", "Status"],
        ["101", "1BR", "1200", "Occupied"],
        ["102", "1BR", "1225", "Occupied"],
        ["201", "2BR", "1450", "Occupied"],
        ["202", "2BR", "1475", "Vacant"],
      ],
    },
  ],
  { includeDiagnostics: true }
);
assert.ok(acceptedRentRoll.payload, "expected accepted rent roll payload");
assert.equal(acceptedRentRoll.diagnostics.accepted_fields.includes("units"), true);
assert.equal(acceptedRentRoll.diagnostics.accepted_fields.includes("occupancy"), true);

const rejectedRentRoll = parseRentRollFromRowMatrices(
  [
    {
      rows: [
        ["Property", "Amount"],
        ["Summary", "123"],
      ],
    },
  ],
  { includeDiagnostics: true }
);
assert.equal(rejectedRentRoll.payload, null);
assert.equal(rejectedRentRoll.diagnostics.validation_reasons.includes("rent_roll_header_not_found"), true);

console.log("t12-rent-roll diagnostics regression PASS");
