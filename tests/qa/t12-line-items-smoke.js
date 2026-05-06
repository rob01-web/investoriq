import assert from "node:assert/strict";
import { extractT12LineItemsFromText } from "../../api/parse/parse-doc.js";

const forestCityPdfParseText = [
  "CategoryAnnual Total% of EGINotes",
  "Gross Potential Rent$2,622,000Based on $1,517 avg/unit",
  "Vacancy Loss (4%)-$104,880London market avg",
  "Effective Gross Income (EGI)$2,517,120100%",
  "Expenses",
  "Property Taxes$310,00012.30%City of London 2025 rates",
  "Insurance$58,0002.30%Recent premium hike",
  "Utilities (Water/Hydro)$215,0008.50%Bulk metered",
  "Repairs & Maintenance$110,0004.40%$763/unit",
  "Management Fee (4%)$100,6854.00%",
  "Total Expenses$793,68531.50%",
  "Net Operating Income (NOI)$1,723,435",
].join("\n");

const result = extractT12LineItemsFromText(forestCityPdfParseText, 793685);

assert.equal(result.income_lines.length, 3);
assert.equal(result.expense_lines.length, 5);
assert.equal(result.expense_lines_found, 5);
assert.deepEqual(
  result.expense_lines.map((row) => row.amount),
  [310000, 58000, 215000, 110000, 100685]
);
assert.equal(
  result.expense_lines.reduce((sum, row) => sum + row.amount, 0),
  793685
);

const harbourstoneText = [
  "GROSS RENTAL INCOME $1,036,800",
  "other income / laundry / parking $0",
  "EFFECTIVE GROSS INCOME $1,036,800",
  "Real estate taxes $124,000",
  "Insurance $42,500",
  "Repairs and maintenance $78,000",
  "Utilities $82,000",
  "Property management $36,000",
  "Payroll / admin $44,500",
  "Garbage / misc $18,000",
  "TOTAL OPERATING EXPENSES $425,000",
  "NOI $611,800",
].join("\n");

const harbourstoneResult = extractT12LineItemsFromText(harbourstoneText, 425000);

assert.equal(harbourstoneResult.income_lines.length, 3);
assert.equal(harbourstoneResult.expense_lines.length, 7);
assert.equal(harbourstoneResult.expense_lines_found, 7);
assert.deepEqual(
  [...harbourstoneResult.expense_lines.map((row) => row.amount)].sort((a, b) => a - b),
  [18000, 36000, 42500, 44500, 78000, 82000, 124000]
);
assert.deepEqual(
  harbourstoneResult.expense_lines.map((row) => row.label),
  [
    "Property Taxes",
    "Insurance",
    "Utilities",
    "Repairs & Maintenance",
    "Management Fee",
    "Payroll / Admin",
    "Garbage / Miscellaneous",
  ]
);
assert.equal(
  harbourstoneResult.expense_lines.reduce((sum, row) => sum + row.amount, 0),
  425000
);

console.log("t12-line-items smoke PASS");
