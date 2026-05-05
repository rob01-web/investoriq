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

console.log("t12-line-items smoke PASS");
