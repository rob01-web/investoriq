import assert from "node:assert/strict";
import { parseT12FromRowMatrices, validateCoreT12Payload } from "../../api/parse/parse-doc.js";

const parseRows = (rows) => parseT12FromRowMatrices([{ rows }]);

const realisticT12 = parseRows([
  ["Line Item", "TTM Amount"],
  ["Gross Potential Rent", "1850000"],
  ["Vacancy / Credit Loss", "-55500"],
  ["Laundry Income", "18400"],
  ["Parking Income", "27000"],
  ["Effective Gross Income", "1839900"],
  ["Property Taxes", "186000"],
  ["Insurance", "62000"],
  ["Utilities", "148000"],
  ["Repairs & Maintenance", "121000"],
  ["Management Fee", "73596"],
  ["Payroll / Superintendent", "89000"],
  ["Total Operating Expenses", "679596"],
  ["Net Operating Income", "1160304"],
]);

assert.equal(realisticT12.effective_gross_income, 1839900);
assert.equal(realisticT12.total_operating_expenses, 679596);
assert.equal(realisticT12.net_operating_income, 1160304);
assert.equal(realisticT12.core_summary_rows_accepted, false);
assert.equal(validateCoreT12Payload(realisticT12, "smoke").ok, true);

const aliasSummaryT12 = parseRows([
  ["Line Item", "Amount"],
  ["Total Rental Income", "1000000"],
  ["Total Effective Income", "940000"],
  ["Expenses Total", "400000"],
  ["Operating NOI", "540000"],
]);

assert.equal(aliasSummaryT12.effective_gross_income, 940000);
assert.equal(aliasSummaryT12.total_operating_expenses, 400000);
assert.equal(aliasSummaryT12.net_operating_income, 540000);
assert.equal(aliasSummaryT12.core_summary_rows_accepted, true);
assert.equal(validateCoreT12Payload(aliasSummaryT12, "smoke").ok, true);

const badNoiT12 = parseRows([
  ["Line Item", "TTM Amount"],
  ["Effective Gross Income", "940000"],
  ["Total Operating Expenses", "400000"],
  ["Net Operating Income", "700000"],
]);

assert.equal(validateCoreT12Payload(badNoiT12, "smoke").ok, false);
assert.ok(validateCoreT12Payload(badNoiT12, "smoke").failures.length > 0);
assert.deepEqual(
  validateCoreT12Payload(
    {
      effective_gross_income: 940000,
      total_operating_expenses: 400000,
      net_operating_income: 700000,
    },
    "smoke"
  ).failures,
  ["core_t12_equation_mismatch"]
);

const randomValues = parseRows([
  ["Line Item", "Amount"],
  ["Rent", "1000"],
  ["Repairs", "200"],
]);

assert.equal(randomValues.effective_gross_income, null);
assert.equal(randomValues.total_operating_expenses, null);
assert.equal(randomValues.net_operating_income, null);
assert.equal(validateCoreT12Payload(randomValues, "smoke").ok, false);

console.log("t12-core-summary smoke PASS");
