import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const { __test__: generatorTest } = await import("../../api/generate-client-report.js");

const html = generatorTest.buildScreeningIncomeForensicsHtml({
  t12Payload: {
    effective_gross_income: 1000000,
    total_operating_expenses: 400000,
    net_operating_income: 600000,
    income_lines: [],
    expense_lines: [
      { line_item: "Taxes", amount: 120000 },
      { line_item: "Insurance", amount: 50000 },
    ],
  },
  computedRentRoll: { total_units: 48 },
  rentRollPayload: { total_units: 48 },
  formatCurrency: (value) => `$${Number(value).toLocaleString("en-US")}`,
});

assert.equal(html.includes("Top Positive Income Lines"), false);
assert.equal(html.includes("Top Expense Drivers"), true);
assert.equal(html.includes("<tbody></tbody>"), false);

console.log("empty-table-collapse smoke PASS");
